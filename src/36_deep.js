// ================= pontos fundos e peixe espalhado pela estrutura =================

// ---------- pontos fundos novos (pináculo com tocas ou naufrágio) ----------
// top = profundidade do topo do pináculo; wreck = naufrágio no lugar do pináculo
const _t3 = new V3();
const DEEP_DEF = {
  cv: [
    { id: 'pedrameio', name: 'Pedra do Meio', x: 480, z: -1920, r: 50, depth: '22–34 m', top: -22, desc: 'Pináculo isolado no fundo de 33 m, fora da Ilha Grande. Garoupa e badejo grandes nas tocas, cherne e olhete em volta.' },
    { id: 'lajefunda', name: 'Laje Funda', x: 1300, z: -2160, r: 55, depth: '25–40 m', top: -25, desc: 'Laje funda em mar aberto, para apneísta experiente. Os maiores badejos e garoupas, olho-de-boi e xaréu de meia-água.' },
    { id: 'rebocador', name: 'Naufrágio do Rebocador', x: -520, z: -1920, r: 45, depth: '24–32 m', wreck: true, desc: 'Rebocador afundado a 32 m. Cioba, caranha e cherne na sombra do casco.' },
  ],
  ne: [
    { id: 'paredefunda', name: 'Paredão Fundo', x: 0, z: -1215, r: 50, depth: '20–32 m', top: -20, desc: 'Torre de coral na saída do paredão, no azul. Pargo, cioba e garoupa nas tocas; cavala e tubarão passando.' },
    { id: 'sueste', name: 'Parcel do Sueste', x: 920, z: -1100, r: 50, depth: '22–31 m', top: -22, desc: 'Parcel fundo e isolado. Badejo e garoupa grandes, dentão e olho-de-boi.' },
    { id: 'cargueiro_ne', name: 'Naufrágio do Cargueiro', x: -560, z: -1190, r: 48, depth: '24–32 m', wreck: true, desc: 'Cargueiro inteiro a 32 m. Mero (protegido), pargo e tubarão-lixa morando no casco.' },
  ],
  amz: [
    { id: 'pocao', name: 'Poção do Tapajós', x: 480, z: -49, r: 50, depth: '12–25 m', top: -14, desc: 'Poço fundo no meio do rio, com pedras no fundo. Surubim, pescada e dourado grandes; água escura lá embaixo.' },
  ],
};
const DEEP_POP = {
  pedrameio: [['garoupa', 9, [1, 1], 1, 1.45], ['badejo', 5, [1, 1], 1, 1.4], ['cherne', 2, [1, 1], 0.8, 1.3], ['dentao', 2, [1, 1], 0.7, 1.3], ['caranha', 3, [1, 2], 1, 1.3], ['cioba', 3, [1, 2], 1, 1.25], ['olhete', 3, [2, 5], 1, 1.3], ['olhodeboi', 3, [1, 3], 1, 1.3], ['xareu', 2, [3, 6], 1, 1.3], ['mero', 1, [1, 1], 0.5], ['cangulo', 2, [1, 3]], ['cocoroca', 2, [8, 12]]],
  lajefunda: [['garoupa', 10, [1, 1], 1, 1.55], ['badejo', 6, [1, 1], 1, 1.5], ['cherne', 3, [1, 1], 0.8, 1.4], ['dentao', 2, [1, 1], 0.8, 1.35], ['olhodeboi', 4, [1, 4], 1, 1.45], ['xareu', 3, [3, 7], 1, 1.4], ['olhete', 3, [2, 5], 1, 1.35], ['albacora', 1, [3, 5], 0.5], ['bicuda', 2, [1, 3], 1, 1.3], ['mero', 1, [1, 1], 0.6]],
  rebocador: [['cioba', 4, [1, 2], 1, 1.3], ['caranha', 4, [1, 2], 1, 1.3], ['cherne', 2, [1, 1], 0.8, 1.3], ['garoupa', 7, [1, 1], 1, 1.4], ['badejo', 4, [1, 1], 1, 1.35], ['dentao', 2, [1, 1], 0.6, 1.3], ['olhete', 2, [2, 4], 1, 1.2], ['mero', 1, [1, 1], 0.7], ['cangulo', 3, [1, 3]], ['peixegalo', 2, [4, 8]]],
  paredefunda: [['pargo', 5, [2, 4], 1, 1.3], ['cioba', 4, [1, 2], 1, 1.3], ['garoupa', 6, [1, 1], 1, 1.4], ['badejo', 4, [1, 1], 1, 1.35], ['dentao', 2, [1, 1], 0.7, 1.3], ['cavala', 3, [3, 6], 1, 1.25], ['olhodeboi', 3, [1, 3], 1, 1.3], ['xareu', 3, [3, 6], 1, 1.3], ['tubaraolixa', 1, [1, 1], 0.8], ['cabecachata', 1, [1, 1], 0.4], ['mero', 1, [1, 1], 0.5]],
  sueste: [['badejo', 5, [1, 1], 1, 1.45], ['garoupa', 7, [1, 1], 1, 1.45], ['garoupagato', 4, [1, 1], 1, 1.3], ['dentao', 3, [1, 1], 0.8, 1.35], ['olhodeboi', 4, [1, 4], 1, 1.4], ['pargo', 3, [2, 4], 1, 1.3], ['cioba', 3, [1, 2], 1, 1.3], ['xareu', 3, [3, 7], 1, 1.3], ['bicuda', 2, [1, 3]]],
  cargueiro_ne: [['mero', 1, [1, 1], 0.9], ['pargo', 5, [2, 4], 1, 1.35], ['cioba', 4, [1, 2], 1, 1.3], ['garoupa', 6, [1, 1], 1, 1.4], ['badejo', 3, [1, 1], 1, 1.35], ['tubaraolixa', 2, [1, 1]], ['xareu', 2, [3, 6], 1, 1.3], ['dentao', 2, [1, 1], 0.7, 1.3], ['guaiuba', 3, [4, 8]]],
  pocao: [['surubim', 4, [1, 1], 1, 1.4], ['pescada', 4, [3, 6], 1, 1.3], ['douradorio', 3, [1, 3], 1, 1.3], ['cachorra', 3, [1, 3], 1, 1.25], ['tambaqui', 2, [2, 3], 1, 1.2], ['apapa', 2, [2, 4]], ['traira', 2, [1, 1]], ['piranha', 2, [4, 8]]],
};
// entra na lista de pontos antes de tudo (o save pode ter um deles como destino)
function addDeepSpots() {
  for (const d of DEEP_DEF[REGION] || []) if (!SPOTS.some(s => s.id === d.id)) SPOTS.push({ ...d, deep: true });
}
// pedras do ponto fundo: campo de pedras com tocas e um pináculo subindo até o topo
function buildDeepSpots() {
  const r = mulberry(4242);
  for (const S of SPOTS.filter(s => s.deep)) {
    if (S.wreck) buildWreck({ x: S.x, z: S.z, ry: r() * TAU, L: 38 + r() * 10, spot: S.id });
    for (let i = 0; i < 80; i++) {
      const a = r() * TAU, d = 6 + Math.pow(r(), 0.8) * S.r, x = S.x + Math.cos(a) * d, z = S.z + Math.sin(a) * d, rad = lerp(4.4, 1.2, d / S.r) * (0.6 + r() * 0.7);
      const R = addRock(x, H(x, z) + rad * 0.25, z, rad, S.id); if (rad > 2 && r() < 0.55) addHole(R, r() * TAU, S.id);
    }
    if (S.wreck) continue;
    const h0 = H(S.x, S.z), N = 16;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), a = r() * TAU, d = (1 - t) * 7 * r(), x = S.x + Math.cos(a) * d, z = S.z + Math.sin(a) * d, rad = lerp(6, 2.4, t) * (0.8 + r() * 0.4);
      const R = addRock(x, lerp(h0 + 2, S.top - rad * 0.5, t), z, rad, S.id); if (t < 0.8 && r() < 0.6) addHole(R, r() * TAU, S.id);
    }
  }
}
// poço fundo no meio do rio (Amazonas)
function amzPoco(x, z, h) { const d = Math.hypot(x - 480, z - rivC(480)); return d < 120 ? Math.min(h, lerp(-25 + 1.5 * fbm(x * 0.04, z * 0.04, 2), h, smooth(35, 115, d))) : h; }

