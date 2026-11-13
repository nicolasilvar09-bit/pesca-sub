// ================= 1ª pessoa mais real: red dot e holográfica com tubo e lente de vidro, luvas táticas, manga da cor da roupa, clarão do tiro iluminando =================
// --- miras: corpo novo (tubo oco / moldura) no lugar do bloco opaco; a lente é uma peça à parte, transparente ---
(function sightGeo() {
  const tube = new T.CylinderGeometry(1, 1, 1, 18, 1, true), inner = tube.clone(); inner.scale(-1, 1, 1); inner.computeVertexNormals(); // parede de dentro (aparece ao mirar)
  const ring = new T.TorusGeometry(1, 0.13, 6, 18);
  const T2 = (g, y, z, r, len) => ({ g, x: 0, y, z, rx: Math.PI / 2, sx: r, sy: len, sz: r, c: GC_.bk });
  const R = (y, z, r) => ({ g: ring, x: 0, y, z, sx: r, sy: r, sz: r, c: '#1c1d20' });
  const cy = 0.045, r = 0.021;
  ATTGEO.RED = mergeParts([T2(tube, cy, 0, r, 0.062), T2(inner, cy, 0, r * 0.9, 0.062), R(cy, -0.031, r), R(cy, 0.031, r),
    Bc(0, 0.012, 0, 0.024, 0.024, 0.046, GC_.bk), Bc(0, 0.002, 0, 0.03, 0.006, 0.05, '#1c1d20'), /* base e trilho */
    Cz(0.027, cy, 0.004, 0.008, 0.012, '#1c1d20'), { g: GEO.cyl, x: 0, y: cy + r + 0.006, z: 0.004, sx: 0.016, sy: 0.012, sz: 0.016, c: '#1c1d20' }, /* botões de ajuste */
    Bc(0.014, 0.004, -0.012, 0.006, 0.012, 0.012, GC_.st)]);
  // holográfica: caixa baixa + moldura em arco aberta (sem vidro opaco)
  const hy = 0.045;
  ATTGEO.HOLO = mergeParts([Bc(0, 0.01, 0.006, 0.036, 0.018, 0.09, GC_.bk), Bc(0, 0.001, 0.006, 0.03, 0.005, 0.07, '#1c1d20'),
    Bc(0.0185, hy - 0.004, -0.022, 0.004, 0.046, 0.034, GC_.bk), Bc(-0.0185, hy - 0.004, -0.022, 0.004, 0.046, 0.034, GC_.bk), Bc(0, hy + 0.021, -0.022, 0.041, 0.004, 0.034, GC_.bk),
    Bc(0, 0.02, 0.03, 0.03, 0.012, 0.03, '#1c1d20'), Cz(0.022, 0.012, 0.03, 0.006, 0.01, GC_.st)]);
})();
const SIGHT_LENS = {
  RED: new T.Mesh(new T.CircleGeometry(0.019, 20), new T.MeshBasicMaterial({ color: 0x7fc8ff, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })),
  HOLO: new T.Mesh(new T.PlaneGeometry(0.034, 0.042), new T.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })),
};
// --- luvas e mangas ---
vmGloveMat.color.set(0x1d1e21); vmGloveMat.roughness = 0.62; vmGloveMat.emissive.set(0x050506);
vmSeamMat.color.set(0x2a2c2f); vmSeamMat.emissive.set(0x060607);
const vmKnuckMat = new T.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.4, metalness: 0.3, envMap: typeof ENV_TEX !== 'undefined' ? ENV_TEX : null, envMapIntensity: 0.5 });
function vmSleeveColor() {
  const p = G.player; let c = 0x4a5238; /* verde-oliva escuro por padrão */
  try { const e = SET.equip || {}, o = e.out && COS[e.out]; if (o && TH[o.th] && TH[o.th].c) c = new T.Color(TH[o.th].c[0]).getHex(); else if (p && p.look && p.look.shirt) { const k = new T.Color(p.look.shirt), l = (k.r + k.g + k.b) / 3; c = k.lerp(new T.Color(l, l, l), 0.55).multiplyScalar(0.42).getHex(); } } catch (e) { }
  vmSleeveMat.color.set(c); vmSleeveMat.emissive.set(c).multiplyScalar(0.12); vmSleeveMat.roughness = 0.92;
}
(function hookFpp() {
  // mãos: punho da luva, dorso com proteção e 4 dedos + polegar mais grossos
  const fa = fillVmArm;
  fillVmArm = function (g, side, fore, pistol) {
    fa.apply(this, arguments);
    const { elbow, wrist } = vmArmPose(side, fore, pistol), s = side;
    const d = new T.Vector3(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]).normalize(), W = new T.Vector3(...wrist);
    const cuffA = W.clone().addScaledVector(d, -0.05), cuffB = W.clone().addScaledVector(d, 0.012);
    vmArmSegment(g, cuffA.toArray(), cuffB.toArray(), 0.056, 0.054, vmGloveMat); /* punho da luva por cima da manga */
    vmArmSegment(g, W.clone().addScaledVector(d, -0.058).toArray(), cuffA.toArray(), 0.058, 0.058, vmSeamMat); /* elástico */
    const palm = [wrist[0] - s * 0.008, wrist[1] - 0.012, wrist[2] - 0.055];
    vmArmJoint(g, [palm[0], palm[1] + 0.03, palm[2] - 0.004], 0.03, vmKnuckMat, [1.25, 0.32, 1.1]); /* proteção dos nós dos dedos */
    for (let i = 0; i < 4; i++) vmArmSegment(g, [palm[0] + (i - 1.5) * 0.02, palm[1] - 0.004, palm[2] - 0.03], [palm[0] + (i - 1.5) * 0.022 - s * 0.012, palm[1] - 0.03, palm[2] - 0.072], 0.0125, 0.0105, vmGloveMat);
    vmArmSegment(g, [palm[0] + s * 0.036, palm[1] + 0.004, palm[2] + 0.01], [palm[0] + s * 0.03, palm[1] + 0.028, palm[2] - 0.04], 0.0135, 0.011, vmGloveMat); /* polegar */
  };
  // lente da mira e cor da manga a cada troca de arma/acessório
  const dg = dressGun;
  dressGun = function (mesh, w) {
    const r = dg.apply(this, arguments);
    if (mesh !== vmGun) return r;
    for (const k in SIGHT_LENS) if (SIGHT_LENS[k].parent) SIGHT_LENS[k].parent.remove(SIGHT_LENS[k]);
    const ak = w && w.att.sight, L = ak && SIGHT_LENS[ak];
    if (L && !(REALGUN[w.k] && REALGUN[w.k].scoped && REALGUN[w.k].obj)) { L.position.set(0, GUN_TOP[w.k] + 0.045, (WEAP[w.k].cls === 'pistol' ? -0.02 : -0.06) - (ak === 'HOLO' ? 0.03 : 0.028)); L.renderOrder = 5; mesh.add(L); }
    vmSleeveColor();
    return r;
  };
  // (a luz do clarão do tiro saiu: uma luz a mais pesa em todos os materiais do jogo, o tempo todo)
  fillVmArm(vmArmL, -1, -0.32, false); fillVmArm(vmArmR, 1, 0, false); vmSleeveColor();
})();
