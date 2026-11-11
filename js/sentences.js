/* ============================================================
   sentences.js - builds Japanese sentences (as tiles) + English
   Every sentence = units (chunks) in order; the verb/predicate
   unit is always last.  Tokens carry romaji and a role so the
   UI can colour particles & parts of the sentence.
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U, W = JP.WORD, V = JP.VERBS;

  /* ---------- The four forms from the class guide ---------- */
  const FORMS = ['pres', 'presNeg', 'past', 'pastNeg'];
  const ENDINGS = {
    act:   { pres: 'ます',  presNeg: 'ません',        past: 'ました', pastNeg: 'ませんでした' },
    thing: { pres: 'です',  presNeg: 'じゃないです',  past: 'でした', pastNeg: 'じゃなかったです' }
  };
  const ENDING_RO = {
    'ます': 'masu', 'ません': 'masen', 'ました': 'mashita', 'ませんでした': 'masen deshita',
    'です': 'desu', 'じゃないです': 'ja nai desu', 'でした': 'deshita', 'じゃなかったです': 'ja nakatta desu',
    'じゃ': 'ja', 'ない': 'nai', 'なかった': 'nakatta'
  };
  const FORM_INFO = {
    pres:    { yes: true,  past: false, label: 'Now · Yes', en: 'is / does' },
    presNeg: { yes: false, past: false, label: 'Now · No',  en: "isn't / doesn't" },
    past:    { yes: true,  past: true,  label: 'Before · Yes', en: 'was / did' },
    pastNeg: { yes: false, past: true,  label: 'Before · No',  en: "wasn't / didn't" }
  };

  /* ---------- Subjects ---------- */
  const PEOPLE = ['watashi', 'tomodachi', 'sensei', 'okaasan', 'otousan', 'oniisan', 'oneesan', 'ojiisan', 'obaasan'];
  const SUBJ_ALL = PEOPLE.concat(['tsuma', 'musuko', 'musume', 'kodomo', 'tenin', 'joushi', 'shachou', 'baatendaa', 'isha', 'kokku', 'pairotto', 'kashu', 'keisatsukan', 'shoubouji', 'gakusei', 'daigakusei']);

  /* ---------- Action frames ---------- */
  const EAT = ['gohan', 'pan', 'tamago', 'sakana', 'niku', 'yasai', 'ringo', 'banana', 'ichigo', 'keki', 'aisu', 'piza', 'sandoicchi', 'ramen', 'sushi', 'karee', 'sarada', 'shiriaru', 'onigiri', 'kukkii', 'choko', 'chiizu', 'asagohan', 'hirugohan', 'bangohan'];
  const DRINK = ['mizu', 'ocha', 'juusu', 'miruku', 'koohii'];
  const BUY = ['hon', 'nooto', 'enpitsu', 'kaban', 'jisho', 'fuku', 'kutsu', 'boushi', 'kasa', 'tokei', 'megane', 'omocha', 'purezento', 'saifu', 'keki', 'pan', 'ringo', 'banana', 'piza'];
  const GIFT = ['purezento', 'keki', 'hon', 'omocha', 'kutsu', 'boushi', 'tokei', 'kasa', 'saifu', 'kukkii', 'choko'];
  const RELATIVES = ['tomodachi', 'okaasan', 'otousan', 'sensei', 'oniisan', 'oneesan', 'ojiisan', 'obaasan', 'musuko', 'musume', 'kodomo', 'akachan'];
  const ZOO = ['inu', 'neko', 'zou', 'raion', 'panda', 'pengin', 'kirin', 'saru', 'tora', 'kuma', 'usagi', 'uma'];
  const DEST = ['gakkou', 'eki', 'kouen', 'mise', 'shoppingu', 'byouin', 'hoteru', 'umi', 'yama', 'resutoran', 'doubutsuen', 'paatii', 'kekkonshiki', 'omatsuri', 'konsaato', 'kaigi', 'gogaku', 'nihon'];
  const VEHICLE = ['densha', 'basu', 'kuruma', 'jitensha', 'hikouki', 'takushii', 'chikatetsu', 'fune'];

  // v = verb key. Slots: obj (list) + p (particle), place (で), dest, recip (に), with (と)
  const ACT = [
    { v: 'taberu', obj: EAT, p: 'を', place: ['uchi', 'resutoran', 'gakkou', 'kouen'], optPlace: true },
    { v: 'nomu', obj: DRINK, p: 'を', place: ['uchi', 'resutoran'], optPlace: true },
    { v: 'yomu', obj: ['hon', 'jisho', 'tegami'], p: 'を', own: true, place: ['gakkou', 'uchi', 'kouen'], optPlace: true },
    { v: 'kaku', obj: ['tegami'], p: 'を', place: ['gakkou', 'uchi'], optPlace: true },
    { v: 'kaku', obj: ['e'], p: 'を', place: ['gakkou', 'uchi', 'kouen'], optPlace: true, enV: { b: 'draw', s: 'draws', p: 'drew' } },
    { v: 'miru', obj: ['terebi', 'eiga', 'dorama'], p: 'を', place: ['uchi'], optPlace: true },
    { v: 'miru', obj: ['hanabi'], p: 'を', place: ['umi', 'kouen'], optPlace: true },
    { v: 'miru', obj: ZOO, p: 'を', place: ['doubutsuen'], enV: { b: 'see', s: 'sees', p: 'saw' } },
    { v: 'kiku', obj: ['ongaku', 'uta'], p: 'を', place: ['uchi', 'gakkou', 'konsaato'], optPlace: true },
    { v: 'hiku', obj: ['piano', 'gitaa'], p: 'を', place: ['uchi', 'gakkou', 'paatii'], optPlace: true },
    { v: 'kau', obj: BUY, p: 'を', place: ['mise', 'shoppingu'], optPlace: true },
    { v: 'suru', obj: ['sakkaa', 'yakyuu', 'tenisu', 'basuketto'], p: 'を', place: ['kouen', 'gakkou'], optPlace: true },
    { v: 'suru', obj: ['geemu', 'shukudai'], p: 'を', place: ['uchi', 'gakkou'], optPlace: true },
    { v: 'suru', obj: ['suiei', 'tsuri'], p: 'を', place: ['umi'], optPlace: true },
    { v: 'suru', obj: ['pikunikku'], p: 'を', place: ['kouen', 'yama'], optPlace: true },
    { v: 'suru', obj: ['dansu'], p: 'を', place: ['gakkou', 'paatii'], optPlace: true },
    { v: 'benkyou', obj: ['nihongo', 'eigo', 'sansuu', 'rekishi'], p: 'を', place: ['gakkou', 'uchi'], optPlace: true },
    { v: 'benkyou', obj: null, place: ['gakkou', 'uchi', 'gogaku'], optPlace: true },
    { v: 'hanasu', obj: ['nihongo', 'eigo'], p: 'を', with: ['tomodachi', 'sensei', 'okaasan', 'oneesan'], place: ['gakkou', 'uchi'], optPlace: true },
    { v: 'utau', obj: ['uta'], p: 'を', place: ['gakkou', 'paatii', 'konsaato', 'uchi'], optPlace: true },
    { v: 'odoru', obj: null, place: ['paatii', 'omatsuri', 'gakkou'] },
    { v: 'asobu', obj: null, with: ['tomodachi', 'okaasan', 'otousan', 'oniisan', 'oneesan'], place: ['kouen', 'uchi', 'umi', 'yama'] },
    { v: 'au', obj: ['tomodachi', 'sensei', 'ojiisan', 'obaasan', 'oniisan', 'oneesan'], p: 'に', place: ['eki', 'kouen', 'mise', 'paatii'], optPlace: true },
    { v: 'ageru', obj: GIFT, p: 'を', recip: RELATIVES, subj: ['watashi', 'sensei', 'okaasan', 'otousan', 'tomodachi', 'oniisan', 'oneesan'] },
    { v: 'oshieru', obj: ['nihongo', 'eigo', 'sansuu', 'piano'], p: 'を', recip: ['tomodachi', 'kodomo', 'musuko', 'musume'], subj: ['sensei', 'watashi', 'okaasan', 'otousan', 'oneesan'] },
    { v: 'tsukuru', obj: ['keki', 'karee', 'sarada', 'sandoicchi', 'onigiri', 'kukkii', 'piza', 'sushi', 'ramen', 'asagohan', 'bangohan', 'hirugohan'], p: 'を', place: ['uchi', 'resutoran'], optPlace: true },
    { v: 'iku', dest: DEST, p: 'に', alt: 'へ' },
    { v: 'kaeru', dest: ['uchi', 'hoteru'], p: 'に', alt: 'へ' },
    { v: 'noru', dest: VEHICLE, p: 'に' },
    { v: 'matsu', obj: ['basu'], p: 'を', place: ['basutei'] },
    { v: 'matsu', obj: ['densha', 'chikatetsu'], p: 'を', place: ['eki'] },
    { v: 'matsu', obj: ['takushii'], p: 'を', place: ['eki', 'hoteru'] },
    { v: 'neru', obj: null, place: ['uchi', 'hoteru'], optPlace: true },
    { v: 'oyogu', obj: null, place: ['umi'] },
    // job-specific workplaces
    { v: 'hataraku', obj: null, jobs: { tenin: ['mise', 'shoppingu'], isha: ['byouin'], kokku: ['resutoran'], baatendaa: ['resutoran'], keisatsukan: ['eki'], kashu: ['konsaato'], pairotto: ['hikouki'], sensei: ['gakkou'] } },
    // animals (subject is fixed)
    { v: 'taberu', animals: [['neko', 'sakana'], ['inu', 'niku'], ['usagi', 'yasai'], ['saru', 'banana'], ['uma', 'ringo'], ['zou', 'banana'], ['kuma', 'sakana'], ['pengin', 'sakana'], ['raion', 'niku'], ['panda', 'take'], ['ushi', 'kusa'], ['hitsuji', 'kusa'], ['uma', 'kusa'], ['buta', 'yasai'], ['tora', 'niku'], ['nezumi', 'chiizu'], ['kame', 'yasai'], ['hebi', 'tamago']], p: 'を' },
    { v: 'asobu', animals: [['inu', null, 'kouen'], ['saru', null, 'yama'], ['usagi', null, 'kouen'], ['neko', null, 'uchi']] },
    { v: 'neru', animals: [['neko', null, 'uchi'], ['inu', null, 'uchi'], ['kuma', null, 'yama'], ['buta', null, 'uchi']] },
    { v: 'oyogu', animals: [['pengin', null, 'umi'], ['kame', null, 'umi']] },
    { v: 'iku', animals: [['kuma', 'yama'], ['inu', 'kouen'], ['usagi', 'yama'], ['neko', 'uchi']], dest: true, p: 'に', alt: 'へ' }
  ];

  /* ---------- Likes / skills ---------- */
  const LIKE_OBJ = ['piza', 'keki', 'ramen', 'sushi', 'karee', 'aisu', 'ichigo', 'choko', 'kukkii', 'ringo', 'banana', 'neko', 'inu', 'usagi', 'panda', 'pengin', 'zou', 'raion', 'saru', 'sakkaa', 'yakyuu', 'tenisu', 'geemu', 'eiga', 'ongaku', 'dorama', 'piano', 'gitaa', 'dansu', 'pikunikku', 'tsuri', 'suiei', 'nihongo', 'eigo', 'sansuu', 'rekishi', 'omocha', 'kutsu', 'tokei', 'purezento', 'terebi', 'halloween', 'kurisumasu', 'hanabi', 'omatsuri', 'sarada', 'yasai', 'pan', 'gohan'];
  const SKILL_OBJ = ['sakkaa', 'yakyuu', 'tenisu', 'basuketto', 'piano', 'gitaa', 'suiei', 'tsuri', 'nihongo', 'eigo', 'sansuu', 'geemu'];
  const LIKE_PRED = {
    daisuki: { kana: 'だいすき', v: { b: 'love', s: 'loves', p: 'loved' }, be: false },
    suki:    { kana: 'すき', v: { b: 'like', s: 'likes', p: 'liked' }, be: false },
    jouzu:   { kana: 'じょうず', be: true, phrase: 'good at' },
    heta:    { kana: 'へた', be: true, phrase: 'bad at' }
  };

  /* ---------- Adjective pairs (subject, adjective) ---------- */
  const ADJ_PAIRS = [
    ['neko', 'kawaii'], ['inu', 'kawaii'], ['usagi', 'kawaii'], ['pengin', 'kawaii'], ['panda', 'ninki'], ['zou', 'ookii'], ['kirin', 'ookii'], ['nezumi', 'chiisai'],
    ['raion', 'kakkoii'], ['tora', 'kakkoii'], ['uma', 'hayai'], ['kuma', 'tsuyoi'], ['kame', 'chiisai'], ['saru', 'omoshiroi'], ['buta', 'kawaii'],
    ['keki', 'oishii'], ['ramen', 'oishii'], ['sushi', 'oishii'], ['aisu', 'oishii'], ['karee', 'oishii'], ['ringo', 'oishii'], ['ichigo', 'oishii'], ['piza', 'ninki'], ['kukkii', 'oishii'],
    ['koohii', 'atsui'], ['aisu', 'samui'], ['juusu', 'oishii'],
    ['tesuto', 'taihen'], ['shigoto', 'taihen'], ['shukudai', 'taihen'], ['happyou', 'taihen'], ['kaigi', 'taihen'], ['sansuu', 'taihen'],
    ['dorama', 'omoshiroi'], ['eiga', 'omoshiroi'], ['geemu', 'omoshiroi'], ['hon', 'omoshiroi'], ['uta', 'omoshiroi'],
    ['sakkaa', 'tanoshii'], ['paatii', 'tanoshii'], ['omatsuri', 'tanoshii'], ['pikunikku', 'tanoshii'], ['konsaato', 'tanoshii'], ['tanjoubi', 'tanoshii'], ['dansu', 'tanoshii'],
    ['waribiki', 'ureshii'], ['purezento', 'ureshii'], ['kurisumasu', 'tanoshii'],
    ['pairotto', 'kakkoii'], ['keisatsukan', 'kakkoii'], ['shoubouji', 'kakkoii'], ['kashu', 'sugoi'], ['kokku', 'sugoi'], ['isha', 'sugoi'], ['ikemen', 'ninki'],
    ['hikouki', 'hayai'], ['densha', 'hayai'], ['kuruma', 'hayai'], ['jitensha', 'tanoshii'], ['basu', 'ookii'], ['yama', 'ookii'], ['umi', 'ookii'], ['kasa', 'chiisai'], ['kaban', 'ookii'], ['tokei', 'chiisai'],
    ['ojiisan', 'tsuyoi'], ['oniisan', 'kakkoii'], ['oneesan', 'sugoi'], ['akachan', 'kawaii'], ['musume', 'kawaii'], ['musuko', 'tsuyoi'], ['okaasan', 'sugoi'], ['otousan', 'tsuyoi']
  ];

  /* ---------- "X is Y" frames ---------- */
  const JOB_PRED = ['sensei', 'gakusei', 'daigakusei', 'tenin', 'isha', 'kokku', 'pairotto', 'kashu', 'keisatsukan', 'shoubouji', 'baatendaa', 'joushi', 'shachou'];
  const MEALS = ['asagohan', 'hirugohan', 'bangohan'];
  const MEAL_PRED = ['shiriaru', 'pan', 'gohan', 'sarada', 'karee', 'ramen', 'piza', 'sushi', 'sandoicchi', 'onigiri'];
  const DAYS_IS = { kinou: 'past', senshuu: 'past', kyou: 'pres', ashita: 'pres', raishuu: 'pres', shuumatsu: 'any' };
  const DAY_PRED = ['yasumi', 'shigoto', 'tanjoubi', 'paatii', 'kaigi', 'happyou', 'tesuto', 'konsaato', 'omatsuri', 'kekkonshiki', 'gogaku'];
  const OWN_ITEMS = ['hon', 'kaban', 'nooto', 'enpitsu', 'kasa', 'boushi', 'tokei', 'saifu', 'jitensha', 'kuruma', 'omocha', 'jisho'];
  const OWNERS = ['watashi', 'tomodachi', 'sensei', 'okaasan', 'otousan', 'oniisan', 'oneesan'];
  const JP_ITEMS = ['dorama', 'eiga', 'hon', 'uta'];

  const TIMES = JP.WORDS.filter(function (w) { return w.kind === 'time'; });
  const TIME_BY = { past: TIMES.filter(function (w) { return w.time === 'past'; }), pres: TIMES.filter(function (w) { return w.time === 'pres'; }), fut: TIMES.filter(function (w) { return w.time === 'fut'; }) };

  /* ---------- Token helpers ---------- */
  let TOKID = 0;
  function tok(t, role, extra) {
    const o = { id: ++TOKID, t: t, role: role, ro: '' };
    if (role === 'particle') { o.ro = JP.Kana.romaji(t, { particle: true }); o.p = t; }
    else if (ENDING_RO[t]) o.ro = ENDING_RO[t];
    else o.ro = JP.Kana.romaji(t);
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function wtok(id, role) { const w = W[id]; const o = tok(w.kana, role, { wid: id }); o.ro = JP.ro(w); return o; }
  function unit(kind, tokens) { return { kind: kind, tokens: tokens }; }
  function nounUnit(kind, id, particle) { return unit(kind, [wtok(id, kind), tok(particle, 'particle', { of: kind })]); }

  /* ---------- English helpers ---------- */
  function pluralize(en) {
    if (/(s|x|z|ch|sh)$/.test(en)) return en + 'es';
    if (/[^aeiou]y$/.test(en)) return en.slice(0, -1) + 'ies';
    return en + 's';
  }
  function npObj(id) {
    const w = W[id];
    if (w.ref) return w.ref;
    if (w.art === 'a') return U.aAn(w.en);
    if (w.art === 'an') return 'an ' + w.en;
    if (w.art === 'the') return 'the ' + w.en;
    return w.en;
  }
  function npSubj(id) {
    const w = W[id];
    if (w.ref) return w.ref;
    if (w.art) return 'the ' + w.en;
    return w.en;
  }
  function npPred(id) {
    const w = W[id];
    if (w.prd) return w.prd;
    if (w.art === 'a' || w.art === 'an') return U.aAn(w.en);
    if (w.art === 'the') return 'the ' + w.en;
    return w.en;
  }
  function npLike(id) {
    const w = W[id];
    if (!w.art) return w.en;
    if (w.art === 'the') return 'the ' + w.en;
    return w.pl || pluralize(w.en);
  }
  function possOf(id) { const w = W[id]; return w.poss || ("the " + w.en + "'s"); }
  function atOf(id) { const w = W[id]; return w.at || ('at the ' + w.en); }
  function toOf(id) { const w = W[id]; return w.to || ('to the ' + w.en); }
  function isThird(subjId) { return subjId !== 'watashi'; }
  function beForm(subjId, past, neg) {
    if (past) return neg ? "wasn't" : 'was';
    if (subjId === 'watashi') return neg ? 'am not' : 'am';
    return neg ? "isn't" : 'is';
  }
  function vgroup(vf, third, form, fut) {
    switch (form) {
      case 'pres':    return fut ? 'will ' + vf.b : (third ? vf.s : vf.b);
      case 'presNeg': return fut ? "won't " + vf.b : (third ? "doesn't " : "don't ") + vf.b;
      case 'past':    return vf.p;
      default:        return "didn't " + vf.b;
    }
  }

  /* ---------- Random selection with subject focus ---------- */
  function inter(list, S) { return S ? list.filter(function (x) { return S.has(x) || (W[x] && S.has(W[x].id)); }) : []; }
  function choose(list, ctx, bias) {
    if (!list || !list.length) return null;
    if (ctx.S && bias !== false) {
      const i = inter(list, ctx.S);
      if (i.length && U.chance(0.85)) return U.pick(i);
    }
    return U.pick(list);
  }
  function pickSubject(ctx, restrict, avoid) {
    let pool = restrict || null;
    let cand;
    if (ctx.S) {
      const i = inter(pool || SUBJ_ALL, ctx.S);
      if (i.length && U.chance(0.9)) cand = i;
    }
    if (!cand) cand = pool || PEOPLE;
    const no = (avoid || []).concat(ctx.notSubj || []);
    cand = cand.filter(function (x) { return no.indexOf(x) < 0; });
    if (!cand.length) cand = (pool || PEOPLE).filter(function (x) { return no.indexOf(x) < 0; });
    // I (watashi) shows up often – it is the most useful subject
    if (!restrict && !ctx.S && U.chance(0.3) && no.indexOf('watashi') < 0) return 'watashi';
    return U.pick(cand);
  }
  function chooseTime(form, ctx) {
    const past = FORM_INFO[form].past;
    const pool = past ? TIME_BY.past : TIME_BY.pres.concat(TIME_BY.fut);
    if (ctx.S) {
      const i = pool.filter(function (w) { return ctx.S.has(w.id); });
      if (i.length) return U.pick(i);
    }
    return U.pick(pool);
  }

  /* ---------- Sentence assembly ---------- */
  function finish(spec) {
    // spec: { units[], en, family, form, used[], verb? }
    const units = spec.units.map(function (u, i) {
      u.id = i;
      u.tokens.forEach(function (t, k) { t.unit = i; t.idx = k; });
      return u;
    });
    const tokens = [];
    units.forEach(function (u) { u.tokens.forEach(function (t) { tokens.push(t); }); });
    const worlds = U.uniq(spec.used.map(function (id) { return W[id] ? W[id].world : null; }).filter(Boolean));
    const emojis = U.uniq(spec.used.map(function (id) { return W[id] && W[id].kind !== 'time' ? W[id].emoji : null; }).filter(Boolean)).slice(0, 4);
    const kana = tokens.map(function (t) { return t.t; }).join('');
    return {
      units: units, tokens: tokens, verbUnit: units.length - 1, en: spec.en, family: spec.family, form: spec.form,
      used: spec.used, worlds: worlds, emojis: emojis, kana: kana, key: 's|' + kana + '|' + spec.form,
      kind: spec.kind, verbKey: spec.verbKey || null, qen: spec.qen || '', particles: tokens.filter(function (t) { return t.role === 'particle'; })
    };
  }
  function endTok(family, form) { return tok(ENDINGS[family][form], 'end'); }
  function stemTok(kana, role) { return tok(kana, role || 'verb'); }

  function timeUnit(tw) { return unit('time', [wtok(tw.id, 'time')]); }
  function enSentence(parts, time) {
    let s = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (time) s = time + ', ' + s;
    s = U.cap(s);
    return s + '.';
  }

  /* ----- ACT ----- */
  function buildAct(fr, form, ctx) {
    const info = FORM_INFO[form];
    const v = V[fr.v];
    let subj, obj = null, place = null, withId = null, recip = null, dest = null, owner = null, animalPlace = null;
    const used = ['v_' + fr.v];

    if (fr.animals) {
      const a = U.pick(ctx.S ? (fr.animals.filter(function (x) { return inter(x.filter(Boolean), ctx.S).length; }).length ? fr.animals.filter(function (x) { return inter(x.filter(Boolean), ctx.S).length; }) : fr.animals) : fr.animals);
      subj = a[0];
      if (fr.dest) dest = a[1]; else if (a[1] && fr.p) obj = a[1];
      if (a[2]) place = a[2];
      if (fr.v === 'taberu' && W[subj] && ['panda', 'zou', 'raion', 'kirin', 'saru', 'kuma', 'tora', 'pengin'].indexOf(subj) >= 0 && U.chance(0.3)) place = 'doubutsuen';
    } else if (fr.jobs) {
      const keys = Object.keys(fr.jobs);
      subj = pickSubject(ctx, keys);
      place = U.pick(fr.jobs[subj]);
    } else {
      subj = pickSubject(ctx, fr.subj || null);
      const avoid = [subj];
      if (fr.obj) obj = choose(fr.obj.filter(function (x) { return avoid.indexOf(x) < 0; }), ctx);
      if (fr.dest) dest = choose(fr.dest, ctx);
      if (fr.recip) recip = choose(fr.recip.filter(function (x) { return x !== subj; }), ctx);
      if (fr.with) withId = choose(fr.with.filter(function (x) { return x !== subj; }), ctx);
      if (fr.place && (!fr.optPlace || U.chance(0.6))) place = choose(fr.place, ctx);
      if (fr.own && obj && U.chance(0.45)) owner = U.pick(OWNERS.filter(function (x) { return x !== subj; }));
    }
    // guard: matching verb/object pairs for matsu, see frames
    used.push(subj);
    [obj, place, withId, recip, dest, owner].forEach(function (x) { if (x) used.push(x); });

    // time word
    let tw = null;
    if (!ctx.noTime && (U.chance(info.past ? 0.7 : 0.45) || (ctx.S && TIMES.some(function (w) { return ctx.S.has(w.id); }) && U.chance(0.8)))) {
      tw = chooseTime(form, ctx); used.push(tw.id);
    }
    const fut = !!tw && tw.time === 'fut' && !info.past;

    // Japanese units
    const units = [];
    if (tw) units.push(timeUnit(tw));
    units.push(nounUnit('subj', subj, 'は'));
    if (withId) units.push(nounUnit('with', withId, 'と'));
    if (place) units.push(nounUnit('place', place, 'で'));
    if (recip) units.push(nounUnit('recip', recip, 'に'));
    if (obj) {
      if (owner) units.push(unit('obj', [wtok(owner, 'own'), tok('の', 'particle', { of: 'own' }), wtok(obj, 'obj'), tok(fr.p, 'particle', { of: 'obj' })]));
      else units.push(nounUnit(fr.v === 'au' ? 'meet' : (fr.p === 'に' ? 'recip' : 'obj'), obj, fr.p));
    }
    if (dest) {
      const p = (fr.alt && U.chance(0.3)) ? fr.alt : fr.p;
      units.push(nounUnit(fr.v === 'noru' ? 'ride' : 'dest', dest, p));
    }
    units.push(unit('verb', [stemTok(v.stem), endTok('act', form)]));

    // English
    let vf = fr.enV || v.eng;
    if (fr.v === 'suru' && obj && W[obj].suru) vf = W[obj].suru;
    const third = isThird(subj);
    const group = vgroup(vf, third, form, fut);
    const rest = [];
    if (obj && !(fr.v === 'suru' && W[obj].suru)) {
      if (owner) rest.push(possOf(owner) + ' ' + W[obj].en); else rest.push(npObj(obj));
    }
    if (recip) rest.push('to ' + npObj(recip));
    if (dest) rest.push(fr.v === 'noru' ? npObj(dest) : toOf(dest));
    if (withId) rest.push('with ' + npObj(withId));
    if (place) rest.push(atOf(place));
    const en = enSentence([npSubj(subj), group].concat(rest), tw ? tw.en2 : '');
    const qen = U.cap(('did ' + npSubj(subj) + ' ' + vf.b + ' ' + rest.join(' ')).replace(/\s+/g, ' ').trim()) + '?';
    return finish({ units: units, en: en, family: 'act', form: form, used: used, kind: 'act', verbKey: fr.v, qen: qen });
  }

  /* ----- LIKE (が すき / だいすき / じょうず / へた) ----- */
  function buildLike(form, ctx, predKey) {
    const pk = predKey || U.pick(Object.keys(LIKE_PRED));
    const pr = LIKE_PRED[pk];
    const objList = pr.be ? SKILL_OBJ : LIKE_OBJ;
    const subj = pickSubject(ctx);
    const obj = choose(objList, ctx);
    const used = [subj, obj, pk];
    const tw = null; // preferences are not tied to a time word
    const units = [];
    units.push(nounUnit('subj', subj, 'は'));
    units.push(nounUnit('obj', obj, 'が'));
    units[units.length - 1].tokens[1].of = 'ga';
    units.push(unit('verb', [tok(pr.kana, 'pred', { wid: pk }), endTok('thing', form)]));
    const info = FORM_INFO[form];
    const third = isThird(subj);
    let core;
    if (pr.be) {
      core = [npSubj(subj), beForm(subj, info.past, !info.yes), pr.phrase, npLike(obj)];
    } else {
      core = [npSubj(subj), vgroup(pr.v, third, form, false), npLike(obj)];
    }
    const qen = pr.be ? U.cap(beForm(subj, true, false) + ' ' + npSubj(subj) + ' ' + pr.phrase + ' ' + npLike(obj)) + '?'
                      : U.cap('did ' + npSubj(subj) + ' ' + pr.v.b + ' ' + npLike(obj)) + '?';
    return finish({ units: units, en: enSentence(core, tw ? tw.en2 : ''), family: 'thing', form: form, used: used, kind: 'like', qen: qen });
  }

  /* ----- ADJECTIVE (X は とても Y です) – present only ----- */
  function buildAdj(ctx) {
    let pairs = ADJ_PAIRS;
    if (ctx.S) { const i = ADJ_PAIRS.filter(function (p) { return ctx.S.has(p[0]) || ctx.S.has(p[1]); }); if (i.length) pairs = i; }
    const pr = U.pick(pairs);
    const subj = pr[0], adj = pr[1];
    const very = U.chance(0.5);
    const units = [nounUnit('subj', subj, 'は')];
    if (very) units.push(unit('adv', [wtok('totemo', 'adv')]));
    units.push(unit('verb', [wtok(adj, 'pred'), endTok('thing', 'pres')]));
    const parts = [npSubj(subj), beForm(subj, false, false), very ? 'very' : '', W[adj].adj || W[adj].en];
    const used = [subj, adj].concat(very ? ['totemo'] : []);
    return finish({ units: units, en: enSentence(parts, ''), family: 'thing', form: 'pres', used: used, kind: 'adj' });
  }

  /* ----- IS frames (X は Y です / でした / じゃなかったです) ----- */
  function allowedFormsForDay(day) {
    const t = DAYS_IS[day];
    if (t === 'past') return ['past', 'pastNeg'];
    if (t === 'pres') return ['pres', 'presNeg'];
    return FORMS;
  }
  function buildIs(form, ctx, forceKind) {
    const kinds = ['job', 'meal', 'day', 'owner', 'nation'];
    let kind = forceKind || U.pick(kinds);
    const info = FORM_INFO[form];
    let subjUnit, predTokens, subjEn, predEn, used = [], subjId = null;
    if (kind === 'job') {
      subjId = pickSubject(ctx, PEOPLE.concat(['tsuma', 'musuko', 'musume']));
      let pred = choose(JOB_PRED, ctx);
      if (pred === subjId) pred = 'gakusei';
      subjUnit = nounUnit('subj', subjId, 'は');
      predTokens = [wtok(pred, 'pred')];
      subjEn = npSubj(subjId); predEn = npPred(pred); used = [subjId, pred];
    } else if (kind === 'meal') {
      const m = choose(MEALS, ctx), f = choose(MEAL_PRED, ctx);
      subjUnit = nounUnit('subj', m, 'は'); predTokens = [wtok(f, 'pred')];
      subjEn = U.cap(W[m].en); predEn = npObj(f); used = [m, f];
    } else if (kind === 'day') {
      let day = choose(Object.keys(DAYS_IS), ctx);
      const pred = choose(DAY_PRED, ctx);
      if (allowedFormsForDay(day).indexOf(form) < 0) day = FORM_INFO[form].past ? 'kinou' : 'ashita';
      subjUnit = nounUnit('subj', day, 'は'); predTokens = [wtok(pred, 'pred')];
      subjEn = W[day].en2 || U.cap(W[day].en); predEn = npPred(pred); used = [day, pred];
      if (day === 'shuumatsu') { subjEn = 'The weekend'; }
      if (day === 'senshuu') subjEn = 'Last week';
      if (day === 'raishuu') subjEn = 'Next week';
    } else if (kind === 'owner') {
      const dem = U.pick(['kore', 'sore']);
      const owner = choose(OWNERS, ctx), item = choose(OWN_ITEMS, ctx);
      subjUnit = nounUnit('subj', dem, 'は');
      predTokens = [wtok(owner, 'own'), tok('の', 'particle', { of: 'own' }), wtok(item, 'pred')];
      subjEn = dem === 'kore' ? 'This' : 'That';
      predEn = possOf(owner) + ' ' + W[item].en; used = [dem, owner, item];
      if (owner === 'watashi') predEn = 'my ' + W[item].en;
    } else {
      const item = choose(JP_ITEMS, ctx);
      const dem = U.pick(['kore', 'sore']);
      subjUnit = nounUnit('subj', dem, 'は');
      predTokens = [wtok('nihon', 'own'), tok('の', 'particle', { of: 'own' }), wtok(item, 'pred')];
      subjEn = dem === 'kore' ? 'This' : 'That';
      predEn = U.aAn('Japanese ' + W[item].en); used = [dem, 'nihon', item];
    }
    const units = [subjUnit, unit('verb', predTokens.concat([endTok('thing', form)]))];
    const be = (subjId && isThird(subjId) === false) ? beForm('watashi', info.past, !info.yes) : beForm('x', info.past, !info.yes);
    const plural = false;
    const en = enSentence([subjEn, be, predEn], '');
    // is-frames never add a separate time word (the day IS the subject)
    const lower = subjEn.replace(/^(The|This|That|Breakfast|Lunch|Dinner|Yesterday|Tomorrow|Today|Last|Next)\b/, function (m) { return m.toLowerCase(); });
    const qen = U.cap('was ' + lower.replace(/^My\b/, 'my') + ' ' + predEn) + '?';
    const s = finish({ units: units, en: en, family: 'thing', form: form, used: used, kind: 'is', qen: qen });
    return s;
  }

  /* ---------- Public API ---------- */
  function makeCtx(worldId) {
    let S = null;
    if (worldId && worldId.indexOf('w:') === 0) { S = new Set([worldId.slice(2)]); }
    else if (worldId && worldId !== 'all') {
      const set = new Set();
      JP.wordsOf(worldId).forEach(function (w) { set.add(w.id); });
      S = set;
    }
    return { S: S, world: worldId };
  }
  function touches(sent, ctx) {
    if (!ctx.S) return true;
    return sent.used.some(function (id) { return ctx.S.has(id); });
  }
  function sentenceFits(sent, opts) {
    if (opts.forms && opts.forms.indexOf(sent.form) < 0) return false;
    if (opts.kinds && opts.kinds.indexOf(sent.kind) < 0) return false;
    if (opts.family && sent.family !== opts.family) return false;
    return true;
  }

  function generate(worldId, opts) {
    opts = opts || {};
    const ctx = makeCtx(worldId);
    ctx.noTime = !!opts.noTime; ctx.notSubj = opts.notSubj || [];
    const formsPool = opts.forms || FORMS;
    for (let tries = 0; tries < 400; tries++) {
      const form = U.pick(formsPool);
      const r = U.rand();
      let s = null;
      try {
        if (r < 0.58) {
          let frames = ACT;
          if (opts.verbKey) frames = frames.filter(function (f) { return f.v === opts.verbKey; });
          if (!frames.length) continue;
          const fr = U.pick(frames);
          s = buildAct(fr, form, ctx);
        } else if (r < 0.70) { if (opts.verbKey) continue; s = buildLike(form, ctx); }
        else if (r < 0.80) { if (opts.verbKey) continue; s = buildAdj(ctx); }
        else { if (opts.verbKey) continue; s = buildIs(form, ctx); }
      } catch (e) { continue; }
      if (!s) continue;
      if (!touches(s, ctx)) continue;
      if (!sentenceFits(s, opts)) continue;
      if (opts.avoid && opts.avoid[s.key]) continue;
      return s;
    }
    // last resort – ignore the subject filter
    return buildAct(U.pick(ACT.filter(function (f) { return !f.animals && !f.jobs; })), U.pick(formsPool), { S: null, noTime: ctx.noTime, notSubj: ctx.notSubj });
  }

  /* Return up to n different sentences (dedup by key) */
  function candidates(worldId, n, opts) {
    opts = opts || {};
    const seen = {}, out = [];
    let guard = 0;
    while (out.length < n && guard++ < n * 6) {
      const s = generate(worldId, opts);
      if (seen[s.key]) continue;
      seen[s.key] = 1; out.push(s);
    }
    return out;
  }

  /* A sentence about a verb (for study cards) */
  function exampleFor(vkey, form) {
    const f = form || 'pres';
    for (let i = 0; i < 60; i++) {
      const s = generate('all', { verbKey: vkey, forms: [f], kinds: ['act'] });
      if (s && s.verbKey === vkey) return s;
    }
    return null;
  }

  /* Distractor tiles for the sentence builder (level 0-3) */
  function distractors(sent, level) {
    if (!level) return [];
    const out = [];
    const usedP = {};
    sent.tokens.forEach(function (t) { if (t.role === 'particle') usedP[t.t] = 1; });
    const avoidPair = {};
    if (usedP['に']) avoidPair['へ'] = 1;
    if (usedP['へ']) avoidPair['に'] = 1;
    const parts = Object.keys(JP.PARTICLES).filter(function (p) { return !usedP[p] && !avoidPair[p]; });
    const nP = level >= 3 ? 2 : 1;
    U.sample(parts, nP).forEach(function (p) { out.push(tok(p, 'particle', { distractor: true })); });
    // wrong ending (wrong family / wrong tense) – the classic mix-up from the guide
    const other = sent.family === 'act' ? 'thing' : 'act';
    const wrongEnds = [ENDINGS[other][sent.form], ENDINGS[sent.family][U.pick(FORMS.filter(function (f) { return f !== sent.form; }))]];
    out.push(tok(U.pick(wrongEnds), 'end', { distractor: true }));
    if (level >= 3) {
      // an extra noun from the same subject
      const w = sent.worlds[0];
      const have = {}; sent.tokens.forEach(function (t) { if (t.wid) have[t.wid] = 1; });
      const pool = JP.WORDS.filter(function (x) { return x.world === w && (x.kind === 'noun') && !have[x.id] && x.kana.length <= 6; });
      if (pool.length) out.push(wtok(U.pick(pool).id, 'obj', { distractor: true }));
    }
    out.forEach(function (t) { t.distractor = true; t.unit = null; });
    return out;
  }

  /* validate a sequence of tiles against a sentence (free order of chunks; verb last) */
  function validate(answer, sent) {
    if (answer.length !== sent.tokens.length) return false;
    let i = 0; const seen = {};
    while (i < answer.length) {
      const u = answer[i].unit;
      if (u === null || u === undefined || seen[u]) return false;
      seen[u] = 1;
      const unitTokens = sent.units[u].tokens;
      for (let k = 0; k < unitTokens.length; k++) {
        if (!answer[i + k] || answer[i + k].id !== unitTokens[k].id) return false;
      }
      i += unitTokens.length;
      if (i < answer.length && u === sent.verbUnit) return false;
    }
    return answer[answer.length - 1].unit === sent.verbUnit;
  }

  JP.FORMS = FORMS; JP.ENDINGS = ENDINGS; JP.ENDING_RO = ENDING_RO; JP.FORM_INFO = FORM_INFO;
  JP.Sent = {
    generate: generate, candidates: candidates, exampleFor: exampleFor, distractors: distractors, validate: validate,
    tok: tok, wtok: wtok, PEOPLE: PEOPLE, SUBJ_ALL: SUBJ_ALL, pluralize: pluralize, npObj: npObj, beForm: beForm
  };
})(globalThis.JP = globalThis.JP || {});
