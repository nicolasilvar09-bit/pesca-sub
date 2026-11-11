// ================= objetos que reagem: barris e caixas tombam com tiros e voam com granada/explosão =================
// o objeto parado sai da lista fixa (e da colisão) e vira uma peça solta com física simples: cai, quica, rola e deita no chão.
const PPH = { byBox: new Map(), dyn: [], max: 30, hp: new Map() };
(function propIndex() {
  const near = [];
  for (const k of ['barrel', 'crate']) for (const e of PROPS.list[k]) {
    const [x, y, z] = e; boxesNear(x - 0.5, z - 0.5, x + 0.5, z + 0.5, near);
    const b = near.find(q => q.k === 'w' && x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1 && q.x1 - q.x0 < 1.2 && q.z1 - q.z0 < 1.2 && y + 0.3 > q.y0 && y < q.y1);
    if (!b) continue; if (!PPH.byBox.has(b)) PPH.byBox.set(b, []); PPH.byBox.get(b).push({ k, e });
  }
})();
// solta todos os objetos de uma colisão (pilha de caixas cai junta) com um empurrão
function propKnock(box, ix, iy, iz, power) {
  const items = PPH.byBox.get(box); if (!items || !PROPS.ready) return;
  PPH.byBox.delete(box); box.y1 = box.y0 - 50; box.y0 -= 60; /* tira a colisão */
  for (const { k, e } of items) {
    const list = PROPS.list[k], i = list.indexOf(e); if (i >= 0) list.splice(i, 1);
    const im = PROPS.inst[k]; if (!im) continue;
    const m = new T.Mesh(im.geometry, im.material); m.castShadow = m.receiveShadow = true;
    const [x, y, z, s, rot] = e; m.scale.setScalar(s); m.position.set(x, y, z); m.rotation.set(0, rot, 0); scene.add(m);
    const pw = power * (0.8 + Math.random() * 0.4), up = k === 'crate' && y > groundH(x, z) + 0.3 ? 0.5 : 0;
    PPH.dyn.push({ m, k, vx: ix * pw, vy: iy * pw + up, vz: iz * pw, wx: (Math.random() - 0.5) * pw * 2 + iz * pw * 1.5, wz: (Math.random() - 0.5) * pw * 2 - ix * pw * 1.5, rest: 0, h: k === 'barrel' ? 0.45 : 0.31, t: 0 });
    if (PPH.dyn.length > PPH.max) { const o = PPH.dyn.shift(); scene.remove(o.m); }
  }
  PROPS.cx = 1e9; /* refaz as instâncias sem ele */
}
function propStep(dt) {
  for (const d of PPH.dyn) {
    if (d.rest > 1.5) continue; d.t += dt;
    const m = d.m; d.vy -= 9.8 * dt; m.position.x += d.vx * dt; m.position.y += d.vy * dt; m.position.z += d.vz * dt;
    m.rotation.x += d.wx * dt; m.rotation.z += d.wz * dt;
    const g = groundH(m.position.x, m.position.z), tilt = Math.min(1, Math.abs(Math.sin(m.rotation.x)) + Math.abs(Math.sin(m.rotation.z))), floor = g - (d.k === 'barrel' ? tilt * 0.2 : 0);
    if (m.position.y < floor) {
      m.position.y = floor;
      if (d.vy < -1.2) { d.vy *= -0.3; d.vx *= 0.6; d.vz *= 0.6; d.wx *= 0.6; d.wz *= 0.6; }
      else {
        d.vy = 0; d.vx *= Math.pow(0.04, dt); d.vz *= Math.pow(0.04, dt); d.wx *= Math.pow(0.02, dt); d.wz *= Math.pow(0.02, dt);
        // deita: barril de lado (90°), caixa numa face; vai acomodando até parar
        const snap = a => Math.round(a / (Math.PI / 2)) * (Math.PI / 2), kk = Math.min(1, dt * 6);
        m.rotation.x += (snap(m.rotation.x) - m.rotation.x) * kk; m.rotation.z += (snap(m.rotation.z) - m.rotation.z) * kk;
        if (Math.hypot(d.vx, d.vz, d.wx, d.wz) < 0.15) d.rest += dt;
      }
    }
    // barril deitado fica com o centro mais baixo
    if (d.k === 'barrel') { const lying = Math.abs(Math.sin(m.rotation.x)) + Math.abs(Math.sin(m.rotation.z)) > 0.9; if (lying && m.position.y <= g + 0.01) m.position.y = g - 0.15; }
  }
}
(function hookPropPhys() {
  // tiro: barril tomba no 2º tiro, caixa no 3º; escopeta e sniper derrubam de uma vez
  const bd = bulletDecal;
  bulletDecal = function (hx, hy, hz, box) {
    const r = bd.apply(this, arguments);
    if (box && PPH.byBox.has(box)) {
      const it = PPH.byBox.get(box), n = (PPH.hp.get(box) || 0) + 1; PPH.hp.set(box, n);
      const b = BUL.find(q => Math.hypot(q.x - hx, q.z - hz) < 3) || null;
      let ix = (box.x0 + box.x1) / 2 - camera.position.x, iz = (box.z0 + box.z1) / 2 - camera.position.z; const l = Math.hypot(ix, iz) || 1; ix /= l; iz /= l;
      if (n >= (it[0].k === 'barrel' ? 2 : 3)) propKnock(box, ix, 0.3, iz, 2.2);
    }
    return r;
  };
  // granada: tudo num raio de 7 m voa para longe
  const nb = nadeBoom;
  nadeBoom = function (n) {
    const r = nb.apply(this, arguments);
    if (n.k === 'FRAG' || n.k === 'MOLO') { const R = n.k === 'FRAG' ? 7 : 3;
      for (const box of [...PPH.byBox.keys()]) { const cx = (box.x0 + box.x1) / 2, cz = (box.z0 + box.z1) / 2, d = Math.hypot(cx - n.x, cz - n.z); if (d > R) continue;
        const ix = (cx - n.x) / (d || 1), iz = (cz - n.z) / (d || 1); propKnock(box, ix, 0.65, iz, (n.k === 'FRAG' ? 5.5 : 2.5) * (1 - d / R) + 1.2); } }
    return r;
  };
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q); propStep(Math.min(dt, 0.05)); return o; };
})();
