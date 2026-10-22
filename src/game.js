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
const NIGHT = '#16132f';   // a plum-indigo night: cold, but a storybook's cold
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
// depth, a hinged glass sash and slates round it, so what you see through it is the actual roof and the sky,
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
  // inside: a wooden lining round the opening. Outside: the raised kerb the sash sits on.
  const lining = new THREE.Group(), kerb = new THREE.Group(); slope.add(lining, kerb);
  const t = 0.05, k = 0.07, kz = -roofT - k / 2, kerbMat = new THREE.MeshStandardMaterial({ color: '#3b4038', roughness: 0.6 });
  bar(lining, hw + 2 * t, t, 0.025, hxc, hy0 - t / 2, 0.012, woodMat); bar(lining, hw + 2 * t, t, 0.025, hxc, hy1 + t / 2, 0.012, woodMat);
  bar(lining, t, hh, 0.025, hx0 - t / 2, hyc, 0.012, woodMat); bar(lining, t, hh, 0.025, hx1 + t / 2, hyc, 0.012, woodMat);
  bar(kerb, hw + 2 * k, k, k, hxc, hy0 - k / 2, kz, kerbMat); bar(kerb, hw + 2 * k, k, k, hxc, hy1 + k / 2, kz, kerbMat);
  bar(kerb, k, hh, k, hx0 - k / 2, hyc, kz, kerbMat); bar(kerb, k, hh, k, hx1 + k / 2, hyc, kz, kerbMat);
  // the sash: a light iron frame and its glass, hinged along the top so the bottom lifts and can be propped open
  const hinge = new THREE.Group(); hinge.position.set(hxc, hy1 + k, -roofT - k); slope.add(hinge);
  const sashMat = new THREE.MeshStandardMaterial({ color: '#2b2e2c', metalness: 0.4, roughness: 0.6 }), sw = hw + 2 * k, sh = hh + 2 * k, f = 0.035;
  bar(hinge, sw, f, f, 0, -f / 2, -f / 2, sashMat); bar(hinge, sw, f, f, 0, -sh + f / 2, -f / 2, sashMat);
  bar(hinge, f, sh, f, -sw / 2 + f / 2, -sh / 2, -f / 2, sashMat); bar(hinge, f, sh, f, sw / 2 - f / 2, -sh / 2, -f / 2, sashMat);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(sw - 2 * f, sh - 2 * f), new THREE.MeshStandardMaterial({ color: '#9fb6d2', transparent: true, opacity: 0.14, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(0, -sh / 2, -f / 2); hinge.add(glass);
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
    slope, skylight: { lining, kerb, inside, outside, hinge, glass, centre: () => slope.localToWorld(new THREE.Vector3(hxc, hyc, 0)) } };
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
const MODELS = ['glb-grate'];
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
// The row from above, as Burnett has it: the Select Seminary and the Indian gentleman's house are next door to
// each other, and their attics sit side by side under one slope of slates. -z is the front of the roof.
//
//   the square: the street far below, the houses across it                                        z = -26
//   parapet                                                                                        z = -4.0
//   THE LEADS: a flat walk of lead behind the parapet, along the foot of the slates                z -4.0 .. -2.0
//   eaves                                                                                          z = -2.0
//   RAM DASS'S ATTIC x -4.62..-1.62 | party wall | YOUR ATTIC x -1.5..1.5 | BECKY'S ATTIC x 1.62..4.22  z -1.8 .. 1.8
//   the stairhead, behind both doors                                                               z > 1.8
//
// From the floor your skylight shows "nothing but an oblong piece of dull gray sky". Standing on the table with
// your head out of it, as Sara does, the next attic's skylight is "a few yards" along the slates: propped open,
// his lantern lit. The party wall between the two houses stands up through the roof as a low brick upstand.
// From the leads you can look over it into his attic, but not cross it. (Ram Dass can: he crosses it at night.)
const EYE = 1.38, PR = 0.2;   // Sara is eleven. Everything is seen from a child's height.
const ROOF = { minZ: -1.8, maxZ: 1.8, hLow: 1.4, hHigh: 3.0, roofT: 0.14, eaveZ: -2.0 };
const SKY = { x: 0, w: 0.8, z0: -1.70, z1: -0.85 };   // the skylight, in each attic's own coordinates
const WALL = 0.12, BECKY_X = 1.5 + WALL + 1.3, NEXT_X = -(1.5 + WALL + 1.5);
const LEADS_Y = 1.15, PARAPET_Z = -4.0, STREET_Y = -10, SQUARE_Z = -26;
const PARTY_W = -1.5 - WALL, PARTY_E = BECKY_X + 1.3 + WALL, ROW_W = NEXT_X - 1.5 - WALL;   // you can walk the leads from PARTY_W to PARTY_E
const TABLE = { x0: -0.375, x1: 0.375, z0: -1.45, z1: -0.95, h: 0.68 };   // the old table under your skylight

const sara = makeAttic({ name: 'Your attic', minX: -1.5, maxX: 1.5, ...ROOF, position: new THREE.Vector3(0, 0, 0), sky: SKY });
const becky = makeAttic({ name: 'Becky\'s attic', minX: -1.3, maxX: 1.3, ...ROOF, position: new THREE.Vector3(BECKY_X, 0, 0), sky: SKY });
const nextDoor = makeAttic({ name: 'Ram Dass\'s attic', minX: -1.5, maxX: 1.5, ...ROOF, position: new THREE.Vector3(NEXT_X, 0, 0), sky: SKY });

// world-space building helpers for everything outside the attics
function box(w, h, d, x, y, z, mat, parent = scene) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }
function plane(w, h, x, y, z, rx, ry, mat, parent = scene) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); p.castShadow = p.receiveShadow = true; parent.add(p); return p; }
// the roof's own frame at a given x (the same frame makeAttic cuts the skylights in): x across, y up the slope, z into the house
const RISE = ROOF.hHigh - ROOF.hLow, RL = Math.hypot(ROOF.maxZ - ROOF.minZ, RISE), COS_A = (ROOF.maxZ - ROOF.minZ) / RL, SIN_A = RISE / RL;
function roofFrame(x) {
  const f = new THREE.Group(); f.position.set(x, ROOF.hLow, ROOF.minZ);
  f.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, SIN_A, COS_A), new THREE.Vector3(0, -COS_A, SIN_A)));
  scene.add(f); return f;
}
const yEave = (ROOF.eaveZ - ROOF.minZ + ROOF.roofT * SIN_A) / COS_A, yRidge = (ROOF.maxZ - ROOF.minZ + ROOF.roofT * SIN_A) / COS_A;

