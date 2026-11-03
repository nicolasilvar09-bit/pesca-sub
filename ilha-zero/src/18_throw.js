// ================= granadas: fragmentação, fumaça e molotov (jogador e bots) =================
const NADES = [], SMOKES = [], FIRES = [];
const curThrow = a => { if (G.thrSel && a.bag[G.thrSel] && a === G.player) return G.thrSel; return Object.keys(THROW).find(k => a.bag[k] > 0) || null; };
function cycleThrow() { const p = G.player, ks = Object.keys(THROW).filter(k => p.bag[k]); if (!ks.length) return; const i = ks.indexOf(curThrow(p)); G.thrSel = ks[(i + 1) % ks.length]; toast(THROW[G.thrSel].n, 1.2); hudDirty(); }
// joga: velocidade na direção dada (já com o arco para cima)
function throwNade(a, k, dx, dy, dz, sp) {
  if (!bagTake(a, k, 1)) return false;
  eyePos(a, _ep);
  const m = new T.Mesh(itemGeo(k), MAT.item); m.position.set(_ep.x, _ep.y, _ep.z); scene.add(m);
  NADES.push({ k, o: a, x: _ep.x, y: _ep.y, z: _ep.z, vx: dx * sp, vy: dy * sp, vz: dz * sp, t: 0, m, rest: false });
  if (G.net.on && !a.remote) netSend('nade', { a: actIx(a), k, x: _ep.x, y: _ep.y, z: _ep.z, vx: dx * sp, vy: dy * sp, vz: dz * sp });
  a.fireCd = 0.6; if (a === G.player) sfx('door');
  return true;
}
function pThrow() {
  const p = G.player, k = curThrow(p); if (!k || p.knocked || p.healT > 0 || p.mode !== 'ground' || p.fireCd > 0) return;
  const cp = Math.cos(camera.rotation.x); let dx = camDir.x, dy = camDir.y + 0.28, dz = camDir.z; const l = Math.hypot(dx, dy, dz);
  if (throwNade(p, k, dx / l, dy / l, dz / l, 19)) toast(THROW[k].n + '!', 1, 'warn');
  hudDirty();
}
function nadeBoom(n) {
  const x = n.x, y = n.y + 0.2, z = n.z;
  if (n.k === 'FRAG') {
    if (n.vis) { for (let i = 0; i < 14; i++) puff(x + rr(-1.5, 1.5), y + rr(0, 2), z + rr(-1.5, 1.5), i % 3 ? '#5a4a3a' : '#ffb347', 1.4, 1.1); sfx('boom'); return; }
    for (let i = 0; i < 14; i++) puff(x + rr(-1.5, 1.5), y + rr(0, 2), z + rr(-1.5, 1.5), i % 3 ? '#5a4a3a' : '#ffb347', 1.4, 1.1);
    sfx('boom');
    for (const a of G.actors) {
      if (!a.alive || a.mode !== 'ground') continue;
      const d = Math.hypot(a.x - x, a.y + 1 - y, a.z - z); if (d > 8) continue;
      let dmg = 135 * Math.pow(1 - d / 8, 1.1); if (!losClear(x, y + 0.3, z, a.x, a.y + 1.1, a.z)) dmg *= 0.25;
      hurt(a, dmg, n.o, false, 'granada');
    }
    for (const v of VEH) { const d = Math.hypot(v.x - x, v.z - z); if (d < 8) vehHurt(v, 420 * (1 - d / 8), n.o); }
    if (Math.hypot(camera.position.x - x, camera.position.z - z) < 25) G.shake = 0.5;
  } else if (n.k === 'SMOKE') {
    const grp = new T.Group(), mats = [];
    for (let i = 0; i < 14; i++) { const mt = new T.MeshLambertMaterial({ color: 0xd8dcdf, transparent: true, opacity: 0, depthWrite: false }); mats.push(mt); const s = new T.Mesh(GEO.sph, mt); s.position.set(rr(-3, 3), rr(0.5, 3.5), rr(-3, 3)); s.scale.setScalar(rr(3, 5)); grp.add(s); }
    grp.position.set(x, n.y, z); scene.add(grp);
    SMOKES.push({ x, y: n.y + 2, z, r: 0, t: 0, grp, mats });
  } else {
    sfx('crash'); FIRES.push({ x, y: n.y, z, t: 0, o: n.o, vis: n.vis });
  }
}
function stepNades(dt) {
  for (let i = NADES.length - 1; i >= 0; i--) {
    const n = NADES[i]; n.t += dt;
    if (!n.rest) {
      n.vy -= 18 * dt; const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt, nz = n.z + n.vz * dt;
      const sx = nx - n.x, sy = ny - n.y, sz = nz - n.z, L = Math.hypot(sx, sy, sz) || 1e-6;
      const t = rayStatic(n.x, n.y, n.z, sx / L, sy / L, sz / L, L);
      if (t < L) { // bateu: molotov quebra; as outras quicam
        if (n.k === 'MOLO') { n.x += sx / L * t; n.y += sy / L * t; n.z += sz / L * t; n.y = Math.max(n.y, groundH(n.x, n.z)); nadeBoom(n); scene.remove(n.m); NADES.splice(i, 1); continue; }
        n.x += sx / L * Math.max(0, t - 0.05); n.y += sy / L * Math.max(0, t - 0.05); n.z += sz / L * Math.max(0, t - 0.05);
        const g = groundH(n.x, n.z); if (n.y < g + 0.3 && n.vy < 0) { n.vy *= -0.3; n.vx *= 0.5; n.vz *= 0.5; } else { n.vx *= -0.35; n.vz *= -0.35; }
        if (Math.hypot(n.vx, n.vy, n.vz) < 1.2) n.rest = true;
      } else { n.x = nx; n.y = ny; n.z = nz; }
      if (n.y < groundH(n.x, n.z)) { n.y = groundH(n.x, n.z) + 0.05; n.rest = true; }
    }
    n.m.position.set(n.x, n.y, n.z); n.m.rotation.x += dt * 8;
    if ((n.k === 'FRAG' && n.t > 3.5) || (n.k === 'SMOKE' && n.t > 1.8) || (n.k === 'MOLO' && n.t > 5)) { nadeBoom(n); scene.remove(n.m); NADES.splice(i, 1); }
  }
  for (let i = SMOKES.length - 1; i >= 0; i--) {
    const s = SMOKES[i]; s.t += dt; s.r = Math.min(6.5, s.t * 3);
    const op = s.t < 2 ? s.t / 2 : s.t > 20 ? Math.max(0, 1 - (s.t - 20) / 4) : 1;
    s.mats.forEach((m, j) => { m.opacity = op * 0.85; }); s.grp.scale.setScalar(Math.min(1, 0.3 + s.t / 2.5)); s.grp.rotation.y += dt * 0.05;
    if (s.t > 24) { scene.remove(s.grp); SMOKES.splice(i, 1); }
  }
  for (let i = FIRES.length - 1; i >= 0; i--) {
    const f = FIRES[i]; f.t += dt;
    if (Math.random() < dt * 30) puff(f.x + rr(-3, 3), f.y + rr(0, 1), f.z + rr(-3, 3), Math.random() < 0.6 ? '#ff7b1a' : '#ffcf4a', 0.6, 0.6);
    if (!f.vis) for (const a of G.actors) if (a.alive && a.mode === 'ground' && Math.hypot(a.x - f.x, a.z - f.z) < 3.8 && Math.abs(a.y - f.y) < 2) hurt(a, 12 * dt, f.o, false, 'fogo');
    if (f.t > 9) FIRES.splice(i, 1);
  }
}
// a fumaça esconde: a linha de visão que cruza uma nuvem é bloqueada
function smokeBlocks(ax, ay, az, bx2, by, bz) {
  for (const s of SMOKES) {
    if (s.r < 1.5 || s.t > 22) continue;
    const dx = bx2 - ax, dy = by - ay, dz = bz - az, L2 = dx * dx + dy * dy + dz * dz;
    const t = clamp(((s.x - ax) * dx + (s.y - ay) * dy + (s.z - az) * dz) / L2, 0, 1);
    if (Math.hypot(ax + dx * t - s.x, ay + dy * t - s.y, az + dz * t - s.z) < s.r) return true;
  }
  return false;
}
// bot joga granada em quem se escondeu
function botNade(a) {
  const ai = a.ai, k = a.bag.FRAG ? 'FRAG' : a.bag.MOLO ? 'MOLO' : null; if (!k || !ai.enemy || ai.vis) return false;
  if (ai.lostT < 1 || ai.lostT > 5 || G.matchT - (ai.nadeT || 0) < 12 || Math.random() > 0.02 + a.skill * 0.03) return false;
  const tx = ai.seenX, tz = ai.seenZ, d = Math.hypot(tx - a.x, tz - a.z); if (d < 8 || d > 32) return false;
  ai.nadeT = G.matchT;
  const sp = clamp(Math.sqrt(d * 18 / Math.sin(2 * 0.6)), 8, 22), ang = 0.6, h = Math.atan2(tz - a.z, tx - a.x);
  return throwNade(a, k, Math.cos(h) * Math.cos(ang), Math.sin(ang), Math.sin(h) * Math.cos(ang), sp);
}
function clearNades() { for (const n of NADES) scene.remove(n.m); for (const s of SMOKES) scene.remove(s.grp); NADES.length = SMOKES.length = FIRES.length = 0; }
