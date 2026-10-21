<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Flow } from 'three/addons/modifiers/CurveModifier.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
renderer.toneMappingExposure = 1.4;   // brighter than pure candlelight so the corners stay readable
renderer.domElement.tabIndex = 0;
$('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d0b0a');
const FOG = 0.032, HEMI = 1.2, CANDLE = 2.4;   // daytime look: light levels shared by the scenes that reset them
scene.fog = new THREE.FogExp2('#14110e', FOG);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.03, 30);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

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
// his room: bare, stained plaster above the dado
const plasterTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4033'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rand() > 0.5 ? '20,15,10' : '120,105,80'},0.05)`; g.beginPath(); g.ellipse(rand() * w, rand() * h, 10 + rand() * 40, 8 + rand() * 30, rand() * 3, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 2000; i++) g.fillRect(rand() * w, rand() * h, 2, 2);
});
const dadoMat = new THREE.MeshStandardMaterial({ color: '#2b1f16', roughness: 0.6 });
const trimMat = new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.5 });
const iron = new THREE.MeshStandardMaterial({ color: '#2a2a2c', metalness: 0.6, roughness: 0.5 });
const frameMat = new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.6 });
const skyTex = canvasTex(256, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7d8a96'); gr.addColorStop(0.7, '#a7aca8'); gr.addColorStop(1, '#6f7a68');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3c4637';
  g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h - 70 - Math.sin(x / 30) * 18 - rand() * 10); g.lineTo(w, h); g.fill();
  g.strokeStyle = '#2a3027'; g.lineWidth = 5; g.beginPath(); g.moveTo(190, h); g.lineTo(196, 120); g.stroke();
  g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(195, 140 + i * 14); g.lineTo(195 + (i % 2 ? 40 : -40), 110 + i * 12); g.stroke(); }
});

const occluders = [];   // walls etc.: block the examine ray
const examinables = []; // {id, roots:[], meshes:[]}

// A room: its own group (local coordinates), shell, colliders, lights
function makeRoom({ name, minX, maxX, minZ, maxZ, h, wallTex, ceilColor, position, rotY, vent }) {
  const g = new THREE.Group(); g.position.copy(position); g.rotation.y = rotY; scene.add(g);
  const W = maxX - minX, D = maxZ - minZ, CX = (minX + maxX) / 2, CZ = (minZ + maxZ) / 2;
  const ft = floorTex.clone(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(W / 1.6, D / 1.6); ft.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.75 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, 0, CZ); floor.receiveShadow = true; g.add(floor);
  // a wall, optionally with a real rectangular opening in it (the ventilator between the two bedrooms)
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
function addWindow(room, x, z, ry) {
  const win = new THREE.Group();
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), new THREE.MeshBasicMaterial({ map: skyTex, color: '#9aa0a0' })));
  for (let i = -3; i <= 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.3, 8), iron); b.position.set(i * 0.12, 0, 0.05); win.add(b); }
  for (const y of [-0.45, 0.45]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.02), iron); b.position.set(0, y, 0.05); win.add(b); }
  for (const [w2, h2, x2, y2] of [[1.04, 0.07, 0, 0.685], [1.04, 0.07, 0, -0.685], [0.07, 1.44, -0.485, 0], [0.07, 1.44, 0.485, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, 0.1), frameMat); b.position.set(x2, y2, 0.04); win.add(b); }
  for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.36, 0.04), new THREE.MeshStandardMaterial({ color: '#33251b', roughness: 0.7 })); sh.position.set(s * 0.74, 0, 0.1); sh.rotation.y = s * 0.35; sh.castShadow = true; win.add(sh); }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.2), frameMat); sill.position.set(0, -0.72, 0.1); win.add(sill);
  win.position.set(x, 1.45, z); win.rotation.y = ry; room.group.add(win);
  // grey daylight from outside the window
  const out = new THREE.Vector3(0, 0.85, -0.7).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(x, 1.45, z));
  const into = new THREE.Vector3(0, -1.45, 2.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(new THREE.Vector3(x, 1.45, z));
  const day = new THREE.SpotLight('#a9b6c8', 14, 0, 0.75, 0.8, 1.4);
  day.position.copy(out); day.target.position.copy(into);
  day.castShadow = true; day.shadow.mapSize.set(1024, 1024); day.shadow.bias = -0.0005; day.shadow.normalBias = 0.02;
  room.group.add(day, day.target); room.lights.push({ L: day, base: 14 });
  return win;
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
  // the dark corridor seen when it opens (hidden inside the closed door's thickness)
  const gap = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 2.05), new THREE.MeshBasicMaterial({ color: '#0e0a07' }));
  gap.position.set(x, 1.025, z).add(new THREE.Vector3(0, 0, -0.024).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry));
  gap.rotation.y = ry; room.group.add(gap);
  door.userData.hinge = hinge; door.userData.closedY = ry;
  return door;
}

// ---------- the two rooms ----------
// The house, from above: Julia's bedroom and Dr. Roylott's sit back to back, sharing one wall, and both open onto
// the same corridor along their east side (as in the story: "they all open out into the same corridor").
// The ventilator is a real 32 x 22 cm hole through the shared wall, so you can see from one room into the other.
// Julia's bedroom sits at the origin (the furniture file was laid out for a 4 m x 4.5 m room).
const VENT = { x: 0.45, y: 2.4, w: 0.32, h: 0.22 };    // in Julia's room (= world) coordinates
const WALL = 0.12, ROY_X = -0.2;                         // his room's east wall lines up with hers (x = 2.05)
const julia = makeRoom({ name: 'Julia Stoner\'s bedroom', minX: -2.05, maxX: 2.05, minZ: -2.252, maxZ: 2.25, h: 2.75,
  wallTex: damask('#2e3b32', 'rgba(160,170,130,0.12)'), ceilColor: '#4a443c', position: new THREE.Vector3(0, 0, 0), rotY: 0, vent: VENT });
// Dr. Roylott's room is behind her back wall, turned to face it. Turned round, his x runs the other way.
const roylott = makeRoom({ name: 'Dr. Roylott\'s room', minX: -2.25, maxX: 2.25, minZ: -2.25, maxZ: 2.25, h: 2.75,
  wallTex: plasterTex, ceilColor: '#3e3a33', position: new THREE.Vector3(ROY_X, 0, -2.252 - WALL - 2.25), rotY: Math.PI,
  vent: { ...VENT, x: ROY_X - VENT.x } });
// the shaft through the wall between the two grilles
{
  const duct = new THREE.MeshStandardMaterial({ color: '#2a241e', roughness: 1, side: THREE.DoubleSide });
  const z0 = -2.252, d = WALL, zc = z0 - d / 2;
  for (const [w, hgt, x, y, ry, rx] of [[d, VENT.h, VENT.x - VENT.w / 2, VENT.y, Math.PI / 2, 0], [d, VENT.h, VENT.x + VENT.w / 2, VENT.y, Math.PI / 2, 0],
                                         [VENT.w, d, VENT.x, VENT.y - VENT.h / 2, 0, Math.PI / 2], [VENT.w, d, VENT.x, VENT.y + VENT.h / 2, 0, Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), duct); m.position.set(x, y, zc); m.rotation.set(rx, ry, 0); scene.add(m);
  }
}
const rooms = [julia, roylott];

const juliaWindow = addWindow(julia, -2.05 + 0.011, -1.3, Math.PI / 2);
const juliaDoor = addDoor(julia, 2.05 - 0.026, 1.5, -Math.PI / 2);          // east wall, onto the corridor
const roylottWindow = addWindow(roylott, 2.25 - 0.011, -0.55, -Math.PI / 2);
const roylottDoor = addDoor(roylott, -2.25 + 0.026, 1.65, Math.PI / 2);     // his west wall faces east once turned: the same corridor
examinables.push({ id: 'window', roots: [juliaWindow] });
examinables.push({ id: 'door_out', roots: [juliaDoor] });
examinables.push({ id: 'door_back', roots: [roylottDoor] });

// fireplace in Julia's room, its chimney stapled shut
{
  const fire = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#4a443d', roughness: 0.9 });
  const fs = (w2, h2, d2, x, y, z, m = stone) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; fire.add(b); };
  fs(0.22, 1.05, 0.3, -0.53, 0.525, 0); fs(0.22, 1.05, 0.3, 0.53, 0.525, 0); fs(1.36, 0.1, 0.38, 0, 1.1, 0.03, trimMat); fs(1.28, 0.22, 0.3, 0, 0.94, 0);
  fs(0.84, 0.82, 0.02, 0, 0.41, -0.13, new THREE.MeshStandardMaterial({ color: '#0b0a09', roughness: 1 }));
  fs(1.5, 0.04, 0.5, 0, 0.02, 0.1, new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.8 }));
  for (const x of [-0.25, -0.08, 0.08, 0.25]) fs(0.03, 0.12, 0.03, x, 0.75, -0.1, iron);
  const ash = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 6), new THREE.MeshStandardMaterial({ color: '#3a3632', roughness: 1 })); ash.scale.set(1.3, 0.2, 0.8); ash.position.set(0, 0.03, -0.02); fire.add(ash);
  fire.position.set(-0.9, 0, 2.25 - 0.16); fire.rotation.y = Math.PI; julia.group.add(fire);
  examinables.push({ id: 'chimney', roots: [fire] });
  julia.colliders.push({ minX: -1.67, maxX: -0.13, minZ: 2.25 - 0.42, maxZ: 2.25 });
}

const hemi = new THREE.HemisphereLight('#8f99a6', '#2a2018', HEMI); scene.add(hemi);
scene.add(camera);   // so the cane can be held in view

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
      loader.parse(bytes.slice().buffer, '', g => { modelsDone++; if (!loadFailed) $('begin').textContent = `Loading the house… ${modelsDone} of 7`; res(g); }, rej);
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
function addCandle(room, candleScene, x, y, z, ry, shadow) {
  const c = candleScene.clone(true);
  c.position.set(x, y, z); c.rotation.y = ry;
  c.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const f = c.getObjectByName('flame'); if (f) flames.push(f);
  const L = new THREE.PointLight('#ffb35c', CANDLE, 7, 1.5);
  L.position.set(x, y + 0.2, z);
  if (shadow) { L.castShadow = true; L.shadow.mapSize.set(512, 512); L.shadow.bias = -0.002; L.shadow.radius = 4; }
  room.group.add(c, L); room.lights.push({ L, base: CANDLE, flicker: true, seed: rand() * 10 });
}
function proxy(parent, geo, x, y, z) {
  if (!parent) return;
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); m.userData.proxy = true; parent.add(m);
}