// the leads: walkable, so it is a room too. Its floor sits 1.15 m above the attic floors, at the eaves.
// The lead itself runs the whole row; the part you can walk on stops at the party wall.
const LCX = (PARTY_W + PARTY_E) / 2, LCZ = (ROOF.eaveZ + PARAPET_Z) / 2, LW = PARTY_E - PARTY_W, LD = ROOF.eaveZ - PARAPET_Z;
const RW = PARTY_E - ROW_W, RCX = (ROW_W + PARTY_E) / 2;
const leads = { name: 'The leads', group: new THREE.Group(), minX: -LW / 2, maxX: LW / 2, minZ: -LD / 2, maxZ: LD / 2, floorY: LEADS_Y, colliders: [], lights: [], entries: {} };
leads.group.position.set(LCX, LEADS_Y, LCZ); scene.add(leads.group);
plane(RW, LD, RCX, LEADS_Y, LCZ, -Math.PI / 2, 0, new THREE.MeshStandardMaterial({ map: tiled(leadTex, RW, LD, 1.3), roughness: 0.45, metalness: 0.35 })).castShadow = false;
{
  // where the slates finish: a fascia board and an iron gutter along the eaves
  const eaveY = ROOF.hLow + yEave * SIN_A + ROOF.roofT * COS_A;
  box(RW, eaveY - LEADS_Y + 0.02, 0.04, RCX, (LEADS_Y + eaveY) / 2, ROOF.eaveZ - 0.02, woodMat);
  box(RW, 0.07, 0.11, RCX, eaveY - 0.03, ROOF.eaveZ - 0.07, iron);
}
// the parapet along the front, and the front of the row going down to the street
occluders.push(box(RW, 0.45, 0.25, RCX, LEADS_Y + 0.225, PARAPET_Z - 0.125, brickMat(RW, 0.45)));
box(RW + 0.04, 0.06, 0.32, RCX, LEADS_Y + 0.48, PARAPET_Z - 0.125, copingMat);
occluders.push(plane(RW, LEADS_Y - STREET_Y, RCX, (LEADS_Y + STREET_Y) / 2, PARAPET_Z - 0.25, 0, Math.PI, brickMat(RW, LEADS_Y - STREET_Y)));
// the houses either end of this pair stand taller, so the view along the roofs ends in brick
{
  const z0 = PARAPET_Z - 0.25, z1 = 2.4, y1 = 3.7, len = z1 - z0, hgt = y1 - STREET_Y;
  occluders.push(plane(len, hgt, ROW_W, (STREET_Y + y1) / 2, (z0 + z1) / 2, 0, Math.PI / 2, brickMat(len, hgt)));
  occluders.push(plane(len, hgt, PARTY_E, (STREET_Y + y1) / 2, (z0 + z1) / 2, 0, -Math.PI / 2, brickMat(len, hgt)));
  box(0.3, 0.06, len, ROW_W - 0.1, y1 + 0.03, (z0 + z1) / 2, copingMat);
  box(0.3, 0.06, len, PARTY_E + 0.1, y1 + 0.03, (z0 + z1) / 2, copingMat);
}
// the party wall between the Seminary and the Indian gentleman's house, standing up through the roof:
// a low wall across the leads, then a brick upstand following the slates up to the ridge
{
  const x = PARTY_W + WALL / 2, up = brickMat(0.24, 0.62);
  occluders.push(box(0.24, 0.62, LD, x, LEADS_Y + 0.31, LCZ, up));
  box(0.3, 0.05, LD, x, LEADS_Y + 0.645, LCZ, copingMat);
  const f = roofFrame(x), len = yRidge - yEave;
  // only a course or two above the slates: Sara, with her head out of her skylight, sees straight along to his
  occluders.push(box(0.24, len, 0.1, 0, (yEave + yRidge) / 2, -ROOF.roofT - 0.05, brickMat(0.24, len), f));
}
// chimney stacks along the ridge, on the party walls, where the flues of each house run up
{
  const potMat = new THREE.MeshStandardMaterial({ color: '#6b3a26', roughness: 0.85 });
  for (const [x, pots] of [[PARTY_W + WALL / 2, 4], [PARTY_E - WALL / 2, 3], [ROW_W + WALL / 2, 3]]) {
    const w = 0.3 + pots * 0.22, y0 = 2.9, y1 = 4.15, z = 2.12;
    occluders.push(box(w, y1 - y0, 0.55, x, (y0 + y1) / 2, z, brickMat(w, y1 - y0)));
    box(w + 0.08, 0.1, 0.63, x, y1 + 0.05, z, copingMat);
    for (let i = 0; i < pots; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.42, 14), potMat); pot.position.set(x + (i - (pots - 1) / 2) * 0.22, y1 + 0.31, z); pot.castShadow = true; scene.add(pot); }
  }
}

