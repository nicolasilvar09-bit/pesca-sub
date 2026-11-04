// ================= mundo: ilha, estradas, cidades, prédios, árvores e colisão =================
const NZ = makeNoise(9173);
let TERRAIN = null, WATER = null; const CHUNK_MESH = [], NATURE_MESH = [];
const WR = mulberry(4242); // o mapa é sempre o mesmo
const wr = (a, b) => a + WR() * (b - a);
const wpk = a => a[Math.floor(WR() * a.length)];

// ---------- Balneário: selva tropical (mapa original do NK Mobile) ----------
function balTowns() {
  return [
    { n: 'Centro Balneário', x: 0, z: 60, r: 128, kind: 'city', tier: 2, big: true },
    { n: 'Orla Dourada', x: 335, z: 335, r: 95, kind: 'resort', tier: 2 },
    { n: 'Palafitas', x: -470, z: 250, r: 72, kind: 'stilt', tier: 1 },
    { n: 'Templo do Morro', x: -120, z: -330, r: 72, kind: 'ruins', tier: 3 },
    { n: 'Quartel da Mata', x: 300, z: -255, r: 86, kind: 'military', tier: 3 },
    { n: 'Arrozal', x: -335, z: -60, r: 86, kind: 'farm', tier: 1 },
    { n: 'Vila Caiçara', x: 125, z: 425, r: 80, kind: 'village', tier: 1 },
    { n: 'Mercado Velho', x: -232, z: 145, r: 76, kind: 'market', tier: 2 },
    { n: 'Porto Pesqueiro', x: 432, z: -20, r: 76, kind: 'port', tier: 2 },
    { n: 'Mirante', x: 85, z: -470, r: 62, kind: 'village', tier: 2 },
    { n: 'Usina Velha', x: -385, z: -330, r: 70, kind: 'factory', tier: 2 },
    { n: 'Cachoeira', x: -150, z: 405, r: 62, kind: 'village', tier: 1 },
  ];
}
function balRoads() {
  const R = [], T_ = n => TOWNS.find(t => t.n === n), link = (a, b) => { const p = T_(a), q = T_(b); R.push([p.x, p.z, q.x, q.z]); };
  [['Centro Balneário', 'Mercado Velho'], ['Centro Balneário', 'Orla Dourada'], ['Centro Balneário', 'Quartel da Mata'], ['Centro Balneário', 'Porto Pesqueiro'],
   ['Centro Balneário', 'Vila Caiçara'], ['Centro Balneário', 'Arrozal'], ['Mercado Velho', 'Palafitas'], ['Mercado Velho', 'Cachoeira'], ['Cachoeira', 'Vila Caiçara'],
   ['Arrozal', 'Usina Velha'], ['Usina Velha', 'Templo do Morro'], ['Templo do Morro', 'Mirante'], ['Mirante', 'Quartel da Mata'], ['Quartel da Mata', 'Porto Pesqueiro'],
   ['Porto Pesqueiro', 'Orla Dourada'], ['Orla Dourada', 'Vila Caiçara'], ['Arrozal', 'Mercado Velho'], ['Templo do Morro', 'Centro Balneário']].forEach(([a, b]) => link(a, b));
  // ruas internas: avenidas em cruz nas cidades; no centro, uma grade de quarteirões
  for (const t of TOWNS) {
    if (!['city', 'resort', 'market'].includes(t.kind)) continue;
    const e = t.r - 10; R.push([t.x - e, t.z, t.x + e, t.z], [t.x, t.z - e, t.x, t.z + e]);
    if (t.big) for (const o of [-50, 50]) R.push([t.x - e, t.z + o, t.x + e, t.z + o], [t.x + o, t.z - e, t.x + o, t.z + e]);
  }
  return R;
}
// relevo: morros íngremes, cristas, baías recortadas
function rawHB(x, z) {
  const d = Math.hypot(x, z), a = Math.atan2(z, x);
  const edge = 600 + NZ.fbm(Math.cos(a) * 2.2 + 5, Math.sin(a) * 2.2 + 5, 4) * 140;
  const s = smooth(clamp((edge - d) / 120, 0, 1));
  let h = 9 + NZ.fbm(x / 210 + 1, z / 210 + 9, 4) * 38 + Math.abs(NZ.fbm(x / 85 - 4, z / 85 + 2, 3)) * 16;
  h += 72 * Math.exp(-((x + 120) ** 2 + (z + 330) ** 2) / (2 * 115 * 115)); // morro do templo
  h += 34 * Math.exp(-((x - 85) ** 2 + (z + 470) ** 2) / (2 * 85 * 85)); // mirante
  h += 26 * Math.exp(-((x - 320) ** 2 + (z + 140) ** 2) / (2 * 105 * 105));
  h = Math.max(h, 2.5);
  return lerp(-14, h, s);
}
const TOWNS = MAPID === 'bal' ? balTowns() : [
  { n: 'Porto Azul', x: -335, z: 300, r: 100, kind: 'port', tier: 2 },
  { n: 'Vila Cores', x: -120, z: -255, r: 92, kind: 'village', tier: 1 },
  { n: 'Centro', x: 70, z: 45, r: 112, kind: 'city', tier: 2 },
  { n: 'Base Militar', x: 335, z: -240, r: 95, kind: 'military', tier: 3 },
  { n: 'Fazenda Sol', x: 275, z: 290, r: 88, kind: 'farm', tier: 1 },
  { n: 'Usina', x: -380, z: -85, r: 78, kind: 'factory', tier: 2 },
  { n: 'Bairro Verde', x: -165, z: 95, r: 82, kind: 'village', tier: 1 },
  { n: 'Jardim', x: 175, z: -110, r: 80, kind: 'city', tier: 2 },
  { n: 'Prainha', x: 15, z: 335, r: 78, kind: 'village', tier: 1 },
  { n: 'Farol Leste', x: 430, z: 35, r: 70, kind: 'village', tier: 2 },
].map(t => Object.assign(t, { x: t.x * MS, z: t.z * MS })).concat([ // cidades novas (mapa maior)
  { n: 'Cidade Alta', x: 330, z: 120, r: 105, kind: 'city', tier: 2 },
  { n: 'Pedreira', x: 200, z: -560, r: 80, kind: 'factory', tier: 2 },
  { n: 'Vila Nova', x: -420, z: -420, r: 85, kind: 'village', tier: 1 },
  { n: 'Quartel Sul', x: -330, z: 600, r: 88, kind: 'military', tier: 3 },
  { n: 'Rancho', x: 560, z: 300, r: 75, kind: 'farm', tier: 1 },
]);
const ROADS = MAPID === 'bal' ? balRoads() : [ // trechos de estrada [x0,z0,x1,z1]
  [-335, 300, -210, 150], [-210, 150, 70, 45], [70, 45, 335, -240], [70, 45, 275, 290], [-120, -255, 70, 45],
  [-380, -85, -120, -255], [-380, -85, -210, 150], [275, 290, 150, 430], [335, -240, 120, -400],
  [-165, 95, 70, 45], [175, -110, 70, 45], [175, -110, 335, -240], [15, 335, 70, 45], [15, 335, -335, 300], [430, 35, 335, -240], [430, 35, 275, 290],
].map(r => r.map(v => v * MS));
if (MAPID !== 'bal') { // estradas das cidades novas
  const T_ = n => TOWNS.find(t => t.n === n), link = (a, b) => { const p = T_(a), q = T_(b); ROADS.push([p.x, p.z, q.x, q.z]); };
  link('Cidade Alta', 'Centro'); link('Cidade Alta', 'Farol Leste'); link('Cidade Alta', 'Jardim');
  link('Pedreira', 'Jardim'); link('Pedreira', 'Base Militar'); link('Vila Nova', 'Usina'); link('Vila Nova', 'Vila Cores');
  link('Quartel Sul', 'Prainha'); link('Quartel Sul', 'Porto Azul'); link('Rancho', 'Fazenda Sol'); link('Rancho', 'Farol Leste');
}
// rio que desce do morro ao norte até o mar ao sul (raso: dá para atravessar a pé; as estradas passam por pontes)
const RIVERS = MAPID === 'bal' ? [
  [[-70, -250], [-40, -150], [-120, -60], [-150, 40], [-85, 250], [-55, 340], [-35, 470], [-20, 700]],
  [[185, -120], [240, 40], [300, 165], [420, 205], [640, 245]],
] : [[[-40, -560], [40, -420], [60, -250], [-10, -130], [-80, -40], [-90, 200], [-120, 330], [-110, 480], [-110, 760]]];
const RIVER = RIVERS[0];
const LAKES = MAPID === 'bal' ? [[205, -415, 52], [-300, 330, 38]] : []; // lagoas (fundas: nada)
function riverDist(x, z) {
  let m = 1e9;
  for (const RV of RIVERS) for (let i = 0; i < RV.length - 1; i++) {
    const a = RV[i], b = RV[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L, 0, 1);
    m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return m;
}

// ---------- relevo ----------
function rawH(x, z) {
  if (MAPID === 'bal') return rawHB(x, z);
  const d = Math.hypot(x, z), a = Math.atan2(z, x);
  const edge = 548 * MS + NZ.fbm(Math.cos(a) * 1.7 + 11, Math.sin(a) * 1.7 + 11, 3) * 100;
  const s = smooth(clamp((edge - d) / 180, 0, 1));
  let h = 10 + NZ.fbm(x / 300 + 3, z / 300 + 7, 4) * 34 + NZ.fbm(x / 70, z / 70, 2) * 3;
  h += 42 * Math.exp(-((x + 30 * MS) ** 2 + (z + 440 * MS) ** 2) / (2 * 140 * 140)); // morro ao norte
  h += 22 * Math.exp(-((x - 520) ** 2 + (z + 120) ** 2) / (2 * 90 * 90)); // colinas a leste
  h = Math.max(h, 2.5);
  return lerp(-16, h, s);
}
const PADS = []; // áreas planas (cidades e casas isoladas)
for (const t of TOWNS) { t.h = Math.max(4, rawH(t.x, t.z)); const st = t.kind === 'stilt'; PADS.push({ x: t.x, z: t.z, r: st ? 24 : t.r, b: st ? 18 : 45, h: t.h }); }
// casas isoladas espalhadas pela ilha
const LONE = [];
const LONE_N = MAPID === 'bal' ? 60 : 85, LONE_R = MAPID === 'bal' ? 560 : 470 * MS;
for (let k = 0; k < 1600 && LONE.length < LONE_N; k++) {
  const x = wr(-LONE_R, LONE_R), z = wr(-LONE_R, LONE_R), h = rawH(x, z);
  if (riverDist(x, z) < 28) continue;
  if (h < 4 || h > 45) continue;
  if (TOWNS.some(t => Math.hypot(t.x - x, t.z - z) < t.r + 50)) continue;
  if (LONE.some(p => Math.hypot(p.x - x, p.z - z) < 34)) continue;
  if (Math.abs(rawH(x + 10, z) - h) + Math.abs(rawH(x, z + 10) - h) > 6) continue;
  LONE.push({ x, z, h }); PADS.push({ x, z, r: 11, b: 12, h });
}
function padH(x, z, h) {
  for (const p of PADS) {
    const d = Math.hypot(x - p.x, z - p.z); if (d > p.r + p.b) continue;
    h = lerp(h, p.h, smooth(clamp((p.r + p.b - d) / p.b, 0, 1)));
  }
  return h;
}
const H = new Float32Array(GN * GN);
const townAt = (x, z, pad = 0) => TOWNS.find(t => Math.hypot(t.x - x, t.z - z) < t.r + pad);
function riverCarve(x, z, h) {
  for (const [lx, lz, lr] of LAKES) { const d = Math.hypot(x - lx, z - lz) - lr; if (d < 26) h = Math.min(h, lerp(-2.8, h, smooth(clamp(d / 26, 0, 1)))); }
  const d = riverDist(x, z); if (d > 22 || roadDist(x, z) < 7 || townAt(x, z, 6)) return h;
  return Math.min(h, lerp(-0.85, h, smooth(clamp((d - 7) / 15, 0, 1))));
}
for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { const x = -HALF + i * CELL, z = -HALF + j * CELL; H[j * GN + i] = riverCarve(x, z, padH(x, z, rawH(x, z))); }
function groundH(x, z) {
  const gx = (x + HALF) / CELL, gz = (z + HALF) / CELL;
  if (gx < 0 || gz < 0 || gx >= GN - 1 || gz >= GN - 1) return -16;
  const ix = gx | 0, iz = gz | 0, fx = gx - ix, fz = gz - iz, i = iz * GN + ix;
  const h00 = H[i], h10 = H[i + 1], h01 = H[i + GN], h11 = H[i + GN + 1];
  return fx + fz <= 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
}
function roadDist(x, z) {
  let m = 1e9;
  for (const r of ROADS) {
    const dx = r[2] - r[0], dz = r[3] - r[1], L = dx * dx + dz * dz;
    const t = clamp(((x - r[0]) * dx + (z - r[1]) * dz) / L, 0, 1);
    m = Math.min(m, Math.hypot(x - r[0] - dx * t, z - r[1] - dz * t));
  }
  return m;
}

// ---------- malha do terreno ----------
(function buildTerrain() {
  const pos = new Float32Array(GN * GN * 3), col = new Float32Array(GN * GN * 3), c = new T.Color();
  const sand = new T.Color('#b8a77e'), wet = new T.Color('#a89a72'), road = new T.Color('#4a4b4e'), line = new T.Color('#d9d2a8');
  const BALC = MAPID === 'bal';
  const pave = new T.Color(BALC ? '#8f8b82' : '#86837c'), rock = new T.Color(BALC ? '#7d7a6e' : '#85827c'), g1 = new T.Color(BALC ? '#4d7a2e' : '#617a3c'), g2 = new T.Color(BALC ? '#7a9a3c' : '#8a8f52'), g3 = new T.Color(BALC ? '#355e24' : '#4f6933');
  if (BALC) { sand.set('#d9c99a'); wet.set('#bfae80'); }
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
    const k = j * GN + i, x = -HALF + i * CELL, z = -HALF + j * CELL, h = H[k];
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    const sl = Math.abs(H[Math.min(k + 1, H.length - 1)] - h) + Math.abs(H[Math.min(k + GN, H.length - 1)] - h);
    const n = NZ.n(x / 40, z / 40) * 0.5 + 0.5, t = townAt(x, z), rd = roadDist(x, z);
    if (h < -1) c.copy(wet); else if (h < 1.6) c.copy(sand);
    else if (rd < 4.5) c.copy(rd < 0.5 ? line : road);
    else if (t && ['city', 'military', 'port', 'factory', 'resort', 'market'].includes(t.kind) && Math.hypot(t.x - x, t.z - z) < t.r) c.copy(pave).multiplyScalar(0.94 + n * 0.08);
    else if (sl > 3.2 || h > 52) c.copy(rock).multiplyScalar(0.9 + n * 0.2);
    else { c.copy(g1).lerp(n > 0.55 ? g2 : g3, Math.abs(n - 0.55) * 1.6); }
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  const idx = new Uint32Array((GN - 1) * (GN - 1) * 6); let q = 0;
  for (let j = 0; j < GN - 1; j++) for (let i = 0; i < GN - 1; i++) {
    const a = j * GN + i, b = a + 1, cc = a + GN, d = cc + 1;
    idx[q++] = a; idx[q++] = cc; idx[q++] = b; idx[q++] = b; idx[q++] = cc; idx[q++] = d;
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
  g.setIndex(new T.BufferAttribute(idx, 1)); g.computeVertexNormals();
  TERRAIN = new T.Mesh(g, MAT.terrain); scene.add(TERRAIN);
  const water = WATER = new T.Mesh(new T.PlaneGeometry(5000, 5000), new T.MeshLambertMaterial({ color: 0x2a6f8f, transparent: true, opacity: 0.84 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0; scene.add(water);
})();

// ---------- colisão: caixas alinhadas aos eixos numa grade ----------
const BOX = [], GC = 16, GW = MAP / GC, GRID = Array.from({ length: GW * GW }, () => []);
let STAMP = 1;
const gcell = v => clamp(Math.floor((v + HALF) / GC), 0, GW - 1);
function addCollider(x0, y0, z0, x1, y1, z1, k) {
  const b = { x0, y0, z0, x1, y1, z1, k: k || 'w', s: 0 }; BOX.push(b);
  for (let cz = gcell(z0); cz <= gcell(z1); cz++) for (let cx = gcell(x0); cx <= gcell(x1); cx++) GRID[cz * GW + cx].push(b);
  return b;
}
function boxesNear(x0, z0, x1, z1, out) {
  out.length = 0; STAMP++;
  for (let cz = gcell(z0); cz <= gcell(z1); cz++) for (let cx = gcell(x0); cx <= gcell(x1); cx++) for (const b of GRID[cz * GW + cx]) {
    if (b.s === STAMP) continue; b.s = STAMP;
    if (b.x1 >= x0 && b.x0 <= x1 && b.z1 >= z0 && b.z0 <= z1) out.push(b);
  }
  return out;
}
function rayBox(b, ox, oy, oz, ix, iy, iz, tmax) {
  let t1 = (b.x0 - ox) * ix, t2 = (b.x1 - ox) * ix, tn = Math.min(t1, t2), tf = Math.max(t1, t2);
  t1 = (b.y0 - oy) * iy; t2 = (b.y1 - oy) * iy; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
  t1 = (b.z0 - oz) * iz; t2 = (b.z1 - oz) * iz; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
  if (tf < Math.max(tn, 0) || tn > tmax) return Infinity;
  return Math.max(tn, 0);
}
function rayTerrain(ox, oy, oz, dx, dy, dz, maxD) {
  const st = maxD > 60 ? 3 : 1.5;
  let prev = 0;
  for (let t = 0.4; t <= maxD + st; t += st) {
    const tt = Math.min(t, maxD), y = oy + dy * tt;
    if (y < groundH(ox + dx * tt, oz + dz * tt)) {
      let a = prev, b = tt;
      for (let k = 0; k < 6; k++) { const m = (a + b) / 2; if (oy + dy * m < groundH(ox + dx * m, oz + dz * m)) b = m; else a = m; }
      return a;
    }
    prev = tt; if (tt >= maxD) break;
  }
  return Infinity;
}
// raio contra o cenário (caixas + terreno). d precisa ser unitário. Devolve a distância do impacto (ou maxD)
let RAY_BOX = null;
function rayStatic(ox, oy, oz, dx, dy, dz, maxD) {
  let best = maxD; RAY_BOX = null; STAMP++;
  const idx = 1 / (dx || 1e-9), idy = 1 / (dy || 1e-9), idz = 1 / (dz || 1e-9);
  let cx = gcell(ox), cz = gcell(oz);
  const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  let tmx = ((cx + (dx > 0 ? 1 : 0)) * GC - HALF - ox) * idx, tmz = ((cz + (dz > 0 ? 1 : 0)) * GC - HALF - oz) * idz;
  const tdx = Math.abs(GC * idx), tdz = Math.abs(GC * idz);
  let t = 0;
  for (let guard = 0; guard < 400 && t <= best; guard++) {
    for (const b of GRID[cz * GW + cx]) {
      if (b.s === STAMP) continue; b.s = STAMP;
      const h = rayBox(b, ox, oy, oz, idx, idy, idz, best); if (h < best) { best = h; RAY_BOX = b; }
    }
    if (tmx < tmz) { t = tmx; tmx += tdx; cx += sx; } else { t = tmz; tmz += tdz; cz += sz; }
    if (cx < 0 || cz < 0 || cx >= GW || cz >= GW) break;
  }
  const th = rayTerrain(ox, oy, oz, dx, dy, dz, best);
  if (th < best) { RAY_BOX = null; return th; }
  return best;
}
function losClear(ax, ay, az, bx2, by, bz) {
  const dx = bx2 - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz);
  if (d < 0.01) return true;
  if (typeof smokeBlocks === 'function' && SMOKES.length && smokeBlocks(ax, ay, az, bx2, by, bz)) return false;
  return rayStatic(ax, ay, az, dx / d, dy / d, dz / d, d) >= d - 0.3;
}

// ---------- geometria estática em blocos (para o celular descartar o que está fora da tela) ----------
const CH = 160, CHN = MAP / CH;
const CHUNKS = Array.from({ length: CHN * CHN }, () => ({ p: [], n: [], c: [], m: [] }));
// material desenhado pelo shader: 0 reboco, 1 tijolo, 2 telha, 3 concreto, 4 madeira, 5 chapa ondulada
let CUR_MAT = 0;
const GLASS = { p: [] };
const chunkAt = (x, z) => CHUNKS[clamp(Math.floor((z + HALF) / CH), 0, CHN - 1) * CHN + clamp(Math.floor((x + HALF) / CH), 0, CHN - 1)];
const _wc = new T.Color();
function quad(ch, a, b, c, d, n, col, bot) { // bot = cor dos 2 primeiros vértices (base da parede, mais escura)
  ch.p.push(...a, ...b, ...c, ...a, ...c, ...d);
  const lo = bot || col;
  for (const k of [lo, lo, col, lo, col, col]) { ch.n.push(n[0], n[1], n[2]); ch.c.push(k.r, k.g, k.b); ch.m.push(CUR_MAT); }
}
function poly(ch, pts, col, out) { // polígono convexo; out = direção para fora (garante o lado visível)
  const [a, b, c] = pts, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * out[0] + ny * out[1] + nz * out[2] < 0) { pts = pts.slice().reverse(); nx = -nx; ny = -ny; nz = -nz; }
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for (let i = 1; i < pts.length - 1; i++) { ch.p.push(...pts[0], ...pts[i], ...pts[i + 1]); for (let k = 0; k < 3; k++) { ch.n.push(nx, ny, nz); ch.c.push(col.r, col.g, col.b); ch.m.push(CUR_MAT); } }
}
function addBox(x0, y0, z0, x1, y1, z1, color, o) {
  o = o || {};
  if (o.mat != null) { const keep = CUR_MAT; CUR_MAT = o.mat; const r = addBox(x0, y0, z0, x1, y1, z1, color, Object.assign({}, o, { mat: null })); CUR_MAT = keep; return r; }
  const ch = chunkAt((x0 + x1) / 2, (z0 + z1) / 2), c = _wc.set(color);
  quad(ch, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], c);
  if (o.bot) quad(ch, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], c);
  const cs = c.clone().multiplyScalar(0.93);
  // sombra de contato: a base das paredes que tocam o chão fica mais escura
  const ao = y1 - y0 > 0.8 ? (y0 < groundH((x0 + x1) / 2, (z0 + z1) / 2) + 0.6 ? 0.68 : 0.88) : 0.97;
  const cb = c.clone().multiplyScalar(ao), csb = cs.clone().multiplyScalar(ao);
  quad(ch, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], cs, csb);
  quad(ch, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], cs, csb);
  quad(ch, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], c, cb);
  quad(ch, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], c, cb);
  if (!o.nocol) return addCollider(x0, y0, z0, x1, y1, z1, o.k);
}
// telhado de duas águas (cumeeira no eixo mais comprido)
function addGable(x0, z0, x1, z1, y, h, color) {
  const ch = chunkAt((x0 + x1) / 2, (z0 + z1) / 2), c = _wc.set(color), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, o = 0.4;
  const g = c.clone().multiplyScalar(0.85), keep = CUR_MAT; CUR_MAT = 2;
  if (x1 - x0 >= z1 - z0) {
    poly(ch, [[x0 - o, y, z1 + o], [x1 + o, y, z1 + o], [x1 + o, y + h, cz], [x0 - o, y + h, cz]], c, [0, 1, 1]);
    poly(ch, [[x1 + o, y, z0 - o], [x0 - o, y, z0 - o], [x0 - o, y + h, cz], [x1 + o, y + h, cz]], c, [0, 1, -1]);
    poly(ch, [[x1, y, z1], [x1, y, z0], [x1, y + h, cz]], g, [1, 0, 0]);
    poly(ch, [[x0, y, z0], [x0, y, z1], [x0, y + h, cz]], g, [-1, 0, 0]);
  } else {
    poly(ch, [[x1 + o, y, z0 - o], [x1 + o, y, z1 + o], [cx, y + h, z1 + o], [cx, y + h, z0 - o]], c, [1, 1, 0]);
    poly(ch, [[x0 - o, y, z1 + o], [x0 - o, y, z0 - o], [cx, y + h, z0 - o], [cx, y + h, z1 + o]], c, [-1, 1, 0]);
    poly(ch, [[x0, y, z1], [x1, y, z1], [cx, y + h, z1]], g, [0, 0, 1]);
    poly(ch, [[x1, y, z0], [x0, y, z0], [cx, y + h, z0]], g, [0, 0, -1]);
  }
  CUR_MAT = keep;
  addCollider(x0, y, z0, x1, y + h * 0.55, z1, 'roof');
}

