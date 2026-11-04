// ================= partida: avião, salto, paraquedas, zona azul, drop de suprimentos, equipes e fim =================
const PHASES = [[110, 70, 520, 0.6], [80, 55, 300, 1.5], [55, 40, 145, 3], [45, 35, 85, 5], [35, 30, 45, 8], [25, 25, 20, 10], [20, 25, 0, 14]];
const ZONE = { cx: 0, cz: 0, r: 1040, nx: 0, nz: 0, nr: 520, ph: 0, st: 'wait', t: 100, T: 100, dmg: 0, sx: 0, sz: 0, sr: 0 };
const zoneWall = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 72, 1, true), new T.MeshBasicMaterial({ color: 0x3a7bff, transparent: true, opacity: 0.28, side: T.DoubleSide, depthWrite: false, fog: false }));
zoneWall.renderOrder = 2; scene.add(zoneWall);
function nextCircle() {
  const z = ZONE, [w, , r] = PHASES[z.ph];
  for (let k = 0; k < 30; k++) {
    const an = rr(0, 6.28), m = (z.r - r) * Math.sqrt(Math.random()) * 0.9, x = z.cx + Math.cos(an) * m, zz = z.cz + Math.sin(an) * m;
    z.nx = x; z.nz = zz; if (groundH(x, zz) > 1.5 || r === 0) break;
  }
  z.nr = r; z.st = 'wait'; z.t = z.T = w;
}
function stepZone(dt) {
  const z = ZONE;
  if (z.ph < PHASES.length) {
    z.t -= dt;
    if (z.st === 'wait' && z.t <= 0) { z.st = 'shrink'; z.t = z.T = PHASES[z.ph][1]; z.sx = z.cx; z.sz = z.cz; z.sr = z.r; z.dmg = PHASES[z.ph][3]; toast('⚠ A zona está fechando!', 3, 'warn'); }
    else if (z.st === 'shrink') {
      const k = clamp(1 - z.t / z.T, 0, 1); z.cx = lerp(z.sx, z.nx, k); z.cz = lerp(z.sz, z.nz, k); z.r = lerp(z.sr, z.nr, k);
      if (z.t <= 0) { z.ph++; if (z.ph < PHASES.length) nextCircle(); else z.st = 'end'; }
    }
  }
  zoneWall.scale.set(Math.max(z.r, 0.5), 700, Math.max(z.r, 0.5)); zoneWall.position.set(z.cx, 200, z.cz);
  // dano de quem está fora
  for (const a of G.actors) if (a.alive && !a.remote && a.mode === 'ground' && Math.hypot(a.x - z.cx, a.z - z.cz) > z.r) hurt(a, Math.max(0.4, z.dmg) * dt, null, false, 'zona');
}

