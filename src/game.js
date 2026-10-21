<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const $ = id => document.getElementById(id);

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;   // brighter than pure moonlight so the corners stay readable
renderer.domElement.tabIndex = 0;
$('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const NIGHT = '#0b1020';
scene.background = new THREE.Color(NIGHT);
scene.fog = new THREE.FogExp2(NIGHT, 0.03);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.03, 120);   // far enough for the moon
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// Tiling: a PlaneGeometry's UVs run 0..1 across the whole face; a Shape geometry's UVs are in metres.
function tiled(tex, w, h, tile) { const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / tile, h / tile); t.needsUpdate = true; return t; }
const perMetre = (tex, tile) => tiled(tex, 1, 1, tile);

// ---------- shared materials and textures ----------
const floorTex = canvasTex(512, 512, (g, w, h) => {
  const n = 7, bw = w / n;
  for (let i = 0; i < n; i++) {
    let y = -rand() * 200;
    while (y < h) {
      const len = 180 + rand() * 260, l = 15 + rand() * 6;
      g.fillStyle = `hsl(24 ${30 + rand() * 10}% ${l}%)`; g.fillRect(i * bw, y, bw, len);
      g.globalAlpha = 0.1; for (let k = 0; k < 5; k++) { g.fillStyle = rand() > 0.5 ? '#000' : '#7a5a3a'; g.fillRect(i * bw + rand() * bw, y, 1 + rand() * 2, len); } g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(i * bw, y, bw, 2); y += len;
    }
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(i * bw, 0, 2, h);
  }
});
function damask(base, line) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = line; g.lineWidth = 3;
    for (const [cx, cy] of [[64, 64], [192, 192], [192, -64], [64, 320], [-64, 192], [320, 64]]) {
      g.beginPath(); g.ellipse(cx, cy, 34, 52, 0, 0, 7); g.stroke();
      g.beginPath(); g.ellipse(cx, cy, 14, 26, 0, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - 64); g.lineTo(cx, cy + 64); g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 1500; i++) g.fillRect(rand() * w, rand() * h, 2, 2);
  });
}
// the attic: cold limewash, blotched with damp and crazed with fine cracks
const limewashTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8e9197'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${rand() > 0.6 ? '58,56,50' : '172,174,180'},0.07)`; g.beginPath(); g.ellipse(rand() * w, rand() * h, 8 + rand() * 40, 6 + rand() * 30, rand() * 3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(38,38,42,0.2)'; g.lineWidth = 1;
  for (let i = 0; i < 7; i++) { g.beginPath(); let x = rand() * w, y = rand() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rand() - 0.5) * 30; y += rand() * 22; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 1800; i++) g.fillRect(rand() * w, rand() * h, 2, 2);
});
// the roof outside: courses of slate, each with a shadowed lower edge, the odd patch of moss
const slateTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#23272e'; g.fillRect(0, 0, w, h);
  const rows = 8, rh = h / rows, cols = 6, cw = w / cols;
  for (let r = 0; r < rows; r++) for (let c = -1; c < cols + 1; c++) {
    const x = c * cw + (r % 2 ? cw / 2 : 0), y = r * rh;
    g.fillStyle = `hsl(215 9% ${17 + rand() * 9}%)`; g.fillRect(x + 1, y + 1, cw - 2, rh - 1);
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x, y + rh - 2, cw, 2);
    if (rand() > 0.86) { g.fillStyle = 'rgba(78,92,58,0.3)'; g.fillRect(x + rand() * cw * 0.5, y + rh * 0.5, 6 + rand() * 14, 4); }
  }
  g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 1500; i++) g.fillRect(rand() * w, rand() * h, 2, 2);
});
// London stock brick, gone dark with soot
const brickTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#29231f'; g.fillRect(0, 0, w, h);
  const bh = 16, bw = 48;
  for (let y = 0; y < h; y += bh) for (let x = -bw; x < w + bw; x += bw) {
    const ox = (y / bh) % 2 ? bw / 2 : 0;
    g.fillStyle = `hsl(${22 + rand() * 14} ${16 + rand() * 14}% ${21 + rand() * 10}%)`;
    g.fillRect(x + ox + 1, y + 1, bw - 2, bh - 2);
  }
  g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 2000; i++) g.fillRect(rand() * w, rand() * h, 2, 2);
});
// the leads: sheets of lead, dull and damp, with a raised roll where two sheets meet
const leadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4f57'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rand() > 0.5 ? '20,22,26' : '120,126,134'},0.08)`; g.beginPath(); g.ellipse(rand() * w, rand() * h, 10 + rand() * 40, 6 + rand() * 20, rand() * 3, 0, 7); g.fill(); }
  for (const x of [0, 128]) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(160,166,176,0.25)'; g.fillRect(x + 3, 0, 2, h); }
  g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 1500; i++) g.fillRect(rand() * w, rand() * h, 2, 2);
});
const dadoMat = new THREE.MeshStandardMaterial({ color: '#2b1f16', roughness: 0.6 });
const trimMat = new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.5 });
const iron = new THREE.MeshStandardMaterial({ color: '#2a2a2c', metalness: 0.6, roughness: 0.5 });
const woodMat = new THREE.MeshStandardMaterial({ color: '#3a2c20', roughness: 0.7 });
const rafterMat = new THREE.MeshStandardMaterial({ color: '#2e241c', roughness: 0.85 });
const copingMat = new THREE.MeshStandardMaterial({ color: '#6d6a63', roughness: 0.9 });
const brickMat = (w, h) => new THREE.MeshStandardMaterial({ map: tiled(brickTex, w, h, 1.2), roughness: 0.9 });

const occluders = [];   // walls etc.: block the examine ray
const examinables = []; // {id, room, roots:[], meshes:[]}