// ---------- prédios ----------
const BLD = []; // {x0,z0,x1,z1,y,top,floors,fh,doors:[{ox,oz,ix,iz}],spots:[[x,y,z]],tier}
const WALL = ['#cfc6b4', '#bfb39b', '#a9b3a6', '#c9b8a0', '#b7a891', '#d6cdb9', '#9da7a8', '#c2a98a', '#e0d6c2', '#a8a08e', '#b9c0b0', '#d2bfa0'];
const ROOF = ['#7e3a2a', '#6e3424', '#8a4a32', '#5e4030', '#4c5056', '#3e463f', '#74422c'];
const WT = 0.25;
// parede com aberturas (portas e janelas). axis 'x' = parede corre no eixo x
function wallRun(axis, c0, c1, a0, a1, y0, y1, ops, color) {
  ops = ops.filter(o => o.a > a0 + 0.1 && o.b < a1 - 0.1).sort((p, q) => p.a - q.a);
  const put = (a, b, ya, yb) => { if (b - a < 0.02 || yb - ya < 0.02) return; if (axis === 'x') addBox(a, ya, c0, b, yb, c1, color); else addBox(c0, ya, a, c1, yb, b, color); };
  let cur = a0;
  for (const o of ops) {
    if (o.a < cur) continue;
    put(cur, o.a, y0, y1); put(o.a, o.b, y0, o.lo); put(o.a, o.b, o.hi, y1); cur = o.b;
    // moldura: peitoril e verga brancos (janela) ou batente de madeira (porta)
    const fr = (a, b, ya, yb, col) => { if (axis === 'x') addBox(a, ya, c0 - 0.06, b, yb, c1 + 0.06, col, { nocol: true }); else addBox(c0 - 0.06, ya, a, c1 + 0.06, yb, b, col, { nocol: true }); };
    if (o.lo > y0 + 0.1) { const cm = (c0 + c1) / 2; if (axis === 'x') GLASS.p.push([o.a, o.lo, cm, o.b, o.hi, cm]); else GLASS.p.push([cm, o.lo, o.a, cm, o.hi, o.b]);
      const km = CUR_MAT; CUR_MAT = 0; fr(o.a - 0.1, o.b + 0.1, o.lo - 0.09, o.lo + 0.03, '#fbfaf5'); fr(o.a - 0.1, o.b + 0.1, o.hi - 0.03, o.hi + 0.09, '#fbfaf5'); fr(o.a - 0.06, o.a + 0.03, o.lo, o.hi, '#fbfaf5'); fr(o.b - 0.03, o.b + 0.06, o.lo, o.hi, '#fbfaf5'); CUR_MAT = km; }
    else if (o.hi - o.lo < 3) { fr(o.a - 0.1, o.b + 0.1, o.hi - 0.04, o.hi + 0.12, '#8d5a34'); fr(o.a - 0.1, o.a + 0.04, o.lo, o.hi, '#8d5a34'); fr(o.b - 0.04, o.b + 0.1, o.lo, o.hi, '#8d5a34'); }
  }
  put(cur, a1, y0, y1);
}
function slabWithHole(x0, z0, x1, z1, y0, y1, hole, color) {
  const B = { bot: true }; // face de baixo também: visto do andar de baixo é o teto (sem ela, dava para ver através)
  if (!hole) { addBox(x0, y0, z0, x1, y1, z1, color, B); return; }
  const [hx0, hz0, hx1, hz1] = hole;
  addBox(x0, y0, z0, x1, y1, hz0, color, B); addBox(x0, y0, hz1, x1, y1, z1, color, B);
  addBox(x0, y0, hz0, hx0, y1, hz1, color, B); addBox(hx1, y0, hz0, x1, y1, hz1, color, B);
}
function building(o) {
  const w = o.w, d = o.d, x0 = o.x - w / 2, x1 = o.x + w / 2, z0 = o.z - d / 2, z1 = o.z + d / 2;
  const wm = o.wallMat != null ? o.wallMat : (o.roof === 'gable' ? (WR() < 0.35 ? 1 : 0) : (WR() < 0.5 ? 3 : 1));
  const fh = o.fh || 3.2, floors = o.floors || 1, col = wm === 1 && !o.col ? wpk(['#8e4a36', '#7f4330', '#93573c', '#7a4c3a', '#8a5a44']) : o.col || wpk(WALL), gy = o.stilt != null ? o.stilt - 0.15 : o.gy != null ? o.gy : groundH(o.x, o.z);
  const y0 = gy + 0.15, top = y0 + floors * fh;
  const B = { x0, z0, x1, z1, y: y0, top, floors, fh, doors: [], spots: [], tier: o.tier || 1 };
  if (o.stilt != null) { // palafita: pilares de madeira até o fundo e uma varanda em volta
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, z0], [(x0 + x1) / 2, z1]]) addBox(px - 0.18, Math.min(groundH(px, pz), 0) - 1, pz - 0.18, px + 0.18, y0 - 0.15, pz + 0.18, '#5e4129', { mat: 4 });
    addBox(x0 - 1.4, y0 - 0.3, z0 - 1.4, x1 + 1.4, y0, z1 + 1.4, '#8a6340', { mat: 4 });
  } else addBox(x0 - 0.3, gy - 2, z0 - 0.3, x1 + 0.3, y0, z1 + 0.3, '#9c958a', { mat: 3 }); // base
  if (fh < 4) addBox(x0 + WT, y0 - 0.02, z0 + WT, x1 - WT, y0 + 0.01, z1 - WT, '#a8784e', { mat: 4, nocol: true }); // assoalho
  CUR_MAT = wm;
  const dw = o.doorW || 1.4, sides = o.doors || ['s'];
  // escada: faixas encostadas na parede norte
  const st = floors > 1 || o.roofAccess, SA = z0 + WT, SB = SA + 1.2, SC = SB + 1.2, xs = x0 + WT + 0.6, L = 3.6, rise = fh / 10;
  for (let k = 0; k < floors; k++) {
    const fy = y0 + k * fh, ops = { n: [], s: [], e: [], w: [] };
    // janelas
    for (const s of ['n', 's', 'e', 'w']) {
      const len = s === 'n' || s === 's' ? w : d, a0 = s === 'n' || s === 's' ? x0 : z0;
      const nwin = Math.max(1, Math.floor(len / 3.6));
      for (let i = 0; i < nwin; i++) { const c = a0 + (i + 0.5) * len / nwin; if (!o.noWin) ops[s].push({ a: c - 0.6, b: c + 0.6, lo: fy + 1.0, hi: fy + 2.1 }); }
    }
    if (k === 0) for (const s of sides) {
      const len = s === 'n' || s === 's' ? w : d, a0 = s === 'n' || s === 's' ? x0 : z0, c = a0 + len * (o.doorAt || 0.5);
      ops[s] = ops[s].filter(op => op.b < c - dw / 2 - 0.3 || op.a > c + dw / 2 + 0.3);
      ops[s].push({ a: c - dw / 2, b: c + dw / 2, lo: fy, hi: fy + Math.min(fh - 0.4, o.doorH || 2.3) });
      if (s === 's') B.doors.push({ ox: c, oz: z1 + 1.6, ix: c, iz: z1 - 1.8 });
      if (s === 'n') B.doors.push({ ox: c, oz: z0 - 1.6, ix: c, iz: z0 + 1.8 });
      if (s === 'e') B.doors.push({ ox: x1 + 1.6, oz: c, ix: x1 - 1.8, iz: c });
      if (s === 'w') B.doors.push({ ox: x0 - 1.6, oz: c, ix: x0 + 1.8, iz: c });
    }
    const wy1 = fy + fh;
    wallRun('x', z0, z0 + WT, x0, x1, fy, wy1, ops.n, col); wallRun('x', z1 - WT, z1, x0, x1, fy, wy1, ops.s, col);
    wallRun('z', x0, x0 + WT, z0 + WT, z1 - WT, fy, wy1, ops.w, col); wallRun('z', x1 - WT, x1, z0 + WT, z1 - WT, fy, wy1, ops.e, col);
    // piso do andar de cima (com buraco da escada)
    if (k > 0) {
      const hole = (k - 1) % 2 === 0 ? [xs - 0.1, SA, xs + L + 0.1, SB] : [xs - 0.1, SB, xs + L + 0.1, SC];
      CUR_MAT = 4; slabWithHole(x0 + WT, z0 + WT, x1 - WT, z1 - WT, fy - 0.22, fy, hole, '#a8784e'); CUR_MAT = wm;
    }
    // degraus para o próximo andar (ou para o terraço)
    if (st && (k < floors - 1 || o.roofAccess)) {
      const ascending = k % 2 === 0, za = ascending ? SA : SB, zb = ascending ? SB : SC;
      for (let i = 0; i < 10; i++) {
        const xa = ascending ? xs + i * L / 10 : xs + L - (i + 1) * L / 10;
        addBox(xa, fy, za, xa + L / 10, fy + (i + 1) * rise, zb, '#b8afa0');
      }
    }
    // móveis (casas e sobrados): sofá, cama, estante, geladeira encostados nas paredes e mesa no meio — também servem de cobertura
    const furn = []; let part = null;
    // prédios grandes: cada andar tem corredor e salas (escritório com mesa e cadeira, ou cozinha com balcão)
    if (fh < 4 && !o.noFurn && w >= 11.5 && d >= 9.5) {
      const zS2 = st ? SC + 0.35 : z0 + WT + 0.1; let zc = Math.round(((zS2 + z1 - WT) / 2 + 0.6) * 10) / 10;
      if (k === 0 && (sides.includes('e') || sides.includes('w')) && Math.abs(zc - (z0 + d / 2)) < 1.3) zc = z0 + d / 2 + 1.4;
      const xa = x0 + WT, xb = x1 - WT, n = w >= 15 ? 3 : 2, cw = (xb - xa) / n, zr = z1 - WT;
      const ops = []; for (let i = 0; i < n; i++) { const c = xa + cw * (i + 0.5) + (i % 2 ? 0.7 : -0.7); ops.push({ a: c - 0.55, b: c + 0.55, lo: fy, hi: fy + 2.2 }); }
      const keep = CUR_MAT; CUR_MAT = 0;
      wallRun('x', zc - 0.08, zc + 0.08, xa, xb, fy, fy + fh - 0.05, ops, '#e6e0d4');
      for (let i = 1; i < n; i++) { const cx = xa + cw * i; wallRun('z', cx - 0.08, cx + 0.08, zc + 0.08, zr, fy, fy + fh - 0.05, [], '#e6e0d4'); }
      CUR_MAT = keep; part = { zc, xa, cw, n };
      for (let i = 0; i < n; i++) {
        const rx = xa + cw * (i + 0.5), rz = (zc + zr) / 2 + 0.2, frontDoor = k === 0 && sides.includes('s') && Math.abs(rx - (x0 + w * (o.doorAt || 0.5))) < cw / 2 + 0.8;
        if (WR() < 0.6 || frontDoor) { // escritório
          addBox(rx - 0.8, fy + 0.72, rz - 0.4, rx + 0.8, fy + 0.78, rz + 0.4, '#d9d4c8', { nocol: true }); addCollider(rx - 0.8, fy, rz - 0.4, rx + 0.8, fy + 0.78, rz + 0.4);
          for (const ox of [-0.75, 0.7]) addBox(rx + ox, fy, rz - 0.35, rx + ox + 0.05, fy + 0.72, rz + 0.35, '#7a7a7a', { nocol: true });
          addBox(rx - 0.25, fy + 0.78, rz - 0.3, rx + 0.25, fy + 1.1, rz - 0.26, '#22252a', { nocol: true }); // monitor
          addBox(rx - 0.25, fy, rz + 0.55, rx + 0.25, fy + 0.48, rz + 1.0, '#2f3640'); addBox(rx - 0.25, fy + 0.48, rz + 0.95, rx + 0.25, fy + 1.05, rz + 1.02, '#2f3640', { nocol: true });
          furn.push([rx - 0.8, rz - 0.4, rx + 0.8, rz + 1.0]);
        } else { // cozinha: balcão encostado na parede do fundo
          addBox(rx - cw / 2 + 0.5, fy, zr - 0.62, rx + cw / 2 - 0.5, fy + 0.9, zr, '#d8d2c4'); addBox(rx - cw / 2 + 0.5, fy + 0.9, zr - 0.65, rx + cw / 2 - 0.5, fy + 0.95, zr, '#5a5a5a', { nocol: true });
          furn.push([rx - cw / 2 + 0.5, zr - 0.62, rx + cw / 2 - 0.5, zr]);
        }
      }
    }
    if (!part && fh < 4 && !o.noFurn && w >= 6 && d >= 6) {
      const zS = st ? SC + 0.35 : z0 + WT + 0.1, zE = z1 - WT - (k === 0 && sides.includes('s') ? 0.2 : 0.1);
      const KINDS = { sofa: [0.85, 2.0, 0.8, '#5a6e8a'], bed: [1.5, 2.0, 0.55, '#e6e1d6'], shelf: [0.4, 1.3, 1.9, '#7a5233'], fridge: [0.7, 0.7, 1.8, '#dedcd6'], tv: [0.45, 1.4, 0.6, '#3a3632'] };
      const wallPiece = (side) => {
        const kn = wpk(k > 0 ? ['bed', 'bed', 'shelf', 'sofa'] : ['sofa', 'shelf', 'fridge', 'tv', 'sofa']), [dep, len, h, c] = KINDS[kn];
        const lo = zS + len / 2 + 0.2, hi = zE - len / 2 - 1.3; if (hi <= lo) return;
        const zc = wr(lo, hi), xa = side === 'e' ? x1 - WT - dep : x0 + WT, xb = xa + dep;
        furn.push([xa, zc - len / 2, xb, zc + len / 2]);
        if (kn === 'bed') { addBox(xa, fy, zc - len / 2, xb, fy + 0.32, zc + len / 2, '#7a5233', { mat: 4 }); addBox(xa + 0.05, fy + 0.32, zc - len / 2 + 0.05, xb - 0.05, fy + h, zc + len / 2 - 0.05, c, { nocol: true }); addBox(xa + 0.15, fy + h, zc + len / 2 - 0.55, xb - 0.15, fy + h + 0.12, zc + len / 2 - 0.15, '#f4f2ee', { nocol: true }); }
        else if (kn === 'sofa') { addBox(xa, fy, zc - len / 2, xb, fy + 0.45, zc + len / 2, c); const bx0 = side === 'e' ? xb - 0.22 : xa, bx1 = bx0 + 0.22; addBox(bx0, fy + 0.45, zc - len / 2, bx1, fy + h, zc + len / 2, c, { nocol: true }); }
        else addBox(xa, fy, zc - len / 2, xb, fy + h, zc + len / 2, c, kn === 'shelf' ? { mat: 4 } : undefined);
      };
      if (!(k === 0 && sides.includes('e'))) wallPiece('e');
      if (!(k === 0 && sides.includes('w')) && (!st || w > 9)) wallPiece('w');
      if (w >= 8 && d >= 7) { // mesa no meio
        const tx = (x0 + x1) / 2 + wr(-0.6, 0.6), tz = (Math.max(zS, z0 + 2) + zE) / 2 + wr(-0.5, 0.5);
        if (!furn.some(f => tx > f[0] - 1.2 && tx < f[2] + 1.2)) { addBox(tx - 0.7, fy + 0.7, tz - 0.45, tx + 0.7, fy + 0.76, tz + 0.45, '#8a5e3a', { mat: 4 }); for (const [ox, oz] of [[-0.6, -0.36], [0.56, -0.36], [-0.6, 0.32], [0.56, 0.32]]) addBox(tx + ox, fy, tz + oz, tx + ox + 0.05, fy + 0.7, tz + oz + 0.05, '#6a4528', { nocol: true }); addCollider(tx - 0.7, fy, tz - 0.45, tx + 0.7, fy + 0.76, tz + 0.45); furn.push([tx - 0.7, tz - 0.45, tx + 0.7, tz + 0.45]); }
      }
    }
    // pontos de saque deste andar (fora dos móveis)
    const n = Math.max(2, Math.floor(w * d / 26));
    for (let i = 0; i < n; i++) {
      const px = wr(x0 + 0.8, x1 - 0.8), pz = wr(st ? SC + 0.4 : z0 + 0.8, z1 - 0.8);
      if (furn.some(f => px > f[0] - 0.35 && px < f[2] + 0.35 && pz > f[1] - 0.35 && pz < f[3] + 0.35)) continue;
      if (part && (Math.abs(pz - part.zc) < 0.5 || pz > part.zc && Array.from({ length: part.n - 1 }, (_, i) => part.xa + part.cw * (i + 1)).some(cx => Math.abs(px - cx) < 0.5))) continue;
      if (pz < z1 - 0.5) B.spots.push([px, fy + 0.02, pz]);
    }
  }
  // teto / telhado
  if (o.roof === 'gable') {
    addBox(x0, top - 0.2, z0, x1, top, z1, '#efe6d8', { bot: true }); // forro da casa (visto de dentro)
    addGable(x0, z0, x1, z1, top, Math.min(w, d) * 0.32, o.roofCol || wpk(ROOF));
  } else {
    const k = floors; const hole = o.roofAccess ? ((k - 1) % 2 === 0 ? [xs - 0.1, SA, xs + L + 0.1, SB] : [xs - 0.1, SB, xs + L + 0.1, SC]) : null;
    slabWithHole(x0, z0, x1, z1, top - 0.22, top, hole, o.roofCol || '#e9e4da');
    const ph = o.roofAccess ? 0.9 : 0.5, pc = o.trim || '#ffffff';
    addBox(x0, top, z0, x1, top + ph, z0 + 0.2, pc); addBox(x0, top, z1 - 0.2, x1, top + ph, z1, pc);
    addBox(x0, top, z0 + 0.2, x0 + 0.2, top + ph, z1 - 0.2, pc); addBox(x1 - 0.2, top, z0 + 0.2, x1, top + ph, z1 - 0.2, pc);
    if (o.roofAccess) for (let i = 0; i < 2; i++) B.spots.push([wr(x0 + 1, x1 - 1), top + 0.02, wr(SC + 0.5, z1 - 1)]);
  }
  // faixa colorida no topo das paredes (acabamento)
  if (o.trim && o.roof !== 'gable') addBox(x0 - 0.05, top - 0.5, z0 - 0.05, x1 + 0.05, top - 0.22, z1 + 0.05, o.trim, { nocol: true });
  CUR_MAT = 0;
  BLD.push(B); return B;
}
// caixas/containers de cobertura
const CONT = ['#8a3a32', '#3e6b6a', '#9a7a3a', '#4c5c72', '#6b7552', '#7a4a3a', '#5a6670'];
function container(x, z, along, stack) {
  const gy = groundH(x, z), w = along === 'x' ? 6 : 2.4, d = along === 'x' ? 2.4 : 6;
  for (let s = 0; s < (stack || 1); s++) addBox(x - w / 2, gy + s * 2.6, z - d / 2, x + w / 2, gy + (s + 1) * 2.6, z + d / 2, wpk(CONT), { mat: 5 });
}
function crateBox(x, z, s) { const gy = groundH(x, z); addBox(x - s / 2, gy, z - s / 2, x + s / 2, gy + s, z + s / 2, '#b07d48', { mat: 4 }); }