// ---------- the square, below and across ----------
{
  plane(80, SQUARE_Z - (PARAPET_Z - 0.25), RCX, STREET_Y, (SQUARE_Z + PARAPET_Z - 0.25) / 2, -Math.PI / 2, 0, new THREE.MeshStandardMaterial({ color: '#121318', roughness: 1 })).castShadow = false;
  // the houses across the square: a long terrace, its windows mostly dark, a few still lit this late
  const W = 64, top = 6.2, h = top - STREET_Y;
  const front = plane(W, h, RCX, (top + STREET_Y) / 2, SQUARE_Z, 0, 0, brickMat(W, h)); front.castShadow = false;
  box(W, 0.3, 0.4, RCX, top + 0.15, SQUARE_Z + 0.2, copingMat).castShadow = false;
  const slope = plane(W, 4, RCX, top + 1.2, SQUARE_Z - 1.6, -0.62, 0, new THREE.MeshStandardMaterial({ map: tiled(slateTex, W, 4, 1.1), roughness: 0.7 })); slope.castShadow = false;
  // house by house: three bays each, a pale pilaster between houses, and only a few windows still lit this late
  const lit = new THREE.MeshBasicMaterial({ color: '#a8743a' }), dim = new THREE.MeshBasicMaterial({ color: '#5e4228' }), dark = new THREE.MeshBasicMaterial({ color: '#0c0e13' });
  const stucco = new THREE.MeshStandardMaterial({ color: '#4a4842', roughness: 0.95 });
  for (let hx = RCX - W / 2 + 3.2; hx < RCX + W / 2 - 2; hx += 6.4) {
    box(0.35, h, 0.12, hx + 3.2, (top + STREET_Y) / 2, SQUARE_Z + 0.06, stucco).castShadow = false;
    for (const [y, fh] of [[top - 1.4, 1.2], [top - 4.4, 1.9], [top - 7.6, 2.3], [top - 11, 1.9]]) for (const dx of [-1.8, 0, 1.8]) {
      const r = rand(), p = plane(0.9, fh, hx + dx, y, SQUARE_Z + 0.02, 0, 0, r < 0.06 ? lit : r < 0.12 ? dim : dark); p.castShadow = p.receiveShadow = false;
    }
  }
  const potMat = new THREE.MeshStandardMaterial({ color: '#3a2a22', roughness: 0.9 });
  for (let x = RCX - W / 2 + 4; x < RCX + W / 2; x += 7.2) {
    box(1.4, 1.5, 0.6, x, top + 1.9, SQUARE_Z - 2.6, potMat).castShadow = false;
  }
}

