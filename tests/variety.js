// Starts the same game many times and checks that every round is a different set of questions.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForSelector('#nameinput'); await page.fill('#nameinput', 'T'); await page.click('#savename');
  await page.evaluate(() => JP.Voice.force(true));
  const combos = [['words', 'food'], ['words', 'jobs'], ['words', 'feelings'], ['sentence', 'school'], ['sentence', 'animals'], ['particle', 'family'], ['lab', 'town'], ['adventure', 'all'], ['adventure', 'events'], ['script', 'play'], ['match', 'days']];
  let bad = 0;
  for (const [g, w] of combos) {
    const sets = [];
    for (let i = 0; i < 15; i++) {
      const keys = await page.evaluate(([g, w]) => {
        JP.Game.start(g, w);
        const S = JP.Game.current();
        if (g === 'match') { return Array.from(document.querySelectorAll('.mcard .mc-kana .k')).map(e => e.textContent).sort(); }
        return S.qs.map(q => q.key);
      }, [g, w]);
      sets.push(keys);
    }
    let identical = 0, maxOverlap = 0, sumOverlap = 0, dupWithin = 0;
    for (let i = 0; i < sets.length; i++) {
      if (new Set(sets[i]).size !== sets[i].length) dupWithin++;
      for (let j = 0; j < i; j++) {
        if (sets[i].slice().sort().join('|') === sets[j].slice().sort().join('|')) identical++;
      }
      if (i > 0) {
        const a = new Set(sets[i - 1]); const ov = sets[i].filter(k => a.has(k)).length / sets[i].length;
        sumOverlap += ov; maxOverlap = Math.max(maxOverlap, ov);
      }
    }
    const status = identical === 0 && dupWithin === 0 ? 'OK ' : 'BAD';
    if (status === 'BAD') bad++;
    console.log(status, (g + '/' + w).padEnd(22), 'rounds:', sets.length, 'identical sets:', identical, 'duplicate Qs in a round:', dupWithin,
      'avg overlap with previous round:', (sumOverlap / (sets.length - 1) * 100).toFixed(0) + '%', 'max:', (maxOverlap * 100).toFixed(0) + '%');
  }
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(bad || errors.length ? 1 : 0);
})();