const FOOT = []; // áreas ocupadas (para não sobrepor prédios e árvores)
function free(x, z, w, d, m = 3) { return !FOOT.some(f => Math.abs(f.x - x) < (f.w + w) / 2 + m && Math.abs(f.z - z) < (f.d + d) / 2 + m) && roadDist(x, z) > Math.max(w, d) / 2 + 3; }
function place(t, w, d, tries, fn) {
  for (let k = 0; k < tries; k++) {
    const a = WR() * Math.PI * 2, r = Math.sqrt(WR()) * (t.r - Math.max(w, d) / 2 - 4);
    const x = Math.round(t.x + Math.cos(a) * r), z = Math.round(t.z + Math.sin(a) * r);
    if (!free(x, z, w, d)) continue;
    FOOT.push({ x, z, w, d }); fn(x, z); return true;
  }
  return false;
}
function doorsToward(t, x, z) { const dx = t.x - x, dz = t.z - z; return Math.abs(dx) > Math.abs(dz) ? [dx > 0 ? 'e' : 'w'] : [dz > 0 ? 's' : 'n']; }
const house = (t, x, z, w, d) => building({ x, z, w, d, floors: 1, roof: 'gable', doors: doorsToward(t, x, z), tier: t.tier });
const house2 = (t, x, z, w, d) => building({ x, z, w, d, floors: 2, roof: WR() < 0.5 ? 'gable' : 'flat', trim: wpk(WALL), doors: doorsToward(t, x, z), tier: t.tier });
const apart = (t, x, z, w, d, f) => building({ x, z, w, d, floors: f, roofAccess: true, trim: wpk(ROOF), doors: doorsToward(t, x, z), tier: t.tier });
const warehouse = (t, x, z, w, d) => building({ x, z, w, d, floors: 1, fh: 6, doorW: 3.4, doorH: 4.2, doors: WR() < 0.5 ? ['n', 's'] : ['e', 'w'], noWin: true, wallMat: 5, col: wpk(['#8ecae6', '#ffb703', '#e5e5e5', '#adb5bd', '#f28482']), trim: '#3d405b', tier: t.tier });

