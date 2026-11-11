const JP = require('./load')(['data.js','kana.js']);
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL:', m); } };
// romaji vs the class slides
const cases = {
  'たべます':'tabemasu','べんきょうします':'benkyōshimasu','きのう':'kinō','せんせい':'sensē','がくせい':'gakusē','じゅうきゅうさい':'jūkyūsai',
  'おおきい':'ōkii','いいえ':'iie','バスてい':'basutē','パーティー':'pātī','バーテンダー':'bātendā','えいご':'ēgo','しゅうまつ':'shūmatsu',
  'ケーキ':'kēki','ラーメン':'rāmen','コーヒー':'kōhī','チョコレート':'chokorēto','サッカー':'sakkā','いっぱい':'ippai','はっぴょう':'happyō',
  'けっこんしき':'kekkonshiki','おとうさん':'otōsan','おかあさん':'okāsan','おねえさん':'onēsan','おにいさん':'oniisan','たんじょうび':'tanjōbi',
  'じょうし':'jōshi','かんぱい':'kanpai','ペンギン':'pengin','ライオン':'raion','しゃちょう':'shachō','きょう':'kyō','ちいさい':'chiisai',
  'やきゅう':'yakyū','ピクニック':'pikunikku','バスケットボール':'basukettobōru','おもしろい':'omoshiroi','ありません':'arimasen'
};
Object.keys(cases).forEach(k => { const r = JP.Kana.romaji(k); ok(r === cases[k], `${k} -> ${r} (want ${cases[k]})`); });
ok(JP.Kana.romaji('は',{particle:true})==='wa','particle wa');
ok(JP.Kana.romaji('を',{particle:true})==='o','particle o');
ok(JP.Kana.romaji('へ',{particle:true})==='e','particle e');
ok(JP.Kana.romaji('じゃなかったです')==='janakattadesu','janakattadesu '+JP.Kana.romaji('じゃなかったです'));
ok(JP.Kana.romaji('ませんでした')==='masendeshita','masendeshita');
// data checks
const ids = new Set(), emo = {};
JP.WORDS.forEach(w => {
  ok(!ids.has(w.id), 'dup id '+w.id); ids.add(w.id);
  ok(w.kana && w.en && w.emoji, 'missing field '+w.id);
  ok(!/[A-Za-z]/.test(w.kana), 'latin in kana '+w.id);
  if (emo[w.emoji]) console.log('dup emoji', w.emoji, emo[w.emoji], w.id); emo[w.emoji] = w.id;
});
ok(JP.WORDS.filter(w=>w.slide).length >= 40, 'slide words');
console.log('words:', JP.WORDS.length, 'slides:', JP.WORDS.filter(w=>w.slide).length, 'verbs:', Object.keys(JP.VERBS).length);
JP.WORLDS.forEach(w => console.log(w.id.padEnd(9), JP.wordsOf(w.id).length, 'pic:', JP.wordsOf(w.id).filter(x=>x.pic).length));
console.log(fail ? fail+' FAILURES' : 'all ok');
process.exit(fail?1:0);