let helenRig = null;
let roy = null;
let adder = null, caneHold = null;
Promise.all([parseGLB('glb-bedroom'), parseGLB('glb-candle'), parseGLB('glb-roylott'), parseGLB('glb-helen'), parseGLB('glb-grimesby'), parseGLB('glb-adder'), parseGLB('glb-cane')]).then(([bed, candle, roy0, hel, grim, snk, cn]) => {
  const roy_ = roy0;
  for (const [gltf, room] of [[bed, julia], [roy_, roylott]]) {
    gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; occluders.push(o); } });
    room.group.add(gltf.scene);
  }
  const J = n => bed.scene.getObjectByName(n), R = n => roy_.scene.getObjectByName(n);
  Object.assign(parts, {
    bell_rope: J('bell_rope'), ventilator: J('ventilator'), wicker_chair: J('wicker_chair'), rug: J('rug'),
    chest_drawer_1a: J('chest_drawer_1a'), dressing_table_drawer: J('dressing_table_drawer'),
    safe_door: R('safe_door'), vent_back: R('ventilator_back'), dog_lash: R('dog_lash'),
  });
  // Julia's pillow came as a stretched sphere (it looked like an egg). Keep its size, place and
  // material, but give it a pillow's shape: rounded corners, thin edges, plump middle.
  const pillow = J('bed_pillow');
  if (pillow && pillow.isMesh && Math.abs(pillow.scale.x - pillow.scale.y) > 0.1) {
    const g = new RoundedBoxGeometry(2, 2, 2, 6, 0.55);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const puff = 0.55 + 0.45 * (1 - x * x * 0.85) * (1 - z * z * 0.85);   // thinner toward the edges
      pos.setY(i, y * puff);
    }
    g.computeVertexNormals();
    pillow.geometry.dispose(); pillow.geometry = g;
    pillow.scale.y *= 0.85;   // a little flatter overall
  }
  // the wicker chair was pressed into the dressing table; give it room
  if (parts.wicker_chair) { parts.wicker_chair.position.set(1.62, 0, 0.5); parts.wicker_chair.rotation.y = -0.7; }
  if (parts.rug) parts.rug.traverse(o => { if (o.isMesh) o.castShadow = false; });

  // the bell-rope hangs exactly to the pillow (it used to be long enough to sink into it)
  const ropeAxis = { top: new THREE.Vector3(0.18, 2.4, -2.21), bottom: new THREE.Vector3(0.17, 0.9, -2.12) };
  if (parts.bell_rope && J('bed_pillow')) {
    julia.group.updateMatrixWorld(true);
    const rope = parts.bell_rope, rb = new THREE.Box3().setFromObject(rope), top = rope.getWorldPosition(new THREE.Vector3());
    const cx = (rb.min.x + rb.max.x) / 2, cz = (rb.min.z + rb.max.z) / 2;
    const hit = new THREE.Raycaster(new THREE.Vector3(cx, 2.2, cz), new THREE.Vector3(0, -1, 0)).intersectObject(J('bed_pillow'), true)[0];
    const restY = hit ? hit.point.y + 0.004 : rb.min.y;
    if (rb.min.y < restY) rope.scale.y *= (top.y - restY) / (top.y - rb.min.y);
    ropeAxis.top.copy(top); ropeAxis.bottom.set(cx, restY, cz);
  }

  // small clues get a larger invisible hit area so the dot can't slip between grille bars
  proxy(parts.ventilator, new THREE.BoxGeometry(0.26, 0.2, 0.08), 0, 0, 0.02);
  proxy(parts.bell_rope, new THREE.CylinderGeometry(0.07, 0.07, 1.62, 8), 0, -0.8, 0);
  proxy(parts.vent_back, new THREE.BoxGeometry(0.26, 0.2, 0.08), 0, 0, 0.02);
  proxy(R('saucer_of_milk'), new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), 0, 0.02, 0);
  // the lash's hit area goes wherever the lash itself is, whichever model is loaded
  if (parts.dog_lash) {
    roylott.group.updateMatrixWorld(true);
    const c = new THREE.Box3().setFromObject(parts.dog_lash).getCenter(new THREE.Vector3());
    parts.dog_lash.worldToLocal(c);
    proxy(parts.dog_lash, new THREE.BoxGeometry(0.16, 0.4, 0.12), c.x, c.y, c.z);
  }

  // The ventilators in the models sit almost flush with the wall, dark on dark, and can't be seen.
  // Build a proper iron grille on each side: a black opening, a raised frame, and bars that catch the light.
  const grilleMat = new THREE.MeshStandardMaterial({ color: '#8c8272', metalness: 0.55, roughness: 0.45 });
  function buildGrille(room, src) {
    if (!src) return null;
    room.group.updateMatrixWorld(true);
    const c = room.group.worldToLocal(new THREE.Box3().setFromObject(src).getCenter(new THREE.Vector3()));
    src.traverse(o => { if (o.isMesh && !o.userData.proxy) o.visible = false; });   // hide the sunken original
    const g = new THREE.Group(); g.position.set(c.x, c.y, room.minZ + 0.003);
    const W = 0.32, H = 0.22;
    const box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), grilleMat); m.position.set(x, y, z); m.castShadow = true; g.add(m); };
    box(W + 0.06, 0.03, 0.035, 0, H / 2 + 0.015, 0.017); box(W + 0.06, 0.03, 0.035, 0, -H / 2 - 0.015, 0.017);
    box(0.03, H, 0.035, -W / 2 - 0.015, 0, 0.017); box(0.03, H, 0.035, W / 2 + 0.015, 0, 0.017);
    for (let i = 1; i <= 5; i++) box(0.012, H, 0.015, -W / 2 + i * W / 6, 0, 0.012);
    box(W, 0.01, 0.012, 0, 0, 0.012);
    room.group.add(g);
    return g;
  }
  // Dr. Roylott's chair and his side of the ventilator stand where the hole now comes through
  for (const n of ['wooden_chair', 'chair_seat', 'ventilator_back']) { const o = R(n); if (o) o.position.x += (ROY_X - VENT.x) - 0.35; }
  // the open window shutter swings to z 0.42; slide the bookcase along the wall clear of it
  const SHELF_DZ = 1.05;
  for (const n of ['bookshelf', 'books_red', 'books_green', 'book_gilt']) { const o = R(n); if (o && !(o.parent && o.parent.name === 'bookshelf')) o.position.z += SHELF_DZ; }
  const grilleJ = buildGrille(julia, parts.ventilator), grilleR = buildGrille(roylott, parts.vent_back);
  // a little light from the far side of each grille, so the opening reads as a way through to the next room
  // (it lights only the far room's walls; a wall lit from behind stays dark on its own side)
  for (const [room, other, z] of [[julia, roylott, -2.7], [roylott, julia, -1.9]]) {
    const L = new THREE.PointLight('#ffb870', 0.9, 1.4, 2); L.position.set(VENT.x, VENT.y - 0.15, z); scene.add(L);
    room.lights.push({ L, base: 0.9, fill: true });
  }
  const reg = (id, ...objs) => { const roots = objs.filter(Boolean); if (roots.length) examinables.push({ id, roots }); };
  reg('bell_rope', J('bell_rope'), J('rope_hook'));
  reg('ventilator', J('ventilator'), grilleJ);
  reg('bed', J('bed'), J('bed_clamps'));
  reg('chest', J('chest_of_drawers'));
  reg('dressing', J('dressing_table'));
  reg('safe', R('safe_body'), R('safe_door'));
  reg('saucer', R('saucer_of_milk'));
  reg('lash', R('dog_lash'));
  // the seat is the part you look at; some models keep it inside the chair, others beside it
  const seat = R('chair_seat'), chairObj = R('wooden_chair');
  reg('chair', chairObj, seat && !(chairObj && chairObj.getObjectById(seat.id)) ? seat : null);
  reg('vent_back', R('ventilator_back'), grilleR);
  reg('camp_bed', R('camp_bed'));
  reg('books', R('bookshelf'));

  addCandle(julia, candle.scene, -1.72, 1.0, 0.55, 0.4, true);
  addCandle(julia, candle.scene, 1.72, 0.757, -0.9, 2.2, false);
  addCandle(roylott, candle.scene, -0.72, 0.72, 1.0, 1.0, true);
  addCandle(roylott, candle.scene, 2.02, 0.9, 0.8 + SHELF_DZ, 2.6, false);
  // his room has no wallpaper to bounce light; a dim ceiling fill keeps the safe and chair readable
  const fillR = new THREE.PointLight('#c9b79a', 2.0, 9, 1.3); fillR.position.set(0.6, 2.4, -0.9); roylott.group.add(fillR); roylott.lights.push({ L: fillR, base: 2.0 });
  // and a soft fill in Julia's room, so the fireplace and door wall aren't lost in shadow
  const fillJ = new THREE.PointLight('#d8c4a0', 1.4, 8, 1.3); fillJ.position.set(0.2, 2.4, 0.9); julia.group.add(fillJ); julia.lights.push({ L: fillJ, base: 1.4, fill: true });

  // ---- Helen Stoner waits by the fireplace in her sister's room ----
  const helen = hel.scene;
  fixJoints(helen, [['head', 'head_skin', 'bottom'], ['arm_left', 'arm_left_sleeve', 'top'], ['arm_right', 'arm_right_sleeve', 'top'],
    ['arm_left_forearm', 'arm_left_forearm_sleeve', 'top'], ['arm_right_forearm', 'arm_right_forearm_sleeve', 'top']]);
  helen.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  helen.position.set(-0.95, 0, 1.25); helen.rotation.y = 2.1;   // facing into the room, toward the door
  julia.group.add(helen);
  const H = n => helen.getObjectByName(n);
  helenRig = { root: helen, head: H('head'), body: H('body'), armL: H('arm_left'), armR: H('arm_right'),
    foreL: H('arm_left_forearm'), foreR: H('arm_right_forearm'), eyes: [], yaw: 0, pitch: 0, gesture: 0, talk: 0, blink: 2, blinkT: 0 };
  for (const k of ['head', 'body', 'armL', 'armR', 'foreL', 'foreR']) if (helenRig[k]) helenRig[k].userData.q0 = helenRig[k].quaternion.clone();
  if (helenRig.body) helenRig.body.userData.s0 = helenRig.body.scale.clone();
  // her eyes pivot from the neck; give each a pivot at its own centre so a blink squashes in place
  helen.updateMatrixWorld(true);
  for (const n of ['eye_left', 'eye_right']) {
    const eye = H(n); if (!eye) continue;
    const c = new THREE.Box3().setFromObject(eye).getCenter(new THREE.Vector3());
    const pivot = new THREE.Group(); eye.parent.add(pivot);
    pivot.position.copy(eye.parent.worldToLocal(c)); pivot.updateMatrixWorld(true);
    pivot.attach(eye); helenRig.eyes.push(pivot);
  }
  examinables.push({ id: 'helen', roots: [helen] });

  // ---- the swamp adder: hidden until the night watch ----
  {
    const root = snk.scene; root.visible = false;
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); } });
    const segs = [1, 2, 3, 4, 5, 6].map(i => root.getObjectByName('seg_' + i));
    // distance from the tip of the snout back to each joint (snout at z 0.5, joints at 0.35, 0.18, 0.01, -0.16, -0.33)
    adder = { root, segs, joints: [0.15, 0.32, 0.49, 0.66, 0.83], tongue: root.getObjectByName('tongue'), headY: 2.42 };
    for (const sg of segs) if (sg) sg.userData.q0 = sg.quaternion.clone();
    // The snake is drawn as one smooth body that slides along a curve (out of the ventilator, round the rope, round
    // Roylott's head) instead of six stiff pieces bending at their joints. Bake the model, lying straight, into one
    // shape with its snout toward +X; the original stays hidden and only its "visible" flag is used.
    root.updateMatrixWorld(true);
    const inv = root.matrixWorld.clone().invert(), geos = [], mats = [];
    root.traverse(o => {
      if (!o.isMesh) return;
      let g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (g.index) g = g.toNonIndexed();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      geos.push(g); mats.push(o.material); o.visible = false;
    });
    const body = mergeGeometries(geos, true); body.rotateY(Math.PI / 2);
    const flow = new Flow(new THREE.Mesh(body, mats)); flow.uniforms.spineOffset.value = 0;
    flow.object3D.traverse(o => { o.frustumCulled = false; o.castShadow = false; });
    flow.object3D.visible = false; scene.add(flow.object3D);   // kept at the scene root: its curve is in world space
    Object.assign(adder, { flow, mode: 'rope', curveMode: null, rope: null });
    buildSnakePath(ropeAxis);
    root.rotation.x = Math.PI / 2;
    julia.group.add(root);
  }
  // ---- Holmes's cane, held in view during the watch ----
  {
    const m = cn.scene; m.traverse(o => { if (o.isMesh) o.castShadow = false; });
    m.position.set(0, -0.888, -0.05);   // hold it by the handle
    caneHold = new THREE.Group(); caneHold.add(m); caneHold.visible = false;
    caneHold.position.set(0.26, -0.36, -0.45);
    camera.add(caneHold);
  }

  // ---- Dr. Grimesby Roylott: waits out of sight in the corridor until his moment ----
  const man = grim.scene;
  fixJoints(man, [['head', 'neck', 'bottom'], ['eye_left', 'eye_left', 'center'], ['eye_right', 'eye_right', 'center'],
    ['arm_left', 'sleeve_left', 'top'], ['arm_right', 'sleeve_upper_right', 'top'], ['elbow_right', 'sleeve_forearm_right', 'top'],
    ['leg_left', 'thigh_left', 'top'], ['leg_right', 'thigh_right', 'top']]);
  man.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  man.position.set(2.55, 0, 1.5); man.rotation.y = -Math.PI / 2; man.visible = false;   // in the corridor, facing the door
  julia.group.add(man);
  const G = n => man.getObjectByName(n);
  roy = { root: man, head: G('head'), body: G('body'), armR: G('arm_right'), elbowR: G('elbow_right'), armL: G('arm_left'),
    eyes: [G('eye_left'), G('eye_right')].filter(Boolean), state: 'waiting', t: 0, wait: 0, yaw: 0, threat: 0, strike: 0, blink: 3, blinkT: 0, done: false };
  for (const k of ['head', 'body', 'armR', 'elbowR', 'armL']) if (roy[k]) roy[k].userData.q0 = roy[k].quaternion.clone();
  for (const e of roy.eyes) e.userData.s0 = e.scale.clone();
  roy.collider = { minX: 1.45, maxX: 2.05, minZ: 1.15, maxZ: 1.85 };
  // lamplight from the corridor, only while the door stands open
  roy.lamp = new THREE.PointLight('#ffb870', 0, 6, 1.4); roy.lamp.position.set(1.3, 1.95, 1.5); julia.group.add(roy.lamp);
  julia.colliders.push({ minX: -1.25, maxX: -0.65, minZ: 0.95, maxZ: 1.55 });

  // collision boxes from each model's measured footprint (room-local metres)
  julia.colliders.push(
    { minX: -0.5, maxX: 0.5, minZ: -2.252, maxZ: -0.27 },     // bed
    { minX: -2.05, maxX: -1.47, minZ: -0.16, maxZ: 0.86 },    // chest of drawers
    { minX: 1.5, maxX: 2.05, minZ: -1.06, maxZ: -0.04 },      // dressing table
    { minX: 1.38, maxX: 1.86, minZ: 0.26, maxZ: 0.74 });      // wicker chair
  roylott.colliders.push(
    { minX: -2.25, maxX: -1.3, minZ: -2.25, maxZ: -0.2 },     // camp bed
    { minX: -2.25, maxX: -1.19, minZ: 0.06, maxZ: 1.04 },     // armchair
    { minX: -1.06, maxX: -0.44, minZ: 0.74, maxZ: 1.36 },     // round table
    { minX: -0.88, maxX: -0.42, minZ: -2.25, maxZ: -1.69 },   // wooden chair, under the ventilator
    { minX: 1.0, maxX: 1.7, minZ: -2.25, maxZ: -1.57 },       // safe
    { minX: 1.9, maxX: 2.25, minZ: 0.03 + SHELF_DZ, maxZ: 1.07 + SHELF_DZ }); // bookshelf, clear of the shutter

  for (const ex of examinables) {
    ex.meshes = [];
    for (const r of ex.roots) r.traverse(o => { if (o.isMesh) { if (!o.userData.proxy) o.material = o.material.clone(); o.userData.ex = ex; ex.meshes.push(o); } });
  }
  setRoomLights(0);
  ready = true;
  updateHud();
  setIntroState(prologueSeen() ? 'story' : 'prologue');
}).catch(err => {
  console.error(err);
  loadFailed = true;
  $('status').textContent = 'The house didn\'t finish loading. Check your connection and reload.';
  const btn = $('begin'); btn.disabled = false; btn.textContent = 'Reload the game';
  btn.onclick = () => location.reload();
});