// ---------- the attic next door: Ram Dass's, with everything ready ----------
// Burnett: "all his packages being in readiness in the attic which was his own". From the leads you can see
// down through his propped skylight to the far wall: the parcels, a rolled crimson rug stood on end, his lantern.
const glows = [];
{
  nextDoor.skylight.hinge.rotation.x = 1.0;   // propped open
  Object.assign(nextDoor.skylight.glass.material, { color: new THREE.Color('#ffd7a8'), opacity: 0.32, emissive: new THREE.Color('#ffa24c'), emissiveIntensity: 0.55 });
  const g = nextDoor.group, paper = new THREE.MeshStandardMaterial({ color: '#8a6e4c', roughness: 0.95 }), string = new THREE.MeshStandardMaterial({ color: '#d8cdb4', roughness: 0.9 });
  const parcel = (w, h, d, x, y, z, ry = 0) => {
    const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p);
    box(w, h, d, 0, h / 2, 0, paper, p); box(w + 0.006, 0.012, 0.012, 0, h + 0.002, 0, string, p); box(0.012, 0.012, d + 0.006, 0, h + 0.002, 0, string, p);
    box(0.012, h, 0.012, 0, h / 2, d / 2 + 0.002, string, p); box(0.012, h, 0.012, 0, h / 2, -d / 2 - 0.002, string, p);
    return p;
  };
  parcel(0.55, 0.36, 0.42, -1.18, 0, 0.15, 0.08); parcel(0.42, 0.3, 0.36, -1.2, 0.36, 0.17, -0.12);
  parcel(0.62, 0.26, 0.46, -1.12, 0, -1.05, -0.05); parcel(0.3, 0.22, 0.3, -1.16, 0.26, -1.07, 0.3);
  parcel(0.5, 0.42, 0.38, -0.55, 0, 0.95, 0.2);
  // the rug, rolled and stood in the corner: crimson, with the border showing at each end
  const rug = new THREE.Group(); rug.position.set(-1.25, 0, -0.45); rug.rotation.z = 0.09; g.add(rug);
  const crimson = new THREE.MeshStandardMaterial({ color: '#8a1c1e', roughness: 0.95 }), gold = new THREE.MeshStandardMaterial({ color: '#c9a04a', roughness: 0.8 }), indigo = new THREE.MeshStandardMaterial({ color: '#2e3560', roughness: 0.9 });
  const cyl = (r, h, y, mat) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat); c.position.y = y; c.castShadow = c.receiveShadow = true; rug.add(c); };
  cyl(0.12, 1.2, 0.6, crimson);
  for (const y of [0.05, 1.15]) { cyl(0.124, 0.05, y, gold); cyl(0.125, 0.025, y + (y < 0.5 ? 0.05 : -0.05), indigo); }
  nextDoor.rug = rug;
  // his dark lantern, on the parcels, slide open
  const tin = new THREE.MeshStandardMaterial({ color: '#4a463e', metalness: 0.6, roughness: 0.45 });
  const lantern = new THREE.Group(); lantern.position.set(-1.2, 0.66, 0.17); g.add(lantern);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.24, 18), tin); body.position.y = 0.12; body.castShadow = true; lantern.add(body);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.08, 18), tin); cap.position.y = 0.28; lantern.add(cap);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 18), new THREE.MeshBasicMaterial({ color: '#ffd28a' })); lens.position.set(0.078, 0.12, 0); lens.rotation.y = Math.PI / 2; lantern.add(lens);
  // Its light stays in his attic: short-ranged, set near his far wall, so none of it reaches yours through the brick
  // (lights here have no shadows and pass through walls). A second one just above his open skylight puts a warm
  // patch on the slates round it, the only warm light outside.
  const L = new THREE.PointLight('#ffb468', 4.5, 2.0, 2); L.position.set(NEXT_X - 0.8, 0.9, -0.1); scene.add(L); glows.push({ L, base: 4.5, seed: 1 });
  const out = new THREE.PointLight('#ffb067', 1.6, 1.45, 2); out.position.copy(nextDoor.skylight.centre()).add(new THREE.Vector3(0, 0.35, -0.1)); scene.add(out); glows.push({ L: out, base: 1.6, seed: 4 });
}

