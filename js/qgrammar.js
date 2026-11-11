/* ============================================================
   qgrammar.js - sentence building, particles and the
   Past Tense Lab (from the class guide: です family / ます family)
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U, UI = JP.UI, K = UI.K, KT = UI.KT, esc = U.esc;
  const W = JP.WORD, V = JP.VERBS, Sent = JP.Sent;
  JP.Q = JP.Q || { types: {} };
  const TYPES = JP.Q.types;
  const FORMS = JP.FORMS, ENDINGS = JP.ENDINGS, ENDING_RO = JP.ENDING_RO, FORM_INFO = JP.FORM_INFO;

  /* ---------- shared bits ---------- */
  const FAM_LABEL = { act: 'ACTION word (ます family)', thing: 'THING word (です family)' };
  const FAM_ICON = { act: '🟠', thing: '🟢' };
  function endK(ending, cls) { return K(ending, ENDING_RO[ending] || JP.Kana.romaji(ending), cls || 'end'); }

  /* what the ending means - straight from the class guide */
  function endingNote(family, form) {
    const e = ENDINGS[family][form];
    const fam = FAM_ICON[family] + ' ' + FAM_LABEL[family];
    let how = '';
    if (family === 'act') {
      how = { pres: 'Now + Yes: the starting word.', presNeg: 'Now + No: change <b>ます → ません</b>.', past: 'Before + Yes: change <b>ます → ました</b>.', pastNeg: 'Before + No needs <b>both bricks</b>: <b>ません</b> (“no”) then <b>でした</b> (“before”).' }[form];
    } else {
      how = { pres: 'Now + Yes: the starting word.', presNeg: 'Now + No: swap <b>です → じゃないです</b>.', past: 'Before + Yes: change <b>です → でした</b>.', pastNeg: 'Before + No: <b>ない → なかった</b> (“no” dressed up as “before”), then <b>です</b> goes back on the end.' }[form];
    }
    return '<div class="note ending-note">' + fam + '<br>' + endK(e, 'end inline') + ' = <b>' + FORM_INFO[form].label + '</b> · ' + how + '</div>';
  }

  /* the 4-row ladder (Now/Before × Yes/No) for one word */
  function ladderHTML(item, hiForm) {
    const rows = FORMS.map(function (f) {
      const hi = f === hiForm;
      return '<div class="lrow' + (hi ? ' hi' : '') + (f === 'pastNeg' ? ' homework' : '') + '"><span class="lwhen">' + FORM_INFO[f].label + '</span>' +
        '<span class="lword">' + K(item.stem, JP.Kana.romaji(item.stem)) + endK(ENDINGS[item.family][f], 'end') + '</span><span class="len">' + esc(labEnglish(item, f)) + '</span></div>';
    }).join('');
    return '<div class="ladder ' + item.family + '">' + rows + '</div>';
  }

  /* ---------- sentence tile helpers ---------- */
  function shuffleUntilDifferent(arr, isSame) {
    let a = U.shuffle(arr), t = 0;
    while (isSame(a) && t++ < 8) a = U.shuffle(arr);
    return a;
  }
  function tileLegend() {
    const items = [['time', 'When'], ['subj', 'Who は'], ['place', 'Where で'], ['obj', 'What を'], ['dest', 'Where to に'], ['verb', 'Action (last!)']];
    return '<div class="legend">' + items.map(function (i) { return '<span class="lg" style="--pc:' + UI.ROLE_COLOR[i[0]] + '">' + i[1] + '</span>'; }).join('') + '</div>';
  }
  function particleWhy(t, s) {
    // t = particle token; its unit's first token is the word it follows
    const u = s.units[t.unit];
    const word = u.tokens[0].t;
    const kind = t.of;
    const vtxt = s.units[s.verbUnit].tokens[0].t + (s.family === 'act' ? 'ます' : 'です');
    const p = JP.PARTICLES[t.t];
    let line = '';
    if (kind === 'subj') line = 'It marks the <b>topic</b>: who or what the sentence is about → <span class="ex">' + esc(word) + ' は …</span>';
    else if (kind === 'obj') line = 'It marks <b>the thing the action happens to</b> → <span class="ex">' + esc(word) + ' を ' + esc(vtxt) + '</span>';
    else if (kind === 'place') line = 'It shows <b>where the action happens</b> → <span class="ex">' + esc(word) + ' で …</span>';
    else if (kind === 'dest') line = 'It shows <b>where you are going</b> → <span class="ex">' + esc(word) + ' ' + esc(t.t) + ' いきます</span>' + (t.t === 'へ' ? ' (へ is written “he” but said “e”!)' : ' (に and へ both work with いきます)');
    else if (kind === 'ride') line = 'It shows <b>what you get on</b> → <span class="ex">' + esc(word) + ' に のります</span>';
    else if (kind === 'meet') line = 'It shows <b>who you meet</b> → <span class="ex">' + esc(word) + ' に あいます</span>';
    else if (kind === 'recip') line = 'It shows <b>who receives it</b> → <span class="ex">' + esc(word) + ' に …</span>';
    else if (kind === 'with') line = 'It means <b>“with”</b> → <span class="ex">' + esc(word) + ' と …</span>';
    else if (kind === 'own') line = 'It shows <b>who it belongs to</b> → <span class="ex">' + esc(word) + ' の …</span> (“' + esc(word) + '’s …”)';
    else if (kind === 'ga') line = 'It marks <b>the thing you like or are good at</b> → <span class="ex">' + esc(word) + ' が すき / じょうず</span>';
    else line = esc(p.says);
    return '<div class="note why-p" style="--pc:' + p.color + '"><b>' + esc(t.t) + '</b> (' + p.ro + ') · ' + line + '</div>';
  }
  function sentenceExplain(s, extra) {
    return '<div class="reveal-sent">' + UI.sentenceHTML(s) + '</div><div class="en-big">' + esc(s.en) + '</div>' + UI.speakBtn(s.kana) + (extra || '') + endingNote(s.family, s.form);
  }

  /* =========================================================
     SENTENCE BUILDER
     ========================================================= */
  TYPES.sentence = {
    id: 'sentence', label: 'Sentence Builder',
    render: function (q, host, api) {
      const s = q.sent;
      const lvl = api.level;
      const hints = lvl <= 1;
      const dis = Sent.distractors(s, lvl <= 1 ? 0 : (lvl === 2 ? 2 : 3));
      const all = s.tokens.concat(dis);
      const bank = shuffleUntilDifferent(all, function (a) { return a.length > 1 && a.every(function (t, i) { return s.tokens[i] && t.id === s.tokens[i].id; }); });
      let ans = [], attempts = 0, over = false;
      host.innerHTML = '<div class="prompt-card sent-card"><div class="scene">' + s.emojis.map(function (e) { return '<span>' + e + '</span>'; }).join('') + '</div>' +
        '<div class="en-big">“' + esc(s.en) + '”</div><div class="enline">Build it in Japanese!</div></div>' +
        (hints ? tileLegend() : '') +
        '<div class="ansline" id="ans"></div><div class="tilebank ' + (hints ? 'hints' : 'nohints') + '" id="tbank"></div>' +
        '<div class="actions"><button type="button" class="btn ghost" id="sb-clear">↺ Clear</button><button type="button" class="btn go" id="sb-check" disabled>Check ✓</button></div>';
      const ansEl = UI.$('#ans', host), bankEl = UI.$('#tbank', host), checkB = UI.$('#sb-check', host);
      function tcls() { return hints ? '' : 'plain'; }
      function draw(flags) {
        ansEl.innerHTML = (ans.length ? ans.map(function (t) { return UI.tile(t, { cls: 'placed ' + tcls() + (flags && flags[t.id] ? ' bad' : '') }); }).join('') : '<span class="ans-empty">Tap the pieces below to build the sentence</span>') + '<span class="maru">。</span>';
        bankEl.innerHTML = bank.map(function (t) {
          const used = ans.indexOf(t) >= 0;
          return used ? '<span class="tile ghost ' + tcls() + '"><span class="ro">' + esc(t.ro) + '</span><span class="k">' + esc(t.t) + '</span></span>' : UI.tile(t, { cls: tcls() });
        }).join('');
        checkB.disabled = !ans.length || over;
      }
      draw();
      function byId(id) { return bank.filter(function (t) { return String(t.id) === String(id); })[0]; }
      bankEl.addEventListener('click', function (e) {
        const b = e.target.closest('button.tile'); if (!b || over) return;
        const t = byId(b.dataset.tid); if (!t || ans.indexOf(t) >= 0) return;
        ans.push(t); api.sfx('place'); draw();
      });
      ansEl.addEventListener('click', function (e) {
        const b = e.target.closest('button.tile'); if (!b || over) return;
        const t = byId(b.dataset.tid); const i = ans.indexOf(t); if (i < 0) return;
        ans.splice(i, 1); api.sfx('remove'); draw();
      });
      UI.$('#sb-clear', host).addEventListener('click', function () { if (over) return; ans = []; api.sfx('remove'); draw(); });
      checkB.addEventListener('click', function () {
        if (over) return;
        if (Sent.validate(ans, s)) {
          over = true; draw();
          api.done({ correct: true, partial: attempts > 0, html: sentenceExplain(s), say: s.kana, particles: s.particles, words: s.used });
          return;
        }
        attempts++;
        let msg;
        if (ans.some(function (t) { return t.distractor; })) msg = "One of your pieces doesn't belong. Check the particles and the ending!";
        else if (ans.length < s.tokens.length) msg = 'You are missing a piece.';
        else if (ans[ans.length - 1].role !== 'end') msg = 'In Japanese the action goes at the END of the sentence!';
        else msg = 'So close! Keep each word with its particle (like わたし は) and put the action last.';
        if (attempts >= 2) {
          over = true; draw();
          api.done({ correct: false, html: '<div class="note">Here is the sentence:</div>' + sentenceExplain(s), say: s.kana, particles: s.particles });
          return;
        }
        const bad = {};
        ans.forEach(function (t) { if (t.distractor) bad[t.id] = 1; });
        draw(bad); api.hint(msg);
      });
      host._keys = function (k) { if (k === 'enter' && !checkB.disabled) checkB.click(); };
    }
  };

  /* =========================================================
     PARTICLE POWER
     ========================================================= */
  TYPES.particle = {
    id: 'particle', label: 'Particle Power',
    render: function (q, host, api) {
      const s = q.sent, target = q.target;
      const sentHTML = '<span class="sent">' + s.units.map(function (u) {
        return '<span class="unit">' + u.tokens.map(function (t) {
          if (t.id === target.id) return '<span class="tile blank"><span class="ro">?</span><span class="k">？</span></span>';
          return UI.tile(t, { static: true, cls: 'plain' });
        }).join('') + '</span>';
      }).join('') + '<span class="maru">。</span></span>';
      mcqParticle(q, host, api, {
        prompt: '<div class="prompt-card sent-card"><div class="scene">' + s.emojis.map(function (e) { return '<span>' + e + '</span>'; }).join('') + '</div>' +
          '<div class="sentline">' + sentHTML + '</div><div class="en-big">“' + esc(s.en) + '”</div></div>'
      });
    }
  };
  function mcqParticle(q, host, api, o) {
    host.innerHTML = o.prompt + '<div class="opts cols-' + Math.min(4, q.opts.length) + ' particles">' +
      q.opts.map(function (op, i) {
        const p = JP.PARTICLES[op.p];
        return '<button type="button" class="opt popt" data-i="' + i + '" style="--pc:' + p.color + '"><span class="optnum">' + (i + 1) + '</span>' +
          K(op.p, p.ro, 'pk') + (api.level <= 1 ? '<span class="pname">' + esc(p.name) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    const btns = UI.$$('.opt', host);
    let answered = false;
    function pick(i) {
      if (answered) return; answered = true;
      btns.forEach(function (b, j) { b.disabled = true; if (q.opts[j].ok) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); else b.classList.add('dim'); });
      const blank = UI.$('.tile.blank', host);
      if (blank) { blank.classList.add(q.opts[i].ok ? 'filled-ok' : 'filled-bad'); blank.innerHTML = '<span class="ro">' + esc(JP.PARTICLES[q.target.p].ro) + '</span><span class="k">' + esc(q.target.t) + '</span>'; blank.style.setProperty('--pc', JP.PARTICLES[q.target.p].color); }
      api.done({ correct: !!q.opts[i].ok, html: sentenceExplain(q.sent, particleWhy(q.target, q.sent)), say: q.sent.kana, particleStat: q.target.t });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
    host._keys = function (n) { if (n >= 1 && n <= btns.length) pick(n - 1); };
  }

  /* =========================================================
     PAST TENSE LAB (items = a thing word or an action word)
     ========================================================= */
  function labEnglish(item, f) {
    if (item.family === 'act') {
      const v = item.verb.eng;
      return { pres: v.b, presNeg: "don't " + v.b, past: v.p, pastNeg: "didn't " + v.b }[f];
    }
    const x = item.np;
    return { pres: 'is ' + x, presNeg: "isn't " + x, past: 'was ' + x, pastNeg: "wasn't " + x }[f];
  }
  function npForThing(w) {
    if (w.prd) return w.prd;
    if (w.art === 'a' || w.art === 'an') return U.aAn(w.en);
    if (w.art === 'the') return 'the ' + w.en;
    return w.en;
  }
  function makeItem(family, worldId) {
    if (family === 'act') {
      const keys = Object.keys(V);
      const wp = JP.wordsOf(worldId).filter(function (w) { return w.kind === 'verb'; });
      const v = wp.length ? U.pick(wp) : V[U.pick(keys)];
      return { family: 'act', id: v.id, stem: v.stem, verb: v, key: v.id, emoji: v.emoji, enBase: v.eng.b };
    }
    let pool = JP.wordsOf(worldId).filter(function (w) { return (w.kind === 'noun' || w.kind === 'pron') && w.kana.indexOf(' ') < 0 && w.id !== 'watashi' && w.id !== 'kore' && w.id !== 'sore'; });
    if (!pool.length) pool = JP.WORDS.filter(function (w) { return w.kind === 'noun' && w.kana.indexOf(' ') < 0; });
    const w = U.pick(pool);
    return { family: 'thing', id: w.id, stem: w.kana, word: w, key: w.id, emoji: w.emoji, np: npForThing(w), enBase: 'is ' + npForThing(w) };
  }
  function itemBase(item) { return item.stem + ENDINGS[item.family].pres; }
  function pairHTML(stem, ending) { return '<span class="pair">' + K(stem, JP.Kana.romaji(stem)) + endK(ending, 'end') + '</span>'; }

  /* ----- a. THING or ACTION? ----- */
  TYPES.lab_family = {
    id: 'lab_family', label: 'Thing or Action?',
    render: function (q, host, api) {
      const it = q.item;
      host.innerHTML = '<div class="prompt-card"><div class="bigpic">' + it.emoji + '</div><div class="bigkana">' + K(itemBase(it), JP.Kana.romaji(itemBase(it))) + '</div>' +
        '<div class="enline big">' + esc(it.enBase) + '</div>' + UI.speakBtn(itemBase(it)) + '</div>' +
        '<div class="hintline">💡 Is it the <b>name</b> of something (THING)? Or can you <b>do</b> it (ACTION)?</div>' +
        '<div class="opts cols-2 families"><button type="button" class="opt fam thing" data-f="thing"><span class="optnum">1</span><span class="fam-ico">🟢</span><b>THING</b><span class="fam-end">' + K('です', 'desu') + '</span></button>' +
        '<button type="button" class="opt fam act" data-f="act"><span class="optnum">2</span><span class="fam-ico">🟠</span><b>ACTION</b><span class="fam-end">' + K('ます', 'masu') + '</span></button></div>';
      const btns = UI.$$('.opt', host); let answered = false;
      function pick(f) {
        if (answered) return; answered = true;
        btns.forEach(function (b) { b.disabled = true; if (b.dataset.f === it.family) b.classList.add('right'); else if (b.dataset.f === f) b.classList.add('wrong'); else b.classList.add('dim'); });
        api.done({ correct: f === it.family, html: '<div class="note">' + FAM_ICON[it.family] + ' It is a <b>' + FAM_LABEL[it.family] + '</b>.</div>' + ladderHTML(it, 'pastNeg'), say: itemBase(it) });
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { pick(b.dataset.f); }); });
      host._keys = function (n) { if (n === 1) pick('thing'); if (n === 2) pick('act'); };
    }
  };

  /* ----- b. pick the right ending ----- */
  TYPES.lab_ending = {
    id: 'lab_ending', label: 'Make it past / negative',
    render: function (q, host, api) {
      const it = q.item;
      host.innerHTML = '<div class="prompt-card"><div class="bigpic">' + it.emoji + '</div><div class="bigkana">' + K(itemBase(it), JP.Kana.romaji(itemBase(it))) + '</div><div class="enline">' + esc(labEnglish(it, 'pres')) + '</div>' +
        '<div class="arrow">⬇</div><div class="target-chip">' + esc(FORM_INFO[q.form].label) + ' = <b>' + esc(labEnglish(it, q.form)) + '</b></div></div>';
      const opts = document.createElement('div');
      opts.innerHTML = '';
      const host2 = document.createElement('div'); host.appendChild(host2);
      mcqGeneric(q, host2, api, { optHTML: function (op) { return pairHTML(it.stem, op.e); }, cols: q.opts.length <= 3 ? q.opts.length : 2, html: function () { return '<div class="note">' + FAM_ICON[it.family] + ' ' + FAM_LABEL[it.family] + '</div>' + ladderHTML(it, q.form) + endingNote(it.family, q.form); }, say: it.stem + ENDINGS[it.family][q.form] });
    }
  };
  function mcqGeneric(q, host, api, o) {
    host.innerHTML = '<div class="opts cols-' + o.cols + '">' + q.opts.map(function (op, i) { return '<button type="button" class="opt" data-i="' + i + '"><span class="optnum">' + (i + 1) + '</span>' + o.optHTML(op) + '</button>'; }).join('') + '</div>';
    const btns = UI.$$('.opt', host); let answered = false;
    function pick(i) {
      if (answered) return; answered = true;
      btns.forEach(function (b, j) { b.disabled = true; if (q.opts[j].ok) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); else b.classList.add('dim'); });
      api.done({ correct: !!q.opts[i].ok, html: o.html(q.opts[i]), say: o.say });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
    host.parentNode._keys = function (n) { if (n >= 1 && n <= btns.length) pick(n - 1); };
  }

  /* ----- c. build with bricks ----- */
  const BRICKS = {
    act: { bank: ['ます', 'ません', 'ました', 'でした'], want: { pres: ['ます'], presNeg: ['ません'], past: ['ました'], pastNeg: ['ません', 'でした'] } },
    thing: { bank: ['です', 'じゃ', 'ない', 'なかった', 'でした'], want: { pres: ['です'], presNeg: ['じゃ', 'ない', 'です'], past: ['でした'], pastNeg: ['じゃ', 'なかった', 'です'] } }
  };
  function brickClass(b) { return (b === 'ません' || b === 'じゃ' || b === 'ない') ? 'no' : (b === 'でした' || b === 'ました' || b === 'なかった') ? 'before' : 'plain'; }
  TYPES.lab_bricks = {
    id: 'lab_bricks', label: 'Build with bricks',
    render: function (q, host, api) {
      const it = q.item, spec = BRICKS[it.family], want = spec.want[q.form];
      let bank = spec.bank.map(function (b, i) { return { b: b, i: i }; });
      if (api.level >= 3) bank.push({ b: it.family === 'act' ? 'です' : 'ます', i: 99 });
      bank = U.shuffle(bank);
      let ans = [], attempts = 0, over = false;
      host.innerHTML = '<div class="prompt-card"><div class="bigpic">' + it.emoji + '</div><div class="bigkana">' + K(itemBase(it), JP.Kana.romaji(itemBase(it))) + '</div><div class="enline">' + esc(labEnglish(it, 'pres')) + '</div>' +
        '<div class="arrow">⬇</div><div class="target-chip">' + esc(FORM_INFO[q.form].label) + ' = <b>' + esc(labEnglish(it, q.form)) + '</b></div></div>' +
        '<div class="bricklegend"><span class="brick no">blue = NO</span><span class="brick before">red = BEFORE</span></div>' +
        '<div class="ansline brickline" id="bl"></div><div class="tilebank bricks" id="bb"></div>' +
        '<div class="actions"><button type="button" class="btn ghost" id="bk-clear">↺ Clear</button><button type="button" class="btn go" id="bk-check" disabled>Check ✓</button></div>';
      const ansEl = UI.$('#bl', host), bankEl = UI.$('#bb', host), checkB = UI.$('#bk-check', host);
      function draw(bad) {
        ansEl.innerHTML = '<span class="tile stemtile"><span class="ro">' + esc(JP.Kana.romaji(it.stem)) + '</span><span class="k">' + esc(it.stem) + '</span></span>' +
          ans.map(function (x, k) { return '<button type="button" class="tile brickt ' + brickClass(x.b) + (bad ? ' bad' : '') + '" data-k="' + k + '"><span class="ro">' + esc(ENDING_RO[x.b] || JP.Kana.romaji(x.b)) + '</span><span class="k">' + esc(x.b) + '</span></button>'; }).join('') +
          (ans.length ? '' : '<span class="ans-empty">Add the bricks</span>');
        bankEl.innerHTML = bank.map(function (x) {
          const used = ans.indexOf(x) >= 0;
          return '<button type="button" class="tile brickt ' + brickClass(x.b) + (used ? ' ghost' : '') + '" data-i="' + x.i + '"' + (used ? ' disabled' : '') + '><span class="ro">' + esc(ENDING_RO[x.b] || JP.Kana.romaji(x.b)) + '</span><span class="k">' + esc(x.b) + '</span></button>';
        }).join('');
        checkB.disabled = !ans.length || over;
      }
      draw();
      bankEl.addEventListener('click', function (e) {
        const b = e.target.closest('button.tile'); if (!b || over || b.disabled) return;
        const x = bank.filter(function (z) { return String(z.i) === b.dataset.i; })[0]; if (!x || ans.indexOf(x) >= 0) return;
        ans.push(x); api.sfx('place'); draw();
      });
      ansEl.addEventListener('click', function (e) {
        const b = e.target.closest('button.tile'); if (!b || over) return;
        ans.splice(+b.dataset.k, 1); api.sfx('remove'); draw();
      });
      UI.$('#bk-clear', host).addEventListener('click', function () { if (over) return; ans = []; api.sfx('remove'); draw(); });
      checkB.addEventListener('click', function () {
        if (over) return;
        const got = ans.map(function (x) { return x.b; });
        const ok = got.join('|') === want.join('|');
        const html = '<div class="note">' + FAM_ICON[it.family] + ' ' + FAM_LABEL[it.family] + '</div>' + ladderHTML(it, q.form) + endingNote(it.family, q.form);
        if (ok) { over = true; draw(); api.done({ correct: true, partial: attempts > 0, html: html, say: it.stem + ENDINGS[it.family][q.form] }); return; }
        attempts++;
        if (attempts >= 2) { over = true; draw(); api.done({ correct: false, html: html, say: it.stem + ENDINGS[it.family][q.form] }); return; }
        draw(true);
        const wrongFam = got.some(function (b) { return spec.bank.indexOf(b) < 0 || (it.family === 'act' && (b === 'じゃ' || b === 'ない' || b === 'なかった' || b === 'です')) || (it.family === 'thing' && (b === 'ます' || b === 'ません' || b === 'ました')); });
        api.hint(wrongFam ? "Don't cross the families! " + (it.family === 'act' ? 'ACTION words use ます bricks.' : 'THING words use です bricks.') : (q.form === 'pastNeg' ? 'Past + No needs BOTH bricks, in order: NO first, then BEFORE.' : 'Check the bricks: blue = NO, red = BEFORE.'));
      });
      host._keys = function (k) { if (k === 'enter' && !checkB.disabled) checkB.click(); };
    }
  };

  /* ----- d. spot the mistake ----- */
  TYPES.lab_mistake = {
    id: 'lab_mistake', label: 'Spot the mistake',
    render: function (q, host, api) {
      const s = q.sent;
      const verbU = s.units[s.verbUnit];
      const preTokens = verbU.tokens.slice(0, -1);
      const sentHTML = '<span class="sent">' + s.units.slice(0, -1).map(function (u) {
        return '<span class="unit">' + u.tokens.map(function (t) { return UI.tile(t, { static: true, cls: 'plain' }); }).join('') + '</span>';
      }).join('') + '<span class="unit">' + preTokens.map(function (t) { return UI.tile(t, { static: true, cls: 'plain' }); }).join('') +
        '<span class="tile plain wrongend"><span class="ro">' + esc(ENDING_RO[q.wrong] || '') + '</span><span class="k">' + esc(q.wrong) + '</span></span></span><span class="maru">。</span></span>';
      host.innerHTML = '<div class="prompt-card sent-card"><div class="scene">' + s.emojis.map(function (e) { return '<span>' + e + '</span>'; }).join('') + '</div><div class="sentline">' + sentHTML + '</div>' +
        '<div class="en-big">“' + esc(s.en) + '”</div><div class="enline">⚠ This ending uses the <b>wrong family</b>. Which ending fixes it?</div></div>';
      const box = document.createElement('div'); host.appendChild(box);
      mcqGeneric(q, box, api, {
        optHTML: function (op) { return endK(op.e, 'end opt-kana'); }, cols: q.opts.length,
        html: function () { return '<div class="fixed">' + UI.sentenceHTML(s) + '</div><div class="en-big">' + esc(s.en) + '</div>' + UI.speakBtn(s.kana) + endingNote(s.family, s.form) + '<div class="note">❌ ' + FAM_ICON[s.family === 'act' ? 'thing' : 'act'] + ' ' + FAM_LABEL[s.family === 'act' ? 'thing' : 'act'] + ' endings do not go with this word. Don’t cross the families!</div>'; },
        say: s.kana
      });
    }
  };

  /* ----- e. answer the question with “no” ----- */
  TYPES.lab_answer = {
    id: 'lab_answer', label: 'Answer “No”',
    render: function (q, host, api) {
      const s = q.sent;
      const verbU = s.units[s.verbUnit];
      const ending = verbU.tokens[verbU.tokens.length - 1];
      const qEnd = s.family === 'act' ? 'ましたか' : 'でしたか';
      const qEndRo = s.family === 'act' ? 'mashita ka' : 'deshita ka';
      const sentHTML = '<span class="sent">' + s.units.slice(0, -1).map(function (u) {
        return '<span class="unit">' + u.tokens.map(function (t) { return UI.tile(t, { static: true, cls: 'plain' }); }).join('') + '</span>';
      }).join('') + '<span class="unit">' + verbU.tokens.slice(0, -1).map(function (t) { return UI.tile(t, { static: true, cls: 'plain' }); }).join('') +
        '<span class="tile plain r-end" style="--pc:#ef476f"><span class="ro">' + qEndRo + '</span><span class="k">' + qEnd + '</span></span></span><span class="maru">？</span></span>';
      host.innerHTML = '<div class="prompt-card sent-card"><div class="scene">' + s.emojis.map(function (e) { return '<span>' + e + '</span>'; }).join('') + '</div><div class="sentline">' + sentHTML + '</div>' +
        '<div class="en-big">“' + esc(s.qen) + '”</div><div class="enline">Say <b>No</b>: <b>いいえ</b> (iie). Which answer is right?</div></div>';
      const box = document.createElement('div'); host.appendChild(box);
      mcqGeneric(q, box, api, {
        optHTML: function (op) { return '<span class="ans">' + K(op.yes ? 'はい、' : 'いいえ、', op.yes ? 'hai' : 'iie') + op.pre.map(function (t) { return K(t.t, t.ro); }).join('') + endK(op.e, 'end') + '</span>'; },
        cols: 1,
        html: function () { return '<div class="note">Question: <b>' + esc(s.qen) + '</b></div><div class="reveal-sent">' + K('いいえ、', 'iie') + q.pre.map(function (t) { return K(t.t, t.ro); }).join('') + endK(ENDINGS[s.family].pastNeg, 'end') + '</div><div class="en-big">“' + (s.family === 'act' ? "No, they didn't." : "No, it wasn't.") + '”</div>' + endingNote(s.family, 'pastNeg'); },
        say: 'いいえ、' + q.pre.map(function (t) { return t.t; }).join('') + ENDINGS[s.family].pastNeg
      });
    }
  };
  /* =========================================================
     Candidate generators (planner calls these)
     ========================================================= */
  function sentenceCands(world, n, level) {
    return Sent.candidates(world, n).map(function (s) {
      const grp = s.kind === 'act' ? 'v:' + s.verbKey : s.kind === 'like' ? 'like:' + s.used[1] : s.kind === 'adj' ? 'adj:' + s.used[0] : 'is:' + s.used[0];
      return { key: s.key, group: grp, type: 'sentence', q: { type: 'sentence', key: s.key, sent: s, prompt: 'Build the sentence!' } };
    });
  }
  function particleCands(world, n, level) {
    const out = [];
    Sent.candidates(world, n * 2).forEach(function (s) {
      const ps = s.tokens.filter(function (t) { return t.role === 'particle'; });
      if (!ps.length) return;
      // weighted choice: weaker particles first
      const weights = ps.map(function (t) { return JP.Store.particleWeight(t.t); });
      let r = U.rand() * weights.reduce(function (a, b) { return a + b; }, 0), idx = 0;
      for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } idx = i; }
      const target = ps[idx];
      const avoid = {}; avoid[target.t] = 1;
      if (target.t === 'に') avoid['へ'] = 1; if (target.t === 'へ') avoid['に'] = 1;
      // do not offer a particle that is *also* correct elsewhere in this sentence
      const others = Object.keys(JP.PARTICLES).filter(function (p) { return !avoid[p]; });
      let pool = others;
      // keep either に or へ, not both (they are interchangeable for destinations)
      if (pool.indexOf('に') >= 0 && pool.indexOf('へ') >= 0) pool = pool.filter(function (p) { return p !== (U.chance(0.7) ? 'へ' : 'に'); });
      const nd = level <= 1 ? 2 : 3;
      const opts = U.shuffle([{ p: target.t, ok: true }].concat(U.sample(pool, nd).map(function (p) { return { p: p, ok: false }; })));
      const key = 'p|' + s.key + '|' + target.t + target.unit;
      out.push({ key: key, group: 'pp:' + target.t, type: 'particle', q: { type: 'particle', key: key, sent: s, target: target, opts: opts, prompt: 'Which particle fits the blank?' } });
    });
    return out;
  }

  function labCands(world, n, level) {
    const out = [];
    const target3 = ['presNeg', 'past', 'pastNeg', 'pastNeg'];
    for (let i = 0; i < n; i++) {
      const sub = U.pick(['family', 'ending', 'ending', 'bricks', 'bricks', 'mistake', 'answer']);
      const fam = U.chance(0.5) ? 'act' : 'thing';
      if (sub === 'family') {
        const it = makeItem(fam, world);
        out.push({ key: 'lab_family|' + it.id, group: it.id, type: 'lab_family', q: { type: 'lab_family', key: 'lab_family|' + it.id, item: it, prompt: 'Is it a THING or an ACTION?' } });
      } else if (sub === 'ending') {
        const it = makeItem(fam, world), f = U.pick(target3);
        const other = fam === 'act' ? 'thing' : 'act';
        const right = ENDINGS[fam][f];
        let wrong = [ENDINGS[other][f]];
        FORMS.filter(function (x) { return x !== f; }).forEach(function (x) { wrong.push(ENDINGS[fam][x]); });
        wrong = U.sample(wrong.slice(1), level <= 1 ? 1 : 2).concat(wrong.slice(0, 1));   // always includes the wrong-family trap
        const opts = U.shuffle([{ e: right, ok: true }].concat(wrong.map(function (e) { return { e: e, ok: false }; })));
        const key = 'lab_ending|' + it.id + '|' + f;
        out.push({ key: key, group: it.id, type: 'lab_ending', q: { type: 'lab_ending', key: key, item: it, form: f, opts: opts, prompt: 'Pick the right ending!' } });
      } else if (sub === 'bricks') {
        const it = makeItem(fam, world), f = U.pick(target3);
        const key = 'lab_bricks|' + it.id + '|' + f;
        out.push({ key: key, group: it.id, type: 'lab_bricks', q: { type: 'lab_bricks', key: key, item: it, form: f, prompt: 'Snap the bricks together!' } });
      } else if (sub === 'mistake') {
        const f = U.pick(['presNeg', 'past', 'pastNeg', 'pastNeg']);
        const s = Sent.generate(world, { forms: [f], kinds: ['act', 'is', 'like'], notSubj: [] });
        const other = s.family === 'act' ? 'thing' : 'act';
        const right = ENDINGS[s.family][f], wrong = ENDINGS[other][f];
        const alts = FORMS.filter(function (x) { return x !== f; }).map(function (x) { return ENDINGS[s.family][x]; });
        const opts = U.shuffle([{ e: right, ok: true }, { e: U.pick(alts), ok: false }].concat(level >= 2 ? [{ e: ENDINGS[other][U.pick(FORMS.filter(function (x) { return x !== f; }))], ok: false }] : []));
        const key = 'lab_mistake|' + s.key;
        out.push({ key: key, group: 'm:' + (s.verbKey || s.kind), type: 'lab_mistake', q: { type: 'lab_mistake', key: key, sent: s, wrong: wrong, opts: opts, prompt: 'Spot the mistake!' } });
      } else {
        const s = Sent.generate(world, { forms: ['past'], kinds: ['act', 'is', 'like'], noTime: true, notSubj: ['watashi'] });
        const verbU = s.units[s.verbUnit];
        const pre = verbU.tokens.slice(0, -1);
        const other = s.family === 'act' ? 'thing' : 'act';
        const opts = [
          { yes: false, pre: pre, e: ENDINGS[s.family].pastNeg, ok: true },
          { yes: false, pre: pre, e: ENDINGS[other].pastNeg, ok: false },
          { yes: true, pre: pre, e: ENDINGS[s.family].past, ok: false }
        ];
        if (level >= 2) opts.push({ yes: false, pre: pre, e: ENDINGS[s.family].presNeg, ok: false });
        const key = 'lab_answer|' + s.key;
        out.push({ key: key, group: 'a:' + (s.verbKey || s.kind), type: 'lab_answer', q: { type: 'lab_answer', key: key, sent: s, pre: pre, opts: U.shuffle(opts), prompt: 'Answer the question with NO!' } });
      }
    }
    return out;
  }

  JP.Q.sentenceCands = sentenceCands;
  JP.Q.particleCands = particleCands;
  JP.Q.labCands = labCands;
  JP.Q.ladderHTML = ladderHTML;
  JP.Q.endingNote = endingNote;
  JP.Q.labEnglish = labEnglish;
})(globalThis.JP = globalThis.JP || {});