// enfeites e lugares especiais do Balneário
function balExtras(t) {
  const gy = t.h;
  if (t.kind === 'city' || t.kind === 'resort' || t.kind === 'market') {
    // praça num quarteirão: chafariz, bancos, canteiros e postes
    const px = t.x + (t.big ? 25 : 18), pz = t.z + (t.big ? 25 : 18);
    if (free(px, pz, 16, 16, 1)) {
      FOOT.push({ x: px, z: pz, w: 16, d: 16 });
      addBox(px - 8, gy, pz - 8, px + 8, gy + 0.08, pz + 8, '#cfc8b8', { nocol: true, mat: 3 });
      addBox(px - 2.6, gy, pz - 2.6, px + 2.6, gy + 0.6, pz + 2.6, '#bdb5a3', { mat: 3 }); addBox(px - 2.2, gy + 0.45, pz - 2.2, px + 2.2, gy + 0.55, pz + 2.2, '#4fa3c7', { nocol: true });
      addBox(px - 0.35, gy, pz - 0.35, px + 0.35, gy + 2.2, pz + 0.35, '#d8d2c4'); addBox(px - 0.9, gy + 2.2, pz - 0.9, px + 0.9, gy + 2.4, pz + 0.9, '#d8d2c4', { nocol: true });
      for (const [bx2, bz2, ax] of [[-6, 0, 'z'], [6, 0, 'z'], [0, -6, 'x'], [0, 6, 'x']]) { const L = 1.8; if (ax === 'x') addBox(px + bx2 - L, gy, pz + bz2 - 0.3, px + bx2 + L, gy + 0.45, pz + bz2 + 0.3, '#7a5233', { mat: 4 }); else addBox(px + bx2 - 0.3, gy, pz + bz2 - L, px + bx2 + 0.3, gy + 0.45, pz + bz2 + L, '#7a5233', { mat: 4 }); }
      for (const [cx2, cz2] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { addBox(px + cx2 - 1, gy, pz + cz2 - 1, px + cx2 + 1, gy + 0.5, pz + cz2 + 1, '#9c958a', { mat: 3 }); addBox(px + cx2 - 0.8, gy + 0.5, pz + cz2 - 0.8, px + cx2 + 0.8, gy + 1.5, pz + cz2 + 0.8, '#3f7a35', { nocol: true }); }
    }
    // carros estacionados e pontos de ônibus ao longo das avenidas (cobertura)
    for (let i = 0; i < (t.big ? 14 : 6); i++) place(t, 2.2, 4.6, 4, (x, z) => { const g2 = groundH(x, z), c = wpk(['#c0392b', '#2c3e50', '#ecf0f1', '#f1c40f', '#16a085', '#7f8c8d']), al = WR() < 0.5; const w2 = al ? 4.4 : 2, d2 = al ? 2 : 4.4; addBox(x - w2 / 2, g2 + 0.3, z - d2 / 2, x + w2 / 2, g2 + 1.0, z + d2 / 2, c); addBox(x - w2 / 2 * 0.6, g2 + 1.0, z - d2 / 2 * 0.6, x + w2 / 2 * 0.6, g2 + 1.5, z + d2 / 2 * 0.6, '#9fb4c0', { nocol: true }); });
  }
  if (t.kind === 'resort') { // piscina com espreguiçadeiras e guarda-sóis
    const px = t.x - 20, pz = t.z - 18;
    if (free(px, pz, 22, 14, 1)) {
      FOOT.push({ x: px, z: pz, w: 22, d: 14 });
      addBox(px - 11, gy, pz - 7, px + 11, gy + 0.1, pz + 7, '#e8e1d2', { nocol: true, mat: 3 });
      addBox(px - 8, gy + 0.1, pz - 4, px + 8, gy + 0.14, pz + 4, '#38b6d8', { nocol: true });
      for (const sd of [-1, 1]) addBox(px - 8.4, gy, pz + sd * 4.2 - 0.2, px + 8.4, gy + 0.35, pz + sd * 4.2 + 0.2, '#ffffff', { mat: 3 });
      for (let i = -3; i <= 3; i++) { const ux = px + i * 2.6; addBox(ux - 0.4, gy, pz + 5.2, ux + 0.4, gy + 0.4, pz + 6.6, '#f4f1ea'); addBox(ux - 0.05, gy, pz + 6.4, ux + 0.05, gy + 2.3, pz + 6.5, '#ddd', { nocol: true }); addBox(ux - 1.1, gy + 2.3, pz + 5.4, ux + 1.1, gy + 2.45, pz + 7.5, wpk(['#ff6b6b', '#ffd93d', '#4ecdc4', '#ffffff']), { nocol: true }); }
    }
  }
  if (t.kind === 'market') { // barracas com toldo colorido
    for (let i = 0; i < 12; i++) place(t, 3.4, 2.6, 4, (x, z) => { const g2 = groundH(x, z); addBox(x - 1.6, g2, z - 0.5, x + 1.6, g2 + 0.95, z + 0.5, '#8a6340', { mat: 4 }); for (const [ox, oz] of [[-1.6, -1.2], [1.5, -1.2], [-1.6, 1.1], [1.5, 1.1]]) addBox(x + ox, g2, z + oz, x + ox + 0.1, g2 + 2.3, z + oz + 0.1, '#6a4a2e', { nocol: true }); addBox(x - 1.8, g2 + 2.3, z - 1.4, x + 1.8, g2 + 2.42, z + 1.4, wpk(['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#457b9d']), { nocol: true }); });
  }
  if (t.kind === 'stilt') { // casas sobre palafitas no mar, com passarelas até a areia
    const a0 = Math.atan2(t.z, t.x); let made = 0;
    for (let k = 0; k < 200 && made < 16; k++) {
      const an = a0 + (WR() - 0.5) * 1.8, r = 20 + WR() * (t.r + 35), x = Math.round(t.x + Math.cos(an) * r), z = Math.round(t.z + Math.sin(an) * r), h0 = groundH(x, z);
      if (h0 > 0.8 || h0 < -9 || !free(x, z, 9, 8, 3)) continue;
      FOOT.push({ x, z, w: 9, d: 8 }); made++;
      const dr = doorsToward(t, x, z)[0], deck = 2.2;
      building({ x, z, w: 7, d: 6, floors: 1, roof: 'gable', stilt: deck, roofCol: wpk(['#6b4f2a', '#8a6a3a', '#5a4632']), col: wpk(['#a67c52', '#9c6b43', '#b88b5a', '#c49a6c']), wallMat: 4, doors: [dr], tier: 1 });
      // passarela até a terra firme
      const dx = dr === 'e' ? 1 : dr === 'w' ? -1 : 0, dz = dr === 's' ? 1 : dr === 'n' ? -1 : 0;
      let sx = x + dx * 4.4, sz = z + dz * 4;
      for (let i = 0; i < 30; i++) {
        const bx0 = Math.min(sx, sx + dx * 2) - (dx ? 0 : 0.9), bx1 = Math.max(sx, sx + dx * 2) + (dx ? 0 : 0.9), bz0 = Math.min(sz, sz + dz * 2) - (dz ? 0 : 0.9), bz1 = Math.max(sz, sz + dz * 2) + (dz ? 0 : 0.9);
        addBox(bx0, deck - 0.25, bz0, bx1, deck, bz1, '#8a6340', { mat: 4 });
        if (i % 2 === 0) addBox(sx - 0.12, Math.min(groundH(sx, sz), 0) - 1, sz - 0.12, sx + 0.12, deck - 0.25, sz + 0.12, '#5e4129', { nocol: true });
        sx += dx * 2; sz += dz * 2; if (groundH(sx, sz) > deck - 0.5) break;
      }
    }
    for (let i = 0; i < 6; i++) place(t, 3, 2, 4, (x, z) => { const g2 = groundH(x, z); addBox(x - 1.5, g2, z - 0.6, x + 1.5, g2 + 0.7, z + 0.6, '#3d6e8c', { mat: 5 }); }); // barcos na areia
  }
  if (t.kind === 'ruins') { // templo em degraus no alto do morro, colunas e muros quebrados
    const st = '#8f8a78', st2 = '#7d7866', moss = '#6f7a5a';
    FOOT.push({ x: t.x, z: t.z, w: 32, d: 32 });
    [[15, 0, 2.2], [11, 2.2, 2.2], [7, 4.4, 2.2]].forEach(([hw, y, h], i) => addBox(t.x - hw, gy + y - (i ? 0 : 1), t.z - hw, t.x + hw, gy + y + h, t.z + hw, i % 2 ? st2 : st, { mat: 3 }));
    for (let i = 0; i < 15; i++) { const y = gy + i * 0.44, zz = t.z + 15 + 3.2 - i * (8.4 / 15); addBox(t.x - 2.2, gy - 1, zz - 0.6, t.x + 2.2, y + 0.44, zz, '#a39d8a', { mat: 3 }); } // escadaria
    building({ x: t.x, z: t.z, w: 8, d: 8, floors: 1, gy: gy + 6.6, col: '#a39d8a', trim: '#6d685a', wallMat: 3, doors: ['s', 'n'], noFurn: true, tier: 3 });
    for (let k = 0; k < 14; k++) { const an = k / 14 * Math.PI * 2, x = t.x + Math.cos(an) * 26, z = t.z + Math.sin(an) * 26, g2 = groundH(x, z), h = k % 3 === 0 ? 1.6 + WR() * 1.5 : 5.5; addBox(x - 0.7, g2 - 0.5, z - 0.7, x + 0.7, g2 + h, z + 0.7, WR() < 0.4 ? moss : st, { mat: 3 }); if (h > 5) addBox(x - 0.95, g2 + h, z - 0.95, x + 0.95, g2 + h + 0.45, z + 0.95, st2, { mat: 3 }); }
    for (let k = 0; k < 10; k++) { const an = WR() * Math.PI * 2, r = 36 + WR() * 24, x = t.x + Math.cos(an) * r, z = t.z + Math.sin(an) * r, g2 = groundH(x, z), L = 3 + WR() * 5, h = 1 + WR() * 2.2; if (!free(x, z, L, 1, 1)) continue; FOOT.push({ x, z, w: L, d: 1 }); if (WR() < 0.5) addBox(x - L / 2, g2 - 0.3, z - 0.4, x + L / 2, g2 + h, z + 0.4, WR() < 0.5 ? moss : st2, { mat: 3 }); else addBox(x - 0.4, g2 - 0.3, z - L / 2, x + 0.4, g2 + h, z + L / 2, WR() < 0.5 ? moss : st2, { mat: 3 }); }
    for (let k = 0; k < 4; k++) { const an = k / 4 * Math.PI * 2 + 0.6, x = Math.round(t.x + Math.cos(an) * 44), z = Math.round(t.z + Math.sin(an) * 44); if (free(x, z, 7, 7)) { FOOT.push({ x, z, w: 7, d: 7 }); building({ x, z, w: 6.5, d: 6.5, floors: 1, col: '#9a947f', trim: '#6d685a', wallMat: 3, doors: doorsToward(t, x, z), noFurn: true, tier: 3 }); } }
  }
}
(function buildTowns() {
  for (const t of TOWNS) {
    const n = t.big ? 30 : { village: 22, city: 20, port: 13, military: 11, farm: 10, factory: 11, resort: 9, market: 14, stilt: 0, ruins: 0 }[t.kind];
    let made = 0;
    for (let i = 0; i < n * 3 && made < n; i++) {
      if (t.kind === 'village') { const two = WR() < 0.35, w = two ? 10 : 8 + Math.round(WR() * 2), d = two ? 8 : 7; if (place(t, w, d, 5, (x, z) => (two ? house2 : house)(t, x, z, w, d))) made++; }
      else if (t.kind === 'city') {
        const r = WR();
        if (t.big && r < 0.3) { const f = 5 + Math.floor(WR() * 3), w2 = 14, d2 = 12; if (place(t, w2, d2, 6, (x, z) => building({ x, z, w: w2, d: d2, floors: f, roofAccess: true, col: wpk(['#e8e2d6', '#d4dde3', '#f0e6cf', '#c9d6cf', '#e3d3c3']), trim: wpk(['#2f6f8f', '#b5543c', '#3d405b', '#6a994e']), wallMat: 3, doors: doorsToward(t, x, z), tier: 3 }))) made++; } // prédios altos
        else if (r < 0.5) { const f = 3 + (WR() < 0.5 ? 1 : 0); if (place(t, 12, 12, 5, (x, z) => apart(t, x, z, 12, 12, f))) made++; }
        else if (r < 0.8) { if (place(t, 10, 8, 5, (x, z) => house2(t, x, z, 10, 8))) made++; }
        else if (place(t, 8, 7, 5, (x, z) => house(t, x, z, 8, 7))) made++;
      } else if (t.kind === 'resort') { // hotéis brancos de vários andares e chalés
        if (made < 4) { const f = 3 + Math.floor(WR() * 3); if (place(t, 16, 11, 6, (x, z) => building({ x, z, w: 16, d: 11, floors: f, roofAccess: true, col: '#f4efe6', trim: wpk(['#2ec4b6', '#ff9f1c', '#e71d36', '#3a86ff']), wallMat: 3, doors: doorsToward(t, x, z), tier: 2 }))) made++; }
        else if (place(t, 8, 7, 5, (x, z) => building({ x, z, w: 8, d: 7, floors: 1, roof: 'gable', roofCol: wpk(['#c2703d', '#d9a441', '#8a5a2b']), col: wpk(['#f7e8c9', '#ffffff', '#e9f5f2']), doors: doorsToward(t, x, z), tier: 2 }))) made++;
      } else if (t.kind === 'market') { // sobrados coloridos com loja embaixo
        if (place(t, 10, 8, 5, (x, z) => building({ x, z, w: 10, d: 8, floors: 2, roof: 'flat', col: wpk(['#f2c14e', '#f78154', '#4d9078', '#b4436c', '#5fad56', '#e8d5b7']), trim: '#ffffff', doors: doorsToward(t, x, z), tier: 2 }))) made++;
      } else if (t.kind === 'port') {
        if (made < 4) { if (place(t, 22, 14, 6, (x, z) => warehouse(t, x, z, 22, 14))) made++; }
        else if (WR() < 0.5) { if (place(t, 7, 7, 5, (x, z) => container(x, z, WR() < 0.5 ? 'x' : 'z', 1 + (WR() < 0.4 ? 1 : 0)))) made++; }
        else if (place(t, 8, 7, 5, (x, z) => house(t, x, z, 8, 7))) made++;
      } else if (t.kind === 'military') {
        if (made < 4) { if (place(t, 18, 8, 6, (x, z) => building({ x, z, w: 18, d: 8, floors: 1, wallMat: 3, col: '#9cae7a', trim: '#4f5d2f', doors: doorsToward(t, x, z), tier: 3 }))) made++; }
        else if (made < 6) { if (place(t, 6, 6, 6, (x, z) => building({ x, z, w: 6.5, d: 6, floors: 3, roofAccess: true, wallMat: 3, col: '#7d8f69', trim: '#3a4a26', doors: ['s'], tier: 3 }))) made++; }
        else if (place(t, 22, 14, 6, (x, z) => warehouse(t, x, z, 22, 14))) made++;
      } else if (t.kind === 'farm') {
        if (made === 0) { if (place(t, 20, 12, 6, (x, z) => building({ x, z, w: 20, d: 12, floors: 1, fh: 5.5, roof: 'gable', roofCol: '#7f1d1d', col: '#b3202a', wallMat: 4, doorW: 3.2, doorH: 3.8, doors: ['n', 's'], noWin: true, tier: 1 }))) made++; }
        else if (made < 3) { if (place(t, 4, 4, 6, (x, z) => { const gy = groundH(x, z); addBox(x - 2, gy, z - 2, x + 2, gy + 9, z + 2, '#d9d9d9', { mat: 5 }); addBox(x - 2.2, gy + 9, z - 2.2, x + 2.2, gy + 9.6, z + 2.2, '#a4161a'); })) made++; }
        else if (place(t, 9, 8, 6, (x, z) => (WR() < 0.5 ? house2 : house)(t, x, z, 9, 8))) made++;
      } else if (t.kind === 'factory') {
        if (made < 2) { if (place(t, 24, 15, 6, (x, z) => warehouse(t, x, z, 24, 15))) made++; }
        else if (made === 2) { if (place(t, 12, 10, 6, (x, z) => apart(t, x, z, 12, 10, 3))) made++; }
        else if (made === 3) { if (place(t, 4, 4, 6, (x, z) => { const gy = groundH(x, z); addBox(x - 1.6, gy, z - 1.6, x + 1.6, gy + 28, z + 1.6, '#b5543c', { mat: 1 }); addBox(x - 1.8, gy + 24, z - 1.8, x + 1.8, gy + 25, z + 1.8, '#ffffff', { nocol: true }); })) made++; }
        else if (place(t, 7, 7, 5, (x, z) => container(x, z, WR() < 0.5 ? 'x' : 'z', 1 + (WR() < 0.5 ? 1 : 0)))) made++;
      }
    }
    // coberturas soltas (caixas de madeira) entre as casas
    for (let i = 0; i < 10; i++) place(t, 2, 2, 3, (x, z) => crateBox(x, z, 1.2 + WR() * 0.4));
    if (MAPID === 'bal') balExtras(t);
    if (t.kind === 'military') { // muro com portões
      const gy = t.h, r = t.r - 4, hW = 2.6, g = 7;
      const seg = (ax, az, bx2, bz) => { if (Math.abs(ax - bx2) > 0.1) addBox(Math.min(ax, bx2), gy, az - 0.3, Math.max(ax, bx2), gy + hW, az + 0.3, '#c2c5aa', { mat: 3 }); else addBox(ax - 0.3, gy, Math.min(az, bz), ax + 0.3, gy + hW, Math.max(az, bz), '#c2c5aa', { mat: 3 }); };
      for (const s of [-1, 1]) { seg(t.x - r, t.z + s * r, t.x - g, t.z + s * r); seg(t.x + g, t.z + s * r, t.x + r, t.z + s * r); seg(t.x + s * r, t.z - r, t.x + s * r, t.z - g); seg(t.x + s * r, t.z + g, t.x + s * r, t.z + r); }
    }
    if (t.kind === 'port') { // píer entrando no mar
      const a = Math.atan2(t.z, t.x), ex = t.x + Math.cos(a) * (t.r - 10), ez = t.z + Math.sin(a) * (t.r - 10);
      for (let k = 0; k < 12; k++) { const px = ex + Math.cos(a) * k * 6, pz = ez + Math.sin(a) * k * 6; addBox(px - 3, 1.2, pz - 3, px + 3, 1.6, pz + 3, '#a47148', { mat: 4 }); }
    }
  }
  for (const p of LONE) {
    const two = WR() < 0.4; FOOT.push({ x: p.x, z: p.z, w: 11, d: 9 });
    building({ x: p.x, z: p.z, w: two ? 10 : 8, d: two ? 8 : 7, floors: two ? 2 : 1, roof: 'gable', doors: [wpk(['n', 's', 'e', 'w'])], tier: 1 });
  }
})();

// ---------- árvores, arbustos e pedras (instanciados: 1 desenho para todas) ----------
// ---------- campo preenchido: estruturas entre as cidades (cobertura e pontos de interesse, como em todo mapa de tiro) ----------
const DECO = []; // peças só visuais (cercas e postes inclinados), juntadas numa malha só
const ISL_R = MAPID === 'bal' ? 560 : 700;
function landSpot(w, d, o) {
  o = o || {};
  for (let k = 0; k < 60; k++) {
    const x = Math.round(wr(-ISL_R, ISL_R)), z = Math.round(wr(-ISL_R, ISL_R)), h = groundH(x, z);
    if (h < (o.minH || 3) || h > (o.maxH || 70)) continue;
    if (townAt(x, z, o.townPad == null ? 25 : o.townPad) || riverDist(x, z) < 16) continue;
    if (Math.abs(groundH(x + w / 2, z) - groundH(x - w / 2, z)) + Math.abs(groundH(x, z + d / 2) - groundH(x, z - d / 2)) > (o.slope || 3.5)) continue;
    if (!free(x, z, w, d, o.m == null ? 4 : o.m)) continue;
    return [x, z, h];
  }
  return null;
}
const WOOD = ['#8a6340', '#7a5233', '#9c7048', '#6e4a2c'], STONE = ['#8f8a7e', '#7f7b70', '#9a958a', '#857f72'];
function stoneWall(x, z, len, axis, h, gap) { // muro de pedra com falhas (cobertura no campo)
  const gy = groundH(x, z); let a = -len / 2;
  while (a < len / 2) {
    const L = Math.min(len / 2 - a, 3 + WR() * 6), hh = h * (0.6 + WR() * 0.45);
    const x0 = axis === 'x' ? x + a : x - 0.35, x1 = axis === 'x' ? x + a + L : x + 0.35, z0 = axis === 'x' ? z - 0.35 : z + a, z1 = axis === 'x' ? z + 0.35 : z + a + L;
    const g2 = Math.min(groundH(x0, z0), groundH(x1, z1), gy) - 0.3;
    addBox(x0, g2, z0, x1, groundH((x0 + x1) / 2, (z0 + z1) / 2) + hh, z1, wpk(STONE), { mat: 3 });
    a += L + (WR() < (gap || 0.3) ? 1.5 + WR() * 2 : 0);
  }
}
function woodFence(x, z, w, d, gateSide) { // cerca de madeira em volta de um terreno (com porteira)
  const sides = [['x', z - d / 2], ['x', z + d / 2], ['z', x - w / 2], ['z', x + w / 2]];
  sides.forEach(([ax, c], i) => {
    const len = ax === 'x' ? w : d, gate = i === gateSide;
    for (let a = -len / 2; a < len / 2 - 0.1; a += 2.5) {
      if (gate && Math.abs(a + 1.25) < 2.6) continue;
      const px = ax === 'x' ? x + a : c, pz = ax === 'x' ? c : z + a, g2 = groundH(px, pz), L = Math.min(2.5, len / 2 - a);
      addBox(px - 0.08, g2, pz - 0.08, px + 0.08, g2 + 1.15, pz + 0.08, '#6e4a2c', { nocol: true });
      if (ax === 'x') addBox(px, g2 + 0.55, pz - 0.05, px + L, g2 + 0.95, pz + 0.05, '#8a6340', { mat: 4 }); else addBox(px - 0.05, g2 + 0.55, pz, px + 0.05, g2 + 0.95, pz + L, '#8a6340', { mat: 4 });
    }
  });
}
function hayBale(x, z, big) { const g2 = groundH(x, z), r = big ? 0.8 : 0.55; addBox(x - r, g2, z - r * 1.3, x + r, g2 + r * 1.7, z + r * 1.3, '#d8b45a', { mat: 4 }); }
function wreck(x, z) { // carro abandonado (enferrujado)
  const g2 = groundH(x, z), al = WR() < 0.5, w2 = al ? 4.4 : 1.9, d2 = al ? 1.9 : 4.4, c = wpk(['#6b4a35', '#5a5a52', '#7a3a2a', '#4a5560', '#706040']);
  addBox(x - w2 / 2, g2 + 0.25, z - d2 / 2, x + w2 / 2, g2 + 1.0, z + d2 / 2, c);
  addBox(x - w2 / 2 * 0.62, g2 + 1.0, z - d2 / 2 * 0.62, x + w2 / 2 * 0.62, g2 + 1.45, z + d2 / 2 * 0.62, '#3a3e40');
}
(function countryside() {
  const AREA = MAPID === 'bal' ? 0.75 : 1, N = k => Math.round(k * AREA);
  // sítios: casa + celeiro + galpão + cerca + feno + trator
  for (let i = 0; i < N(14); i++) {
    const sp = landSpot(40, 34, { slope: 3, maxH: 45 }); if (!sp) continue; const [x, z] = sp;
    FOOT.push({ x, z, w: 40, d: 34 });
    building({ x: x - 9, z: z - 5, w: 8, d: 7, floors: WR() < 0.3 ? 2 : 1, roof: 'gable', doors: ['s'], tier: 1 });
    building({ x: x + 9, z: z - 4, w: 12, d: 9, floors: 1, fh: 5.5, roof: 'gable', roofCol: '#5a3a2a', col: wpk(['#a8342c', '#8a5a3a', '#9c3a2a']), wallMat: 4, doorW: 3.2, doorH: 3.8, doors: ['s'], noWin: true, noFurn: true, tier: 1 });
    building({ x: x - 10, z: z + 9, w: 5, d: 4, floors: 1, roof: 'gable', col: wpk(WOOD), wallMat: 4, doors: ['e'], noWin: true, noFurn: true, tier: 1 });
    woodFence(x, z, 38, 32, Math.floor(WR() * 4));
    for (let k = 0; k < 5; k++) hayBale(x + wr(2, 16), z + wr(5, 14), WR() < 0.5);
    if (WR() < 0.6) { const g2 = groundH(x + 3, z + 10); addBox(x + 1.8, g2 + 0.4, z + 9, x + 4.2, g2 + 1.6, z + 11.6, '#2f7a3a'); addBox(x + 2, g2, z + 8.6, x + 4, g2 + 1.1, z + 9.2, '#222', { nocol: true }); }
  }
  // ruínas de pedra: contorno de casa sem teto, muros quebrados e entulho
  for (let i = 0; i < N(12); i++) {
    const sp = landSpot(18, 14, { slope: 5 }); if (!sp) continue; const [x, z, h] = sp; FOOT.push({ x, z, w: 18, d: 14 });
    const w = 10 + WR() * 6, d = 8 + WR() * 4;
    for (const [ax, cx, cz, L] of [['x', x, z - d / 2, w], ['x', x, z + d / 2, w], ['z', x - w / 2, z, d], ['z', x + w / 2, z, d]]) stoneWall(cx, cz, L, ax, 1.4 + WR() * 1.8, 0.45);
    for (let k = 0; k < 6; k++) { const rx = x + wr(-w / 2, w / 2), rz = z + wr(-d / 2, d / 2), s2 = 0.5 + WR() * 0.8, g2 = groundH(rx, rz); addBox(rx - s2, g2 - 0.2, rz - s2 * 0.8, rx + s2, g2 + s2 * 0.7, rz + s2 * 0.8, wpk(STONE), { mat: 3 }); }
  }
  // torres de vigia de madeira (sobe pela escada e enxerga longe)
  for (let i = 0; i < N(9); i++) {
    const sp = landSpot(8, 8, { slope: 2.5, minH: 8 }); if (!sp) continue; const [x, z] = sp; FOOT.push({ x, z, w: 8, d: 8 });
    building({ x, z, w: 6.5, d: 6, floors: 3, roofAccess: true, col: wpk(WOOD), trim: '#5e4129', wallMat: 4, doors: [wpk(['n', 's', 'e', 'w'])], noFurn: true, tier: 2 });
  }
  // acampamentos: barracas, fogueira, troncos e caixas
  for (let i = 0; i < N(10); i++) {
    const sp = landSpot(16, 16, { slope: 4 }); if (!sp) continue; const [x, z] = sp; FOOT.push({ x, z, w: 16, d: 16 });
    for (let k = 0; k < 3 + Math.floor(WR() * 3); k++) { const a = k * 1.4 + WR(), r = 5 + WR() * 2, tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r, g2 = groundH(tx, tz); addGable(tx - 1.3, tz - 1.6, tx + 1.3, tz + 1.6, g2, 1.8, wpk(['#4f6b3a', '#7a6a3a', '#3e5a6b', '#a0522d'])); }
    const g2 = groundH(x, z); addBox(x - 0.5, g2, z - 0.5, x + 0.5, g2 + 0.25, z + 0.5, '#3a3430', { nocol: true });
    for (const [ox, oz, ax] of [[0, 2, 'x'], [0, -2, 'x'], [2, 0, 'z']]) { if (ax === 'x') addBox(x + ox - 1.2, g2, z + oz - 0.22, x + ox + 1.2, g2 + 0.45, z + oz + 0.22, '#6b4a2e', { mat: 4 }); else addBox(x + ox - 0.22, g2, z + oz - 1.2, x + ox + 0.22, g2 + 0.45, z + oz + 1.2, '#6b4a2e', { mat: 4 }); }
    for (let k = 0; k < 3; k++) crateBox(x + wr(-6, 6), z + wr(-6, 6), 1.1);
  }
  // trincheiras de sacos de areia em U
  for (let i = 0; i < N(14); i++) {
    const sp = landSpot(7, 7, { slope: 3 }); if (!sp) continue; const [x, z] = sp; FOOT.push({ x, z, w: 7, d: 7 });
    const g2 = groundH(x, z), c = '#a8996e', open = Math.floor(WR() * 4);
    [[x - 3, z - 3, x + 3, z - 2.3], [x - 3, z + 2.3, x + 3, z + 3], [x - 3, z - 2.3, x - 2.3, z + 2.3], [x + 2.3, z - 2.3, x + 3, z + 2.3]].forEach((b, k) => { if (k !== open) addBox(b[0], g2 - 0.2, b[1], b[2], g2 + 0.95, b[3], c, { mat: 5 }); });
    if (WR() < 0.5) crateBox(x, z, 1);
  }
  // muros de pedra cortando os campos
  for (let i = 0; i < N(45); i++) { const sp = landSpot(30, 2, { slope: 6, m: 2 }); if (!sp) continue; const [x, z] = sp, ax = WR() < 0.5 ? 'x' : 'z', L = 14 + WR() * 30; FOOT.push({ x, z, w: ax === 'x' ? L : 1, d: ax === 'x' ? 1 : L }); stoneWall(x, z, L, ax, 1.1 + WR() * 0.4, 0.3); }
  // pedras grandes e contêineres soltos
  for (let i = 0; i < N(40); i++) { const sp = landSpot(6, 6, { slope: 8, m: 2 }); if (!sp) continue; const [x, z, h] = sp; FOOT.push({ x, z, w: 6, d: 6 }); const s2 = 1.4 + WR() * 2.2; addBox(x - s2, h - 0.6, z - s2 * 0.8, x + s2, h + s2 * 1.1, z + s2 * 0.8, wpk(STONE), { mat: 3 }); if (WR() < 0.6) { const s3 = s2 * 0.6, ox = s2 * 1.1; addBox(x + ox - s3, groundH(x + ox, z) - 0.4, z - s3, x + ox + s3, groundH(x + ox, z) + s3, z + s3, wpk(STONE), { mat: 3 }); } }
  for (let i = 0; i < N(18); i++) { const sp = landSpot(7, 7, { slope: 2.5 }); if (!sp) continue; FOOT.push({ x: sp[0], z: sp[1], w: 7, d: 7 }); container(sp[0], sp[1], WR() < 0.5 ? 'x' : 'z', WR() < 0.25 ? 2 : 1); }
  // torres de rádio nos morros (visual alto) com casinha
  const hills = []; for (let k = 0; k < 400 && hills.length < 3; k++) { const x = wr(-ISL_R, ISL_R), z = wr(-ISL_R, ISL_R), h = groundH(x, z); if (h > 45 && !townAt(x, z, 20) && free(x, z, 8, 8) && hills.every(q => Math.hypot(q[0] - x, q[1] - z) > 300)) hills.push([x, z, h]); }
  for (const [x, z, h] of hills) {
    FOOT.push({ x, z, w: 10, d: 10 }); building({ x: x + 5, z, w: 5, d: 4, floors: 1, col: '#d8d4cc', wallMat: 3, doors: ['s'], noFurn: true, tier: 2 });
    for (let k = 0; k < 4; k++) { const ox = k % 2 ? 1 : -1, oz = k < 2 ? 1 : -1; DECO.push({ g: GEO.box, x: x - 3 + ox * 0.9, y: h + 14, z: z + oz * 0.9, sx: 0.14, sy: 28, sz: 0.14, c: k % 2 ? '#c0392b' : '#ecf0f1' }); }
    for (let y = 2; y < 28; y += 3) DECO.push({ g: GEO.box, x: x - 3, y: h + y, z, sx: 1.9, sy: 0.1, sz: 1.9, c: '#bdc3c7' });
  }
  // beira de estrada: carros abandonados, postos de gasolina, postes com fios e cercas
  let gas = 0;
  for (const r of ROADS) {
    const dx = r[2] - r[0], dz = r[3] - r[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ry = Math.atan2(ux, uz);
    if (L < 60) continue;
    let lastPole = null;
    for (let t = 30; t < L - 30; t += 42) { // postes de luz/energia com fio
      const sd = 6.5, x = r[0] + ux * t - uz * sd, z = r[1] + uz * t + ux * sd, h = groundH(x, z);
      if (townAt(x, z, -10) || riverDist(x, z) < 10 || h < 1) { lastPole = null; continue; }
      DECO.push({ g: GEO.cyl6, x, y: h + 4.5, z, sx: 0.26, sy: 9, sz: 0.26, c: '#6e5a44' }, { g: GEO.box, x, y: h + 8.6, z, sx: 1.8, sy: 0.12, sz: 0.12, ry, c: '#5e4a36' });
      if (lastPole) { const [px, py, pz] = lastPole, mx = (px + x) / 2, mz = (pz + z) / 2, my = (py + h) / 2 + 8.2, len = Math.hypot(x - px, z - pz), pit = Math.atan2(h - py, len); DECO.push({ g: GEO.box, x: mx, y: my, z: mz, sx: 0.04, sy: 0.04, sz: len, ry, rx: -pit, c: '#222' }); }
      lastPole = [x, h, z];
    }
    for (let t = 20; t < L - 20; t += 9) { // cercas em trechos fora da cidade (só visual, do outro lado da estrada)
      const x = r[0] + ux * t + uz * 8, z = r[1] + uz * t - ux * 8, h = groundH(x, z);
      if (townAt(x, z, 15) || riverDist(x, z) < 12 || h < 1.5 || NZ.n(t / 60 + r[0], r[1] / 50) < 0.1) continue;
      DECO.push({ g: GEO.box, x, y: h + 0.55, z, sx: 0.12, sy: 1.1, sz: 0.12, c: '#6e4a2c' }, { g: GEO.box, x: x + ux * 4.5, y: h + 0.85, z: z + uz * 4.5, sx: 0.07, sy: 0.12, sz: 9, ry, c: '#8a6340' }, { g: GEO.box, x: x + ux * 4.5, y: h + 0.45, z: z + uz * 4.5, sx: 0.07, sy: 0.12, sz: 9, ry, c: '#8a6340' });
    }
    if (WR() < 0.55) { const t = wr(0.2, 0.8) * L, x = r[0] + ux * t + uz * 9, z = r[1] + uz * t - ux * 9; if (!townAt(x, z, 10) && groundH(x, z) > 2 && free(x, z, 5, 5, 1)) { FOOT.push({ x, z, w: 5, d: 5 }); wreck(x, z); } }
    if (gas < (MAPID === 'bal' ? 3 : 5) && L > 180 && WR() < 0.5) { // posto de gasolina
      const t = L * 0.5, x = Math.round(r[0] + ux * t - uz * 20), z = Math.round(r[1] + uz * t + ux * 20), h = groundH(x, z);
      if (!townAt(x, z, 15) && h > 2 && riverDist(x, z) > 20 && free(x, z, 26, 20, 1) && Math.abs(groundH(x + 12, z) - groundH(x - 12, z)) < 2.5) {
        FOOT.push({ x, z, w: 26, d: 20 }); gas++;
        addBox(x - 13, h - 0.5, z - 10, x + 13, h + 0.1, z + 10, '#7c7a76', { mat: 3 });
        for (const [ox, oz] of [[-5, -3], [5, -3], [-5, 3], [5, 3]]) addBox(x + ox - 0.25, h + 0.1, z + oz - 0.25, x + ox + 0.25, h + 4.6, z + oz + 0.25, '#e8e8e8');
        addBox(x - 7, h + 4.6, z - 5, x + 7, h + 5.2, z + 5, '#d62828', { nocol: true }); addBox(x - 7.1, h + 5.2, z - 5.1, x + 7.1, h + 5.4, z + 5.1, '#f1f1f1', { nocol: true });
        for (const ox of [-2.5, 2.5]) addBox(x + ox - 0.4, h + 0.1, z - 0.3, x + ox + 0.4, h + 1.6, z + 0.3, '#f1c40f');
        building({ x, z: z + 7.5, w: 10, d: 5, floors: 1, col: '#f2f2f2', trim: '#d62828', doors: ['n'], noFurn: true, tier: 2, gy: h });
      }
    }
  }
  // casas isoladas ganham quintal: cerquinha, galpão ou caixa d'água
  for (const p of LONE) if (WR() < 0.45) { const ox = p.x + (WR() < 0.5 ? -8 : 8), oz = p.z + 6; if (free(ox, oz, 4, 4, 0.5)) { FOOT.push({ x: ox, z: oz, w: 4, d: 4 }); if (WR() < 0.5) building({ x: ox, z: oz, w: 4, d: 3.5, floors: 1, roof: 'gable', col: wpk(WOOD), wallMat: 4, doors: ['s'], noWin: true, noFurn: true }); else { const g2 = groundH(ox, oz); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) addBox(ox + a - 0.1, g2, oz + b - 0.1, ox + a + 0.1, g2 + 4, oz + b + 0.1, '#7a7a7a', { nocol: true }); addBox(ox - 1.3, g2 + 4, oz - 1.3, ox + 1.3, g2 + 6, oz + 1.3, '#3a6ea5'); } } }
  if (DECO.length) { const m = new T.Mesh(mergeParts(DECO), new T.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; m.receiveShadow = true; scene.add(m); NATURE_MESH.push(m); }
})();
(function bridges() {
  const parts = [];
  for (const r of ROADS) {
    const dx = r[2] - r[0], dz = r[3] - r[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    let best = 1e9, bt = -1;
    for (let t = 0; t <= L; t += 2) { const d = riverDist(r[0] + ux * t, r[1] + uz * t); if (d < best) { best = d; bt = t; } }
    if (best > 4) continue;
    const cx = r[0] + ux * bt, cz = r[1] + uz * bt, ry = Math.atan2(ux, uz), len = 30, gy = groundH(cx, cz);
    for (const sd of [-1, 1]) {
      const ox = -uz * sd * 4.9, oz = ux * sd * 4.9;
      parts.push({ g: GEO.box, x: cx + ox, y: gy + 0.95, z: cz + oz, sx: 0.18, sy: 0.14, sz: len, ry, c: '#d9d6cf' }); // corrimão
      parts.push({ g: GEO.box, x: cx + ox, y: gy + 0.25, z: cz + oz, sx: 0.4, sy: 0.5, sz: len, ry, c: '#8d8a84' }); // mureta
      parts.push({ g: GEO.box, x: cx + ox * 1.02, y: gy - 1.4, z: cz + oz * 1.02, sx: 0.5, sy: 2.6, sz: len - 6, ry, c: '#7e7b75' }); // viga lateral
      for (let i = -7; i <= 7; i++) parts.push({ g: GEO.box, x: cx + ox + ux * i * 2, y: gy + 0.6, z: cz + oz + uz * i * 2, sx: 0.14, sy: 0.7, sz: 0.14, c: '#cfccc5' }); // postes do corrimão
    }
    for (const e of [-1, 1]) parts.push({ g: GEO.box, x: cx + ux * e * 13, y: gy - 2, z: cz + uz * e * 13, sx: 10.5, sy: 4, sz: 1.2, ry, c: '#7a7770' }); // cabeceiras
  }
  if (!parts.length) return;
  const m = new T.Mesh(mergeParts(parts), new T.MeshLambertMaterial({ vertexColors: true })); m.castShadow = m.receiveShadow = true; scene.add(m);
})();
const TREES = [], NAT = {};
(function nature() {
  const tr = [], rk = [], bu = [];
  const BALN = MAPID === 'bal', NTR = BALN ? 5600 : 4200, NRG = BALN ? 700 : 560 * MS;
  for (let k = 0; k < 42000 && tr.length < NTR; k++) {
    const x = wr(-NRG, NRG), z = wr(-NRG, NRG), h = groundH(x, z);
    if (h < 2.5 || h > 60) continue;
    if (townAt(x, z, 12) || roadDist(x, z) < 7) continue;
    if (FOOT.some(f => Math.abs(f.x - x) < f.w / 2 + 3 && Math.abs(f.z - z) < f.d / 2 + 3)) continue;
    const dens = NZ.n(x / 90 + 40, z / 90 - 40), forest = NZ.fbm(x / 230 + 17, z / 230 - 5, 2); // manchas de floresta fechada e campos abertos
    if (forest < (BALN ? -0.35 : -0.15) && WR() < 0.88) continue; if (dens < (BALN ? -0.4 : -0.2) && WR() < 0.6) continue;
    const r = WR();
    if (r < (BALN ? 0.6 : 0.62)) tr.push([x, h, z, WR() < 0.12 ? 1.7 + WR() * 0.8 : 0.75 + WR() * (BALN ? 0.9 : 0.75)]); // ~12% árvores gigantes
    else if (r < (BALN ? 0.96 : 0.9)) bu.push([x, h, z, 0.7 + WR() * 0.7]);
    else rk.push([x, h, z, 0.8 + WR() * 1.6]);
  }
  const dummy = new T.Object3D(), c = new T.Color();
  const trunk = new T.InstancedMesh(new T.CylinderGeometry(0.22, 0.3, 1, 6), new T.MeshLambertMaterial({ color: 0x7a4b2a }), tr.length);
  const crown = new T.InstancedMesh(new T.ConeGeometry(1, 1, 8), new T.MeshLambertMaterial({ color: 0xffffff }), tr.length * 2);
  const crown2 = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), new T.MeshLambertMaterial({ color: 0xffffff }), tr.length * 3);
  let nc = 0, nr = 0;
  tr.forEach(([x, h, z, s], i) => {
    const th = 2.6 * s; dummy.position.set(x, h + th / 2, z); dummy.scale.set(s, th, s); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
    const round = BALN ? NZ.n(x / 60, z / 60) > -0.45 : NZ.n(x / 60, z / 60) > 0.1;
    c.setHSL(round ? (BALN ? 0.24 : 0.2) + WR() * 0.07 : 0.27 + WR() * 0.06, BALN ? 0.55 : 0.42, (BALN ? 0.2 : 0.24) + WR() * 0.09, 'srgb');
    if (round) { // copa redonda: 3 bolos de folhas
      for (const [ox, oy, oz, k] of [[0, 1.6, 0, 1], [0.9, 1.1, 0.4, 0.7], [-0.7, 1.2, -0.6, 0.72]]) {
        dummy.position.set(x + ox * s, h + th + oy * s, z + oz * s); dummy.scale.set(2.2 * s * k, 1.9 * s * k, 2.2 * s * k); dummy.rotation.set(WR(), WR(), 0); dummy.updateMatrix(); crown2.setMatrixAt(nr, dummy.matrix);
        crown2.setColorAt(nr++, c.clone().offsetHSL(0, 0, (k - 0.85) * 0.25));
      }
    } else { // pinheiro: 2 cones
      dummy.position.set(x, h + th + 1.6 * s, z); dummy.scale.set(2.4 * s, 4 * s, 2.4 * s); dummy.rotation.set(0, WR() * 3, 0); dummy.updateMatrix(); crown.setMatrixAt(nc, dummy.matrix); crown.setColorAt(nc++, c.clone().offsetHSL(0, 0, -0.04));
      dummy.position.set(x, h + th + 3.8 * s, z); dummy.scale.set(1.7 * s, 3.4 * s, 1.7 * s); dummy.updateMatrix(); crown.setMatrixAt(nc, dummy.matrix); crown.setColorAt(nc++, c.clone().offsetHSL(0, 0, 0.04));
    }
    addCollider(x - 0.3 * s, h, z - 0.3 * s, x + 0.3 * s, h + th + 3 * s, z + 0.3 * s, 'tree');
    TREES.push([x, z, h, s, round, i, round ? [nr - 3, nr - 2, nr - 1] : [nc - 2, nc - 1]]);
  });
  crown.count = nc; crown2.count = nr;
  const bush = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), new T.MeshLambertMaterial({ color: 0xffffff }), bu.length);
  bu.forEach(([x, h, z, s], i) => { dummy.position.set(x, h + 0.4 * s, z); dummy.scale.set(1.3 * s, 0.9 * s, 1.3 * s); dummy.rotation.set(0, WR() * 3, 0); dummy.updateMatrix(); bush.setMatrixAt(i, dummy.matrix); c.setHSL(0.22 + WR() * 0.08, 0.42, 0.27 + WR() * 0.08, 'srgb'); bush.setColorAt(i, c); });
  const rock = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), new T.MeshLambertMaterial({ color: 0xffffff }), rk.length);
  rk.forEach(([x, h, z, s], i) => { dummy.position.set(x, h + 0.3 * s, z); dummy.scale.set(1.3 * s, s, 1.1 * s); dummy.rotation.set(WR(), WR() * 3, 0); dummy.updateMatrix(); rock.setMatrixAt(i, dummy.matrix); c.setHSL(0.08, 0.05, 0.46 + WR() * 0.12, 'srgb'); rock.setColorAt(i, c); addCollider(x - s, h - 0.5, z - 0.9 * s, x + s, h + 1.1 * s, z + 0.9 * s, 'rock'); });
  for (const m of [trunk, crown, crown2, bush, rock]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; scene.add(m); NATURE_MESH.push(m); }
  Object.assign(NAT, { trunk, crown, crown2, bush, rock, bu, rk });
  // nuvens
  // nuvens fofas: cada uma é um cacho de 6 bolas, mais achatado embaixo
  const cl = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x6d7682 }), 55 * 6);
  let ci = 0;
  for (let i = 0; i < 55; i++) {
    const cx = wr(-1300, 1300), cy = wr(330, 430), cz = wr(-1300, 1300), sc = wr(0.7, 1.4);
    for (let k = 0; k < 6; k++) { const r = wr(16, 30) * sc; dummy.position.set(cx + wr(-45, 45) * sc, cy + wr(0, 14) * sc, cz + wr(-25, 25) * sc); dummy.scale.set(r * 1.3, r * 0.75, r); dummy.rotation.set(0, WR() * 3, 0); dummy.updateMatrix(); cl.setMatrixAt(ci++, dummy.matrix); }
  }
  scene.add(cl);
})();

// fecha os blocos de geometria estática
for (const ch of CHUNKS) {
  if (!ch.p.length) continue;
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(ch.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(ch.n, 3)); g.setAttribute('color', new T.Float32BufferAttribute(ch.c, 3)); g.setAttribute('mt', new T.Float32BufferAttribute(ch.m, 1));
  g.computeBoundingSphere(); const cm = new T.Mesh(g, MAT.world); scene.add(cm); CHUNK_MESH.push(cm); ch.p = ch.n = ch.c = ch.m = null;
}
const bldAt = (x, z, m = 0) => BLD.find(b => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m);
