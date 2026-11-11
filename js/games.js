/* ============================================================
   games.js - round planning, the question runner, Memory Match,
   Study Cards, Sticker Book and the results screen
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U, UI = JP.UI, Store = JP.Store, K = UI.K, KW = UI.KW, esc = U.esc;
  const W = JP.WORD;

  const GAMES = {
    adventure: { icon: '🎲', name: 'Mixed Adventure', sub: 'A new mix of everything every time!' },
    words:     { icon: '🌟', name: 'Word Quest', sub: 'Pictures, sounds, spelling & more' },
    sentence:  { icon: '🧩', name: 'Sentence Builder', sub: 'Build sentences with particles' },
    particle:  { icon: '🎯', name: 'Particle Power', sub: 'は を に で … pick the right one' },
    lab:       { icon: '🧱', name: 'Past Tense Lab', sub: 'ませんでした & じゃなかったです' },
    match:     { icon: '🃏', name: 'Memory Match', sub: 'Match Japanese to pictures' },
    script:    { icon: '🔤', name: 'Script Sorter', sub: 'ひらがな or カタカナ?' },
    learn:     { icon: '📚', name: 'Study Cards', sub: 'Look, listen and learn' }
  };
  const BADGES = {
    first:   { e: '🎮', n: 'First Round', d: 'Finish your first round' },
    perfect: { e: '💯', n: 'Perfect Round', d: 'Get every question right first try' },
    streak3: { e: '🔥', n: '3-Day Streak', d: 'Play 3 days in a row' },
    st10:    { e: '🏷️', n: '10 Stickers', d: 'Collect 10 stickers' },
    st50:    { e: '🌈', n: '50 Stickers', d: 'Collect 50 stickers' },
    st100:   { e: '👑', n: '100 Stickers', d: 'Collect 100 stickers' },
    lab:     { e: '🧱', n: 'Past Tense Pro', d: 'Score 80%+ in the Past Tense Lab' },
    part:    { e: '🎯', n: 'Particle Pro', d: 'Score 80%+ in Particle Power' },
    kana:    { e: '🔤', n: 'Kana Master', d: 'Perfect Script Sorter round' },
    explore: { e: '🧭', n: 'Explorer', d: 'Play in 6 different subjects' },
    builder: { e: '🧩', n: 'Sentence Star', d: 'Score 80%+ in Sentence Builder' }
  };

  let S = null;             // current question session
  let hooks = { home: null, hub: null, again: null };

  function totalWordsWithStickers() { return JP.WORDS.length; }
  function stickerCount() { return JP.WORDS.filter(function (w) { return Store.unlocked(w.id); }).length; }

  /* ---------- environment for a round ---------- */
  function makeEnv(world) {
    return { pool: JP.wordsOf(world), level: Store.setting('level'), voice: JP.Voice.available() && !!Store.setting('voice'), world: world };
  }
  function boostOf(w) {
    const st = Store.word(w.id);
    if (!st.c && !st.w) return 0.35;          // never practised
    if (st.m < 2) return 0.22;
    if (st.m >= 4) return -0.15;
    return 0;
  }

  /* ---------- planning ---------- */
  function wordCands(world, env, only) {
    const out = [];
    env.pool.forEach(function (w) {
      JP.Q.eligibleTypes(w, env, only).forEach(function (t) {
        out.push({ key: t + '|' + w.id, group: w.id, type: t, boost: boostOf(w), build: function () { return JP.Q.makeWordQ(t, w, env); } });
      });
    });
    return out;
  }
  function wrapQ(list) { return list.map(function (c) { return { key: c.key, group: c.group, type: c.type, boost: c.boost || 0, build: function () { return c.q; } }; }); }

  function planRound(game, world) {
    const n = Store.setting('qCount');
    const env = makeEnv(world);
    let chosen;
    if (game === 'words') chosen = JP.Variety.select(wordCands(world, env), n);
    else if (game === 'script') {
      let pool = env.pool.filter(function (w) { return JP.Kana.script(w.kana) !== 'mixed' && w.kana.indexOf(' ') < 0; });
      const kat = pool.filter(function (w) { return JP.Kana.script(w.kana) === 'katakana'; }).length;
      const hira = pool.length - kat;
      const extra = [];
      if (kat < 4) JP.WORDS.filter(function (w) { return JP.Kana.script(w.kana) === 'katakana' && w.kana.indexOf(' ') < 0 && pool.indexOf(w) < 0; }).forEach(function (w) { extra.push(w); });
      if (hira < 4) JP.WORDS.filter(function (w) { return JP.Kana.script(w.kana) === 'hiragana' && pool.indexOf(w) < 0; }).forEach(function (w) { extra.push(w); });
      if (extra.length) pool = pool.concat(U.sample(extra, 30));
      env.pool = pool;
      chosen = JP.Variety.select(wordCands(world, env, ['script']), n);
    }
    else if (game === 'sentence') chosen = JP.Variety.select(wrapQ(JP.Q.sentenceCands(world, 70, env.level)), n);
    else if (game === 'particle') chosen = JP.Variety.select(wrapQ(JP.Q.particleCands(world, 60, env.level)), n);
    else if (game === 'lab') chosen = JP.Variety.select(wrapQ(JP.Q.labCands(world, 80, env.level)), n);
    else { // adventure: rotate through every kind of challenge
      chosen = JP.Variety.mix({
        words: wordCands(world, env),
        sentence: wrapQ(JP.Q.sentenceCands(world, 40, env.level)),
        particle: wrapQ(JP.Q.particleCands(world, 30, env.level)),
        lab: wrapQ(JP.Q.labCands(world, 40, env.level))
      }, n);
    }
    return { qs: chosen.map(function (c) { const q = c.build(); q.key = c.key; return q; }), env: env };
  }

  /* ---------- the runner ---------- */
  function applyWorldTheme(world) {
    const w = JP.worldById(world) || { c1: '#7c5cff', c2: '#b8a4ff', deco: ['🌸', '⭐', '🎌', '🌟', '🍙', '🐱'] };
    document.body.style.setProperty('--c1', w.c1); document.body.style.setProperty('--c2', w.c2);
    const bg = UI.$('#bg');
    if (bg) bg.innerHTML = (w.deco || []).concat(w.deco || []).map(function (e, i) {
      return '<span style="left:' + (5 + (i * 83) % 90) + '%;animation-delay:' + (-(i * 2.3)) + 's;font-size:' + (28 + (i * 13) % 34) + 'px;animation-duration:' + (14 + (i * 5) % 12) + 's">' + e + '</span>';
    }).join('');
  }

  function startSession(game, world) {
    JP.Audio.unlock();
    if (game === 'match') return startMatch(world);
    if (game === 'learn') return startLearn(world);
    const plan = planRound(game, world);
    if (!plan.qs.length) { UI.toast('Not enough words here yet!'); return; }
    S = { game: game, world: world, qs: plan.qs, env: plan.env, i: 0, points: 0, right: 0, partial: 0, combo: 0, bestCombo: 0, missed: [], missedIds: {}, stickers: [], bonus: 0, answered: false, active: true, t0: Date.now() };
    applyWorldTheme(world);
    showQuestion();
  }

  function shell() {
    const wd = JP.worldById(S.world);
    const g = GAMES[S.game];
    return '<div class="game">' +
      '<div class="hud"><button type="button" class="hud-x" data-act="quit" aria-label="Quit">✕</button>' +
      '<div class="hud-mid"><div class="hud-title">' + g.icon + ' ' + esc(g.name) + ' · ' + (wd ? wd.emoji + ' ' + esc(wd.en) : '🌈 All subjects') + '</div><div class="progress"><div class="bar" id="bar"></div></div></div>' +
      '<div class="hud-stats"><span class="stat" id="pts">⭐ 0</span><span class="stat combo" id="combo"></span></div></div>' +
      '<div class="mascot"><div class="cat" id="cat">🐱</div><div class="bubble" id="bubble"></div></div>' +
      '<div class="qhost" id="qhost"></div><div class="hintbar" id="hintbar"></div><div class="fbhost" id="fbhost"></div></div>';
  }
  function updateHud() {
    const pct = Math.round((S.i / S.qs.length) * 100);
    const bar = UI.$('#bar'); if (bar) bar.style.width = pct + '%';
    const pts = UI.$('#pts'); if (pts) pts.textContent = '⭐ ' + S.points;
    const cb = UI.$('#combo'); if (cb) { cb.textContent = S.combo >= 2 ? '🔥 ×' + S.combo : ''; }
  }
  function setBubble(html) { const b = UI.$('#bubble'); if (b) b.innerHTML = html; }
  function catAnim(cls) { const c = UI.$('#cat'); if (!c) return; c.className = 'cat ' + cls; }

  function showQuestion() {
    const q = S.qs[S.i];
    S.answered = false;
    UI.$('#app').innerHTML = shell();
    updateHud();
    setBubble((q.bonus ? '<b>Second chance!</b> ' : '') + esc(q.prompt || ''));
    catAnim('idle');
    const host = UI.$('#qhost');
    const def = JP.Q.types[q.type];
    const api = {
      level: S.env.level,
      sfx: function (n) { JP.Audio.play(n); },
      say: function (t) { JP.Voice.speak(t); },
      hint: function (msg) { const h = UI.$('#hintbar'); h.innerHTML = '💡 ' + esc(msg); h.classList.remove('show'); void h.offsetWidth; h.classList.add('show'); JP.Audio.play('almost'); catAnim('oops'); },
      done: function (res) { onDone(q, res); }
    };
    def.render(q, host, api);
    window.scrollTo(0, 0);
    if (q.autoplay) setTimeout(function () { if (S && S.qs[S.i] === q) JP.Voice.speak(q.autoplay); }, 380);
  }

  function onDone(q, res) {
    if (!S || S.answered) return;
    S.answered = true;
    const full = res.correct && !res.partial;
    let pts = 0;
    if (res.correct) {
      if (res.partial) { pts = 5; S.partial++; S.combo = 0; }
      else { S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); pts = 10 + Math.min(S.combo - 1, 5) * 2; S.right++; }
    } else { S.combo = 0; }
    S.points += pts;
    // mastery & stickers
    const gained = [];
    if (res.wid) {
      const first = Store.recordWord(res.wid, res.correct);
      if (first) { S.stickers.push(res.wid); gained.push(res.wid); }
      if (!res.correct && !S.missedIds[res.wid]) { S.missedIds[res.wid] = 1; S.missed.push(res.wid); }
    }
    // building a whole sentence correctly also earns stickers for the nouns in it
    if (full && res.words) {
      res.words.forEach(function (id) {
        const w = W[id];
        if (!w || w.kind === 'verb' || w.kind === 'time' || id === 'watashi' || id === 'kore' || id === 'sore') return;
        if (Store.recordWord(id, true)) { S.stickers.push(id); gained.push(id); }
      });
    }
    if (res.particleStat) Store.recordParticle(res.particleStat, res.correct);
    if (full && res.particles) res.particles.forEach(function (t) { Store.recordParticle(t.t, true); });
    if (!res.correct && q.w && S.bonus < 3 && (S.game === 'words' || S.game === 'adventure') && JP.Q.wordTypeIds.indexOf(q.type) >= 0) {
      const alts = JP.Q.eligibleTypes(q.w, S.env).filter(function (t) { return t !== q.type; });
      if (alts.length) {
        const t = U.pick(alts);
        const nq = JP.Q.makeWordQ(t, q.w, S.env); nq.bonus = true; nq.key = 'bonus|' + nq.key;
        S.qs.push(nq); S.bonus++;
      }
    }
    // feedback
    const c = UI.cheer(res.correct);
    const sfx = !res.correct ? 'wrong' : res.partial ? 'almost' : (S.combo >= 3 ? 'combo' : 'correct');
    JP.Audio.play(sfx, S.combo);
    catAnim(res.correct ? 'happy' : 'oops');
    if (S.combo >= 3 && full) UI.confetti(40, { x: window.innerWidth / 2, y: 140, emoji: ['⭐', '✨'] });
    const hb = UI.$('#hintbar'); if (hb) hb.classList.remove('show');
    setBubble(K(c.jp, c.ro) + ' <small>' + esc(c.en) + '</small>');
    const last = S.i + 1 >= S.qs.length;
    const fb = UI.$('#fbhost');
    fb.innerHTML = '<div class="fb ' + (res.correct ? (res.partial ? 'half' : 'ok') : 'bad') + '">' +
      '<div class="fb-head"><span class="fb-emoji">' + (res.correct ? (res.partial ? '👍' : '🎉') : '🤔') + '</span>' +
      '<div class="fb-cheer">' + (res.correct ? (res.partial ? 'Good fix!' : 'Correct!') : 'Not quite') + '</div>' + (pts ? '<span class="fb-pts">+' + pts + '</span>' : '') + '</div>' +
      '<div class="fb-body">' + (res.html || '') + '</div>' +
      (gained.length ? '<div class="sticker-new">' + gained.map(function (id) { return W[id].emoji; }).join(' ') + ' New sticker' + (gained.length > 1 ? 's' : '') + ' unlocked!</div>' : '') +
      '<button type="button" class="btn go next" data-act="next">' + (last ? 'Finish 🏁' : 'Next →') + '</button></div>';
    if (gained.length) setTimeout(function () { JP.Audio.play('sticker'); }, 500);
    updateHud();
    fb.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if (res.say && Store.setting('voice')) setTimeout(function () { JP.Voice.speak(res.say); }, 450);
    const nb = UI.$('.next', fb); if (nb) nb.focus({ preventScroll: true });
  }

  function next() {
    if (!S || !S.answered) return;
    S.i++;
    if (S.i >= S.qs.length) return finishSession();
    JP.Audio.play('whoosh');
    showQuestion();
  }

  function finishSession() {
    S.active = false;
    const total = S.qs.length;
    const acc = (S.right + S.partial * 0.5) / total;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    const xp = Math.round(S.points / 2) + stars * 5;
    const lv = Store.addXP(xp);
    Store.addStars(stars);
    Store.recordWorld(S.world, stars, Math.round(acc * 100));
    Store.touchStreak();
    const newBadges = awardBadges(acc, total);
    showResults({
      title: GAMES[S.game].name, game: S.game, world: S.world, stars: stars, acc: acc, right: S.right, partial: S.partial, total: total, points: S.points, xp: xp, levelUp: lv,
      best: S.bestCombo, stickers: S.stickers.slice(), missed: S.missed.slice(), badges: newBadges
    });
  }

  function awardBadges(acc, total) {
    const got = [];
    function give(id) { if (Store.badge(id)) got.push(id); }
    give('first');
    if (acc >= 0.999 && total >= 5 && S.partial === 0) give('perfect');
    if (Store.get().streak.count >= 3) give('streak3');
    const sc = stickerCount();
    if (sc >= 10) give('st10'); if (sc >= 50) give('st50'); if (sc >= 100) give('st100');
    if (S.game === 'lab' && acc >= 0.8) give('lab');
    if (S.game === 'particle' && acc >= 0.8) give('part');
    if (S.game === 'sentence' && acc >= 0.8) give('builder');
    if (S.game === 'script' && acc >= 0.999) give('kana');
    if (Object.keys(Store.get().worlds).filter(function (k) { return k !== 'all'; }).length >= 6) give('explore');
    return got;
  }

  /* ---------- results ---------- */
  function showResults(r) {
    applyWorldTheme(r.world);
    JP.Audio.play(r.stars >= 1 ? 'win' : 'almost');
    if (r.stars >= 1) setTimeout(function () { UI.confetti(r.stars >= 3 ? 220 : 120, { emoji: ['⭐', '🌸', '🎌'] }); }, 250);
    if (r.levelUp) setTimeout(function () { JP.Audio.play('levelup'); UI.toast('🆙 Level ' + r.levelUp + '! すごい！', 2800); }, 1400);
    const msg = r.stars >= 3 ? ['すばらしい！', 'subarashii', 'Wonderful!'] : r.stars === 2 ? ['すごい！', 'sugoi', 'Great job!'] : r.stars === 1 ? ['よかった！', 'yokatta', 'Nice work!'] : ['だいじょうぶ！', 'daijōbu', "It's okay — try again!"];
    const wd = JP.worldById(r.world);
    UI.$('#app').innerHTML = '<div class="results">' +
      '<div class="res-card"><div class="res-title">' + (GAMES[r.game] ? GAMES[r.game].icon : '🏁') + ' ' + esc(r.title) + ' · ' + (wd ? wd.emoji + ' ' + esc(wd.en) : '🌈 All subjects') + '</div>' +
      '<div class="res-stars">' + [1, 2, 3].map(function (i) { return '<span class="rstar ' + (i <= r.stars ? 'on' : '') + '" style="animation-delay:' + (i * 0.25) + 's">⭐</span>'; }).join('') + '</div>' +
      '<div class="res-msg">' + K(msg[0], msg[1], 'big') + '<small>' + msg[2] + '</small></div>' +
      '<div class="res-stats"><div><b>' + r.right + (r.partial ? ' + ' + r.partial + '½' : '') + '/' + r.total + '</b><span>correct</span></div><div><b>⭐ ' + r.points + '</b><span>points</span></div><div><b>+' + r.xp + '</b><span>XP</span></div><div><b>🔥 ' + r.best + '</b><span>best combo</span></div></div>' +
      (r.extra ? '<div class="res-extra">' + r.extra + '</div>' : '') +
      (r.stickers && r.stickers.length ? '<div class="res-sec"><h3>🏷️ New stickers!</h3><div class="sticker-row">' + r.stickers.map(function (id) { return '<span class="sticker pop" title="' + esc(W[id].en) + '">' + W[id].emoji + '</span>'; }).join('') + '</div></div>' : '') +
      (r.badges && r.badges.length ? '<div class="res-sec"><h3>🏅 New badge!</h3>' + r.badges.map(function (b) { return '<div class="badge-new">' + BADGES[b].e + ' <b>' + BADGES[b].n + '</b> – ' + BADGES[b].d + '</div>'; }).join('') + '</div>' : '') +
      (r.missed && r.missed.length ? '<div class="res-sec"><h3>💪 Let’s practise these</h3><div class="missed">' + r.missed.map(function (id) { const w = W[id]; return '<div class="mw"><span class="mw-e">' + w.emoji + '</span>' + KW(w) + '<span class="mw-en">' + esc(w.en) + '</span>' + UI.speakBtn(w.kana) + '</div>'; }).join('') + '</div></div>' : '') +
      '<div class="res-actions"><button type="button" class="btn go" data-act="again">🔁 Play again — brand new questions!</button>' +
      '<button type="button" class="btn ghost" data-act="hub">🎮 Choose another game</button><button type="button" class="btn ghost" data-act="home">🏠 Home</button></div></div></div>';
    window.scrollTo(0, 0);
    S = S || {}; S.lastGame = r.game; S.lastWorld = r.world;
  }

  /* =========================================================
     MEMORY MATCH
     ========================================================= */
  function startMatch(world) {
    const level = Store.setting('level');
    const pairs = level <= 1 ? 4 : level === 2 ? 6 : 8;
    let pool = JP.wordsOf(world).filter(function (w) { return w.kana.indexOf(' ') < 0 && w.kana.length <= 8; });
    if (pool.length < pairs) pool = JP.WORDS.filter(function (w) { return w.kana.indexOf(' ') < 0; });
    const chosen = JP.Variety.select(pool.map(function (w) { return { key: 'match|' + w.id, group: w.id, type: 'match', boost: boostOf(w), w: w }; }), pairs);
    const words = chosen.map(function (c) { return c.w; });
    let cards = [];
    words.forEach(function (w) {
      cards.push({ id: w.id + 'a', w: w, side: 'kana' });
      cards.push({ id: w.id + 'b', w: w, side: 'pic' });
    });
    cards = U.shuffle(cards);
    S = { game: 'match', world: world, active: true, env: makeEnv(world), qs: [], i: 0 };
    applyWorldTheme(world);
    const wd = JP.worldById(world);
    const cols = pairs <= 4 ? 4 : (pairs <= 6 ? 4 : 4);
    UI.$('#app').innerHTML = '<div class="game match"><div class="hud"><button type="button" class="hud-x" data-act="quit" aria-label="Quit">✕</button>' +
      '<div class="hud-mid"><div class="hud-title">🃏 Memory Match · ' + (wd ? wd.emoji + ' ' + esc(wd.en) : '🌈 All subjects') + '</div><div class="progress"><div class="bar" id="bar"></div></div></div>' +
      '<div class="hud-stats"><span class="stat" id="moves">👆 0</span></div></div>' +
      '<div class="mascot"><div class="cat" id="cat">🐱</div><div class="bubble" id="bubble">Find the Japanese word and its picture!</div></div>' +
      '<div class="mgrid cols-' + cols + '" id="mgrid">' + cards.map(function (c, i) {
        const front = c.side === 'kana' ? '<div class="mc-kana">' + KW(c.w) + '</div>' : (c.w.pic || c.w.emoji ? '<div class="mc-pic">' + c.w.emoji + '</div>' + (c.w.pic ? '' : '<div class="mc-en">' + esc(c.w.en) + '</div>') : '<div class="mc-en">' + esc(c.w.en) + '</div>');
        return '<button type="button" class="mcard" data-i="' + i + '"><span class="mc-inner"><span class="mc-back">🎌</span><span class="mc-front">' + front + '</span></span></button>';
      }).join('') + '</div></div>';
    let first = null, lock = false, matched = 0, moves = 0;
    const els = UI.$$('.mcard');
    UI.$('#mgrid').addEventListener('click', function (e) {
      const el = e.target.closest('.mcard'); if (!el || lock || el.classList.contains('flipped') || el.classList.contains('done')) return;
      const c = cards[+el.dataset.i];
      el.classList.add('flipped'); JP.Audio.play('flip');
      if (c.side === 'kana') JP.Voice.speak(c.w.kana);
      if (!first) { first = { el: el, c: c }; return; }
      moves++; UI.$('#moves').textContent = '👆 ' + moves;
      const a = first; first = null;
      if (a.c.w.id === c.w.id) {
        matched++;
        setTimeout(function () {
          a.el.classList.add('done'); el.classList.add('done'); JP.Audio.play('match');
          const r = el.getBoundingClientRect(); UI.confetti(18, { x: r.left + r.width / 2, y: r.top + r.height / 2, emoji: ['✨'] });
          JP.Voice.speak(c.w.kana);
          Store.recordWord(c.w.id, true) && S.stickers.push(c.w.id);
          UI.$('#bar').style.width = Math.round(matched / words.length * 100) + '%';
          if (matched === words.length) setTimeout(finishMatch, 900);
        }, 350);
      } else {
        lock = true; JP.Audio.play('almost');
        setTimeout(function () { a.el.classList.remove('flipped'); el.classList.remove('flipped'); lock = false; }, 950);
      }
    });
    S.stickers = [];
    function finishMatch() {
      S.active = false;
      const ratio = moves / words.length;
      const stars = ratio <= 1.6 ? 3 : ratio <= 2.4 ? 2 : 1;
      const xp = 10 + words.length * 4 + stars * 5;
      const lv = Store.addXP(xp); Store.addStars(stars); Store.recordWorld(world, stars, Math.round(100 / Math.max(1, ratio)));
      Store.touchStreak();
      const got = []; if (Store.badge('first')) got.push('first'); if (Store.get().streak.count >= 3 && Store.badge('streak3')) got.push('streak3');
      const sc = stickerCount(); if (sc >= 10 && Store.badge('st10')) got.push('st10'); if (sc >= 50 && Store.badge('st50')) got.push('st50');
      showResults({ title: 'Memory Match', game: 'match', world: world, stars: stars, acc: 1, right: words.length, partial: 0, total: words.length, points: words.length * 10, xp: xp, levelUp: lv, best: 0, stickers: S.stickers.slice(), missed: [], badges: got, extra: '👆 You found all ' + words.length + ' pairs in <b>' + moves + '</b> tries!' });
    }
  }

  /* =========================================================
     STUDY CARDS
     ========================================================= */
  function startLearn(world) {
    const deck = JP.wordsOf(world);
    if (!deck.length) return;
    let i = 0;
    S = { game: 'learn', world: world, active: false, qs: [], i: 0 };
    applyWorldTheme(world);
    const wd = JP.worldById(world);
    function card() {
      const w = deck[i];
      Store.seenWord(w.id);
      let example = '';
      try {
        if (w.kind === 'verb') {
          const a = JP.Sent.exampleFor(w.vkey, 'pres'), b = JP.Sent.exampleFor(w.vkey, 'pastNeg');
          example = [a, b].filter(Boolean).map(function (s) { return '<div class="ex-sent">' + UI.sentenceHTML(s) + '<div class="en-sm">' + esc(s.en) + '</div></div>'; }).join('');
          example = '<div class="ex-title">How it is used (with particles!)</div>' + example;
        } else if (w.kind !== 'time' || true) {
          const s = JP.Sent.generate('w:' + w.id, { forms: ['pres', 'past', 'pastNeg'] });
          if (s && s.used.indexOf(w.id) >= 0) example = '<div class="ex-title">In a sentence</div><div class="ex-sent">' + UI.sentenceHTML(s) + '<div class="en-sm">' + esc(s.en) + '</div></div>';
        }
      } catch (e) { example = ''; }
      UI.$('#app').innerHTML = '<div class="game learn"><div class="hud"><button type="button" class="hud-x" data-act="hub" aria-label="Back">✕</button>' +
        '<div class="hud-mid"><div class="hud-title">📚 Study Cards · ' + (wd ? wd.emoji + ' ' + esc(wd.en) : '🌈 All subjects') + '</div><div class="progress"><div class="bar" style="width:' + Math.round((i + 1) / deck.length * 100) + '%"></div></div></div>' +
        '<div class="hud-stats"><span class="stat">' + (i + 1) + ' / ' + deck.length + '</span></div></div>' +
        '<div class="studycard' + (w.slide ? ' slide' : '') + '">' + (w.slide ? '<span class="slidebadge">⭐ From your class</span>' : '') +
        '<div class="sc-emoji">' + w.emoji + '</div><div class="sc-kana">' + KW(w) + '</div><div class="sc-en">' + esc(w.en) + '</div>' +
        '<div class="sc-hear">' + UI.speakBtn(w.kana, 'huge') + '</div>' +
        (w.kanji ? '<div class="note">📖 In your slides: <span class="kanji">' + esc(w.kanji) + '</span></div>' : '') + (w.note ? '<div class="note">💡 ' + esc(w.note) + '</div>' : '') + example + '</div>' +
        '<div class="sc-nav"><button type="button" class="btn ghost" data-lnav="-1"' + (i === 0 ? ' disabled' : '') + '>◀ Back</button>' +
        (i === deck.length - 1 ? '<button type="button" class="btn go" data-act="quizme">🌟 Quiz me!</button>' : '<button type="button" class="btn go" data-lnav="1">Next ▶</button>') + '</div></div>';
      window.scrollTo(0, 0);
      setTimeout(function () { if (S && S.game === 'learn' && deck[i] === w) JP.Voice.speak(w.kana); }, 250);
    }
    S.lnav = function (d) { const n = i + d; if (n < 0 || n >= deck.length) return; i = n; JP.Audio.play('tap'); card(); };
    card();
  }

  /* =========================================================
     STICKER BOOK
     ========================================================= */
  function stickerBook() {
    applyWorldTheme('slides');
    const total = JP.WORDS.length, got = stickerCount();
    const worlds = JP.WORLDS;
    let html = '<div class="book"><div class="book-head"><button type="button" class="hud-x" data-act="home" aria-label="Back">←</button><h2>🏷️ Sticker Book</h2><div class="book-count">' + got + ' / ' + total + '</div></div>' +
      '<p class="book-sub">Answer a word correctly to unlock its sticker. <b class="goldtxt">Gold</b> stickers mean you have mastered the word!</p>';
    worlds.forEach(function (wd) {
      const list = JP.wordsOf(wd.id);
      const g = list.filter(function (w) { return Store.unlocked(w.id); }).length;
      html += '<div class="book-world"><h3>' + wd.emoji + ' ' + esc(wd.en) + ' <small>' + wd.jp + ' · ' + g + '/' + list.length + '</small></h3><div class="sticker-grid">' +
        list.map(function (w) {
          const u = Store.unlocked(w.id), m = Store.mastered(w.id);
          return '<button type="button" class="sticker ' + (u ? 'on' : 'off') + (m ? ' gold' : '') + '" ' + (u ? 'data-say="' + esc(w.kana) + '"' : '') + ' title="' + (u ? esc(w.en) : 'Locked') + '">' +
            '<span class="st-e">' + (u ? w.emoji : '❔') + '</span>' + (u ? '<span class="st-t">' + KW(w) + '</span>' : '<span class="st-t lock">?</span>') + '</button>';
        }).join('') + '</div></div>';
    });
    html += '</div>';
    UI.$('#app').innerHTML = html;
    window.scrollTo(0, 0);
  }

  /* ---------- global event handling for game screens ---------- */
  document.addEventListener('click', function (e) {
    const sp = e.target.closest('.speak');
    if (sp) { e.stopPropagation(); JP.Audio.unlock(); JP.Audio.play('pop'); JP.Voice.speak(sp.dataset.say); return; }
    const st = e.target.closest('.sticker[data-say]');
    if (st) { JP.Audio.play('sticker'); JP.Voice.speak(st.dataset.say); return; }
    const ln = e.target.closest('[data-lnav]');
    if (ln && S && S.lnav) { S.lnav(+ln.dataset.lnav); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'next') next();
    else if (act === 'quit') {
      const leave = function () { if (S) S.active = false; JP.Voice.stop(); hooks.hub && hooks.hub(S ? S.world : 'all'); };
      if (S && S.active) UI.ask('Leave this round?', 'Leave', leave); else leave();
    }
    else if (act === 'again') { hooks.again && hooks.again(S ? S.lastGame : 'adventure', S ? S.lastWorld : 'all'); }
    else if (act === 'hub') { hooks.hub && hooks.hub(S ? (S.lastWorld || S.world) : 'all'); }
    else if (act === 'home') { hooks.home && hooks.home(); }
    else if (act === 'quizme') { startSession('words', S ? S.world : 'all'); }
  });
  document.addEventListener('keydown', function (e) {
    if (!S || !S.active || document.getElementById('overlay').classList.contains('open')) return;
    const host = UI.$('#qhost');
    if (e.key === 'Enter') {
      if (S.answered) { next(); e.preventDefault(); }
      else if (host && host._keys) host._keys('enter');
    } else if (/^[1-9]$/.test(e.key) && !S.answered && host && host._keys) host._keys(+e.key);
  });

  JP.Game = {
    GAMES: GAMES, BADGES: BADGES, start: startSession, stickerBook: stickerBook, stickerCount: stickerCount, applyWorldTheme: applyWorldTheme,
    setHooks: function (h) { hooks = Object.assign(hooks, h); },
    // used by the test/screenshot scripts: show one specific question
    debugShow: function (q) { if (S) { S.qs = [q]; S.i = 0; showQuestion(); } },
    current: function () { return S; }
  };
})(globalThis.JP = globalThis.JP || {});
