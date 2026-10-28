// ================= guarda-roupa: estampas das roupas, cores de máscara, nadadeiras e discrição conforme o ambiente =================
let FP_SLEEVE = null; // manga do braço em primeira pessoa
// estampa de cada roupa (mesma ordem de SUITS)
const SUIT_LOOK = [
  { solid: 0x1b1e22 }, { tex: 'camo' }, { tex: 'camo', tint: 0xd8e0c8 }, { solid: 0x1d3f66 },
  { camo: ['#244a66', '#1d3a52', '#2c5a78', '#0e2234', '#3d6f8a', '#16324a'] },
  { camo: ['#5a4a36', '#3b2f22', '#6e5c44', '#2a221a', '#7a6a50', '#4a3c2c'] },
  { camo: ['#b8a888', '#9a8a6c', '#cbbd9e', '#867658', '#d8ccb0', '#a89878'] },
  { camo: ['#3e4a2a', '#2a3020', '#5a5232', '#4a3a24', '#6a6a3a', '#1e2418'] },
  { solid: 0x8a1f22 }, { tex: 'carb', tint: 0x6a6e74 },
];
const SUIT_TEX = {};
function suitTex(i) {
  if (SUIT_TEX[i]) return SUIT_TEX[i];
  const L = SUIT_LOOK[i]; if (!L || !L.camo) return null;
  const [base, ...cols] = L.camo, r = mulberry(i * 131 + 7);
  const t = canvasTex(256, 256, g => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let n = 0; n < 95; n++) {
      const x = r() * 256, y = r() * 256, rr = 8 + r() * 20, c = cols[Math.floor(r() * cols.length)], k = 5 + Math.floor(r() * 4);
      // borda a borda: a estampa se repete sem emenda
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.fillStyle = c; g.beginPath(); for (let j = 0; j < k; j++) { const a = j / k * TAU, q = rr * (0.5 + r() * 0.7); g.lineTo(x + ox + Math.cos(a) * q, y + oy + Math.sin(a) * q); } g.fill(); }
    }
    for (let n = 0; n < 3000; n++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * 256, r() * 256, 1, 1); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return SUIT_TEX[i] = t;
}
// aplica a estampa da roupa i num material (corpo do mergulhador, manga do braço, miniatura)
function suitMat(m, i) {
  gtex(); const L = SUIT_LOOK[i] || SUIT_LOOK[0];
  if (L.solid != null) { m.map = null; m.color.set(L.solid); }
  else if (L.tex === 'camo') { m.map = _camoT; m.color.set(L.tint || 0xffffff); }
  else if (L.tex === 'carb') { m.map = _carbT; m.color.set(L.tint); }
  else { m.map = suitTex(i); m.color.set(0xffffff); }
  m.needsUpdate = true;
}
function suitDiverObj(i) { const r = buildDiver(false); suitMat(r.suitMat, i); return diverObj(0xffffff, r.suitMat.map, r, i); }
// cor da armação e da lente da máscara
function lookMask(frame, lens, i) {
  const M = MASKS[i] || MASKS[0];
  if (M.frame === 'carb') { gtex(); frame.map = _carbT; frame.color.set(0x8a8e94); } else { frame.map = null; frame.color.set(M.frame != null ? M.frame : 0x0c0d0f); }
  frame.needsUpdate = true;
  if (lens) { lens.color.set(M.lens || 0x0a1418); lens.metalness = M.mirror ? 1 : 0.9; lens.roughness = M.mirror ? 0.02 : 0.05; }
}
// nadadeiras: agora dá para ter várias e trocar (saves antigos: tinha todas até a atual)
const finsOwned = () => SV.finsOwn || (SV.finsOwn = Array.from({ length: (SV.fins || 0) + 1 }, (_, k) => k));
// discrição: roupa (com bônus quando a estampa combina com o lugar) × máscara × nadadeira; calculada uma vez por quadro
const _gs = { t: -1, v: 1 };
function gearShy() {
  if (_gs.t === T) return _gs.v;
  const s = suitNow(), env = s.env; let k = s.shy;
  if (env) {
    const near = r => rocksNear(P.pos.x, P.pos.z).some(R => Math.hypot(R.x - P.pos.x, R.z - P.pos.z) < R.r + r);
    const ok = env === 'rio' ? AMZ : env === 'azul' ? H(P.pos.x, P.pos.z) < -12 && !near(8) : env === 'pedra' ? near(6) : env === 'areia' ? !near(10) : false;
    if (ok) k *= 0.88;
  }
  k *= (maskNow().shy || 1) * ((FINS[SV.fins || 0] || FINS[0]).shy || 1);
  _gs.t = T; _gs.v = k; return k;
}