// A room: its own group (local coordinates), shell, colliders, lights
function makeRoom({ name, minX, maxX, minZ, maxZ, h, wallTex, ceilColor, position, rotY, vent }) {
  const g = new THREE.Group(); g.position.copy(position); g.rotation.y = rotY; scene.add(g);
  const W = maxX - minX, D = maxZ - minZ, CX = (minX + maxX) / 2, CZ = (minZ + maxZ) / 2;
  const ft = floorTex.clone(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(W / 1.6, D / 1.6); ft.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.75 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, 0, CZ); floor.receiveShadow = true; g.add(floor);
  // a wall, optionally with a real rectangular opening in it
  const wallGeo = (width, hole) => {
    if (!hole) return new THREE.PlaneGeometry(width, h);
    const sh = new THREE.Shape([new THREE.Vector2(-width / 2, -h / 2), new THREE.Vector2(width / 2, -h / 2), new THREE.Vector2(width / 2, h / 2), new THREE.Vector2(-width / 2, h / 2)]);
    const hx = hole.x, hy = hole.y - h / 2, hw = hole.w / 2, hh = hole.h / 2;
    sh.holes.push(new THREE.Path([new THREE.Vector2(hx - hw, hy - hh), new THREE.Vector2(hx - hw, hy + hh), new THREE.Vector2(hx + hw, hy + hh), new THREE.Vector2(hx + hw, hy - hh)]));
    const geo = new THREE.ShapeGeometry(sh), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + width / 2) / width, (uv.getY(i) + h / 2) / h);   // same texture layout as a plain wall
    return geo;
  };
  const wall = (width, x, z, ry, hole) => {
    const tex = wallTex.clone(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(width / 0.7, h / 0.7); tex.needsUpdate = true;
    const m = new THREE.Mesh(wallGeo(width, hole), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); occluders.push(m);
    const add = (geo, mat, y, push) => { const b = new THREE.Mesh(geo, mat); b.position.set(x, y, z); b.rotation.y = ry; b.translateZ(push); b.receiveShadow = true; g.add(b); };
    add(new THREE.BoxGeometry(width, 0.85, 0.02), dadoMat, 0.425, 0.011);
    add(new THREE.BoxGeometry(width, 0.05, 0.045), trimMat, 0.86, 0.022);
    add(new THREE.BoxGeometry(width, 0.09, 0.07), new THREE.MeshStandardMaterial({ color: '#b8ae98', roughness: 0.9 }), h - 0.045, 0.035);
  };
  wall(W, CX, minZ, 0, vent && { x: vent.x - CX, y: vent.y, w: vent.w, h: vent.h }); wall(W, CX, maxZ, Math.PI); wall(D, minX, CZ, Math.PI / 2); wall(D, maxX, CZ, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: ceilColor, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(CX, h, CZ); g.add(ceil);
  return { name, group: g, minX, maxX, minZ, maxZ, h, colliders: [], lights: [] };
}
function addDoor(room, x, z, ry) {
  const door = new THREE.Group();
  const dp = new THREE.Mesh(new THREE.BoxGeometry(0.86, 2.05, 0.05), new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.55 })); dp.position.y = 1.025; door.add(dp);
  for (const [y, h2] of [[1.5, 0.7], [0.55, 0.7]]) for (const x2 of [-0.2, 0.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, h2, 0.02), new THREE.MeshStandardMaterial({ color: '#33241a', roughness: 0.6 })); p.position.set(x2, y, 0.03); door.add(p); }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshStandardMaterial({ color: '#b08a45', metalness: 0.8, roughness: 0.3 })); knob.position.set(-0.33, 1.0, 0.06); door.add(knob);
  // hang the door on a hinge at its right-hand edge (away from the knob) so it can swing open
  const hinge = new THREE.Group();
  hinge.position.set(x, 0, z).add(new THREE.Vector3(0.43, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry));
  hinge.rotation.y = ry; door.position.x = -0.43; hinge.add(door); room.group.add(hinge);
  // the dark landing seen when it opens (hidden inside the closed door's thickness)
  const gap = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 2.05), new THREE.MeshBasicMaterial({ color: '#0e0a07' }));
  gap.position.set(x, 1.025, z).add(new THREE.Vector3(0, 0, -0.024).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry));
  gap.rotation.y = ry; room.group.add(gap);
  door.userData.hinge = hinge; door.userData.closedY = ry;
  return door;
}

