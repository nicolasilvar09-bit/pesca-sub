// ================= mundo: ilha, estradas, cidades, prédios, árvores e colisão =================
const NZ = makeNoise(9173);
let TERRAIN = null, WATER = null; const CHUNK_MESH = [], NATURE_MESH = [];
const WR = mulberry(4242); // o mapa é sempre o mesmo
const wr = (a, b) => a + WR() * (b - a);
const wpk = a => a[Math.floor(WR() * a.length)];

const TOWNS = [
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
const ROADS = [ // trechos de estrada [x0,z0,x1,z1]
  [-335, 300, -210, 150], [-210, 150, 70, 45], [70, 45, 335, -240], [70, 45, 275, 290], [-120, -255, 70, 45],
  [-380, -85, -120, -255], [-380, -85, -210, 150], [275, 290, 150, 430], [335, -240, 120, -400],
  [-165, 95, 70, 45], [175, -110, 70, 45], [175, -110, 335, -240], [15, 335, 70, 45], [15, 335, -335, 300], [430, 35, 335, -240], [430, 35, 275, 290],
].map(r => r.map(v => v * MS));
{ // estradas das cidades novas
  const T_ = n => TOWNS.find(t => t.n === n), link = (a, b) => { const p = T_(a), q = T_(b); ROADS.push([p.x, p.z, q.x, q.z]); };
  link('Cidade Alta', 'Centro'); link('Cidade Alta', 'Farol Leste'); link('Cidade Alta', 'Jardim');
  link('Pedreira', 'Jardim'); link('Pedreira', 'Base Militar'); link('Vila Nova', 'Usina'); link('Vila Nova', 'Vila Cores');
  link('Quartel Sul', 'Prainha'); link('Quartel Sul', 'Porto Azul'); link('Rancho', 'Fazenda Sol'); link('Rancho', 'Farol Leste');
}
// rio que desce do morro ao norte até o mar ao sul (raso: dá para atravessar a pé; as estradas passam por pontes)
const RIVER = [[-40, -560], [40, -420], [60, -250], [-10, -130], [-80, -40], [-90, 200], [-120, 330], [-110, 480], [-110, 760]];
function riverDist(x, z) {
  let m = 1e9;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b = RIVER[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L, 0, 1);
    m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return m;
}

// ---------- relevo ----------
function rawH(x, z) {
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
for (const t of TOWNS) { t.h = Math.max(4, rawH(t.x, t.z)); PADS.push({ x: t.x, z: t.z, r: t.r, b: 45, h: t.h }); }
// casas isoladas espalhadas pela ilha
const LONE = [];
for (let k = 0; k < 1600 && LONE.length < 85; k++) {
  const x = wr(-470 * MS, 470 * MS), z = wr(-470 * MS, 470 * MS), h = rawH(x, z);
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
  const pave = new T.Color('#86837c'), rock = new T.Color('#85827c'), g1 = new T.Color('#617a3c'), g2 = new T.Color('#8a8f52'), g3 = new T.Color('#4f6933');
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
    const k = j * GN + i, x = -HALF + i * CELL, z = -HALF + j * CELL, h = H[k];
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    const sl = Math.abs(H[Math.min(k + 1, H.length - 1)] - h) + Math.abs(H[Math.min(k + GN, H.length - 1)] - h);
    const n = NZ.n(x / 40, z / 40) * 0.5 + 0.5, t = townAt(x, z), rd = roadDist(x, z);
    if (h < -1) c.copy(wet); else if (h < 1.6) c.copy(sand);
    else if (rd < 4.5) c.copy(rd < 0.5 ? line : road);
    else if (t && (t.kind === 'city' || t.kind === 'military' || t.kind === 'port' || t.kind === 'factory') && Math.hypot(t.x - x, t.z - z) < t.r) c.copy(pave).multiplyScalar(0.94 + n * 0.08);
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
      const km = CUR_MAT; CUR_MAT = 0; fr(o.a - 0.1, o.b + 0.1, o.lo - 0.09, o.lo, '#fbfaf5'); fr(o.a - 0.1, o.b + 0.1, o.hi, o.hi + 0.09, '#fbfaf5'); fr(o.a - 0.06, o.a, o.lo, o.hi, '#fbfaf5'); fr(o.b, o.b + 0.06, o.lo, o.hi, '#fbfaf5'); CUR_MAT = km; }
    else if (o.hi - o.lo < 3) { fr(o.a - 0.1, o.b + 0.1, o.hi, o.hi + 0.12, '#8d5a34'); fr(o.a - 0.1, o.a, o.lo, o.hi, '#8d5a34'); fr(o.b, o.b + 0.1, o.lo, o.hi, '#8d5a34'); }
  }
  put(cur, a1, y0, y1);
}
function slabWithHole(x0, z0, x1, z1, y0, y1, hole, color) {
  if (!hole) { addBox(x0, y0, z0, x1, y1, z1, color); return; }
  const [hx0, hz0, hx1, hz1] = hole;
  addBox(x0, y0, z0, x1, y1, hz0, color); addBox(x0, y0, hz1, x1, y1, z1, color);
  addBox(x0, y0, hz0, hx0, y1, hz1, color); addBox(hx1, y0, hz0, x1, y1, hz1, color);
}
function building(o) {
  const w = o.w, d = o.d, x0 = o.x - w / 2, x1 = o.x + w / 2, z0 = o.z - d / 2, z1 = o.z + d / 2;
  const wm = o.wallMat != null ? o.wallMat : (o.roof === 'gable' ? (WR() < 0.35 ? 1 : 0) : (WR() < 0.5 ? 3 : 1));
  const fh = o.fh || 3.2, floors = o.floors || 1, col = wm === 1 && !o.col ? wpk(['#8e4a36', '#7f4330', '#93573c', '#7a4c3a', '#8a5a44']) : o.col || wpk(WALL), gy = groundH(o.x, o.z);
  const y0 = gy + 0.15, top = y0 + floors * fh;
  const B = { x0, z0, x1, z1, y: y0, top, floors, fh, doors: [], spots: [], tier: o.tier || 1 };
  addBox(x0 - 0.3, gy - 2, z0 - 0.3, x1 + 0.3, y0, z1 + 0.3, '#9c958a', { mat: 3 }); // base
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
    const furn = [];
    if (fh < 4 && !o.noFurn && w >= 6 && d >= 6) {
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
      if (pz < z1 - 0.5) B.spots.push([px, fy + 0.02, pz]);
    }
  }
  // teto / telhado
  if (o.roof === 'gable') {
    addBox(x0, top - 0.2, z0, x1, top, z1, '#efe6d8');
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

(function buildTowns() {
  for (const t of TOWNS) {
    const n = { village: 22, city: 20, port: 13, military: 11, farm: 10, factory: 11 }[t.kind];
    let made = 0;
    for (let i = 0; i < n * 3 && made < n; i++) {
      if (t.kind === 'village') { const two = WR() < 0.35, w = two ? 10 : 8 + Math.round(WR() * 2), d = two ? 8 : 7; if (place(t, w, d, 5, (x, z) => (two ? house2 : house)(t, x, z, w, d))) made++; }
      else if (t.kind === 'city') {
        const r = WR();
        if (r < 0.5) { const f = 3 + (WR() < 0.5 ? 1 : 0); if (place(t, 12, 12, 5, (x, z) => apart(t, x, z, 12, 12, f))) made++; }
        else if (r < 0.8) { if (place(t, 10, 8, 5, (x, z) => house2(t, x, z, 10, 8))) made++; }
        else if (place(t, 8, 7, 5, (x, z) => house(t, x, z, 8, 7))) made++;
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
  for (let k = 0; k < 16000 && tr.length < 2200; k++) {
    const x = wr(-560 * MS, 560 * MS), z = wr(-560 * MS, 560 * MS), h = groundH(x, z);
    if (h < 2.5 || h > 60) continue;
    if (townAt(x, z, 12) || roadDist(x, z) < 7) continue;
    if (FOOT.some(f => Math.abs(f.x - x) < f.w / 2 + 3 && Math.abs(f.z - z) < f.d / 2 + 3)) continue;
    const dens = NZ.n(x / 90 + 40, z / 90 - 40); if (dens < -0.15 && WR() < 0.8) continue;
    const r = WR();
    if (r < 0.62) tr.push([x, h, z, 0.8 + WR() * 0.6]);
    else if (r < 0.9) bu.push([x, h, z, 0.7 + WR() * 0.7]);
    else rk.push([x, h, z, 0.8 + WR() * 1.6]);
  }
  const dummy = new T.Object3D(), c = new T.Color();
  const trunk = new T.InstancedMesh(new T.CylinderGeometry(0.22, 0.3, 1, 6), new T.MeshLambertMaterial({ color: 0x7a4b2a }), tr.length);
  const crown = new T.InstancedMesh(new T.ConeGeometry(1, 1, 8), new T.MeshLambertMaterial({ color: 0xffffff }), tr.length * 2);
  const crown2 = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), new T.MeshLambertMaterial({ color: 0xffffff }), tr.length * 3);
  let nc = 0, nr = 0;
  tr.forEach(([x, h, z, s], i) => {
    const th = 2.6 * s; dummy.position.set(x, h + th / 2, z); dummy.scale.set(s, th, s); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
    const round = NZ.n(x / 60, z / 60) > 0.1;
    c.setHSL(round ? 0.2 + WR() * 0.07 : 0.27 + WR() * 0.06, 0.42, 0.24 + WR() * 0.09, 'srgb');
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
