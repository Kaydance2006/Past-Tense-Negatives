/* ============================================================
   qwords.js - vocabulary question types
   Each type: { id, label, ok(word, env) , make(word, env) , render(q, host, api) }
   env = { pool, level, voice }   api = { done, hint, say, sfx, level }
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U, UI = JP.UI, K = UI.K, KW = UI.KW, esc = U.esc;
  JP.Q = JP.Q || { types: {} };
  const TYPES = JP.Q.types;

  /* ---------- helpers ---------- */
  const SMALL = { 'ゃ': 'small ya', 'ゅ': 'small yu', 'ょ': 'small yo', 'ャ': 'small ya', 'ュ': 'small yu', 'ョ': 'small yo',
    'ぁ': 'small a', 'ぃ': 'small i', 'ぅ': 'small u', 'ぇ': 'small e', 'ぉ': 'small o', 'ァ': 'small a', 'ィ': 'small i', 'ゥ': 'small u', 'ェ': 'small e', 'ォ': 'small o' };
  function charRo(ch) {
    if (ch === 'っ' || ch === 'ッ') return 'small tsu';
    if (ch === 'ー') return 'long';
    if (SMALL[ch]) return SMALL[ch];
    return JP.Kana.romaji(ch);
  }
  JP.charRo = charRo;
  function nOpts(level) { return level <= 1 ? 3 : 4; }
  function sim(a, b) {
    let s = 0;
    if (JP.Kana.script(a.kana) === JP.Kana.script(b.kana)) s += 2;
    if (Math.abs(a.kana.length - b.kana.length) <= 1) s += 1;
    if (a.kana[0] === b.kana[0]) s += 1.5;
    if (a.kind === b.kind) s += 1;
    return s + U.rand() * 0.5;
  }
  /* choose n wrong answers: from the same subject first, then anywhere */
  function distract(w, pool, n, level, need) {
    need = need || {};
    const ok = function (x) {
      return x.id !== w.id && x.kana !== w.kana && x.en !== w.en && (!need.pic || x.pic) && (!need.noSpace || x.kana.indexOf(' ') < 0);
    };
    let cands = pool.filter(ok);
    const sameKind = cands.filter(function (x) { return x.kind === w.kind || (x.pic && w.pic); });
    if (sameKind.length >= n) cands = sameKind;
    if (level >= 3) cands = cands.slice().sort(function (a, b) { return sim(b, w) - sim(a, w); }).slice(0, Math.max(n * 2, 5));
    let out = U.sample(cands, n);
    if (out.length < n) {
      const have = {}; out.forEach(function (x) { have[x.id] = 1; });
      const more = JP.WORDS.filter(function (x) { return ok(x) && !have[x.id] && (x.kind === w.kind || (x.pic && w.pic)); });
      out = out.concat(U.sample(more, n - out.length));
    }
    return out;
  }
  function wordReveal(w) {
    return '<div class="reveal"><span class="rv-emoji">' + w.emoji + '</span>' + KW(w, 'rv-kana') + '<span class="rv-eq">=</span><b class="rv-en">' + esc(w.en) + '</b>' +
      UI.speakBtn(w.kana) + '</div>' +
      (w.kanji ? '<div class="note">📖 In your class slides: <span class="kanji">' + esc(w.kanji) + '</span></div>' : '') +
      (w.note ? '<div class="note">💡 ' + esc(w.note) + '</div>' : '');
  }
  function base(type, w, extra) {
    return Object.assign({ type: type, key: type + '|' + w.id, group: w.id, wid: w.id, w: w, prompt: '' }, extra || {});
  }

  /* generic multiple-choice renderer */
  function mcq(q, host, api, o) {
    const cols = o.cols || (q.opts.length <= 3 ? q.opts.length : 2);
    host.innerHTML = o.prompt + '<div class="opts cols-' + cols + ' ' + (o.cls || '') + '">' +
      q.opts.map(function (op, i) {
        return '<button type="button" class="opt" data-i="' + i + '"><span class="optnum">' + (i + 1) + '</span>' + o.optHTML(op) + '</button>';
      }).join('') + '</div>';
    let answered = false;
    const btns = UI.$$('.opt', host);
    function pick(i) {
      if (answered) return; answered = true;
      const op = q.opts[i];
      btns.forEach(function (b, j) { b.disabled = true; if (q.opts[j].ok) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); else b.classList.add('dim'); });
      api.done({ correct: !!op.ok, wid: q.wid, html: q.explain, say: q.say });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
    host._keys = function (n) { if (n >= 1 && n <= btns.length) pick(n - 1); };
  }
  const hear = function (w) { return '<div class="hearrow">' + UI.speakBtn(w.kana, 'big') + '</div>'; };

  /* ---------- 1. picture -> kana ---------- */
  TYPES.pic2kana = {
    id: 'pic2kana', label: 'Picture → Japanese', ok: function (w) { return w.pic; },
    make: function (w, env) {
      const ds = distract(w, env.pool, nOpts(env.level) - 1, env.level, { pic: false });
      return base('pic2kana', w, { prompt: 'What is this in Japanese?', opts: U.shuffle([w].concat(ds)).map(function (x) { return { w: x, ok: x.id === w.id }; }), explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigpic">' + q.w.emoji + '</div>' + (api.level <= 1 ? '<div class="enline">' + esc(q.w.en) + '</div>' : '') + '</div>',
        optHTML: function (op) { return KW(op.w, 'opt-kana'); }
      });
    }
  };

  /* ---------- 2. kana -> picture ---------- */
  TYPES.kana2pic = {
    id: 'kana2pic', label: 'Japanese → Picture', ok: function (w) { return w.pic; },
    make: function (w, env) {
      const ds = distract(w, env.pool, nOpts(env.level) - 1, env.level, { pic: true });
      return base('kana2pic', w, { prompt: 'Tap the picture that matches!', opts: U.shuffle([w].concat(ds)).map(function (x) { return { w: x, ok: x.id === w.id }; }), explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigkana">' + KW(q.w) + '</div>' + hear(q.w) + '</div>',
        optHTML: function (op) { return '<span class="optpic">' + op.w.emoji + '</span>'; }, cls: 'pics'
      });
    }
  };

  /* ---------- 3. listen -> picture ---------- */
  TYPES.listen2pic = {
    id: 'listen2pic', label: 'Listen → Picture', voice: true, ok: function (w, env) { return w.pic && env.voice; },
    make: function (w, env) {
      const ds = distract(w, env.pool, nOpts(env.level) - 1, env.level, { pic: true });
      return base('listen2pic', w, { prompt: 'Listen! Which picture is it?', autoplay: w.kana, opts: U.shuffle([w].concat(ds)).map(function (x) { return { w: x, ok: x.id === w.id }; }), explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigspeaker">' + UI.speakBtn(q.w.kana, 'huge') + '</div><div class="enline">Tap to hear it again</div></div>',
        optHTML: function (op) { return '<span class="optpic">' + op.w.emoji + '</span>'; }, cls: 'pics'
      });
    }
  };

  /* ---------- 4. listen -> kana ---------- */
  TYPES.listen2kana = {
    id: 'listen2kana', label: 'Listen → Japanese', voice: true, ok: function (w, env) { return env.voice; },
    make: function (w, env) {
      const ds = distract(w, env.pool, nOpts(env.level) - 1, env.level);
      return base('listen2kana', w, { prompt: 'Listen! Which word did you hear?', autoplay: w.kana, opts: U.shuffle([w].concat(ds)).map(function (x) { return { w: x, ok: x.id === w.id }; }), explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigspeaker">' + UI.speakBtn(q.w.kana, 'huge') + '</div><div class="enline">Tap to hear it again</div></div>',
        optHTML: function (op) { return KW(op.w, 'opt-kana'); }
      });
    }
  };

  /* ---------- 5. kana -> English ---------- */
  TYPES.kana2en = {
    id: 'kana2en', label: 'Japanese → English', ok: function () { return true; },
    make: function (w, env) {
      const ds = distract(w, env.pool, nOpts(env.level) - 1, env.level);
      return base('kana2en', w, { prompt: 'What does it mean?', opts: U.shuffle([w].concat(ds)).map(function (x) { return { w: x, ok: x.id === w.id }; }), explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigkana">' + KW(q.w) + '</div>' + hear(q.w) + '</div>',
        optHTML: function (op) { return '<span class="opt-en">' + esc(op.w.en) + '</span>'; }
      });
    }
  };

  /* ---------- 6. English -> kana ---------- */
  TYPES.en2kana = {
    id: 'en2kana', label: 'English → Japanese', ok: function () { return true; },
    make: function (w, env) {
      const ds = distract(w, env.pool, nOpts(env.level) - 1, env.level);
      return base('en2kana', w, { prompt: 'How do you say it in Japanese?', opts: U.shuffle([w].concat(ds)).map(function (x) { return { w: x, ok: x.id === w.id }; }), explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigpic">' + q.w.emoji + '</div><div class="enline big">' + esc(q.w.en) + '</div></div>',
        optHTML: function (op) { return KW(op.w, 'opt-kana'); }
      });
    }
  };

  /* ---------- 7. which kana is missing? ---------- */
  TYPES.missing = {
    id: 'missing', label: 'Missing kana', ok: function (w) { return JP.Kana.chars(w.kana).length >= 3 && w.kana.indexOf(' ') < 0; },
    make: function (w, env) {
      const chars = JP.Kana.chars(w.kana);
      const idxs = [];
      chars.forEach(function (c, i) { if ('っッーゃゅょャュョぁぃぅぇぉ'.indexOf(c) < 0 && c !== 'ん' && c !== 'ン') idxs.push(i); });
      const i = idxs.length ? U.pick(idxs) : 0;
      const right = chars[i];
      let wrong = JP.Kana.alike(right).filter(function (c) { return 'ゃゅょっー'.indexOf(c) < 0; });
      wrong = U.sample(wrong, nOpts(env.level) - 1);
      if (wrong.length < nOpts(env.level) - 1) {
        wrong = wrong.concat(U.sample(JP.Kana.allOf(JP.Kana.script(right)).filter(function (c) { return c !== right && wrong.indexOf(c) < 0; }), nOpts(env.level) - 1 - wrong.length));
      }
      return base('missing', w, { prompt: 'Which kana is missing?', chars: chars, idx: i, opts: U.shuffle([right].concat(wrong)).map(function (c) { return { ch: c, ok: c === right }; }), explain: wordReveal(w), say: w.kana, key: 'missing|' + w.id + '|' + i });
    },
    render: function (q, host, api) {
      const word = q.chars.map(function (c, i) {
        return i === q.idx ? '<span class="blankbox">?</span>' : '<span class="kbox">' + K(c, charRo(c)) + '</span>';
      }).join('');
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigpic">' + q.w.emoji + '</div><div class="enline">' + esc(q.w.en) + '</div><div class="wordrow">' + word + '</div></div>',
        optHTML: function (op) { return K(op.ch, charRo(op.ch), 'opt-kana'); }, cls: 'chars'
      });
    }
  };

  /* ---------- 8. spell it with kana tiles ---------- */
  TYPES.spell = {
    id: 'spell', label: 'Spell it!', ok: function (w) { const n = JP.Kana.chars(w.kana).length; return n >= 2 && n <= 7 && w.kana.indexOf(' ') < 0; },
    make: function (w, env) {
      const target = JP.Kana.chars(w.kana);
      const sc = JP.Kana.script(w.kana) === 'katakana' ? 'katakana' : 'hiragana';
      let extra = [];
      const nExtra = env.level <= 1 ? 1 : (env.level === 2 ? 2 : 3);
      target.forEach(function (c) { extra = extra.concat(JP.Kana.alike(c)); });
      extra = U.sample(U.uniq(extra).filter(function (c) { return target.indexOf(c) < 0 && 'ゃゅょっー'.indexOf(c) < 0; }), nExtra);
      if (extra.length < nExtra) extra = extra.concat(U.sample(JP.Kana.allOf(sc).filter(function (c) { return target.indexOf(c) < 0 && extra.indexOf(c) < 0; }), nExtra - extra.length));
      const bank = U.shuffle(target.concat(extra).map(function (c, i) { return { c: c, i: i }; }));
      return base('spell', w, { prompt: 'Build the word with the kana tiles!', target: target, bank: bank, explain: wordReveal(w), say: w.kana });
    },
    render: function (q, host, api) {
      const n = q.target.length;
      const slots = new Array(n).fill(null);   // holds bank item
      let attempts = 0, over = false;
      host.innerHTML = '<div class="prompt-card"><div class="bigpic">' + q.w.emoji + '</div><div class="enline big">' + esc(q.w.en) + '</div>' +
        '<div class="ro-line">' + esc(JP.ro(q.w)) + '</div>' + hear(q.w) + '</div>' +
        '<div class="slots" id="slots"></div><div class="bank" id="bank"></div>' +
        '<div class="actions"><button type="button" class="btn ghost" id="sp-clear">↺ Clear</button><button type="button" class="btn go" id="sp-check" disabled>Check ✓</button></div>';
      const slotsEl = UI.$('#slots', host), bankEl = UI.$('#bank', host), checkB = UI.$('#sp-check', host);
      function draw(wrongs) {
        slotsEl.innerHTML = slots.map(function (s, i) {
          return '<button type="button" class="slot ' + (s ? 'filled' : '') + (wrongs && wrongs[i] ? ' bad' : '') + '" data-s="' + i + '">' + (s ? K(s.c, charRo(s.c)) : '') + '</button>';
        }).join('');
        bankEl.innerHTML = q.bank.map(function (b) {
          const used = slots.indexOf(b) >= 0;
          return '<button type="button" class="ktile' + (used ? ' used' : '') + '" data-b="' + b.i + '"' + (used ? ' disabled' : '') + '>' + K(b.c, charRo(b.c)) + '</button>';
        }).join('');
        checkB.disabled = slots.indexOf(null) >= 0 || over;
      }
      draw();
      bankEl.addEventListener('click', function (e) {
        const t = e.target.closest('.ktile'); if (!t || over) return;
        const item = q.bank.filter(function (b) { return String(b.i) === t.dataset.b; })[0];
        const free = slots.indexOf(null); if (free < 0) return;
        slots[free] = item; api.sfx('place'); draw();
      });
      slotsEl.addEventListener('click', function (e) {
        const t = e.target.closest('.slot'); if (!t || over) return;
        const i = +t.dataset.s; if (!slots[i]) return;
        slots[i] = null; api.sfx('remove'); draw();
      });
      UI.$('#sp-clear', host).addEventListener('click', function () { if (over) return; for (let i = 0; i < n; i++) slots[i] = null; api.sfx('remove'); draw(); });
      checkB.addEventListener('click', function () {
        if (over) return;
        const ans = slots.map(function (s) { return s.c; });
        const ok = ans.join('') === q.target.join('');
        if (ok) { over = true; draw(); api.done({ correct: true, partial: attempts > 0, wid: q.wid, html: q.explain, say: q.say }); return; }
        attempts++;
        const wrongs = ans.map(function (c, i) { return c !== q.target[i]; });
        if (attempts >= 2) { over = true; draw(wrongs); api.done({ correct: false, wid: q.wid, html: q.explain + '<div class="note">Your answer: <b class="kanji">' + esc(ans.join('')) + '</b></div>', say: q.say }); return; }
        draw(wrongs); api.hint('Almost! The red tiles are not right. Tap them to fix.');
      });
      host._keys = function (k) { if (k === 'enter' && !checkB.disabled) checkB.click(); };
    }
  };

  /* ---------- 9. hiragana or katakana? ---------- */
  TYPES.script = {
    id: 'script', label: 'Hiragana or Katakana?', ok: function (w) { return JP.Kana.script(w.kana) !== 'mixed' && w.kana.indexOf(' ') < 0; },
    make: function (w) {
      const sc = JP.Kana.script(w.kana);
      const why = sc === 'katakana'
        ? 'It is <b>katakana</b> (カタカナ), which is mostly used for foreign words and sounds. This one comes from another language!'
        : 'It is <b>hiragana</b> (ひらがな), the curvy script used for Japanese words and endings like ます and です.';
      return base('script', w, { prompt: 'Is this word written in Hiragana or Katakana?', sc: sc, opts: [{ sc: 'hiragana', ok: sc === 'hiragana' }, { sc: 'katakana', ok: sc === 'katakana' }], explain: wordReveal(w) + '<div class="note">' + why + '</div>', say: w.kana });
    },
    render: function (q, host, api) {
      mcq(q, host, api, {
        prompt: '<div class="prompt-card"><div class="bigkana">' + KW(q.w) + '</div><div class="enline">' + esc(q.w.en) + '</div>' + hear(q.w) + '</div>',
        optHTML: function (op) { return op.sc === 'hiragana' ? '<span class="scriptbtn"><span class="sjp">ひらがな</span><span class="sen">Hiragana</span><span class="sample">あいうえお</span></span>' : '<span class="scriptbtn"><span class="sjp">カタカナ</span><span class="sen">Katakana</span><span class="sample">アイウエオ</span></span>'; }, cols: 2, cls: 'scripts'
      });
    }
  };

  /* ---------- exports ---------- */
  JP.Q.wordTypeIds = ['pic2kana', 'kana2pic', 'listen2pic', 'listen2kana', 'kana2en', 'en2kana', 'missing', 'spell', 'script'];
  JP.Q.distract = distract;
  JP.Q.wordReveal = wordReveal;
  JP.Q.makeWordQ = function (typeId, w, env) { return TYPES[typeId].make(w, env); };
  JP.Q.eligibleTypes = function (w, env, only) {
    return (only || JP.Q.wordTypeIds).filter(function (id) { return TYPES[id].ok(w, env); });
  };
})(globalThis.JP = globalThis.JP || {});
