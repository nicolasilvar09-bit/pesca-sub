// ================= vegetação mais real: arbustos de folhas (no lugar das bolhas), pinheiro distante em camadas e copa redonda irregular =================
const VEG = { done: false, under: false };
function leafTex(grey) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); let s = 7;
  const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 520; i++) { // folhas pequenas em volta de galhos, mais densas no meio
    const a = R() * 6.283, r = Math.pow(R(), 0.7) * 118, x = 128 + Math.cos(a) * r, y = 134 + Math.sin(a) * r * 0.92, l = 9 + R() * 10, rot = R() * 6.283, sh = 0.45 + R() * 0.55;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = grey ? `rgb(${(150 + sh * 105) | 0},${(150 + sh * 105) | 0},${(150 + sh * 105) | 0})` : `rgb(${(28 + sh * 52) | 0},${(52 + sh * 74) | 0},${(18 + sh * 30) | 0})`;
    g.beginPath(); g.ellipse(0, 0, l, l * 0.42, 0, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-l, 0); g.lineTo(l, 0); g.stroke(); g.restore();
  }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
}
// arbusto: 9 placas de folhas cruzadas, normais abertas para a luz pegar macio; cabe numa bola de raio ~1
function shrubGeo() {
  const pos = [], nor = [], uv = [], idx = []; let s = 11; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI + R() * 0.3, tilt = (R() - 0.5) * 0.9, w = 0.95 + R() * 0.25, h = 0.8 + R() * 0.3, ox = (R() - 0.5) * 0.5, oz = (R() - 0.5) * 0.5, oy = 0.05 + R() * 0.25;
    const m = new T.Matrix4().makeRotationY(a).multiply(new T.Matrix4().makeRotationX(tilt)), b = pos.length / 3;
    for (const [x, y, u, v] of [[-w, -h * 0.55, 0, 0], [w, -h * 0.55, 1, 0], [w, h, 1, 1], [-w, h, 0, 1]]) { const p = new T.Vector3(x, y, 0).applyMatrix4(m); p.x += ox; p.y += oy; p.z += oz; pos.push(p.x, p.y, p.z); const n = p.clone().multiplyScalar(0.6).add(new T.Vector3(0, 1, 0)).normalize(); nor.push(n.x, n.y, n.z); uv.push(u, v); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
function vegApply() {
  if (!VEG.geo) { VEG.geo = shrubGeo();
    const tf = leafTex(true), tn = leafTex(false);
    // o verso da folha não pode ficar preto: a normal não vira (a luz pega igual dos dois lados) e há um mínimo de luz própria
    const noFlip = m => { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal);'); }; m.customProgramCacheKey = () => 'leaf-noflip'; return m; };
    VEG.matFar = noFlip(new T.MeshLambertMaterial({ map: tf, alphaTest: 0.5, side: T.DoubleSide, emissive: 0x141a0c, emissiveMap: tf }));
    VEG.matNear = noFlip(new T.MeshLambertMaterial({ map: tn, alphaTest: 0.5, side: T.DoubleSide, emissive: 0x222222, emissiveMap: tn }));
    // longe: pinheiro em 3 saias (silhueta de pinheiro) e copa redonda com relevo
    // leves: são 13 mil árvores desenhadas o tempo todo (pinheiro 48 triângulos, copa redonda 20) e sem sombra (a sombra só alcança 60 m, onde já estão as árvores de verdade)
    const pts = [[0.001, 0.5], [0.56, 0.0], [0.3, 0.0], [1, -0.5], [0.001, -0.5]].map(([r, y]) => new T.Vector2(r, y));
    const pine = new T.LatheGeometry(pts, 6); pine.computeVertexNormals(); NAT.crown.geometry = pine;
    const ico = new T.IcosahedronGeometry(1, 0), P = ico.attributes.position, v = new T.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const k = 1 + 0.16 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.7 + v.y * 2.1); v.multiplyScalar(k); P.setXYZ(i, v.x, v.y * 0.92, v.z); }
    ico.computeVertexNormals(); NAT.crown2.geometry = ico;
    for (const n of ['trunk', 'crown', 'crown2']) NAT[n].castShadow = false;
    { const gf = VEG.geo.clone(); gf.translate(0, 0.35, 0); NAT.bush.geometry = gf; } NAT.bush.material = VEG.matFar; NAT.bush.castShadow = false;
  }
  // perto: os arbustos de modelo (bolhas) viram arbustos de folhas do mesmo tamanho
  const swap = im => { if (!im || im.userData.veg) return; im.geometry.computeBoundingBox(); const bb = im.geometry.boundingBox, h = bb.max.y - bb.min.y, r = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
    const g = VEG.geo.clone(); g.scale(r * 1.05, h * 0.7, r * 1.05); g.translate(0, bb.min.y + h * 0.5, 0); im.geometry = g; im.material = VEG.matNear; im.castShadow = false; im.userData.veg = 1; };
  if (typeof NATR !== 'undefined' && NATR.ready && NATR.inst) { for (const k of BUSHES) swap(NATR.inst[k]); VEG.done = true; }
  if (typeof UNDER !== 'undefined' && UNDER.ready) { for (const k in UNDER.inst) swap(UNDER.inst[k]); VEG.under = true; }
}
(function hookVeg() {
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q); if (!VEG.done || !VEG.under) vegApply(); return o; };
  try { vegApply(); } catch (e) { console.warn('veg', e); }
})();