// An attic under a pitched roof: a low knee wall at the front (minZ), a tall wall at the back (maxZ), the
// ceiling following the rafters between them, and a real skylight cut through the slope. The opening has
// depth, glass and slates round it, so what you see through it is the actual roof and the house opposite,
// not a picture. `slope` is a frame lying in the roof (x across, y up the slope, z down into the room), so
// the hole in the ceiling, its reveal and the hole in the slates are one and the same rectangle.
function makeAttic({ name, minX, maxX, minZ, maxZ, hLow, hHigh, position, sky, roofT, eaveZ }) {
  const g = new THREE.Group(); g.position.copy(position); scene.add(g);
  const W = maxX - minX, D = maxZ - minZ, CX = (minX + maxX) / 2, rise = hHigh - hLow;
  const L = Math.hypot(D, rise), cosA = D / L, sinA = rise / L;
  const slope = new THREE.Group(); slope.position.set(0, hLow, minZ);
  slope.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, sinA, cosA), new THREE.Vector3(0, -cosA, sinA)));
  g.add(slope);
  const sOf = z => (z - minZ) / cosA;   // how far up the slope a point on the floor sits beneath
  const ceilAt = z => hLow + (Math.min(Math.max(z, minZ), maxZ) - minZ) / D * rise;
  const shell = m => { m.castShadow = m.receiveShadow = true; occluders.push(m); return m; };
  const bar = (parent, w, h, d, x, y, z, mat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; };

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tiled(floorTex, W, D, 1.6), roughness: 0.8 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, 0, (minZ + maxZ) / 2); floor.receiveShadow = true; g.add(floor);
  // the four walls; the two side walls are cut to the line of the roof
  const wallMat = new THREE.MeshStandardMaterial({ map: perMetre(limewashTex, 1.4), roughness: 0.95, shadowSide: THREE.DoubleSide });
  const shape = pts => new THREE.ShapeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v))));
  const wall = (pts, x, z, ry) => { const m = new THREE.Mesh(shape(pts), wallMat); m.position.set(x, 0, z); m.rotation.y = ry; g.add(shell(m)); };
  wall([[minX, 0], [maxX, 0], [maxX, hLow], [minX, hLow]], 0, minZ, 0);                  // knee wall, under the eaves
  wall([[-maxX, 0], [-minX, 0], [-minX, hHigh], [-maxX, hHigh]], 0, maxZ, Math.PI);      // back wall, onto the stairhead
  wall([[-minZ, 0], [-maxZ, 0], [-maxZ, hHigh], [-minZ, hLow]], minX, 0, Math.PI / 2);   // west
  wall([[minZ, 0], [maxZ, 0], [maxZ, hHigh], [minZ, hLow]], maxX, 0, -Math.PI / 2);      // east
  const skirt = new THREE.MeshStandardMaterial({ color: '#2a221b', roughness: 0.8 });
  for (const [w, d, x, z] of [[W, 0.02, CX, minZ + 0.01], [W, 0.02, CX, maxZ - 0.01], [0.02, D, minX + 0.01, (minZ + maxZ) / 2], [0.02, D, maxX - 0.01, (minZ + maxZ) / 2]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), skirt); b.position.set(x, 0.05, z); b.receiveShadow = true; g.add(b);
  }

  // the ceiling and the slates above it, with the same hole through both
  const hx0 = sky.x - sky.w / 2, hx1 = sky.x + sky.w / 2, hy0 = sOf(sky.z0), hy1 = sOf(sky.z1);
  const hw = hx1 - hx0, hh = hy1 - hy0, hxc = (hx0 + hx1) / 2, hyc = (hy0 + hy1) / 2;
  const withHole = (x0, x1, y0, y1) => {
    const s = new THREE.Shape([new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y0), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y1)]);
    s.holes.push(new THREE.Path([new THREE.Vector2(hx0, hy0), new THREE.Vector2(hx0, hy1), new THREE.Vector2(hx1, hy1), new THREE.Vector2(hx1, hy0)]));
    return new THREE.ShapeGeometry(s);
  };
  const ceilMat = new THREE.MeshStandardMaterial({ map: perMetre(limewashTex, 1.4), color: '#c4c8d0', roughness: 1, shadowSide: THREE.DoubleSide });
  slope.add(shell(new THREE.Mesh(withHole(minX, maxX, 0, L), ceilMat)));
  const yE = (eaveZ - minZ + roofT * sinA) / cosA, yR = (D + roofT * sinA) / cosA;   // the eaves and the ridge, measured up the outer surface
  const slates = new THREE.Mesh(withHole(minX - 0.06, maxX + 0.06, yE, yR),
    new THREE.MeshStandardMaterial({ map: perMetre(slateTex, 1.1), roughness: 0.7, side: THREE.BackSide, shadowSide: THREE.DoubleSide }));
  slates.position.z = -roofT; slope.add(shell(slates));
  shell(bar(slope, W + 0.12, 0.16, 0.06, CX, yR - 0.05, -roofT - 0.03, new THREE.MeshStandardMaterial({ color: '#1f232b', roughness: 0.6 })));   // ridge
  // the reveal: the sides of the opening, through the thickness of the roof
  const revealMat = new THREE.MeshStandardMaterial({ color: '#77746c', roughness: 0.95, side: THREE.DoubleSide });
  for (const [w, h, x, y, rx, ry] of [[hw, roofT, hxc, hy0, -Math.PI / 2, 0], [hw, roofT, hxc, hy1, Math.PI / 2, 0], [roofT, hh, hx0, hyc, 0, Math.PI / 2], [roofT, hh, hx1, hyc, 0, -Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), revealMat); m.position.set(x, y, -roofT / 2); m.rotation.set(rx, ry, 0); slope.add(shell(m));
  }
  // inside: a wooden lining round the opening. Outside: the raised kerb the glass sits on. (No glazing bar: it
  // would run straight down the middle of the view to the lit window, which is the whole point of the opening.)
  const lining = new THREE.Group(), kerb = new THREE.Group(); slope.add(lining, kerb);
  const t = 0.05, k = 0.07, kz = -roofT - k / 2, kerbMat = new THREE.MeshStandardMaterial({ color: '#3b4038', roughness: 0.6 });
  bar(lining, hw + 2 * t, t, 0.025, hxc, hy0 - t / 2, 0.012, woodMat); bar(lining, hw + 2 * t, t, 0.025, hxc, hy1 + t / 2, 0.012, woodMat);
  bar(lining, t, hh, 0.025, hx0 - t / 2, hyc, 0.012, woodMat); bar(lining, t, hh, 0.025, hx1 + t / 2, hyc, 0.012, woodMat);
  bar(kerb, hw + 2 * k, k, k, hxc, hy0 - k / 2, kz, kerbMat); bar(kerb, hw + 2 * k, k, k, hxc, hy1 + k / 2, kz, kerbMat);
  bar(kerb, k, hh, k, hx0 - k / 2, hyc, kz, kerbMat); bar(kerb, k, hh, k, hx1 + k / 2, hyc, kz, kerbMat);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(hw + 0.04, hh + 0.04), new THREE.MeshStandardMaterial({ color: '#9fb6d2', transparent: true, opacity: 0.14, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(hxc, hyc, -roofT - 0.045); slope.add(glass);
  // invisible targets filling the opening: one just inside the glass, one just outside it
  const inside = new THREE.Group(), outside = new THREE.Group(); slope.add(inside, outside);
  proxy(inside, new THREE.BoxGeometry(hw, hh, 0.02), hxc, hyc, -0.02);
  proxy(outside, new THREE.BoxGeometry(hw + 0.1, hh + 0.1, 0.02), hxc, hyc, -roofT - 0.1);
  // rafters: a trimmer each side of the opening, then every 62 cm out to the walls
  const rafterXs = [hx0 - 0.06, hx1 + 0.06];
  for (let x = hx0 - 0.68; x > minX + 0.15; x -= 0.62) rafterXs.push(x);
  for (let x = hx1 + 0.68; x < maxX - 0.15; x += 0.62) rafterXs.push(x);
  for (const x of rafterXs) bar(slope, 0.06, L, 0.09, x, L / 2, 0.045, rafterMat);
  return { name, group: g, minX, maxX, minZ, maxZ, h: hHigh, floorY: 0, ceilAt, colliders: [], lights: [], entries: {},
    skylight: { lining, kerb, inside, outside, glass, centre: () => slope.localToWorld(new THREE.Vector3(hxc, hyc, 0)) } };
}

// ---------- models ----------
const loader = new GLTFLoader();
// Decode the embedded model ourselves: skips any stray characters instead of failing like atob() does
const B64 = new Uint8Array(128).fill(255);
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach((c, i) => { B64[c.charCodeAt(0)] = i; });
function decodeBase64(str) {
  const out = new Uint8Array(Math.floor(str.length * 3 / 4) + 3);
  let buf = 0, bits = 0, n = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i), v = c < 128 ? B64[c] : 255;
    if (v === 255) continue;                       // whitespace, padding or anything unexpected
    buf = (buf << 6) | v; bits += 6;
    if (bits >= 8) { bits -= 8; out[n++] = (buf >> bits) & 255; }
  }
  return out.subarray(0, n);
}
// The models this game loads. tools/build.py reads this list, so it is the only one to keep up to date.
const MODELS = [];
// Each model is published as a text file next to the page (base64; artifacts don't serve .glb).
// Loading them separately keeps the page itself small, so a page update can't catch it half-read.
let modelsDone = 0, loadFailed = false;
function parseGLB(id) {
  const file = 'models/' + id.replace('glb-', '') + '.txt';
  return fetch(file)
    .then(r => { if (!r.ok) throw new Error(file + ' ' + r.status); return r.text(); })
    .then(txt => new Promise((res, rej) => {
      const bytes = decodeBase64(txt);
      // a GLB file starts with the letters "glTF"; anything else means the download was cut short
      if (bytes.length < 20 || bytes[0] !== 0x67 || bytes[1] !== 0x6c || bytes[2] !== 0x54 || bytes[3] !== 0x46) return rej(new Error('incomplete model ' + id));
      loader.parse(bytes.slice().buffer, '', g => { modelsDone++; if (!loadFailed) $('begin').textContent = `Loading the attic… ${modelsDone} of ${MODELS.length}`; res(g); }, rej);
    }));
}
const parts = {};
const flames = [];
let ready = false;

// Some models arrive with every joint at the feet. Move each joint to where it bends (neck, shoulders, elbows, hips,
// eye centres) so heads turn and limbs swing naturally. Models whose joints are already in place are left alone.
function fixJoints(root, specs) {
  root.updateMatrixWorld(true);
  for (const [name, part, where] of specs) {
    const n = root.getObjectByName(name), m = root.getObjectByName(part) || n;
    if (!n || !m || n.position.lengthSq() > 1e-6) continue;
    const bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(new THREE.Vector3());
    const wp = where === 'bottom' ? new THREE.Vector3(c.x, bb.min.y + 0.03, c.z - 0.01) : where === 'top' ? new THREE.Vector3(c.x, bb.max.y - 0.03, c.z) : c;
    const parent = n.parent, pivot = new THREE.Group(); pivot.name = name; n.name = name + '_geo';
    parent.add(pivot); pivot.position.copy(parent.worldToLocal(wp.clone())); pivot.updateMatrixWorld(true);
    pivot.attach(n); root.updateMatrixWorld(true);
  }
}
function proxy(parent, geo, x, y, z) {
  if (!parent) return;
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.proxy = true; parent.add(m);
}