// ---------- what Holmes notices ----------
const KEY = ['bell_rope', 'ventilator', 'bed', 'safe', 'saucer', 'lash', 'chair'];
const CLUES = {
  bell_rope: { verb: 'Pull the bell-rope', title: 'A bell-rope that rings no bell',
    text: 'I give it a sharp pull. Nothing. It is a dummy, fastened to a hook just above the ventilator, with no wire behind it. Miss Stoner says it was put up two years ago, shortly before her sister died. Why hang a bell-pull where no bell will ring?' },
  ventilator: { verb: 'Examine the ventilator', title: 'A ventilator to nowhere',
    text: 'A small grille, high in the wall. It does not open to the air outside, as any honest ventilator would. It opens into the next room: Dr. Roylott\'s. Built at the same time as the rope, and only a few inches from it.' },
  bed: { verb: 'Examine the bed', title: 'The bed is bolted down',
    text: 'Clamped to the floor at all four feet. It cannot be moved an inch. Whoever sleeps here must lie exactly beneath the rope and the ventilator, whether she likes it or not.' },
  window: { verb: 'Examine the window', title: 'Barred and shuttered',
    text: 'Iron bars, heavy shutters, and a bolt that Julia fastened every night. The shutters were bolted on the night she died. Nobody came in by the window.' },
  chimney: { verb: 'Examine the fireplace', title: 'A chimney stapled shut',
    text: 'Wide enough, but barred across by four large iron staples. Nothing came down the chimney, either. The danger, then, was already inside the house.' },
  chest: { verb: 'Open the top drawer', title: 'A box of matches',
    text: 'Julia\'s things, kept by her sister. A box of matches. When they found her, she held the burnt stump of a match in one hand and the box in the other. She had struck a light to see something in the room.' },
  dressing: { verb: 'Open the dressing-table drawer', title: 'Nothing out of place',
    text: 'Combs, ribbons, a hand-glass. A young lady\'s table, kept neat. Whatever happened in this room, it did not happen here.' },
  safe: { verb: 'Try the safe', title: 'A safe kept locked',
    text: 'A large iron safe, locked fast. Miss Stoner says it holds her stepfather\'s business papers; she saw inside it once, years ago. I tap the side. "There isn\'t a cat in it, for example?" She laughs at the idea. I do not.' },
  saucer: { verb: 'Examine the saucer', title: 'A saucer of milk, and no cat',
    text: 'A saucer of milk, set on top of the safe. There is no cat in this house. Dr. Roylott keeps a cheetah and a baboon loose in the grounds, and neither of them takes its milk from a saucer on a safe. So who is it for?' },
  lash: { verb: 'Examine the dog lash', title: 'A lash tied into a loop',
    text: 'A small dog lash hung on the corner of the bed. The end is curled upon itself and tied so as to make a loop of whipcord. There is no dog here. A loop like that is for holding something at arm\'s length.' },
  chair: { verb: 'Examine the wooden chair', title: 'Someone stands on this chair',
    text: 'Through my lens: the seat is marked by the boots of someone who has stood on it, and more than once. It sits directly beneath the ventilator, the only thing in the room that could put a man\'s hands within reach of it.' },
  vent_back: { verb: 'Examine the ventilator', title: 'The other side of the ventilator',
    text: 'The same small grille, from his side. Whatever passes through here comes out a few inches from the hook that holds the dummy rope, which hangs straight down to Julia\'s pillow.' },
  camp_bed: { verb: 'Examine the camp bed', title: 'A soldier\'s bed',
    text: 'A plain camp bed. A man who lives like this cares little for comfort. His spending goes elsewhere: to his animals, and to keeping the money his stepdaughters would take away from him if they married.' },
  books: { verb: 'Examine the books', title: 'A doctor\'s shelf',
    text: 'Books mostly of a technical character. Dr. Roylott practised medicine in Calcutta for years, and brought more than books home from India.' },
  door_out: { verb: 'Go to Dr. Roylott\'s room', title: '', text: '' },
  door_back: { verb: 'Go back to Julia\'s bedroom', title: '', text: '' },
  helen: { verb: 'Talk to Helen', title: '', text: '' },
  // what Helen tells you (testimony)
  whistle: { testimony: true, title: 'A low, clear whistle', text: 'Julia asked her sister, days before she died, whether she had heard a low, clear whistle in the dead of night, about three in the morning. Helen heard it herself last night.' },
  last_words: { testimony: true, title: '"The speckled band!"', text: 'Julia staggered out of her room, her face blanched with terror, and cried: "Oh, my God! Helen! It was the band! The speckled band!" She tried to point toward the doctor\'s room, then fell.' },
  clang: { testimony: true, title: 'A clang, as of metal falling', text: 'On the night Julia died, just after the whistle, Helen heard a clanging sound, as if a mass of metal had fallen. It came from the direction of his room.' },
  cigars: { testimony: true, title: 'Smoke through the grille', text: 'Julia complained that the smell of his strong Indian cigars came into her room every night. The ventilator carries more than air from his room to hers.' },
  animals: { testimony: true, title: 'Animals from India', text: 'Dr. Roylott boasted that a correspondent in India sends him Indian animals. The cheetah and the baboon are only the ones he lets the village see.' },
  motive: { testimony: true, title: 'Money, and a wedding', text: 'Their mother left her money to Dr. Roylott on condition that each daughter receive a yearly share on marrying. Julia died two weeks before her wedding. Helen is to be married this spring.' },
};
const found = new Set();
const keyFound = () => KEY.filter(k => found.has(k)).length;

// ---------- player ----------
const EYE = 1.72, PR = 0.22;
const player = { x: 1.5, z: 1.5, yaw: 0.5, pitch: -0.12, room: 0 };
const keys = {};
let playing = false, cardOpen = false, nbOpen = false, moving = false;
const tmp = new THREE.Vector3();

function blocked(x, z) {
  const r = rooms[player.room];
  r.group.worldToLocal(tmp.set(x, 0, z));
  const lx = tmp.x, lz = tmp.z;
  if (lx < r.minX + PR || lx > r.maxX - PR || lz < r.minZ + PR || lz > r.maxZ - PR) return true;
  for (const b of r.colliders) if (lx > b.minX - PR && lx < b.maxX + PR && lz > b.minZ - PR && lz < b.maxZ + PR) return true;
  return false;
}
// only the room you're in is lit (its lights would otherwise shine through the shared wall)
function setRoomLights(i) { rooms.forEach((r, k) => r.lights.forEach(l => { l.on = k === i; l.L.visible = l.on; })); }

function goTo(i) {
  if (moving) return;
  moving = true; $('fade').classList.add('on');
  setTimeout(() => {
    player.room = i;
    // stand just inside the room's door, facing in
    const local = i === 0 ? new THREE.Vector3(1.5, 0, 1.5) : new THREE.Vector3(-1.75, 0, 1.65);
    const look = rooms[i].group.localToWorld(i === 0 ? new THREE.Vector3(0, 0, -1.2) : new THREE.Vector3(-0.3, 0, -1.4));
    rooms[i].group.localToWorld(local);
    player.x = local.x; player.z = local.z;
    player.yaw = Math.atan2(-(look.x - local.x), -(look.z - local.z)); player.pitch = -0.1;   // facing into the room
    setRoomLights(i);
    $('fade').classList.remove('on');
    showWhere(rooms[i].name);
    setTimeout(() => { moving = false; }, 300);
  }, 480);
}
let whereTimer;
function showWhere(text) { const w = $('where'); w.textContent = text; w.classList.add('on'); clearTimeout(whereTimer); whereTimer = setTimeout(() => w.classList.remove('on'), 2200); }

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (cut.active) { if (k === 'escape') { e.preventDefault(); $('cineSkip').click(); } return; }
  if (k === 'tab') { e.preventDefault(); if (playing) toggleNotebook(); return; }
  if (deduceOpen) { if (k === 'escape') { e.preventDefault(); closeDeduce(); } return; }
  if (night.phase !== 'off' && !cardOpen && (k === 'e' || k === ' ' || k === 'enter')) { e.preventDefault(); strike(); return; }
  if (talkOpen) {
    if (k === 'escape') { e.preventDefault(); closeTalk(); return; }
    if (/^[1-9]$/.test(k)) { const b = talkButtons[Number(k) - 1]; if (b) { e.preventDefault(); b.click(); } return; }
    return;   // no walking while talking
  }
  if (cardOpen && (k === 'e' || k === 'escape' || k === 'enter' || k === ' ')) { e.preventDefault(); closeCard(); return; }
  if (k === 'escape' && nbOpen) { toggleNotebook(false); return; }
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
  if (!locked && playing && !cardOpen && !talkOpen && !deduceOpen && !isTouch) showWhere('Click the room to look around with the mouse');
});
document.addEventListener('mousemove', e => {
  if (!locked) return;
  if (skipMoves > 0) { skipMoves--; return; }
  if (Math.abs(e.movementX) > 150 || Math.abs(e.movementY) > 150) return;   // ignore spikes, keep real moves
  player.yaw -= e.movementX * 0.0024;
  player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * 0.0024, -1.3, 1.1);
});
cvs.addEventListener('pointerdown', e => { cvs.focus(); if (locked) { if (night.phase !== 'off' && !cardOpen) strike(); return; } drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }; cvs.setPointerCapture(e.pointerId); });
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
  if (introState === 'prologue') { startCutscene(); return; }
  audioOn();
  $('intro').hidden = true; playing = true; cvs.focus();
  if (isTouch) joy.hidden = false;
  showWhere(julia.name);
  lockMouse();
});

// ---------- examining ----------
const ray = new THREE.Raycaster(); ray.far = 2.7;
const center = new THREE.Vector2(0, 0);
let target = null;
const anim = { rope: 0, ropeV: 0, safe: 0, drawers: {} };
let hitList = null;

