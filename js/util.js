/* ============================================================
   util.js - random numbers, shuffles, tiny English helpers
   Uses crypto randomness so every round really is different.
   ============================================================ */
(function (JP) {
  'use strict';
  function rand() {
    try {
      const a = new Uint32Array(1);
      (globalThis.crypto || window.crypto).getRandomValues(a);
      return a[0] / 4294967296;
    } catch (e) { return Math.random(); }
  }
  function randInt(n) { return Math.floor(rand() * n); }
  function pick(arr) { return arr[randInt(arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  function chance(p) { return rand() < p; }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function aAn(word) { return (/^[aeiou]/i.test(word) ? 'an ' : 'a ') + word; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function uniq(arr) { return arr.filter(function (x, i) { return arr.indexOf(x) === i; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  JP.U = { rand: rand, randInt: randInt, pick: pick, shuffle: shuffle, sample: sample, chance: chance, clamp: clamp, aAn: aAn, cap: cap, uniq: uniq, esc: esc };
})(globalThis.JP = globalThis.JP || {});
