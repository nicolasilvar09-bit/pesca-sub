// ================= detalhes: cracas e mexilhões nas pedras rasas, esponjas incrustantes e textura de pedra mais rica =================
function buildRockDetail() {
  if (AMZ) return;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), up = new V3(0, 1, 0), d = new V3(), w = new V3(), nr = new V3(), r = mulberry(303);
  const barn = [], mus = [], crust = [];
  for (const R of ROCKS) {
    if (!R.q || R.noDecor || !R.spot) continue;
    const topY = R.y + R.r * R.sy;
    // cracas: perto da superfície (zona de arrebentação) e no topo das pedras rasas
    if (topY > -5) for (let k = 0; k < 40; k++) {
      d.set(r() * 2 - 1, r() * 1.2 - 0.1, r() * 2 - 1).normalize(); rockSurf(R, d, w, nr, 0.99);
      if (w.y > -6) barn.push([w.x, w.y, w.z, nr.clone(), 0.6 + r() * 0.9]);
    }
    // mexilhões: cachos escuros na parte de cima das pedras bem rasas
    if (topY > -2.5) for (let c = 0; c < 3; c++) {
      d.set(r() * 2 - 1, 0.6 + r() * 0.4, r() * 2 - 1).normalize();
      for (let k = 0; k < 9; k++) { const dd = _t1.copy(d).add(_t2.set((r() - 0.5) * 0.25, (r() - 0.5) * 0.15, (r() - 0.5) * 0.25)).normalize(); rockSurf(R, dd, w, nr, 0.995); mus.push([w.x, w.y, w.z, nr.clone(), r() * TAU]); }
    }
    // crostas e esponjas incrustantes coloridas nas faces laterais
    if (r() < 0.55) for (let k = 0; k < 4; k++) { d.set(r() * 2 - 1, r() * 0.8 - 0.3, r() * 2 - 1).normalize(); rockSurf(R, d, w, nr, 1.0); crust.push([w.x, w.y, w.z, nr.clone(), 0.25 + r() * 0.5, Math.floor(r() * 4)]); }
  }
  const place = (it, i, im, sc, rot) => { q.setFromUnitVectors(up, it[3]); if (rot) q.multiply(_rq2.setFromAxisAngle(up, rot)); s.set(sc[0], sc[1], sc[2]); m4.compose(_t2.set(it[0], it[1], it[2]), q, s); im.setMatrixAt(i, m4); };
  // craca: cone curto com boca escura (cor por vértice)
  const bG = new THREE.CylinderGeometry(0.022, 0.055, 0.05, 7, 1); bG.translate(0, 0.025, 0);
  const bc = new Float32Array(bG.attributes.position.count * 3); for (let i = 0; i < bG.attributes.position.count; i++) { const top = bG.attributes.position.getY(i) > 0.04; bc.set(top ? [0.18, 0.17, 0.16] : [0.78, 0.76, 0.7], i * 3); } bG.setAttribute('color', new THREE.BufferAttribute(bc, 3));
  chunked(bG, uwify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), { key: 'brn' }), barn, (it, i, im) => place(it, i, im, [it[4], it[4], it[4]]), 70);
  // mexilhão: concha alongada, preto-azulado
  const mG = new THREE.SphereGeometry(0.05, 8, 5); mG.scale(0.55, 0.45, 1.3); mG.translate(0, 0.012, 0);
  chunked(mG, uwify(new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 0.35, metalness: 0.2 }), { key: 'mus' }), mus, (it, i, im) => place(it, i, im, [1, 1, 1], it[4]), 70);
  // crosta: disco achatado irregular (laranja, roxo, amarelo, vermelho)
  const cG = new THREE.CircleGeometry(1, 9); cG.rotateX(-Math.PI / 2); const cp = cG.attributes.position; for (let i = 1; i < cp.count; i++) { const k = 0.7 + 0.5 * Math.sin(i * 2.3); cp.setX(i, cp.getX(i) * k); cp.setZ(i, cp.getZ(i) * k); } cG.translate(0, 0.006, 0);
  const CC = [0xd8702a, 0x8a3a8a, 0xd8c040, 0xb83030];
  chunked(cG, uwify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), { key: 'crs' }), crust, (it, i, im) => { place(it, i, im, [it[4], 1, it[4] * 0.8], it[4] * 9); im.setColorAt(i, new THREE.Color(CC[it[5]])); }, 90);
}
const _rq2 = new THREE.Quaternion();