function pickTarget() {
  if (!ready || cardOpen || talkOpen || deduceOpen || moving || night.phase !== 'off') return null;
  if (!hitList) { const set = new Set(occluders); for (const ex of examinables) for (const m of ex.meshes) set.add(m); hitList = [...set]; }
  ray.setFromCamera(center, camera);
  for (const h of ray.intersectObjects(hitList, false)) {
    if (h.object.material && h.object.material.visible === false && !h.object.userData.proxy) continue;
    return h.object.userData.ex || null;   // first solid thing decides; walls block what is behind them
  }
  return null;
}
function setGlow(ex, amount) {
  if (!ex || ex.id === 'helen') return;   // people get the prompt, not a glow
  for (const m of ex.meshes) { if (m.userData.proxy || !m.material.emissive) continue; m.material.emissive.set('#e8a64a'); m.material.emissiveIntensity = amount; }
}
function examine() {
  if (!target || cardOpen || talkOpen || deduceOpen || moving) return;
  const id = target.id;
  if (id === 'helen') return openTalk('helen');
  if (id === 'door_out') return goTo(1);
  if (id === 'door_back') return goTo(0);
  const c = CLUES[id];
  if (id === 'bell_rope') anim.ropeV = 2.4;
  if (id === 'safe') anim.safe = 1;
  if (id === 'chest') anim.drawers.chest_drawer_1a = 1;
  if (id === 'dressing') anim.drawers.dressing_table_drawer = 1;
  const isNew = !found.has(id);
  found.add(id);
  $('cardTitle').textContent = c.title;
  $('cardText').textContent = c.text;
  $('cardTag').textContent = KEY.includes(id) ? (isNew ? `Key evidence · ${keyFound()} of 7` : 'Key evidence · already noted') : (isNew ? 'Added to notebook' : 'Already noted');
  openCard();
  updateHud();
}
function openCard() { $('card').hidden = false; cardOpen = true; $('cardClose').focus({ preventScroll: true }); }

const milestones = [
  { when: () => ['bell_rope', 'ventilator', 'bed'].every(k => found.has(k)), shown: false,
    title: 'Three facts, one line between them',
    text: 'A ventilator into the next room. A rope that rings nothing, hanging from it straight down to the pillow. A bed that cannot be moved from beneath them. Whatever came for Julia Stoner came that way. The door will take me to the room on the other side of that wall.',
    tag: 'Julia\'s room searched · now Dr. Roylott\'s' },
  { when: () => ['safe', 'saucer', 'lash', 'chair'].every(k => found.has(k)), shown: false,
    title: 'What does he keep in the safe?',
    text: 'A saucer of milk, with no cat to drink it. A whipcord loop, with no dog to hold. A chair worn by a man standing beneath the ventilator. And an iron safe he keeps locked. Whatever lives in that safe, he feeds it, he handles it at arm\'s length, and he lifts it to the grille.',
    tag: 'Step 2 complete · Helen Stoner comes next' },
  { when: () => ['last_words', 'clang', 'motive'].every(k => found.has(k)), shown: false,
    title: 'Helen\'s account',
    text: 'A low whistle in the night. A metallic clang, like a heavy door swinging shut. A dying girl\'s last words: the speckled band. And a stepfather who loses a fortune each time a stepdaughter marries. Helen is to be married this spring. If I am right, the danger to her is not two years old. It is tonight.',
    tag: 'Step 4 complete · Dr. Roylott comes next' },
  { when: () => roy && roy.done, shown: false,
    title: 'A dangerous man',
    text: 'He came to frighten me off, and told me I am on the right road. A man with nothing to hide does not threaten the detective. He keeps something in that safe that drinks milk, that he handles with a loop of whipcord, and that came to him from India. Before I name it, I must set the facts in order.',
    tag: 'Step 5 complete · The deduction comes next' },
];
function nextMilestone() {
  const m = milestones.find(m => !m.shown && m.when());
  if (!m) return;
  m.shown = true;
  setTimeout(() => { $('cardTitle').textContent = m.title; $('cardText').textContent = m.text; $('cardTag').textContent = m.tag; openCard(); }, 350);
}
function closeCard() {
  $('card').hidden = true; cardOpen = false; cvs.focus();
  if (night.onCardClose) { const f = night.onCardClose; night.onCardClose = null; f(); return; }
  if (deduction.solved && !deduction.announced) { deduction.announced = true; setTimeout(startNight, 400); return; }
  const before = milestones.filter(m => m.shown).length;
  nextMilestone();
  // straight after "A dangerous man", Holmes sits down to reason it out
  if (milestones.filter(m => m.shown).length === before && roy && roy.done && !deduction.solved && !deduction.autoOpened) {
    deduction.autoOpened = true; setTimeout(openDeduce, 400);
  }
}

// ---------- step 7: the night watch ----------
const night = { phase: 'off', t: 0, said: {}, onCardClose: null, swing: 0, misses: 0 };
const ventGlow = new THREE.PointLight('#ffcf8a', 0, 2.5, 2); ventGlow.position.set(0.45, 2.35, -2.0);
const lantern = new THREE.PointLight('#e8a050', 0, 3.5, 1.6); lantern.position.set(0.85, 0.6, -1.35);
// a shaft of moonlight from the barred window onto the rope and the pillow, so the snake can be seen
const moonbeam = new THREE.SpotLight('#9fb4d6', 0, 0, 0.42, 0.75, 1.2); moonbeam.position.set(-1.6, 2.5, -1.4); moonbeam.target.position.set(0.2, 1.4, -2.1);
function startNight() {
  if (night.phase !== 'off') return;
  night.phase = 'intro';
  if (document.pointerLockElement) document.exitPointerLock();
  $('fade').classList.add('on');
  setTimeout(() => {
    // Julia's room by night: candles out, a shaded lantern on the floor, moonlight through the bars
    player.room = 0; setRoomLights(0);
    for (const l of julia.lights) { if (l.flicker || l.fill) { l.on = false; l.L.visible = false; } else { l.L.color.set('#6e86a8'); l.L.intensity = 5; } }
    julia.group.add(ventGlow, lantern, moonbeam, moonbeam.target); lantern.intensity = 1.6; moonbeam.intensity = 9;
    hemi.intensity = 0.22; scene.fog.color.set('#07080b'); scene.fog.density = 0.07;
    for (const f of flames) f.visible = false;
    if (helenRig) { helenRig.root.visible = false; const i = julia.colliders.findIndex(c => c.minX === -1.25); if (i >= 0) julia.colliders.splice(i, 1); }
    if (roy && !roy.done) { roy.state = 'gone'; roy.done = true; roy.root.visible = false; }
    // Holmes sits beside the bed, facing the rope and the ventilator
    player.x = 0.95; player.z = -1.15; player.eye = 1.25;
    const dx = 0.25 - player.x, dz = -2.1 - player.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = 0.18;
    caneHold.visible = true;
    $('dbtn').hidden = true;
    $('fade').classList.remove('on');
    $('cardTitle').textContent = 'The night watch';
    $('cardText').textContent = 'Miss Stoner has gone back to her old room. I have put out the candles and shaded the lantern, and I sit beside the bed in the dark with my cane across my knees. I must not move, and I must not sleep. Whatever comes, it comes by the ventilator.';
    $('cardTag').textContent = 'Watch the ventilator · strike the rope when it comes';
    night.onCardClose = () => { night.phase = 'wait'; night.t = 0; night.said = {}; };
    openCard();
  }, 600);
}
function caption(key, text) { if (night.said[key]) return; night.said[key] = true; showWhere(text); }
function strike() {
  if (cardOpen) return;
  night.swing = 1;
  if (night.phase === 'snake' && adder.headY < 2.3) {
    night.phase = 'retreat'; night.t = 0;
    caption('struck', 'I lash at it again and again with my cane');
  } else if (night.phase === 'wait' || night.phase === 'gleam' || night.phase === 'hiss') {
    caption('early' + Math.floor(night.t), 'Not yet. Keep still, and wait.');
  }
}
function resetSnake() { adder.headY = 2.42; adder.root.visible = false; adder.mode = 'rope'; }
// The snake's road in Julia's room (her room sits at the world origin): from deep inside the wall, out through the
// grille, across to the rope, then spiralling down around the rope to the pillow.
function buildSnakePath(axis) {
  const V = THREE.Vector3, gx = 0.45, gy = 2.40, gz = -2.24, P = [];
  P.push(new V(gx, 1.2, -3.0), new V(gx, 1.85, -2.9), new V(gx, 2.3, -2.65), new V(gx, gy, -2.42), new V(gx, gy, gz),   // up from his chair, through the wall
         new V(gx - 0.01, gy - 0.03, gz + 0.08), new V(gx - 0.09, gy - 0.12, gz + 0.12));
  const r = 0.045, y0 = axis.top.y - 0.2, y1 = axis.bottom.y + 0.06;
  for (let k = 0, y = y0; y >= y1; k++, y -= 0.055) {
    const f = (axis.top.y - y) / (axis.top.y - axis.bottom.y), a = k * 0.7;
    const cx = axis.top.x + (axis.bottom.x - axis.top.x) * f, cz = axis.top.z + (axis.bottom.z - axis.top.z) * f;
    P.push(new V(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r));
  }
  P.push(new V(axis.bottom.x + 0.03, axis.bottom.y + 0.03, axis.bottom.z + 0.13));   // the head comes to rest on the pillow
  const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal'), L = curve.getLength();
  const N = 1600, ys = new Float32Array(N + 1); let uGrille = 0;
  for (let i = 0; i <= N; i++) { const p = curve.getPointAt(i / N); ys[i] = p.y; if (!uGrille && p.z >= gz) uGrille = i; }
  adder.rope = { curve, L, ys, N, iGrille: uGrille, sGrille: uGrille / N * L };
}
// how far along the road the snout is, for a given snout height (headY is what the night watch and prologue animate)
function ropeS(headY) {
  const R = adder.rope;
  if (headY >= 2.40) return R.sGrille - (headY - 2.40) * 2.5;   // still inside the wall
  for (let i = R.iGrille; i <= R.N; i++) if (R.ys[i] <= headY) return i / R.N * R.L;
  return R.L;
}
function updateSnake() {
  const a = adder; if (!a || !a.flow || !a.rope) return;
  a.flow.object3D.visible = a.root.visible; if (!a.root.visible) return;
  if (a.mode === 'ring') return;   // posed once in seatRoylott
  if (a.curveMode !== 'rope') { a.flow.updateCurve(0, a.rope.curve); a.curveMode = 'rope'; }
  const s = THREE.MathUtils.clamp(ropeS(a.headY), 1.0, a.rope.L);
  a.flow.uniforms.pathOffset.value = (s - 0.5) / a.rope.L;   // snout at s, tail a metre behind it
}
function poseSnakeOnRope() { /* the snake now follows its path in updateSnake() */ }
function tickNight(dt) {
  night.t += dt;
  const t = night.t;
  // the cane: resting across the knees, raised and brought down hard on a strike
  night.swing = Math.max(0, night.swing - dt * 2.2);
  const lift = Math.sin(night.swing * Math.PI);
  if (caneHold) { caneHold.rotation.set(Math.PI / 2 - 0.25 + lift * 0.9, 0, 0.35 - lift * 0.2); caneHold.position.z = -0.45 - lift * 0.12; }
  if (night.phase === 'wait') {
    if (t > 1) caption('m', 'Midnight. Far off, the church clock strikes');
    if (t > 6) caption('1', 'One o\'clock');
    if (t > 10) caption('2', 'Two o\'clock. Somewhere outside, the cheetah\'s cry');
    if (t > 14) caption('3', 'Three o\'clock');
    if (t > 17) { night.phase = 'gleam'; night.t = 0; caption('g', 'A gleam of light at the ventilator, and a smell of hot metal'); }
  } else if (night.phase === 'gleam') {
    ventGlow.intensity = t < 0.8 ? 1.4 * Math.sin(t / 0.8 * Math.PI) : 0;
    if (t > 4) { night.phase = 'hiss'; night.t = 0; caption('h', 'A gentle, soothing hiss, like steam from a kettle'); }
  } else if (night.phase === 'hiss') {
    if (t > 2.5) { night.phase = 'snake'; night.t = 0; adder.root.visible = true; adder.headY = 2.42; }
  } else if (night.phase === 'snake') {
    adder.headY = Math.max(0.86, adder.headY - dt * 0.16);
    poseSnakeOnRope(t);
    if (adder.headY <= 0.86) {
      night.phase = 'missed'; night.misses++;
      $('cardTitle').textContent = 'Too slow';
      $('cardText').textContent = 'It has reached the pillow. Had Miss Stoner been lying there, it would have been over in ten seconds. It will go back at his whistle, and it will come again. This time, strike the rope the moment it comes down.';
      $('cardTag').textContent = 'Try again · watch the ventilator';
      night.onCardClose = () => { resetSnake(); night.phase = 'hiss'; night.t = 0; night.said.h = false; caption('h', 'Again: the soft hiss at the ventilator'); };
      openCard();
    }
  } else if (night.phase === 'retreat') {
    adder.headY += dt * 0.9; poseSnakeOnRope(t + 3);
    if (adder.headY > 2.5) { resetSnake(); night.phase = 'cry'; night.t = 0; }
  } else if (night.phase === 'cry') {
    if (t > 1.2) caption('c', 'From the next room, a horrible cry of pain, fear and anger');
    if (t > 4) { night.phase = 'ending'; night.t = 0; showEnding(); }
  }
}
function showEnding() {
  $('fade').classList.add('on');
  setTimeout(() => {
    // his room: the safe stands open; he sits in the wooden chair, the band around his brow
    caneHold.visible = false; player.eye = EYE;
    julia.group.remove(ventGlow, lantern, moonbeam, moonbeam.target);
    hemi.intensity = HEMI * 0.7; scene.fog.color.set('#14110e'); scene.fog.density = FOG;
    for (const f of flames) f.visible = true;
    setRoomLights(1);
    anim.safeOpen = -1.4;   // the safe stands open in the final scene
    seatRoylott();
    const local = new THREE.Vector3(ROY_X - VENT.x + 0.1, 0, 0.2); roylott.group.localToWorld(local);
    player.room = 1; player.x = local.x; player.z = local.z;
    const target = new THREE.Vector3(ROY_X - VENT.x, 1.3, -1.95); roylott.group.localToWorld(target);
    const dx = target.x - player.x, dz = target.z - player.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(target.y - EYE, Math.hypot(dx, dz));
    $('fade').classList.remove('on');
    setTimeout(() => {
      $('cardTitle').textContent = 'Violence recoils upon the violent';
      $('cardText').textContent = 'Dr. Grimesby Roylott sits in the wooden chair, his eyes fixed in a dreadful, rigid stare at the ceiling. Round his brow is a peculiar yellow band, with brownish speckles. The band! The speckled band! Driven back through the ventilator, the swamp adder turned upon its master. "Violence does, in truth, recoil upon the violent, and the schemer falls into the pit which he digs for another."';
      $('cardTag').textContent = 'The end';
      night.onCardClose = showTheEnd;
      openCard();
    }, 1600);
  }, 700);
}
function seatRoylott() {
  if (!roy) return;
  const r = roy;
  r.state = 'seated'; r.root.visible = true;
  roylott.group.attach(r.root);
  r.root.position.set(ROY_X - VENT.x, 0, -1.97); r.root.rotation.set(0, 0, 0);   // in his chair, under the ventilator
  // no hat at three in the morning
  for (const n of ['hat_brim', 'hat_brim_curl', 'hat_crown', 'hat_band']) { const o = r.root.getObjectByName(n); if (o) o.visible = false; }
  // give each leg a knee: hang the shin, gaiter and foot from a pivot at the bottom of the thigh
  r.root.updateMatrixWorld(true);
  for (const side of ['left', 'right']) {
    const leg = r.root.getObjectByName('leg_' + side), thigh = r.root.getObjectByName('thigh_' + side);
    if (!leg || !thigh) continue;
    const box = new THREE.Box3().setFromObject(thigh);
    const kneeW = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y + 0.03, (box.min.z + box.max.z) / 2);
    const knee = new THREE.Group(); leg.add(knee); knee.position.copy(leg.worldToLocal(kneeW.clone())); knee.updateMatrixWorld(true);
    for (const c of [...leg.children]) if (c !== thigh && c !== knee) knee.attach(c);
    leg.rotation.x = -Math.PI / 2; knee.rotation.x = Math.PI / 2;
  }
  r.root.position.y = -0.49;   // hips down onto the seat
  if (r.armR) r.armR.quaternion.copy(r.armR.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.4, 0, 0)));
  if (r.elbowR) r.elbowR.quaternion.copy(r.elbowR.userData.q0);
  if (r.armL) r.armL.quaternion.copy(r.armL.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.4, 0, 0)));
  if (r.head) r.head.quaternion.copy(r.head.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.45, 0, 0)));   // staring at the ceiling
  for (const e of r.eyes) e.scale.copy(e.userData.s0);
  // the snake, coiled round his brow: measure his head while it is upright, lay a rising spiral just touching it,
  // lift the snake's head off his forehead at the end, then tilt his head back with the coil on it
  const a = adder, head = r.head || r.root, V3 = THREE.Vector3;
  if (r.head) r.head.quaternion.copy(r.head.userData.q0);
  r.root.updateMatrixWorld(true);
  const skin = r.root.getObjectByName('head_skin') || head;
  const hb = new THREE.Box3().setFromObject(skin), hs = hb.getSize(new V3()), hc = hb.getCenter(new V3());
  const c = head.worldToLocal(new V3(hc.x, hb.min.y + hs.y * 0.66, hc.z)), rad = hs.x * 0.47 + 0.012;
  if (r.head) r.head.quaternion.copy(r.head.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.45, 0, 0)));   // staring at the ceiling
  r.root.updateMatrixWorld(true);
  const turns = Math.max(1.25, 0.92 / (2 * Math.PI * rad)), N = Math.ceil(turns * 18), end = Math.PI / 2 + 0.5, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, ang = end - (1 - u) * turns * 2 * Math.PI;
    pts.push(head.localToWorld(new V3(c.x + Math.cos(ang) * rad, c.y - 0.025 + u * 0.05, c.z + Math.sin(ang) * rad)));
  }
  pts.push(head.localToWorld(new V3(c.x + Math.cos(end + 0.35) * (rad + 0.035), c.y + 0.07, c.z + Math.sin(end + 0.35) * (rad + 0.035))));
  const ring = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), L = ring.getLength();
  a.mode = 'ring'; a.curveMode = 'ring'; a.root.visible = true;
  a.flow.updateCurve(0, ring); a.flow.uniforms.pathOffset.value = (L - 0.5) / L;   // snout at the lifted end
}
function showTheEnd() {
  night.phase = 'end';
  if (document.pointerLockElement) document.exitPointerLock();
  const intro = $('intro');
  intro.querySelector('.eyebrow').textContent = 'Stoke Moran, Surrey · April 1883';
  intro.querySelector('h2').textContent = 'The End';
  const ps = intro.querySelectorAll('p');
  const testimony = [...found].filter(i => CLUES[i] && CLUES[i].testimony).length;
  ps[0].textContent = `You found ${keyFound()} of 7 key clues and ${testimony} pieces of testimony, and saved Helen Stoner ${night.misses ? `on attempt ${night.misses + 1}` : 'on your first attempt'}.`;
  ps[1].textContent = 'Based on "The Adventure of the Speckled Band" by Arthur Conan Doyle (1892).';
  const b = $('begin'); b.textContent = 'Play again'; b.onclick = () => location.reload(); $('prologueBtn').hidden = true;
  intro.hidden = false; playing = false;
}