// ---------- sky, moon and the light they give ----------
const MOON_DIR = new THREE.Vector3(0.12, 0.78, -0.62).normalize();   // high over the house opposite
{
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: '#f6f0fb', fog: false }));
  disc.position.copy(MOON_DIR).multiplyScalar(90); disc.lookAt(0, 0, 0); scene.add(disc);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshBasicMaterial({ color: '#b9a8e2', transparent: true, opacity: 0.14, fog: false, depthWrite: false }));
  halo.position.copy(MOON_DIR).multiplyScalar(91); halo.lookAt(0, 0, 0); scene.add(halo);
  const pos = [];
  for (let i = 0; i < 260; i++) { const th = rand() * Math.PI * 2, y = 0.12 + rand() * 0.88, r = Math.sqrt(1 - y * y); pos.push(Math.cos(th) * r * 95, y * 95, Math.sin(th) * r * 95); }
  scene.add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: '#efe4ff', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
}
const hemi = new THREE.HemisphereLight('#a39bd2', '#2e2639', 0.95); scene.add(hemi);   // cold is the default; warmth has to be earned
// One moon for the whole scene, casting shadows: it lights the leads, and comes into each attic only through
// its skylight, landing as a pale square on the boards. No light needs to be faked per room.
const moon = new THREE.DirectionalLight('#c9c3ef', 2.3);
moon.target.position.set(1.4, 0, -2.0); moon.position.copy(moon.target.position).addScaledVector(MOON_DIR, 14);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -7.5, right: 7.5, top: 7.5, bottom: -7.5, near: 1, far: 32 });
moon.shadow.camera.updateProjectionMatrix(); moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.03;
scene.add(moon, moon.target);