// ---------- the floor plan ----------
// The house from above. -z is the front of the roof: toward the leads and the house opposite.
//
//   Mr. Carrisford's house: a lit window opposite your skylight, a dark one opposite Becky's    z = -5.6
//   the light-well between the two houses, 1.35 m across
//   parapet                                                                                       z = -4.0
//   THE LEADS: a flat walk of lead along the front of the roof. A chimney stack stands on it.    z -4.0 .. -2.0
//   eaves                                                                                         z = -2.0
//   YOUR ATTIC  x -1.5..1.5  |  12 cm wall  |  BECKY'S ATTIC  x 1.62..4.22                         z -1.8 .. 1.8
//   the stairhead, behind both doors                                                              z > 1.8
//
// Your skylight looks straight across the leads at the lit window. The chimney stack stands exactly on the
// line between Becky's skylight and that window, so nobody in the lit room can see into her attic. That is
// clue 6, and it is why the stack is where it is: tools/test/shots.js checks both sightlines.
const EYE = 1.38, PR = 0.2;   // Sara is eleven. Everything is seen from a child's height.
const ROOF = { minZ: -1.8, maxZ: 1.8, hLow: 1.4, hHigh: 3.0, roofT: 0.14, eaveZ: -2.0 };
const SKY = { x: 0, w: 0.8, z0: -1.70, z1: -0.85 };   // the skylight, in each attic's own coordinates
const WALL = 0.12, BECKY_X = 1.5 + WALL + 1.3;
const LEADS_Y = 1.15, PARAPET_Z = -4.0, FACADE_Z = -5.6, WELL_Y = -3;
const PARTY_W = -1.5 - WALL, PARTY_E = BECKY_X + 1.3 + WALL;
const LIT = { x0: -0.6, x1: 0.6, y0: 1.95, y1: 3.25 };                         // opposite your skylight
const DARK = { x0: BECKY_X - 0.6, x1: BECKY_X + 0.6, y0: 1.95, y1: 3.25 };     // opposite Becky's
const STACK = { x0: 1.16, x1: 1.96, z0: -3.54, z1: -3.04, top: 3.4 };

const sara = makeAttic({ name: 'Your attic', minX: -1.5, maxX: 1.5, ...ROOF, position: new THREE.Vector3(0, 0, 0), sky: SKY });
const becky = makeAttic({ name: 'Becky\'s attic', minX: -1.3, maxX: 1.3, ...ROOF, position: new THREE.Vector3(BECKY_X, 0, 0), sky: SKY });

// world-space building helpers for everything outside the two attics
function box(w, h, d, x, y, z, mat, parent = scene) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }
function plane(w, h, x, y, z, rx, ry, mat, parent = scene) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); p.castShadow = p.receiveShadow = true; parent.add(p); return p; }

// the leads: walkable, so it is a room too. Its floor sits 1.15 m above the attic floors, at the eaves.
const LCX = (PARTY_W + PARTY_E) / 2, LCZ = (ROOF.eaveZ + PARAPET_Z) / 2, LW = PARTY_E - PARTY_W, LD = ROOF.eaveZ - PARAPET_Z;
const leads = { name: 'The leads', group: new THREE.Group(), minX: -LW / 2, maxX: LW / 2, minZ: -LD / 2, maxZ: LD / 2, floorY: LEADS_Y, colliders: [], lights: [], entries: {} };
leads.group.position.set(LCX, LEADS_Y, LCZ); scene.add(leads.group);
plane(LW, LD, LCX, LEADS_Y, LCZ, -Math.PI / 2, 0, new THREE.MeshStandardMaterial({ map: tiled(leadTex, LW, LD, 1.3), roughness: 0.45, metalness: 0.35 })).castShadow = false;
{
  // where the slates finish: a fascia board and an iron gutter along the eaves
  const rise = ROOF.hHigh - ROOF.hLow, rl = Math.hypot(ROOF.maxZ - ROOF.minZ, rise), cosA = (ROOF.maxZ - ROOF.minZ) / rl, sinA = rise / rl;
  const eaveY = ROOF.hLow + (ROOF.eaveZ - ROOF.minZ + ROOF.roofT * sinA) / cosA * sinA + ROOF.roofT * cosA;
  box(LW, eaveY - LEADS_Y + 0.02, 0.04, LCX, (LEADS_Y + eaveY) / 2, ROOF.eaveZ - 0.02, woodMat);
  box(LW, 0.07, 0.11, LCX, eaveY - 0.03, ROOF.eaveZ - 0.07, iron);
}
// the parapet along the front, and its far face going down into the light-well
occluders.push(box(LW, 0.45, 0.25, LCX, LEADS_Y + 0.225, PARAPET_Z - 0.125, brickMat(LW, 0.45)));
box(LW + 0.04, 0.06, 0.32, LCX, LEADS_Y + 0.48, PARAPET_Z - 0.125, copingMat);
occluders.push(plane(LW, LEADS_Y - WELL_Y, LCX, (LEADS_Y + WELL_Y) / 2, PARAPET_Z - 0.25, 0, Math.PI, brickMat(LW, LEADS_Y - WELL_Y)));
plane(LW, PARAPET_Z - 0.25 - FACADE_Z, LCX, WELL_Y, (PARAPET_Z - 0.25 + FACADE_Z) / 2, -Math.PI / 2, 0, new THREE.MeshStandardMaterial({ color: '#141519', roughness: 1 }));
// the party walls either side, rising above the roofs, so the view along the leads ends in brick
{
  const z0 = FACADE_Z, z1 = 2.4, y1 = 3.7, len = z1 - z0, hgt = y1 - WELL_Y;
  occluders.push(plane(len, hgt, PARTY_W, (WELL_Y + y1) / 2, (z0 + z1) / 2, 0, Math.PI / 2, brickMat(len, hgt)));
  occluders.push(plane(len, hgt, PARTY_E, (WELL_Y + y1) / 2, (z0 + z1) / 2, 0, -Math.PI / 2, brickMat(len, hgt)));
  box(0.3, 0.06, len, PARTY_W - 0.1, y1 + 0.03, (z0 + z1) / 2, copingMat);
  box(0.3, 0.06, len, PARTY_E + 0.1, y1 + 0.03, (z0 + z1) / 2, copingMat);
}
// the chimney stack on the leads, standing between Becky's skylight and the lit window
{
  const sw = STACK.x1 - STACK.x0, sd = STACK.z1 - STACK.z0, sh = STACK.top - LEADS_Y, cx = (STACK.x0 + STACK.x1) / 2, cz = (STACK.z0 + STACK.z1) / 2;
  occluders.push(box(sw, sh, sd, cx, LEADS_Y + sh / 2, cz, brickMat(sw, sh)));
  box(sw + 0.08, 0.1, sd + 0.08, cx, STACK.top + 0.05, cz, copingMat);
  const potMat = new THREE.MeshStandardMaterial({ color: '#6b3a26', roughness: 0.85 });
  for (const dx of [-0.24, 0, 0.24]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.42, 14), potMat); pot.position.set(cx + dx, STACK.top + 0.31, cz); pot.castShadow = true; scene.add(pot); }
  leads.colliders.push({ minX: STACK.x0 - LCX, maxX: STACK.x1 - LCX, minZ: STACK.z0 - LCZ, maxZ: STACK.z1 - LCZ });
}

