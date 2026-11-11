/* ============================================================
   ui.js - small DOM helpers: kana+romaji markup, sentence tiles,
   toasts, confetti, modals, mascot cheers
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U, esc = U.esc;

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* kana with romaji floating above (like the class slides). CSS hides .ro when romaji is off. */
  function K(text, ro, cls) {
    return '<span class="jp ' + (cls || '') + '"><span class="ro">' + esc(ro || '') + '</span><span class="k">' + esc(text) + '</span></span>';
  }
  function KW(w, cls) { return K(w.kana, JP.ro(w), cls); }
  function KT(text, cls) { return K(text, JP.Kana.romaji(text), cls); }

  const ROLE_COLOR = {
    time: '#64748b', subj: '#3b82f6', obj: '#22a06b', place: '#9c36b5', dest: '#f08c00', recip: '#f08c00', ride: '#f08c00', meet: '#f08c00',
    with: '#e64980', own: '#0c8599', adv: '#f59f00', verb: '#ef476f', end: '#ef476f', pred: '#ef476f', particle: '#888'
  };
  const ROLE_LABEL = {
    time: 'When', subj: 'Who / What (topic)', obj: 'What (object)', place: 'Where (action place)', dest: 'Where to', recip: 'To whom', ride: 'What you ride',
    meet: 'Who you meet', with: 'With whom', own: 'Whose', adv: 'How much', verb: 'Action', end: 'Ending', pred: 'Describing word'
  };
  function colorOf(t) {
    if (t.role === 'particle') return (JP.PARTICLES[t.t] || {}).color || '#888';
    return ROLE_COLOR[t.role] || '#888';
  }

  /* a tile / chip for one sentence token */
  function tile(t, o) {
    o = o || {};
    const cls = ['tile', 'r-' + t.role];
    if (o.cls) cls.push(o.cls);
    const tag = o.static ? 'span' : 'button';
    return '<' + tag + (o.static ? '' : ' type="button"') + ' class="' + cls.join(' ') + '" data-tid="' + t.id + '" style="--pc:' + colorOf(t) + '">' +
      '<span class="ro">' + esc(t.ro || '') + '</span><span class="k">' + esc(t.t) + '</span></' + tag + '>';
  }
  function sentenceHTML(sent, o) {
    o = o || {};
    return '<span class="sent">' + sent.units.map(function (u) {
      return '<span class="unit">' + u.tokens.map(function (t) { return tile(t, { static: true, cls: o.hints === false ? 'plain' : '' }); }).join('') + '</span>';
    }).join('') + '<span class="maru">。</span></span>';
  }

  function speakBtn(text, cls) {
    return '<button type="button" class="speak ' + (cls || '') + '" data-say="' + esc(text) + '" aria-label="Hear it">🔊</button>';
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(html, ms) {
    const t = $('#toast');
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 2200);
  }

  /* ---------- confetti ---------- */
  let confettiRun = false;
  function confetti(n, o) {
    o = o || {};
    if (!JP.Store.setting('motion')) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti'); if (!cv) return;
    const ctx = cv.getContext('2d');
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const colors = ['#ff5d73', '#ffd166', '#06d6a0', '#4d9bff', '#b388ff', '#ff9f43', '#ff7eb6'];
    const bits = [];
    const cx = o.x != null ? o.x : cv.width / 2, cy = o.y != null ? o.y : cv.height * 0.35;
    for (let i = 0; i < (n || 90); i++) {
      const a = U.rand() * Math.PI * 2, sp = 3 + U.rand() * 9;
      bits.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, g: 0.22 + U.rand() * 0.12, s: 5 + U.rand() * 7, c: U.pick(colors), r: U.rand() * 6, vr: (U.rand() - 0.5) * 0.4, life: 120 + U.rand() * 60, emoji: o.emoji && U.chance(0.25) ? U.pick(o.emoji) : null });
    }
    if (confettiRun) { cv._bits = (cv._bits || []).concat(bits); return; }
    cv._bits = bits; confettiRun = true;
    (function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const live = [];
      cv._bits.forEach(function (b) {
        b.x += b.vx; b.y += b.vy; b.vy += b.g; b.vx *= 0.99; b.r += b.vr; b.life--;
        if (b.life > 0 && b.y < cv.height + 30) {
          live.push(b);
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
          ctx.globalAlpha = Math.min(1, b.life / 40);
          if (b.emoji) { ctx.font = '22px serif'; ctx.fillText(b.emoji, -10, 8); }
          else { ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 3, b.s, b.s * 0.6); }
          ctx.restore();
        }
      });
      cv._bits = live;
      if (live.length) requestAnimationFrame(frame);
      else { confettiRun = false; ctx.clearRect(0, 0, cv.width, cv.height); }
    })();
  }

  /* ---------- modal ---------- */
  function modal(html, o) {
    o = o || {};
    const ov = $('#overlay');
    ov.innerHTML = '<div class="modal-back" data-close="1"></div><div class="modal ' + (o.cls || '') + '" role="dialog" aria-modal="true">' +
      '<button type="button" class="modal-x" data-close="1" aria-label="Close">✕</button>' + html + '</div>';
    ov.classList.add('open');
    ov._onClose = o.onClose || null;
  }
  function closeModal() {
    const ov = $('#overlay');
    ov.classList.remove('open'); ov.innerHTML = '';
    if (ov._onClose) { const f = ov._onClose; ov._onClose = null; f(); }
  }

  /* in-page yes/no question (the browser's confirm() is blocked in some hosts) */
  let askYes = null;
  function ask(message, yesLabel, onYes) {
    askYes = onYes;
    modal('<h2>' + esc(message) + '</h2><div class="ask-row"><button type="button" class="btn ghost" data-close="1">Cancel</button>' +
      '<button type="button" class="btn warn" id="ask-yes">' + esc(yesLabel || 'Yes') + '</button></div>', { cls: 'ask' });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#ask-yes')) { const f = askYes; askYes = null; closeModal(); if (f) f(); }
  });

  /* ---------- mascot cheers (phrases from the class phrase list) ---------- */
  const CHEER = [
    ['すごい！', 'sugoi', 'Wow, amazing!'], ['かんぺき！', 'kanpeki', 'Perfect!'], ['よかった！', 'yokatta', "I'm glad!"],
    ['すてきですね！', 'suteki desu ne', 'How lovely!'], ['もちろん！', 'mochiron', 'Of course!'], ['なるほど！', 'naruhodo', 'I see! Makes sense!'],
    ['すごいね！', 'sugoi ne', 'Wow, nice!'], ['そうです！', 'sō desu', "That's right!"], ['いいですね！', 'ii desu ne', 'Nice!'], ['おもしろい！', 'omoshiroi', 'Fun!']
  ];
  const OOPS = [
    ['だいじょうぶですよ！', 'daijōbu desu yo', "It's okay!"], ['もういちど！', 'mō ichido', 'One more time!'], ['ちょっと…', 'chotto', 'A little off…'],
    ['いけませんね…', 'ikemasen ne', 'Oops, not quite.'], ['ごめんなさいね', 'gomennasai ne', 'Sorry, that one is tricky!']
  ];
  function cheer(ok) { const c = U.pick(ok ? CHEER : OOPS); return { jp: c[0], ro: c[1], en: c[2] }; }

  JP.UI = { $: $, $$: $$, K: K, KW: KW, KT: KT, tile: tile, sentenceHTML: sentenceHTML, speakBtn: speakBtn, toast: toast, confetti: confetti, modal: modal, closeModal: closeModal, ask: ask, cheer: cheer, colorOf: colorOf, ROLE_COLOR: ROLE_COLOR, ROLE_LABEL: ROLE_LABEL, esc: esc };
})(globalThis.JP = globalThis.JP || {});
