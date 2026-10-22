// What the player sees: screenshots from where a player would stand, plus the checks the floor plan depends on.
//   node tools/test/shots.js http://localhost:8000/ out-folder        (serve dist/netlify/the-magic first)
// Headless WebGL runs on SwiftShader at about one frame a second, so every view waits for real frames.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs'), path = require('path');

const VIEWS = [
  // [file, room, x, z (the room's own coordinates), the world point to look at]
  ['01-start', 'start'],
  ['02-table-west', 0, 'table'],                          // up on the table, head out of the skylight, looking along the slates
  ['03-attic-back', 0, 0.3, -0.6, [-0.2, 1.0, 1.8]],      // the door and the cold grate
  ['04-attic-bed', 0, 0.55, 0.9, [-1.0, 0.35, -0.2]],     // the iron bedstead, the moonlight on the boards
  ['05-floor-up', 0, 0, -0.62, [0, 2.8, -1.3]],           // from the floor the skylight shows only sky
  ['06-becky-room', 1, -0.2, -0.4, [3.8, 0.2, 0.0]],      // look points are world coordinates: Becky's room starts at x 1.62
  ['07-leads-arrive', 2, 'skylight'],
  ['08-leads-into-next', 2, -1.42, -2.22, [-4.3, 0.8, -0.45]],   // world x,z: over the party wall, down into his attic
  ['09-leads-back', 2, 0.6, -3.7, [-0.8, 2.3, 0.2]],      // looking back at the roofs, both skylights and the stacks
  ['10-leads-square', 2, 0.4, -3.6, [0.4, 0.5, -26]],     // over the parapet to the square
  ['05b-catch', 0, 0, -0.62, [0, 1.40, -1.70]],             // clue 1 from the floor: the scraped catch must catch the eye
  ['07b-prints', 2, -0.3, -2.9, [-0.7, 1.15, -2.35]],       // clue 2: the footprints on the lead, by moonlight
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
  // the opening card says what the player is here to do; close it as a player would
  await page.waitForTimeout(300);
  if (!(await page.evaluate(() => document.getElementById('card').hidden))) await page.keyboard.press('e');
  await page.evaluate(() => document.exitPointerLock && document.exitPointerLock());
  const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const shot = async name => { await frames(3); await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); console.log('shot', name); };

  for (const [name, room, x, z, look] of VIEWS) {
    if (room === 'start') { await shot(name); continue; }
    if (typeof x === 'string') await page.evaluate(([i, at]) => window.__game.enter(i, at), [room, x]);
    else if (room === 2) await page.evaluate(([x, z, look]) => window.__game.placeWorld(2, x, z, look), [x, z, look]);
    else await page.evaluate(([i, x, z, look]) => window.__game.place(i, x, z, look), [room, x, z, look]);
    await shot(name);
  }
  for (const [i, name] of [[0, 'top-attic'], [1, 'top-becky'], [2, 'top-leads']]) {
    await page.evaluate(i => window.__game.topDown(i), i);
    await shot('11-' + name);
    await page.evaluate(() => window.__game.clearView());
  }

  // What the book promises. From the floor your skylight shows only sky; up on the table you see the next attic's
  // skylight lit; from the leads you can see down into his attic. Every spot a player can stand on, 15 cm apart.
  const report = await page.evaluate(() => {
    const g = window.__game, out = {}, [tx, tz] = g.tableXZ();
    out.fromTheTable = { glass: g.seen('glass', 0, tx, tz, g.tableEye), rug: g.seen('rug', 0, tx, tz, g.tableEye) };
    for (const [i, key, what] of [[0, 'fromYourFloor', 'glass'], [2, 'fromTheLeads', 'rug']]) {
      const b = g.bounds(i); let spots = 0, seeing = 0, best = 0;
      for (let x = b.minX; x <= b.maxX; x += 0.15) for (let z = b.minZ; z <= b.maxZ; z += 0.15) {
        if (!g.canStand(i, x, z)) continue;
        const v = g.seen(what, i, x, z); spots++; best = Math.max(best, v); if (v >= 0.25) seeing++;
      }
      out[key] = { what, standingSpots: spots, spotsSeeingAQuarter: seeing, bestShare: +best.toFixed(2) };
    }
    return out;
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.fromTheTable.glass < 0.5) errors.push("from the table you should see next door's skylight");
  if (report.fromYourFloor.spotsSeeingAQuarter > 0) errors.push('from the floor your skylight should show only sky');
  if (report.fromTheLeads.spotsSeeingAQuarter === 0) errors.push('from the leads you should be able to see into his attic');

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
  // onto the table, out onto the leads, back in (onto the table again), and down
  const press = async () => { await page.keyboard.press('e'); await page.waitForTimeout(1300); await frames(2); };
  const facing = () => page.evaluate(() => window.__game.target);
  const state = () => page.evaluate(() => ({ room: window.__game.room, perched: window.__game.perched }));
  const step = async (name, setup, want, check) => {
    await page.evaluate(setup); await frames(2);
    const t = await facing(); if (t !== want) { errors.push(`${name}: facing ${want}, found ${t}`); return false; }
    await press(); const st = await state();
    if (!check(st)) { errors.push(`${name}: ended in ${JSON.stringify(st)}`); return false; }
    console.log('ok', name, JSON.stringify(st)); return true;
  };
  await step('climb onto the table', () => window.__game.place(0, 0, -0.62, [0, 0.68, -1.15]), 'table', st => st.room === 0 && st.perched);
  await step('climb out', () => window.__game.look(0, 1.25, -2.3), 'skylight_out', st => st.room === 2 && !st.perched);
  await step('climb back in', () => { window.__game.enter(2, 'skylight'); window.__game.look(0, 1.75, -1.35); }, 'skylight_in', st => st.room === 0 && st.perched);
  await step('climb down', () => window.__game.look(0.05, 0.68, -1.05), 'table', st => st.room === 0 && !st.perched);
  // and the easy ways down: a move key, or E with nothing in view
  for (const [how, act] of [['a move key', async () => { await page.keyboard.down('s'); await page.waitForTimeout(400); await page.keyboard.up('s'); }], ['E at nothing', async () => { await page.keyboard.press('e'); }]]) {
    await page.evaluate(() => window.__game.place(0, 0, -0.62, [0, 0.68, -1.15])); await frames(2); await page.keyboard.press('e'); await page.waitForTimeout(1300); await frames(2);
    await page.evaluate(() => window.__game.look(0, 6, -1.2)); await frames(2);   // look up at the sky: nothing to examine
    await act(); await page.waitForTimeout(1300); await frames(2);
    const st = await state(); if (st.perched) errors.push(`climbing down with ${how} didn't work`); else console.log('ok climb down with', how);
  }
  // and from the floor the skylight can't be climbed through
  await page.evaluate(() => window.__game.place(0, 0, -0.62, [0, 2.0, -1.3])); await frames(2);
  const up = await facing(); if (up === 'skylight_out') errors.push('the skylight can be climbed through from the floor');

  // Near misses: small things beside big ones must still be easy to pick out. [what to expect, x, z, the point aimed at]
  for (const [want, x, z, look] of [['catch', 0, -0.62, [0.1, 1.43, -1.69]], ['catch', 0.25, -0.6, [-0.08, 1.38, -1.69]],
    ['candle', 0.35, -0.55, [0.19, 0.69, -1.06]], ['table', 0, -0.62, [-0.18, 0.68, -1.2]]]) {
    await page.evaluate(([x, z, look]) => window.__game.place(0, x, z, look), [x, z, look]); await frames(2);
    const t = await page.evaluate(() => window.__game.target);
    if (t !== want) errors.push(`aiming near ${want} at ${look} picked ${t}`); else console.log('ok near miss picks', want);
  }

  // Every one of Sara's thoughts can be reached from where a player stands, and opens its card. (By now every room
  // has been visited, so seeing the last one must bring up the end-of-build note: an unfinished game must never
  // look broken.) [id, room, x, z in that room's own coordinates, the world point to look at]
  // (the three signs are in this list too; the last of them must be the last entry, so its payoff cards follow)
  const THOUGHTS = [['bed', 0, -0.2, 0.2, [-1.05, 0.5, 0.0]], ['footstool', 0, 0.6, -0.45, [0.62, 0.15, -1.0]], ['grate', 0, -0.5, 0.7, [-0.7, 0.35, 1.5]],
    ['candle', 0, 0.3, -0.6, [0.26, 0.72, -1.04]], ['skylight_look', 0, 0, -0.62, [0, 2.0, -1.3]], ['catch', 0, 0, -0.62, [0, 1.40, -1.70]],
    ['becky_bed', 1, -0.3, 0.0, [3.77, 0.5, 0.0]], ['party_wall', 2, 'w', -1.0, -3.0, [-1.56, 1.6, -3.0]], ['square', 2, 'w', 0.4, -3.5, [0.4, 1.45, -3.9]],
    ['prints', 2, 'w', -0.3, -2.9, [-0.7, 1.15, -2.35]], ['next_door', 2, 'w', -1.42, -2.22, [-3.12, 1.9, -1.35]]];
  for (const th of THOUGHTS) {
    const [id, room] = th, world = th[2] === 'w', [x, z, look] = world ? th.slice(3) : th.slice(2);
    await page.evaluate(([room, world, x, z, look]) => world ? window.__game.placeWorld(room, x, z, look) : window.__game.place(room, x, z, look), [room, world, x, z, look]);
    await frames(2);
    const t = await page.evaluate(() => window.__game.target);
    if (t !== id) { errors.push(`thought ${id}: facing it found ${t}`); continue; }
    await page.keyboard.press('e'); await frames(2);
    const title = await page.evaluate(() => !document.getElementById('card').hidden && document.getElementById('cardTitle').textContent);
    if (!title) { errors.push(`thought ${id}: no card opened`); continue; }
    console.log('ok thought', id, '->', title);
    await page.keyboard.press('e'); await page.waitForTimeout(900); await frames(2);
  }
  const cardTitle = () => page.evaluate(() => !document.getElementById('card').hidden && document.getElementById('cardTitle').textContent);
  const found = await page.evaluate(() => window.__game.found.length);
  if (found !== 3) errors.push(`expected 3 signs found, found ${found}`);
  const payoff = await cardTitle();
  if (payoff !== 'Someone comes across the roof') errors.push(`after the third sign, expected the payoff card, found ${payoff}`);
  else { console.log('ok payoff card'); await page.keyboard.press('e'); await page.waitForTimeout(900); await frames(2);
    const end = await cardTitle();
    if (end !== 'That is all, for now') errors.push(`after the payoff, expected the end-of-build note, found ${end}`); else console.log('ok end-of-build note'); }

  await browser.close();
  if (errors.length) { console.error('FAILED\n' + errors.join('\n')); process.exit(1); }
  console.log("OK: views taken, the book's sightlines hold, every way between rooms works");
})();