// ---------- what is in the attics (stand-ins until attic_cold.glb: same footprints the model prompt asks for) ----------
// Burnett: "a rusty grate, an old iron bedstead, and a hard bed covered with a faded coverlet ... Under the
// skylight ... there stood an old battered red footstool." And the old table she climbs on to look out.
const CANDLE = 0.9;   // a candle-end: a small warm pool, not a lit room
const ticking = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#8b8f95'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(38,50,78,0.45)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); });
const dealMat = new THREE.MeshStandardMaterial({ color: '#6e5a44', roughness: 0.85 });
// an old iron bedstead, head rail at +z, a thin hard mattress and a faded coverlet on it
function bedstead(room, x0, x1, z0, z1) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, t = 0.03, top = 0.48;
  const rust = new THREE.MeshStandardMaterial({ color: '#2a2622', metalness: 0.5, roughness: 0.7 }), g = room.group;
  for (const [z, h] of [[z1 - t / 2, 0.95], [z0 + t / 2, 0.6]]) {
    for (const x of [x0 + t / 2, x1 - t / 2]) box(t, h, t, x, h / 2, z, rust, g);
    box(w, t, t, cx, h - t / 2, z, rust, g); box(w, t * 0.7, t * 0.7, cx, 0.34, z, rust, g);
    for (let x = x0 + 0.15; x < x1 - 0.1; x += 0.15) box(0.014, h - 0.36, 0.014, x, 0.34 + (h - 0.36) / 2, z, rust, g);
  }
  for (const x of [x0 + t / 2, x1 - t / 2]) box(t * 0.7, t, d, x, 0.34, cz, rust, g);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w - 0.04, 0.1, d - 0.06, 3, 0.035), new THREE.MeshStandardMaterial({ map: tiled(ticking, w, 1, 0.3), roughness: 0.95 }));
  m.position.set(cx, top - 0.05, cz); m.castShadow = m.receiveShadow = true; g.add(m);
  const cover = new THREE.Mesh(new RoundedBoxGeometry(w + 0.02, 0.025, d * 0.66, 2, 0.01), new THREE.MeshStandardMaterial({ color: '#6e6656', roughness: 1 }));
  cover.position.set(cx, top + 0.008, z0 + d * 0.33 + 0.02); cover.castShadow = cover.receiveShadow = true; g.add(cover);
  const pillow = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.07, 0.3, 3, 0.03), new THREE.MeshStandardMaterial({ color: '#a8a49a', roughness: 1 }));
  pillow.position.set(cx, top + 0.03, z1 - 0.22); pillow.castShadow = pillow.receiveShadow = true; g.add(pillow);
  room.colliders.push({ minX: x0, maxX: x1, minZ: z0, maxZ: z1 });
}
function oldTable(room, { x0, x1, z0, z1, h }) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, g = new THREE.Group(); room.group.add(g);
  box(x1 - x0, 0.035, z1 - z0, cx, h - 0.0175, cz, dealMat, g);
  for (const x of [x0 + 0.05, x1 - 0.05]) for (const z of [z0 + 0.05, z1 - 0.05]) box(0.045, h - 0.035, 0.045, x, (h - 0.035) / 2, z, dealMat, g);
  room.colliders.push({ minX: x0, maxX: x1, minZ: z0, maxZ: z1 });
  return g;
}
function footstool(room, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.set(0, 0.25, 0.035); room.group.add(g);   // lopsided: one leg short
  const red = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.1, 0.26, 2, 0.025), new THREE.MeshStandardMaterial({ color: '#7a2a26', roughness: 0.9 }));
  red.position.y = 0.15; red.castShadow = red.receiveShadow = true; g.add(red);
  for (const [dx, dz] of [[-0.15, -0.1], [0.15, -0.1], [-0.15, 0.1], [0.15, 0.1]]) box(0.03, 0.1, 0.03, dx, 0.05, dz, woodMat, g);
  room.colliders.push({ minX: x - 0.18, maxX: x + 0.18, minZ: z - 0.15, maxZ: z + 0.15 });
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
// The chimney breast in the back wall, built here with an opening in it. The ironwork is grate.glb, set into
// the opening once it loads: its fireback reaches 18.5 cm into the breast and its hearth slab 30 cm into the room.
const BREAST = { w: 0.72, d: 0.26, hw: 0.25, oh: 0.54 };   // width, depth, the opening's half-width and height
function chimneyBreast(room, x) {
  const z = ROOF.maxZ, top = room.ceilAt(z - BREAST.d) - 0.02, side = BREAST.w / 2 - BREAST.hw;
  const plaster = (w, h) => new THREE.MeshStandardMaterial({ map: tiled(limewashTex, w, h, 1.4), roughness: 0.95 });
  for (const s of [-1, 1]) occluders.push(box(side, top, BREAST.d, x + s * (BREAST.hw + side / 2), top / 2, z - BREAST.d / 2, plaster(side, top), room.group));
  occluders.push(box(BREAST.hw * 2, top - BREAST.oh, BREAST.d, x, (top + BREAST.oh) / 2, z - BREAST.d / 2, plaster(BREAST.hw * 2, top - BREAST.oh), room.group));
  box(0.86, 0.045, 0.12, x, 0.79, z - BREAST.d - 0.05, woodMat, room.group);   // the mantel shelf, just above the iron surround
  room.colliders.push({ minX: x - 0.43, maxX: x + 0.43, minZ: z - BREAST.d - 0.3, maxZ: z });
  return new THREE.Vector3(x, 0, z - BREAST.d);   // where the grate's wall face goes
}
bedstead(sara, -1.5, -0.6, -0.95, 0.95);
const table = oldTable(sara, TABLE);
footstool(sara, 0.62, -1.0);
candleEnd(sara, 0.26, TABLE.h, -1.04);
const grateAt = chimneyBreast(sara, -0.7);
bedstead(becky, 0.4, 1.3, -0.95, 0.95);

const saraDoor = addDoor(sara, 0.85, ROOF.maxZ - 0.026, Math.PI);
const beckyDoor = addDoor(becky, -0.65, ROOF.maxZ - 0.026, Math.PI);

