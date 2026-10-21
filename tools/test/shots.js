// What the player sees: screenshots from where a player would stand, plus the checks the floor plan depends on.
//   node tools/test/shots.js http://localhost:8000/ out-folder        (serve dist/netlify/the-magic first)
// Headless WebGL runs on SwiftShader at about one frame a second, so every view waits for real frames.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs'), path = require('path');

const VIEWS = [
  // [file, room, x, z (the room's own coordinates), the world point to look at]
  ['01-start', 'start'],
  ['02-sightline', 0, 0, -0.6, [0, 2.6, -5.6]],          // under the skylight, looking at the lit window
  ['03-attic-back', 0, 0.3, -0.9, [-0.2, 1.0, 1.8]],      // the door and the cold grate
  ['04-attic-moon', 0, 1.0, -0.3, [-0.6, 0.2, 0.4]],      // the mattress, the stool, the moonlight on the boards
  ['05-becky-out', 1, 0, -0.6, [0, 2.6, -5.6]],          // from Becky's attic toward the lit window: the stack is in the way
  ['06-becky-room', 1, -0.2, -0.4, [3.8, 0.2, 0.0]],   // look points are world coordinates: Becky's room starts at x 1.62
  ['07-leads-window', 2, 'entry'],
  ['08-leads-back', 2, 0.6, -3.7, [1.3, 2.3, 0.2]],       // world x,z here: looking back at the roofs and both skylights
  ['09-leads-moon', 2, -0.6, -2.6, [0.6, 7.5, -12]],
];

(async () => {
  const url = process.argv[2] || 'http://localhost:8000/';
  const out = process.argv[3] || 'shots';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 120000 });
  await page.click('#begin');
  await page.evaluate(() => document.exitPointerLock && document.exitPointerLock());
  const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const shot = async name => { await frames(3); await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); console.log('shot', name); };

  for (const [name, room, x, z, look] of VIEWS) {
    if (room === 'start') { await shot(name); continue; }
    if (x === 'entry') await page.evaluate(i => window.__game.enter(i, 'skylight'), room);
    else if (room === 2) await page.evaluate(([x, z, look]) => window.__game.placeWorld(2, x, z, look), [x, z, look]);
    else await page.evaluate(([i, x, z, look]) => window.__game.place(i, x, z, look), [room, x, z, look]);
    await shot(name);
  }
  for (const [i, name] of [[0, 'top-attic'], [1, 'top-becky'], [2, 'top-leads']]) {
    await page.evaluate(i => window.__game.topDown(i), i);
    await shot('10-' + name);
    await page.evaluate(() => window.__game.clearView());
  }

  // The floor plan's two promises. Every spot a player can stand on, 15 cm apart.
  const report = await page.evaluate(() => {
    const g = window.__game, out = {};
    for (const [i, key] of [[0, 'yourAttic'], [1, 'beckysAttic']]) {
      const b = g.bounds(i); let spots = 0, seeing = 0, best = 0, sum = 0;
      for (let x = b.minX; x <= b.maxX; x += 0.15) for (let z = b.minZ; z <= b.maxZ; z += 0.15) {
        if (!g.canStand(i, x, z)) continue;
        const v = g.windowVisibility(i, x, z); spots++; sum += v; best = Math.max(best, v); if (v >= 0.5) seeing++;
      }
      out[key] = { standingSpots: spots, seeMostOfTheWindow: +(seeing / spots).toFixed(2), averageShareVisible: +(sum / spots).toFixed(2), bestSpot: best };
    }
    out.leadsEntry = g.windowVisibility(2, ...g.entryXZ(2));
    return out;
  });
  console.log(JSON.stringify(report, null, 2));

  // Walking between rooms the way a player does: stand, face the thing, press E.
  const via = async (room, x, z, look, expectTarget, expectRoom) => {
    await page.evaluate(([i, x, z, look]) => window.__game.place(i, x, z, look), [room, x, z, look]);
    await frames(2);
    const t = await page.evaluate(() => window.__game.target);
    if (t !== expectTarget) { errors.push(`facing ${expectTarget} from room ${room} found ${t}`); return; }
    await page.keyboard.press('e'); await page.waitForTimeout(1300); await frames(2);
    const r = await page.evaluate(() => window.__game.room);
    if (r !== expectRoom) errors.push(`${expectTarget} led to room ${r}, not ${expectRoom}`);
    else console.log('ok', expectTarget, '->', expectRoom);
  };
  await via(0, 0.85, 0.9, [0.85, 1.0, 1.8], 'door_becky', 1);
  await via(1, -0.65, 0.9, [2.27, 1.0, 1.8], 'door_back', 0);   // her door is at world x 2.27
  await via(0, 0, -0.9, [0, 1.6, -1.35], 'skylight_out', 2);
  // from the leads: arrive where a player climbs out, then turn to the skylight behind you
  await page.evaluate(() => { window.__game.enter(2, 'skylight'); window.__game.look(0, 1.75, -1.35); });
  await frames(2);
  const t = await page.evaluate(() => window.__game.target);
  if (t !== 'skylight_in') errors.push(`facing the skylight from the leads found ${t}`);
  else { await page.keyboard.press('e'); await page.waitForTimeout(1300); await frames(2);
    const r = await page.evaluate(() => window.__game.room); if (r !== 0) errors.push(`skylight_in led to room ${r}`); else console.log('ok skylight_in -> 0'); }

  await browser.close();
  if (errors.length) { console.error('FAILED\n' + errors.join('\n')); process.exit(1); }
  console.log('OK: views taken, sightlines measured, every way between rooms works');
})();
