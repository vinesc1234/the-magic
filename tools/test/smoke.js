// Smoke test: load the game, skip the prologue, start, and make sure nothing errors.
//   node tools/test/smoke.js http://localhost:8000/            (serve dist/netlify/speckled-band first)
// Needs Playwright: npm i -D playwright && npx playwright install chromium
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => {
  const url = process.argv[2] || 'http://localhost:8000/';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => !document.getElementById('begin').disabled, null, { timeout: 120000 });
  const status = await page.textContent('#status');
  if (status.trim()) errors.push('load status: ' + status);
  await page.click('#prologueBtn'); await page.waitForTimeout(300);
  await page.click('#begin'); await page.waitForTimeout(1500);
  await page.evaluate(() => document.exitPointerLock && document.exitPointerLock());   // the game captures the mouse on start
  await page.screenshot({ path: process.argv[3] || 'smoke.png', timeout: 120000 });
  await browser.close();
  if (errors.length) { console.error('FAILED\n' + errors.join('\n')); process.exit(1); }
  console.log('OK: loaded, started, no errors');
})();
