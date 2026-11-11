/* ============================================================
   data.js  -  Subjects (worlds), words, verbs, particles
   Everything here is plain data so teachers/parents can add words.
   Word tuple: [id, kana, english, emoji, article, extras]
     article: 'a' (a/an), 'the', or '' (no article: rice, soccer)
     extras : kanji, note, slide (from class slides), kind, pic, at, to,
              ref, poss, pl, suru, prd, ro (romaji override), time ...
   ============================================================ */
(function (JP) {
  'use strict';

  /* ---------- Subjects ("worlds") ---------- */
  JP.WORLDS = [
    { id: 'food',      jp: 'たべもの',   en: 'Food & Drink',        emoji: '🍙', c1: '#ff9f43', c2: '#ffd166', deco: ['🍎','🍕','🍰','🍜','🍣','🍓'] },
    { id: 'school',    jp: 'がっこう',   en: 'School',              emoji: '🏫', c1: '#4d9bff', c2: '#8ec5ff', deco: ['✏️','📚','🎒','📝','🔤','✂️'] },
    { id: 'family',    jp: 'かぞく',     en: 'Family',              emoji: '👨‍👩‍👧', c1: '#ff7eb6', c2: '#ffb3d1', deco: ['👶','👵','👴','👦','👧','💞'] },
    { id: 'jobs',      jp: 'しごと',     en: 'People & Jobs',       emoji: '🧑‍🍳', c1: '#8e6bff', c2: '#c1a8ff', deco: ['🧑‍⚕️','🧑‍✈️','🍸','👮','🎤','👔'] },
    { id: 'town',      jp: 'まち',       en: 'Town & Travel',       emoji: '🚃', c1: '#2ec4b6', c2: '#7be0d4', deco: ['🚌','✈️','🚲','🏥','🌊','⛰️'] },
    { id: 'shopping',  jp: 'かいもの',   en: 'Shopping & Money',    emoji: '🛍️', c1: '#f6c90e', c2: '#ffe680', deco: ['💰','👟','🧢','🎁','👓','🏷️'] },
    { id: 'events',    jp: 'イベント',   en: 'Parties & Events',    emoji: '🎉', c1: '#ff5d73', c2: '#ff9aa8', deco: ['🎂','💒','🎶','🏮','🎆','🥂'] },
    { id: 'animals',   jp: 'どうぶつ',   en: 'Animals',             emoji: '🐼', c1: '#7ac74f', c2: '#b5e48c', deco: ['🐶','🐱','🐘','🦁','🐧','🐰'] },
    { id: 'play',      jp: 'あそび',     en: 'Play & Hobbies',      emoji: '⚽', c1: '#3ddc97', c2: '#9bf0c8', deco: ['🎮','🎸','🎬','🏀','🎨','🎣'] },
    { id: 'feelings',  jp: 'きもち',     en: 'Feelings & Describing', emoji: '😀', c1: '#ffa94d', c2: '#ffd8a8', deco: ['😍','😎','🤩','😋','😢','💪'] },
    { id: 'days',      jp: 'ひ・じかん', en: 'Days & Times',        emoji: '📅', c1: '#5c7cfa', c2: '#a5b4fc', deco: ['🌅','☀️','🌙','🏖️','💼','⏰'] },
    { id: 'verbs',     jp: 'どうし',     en: 'Action Words (Verbs)', emoji: '🏃', c1: '#e8590c', c2: '#ffa94d', deco: ['😋','👀','👂','✍️','🚴','🤝'] }
  ];
  // Special subject built from the class slides (words flagged slide:true)
  JP.SLIDES_WORLD = { id: 'slides', jp: 'クラスの ことば', en: 'From My Class', emoji: '⭐', c1: '#fd7e14', c2: '#ffd43b', deco: ['⭐','📖','🎌','📝','🌟','✨'], special: true };

  /* ---------- Nouns / adjectives / phrases ---------- */
  const RAW = {
    food: [
      ['gohan','ごはん','rice','🍚','',{note:'Also means "meal".'}],
      ['pan','パン','bread','🍞',''],
      ['tamago','たまご','egg','🥚','a'],
      ['sakana','さかな','fish','🐟',''],
      ['niku','にく','meat','🥩',''],
      ['yasai','やさい','vegetables','🥦','',{pl:'vegetables'}],
      ['ringo','りんご','apple','🍎','a'],
      ['banana','バナナ','banana','🍌','a'],
      ['ichigo','いちご','strawberry','🍓','a',{pl:'strawberries'}],
      ['keki','ケーキ','cake','🍰','a'],
      ['aisu','アイス','ice cream','🍦',''],
      ['piza','ピザ','pizza','🍕',''],
      ['sandoicchi','サンドイッチ','sandwich','🥪','a',{pl:'sandwiches'}],
      ['ramen','ラーメン','ramen','🍜',''],
      ['sushi','すし','sushi','🍣',''],
      ['karee','カレー','curry','🍛',''],
      ['sarada','サラダ','salad','🥗',''],
      ['shiriaru','シリアル','cereal','🥣','',{slide:true}],
      ['onigiri','おにぎり','rice ball','🍙','a'],
      ['kukkii','クッキー','cookie','🍪','a'],
      ['choko','チョコレート','chocolate','🍫',''],
      ['chiizu','チーズ','cheese','🧀',''],
      ['asagohan','あさごはん','breakfast','🍳','',{slide:true,kanji:'朝ご飯'}],
      ['hirugohan','ひるごはん','lunch','🍱',''],
      ['bangohan','ばんごはん','dinner','🍲',''],
      ['mizu','みず','water','💧',''],
      ['ocha','おちゃ','tea','🍵',''],
      ['juusu','ジュース','juice','🧃',''],
      ['miruku','ミルク','milk','🥛',''],
      ['koohii','コーヒー','coffee','☕','']
    ],
    school: [
      ['gakkou','がっこう','school','🏫','the',{at:'at school',to:'to school'}],
      ['sensei','せんせい','teacher','👩‍🏫','a',{slide:true,ref:'the teacher',poss:"the teacher's"}],
      ['gakusei','がくせい','student','🧑‍🎓','a',{slide:true,ref:'the student',poss:"the student's"}],
      ['daigakusei','だいがくせい','college student','🎓','a',{slide:true}],
      ['hon','ほん','book','📖','a',{kanji:'本'}],
      ['enpitsu','えんぴつ','pencil','✏️','a'],
      ['nooto','ノート','notebook','📓','a'],
      ['kaban','かばん','bag','🎒','a'],
      ['isu','いす','chair','🪑','a'],
      ['tesuto','テスト','test','📝','a',{slide:true,note:'Exam: しけん (試験)'}],
      ['shukudai','しゅくだい','homework','📚','',{suru:{b:'do homework',s:'does homework',p:'did homework'}}],
      ['nihongo','にほんご','Japanese','🎌','',{kanji:'日本語'}],
      ['eigo','えいご','English','🔤','',{slide:true}],
      ['sansuu','さんすう','math','➗',''],
      ['rekishi','れきし','history','📜','',{slide:true}],
      ['hasami','はさみ','scissors','✂️',''],
      ['kore','これ','this','👇','',{kind:'pron',pic:false}],
      ['sore','それ','that','👉','',{kind:'pron',pic:false,slide:true}],
      ['jisho','じしょ','dictionary','📕','a'],
      ['tegami','てがみ','letter','✉️','a']
    ],
    family: [
      ['watashi','わたし','I / me','🙋','',{kind:'pron',ref:'I',poss:'my',kanji:'私'}],
      ['kazoku','かぞく','family','👨‍👩‍👧','a'],
      ['tsuma','つま','my wife','👰','',{slide:true,kanji:'妻',note:"Someone else's wife: おくさん (奥さん)",ref:'my wife',poss:"my wife's"}],
      ['musuko','むすこ','my son','👦','',{slide:true,kanji:'息子',note:"Someone else's son: むすこさん (息子さん)",ref:'my son',poss:"my son's"}],
      ['musume','むすめ','my daughter','👧','',{slide:true,kanji:'娘',note:"Someone else's daughter: むすめさん (娘さん)",ref:'my daughter',poss:"my daughter's"}],
      ['okaasan','おかあさん','mom','👩','',{ref:'my mom',poss:"my mom's"}],
      ['otousan','おとうさん','dad','👨','',{ref:'my dad',poss:"my dad's"}],
      ['oniisan','おにいさん','older brother','🧑','',{ref:'my big brother',poss:"my big brother's"}],
      ['oneesan','おねえさん','older sister','👱‍♀️','',{ref:'my big sister',poss:"my big sister's"}],
      ['ojiisan','おじいさん','grandpa','👴','',{ref:'my grandpa',poss:"my grandpa's"}],
      ['obaasan','おばあさん','grandma','👵','',{ref:'my grandma',poss:"my grandma's"}],
      ['akachan','あかちゃん','baby','👶','a',{ref:'the baby'}],
      ['kodomo','こども','child','🧒','a',{slide:true,ref:'the child'}],
      ['tomodachi','ともだち','friend','🧑‍🤝‍🧑','a',{ref:'my friend',poss:"my friend's"}]
    ],
    jobs: [
      ['tenin','てんいん','store worker','🧑‍💼','a',{slide:true,kanji:'店員',note:'Store clerk',ref:'the store clerk',poss:"the store clerk's"}],
      ['joushi','じょうし','boss','👔','a',{slide:true,kanji:'上司',note:'President: しゃちょう (社長)',ref:'my boss',poss:"my boss's"}],
      ['shachou','しゃちょう','company president','🏢','a',{kanji:'社長',ref:'the president',poss:"the president's"}],
      ['baatendaa','バーテンダー','bartender','🍸','a',{slide:true,note:'A loanword (from English).'}],
      ['isha','いしゃ','doctor','🧑‍⚕️','a'],
      ['kokku','コック','cook','🧑‍🍳','a'],
      ['pairotto','パイロット','pilot','🧑‍✈️','a'],
      ['kashu','かしゅ','singer','🎤','a'],
      ['keisatsukan','けいさつかん','police officer','👮','a'],
      ['shoubouji','しょうぼうし','firefighter','🧑‍🚒','a']
    ],
    town: [
      ['densha','でんしゃ','train','🚃','a',{slide:true,kanji:'電車'}],
      ['basu','バス','bus','🚌','a',{pl:'buses'}],
      ['basutei','バスてい','bus stop','🚏','a',{slide:true,kanji:'バス停',at:'at the bus stop',to:'to the bus stop'}],
      ['kuruma','くるま','car','🚗','a'],
      ['jitensha','じてんしゃ','bicycle','🚲','a'],
      ['hikouki','ひこうき','airplane','✈️','a',{at:'on the airplane'}],
      ['takushii','タクシー','taxi','🚕','a'],
      ['chikatetsu','ちかてつ','subway','🚇','the'],
      ['fune','ふね','ship','🚢','a'],
      ['eki','えき','train station','🚉','the',{at:'at the station',to:'to the station'}],
      ['kouen','こうえん','park','🏞️','the',{at:'in the park',to:'to the park'}],
      ['byouin','びょういん','hospital','🏥','the',{at:'at the hospital',to:'to the hospital'}],
      ['hoteru','ホテル','hotel','🏨','the',{at:'at the hotel',to:'to the hotel'}],
      ['umi','うみ','sea','🌊','the',{at:'at the sea',to:'to the sea'}],
      ['yama','やま','mountain','⛰️','the',{at:'in the mountains',to:'to the mountains',pl:'mountains'}],
      ['resutoran','レストラン','restaurant','🍴','the',{at:'at the restaurant',to:'to the restaurant'}],
      ['uchi','うち','home','🏠','',{at:'at home',to:'home'}],
      ['nihon','にほん','Japan','🗾','',{slide:true,at:'in Japan',to:'to Japan'}]
    ],
    shopping: [
      ['okane','おかね','money','💰','',{slide:true,kanji:'お金',note:'おかねが ありません = "I have no money."'}],
      ['shoppingu','ショッピングモール','shopping mall','🏬','the',{slide:true,ro:'shoppingu mōru',at:'at the mall',to:'to the mall'}],
      ['waribiki','わりびき','discount','🏷️','a',{slide:true,kanji:'割引',note:'Sale: セール'}],
      ['mise','みせ','shop','🏪','the',{at:'at the shop',to:'to the shop'}],
      ['fuku','ふく','clothes','👕',''],
      ['kutsu','くつ','shoes','👟',''],
      ['boushi','ぼうし','hat','🧢','a'],
      ['kasa','かさ','umbrella','☂️','a'],
      ['tokei','とけい','watch','⌚','a',{pl:'watches'}],
      ['megane','めがね','glasses','👓',''],
      ['omocha','おもちゃ','toy','🧸','a'],
      ['purezento','プレゼント','present','🎁','a'],
      ['saifu','さいふ','wallet','👛','a']
    ],
    events: [
      ['paatii','パーティー','party','🎉','a',{slide:true,at:'at the party',to:'to the party',pl:'parties'}],
      ['tanjoubi','たんじょうび','birthday','🎂','a',{slide:true,kanji:'誕生日',note:'Say おめでとう! to wish someone a happy birthday.',ref:'my birthday',prd:'my birthday'}],
      ['kekkonshiki','けっこんしき','wedding','💒','a',{slide:true,kanji:'結婚式',at:'at the wedding',to:'to the wedding'}],
      ['kaigi','かいぎ','meeting','👥','a',{slide:true,kanji:'会議',note:'Casual: ミーティング',at:'at the meeting',to:'to the meeting'}],
      ['happyou','はっぴょう','presentation','📊','a',{slide:true,kanji:'発表',note:'Casual: プレゼン'}],
      ['omatsuri','おまつり','festival','🏮','a',{at:'at the festival',to:'to the festival'}],
      ['konsaato','コンサート','concert','🎶','a',{at:'at the concert',to:'to the concert'}],
      ['hanabi','はなび','fireworks','🎆','',{note:'People say たまや! when they watch them.'}],
      ['halloween','ハロウィン','Halloween','🎃',''],
      ['kurisumasu','クリスマス','Christmas','🎄',''],
      ['gogaku','ごがくの クラス','language class','🗣️','a',{slide:true,kanji:'語学のクラス',ro:'gogaku no kurasu',note:'Japanese class: にほんごの クラス (日本語のクラス)',at:'in language class',to:'to language class'}],
      ['omedetou','おめでとう','congratulations','🥳','',{kind:'phrase',slide:true,note:'Say it with たんじょうび = Happy birthday!'}],
      ['kanpai','かんぱい','cheers!','🥂','',{kind:'phrase',note:'Said when you raise your glasses together.'}],
      ['ogorasete','おごらせて','let me treat you','💳','',{kind:'phrase',slide:true,note:'"I\'ll pay." More polite: おごらせて ください.'}]
    ],
    animals: [
      ['inu','いぬ','dog','🐶','a'],
      ['neko','ねこ','cat','🐱','a'],
      ['tori','とり','bird','🐦','a'],
      ['usagi','うさぎ','rabbit','🐰','a'],
      ['saru','さる','monkey','🐵','a'],
      ['uma','うま','horse','🐴','a'],
      ['zou','ぞう','elephant','🐘','an'],
      ['raion','ライオン','lion','🦁','a'],
      ['panda','パンダ','panda','🐼','a'],
      ['kuma','くま','bear','🐻','a'],
      ['pengin','ペンギン','penguin','🐧','a'],
      ['kirin','きりん','giraffe','🦒','a'],
      ['kame','かめ','turtle','🐢','a'],
      ['hebi','へび','snake','🐍','a'],
      ['buta','ぶた','pig','🐷','a'],
      ['ushi','うし','cow','🐮','a'],
      ['kaeru','かえる','frog','🐸','a'],
      ['nezumi','ねずみ','mouse','🐭','a',{pl:'mice'}],
      ['tora','とら','tiger','🐯','a'],
      ['hitsuji','ひつじ','sheep','🐑','a',{pl:'sheep'}],
      ['take','たけ','bamboo','🎋',''],
      ['kusa','くさ','grass','🌱',''],
      ['doubutsuen','どうぶつえん','zoo','🦓','the',{at:'at the zoo',to:'to the zoo'}]
    ],
    play: [
      ['sakkaa','サッカー','soccer','⚽','',{suru:{b:'play soccer',s:'plays soccer',p:'played soccer'}}],
      ['yakyuu','やきゅう','baseball','⚾','',{suru:{b:'play baseball',s:'plays baseball',p:'played baseball'}}],
      ['tenisu','テニス','tennis','🎾','',{suru:{b:'play tennis',s:'plays tennis',p:'played tennis'}}],
      ['basuketto','バスケットボール','basketball','🏀','',{suru:{b:'play basketball',s:'plays basketball',p:'played basketball'}}],
      ['geemu','ゲーム','video game','🎮','a',{suru:{b:'play video games',s:'plays video games',p:'played video games'}}],
      ['eiga','えいが','movie','🎬','a'],
      ['ongaku','おんがく','music','🎵',''],
      ['piano','ピアノ','piano','🎹','the'],
      ['gitaa','ギター','guitar','🎸','the'],
      ['terebi','テレビ','TV','📺',''],
      ['dorama','ドラマ','TV drama','🎭','a',{slide:true}],
      ['e','え','picture','🎨','a',{note:'Said "eh". (The particle へ is also said "e"!)'}],
      ['dansu','ダンス','dance','💃','',{suru:{b:'dance',s:'dances',p:'danced'}}],
      ['uta','うた','song','🎼','a'],
      ['suiei','すいえい','swimming','🏊','',{suru:{b:'go swimming',s:'goes swimming',p:'went swimming'}}],
      ['tsuri','つり','fishing','🎣','',{suru:{b:'go fishing',s:'goes fishing',p:'went fishing'}}],
      ['pikunikku','ピクニック','picnic','🧺','a',{suru:{b:'have a picnic',s:'has a picnic',p:'had a picnic'}}]
    ],
    feelings: [
      ['ookii','おおきい','big','🦕','',{kind:'adj',adj:'big',slide:true,kanji:'大きい'}],
      ['chiisai','ちいさい','small','🐜','',{kind:'adj',adj:'small',slide:true,kanji:'小さい'}],
      ['kakkoii','かっこいい','cool','😎','',{kind:'adj',adj:'cool',slide:true,note:'Looks cool / stylish.'}],
      ['kawaii','かわいい','cute','🥰','',{kind:'adj',adj:'cute'}],
      ['omoshiroi','おもしろい','interesting / funny','🤣','',{kind:'adj',adj:'interesting'}],
      ['sugoi','すごい','amazing','🤩','',{kind:'adj',adj:'amazing'}],
      ['taihen','たいへん','tough','😰','',{kind:'adj',adj:'tough',slide:true,kanji:'大変',note:'たいへんですね = "That sounds tough!"'}],
      ['ninki','にんき','popular','🔥','',{kind:'adj',adj:'popular',slide:true,kanji:'人気',note:'にんきです = "It is popular."'}],
      ['oishii','おいしい','delicious','😋','',{kind:'adj',adj:'delicious'}],
      ['tanoshii','たのしい','fun','🎢','',{kind:'adj',adj:'fun'}],
      ['ureshii','うれしい','happy','😊','',{kind:'adj',adj:'happy'}],
      ['kanashii','かなしい','sad','😢','',{kind:'adj',adj:'sad'}],
      ['atsui','あつい','hot','🥵','',{kind:'adj',adj:'hot'}],
      ['samui','さむい','cold','🥶','',{kind:'adj',adj:'cold'}],
      ['hayai','はやい','fast','⚡','',{kind:'adj',adj:'fast'}],
      ['tsuyoi','つよい','strong','💪','',{kind:'adj',adj:'strong'}],
      ['daisuki','だいすき','love / really like','😍','',{kind:'adj',slide:true,kanji:'大好き',note:'Stronger than すき. Use it with が: ねこが だいすきです.'}],
      ['suki','すき','like','👍','',{kind:'adj',note:'Use it with が: ピザが すきです.'}],
      ['heta','へた','bad at','🙈','',{kind:'adj',slide:true,kanji:'下手',note:'Opposite: じょうず (上手)'}],
      ['jouzu','じょうず','good at','👏','',{kind:'adj',kanji:'上手',note:'Opposite: へた (下手)'}],
      ['ikemen','イケメン','handsome guy','🤵','a',{slide:true,note:'Classic word: ハンサム'}],
      ['totemo','とても','very','💯','',{kind:'adv',slide:true,note:'Goes before the word: とても おおきい.'}],
      ['yokatta','よかった','I\'m glad! / Good!','😌','',{kind:'phrase',slide:true,note:'Thank goodness!'}],
      ['ippai','いっぱい','full / a lot','🍽️','',{kind:'phrase',slide:true,note:'おなかが いっぱい = "My tummy is full."'}]
    ],
    days: [
      ['kinou','きのう','yesterday','⏪','',{kind:'time',time:'past',en2:'Yesterday'}],
      ['kyou','きょう','today','📅','',{kind:'time',time:'fut',en2:'Today'}],
      ['ashita','あした','tomorrow','⏩','',{kind:'time',time:'fut',en2:'Tomorrow'}],
      ['mainichi','まいにち','every day','🔁','',{kind:'time',time:'pres',en2:'Every day'}],
      ['shuumatsu','しゅうまつ','weekend','🎊','',{slide:true}],
      ['asa','あさ','morning','🌅','',{kind:'time',time:'pres',en2:'In the morning'}],
      ['hiru','ひる','daytime / noon','☀️','',{}],
      ['yoru','よる','night','🌙','',{kind:'time',time:'pres',en2:'At night'}],
      ['kesa','けさ','this morning','🌄','',{kind:'time',time:'past',en2:'This morning'}],
      ['yuube','ゆうべ','last night','🌃','',{kind:'time',time:'past',en2:'Last night'}],
      ['yasumi','やすみ','day off','🏖️','a',{slide:true,note:'Tricky! やすみ can be a thing (day off) OR the action やすみます (to rest).',prd:'a day off'}],
      ['shigoto','しごと','work','💼','',{slide:true,prd:'work'}],
      ['senshuu','せんしゅう','last week','◀️','',{kind:'time',time:'past',en2:'Last week'}],
      ['raishuu','らいしゅう','next week','▶️','',{kind:'time',time:'fut',en2:'Next week'}]
    ]
  };

  /* ---------- Verbs (ます-form is shown; stem + ending are separate "bricks") ----------
     [id, stem, english, emoji, {b,s,p} English forms, note]                                */
  const VERBS = [
    ['taberu','たべ','eat','🥄',{b:'eat',s:'eats',p:'ate'},'を'],
    ['nomu','のみ','drink','🥤',{b:'drink',s:'drinks',p:'drank'},'を'],
    ['yomu','よみ','read','🤓',{b:'read',s:'reads',p:'read'},'を'],
    ['kaku','かき','write / draw','✍️',{b:'write',s:'writes',p:'wrote'},'を'],
    ['miru','み','watch / see','👀',{b:'watch',s:'watches',p:'watched'},'を'],
    ['kiku','きき','listen / hear','👂',{b:'listen to',s:'listens to',p:'listened to'},'を'],
    ['hiku','ひき','play (an instrument)','🎻',{b:'play',s:'plays',p:'played'},'を'],
    ['kau','かい','buy','🛒',{b:'buy',s:'buys',p:'bought'},'を'],
    ['iku','いき','go','🚶',{b:'go',s:'goes',p:'went'},'に / へ'],
    ['kaeru','かえり','go back / return','🏡',{b:'go back',s:'goes back',p:'went back'},'に / へ'],
    ['noru','のり','ride / get on','🚴',{b:'ride',s:'rides',p:'rode'},'に'],
    ['suru','し','do / play','🤸',{b:'do',s:'does',p:'did'},'を'],
    ['benkyou','べんきょうし','study','🧠',{b:'study',s:'studies',p:'studied'},'を'],
    ['hanasu','はなし','speak / talk','🗨️',{b:'speak',s:'speaks',p:'spoke'},'を'],
    ['utau','うたい','sing','🎙️',{b:'sing',s:'sings',p:'sang'},'を'],
    ['odoru','おどり','dance','🕺',{b:'dance',s:'dances',p:'danced'},'で'],
    ['asobu','あそび','play / hang out','🪁',{b:'play',s:'plays',p:'played'},'と / で'],
    ['au','あい','meet','🤝',{b:'meet',s:'meets',p:'met'},'に'],
    ['ageru','あげ','give','🎀',{b:'give',s:'gives',p:'gave'},'に + を'],
    ['oshieru','おしえ','teach','🔬',{b:'teach',s:'teaches',p:'taught'},'に + を'],
    ['tsukuru','つくり','make','🛠️',{b:'make',s:'makes',p:'made'},'を'],
    ['hataraku','はたらき','work','👷',{b:'work',s:'works',p:'worked'},'で'],
    ['neru','ね','sleep','😴',{b:'sleep',s:'sleeps',p:'slept'},'で'],
    ['oyogu','およぎ','swim','🐬',{b:'swim',s:'swims',p:'swam'},'で'],
    ['matsu','まち','wait','⏳',{b:'wait for',s:'waits for',p:'waited for'},'を']
  ];

  /* ---------- Particles (ぶんぽう) ---------- */
  JP.PARTICLES = {
    'は': { ro: 'wa', name: 'topic',       color: '#3b82f6', says: 'は (wa) marks the TOPIC: who or what the sentence is about.' },
    'を': { ro: 'o',  name: 'object',      color: '#22a06b', says: 'を (o) marks the THING the action happens to: what you eat, read, buy…' },
    'に': { ro: 'ni', name: 'to / at',     color: '#f08c00', says: 'に (ni) shows where you GO, who you MEET or GIVE to, or what you ride.' },
    'へ': { ro: 'e',  name: 'toward',      color: '#e8590c', says: 'へ (e) shows the DIRECTION you head. It is written "he" but said "e"!' },
    'で': { ro: 'de', name: 'place of action', color: '#9c36b5', says: 'で (de) shows WHERE an action happens.' },
    'と': { ro: 'to', name: 'with',        color: '#e64980', says: 'と (to) means WITH: who you do it with.' },
    'の': { ro: 'no', name: "'s (belongs to)", color: '#0c8599', says: 'の (no) shows who something BELONGS to: ともだち の ほん = my friend\'s book.' },
    'が': { ro: 'ga', name: 'like / good at', color: '#e03131', says: 'が (ga) marks the thing you LIKE or are good at: ねこ が すきです.' }
  };

  /* ---------- Build the word list ---------- */
  JP.WORDS = [];
  JP.WORD = {};

  function add(w) { JP.WORDS.push(w); JP.WORD[w.id] = w; }

  Object.keys(RAW).forEach(function (worldId) {
    RAW[worldId].forEach(function (t) {
      const x = t[5] || {};
      const kind = x.kind || 'noun';
      add({
        id: t[0], kana: t[1], en: t[2], emoji: t[3], art: t[4] || '', world: worldId,
        kind: kind,
        pic: x.pic !== undefined ? x.pic : (kind === 'noun' || kind === 'pron' ? true : false),
        slide: !!x.slide, kanji: x.kanji || '', note: x.note || '',
        ref: x.ref || '', poss: x.poss || '', pl: x.pl || '', at: x.at || '', to: x.to || '',
        suru: x.suru || null, prd: x.prd || '', adj: x.adj || '', time: x.time || '', en2: x.en2 || '',
        roOverride: x.ro || ''
      });
    });
  });
  // Days: abstract words get no picture questions except a few concrete ones
  ['asa', 'hiru', 'yoru', 'yasumi', 'shigoto'].forEach(function (id) { JP.WORD[id].pic = true; });
  ['kinou', 'kyou', 'ashita', 'mainichi', 'shuumatsu', 'kesa', 'yuube', 'senshuu', 'raishuu'].forEach(function (id) { JP.WORD[id].pic = false; });
  // A few verbs share the same word list so they can be studied too
  JP.VERBS = {};
  VERBS.forEach(function (t) {
    const v = { id: 'v_' + t[0], vkey: t[0], stem: t[1], kana: t[1] + 'ます', en: t[2], emoji: t[3], eng: t[4], particle: t[5],
      art: '', world: 'verbs', kind: 'verb', pic: false, slide: false, kanji: '', note: '',
      ref: '', poss: '', pl: '', at: '', to: '', suru: null, prd: '', adj: '', time: '', en2: '', roOverride: '' };
    if (t[0] === 'taberu' || t[0] === 'nomu' || t[0] === 'iku' || t[0] === 'benkyou') v.slide = true;
    v.note = 'Pattern: ' + (t[5] === 'で' ? 'place で ' : t[5] === 'と / で' ? 'ともだち と / place で ' : t[5] === 'に + を' ? 'person に + thing を ' : t[5] === 'に / へ' ? 'place に (or へ) ' : t[5] === 'に' ? 'thing に ' : 'thing を ') + v.kana;
    JP.VERBS[v.vkey] = v;
    add(v);
  });
  JP.VERBS.benkyou.note = 'Pattern: thing を べんきょうします (にほんごを べんきょうします)';

  /* ---------- Subject helpers ---------- */
  JP.worldById = function (id) {
    if (id === 'slides') return JP.SLIDES_WORLD;
    for (let i = 0; i < JP.WORLDS.length; i++) if (JP.WORLDS[i].id === id) return JP.WORLDS[i];
    return null;
  };
  // Words that belong to a subject. 'all' = everything, 'slides' = words from class slides.
  JP.wordsOf = function (worldId) {
    if (worldId === 'all' || !worldId) return JP.WORDS.slice();
    if (worldId === 'slides') return JP.WORDS.filter(function (w) { return w.slide; });
    return JP.WORDS.filter(function (w) { return w.world === worldId; });
  };
})(globalThis.JP = globalThis.JP || {});