// ---------- the house opposite ----------
const FACADE_TOP = 4.7;
{
  const s = new THREE.Shape([new THREE.Vector2(PARTY_W, WELL_Y), new THREE.Vector2(PARTY_E, WELL_Y), new THREE.Vector2(PARTY_E, FACADE_TOP), new THREE.Vector2(PARTY_W, FACADE_TOP)]);
  for (const w of [LIT, DARK]) s.holes.push(new THREE.Path([new THREE.Vector2(w.x0, w.y0), new THREE.Vector2(w.x0, w.y1), new THREE.Vector2(w.x1, w.y1), new THREE.Vector2(w.x1, w.y0)]));
  const facade = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshStandardMaterial({ map: perMetre(brickTex, 1.2), roughness: 0.9 }));
  facade.position.z = FACADE_Z; facade.castShadow = facade.receiveShadow = true; scene.add(facade); occluders.push(facade);
  box(LW + 0.1, 0.18, 0.22, LCX, FACADE_TOP - 0.09, FACADE_Z + 0.11, copingMat);   // cornice
  box(LW, 0.08, 0.06, LCX, LIT.y0 - 0.45, FACADE_Z + 0.03, copingMat);              // string course below the windows
  const potMat = new THREE.MeshStandardMaterial({ color: '#6b3a26', roughness: 0.85 });
  box(0.9, 0.9, 0.5, 3.4, FACADE_TOP + 0.45, FACADE_Z - 0.6, brickMat(0.9, 0.9));
  for (const dx of [-0.22, 0.22]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.4, 14), potMat); pot.position.set(3.4 + dx, FACADE_TOP + 1.1, FACADE_Z - 0.6); scene.add(pot); }
}
// A sash window set into a wall `depth` thick. The glass is real: you see straight through it.
function sashWindow(win, z, depth, lit) {
  const w = win.x1 - win.x0, h = win.y1 - win.y0, cx = (win.x0 + win.x1) / 2, cy = (win.y0 + win.y1) / 2;
  const stucco = new THREE.MeshStandardMaterial({ color: '#8b8475', roughness: 0.9, side: THREE.DoubleSide });
  for (const [pw, ph, x, y, rx, ry] of [[w, depth, cx, win.y0, -Math.PI / 2, 0], [w, depth, cx, win.y1, Math.PI / 2, 0], [depth, h, win.x0, cy, 0, Math.PI / 2], [depth, h, win.x1, cy, 0, -Math.PI / 2]]) {
    occluders.push(plane(pw, ph, x, y, z - depth / 2, rx, ry, stucco));
  }
  box(w + 0.18, 0.06, 0.2, cx, win.y0 - 0.03, z + 0.08, copingMat);   // sill
  const frame = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.55 }), fz = z - 0.08;
  box(w, 0.06, 0.06, cx, win.y0 + 0.03, fz, frame); box(w, 0.06, 0.06, cx, win.y1 - 0.03, fz, frame);
  box(0.06, h, 0.06, win.x0 + 0.03, cy, fz, frame); box(0.06, h, 0.06, win.x1 - 0.03, cy, fz, frame);
  box(w, 0.05, 0.05, cx, cy, fz, frame);        // meeting rail between the two sashes
  box(0.025, h, 0.03, cx, cy, fz, frame);       // glazing bar
  const glass = plane(w, h, cx, cy, fz - 0.01, 0, 0, new THREE.MeshStandardMaterial({ color: lit ? '#ffd9a0' : '#5a6474', transparent: true, opacity: lit ? 0.08 : 0.3, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  glass.castShadow = false;
  return glass;
}
const litGlass = sashWindow(LIT, FACADE_Z, 0.25, true);
litGlass.userData.litWindow = true;
sashWindow(DARK, FACADE_Z, 0.25, false);
occluders.push(plane(DARK.x1 - DARK.x0 - 0.06, DARK.y1 - DARK.y0 - 0.06, (DARK.x0 + DARK.x1) / 2, (DARK.y0 + DARK.y1) / 2, FACADE_Z - 0.2, 0, 0,
  new THREE.MeshStandardMaterial({ color: '#4a463c', roughness: 1 })));   // a drawn blind: nobody looks out of this one
// Mr. Carrisford's room behind the lit window: the engine's own makeRoom, turned to face us.
// It is only ever seen through the glass, so it lights itself: the wallpaper glows, and the two lights in it
// are short-ranged and set deep in the room. A long-range lamp in here shone straight through the brick and
// lit the party wall and the cornice outside, because lights without shadows pass through walls.
const CAR = { w: 3.2, d: 2.8, h: 2.6 };
const carRoom = makeRoom({ name: 'Mr. Carrisford\'s room', minX: -CAR.w / 2, maxX: CAR.w / 2, minZ: -CAR.d / 2, maxZ: CAR.d / 2, h: CAR.h,
  wallTex: damask('#4d2f25', 'rgba(220,170,110,0.13)'), ceilColor: '#6b5442',
  position: new THREE.Vector3(0, LEADS_Y, FACADE_Z - 0.25 - CAR.d / 2), rotY: Math.PI,
  vent: { x: 0, y: (LIT.y0 + LIT.y1) / 2 - LEADS_Y, w: LIT.x1 - LIT.x0, h: LIT.y1 - LIT.y0 } });
const glows = [];
{
  const backZ = FACADE_Z - 0.25 - CAR.d, velvet = new THREE.MeshStandardMaterial({ color: '#5a1a1c', roughness: 0.85 });
  // curtains, drawn back to the sides of the window
  for (const s of [-1, 1]) box(0.26, 1.42, 0.05, s * 0.66, (LIT.y0 + LIT.y1) / 2 + 0.03, FACADE_Z - 0.3, velvet);
  // his fire: a chimneypiece and a live grate on the far wall
  const marble = new THREE.MeshStandardMaterial({ color: '#c9bba3', roughness: 0.4 });
  box(1.3, 1.1, 0.24, 0.9, LEADS_Y + 0.55, backZ + 0.12, marble);
  box(1.45, 0.06, 0.32, 0.9, LEADS_Y + 1.13, backZ + 0.16, marble);
  box(0.62, 0.56, 0.04, 0.9, LEADS_Y + 0.3, backZ + 0.26, new THREE.MeshStandardMaterial({ color: '#3a1606', emissive: '#ff6a1e', emissiveIntensity: 1.4 }));
  const fire = new THREE.PointLight('#ff8a3c', 5, 2.6, 2); fire.position.set(0.9, LEADS_Y + 0.55, backZ + 0.45); scene.add(fire); glows.push({ L: fire, base: 5, seed: 3 });
  const lamp = new THREE.PointLight('#ffb468', 3.5, 1.7, 2); lamp.position.set(0.85, LEADS_Y + 1.3, FACADE_Z - 0.9); scene.add(lamp);
  carRoom.group.traverse(o => { if (o.isMesh && o.material.map) { o.material.emissive = new THREE.Color('#ffb070'); o.material.emissiveMap = o.material.map; o.material.emissiveIntensity = 0.32; } });
  // stand-ins until carrisford.glb: a wing chair turned to the fire, a lamp on a table, a rug
  const leather = new THREE.MeshStandardMaterial({ color: '#2f3a2a', roughness: 0.6 });
  const chair = new THREE.Group(); chair.position.set(-0.15, LEADS_Y, -7.55); chair.rotation.y = -0.85; scene.add(chair);
  box(0.72, 0.42, 0.68, 0, 0.21, 0, leather, chair); box(0.72, 0.78, 0.14, 0, 0.8, -0.3, leather, chair);
  for (const s of [-1, 1]) box(0.12, 0.42, 0.5, s * 0.36, 0.62, -0.08, leather, chair);
  const tableMat = new THREE.MeshStandardMaterial({ color: '#3a2318', roughness: 0.5 });
  box(0.5, 0.04, 0.5, 0.85, LEADS_Y + 0.72, FACADE_Z - 0.9, tableMat); box(0.06, 0.7, 0.06, 0.85, LEADS_Y + 0.36, FACADE_Z - 0.9, tableMat);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.2, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#e8c98c', emissive: '#ffcf86', emissiveIntensity: 1.2, side: THREE.DoubleSide }));
  shade.position.set(0.85, LEADS_Y + 1.12, FACADE_Z - 0.9); scene.add(shade);
  plane(2.2, 1.6, 0.2, LEADS_Y + 0.006, FACADE_Z - 1.8, -Math.PI / 2, 0, new THREE.MeshStandardMaterial({ color: '#6a1f1c', roughness: 0.95 }));
}
// the warm light thrown back across the gap onto the leads: only felt when you are out there
{
  const spill = new THREE.PointLight('#ffb067', 0.8, 2.4, 2); spill.position.set(0, (LIT.y0 + LIT.y1) / 2, FACADE_Z + 0.35);
  scene.add(spill); leads.lights.push({ L: spill, base: 0.8 });
}

// ---------- sky, moon and the light they give ----------
const MOON_DIR = new THREE.Vector3(0.12, 0.78, -0.62).normalize();   // high over the house opposite
{
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: '#e9edf6', fog: false }));
  disc.position.copy(MOON_DIR).multiplyScalar(90); disc.lookAt(0, 0, 0); scene.add(disc);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshBasicMaterial({ color: '#8fa3cf', transparent: true, opacity: 0.12, fog: false, depthWrite: false }));
  halo.position.copy(MOON_DIR).multiplyScalar(91); halo.lookAt(0, 0, 0); scene.add(halo);
  const pos = [];
  for (let i = 0; i < 260; i++) { const th = rand() * Math.PI * 2, y = 0.12 + rand() * 0.88, r = Math.sqrt(1 - y * y); pos.push(Math.cos(th) * r * 95, y * 95, Math.sin(th) * r * 95); }
  scene.add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: '#cdd6f5', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
}
const hemi = new THREE.HemisphereLight('#8a98c0', '#2a2c36', 0.95); scene.add(hemi);   // cold is the default; warmth has to be earned
// One moon for the whole scene, casting shadows: it lights the leads, and comes into each attic only through
// its skylight, landing as a pale square on the boards. No light needs to be faked per room.
const moon = new THREE.DirectionalLight('#b4c4e8', 2.3);
moon.target.position.set(1.4, 0, -2.0); moon.position.copy(moon.target.position).addScaledVector(MOON_DIR, 14);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -7.5, right: 7.5, top: 7.5, bottom: -7.5, near: 1, far: 32 });
moon.shadow.camera.updateProjectionMatrix(); moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.03;
scene.add(moon, moon.target);

