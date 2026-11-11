// Plays every game in the real page, answering right and wrong, and checks for errors.
const { chromium } = require('playwright');
const path = require('path');

async function answerOne(page, mode) {
  const info = await page.evaluate(() => {
    const S = JP.Game.current(); const q = S.qs[S.i];
    const o = { type: q.type, bonus: !!q.bonus };
    if (q.opts && q.type !== 'lab_bricks') { o.correct = q.opts.findIndex(x => x.ok); o.n = q.opts.length; }
    if (q.type === 'spell') o.target = q.target;
    if (q.type === 'sentence') o.ids = q.sent.tokens.map(t => t.id);
    if (q.type === 'lab_family') o.fam = q.item.family;
    if (q.type === 'lab_bricks') {
      const B = { act: { pres: ['ます'], presNeg: ['ません'], past: ['ました'], pastNeg: ['ません', 'でした'] }, thing: { pres: ['です'], presNeg: ['じゃ', 'ない', 'です'], past: ['でした'], pastNeg: ['じゃ', 'なかった', 'です'] } };
      o.want = B[q.item.family][q.form];
    }
    return o;
  });
  const right = mode === 'right' || (mode === 'mixed' && Math.random() < 0.7);
  const t = info.type;
  if (info.correct !== undefined) {
    const pick = right ? info.correct : (info.correct + 1) % info.n;
    await page.click('#qhost .opt[data-i="' + pick + '"]');
  } else if (t === 'lab_family') {
    const f = right ? info.fam : (info.fam === 'act' ? 'thing' : 'act');
    await page.click('#qhost .opt[data-f="' + f + '"]');
  } else if (t === 'spell') {
    if (right) {
      for (const ch of info.target) {
        const btns = await page.$$('#bank .ktile:not(.used)');
        for (const b of btns) { const txt = await b.$eval('.k', e => e.textContent); if (txt === ch) { await b.click(); break; } }
      }
      await page.click('#sp-check');
    } else {
      for (let i = 0; i < info.target.length; i++) { const bs = await page.$$('#bank .ktile:not(.used)'); await bs[0].click(); }
      await page.click('#sp-check');
      if (await page.$('#sp-check:not([disabled])')) { await page.click('#sp-check'); }
    }
  } else if (t === 'sentence') {
    if (right) {
      for (const id of info.ids) await page.click('#tbank button.tile[data-tid="' + id + '"]');
      await page.click('#sb-check');
    } else {
      for (const id of info.ids.slice().reverse()) await page.click('#tbank button.tile[data-tid="' + id + '"]');
      await page.click('#sb-check');
      if (await page.$('#sb-check:not([disabled])')) await page.click('#sb-check');
    }
  } else if (t === 'lab_bricks') {
    const seq = right ? info.want : ['です', 'ます'];
    for (const b of seq) {
      const btns = await page.$$('#bb button.tile:not(.ghost)');
      for (const el of btns) { const txt = await el.$eval('.k', e => e.textContent); if (txt === b) { await el.click(); break; } }
    }
    await page.click('#bk-check');
    if (!right && await page.$('#bk-check:not([disabled])')) await page.click('#bk-check');
  } else throw new Error('unhandled type ' + t);
  await page.waitForSelector('#fbhost .fb', { timeout: 3000 });
  const cls = await page.$eval('#fbhost .fb', e => e.className);
  return { type: t, cls: cls, bonus: info.bonus };
}

async function playRound(page, mode) {
  const seen = [];
  for (let guard = 0; guard < 40; guard++) {
    if (await page.$('.results')) break;
    const r = await answerOne(page, mode);
    seen.push(r);
    await page.click('#fbhost .next');
    await page.waitForTimeout(20);
  }
  await page.waitForSelector('.results', { timeout: 4000 });
  return seen;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => d.accept());
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForSelector('#nameinput'); await page.fill('#nameinput', 'Kai'); await page.click('#savename');
  await page.evaluate(() => JP.Voice.force(true));
  const types = {}; let rounds = 0; const fbClasses = {};
  const worlds = await page.evaluate(() => JP.WORLDS.map(w => w.id).concat(['slides', 'all']));
  const levels = (process.env.LEVELS || '1,2,3').split(',').map(Number);
  for (const level of levels) {
    await page.evaluate(l => JP.Store.set('level', l), level);
    for (const w of worlds) {
      for (const g of ['adventure', 'words', 'sentence', 'particle', 'lab', 'script']) {
        try {
          await page.evaluate(([g, w]) => JP.Game.start(g, w), [g, w]);
          const seen = await playRound(page, 'mixed');
          rounds++;
          seen.forEach(s => { types[s.type] = (types[s.type] || 0) + 1; fbClasses[s.cls] = (fbClasses[s.cls] || 0) + 1; });
        } catch (e) {
          errors.push('FAILED ' + g + '/' + w + '/L' + level + ': ' + e.message.split('\n')[0]);
          await page.screenshot({ path: (process.env.SHOTS || '/tmp') + '/fail-' + g + '-' + w + '-' + level + '.png' });
        }
      }
    }
    console.log('level', level, 'done; rounds so far', rounds, 'errors', errors.length);
  }
  console.log('question types exercised:', JSON.stringify(types));
  console.log('feedback classes:', JSON.stringify(fbClasses));
  console.log('errors:', errors.length ? errors.slice(0, 12) : 'none');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
