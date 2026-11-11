const JP = require('./load')(['util.js','data.js','kana.js','sentences.js']);
const worlds = JP.WORLDS.map(w=>w.id).concat(['slides','all']);
let bad = 0;
const show = process.argv[2];
worlds.forEach(w => {
  const cands = JP.Sent.candidates(w, 80);
  const kinds = {}; const forms = {};
  cands.forEach(s => { kinds[s.kind] = (kinds[s.kind]||0)+1; forms[s.form]=(forms[s.form]||0)+1;
     // validation of the canonical order
     if (!JP.Sent.validate(s.tokens, s)) { bad++; console.log('canonical order invalid', s.kana); }
     if (!/^[A-Z]/.test(s.en) || / ,|  |undefined|null/.test(s.en)) { bad++; console.log('BAD EN', s.en, s.kana); }
  });
  console.log(`${w.padEnd(9)} unique:${cands.length} kinds:${JSON.stringify(kinds)} forms:${JSON.stringify(forms)}`);
  if (show === w || show === 'all') cands.slice(0, 40).forEach(s => console.log('   ', s.units.map(u=>u.tokens.map(t=>t.t).join(' ')).join(' | '), ' → ', s.en));
});
console.log(bad ? bad+' problems' : 'ok');
// question-form checks
const qs = JP.Sent.candidates('all', 40, { forms:['past'], kinds:['act','is','like'], noTime:true, notSubj:['watashi'] });
qs.slice(0,12).forEach(s => console.log('Q:', s.kana, '|', s.qen, '|', s.en));
qs.forEach(s => { if (!s.qen || /undefined|  /.test(s.qen)) { console.log('BAD QEN', s.kana, s.qen); } if (s.tokens.some(t=>t.role==='time')) console.log('TIME LEAK', s.kana); if (s.used.indexOf('watashi')>=0 && s.kind!=='is') console.log('WATASHI LEAK', s.kana); });
