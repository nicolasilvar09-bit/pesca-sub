// ================= jogador: controles, mira, coice, câmera (1ª e 3ª pessoa), lunetas e arma na mão =================
const IN = { mx: 0, my: 0, sprint: false, ldx: 0, ldy: 0, fire: false, adsOn: false, act: false, hold: {} };
const camDir = new T.Vector3(), _cp = {}, _ep = {}, _near2 = [];
G.recAcc = 0; G.camKick = 0; G.flash = 0; G.zoomFar = false;
const fovFor = z => 2 * Math.atan(Math.tan(37.5 * Math.PI / 180) / z) * 180 / Math.PI;

// arma em 1ª pessoa (presa na câmera)
const VM = new T.Group(); camera.add(VM);
const vmGun = new T.Mesh(gunGeo('M416'), MAT.view); VM.add(vmGun);
const vmArms = new T.Mesh(mergeParts([bx(-0.035, -0.16, -0.02, 0.07, 0.07, 0.09, '#e0ac69'), bx(-0.04, -0.17, 0.07, 0.08, 0.08, 0.12, '#2f80ed'), bx(-0.035, -0.11, -0.5, 0.07, 0.06, 0.09, '#e0ac69')]), MAT.view);
vmArms.visible = false; VM.add(vmArms); VM.visible = false; VM.scale.setScalar(0.62);
let vmKey = '';