// ---------- sound (Web Audio, generated; starts only after a click) ----------
const sfx = { ctx: null, master: null, rain: null };
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
function startStorm() {
  if (!sfx.ctx || sfx.rain) return;
  const c = sfx.ctx, out = c.createGain(); out.gain.value = 0; out.connect(sfx.master);
  // rain: bright filtered noise
  const r = c.createBufferSource(); r.buffer = noiseBuffer(3, false); r.loop = true;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
  const rg = c.createGain(); rg.gain.value = 0.16;
  r.connect(hp).connect(lp).connect(rg).connect(out);
  // wind: brown noise through a slowly sweeping band-pass
  const w = c.createBufferSource(); w.buffer = noiseBuffer(4, true); w.loop = true;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 3;
  const lfo = c.createOscillator(); lfo.frequency.value = 0.13; const lfoAmt = c.createGain(); lfoAmt.gain.value = 260;
  lfo.connect(lfoAmt).connect(bp.frequency);
  const wg = c.createGain(); wg.gain.value = 0.5;
  w.connect(bp).connect(wg).connect(out);
  r.start(); w.start(); lfo.start();
  out.gain.linearRampToValueAtTime(1, c.currentTime + 2.5);
  sfx.rain = { out, nodes: [r, w, lfo] };
}
function stopStorm(fade = 1.2) {
  if (!sfx.rain) return;
  const c = sfx.ctx, s = sfx.rain; sfx.rain = null;
  s.out.gain.cancelScheduledValues(c.currentTime); s.out.gain.setValueAtTime(s.out.gain.value, c.currentTime);
  s.out.gain.linearRampToValueAtTime(0, c.currentTime + fade);
  setTimeout(() => s.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), fade * 1000 + 100);
}
function thunder(delay = 0) {
  if (!sfx.ctx) return;
  const c = sfx.ctx, t0 = c.currentTime + delay;
  const s = c.createBufferSource(); s.buffer = noiseBuffer(4, true);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t0); lp.frequency.exponentialRampToValueAtTime(90, t0 + 3.5);
  const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1.6, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t0 + 3.8);
  s.connect(lp).connect(g).connect(sfx.master); s.start(t0); s.stop(t0 + 4);
}
function whistle() {
  if (!sfx.ctx) return;
  // a low, clear whistle: two long notes, the second dropping
  const c = sfx.ctx, t0 = c.currentTime;
  const o = c.createOscillator(); o.type = 'sine';
  const vib = c.createOscillator(); vib.frequency.value = 5.5; const va = c.createGain(); va.gain.value = 6; vib.connect(va).connect(o.frequency);
  o.frequency.setValueAtTime(760, t0); o.frequency.linearRampToValueAtTime(800, t0 + 0.9); o.frequency.setValueAtTime(800, t0 + 1.05); o.frequency.linearRampToValueAtTime(640, t0 + 2.1);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.16, t0 + 0.15); g.gain.setValueAtTime(0.16, t0 + 0.85); g.gain.linearRampToValueAtTime(0.02, t0 + 1.0);
  g.gain.linearRampToValueAtTime(0.16, t0 + 1.15); g.gain.setValueAtTime(0.16, t0 + 1.9); g.gain.linearRampToValueAtTime(0, t0 + 2.2);
  o.connect(g).connect(sfx.master); o.start(t0); vib.start(t0); o.stop(t0 + 2.3); vib.stop(t0 + 2.3);
}
function hiss(dur = 1.6) {
  if (!sfx.ctx) return;
  const c = sfx.ctx, t0 = c.currentTime;
  const s = c.createBufferSource(); s.buffer = noiseBuffer(dur + 0.2, false);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
  const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.12, t0 + 0.3); g.gain.linearRampToValueAtTime(0, t0 + dur);
  s.connect(hp).connect(g).connect(sfx.master); s.start(t0); s.stop(t0 + dur + 0.2);
}
function scream() {
  if (!sfx.ctx) return;
  // a shriek over a dissonant sting: rising, breaking voice-like tones through a vowel filter
  const c = sfx.ctx, t0 = c.currentTime;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.2;
  const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.32, t0 + 0.06); g.gain.setValueAtTime(0.3, t0 + 0.9); g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.9);
  f.connect(g).connect(sfx.master);
  for (const [base, det] of [[880, 0], [932, 7], [1310, -5]]) {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(base * 0.8, t0); o.frequency.linearRampToValueAtTime(base * 1.25, t0 + 0.35); o.frequency.linearRampToValueAtTime(base * 1.05, t0 + 1.0); o.frequency.linearRampToValueAtTime(base * 0.55, t0 + 1.8);
    const tr = c.createOscillator(); tr.frequency.value = 7; const ta = c.createGain(); ta.gain.value = base * 0.03; tr.connect(ta).connect(o.frequency);
    o.connect(f); o.start(t0); tr.start(t0); o.stop(t0 + 2); tr.stop(t0 + 2);
  }
  const low = c.createOscillator(); low.type = 'triangle'; low.frequency.value = 55;
  const lg = c.createGain(); lg.gain.setValueAtTime(0.4, t0); lg.gain.exponentialRampToValueAtTime(0.001, t0 + 2.5);
  low.connect(lg).connect(sfx.master); low.start(t0); low.stop(t0 + 2.6);
}

