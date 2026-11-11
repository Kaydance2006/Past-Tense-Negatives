/* ============================================================
   store.js - saved progress (localStorage) + the VARIETY ENGINE
   that makes sure a new game never repeats the last question set.
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U;
  const KEY = 'nihongo-quest.v1';
  const RECENT_MAX = 900;   // remembered question keys
  const SIGS_MAX = 40;      // remembered whole-round signatures

  const DEFAULTS = function () {
    return {
      v: 1, name: '', avatar: '🦊',
      settings: { romaji: true, sfx: true, music: true, voice: true, rate: 0.85, qCount: 10, level: 2, motion: true },
      xp: 0, stars: 0, sessions: 0, streak: { last: '', count: 0 },
      words: {}, particles: {}, worlds: {}, badges: [], best: {},
      hist: { recent: [], sigs: [], last: [] }
    };
  };

  let data = DEFAULTS();
  let memoryOnly = false;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw);
        const d = DEFAULTS();
        data = Object.assign(d, o);
        data.settings = Object.assign(d.settings, o.settings || {});
        data.hist = Object.assign(d.hist, o.hist || {});
        data.streak = Object.assign(d.streak, o.streak || {});
      }
    } catch (e) { memoryOnly = true; }
  }
  function save() {
    if (memoryOnly) return;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { memoryOnly = true; }
  }
  load();

  function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dayDiff(a, b) {
    try {
      const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
      return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
    } catch (e) { return 99; }
  }

  const Store = {
    get: function () { return data; },
    save: save,
    reset: function () { data = DEFAULTS(); save(); },
    setting: function (k) { return data.settings[k]; },
    set: function (k, v) { data.settings[k] = v; save(); },

    touchStreak: function () {
      const t = today();
      if (data.streak.last === t) return data.streak.count;
      if (data.streak.last && dayDiff(data.streak.last, t) === 1) data.streak.count++;
      else data.streak.count = 1;
      data.streak.last = t; save();
      return data.streak.count;
    },

    level: function () { return Math.floor(data.xp / 150) + 1; },
    addXP: function (n) {
      const before = Store.level();
      data.xp += n; save();
      return Store.level() > before ? Store.level() : 0;   // returns new level if levelled up
    },
    addStars: function (n) { data.stars += n; save(); },

    /* ----- per word mastery ----- */
    word: function (id) { return data.words[id] || { c: 0, w: 0, m: 0, last: 0 }; },
    recordWord: function (id, correct) {
      const s = data.words[id] || (data.words[id] = { c: 0, w: 0, m: 0, last: 0 });
      let first = false;
      if (correct) { if (s.c === 0) first = true; s.c++; s.m = Math.min(5, s.m + 1); }
      else { s.w++; s.m = Math.max(0, s.m - 1); }
      s.last = Date.now(); save();
      return first;
    },
    seenWord: function (id) { const s = data.words[id] || (data.words[id] = { c: 0, w: 0, m: 0, last: 0, seen: 0 }); s.seen = (s.seen || 0) + 1; save(); },
    unlocked: function (id) { return !!(data.words[id] && data.words[id].c > 0); },
    mastered: function (id) { return !!(data.words[id] && data.words[id].m >= 3); },
    countUnlocked: function (ids) { return ids.filter(Store.unlocked).length; },

    recordParticle: function (p, correct) {
      const s = data.particles[p] || (data.particles[p] = { c: 0, w: 0 });
      if (correct) s.c++; else s.w++;
      save();
    },
    particleWeight: function (p) {          // practise weaker / less-seen particles more
      const s = data.particles[p] || { c: 0, w: 0 };
      return 1 + s.w * 1.5 + Math.max(0, 4 - s.c) * 0.5;
    },

    worldStat: function (id) { return data.worlds[id] || { plays: 0, stars: 0, best: 0 }; },
    recordWorld: function (id, stars, pct) {
      const s = data.worlds[id] || (data.worlds[id] = { plays: 0, stars: 0, best: 0 });
      s.plays++; s.stars += stars; s.best = Math.max(s.best, pct); save();
    },
    badge: function (id) {
      if (data.badges.indexOf(id) >= 0) return false;
      data.badges.push(id); save(); return true;
    },
    hasBadge: function (id) { return data.badges.indexOf(id) >= 0; },

    /* ----- history used by the variety engine ----- */
    novelty: function (key) {
      const r = data.hist.recent;
      const i = r.lastIndexOf(key);
      if (i < 0) return 1;
      const age = (r.length - 1 - i) / Math.max(1, RECENT_MAX);     // 0 = just seen
      return 0.05 + Math.min(0.6, age * 3);
    },
    inLast: function (key) { return data.hist.last.indexOf(key) >= 0; },
    sigSeen: function (sig) { return data.hist.sigs.indexOf(sig) >= 0; },
    commitRound: function (keys) {
      const h = data.hist;
      keys.forEach(function (k) { h.recent.push(k); });
      if (h.recent.length > RECENT_MAX) h.recent.splice(0, h.recent.length - RECENT_MAX);
      h.last = keys.slice();
      h.sigs.push(sigOf(keys));
      if (h.sigs.length > SIGS_MAX) h.sigs.shift();
      data.sessions++;
      save();
    },
    isMemoryOnly: function () { return memoryOnly; }
  };

  function sigOf(keys) { return keys.slice().sort().join('~'); }

  /* ============================================================
     VARIETY ENGINE
     cands: [{ key, group, type, boost }]
       key   – unique id of the exact question (what we avoid repeating)
       group – the word/topic it teaches; one per round where possible
   ============================================================ */
  function score(c, jitter) {
    let s = Store.novelty(c.key) * 2.0 + U.rand() * jitter + (c.boost || 0);
    if (Store.inLast(c.key)) s -= 3;           // never straight after itself
    return s;
  }
  function spreadTypes(list) {
    // avoid the same question type 3 times in a row (best effort)
    const a = list.slice();
    for (let i = 2; i < a.length; i++) {
      if (a[i].type === a[i - 1].type && a[i].type === a[i - 2].type) {
        for (let j = i + 1; j < a.length; j++) {
          if (a[j].type !== a[i].type) { const t = a[i]; a[i] = a[j]; a[j] = t; break; }
        }
      }
    }
    return a;
  }

  function pickOnce(cands, n, jitter, order) {
    const ranked = cands.map(function (c) { return { c: c, s: score(c, jitter) }; }).sort(function (a, b) { return b.s - a.s; });
    const out = [], groups = {}, keys = {};
    // first pass: one per group
    ranked.forEach(function (r) {
      if (out.length >= n) return;
      if (keys[r.c.key]) return;
      if (r.c.group && groups[r.c.group]) return;
      out.push(r.c); keys[r.c.key] = 1; if (r.c.group) groups[r.c.group] = 1;
    });
    // second pass: relax the group rule if the pool is small
    ranked.forEach(function (r) {
      if (out.length >= n) return;
      if (keys[r.c.key]) return;
      out.push(r.c); keys[r.c.key] = 1;
    });
    return U.shuffle(out);
  }

  const Variety = {
    /* choose n questions from a single pool */
    select: function (cands, n) {
      let best = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const pick = pickOnce(cands, n, 0.6 + attempt * 0.5);
        best = pick;
        if (!Store.sigSeen(sigOf(pick.map(function (c) { return c.key; })))) break;   // a brand-new set
      }
      best = spreadTypes(best);
      Store.commitRound(best.map(function (c) { return c.key; }));
      return best;
    },
    /* choose from several families in rotation, e.g. words, sentences, particles… */
    mix: function (families, n) {
      const names = Object.keys(families).filter(function (k) { return families[k].length; });
      let result = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const jitter = 0.6 + attempt * 0.5;
        const used = {}, groups = {}, out = [];
        const order = U.shuffle(names);
        for (let i = 0; out.length < n && i < n * 3; i++) {
          const fam = order[i % order.length];
          const pool = families[fam].filter(function (c) { return !used[c.key] && !(c.group && groups[c.group]); });
          if (!pool.length) continue;
          const ranked = pool.map(function (c) { return { c: c, s: score(c, jitter) }; }).sort(function (a, b) { return b.s - a.s; });
          const top = ranked[0].c;
          used[top.key] = 1; if (top.group) groups[top.group] = 1; out.push(top);
        }
        result = out;
        if (!Store.sigSeen(sigOf(out.map(function (c) { return c.key; })))) break;
      }
      Store.commitRound(result.map(function (c) { return c.key; }));
      return result;
    },
    sig: sigOf
  };

  JP.Store = Store;
  JP.Variety = Variety;
})(globalThis.JP = globalThis.JP || {});
