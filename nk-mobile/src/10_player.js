// ================= jogador: controles, mira, coice, câmera (1ª e 3ª pessoa), lunetas e arma na mão =================
const IN = { mx: 0, my: 0, sprint: false, ldx: 0, ldy: 0, fire: false, adsOn: false, act: false, hold: {} };
const camDir = new T.Vector3(), _cp = {}, _ep = {}, _near2 = [];
G.recAcc = 0; G.camKick = 0; G.flash = 0; G.zoomFar = false;
// campo de visão como no PUBG: definido na horizontal (o celular é bem largo), convertido para o vertical da câmera
const vfov = h => clamp(2 * Math.atan(Math.tan(h * Math.PI / 360) / camera.aspect) * 180 / Math.PI, 44, 80);
const hipV = () => vfov(SET.fov || 90);
const fovFor = z => 2 * Math.atan(Math.tan(hipV() * Math.PI / 360) / Math.max(1.15, z)) * 180 / Math.PI;

// arma em 1ª pessoa (presa na câmera)
const VM = new T.Group(); camera.add(VM);
const vmGun = new T.Mesh(gunGeo('M416'), MAT.view); VM.add(vmGun);
// Braços de primeira pessoa articulados proceduralmente. Geometria leve, sem
// dependência de novos arquivos/modelos, para manter o carregamento mobile rápido.
const vmArms = new T.Group(); VM.add(vmArms);
const vmSleeveMat = new T.MeshStandardMaterial({ color: 0x7a8660, roughness: 0.85, emissive: 0x1c2016 }); // manga verde-oliva (clara o bastante para não virar silhueta)
const vmGloveMat = new T.MeshStandardMaterial({ color: 0x5c4a3a, roughness: 0.8, emissive: 0x18130e });
const vmSeamMat = new T.MeshStandardMaterial({ color: 0x5f6b4c, roughness: 0.9, emissive: 0x161a12 });
const vmArmUp = new T.Vector3(0, 1, 0);
function vmArmSegment(group, a, b, r1, r2, material) {
  const av = new T.Vector3(...a), bv = new T.Vector3(...b), delta = bv.clone().sub(av);
  const mesh = new T.Mesh(new T.CylinderGeometry(r2, r1, delta.length(), 7, 1), material);
  mesh.position.copy(av).add(bv).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(vmArmUp, delta.normalize());
  mesh.castShadow = false; mesh.receiveShadow = false; group.add(mesh); return mesh;
}
function vmArmJoint(group, pos, radius, material, scale) {
  const mesh = new T.Mesh(new T.SphereGeometry(radius, 8, 6), material);
  mesh.position.set(...pos); if (scale) mesh.scale.set(...scale); mesh.castShadow = false; group.add(mesh); return mesh;
}
// mãos presas na arma: direita no punho, esquerda na empunhadura da frente (muda conforme a arma); ombros ficam fora da tela
function vmArmPose(side, fore, pistol) {
  if (side > 0) return { shoulder: [0.21, -0.44, 0.32], elbow: [0.17, -0.27, 0.15], wrist: [0.012, -0.105, 0.075] };
  if (pistol) return { shoulder: [-0.2, -0.44, 0.3], elbow: [-0.17, -0.26, 0.12], wrist: [-0.035, -0.115, 0.02] };
  return { shoulder: [-0.31, -0.46, 0.2], elbow: [-0.2, -0.2, fore * 0.3], wrist: [-0.015, -0.06, fore - 0.1] }; // mão no guarda-mão, visível na tela
}
function buildVmArm(side, fore, pistol) {
  const g = new T.Group(); vmArms.add(g); fillVmArm(g, side, fore == null ? -0.32 : fore, pistol); return g;
}
function fillVmArm(g, side, fore, pistol) {
  for (let i = g.children.length - 1; i >= 0; i--) { const c = g.children[i]; g.remove(c); c.geometry.dispose(); }
  const s = side, { shoulder, elbow, wrist } = vmArmPose(side, fore, pistol);
  vmArmSegment(g, shoulder, elbow, 0.078, 0.067, vmSleeveMat);
  vmArmSegment(g, elbow, wrist, 0.066, 0.047, vmSleeveMat);
  vmArmJoint(g, elbow, 0.066, vmSeamMat, [1, 0.92, 1]);
  vmArmJoint(g, wrist, 0.052, vmGloveMat, [1.05, 0.8, 1.2]);
  const palm = vmArmJoint(g, [wrist[0] - s * 0.008, wrist[1] - 0.012, wrist[2] - 0.055], 0.052, vmGloveMat, [0.9, 0.65, 1.25]);
  // dedos discretos dão leitura de mão sem aumentar muito a contagem de polígonos
  for (let i = 0; i < 3; i++) vmArmSegment(g,
    [palm.position.x + (i - 1) * 0.021, palm.position.y - 0.012, palm.position.z - 0.035],
    [palm.position.x + (i - 1) * 0.024, palm.position.y - 0.018, palm.position.z - 0.075],
    0.012, 0.009, vmGloveMat);
}
const vmArmL = buildVmArm(-1), vmArmR = buildVmArm(1);
vmArms.visible = true; VM.visible = false; VM.scale.setScalar(0.62);
let vmKey = '';
let vmSwapT = 0; // transição curta ao trocar de arma em primeira pessoa