// ---------- the prologue: the night Julia died, two years ago ----------
const cut = { active: false, t: 0, events: {}, saved: null, lightning: null, flash: 0, shake: 0 };
// camera path: time (s), position, point looked at
const CUT_KEYS = [
  { t: 4, p: [1.25, 1.62, 1.85], l: [-0.4, 1.1, -1.6] },
  { t: 9, p: [1.05, 1.55, 0.9], l: [-0.1, 1.0, -1.8] },
  { t: 14, p: [0.95, 1.45, -0.3], l: [0.1, 0.85, -2.0] },
  { t: 17, p: [0.85, 1.3, -1.05], l: [0.18, 1.1, -2.08] },
  { t: 20.5, p: [0.9, 1.5, -0.95], l: [0.4, 2.3, -2.22] },     // the ventilator, the hook and the top of the rope, centred
  { t: 24, p: [0.82, 1.5, -1.08], l: [0.42, 2.26, -2.22] },
];
const ease3 = x => x * x * (3 - 2 * x);
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), lookV = new THREE.Vector3();
function cutCamera(t) {
  const k = CUT_KEYS;
  let i = 0; while (i < k.length - 2 && t > k[i + 1].t) i++;
  const a = k[i], b = k[i + 1];
  const u = ease3(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))));
  camera.position.copy(vA.fromArray(a.p)).lerp(vB.fromArray(b.p), u);
  lookV.copy(vA.fromArray(a.l)).lerp(vB.fromArray(b.l), u);
  if (cut.shake > 0 && !reduceMotion) { camera.position.x += (Math.random() - 0.5) * cut.shake * 0.04; camera.position.y += (Math.random() - 0.5) * cut.shake * 0.04; }
  camera.lookAt(lookV);
}
function cineText(id, text, on) { const el = $(id); if (text !== undefined) el.textContent = text; el.classList.toggle('on', on); }
function startCutscene() {
  if (cut.active) return;
  audioOn();
  cut.active = true; cut.t = 0; cut.events = {}; cut.shake = 0; cut.flash = 0;
  document.body.classList.add('cinematic');
  $('intro').hidden = true; $('cine').hidden = false; $('fade').classList.add('on');
  ['cineCap', 'cineSub', 'cineWords', 'cineTitle'].forEach(id => cineText(id, '', false));
  // the room as it was that night: one candle, rain at the window, lightning
  const s = cut.saved = { fov: camera.fov, fog: scene.fog.color.getHex(), fogD: scene.fog.density, hemi: hemi.intensity };
  setRoomLights(0);
  const [day, c1, c2] = julia.lights;
  s.day = { color: day.L.color.getHex(), intensity: day.L.intensity };
  day.L.color.set('#6e86a8'); day.L.intensity = 4;
  c2.on = false; c2.L.visible = false;
  for (const l of julia.lights) if (l.fill) { l.on = false; l.L.visible = false; }
  hemi.intensity = 0.14; scene.fog.color.set('#07080b'); scene.fog.density = 0.08;
  cut.lightning = new THREE.PointLight('#cfe0ff', 0, 9, 1.2); cut.lightning.position.set(-2.6, 2.0, -1.3);
  julia.group.add(cut.lightning, moonbeam, moonbeam.target, ventGlow); moonbeam.intensity = 5;
  if (helenRig) helenRig.root.visible = false;
  camera.fov = 55; camera.updateProjectionMatrix();
  if (document.pointerLockElement) document.exitPointerLock();
  startStorm();
}
function endCutscene() {
  if (!cut.active) return;
  cut.active = false;
  stopStorm(0.8);
  const s = cut.saved, [day, c1, c2] = julia.lights;
  day.L.color.setHex(s.day.color); day.L.intensity = s.day.intensity;
  c2.on = true; c2.L.visible = true; c1.base = CANDLE;
  for (const l of julia.lights) if (l.fill) { l.on = true; l.L.visible = true; }
  hemi.intensity = s.hemi; scene.fog.color.setHex(s.fog); scene.fog.density = s.fogD;
  julia.group.remove(cut.lightning, moonbeam, moonbeam.target, ventGlow); moonbeam.intensity = 0; ventGlow.intensity = 0;
  if (helenRig) helenRig.root.visible = true;
  resetSnake(); for (const f of flames) f.visible = true;
  camera.fov = s.fov; camera.updateProjectionMatrix();
  $('cine').hidden = true; $('fade').classList.remove('on'); document.body.classList.remove('cinematic');
  try { localStorage.setItem('speckled-prologue-seen', '1'); } catch (err) { /* fine: it just plays again next time */ }
  setIntroState('story');
}
function cutOnce(key, at, fn) { if (cut.t >= at && !cut.events[key]) { cut.events[key] = true; fn(); } }
function lightning(strength = 1) { cut.flash = strength; }
function tickCutscene(dt) {
  cut.t += dt; const t = cut.t;
  cutOnce('cap1', 0.6, () => cineText('cineCap', 'Stoke Moran, Surrey', true));
  cutOnce('cap2', 2.3, () => cineText('cineCap', 'Two years ago', true));
  cutOnce('in', 4, () => { cineText('cineCap', undefined, false); $('fade').classList.remove('on'); });
  cutOnce('l1', 5.2, () => { lightning(1); thunder(1.1); });
  cutOnce('l2', 11.5, () => { lightning(0.6); thunder(1.6); });
  cutOnce('w', 17.6, () => { whistle(); cineText('cineSub', '[ a low, clear whistle ]', true); });
  cutOnce('wOff', 20.6, () => cineText('cineSub', undefined, false));
  cutOnce('s', 21.2, () => { adder.root.visible = true; adder.headY = 2.36; hiss(1.4); lightning(0.9); });
  cutOnce('scream', 23.6, () => { scream(); lightning(1.2); cut.shake = 1; cineText('cineSub', '[ a woman screams ]', true); });
  cutOnce('dark', 24.5, () => { $('fade').classList.add('on'); cineText('cineSub', undefined, false); });
  cutOnce('words', 25.6, () => cineText('cineWords', '"Helen! It was the band! The speckled band!"', true));
  cutOnce('wordsOff', 30.5, () => cineText('cineWords', undefined, false));
  cutOnce('title', 31.5, () => cineText('cineTitle', 'The Speckled Band', true));
  cutOnce('end', 36, () => endCutscene());
  if (!cut.active) return;
  cutCamera(Math.max(4, Math.min(t, 24)));
  // the snake: a glimpse at the grille, then gone
  if (t > 21.2 && t < 24) {
    adder.headY = t < 23.2 ? 2.36 - (t - 21.2) * 0.12 : Math.min(2.6, adder.headY + dt * 0.9);
    if (adder.headY > 2.5) adder.root.visible = false;
    if (adder.root.visible) poseSnakeOnRope(t, 0.45);   // just its head, out of the grille
  }
  // lightning flicker, a guttering candle, the shake after the scream
  cut.flash = Math.max(0, cut.flash - dt * 2.6);
  const f = cut.flash, flick = f > 0 ? (Math.sin(t * 60) > -0.3 ? 1 : 0.25) : 0;
  cut.lightning.intensity = 70 * f * flick;
  // "a gleam of light in the direction of the ventilator": a lantern behind the grille from the whistle until the scream
  ventGlow.intensity = t > 17.4 && t < 24.4 ? 0.8 * Math.min(1, (t - 17.4) / 0.8) * (0.9 + 0.1 * Math.sin(t * 7)) : 0;
  hemi.intensity = 0.14 + 0.9 * f * flick;
  const c1 = julia.lights[1]; if (c1) c1.base = (t > 9.5 && t < 12.5) ? 0.4 + 0.3 * Math.abs(Math.sin(t * 13)) : (t > 24 ? 0 : 1.2);
  cut.shake = Math.max(0, cut.shake - dt * 1.5);
}

// ---------- the start screens ----------
const INTRO_TEXT = { eyebrow: '', title: '', p0: '', p1: '' };
function setIntroState(state) {
  const intro = $('intro'), b = $('begin'), alt = $('prologueBtn'), ps = intro.querySelectorAll('p');
  if (!INTRO_TEXT.p0) { INTRO_TEXT.eyebrow = intro.querySelector('.eyebrow').textContent; INTRO_TEXT.title = intro.querySelector('h2').textContent; INTRO_TEXT.p0 = ps[0].innerHTML; INTRO_TEXT.p1 = ps[1].innerHTML; }
  introState = state; intro.hidden = false; b.disabled = false; alt.hidden = false;
  if (state === 'prologue') {
    intro.querySelector('.eyebrow').textContent = 'A Sherlock Holmes mystery';
    ps[0].textContent = 'Best with the sound on.'; ps[1].hidden = true;
    b.textContent = 'Begin'; alt.textContent = 'Skip the prologue';
  } else {
    intro.querySelector('.eyebrow').textContent = INTRO_TEXT.eyebrow;
    ps[0].innerHTML = INTRO_TEXT.p0; ps[1].innerHTML = INTRO_TEXT.p1; ps[1].hidden = false;
    b.textContent = 'Begin the search'; alt.textContent = 'Watch the prologue';
  }
  b.focus({ preventScroll: true });
}
let introState = 'loading';
function prologueSeen() { try { return localStorage.getItem('speckled-prologue-seen') === '1'; } catch (err) { return false; } }
$('prologueBtn').addEventListener('click', () => { if (introState === 'prologue') { audioOn(); setIntroState('story'); } else startCutscene(); });
$('cineSkip').addEventListener('click', () => { if (sfx.ctx) stopStorm(0.3); endCutscene(); });

