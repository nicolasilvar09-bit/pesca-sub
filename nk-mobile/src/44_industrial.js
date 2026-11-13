// ================= zona industrial no mapa de verdade: o galpão realista + pátio de containers, sempre no mesmo lugar para todos =================
// o lugar é escolhido uma vez pelo próprio relevo do mapa (igual em todos os aparelhos): plano, sem casas, perto de uma estrada.
const IND = { site: null, spots: [] };
(function indSite() {
  const near = []; let best = null, bd = 1e9;
  for (let x = -HALF * 0.7; x <= HALF * 0.7; x += 40) for (let z = -HALF * 0.7; z <= HALF * 0.7; z += 40) {
    let lo = 1e9, hi = -1e9; for (let u = -30; u <= 30; u += 6) for (let v = -34; v <= 34; v += 6) { const h = groundH(x + u, z + v); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const rd = roadDist(x, z); if (lo < 2.5 || hi - lo > 2.6 || bldAt(x, z, 42) || rd < 34 || rd > 110) continue;
    boxesNear(x - 30, z - 34, x + 30, z + 34, near); if (near.some(b => b.k !== 'tree' && b.k !== 'rock')) continue;
    const d = Math.hypot(x, z) + (hi - lo) * 60; if (d < bd) { bd = d; best = [x, z]; } // o mais perto do centro do mapa
  }
  IND.site = best;
})();
// containers: caixas de chapa pintada com textura (3 cores), empilhados em fileiras dos dois lados do galpão
function indYard(cx, cz, fy) {
  const mats = [0xa8402e, 0x2f5f8f, 0xb98a3a].map(c => whInterior(new T.MeshStandardMaterial(Object.assign({ color: c, metalness: 0.35, envMap: typeof ENV_TEX !== 'undefined' ? ENV_TEX : null, envMapIntensity: 0.4 }, whTex('shutter', 2.6))), 1));
  const geo = [[], [], []], doors = [];
  const put = (x, z, len, alongX, lvl, k) => {
    const hx = alongX ? len / 2 : 1.22, hz = alongX ? 1.22 : len / 2, y0 = Math.max(groundH(cx + x - hx, cz + z - hz), groundH(cx + x + hx, cz + z + hz), groundH(cx + x, cz + z)) - fy + lvl * 2.6;
    geo[k].push(whBox(x - hx, y0 - (lvl ? 0 : 1.5), z - hz, x + hx, y0 + 2.59, z + hz, 2.6));
    WH.cols.push(addCollider(cx + x - hx, fy + y0 - 1, cz + z - hz, cx + x + hx, fy + y0 + 2.6, cz + z + hz, 'w'));
    // moldura e travas da porta numa ponta
    const e = alongX ? [x + hx + 0.02, z] : [x, z + hz + 0.02]; for (const s of [-0.5, 0.5]) doors.push(alongX ? whBox(e[0] - 0.03, y0 + 0.2, e[1] + s - 0.03, e[0] + 0.03, y0 + 2.4, e[1] + s + 0.03, 1) : whBox(e[0] + s - 0.03, y0 + 0.2, e[1] - 0.03, e[0] + s + 0.03, y0 + 2.4, e[1] + 0.03, 1));
    if (!lvl) IND.spots.push([cx + x + (alongX ? 0 : 2.4), fy + y0 + 0.05, cz + z + (alongX ? 2.4 : 0)]);
  };
  let n = 0; const rnd = (a, b) => phh(cx + a * 3.1, cz + b * 1.7, 71 + n++);
  for (const sx of [-1, 1]) for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const x = sx * (19 + r * 6.2), z = -22 + i * 13.2, len = rnd(i, r) < 0.4 ? 6.06 : 12.2, k = Math.floor(rnd(r, i) * 3);
    put(x, z, len, false, 0, k); if (rnd(i, sx) < 0.45) put(x, z + (len < 7 ? 0 : (rnd(1, i) - 0.5) * 3), 6.06, false, 1, Math.floor(rnd(sx, r) * 3));
  }
  for (let i = 0; i < 3; i++) put(-8 + i * 8.5, 30 + (i % 2) * 3.2, 6.06, true, 0, i); // fileira na frente do portão
  geo.forEach((l, k) => { if (l.length) { const m = new T.Mesh(whMerge(l), mats[k]); m.castShadow = m.receiveShadow = true; WH.g.add(m); } });
  if (doors.length) WH.g.add(new T.Mesh(whMerge(doors), new T.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.6, roughness: 0.5 })));
}
(function hookIndustrial() {
  if (!IND.site) return;
  // monta junto com o loot da partida (dentro da parte "com semente": o loot extra sai igual em todos os aparelhos)
  const sl = spawnLoot;
  spawnLoot = function (...q) {
    const r = sl.apply(this, q);
    try { IND.spots = []; const [x, z] = IND.site; buildWarehouse(x, z); whClear(x, z, 34, 38); indYard(x, z, WH.fy);
      for (let i = -1; i <= 1; i++) for (const sx of [-6, 0, 6]) IND.spots.push([x + sx, WH.fy + 0.05, z + i * 9]);
      for (const s of IND.spots) { if (Math.random() > 0.75) continue; rollLoot(Math.random() < 0.5 ? 3 : 2).forEach((e, i) => dropItem(e.k, e.n, s[0] + i * 0.4, s[1], s[2] + rr(-0.4, 0.4))); }
    } catch (e) { console.warn('zona industrial', e); }
    return r;
  };
  const tl = toLobby; toLobby = function (...q) { removeWarehouse(); return tl.apply(this, q); };
})();
