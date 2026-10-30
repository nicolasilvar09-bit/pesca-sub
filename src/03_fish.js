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
  dourado: { name: 'Dourado', shape: 'mahi', len: [0.6, 1.5], k: 7, price: 40, min: 0.6, cruise: 1.4, burst: 6.2, shy: 0.4, curious: 0.75, habit: 'pelagic', str: 1.8, school: true,
    col: { back: '#1c7a72', side: '#cfc63a', belly: '#f2e27a', fin: '#2a8a9a', iris: '#e8e080' } },
  bicuda: { name: 'Bicuda', shape: 'barra', len: [0.55, 1.4], k: 3.2, price: 25, min: 0.5, cruise: 0.8, burst: 6.5, shy: 0.35, curious: 0.85, habit: 'pelagic', str: 1.3, school: true,
    col: { back: '#3d4e58', side: '#c8d0d4', belly: '#f0f2f2', fin: '#5a6a70', iris: '#e8e0b0' } },
  // pequenos de costão
  cocoroca: { name: 'Cocoroca', shape: 'deep', len: [0.14, 0.3], k: 21, price: 14, min: 0.15, cruise: 0.6, burst: 3.0, shy: 0.4, curious: 0.55, habit: 'reef', str: 0.6, school: true,
    col: { back: '#5d6a7a', side: '#b9c4cc', belly: '#eef0f0', fin: '#c9b04a', iris: '#d8c060' } },
  canhanha: { name: 'Canhanha', shape: 'deep', len: [0.18, 0.38], k: 22, price: 16, min: 0.18, cruise: 0.65, burst: 3.2, shy: 0.45, curious: 0.6, habit: 'reef', str: 0.7, school: true,
    col: { back: '#6b6f60', side: '#c8c8b0', belly: '#f2f0e0', fin: '#b8a048', iris: '#d0b060' } },
  peixegalo: { name: 'Peixe-galo', shape: 'disc', len: [0.18, 0.45], k: 18, price: 18, min: 0.2, cruise: 0.8, burst: 3.6, shy: 0.5, curious: 0.65, habit: 'mid', str: 0.8, school: true,
    col: { back: '#7a8a98', side: '#dfe6ec', belly: '#f6f8fa', fin: '#a8b4bc', iris: '#e0e0d0' } },
  cangulo: { name: 'Cangulo', shape: 'parrot', len: [0.22, 0.55], k: 26, price: 15, min: 0.25, cruise: 0.45, burst: 2.6, shy: 0.35, curious: 0.7, habit: 'reef', str: 0.9,
    col: { back: '#4f5650', side: '#7d857a', belly: '#b8bca8', fin: '#45504a', iris: '#5aa0d0' } },
  // médios e grandes
  cioba: { name: 'Cioba', shape: 'snap', len: [0.35, 0.85], k: 14, price: 48, min: 0.35, cruise: 0.6, burst: 3.6, shy: 0.75, curious: 0.3, habit: 'reef', str: 1.2,
    col: { back: '#5f5a46', side: '#c0906e', belly: '#ecd2bc', fin: '#c46a50', iris: '#e06040' } },
  olhete: { name: 'Olhete', shape: 'amber', len: [0.6, 1.4], k: 11, price: 36, min: 0.6, cruise: 1.2, burst: 5.4, shy: 0.45, curious: 0.8, habit: 'pelagic', str: 2.0, school: true,
    col: { back: '#3b5470', side: '#c4ccd2', belly: '#eff1f1', fin: '#d6b43a', iris: '#d8c060' } },
  albacora: { name: 'Albacora', shape: 'tuna', len: [0.7, 1.8], k: 16, price: 24, min: 0.6, cruise: 1.5, burst: 6.8, shy: 0.55, curious: 0.5, habit: 'pelagic', str: 2.6, school: true,
    col: { back: '#1d2c52', side: '#9eb0c4', belly: '#eef1f4', fin: '#f0c81e', iris: '#d0d0d0' } },
  // raros: aparecem só às vezes nos pontos de pedra funda
  dentao: { name: 'Dentão', shape: 'snap', len: [0.45, 0.95], k: 15, price: 85, min: 0.4, cruise: 0.5, burst: 3.8, shy: 0.95, curious: 0.15, habit: 'reef', str: 1.5, rare: true,
    col: { back: '#6a3a2a', side: '#b0603e', belly: '#e8b090', fin: '#8a3a28', iris: '#e06030' } },
  cherne: { name: 'Cherne', shape: 'grouper', len: [0.5, 1.1], k: 14, price: 90, min: 0.45, cruise: 0.35, burst: 2.8, shy: 0.8, curious: 0.35, habit: 'hole', str: 1.5, rare: true,
    col: { back: '#2a2420', side: '#4a3e34', belly: '#7a6a58', fin: '#2a221c', iris: '#c09040' } },
  mero: { name: 'Mero', shape: 'grouper', len: [1.4, 2.2], k: 15, price: 0, min: 9, cruise: 0.3, burst: 1.8, shy: 0.1, curious: 0.6, habit: 'hole', str: 3.5, protected: true,
    col: { back: '#3e3a26', side: '#5d5a3c', belly: '#8d8a68', fin: '#3a3622', iris: '#a08040' } },
};
const SHAPES = {
  deep: { jaw: 0.5, h: 0.46, w: 0.11, pk: 0.85, fork: true, tailH: 0.21, dors: 0.12, df: 'one', pec: 0.12 },
  disc: { jaw: 0.3, h: 0.66, w: 0.08, pk: 0.8, fork: false, tailH: 0.2, dors: 0.22, df: 'one', pec: 0.11 },
  parrot: { jaw: 0.0, h: 0.33, w: 0.15, pk: 0.72, fork: false, tailH: 0.17, dors: 0.07, df: 'one', pec: 0.12 },
  grouper: { jaw: 1.3, h: 0.31, w: 0.18, pk: 0.72, fork: false, tailH: 0.15, dors: 0.08, df: 'one', pec: 0.13 },
  snap: { jaw: 1.0, h: 0.36, w: 0.14, pk: 0.78, fork: true, tailH: 0.18, dors: 0.09, df: 'one', pec: 0.13 },
  slim: { jaw: 0.8, h: 0.23, w: 0.12, pk: 0.78, fork: true, tailH: 0.17, dors: 0.08, df: 'two', pec: 0.1 },
  mack: { jaw: 0.8, h: 0.18, w: 0.09, pk: 0.8, fork: true, tailH: 0.2, dors: 0.05, df: 'two', pec: 0.08 },
  jack: { jaw: 0.6, h: 0.37, w: 0.11, pk: 0.82, fork: true, tailH: 0.26, dors: 0.06, df: 'two', pec: 0.17 },
  mahi: { jaw: 0.4, h: 0.27, w: 0.09, pk: 0.92, fork: true, tailH: 0.25, dors: 0.11, df: 'long', pec: 0.12 },
  barra: { jaw: 1.6, h: 0.13, w: 0.075, pk: 0.7, fork: true, tailH: 0.14, dors: 0.05, df: 'two', pec: 0.07 },
  amber: { jaw: 0.7, h: 0.26, w: 0.12, pk: 0.85, fork: true, tailH: 0.23, dors: 0.05, df: 'two', pec: 0.11 },
  tuna: { jaw: 0.4, h: 0.29, w: 0.19, pk: 0.72, fork: true, tailH: 0.32, dors: 0.11, df: 'two', pec: 0.16 },
};
// corpo em tubo + nadadeiras em malha (com raios na textura) + olhos em relevo.
// aPart = (parte, peso): 0 corpo, 1 caudal, 2 peitoral, 3 dorsal/anal/pélvica; peso 0 na base, 1 na borda
function fishGeo(sh, lo) {
  const NL = lo ? 12 : 22, NR = lo ? 10 : 16, pos = [], uv = [], prt = [], idx = [], x0 = -0.36, x1 = 0.5;
  const prof = t => 0.12 + 0.88 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), sh.pk)), 0.6);
  const X = t => lerp(x0, x1, t), TOP = t => sh.h * prof(t) * 0.5, SIDE = t => sh.w * prof(t) * 0.5;
  const add = (x, y, z, u, v, p = 0, w = 0) => { pos.push(x, y, z); uv.push(u, v); prt.push(p, w); return pos.length / 3 - 1; };
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, x = X(t), hh = TOP(t), ww = SIDE(t);
    for (let j = 0; j <= NR; j++) {
      const a = j / NR * TAU, ca = Math.cos(a), belly = ca < 0 ? 0.92 : 1;
      // boca: o maxilar de baixo avança e a cabeça afina por cima, dando a linha da boca
      const jw = (sh.jaw != null ? sh.jaw : 0.6) * smooth(0.84, 1, t), jx = jw * (ca < 0 ? 0.035 * -ca : -0.012 * ca);
      // testa: o alto da cabeça sobe e cai reto (dourado, xaréu, peixe-galo); focinho: a cabeça se alonga
      const br = ca > 0 && sh.brow ? 1 + sh.brow * smooth(0.55, 0.9, t) * (1 - smooth(0.93, 1.0, t)) * ca : 1, sn = (sh.snout || 0) * smooth(0.85, 1, t);
      add(x + jx + sn, ca * hh * belly * br, Math.sin(a) * ww * (1 - 0.25 * Math.pow(Math.abs(ca), 3)), t * 0.97, (j / NR) * 0.78);
    }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const tc = add(x0, 0, 0, 0, 0.39); for (let j = 0; j < NR; j++) idx.push(tc, j + 1, j);
  const sc = add(x1 + 0.012 + (sh.snout || 0), 0, 0, 0.99, 0.39), base = NL * (NR + 1); for (let j = 0; j < NR; j++) idx.push(sc, base + j, base + j + 1);
  // nadadeira: faixa entre a base e a borda; u corre ao longo da base (raios), v da base (0.8) à borda (0.99)
  const fin = (S, R, bse, edge, p, us) => {
    const o = pos.length / 3;
    for (let i = 0; i <= S; i++) { const s = i / S, b = bse(s), e = edge(s, b); for (let r = 0; r <= R; r++) { const w = r / R; add(lerp(b[0], e[0], w), lerp(b[1], e[1], w), lerp(b[2], e[2], w), s * us, 0.8 + 0.19 * w, p, w); } }
    for (let i = 0; i < S; i++) for (let r = 0; r < R; r++) { const a = o + i * (R + 1) + r, b = a + R + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  };
  const S = lo ? 5 : 10, R = lo ? 1 : 3;
  // barbilhões dos bagres: fios longos saindo da boca
  if (sh.barbels && !lo) for (const sz of [1, -1]) fin(4, 1, s => [X(0.97) - s * 0.01, -TOP(0.97) * 0.3, sz * SIDE(0.97) * 0.5], (s, b) => [b[0] - 0.22 * (0.3 + 0.7 * s), b[1] - 0.04 - 0.02 * s, b[2] + sz * 0.08 * (0.4 + s)], 3, 0.05);
  // caudal: bifurcada (lobos pontudos) ou arredondada
  const hp = TOP(0), tH = sh.tailH, tip = sh.tip || (sh.fork ? 0.19 : 0.15), mid = sh.mid || (sh.fork ? 0.075 : 0.15);
  fin(S + 2, R, s => [x0 + 0.02, hp * (1 - 2 * s) * 0.95, 0], s => { const ys = 1 - 2 * s; return sh.fork ? [x0 - (mid + (tip - mid) * Math.pow(Math.abs(ys), 1.3)) * (sh.hetero && ys > 0 ? 1.7 : 1), ys * tH * (sh.hetero ? (ys > 0 ? 1.5 : 0.7) : 1), 0] : [x0 - tip * (1 - 0.3 * ys * ys), ys * tH * 0.95, 0]; }, 1, 0.9);
  // dorsais e anal: perfil por nós (raia dura na frente, mole atrás)
  const dfin = (a, b, h, K, down) => { const pf = knots(K); fin(S, R, s => { const t = lerp(a, b, s); return [X(t), (down ? -0.88 : 0.94) * TOP(t), 0]; }, (s, bb) => [bb[0] - h * 0.35 * pf(s), bb[1] + (down ? -1 : 1) * h * pf(s), 0], 3, 0.5); };
  const D = sh.dors;
  // nadadeiras sob medida por espécie: [início, fim, altura (× dors), nós, embaixo?]
  if (sh.fins) for (const [a, b, h, K, down] of sh.fins) dfin(a, b, D * h, K, down);
  else if (sh.df === 'one') dfin(0.2, 0.8, D, [[0, 0], [0.1, 0.8], [0.38, 0.62], [0.48, 0.5], [0.6, 0.85], [0.8, 1], [0.95, 0.7], [1, 0]]);
  else if (sh.df === 'long') dfin(0.1, 0.97, D, [[0, 0], [0.06, 0.45], [0.6, 0.7], [0.93, 1], [1, 0]]);
  else if (sh.df === 'back') { dfin(0.05, 0.36, D, [[0, 0], [0.12, 0.7], [0.7, 1], [0.95, 0.8], [1, 0]]); dfin(0.05, 0.34, D * 0.9, [[0, 0], [0.12, 0.7], [0.7, 1], [0.95, 0.8], [1, 0]], true); }
  else if (sh.hetero) { dfin(0.4, 0.6, D * 1.8, [[0, 0], [0.15, 0.55], [0.55, 1], [0.85, 0.55], [1, 0]]); dfin(0.13, 0.21, D * 0.45, [[0, 0], [0.5, 1], [1, 0]]); } // tubarão: 1ª dorsal grande, 2ª pequena
  else { dfin(0.56, 0.78, D * 1.2, [[0, 0], [0.15, 0.45], [0.65, 1], [0.92, 0.9], [1, 0]]); dfin(0.22, 0.44, D, [[0, 0], [0.2, 0.6], [0.75, 1], [1, 0]]); }
  if (sh.fins) { }
  else if (sh.df === 'long') dfin(0.1, 0.5, D * 0.8, [[0, 0], [0.1, 0.6], [0.85, 1], [1, 0]], true);
  else if (sh.hetero) dfin(0.13, 0.21, D * 0.4, [[0, 0], [0.5, 1], [1, 0]], true);
  else if (sh.df !== 'back') dfin(0.17, 0.42, D * 0.75, [[0, 0], [0.2, 0.7], [0.75, 1], [1, 0]], true);
  // pínulas (atuns e cavalas): fileira de nadadeirinhas antes da cauda, em cima e embaixo
  if (sh.finlets && !lo) for (let k = 0; k < sh.finlets; k++) for (const dn of [false, true]) {
    const t0 = 0.05 + k * 0.024; fin(1, 1, s => { const t = t0 + s * 0.016; return [X(t), (dn ? -0.9 : 0.92) * TOP(t), 0]; }, (s, b) => [b[0] - 0.012, b[1] + (dn ? -1 : 1) * 0.022 * (1 - s), 0], 3, 0.3);
  }
  // quilha no pedúnculo da cauda (atum, xaréu): aba lateral fina
  if (sh.keel && !lo) for (const sz of [1, -1]) fin(3, 1, s => [X(0.02 + s * 0.12), 0, sz * SIDE(0.02 + s * 0.12) * 0.95], (s, b) => [b[0], b[1], b[2] + sz * sh.keel * Math.sin(Math.PI * s)], 3, 0.2);
  // peitorais (folha voltada para trás e para fora) e pélvicas
  const pl = sh.pec, pt = 0.69;
  for (const sz of [1, -1]) {
    const y0 = -TOP(pt) * 0.3, z0 = sz * SIDE(pt) * 0.92;
    fin(S, R, s => [X(pt) + 0.01 - s * 0.015, y0 + 0.022 - s * 0.044, z0], (s, b) => { const L = pl * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * s)), 0.7)) * (1 - 0.35 * s); return [b[0] - L * 0.9, b[1] - L * 0.35, b[2] + sz * L * 0.32]; }, 2, 0.4);
    const yb = -TOP(0.6) * 0.86;
    fin(lo ? 2 : 4, 1, s => [X(0.62) - s * 0.05, yb + s * 0.004, sz * 0.012], (s, b) => [b[0] - 0.05 * (1 - s), b[1] - D * 0.6 * (1 - s * 0.8), b[2] + sz * 0.025], 3, 0.25);
  }
  // olhos: cúpula com UV mapeada sobre a íris pintada na textura
  if (!lo) for (const sz of [1, -1]) {
    const t = 0.922, er = Math.min(0.03, TOP(t) * 0.42), cx = X(t), cy = TOP(t) * 0.12, cz = sz * SIDE(t) * 0.9, cu = 229 / 256, cv = (sz > 0 ? 25 : 75) / 128, o = pos.length / 3, RN = 3, AN = 10;
    add(cx, cy, cz + sz * er * 0.55, cu, cv);
    for (let r = 1; r <= RN; r++) for (let k = 0; k < AN; k++) { const a = k / AN * TAU, f = r / RN, ph = f * Math.PI / 2; add(cx + Math.cos(a) * Math.sin(ph) * er, cy + Math.sin(a) * Math.sin(ph) * er, cz + sz * Math.cos(ph) * er * 0.55, cu + Math.cos(a) * f * 7 / 256, cv + Math.sin(a) * f * 7 / 128); }
    for (let k = 0; k < AN; k++) { const k1 = (k + 1) % AN; idx.push(o, o + 1 + k, o + 1 + k1); for (let r = 1; r < RN; r++) { const a = o + 1 + (r - 1) * AN, b = a + AN; idx.push(a + k, b + k, a + k1, b + k, b + k1, a + k1); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(prt, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function fishTex(key, c) {
  c = c || SPECIES[key].col;
  const t = canvasTex(256, 128, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 100);
    gr.addColorStop(0, c.back); gr.addColorStop(0.28, c.side); gr.addColorStop(0.5, c.belly); gr.addColorStop(0.72, c.side); gr.addColorStop(1, c.back);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 100);
    const fg = g.createLinearGradient(0, 100, 0, 128); fg.addColorStop(0, c.fin); fg.addColorStop(0.75, c.fin); fg.addColorStop(1, c.side); g.fillStyle = fg; g.fillRect(0, 100, 256, 28);
    g.fillStyle = 'rgba(0,0,0,.22)'; for (let x = 2; x < 256; x += 6) g.fillRect(x, 101, 1.4, 27); g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 5; x < 256; x += 6) g.fillRect(x, 101, 1, 27);
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
    if (key === 'frade') { for (let i = 0; i < 160; i++) blob(R() * 220, R() * 100, 2.5, 3.5, 'rgba(230,200,60,.75)'); g.fillStyle = 'rgba(230,200,60,.8)'; g.fillRect(208, 0, 5, 100); g.fillStyle = '#d8b030'; g.fillRect(0, 124, 256, 4); }
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
    if (key === 'dourado') { for (let i = 0; i < 70; i++) blob(10 + R() * 200, R() * 100, 2.5, 2.5, 'rgba(40,110,200,.7)'); g.fillStyle = 'rgba(30,140,140,.5)'; g.fillRect(0, 0, 256, 10); g.fillRect(0, 90, 256, 10); }
    if (key === 'bicuda') { g.strokeStyle = 'rgba(20,30,35,.45)'; g.lineWidth = 6; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(20 + i * 12, 0); g.lineTo(10 + i * 12, 26); g.moveTo(20 + i * 12, 100); g.lineTo(10 + i * 12, 74); g.stroke(); } for (let i = 0; i < 20; i++) blob(R() * 180, 30 + R() * 40, 3, 2, 'rgba(10,10,10,.5)'); }
    if (key === 'cocoroca') { g.fillStyle = 'rgba(240,200,60,.55)'; for (const y of [12, 22, 32, 68, 78, 88]) g.fillRect(0, y, 210, 3); blob(14, 30, 4, 4, 'rgba(10,10,10,.35)'); blob(14, 70, 4, 4, 'rgba(10,10,10,.35)'); }
    if (key === 'canhanha') { g.fillStyle = 'rgba(220,180,70,.4)'; for (let y = 6; y < 100; y += 7) g.fillRect(0, y, 210, 1.6); blob(170, 22, 7, 6, 'rgba(10,10,10,.55)'); blob(170, 78, 7, 6, 'rgba(10,10,10,.55)'); }
    if (key === 'peixegalo') { const gl = g.createLinearGradient(0, 0, 256, 100); gl.addColorStop(0, 'rgba(160,190,230,.25)'); gl.addColorStop(0.5, 'rgba(255,255,255,.3)'); gl.addColorStop(1, 'rgba(200,170,230,.2)'); g.fillStyle = gl; g.fillRect(0, 0, 256, 100); }
    if (key === 'cangulo') { for (let i = 0; i < 50; i++) blob(R() * 200, R() * 100, 2, 2, 'rgba(110,170,220,.5)'); g.fillStyle = 'rgba(30,35,30,.25)'; for (const x of [60, 110, 160]) g.fillRect(x, 0, 14, 100); }
    if (key === 'cioba') { g.strokeStyle = 'rgba(90,150,230,.7)'; g.lineWidth = 1.5; for (const y of [30, 36, 64, 70]) { g.beginPath(); g.moveTo(250, y); g.lineTo(212, y + (y < 50 ? -4 : 4)); g.stroke(); } blob(120, 20, 8, 7, 'rgba(10,10,10,.55)'); blob(120, 80, 8, 7, 'rgba(10,10,10,.55)'); }
    if (key === 'olhete') { g.strokeStyle = 'rgba(230,200,60,.7)'; g.lineWidth = 6; for (const y of [30, 70]) { g.beginPath(); g.moveTo(250, y); g.lineTo(10, y + (y < 50 ? -3 : 3)); g.stroke(); } }
    if (key === 'albacora') { g.fillStyle = 'rgba(240,200,30,.55)'; g.fillRect(20, 34, 210, 5); g.fillRect(20, 61, 210, 5); g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 20; x < 180; x += 9) { g.fillRect(x, 40, 2, 20); } g.fillStyle = '#f0c81e'; for (let x = 4; x < 60; x += 9) { g.fillRect(x, 4, 4, 6); g.fillRect(x, 90, 4, 6); } }
    if (key === 'dentao') { g.fillStyle = 'rgba(240,240,250,.75)'; for (const y of [25, 75]) { g.beginPath(); g.moveTo(222, y + (y < 50 ? 4 : -4)); g.lineTo(232, y + (y < 50 ? 4 : -4)); g.lineTo(226, y + (y < 50 ? 18 : -18)); g.fill(); } g.strokeStyle = 'rgba(90,150,230,.6)'; g.lineWidth = 1.5; for (const y of [30, 34, 66, 70]) { g.beginPath(); g.moveTo(238, y); g.lineTo(252, y + (y < 50 ? 3 : -3)); g.stroke(); } }
    if (key === 'cherne') { for (let i = 0; i < 26; i++) blob(R() * 200, 10 + R() * 80, 3 + R() * 3, 3 + R() * 3, 'rgba(230,225,210,.45)'); }
    if (key === 'olhodeboi') { g.strokeStyle = 'rgba(200,150,40,.7)'; g.lineWidth = 7; for (const y of [25, 75]) { g.beginPath(); g.moveTo(240, y - (y < 50 ? 12 : -12)); g.lineTo(20, y); g.stroke(); } }
    amzTex(key, g, blob, bars, R); neTex(key, g, blob, bars, R); oceanTex(key, g, blob, bars, R);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '255,255,255' : '0,0,0'},${R() * 0.07})`; g.fillRect(R() * 256, R() * 100, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; for (const [a, b] of [[6, 44], [56, 94]]) { g.beginPath(); g.moveTo(203, a); g.quadraticCurveTo(196, (a + b) / 2, 203, b); g.stroke(); }
    g.strokeStyle = 'rgba(10,8,8,.55)'; g.lineWidth = 2; for (const [y, d] of [[36, -1], [64, 1]]) { g.beginPath(); g.moveTo(256, y); g.quadraticCurveTo(247, y + d * 2, 238, y + d * 6); g.stroke(); }
    for (const y of [25, 75]) { g.fillStyle = c.iris; g.beginPath(); g.arc(229, y, 6.5, 0, TAU); g.fill(); g.fillStyle = '#060606'; g.beginPath(); g.arc(229, y, 3.8, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(228, y - 1.6, 1.3, 0, TAU); g.fill(); }
  });
  t.flipY = false; t.anisotropy = 4; return t;
}

// ===== renderização instanciada: 1 draw call por espécie =====
const POOLS = {};
const _dummy = new THREE.Object3D();
function makePool(key, shape, tex, max, lo) {
  const geo = fishGeo(shapeOf(key, shape), lo);
  const anim = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3); anim.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aAnim', anim);
  const mat = uwify(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.36, metalness: 0.3, side: THREE.DoubleSide }), {
    key: 'fishI', vHead: 'attribute vec3 aAnim;\nattribute vec2 aPart;\n',
    // onda que corre da cabeça para a cauda, crescendo para trás; curva do corpo nas viradas;
    // caudal flexiona com atraso, peitorais remam, dorsal e anal ondulam
    vBody: `float x=position.x, tw=smoothstep(0.3,-0.55,x), pT=step(0.5,aPart.x)*step(aPart.x,1.5), pP=step(1.5,aPart.x)*step(aPart.x,2.5), pD=step(2.5,aPart.x);
 transformed.z+=sin(aAnim.x-x*7.0)*aAnim.y*(0.1+tw*tw*1.5)+pT*aPart.y*sin(aAnim.x-x*7.0-1.3)*aAnim.y*0.7-aAnim.z*(x-0.08)*(x-0.08);
 float fl=sin(aAnim.x*0.55+sign(position.z)*0.6)*(0.6+0.4*(1.0-clamp(aAnim.y*12.0,0.0,1.0)));
 transformed.z+=pP*aPart.y*sign(position.z)*0.045*fl; transformed.x+=pP*aPart.y*0.02*cos(aAnim.x*0.55);
 transformed.z+=pD*aPart.y*0.012*sin(aAnim.x*1.3-x*11.0);`
  });
  const im = new THREE.InstancedMesh(geo, mat, max); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false;
  scene.add(im); POOLS[key] = { im, anim, n: 0, max };
  return POOLS[key];
}
function poolsBegin() { for (const k in POOLS) POOLS[k].n = 0; }
// desenha um peixe: pos, yaw, pitch, roll, escala, fase, amplitude
function poolPut(key, x, y, z, yaw, pitch, roll, s, ph, amp, bend = 0) {
  const P0 = POOLS[key]; if (!P0 || P0.n >= P0.max) return;
  _dummy.position.set(x, y, z); _dummy.rotation.set(roll, yaw, pitch, 'YZX'); _dummy.scale.setScalar(s); _dummy.updateMatrix();
  P0.im.setMatrixAt(P0.n, _dummy.matrix); P0.anim.setXYZ(P0.n, ph, amp, bend); P0.n++;
}
function poolsEnd() { for (const k in POOLS) { const p = POOLS[k]; p.im.count = p.n; p.im.instanceMatrix.needsUpdate = true; p.anim.needsUpdate = true; } }

// ================= peixes / IA =================
const FISHES = [], RESPAWN = [];
const FEAR = { pos: new V3(), r: 0, t: 0 };
const _t1 = new V3(), _t2 = new V3();
// tamanho do peixe: 'big' (pontos fundos, arena) aumenta a CHANCE de peixe grande e de troféu, sem passar do teto.
// teto: troféu até 12% mais comprido que o máximo normal (~40% mais pesado); antes ia a 45% (até 3x o peso)
const LEN_CAP = 1.12;
function rollLen(sp, big = 1) {
  const [a, b] = sp.len, r = Math.random();
  if (r < 0.07 * big) return b * rand(1.0, LEN_CAP); // troféu
  return lerp(a, b, Math.pow(Math.random(), 1.7 / (big * big)));
}
const maxKg = sp => sp.k * (sp.len[1] * LEN_CAP) ** 3;
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
    this.bend = 0; this.gl = rand(0, TAU); this.glR = rand(0.3, 0.6);
    this.radius = shapeOf(key, sp.shape).h * 0.45 * this.len;
  }
  dir(out) { return out.set(Math.cos(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.sin(this.yaw) * Math.cos(this.pitch)); }
  pickWander() {
    const sp = this.sp, S = this.spot;
    // peixe de fundo passeia de pedra em pedra pela estrutura toda (costão, laje), não só no centro do ponto
    const rocky = sp.habit !== 'pelagic' && !(sp.habit === 'hole' && this.home);
    for (let k = 0; k < 12; k++) {
      let x, z, y;
      if (sp.habit === 'hole' && this.home) { x = this.home.x + rand(-7, 7); z = this.home.z + rand(-7, 7); }
      else if (rocky && k < 6 && Math.random() < 0.75 && nearRockTarget(S, this.pos, _t3)) { x = _t3.x; z = _t3.z; }
      else { const R = S.r * (sp.habit === 'pelagic' ? 1.7 : sp.habit === 'mid' ? 1.3 : 1); const a = rand(0, TAU), d = Math.sqrt(Math.random()) * R; x = S.x + Math.cos(a) * d; z = S.z + Math.sin(a) * d; }
      const h = H(x, z); if (h > -1.6) continue;
      if (sp.habit === 'pelagic') y = rand(Math.max(h + 2, -16), -2);
      else if (sp.habit === 'mid') y = rand(h + 0.5, Math.min(-0.8, h + 3));
      else y = h + rand(0.4, sp.habit === 'hole' ? 1.6 : 3.5);
      this.target.set(x, Math.min(y, -0.8), z); return;
    }
    if (nearRockTarget(S, null, _t3)) this.target.set(_t3.x, _t3.y + 1, _t3.z);
    else this.target.set(S.x, Math.max(H(S.x, S.z) + 1, -12), S.z);
  }
  startFlee(spread = true) {
    if (this.state === 'hooked' || this.state === 'dead') return;
    this.state = 'flee'; this.t = rand(2.5, 5); this.speed = this.sp.burst;
    if (this.vis && this.pos.y - H(this.pos.x, this.pos.z) < 1.2) sandPuff(this.pos, 4 + Math.min(6, this.len * 6 | 0), 0.8);
    _t1.subVectors(this.pos, P.pos); _t1.y *= 0.3; if (_t1.lengthSq() < 0.01) _t1.set(1, 0, 0); _t1.normalize();
    if (this.sp.habit === 'hole' && this.home) { this.state = 'tohole'; this.t = 12; }
    else this.target.copy(this.pos).addScaledVector(_t1, 25).add(_t2.set(rand(-6, 6), rand(-2, 2), rand(-6, 6)));
    // o susto corre pelo grupo como uma onda: quem está mais longe foge um pouco depois
    if (spread) for (const f of FISHES) if (f !== this && f.alive && f.state !== 'flee' && !f.fleeIn && (f.leader === this || this.leader === f || (this.leader && f.leader === this.leader))) f.fleeIn = 0.05 + f.pos.distanceTo(this.pos) * 0.07;
  }
  update(dt) {
    const sp = this.sp, p = this.pos;
    if (this.state === 'dead') {
      this.amp = lerp(this.amp, 0.004, dt); this.ph += dt * 2;
      if (GUN.fish !== this) { p.y = Math.max(p.y - dt * 0.3, H(p.x, p.z) + 0.15); this.roll = lerp(this.roll, Math.PI / 2, dt); }
      return;
    }
    this.t -= dt;
    if (this.fleeIn > 0 && (this.fleeIn -= dt) <= 0) { this.fleeIn = 0; this.startFlee(false); }
    // ferido: procura a toca mais perto e fica escondido mais tempo
    if (this.hurt > 0) { this.hurt -= dt; if (!this.home && (this.state === 'wander' || this.state === 'flee')) { let best = null, bd = 35; for (const hl of HOLES) { const d = Math.hypot(hl.x - p.x, hl.z - p.z); if (d < bd) { bd = d; best = hl; } } if (best) { this.home = best; this.state = 'tohole'; this.t = 15; } } }
    const dP = p.distanceTo(P.pos);
    if (this.state !== 'hooked' && !this.tut) { // o peixe do tutorial não tem medo
      const vis = P.mode === 'swim';
      let fearR = (1.6 + sp.shy * gearShy() * 12 * (0.2 + P.noise * 1.15)) * (P.under ? 1 : 0.4);
      if (P.still > 2 && P.under) fearR *= 0.55; // espera: peixe se aproxima mais
      fearR *= 0.6 + 0.4 * DAY.amb; // no escuro o peixe enxerga menos
      if (P.hide) fearR *= 0.6; // agachon
      if (FEAR.t > 0 && p.distanceTo(FEAR.pos) < FEAR.r) fearR = 999;
      if (vis && dP < fearR && this.state !== 'flee' && this.state !== 'tohole' && this.state !== 'hidden') this.startFlee();
      // desconfiado: um pouco além da distância de fuga, para, vira para o mergulhador e fica alerta
      else if (vis && P.under && this.state === 'wander' && !this.leader && dP < fearR * 1.8 && P.still < 1.4 && Math.random() < dt * 2.5) { this.state = 'alert'; this.t = rand(1.6, 3.4); }
      if (this.state === 'hidden' && vis && dP < 1.6 + P.noise * 3) { this.state = 'flee'; this.t = 3; this.speed = sp.burst; this.target.copy(p).addScaledVector(_t1.subVectors(p, P.pos).normalize(), 15); }
    }
    let L = this.leader; if (L && !L.alive) L = this.leader = null;
    switch (this.state) {
      case 'wander':
        this.speed = sp.cruise * (L ? 1.15 : 1) * fishAct(this.key);
        if (L && L.state === 'alert') { this.state = 'alert'; this.t = L.t; }
        else if (L) {
          // cardume vivo: cada peixe deriva em torno do seu lugar no grupo
          const tn = performance.now() * 0.001; _t1.copy(this.off).applyAxisAngle(_t2.set(0, 1, 0), L.yaw); this.target.copy(L.pos).add(_t1);
          this.target.x += Math.sin(tn * 0.37 + this.wob) * 0.45; this.target.z += Math.cos(tn * 0.29 + this.wob * 1.7) * 0.45; this.target.y += Math.sin(tn + this.wob) * 0.3;
          if (L.state === 'curious') { this.state = 'curious'; this.t = L.t; }
        }
        else if (this.t <= 0 || p.distanceTo(this.target) < 1.2) { this.pickWander(); this.t = clamp(p.distanceTo(this.target) / Math.max(0.2, this.speed) * 1.3, 5, 45) + rand(0, 4); } // tempo de chegar lá
        if (!L && P.mode === 'swim' && P.under && P.still > 1.4 && dP < 24 && Math.random() < sp.curious * fishAct(this.key) * (P.hide ? 2 : 1) * (SV.flasher ? 1.4 : 1) * dt * 0.45) { this.state = 'curious'; this.t = rand(6, 11); }
        break;
      case 'curious': {
        this.speed = sp.cruise * 0.9;
        if (L) { _t1.copy(this.off).applyAxisAngle(_t2.set(0, 1, 0), L.yaw); this.target.copy(L.pos).add(_t1); }
        else { this.orbitA += dt * 0.25; const R = this.tut ? 2.3 : 2.8 + this.len * 2.5; this.target.set(P.pos.x + Math.cos(this.orbitA) * R, P.pos.y + Math.sin(this.orbitA * 0.7) * 0.8, P.pos.z + Math.sin(this.orbitA) * R); }
        if (this.t <= 0 || !P.under) { this.state = 'wander'; this.t = 0; }
        break;
      }
      case 'alert':
        // quase parado, recuando devagar e de olho no mergulhador
        this.speed = sp.cruise * 0.22; _t1.subVectors(p, P.pos); _t1.y = 0; if (_t1.lengthSq() < 1e-4) _t1.set(1, 0, 0); this.target.copy(p).addScaledVector(_t1.normalize(), 1.2);
        if (L) { _t1.copy(this.off).applyAxisAngle(_t2.set(0, 1, 0), L.yaw); this.target.copy(L.pos).add(_t1); }
        if (this.t <= 0) { if (P.vel.length() > 0.45 && dP < 9) this.startFlee(); else { this.state = P.still > 1 && Math.random() < sp.curious ? 'curious' : 'wander'; this.t = this.state === 'curious' ? rand(5, 9) : 0; } }
        break;
      case 'flee':
        if (this.t <= 0) { this.state = 'wander'; this.t = 0; this.speed = sp.cruise; }
        break;
      case 'tohole':
        this.speed = sp.burst * 0.8; this.target.set(this.home.x, this.home.y, this.home.z);
        if (p.distanceTo(this.target) < 0.6 || this.t <= 0) { this.state = 'hidden'; this.t = this.hurt > 0 ? rand(40, 70) : rand(12, 26); }
        break;
      case 'hidden': {
        // espia da toca com o mergulhador parado; recolhe para dentro se ele chega nadando
        const near = P.mode === 'swim' && P.under && dP < 5 && P.vel.length() > 0.35, peek = near ? -0.6 : P.still > 1.5 && dP < 10 ? 0.35 : 0;
        this.peek = lerp(this.peek || 0, peek, clamp(dt * (near ? 5 : 0.8), 0, 1));
        this.target.set(this.home.x + Math.cos(this.home.dir) * this.peek, this.home.y, this.home.z + Math.sin(this.home.dir) * this.peek); this.speed = near ? 1.2 : 0.3;
        if (this.t <= 0) { this.state = 'wander'; this.t = 0; }
        break;
      }
      case 'hooked':
        this.fight -= dt;
        _t1.subVectors(p, P.pos); _t1.y = rand(-0.5, 0.3); _t1.normalize();
        _t1.applyAxisAngle(_t2.set(0, 1, 0), Math.sin(performance.now() * 0.004 + this.orbitA) * 1.2);
        this.target.copy(p).addScaledVector(_t1, 5); this.speed = this.fight > 0 ? sp.burst * (this.run ? 0.85 : 0.15) : 0;
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
    const v = this.vel.length(), y0 = this.yaw;
    if (this.state === 'hidden' && this.home) { this.yaw += angDiff(this.yaw, -this.home.dir) * clamp(dt * 2, 0, 1); this.pitch *= 0.95; }
    else if (v > 0.06) {
      const ty = Math.atan2(-this.vel.z, this.vel.x), tp = clamp(Math.atan2(this.vel.y, Math.hypot(this.vel.x, this.vel.z)), -0.6, 0.6);
      const dy = angDiff(this.yaw, ty); this.yaw += dy * clamp(dt * 4, 0, 1); this.pitch = lerp(this.pitch, tp, clamp(dt * 3, 0, 1)); this.roll = lerp(this.roll, clamp(-dy * 0.6, -0.5, 0.5), clamp(dt * 3, 0, 1));
    }
    if (this.state === 'alert') { const ty = Math.atan2(-(P.pos.z - p.z), P.pos.x - p.x); this.yaw += angDiff(this.yaw, ty) * clamp(dt * 2.2, 0, 1); }
    if (this.state === 'curious' && !L) { const ty = Math.atan2(-(P.pos.z - p.z), P.pos.x - p.x); this.yaw += angDiff(this.yaw, ty) * clamp(dt * 1.2, 0, 1); }
    // corpo curva para dentro da virada
    this.bend = lerp(this.bend, clamp(angDiff(y0, this.yaw) / Math.max(dt, 1e-3) * 0.12, -0.45, 0.45), clamp(dt * 6, 0, 1));
    // nado de cruzeiro em ciclos de bater e planar; fuga e briga sempre a todo vapor
    const calm = this.state === 'wander' || this.state === 'curious' || this.state === 'hidden' || this.state === 'alert';
    this.gl += dt * this.glR; const gk = calm ? 0.3 + 0.7 * smooth(-0.4, 0.4, Math.sin(this.gl)) : 1;
    const beat = this.state === 'hooked' && this.fight > 0 ? 18 : (3 + v / this.len * 2.4) * (0.45 + 0.55 * gk);
    this.ph += dt * beat;
    if (this.hurt > 0) this.roll = lerp(this.roll, 0.5 * Math.sin(performance.now() * 0.003 + this.wob), clamp(dt * 2, 0, 1));
    this.amp = lerp(this.amp, this.state === 'hooked' && this.fight > 0 ? 0.13 : (0.035 + Math.min(0.07, v * 0.02 / this.len)) * gk, clamp(dt * 3, 0, 1));
  }
  draw() { poolPut(this.key, this.pos.x, this.pos.y, this.pos.z, this.yaw, this.pitch, this.roll, this.len, this.ph, this.amp, this.bend); }
  remove() { this.alive = false; const i = FISHES.indexOf(this); if (i >= 0) FISHES.splice(i, 1); }
}

// população por ponto: [espécie, grupos, tamanho do grupo, chance, multiplicador de tamanho]
const POP = {
  laje: [['cocoroca', 3, [8, 14]], ['canhanha', 2, [6, 10]], ['cioba', 2, [1, 1]], ['dentao', 1, [1, 1], 0.35], ['sargo', 5, [5, 10]], ['marimba', 4, [6, 12]], ['salema', 3, [8, 15]], ['garoupa', 9, [1, 1]], ['badejo', 4, [1, 1]], ['caranha', 3, [1, 2]], ['xareu', 3, [4, 8]], ['budiao', 4, [1, 3]], ['frade', 3, [1, 2]], ['sororoca', 2, [3, 6]], ['mero', 1, [1, 1], 0.6]],
  jorge: [['cocoroca', 3, [8, 14]], ['cangulo', 3, [1, 3]], ['olhete', 2, [2, 5]], ['cioba', 2, [1, 1]], ['dentao', 1, [1, 1], 0.45], ['cherne', 1, [1, 1], 0.3], ['garoupa', 10, [1, 1], 1, 1.12], ['badejo', 5, [1, 1], 1, 1.1], ['caranha', 3, [1, 2]], ['sargo', 4, [5, 9]], ['marimba', 3, [6, 10]], ['xareu', 3, [4, 8]], ['olhodeboi', 3, [1, 4]], ['sororoca', 3, [3, 6]], ['budiao', 4, [1, 3]], ['frade', 3, [1, 2]], ['enchova', 2, [4, 8]]],
  botinas: [['cocoroca', 4, [8, 14]], ['canhanha', 3, [6, 10]], ['peixegalo', 2, [4, 8]], ['sargo', 6, [5, 10]], ['marimba', 4, [6, 11]], ['salema', 4, [8, 14]], ['garoupa', 6, [1, 1], 1, 0.8], ['robalo', 3, [1, 2]], ['budiao', 3, [1, 3]], ['frade', 2, [1, 2]], ['pampo', 3, [2, 5]]],
  foz: [['peixegalo', 3, [5, 10]], ['robalo', 9, [1, 3]], ['tainha', 5, [8, 14]], ['pampo', 3, [2, 5]], ['enchova', 2, [4, 7]]],
  gipoia: [['cocoroca', 3, [8, 14]], ['cangulo', 2, [1, 3]], ['canhanha', 2, [6, 10]], ['garoupa', 7, [1, 1]], ['sargo', 4, [5, 9]], ['marimba', 3, [6, 10]], ['salema', 3, [8, 12]], ['budiao', 3, [1, 3]], ['badejo', 3, [1, 1]], ['pampo', 2, [2, 4]], ['frade', 2, [1, 2]]],
  naufragio: [['cioba', 3, [1, 2], 1, 1.2], ['cangulo', 2, [1, 3]], ['olhete', 1, [2, 4]], ['dentao', 1, [1, 1], 0.6], ['cherne', 1, [1, 1], 0.5], ['garoupa', 9, [1, 1], 1, 1.3], ['badejo', 5, [1, 1], 1, 1.3], ['caranha', 4, [1, 2], 1, 1.3], ['xareu', 3, [4, 8], 1, 1.25], ['sargo', 4, [5, 9]], ['enchova', 3, [4, 7]], ['sororoca', 2, [3, 6]], ['budiao', 2, [1, 3]], ['frade', 2, [1, 2]], ['mero', 1, [1, 1], 0.8]],
  aventureiro: [['albacora', 2, [3, 6], 0.6], ['olhete', 3, [2, 5], 1, 1.2], ['dentao', 2, [1, 1], 0.55], ['cherne', 1, [1, 1], 0.6], ['olhodeboi', 5, [1, 4], 1, 1.3], ['dourado', 4, [2, 5], 1, 1.2], ['bicuda', 3, [1, 3], 1, 1.2], ['xareu', 4, [4, 8], 1, 1.3], ['garoupa', 8, [1, 1], 1, 1.4], ['badejo', 4, [1, 1], 1, 1.3], ['caranha', 3, [1, 2], 1, 1.3], ['sororoca', 3, [3, 6], 1, 1.2], ['mero', 1, [1, 1], 0.6]],
  lagoa: [['cocoroca', 4, [8, 14]], ['canhanha', 3, [6, 10]], ['peixegalo', 2, [4, 8]], ['sargo', 5, [5, 10]], ['salema', 5, [8, 15]], ['budiao', 5, [1, 3]], ['frade', 4, [1, 2]], ['marimba', 3, [6, 10]], ['garoupa', 3, [1, 1], 1, 0.7], ['robalo', 2, [1, 2], 1, 0.8], ['pampo', 2, [2, 4]]],
  cataguases: [['cioba', 2, [1, 1]], ['cangulo', 3, [1, 3]], ['cocoroca', 3, [8, 14]], ['dentao', 1, [1, 1], 0.4], ['garoupa', 9, [1, 1], 1, 1.1], ['badejo', 4, [1, 1], 1, 1.1], ['sargo', 5, [5, 10]], ['xareu', 4, [4, 8]], ['caranha', 3, [1, 2]], ['budiao', 3, [1, 3]], ['frade', 2, [1, 2]], ['marimba', 3, [6, 10]]],
  porcos: [['olhete', 3, [2, 5]], ['peixegalo', 2, [4, 8]], ['albacora', 1, [3, 5], 0.35], ['garoupa', 8, [1, 1], 1, 1.15], ['badejo', 4, [1, 1], 1, 1.1], ['sororoca', 4, [3, 6]], ['enchova', 4, [4, 8]], ['olhodeboi', 2, [1, 3]], ['xareu', 3, [4, 8]], ['sargo', 4, [5, 9]], ['caranha', 2, [1, 2]]],
  cargueiro: [['cioba', 3, [1, 2], 1, 1.25], ['olhete', 2, [2, 4], 1, 1.2], ['cangulo', 2, [1, 3]], ['cherne', 2, [1, 1], 0.7, 1.15], ['dentao', 1, [1, 1], 0.5], ['garoupa', 10, [1, 1], 1, 1.4], ['badejo', 5, [1, 1], 1, 1.35], ['caranha', 4, [1, 2], 1, 1.35], ['xareu', 3, [4, 8], 1, 1.3], ['mero', 1, [1, 1], 0.8], ['enchova', 3, [4, 7]]],
  castelhanos: [['olhete', 3, [2, 5], 1, 1.2], ['albacora', 1, [3, 6], 0.45], ['cioba', 2, [1, 1]], ['dentao', 2, [1, 1], 0.55], ['cherne', 1, [1, 1], 0.5], ['garoupa', 9, [1, 1], 1, 1.35], ['badejo', 5, [1, 1], 1, 1.3], ['olhodeboi', 4, [1, 4], 1, 1.2], ['xareu', 4, [4, 8], 1, 1.2], ['caranha', 3, [1, 2], 1, 1.25], ['sargo', 4, [5, 9]], ['mero', 1, [1, 1], 0.5]],
  fora: [['albacora', 4, [3, 7], 1, 1.2], ['olhete', 3, [2, 5], 1, 1.3], ['dourado', 5, [2, 5], 1, 1.3], ['olhodeboi', 6, [1, 4], 1, 1.4], ['bicuda', 3, [1, 3], 1, 1.25], ['xareu', 4, [4, 8], 1, 1.35], ['sororoca', 4, [3, 6], 1, 1.2], ['cherne', 2, [1, 1], 0.6, 1.2], ['garoupa', 6, [1, 1], 1, 1.45], ['mero', 1, [1, 1], 0.6]],
  comprida: [['cocoroca', 3, [8, 14]], ['canhanha', 2, [6, 10]], ['garoupa', 6, [1, 1]], ['sargo', 4, [5, 9]], ['salema', 3, [8, 12]], ['xareu', 2, [4, 7]], ['caranha', 2, [1, 2]], ['frade', 2, [1, 2]], ['budiao', 3, [1, 3]]],
};
function spawnGroup(spot, key, n, big = 1) {
  const sp = SPECIES[key];
  let home = null, pos;
  if (sp.habit === 'hole') {
    const hs = HOLES.filter(h => h.spot === spot.id).sort((a, b) => a.used - b.used);
    if (hs.length) { home = hs[Math.floor(Math.random() * Math.min(4, hs.length))]; home.used++; pos = new V3(home.x, home.y, home.z); }
  }
  if (!pos && sp.habit !== 'pelagic' && nearRockTarget(spot, null, _t3)) pos = new V3(_t3.x, sp.habit === 'mid' ? rand(_t3.y + 0.5, Math.min(-0.8, _t3.y + 3)) : _t3.y + rand(0.4, 2.5), _t3.z);
  if (!pos) {
    for (let k = 0; k < 20; k++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()) * spot.r, x = spot.x + Math.cos(a) * d, z = spot.z + Math.sin(a) * d, h = H(x, z); if (h < -2) { pos = new V3(x, sp.habit === 'pelagic' ? rand(Math.max(h + 2, -14), -2) : h + rand(0.6, 2.5), z); break; } }
    if (!pos) pos = new V3(spot.x, H(spot.x, spot.z) + 1.5, spot.z);
  }
  const leader = new Fish(key, spot, pos, { home, big }); FISHES.push(leader);
  const spread = 1.2 + n * 0.25;
  for (let i = 1; i < n; i++) {
    const off = new V3(rand(-spread, spread), rand(-0.9, 0.9), rand(-spread, spread));
    const f = new Fish(key, spot, pos.clone().add(off), { leader, off, len: Math.min(sp.len[1] * LEN_CAP, leader.len * rand(0.72, 1.25)) }); FISHES.push(f);
  }
}
// zonas (costões e lajes fora dos pontos do mapa): mistura menor, de acordo com a profundidade
const POP_ZONE = [['cocoroca', 2, [6, 12]], ['sargo', 1, [4, 8]], ['canhanha', 1, [5, 9], 0.7], ['marimba', 1, [4, 8], 0.6], ['salema', 1, [6, 10], 0.5], ['garoupa', 2, [1, 1], 1, 0.85], ['budiao', 1, [1, 2], 0.8], ['cangulo', 1, [1, 2], 0.7], ['frade', 1, [1, 1], 0.5], ['xareu', 1, [3, 6], 0.35], ['cioba', 1, [1, 1], 0.4], ['badejo', 1, [1, 1], 0.4], ['peixegalo', 1, [3, 6], 0.4]];
const POP_LAJE = [...POP_ZONE, ['garoupa', 2, [1, 1], 1, 1.0], ['caranha', 1, [1, 1], 0.5], ['olhete', 1, [2, 4], 0.35], ['dentao', 1, [1, 1], 0.15]];
const POP_FORA_COSTA = [['olhete', 1, [2, 4], 0.5], ['sororoca', 1, [3, 5], 0.5], ['enchova', 1, [3, 6], 0.5]];
function spawnAll() {
  // só as espécies do destino atual
  for (const k of Object.keys(SPECIES)) if (spInRegion(k)) makePool(k, SPECIES[k].shape, fishTex(k), k === 'mero' || k === 'pirarucu' || SPECIES[k].shape === 'shark' ? 8 : k === 'atumrabino' ? 60 : 260);
  const POPR = AMZ ? popAmz() : NE ? popNe() : POP;
  for (const s of SPOTS) {
    const pop = POPR[s.id] || DEEP_POP[s.id]; if (!pop) continue;
    for (const [key, groups, [a, b], chance = 1, big = 1] of pop) for (let g = 0, ng = nGroups(groups, densSpot()); g < ng; g++) if (Math.random() < chance) spawnGroup(s, key, Math.round(rand(a, b)), big);
  }
  for (const z of ZONES) {
    const pop = AMZ ? POP_ZONE_AMZ : NE ? POP_ZONE_NE : z.zone === 'laje' ? POP_LAJE : z.id.startsWith('zf') ? [...POP_ZONE, ...POP_FORA_COSTA] : POP_ZONE;
    for (const [key, groups, [a, b], chance = 1, big = 1] of pop) for (let g = 0, ng = nGroups(groups, densZone()); g < ng; g++) if (Math.random() < chance) spawnGroup(z, key, Math.round(rand(a, b)), big);
  }
}
function updateFishes(dt, now) {
  if (FEAR.t > 0) FEAR.t -= dt;
  const c = camera.position;
  for (let i = FISHES.length - 1; i >= 0; i--) {
    const f = FISHES[i]; const d2 = (f.pos.x - c.x) ** 2 + (f.pos.z - c.z) ** 2;
    f.vis = d2 < QF().fish * QF().fish || f.state === 'hooked' || f === GUN.fish;
    if (f.vis) f.update(dt);
  }
  for (let i = RESPAWN.length - 1; i >= 0; i--) {
    const r = RESPAWN[i]; if (now < r.t) continue;
    const s = spotById(r.spot); if (Math.hypot(P.pos.x - s.x, P.pos.z - s.z) < 130) continue;
    spawnGroup(s, r.key, r.n); RESPAWN.splice(i, 1);
  }
}
function drawFishes() { for (const f of FISHES) if (f.vis) f.draw(); }