// ---------- step 6: the deduction ----------
let deduceOpen = false;
const deduction = { solved: false, picks: {}, announced: false, autoOpened: false };
const UNLOCK = ['bell_rope', 'ventilator', 'bed', 'saucer'];
const WHERE = {   // where to look for a missing piece, without naming it
  saucer: 'the top of his safe', lash: 'the corner of his camp bed', chair: 'the chair beneath his ventilator', safe: 'his iron safe',
  bell_rope: 'the bell-rope by Julia\'s bed', ventilator: 'the grille above Julia\'s bed', bed: 'Julia\'s bed',
  motive: 'what Helen knows of her stepfather and the money', animals: 'what Dr. Roylott lets slip about his animals', clang: 'what Helen heard after the whistle',
};
const DQ = [
  { id: 'who', q: 'Who killed Julia Stoner?', opts: [
    { t: 'A band of gipsies camped on the grounds', hint: 'They wear spotted handkerchiefs, and "band" is a tempting word. I confess I leaned that way myself at first. But no gipsy could pass bolted shutters, or reach a ventilator that opens only into the next room.' },
    { t: 'Dr. Grimesby Roylott', ok: true, need: ['ventilator', 'vent_back'] , needAny: true },
    { t: 'An intruder who came in by night', hint: 'The shutters were bolted and the chimney stapled shut. Whatever killed her was already inside the house.' },
    { t: 'No one; she died of fright', hint: 'A girl does not die of fright crying out about a band. Something was in that room with her. She struck a match to see it.' },
  ] },
  { id: 'how', q: 'How was it done?', opts: [
    { t: 'Poison, slipped into her food or drink', hint: 'The coroner found no trace of poison. And poison has no use for a bell-rope that rings nothing, or a bed bolted to the floor.' },
    { t: 'Someone crept in through the window', hint: 'Bars, shutters and a bolt fastened every night. Look at what connects her room to his instead.' },
    { t: 'A deadly snake from India, put through the ventilator to crawl down the dummy rope onto the bed', ok: true, need: ['bell_rope', 'ventilator', 'bed', 'saucer', 'lash', 'chair'] },
    { t: 'Gas, fed in through the ventilator', hint: 'Gas would have reached the whole room and her sister besides. And why then a rope, a saucer of milk, and a loop of whipcord?' },
  ] },
  { id: 'why', q: 'Why?', opts: [
    { t: 'In a fit of the violent temper he is known for', hint: 'Temper strikes in a moment. This was planned for two years: a ventilator built, a rope hung, a bed bolted down.' },
    { t: 'To keep the income his stepdaughters would take with them when they married', ok: true, need: ['motive'] },
    { t: 'Because Julia had learned something about his past in India', hint: 'Then why is Helen in danger now, two years later, just as her own wedding approaches?' },
    { t: 'To sell Stoke Moran and leave England', hint: 'The house is all but ruined and mortgaged. It is not the house he wants. It is the money his late wife\'s will hands to each daughter on her marriage.' },
  ] },
];
function renderDeduce(feedback) {
  const box = $('dQs'); box.innerHTML = '';
  DQ.forEach((q, qi) => {
    const sec = document.createElement('section'); sec.className = 'dq';
    const h = document.createElement('h3'); h.textContent = `${qi + 1}. ${q.q}`; sec.append(h);
    const opts = document.createElement('div'); opts.className = 'dopts'; opts.setAttribute('role', 'group'); opts.setAttribute('aria-label', q.q);
    q.opts.forEach((o, oi) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = o.t;
      b.setAttribute('aria-pressed', String(deduction.picks[q.id] === oi));
      b.addEventListener('click', () => { deduction.picks[q.id] = oi; renderDeduce(); });
      opts.append(b);
    });
    sec.append(opts);
    const f = feedback && feedback[q.id];
    if (f) { const p = document.createElement('p'); p.className = 'dfb ' + f.cls; p.textContent = f.text; sec.append(p); }
    box.append(sec);
  });
}
function checkDeduce() {
  const fb = {}; let allOk = true;
  for (const q of DQ) {
    const pick = deduction.picks[q.id];
    if (pick === undefined) { fb[q.id] = { cls: 'no', text: 'You have not answered this yet.' }; allOk = false; continue; }
    const o = q.opts[pick];
    if (!o.ok) { fb[q.id] = { cls: 'no', text: o.hint }; allOk = false; continue; }
    const missing = o.needAny ? (o.need.some(n => found.has(n)) ? [] : [o.need[0]]) : o.need.filter(n => !found.has(n));
    if (missing.length) { fb[q.id] = { cls: 'half', text: 'Right, I think, but I cannot prove it yet. Still to examine: ' + missing.map(m => WHERE[m] || m).join('; ') + '.' }; allOk = false; continue; }
    fb[q.id] = { cls: 'ok', text: q.id === 'who' ? 'Yes. Every road in this house leads to his room.' : q.id === 'how' ? 'Yes. The milk, the loop, the chair, the rope: it all fits.' : 'Yes. Julia died two weeks before her wedding. Helen is to marry this spring.' };
  }
  renderDeduce(fb);
  const v = $('dVerdict');
  if (allOk) {
    deduction.solved = true; updateHud();
    v.hidden = false; v.textContent = 'There it is. Now we must catch him at it.';
    $('dCheck').textContent = 'Continue'; $('dClose').hidden = true;
  } else { v.hidden = true; }
}
function openDeduce() {
  if (deduceOpen || deduction.solved) return;
  deduceOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  renderDeduce(); $('dVerdict').hidden = true; $('dCheck').textContent = 'Put it to the test'; $('dClose').hidden = false;
  $('deduce').hidden = false;
  setTimeout(() => { const b = document.querySelector('#dQs button'); if (b) b.focus({ preventScroll: true }); }, 0);
}
function closeDeduce() {
  $('deduce').hidden = true; deduceOpen = false; cvs.focus();
  if (deduction.solved && !deduction.announced) {
    setTimeout(() => {
      $('cardTitle').textContent = 'The speckled band';
      $('cardText').textContent = 'A swamp adder, the deadliest snake in India. He trained it with milk to come back at his whistle. At night he stood on that chair and put it through the ventilator; it crept down the dummy rope to the bolted bed. Sooner or later it would bite. Before dawn he whistled it home and shut the safe on it: the clang Helen heard. Tonight Miss Stoner sleeps elsewhere. I will wait in her room, in the dark.';
      $('cardTag').textContent = 'Step 6 complete · The night watch comes next';
      openCard();
    }, 300);
  }
}
$('dCheck').addEventListener('click', () => { if (deduction.solved) closeDeduce(); else checkDeduce(); });
$('dClose').addEventListener('click', closeDeduce);
$('dbtn').addEventListener('click', openDeduce);