// ---------- what is in the attics (stand-ins until attic_cold.glb: same footprints the model prompt asks for) ----------
const CANDLE = 0.9;   // a candle-end: a small warm pool, not a lit room
const ticking = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#8b8f95'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(38,50,78,0.45)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); });
function mattress(room, x0, x1, z0, z1) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, 0.12, d, 3, 0.04), new THREE.MeshStandardMaterial({ map: tiled(ticking, w, 1, 0.3), roughness: 0.95 }));
  m.position.set(cx, 0.06, cz); m.castShadow = m.receiveShadow = true; room.group.add(m);
  const blanket = new THREE.Mesh(new RoundedBoxGeometry(w - 0.04, 0.03, d * 0.62, 2, 0.012), new THREE.MeshStandardMaterial({ color: '#5a5048', roughness: 1 }));
  blanket.position.set(cx, 0.13, z1 - d * 0.31 - 0.03); blanket.castShadow = blanket.receiveShadow = true; room.group.add(blanket);
  room.colliders.push({ minX: x0, maxX: x1, minZ: z0, maxZ: z1 });
}
function stool(room, x, z) {
  box(0.3, 0.03, 0.3, x, 0.435, z, woodMat, room.group);
  for (const [dx, dz] of [[-0.1, -0.1], [0.1, -0.1], [0, 0.11]]) box(0.03, 0.42, 0.03, x + dx, 0.21, z + dz, woodMat, room.group);
  room.colliders.push({ minX: x - 0.15, maxX: x + 0.15, minZ: z - 0.15, maxZ: z + 0.15 });
}
function candleEnd(room, x, y, z) {
  const c = new THREE.Group(); c.position.set(x, y, z); room.group.add(c);
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.012, 18), new THREE.MeshStandardMaterial({ color: '#6c6a66', metalness: 0.5, roughness: 0.5 }));
  saucer.position.y = 0.006; c.add(saucer);
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.045, 14), new THREE.MeshStandardMaterial({ color: '#e9e2cf', roughness: 0.6 }));
  wax.position.y = 0.035; c.add(wax);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd890' }));
  flame.scale.set(1, 2.3, 1); flame.position.y = 0.075; flame.name = 'flame'; c.add(flame); flames.push(flame);
  const L = new THREE.PointLight('#ffb35c', CANDLE, 2.6, 2); L.position.set(x, y + 0.1, z);
  room.group.add(L); room.lights.push({ L, base: CANDLE, flicker: true, seed: rand() * 10 });
}
// a small iron grate in the back wall, long cold (clue 5 is found on its hearth once the fire is lit)
function coldGrate(room, x) {
  const z = ROOF.maxZ, top = room.ceilAt(z - 0.26) - 0.02;
  const plaster = new THREE.MeshStandardMaterial({ map: tiled(limewashTex, 0.72, top, 1.4), roughness: 0.95 });
  occluders.push(box(0.72, top, 0.26, x, top / 2, z - 0.13, plaster, room.group));
  box(0.46, 0.5, 0.02, x, 0.27, z - 0.265, new THREE.MeshStandardMaterial({ color: '#0d0c0b', roughness: 1 }), room.group);
  for (const y of [0.12, 0.17, 0.22, 0.27]) box(0.42, 0.012, 0.012, x, y, z - 0.285, iron, room.group);
  box(0.86, 0.045, 0.12, x, 0.6, z - 0.31, woodMat, room.group);
  box(0.8, 0.025, 0.3, x, 0.0125, z - 0.41, new THREE.MeshStandardMaterial({ color: '#4a4640', roughness: 0.9 }), room.group);
  room.colliders.push({ minX: x - 0.43, maxX: x + 0.43, minZ: z - 0.56, maxZ: z });
}
mattress(sara, -1.5, -0.65, -1.0, 0.9);
stool(sara, -0.4, 0.2);
candleEnd(sara, -0.4, 0.45, 0.2);
coldGrate(sara, -0.7);
mattress(becky, 0.45, 1.3, -1.0, 0.9);

const saraDoor = addDoor(sara, 0.85, ROOF.maxZ - 0.026, Math.PI);
const beckyDoor = addDoor(becky, -0.65, ROOF.maxZ - 0.026, Math.PI);

const rooms = [sara, becky, leads];
// where you stand on arriving in each room (room coordinates), and what you face
sara.entries = { start: { pos: [0.6, 0.55], look: [0, -1.3], pitch: 0.16 }, door: { pos: [0.85, 1.2], look: [0, -0.6] }, skylight: { pos: [0, -1.2], look: [0.3, 1.0] } };
becky.entries = { door: { pos: [-0.65, 1.2], look: [0, -0.6] } };
leads.entries = { skylight: { pos: [-LCX, -2.42 - LCZ], look: [-LCX, FACADE_Z - LCZ], pitch: 0.03 } };
examinables.push({ id: 'door_becky', room: 0, roots: [saraDoor] });
examinables.push({ id: 'door_back', room: 1, roots: [beckyDoor] });
examinables.push({ id: 'skylight_out', room: 0, roots: [sara.skylight.lining, sara.skylight.inside] });
examinables.push({ id: 'skylight_in', room: 2, roots: [sara.skylight.kerb, sara.skylight.outside] });
scene.updateMatrixWorld(true);