// ---------- peixe espalhado ao longo das pedras do ponto (costão inteiro, laje inteira) ----------
// pedras de um ponto ou zona: as marcadas com o id dele e as que ficam dentro da área
function rocksFor(S) {
  if (S._rk) return S._rk;
  // no rio as pedras marcadas com o ponto podem estar na margem, longe dele: lá vale só a área do ponto
  const R2 = (S.r * 1.3) ** 2, tagMax = AMZ ? (S.r * 1.6) ** 2 : 1e12;
  return (S._rk = ROCKS.filter(R => { if (R.noDecor || R.r <= 0.8) return false; const d2 = (R.x - S.x) ** 2 + (R.z - S.z) ** 2; return d2 < R2 || (R.spot === S.id && d2 < tagMax); }));
}
// lugar perto de uma pedra: preferindo pedras perto de onde o peixe já está, para ele ir passeando pelo costão
function nearRockTarget(S, from, out) {
  const rk = rocksFor(S); if (!rk.length) return false;
  let R = null;
  // entre três sorteios fica com o mais longe do centro: na laje as pedras se juntam no meio, e o peixe se espalhava pouco
  const far = c => (c.x - S.x) ** 2 + (c.z - S.z) ** 2;
  for (let k = 0; k < 10; k++) { let c = rk[Math.floor(Math.random() * rk.length)]; for (let j = 0; j < 2; j++) { const c2 = rk[Math.floor(Math.random() * rk.length)]; if (far(c2) > far(c)) c = c2; } if (!from || (c.x - from.x) ** 2 + (c.z - from.z) ** 2 < 1225) { R = c; break; } }
  if (!R) R = rk[Math.floor(Math.random() * rk.length)];
  const a = rand(0, TAU), d = R.r + rand(0.4, 3.5), x = R.x + Math.cos(a) * d, z = R.z + Math.sin(a) * d, h = H(x, z);
  if (h > -1.6) return false;
  out.set(x, h, z); return true;
}
// quantas vezes mais grupos: o Nordeste estava vazio; zonas de costão e laje ganham mais peixe
const densSpot = () => NE ? 1.6 : AMZ ? 1.15 : 1.25;
const densZone = () => NE ? 2.3 : AMZ ? 1.3 : 1.7;
const nGroups = (g, k) => { const n = g * k; return Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); };