function playerStep(dt) {
  const p = G.player, v = G.view;
  if (!p.alive) { IN.ldx = IN.ldy = 0; return; }
  const w = curW(p), zoom = p.ads && w ? sightZoom(w) : 1;
  // olhar
  const sens = SET.sens * (p.ads ? SET.adsSens / Math.max(1, zoom * 0.75) : 1);
  if (IN.ldx || IN.ldy) G.lookT = G.t;
  v.yaw -= IN.ldx * 0.0045 * sens; v.pitch -= IN.ldy * 0.0045 * sens; IN.ldx = IN.ldy = 0;
  // dirigindo: a câmera volta sozinha para trás do veículo
  if (p.veh && p.seat === 0 && G.t - (G.lookT || 0) > 1.2 && Math.abs(p.veh.sp) > 3) { const k = Math.min(1, dt * 2.5); v.yaw += wrapA(p.veh.yaw - v.yaw) * k; v.pitch += (-0.15 - v.pitch) * k; }
  // coice: sobe a mira; quando solta o gatilho, volta uma parte
  if (G.camKick) {
    const st = p.stance === 'prone' ? 0.55 : p.stance === 'crouch' ? 0.78 : 1, k = G.camKick * 0.0085 * st * (p.ads ? 1 : 1.25);
    v.pitch += k; v.yaw += gauss() * k * 0.3; G.recAcc += k; G.camKick = 0;
  } else if (!IN.fire && G.recAcc > 0) { const r = G.recAcc * Math.min(1, dt * 7); v.pitch -= r * 0.45; G.recAcc -= r; }
  v.pitch = clamp(v.pitch, -1.45, 1.45);
  p.yaw = v.yaw; p.pitch = v.pitch;
  const fx = fwdX(v.yaw), fz = fwdZ(v.yaw), rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
  let wx = fx * IN.my + rx * IN.mx, wz = fz * IN.my + rz * IN.mx; const wl = Math.hypot(wx, wz);
  if (wl > 1) { wx /= wl; wz /= wl; }
  if (p.mode === 'plane') return;
  if (p.mode === 'fall' || p.mode === 'chute') { const push = Math.min(1, wl), n = wl || 1; stepAir(p, dt, wx / n, wz / n, push); return; }
  // no chão
  if (p.veh && p.seat === 0) {
    const H2 = IN.hold, st = (H2.drvR ? 1 : 0) - (H2.drvL ? 1 : 0);
    p.veh.thr = H2.gas ? 1 : H2.brake ? -1 : IN.my; p.veh.str = st || IN.mx; p.ads = false; p.trigger = false; p.trigPrev = IN.fire; return; }
  p.ads = IN.adsOn && !!w && !p.knocked && p.healT <= 0 && p.reloadT <= 0 && !p.swim;
  if (!p.veh) {
    if (p.reviving && wl > 0.2) { p.reviving = null; p.reviveT = 0; }
    const sprint = IN.sprint && IN.my > 0.6 && !p.ads && p.stance === 'stand';
    applyMove(p, dt, wx, wz, p.reviving ? 0 : moveSpeed(p, sprint));
    if (sprint && IN.fire) IN.sprint = false;
  }
  // tiro
  if (w && !p.knocked && !p.swim) {
    const d = wdef(w), edge = IN.fire && !p.trigPrev;
    if (edge && d.burst) p.burstLeft = 3;
    let want = d.auto ? IN.fire : d.burst ? p.burstLeft > 0 : edge;
    if (want && p.healT > 0) { p.healT = 0; p.healK = null; }
    if (want && w.mag <= 0 && p.reloadT <= 0) { if (ammoOf(p, w)) startReload(p); else if (edge) toast('Sem munição para ' + d.n, 1.5, 'bad'); want = false; }
    if (want && aimAndFire(p) && p.burstLeft > 0) p.burstLeft--;
  } else if (IN.fire && !w && !p.knocked && p.mode === 'ground' && !p.swim) { if (!p.trigPrev && !G.punchTip) { G.punchTip = 1; toast('Sem arma: socando! Pegue armas no chão ou em caixas.', 2); } punch(p); }
  p.trigger = IN.fire; p.trigPrev = IN.fire;
  // pega sozinho o que está embaixo (munição, cura, acessórios, proteção melhor)
  if (!p.veh && (G.pickT = (G.pickT || 0) - dt) <= 0) {
    G.pickT = 0.25;
    for (const it of itemsNear(p.x, p.z, 1.7, _near2)) {
      if (Math.abs(it.y - p.y) > 1.5 || !wantAuto(p, it) || it.dropT > G.matchT) continue;
      if (it.k.startsWith('w:')) continue;
      const got = giveItem(p, it.k, it.n, it.w, false); if (!got) continue;
      toast('+ ' + itemInfo(it.k).n + (it.n > 1 ? ' x' + got : ''), 1.2); sfx('pick');
      if (got >= it.n) removeItem(it); else it.n -= got;
    }
  }
}
// mira pelo centro da tela e atira dos olhos do personagem até o ponto que o centro da tela aponta
function aimAndFire(p) {
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  eyePos(p, _ep);
  const off = Math.max(0, (_ep.x - cx) * camDir.x + (_ep.y - cy) * camDir.y + (_ep.z - cz) * camDir.z);
  const sx = cx + camDir.x * off, sy = cy + camDir.y * off, sz = cz + camDir.z * off;
  let t = rayStatic(sx, sy, sz, camDir.x, camDir.y, camDir.z, 900);
  const ha = rayActors(sx, sy, sz, camDir.x, camDir.y, camDir.z, t, p, p.team); if (ha.a) t = ha.t;
  const tx = sx + camDir.x * t, ty = sy + camDir.y * t, tz = sz + camDir.z * t;
  let dx = tx - _ep.x, dy = ty - _ep.y, dz = tz - _ep.z; const l = Math.hypot(dx, dy, dz) || 1;
  return fireShot(p, _ep.x, _ep.y, _ep.z, dx / l, dy / l, dz / l);
}
// ---------- ações dos botões ----------
function pPickup(it, fromCrate) {
  const p = G.player; if (!p.alive || p.knocked) return;
  const got = giveItem(p, it.k, it.n, it.w, true);
  if (!got) { toast('Mochila cheia!', 1.5, 'bad'); return; }
  sfx('pick');
  if (fromCrate) { if (got >= it.n || it.k.startsWith('w:')) fromCrate.items.splice(fromCrate.items.indexOf(it), 1); else it.n -= got; crateCleanup(fromCrate); }
  else if (got >= it.n || it.k.startsWith('w:')) removeItem(it); else it.n -= got;
  hudDirty();
}
function pDrop(k, n) {
  const p = G.player; const t = bagTake(p, k, n); if (!t) return;
  const it = dropNear(p, k, t); it.dropT = G.matchT + 4; hudDirty();
}
function pDropWeapon(slot) {
  const p = G.player, w = p.wp[slot]; if (!w) return;
  if (w.mag) { bagAdd(p, 'a:' + wdef(w).ammo, w.mag) || 0; w.mag = 0; }
  const it = dropNear(p, 'w:' + w.k, 1, w); it.dropT = G.matchT + 4; p.wp[slot] = null;
  if (p.cur === slot) { p.cur = p.wp.findIndex(Boolean); refreshGun(p); }
  hudDirty();
}
function pDetach(slot, s) { const p = G.player, w = p.wp[slot]; if (!w || !w.att[s]) return; if (bagAdd(p, w.att[s], 1)) { w.att[s] = null; if (s === 'mag' && w.mag > magSize(w)) { bagAdd(p, 'a:' + wdef(w).ammo, w.mag - magSize(w)); w.mag = magSize(w); } } else toast('Mochila cheia!', 1.5, 'bad'); hudDirty(); }
function pAttach(k) {
  const p = G.player, order = [p.cur, 0, 1, 2].filter(i => i >= 0);
  for (const i of order) { const w = p.wp[i]; if (!w || !attFits(w, k)) continue; const old = w.att[ATT[k].slot]; bagTake(p, k, 1); w.att[ATT[k].slot] = k; if (old) bagAdd(p, old, 1) || dropNear(p, old, 1); toast(ATT[k].n + ' → ' + wdef(w).n, 1.5); hudDirty(); return; }
  toast('Nenhuma arma aceita esse acessório.', 1.6, 'bad');
}
function pHeal(k) { const p = G.player; if (!startHeal(p, k)) { toast(p.hp >= 75 && HEAL[k].cap === 75 ? 'Só cura até 75 com esse item.' : 'Não dá para usar agora.', 1.6); return; } IN.adsOn = false; }
function pLean(dir) { const p = G.player; p.leanT = p.leanT === dir ? 0 : dir; }
function pAct() {
  const p = G.player;
  if (p.mode === 'plane') { jumpOut(p); return; }
  if (p.mode === 'fall') { openChute(p); return; }
  if (p.veh) { leaveVeh(p); return; }
  const c = ctx();
  if (c.knocked) { p.reviving = c.knocked; p.reviveT = 0; toast('Revivendo... fique parado.', 2); return; }
  if (c.crate) { G.openCrate = c.crate; openBag(); return; }
  if (c.veh) enterVeh(p, c.veh, 0);
}
// o que tem por perto (para os botões que mudam de função)
function ctx() {
  const p = G.player, r = { knocked: null, crate: null, veh: null };
  if (!p.alive || p.mode !== 'ground' || p.knocked || p.veh) return r;
  r.veh = nearVeh(p, 3.6);
  r.knocked = G.actors.find(m => m.team === p.team && m !== p && m.alive && m.knocked && Math.hypot(m.x - p.x, m.z - p.z) < 2);
  r.crate = G.crates.find(c => !c.vy && c.items.length && Math.hypot(c.x - p.x, c.z - p.z) < 2.4 && Math.abs(c.y - p.y) < 2);
  return r;
}