const CLUES = {
  door_becky: { verb: 'Go to Becky\'s attic' },
  door_back: { verb: 'Go back to your attic' },
  skylight_out: { verb: 'Climb out onto the leads' },
  skylight_in: { verb: 'Climb back in' },
};

// ---------- player ----------
const start = sara.entries.start;
const player = { x: start.pos[0], z: start.pos[1], yaw: Math.atan2(-(start.look[0] - start.pos[0]), -(start.look[1] - start.pos[1])), pitch: start.pitch, room: 0 };
const keys = {};
let playing = false, cardOpen = false, moving = false;
const tmp = new THREE.Vector3();

function blocked(x, z) {
  const r = rooms[player.room];
  r.group.worldToLocal(tmp.set(x, r.group.position.y, z));
  const lx = tmp.x, lz = tmp.z;
  if (lx < r.minX + PR || lx > r.maxX - PR || lz < r.minZ + PR || lz > r.maxZ - PR) return true;
  if (r.ceilAt && r.ceilAt(lz) < EYE + 0.12) return true;   // under the slope: you would knock your head
  for (const b of r.colliders) if (lx > b.minX - PR && lx < b.maxX + PR && lz > b.minZ - PR && lz < b.maxZ + PR) return true;
  return false;
}
// only the room you're in is lit (its lights would otherwise shine through the shared wall)
function setRoomLights(i) { rooms.forEach((r, k) => r.lights.forEach(l => { l.on = k === i; l.L.visible = l.on; })); }

function goTo(i, at) {
  if (moving) return;
  moving = true; $('fade').classList.add('on');
  setTimeout(() => {
    const r = rooms[i], e = r.entries[at] || r.entries.door;
    player.room = i;
    const p = r.group.localToWorld(new THREE.Vector3(e.pos[0], 0, e.pos[1]));
    const look = r.group.localToWorld(new THREE.Vector3(e.look[0], 0, e.look[1]));
    player.x = p.x; player.z = p.z;
    player.yaw = Math.atan2(-(look.x - p.x), -(look.z - p.z)); player.pitch = e.pitch ?? -0.1;
    setRoomLights(i);
    $('fade').classList.remove('on');
    showWhere(r.name);
    setTimeout(() => { moving = false; }, 300);
  }, 480);
}
let whereTimer;
function showWhere(text) { const w = $('where'); w.textContent = text; w.classList.add('on'); clearTimeout(whereTimer); whereTimer = setTimeout(() => w.classList.remove('on'), 2200); }

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (cardOpen && (k === 'e' || k === 'escape' || k === 'enter' || k === ' ')) { e.preventDefault(); closeCard(); return; }
  keys[k] = true;
  if (k === 'e' && playing) examine();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

let drag = null;
const cvs = renderer.domElement;
// Mouse look: one click in the room captures the mouse (Esc gives it back).
// Where the browser refuses that, click-and-drag still turns your head.
let locked = false;
function lockMouse() {
  if (isTouch || locked || !playing || !cvs.requestPointerLock) return;
  try { const r = cvs.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) { /* drag-to-look stays available */ }
}
let skipMoves = 0;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === cvs;
  skipMoves = 2;   // browsers often report one huge jump right as the mouse is captured
  if (!locked && playing && !cardOpen && !isTouch) showWhere('Click the room to look around with the mouse');
});
document.addEventListener('mousemove', e => {
  if (!locked) return;
  if (skipMoves > 0) { skipMoves--; return; }
  if (Math.abs(e.movementX) > 150 || Math.abs(e.movementY) > 150) return;   // ignore spikes, keep real moves
  player.yaw -= e.movementX * 0.0024;
  player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * 0.0024, -1.3, 1.1);
});
cvs.addEventListener('pointerdown', e => { cvs.focus(); if (locked) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; cvs.setPointerCapture(e.pointerId); });
cvs.addEventListener('pointermove', e => {
  if (locked || !drag || drag.id !== e.pointerId || cardOpen) return;
  const s = isTouch ? 0.006 : 0.0042, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  player.yaw -= dx * s; player.pitch = THREE.MathUtils.clamp(player.pitch - dy * s, -1.3, 1.1);
  drag.x = e.clientX; drag.y = e.clientY;
});
const endDrag = e => {
  if (!drag || drag.id !== e.pointerId) return;
  const wasClick = drag.moved < 6; drag = null;
  if (wasClick && !cardOpen && e.type === 'pointerup') lockMouse();
};
cvs.addEventListener('pointerup', endDrag); cvs.addEventListener('pointercancel', endDrag);

const joy = $('joy'), knob2 = joy.querySelector('i'), joyV = { x: 0, y: 0 }; let joyId = null;
function joyMove(e) {
  const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), max = r.width / 2 - 10;
  if (m > max) { dx *= max / m; dy *= max / m; }
  knob2.style.transform = `translate(${dx}px, ${dy}px)`; joyV.x = dx / max; joyV.y = dy / max;
}
joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; joyV.x = joyV.y = 0; knob2.style.transform = ''; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
if (isTouch) $('help').hidden = true;

$('begin').addEventListener('click', () => {
  if (!ready) return;
  audioOn();
  $('intro').hidden = true; playing = true; cvs.focus();
  if (isTouch) joy.hidden = false;
  showWhere(rooms[player.room].name);
  lockMouse();
});

// ---------- examining ----------
const ray = new THREE.Raycaster(); ray.far = 2.7;
const center = new THREE.Vector2(0, 0);
let target = null;
let hitList = null;

function finishExaminables() {
  for (const ex of examinables) {
    ex.meshes = [];
    for (const r of ex.roots) r.traverse(o => { if (o.isMesh) { if (!o.userData.proxy) o.material = o.material.clone(); o.userData.ex = ex; ex.meshes.push(o); } });
  }
  hitList = null;
}
function pickTarget() {
  if (!ready || cardOpen || moving) return null;
  if (!hitList) { const set = new Set(occluders); for (const ex of examinables) for (const m of ex.meshes) set.add(m); hitList = [...set]; }
  ray.setFromCamera(center, camera);
  for (const h of ray.intersectObjects(hitList, false)) {
    if (h.object.material && h.object.material.visible === false && !h.object.userData.proxy) continue;
    const ex = h.object.userData.ex;   // first solid thing decides; walls block what is behind them
    return ex && (ex.room === undefined || ex.room === player.room) ? ex : null;   // the same skylight means different things from each side
  }
  return null;
}
function setGlow(ex, amount) {
  if (!ex || ex.person) return;   // people get the prompt, not a glow
  for (const m of ex.meshes) { if (m.userData.proxy || !m.material.emissive) continue; m.material.emissive.set('#e8a64a'); m.material.emissiveIntensity = amount; }
}
function examine() {
  if (!target || cardOpen || moving) return;
  const id = target.id;
  if (id === 'door_becky') return goTo(1, 'door');
  if (id === 'door_back') return goTo(0, 'door');
  if (id === 'skylight_out') return goTo(2, 'skylight');
  if (id === 'skylight_in') return goTo(0, 'skylight');
}
function openCard() { $('card').hidden = false; cardOpen = true; $('cardClose').focus({ preventScroll: true }); }
function closeCard() { $('card').hidden = true; cardOpen = false; cvs.focus(); }
$('cardClose').addEventListener('click', closeCard);
$('prompt').addEventListener('click', () => examine());

