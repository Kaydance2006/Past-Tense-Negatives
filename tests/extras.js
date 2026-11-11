// Checks features outside the main quiz loop: romaji toggle, kana chart, match game, persistence, stickers.
const { chromium } = require('playwright');
const path = require('path');
let failures = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failures++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => d.accept());
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url);
  await page.waitForSelector('#nameinput'); await page.fill('#nameinput', 'Mika'); await page.click('#savename');
  await page.evaluate(() => { JP.Voice.force(true); JP.Store.set('music', false); });

  // --- romaji toggle really hides romaji everywhere ---
  await page.evaluate(() => JP.App.hub('food'));
  const visibleRo = () => page.evaluate(() => Array.from(document.querySelectorAll('.ro')).filter(e => e.offsetParent !== null && e.textContent.trim()).length);
  ok(await visibleRo() > 0, 'romaji visible when ON');
  await page.click('#t-romaji');
  ok(await visibleRo() === 0, 'romaji hidden when OFF');
  await page.evaluate(() => JP.Game.start('sentence', 'food'));
  ok(await visibleRo() === 0, 'romaji stays hidden inside a game');
  await page.click('#t-romaji');
  ok(await visibleRo() > 0, 'romaji back ON mid-game');

  // --- kana chart ---
  await page.click('#t-help');
  await page.click('[data-act2="kanachart"]');
  const nChars = await page.evaluate(() => document.querySelectorAll('.kchar').length);
  ok(nChars === 71, 'kana chart has 71 hiragana characters (got ' + nChars + ')');
  await page.click('[data-ktab="kata"]');
  const first = await page.evaluate(() => document.querySelector('.kchar .k').textContent);
  ok(first === 'ア', 'katakana tab shows katakana (got ' + first + ')');
  await page.click('.modal-x');

  // --- sentence success unlocks noun stickers ---
  await page.evaluate(() => { JP.Store.reset(); JP.Store.get().name = 'Mika'; JP.Game.start('sentence', 'animals'); });
  const ids = await page.evaluate(() => { const S = JP.Game.current(); return S.qs[0].sent.tokens.map(t => t.id); });
  for (const id of ids) await page.click('#tbank button.tile[data-tid="' + id + '"]');
  await page.click('#sb-check');
  await page.waitForSelector('#fbhost .fb.ok');
  ok(await page.evaluate(() => JP.Game.stickerCount() >= 1), 'correct sentence unlocks at least one sticker');
  ok(await page.$('.sticker-new') !== null, 'sticker banner shown');

  // --- full Memory Match solve ---
  await page.evaluate(() => { JP.Store.set('level', 1); JP.Game.start('match', 'food'); });
  const pairs = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.mcard'));
    const byWord = {};
    cards.forEach((el, i) => {
      const kana = el.querySelector('.mc-kana .k');
      let id = null;
      if (kana) { const w = JP.WORDS.find(x => x.kana === kana.textContent); id = w && w.id; }
      else { const em = el.querySelector('.mc-pic'); const w = JP.WORDS.find(x => em && x.emoji === em.textContent); id = w && w.id; }
      (byWord[id] = byWord[id] || []).push(i);
    });
    return Object.values(byWord);
  });
  ok(pairs.length === 4 && pairs.every(p => p.length === 2), 'match board has 4 complete pairs');
  for (const [a, b] of pairs) { await page.click('.mcard:nth-child(' + (a + 1) + ')'); await page.click('.mcard:nth-child(' + (b + 1) + ')'); await page.waitForTimeout(450); }
  await page.waitForSelector('.results', { timeout: 5000 });
  ok(true, 'match game reaches results after solving');

  // --- persistence ---
  const before = await page.evaluate(() => ({ stars: JP.Store.get().stars, st: JP.Game.stickerCount(), name: JP.Store.get().name }));
  await page.reload();
  await page.waitForSelector('.worlds');
  const after = await page.evaluate(() => ({ stars: JP.Store.get().stars, st: JP.Game.stickerCount(), name: JP.Store.get().name }));
  ok(JSON.stringify(before) === JSON.stringify(after) && before.st > 0, 'progress survives a reload ' + JSON.stringify(after));

  // --- study cards walk-through ---
  await page.evaluate(() => JP.Game.start('learn', 'jobs'));
  const total = await page.evaluate(() => JP.wordsOf('jobs').length);
  for (let i = 1; i < total; i++) await page.click('[data-lnav="1"]');
  ok(await page.$('[data-act="quizme"]') !== null, 'last study card offers Quiz me');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(failures || errors.length ? 1 : 0);
})();