const rooms = [sara, becky, leads];
// where you stand on arriving in each room (room coordinates), and what you face. `eye` raises you (on the table).
const TABLE_C = [(TABLE.x0 + TABLE.x1) / 2, (TABLE.z0 + TABLE.z1) / 2];
sara.entries = {
  start: { pos: [0.6, 0.55], look: [0, -1.3], pitch: 0.16 },
  door: { pos: [0.85, 1.2], look: [0, -0.6] },
  table: { pos: TABLE_C, look: [NEXT_X, -1.2], pitch: 0.02, eye: TABLE.h + EYE },   // head and shoulders out of the skylight
  floor: { pos: [0, -0.62], look: [0, -1.4], pitch: -0.25 },
};
becky.entries = { door: { pos: [-0.65, 1.2], look: [0, -0.6] } };
// out on the leads, you land below your skylight facing along the roof toward the light next door
leads.entries = { skylight: { pos: [-LCX, -2.42 - LCZ], look: [NEXT_X - LCX, -1.27 - LCZ], pitch: -0.05 } };
// the slates just below your skylight: what you face when you are up on the table and can climb out
const below = new THREE.Group(); roofFrame(0).add(below);
proxy(below, new THREE.BoxGeometry(SKY.w + 0.4, 0.55, 0.05), SKY.x, (SKY.z0 - ROOF.minZ) / COS_A - 0.24, -ROOF.roofT - 0.06);
examinables.push({ id: 'door_becky', room: 0, roots: [saraDoor] });
examinables.push({ id: 'door_back', room: 1, roots: [beckyDoor] });
examinables.push({ id: 'table', room: 0, roots: [table] });
examinables.push({ id: 'skylight_out', room: 0, roots: [below], when: () => perched });
examinables.push({ id: 'skylight_in', room: 2, roots: [sara.skylight.kerb, sara.skylight.outside] });
scene.updateMatrixWorld(true);

