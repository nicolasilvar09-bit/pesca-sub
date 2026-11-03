// ================= bots: pulo, saque, zona, combate (nível médio e alto), reviver colegas =================
// skill 0.45 = médio, 0.85 = alto. Tudo deriva daí: tempo de reação, erro de mira, alcance de visão, giro
const botP = a => {
  const s = a.skill;
  return { react: lerp(1.35, 0.45, s), err: lerp(0.045, 0.019, s), floor: lerp(0.45, 0.2, s), turn: lerp(3.2, 8, s), range: lerp(150, 280, s), lead: lerp(0.3, 0.95, s), drop: lerp(0.4, 1, s), head: lerp(0.06, 0.3, s) };
};
function initBot(a) {
  a.ai = { goal: 'loot', think: rr(0, 0.3), scanT: rr(0, 0.3), enemy: null, react: 0, lostT: 0, seenX: 0, seenZ: 0, strafe: 1, strafeT: 0, burstT: 0, pauseT: 0,
    ox: 0, oy: 0, oz: 0, errT: 0, engT: 0, tx: a.x, tz: a.z, door: null, doorT: 0, stuckT: 0, sx: a.x, sz: a.z, detT: 0, detA: 0, avoidA: 0, avoidT: 0,
    visited: new Set(), skip: new Set(), lootIt: null, lootCr: null, campT: 0, roamT: 0, zoneGo: null, jumpAt: 1, chuteH: rr(110, 160), wantMove: false, sprint: false };
}
function botAlert(a, src) {
  const ai = a.ai; if (!ai || !src || src.team === a.team) return;
  if (!ai.enemy || ai.enemy === src) { ai.enemy = src; ai.seenX = src.x; ai.seenZ = src.z; ai.lostT = Math.min(ai.lostT, 1); ai.react = Math.max(ai.react, botP(a).react * 0.6); }
}
const _E1 = {}, _S2 = {}, _items = [];
function botScan(a) {
  const P = botP(a), w = curW(a), z = w && w.att.sight ? ATT[w.att.sight].zoom : 1;
  const R = P.range * (z >= 4 ? 1.35 : 1); eyePos(a, _E1);
  let best = null, bd = 1e12;
  for (const t of G.actors) {
    if (!t.alive || t.team === a.team || (t.mode !== 'ground' && t.mode !== 'chute')) continue;
    const dx = t.x - a.x, dz = t.z - a.z, d2 = dx * dx + dz * dz;
    let r = R; if (t.stance === 'prone' && d2 > 3600) r *= 0.5; else if (t.stance === 'crouch') r *= 0.85;
    if (t.mode === 'chute') r = Math.min(r, 120);
    if (d2 > r * r || d2 > bd) continue;
    const ang = Math.abs(wrapA(Math.atan2(-dx, -dz) - a.yaw));
    const heard = t.lastShotT && G.matchT - t.lastShotT < 0.7 && d2 < 260 * 260;
    if (ang > 1.8 && d2 > 200 && !heard && t !== a.lastHitBy) continue;
    hitShape(t, _S2);
    if (!losClear(_E1.x, _E1.y, _E1.z, _S2.bx, _S2.by - 0.15, _S2.bz) && !losClear(_E1.x, _E1.y, _E1.z, _S2.hx, _S2.hy, _S2.hz)) continue;
    best = t; bd = d2;
  }
  return best;
}
// arma com munição mais adequada para a distância
function botPickWeapon(a, dist) {
  let best = -1, bs = -1;
  for (let i = 0; i < 3; i++) {
    const w = a.wp[i]; if (!w || (!w.mag && !ammoOf(a, w))) continue;
    const c = wdef(w).cls, z = sightZoom(w);
    let s = { pistol: 1, smg: dist < 50 ? 6 : 2, ar: dist < 200 ? 7 : 4, dmr: dist > 80 ? 8 : 4, sr: dist > 100 ? 9 : 3 }[c];
    if (dist > 120 && z >= 3) s += 2;
    if (s > bs) { bs = s; best = i; }
  }
  if (best >= 0 && best !== a.cur) switchWeapon(a, best);
  return best >= 0;
}
const hasGun = a => a.wp.some(w => w && (w.mag > 0 || ammoOf(a, w) > 0));
const healItem = a => ['MED', 'FAK', 'BAND', 'PAIN', 'ENERGY'].find(k => canHeal(a, k));
// ---------- navegação ----------
function pointBlocked(x, y, z) {
  if (groundH(x, z) < -1.1) return true;
  boxesNear(x - 0.4, z - 0.4, x + 0.4, z + 0.4, _near);
  for (const b of _near) if (b.y1 > y + STEP_H && b.y0 < y + 1.6 && x > b.x0 - 0.35 && x < b.x1 + 0.35 && z > b.z0 - 0.35 && z < b.z1 + 0.35) return true;
  return false;
}
function navTarget(a, tx, tz) {
  const ai = a.ai;
  if (ai.door) {
    const d = ai.door; let p = d.step === 0 ? d.p0 : d.p1;
    if (Math.hypot(p[0] - a.x, p[1] - a.z) < 1.0) { if (d.step === 0) d.step = 1; else ai.door = null; }
    if (ai.door && G.matchT - ai.doorT > 9) ai.door = null;
    if (ai.door) return ai.door.step === 0 ? ai.door.p0 : ai.door.p1;
  }
  const bIn = bldAt(a.x, a.z, -0.3), bT = bldAt(tx, tz, -0.3);
  if (bIn !== bT) {
    const b = bIn || bT;
    if (b.doors.length && a.y < b.y + 1.5) {
      let dd = null, bd = 1e9;
      for (const d of b.doors) { const s = Math.hypot(d.ox - a.x, d.oz - a.z) + Math.hypot(d.ox - tx, d.oz - tz); if (s < bd) { bd = s; dd = d; } }
      ai.door = bIn ? { p0: [dd.ix, dd.iz], p1: [dd.ox, dd.oz], step: 0 } : { p0: [dd.ox, dd.oz], p1: [dd.ix, dd.iz], step: 0 };
      ai.doorT = G.matchT; return ai.door.p0;
    }
  }
  return [tx, tz];
}
function botSteer(a, dt, tx, tz, speedMul) {
  const ai = a.ai, p = navTarget(a, tx, tz), dx = p[0] - a.x, dz = p[1] - a.z, d = Math.hypot(dx, dz);
  if (d < 0.5) { ai.wantMove = false; return 0; }
  ai.wantMove = true;
  let ang = Math.atan2(dx, dz);
  if (ai.detT > 0) { ai.detT -= dt; ang = ai.detA; }
  else {
    if ((ai.avoidT -= dt) <= 0) { // antenas: desvia de parede/árvore na frente
      ai.avoidT = 0.15; ai.avoidA = 0;
      for (const o of [0, 0.7, -0.7, 1.4, -1.4]) { const aa = ang + o; if (!pointBlocked(a.x + Math.sin(aa) * 1.1, a.y, a.z + Math.cos(aa) * 1.1)) { ai.avoidA = o; break; } }
    }
    ang += ai.avoidA;
  }
  const sp = moveSpeed(a, ai.sprint && a.stance === 'stand') * (speedMul || 1);
  applyMove(a, dt, Math.sin(ang), Math.cos(ang), sp);
  return d;
}
function botStuck(a, dt) {
  const ai = a.ai; if ((ai.stuckT += dt) < 1.2) return;
  ai.stuckT = 0;
  const moved = Math.hypot(a.x - ai.sx, a.z - ai.sz); ai.sx = a.x; ai.sz = a.z;
  if (ai.wantMove && moved < 0.5 && a.mode === 'ground') {
    const b = bldAt(a.x, a.z, 0.5);
    if (b && a.y > groundH(a.x, a.z) + 2.2) ai.detA = Math.atan2(a.x - (b.x0 + b.x1) / 2, a.z - (b.z0 + b.z1) / 2); // em cima de prédio: vai para a borda
    else ai.detA = Math.atan2(ai.tx - a.x, ai.tz - a.z) + (Math.random() < 0.5 ? 1 : -1) * rr(1.2, 2.2);
    ai.detT = rr(0.7, 1.3); ai.door = null; if (a.stance !== 'stand') a.stance = 'stand'; tryJump(a);
  }
}
// ---------- decisão (4x por segundo) ----------
function botThink(a) {
  const ai = a.ai, P = botP(a);
  // inimigo à vista?
  const seen = botScan(a);
  if (seen) {
    if (ai.enemy !== seen) { ai.enemy = seen; ai.react = P.react * rr(0.7, 1.3); ai.engT = 0; }
    ai.lostT = 0; ai.seenX = seen.x; ai.seenZ = seen.z; ai.vis = true;
  } else { ai.vis = false; if (ai.enemy && !ai.enemy.alive) ai.enemy = null; }
  if (ai.enemy && ai.lostT > (a.skill > 0.7 ? 9 : 5)) ai.enemy = null;
  if (a.knocked) { ai.goal = 'crawl'; return; }
  const z = ZONE, out = Math.hypot(a.x - z.cx, a.z - z.cz) > z.r - 4;
  const outNext = Math.hypot(a.x - z.nx, a.z - z.nz) > z.nr - 3;
  const zoneUrgent = out || (outNext && (z.st === 'shrink' || z.t < 50));
  // munição: reabastece aos poucos fora de briga (simula o saque que um jogador faria)
  if (!ai.enemy && G.matchT - (ai.ammoT || 0) > 25) { ai.ammoT = G.matchT; for (const w of a.wp) if (w && ammoOf(a, w) < magSize(w)) a.bag['a:' + wdef(w).ammo] = (a.bag['a:' + wdef(w).ammo] || 0) + magSize(w); }
  const ed = ai.enemy ? Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z) : 99;
  const melee = ai.enemy && !hasGun(a) && ed < 4 && (!hasGun(ai.enemy) && Math.random() < 0.5 || (a.lastHitBy === ai.enemy && G.matchT - a.lastHitT < 2));
  if (ai.enemy && (hasGun(a) || melee) && !(zoneUrgent && !ai.vis && out)) {
    ai.goal = 'fight'; botPickWeapon(a, Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z)); return;
  }
  // reviver colega derrubado
  const down = !ai.enemy && G.actors.find(m => m.team === a.team && m !== a && m.alive && m.knocked && Math.hypot(m.x - a.x, m.z - a.z) < 90);
  if (down) { ai.goal = 'revive'; ai.tx = down.x; ai.tz = down.z; ai.revT = down; return; }
  // curar
  if (a.hp < 72 && !ai.vis && a.healT <= 0 && G.matchT - a.lastHitT > 2.5) { const k = healItem(a); if (k && (a.hp < 50 || k === 'BAND' || k === 'ENERGY')) { ai.goal = 'heal'; startHeal(a, k); return; } }
  if (a.healT > 0) { ai.goal = 'heal'; return; }
  // zona
  if (zoneUrgent) {
    if (!ai.zoneGo || Math.hypot(ai.zoneGo[0] - z.nx, ai.zoneGo[1] - z.nz) > z.nr * 0.8) {
      for (let k = 0; k < 8; k++) { const an = rr(0, 6.28), r = Math.sqrt(Math.random()) * z.nr * 0.65, x = z.nx + Math.cos(an) * r, zz = z.nz + Math.sin(an) * r; ai.zoneGo = [x, zz]; if (groundH(x, zz) > 0.5) break; }
    }
    ai.goal = 'zone'; ai.tx = ai.zoneGo[0]; ai.tz = ai.zoneGo[1]; ai.sprint = true; return;
  }
  ai.sprint = false;
  // seguir o líder da equipe (colegas do jogador ficam por perto)
  const lead = a.team === G.player.team ? (G.player.alive ? G.player : null) : null;
  if (lead && lead.mode === 'ground' && Math.hypot(lead.x - a.x, lead.z - a.z) > 28) { ai.goal = 'follow'; ai.tx = lead.x + rr(-5, 5); ai.tz = lead.z + rr(-5, 5); ai.sprint = true; return; }
  // saquear
  if (botLootPlan(a)) { ai.goal = 'loot'; return; }
  // bem equipado: anda até um ponto seguro e espera agachado
  if (ai.goal !== 'camp' || ai.campT <= 0) {
    if (ai.goal === 'roam' && Math.hypot(ai.tx - a.x, ai.tz - a.z) < 3) { ai.goal = 'camp'; ai.campT = rr(15, 40); return; }
    if (ai.goal !== 'roam' || (ai.roamT -= 0.25) <= 0) {
      const an = rr(0, 6.28), r = Math.sqrt(Math.random()) * Math.min(z.nr, z.r) * 0.6;
      let x = z.nx + Math.cos(an) * r, zz = z.nz + Math.sin(an) * r;
      if (lead) { x = lead.x + rr(-8, 8); zz = lead.z + rr(-8, 8); }
      if (groundH(x, zz) > 0.5) { ai.tx = x; ai.tz = zz; }
      ai.goal = 'roam'; ai.roamT = rr(20, 45);
    }
  }
}
function botLootPlan(a) {
  const ai = a.ai;
  if (ai.lootIt && G.items.includes(ai.lootIt) && !ai.skip.has(ai.lootIt) && wantAuto(a, ai.lootIt)) { ai.tx = ai.lootIt.x; ai.tz = ai.lootIt.z; return true; }
  if (ai.lootCr && G.crates.includes(ai.lootCr) && ai.lootCr.items.some(e => wantAuto(a, e))) { ai.tx = ai.lootCr.x; ai.tz = ai.lootCr.z; return true; }
  ai.lootIt = ai.lootCr = null;
  // drop do avião: os bons vão buscar
  if (a.skill > 0.6 && a.hp > 60 && hasGun(a)) for (const c of G.crates) if (c.kind === 'drop' && !c.vy && c.items.length && Math.hypot(c.x - a.x, c.z - a.z) < 170) { ai.lootCr = c; ai.tx = c.x; ai.tz = c.z; return true; }
  const needs = !hasGun(a) || !a.vest || !a.helm || !healItem(a) || a.wp.filter(Boolean).length < 2 || G.matchT < 200;
  if (!needs) return false;
  let best = null, bd = 1e9;
  for (const it of itemsNear(a.x, a.z, 30, _items)) {
    if (Math.abs(it.y - a.y) > 1.3 || ai.skip.has(it) || !wantAuto(a, it)) continue;
    let d = Math.hypot(it.x - a.x, it.z - a.z); if (it.k.startsWith('w:') && !hasGun(a)) d *= 0.4;
    if (d < bd) { bd = d; best = it; }
  }
  for (const c of G.crates) { const d = Math.hypot(c.x - a.x, c.z - a.z); if (d < 35 && d * 0.7 < bd && c.items.some(e => wantAuto(a, e))) { bd = d * 0.7; best = null; ai.lootCr = c; } }
  if (best) { ai.lootIt = best; ai.tx = best.x; ai.tz = best.z; return true; }
  if (ai.lootCr) { ai.tx = ai.lootCr.x; ai.tz = ai.lootCr.z; return true; }
  // casa ainda não visitada mais perto
  if (G.matchT > 240) return false;
  let bb = null; bd = 1e9;
  for (const b of BLD) { if (ai.visited.has(b)) continue; const d = Math.hypot((b.x0 + b.x1) / 2 - a.x, (b.z0 + b.z1) / 2 - a.z) * rr(0.8, 1.2); if (d < bd && d < 220) { bd = d; bb = b; } }
  if (!bb) return false;
  const cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2;
  if (Math.hypot(cx - a.x, cz - a.z) < 3) { ai.visited.add(bb); return botLootPlan(a); }
  ai.tx = cx; ai.tz = cz; return true;
}
// ---------- ação (todo quadro) ----------
function botTick(a, dt) {
  const ai = a.ai;
  if ((ai.think -= dt) <= 0) { ai.think = rr(0.22, 0.3); botThink(a); }
  if (ai.enemy && !ai.vis) ai.lostT += dt;
  botStuck(a, dt);
  a.trigger = false;
  const g = ai.goal;
  if (g === 'crawl') {
    const m = G.actors.find(o => o.team === a.team && o !== a && o.alive && !o.knocked);
    if (m && Math.hypot(m.x - a.x, m.z - a.z) > 2) { a.yaw = Math.atan2(-(m.x - a.x), -(m.z - a.z)); botSteer(a, dt, m.x, m.z); } else applyMove(a, dt, 0, 0, 0);
    return;
  }
  if (g === 'fight') return botFight(a, dt);
  a.ads = false;
  if (a.stance === 'prone') a.stance = 'crouch';
  if (g === 'heal') { applyMove(a, dt, 0, 0, 0); if (a.stance === 'stand') a.stance = 'crouch'; lookAround(a, dt); return; }
  if (g === 'camp') { applyMove(a, dt, 0, 0, 0); ai.campT -= dt; if (a.stance === 'stand') a.stance = 'crouch'; lookAround(a, dt); if (curW(a) && curW(a).mag < magSize(curW(a))) startReload(a); return; }
  if (a.stance === 'crouch' && g !== 'loot') a.stance = 'stand';
  if (g === 'revive') {
    const t = ai.revT; if (!t || !t.alive || !t.knocked) { ai.goal = 'roam'; return; }
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    if (d < 1.7) { applyMove(a, dt, 0, 0, 0); if (!a.reviving) { a.reviving = t; a.reviveT = 0; } return; }
    ai.tx = t.x; ai.tz = t.z; ai.sprint = true;
  }
  const d = botSteer(a, dt, ai.tx, ai.tz);
  if (ai.wantMove) { const tgt = Math.atan2(-a.vx, -a.vz); if (Math.hypot(a.vx, a.vz) > 0.5) a.yaw += wrapA(tgt - a.yaw) * Math.min(1, dt * 6); a.pitch *= 0.9; }
  // pega o que estiver ao alcance
  if (g === 'loot') {
    if (ai.lootIt && d < 1.6 && Math.abs(ai.lootIt.y - a.y) < 1.4 && G.items.includes(ai.lootIt)) {
      const it = ai.lootIt, got = giveItem(a, it.k, it.n, it.w, false);
      if (got >= it.n || it.k.startsWith('w:') && got) removeItem(it); else if (got) it.n -= got; else ai.skip.add(it);
      ai.lootIt = null; ai.think = 0.05;
    }
    if (ai.lootCr && Math.hypot(ai.lootCr.x - a.x, ai.lootCr.z - a.z) < 1.8) {
      const c = ai.lootCr;
      for (const e of c.items.slice()) if (wantAuto(a, e)) { const got = giveItem(a, e.k, e.n, e.w, false); if (got >= e.n || (e.k.startsWith('w:') && got)) c.items.splice(c.items.indexOf(e), 1); else e.n -= got; }
      ai.lootCr = null; ai.think = 0.05; crateCleanup(c);
    }
    if (!ai.lootIt && !ai.lootCr && bldAt(a.x, a.z, -0.3) && Math.hypot(ai.tx - a.x, ai.tz - a.z) < 2.5) ai.visited.add(bldAt(a.x, a.z, -0.3));
  }
}
function lookAround(a, dt) { a.yaw += Math.sin(G.matchT * 0.4 + a.id) * dt * 0.8; a.pitch *= 0.95; }
const _ap = {};
function botFight(a, dt) {
  const ai = a.ai, P = botP(a), t = ai.enemy, w = curW(a);
  if (!t) { ai.goal = 'roam'; return; }
  if (!w || (!w.mag && !ammoOf(a, w))) { // sem munição: parte para o soco
    if (a.cur >= 0 && !hasGun(a)) switchWeapon(a, a.cur);
    const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) || 1;
    a.yaw += clamp(wrapA(Math.atan2(-dx, -dz) - a.yaw), -P.turn * dt, P.turn * dt); a.pitch *= 0.9;
    if (d > 1.2) botSteer(a, dt, t.x, t.z); else applyMove(a, dt, 0, 0, 0);
    if (d < 1.6) { a.trigger = true; punch(a); }
    return;
  }
  const dx = t.x - a.x, dz = t.z - a.z, dist = Math.hypot(dx, dz), d = wdef(w), cls = d.cls;
  ai.engT += dt;
  // ponto de mira: corpo (às vezes cabeça) + adiantamento + compensa a queda da bala + erro humano
  hitShape(t, _S2);
  if ((ai.errT -= dt) <= 0) {
    ai.errT = rr(0.25, 0.5); const settle = clamp(2.3 - ai.engT * 0.35, 1, 2.3), mv = Math.hypot(t.vx, t.vz) > 2 ? 1.5 : 1;
    const e = Math.max(P.floor, dist * P.err * settle * mv * (a.ads ? 1 : 1.3));
    ai.ox = gauss() * e; ai.oy = gauss() * e * 0.8; ai.oz = gauss() * e; ai.aimHead = Math.random() < P.head;
  }
  const tf = dist / d.v;
  let px = (ai.aimHead ? _S2.hx : (_S2.ax + _S2.bx) / 2) + t.vx * tf * P.lead + ai.ox;
  let py = (ai.aimHead ? _S2.hy : (_S2.ay + _S2.by * 2) / 3) + ai.oy;
  let pz = (ai.aimHead ? _S2.hz : (_S2.az + _S2.bz) / 2) + t.vz * tf * P.lead + ai.oz;
  py += GRAV / (2 * d.v * d.v) * (dist * dist - 100 * dist) * P.drop;
  eyePos(a, _ap);
  const ax = px - _ap.x, ay = py - _ap.y, az = pz - _ap.z, hd = Math.hypot(ax, az);
  const wy = Math.atan2(-ax, -az), wp = Math.atan2(ay, hd);
  const dy = wrapA(wy - a.yaw), dp = wp - a.pitch, mx = P.turn * dt;
  a.yaw += clamp(dy, -mx, mx); a.pitch += clamp(dp, -mx, mx);
  a.ads = dist > 15 && a.stance !== 'prone';
  // movimento: anda de lado, aproxima se longe, agacha de longe
  const eff = CLS[cls].range;
  if ((ai.strafeT -= dt) <= 0) { ai.strafeT = rr(0.5, 1.5); ai.strafe = Math.random() < 0.5 ? -1 : 1; if (dist > 70 && Math.random() < 0.4 && ai.vis) a.stance = 'crouch'; else if (a.stance === 'crouch' && Math.random() < 0.5) a.stance = 'stand'; }
  const rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw), fx = fwdX(a.yaw), fz = fwdZ(a.yaw);
  let mvx = rx * ai.strafe * 0.8, mvz = rz * ai.strafe * 0.8;
  if (!ai.vis) { const p = navTarget(a, ai.seenX, ai.seenZ); const ex = p[0] - a.x, ez = p[1] - a.z, el = Math.hypot(ex, ez) || 1; mvx = ex / el; mvz = ez / el; if (Math.hypot(ai.seenX - a.x, ai.seenZ - a.z) < 3) ai.enemy = null; }
  else if (dist > eff * 0.85) { mvx = mvx * 0.4 + fx; mvz = mvz * 0.4 + fz; }
  else if (dist < 6 && cls !== 'smg') { mvx -= fx * 0.5; mvz -= fz * 0.5; }
  if (w.mag === 0 || a.reloadT > 0) { mvx = rx * ai.strafe; mvz = rz * ai.strafe; if (a.reloadT <= 0) startReload(a); }
  if (a.stance === 'crouch' && ai.vis && dist > 70) { mvx *= 0.3; mvz *= 0.3; }
  const ml = Math.hypot(mvx, mvz); if (ml > 1) { mvx /= ml; mvz /= ml; }
  if (pointBlocked(a.x + mvx * 1.1, a.y, a.z + mvz * 1.1)) { ai.strafe *= -1; mvx = -mvx; mvz = -mvz; }
  applyMove(a, dt, mvx, mvz, moveSpeed(a, false));
  ai.wantMove = ml > 0.2;
  // tiro
  if (!ai.vis || (ai.react -= dt) > 0 || Math.abs(dy) > 0.08 + 1.5 / Math.max(dist, 5) || Math.abs(dp) > 0.08 + 1.5 / Math.max(dist, 5)) return;
  if (dist > eff * 1.6) return;
  if (d.auto) {
    if (ai.pauseT > 0) { ai.pauseT -= dt; return; }
    if ((ai.burstT -= dt) <= 0) { ai.burstT = dist < 40 ? rr(0.5, 1.1) : rr(0.2, 0.45); ai.pauseT = dist < 40 ? rr(0.1, 0.3) : rr(0.3, 0.6) * (1.6 - a.skill); }
  } else if (a.fireCd <= 0 && Math.random() > dt * (d.bolt ? 3 : 6) * (0.5 + a.skill)) return;
  a.trigger = true;
  const cp = Math.cos(a.pitch);
  if (d.burst && a.burstN >= 3) { if (a.fireCd <= 0) a.burstN = 0; return; }
  fireShot(a, _ap.x, _ap.y, _ap.z, fwdX(a.yaw) * cp, Math.sin(a.pitch), fwdZ(a.yaw) * cp);
  // o coice do bot: sobe a mira um pouco (melhores controlam mais)
  a.pitch += d.rec * 0.004 * (1.4 - a.skill);
}
function crateCleanup(c) { if (!c.items.length && c.kind === 'death') { scene.remove(c.mesh); G.crates.splice(G.crates.indexOf(c), 1); } }