// ---------- câmera ----------
function updateCamera(dt) {
  const v = G.view, p = G.player;
  let tgt = p.alive ? p : v.spect && v.spect.alive ? v.spect : null;
  if (!p.alive && !tgt) { const s = G.actors.find(a => a.alive && a.team === p.team) || (G.watch && G.actors.find(a => a.alive)); if (s) { v.spect = s; tgt = s; } }
  let yaw = v.yaw, pitch = v.pitch;
  if (tgt && tgt !== p) { yaw = tgt.yaw; pitch = tgt.pitch * 0.5 - 0.1; }
  const cp = Math.cos(pitch); camDir.set(fwdX(yaw) * cp, Math.sin(pitch), fwdZ(yaw) * cp);
  let fov = 75, fpp = false, hide = false;
  const w = p.alive ? curW(p) : null, zoom = p.alive && p.ads && w ? sightZoom(w) : 1;
  G.zoomFar = zoom >= 3;
  if (!tgt) { // morto: câmera parada olhando o lugar
    camera.position.set(G.deathX || 0, (G.deathY || 0) + 12, (G.deathZ || 0) + 14); camera.lookAt(G.deathX || 0, G.deathY || 0, G.deathZ || 0);
  } else if (tgt.mode === 'plane') {
    const x = planeX(PLANE), z = planeZ(PLANE); camera.position.set(x - camDir.x * 38, PLANE.y + 6 - camDir.y * 38, z - camDir.z * 38);
    camera.rotation.set(pitch, yaw, 0);
  } else if (tgt.veh && !(tgt === p && (p.ads || (v.fpp && p.seat !== 0)))) { // veículo: câmera atrás, mais longe
    const ve = tgt.veh, dist = ve.k === 'moto' ? 4.8 : 6.8, px = ve.x, py = ve.y + 2.2, pz = ve.z;
    let d = dist; const t = rayStatic(px, py, pz, -camDir.x, -camDir.y, -camDir.z, dist + 0.3); if (t < dist + 0.3) d = Math.max(0.5, t - 0.3);
    camera.position.set(px - camDir.x * d, py - camDir.y * d, pz - camDir.z * d); camera.rotation.set(pitch, yaw, 0);
    if (camera.position.y < groundH(camera.position.x, camera.position.z) + 0.4) camera.position.y = groundH(camera.position.x, camera.position.z) + 0.4;
  } else if (tgt === p && (p.ads || v.fpp) && p.mode === 'ground' && !p.knocked) {
    eyePos(p, _cp); camera.position.set(_cp.x + camDir.x * 0.12, _cp.y, _cp.z + camDir.z * 0.12); camera.rotation.set(pitch, yaw, -p.lean * 0.18);
    fov = p.ads ? fovFor(zoom) : 78; fpp = true; hide = true;
  } else {
    const air = tgt.mode !== 'ground', dist = air ? (tgt.mode === 'chute' ? 7 : 5.5) : tgt.knocked ? 3.2 : 3.0, rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const sh = air ? 0 : 0.85;
    const px = tgt.x + rx * sh, py = tgt.y + (air ? 1.4 : tgt.knocked || tgt.stance === 'prone' ? 0.9 : tgt.stance === 'crouch' ? 1.4 : 1.75), pz = tgt.z + rz * sh;
    let d = dist; const t = rayStatic(px, py, pz, -camDir.x, -camDir.y, -camDir.z, dist + 0.3); if (t < dist + 0.3) d = Math.max(0.3, t - 0.3);
    camera.position.set(px - camDir.x * d, py - camDir.y * d, pz - camDir.z * d); camera.rotation.set(pitch, yaw, 0);
    if (camera.position.y < groundH(camera.position.x, camera.position.z) + 0.3) camera.position.y = groundH(camera.position.x, camera.position.z) + 0.3;
  }
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 18); if (Math.abs(camera.fov - fov) < 0.3) camera.fov = fov; camera.updateProjectionMatrix(); }
  // arma na mão (1ª pessoa)
  const scoped = p.ads && zoom >= 2;
  VM.visible = fpp && !!w && !scoped && p.healT <= 0;
  if (VM.visible) {
    const key = gunKey(w); if (key !== vmKey) { vmKey = key; setGunVisual(vmGun, w.k); dressGun(vmGun, w); }
    const kick = Math.min(0.08, G.recAcc * 0.6), bob = Math.sin(p.walk * 1) * Math.min(1, Math.hypot(p.vx, p.vz) / 4) * 0.012;
    if (p.ads) { const top = (w.att.sight ? GUN_TOP[w.k] + 0.045 : GUN_TOP[w.k] || 0.06) * VM.scale.y; VM.position.set(0, -top, -0.22 + kick); } else VM.position.set(0.2, -0.19 + bob, -0.3 + kick);
    VM.rotation.set(p.reloadT > 0 ? -0.5 : 0, 0, 0);
  }
  if (G.shake > 0) { G.shake -= dt; camera.rotation.x += gauss() * 0.012 * G.shake; camera.rotation.y += gauss() * 0.012 * G.shake; }
  SKY.position.copy(camera.position); if (typeof SKY2 !== 'undefined' && SKY2) SKY2.position.copy(camera.position);
  return hide;
}