// ---------- avião ----------
function planeMesh(col) {
  return new T.Mesh(mergeParts([
    { g: GEO.cyl, rx: Math.PI / 2, sx: 4.2, sy: 32, sz: 4.2, c: col }, { g: GEO.cone, z: -18.5, rx: -Math.PI / 2, sx: 4.2, sy: 5, sz: 4.2, c: col },
    bx(-17, -0.6, -4, 34, 0.7, 6, '#e9ecef'), bx(-6, 0, 12, 12, 0.5, 3.5, '#e9ecef'), bx(-0.3, 0, 11.5, 0.6, 6, 4, col),
    { g: GEO.cyl, x: -8, y: -1.4, z: -3, rx: Math.PI / 2, sx: 1.5, sy: 4, sz: 1.5, c: '#495057' }, { g: GEO.cyl, x: 8, y: -1.4, z: -3, rx: Math.PI / 2, sx: 1.5, sy: 4, sz: 1.5, c: '#495057' },
    bx(-2.2, 0.8, -15, 4.4, 1, 3, '#74c0fc'),
  ]), new T.MeshLambertMaterial({ vertexColors: true }));
}
const PLANE = { m: planeMesh('#ff6b35'), x0: 0, z0: 0, dx: 1, dz: 0, t: 0, len: 2000, sp: 82, y: 330, on: false };
const DROPP = { m: planeMesh('#2b8a3e'), x0: 0, z0: 0, dx: 1, dz: 0, t: 0, len: 1500, sp: 90, y: 240, on: false, tx: 0, tz: 0, dropped: false };
scene.add(PLANE.m, DROPP.m); PLANE.m.visible = DROPP.m.visible = false;
function setPath(P, ang, off, cx, cz) {
  P.dx = Math.cos(ang); P.dz = Math.sin(ang);
  P.x0 = (cx || 0) - P.dx * P.len / 2 - P.dz * off; P.z0 = (cz || 0) - P.dz * P.len / 2 + P.dx * off; P.t = 0; P.on = true; P.m.visible = true;
  P.m.rotation.y = Math.atan2(-P.dx, -P.dz);
}
const planeX = P => P.x0 + P.dx * P.t * P.sp, planeZ = P => P.z0 + P.dz * P.t * P.sp;
function stepPlanes(dt) {
  if (PLANE.on) {
    PLANE.t += dt; const x = planeX(PLANE), z = planeZ(PLANE); PLANE.m.position.set(x, PLANE.y, z);
    for (const a of G.actors) if (a.alive && a.mode === 'plane') {
      a.x = x; a.y = PLANE.y - 3; a.z = z;
      const done = PLANE.t * PLANE.sp > PLANE.len - 120;
      if (a.remote) continue;
      if (a.bot) { const fol = a.team === G.player.team && G.player.mode === 'plane'; if ((!fol && PLANE.t * PLANE.sp >= a.ai.jumpAt) || done) jumpOut(a); }
      else if (done) jumpOut(a);
    }
    if (PLANE.t * PLANE.sp > PLANE.len) { PLANE.on = false; PLANE.m.visible = false; }
  }
  if (DROPP.on) {
    DROPP.t += dt; const x = planeX(DROPP), z = planeZ(DROPP); DROPP.m.position.set(x, DROPP.y, z);
    if (!DROPP.dropped && (x - DROPP.tx) * DROPP.dx + (z - DROPP.tz) * DROPP.dz >= 0) {
      DROPP.dropped = true; const c = addCrate(x, DROPP.y - 6, z, rollDrop(), 'Drop de suprimentos', 'drop', null, -9);
      c.chute = new T.Mesh(GEO.hsph, new T.MeshLambertMaterial({ color: 0xff3b3b })); c.chute.scale.set(5, 3, 5); scene.add(c.chute);
    }
    if (DROPP.t * DROPP.sp > DROPP.len) { DROPP.on = false; DROPP.m.visible = false; }
  }
}
function callAirdrop() {
  const z = ZONE; let tx = z.nx, tz = z.nz;
  for (let k = 0; k < 20; k++) { const an = rr(0, 6.28), r = Math.sqrt(Math.random()) * z.nr * 0.6; tx = z.nx + Math.cos(an) * r; tz = z.nz + Math.sin(an) * r; if (groundH(tx, tz) > 1) break; }
  const ang = rr(0, 6.28); setPath(DROPP, ang, 0, tx, tz); DROPP.tx = tx; DROPP.tz = tz; DROPP.dropped = false;
  if (G.net.on) netSend('drop_plane', { ang, tx, tz });
  toast('✈ Avião de suprimentos chegando! Fique de olho na fumaça vermelha.', 4, 'gold'); sfx('plane');
}
function stepCrates(dt) {
  for (const c of G.crates) {
    if (c.kind !== 'drop') continue;
    if (c.vy) {
      c.y += c.vy * dt; let sup = groundH(c.x, c.z);
      boxesNear(c.x - 0.7, c.z - 0.7, c.x + 0.7, c.z + 0.7, _near); for (const b of _near) if (b.y1 <= c.y + 1 && b.y1 > sup) sup = b.y1;
      if (sup < 0) sup = -0.6;
      if (c.y <= sup) { c.y = sup; c.vy = 0; if (c.chute) { scene.remove(c.chute); c.chute = null; } c.smokeT = 90; }
      c.mesh.position.y = c.y; if (c.chute) c.chute.position.set(c.x, c.y + 6, c.z);
    } else if (c.smokeT > 0) { c.smokeT -= dt; if (Math.random() < dt * 8) puff(c.x + rr(-0.4, 0.4), c.y + 1.5 + rr(0, 6), c.z + rr(-0.4, 0.4), Math.random() < 0.6 ? '#ff3b3b' : '#ff9a9a', 1.6, 2.5); }
  }
}