// ---------- sound (Web Audio, generated; starts only after a click) ----------
const sfx = { ctx: null, master: null };
function audioOn() {
  if (sfx.ctx) { if (sfx.ctx.state === 'suspended') sfx.ctx.resume(); return true; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    sfx.ctx = new C(); sfx.master = sfx.ctx.createGain(); sfx.master.gain.value = 0.9; sfx.master.connect(sfx.ctx.destination);
    return true;
  } catch (err) { return false; }
}
function noiseBuffer(seconds, brown) {
  const c = sfx.ctx, n = Math.floor(c.sampleRate * seconds), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}

// ---------- the start screen ----------
let introState = 'loading';
function setIntroState(state) {
  introState = state;
  const b = $('begin'); b.disabled = false; b.textContent = 'Go up to the attic'; b.focus({ preventScroll: true });
}

// ---------- loading ----------
Promise.all(MODELS.map(parseGLB)).then(() => {
  finishExaminables();
  setRoomLights(player.room);
  ready = true;
  setIntroState('story');
}).catch(err => {
  console.error(err);
  loadFailed = true;
  $('status').textContent = 'The attic didn\'t finish loading. Check your connection and reload.';
  const btn = $('begin'); btn.disabled = false; btn.textContent = 'Reload the game';
  btn.onclick = () => location.reload();
});

// ---------- test hook: read-only views and a few controls for tools/test (harmless in play) ----------
let view = null;   // a camera override for overhead shots
const hidden = [];
window.__game = {
  get ready() { return ready; }, get playing() { return playing; }, get room() { return player.room; },
  get target() { return target ? target.id : null; },
  rooms: rooms.map(r => r.name),
  where: () => ({ room: player.room, x: +player.x.toFixed(3), z: +player.z.toFixed(3) }),
  // stand in room i at its own (lx, lz), looking at a world point
  place(i, lx, lz, look) {
    const p = rooms[i].group.localToWorld(new THREE.Vector3(lx, 0, lz));
    player.room = i; player.x = p.x; player.z = p.z; setRoomLights(i);
    if (look) { const [wx, wy, wz] = look, eyeY = rooms[i].floorY + EYE; player.yaw = Math.atan2(-(wx - p.x), -(wz - p.z)); player.pitch = Math.atan2(wy - eyeY, Math.hypot(wx - p.x, wz - p.z)); }
  },
  // stand where a player arrives in room i, facing what they would face
  enter(i, at) { const r = rooms[i], e = r.entries[at] || r.entries.door || Object.values(r.entries)[0]; this.place(i, e.pos[0], e.pos[1]); const lk = r.group.localToWorld(new THREE.Vector3(e.look[0], 0, e.look[1])); player.yaw = Math.atan2(-(lk.x - player.x), -(lk.z - player.z)); player.pitch = e.pitch ?? -0.1; },
  placeWorld(i, wx, wz, look) { const p = rooms[i].group.worldToLocal(new THREE.Vector3(wx, rooms[i].group.position.y, wz)); this.place(i, p.x, p.z, look); },
  look(wx, wy, wz) { const eyeY = rooms[player.room].floorY + EYE; player.yaw = Math.atan2(-(wx - player.x), -(wz - player.z)); player.pitch = Math.atan2(wy - eyeY, Math.hypot(wx - player.x, wz - player.z)); },
  bounds: i => { const r = rooms[i]; return { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ }; },
  entryXZ: i => { const r = rooms[i], e = Object.values(r.entries)[0]; return e.pos; },
  canStand: (i, lx, lz) => { const was = player.room; player.room = i; const p = rooms[i].group.localToWorld(new THREE.Vector3(lx, 0, lz)); const b = blocked(p.x, p.z); player.room = was; return !b; },
  examine: () => examine(),
  // how much of the lit window you can see from a standing spot: the share of 16 points on its glass with a clear line
  windowVisibility(i, lx, lz) {
    const solid = []; scene.traverse(o => { if (o.isMesh && o.visible && o.material && !o.material.transparent && o.material.visible !== false) solid.push(o); });
    const eye = rooms[i].group.localToWorld(new THREE.Vector3(lx, 0, lz)); eye.y = rooms[i].floorY + EYE;
    const rc = new THREE.Raycaster(); let clear = 0, n = 0;
    for (const x of [-0.35, -0.15, 0.15, 0.35]) for (const y of [LIT.y0 + 0.25, 2.35, 2.85, LIT.y1 - 0.25]) {
      const pt = new THREE.Vector3(x, y, FACADE_Z - 0.09), dir = pt.clone().sub(eye), dist = dir.length();
      rc.set(eye, dir.normalize()); rc.far = dist - 0.02; n++;
      if (!rc.intersectObjects(solid, false).length) clear++;
    }
    return clear / n;
  },
  topDown(i) {   // look straight down into a room with its roof lifted off
    const r = rooms[i], c = r.group.localToWorld(new THREE.Vector3((r.minX + r.maxX) / 2, 0, (r.minZ + r.maxZ) / 2));
    if (r.ceilAt) r.group.traverse(o => { if (o.isMesh && o.parent && o.parent !== r.group && o.visible) { o.visible = false; hidden.push(o); } });
    view = { pos: [c.x, r.floorY + 5.2, c.z + 0.001], look: [c.x, r.floorY, c.z] }; setRoomLights(i);
  },
  clearView() { view = null; for (const o of hidden.splice(0)) o.visible = true; },
};

// ---------- loop ----------
const clock = new THREE.Clock();
let t = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); t += dt;

  if (playing && !cardOpen && !moving) {
    const f = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0) - joyV.y;
    const s = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0) + joyV.x;
    // arrow keys turn your head
    const turn = (keys['arrowleft'] ? 1 : 0) - (keys['arrowright'] ? 1 : 0);
    if (turn) player.yaw += turn * 2.0 * dt;
    const mag = Math.min(1, Math.hypot(f, s));
    if (mag > 0.05) {
      const spd = (keys['shift'] ? 2.0 : 1.25) * mag * dt, n = Math.hypot(f, s);
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
      const mx = (fx * f + rx * s) / n * spd, mz = (fz * f + rz * s) / n * spd;
      if (!blocked(player.x + mx, player.z)) player.x += mx;
      if (!blocked(player.x, player.z + mz)) player.z += mz;
    }
  }
  if (view) { camera.position.set(...view.pos); camera.lookAt(...view.look); }
  else {
    camera.position.set(player.x, rooms[player.room].floorY + (player.eye ?? EYE), player.z);
    camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  }

  const nt = playing ? pickTarget() : null;
  if (nt !== target) { setGlow(target, 0); target = nt; }
  if (target) setGlow(target, 0.06 + (reduceMotion ? 0 : Math.sin(t * 4) * 0.03));
  $('reticle').classList.toggle('on', !!target);
  const p = $('prompt');
  if (target && !cardOpen && !moving) { p.hidden = false; p.textContent = (isTouch ? 'Tap: ' : 'E: ') + CLUES[target.id].verb.toLowerCase(); }
  else p.hidden = true;

  for (const r of rooms) for (const l of r.lights) if (l.flicker && l.on) l.L.intensity = l.base * (reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(t * 9 + l.seed) * Math.sin(t * 5.3 + l.seed * 2));
  for (const gl of glows) gl.L.intensity = gl.base * (reduceMotion ? 1 : 0.82 + 0.18 * Math.sin(t * 7 + gl.seed) * Math.sin(t * 3.1 + gl.seed));
  for (const fl of flames) { if (!reduceMotion) { fl.scale.y = 2.3 + Math.sin(t * 11 + fl.id) * 0.18; fl.rotation.z = Math.sin(t * 3 + fl.id) * 0.05; } }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>
