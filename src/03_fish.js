// ================= espécies da Costa Verde =================
// len em metros, k: peso(kg)=k*len^3, price R$/kg, min: medida mínima (regra do jogo)
const SPECIES = {
  sargo: { name: 'Sargo-de-dente', shape: 'deep', len: [0.2, 0.55], k: 22, price: 28, min: 0.22, cruise: 0.7, burst: 3.6, shy: 0.45, curious: 0.75, habit: 'reef', str: 1.0, school: true,
    col: { back: '#59636a', side: '#b8c2c6', belly: '#eef2f2', fin: '#3d4448', iris: '#d0b060' } },
  marimba: { name: 'Marimbá', shape: 'deep', len: [0.16, 0.4], k: 24, price: 22, min: 0.18, cruise: 0.75, burst: 3.4, shy: 0.5, curious: 0.65, habit: 'reef', str: 0.9, school: true,
    col: { back: '#6b6e64', side: '#c9c9b8', belly: '#f0efe6', fin: '#8a8a70', iris: '#c8b070' } },
  salema: { name: 'Salema', shape: 'deep', len: [0.16, 0.34], k: 25, price: 18, min: 0.18, cruise: 0.6, burst: 3.0, shy: 0.4, curious: 0.5, habit: 'reef', str: 0.8, school: true,
    col: { back: '#6d6a40', side: '#d8cf8a', belly: '#f2edc8', fin: '#c8b048', iris: '#e0c060' } },
  budiao: { name: 'Budião', shape: 'parrot', len: [0.25, 0.7], k: 15, price: 20, min: 0.3, cruise: 0.55, burst: 3.2, shy: 0.5, curious: 0.35, habit: 'reef', str: 1.0,
    col: { back: '#2a6655', side: '#4f9a82', belly: '#d0a07a', fin: '#b0603a', iris: '#e0a040' } },
  frade: { name: 'Frade', shape: 'disc', len: [0.18, 0.42], k: 30, price: 0, min: 0.2, cruise: 0.4, burst: 2.6, shy: 0.25, curious: 0.7, habit: 'reef', str: 0.7, ornamental: true,
    col: { back: '#1a1a1e', side: '#26262c', belly: '#2e2e34', fin: '#202026', iris: '#e0c040' } },
  garoupa: { name: 'Garoupa-verdadeira', shape: 'grouper', len: [0.32, 1.05], k: 14, price: 75, min: 0.47, cruise: 0.4, burst: 3.0, shy: 0.85, curious: 0.25, habit: 'hole', str: 1.3,
    col: { back: '#3b2a1e', side: '#6a4a30', belly: '#a58660', fin: '#3a2618', iris: '#b08040' } },
  badejo: { name: 'Badejo-quadrado', shape: 'grouper', len: [0.4, 1.15], k: 12, price: 60, min: 0.45, cruise: 0.55, burst: 3.4, shy: 0.7, curious: 0.3, habit: 'reef', str: 1.3,
    col: { back: '#4a4c40', side: '#6f7262', belly: '#b0ae98', fin: '#3a3a30', iris: '#c0a050' } },
  caranha: { name: 'Caranha', shape: 'snap', len: [0.45, 1.1], k: 14, price: 50, min: 0.5, cruise: 0.6, burst: 3.6, shy: 0.8, curious: 0.25, habit: 'reef', str: 1.4,
    col: { back: '#5a3a34', side: '#9a6a5e', belly: '#d8b0a0', fin: '#6a3a30', iris: '#d06040' } },
  robalo: { name: 'Robalo-flecha', shape: 'slim', len: [0.35, 1.05], k: 9, price: 55, min: 0.5, cruise: 0.6, burst: 4.0, shy: 0.8, curious: 0.2, habit: 'mid', str: 1.1,
    col: { back: '#4f5c4a', side: '#c7cfc6', belly: '#f2f4ee', fin: '#b9b06a', iris: '#e0d070' } },
  tainha: { name: 'Tainha', shape: 'slim', len: [0.28, 0.62], k: 9, price: 16, min: 0.35, cruise: 0.9, burst: 4.2, shy: 0.95, curious: 0.05, habit: 'mid', str: 0.8, school: true,
    col: { back: '#3e5260', side: '#aab8c0', belly: '#e8eef0', fin: '#5d6a70', iris: '#c8c090' } },
  pampo: { name: 'Pampo-galhudo', shape: 'deep', len: [0.28, 0.7], k: 20, price: 45, min: 0.3, cruise: 0.9, burst: 4.4, shy: 0.6, curious: 0.5, habit: 'mid', str: 1.3, school: true,
    col: { back: '#5e6f7a', side: '#d8dde0', belly: '#f5e9b8', fin: '#3a4048', iris: '#d0d0b0' } },
  enchova: { name: 'Enchova', shape: 'slim', len: [0.32, 0.8], k: 10, price: 20, min: 0.35, cruise: 1.1, burst: 5.0, shy: 0.55, curious: 0.5, habit: 'pelagic', str: 1.2, school: true,
    col: { back: '#3f6266', side: '#b8c8c4', belly: '#eef2f0', fin: '#5a7470', iris: '#e0e0a0' } },
  sororoca: { name: 'Sororoca', shape: 'mack', len: [0.4, 0.9], k: 6, price: 30, min: 0.4, cruise: 1.3, burst: 5.6, shy: 0.5, curious: 0.6, habit: 'pelagic', str: 1.2, school: true,
    col: { back: '#2f4d6a', side: '#c5d0d8', belly: '#eef2f4', fin: '#4a5a68', iris: '#e0e0c0' } },
  xareu: { name: 'Xaréu', shape: 'jack', len: [0.4, 1.0], k: 16, price: 22, min: 0.4, cruise: 1.1, burst: 5.0, shy: 0.35, curious: 0.9, habit: 'pelagic', str: 1.6, school: true,
    col: { back: '#2c5260', side: '#c4c49a', belly: '#f0ecd0', fin: '#c9a42a', iris: '#e8d070' } },
  olhodeboi: { name: 'Olho-de-boi', shape: 'amber', len: [0.75, 1.7], k: 11, price: 38, min: 0.75, cruise: 1.2, burst: 5.6, shy: 0.45, curious: 0.85, habit: 'pelagic', str: 2.2,
    col: { back: '#47506e', side: '#bcc0c8', belly: '#eeeeee', fin: '#9a8a4a', iris: '#d8b040' } },
  mero: { name: 'Mero', shape: 'grouper', len: [1.4, 2.2], k: 15, price: 0, min: 9, cruise: 0.3, burst: 1.8, shy: 0.1, curious: 0.6, habit: 'hole', str: 3.5, protected: true,
    col: { back: '#3e3a26', side: '#5d5a3c', belly: '#8d8a68', fin: '#3a3622', iris: '#a08040' } },
};
const SHAPES = {
  deep: { h: 0.46, w: 0.11, pk: 0.85, fork: true, tailH: 0.21, dors: 0.12 },
  disc: { h: 0.66, w: 0.08, pk: 0.8, fork: false, tailH: 0.2, dors: 0.22 },
  parrot: { h: 0.33, w: 0.15, pk: 0.72, fork: false, tailH: 0.17, dors: 0.07 },
  grouper: { h: 0.31, w: 0.18, pk: 0.72, fork: false, tailH: 0.15, dors: 0.08 },
  snap: { h: 0.36, w: 0.14, pk: 0.78, fork: true, tailH: 0.18, dors: 0.09 },
  slim: { h: 0.23, w: 0.12, pk: 0.78, fork: true, tailH: 0.17, dors: 0.08 },
  mack: { h: 0.18, w: 0.09, pk: 0.8, fork: true, tailH: 0.2, dors: 0.05 },
  jack: { h: 0.37, w: 0.11, pk: 0.82, fork: true, tailH: 0.26, dors: 0.06 },
  amber: { h: 0.26, w: 0.12, pk: 0.85, fork: true, tailH: 0.23, dors: 0.05 },
};
function fishGeo(sh) {
  const NL = 22, NR = 16, pos = [], uv = [], idx = [], x0 = -0.36, x1 = 0.5;
  const prof = t => 0.12 + 0.88 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), sh.pk)), 0.6);
  const X = t => lerp(x0, x1, t), TOP = t => sh.h * prof(t) * 0.5, SIDE = t => sh.w * prof(t) * 0.5;
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, x = X(t), hh = TOP(t), ww = SIDE(t);
    for (let j = 0; j <= NR; j++) { const a = j / NR * TAU; const belly = Math.cos(a) < 0 ? 0.92 : 1; pos.push(x, Math.cos(a) * hh * belly, Math.sin(a) * ww * (1 - 0.25 * Math.pow(Math.abs(Math.cos(a)), 3))); uv.push(t * 0.97, (j / NR) * 0.78); }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const add = (x, y, z, u, v) => { pos.push(x, y, z); uv.push(u, v); return pos.length / 3 - 1; };
  const tc = add(x0, 0, 0, 0, 0.39); for (let j = 0; j < NR; j++) idx.push(tc, j + 1, j);
  const sc = add(x1 + 0.012, 0, 0, 0.99, 0.39), base = NL * (NR + 1); for (let j = 0; j < NR; j++) idx.push(sc, base + j, base + j + 1);
  const tri = (a, b, c) => { const i0 = add(a[0], a[1], a[2], 0.5, 0.86), i1 = add(b[0], b[1], b[2], 0.3, 0.97), i2 = add(c[0], c[1], c[2], 0.7, 0.97); idx.push(i0, i1, i2); };
  const hp = TOP(0), tH = sh.tailH, tip = sh.fork ? 0.19 : 0.15, mid = sh.fork ? 0.085 : 0.15;
  tri([x0 + 0.01, hp, 0], [x0 - tip, tH, 0], [x0 - mid, 0, 0]);
  tri([x0 + 0.01, hp, 0], [x0 - mid, 0, 0], [x0 + 0.01, -hp, 0]);
  tri([x0 + 0.01, -hp, 0], [x0 - mid, 0, 0], [x0 - tip, -tH, 0]);
  tri([X(0.22), TOP(0.22) * 0.95, 0], [X(0.8), TOP(0.8) * 0.95, 0], [X(0.48) - 0.05, TOP(0.48) + sh.dors, 0]);
  tri([X(0.18), -TOP(0.18) * 0.9, 0], [X(0.42), -TOP(0.42) * 0.9, 0], [X(0.25), -TOP(0.25) - sh.dors * 0.7, 0]);
  for (const s of [1, -1]) tri([X(0.74), -TOP(0.74) * 0.25, s * SIDE(0.74) * 0.95], [X(0.68), -TOP(0.68) * 0.45, s * SIDE(0.68) * 0.95], [X(0.55), -TOP(0.55) * 0.5, s * (SIDE(0.55) + 0.07)]);
  for (const s of [1, -1]) tri([X(0.66), -TOP(0.66) * 0.85, s * 0.02], [X(0.6), -TOP(0.6) * 0.9, s * 0.02], [X(0.5), -TOP(0.5) - 0.05, s * 0.05]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function fishTex(key, c) {
  c = c || SPECIES[key].col;
  const t = canvasTex(256, 128, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 100);
    gr.addColorStop(0, c.back); gr.addColorStop(0.28, c.side); gr.addColorStop(0.5, c.belly); gr.addColorStop(0.72, c.side); gr.addColorStop(1, c.back);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 100); g.fillStyle = c.fin; g.fillRect(0, 100, 256, 28);
    const R = mulberry(key.length * 97 + key.charCodeAt(0));
    const blob = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, R() * 3, 0, TAU); g.fill(); };
    const bars = (n, x0, dx, w, col) => { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(x0 + i * dx, 0, w, 100); };
    // escamas
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1;
    for (let y = 0; y < 100; y += 5) for (let x = (y / 5 % 2) * 3; x < 205; x += 6) { g.beginPath(); g.arc(x, y, 3, 0.2, Math.PI - 0.2); g.stroke(); }
    if (key === 'sargo') { bars(6, 55, 26, 11, 'rgba(20,22,24,.55)'); blob(16, 25, 6, 8, 'rgba(10,10,10,.6)'); blob(16, 75, 6, 8, 'rgba(10,10,10,.6)'); }
    if (key === 'marimba') { bars(4, 70, 34, 6, 'rgba(30,30,30,.18)'); blob(14, 25, 7, 9, 'rgba(5,5,5,.8)'); blob(14, 75, 7, 9, 'rgba(5,5,5,.8)'); }
    if (key === 'salema') { g.fillStyle = 'rgba(60,110,170,.45)'; for (let y = 4; y < 100; y += 8) g.fillRect(0, y, 200, 3); g.fillStyle = 'rgba(10,10,10,.75)'; g.fillRect(196, 0, 8, 100); g.fillRect(170, 0, 7, 100); }
    if (key === 'budiao') { g.strokeStyle = 'rgba(240,120,140,.35)'; g.lineWidth = 2; for (let y = 3; y < 100; y += 6) for (let x = 0; x < 210; x += 7) { g.strokeRect(x + (y % 12 ? 3 : 0), y, 6, 5); } blob(215, 25, 14, 9, 'rgba(230,120,60,.4)'); blob(215, 75, 14, 9, 'rgba(230,120,60,.4)'); }
    if (key === 'frade') { for (let i = 0; i < 160; i++) blob(R() * 220, R() * 100, 2.5, 3.5, 'rgba(230,200,60,.75)'); g.fillStyle = 'rgba(230,200,60,.8)'; g.fillRect(208, 0, 5, 100); g.fillStyle = '#d8b030'; g.fillRect(0, 100, 256, 3); }
    if (key === 'garoupa' || key === 'mero') { for (let i = 0; i < 70; i++) blob(R() * 240, R() * 100, 4 + R() * 9, 3 + R() * 6, key === 'mero' ? 'rgba(20,18,8,.35)' : 'rgba(225,210,170,.32)'); }
    if (key === 'badejo') { for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(35,28,20,.38)'; g.fillRect(R() * 230, R() * 100, 8 + R() * 10, 6 + R() * 8); } }
    if (key === 'caranha') { for (let i = 0; i < 30; i++) blob(R() * 220, R() * 100, 3 + R() * 5, 2 + R() * 3, 'rgba(160,60,50,.25)'); }
    if (key === 'robalo') { g.fillStyle = 'rgba(15,15,15,.85)'; g.fillRect(8, 24, 200, 2.5); g.fillRect(8, 74, 200, 2.5); }
    if (key === 'tainha') { g.fillStyle = 'rgba(40,55,65,.3)'; for (const y of [8, 15, 85, 92]) g.fillRect(0, y, 230, 2.5); }
    if (key === 'pampo') { g.fillStyle = 'rgba(240,200,80,.35)'; g.fillRect(0, 36, 256, 28); }
    if (key === 'enchova') { g.fillStyle = 'rgba(30,60,60,.3)'; g.fillRect(0, 0, 256, 14); g.fillRect(0, 86, 256, 14); }
    if (key === 'sororoca') { for (let i = 0; i < 50; i++) blob(10 + R() * 200, 15 + R() * 20 + (R() > 0.5 ? 50 : 0), 3, 2.2, 'rgba(230,180,60,.75)'); }
    if (key === 'sardinha') { g.fillStyle = 'rgba(30,80,110,.45)'; g.fillRect(0, 0, 256, 18); g.fillRect(0, 82, 256, 18); }
    if (key === 'sargentinho') { bars(5, 60, 30, 9, 'rgba(10,10,10,.75)'); g.fillStyle = 'rgba(250,220,40,.45)'; g.fillRect(0, 0, 256, 14); g.fillRect(0, 86, 256, 14); }
    if (key === 'xareu') { blob(206, 14, 5, 4, 'rgba(10,10,10,.85)'); blob(206, 86, 5, 4, 'rgba(10,10,10,.85)'); g.fillStyle = 'rgba(230,200,60,.25)'; g.fillRect(0, 38, 256, 24); }
    if (key === 'olhodeboi') { g.strokeStyle = 'rgba(200,150,40,.7)'; g.lineWidth = 7; for (const y of [25, 75]) { g.beginPath(); g.moveTo(240, y - (y < 50 ? 12 : -12)); g.lineTo(20, y); g.stroke(); } }
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '255,255,255' : '0,0,0'},${R() * 0.07})`; g.fillRect(R() * 256, R() * 100, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; for (const [a, b] of [[6, 44], [56, 94]]) { g.beginPath(); g.moveTo(203, a); g.quadraticCurveTo(196, (a + b) / 2, 203, b); g.stroke(); }
    for (const y of [25, 75]) { g.fillStyle = c.iris; g.beginPath(); g.arc(229, y, 6.5, 0, TAU); g.fill(); g.fillStyle = '#060606'; g.beginPath(); g.arc(229, y, 3.8, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(228, y - 1.6, 1.3, 0, TAU); g.fill(); }
  });
  t.flipY = false; t.anisotropy = 4; return t;
}

// ===== renderização instanciada: 1 draw call por espécie =====
const POOLS = {};
const _dummy = new THREE.Object3D();
function makePool(key, shape, tex, max) {
  const geo = fishGeo(SHAPES[shape]);
  const anim = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2); anim.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aAnim', anim);
  const mat = uwify(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.36, metalness: 0.3, side: THREE.DoubleSide }), {
    key: 'fishI', vHead: 'attribute vec2 aAnim;\n',
    vBody: 'float tw=smoothstep(0.3,-0.55,position.x); transformed.z+=sin(aAnim.x-position.x*7.0)*aAnim.y*(0.1+tw*tw*1.5);'
  });
  const im = new THREE.InstancedMesh(geo, mat, max); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false;
  scene.add(im); POOLS[key] = { im, anim, n: 0, max };
  return POOLS[key];
}
function poolsBegin() { for (const k in POOLS) POOLS[k].n = 0; }
// desenha um peixe: pos, yaw, pitch, roll, escala, fase, amplitude
function poolPut(key, x, y, z, yaw, pitch, roll, s, ph, amp) {
  const P0 = POOLS[key]; if (!P0 || P0.n >= P0.max) return;
  _dummy.position.set(x, y, z); _dummy.rotation.set(roll, yaw, pitch, 'YZX'); _dummy.scale.setScalar(s); _dummy.updateMatrix();
  P0.im.setMatrixAt(P0.n, _dummy.matrix); P0.anim.setXY(P0.n, ph, amp); P0.n++;
}
function poolsEnd() { for (const k in POOLS) { const p = POOLS[k]; p.im.count = p.n; p.im.instanceMatrix.needsUpdate = true; p.anim.needsUpdate = true; } }

// ================= peixes / IA =================
const FISHES = [], RESPAWN = [];
const FEAR = { pos: new V3(), r: 0, t: 0 };
const _t1 = new V3(), _t2 = new V3();
function rollLen(sp, big = 1) {
  const [a, b] = sp.len, r = Math.random();
  if (r < 0.07) return b * rand(1.02, 1.3) * big;          // troféu
  return lerp(a, b, Math.pow(Math.random(), 1.7)) * big;
}
class Fish {
  constructor(key, spot, pos, opt = {}) {
    const sp = SPECIES[key]; this.key = key; this.sp = sp; this.spot = spot;
    this.len = opt.len || rollLen(sp, opt.big || 1);
    this.kg = sp.k * this.len ** 3;
    this.ph = rand(0, 10); this.amp = 0.06; this.vis = false;
    this.pos = pos.clone(); this.vel = new V3(); this.yaw = rand(0, TAU); this.pitch = 0; this.roll = 0;
    this.state = 'wander'; this.t = 0; this.target = pos.clone(); this.speed = sp.cruise;
    this.home = opt.home || null; this.leader = opt.leader || null; this.off = opt.off || new V3();
    this.alive = true; this.fight = 0; this.orbitA = rand(0, TAU); this.wob = rand(0, TAU);
    this.radius = SHAPES[sp.shape].h * 0.45 * this.len;
  }
  dir(out) { return out.set(Math.cos(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.sin(this.yaw) * Math.cos(this.pitch)); }
  pickWander() {
    const sp = this.sp, S = this.spot;
    for (let k = 0; k < 8; k++) {
      let x, z, y;
      if (sp.habit === 'hole' && this.home) { x = this.home.x + rand(-7, 7); z = this.home.z + rand(-7, 7); }
      else { const R = S.r * (sp.habit === 'pelagic' ? 1.7 : sp.habit === 'mid' ? 1.3 : 1); const a = rand(0, TAU), d = Math.sqrt(Math.random()) * R; x = S.x + Math.cos(a) * d; z = S.z + Math.sin(a) * d; }
      const h = H(x, z); if (h > -1.6) continue;
      if (sp.habit === 'pelagic') y = rand(Math.max(h + 2, -16), -2);
      else if (sp.habit === 'mid') y = rand(h + 0.5, Math.min(-0.8, h + 3));
      else y = h + rand(0.4, sp.habit === 'hole' ? 1.6 : 3.5);
      this.target.set(x, Math.min(y, -0.8), z); return;
    }
    this.target.set(S.x, Math.max(H(S.x, S.z) + 1, -12), S.z);
  }
  startFlee(spread = true) {
    if (this.state === 'hooked' || this.state === 'dead') return;
    this.state = 'flee'; this.t = rand(2.5, 5); this.speed = this.sp.burst;
    _t1.subVectors(this.pos, P.pos); _t1.y *= 0.3; if (_t1.lengthSq() < 0.01) _t1.set(1, 0, 0); _t1.normalize();
    if (this.sp.habit === 'hole' && this.home) { this.state = 'tohole'; this.t = 12; }
    else this.target.copy(this.pos).addScaledVector(_t1, 25).add(_t2.set(rand(-6, 6), rand(-2, 2), rand(-6, 6)));
    if (spread) for (const f of FISHES) if (f !== this && f.alive && f.state !== 'flee' && (f.leader === this || this.leader === f || (this.leader && f.leader === this.leader))) f.startFlee(false);
  }
  update(dt) {
    const sp = this.sp, p = this.pos;
    if (this.state === 'dead') {
      this.amp = lerp(this.amp, 0.004, dt); this.ph += dt * 2;
      if (GUN.fish !== this) { p.y = Math.max(p.y - dt * 0.3, H(p.x, p.z) + 0.15); this.roll = lerp(this.roll, Math.PI / 2, dt); }
      return;
    }
    this.t -= dt;
    const dP = p.distanceTo(P.pos);
    if (this.state !== 'hooked') {
      const vis = P.mode === 'swim';
      let fearR = (1.6 + sp.shy * 12 * (0.2 + P.noise * 1.15)) * (P.under ? 1 : 0.4);
      if (P.still > 2 && P.under) fearR *= 0.55; // espera: peixe se aproxima mais
      if (FEAR.t > 0 && p.distanceTo(FEAR.pos) < FEAR.r) fearR = 999;
      if (vis && dP < fearR && this.state !== 'flee' && this.state !== 'tohole' && this.state !== 'hidden') this.startFlee();
      if (this.state === 'hidden' && vis && dP < 1.6 + P.noise * 3) { this.state = 'flee'; this.t = 3; this.speed = sp.burst; this.target.copy(p).addScaledVector(_t1.subVectors(p, P.pos).normalize(), 15); }
    }
    let L = this.leader; if (L && !L.alive) L = this.leader = null;
    switch (this.state) {
      case 'wander':
        this.speed = sp.cruise * (L ? 1.15 : 1);
        if (L) { _t1.copy(this.off).applyAxisAngle(_t2.set(0, 1, 0), L.yaw); this.target.copy(L.pos).add(_t1); this.target.y += Math.sin(performance.now() * 0.001 + this.wob) * 0.3; if (L.state === 'curious') { this.state = 'curious'; this.t = L.t; } }
        else if (this.t <= 0 || p.distanceTo(this.target) < 1.2) { this.pickWander(); this.t = rand(5, 12); }
        if (!L && P.mode === 'swim' && P.under && P.still > 1.4 && dP < 24 && Math.random() < sp.curious * dt * 0.45) { this.state = 'curious'; this.t = rand(6, 11); }
        break;
      case 'curious': {
        this.speed = sp.cruise * 0.9;
        if (L) { _t1.copy(this.off).applyAxisAngle(_t2.set(0, 1, 0), L.yaw); this.target.copy(L.pos).add(_t1); }
        else { this.orbitA += dt * 0.25; const R = 2.8 + this.len * 2.5; this.target.set(P.pos.x + Math.cos(this.orbitA) * R, P.pos.y + Math.sin(this.orbitA * 0.7) * 0.8, P.pos.z + Math.sin(this.orbitA) * R); }
        if (this.t <= 0 || !P.under) { this.state = 'wander'; this.t = 0; }
        break;
      }
      case 'flee':
        if (this.t <= 0) { this.state = 'wander'; this.t = 0; this.speed = sp.cruise; }
        break;
      case 'tohole':
        this.speed = sp.burst * 0.8; this.target.set(this.home.x, this.home.y, this.home.z);
        if (p.distanceTo(this.target) < 0.6 || this.t <= 0) { this.state = 'hidden'; this.t = rand(12, 26); }
        break;
      case 'hidden':
        this.target.set(this.home.x, this.home.y, this.home.z); this.speed = 0.3;
        if (this.t <= 0) { this.state = 'wander'; this.t = 0; }
        break;
      case 'hooked':
        this.fight -= dt;
        _t1.subVectors(p, P.pos); _t1.y = rand(-0.5, 0.3); _t1.normalize();
        _t1.applyAxisAngle(_t2.set(0, 1, 0), Math.sin(performance.now() * 0.004 + this.orbitA) * 1.2);
        this.target.copy(p).addScaledVector(_t1, 5); this.speed = this.fight > 0 ? sp.burst * 0.75 : 0;
        if (this.fight <= 0) { this.state = 'dead'; this.vel.set(0, 0, 0); }
        break;
    }
    // locomoção
    _t1.subVectors(this.target, p); const dist = _t1.length();
    const sp2 = this.state === 'hidden' ? Math.min(this.speed, dist) : this.speed * clamp(dist / 1.5, 0.25, 1);
    if (dist > 1e-3) _t1.multiplyScalar(sp2 / dist);
    const agil = this.state === 'flee' || this.state === 'tohole' || this.state === 'hooked' ? 4 : 1.4;
    this.vel.lerp(_t1, clamp(dt * agil, 0, 1));
    p.addScaledVector(this.vel, dt);
    const h = H(p.x, p.z); if (p.y < h + 0.25) { p.y = h + 0.25; this.vel.y = Math.abs(this.vel.y) * 0.3; }
    if (p.y > -0.5) { p.y = -0.5; this.vel.y = -0.1; }
    if (h > -1.0) { p.x -= this.vel.x * dt * 2; p.z -= this.vel.z * dt * 2; this.pickWander(); }
    if (this.state !== 'hidden') pushOutRocks(p, this.radius * 0.5 + 0.05);
    // orientação
    const v = this.vel.length();
    if (this.state === 'hidden' && this.home) { this.yaw += angDiff(this.yaw, -this.home.dir) * clamp(dt * 2, 0, 1); this.pitch *= 0.95; }
    else if (v > 0.06) {
      const ty = Math.atan2(-this.vel.z, this.vel.x), tp = clamp(Math.atan2(this.vel.y, Math.hypot(this.vel.x, this.vel.z)), -0.6, 0.6);
      const dy = angDiff(this.yaw, ty); this.yaw += dy * clamp(dt * 4, 0, 1); this.pitch = lerp(this.pitch, tp, clamp(dt * 3, 0, 1)); this.roll = lerp(this.roll, clamp(-dy * 0.6, -0.5, 0.5), clamp(dt * 3, 0, 1));
    }
    if (this.state === 'curious' && !L) { const ty = Math.atan2(-(P.pos.z - p.z), P.pos.x - p.x); this.yaw += angDiff(this.yaw, ty) * clamp(dt * 1.2, 0, 1); }
    const beat = this.state === 'hooked' && this.fight > 0 ? 18 : 3 + v / this.len * 2.4;
    this.ph += dt * beat;
    this.amp = lerp(this.amp, this.state === 'hooked' && this.fight > 0 ? 0.13 : 0.035 + Math.min(0.07, v * 0.02 / this.len), clamp(dt * 3, 0, 1));
  }
  draw() { poolPut(this.key, this.pos.x, this.pos.y, this.pos.z, this.yaw, this.pitch, this.roll, this.len, this.ph, this.amp); }
  remove() { this.alive = false; const i = FISHES.indexOf(this); if (i >= 0) FISHES.splice(i, 1); }
}

// população por ponto: [espécie, grupos, tamanho do grupo, chance, multiplicador de tamanho]
const POP = {
  laje: [['sargo', 5, [5, 10]], ['marimba', 4, [6, 12]], ['salema', 3, [8, 15]], ['garoupa', 9, [1, 1]], ['badejo', 4, [1, 1]], ['caranha', 3, [1, 2]], ['xareu', 3, [4, 8]], ['budiao', 4, [1, 3]], ['frade', 3, [1, 2]], ['sororoca', 2, [3, 6]], ['mero', 1, [1, 1], 0.6]],
  jorge: [['garoupa', 10, [1, 1], 1, 1.12], ['badejo', 5, [1, 1], 1, 1.1], ['caranha', 3, [1, 2]], ['sargo', 4, [5, 9]], ['marimba', 3, [6, 10]], ['xareu', 3, [4, 8]], ['olhodeboi', 3, [1, 4]], ['sororoca', 3, [3, 6]], ['budiao', 4, [1, 3]], ['frade', 3, [1, 2]], ['enchova', 2, [4, 8]]],
  botinas: [['sargo', 6, [5, 10]], ['marimba', 4, [6, 11]], ['salema', 4, [8, 14]], ['garoupa', 6, [1, 1], 1, 0.8], ['robalo', 3, [1, 2]], ['budiao', 3, [1, 3]], ['frade', 2, [1, 2]], ['pampo', 3, [2, 5]]],
  foz: [['robalo', 9, [1, 3]], ['tainha', 5, [8, 14]], ['pampo', 3, [2, 5]], ['enchova', 2, [4, 7]]],
  gipoia: [['garoupa', 7, [1, 1]], ['sargo', 4, [5, 9]], ['marimba', 3, [6, 10]], ['salema', 3, [8, 12]], ['budiao', 3, [1, 3]], ['badejo', 3, [1, 1]], ['pampo', 2, [2, 4]], ['frade', 2, [1, 2]]],
  comprida: [['garoupa', 6, [1, 1]], ['sargo', 4, [5, 9]], ['salema', 3, [8, 12]], ['xareu', 2, [4, 7]], ['caranha', 2, [1, 2]], ['frade', 2, [1, 2]], ['budiao', 3, [1, 3]]],
};
function spawnGroup(spot, key, n, big = 1) {
  const sp = SPECIES[key];
  let home = null, pos;
  if (sp.habit === 'hole') {
    const hs = HOLES.filter(h => h.spot === spot.id).sort((a, b) => a.used - b.used);
    if (hs.length) { home = hs[Math.floor(Math.random() * Math.min(4, hs.length))]; home.used++; pos = new V3(home.x, home.y, home.z); }
  }
  if (!pos) {
    for (let k = 0; k < 20; k++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * spot.r, x = spot.x + Math.cos(a) * d, z = spot.z + Math.sin(a) * d, h = H(x, z); if (h < -2) { pos = new V3(x, sp.habit === 'pelagic' ? rand(Math.max(h + 2, -14), -2) : h + rand(0.6, 2.5), z); break; } }
    if (!pos) pos = new V3(spot.x, H(spot.x, spot.z) + 1.5, spot.z);
  }
  const leader = new Fish(key, spot, pos, { home, big }); FISHES.push(leader);
  const spread = 1.2 + n * 0.25;
  for (let i = 1; i < n; i++) {
    const off = new V3(rand(-spread, spread), rand(-0.9, 0.9), rand(-spread, spread));
    const f = new Fish(key, spot, pos.clone().add(off), { leader, off, len: leader.len * rand(0.72, 1.25) }); FISHES.push(f);
  }
}
function spawnAll() {
  for (const k of Object.keys(SPECIES)) makePool(k, SPECIES[k].shape, fishTex(k), k === 'mero' ? 8 : 260);
  for (const s of SPOTS) {
    const pop = POP[s.id]; if (!pop) continue;
    for (const [key, groups, [a, b], chance = 1, big = 1] of pop) for (let g = 0; g < groups; g++) if (Math.random() < chance) spawnGroup(s, key, Math.round(rand(a, b)), big);
  }
}
function updateFishes(dt, now) {
  if (FEAR.t > 0) FEAR.t -= dt;
  const c = camera.position;
  for (let i = FISHES.length - 1; i >= 0; i--) {
    const f = FISHES[i]; const d2 = (f.pos.x - c.x) ** 2 + (f.pos.z - c.z) ** 2;
    f.vis = d2 < 110 * 110 || f.state === 'hooked' || f === GUN.fish;
    if (f.vis) f.update(dt);
  }
  for (let i = RESPAWN.length - 1; i >= 0; i--) {
    const r = RESPAWN[i]; if (now < r.t) continue;
    const s = spotById(r.spot); if (Math.hypot(P.pos.x - s.x, P.pos.z - s.z) < 130) continue;
    spawnGroup(s, r.key, r.n); RESPAWN.splice(i, 1);
  }
}
function drawFishes() { for (const f of FISHES) if (f.vis) f.draw(); }
