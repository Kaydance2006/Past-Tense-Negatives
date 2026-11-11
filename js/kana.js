/* ============================================================
   kana.js - romaji conversion (Hepburn, macron style like the
   class slides), script detection, confusable kana for quizzes
   ============================================================ */
(function (JP) {
  'use strict';

  const BASE = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'o','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o'
  };
  // consonant part for contracted sounds (きゃ etc.)
  const YOON = { 'き':'ky','ぎ':'gy','し':'sh','じ':'j','ぢ':'j','ち':'ch','に':'ny','ひ':'hy','び':'by','ぴ':'py','み':'my','り':'ry' };
  const SMALL_Y = { 'ゃ':'a', 'ゅ':'u', 'ょ':'o' };
  // loanword combos: base + small vowel
  const FOREIGN = {
    'ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo',
    'てぃ':'ti','でぃ':'di','とぅ':'tu','どぅ':'du','でゅ':'dyu',
    'うぃ':'wi','うぇ':'we','うぉ':'wo',
    'しぇ':'she','ちぇ':'che','じぇ':'je','つぁ':'tsa','つぃ':'tsi','つぇ':'tse','つぉ':'tso',
    'いぇ':'ye','ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo'
  };
  const MACRON = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' };

  function toHira(s) {
    return s.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
  }

  function isVowelEnd(r) { return /[aiueo]$/.test(r); }

  /* Convert kana text to romaji. opts.particle = true for a single
     particle token (は -> wa, を -> o, へ -> e). */
  function romaji(text, opts) {
    opts = opts || {};
    if (!text) return '';
    if (opts.particle) {
      if (text === 'は') return 'wa';
      if (text === 'へ') return 'e';
      if (text === 'を') return 'o';
    }
    const s = toHira(text);
    const out = [];       // syllables
    let geminate = false;
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      const nx = s[i + 1];
      let syl = null;
      let used = 1;
      if (ch === 'っ') { geminate = true; i++; continue; }
      if (ch === 'ー') {
        if (out.length) {
          const prev = out[out.length - 1];
          const m = prev.match(/[aiueo]$/);
          if (m) out[out.length - 1] = prev.slice(0, -1) + MACRON[m[0]];
        }
        i++; continue;
      }
      if (ch === ' ' || ch === '　') { out.push(' '); geminate = false; i++; continue; }
      if (ch === '。' || ch === '、' || ch === '！' || ch === '？' || ch === '!' || ch === '?') { i++; continue; }
      if (ch === 'ん') {
        // n' before vowels / y so that "kon'ya" is not read "konya"
        syl = (nx && /[あいうえおやゆよ]/.test(nx)) ? "n'" : 'n';
      } else if (nx && SMALL_Y[nx] && YOON[ch]) {
        const c = YOON[ch];
        const v = SMALL_Y[nx];
        syl = (c === 'sh' || c === 'ch' || c === 'j') ? c + v : c + v;
        used = 2;
      } else if (nx && FOREIGN[ch + nx]) {
        syl = FOREIGN[ch + nx]; used = 2;
      } else if (BASE[ch]) {
        syl = BASE[ch];
      } else {
        syl = ch; // leave unknown characters (kanji, letters) alone
      }
      if (geminate) {
        if (/^ch/.test(syl)) syl = 't' + syl;
        else if (/^[a-z]/.test(syl) && !/^[aiueo]/.test(syl)) syl = syl[0] + syl;
        geminate = false;
      }
      // long vowels (hiragana style: おう, おお, うう, ええ, えい, ああ)
      if (out.length) {
        const prev = out[out.length - 1];
        const pv = prev.match(/([aeiou])$/);
        if (pv && syl.length === 1) {
          const p = pv[1];
          if ((p === 'o' && (syl === 'u' || syl === 'o')) ||
              (p === 'u' && syl === 'u') ||
              (p === 'a' && syl === 'a') ||
              (p === 'e' && (syl === 'i' || syl === 'e'))) {
            out[out.length - 1] = prev.slice(0, -1) + MACRON[p];
            i += used; continue;
          }
        }
      }
      out.push(syl);
      i += used;
    }
    return out.join('').replace(/\s+/g, ' ').trim();
  }

  /* 'hiragana' | 'katakana' | 'mixed' */
  function script(text) {
    let h = 0, k = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c >= 0x3041 && c <= 0x3096) h++;
      else if ((c >= 0x30A1 && c <= 0x30FA) || c === 0x30FC) k++;
    }
    if (h && k) return 'mixed';
    if (k) return 'katakana';
    return 'hiragana';
  }

  /* split into single kana characters (small ゃゅょっ and ー are their own tiles) */
  function chars(text) { return Array.from(text.replace(/\s+/g, '')); }

  /* Look-alike / sound-alike kana that kids really mix up */
  const CONFUSE = [
    'めぬ','わねれ','まも','はほ','るろ','さち','きさ','いり','こに','あお','おね','ぬの','たな','ふう','けは','ちら',
    'シツ','ソン','クケ','スヌ','ウワ','コユ','チテ','アマ','ノメ','ミニ','ヌメ','ナメ','ラフ','タク','フワ','ヤセ','ルレ'
  ];
  const HIRA_ROWS = ['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','やゆよ','らりるれろ','わをん','がぎぐげご','ざじずぜぞ','だでど','ばびぶべぼ','ぱぴぷぺぽ'];
  const KATA_ROWS = HIRA_ROWS.map(function (r) { return Array.from(r).map(function (c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); }).join(''); });

  function alike(ch, rng) {
    const out = [];
    CONFUSE.forEach(function (g) { if (g.indexOf(ch) >= 0) Array.from(g).forEach(function (c) { if (c !== ch) out.push(c); }); });
    const isK = script(ch) === 'katakana';
    (isK ? KATA_ROWS : HIRA_ROWS).forEach(function (row) {
      if (row.indexOf(ch) >= 0) Array.from(row).forEach(function (c) { if (c !== ch && out.indexOf(c) < 0) out.push(c); });
    });
    return out;
  }
  function allOf(sc) { return Array.from((sc === 'katakana' ? KATA_ROWS : HIRA_ROWS).join('')); }

  JP.Kana = { romaji: romaji, script: script, chars: chars, alike: alike, allOf: allOf, toHira: toHira };
  // Romaji for a word record (honours overrides) – spaces are kept
  JP.ro = function (w) { return w.roOverride || romaji(w.kana); };
})(globalThis.JP = globalThis.JP || {});
