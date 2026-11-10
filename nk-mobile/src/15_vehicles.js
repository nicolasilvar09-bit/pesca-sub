// ================= veículos: jipe, sedã, buggy e moto — dirigir, passageiros, atropelar, dano e explosão =================
// hl/hw = meio comprimento/largura; seats = [direita, trás, altura do assento]; max em m/s
const VDEF = {
  jipe: { n: 'Jipe', hp: 1500, max: 25, acc: 8, turn: 1.15, hl: 2.2, hw: 1.0, h: 1.9, seats: [[-0.42, -0.15, 0.55], [0.42, -0.15, 0.55], [-0.42, 0.85, 0.6], [0.42, 0.85, 0.6]], cols: ['#4b5a3a', '#6b5d43', '#3d4a52', '#5a4a3a'] },
  seda: { n: 'Sedã', hp: 1100, max: 29, acc: 10, turn: 1.2, hl: 2.25, hw: 0.95, h: 1.5, seats: [[-0.4, -0.1, 0.45], [0.4, -0.1, 0.45], [-0.4, 0.8, 0.45], [0.4, 0.8, 0.45]], cols: ['#8c2f2a', '#d8d8d2', '#2f5a6a', '#3a3d42', '#9a8a5a'] },
  buggy: { n: 'Buggy', hp: 900, max: 28, acc: 11, turn: 1.45, hl: 1.6, hw: 0.95, h: 1.4, seats: [[-0.38, 0.1, 0.45], [0.38, 0.1, 0.45]], cols: ['#b0632a', '#5a6b3a', '#3a5a7a'] },
  lancha: { n: 'Lancha', boat: true, hp: 1000, max: 21, acc: 7, turn: 0.95, hl: 2.7, hw: 1.05, h: 1.5, seats: [[-0.4, 0.1, 0.75], [0.4, 0.1, 0.75], [-0.4, 1.1, 0.7], [0.4, 1.1, 0.7]], cols: ['#e8e8e8', '#d64545', '#2f6fa8', '#f2c14e'] },
  pickup: { n: 'Caminhonete', hp: 1700, max: 26, acc: 8.5, turn: 1.05, hl: 2.55, hw: 1.0, h: 1.85, seats: [[-0.42, -0.4, 0.6], [0.42, -0.4, 0.6], [-0.45, 1.35, 0.98], [0.45, 1.35, 0.98]], cols: ['#e3e1da', '#2d3b52', '#7a2b22', '#3f4a33', '#5c5f63'] },
  van: { n: 'Van', hp: 1600, max: 23, acc: 7, turn: 1.0, hl: 2.4, hw: 1.0, h: 2.3, seats: [[-0.42, -1.05, 0.7], [0.42, -1.05, 0.7], [-0.42, 0.2, 0.7], [0.42, 0.2, 0.7], [-0.42, 1.25, 0.7], [0.42, 1.25, 0.7]], cols: ['#e6e3d8', '#d9b23a', '#3c6a8a', '#8a3a2a'] },
  moto: { n: 'Moto', hp: 550, max: 33, acc: 12, turn: 1.9, hl: 1.0, hw: 0.35, h: 1.2, seats: [[0, 0.0, 0.85], [0, 0.5, 0.95]], cols: ['#8a2a22', '#2a2c30', '#4a5a6a', '#6a5a3a'] },
};
const VEH = [];
/* ---------- carroceria realista: perfis "lofted" (seções arredondadas ao longo do carro), rodas com aro, vidro, cromo e farol ---------- */
/* canal de material por vértice: [rugosidade, metal, brilho próprio, é pintura] */
const VMT = { paint: [0.4, 0.12, 0, 1], glass: [0.08, 0.3, 0, 0], tire: [0.92, 0, 0, 0], rim: [0.28, 0.9, 0, 0], chrome: [0.14, 1, 0, 0], plas: [0.72, 0.05, 0, 0], light: [0.12, 0.2, 0.6, 0], tail: [0.2, 0.1, 0.5, 0], under: [0.95, 0, 0, 0], seat: [0.85, 0, 0, 0] };
const VGEO = { tire: new T.CylinderGeometry(0.5, 0.5, 1, 18), rim: new T.CylinderGeometry(0.5, 0.5, 1, 14), torus: new T.TorusGeometry(0.5, 0.09, 6, 16, Math.PI) };
/* seções: {z, w (meia-largura embaixo), wt (meia-largura em cima), y0, y1, n (quão quadrado)} */
function loftGeo(S, seg) {
  seg = seg || 22; const pos = [], idx = [];
  for (const s of S) {
    const n = s.n || 4, wt = s.wt == null ? s.w : s.wt, my = (s.y0 + s.y1) / 2, hh = (s.y1 - s.y0) / 2;
    for (let i = 0; i < seg; i++) {
      const a = i / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      const yy = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n), w = s.w + (wt - s.w) * (yy * 0.5 + 0.5);
      pos.push(Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w, my + yy * hh, s.z);
    }
  }
  for (let k = 0; k < S.length - 1; k++) for (let i = 0; i < seg; i++) {
    const a = k * seg + i, b = k * seg + (i + 1) % seg, c = a + seg, d = b + seg;
    idx.push(a, b, c, b, d, c);
  }
  for (const [k, flip] of [[0, false], [S.length - 1, true]]) { /* tampas nas pontas */
    const base = pos.length / 3, s = S[k]; pos.push(0, (s.y0 + s.y1) / 2, s.z);
    for (let i = 0; i < seg; i++) { const a = k * seg + i, b = k * seg + (i + 1) % seg; if (flip) idx.push(base, b, a); else idx.push(base, a, b); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const _qa = new T.Quaternion(), _ea = new T.Euler(), _up = new T.Vector3(0, 1, 0), _dv = new T.Vector3();
/* peça esticada entre dois pontos (tubos, colunas) */
function vseg(a, b, r, c, m, g) {
  _dv.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _dv.length(); _dv.normalize(); _qa.setFromUnitVectors(_up, _dv); _ea.setFromQuaternion(_qa);
  return { g: g || GEO.cyl, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, rx: _ea.x, ry: _ea.y, rz: _ea.z, sx: r, sy: L, sz: g === GEO.box ? r * 2.6 : r, c, m };
}
/* roda completa: pneu, aro metálico com raios, cubo; s = lado (+1/-1) */
let VW_COLLECT = null; /* quando montando a carroceria sem rodas: guarda onde cada roda fica (elas viram peças separadas que giram) */
function vwheel(p, x, z, r, w, s, rimC, spokes) {
  if (VW_COLLECT) { VW_COLLECT.push({ x, z, r, w, s, rimC }); return; }
  const y = r, o = s * w / 2;
  p.push({ g: VGEO.tire, x, y, z, rz: Math.PI / 2, sx: r * 2, sy: w, sz: r * 2, c: '#0b0b0b', m: 'tire' });
  p.push({ g: VGEO.rim, x: x + o * 0.7, y, z, rz: Math.PI / 2, sx: r * 1.3, sy: w * 0.42, sz: r * 1.3, c: rimC || '#9a9ea3', m: 'rim' });
  p.push({ g: VGEO.rim, x: x + o * 0.95, y, z, rz: Math.PI / 2, sx: r * 0.42, sy: w * 0.14, sz: r * 0.42, c: '#2a2a2a', m: 'plas' });
  for (let i = 0; i < (spokes || 5); i++) { const a = i / (spokes || 5) * Math.PI * 2; p.push({ g: GEO.box, x: x + o * 0.92, y: y + Math.cos(a) * r * 0.36, z: z + Math.sin(a) * r * 0.36, rx: -a, sx: w * 0.1, sy: r * 0.5, sz: r * 0.16, c: rimC || '#9a9ea3', m: 'rim' }); }
}
/* para-lama: arco escuro atrás da roda (a caixa de roda) */
function varch(p, x, z, r, R, c) { p.push({ g: VGEO.torus, x, y: r, z, ry: Math.PI / 2, sx: R * 2, sy: R * 2, sz: 1.4, c: c || '#1c1c1c', m: 'plas' }); }
function vehMerge(parts) {
  const g = mergeParts(parts), vm = [];
  for (const p of parts) { const n = p.g.index ? p.g.index.count : p.g.attributes.position.count, q = VMT[p.m || 'paint']; for (let i = 0; i < n; i++) vm.push(q[0], q[1], q[2], q[3]); }
  g.setAttribute('vm', new T.Float32BufferAttribute(vm, 4)); return g;
}
function carBody(p, k, col, L, W) {
  const jeep = k === 'jipe';
  const glass = '#0d1418', dark = '#202224';
  if (jeep) {
    /* jipe: caixa alta e quadrada, capô reto, para-brisa quase em pé */
    p.push({ g: loftGeo([
      { z: -L, w: W * 0.93, y0: 0.62, y1: 1.02, n: 7 }, { z: -L + 0.08, w: W * 0.98, y0: 0.55, y1: 1.12, n: 8 }, { z: -0.7, w: W, y0: 0.52, y1: 1.2, n: 9 },
      { z: L - 0.08, w: W, y0: 0.52, y1: 1.22, n: 9 }, { z: L, w: W * 0.95, y0: 0.58, y1: 1.15, n: 8 }]), c: col });
    p.push({ g: loftGeo([
      { z: -0.72, w: W * 0.95, wt: W * 0.9, y0: 1.18, y1: 1.2, n: 8 }, { z: -0.52, w: W * 0.95, wt: W * 0.9, y0: 1.18, y1: 1.86, n: 9 },
      { z: L - 0.1, w: W * 0.95, wt: W * 0.9, y0: 1.18, y1: 1.86, n: 9 }, { z: L - 0.04, w: W * 0.93, wt: W * 0.88, y0: 1.18, y1: 1.82, n: 8 }]), c: glass, m: 'glass' });
    p.push({ g: loftGeo([{ z: -0.56, w: W * 0.93, y0: 1.83, y1: 1.92, n: 6 }, { z: L - 0.06, w: W * 0.93, y0: 1.83, y1: 1.92, n: 6 }], 16), c: col });
    for (const s of [-1, 1]) { /* colunas */
      p.push(vseg([s * W * 0.96, 1.2, -0.7], [s * W * 0.92, 1.86, -0.52], 0.05, col, 'paint', GEO.box), vseg([s * W * 0.96, 1.2, 0.45], [s * W * 0.92, 1.86, 0.45], 0.05, col, 'paint', GEO.box), vseg([s * W * 0.96, 1.2, L - 0.2], [s * W * 0.92, 1.86, L - 0.2], 0.05, col, 'paint', GEO.box));
      p.push(bx(s * W - 0.04, 0.6, -L + 0.2, 0.08, 0.07, L * 2 - 0.4, '#2a2a2a', { m: 'plas' })); /* friso lateral */
      p.push(bx(s * (W + 0.02) - 0.03, 0.62, -0.55, 0.06, 0.02, 0.18, '#333', { m: 'plas' }), bx(s * (W + 0.02) - 0.03, 0.62, 0.55, 0.06, 0.02, 0.18, '#333', { m: 'plas' })); /* maçanetas */
      p.push(bx(s * (W + 0.003) - 0.005, 0.58, -0.72, 0.01, 0.6, 0.012, '#111', { m: 'plas' }), bx(s * (W + 0.003) - 0.005, 0.58, 0.42, 0.01, 0.6, 0.012, '#111', { m: 'plas' }));
      p.push(bx(s * (W + 0.05) - 0.06, 1.28, -0.62, 0.12, 0.16, 0.06, dark, { m: 'plas' }), vseg([s * W, 1.25, -0.6], [s * (W + 0.07), 1.3, -0.6], 0.03, dark, 'plas')); /* retrovisor */
      p.push({ g: GEO.box, x: s * W * 0.62, y: 0.98, z: -L - 0.02, sx: 0.26, sy: 0.18, sz: 0.06, c: '#fff4d2', m: 'light' }); /* faróis redondos */
      p.push({ g: GEO.box, x: s * W * 0.78, y: 0.9, z: L + 0.02, sx: 0.12, sy: 0.24, sz: 0.04, c: '#d0141e', m: 'tail' });
    }
    p.push(bx(-W * 0.45, 0.72, -L - 0.04, W * 0.9, 0.3, 0.05, '#151515', { m: 'plas' })); /* grade */
    for (let i = -3; i <= 3; i++) p.push(bx(i * W * 0.12 - 0.02, 0.74, -L - 0.07, 0.04, 0.26, 0.03, '#3a3a3a', { m: 'plas' }));
    p.push(bx(-W * 0.98, 0.5, -L - 0.2, W * 1.96, 0.16, 0.18, '#1d1d1d', { m: 'plas' }), bx(-W * 0.98, 0.5, L + 0.0, W * 1.96, 0.16, 0.16, '#1d1d1d', { m: 'plas' })); /* para-choques de aço */
    for (const s of [-1, 1]) p.push(vseg([s * W * 0.55, 0.62, -L - 0.2], [s * W * 0.45, 1.05, -L - 0.25], 0.06, '#2b2b2b', 'plas')); /* quebra-mato */
    p.push(vseg([-W * 0.5, 1.05, -L - 0.25], [W * 0.5, 1.05, -L - 0.25], 0.06, '#2b2b2b', 'plas'));
    p.push({ g: VGEO.tire, y: 1.05, z: L + 0.17, rx: Math.PI / 2, sx: 0.78, sy: 0.24, sz: 0.78, c: '#151515', m: 'tire' }, { g: VGEO.rim, y: 1.05, z: L + 0.27, rx: Math.PI / 2, sx: 0.46, sy: 0.08, sz: 0.46, c: '#6a6d70', m: 'rim' }); /* estepe */
    for (const s of [-1, 1]) p.push(vseg([s * W * 0.7, 1.95, -0.4], [s * W * 0.7, 1.95, L - 0.2], 0.04, '#222', 'plas')); /* bagageiro */
    p.push(bx(-0.36, 0.54, L + 0.0, 0.32, 0.16, 0.03, '#e8e8e0', { m: 'plas' }));
    p.push(bx(-W * 0.85, 0.45, -L + 0.3, W * 1.7, 0.1, L * 2 - 0.6, '#151515', { m: 'under' }));
  } else if (k === 'pickup') {
    /* caminhonete: capô comprido, cabine dupla curta e caçamba aberta atrás */
    const cb = 0.5; /* traseira da cabine */
    p.push({ g: loftGeo([
      { z: -L, w: W * 0.86, y0: 0.5, y1: 0.95, n: 5 }, { z: -L + 0.12, w: W * 0.96, y0: 0.45, y1: 1.08, n: 6 }, { z: -L + 0.7, w: W, y0: 0.44, y1: 1.15, n: 7 },
      { z: cb, w: W, y0: 0.44, y1: 1.18, n: 7 }]), c: col });
    p.push({ g: loftGeo([
      { z: -0.98, w: W * 0.95, wt: W * 0.9, y0: 1.12, y1: 1.16, n: 6 }, { z: -0.62, w: W * 0.95, wt: W * 0.86, y0: 1.12, y1: 1.78, n: 7 },
      { z: cb - 0.04, w: W * 0.95, wt: W * 0.88, y0: 1.12, y1: 1.8, n: 7 }, { z: cb, w: W * 0.94, wt: W * 0.87, y0: 1.12, y1: 1.76, n: 6 }]), c: glass, m: 'glass' });
    p.push({ g: loftGeo([{ z: -0.62, w: W * 0.87, y0: 1.76, y1: 1.85, n: 6 }, { z: cb - 0.02, w: W * 0.89, y0: 1.77, y1: 1.86, n: 6 }], 16), c: col });
    /* caçamba: chassi embaixo, assoalho, laterais e tampa */
    p.push({ g: loftGeo([{ z: cb, w: W * 0.98, y0: 0.44, y1: 0.86, n: 7 }, { z: L, w: W * 0.96, y0: 0.46, y1: 0.86, n: 7 }]), c: col });
    p.push(bx(-W * 0.92, 0.86, cb + 0.04, W * 1.84, 0.04, L - cb - 0.1, '#2b2b2b', { m: 'plas' }));
    for (const s of [-1, 1]) {
      p.push(bx(s > 0 ? W * 0.9 : -W, 0.86, cb + 0.02, W * 0.1, 0.34, L - cb - 0.04, col));
      p.push(bx(s > 0 ? W * 0.88 : -W * 1.0, 1.18, cb + 0.02, W * 0.12, 0.04, L - cb - 0.04, '#2a2a2a', { m: 'plas' })); /* frisos de borda */
      p.push(vseg([s * W * 0.96, 1.15, -0.95], [s * W * 0.87, 1.8, -0.6], 0.05, col, 'paint', GEO.box), vseg([s * W * 0.96, 1.15, -0.2], [s * W * 0.9, 1.8, -0.2], 0.05, col, 'paint', GEO.box));
      p.push(bx(s * (W + 0.003) - 0.005, 0.5, -0.92, 0.01, 0.65, 0.012, '#111', { m: 'plas' }), bx(s * (W + 0.003) - 0.005, 0.5, -0.2, 0.01, 0.65, 0.012, '#111', { m: 'plas' }));
      p.push(bx(s * (W + 0.012) - 0.02, 0.98, -0.62, 0.04, 0.03, 0.16, '#b9bcbf', { m: 'chrome' }), bx(s * (W + 0.012) - 0.02, 0.98, 0.1, 0.04, 0.03, 0.16, '#b9bcbf', { m: 'chrome' }));
      p.push(bx(s * (W + 0.05) - 0.06, 1.2, -0.95, 0.12, 0.15, 0.06, dark, { m: 'plas' }), vseg([s * W, 1.18, -0.93], [s * (W + 0.07), 1.22, -0.93], 0.03, dark, 'plas'));
      p.push({ g: GEO.box, x: s * W * 0.62, y: 0.92, z: -L - 0.01, sx: 0.36, sy: 0.14, sz: 0.06, c: '#f3efe2', m: 'light' });
      p.push({ g: GEO.box, x: s * W * 0.92, y: 0.98, z: L + 0.01, sx: 0.1, sy: 0.3, sz: 0.04, c: '#c0101a', m: 'tail' });
      p.push(bx(s > 0 ? W - 0.02 : -W - 0.02, 0.5, -L + 0.25, 0.04, 0.05, L * 2 - 0.5, '#1a1a1a', { m: 'plas' })); /* estribo */
    }
    p.push(bx(-W * 0.9, 0.86, L - 0.06, W * 1.8, 0.36, 0.06, col)); /* tampa da caçamba */
    p.push(bx(-W * 0.5, 0.62, -L - 0.03, W, 0.32, 0.05, '#151515', { m: 'plas' }), bx(-W * 0.48, 0.74, -L - 0.06, W * 0.96, 0.05, 0.03, '#b9bcbf', { m: 'chrome' }));
    p.push(bx(-W * 0.98, 0.42, -L - 0.12, W * 1.96, 0.16, 0.14, '#b9bcbf', { m: 'chrome' }), bx(-W * 0.98, 0.42, L - 0.02, W * 1.96, 0.14, 0.14, '#1d1d1d', { m: 'plas' })); /* para-choques */
    p.push(bx(-0.26, 0.6, L + 0.02, 0.52, 0.13, 0.03, '#e8e8e0', { m: 'plas' }));
    for (const s of [-1, 1]) p.push(vseg([s * W * 0.85, 1.2, cb + 0.05], [s * W * 0.85, 1.75, cb + 0.05], 0.035, '#222', 'plas')); /* santo antônio */
    p.push(vseg([-W * 0.85, 1.75, cb + 0.05], [W * 0.85, 1.75, cb + 0.05], 0.035, '#222', 'plas'));
    p.push(bx(-W * 0.85, 0.38, -L + 0.3, W * 1.7, 0.1, L * 2 - 0.6, '#151515', { m: 'under' }));
  } else if (k === 'van') {
    /* van: caixa alta de uma ponta à outra, frente curta e reta, janelas em faixa e duas cores */
    p.push({ g: loftGeo([
      { z: -L, w: W * 0.9, y0: 0.45, y1: 1.15, n: 5 }, { z: -L + 0.1, w: W * 0.97, y0: 0.42, y1: 1.3, n: 6 }, { z: -L + 0.45, w: W, y0: 0.42, y1: 1.3, n: 7 },
      { z: L - 0.1, w: W, y0: 0.42, y1: 1.3, n: 7 }, { z: L, w: W * 0.96, y0: 0.45, y1: 1.28, n: 6 }]), c: col });
    p.push({ g: loftGeo([
      { z: -L + 0.38, w: W * 0.98, wt: W * 0.93, y0: 1.28, y1: 1.32, n: 7 }, { z: -L + 0.62, w: W * 0.98, wt: W * 0.93, y0: 1.28, y1: 1.9, n: 8 },
      { z: L - 0.08, w: W * 0.98, wt: W * 0.94, y0: 1.28, y1: 1.92, n: 8 }, { z: L, w: W * 0.95, wt: W * 0.92, y0: 1.28, y1: 1.88, n: 7 }]), c: glass, m: 'glass' });
    p.push({ g: loftGeo([{ z: -L + 0.6, w: W * 0.94, y0: 1.88, y1: 2.18, n: 7 }, { z: L - 0.04, w: W * 0.95, y0: 1.9, y1: 2.2, n: 7 }], 18), c: '#ecebe6' });
    for (const s of [-1, 1]) {
      for (const z of [-L + 0.62, -0.75, 0.3, 1.3, L - 0.1]) p.push(bx(s > 0 ? W * 0.93 : -W * 0.99, 1.3, z - 0.05, W * 0.06, 0.6, 0.1, '#ecebe6')); /* colunas entre as janelas */
      p.push(bx(s * (W + 0.003) - 0.005, 0.5, -0.78, 0.01, 1.35, 0.012, '#111', { m: 'plas' }), bx(s * (W + 0.003) - 0.005, 0.5, 0.25, 0.01, 1.35, 0.012, '#111', { m: 'plas' }));
      p.push(bx(s > 0 ? W - 0.01 : -W - 0.01, 0.95, -L + 0.2, 0.02, 0.1, L * 2 - 0.4, '#ecebe6')); /* faixa */
      p.push(bx(s * (W + 0.06) - 0.07, 1.5, -L + 0.5, 0.14, 0.22, 0.06, dark, { m: 'plas' }), vseg([s * W, 1.45, -L + 0.5], [s * (W + 0.08), 1.5, -L + 0.5], 0.03, dark, 'plas'));
      p.push({ g: GEO.box, x: s * W * 0.62, y: 0.95, z: -L - 0.01, sx: 0.3, sy: 0.2, sz: 0.06, c: '#f3efe2', m: 'light' });
      p.push({ g: GEO.box, x: s * W * 0.82, y: 1.0, z: L + 0.01, sx: 0.14, sy: 0.32, sz: 0.04, c: '#c0101a', m: 'tail' });
    }
    p.push(bx(-W * 0.5, 0.62, -L - 0.03, W, 0.22, 0.05, '#151515', { m: 'plas' }), bx(-0.12, 0.66, -L - 0.06, 0.24, 0.12, 0.03, '#b9bcbf', { m: 'chrome' }));
    p.push(bx(-W * 0.98, 0.4, -L - 0.08, W * 1.96, 0.16, 0.12, '#1d1d1d', { m: 'plas' }), bx(-W * 0.98, 0.4, L - 0.04, W * 1.96, 0.16, 0.12, '#1d1d1d', { m: 'plas' }));
    p.push(bx(-0.26, 0.62, L + 0.02, 0.52, 0.13, 0.03, '#e8e8e0', { m: 'plas' }));
    for (const s of [-1, 1]) p.push(vseg([s * W * 0.7, 2.24, -L + 0.8], [s * W * 0.7, 2.24, L - 0.3], 0.03, '#222', 'plas')); /* bagageiro */
    p.push(bx(-W * 0.85, 0.36, -L + 0.3, W * 1.7, 0.1, L * 2 - 0.6, '#151515', { m: 'under' }));
  } else {
    /* sedã: capô inclinado, para-brisa deitado, porta-malas curto */
    p.push({ g: loftGeo([
      { z: -L, w: W * 0.8, y0: 0.34, y1: 0.66, n: 3 }, { z: -L + 0.12, w: W * 0.93, y0: 0.28, y1: 0.76, n: 3.6 }, { z: -L + 0.55, w: W * 0.99, y0: 0.26, y1: 0.82, n: 4.2 },
      { z: -0.95, w: W, y0: 0.25, y1: 0.9, n: 4.5 }, { z: 0.2, w: W, y0: 0.25, y1: 0.93, n: 4.5 }, { z: L - 0.6, w: W * 0.99, y0: 0.27, y1: 0.97, n: 4.4 },
      { z: L - 0.12, w: W * 0.94, y0: 0.31, y1: 0.93, n: 3.8 }, { z: L, w: W * 0.82, y0: 0.38, y1: 0.8, n: 3 }], 26), c: col });
    p.push({ g: loftGeo([
      { z: -0.98, w: W * 0.9, wt: W * 0.88, y0: 0.86, y1: 0.9, n: 4 }, { z: -0.28, w: W * 0.88, wt: W * 0.72, y0: 0.86, y1: 1.4, n: 4.5 },
      { z: 0.62, w: W * 0.88, wt: W * 0.72, y0: 0.86, y1: 1.41, n: 4.5 }, { z: L - 0.58, w: W * 0.9, wt: W * 0.84, y0: 0.88, y1: 0.97, n: 4 }], 24), c: glass, m: 'glass' });
    p.push({ g: loftGeo([{ z: -0.24, w: W * 0.73, y0: 1.37, y1: 1.43, n: 5 }, { z: 0.6, w: W * 0.73, y0: 1.37, y1: 1.44, n: 5 }], 18), c: col });
    for (const s of [-1, 1]) {
      p.push(vseg([s * W * 0.89, 0.92, -0.9], [s * W * 0.74, 1.36, -0.3], 0.035, col, 'paint', GEO.box), vseg([s * W * 0.89, 0.92, 0.18], [s * W * 0.75, 1.36, 0.16], 0.035, col, 'paint', GEO.box));
      p.push(bx(s * (W * 0.9) - 0.01, 0.88, -0.9, 0.02, 0.03, 2.4, '#c8cacc', { m: 'chrome' })); /* friso cromado da janela */
      p.push(bx(s * (W + 0.003) - 0.005, 0.3, -0.92, 0.01, 0.6, 0.012, '#0e0e0e', { m: 'plas' }), bx(s * (W + 0.003) - 0.005, 0.3, 0.2, 0.01, 0.62, 0.012, '#0e0e0e', { m: 'plas' }), bx(s * (W + 0.003) - 0.005, 0.32, L - 0.62, 0.01, 0.6, 0.012, '#0e0e0e', { m: 'plas' }));
      p.push(bx(s * (W + 0.012) - 0.02, 0.74, -0.35, 0.04, 0.03, 0.16, '#b9bcbf', { m: 'chrome' }), bx(s * (W + 0.012) - 0.02, 0.74, 0.75, 0.04, 0.03, 0.16, '#b9bcbf', { m: 'chrome' }));
      p.push(bx(s * W - 0.03, 0.3, -L + 0.75, 0.06, 0.05, L * 2 - 1.5, '#1a1a1a', { m: 'plas' })); /* saia lateral */
      p.push(bx(s * (W + 0.04) - 0.07, 0.92, -0.9, 0.14, 0.11, 0.07, col), vseg([s * W * 0.95, 0.9, -0.88], [s * (W + 0.02), 0.94, -0.88], 0.03, dark, 'plas')); /* retrovisor */
      p.push({ g: GEO.box, x: s * W * 0.56, y: 0.63, z: -L + 0.13, ry: s * 0.22, sx: 0.36, sy: 0.1, sz: 0.12, c: '#f3efe2', m: 'light' }); /* faróis */
      p.push({ g: GEO.box, x: s * W * 0.6, y: 0.8, z: L - 0.1, ry: -s * 0.2, sx: 0.36, sy: 0.1, sz: 0.1, c: '#c0101a', m: 'tail' }); /* lanternas */
    }
    p.push(bx(-W * 0.42, 0.44, -L - 0.01, W * 0.84, 0.16, 0.06, '#121212', { m: 'plas' }), bx(-W * 0.4, 0.62, -L + 0.06, W * 0.8, 0.04, 0.05, '#b9bcbf', { m: 'chrome' })); /* grade */
    p.push(bx(-W * 0.85, 0.3, -L - 0.02, W * 1.7, 0.08, 0.08, '#181818', { m: 'plas' }), bx(-W * 0.85, 0.36, L - 0.04, W * 1.7, 0.08, 0.08, '#181818', { m: 'plas' })); /* lábios dos para-choques */
    p.push(bx(-0.26, 0.5, L - 0.03, 0.52, 0.13, 0.03, '#e8e8e0', { m: 'plas' }), bx(-0.22, 0.24, -L - 0.03, 0.44, 0.11, 0.03, '#e8e8e0', { m: 'plas' })); /* placas */
    p.push({ g: GEO.cyl, x: W * 0.55, y: 0.27, z: L - 0.02, rx: Math.PI / 2, sx: 0.08, sy: 0.18, sz: 0.08, c: '#a0a4a8', m: 'chrome' }); /* escapamento */
    p.push(bx(-W * 0.85, 0.2, -L + 0.4, W * 1.7, 0.08, L * 2 - 0.8, '#121212', { m: 'under' }));
  }
}
function vehGeo(k, col, noWheels) {
  if (noWheels) { VW_COLLECT = []; try { const g = vehGeo(k, col); g.userData.wheels = VW_COLLECT; return g; } finally { VW_COLLECT = null; } }
  const d = VDEF[k], L = d.hl, W = d.hw, p = [];
  if (k === 'lancha') { /* casco fundo, proa afinando, para-brisa, motor de popa */
    p.push({ g: loftGeo([{ z: -L - 0.3, w: 0.08, y0: 0.15, y1: 0.55, n: 2 }, { z: -L + 0.6, w: W * 0.75, y0: -0.3, y1: 0.58, n: 2.6 }, { z: -L + 1.6, w: W, y0: -0.4, y1: 0.55, n: 3.2 }, { z: L, w: W * 0.96, y0: -0.38, y1: 0.52, n: 3.4 }], 22), c: col });
    p.push(bx(-W * 0.8, 0.3, -L + 0.8, W * 1.6, 0.12, L * 2 - 1.0, '#b89466', { m: 'seat' })); /* piso de madeira */
    p.push(bx(-W + 0.1, 0.53, L - 0.2, W * 2 - 0.2, 0.08, 0.12, '#e6e6e0', { m: 'plas' }), bx(-W * 0.95, 0.5, -L + 0.4, 0.1, 0.1, L * 2 - 0.6, '#e6e6e0', { m: 'plas' }), bx(W * 0.95 - 0.1, 0.5, -L + 0.4, 0.1, 0.1, L * 2 - 0.6, '#e6e6e0', { m: 'plas' }));
    p.push({ g: GEO.box, y: 0.82, z: -0.5, rx: -0.45, sx: W * 1.7, sy: 0.5, sz: 0.04, c: '#0d1418', m: 'glass' }, bx(-0.5, 0.42, -0.38, 0.45, 0.45, 0.4, '#2a2a2a', { m: 'plas' }));
    p.push(bx(-0.5, 0.42, 0.1, 0.4, 0.38, 0.45, '#d9d4c8', { m: 'seat' }), bx(0.1, 0.42, 0.1, 0.4, 0.38, 0.45, '#d9d4c8', { m: 'seat' }), bx(-0.5, 0.42, 1.0, 1.0, 0.33, 0.45, '#d9d4c8', { m: 'seat' }));
    p.push(bx(-0.25, 0.25, L - 0.05, 0.5, 0.8, 0.45, '#1b1b1b', { m: 'plas' }), bx(-0.08, -0.5, L + 0.15, 0.16, 0.75, 0.12, '#444', { m: 'rim' }));
    p.push(bx(-W * 0.98, 0.25, -L + 0.5, W * 1.96, 0.06, L * 2 - 0.6, '#c94040', { m: 'plas' })); /* faixa */
  } else if (k === 'moto') {
    p.push(vseg([0, 0.33, -0.78], [0, 1.02, -0.62], 0.07, '#bfc3c6', 'chrome'), vseg([0, 0.62, -0.62], [0, 0.55, 0.72], 0.08, '#2a2a2a', 'plas')); /* garfo e quadro */
    p.push({ g: GEO.sph, x: 0, y: 0.85, z: -0.3, sx: 0.32, sy: 0.24, sz: 0.55, c: col }); /* tanque */
    p.push({ g: loftGeo([{ z: -0.05, w: 0.14, y0: 0.8, y1: 0.86, n: 3 }, { z: 0.35, w: 0.15, y0: 0.8, y1: 0.9, n: 3 }, { z: 0.72, w: 0.11, y0: 0.82, y1: 0.95, n: 3 }], 12), c: '#1a1a1a', m: 'seat' });
    p.push(bx(-0.15, 0.4, -0.3, 0.3, 0.32, 0.5, '#3a3c3f', { m: 'rim' }), vseg([0.16, 0.42, -0.1], [0.18, 0.5, 0.85], 0.07, '#c0c4c8', 'chrome')); /* motor e escapamento */
    p.push(vseg([-0.36, 1.08, -0.68], [0.36, 1.08, -0.68], 0.035, '#2a2a2a', 'plas'), { g: GEO.cyl, x: 0, y: 0.92, z: -0.82, rx: Math.PI / 2, sx: 0.18, sy: 0.06, sz: 0.18, c: '#fff3cf', m: 'light' });
    p.push({ g: GEO.box, x: 0, y: 0.84, z: 0.78, sx: 0.12, sy: 0.05, sz: 0.04, c: '#c0101a', m: 'tail' }, { g: GEO.box, x: 0, y: 0.7, z: 0.62, rx: -0.4, sx: 0.22, sy: 0.04, sz: 0.4, c: col });
    vwheel(p, 0, -0.78, 0.33, 0.13, 1, '#8d9196', 6); vwheel(p, 0, 0.72, 0.33, 0.17, 1, '#8d9196', 6);
  } else if (k === 'buggy') {
    p.push({ g: loftGeo([{ z: -L, w: W * 0.55, y0: 0.42, y1: 0.6, n: 3 }, { z: -L + 0.4, w: W * 0.82, y0: 0.36, y1: 0.72, n: 3.5 }, { z: L - 0.25, w: W * 0.88, y0: 0.36, y1: 0.75, n: 4 }, { z: L, w: W * 0.7, y0: 0.42, y1: 0.68, n: 3 }], 18), c: col });
    p.push(bx(-W * 0.62, 0.7, -0.15, 0.5, 0.18, 0.55, '#1b1b1b', { m: 'seat' }), bx(W * 0.12, 0.7, -0.15, 0.5, 0.18, 0.55, '#1b1b1b', { m: 'seat' }), bx(-W * 0.62, 0.85, 0.32, 0.5, 0.5, 0.1, '#1b1b1b', { m: 'seat' }), bx(W * 0.12, 0.85, 0.32, 0.5, 0.5, 0.1, '#1b1b1b', { m: 'seat' }));
    const tc = '#2c2e30';
    for (const s of [-1, 1]) {
      p.push(vseg([s * W * 0.85, 0.72, -0.75], [s * W * 0.7, 1.6, -0.35], 0.07, tc, 'rim'), vseg([s * W * 0.88, 0.72, 0.75], [s * W * 0.72, 1.62, 0.6], 0.07, tc, 'rim'));
      p.push(vseg([s * W * 0.7, 1.6, -0.35], [s * W * 0.72, 1.62, 0.6], 0.07, tc, 'rim'), vseg([s * W * 0.85, 0.72, -0.75], [s * W * 0.5, 0.6, -L + 0.05], 0.06, tc, 'rim'));
    }
    p.push(vseg([-W * 0.7, 1.6, -0.35], [W * 0.7, 1.6, -0.35], 0.07, tc, 'rim'), vseg([-W * 0.72, 1.62, 0.6], [W * 0.72, 1.62, 0.6], 0.07, tc, 'rim'), vseg([-W * 0.7, 1.6, 0.12], [W * 0.7, 1.6, 0.12], 0.05, tc, 'rim'));
    p.push(bx(-0.3, 0.55, L - 0.1, 0.6, 0.4, 0.35, '#3a3a3a', { m: 'rim' }), { g: GEO.box, x: 0, y: 0.95, z: -0.55, rx: 0.5, sx: 0.36, sy: 0.04, sz: 0.04, c: '#111', m: 'plas' });
    for (const s of [-1, 1]) p.push({ g: GEO.cyl, x: s * 0.35, y: 0.62, z: -L - 0.02, rx: Math.PI / 2, sx: 0.16, sy: 0.06, sz: 0.16, c: '#fff3cf', m: 'light' });
    for (const [s, z, r, w] of [[-1, -L + 0.45, 0.45, 0.35], [1, -L + 0.45, 0.45, 0.35], [-1, L - 0.4, 0.5, 0.42], [1, L - 0.4, 0.5, 0.42]]) vwheel(p, s * (W + 0.1), z, r, w, s, '#3d4044', 5);
  } else {
    carBody(p, k, col, L, W);
    const jeep = k === 'jipe' || k === 'pickup' || k === 'van', r = k === 'van' ? 0.4 : jeep ? 0.45 : 0.35, tw = jeep ? 0.32 : 0.24, wx = jeep ? W - 0.08 : W - 0.1, fz = -L + (jeep ? 0.65 : 0.72), rz = L - (jeep ? 0.62 : 0.7);
    for (const s of [-1, 1]) for (const z of [fz, rz]) {
      varch(p, s * (W - 0.02), z, r, r + (jeep ? 0.1 : 0.06), jeep ? '#232323' : '#111');
      vwheel(p, s * wx, z, r, tw, s, jeep ? '#4a4d50' : '#a9adb1', jeep ? 6 : 5);
    }
  }
  return vehMerge(p);
}
/* material dos veículos: pintura metálica, vidro e cromo refletindo o céu, pneu fosco, poeira embaixo */
let _vehMat = null; const VEH_NIGHT = { value: 0 }; /* 1 à noite: faróis e lanternas acendem forte */
function vehMat() {
  if (SET.quality === 0 || typeof ENV_TEX === 'undefined' || !ENV_TEX) return MAT.world;
  if (_vehMat) return _vehMat;
  const m = new T.MeshStandardMaterial({ vertexColors: true, envMap: ENV_TEX, envMapIntensity: 0.8, roughness: 0.5, metalness: 0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = VEH_NIGHT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 vm; varying vec4 vVm; varying vec3 vOP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVm = vm; vOP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vVm; varying vec3 vOP; uniform float uNight;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float dust = (1.0 - smoothstep(0.15, 0.75, vOP.y)) * (0.55 + 0.45 * vn(vOP.xz * 6.0 + vOP.y * 3.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.31, 0.25), dust * (1.0 - vVm.y * 0.4) * 0.38 * (1.0 - step(0.5, vVm.z)) * (1.0 - step(0.8, vVm.x))); }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vVm.x + (1.0 - smoothstep(0.15, 0.75, vOP.y)) * 0.3 * (1.0 - vVm.x);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = vVm.y;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vVm.z * (1.0 + uNight * 5.0);');
  };
  m.customProgramCacheKey = () => 'veh-pbr';
  return _vehMat = m;
}
const WRECK = new T.MeshLambertMaterial({ vertexColors: true, color: 0x333333 });
function spawnVehicles() {
  for (const v of VEH) scene.remove(v.mesh);
  VEH.length = 0;
  const kinds = ['jipe', 'jipe', 'seda', 'seda', 'pickup', 'pickup', 'van', 'buggy', 'buggy', 'moto', 'moto', 'moto'];
  let tries = 0;
  while (VEH.length < 80 && tries++ < 2500) {
    const r = pick(ROADS), t = rr(0.08, 0.92), dx = r[2] - r[0], dz = r[3] - r[1], L = Math.hypot(dx, dz), side = Math.random() < 0.5 ? -1 : 1;
    const x = r[0] + dx * t - dz / L * 6 * side, z = r[1] + dz * t + dx / L * 6 * side, h = groundH(x, z);
    if (h < 1.5 || bldAt(x, z, 3) || VEH.some(v => Math.hypot(v.x - x, v.z - z) < 30)) continue;
    boxesNear(x - 3, z - 3, x + 3, z + 3, _near); if (_near.some(b => b.y1 > h + 0.5 && b.y0 < h + 2)) continue;
    const k = pick(kinds);
    // nasce com a frente livre (nada de poste, árvore ou parede logo à frente)
    let yaw = Math.atan2(-dx, -dz) + (Math.random() < 0.5 ? 0 : Math.PI) + rr(-0.15, 0.15);
    const clear = yw => [3, 6, 9, 12].every(dd => !pointBlocked(x - Math.sin(yw) * dd, h + 0.2, z - Math.cos(yw) * dd));
    if (!clear(yaw)) { yaw += Math.PI; if (!clear(yaw)) continue; }
    addVehicle(k, x, z, yaw);
  }
  // lanchas: água funda perto da terra (costa, portos, lagoas), a frente virada para o mar aberto
  const nb = MAPID === 'bal' ? 20 : 15; let bt = 0, nbt = 0;
  while (nbt < nb && bt++ < 4000) {
    const x = rr(-HALF + 30, HALF - 30), z = rr(-HALF + 30, HALF - 30), h = groundH(x, z);
    if (h > -1.6 || h < -9) continue;
    let near = false, ax = 0, az = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; if (groundH(x + Math.cos(a) * 22, z + Math.sin(a) * 22) > 0.5) { near = true; ax += Math.cos(a); az += Math.sin(a); } }
    if (!near || VEH.some(v => v.d.boat && Math.hypot(v.x - x, v.z - z) < 70)) continue;
    boxesNear(x - 4, z - 4, x + 4, z + 4, _near); if (_near.some(b => b.y1 > -0.5 && b.y0 < 2)) continue;
    addVehicle('lancha', x, z, Math.atan2(ax, az)); nbt++; // ax,az aponta para a terra: a frente (-z local) fica para o mar
  }
}
function addVehicle(k, x, z, yaw) {
  const d = VDEF[k], col = pick(d.cols);
  const v = { k, d, x, z, y: groundH(x, z), yaw, sp: 0, vy: 0, pitch: 0, roll: 0, hp: d.hp, seats: d.seats.map(() => null), thr: 0, str: 0, dead: false, air: false, wait: 0, stuckT: 0, revT: 0, lastHit: null, water: false };
  v.mesh = new T.Mesh(vehGeo(k, col, true), vehMat()); v.wheels = v.mesh.geometry.userData.wheels || []; v.wrot = 0; v.mesh.rotation.order = 'YXZ'; v.mesh.castShadow = v.mesh.receiveShadow = true; scene.add(v.mesh);
  VEH.push(v); syncVehMesh(v); return v;
}
function syncVehMesh(v) { v.mesh.position.set(v.x, v.y + (v.bob || 0), v.z); v.mesh.rotation.set(v.pitch + (v.pOff || 0), v.yaw, v.roll + (v.rOff || 0)); }
const vfx = v => -Math.sin(v.yaw), vfz = v => -Math.cos(v.yaw);
// altura de apoio (terreno ou plataforma baixa, como o píer)
function vSup(x, z, y) {
  let s = groundH(x, z);
  boxesNear(x - 0.3, z - 0.3, x + 0.3, z + 0.3, _air);
  for (const b of _air) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.y1 <= y + 0.7 && b.y1 > s) s = b.y1;
  return s;
}
// ---------- entrar, sair, trocar de assento ----------
function freeSeat(v, pref) {
  if (v.dead) return -1;
  if (pref >= 0 && !v.seats[pref]) return pref;
  for (let i = pref === 0 ? 0 : 1; i < v.seats.length; i++) if (!v.seats[i]) return i;
  return v.seats.findIndex(s => !s);
}
function passSeat(v) { if (v.dead) return -1; for (let i = 1; i < v.seats.length; i++) if (!v.seats[i]) return i; return -1; }
function enterVeh(a, v, pref) {
  const s = freeSeat(v, pref == null ? 0 : pref); if (s < 0) return false;
  a.veh = v; a.seat = s; v.seats[s] = a; a.vx = a.vz = 0; a.stance = 'crouch'; a.ads = false; a.leanT = a.lean = 0; a.healT = 0; a.reviving = null;
  if (s === 0 && a.bot) (G.vdrivers = G.vdrivers || []).push(a.id);
  if (s === 0) { v.revT = 0; if (a.bot) { a.ai.vstop = false; a.ai.vstuck = 0; } }
  if (G.net.on && !a.remote && !G.net.applying) netSend('veh', { ix: VEH.indexOf(v), a: actIx(a), seat: s, in: 1 });
  if (a === G.player) { IN.adsOn = false; toast(s === 0 ? `${v.d.n}: joystick acelera e vira. Puxe para trás para frear.` : `Passageiro do ${v.d.n}: dá para atirar daqui.`, 3); sfx('door'); }
  return true;
}
function leaveVeh(a, forced) {
  const v = a.veh; if (!v) return;
  if (G.net.on && !a.remote && !G.net.applying) netSend('veh', { ix: VEH.indexOf(v), a: actIx(a), seat: a.seat, in: 0 });
  v.seats[a.seat] = null; const s = v.d.seats[a.seat], rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
  const side = s[0] < 0 ? -1 : s[0] > 0 ? 1 : -1, off = v.d.hw + 0.9;
  let x = v.x + rx * side * off, z = v.z + rz * side * off;
  if (pointBlocked(x, v.y, z)) { x = v.x - rx * side * off; z = v.z - rz * side * off; }
  if (pointBlocked(x, v.y, z)) { x = v.x - vfx(v) * (v.d.hl + 1); z = v.z - vfz(v) * (v.d.hl + 1); }
  a.x = x; a.z = z; a.y = Math.max(vSup(x, z, v.y + 0.5), a.y); a.vy = 0; a.vx = vfx(v) * v.sp * 0.4; a.vz = vfz(v) * v.sp * 0.4;
  a.veh = null; a.seat = -1; a.stance = 'stand'; a.onGround = false;
  if (a.ai) a.ai.vehCd = G.matchT + 20;
  if (!forced && Math.abs(v.sp) > 12) hurt(a, (Math.abs(v.sp) - 12) * 4, null, false, 'queda');
  if (a === G.player) sfx('door');
}
function switchSeat(a) {
  const v = a.veh; if (!v) return;
  for (let k = 1; k <= v.seats.length; k++) { const i = (a.seat + k) % v.seats.length; if (!v.seats[i]) { v.seats[a.seat] = null; v.seats[i] = a; a.seat = i; if (a === G.player) toast(i === 0 ? 'Motorista' : 'Passageiro ' + i, 1.2); return; } }
  if (a === G.player) toast('Sem assento livre.', 1.2);
}
// ---------- dano ----------
function vehHurt(v, dmg, src) {
  if (v.dead) return;
  if (G.net.on && !G.net.host && !G.net.applying) { netSend('vhit', { to: G.net.hostUid, ix: VEH.indexOf(v), dmg: +dmg.toFixed(1), src: actIx(src) }); return; }
  v.netDirty = true;
  v.hp -= dmg; if (src) v.lastHit = src;
  if (v.hp <= 0) explode(v);
}
function explode(v) {
  v.dead = true; v.hp = 0; v.sp = 0; v.mesh.material = WRECK;
  for (let i = 0; i < 10; i++) puff(v.x + rr(-1.5, 1.5), v.y + rr(0.5, 2.5), v.z + rr(-1.5, 1.5), i % 2 ? '#ff7b00' : '#3a3a3a', 1.6, 1.4);
  sfx('boom');
  for (const a of v.seats.slice()) if (a) { leaveVeh(a, true); hurt(a, 160, v.lastHit, false, 'explosão'); }
  for (const a of G.actors) if (a.alive && a.mode === 'ground' && Math.hypot(a.x - v.x, a.z - v.z) < 5) hurt(a, 55, v.lastHit, false, 'explosão');
}
// bala x veículo (caixa girada)
const _hv = {};
function rayVehicles(ox, oy, oz, dx, dy, dz, len, skip) {
  let best = Infinity, who = null;
  for (const v of VEH) {
    if (v === skip || Math.abs(v.x - ox) > len + 4 || Math.abs(v.z - oz) > len + 4) continue;
    const c = Math.cos(v.yaw), s = Math.sin(v.yaw), px = ox - v.x, pz = oz - v.z;
    // eixos locais: direita (c,-s), trás (s,c)
    const lx = px * c - pz * s, lz = px * s + pz * c, ly = oy - v.y, ddx = dx * c - dz * s, ddz = dx * s + dz * c;
    const H = v.k === 'moto' ? 1.0 : v.d.h * 0.78, ix = 1 / (ddx || 1e-9), iy = 1 / (dy || 1e-9), iz = 1 / (ddz || 1e-9);
    let t1 = (-v.d.hw - lx) * ix, t2 = (v.d.hw - lx) * ix, tn = Math.min(t1, t2), tf = Math.max(t1, t2);
    t1 = (0.25 - ly) * iy; t2 = (H - ly) * iy; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
    t1 = (-v.d.hl - lz) * iz; t2 = (v.d.hl - lz) * iz; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
    if (tf >= Math.max(tn, 0) && tn < len && tn < best) { best = Math.max(tn, 0); who = v; }
  }
  _hv.t = best; _hv.v = who; return _hv;
}
// ---------- física ----------
function stepVehicles(dt) {
  for (const v of VEH) {
    if (G.net.on && !vehLocal(v)) { // simulado em outro aparelho: só acompanha
      netVehInterp(v, dt); syncVehMesh(v);
      const fx1 = vfx(v), fz1 = vfz(v), rx1 = Math.cos(v.yaw), rz1 = -Math.sin(v.yaw);
      for (let i = 0; i < v.seats.length; i++) { const a = v.seats[i]; if (!a) continue; if (!a.alive) { v.seats[i] = null; continue; } const s = v.d.seats[i]; a.x = v.x + rx1 * s[0] - fx1 * s[1]; a.z = v.z + rz1 * s[0] - fz1 * s[1]; a.y = v.y + s[2] - 0.6; a.stance = 'crouch'; if (i === 0) a.yaw = v.yaw; }
      continue;
    }
    const d = v.d, drv = v.seats[0];
    if (!drv || v.dead) { v.thr = 0; v.str = 0; }
    const fx = vfx(v), fz = vfz(v), rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
    // apoio nas 4 rodas
    const a0 = d.hl * 0.8, hF = vSup(v.x + fx * a0, v.z + fz * a0, v.y), hB = vSup(v.x - fx * a0, v.z - fz * a0, v.y);
    const hL = vSup(v.x - rx * d.hw, v.z - rz * d.hw, v.y), hR = vSup(v.x + rx * d.hw, v.z + rz * d.hw, v.y);
    let gy = (hF + hB + hL + hR) / 4;
    if (d.boat) {
      v.float = groundH(v.x, v.z) < -0.45;
      if (v.float) { gy = 0.05 + Math.sin(G.t * 1.7 + v.x * 0.3) * 0.06; v.water = false; v.revT = 0; } else { gy = Math.max(gy, 0); v.water = false; } // na terra: encalhado
    } else { v.water = gy < -1.3; if (v.water) gy = Math.max(gy, -1.25); }
    if (v.y > gy + 0.3) { v.air = true; v.vy -= 20 * dt; v.y += v.vy * dt; }
    if (v.y <= gy + 0.3) {
      if (v.air && v.vy < -9) { vehHurt(v, (-v.vy - 9) * 30, null); for (const a of v.seats) if (a) hurt(a, (-v.vy - 9) * 2, null, false, 'queda'); }
      if (v.air) v.bobV = (v.bobV || 0) + v.vy * 0.06; // quica ao cair
      const ny = gy; v.vy = v.air ? 0 : clamp((ny - v.y) / Math.max(dt, 1e-3), -30, 30); v.y = ny; v.air = false;
      if (d.boat && v.float) { // na água: bico sobe com a velocidade e o casco balança
        v.pitch += (clamp(v.sp / d.max, 0, 1) * 0.09 + Math.sin(G.t * 1.3 + v.z * 0.2) * 0.02 - v.pitch) * Math.min(1, dt * 3);
        v.roll += (Math.sin(G.t * 1.1 + v.x * 0.25) * 0.035 - v.str * clamp(v.sp / 12, -1, 1) * 0.08 - v.roll) * Math.min(1, dt * 3);
      } else {
      v.pitch += (Math.atan2(hF - hB, a0 * 2) - v.pitch) * Math.min(1, dt * 10);
      v.roll += (Math.atan2(hR - hL, d.hw * 2) - v.roll) * Math.min(1, dt * 10);
      }
    }
    // suspensão: frente afunda ao frear, traseira ao acelerar, carroceria inclina na curva, mola amortecida
    { const acc = (v.sp - (v.lastSp == null ? v.sp : v.lastSp)) / Math.max(dt, 1e-3); v.lastSp = v.sp; const kS = Math.min(1, dt * 6), soft = v.k === 'moto' ? 0.4 : 1;
      v.pOff = (v.pOff || 0) + (clamp(acc * 0.009, -0.09, 0.09) * soft - (v.pOff || 0)) * kS;
      const rollT = v.k === 'moto' ? clamp(v.str * Math.min(1, Math.abs(v.sp) / 12) * 0.45, -0.45, 0.45) : clamp(-v.str * v.sp * 0.0055, -0.1, 0.1);
      v.rOff = (v.rOff || 0) + (rollT - (v.rOff || 0)) * Math.min(1, dt * 5);
      v.bobV = ((v.bobV || 0) - (v.bob || 0) * 90 * dt) * Math.exp(-dt * 6); v.bob = clamp((v.bob || 0) + v.bobV * dt, -0.25, 0.25); }
    if (v.dead) { syncVehMesh(v); continue; }
    // motor
    if (!v.air) {
      const road = roadDist(v.x, v.z) < 5, max = d.boat ? (v.float ? d.max : 1.4) : d.max * (road ? 1 : 0.8) * (v.water ? 0.08 : 1);
      if (v.thr > 0.05) v.sp += (v.sp < -0.5 ? 16 : d.acc * (1 - clamp(v.sp / max, 0, 1) * 0.85)) * v.thr * dt;
      else if (v.thr < -0.05) v.sp += (v.sp > 0.5 ? -18 : v.sp > -7 ? -5 : 0) * -v.thr * dt;
      else v.sp -= Math.sign(v.sp) * Math.min(Math.abs(v.sp), (drv ? 2.5 : 6) * dt);
      if (v.sp > max) v.sp += (max - v.sp) * Math.min(1, dt * 2);
      if (!d.boat) v.sp -= Math.sin(v.pitch) * 7 * dt;
      else if (v.float && Math.abs(v.sp) > 6 && (v.wakeT = (v.wakeT || 0) - dt) <= 0) { v.wakeT = 0.07; puff(v.x - vfx(v) * d.hl + rr(-0.4, 0.4), 0.15, v.z - vfz(v) * d.hl + rr(-0.4, 0.4), '#f2f6f8', 0.5, 0.9); } // espuma atrás
      v.yaw -= v.str * d.turn * clamp(v.sp / 5, -1, 1) * (1 - clamp(Math.abs(v.sp) / 55, 0, 0.45)) * dt;
      if (v.water && drv) v.revT += dt;
    }
    v.x = clamp(v.x + vfx(v) * v.sp * dt, -HALF + 6, HALF - 6); v.z = clamp(v.z + vfz(v) * v.sp * dt, -HALF + 6, HALF - 6);
    // batidas em paredes, árvores e pedras (2 círculos ao longo do veículo)
    const ccs = v.k === 'moto' ? [0.5] : [d.hl - d.hw, -(d.hl - d.hw)], R = v.k === 'moto' ? 0.5 : d.hw + 0.1;
    for (const off of v.k === 'moto' ? [0.45, -0.45] : ccs) {
      const cx = v.x + vfx(v) * off, cz = v.z + vfz(v) * off;
      boxesNear(cx - R - 0.5, cz - R - 0.5, cx + R + 0.5, cz + R + 0.5, _near);
      for (const b of _near) {
        if (b.y1 <= v.y + 0.6 || b.y0 >= v.y + d.h) continue;
        const qx = clamp(cx, b.x0, b.x1), qz = clamp(cz, b.z0, b.z1), ex = cx - qx, ez = cz - qz, dd = Math.hypot(ex, ez);
        if (dd >= R) continue;
        const nx = dd > 1e-6 ? ex / dd : -vfx(v), nz = dd > 1e-6 ? ez / dd : -vfz(v), pen = R - dd;
        v.x += nx * pen; v.z += nz * pen;
        const into = -(vfx(v) * nx + vfz(v) * nz) * v.sp; // velocidade contra a parede
        if (into > 0) { const sp = Math.abs(v.sp); if (sp > 6) { vehHurt(v, (sp - 6) * 22, null); for (const a of v.seats) if (a && sp > 13) hurt(a, (sp - 13) * 2.5, null, false, 'batida'); sfx('crash'); } v.sp *= into > 4 ? -0.15 : 0.5; }
      }
    }
    // veículo x veículo
    for (const o of VEH) {
      if (o === v) continue; const dx = v.x - o.x, dz = v.z - o.z, dd = Math.hypot(dx, dz), m = (d.hl + o.d.hl) * 0.6;
      if (dd < m && dd > 1e-3) { const p = (m - dd) / 2; v.x += dx / dd * p; v.z += dz / dd * p; o.x -= dx / dd * p; o.z -= dz / dd * p; if (Math.abs(v.sp) > 6) { vehHurt(o, Math.abs(v.sp) * 8, drv); vehHurt(v, Math.abs(v.sp) * 6, null); } v.sp *= 0.5; }
    }
    // pedestres: empurra e atropela
    const ax0 = v.x + vfx(v) * (d.hl - 0.2), az0 = v.z + vfz(v) * (d.hl - 0.2), ax1 = v.x - vfx(v) * (d.hl - 0.2), az1 = v.z - vfz(v) * (d.hl - 0.2);
    for (const a of G.actors) {
      if (!a.alive || a.veh || a.mode !== 'ground' || Math.abs(a.x - v.x) > 5 || Math.abs(a.z - v.z) > 5 || a.y > v.y + d.h || a.y < v.y - 1.5) continue;
      const ux = ax1 - ax0, uz = az1 - az0, t = clamp(((a.x - ax0) * ux + (a.z - az0) * uz) / (ux * ux + uz * uz), 0, 1);
      const qx = ax0 + ux * t, qz = az0 + uz * t, ex = a.x - qx, ez = a.z - qz, dd = Math.hypot(ex, ez), lim = d.hw + RAD;
      if (dd >= lim) continue;
      const nx = dd > 1e-6 ? ex / dd : rx, nz = dd > 1e-6 ? ez / dd : rz;
      a.x = qx + nx * lim; a.z = qz + nz * lim;
      const sp = Math.abs(v.sp);
      if (sp > 4 && (!a.runT || G.matchT - a.runT > 0.6)) { a.runT = G.matchT; hurt(a, sp * 6, drv && drv.team !== a.team ? drv : null, false, 'atropelado'); a.vx += nx * sp * 0.5; a.vz += nz * sp * 0.5; v.sp *= 0.85; }
    }
    // afundou na água: motor morre aos poucos
    if (v.water && v.revT > 6) { v.sp *= 0.9; }
    syncVehMesh(v);
    // ocupantes acompanham o assento
    for (let i = 0; i < v.seats.length; i++) {
      const a = v.seats[i]; if (!a) continue;
      if (!a.alive) { v.seats[i] = null; continue; }
      const s = d.seats[i]; a.x = v.x + rx * s[0] - fx * s[1]; a.z = v.z + rz * s[0] - fz * s[1]; a.y = v.y + s[2] - 0.6;
      a.vx = fx * v.sp; a.vz = fz * v.sp; a.vy = 0; a.onGround = true; a.stance = 'crouch';
      if (i === 0 || (!a.trigger && a.bot && !(a.ai && a.ai.vis))) a.yaw = v.yaw;
    }
  }
  engineSound();
}
function engineSound() {
  const p = G.player; let best = null, bd = 90;
  for (const v of VEH) { if (v.dead || !v.seats[0]) continue; const d = Math.hypot(v.x - camera.position.x, v.z - camera.position.z); if (d < bd) { bd = d; best = v; } }
  sfxEngine(best ? Math.abs(best.sp) : 0, best ? (best === p.veh ? 1 : 1 / (1 + bd / 15)) : 0, best && best.k === 'moto');
}
const nearVeh = (a, r) => { let b = null, bd = r; for (const v of VEH) { if (v.dead) continue; const d = Math.hypot(v.x - a.x, v.z - a.z); if (d < bd && Math.abs(v.y - a.y) < 2.5 && freeSeat(v, 0) >= 0) { bd = d; b = v; } } return b; };