let perched = false;   // standing on the table under the skylight
const CLUES = {
  door_becky: { verb: 'Go to Becky\'s attic' },
  door_back: { verb: 'Go back to your attic' },
  table: { get verb() { return perched ? 'Climb down' : 'Climb onto the table'; } },
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
    player.eye = e.eye; perched = !!e.eye;
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
    if (ex && ex.room !== undefined && ex.room !== player.room) continue;   // the other side of your skylight belongs to the leads: look past it
    return ex && (!ex.when || ex.when()) ? ex : null;
  }
  return null;
}
function setGlow(ex, amount) {
  if (!ex || ex.person) return;   // people get the prompt, not a glow
  for (const m of ex.meshes) { if (m.userData.proxy || !m.material.emissive) continue; m.material.emissive.set('#f0bf78'); m.material.emissiveIntensity = amount; }
}
function examine() {
  if (!target || cardOpen || moving) return;
  const id = target.id;
  if (id === 'door_becky') return goTo(1, 'door');
  if (id === 'door_back') return goTo(0, 'door');
  if (id === 'table') return goTo(0, perched ? 'floor' : 'table');
  if (id === 'skylight_out') return goTo(2, 'skylight');
  if (id === 'skylight_in') return goTo(0, 'table');   // you come back in the way you went out: onto the table
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
// put each model where its stand-in was
function placeModels() {
  const grate = parts.grate;
  grate.position.copy(grateAt); grate.rotation.y = Math.PI;   // modelled facing +Z; the attic's grate faces into the room
  grate.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  sara.group.add(grate);
}
Promise.all(MODELS.map(parseGLB)).then(models => {
  models.forEach((g, i) => { parts[MODELS[i].replace('glb-', '')] = g.scene; });
  placeModels();
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
  get target() { return target ? target.id : null; }, get perched() { return perched; },
  rooms: rooms.map(r => r.name),
  where: () => ({ room: player.room, x: +player.x.toFixed(3), z: +player.z.toFixed(3) }),
  // stand in room i at its own (lx, lz), looking at a world point
  place(i, lx, lz, look) {
    const p = rooms[i].group.localToWorld(new THREE.Vector3(lx, 0, lz));
    player.room = i; player.x = p.x; player.z = p.z; player.eye = undefined; perched = false; setRoomLights(i);
    if (look) { const [wx, wy, wz] = look, eyeY = rooms[i].floorY + EYE; player.yaw = Math.atan2(-(wx - p.x), -(wz - p.z)); player.pitch = Math.atan2(wy - eyeY, Math.hypot(wx - p.x, wz - p.z)); }
  },
  // stand where a player arrives in room i, facing what they would face
  enter(i, at) { const r = rooms[i], e = r.entries[at] || r.entries.door || Object.values(r.entries)[0]; this.place(i, e.pos[0], e.pos[1]); player.eye = e.eye; perched = !!e.eye; const lk = r.group.localToWorld(new THREE.Vector3(e.look[0], 0, e.look[1])); player.yaw = Math.atan2(-(lk.x - player.x), -(lk.z - player.z)); player.pitch = e.pitch ?? -0.1; },
  placeWorld(i, wx, wz, look) { const p = rooms[i].group.worldToLocal(new THREE.Vector3(wx, rooms[i].group.position.y, wz)); this.place(i, p.x, p.z, look); },
  look(wx, wy, wz) { const eyeY = rooms[player.room].floorY + (player.eye ?? EYE); player.yaw = Math.atan2(-(wx - player.x), -(wz - player.z)); player.pitch = Math.atan2(wy - eyeY, Math.hypot(wx - player.x, wz - player.z)); },
  bounds: i => { const r = rooms[i]; return { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ }; },
  entryXZ: i => { const r = rooms[i], e = Object.values(r.entries)[0]; return e.pos; },
  canStand: (i, lx, lz) => { const was = player.room; player.room = i; const p = rooms[i].group.localToWorld(new THREE.Vector3(lx, 0, lz)); const b = blocked(p.x, p.z); player.room = was; return !b; },
  examine: () => examine(),
  // How much of something you can see from a spot: the share of its sample points with a clear line from your eye.
  // 'glass' is next door's propped skylight; 'rug' is the rolled rug stood in the corner of his attic.
  seen(what, i, lx, lz, eye = EYE) {
    const solid = []; scene.traverse(o => { if (o.isMesh && o.visible && o.material && !o.material.transparent && o.material.visible !== false) solid.push(o); });
    const from = rooms[i].group.localToWorld(new THREE.Vector3(lx, 0, lz)); from.y = rooms[i].floorY + eye;
    const pts = [];
    if (what === 'glass') { const gl = nextDoor.skylight.glass, w = gl.geometry.parameters.width, h = gl.geometry.parameters.height; for (const u of [-0.35, -0.12, 0.12, 0.35]) for (const v of [-0.35, -0.12, 0.12, 0.35]) pts.push(gl.localToWorld(new THREE.Vector3(u * w, v * h, 0))); }
    else for (const y of [0.2, 0.45, 0.7, 0.95]) for (const a of [-0.6, 0, 0.6]) pts.push(nextDoor.rug.localToWorld(new THREE.Vector3(0.13 * Math.cos(a), y, 0.13 * Math.sin(a))));
    const rc = new THREE.Raycaster(); let clear = 0;
    for (const pt of pts) { const dir = pt.clone().sub(from), dist = dir.length(); rc.set(from, dir.normalize()); rc.far = dist - 0.03; if (!rc.intersectObjects(solid, false).length) clear++; }
    return clear / pts.length;
  },
  tableXZ: () => TABLE_C, tableEye: TABLE.h + EYE,
  viewFrom(pos, look) { view = { pos, look }; },   // a free camera for checking things from outside the player's reach
  get scene() { return scene; },
  topDown(i) {   // look straight down into a room with its roof lifted off
    const r = rooms[i], c = r.group.localToWorld(new THREE.Vector3((r.minX + r.maxX) / 2, 0, (r.minZ + r.maxZ) / 2));
    if (r.slope) { r.slope.visible = false; hidden.push(r.slope); }
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
    const f = perched ? 0 : (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0) - joyV.y;
    const s = perched ? 0 : (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0) + joyV.x;
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
  if (target && !cardOpen && !moving) { p.hidden = false; p.textContent = (isTouch ? 'Tap: ' : 'E: ') + CLUES[target.id].verb; }
  else p.hidden = true;

  for (const r of rooms) for (const l of r.lights) if (l.flicker && l.on) l.L.intensity = l.base * (reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(t * 9 + l.seed) * Math.sin(t * 5.3 + l.seed * 2));
  for (const gl of glows) gl.L.intensity = gl.base * (reduceMotion ? 1 : 0.82 + 0.18 * Math.sin(t * 7 + gl.seed) * Math.sin(t * 3.1 + gl.seed));
  // your skylight lifts open while you are up on the table or out on the leads
  const sash = sara.skylight.hinge, want = perched || player.room === 2 ? 2.2 : 0;   // thrown right back, clear of your view along the roof
  sash.rotation.x += (want - sash.rotation.x) * Math.min(1, dt * (reduceMotion ? 60 : 5));
  for (const fl of flames) { if (!reduceMotion) { fl.scale.y = 2.3 + Math.sin(t * 11 + fl.id) * 0.18; fl.rotation.z = Math.sin(t * 3 + fl.id) * 0.05; } }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>
