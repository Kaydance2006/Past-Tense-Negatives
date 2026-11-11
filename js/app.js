/* ============================================================
   app.js - boot, top bar, home (subject picker), subject hub,
   settings, rules sheet, badges
   ============================================================ */
(function (JP) {
  'use strict';
  const U = JP.U, UI = JP.UI, Store = JP.Store, Game = JP.Game, K = UI.K, esc = U.esc, $ = UI.$;
  const state = { screen: 'home', world: 'all' };
  const AVATARS = ['🦊', '🐼', '🐸', '🐰', '🦄', '🐲', '🐧', '🦁', '🐙', '🐨', '🦖', '🐶'];

  /* ---------- settings -> page ---------- */
  function applySettings() {
    const s = Store.get().settings;
    document.body.classList.toggle('no-romaji', !s.romaji);
    document.body.classList.toggle('nomotion', !s.motion);
    const set = function (id, on) { const el = $(id); if (el) { el.classList.toggle('off', !on); el.setAttribute('aria-pressed', on ? 'true' : 'false'); } };
    const r = $('#t-romaji'); if (r) r.setAttribute('aria-pressed', s.romaji ? 'true' : 'false');
    set('#t-sfx', s.sfx); set('#t-music', s.music); set('#t-voice', s.voice);
  }
  function renderTopbar() {
    $('#topbar').innerHTML =
      '<button type="button" class="brand" data-nav="home" aria-label="Home">🎌 <span>にほんご <b>Quest</b></span></button>' +
      '<div class="top-right">' +
      '<button type="button" id="t-romaji" class="pill" aria-pressed="true" title="Show or hide romaji (English letters for Japanese sounds)"><span class="pill-ro">Aa</span><span class="pill-label">Romaji</span><span class="sw"></span></button>' +
      '<button type="button" id="t-sfx" class="icon" title="Sound effects" aria-label="Sound effects">🔊</button>' +
      '<button type="button" id="t-music" class="icon" title="Music" aria-label="Music">🎵</button>' +
      '<button type="button" id="t-voice" class="icon" title="Japanese voice" aria-label="Japanese voice">🗣️</button>' +
      '<button type="button" id="t-help" class="icon" title="Rules & cheat sheet" aria-label="Rules">📖</button>' +
      '<button type="button" id="t-set" class="icon" title="Settings" aria-label="Settings">⚙️</button></div>';
    applySettings();
  }

  /* ---------- HOME ---------- */
  function worldCard(wd, featured) {
    const list = JP.wordsOf(wd.id);
    const got = list.filter(function (w) { return Store.unlocked(w.id); }).length;
    const st = Store.worldStat(wd.id);
    const pct = list.length ? Math.round(got / list.length * 100) : 0;
    return '<button type="button" class="wcard' + (featured ? ' featured' : '') + '" data-world="' + wd.id + '" style="--c1:' + wd.c1 + ';--c2:' + wd.c2 + '">' +
      '<span class="wc-emoji">' + wd.emoji + '</span>' + (featured ? '<span class="wc-text">' : '') +
      '<span class="wc-jp">' + K(wd.jp, JP.Kana.romaji(wd.jp)) + '</span><span class="wc-en">' + esc(wd.en) + '</span>' + (featured ? '</span>' : '') +
      '<span class="wc-prog"><span>🏷️ ' + got + '/' + list.length + '</span><span class="mini"><i style="width:' + pct + '%"></i></span><span>⭐' + st.stars + '</span></span></button>';
  }
  function home() {
    state.screen = 'home';
    Game.applyWorldTheme('home');
    const d = Store.get();
    const lvl = Store.level(), into = d.xp % 150;
    const sc = Game.stickerCount();
    const all = { id: 'all', jp: 'ぜんぶ', en: 'Surprise me! All subjects', emoji: '🌈', c1: '#ff6b9d', c2: '#ffb199' };
    $('#app').innerHTML = '<div class="home">' +
      '<div class="hero"><div class="hero-cat">🐱</div><div class="hero-bubble"><h1>こんにちは、' + esc(d.name || 'ともだち') + '！</h1>' +
      '<p>Pick a <b>subject</b> and let’s play with Japanese words! ' + (d.streak.count > 1 ? '🔥 ' + d.streak.count + '-day streak!' : '') + '</p></div></div>' +
      '<div class="profile"><div class="avatar">' + esc(d.avatar) + '</div><div class="pf-main"><div class="pf-name">' + esc(d.name || 'Player') + ' · Level ' + lvl + '</div><div class="xpbar"><i style="width:' + Math.round(into / 150 * 100) + '%"></i></div></div>' +
      '<div class="pf-chips"><span class="chip">⭐ ' + d.stars + '</span><span class="chip">🏷️ ' + sc + '/' + JP.WORDS.length + '</span><span class="chip">🏅 ' + d.badges.length + '</span></div>' +
      '<div class="pf-btns"><button type="button" class="btn ghost" data-nav="book">🏷️ Sticker Book</button><button type="button" class="btn ghost" data-nav="badges">🏅 Badges</button></div></div>' +
      '<h2 class="sec-title">Choose a subject <small>しゅだいを えらぼう</small></h2><div class="worlds">' +
      worldCard(JP.SLIDES_WORLD, true) + JP.WORLDS.map(function (w) { return worldCard(w, false); }).join('') + worldCard(all, false) + '</div></div>';
    window.scrollTo(0, 0);
  }

  /* ---------- SUBJECT HUB ---------- */
  function hub(world) {
    state.screen = 'hub'; state.world = world;
    Game.applyWorldTheme(world);
    const wd = world === 'all' ? { id: 'all', jp: 'ぜんぶ', en: 'All subjects', emoji: '🌈' } : JP.worldById(world);
    const list = JP.wordsOf(world);
    const got = list.filter(function (w) { return Store.unlocked(w.id); }).length;
    const lvl = Store.setting('level');
    const G = Game.GAMES;
    const order = ['words', 'sentence', 'particle', 'lab', 'match', 'script', 'learn'];
    $('#app').innerHTML = '<div class="hub"><div class="hub-head"><button type="button" class="back" data-nav="home" aria-label="Back">←</button><span class="hub-emoji">' + wd.emoji + '</span>' +
      '<div class="hub-title">' + K(wd.jp, JP.Kana.romaji(wd.jp)) + '<small>' + esc(wd.en) + ' · ' + list.length + ' words</small></div></div>' +
      '<div class="hub-bar"><div class="levels" role="group" aria-label="Difficulty">' +
      [['1', '⭐ Easy'], ['2', '⭐⭐ Medium'], ['3', '⭐⭐⭐ Hard']].map(function (l) { return '<button type="button" class="lvl ' + (+l[0] === lvl ? 'on' : '') + '" data-level="' + l[0] + '">' + l[1] + '</button>'; }).join('') +
      '</div><span class="hub-stat">🏷️ ' + got + '/' + list.length + ' stickers</span></div>' +
      '<button type="button" class="bigplay" data-game="adventure"><span class="gc-icon">' + G.adventure.icon + '</span><span><span class="gc-name">' + G.adventure.name + '</span><br><span class="gc-sub">' + G.adventure.sub + '</span></span></button>' +
      '<div class="gamegrid">' + order.map(function (g) {
        return '<button type="button" class="gcard" data-game="' + g + '"><span class="gc-icon">' + G[g].icon + '</span><span><span class="gc-name">' + G[g].name + '</span><br><span class="gc-sub">' + G[g].sub + '</span></span></button>';
      }).join('') + '</div>' +
      '<div class="wordstrip"><h3>Words in this subject <small style="color:var(--muted);font-weight:600">(tap a sticker to hear it)</small></h3><div class="strip">' +
      list.slice(0, 40).map(function (w) { const u = Store.unlocked(w.id); return '<button type="button" class="sticker ' + (u ? 'on' : 'off') + (Store.mastered(w.id) ? ' gold' : '') + '" ' + (u ? 'data-say="' + esc(w.kana) + '"' : '') + ' title="' + (u ? esc(w.en) : 'Answer it correctly to unlock!') + '"><span class="st-e">' + (u ? w.emoji : '❔') + '</span></button>'; }).join('') +
      (list.length > 40 ? '<span class="chip">+' + (list.length - 40) + ' more</span>' : '') + '</div></div></div>';
    window.scrollTo(0, 0);
  }

  /* ---------- modals ---------- */
  function switchRow(key, title, desc) {
    return '<div class="setrow"><div><b>' + title + '</b><small>' + desc + '</small></div><button type="button" class="switch" data-set="' + key + '" aria-pressed="' + (Store.setting(key) ? 'true' : 'false') + '" aria-label="' + title + '"></button></div>';
  }
  function seg(key, title, desc, opts) {
    return '<div class="setrow"><div><b>' + title + '</b><small>' + desc + '</small></div><div class="seg">' + opts.map(function (o) { return '<button type="button" data-segset="' + key + '" data-val="' + o[0] + '" class="' + (String(Store.setting(key)) === String(o[0]) ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
  }
  function settings() {
    const s = Store.get().settings;
    const voiceNote = JP.Voice.available() ? '' : '<div class="note">⚠️ This device has no Japanese voice installed, so speech and the <b>Listen</b> questions are switched off. (On most phones, tablets and computers you can add a Japanese voice in the system language settings.)</div>';
    UI.modal('<h2>⚙️ Settings</h2>' +
      switchRow('romaji', 'Romaji (ろーまじ)', 'Show English letters above the Japanese. Turn it off to practise reading!') +
      switchRow('sfx', 'Sound effects', 'Dings, whooshes and cheers') +
      switchRow('music', 'Background music', 'A gentle tune that is different every time') +
      switchRow('voice', 'Japanese voice', 'Hear words and sentences read aloud') +
      '<div class="setrow"><div><b>Voice speed</b><small>Slower is easier to follow</small></div><input id="rate" type="range" min="0.5" max="1.1" step="0.05" value="' + s.rate + '"><button type="button" class="icon" id="testvoice" title="Test">🔊</button></div>' +
      voiceNote +
      seg('qCount', 'Questions per round', 'Shorter or longer games', [[5, '5'], [10, '10'], [15, '15']]) +
      seg('level', 'Difficulty', 'Easy: colour hints, fewer choices', [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']]) +
      switchRow('motion', 'Animations & confetti', 'Turn off if things feel too busy') +
      '<div class="setrow"><div><b>Your name</b><small>Shown on the home screen</small></div><button type="button" class="btn ghost" id="editname">Change</button></div>' +
      '<div class="setrow"><div><b>Start over</b><small>Erase stickers, stars and badges on this device</small></div><button type="button" class="btn warn" id="resetall">Reset</button></div>' +
      (Store.isMemoryOnly() ? '<div class="note">Progress can’t be saved in this browser mode, so it will reset when you close the page.</div>' : ''), { onClose: function () { if (state.screen === 'home') home(); else if (state.screen === 'hub') hub(state.world); } });
  }
  function welcome(first) {
    const d = Store.get();
    UI.modal('<h2>' + (first ? 'ようこそ！ Welcome!' : 'Your name') + '</h2><p>' + (first ? 'Let’s set up your player.' : '') + ' What should we call you?</p>' +
      '<input class="namein" id="nameinput" maxlength="14" placeholder="Your name" value="' + esc(d.name) + '" autocomplete="off">' +
      '<p style="margin:12px 0 0"><b>Pick your buddy:</b></p><div class="avatars">' + AVATARS.map(function (a) { return '<button type="button" data-avatar="' + a + '" class="' + (a === d.avatar ? 'on' : '') + '">' + a + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn go big" id="savename">' + (first ? 'Let’s go! いこう！' : 'Save') + '</button>');
    setTimeout(function () { const i = $('#nameinput'); if (i) i.focus(); }, 60);
  }
  function rules() {
    const E = JP.ENDINGS, R = JP.ENDING_RO;
    const ek = function (t) { return K(t, R[t] || JP.Kana.romaji(t), 'end'); };
    const rows = [['pres', 'Now · Yes', 'is / does'], ['presNeg', 'Now · No', "isn't / doesn't"], ['past', 'Before · Yes', 'was / did'], ['pastNeg', 'Before · No', "wasn't / didn't"]];
    const pg = Object.keys(JP.PARTICLES).map(function (p) { const x = JP.PARTICLES[p]; return '<div class="pbox" style="--pc:' + x.color + '">' + K(p, x.ro) + '<b>' + esc(x.name) + '</b><br>' + esc(x.says.replace(/^.. \([^)]*\) /, '')) + '</div>'; }).join('');
    UI.modal('<h2>📖 Rules & cheat sheet</h2>' +
      '<div class="note"><b>The one thing to remember:</b> Past + No = “wasn’t / didn’t”. English uses one rule. Japanese uses <b>two</b>, depending on the word’s <b>family</b>. So: (1) pick the family, (2) use that family’s ending.</div>' +
      '<h3>🟢 THING words (です) and 🟠 ACTION words (ます)</h3>' +
      '<table class="rule-table"><tr><th></th><th>🟢 THING (です)</th><th>🟠 ACTION (ます)</th><th>English</th></tr>' +
      rows.map(function (r) { return '<tr class="' + (r[0] === 'pastNeg' ? 'hl' : '') + '"><td class="en">' + r[1] + '</td><td>' + ek(E.thing[r[0]]) + '</td><td>' + ek(E.act[r[0]]) + '</td><td class="en">' + r[2] + '</td></tr>'; }).join('') + '</table>' +
      '<h3>🧱 Build it yourself, one brick at a time</h3>' +
      '<div class="order">' + K('たべ', 'tabe') + K('ます', 'masu') + ' → ' + K('たべ', 'tabe') + K('ません', 'masen', 'end') + ' <small>(NO brick)</small> → ' + K('たべ', 'tabe') + K('ません', 'masen', 'end') + K('でした', 'deshita', 'end') + ' <small>(+ BEFORE brick) = didn’t eat</small></div>' +
      '<div class="order">' + K('がくせい', 'gakusē') + K('です', 'desu') + ' → ' + K('がくせい', 'gakusē') + K('じゃない', 'ja nai', 'end') + K('です', 'desu') + ' → ' + K('がくせい', 'gakusē') + K('じゃなかった', 'ja nakatta', 'end') + K('です', 'desu') + ' <small>= wasn’t a student</small></div>' +
      '<div class="note">⚠ Don’t cross the families! Eating is an action → <b>たべませんでした</b>. A drama is a thing → <b>ドラマじゃなかったです</b>. Tricky: <b>やすみ</b> can be a thing (day off) <i>or</i> an action (やすみます, to rest).</div>' +
      '<h3>🧩 How a Japanese sentence is ordered</h3><div class="order">' +
      [['When', 'time'], ['Who は', 'subj'], ['With と', 'with'], ['Where で', 'place'], ['What を', 'obj'], ['ACTION', 'verb']].map(function (x) { return '<span class="lg" style="--pc:' + UI.ROLE_COLOR[x[1]] + '">' + x[0] + '</span>'; }).join(' → ') + '</div>' +
      '<p>The <b>action goes last</b> and every noun gets a little <b>particle</b> tag. Example: ' + K('きのう', 'kinō') + ' ' + K('わたし', 'watashi') + K('は', 'wa') + ' ' + K('あさごはん', 'asagohan') + K('を', 'o') + ' ' + K('たべ', 'tabe') + K('ませんでした', 'masen deshita', 'end') + '</p>' +
      '<h3>🏷️ Particles</h3><div class="pgrid">' + pg + '</div>' +
      '<h3>🔤 Two kana alphabets</h3><div class="note"><b>ひらがな hiragana</b> is for Japanese words and endings (ます, です, たべる). <b>カタカナ katakana</b> is mostly for foreign words and sounds (ケーキ, パーティー, バス). Practise both in the <b>Script Sorter</b>!</div><p style="text-align:center"><button type="button" class="btn go" data-act2="kanachart">🔤 Open the kana chart (tap to hear)</button></p>', { cls: 'wide' });
  }
  function kanaChart(tab) {
    tab = tab || 'hira';
    const rows = [['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'], ['た', 'ち', 'つ', 'て', 'と'], ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['ま', 'み', 'む', 'め', 'も'], ['や', null, 'ゆ', null, 'よ'], ['ら', 'り', 'る', 'れ', 'ろ'], ['わ', null, null, null, 'を'], ['ん', null, null, null, null],
      ['が', 'ぎ', 'ぐ', 'げ', 'ご'], ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], ['だ', 'ぢ', 'づ', 'で', 'ど'], ['ば', 'び', 'ぶ', 'べ', 'ぼ'], ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']];
    const conv = function (c) { return tab === 'kata' ? String.fromCharCode(c.charCodeAt(0) + 0x60) : c; };
    const body = rows.map(function (r, i) {
      return (i === 11 ? '<div class="kdiv">Voiced sounds (゛ and ゜)</div>' : '') + '<div class="krow">' + r.map(function (c) {
        return c ? '<button type="button" class="kchar" data-say="' + conv(c) + '">' + K(conv(c), JP.Kana.romaji(conv(c))) + '</button>' : '<span class="kgap"></span>';
      }).join('') + '</div>';
    }).join('');
    UI.modal('<h2>🔤 Kana chart</h2><div class="seg" style="display:inline-flex;margin-bottom:10px"><button type="button" data-ktab="hira" class="' + (tab === 'hira' ? 'on' : '') + '">ひらがな Hiragana</button><button type="button" data-ktab="kata" class="' + (tab === 'kata' ? 'on' : '') + '">カタカナ Katakana</button></div>' +
      '<p class="book-sub">' + (tab === 'hira' ? 'Hiragana is for Japanese words and endings.' : 'Katakana is mostly for foreign words and sounds.') + ' Tap a character to hear it!</p><div class="kchart">' + body + '</div>', { cls: 'wide' });
  }
  function badges() {
    const B = Game.BADGES;
    UI.modal('<h2>🏅 Badges</h2><div class="badge-grid">' + Object.keys(B).map(function (k) { return '<div class="bd ' + (Store.hasBadge(k) ? '' : 'off') + '"><div class="be">' + B[k].e + '</div><b>' + B[k].n + '</b><small>' + B[k].d + '</small></div>'; }).join('') + '</div>');
  }

  /* ---------- navigation ---------- */
  function nav(where) {
    JP.Voice.stop();
    if (where === 'home') home();
    else if (where === 'book') { state.screen = 'book'; Game.stickerBook(); }
    else if (where === 'badges') badges();
  }

  /* ---------- events ---------- */
  document.addEventListener('pointerdown', function first() { JP.Audio.unlock(); document.removeEventListener('pointerdown', first); }, { once: true });
  document.addEventListener('click', function (e) {
    const t = e.target;
    if (t.closest('[data-close]')) { UI.closeModal(); return; }
    let el;
    if ((el = t.closest('#t-romaji'))) { Store.set('romaji', !Store.setting('romaji')); applySettings(); JP.Audio.play('pop'); return; }
    if ((el = t.closest('#t-sfx'))) { Store.set('sfx', !Store.setting('sfx')); applySettings(); JP.Audio.play('pop'); return; }
    if ((el = t.closest('#t-music'))) { Store.set('music', !Store.setting('music')); JP.Audio.unlock(); JP.Audio.applyMusicSetting(); applySettings(); return; }
    if ((el = t.closest('#t-voice'))) { Store.set('voice', !Store.setting('voice')); if (!Store.setting('voice')) JP.Voice.stop(); applySettings(); JP.Audio.play('pop'); return; }
    if ((el = t.closest('#t-set'))) { JP.Audio.play('tap'); settings(); return; }
    if ((el = t.closest('#t-help'))) { JP.Audio.play('tap'); rules(); return; }
    if ((el = t.closest('[data-nav]'))) { JP.Audio.play('tap'); UI.closeModal(); nav(el.dataset.nav); return; }
    if ((el = t.closest('[data-world]'))) { JP.Audio.play('whoosh'); hub(el.dataset.world); return; }
    if ((el = t.closest('[data-level]'))) { Store.set('level', +el.dataset.level); JP.Audio.play('pop'); hub(state.world); return; }
    if ((el = t.closest('[data-game]'))) { JP.Audio.play('pop'); Game.start(el.dataset.game, state.world); return; }
    if ((el = t.closest('[data-set]'))) {
      const k = el.dataset.set; Store.set(k, !Store.setting(k)); el.setAttribute('aria-pressed', Store.setting(k) ? 'true' : 'false');
      if (k === 'music') { JP.Audio.unlock(); JP.Audio.applyMusicSetting(); }
      applySettings(); JP.Audio.play('pop'); return;
    }
    if ((el = t.closest('[data-segset]'))) {
      Store.set(el.dataset.segset, +el.dataset.val);
      UI.$$('[data-segset="' + el.dataset.segset + '"]').forEach(function (b) { b.classList.toggle('on', b === el); });
      JP.Audio.play('pop'); return;
    }
    if ((el = t.closest('[data-act2="kanachart"]'))) { JP.Audio.play('tap'); kanaChart('hira'); return; }
    if ((el = t.closest('[data-ktab]'))) { JP.Audio.play('pop'); kanaChart(el.dataset.ktab); return; }
    if ((el = t.closest('.kchar'))) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); JP.Audio.play('pop'); JP.Voice.speak(el.dataset.say); return; }
    if (t.closest('#testvoice')) { JP.Voice.speak('こんにちは。にほんごを べんきょうします。'); return; }
    if (t.closest('#editname')) { welcome(false); return; }
    if ((el = t.closest('[data-avatar]'))) { Store.get().avatar = el.dataset.avatar; Store.save(); UI.$$('[data-avatar]').forEach(function (b) { b.classList.toggle('on', b === el); }); JP.Audio.play('pop'); return; }
    if (t.closest('#savename')) {
      const v = ($('#nameinput').value || '').trim().slice(0, 14);
      Store.get().name = v || 'ともだち'; Store.save(); JP.Audio.play('correct'); UI.closeModal(); UI.confetti(60, { emoji: ['🌸', '⭐'] });
      if (state.screen === 'home') home(); return;
    }
    if (t.closest('#resetall')) { if (window.confirm('Erase all stickers, stars and badges on this device?')) { const keep = Store.get(); Store.reset(); UI.closeModal(); renderTopbar(); home(); welcome(true); } return; }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'rate') { Store.set('rate', +e.target.value); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') UI.closeModal();
    if (e.key === 'Enter' && e.target.id === 'nameinput') { const b = $('#savename'); if (b) b.click(); }
  });

  /* ---------- boot ---------- */
  function init() {
    renderTopbar();
    Game.setHooks({
      home: home,
      hub: function (w) { hub(w || 'all'); },
      again: function (g, w) { Game.start(g, w); }
    });
    home();
    if (!Store.get().name) welcome(true);
    if (window.speechSynthesis && window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', function () { /* availability refreshes automatically */ });
  }
  JP.App = { home: home, hub: hub, settings: settings, rules: rules, state: state };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(globalThis.JP = globalThis.JP || {});