// ---------- bots dirigindo ----------
function botDrive(a, v, dt) {
  const ai = a.ai;
  if (v.wait > 0) { v.wait -= dt; v.thr = v.sp > 0.5 ? -1 : 0; v.str = 0; if (!G.actors.some(m => m.team === a.team && m !== a && m.alive && !m.veh && m.ai && m.ai.vehT === v)) v.wait = 0; return; }
  const tx = ai.vtx, tz = ai.vtz, dx = tx - v.x, dz = tz - v.z, dist = Math.hypot(dx, dz);
  if (dist < 22 || v.water || v.hp < 260) ai.vstop = true;
  if (ai.vstop) { v.thr = v.sp > 0.6 ? -1 : 0; v.str = 0; if (Math.abs(v.sp) < 1) leaveVeh(a); return; }
  let diff = wrapA(Math.atan2(-dx, -dz) - v.yaw);
  // antenas na frente (paredes, árvores, mar)
  const look = 4 + Math.abs(v.sp) * 0.55, fwdBlocked = o => pointBlocked(v.x + Math.sin(-(v.yaw + o)) * look, v.y + 0.3, v.z - Math.cos(v.yaw + o) * look);
  if ((ai.vfeel = (ai.vfeel || 0) - dt) <= 0) {
    ai.vfeel = 0.2; ai.vbias = 0;
    if (fwdBlocked(0)) ai.vbias = !fwdBlocked(0.5) ? 0.8 : !fwdBlocked(-0.5) ? -0.8 : !fwdBlocked(1.1) ? 1.4 : -1.4;
  }
  diff += ai.vbias || 0;
  if (ai.vrev > 0) { ai.vrev -= dt; v.thr = -1; v.str = clamp(diff * 2, -1, 1); return; }
  v.str = clamp(-diff * 2.2, -1, 1);
  v.thr = dist < 60 ? 0.5 : Math.abs(diff) > 1 && v.sp > 9 ? 0.15 : 1;
  ai.vstuck = Math.abs(v.sp) < 1.5 ? (ai.vstuck || 0) + dt : 0;
  if (ai.vstuck > 1.6) { ai.vstuck = 0; ai.vrev = rr(1, 1.8); }
}
// bot dentro de veículo
function botInVeh(a, dt) {
  const ai = a.ai, v = a.veh;
  if ((ai.think -= dt) <= 0) {
    ai.think = rr(0.25, 0.35);
    const s = botScan(a);
    if (s) { if (ai.enemy !== s) { ai.enemy = s; ai.react = botP(a).react * rr(0.8, 1.4); ai.engT = 0; } ai.vis = true; ai.seenX = s.x; ai.seenZ = s.z; ai.lostT = 0; } else ai.vis = false;
    if (a.seat === 0 && ai.vis && Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z) < 50 && v.k !== 'moto') ai.vstop = true;
    if (a.seat === 0 && ai.vis && v.k === 'moto' && Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z) < 35) ai.vstop = true;
    if (a.seat !== 0) { const drv = v.seats[0]; if (!drv && Math.abs(v.sp) < 1.5) { leaveVeh(a); return; } if (drv && drv.ai && drv.ai.vstop && Math.abs(v.sp) < 1.5) { leaveVeh(a); return; } }
  }
  if (!a.veh) return;
  if (a.seat === 0) { a.trigger = false; botDrive(a, v, dt); return; }
  if (ai.vis && ai.enemy && hasGun(a)) { botPickWeapon(a, Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z)); botFight(a, dt); a.stance = 'crouch'; }
  else { a.trigger = false; a.yaw = v.yaw; }
}