// ---------- conversations (Helen, and Dr. Roylott when he storms in) ----------
let talkOpen = false, talkButtons = [], speaker = null;
const SPEAKERS = {
  helen: {
    name: 'Helen Stoner', shown: new Set(), asked: new Set(), leaveLabel: 'That\'s all for now',
    greet: (first) => first ? 'Mr. Holmes. Have you found anything? Show me whatever you find, and I will tell you all I know. I have no one else to tell.' : 'Yes, Mr. Holmes?',
    generic: [
      'I don\'t see what that has to do with it, Mr. Holmes. But you see a great deal more than I do.',
      'I have looked at that a hundred times and never thought twice about it.',
      'If you say it matters, I believe you. I only wish I understood why.',
    ],
    react: {
      bell_rope: { line: 'He had it put up two years ago, while the builders were in the house. Julia never rang it once. We always fetched what we wanted for ourselves.' },
      ventilator: { line: 'That grille? Julia used to complain of the smell of his cigars, strong Indian ones. It came through there every night. She thought it was only bad building.', adds: 'cigars' },
      vent_back: { line: 'So that is where it comes out. Julia used to complain of his cigar smoke, every night, through that grille.', adds: 'cigars' },
      bed: { line: 'When I moved into this room I tried to pull the bed nearer the window. It wouldn\'t move. I thought the floorboards had swollen.' },
      safe: { line: 'His business papers, he says. Mr. Holmes, that night, just after the whistle, I heard a clang. As if a mass of metal had fallen. I have never been able to forget it.', adds: 'clang' },
      saucer: { line: 'Milk? We have no cat. He keeps a cheetah and a baboon, and lets them wander the grounds at night. The villagers fear them almost as much as they fear him.' },
      lash: { line: 'We have no dog. He doesn\'t need a whip to frighten anyone. Last autumn he threw the blacksmith over a parapet into the stream.' },
      chair: { line: 'He stands on that chair? He is not a man who reaches for things, Mr. Holmes. He simply takes them.' },
      window: { line: 'Julia bolted the shutters every night. They were still bolted in the morning. I tried them myself.' },
      chimney: { line: 'Stapled shut years ago. Nothing could come down there.' },
      chest: { line: 'She had the matchbox in her hand when we found her. She must have struck a light to see what was in the room with her.' },
      camp_bed: { line: 'He lives like a soldier in there. He spends nothing on himself. Only on his animals, and on his temper.' },
    },
    asks: [
      { id: 'night', label: 'Ask about the night Julia died', adds: ['whistle', 'last_words'],
        line: 'It was a wild night, the wind howling and rain beating at the windows. She came to my room and asked if I had ever heard a low, clear whistle in the dead of night. Later I heard her scream. Her door opened. She staggered out and cried, "Helen! It was the band! The speckled band!" She tried to point toward the doctor\'s room. Then she fell, and never spoke again.' },
      { id: 'roylott', label: 'Ask about Dr. Roylott', adds: ['motive'],
        line: 'He practised medicine in Calcutta, until he beat his butler to death in a temper and served a long sentence for it. Our mother left him her money, on condition that each of us receive a share when we married. Julia was to be married in two weeks when she died. And I am to be married this spring.' },
    ],
  },
  roylott: {
    name: 'Dr. Grimesby Roylott', shown: new Set(), asked: new Set(), leaveLabel: 'I have heard enough, Dr. Roylott',
    greet: () => 'Which of you is Holmes? I know you, you scoundrel! Holmes, the meddler. Holmes, the busybody. I traced her here. Whatever she has been telling you, you will hear the truth from me.',
    generic: [
      'I\'ll not stand here and be cross-examined in my own house!',
      'Scraps and fancies. Is that what they pay you for in London?',
      'You are a meddler, Holmes. Meddlers come to grief.',
    ],
    react: {
      saucer: { line: 'My cheetah is fond of milk. Is that a crime in London now?', strike: false },
      safe: { line: 'Keep your hands off my property! What is in my safe is my business, and no one else\'s.', strike: true },
      lash: { line: 'Am I to explain every scrap of leather in my house to a busybody?' },
      chair: { line: 'I stand on my own chairs as I please.' },
      ventilator: { line: 'The house is old. It wanted air. I had it put in.' },
      vent_back: { line: 'The house is old. It wanted air. I had it put in.' },
      bell_rope: { line: 'Repairs. The west wing was being rebuilt. Am I to account for my builders to you as well?' },
      bed: { line: 'The floor is uneven. The bed was fixed so it would not rock. You see plots in carpentry.' },
      chest: { line: 'The girl was nervous. Afraid of the dark. She died of fright, the coroner said so.' },
      books: { line: 'Keep your eyes off my shelves.' },
    },
    asks: [
      { id: 'safe', label: 'Ask what he keeps in the safe', strike: true,
        line: 'Papers. My papers, in my safe, in my house. Lay a finger on it and I will break your arm.' },
      { id: 'julia', label: 'Ask how Julia died',
        line: 'The coroner found no cause, and the coroner was right. A nervous girl, frightened to death of the dark. Leave the dead alone, Mr. Holmes.' },
      { id: 'animals', label: 'Ask about his animals', adds: ['animals'],
        line: 'I have a correspondent in India who sends me Indian animals. You have seen the cheetah and the baboon, I suppose. Anyone who trespasses on my grounds at night had better remember them.' },
    ],
  },
};
function addFact(ids) {
  const fresh = (Array.isArray(ids) ? ids : [ids]).filter(i => i && !found.has(i));
  fresh.forEach(i => found.add(i));
  if (fresh.length) updateHud();
  return fresh;
}
function say(line, fresh, strike) {
  $('talkLine').textContent = line;
  const a = $('talkAdded');
  a.hidden = !fresh || !fresh.length;
  if (fresh && fresh.length) a.textContent = 'Added to notebook: ' + fresh.map(i => CLUES[i].title.replace(/"/g, '')).join(', ');
  if (speaker === 'helen' && helenRig) helenRig.talk = 2.6;
  if (speaker === 'roylott' && roy) { roy.threat = 2.6; if (strike) roy.strike = 1; }
}
function buildOptions() {
  const S = SPEAKERS[speaker];
  const box = $('talkOpts'); box.innerHTML = ''; talkButtons = [];
  const add = (label, cls, fn) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = cls || '';
    const k = document.createElement('kbd');
    if (cls !== 'leave') { k.textContent = String(talkButtons.length + 1); talkButtons.push(b); } else k.textContent = 'Esc';
    b.append(k, document.createTextNode(label)); b.addEventListener('click', fn); box.append(b);
  };
  const lbl = t => { const d = document.createElement('div'); d.className = 'lbl'; d.textContent = t; box.append(d); };
  lbl(speaker === 'roylott' ? 'Ask him' : 'Ask her');
  for (const q of S.asks) add(q.label, 'ask' + (S.asked.has(q.id) ? ' shown' : ''), () => {
    S.asked.add(q.id); say(q.line, addFact(q.adds), q.strike); buildOptions();
  });
  const evidence = [...found].filter(id => CLUES[id] && !CLUES[id].testimony && CLUES[id].title);
  const who = speaker === 'roylott' ? 'him' : 'her';
  lbl(evidence.length ? `Show ${who}` : `Show ${who} (find evidence in the rooms first)`);
  for (const id of evidence) add(CLUES[id].title, S.shown.has(id) ? 'shown' : '', () => {
    S.shown.add(id);
    const r = S.react[id];
    say(r ? r.line : S.generic[S.shown.size % S.generic.length], addFact(r && r.adds), r && r.strike);
    buildOptions();
  });
  add(S.leaveLabel, 'leave', closeTalk);
}
function openTalk(who = 'helen') {
  speaker = who; talkOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  const S = SPEAKERS[who];
  document.querySelector('#talk .who').textContent = S.name;
  $('talk').setAttribute('aria-label', 'Talking to ' + S.name);
  say(S.greet(!S.asked.size && !S.shown.size), null);
  buildOptions();
  $('talk').hidden = false;
  setTimeout(() => { const b = talkButtons[0]; if (b) b.focus({ preventScroll: true }); }, 0);
}
function closeTalk() {
  if (speaker === 'roylott' && roy && roy.state === 'present') {
    // his parting threat, then he goes
    roy.state = 'threat';
    say('I will go when I have said my say. Don\'t you dare meddle with my affairs. I know Miss Stoner has been talking to you. I am a dangerous man to fall foul of.', null, true);
    const box = $('talkOpts'); box.innerHTML = ''; talkButtons = [];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'leave';
    const k = document.createElement('kbd'); k.textContent = 'Esc'; b.append(k, document.createTextNode('Let him go'));
    b.addEventListener('click', closeTalk); box.append(b); setTimeout(() => b.focus({ preventScroll: true }), 0);
    return;
  }
  $('talk').hidden = true; talkOpen = false; cvs.focus();
  if (speaker === 'roylott' && roy && roy.state === 'threat') { roy.state = 'leaving'; roy.t = 0; return; }
  nextMilestone();
}

// buttons on the note card and the on-screen prompt (tap on phones)
$('cardClose').addEventListener('click', closeCard);
$('prompt').addEventListener('click', () => { if (night.phase !== 'off') strike(); else examine(); });

function updateHud() {
  $('keyCount').textContent = `${keyFound()} of 7`;
  $('noteCount').textContent = String([...found].filter(i => CLUES[i] && CLUES[i].title && !KEY.includes(i)).length);
  const list = $('nbList'); list.innerHTML = '';
  const short = id => CLUES[id].text;   // the full note: this is where you review the evidence
  const head = t => { const h = document.createElement('li'); h.className = 'nbhead'; h.textContent = t; list.append(h); };
  // every key clue has a slot from the start, so you always know what is left and where to look
  head(`Key evidence · ${keyFound()} of 7`);
  const ROOM_OF = { bell_rope: 'Julia\'s room', ventilator: 'Julia\'s room', bed: 'Julia\'s room', safe: 'Dr. Roylott\'s room', saucer: 'Dr. Roylott\'s room', lash: 'Dr. Roylott\'s room', chair: 'Dr. Roylott\'s room' };
  for (const id of KEY) {
    const li = document.createElement('li');
    if (found.has(id)) { li.className = 'key'; const b = document.createElement('b'); b.textContent = CLUES[id].title; li.append(b, document.createTextNode(short(id))); }
    else { li.className = 'missing'; li.textContent = `Not yet found · somewhere in ${ROOM_OF[id]}`; }
    list.append(li);
  }
  const others = [...found].filter(i => CLUES[i] && CLUES[i].title && !KEY.includes(i));
  if (others.length) {
    head('Notes and testimony');
    for (const id of others) {
      const li = document.createElement('li'); li.className = CLUES[id].testimony ? 'note testimony' : 'note';
      const b = document.createElement('b'); b.textContent = CLUES[id].title; li.append(b, document.createTextNode(short(id))); list.append(li);
    }
  }
  $('nbEmpty').hidden = true;
  $('dbtn').hidden = !(UNLOCK.every(k => found.has(k)) && !deduction.solved);
}
function toggleNotebook(force) {
  nbOpen = typeof force === 'boolean' ? force : !nbOpen;
  $('notebook').hidden = !nbOpen; $('nbtn').setAttribute('aria-expanded', String(nbOpen));
}
$('nbtn').addEventListener('click', () => toggleNotebook());

// ---------- loop ----------
const clock = new THREE.Clock();
let t = 0;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); t += dt;

  if (playing && !cardOpen && !talkOpen && !deduceOpen && !moving) {
    const f = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0) - joyV.y;
    const s = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0) + joyV.x;
    // arrow keys turn your head
    const turn = (keys['arrowleft'] ? 1 : 0) - (keys['arrowright'] ? 1 : 0);
    if (turn) player.yaw += turn * 2.0 * dt;
    const mag = night.phase !== 'off' ? 0 : Math.min(1, Math.hypot(f, s));
    if (mag > 0.05) {
      const spd = (keys['shift'] ? 2.2 : 1.35) * mag * dt, n = Math.hypot(f, s);
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
      const mx = (fx * f + rx * s) / n * spd, mz = (fz * f + rz * s) / n * spd;
      if (!blocked(player.x + mx, player.z)) player.x += mx;
      if (!blocked(player.x, player.z + mz)) player.z += mz;
    }
  }
  if (cut.active) tickCutscene(dt);
  else {
    camera.position.set(player.x, player.eye ?? EYE, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  }

  const nt = playing ? pickTarget() : null;
  if (nt !== target) { setGlow(target, 0); target = nt; }
  if (target) setGlow(target, 0.06 + (reduceMotion ? 0 : Math.sin(t * 4) * 0.03));
  $('reticle').classList.toggle('on', !!target);
  const p = $('prompt');
  if (night.phase === 'snake' && adder.headY < 2.3 && !cardOpen) { p.hidden = false; p.textContent = (isTouch ? 'Tap: ' : 'E or click: ') + 'strike the rope!'; }
  else if (target && !cardOpen && !talkOpen && !deduceOpen && !moving) { p.hidden = false; p.textContent = (isTouch ? 'Tap: ' : 'E: ') + CLUES[target.id].verb.toLowerCase(); }
  else p.hidden = true;

  if (night.phase !== 'off') tickNight(dt);
  updateSnake();

  // Dr. Roylott: once Helen has told her story (or you've found most of the evidence) he storms in
  if (roy && ready) {
    const door = juliaDoor.userData.hinge, closed = juliaDoor.userData.closedY;
    const dDoor = Math.hypot(player.x - 1.75, player.z - 1.5);
    if (roy.state === 'waiting' && playing && player.room === 0 && !cardOpen && !talkOpen && !deduceOpen && !moving
        && (milestones[2].shown || keyFound() >= 5) && dDoor > 1.3) {
      roy.wait += dt;
      if (roy.wait > 2.5) { roy.state = 'opening'; roy.t = 0; roy.root.visible = true; julia.colliders.push(roy.collider); showWhere('The door bursts open'); }
    }
    roy.t += dt;
    const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
    if (roy.state === 'opening') {
      door.rotation.y = closed - 1.5 * ease(roy.t / 0.35);   // swings out into the corridor, out of the way
      roy.lamp.intensity = 3.2 * ease(roy.t / 0.35);
      roy.root.position.x = 2.55 - 0.8 * ease((roy.t - 0.25) / 0.7);
      if (roy.t > 1.0) { roy.state = 'present'; roy.focus = 1.4; openTalk('roylott'); }
    } else if (roy.state === 'leaving') {
      roy.root.position.x = 1.75 + 0.8 * ease(roy.t / 0.7);
      door.rotation.y = closed - 1.5 * (1 - ease((roy.t - 0.6) / 0.25));
      roy.lamp.intensity = 3.2 * (1 - ease((roy.t - 0.6) / 0.25));
      if (roy.t > 0.9) {
        roy.state = 'gone'; roy.done = true; roy.root.visible = false; door.rotation.y = closed; roy.lamp.intensity = 0;
        const i = julia.colliders.indexOf(roy.collider); if (i >= 0) julia.colliders.splice(i, 1);
        showWhere('The door slams behind him'); nextMilestone();
      }
    }
    // Holmes turns to face him, with his face above the dialogue panel
    if (roy.state === 'opening' || (roy.focus ?? 0) > 0) {
      roy.focus = Math.max(0, (roy.focus ?? 0) - dt);
      const rp = roy.root.position, dx = rp.x - player.x, dz = rp.z - player.z, dist = Math.hypot(dx, dz);
      let wantYaw = Math.atan2(-dx, -dz), dy = wantYaw - player.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const wantPitch = Math.atan2(1.75 - EYE, dist) - (talkOpen ? 0.36 : 0);
      const k = 1 - Math.exp(-5 * dt);
      player.yaw += dy * k; player.pitch += (wantPitch - player.pitch) * k;
    }
    if (roy.root.visible && roy.state !== 'seated') {
      // glare at Holmes, breathe hard, raise the crop when he threatens, strike the door-frame
      const rp = roy.root.position;
      let rel = Math.atan2(player.x - rp.x, player.z - rp.z) - roy.root.rotation.y; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      roy.yaw += (THREE.MathUtils.clamp(rel, -0.7, 0.7) - roy.yaw) * (1 - Math.exp(-4 * dt));
      roy.threat = Math.max(0, roy.threat - dt);
      roy.strike = Math.max(0, roy.strike - dt * 1.6);
      const raise = roy.threat > 0 ? 1 : 0.25;
      roy.raise = (roy.raise ?? 0) + (raise - (roy.raise ?? 0)) * (1 - Math.exp(-5 * dt));
      const swing = roy.strike > 0 ? Math.sin((1 - roy.strike) * Math.PI) * 1.2 : 0;   // up, then down hard
      if (roy.head) roy.head.quaternion.setFromEuler(new THREE.Euler(-0.08, roy.yaw, 0, 'YXZ')).multiply(roy.head.userData.q0);
      if (roy.armR) roy.armR.quaternion.copy(roy.armR.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9 * roy.raise - swing, 0, 0)));
      if (roy.elbowR) roy.elbowR.quaternion.copy(roy.elbowR.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5 * roy.raise + swing * 0.6, 0, 0)));
      if (roy.body && !reduceMotion) roy.body.scale.y = 1 + Math.sin(t * 3.2) * 0.008;
      roy.blink -= dt; if (roy.blink <= 0) { roy.blinkT = 0.12; roy.blink = 3 + Math.random() * 3; }
      roy.blinkT -= dt;
      for (const e of roy.eyes) e.scale.y = e.userData.s0.y * (roy.blinkT > 0 ? 0.1 : 0.6);   // a narrow glare
    }
  }

  // Helen: follows you with her eyes and head, breathes, blinks, gestures while she talks
  if (helenRig) {
    const h = helenRig, hp = h.root.position;
    let wantYaw = 0, wantPitch = 0;
    const lookAt = roy && roy.root.visible ? { x: roy.root.position.x, z: roy.root.position.z } : { x: player.x, z: player.z };
    if (player.room === 0) {
      const dx = lookAt.x - hp.x, dz = lookAt.z - hp.z, dist = Math.hypot(dx, dz);
      let rel = Math.atan2(dx, dz) - h.root.rotation.y; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      if (Math.abs(rel) < 1.6 && dist < 5) { wantYaw = THREE.MathUtils.clamp(rel, -0.85, 0.85); wantPitch = -THREE.MathUtils.clamp(Math.atan2(EYE - 1.52, dist), -0.3, 0.35); }
    }
    const k = 1 - Math.exp(-4 * dt);
    h.yaw += (wantYaw - h.yaw) * k; h.pitch += (wantPitch - h.pitch) * k;
    h.talk = Math.max(0, h.talk - dt);
    h.gesture += ((h.talk > 0 ? 1 : 0) - h.gesture) * (1 - Math.exp(-3 * dt));
    const nod = h.talk > 0 && !reduceMotion ? Math.sin(t * 5) * 0.04 : 0;
    if (h.head) h.head.quaternion.setFromEuler(new THREE.Euler(h.pitch + nod, h.yaw, 0, 'YXZ')).multiply(h.head.userData.q0);
    const sway = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.03;
    if (h.armR) h.armR.quaternion.copy(h.armR.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5 * h.gesture + sway, 0, 0)));
    if (h.foreR) h.foreR.quaternion.copy(h.foreR.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.0 * h.gesture, 0, 0)));
    if (h.armL) h.armL.quaternion.copy(h.armL.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-sway * 0.6, 0, 0)));
    if (h.body && !reduceMotion) h.body.scale.y = h.body.userData.s0.y * (1 + Math.sin(t * 2.2) * 0.005);
    h.blink -= dt; if (h.blink <= 0) { h.blinkT = 0.14; h.blink = 2.5 + Math.random() * 3; }
    h.blinkT -= dt;
    for (const e of h.eyes) e.scale.y += ((h.blinkT > 0 ? 0.1 : 1) - e.scale.y) * (1 - Math.exp(-30 * dt));
  }

  // bell-rope sways from its hook when pulled
  if (parts.bell_rope) {
    anim.ropeV += (-anim.rope * 9 - anim.ropeV * 1.2) * dt; anim.rope += anim.ropeV * dt;
    parts.bell_rope.rotation.x = anim.rope * 0.35;
    parts.bell_rope.rotation.z = Math.sin(t * 0.6) * 0.004 + anim.rope * 0.12;
  }
  // the safe door rattles on its hinge but holds
  if (parts.safe_door) {
    anim.safe = Math.max(0, anim.safe - dt * 1.6);
    parts.safe_door.rotation.y = (anim.safeOpen || 0) + Math.sin(anim.safe * 40) * anim.safe * 0.025;   // open (ending) plus any rattle
  }
  for (const [n, dir] of [['chest_drawer_1a', 1], ['dressing_table_drawer', -1]]) {
    const d = parts[n]; if (!d) continue;
    d.userData.base ??= d.position.x;
    const want = anim.drawers[n] ? 0.22 * dir : 0;
    d.position.x += (d.userData.base + want - d.position.x) * (1 - Math.exp(-6 * dt));
  }
  for (const r of rooms) for (const l of r.lights) if (l.flicker && l.on) l.L.intensity = l.base * (reduceMotion ? 1 : 0.85 + 0.15 * Math.sin(t * 9 + l.seed) * Math.sin(t * 5.3 + l.seed * 2));
  for (const fl of flames) { if (!reduceMotion) { fl.scale.y = 1 + Math.sin(t * 11 + fl.id) * 0.08; fl.rotation.z = Math.sin(t * 3 + fl.id) * 0.05; } }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>