// ---------- no ar: queda livre e paraquedas ----------
function jumpOut(a) {
  a.mode = 'fall'; a.vx = PLANE.dx * 20; a.vz = PLANE.dz * 20; a.vy = -5; a.y = PLANE.y - 4;
  if (a === G.player) { G.view.pitch = -0.6; toast('Arraste para frente para mergulhar mais rápido.', 2.5); for (const m of teamMates(a)) if (m.bot && m.mode === 'plane') m.ai.jumpDelay = rr(0.3, 1.4); }
}
const _air = [];
function stepAir(a, dt, wx, wz, push) {
  const gh = groundH(a.x, a.z);
  if (a.mode === 'fall') {
    const tv = -(38 + 22 * push); a.vy += (tv - a.vy) * Math.min(1, dt * 1.5);
    const hs = 6 + 30 * push; applyAir(a, dt, wx, wz, hs, 1.2);
    if (a.y - Math.max(gh, 0) < (a.bot ? a.ai.chuteH : 115)) openChute(a);
  } else {
    const tv = -(5.5 + 3.5 * push); a.vy += (tv - a.vy) * Math.min(1, dt * 2.5);
    applyAir(a, dt, wx, wz, 3 + 10 * push, 1.5);
  }
  const ny = a.y + a.vy * dt, nx = clamp(a.x + a.vx * dt, -HALF + 4, HALF - 4), nz = clamp(a.z + a.vz * dt, -HALF + 4, HALF - 4);
  let sup = groundH(nx, nz);
  boxesNear(nx - 0.5, nz - 0.5, nx + 0.5, nz + 0.5, _air);
  for (const b of _air) if (nx > b.x0 && nx < b.x1 && nz > b.z0 && nz < b.z1 && b.y1 <= a.y + 0.1 && b.y1 > sup) sup = b.y1;
  a.x = nx; a.z = nz; a.y = ny;
  if (sup < -1.3 && ny < -1.3) { a.y = -1.3; land(a); }
  else if (ny <= sup) { a.y = sup; land(a); }
}
function applyAir(a, dt, wx, wz, hs, k) { const kk = Math.min(1, dt * k); a.vx += (wx * hs - a.vx) * kk; a.vz += (wz * hs - a.vz) * kk; }
function openChute(a) { if (a.mode !== 'fall') return; a.mode = 'chute'; a.vy = Math.max(a.vy, -14); if (a === G.player) sfx('chute'); }
function land(a) { a.mode = 'ground'; a.vy = 0; a.onGround = true; a.stance = 'stand'; if (a === G.player) toast('Pouso! Procure armas e equipamentos nas casas.', 2.5); }
// bots no ar: miram no ponto de pouso (colegas do jogador seguem o jogador)
function botAir(a, dt) {
  const ai = a.ai, p = G.player;
  let tx = ai.landX, tz = ai.landZ;
  if (a.team === p.team && p.alive && p.mode !== 'plane') { tx = (p.mode === 'ground' ? p.x : p.x + p.vx * 4) + ai.offX; tz = (p.mode === 'ground' ? p.z : p.z + p.vz * 4) + ai.offZ; if (p.mode === 'chute' && a.mode === 'fall' && a.y - groundH(a.x, a.z) < 220) openChute(a); }
  const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz) || 1, h = a.y - groundH(a.x, a.z);
  const need = a.mode === 'fall' ? d / Math.max(h, 1) : 1;
  const push = a.mode === 'fall' ? clamp(need * 1.4, 0.25, 1) : clamp(d / 30, 0, 1);
  a.yaw = Math.atan2(-dx, -dz);
  stepAir(a, dt, dx / d, dz / d, push);
}

