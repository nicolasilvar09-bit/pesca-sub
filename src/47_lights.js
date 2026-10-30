// ================= luzes da lancha: navegação, holofote, convés e luz de mergulho =================
// acendem sozinhas ao anoitecer e na chuva. Só a sua lancha ilumina de verdade (2 luzes fixas na cena, para não
// recompilar nada); a dos amigos mostra os pontos de luz acesos, que não custam quase nada.
const BL = { dot: null, mats: {}, head: null, headT: null, pt: null, bait: null, baitV: null, lamp: 0, _v: new V3() };
function blMat(c) { if (!BL.dot) BL.dot = dotTex(); return BL.mats[c] || (BL.mats[c] = new THREE.SpriteMaterial({ map: BL.dot, color: c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); }
// caixa do barco no próprio sistema dele (antes das luzes entrarem)
function boatBox(g) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), m = new THREE.Matrix4(), box = new THREE.Box3();
  g.traverse(o => { if (!o.isMesh || !o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld))); });
  return box;
}
function addBoatLights(g) {
  if (!g || g.userData.lights) return g && g.userData.lights;
  const b = boatBox(g), spr = (c, x, y, z, k) => { const s = new THREE.Sprite(blMat(c)); s.position.set(x, y, z); s.userData.k = k; s.visible = false; g.add(s); return s; };
  const yd = Math.min(b.max.y, 1.15), zb = lerp(b.min.z, b.max.z, 0.72), mid = lerp(b.min.z, b.max.z, 0.4);
  // de frente para a proa (+z), o +x fica à esquerda: bombordo vermelho, boreste verde, branca no alto e na popa
  const L = {
    nav: [spr(0xff2a1a, b.max.x * 0.92, yd, zb, 1), spr(0x2aff66, b.min.x * 0.92, yd, zb, 1), spr(0xfff4dc, 0, b.max.y + 0.12, lerp(b.min.z, b.max.z, 0.35), 1.2), spr(0xfff4dc, 0, yd, b.min.z + 0.15, 0.8)],
    head: spr(0xfff0c8, 0, yd + 0.12, b.max.z - 0.35, 1.7),
    under: spr(0x3affd8, 0, b.min.y - 1.6, mid, 5),
    headP: new V3(0, yd + 0.12, b.max.z - 0.35), headAim: new V3(0, -3, b.max.z + 26),
    deckP: g.userData.pilotPos ? g.userData.pilotPos.clone().add(new V3(0, 1.25, 0.2)) : new V3(0, b.max.y * 0.8, mid),
    underP: new V3(0, b.min.y - 2.6, mid),
  };
  g.userData.lights = L; return L;
}
function setupBoatLights() {
  // ficam sempre na cena (mesmo apagadas) para o número de luzes nunca mudar
  BL.head = new THREE.SpotLight(0xfff0d0, 0, 70, 0.36, 0.55, 1.2); BL.headT = new THREE.Object3D(); scene.add(BL.head, BL.headT); BL.head.target = BL.headT;
  BL.pt = new THREE.PointLight(0xffd9a0, 0, 10, 1.6); scene.add(BL.pt);
  // manjubas atraídas pela luz de mergulho
  const n = 60, pos = new Float32Array(n * 3); BL.baitV = [];
  for (let i = 0; i < n; i++) BL.baitV.push([rand(0, TAU), rand(0.6, 3.2), rand(-3.8, -0.9), rand(0.4, 1.4) * (Math.random() < 0.5 ? -1 : 1)]);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  BL.bait = new THREE.Points(gg, new THREE.PointsMaterial({ size: 0.09, map: BL.dot || (BL.dot = dotTex()), color: 0xcfe8ee, transparent: true, depthWrite: false })); BL.bait.visible = false; BL.bait.frustumCulled = false; scene.add(BL.bait);
  // botão do holofote (no barco)
  const bt = document.createElement('div'); bt.className = 'b hide'; bt.id = 'bLight'; bt.innerHTML = '💡<br>FAROL';
  bt.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); SV.headOff = !SV.headOff; save(); AU.click(); toast(SV.headOff ? 'Holofote desligado.' : 'Holofote ligado.', 1.5); });
  $('btns').appendChild(bt);
}
function boatLamp() { return Math.max(clamp((0.55 - DAY.amb) * 4, 0, 1), WX.rain > 0.3 ? 0.75 : 0); }
function lightBoat(g, lamp, anchored, headOn, t) {
  const L = addBoatLights(g), d = camera.position.distanceTo(g.position), sc = clamp(d / 35, 0.35, 5) * 0.55, on = lamp > 0.02 && d < 900;
  L.nav.forEach(s => { s.visible = on; s.scale.setScalar(sc * s.userData.k * lamp); });
  L.head.visible = on && headOn && !anchored; L.head.scale.setScalar(sc * 1.7 * lamp);
  L.under.visible = on && anchored; L.under.scale.setScalar((camUnder ? 4.5 : 1.3) * lamp * (0.92 + 0.08 * Math.sin(t * 2.3)));
  return L;
}
function updateBoatLights(dt, t) {
  const lamp = BL.lamp = boatLamp(), g = BOAT.mesh; if (!g || !BL.head) return;
  for (const id in ON.remotes) { const R = ON.remotes[id]; if (R.boat && R.boat.visible && R.d) lightBoat(R.boat, lamp, !!R.d.an, R.d.hl !== 0, t); }
  const L = lightBoat(g, lamp, BOAT.anchored, !SV.headOff, t), near = camera.position.distanceTo(g.position) < 160, live = g.visible && near;
  show('bLight', P.mode === 'boat' && lamp > 0.02 && !RIDE.on); $('bLight').classList.toggle('on', !SV.headOff);
  // holofote da proa
  g.localToWorld(BL.head.position.copy(L.headP)); g.localToWorld(BL.headT.position.copy(L.headAim));
  BL.head.intensity = live && !SV.headOff && !BOAT.anchored ? 7 * lamp : 0;
  // luz do convés (no barco) ou luz de mergulho embaixo do casco (ancorado, você na água)
  const dive = P.mode === 'swim' && BOAT.anchored;
  g.localToWorld(BL.pt.position.copy(dive ? L.underP : L.deckP));
  BL.pt.color.setHex(dive ? 0x7affe6 : 0xffd9a0); BL.pt.distance = dive ? 24 : 9;
  BL.pt.intensity = live ? (dive ? 2.2 : 1.4) * lamp : 0;
  // manjubas rodando na luz
  const bait = dive && camUnder && lamp > 0.1 && live; BL.bait.visible = bait;
  if (bait) {
    const a = BL.bait.geometry.attributes.position, c = BL._v.copy(L.underP); g.localToWorld(c);
    BL.baitV.forEach((v, i) => { const an = v[0] + t * v[3] * 0.5; a.setXYZ(i, c.x + Math.cos(an) * v[1], c.y + v[2] + 0.6 + Math.sin(t * 1.3 + i) * 0.15, c.z + Math.sin(an) * v[1]); });
    a.needsUpdate = true;
  }
}
