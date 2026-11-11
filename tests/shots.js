// Takes screenshots of the main screens and each question type for visual review.
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const WIDE = process.env.NARROW ? { width: 400, height: 860 } : { width: 1000, height: 900 };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: WIDE, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => d.accept());
  const tag = process.env.NARROW ? 'm' : 'd';
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForSelector('#nameinput'); await page.fill('#nameinput', 'Kai'); await page.click('#savename');
  await page.evaluate(() => { JP.Voice.force(true); JP.Store.set('music', false); });
  const shot = async (name) => { await page.waitForTimeout(450); await page.screenshot({ path: OUT + '/' + tag + '-' + name + '.png' }); };

  await page.evaluate(() => JP.App.hub('food'));
  await shot('02-hub-food');

  // a specific word question, shown directly
  const showWord = async (type, wid, world, level) => {
    await page.evaluate(([type, wid, world, level]) => {
      JP.Store.set('level', level);
      JP.Game.start('words', world);
      const S = JP.Game.current();
      const q = JP.Q.makeWordQ(type, JP.WORD[wid], S.env); q.key = 'dbg';
      JP.Game.debugShow(q);
    }, [type, wid, world, level]);
  };
  await showWord('pic2kana', 'ringo', 'food', 2); await shot('03-pic2kana');
  await showWord('kana2pic', 'neko', 'animals', 2); await shot('04-kana2pic');
  await showWord('spell', 'sushi', 'food', 2);
  await page.click('#bank .ktile'); await shot('05-spell');
  await showWord('missing', 'tanjoubi', 'events', 2); await shot('06-missing');
  await showWord('script', 'keki', 'food', 2); await shot('07-script');
  await showWord('listen2kana', 'densha', 'town', 2); await shot('08-listen');

  // sentence builder with feedback
  await page.evaluate(() => {
    JP.Store.set('level', 2); JP.Game.start('sentence', 'food');
    const s = JP.Sent.generate('food', { forms: ['pastNeg'], kinds: ['act'] });
    JP.Game.debugShow({ type: 'sentence', key: 'dbg', sent: s, prompt: 'Build the sentence!' });
  });
  const ids = await page.evaluate(() => JP.Game.current().qs[0].sent.tokens.map(t => t.id));
  for (const id of ids.slice(0, 3)) await page.click('#tbank button.tile[data-tid="' + id + '"]');
  await shot('09-sentence-building');
  for (const id of ids.slice(3)) await page.click('#tbank button.tile[data-tid="' + id + '"]');
  await page.click('#sb-check');
  await page.waitForSelector('#fbhost .fb');
  await shot('10-sentence-correct');

  await page.evaluate(() => {
    JP.Store.set('level', 1); JP.Game.start('particle', 'school');
    const c = JP.Q.particleCands('school', 6, 1)[0];
    JP.Game.debugShow(c.q);
  });
  await shot('11-particle');
  const ci = await page.evaluate(() => JP.Game.current().qs[0].opts.findIndex(o => o.ok));
  await page.click('#qhost .opt[data-i="' + ci + '"]');
  await shot('12-particle-answered');

  // lab: bricks, family, mistake, answer
  const labShow = async (sub, name) => {
    await page.evaluate((sub) => {
      JP.Store.set('level', 2); JP.Game.start('lab', 'food');
      let c; for (let i = 0; i < 40; i++) { c = JP.Q.labCands('food', 30, 2).filter(x => x.type === sub)[0]; if (c) break; }
      JP.Game.debugShow(c.q);
    }, sub);
    await shot(name);
  };
  await labShow('lab_family', '13-lab-family');
  await labShow('lab_bricks', '14-lab-bricks');
  await labShow('lab_mistake', '15-lab-mistake');
  await labShow('lab_answer', '16-lab-answer');
  await labShow('lab_ending', '17-lab-ending');
  const e = await page.evaluate(() => JP.Game.current().qs[0].opts.findIndex(o => o.ok));
  await page.click('#qhost .opt[data-i="' + e + '"]');
  await shot('18-lab-ending-answered');

  // match, learn, book, results, modals
  await page.evaluate(() => { JP.Store.set('level', 2); JP.Game.start('match', 'animals'); });
  await page.click('.mcard:nth-child(1)'); await page.click('.mcard:nth-child(2)');
  await shot('19-match');
  await page.evaluate(() => JP.Game.start('learn', 'family'));
  await shot('20-learn-noun');
  await page.evaluate(() => JP.Game.start('learn', 'verbs'));
  await shot('21-learn-verb');
  await page.evaluate(() => { JP.Game.start('words', 'food'); });
  // play out a round quickly to reach results
  for (let g = 0; g < 40; g++) {
    if (await page.$('.results')) break;
    const info = await page.evaluate(() => { const S = JP.Game.current(); const q = S.qs[S.i]; return { c: q.opts ? q.opts.findIndex(o => o.ok) : -1, type: q.type, t: q.target }; });
    if (info.type === 'spell') { for (const ch of info.t) { const bs = await page.$$('#bank .ktile:not(.used)'); for (const b of bs) { if ((await b.$eval('.k', x => x.textContent)) === ch) { await b.click(); break; } } } await page.click('#sp-check'); }
    else await page.click('#qhost .opt[data-i="' + info.c + '"]');
    await page.waitForSelector('#fbhost .next'); await page.click('#fbhost .next');
  }
  await page.waitForTimeout(1500); await shot('22-results');
  await page.evaluate(() => JP.Game.stickerBook());
  await shot('23-stickers');
  await page.evaluate(() => JP.App.rules());
  await shot('24-rules');
  await page.evaluate(() => { document.querySelector('.modal-x').click(); JP.App.settings(); });
  await shot('25-settings');
  await page.evaluate(() => { document.querySelector('.modal-x').click(); });
  await page.click('#t-romaji');
  await page.evaluate(() => JP.App.hub('events'));
  await shot('26-hub-noromaji');
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})();