// ---------- montar e encerrar a partida ----------
function clearMatch() {
  if (typeof clearNades === 'function') clearNades();
  if (typeof clearCorpses === 'function') clearCorpses();
  for (const a of G.actors) a.veh = null;
  for (const a of G.actors) removeModel(a);
  for (const c of G.crates) { scene.remove(c.mesh); if (c.chute) scene.remove(c.chute); }
  G.actors = []; G.crates = []; BUL.length = 0; PLANE.on = DROPP.on = false; PLANE.m.visible = DROPP.m.visible = false;
}
function startMatch(opt) {
  opt = opt || {};
  const R0 = Math.random; if (opt.seed) Math.random = mulberry(opt.seed); // mesma semente = mesmo mundo em todos os aparelhos
  try { startMatch2(opt); } finally { Math.random = R0; }
}
function startMatch2(opt) {
  const humans = opt.humans || [{ uid: 'me', name: SET.name || 'Jogador', char: SET.char }];
  if (G.net) G.net.mute = true;
  clearMatch(); spawnLoot(); spawnVehicles();
  if (G.net) G.net.mute = false;
  const size = { solo: 1, duo: 2, trio: 3, squad: 4 }[G.mode]; G.size = size;
  const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5); let ni = 0;
  const skill = () => { const hi = G.diff === 'alto' || (G.diff === 'mix' && Math.random() < 0.4); return clamp(hi ? rr(0.78, 0.92) : rr(0.38, 0.55), 0, 1); };
  let team = 0;
  for (let n = 0; n < 50;) {
    team++;
    for (let k = 0; k < size && n < 50; k++, n++) {
      const hu = team === 1 ? humans[k] : null, isP = !!hu, nm = isP ? hu.name : (names[ni++ % names.length] + (ni > names.length ? ni : ''));
      const a = makeActor({ name: nm, team, bot: !isP, skill: isP ? 1 : skill(), look: isP ? Object.assign({}, CHARS[hu.char] || CHARS[0]) : randLook(), uid: hu ? hu.uid : null, ix: n });
      initBot(a); if (isP) a.ai = null;
      a.mode = 'plane'; G.actors.push(a); buildModel(a);
    }
  }
  G.player = G.actors.find(a => a.uid === (opt.me || 'me')) || G.actors[0]; G.teams = {};
  if (opt.online) for (const a of G.actors) a.remote = opt.host ? (!!a.uid && a !== G.player) : a !== G.player; G.teamsLeft = team; G.nTeams = team; G.teamOut = {};
  G.view = { yaw: 0, pitch: -0.3, fpp: SET.view === 'fpp', spect: null };
  // avião atravessa a ilha
  setPath(PLANE, rr(0, 6.28), rr(-160, 160));
  PLANE.m.position.set(planeX(PLANE), PLANE.y, planeZ(PLANE));
  G.view.yaw = Math.atan2(-PLANE.dx, -PLANE.dz);
  // cada equipe de bots escolhe onde pousar (cidades com saque melhor atraem mais gente)
  for (let t = 2; t <= team; t++) {
    const mem = G.actors.filter(a => a.team === t);
    const tw = Math.random() < 0.55 ? wpick(TOWNS.map(T2 => [T2, T2.tier + 1])) : null;
    const list = tw ? BLD.filter(B => Math.hypot((B.x0 + B.x1) / 2 - tw.x, (B.z0 + B.z1) / 2 - tw.z) < tw.r) : BLD;
    let b = pick(list.length ? list : BLD);
    for (const a of mem) {
      if (size === 1 || Math.random() < 0.3) b = pick(list.length ? list : BLD); // em solo cada um escolhe sua casa
      const d = b.doors[0] || { ox: b.x0 - 2, oz: b.z0 - 2 };
      setLanding(a, d.ox + rr(-4, 4), d.oz + rr(-4, 4));
    }
  }
  for (const a of G.actors) if (a.team === 1 && a.bot) { setLanding(a, 0, 0); a.ai.offX = rr(-8, 8); a.ai.offZ = rr(-8, 8); }
  Object.assign(ZONE, { cx: 0, cz: 0, r: 1040, ph: 0, dmg: 0 }); nextCircle();
  ZONE.nx = rr(-120, 120); ZONE.nz = rr(-120, 120);
  G.matchT = 0; G.over = false; G.watch = false; G.deathLog = []; G.place = 0; G.feed = []; G.drops = [170, 360]; G.result = null;
  G.phase = 'match';
}
function setLanding(a, x, z) {
  a.ai.landX = x; a.ai.landZ = z;
  const along = (x - PLANE.x0) * PLANE.dx + (z - PLANE.z0) * PLANE.dz, side = Math.abs((x - PLANE.x0) * -PLANE.dz + (z - PLANE.z0) * PLANE.dx);
  a.ai.jumpAt = clamp(along - side * 0.6 + rr(-30, 30), 120, PLANE.len - 140);
}
function teamOut(team) {
  if (G.teamOut[team]) return;
  G.teamsLeft--; G.teamOut[team] = G.teamsLeft + 1;
  if (team === G.player.team) { G.place = G.teamsLeft + 1; endForPlayer(false); }
  if (G.teamsLeft <= 1 && !G.over) {
    G.over = true;
    const win = G.actors.find(a => a.alive);
    if (win && win.team === G.player.team) { G.place = 1; endForPlayer(true); }
  }
}
function onPlayerDead(src) {
  G.killer = src;
  if (teamUp(G.player.team)) { hudDeadButTeam(); }
}
function endForPlayer(win) {
  if (G.result) return;
  const p = G.player;
  G.result = { win, place: G.place, kills: p.kills, dmg: Math.round(p.dmgDone), time: G.matchT, teamKills: G.actors.filter(a => a.team === p.team).reduce((s, a) => s + a.kills, 0) };
  SET.matches++; SET.kills += p.kills; SET.dmg = (SET.dmg || 0) + G.result.dmg; if (win) SET.wins++; if (!SET.best || G.place < SET.best) SET.best = G.place; saveSet();
  setTimeout(() => showResult(G.result), win ? 1500 : 2500);
  sfx(win ? 'win' : 'lose');
}
// passo da partida
function stepMatch(dt) {
  G.matchT += dt;
  stepPlanes(dt);
  if (!PLANE.on || G.matchT > 25) stepZone(dt);
  while (G.drops.length && G.matchT > G.drops[0]) { G.drops.shift(); callAirdrop(); }
  for (const a of G.actors) {
    if (!a.alive) continue;
    if (a.remote) { netInterp(a, dt); continue; }
    if (a.mode === 'plane') { if (a.bot && a.ai.jumpDelay != null && (a.ai.jumpDelay -= dt) <= 0) { a.ai.jumpDelay = null; jumpOut(a); } continue; }
    if (a.mode === 'fall' || a.mode === 'chute') { if (a.bot) botAir(a, dt); continue; }
    actorTimers(a, dt);
    if (!a.alive) continue;
    if (a.veh) { if (a.bot) botInVeh(a, dt); continue; }
    if (a.vault) { stepVault(a, dt); continue; }
    if (a.bot) botTick(a, dt);
    if (!a.alive || a.veh) continue;
    stepPhys(a, dt);
    a.lean += (a.leanT - a.lean) * Math.min(1, dt * 10);
  }
  // pessoas não se atravessam: empurra uma para longe da outra
  const act = G.actors;
  for (let i = 0; i < act.length; i++) { const a = act[i]; if (a.remote || !a.alive || a.mode !== 'ground' || a.veh || a.vault) continue;
    for (let j = i + 1; j < act.length; j++) { const b = act[j]; if (!b.alive || b.mode !== 'ground' || b.veh || b.vault) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz; if (d2 > 0.42 || d2 < 1e-6 || Math.abs(a.y - b.y) > 1.2) continue;
      const d = Math.sqrt(d2), p = (0.65 - d) / 2 / d; a.x -= dx * p; a.z -= dz * p; b.x += dx * p; b.z += dz * p; } }
  netTick(dt); stepNades(dt); stepVehicles(dt); stepBullets(dt); stepFx2(dt); stepGunFx(dt); stepCrates(dt); stepFx(dt);
}