function playerStep(dt) {
  const p = G.player, v = G.view;
  if (!p.alive) { IN.ldx = IN.ldy = 0; return; }
  const w = curW(p), zoom = p.ads && w ? sightZoom(w) : 1;
  // olhar
  /* qual luneta está em uso decide a sensibilidade; atirando usa a lista "ao atirar" (igual ao PUBG) */
  const sk = !p.ads ? (v.fpp ? 'fpp' : 'tpp') : zoom < 1.8 ? 'red' : zoom < 2.5 ? 'x2' : zoom < 3.5 ? 'x3' : zoom < 5 ? 'x4' : zoom < 7 ? 'x6' : 'x8';
  const sens = ((IN.fire && w ? SET.sensA : SET.sensC)[sk] || 100) / 100;
  if (IN.ldx || IN.ldy) G.lookT = G.t;
  v.yaw -= IN.ldx * 0.0045 * sens; v.pitch -= IN.ldy * 0.0045 * sens; IN.ldx = IN.ldy = 0;
  // dirigindo: a câmera volta sozinha para trás do veículo
  if (p.veh && p.seat === 0 && G.t - (G.lookT || 0) > 1.2 && Math.abs(p.veh.sp) > 3) { const k = Math.min(1, dt * 2.5); v.yaw += wrapA(p.veh.yaw - v.yaw) * k; v.pitch += (-0.15 - v.pitch) * k; }
  // coice: sobe a mira; quando solta o gatilho, volta uma parte
  if (G.camKick) {
    const st = p.stance === 'prone' ? 0.55 : p.stance === 'crouch' ? 0.78 : 1, k = G.camKick * 0.0085 * st * (p.ads ? 1 : 1.25);
    const up = G.recUp || 1, yk = G.recYaw != null ? G.recYaw * k : gauss() * k * 0.3; /* padrão de recuo de cada arma (38_gunfeel) */
    v.pitch += k * up; v.yaw += yk; G.recAcc += k * up; G.camKick = 0; G.recUp = 1; G.recYaw = null;
  } else if (!IN.fire && G.recAcc > 0) { const r = G.recAcc * Math.min(1, dt * 7); v.pitch -= r * 0.45; G.recAcc -= r; }
  v.pitch = clamp(v.pitch, -1.45, 1.45);
  p.yaw = v.yaw; p.pitch = v.pitch;
  const fx = fwdX(v.yaw), fz = fwdZ(v.yaw), rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
  let wx = fx * IN.my + rx * IN.mx, wz = fz * IN.my + rz * IN.mx; const wl = Math.hypot(wx, wz);
  if (wl > 1) { wx /= wl; wz /= wl; }
  if (p.mode === 'plane') return;
  if (p.mode === 'fall' || p.mode === 'chute') { const push = Math.min(1, wl), n = wl || 1; stepAir(p, dt, wx / n, wz / n, push, { fwd: IN.my, side: IN.mx, pitch: v.pitch, yaw: v.yaw }); if (p.mode === 'chute' && p.chYaw != null) p.yaw = p.chYaw; return; }
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
    if (IN.sprintLock && (IN.fire || IN.adsOn || p.stance !== 'stand')) { IN.sprintLock = false; IN.my = 0; IN.sprint = false; $('joy').classList.remove('lock'); $('joyK').style.transform = ''; }
  }
  // tiro
  if (w && !p.knocked && !p.swim) {
    const d = wdef(w), edge = IN.fire && !p.trigPrev;
    if (edge && d.burst) p.burstLeft = 3;
    let want = d.auto ? IN.fire : d.burst ? p.burstLeft > 0 : edge;
    if (want && p.healT > 0) { p.healT = 0; p.healK = null; }
    if (want && w.mag <= 0 && p.reloadT <= 0) { if (ammoOf(p, w)) startReload(p); else if (edge) sfx('dry'), toast('Sem munição para ' + d.n, 1.5, 'bad'); want = false; }
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
      if (got >= it.n) removeItem(it); else { it.n -= got; netItem(it); }
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
  if (fromCrate) { if (got >= it.n || it.k.startsWith('w:')) fromCrate.items.splice(fromCrate.items.indexOf(it), 1); else it.n -= got; netCrate(fromCrate); crateCleanup(fromCrate); }
  else if (got >= it.n || it.k.startsWith('w:')) removeItem(it); else { it.n -= got; netItem(it); }
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
  if (p.mode === 'fall') { if ((p.fallT || 0) > 1.2) openChute(p); return; }
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
// quanto o corpo "afunda" logo depois de aterrissar (0..1)
function landDip(a) { if (a.landAt == null) return 0; const t = G.t - a.landAt; if (t < 0 || t > 0.5) return 0; return (a.landK || 0) * Math.sin(Math.min(1, t / 0.5) * Math.PI) * (t < 0.12 ? 1 : 1 - (t - 0.12) / 0.38 * 0.4); }
function updateCamera(dt) {
  const v = G.view, p = G.player;
  let tgt = p.alive ? p : v.spect && v.spect.alive ? v.spect : null;
  if (!p.alive && !tgt) { const s = G.actors.find(a => a.alive && a.team === p.team) || (G.watch && G.actors.find(a => a.alive)); if (s) { v.spect = s; tgt = s; } }
  let yaw = v.yaw, pitch = v.pitch;
  if (tgt && tgt !== p) { yaw = tgt.yaw; pitch = tgt.pitch * 0.5 - 0.1; }
  const cp = Math.cos(pitch); camDir.set(fwdX(yaw) * cp, Math.sin(pitch), fwdZ(yaw) * cp);
  let fov = vfov((SET.fov || 90) + 4), fpp = false, hide = false;
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
    eyePos(p, _cp);
    // 1ª pessoa: cabeça balança com os passos, desce ao aterrissar, segue suave na troca de postura
    const sp = Math.hypot(p.vx, p.vz), bk = p.onGround ? Math.min(1, sp / 5) * (p.ads ? 0.25 : 1) : 0;
    v.bob = (v.bob || 0) + dt * sp * 1.75; const land = landDip(p);
    if (v.eyeY == null || Math.abs(v.eyeY - _cp.y) > 2) v.eyeY = _cp.y; v.eyeY += (_cp.y - v.eyeY) * (1 - Math.exp(-dt * 14));
    const rx = Math.cos(yaw), rz = -Math.sin(yaw), bx2 = Math.cos(v.bob) * 0.018 * bk;
    // A cabeça acompanha o deslocamento com atraso sutil: passos, strafe e giro têm pesos distintos.
    const sideV = p.vx * rx + p.vz * rz;
    const yawRate = v.camYawPrev == null ? 0 : wrapA(yaw - v.camYawPrev) / Math.max(dt, 1e-3); v.camYawPrev = yaw;
    const headRollT = clamp(-sideV * 0.0028 - yawRate * 0.0012 - p.lean * 0.12, -0.035, 0.035);
    v.headRoll = (v.headRoll || 0) + (headRollT - (v.headRoll || 0)) * (1 - Math.exp(-dt * 8));
    const sideSway = clamp(sideV, -6, 6) * 0.0025;
    const idleBreath = (sp < 0.25 && p.onGround) ? Math.sin(G.t * 1.65) * 0.003 : 0;
    camera.position.set(_cp.x + camDir.x * 0.12 + rx * (bx2 + sideSway), v.eyeY + Math.abs(Math.sin(v.bob)) * 0.03 * bk + idleBreath - land * 0.11, _cp.z + camDir.z * 0.12 + rz * (bx2 + sideSway));
    camera.rotation.set(pitch - land * 0.03, yaw, -p.lean * 0.18 + Math.cos(v.bob) * 0.006 * bk + v.headRoll);
    v.piv = null; fov = p.ads ? fovFor(zoom) : vfov((SET.fov || 90) + 5); fpp = true; hide = true;
  } else {
    // 3ª pessoa estilo PUBG: por cima do ombro direito, segue o corpo com leve atraso (sem tremer nos degraus),
    // desliza junto ao inclinar e encosta na parede de forma suave
    const air = tgt.mode !== 'ground', rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const sprint = !air && Math.hypot(tgt.vx, tgt.vz) > 5.6;
    let dist = air ? (tgt.mode === 'chute' ? 9.5 : 6) : tgt.knocked ? 3.2 : tgt.stance === 'prone' ? 2.6 : sprint ? 3.25 : 3.0;
    if (!air && pitch < -0.4) dist *= 1 + (-pitch - 0.4) * 0.35; // olhando para baixo afasta um pouco
    const lean = tgt.lean || 0, sh = air ? 0 : 0.72 + lean * 0.42;
    const tx = tgt.x + rx * sh, tz = tgt.z + rz * sh;
    const ty = tgt.y + (air ? (tgt.mode === 'chute' ? 3.2 : 1.4) : tgt.knocked || tgt.stance === 'prone' ? 0.85 : tgt.stance === 'crouch' ? 1.35 : 1.72) - Math.abs(lean) * 0.08 - landDip(tgt) * 0.16;
    if (!v.piv || v.pivT !== tgt || Math.hypot(v.piv.x - tx, v.piv.z - tz) > 4 || Math.abs(v.piv.y - ty) > 4) { v.piv = { x: tx, y: ty, z: tz }; v.pivT = tgt; v.cd = dist; }
    const kh = 1 - Math.exp(-dt * (air ? 12 : 26)), kv = 1 - Math.exp(-dt * 9);
    if (air) { v.piv.x = tx; v.piv.y = ty; v.piv.z = tz; } // no ar (até ~230 km/h) a câmera acompanha sem atraso: o atraso variava a cada quadro e fazia o personagem tremer
    else { v.piv.x += (tx - v.piv.x) * kh; v.piv.z += (tz - v.piv.z) * kh; v.piv.y += (ty - v.piv.y) * kv; }
    const px = v.piv.x, py = v.piv.y, pz = v.piv.z;
    let d = dist; const t = rayStatic(px, py, pz, -camDir.x, -camDir.y, -camDir.z, dist + 0.3); if (t < dist + 0.3) d = Math.max(0.3, t - 0.3);
    if (v.cd == null || d < v.cd) v.cd = d; else v.cd = Math.min(d, v.cd + dt * 3.5); // encosta na hora, volta devagar
    camera.position.set(px - camDir.x * v.cd, py - camDir.y * v.cd, pz - camDir.z * v.cd); camera.rotation.set(pitch, yaw, 0);
    if (sprint && tgt.onGround) { v.bob = (v.bob || 0) + dt * 11; camera.position.y += Math.sin(v.bob) * 0.012; camera.rotation.z = Math.cos(v.bob * 0.5) * 0.004; }
    const gh = groundH(camera.position.x, camera.position.z); if (camera.position.y < gh + 0.3) camera.position.y = gh + 0.3;
    fov = hipV();
  }
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 18); if (Math.abs(camera.fov - fov) < 0.3) camera.fov = fov; camera.updateProjectionMatrix(); }
  // arma na mão (1ª pessoa)
  const scoped = p.ads && zoom >= 2;
  VM.visible = fpp && !!w && !scoped && p.healT <= 0;
  if (VM.visible) {
    const key = gunKey(w); if (key !== vmKey) { vmKey = key; vmSwapT = 0.42; if (typeof rlDrawSound === 'function') rlDrawSound(); setGunVisual(vmGun, w.k); dressGun(vmGun, w); const pis = WEAP[w.k].cls === 'pistol'; fillVmArm(vmArmL, -1, foreOf(w.k), pis); fillVmArm(vmArmR, 1, 0, pis); }
    vmSwapT = Math.max(0, vmSwapT - dt);
    const swapK = vmSwapT > 0 ? smooth(vmSwapT / 0.42) * 1.6 : 0; // arma nova entra de baixo e sobe até a posição
    const airK = p.onGround ? 0 : clamp(Math.abs(p.vy || 0) / 5.3, 0, 1);
    // Postura acompanha a posição do personagem sem alterar colisões ou controles.
    const stanceTarget = p.stance === 'prone' ? 1 : p.stance === 'crouch' ? 0.55 : 0;
    v.vmStance = (v.vmStance || 0) + (stanceTarget - (v.vmStance || 0)) * (1 - Math.exp(-dt * 8));
    const stanceK = v.vmStance;
    const moveAmount = Math.min(1, Math.hypot(p.vx, p.vz) / 4);
    const kick = Math.min(0.08, G.recAcc * 0.6), bob = Math.sin(p.walk * 1) * moveAmount * 0.012;
    // a arma atrasa um pouco ao virar (peso), balança com os passos e abaixa correndo
    const dy = wrapA(yaw - (v.lyaw == null ? yaw : v.lyaw)), dp = pitch - (v.lpit == null ? pitch : v.lpit); v.lyaw = yaw; v.lpit = pitch;
    const sk = 1 - Math.exp(-dt * 9), am = p.ads ? 0.25 : 1;
    v.swx = ((v.swx || 0) + clamp(dy, -0.1, 0.1) * am) * (1 - sk); v.swy = ((v.swy || 0) + clamp(dp, -0.1, 0.1) * am) * (1 - sk);
    const spr = Math.hypot(p.vx, p.vz) > 5.6 && !p.ads ? 1 : 0; v.vmRun = (v.vmRun || 0) + (spr - (v.vmRun || 0)) * Math.min(1, dt * 7);
    const bb = Math.min(1, Math.hypot(p.vx, p.vz) / 5) * (p.onGround ? 1 : 0) * (p.ads ? 0.15 : 1), ph = v.bob || 0, land = landDip(p);
    const bobX = Math.cos(ph) * 0.012 * bb, bobY = -Math.abs(Math.sin(ph)) * 0.012 * bb + Math.sin(G.t * 1.6) * 0.002 - land * 0.025 - airK * 0.018;
    // mira: a arma desliza até o olho em ~0,2 s (não pula de posição)
    v.adsK = (v.adsK || 0) + ((p.ads ? 1 : 0) - (v.adsK || 0)) * (1 - Math.exp(-dt * (typeof adsSpeed === 'function' ? adsSpeed(w) : 16))); /* arma pesada mira mais devagar */ const ak = v.adsK;
    const top = (w.att.sight ? GUN_TOP[w.k] + 0.045 : GUN_TOP[w.k] || 0.06) * VM.scale.y;
    // recarga em fases: inclina e abaixa, troca o pente, volta e puxa o ferrolho
    const rp2 = p.reloadT > 0 && p.relTot ? 1 - p.reloadT / p.relTot : 1;
    const rk = p.reloadT > 0 ? smooth(clamp(rp2 / 0.18, 0, 1)) * (1 - smooth(clamp((rp2 - 0.8) / 0.2, 0, 1))) : 0;
    const magJ = p.reloadT > 0 && rp2 > 0.55 && rp2 < 0.68 ? Math.sin((rp2 - 0.55) / 0.13 * Math.PI) : 0, bolt = p.reloadT > 0 && rp2 > 0.84 ? Math.sin((rp2 - 0.84) / 0.16 * Math.PI) : 0;
    // coice com mola: a arma vai para trás e sobe a cada tiro e volta
    G.vmK = (G.vmK || 0) * Math.exp(-dt * 15);
    // Recuo direcional com retorno elástico, mantendo cada classe de arma distinta.
    G.vmKickPitch = (G.vmKickPitch || 0) * Math.exp(-dt * 10.5);
    G.vmKickYaw = (G.vmKickYaw || 0) * Math.exp(-dt * 13);
    G.vmKickRoll = (G.vmKickRoll || 0) * Math.exp(-dt * 11.5);
    const recoilPitch = G.vmKickPitch || 0, recoilYaw = G.vmKickYaw || 0, recoilRoll = G.vmKickRoll || 0;
    // Ciclo mecânico curto: ferrolho de precisão, ação de escopeta e movimento
    // de conjunto nas armas automáticas. O efeito é visual e não altera a cadência.
    G.vmActionT = Math.max(0, (G.vmActionT || 0) - dt);
    const actionDur = G.vmActionClass === 'sr' ? 0.42 : G.vmActionClass === 'sg' ? 0.22 : 0.12;
    const actionK = G.vmActionT > 0 ? Math.sin((1 - G.vmActionT / actionDur) * Math.PI) : 0;
    const actionBack = actionK * (G.vmActionClass === 'sr' ? 0.055 : G.vmActionClass === 'sg' ? 0.032 : 0.012);
    // Inércia independente da arma: deslocamento lateral, avanço/freada e respiração em repouso.
    const sideV = p.vx * Math.cos(yaw) - p.vz * Math.sin(yaw);
    const fwdV = p.vx * -Math.sin(yaw) - p.vz * Math.cos(yaw);
    const sideT = clamp(sideV / 6, -1, 1), fwdT = clamp(fwdV / 7, -1, 1);
    v.vmSide = (v.vmSide || 0) + (sideT - (v.vmSide || 0)) * (1 - Math.exp(-dt * 7));
    v.vmFwd = (v.vmFwd || 0) + (fwdT - (v.vmFwd || 0)) * (1 - Math.exp(-dt * 6));
    const breath = p.onGround && Math.hypot(p.vx, p.vz) < 0.25 ? Math.sin(G.t * 1.65) * 0.0025 : 0;
    const hx = 0.15 + v.swx * 0.35 + bobX + v.vmSide * 0.012 - v.vmRun * 0.05, hy = -0.12 + v.swy * 0.25 + bobY + breath - v.vmRun * 0.04 - swapK * 0.07 - stanceK * 0.025, hz = -0.3 + v.vmRun * 0.03 + swapK * 0.045 + stanceK * 0.018;
    const ax = v.swx * 0.05 + bobX * 0.3 + v.vmSide * 0.004, ay = -top + v.swy * 0.04 + bobY * 0.3 + breath * 0.5, az = -0.22;
    VM.position.set(lerp(hx, ax, ak) - rk * 0.1 + recoilYaw * 0.006, lerp(hy, ay, ak) + rk * 0.075 + magJ * 0.012, lerp(hz, az, ak) - rk * 0.05 + kick * 0.5 + G.vmK * 0.035 + recoilPitch * 0.009 + bolt * 0.01 + actionBack);
    VM.rotation.set(-v.swy * 0.6 - v.vmRun * 0.35 * (1 - ak) - v.vmFwd * 0.018 + rk * 0.28 + G.vmK * 0.05 + recoilPitch * 0.025 + magJ * 0.06 + airK * 0.035 + swapK * 0.12 + actionK * (G.vmActionClass === 'sr' ? 0.045 : 0.018), v.swx * 0.9 + v.vmRun * 0.5 * (1 - ak) + v.vmSide * 0.025 + rk * 0.4 + recoilYaw * 0.018, v.swx * 0.5 + v.vmRun * 0.25 * (1 - ak) - v.vmSide * 0.035 + rk * 0.22 - bolt * 0.12 - swapK * 0.18 + recoilRoll * 0.018 - actionK * 0.035);
    // braços acompanham a arma: retraem na recarga e absorvem o recuo.
    vmArms.rotation.x = rk * 0.12 + G.vmK * 0.035 + v.vmRun * 0.035 + airK * 0.045 + swapK * 0.08 + stanceK * 0.055;
    vmArms.rotation.y = v.vmSide * 0.018 + magJ * 0.025 - swapK * 0.10;
    vmArms.rotation.z = -v.vmSide * 0.025 - rk * 0.08 + swapK * 0.16 + stanceK * 0.025;
    // Ações independentes dos braços: a mão esquerda acompanha a troca do
    // carregador e a direita mantém a empunhadura durante o recuo.
    const reloadReach = p.reloadT > 0 ? Math.sin(clamp((rp2 - 0.28) / 0.48, 0, 1) * Math.PI) : 0;
    vmArmL.position.set(-reloadReach * 0.055 - swapK * 0.035, -reloadReach * 0.025 - swapK * 0.018, reloadReach * 0.075 + swapK * 0.035);
    vmArmL.rotation.set(-reloadReach * 0.22 + G.vmK * 0.025, reloadReach * 0.16, reloadReach * 0.12);
    vmArmR.position.set(swapK * 0.025, -v.vmRun * 0.012 - swapK * 0.018, G.vmK * 0.018 + swapK * 0.025);
    vmArmR.rotation.set(G.vmK * 0.045 - v.vmRun * 0.035, -v.vmSide * 0.012, v.vmSide * 0.018);
  }
  if (G.shake > 0) { G.shake -= dt; camera.rotation.x += gauss() * 0.012 * G.shake; camera.rotation.y += gauss() * 0.012 * G.shake; }
  SKY.position.copy(camera.position); if (typeof SKY2 !== 'undefined' && SKY2) SKY2.position.copy(camera.position);
  return hide;
}
