// ================= combate: tiro com queda da bala, acertos (cabeça/corpo), proteção, cura, derrubado e abate =================
const BUL = [];
const _out = {};
// posição dos olhos (câmera em 1ª pessoa e origem dos tiros), já com a inclinação
function eyePos(a, o) {
  const fx = fwdX(a.yaw), fz = fwdZ(a.yaw), rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw);
  if (a.knocked || a.stance === 'prone') { o.x = a.x + fx * 1.45; o.y = a.y + 0.38; o.z = a.z + fz * 1.45; return o; }
  const cr = a.stance === 'crouch', up = cr ? 0.72 : 0.76, hip = cr ? 0.62 : 0.92, th = -a.lean * 0.38;
  const side = -Math.sin(th) * up;
  o.x = a.x + rx * side; o.z = a.z + rz * side; o.y = a.y + hip + Math.cos(th) * up; return o;
}
// formas de acerto: cabeça (esfera) e corpo (cápsula)
function hitShape(a, S) {
  const fx = fwdX(a.yaw), fz = fwdZ(a.yaw), rx = Math.cos(a.yaw), rz = -Math.sin(a.yaw);
  if (a.knocked || a.stance === 'prone') {
    S.hx = a.x + fx * 1.62; S.hy = a.y + 0.28; S.hz = a.z + fz * 1.62; S.hr = 0.16;
    S.ax = a.x + fx * 0.15; S.ay = a.y + 0.22; S.az = a.z + fz * 0.15; S.bx = a.x + fx * 1.35; S.by = a.y + 0.24; S.bz = a.z + fz * 1.35; S.br = 0.24; return S;
  }
  const cr = a.stance === 'crouch', hip = cr ? 0.62 : 0.92, th = -a.lean * 0.38, sn = -Math.sin(th), cs = Math.cos(th);
  S.ax = a.x; S.ay = a.y + (cr ? 0.25 : 0.15); S.az = a.z;
  S.bx = a.x + rx * sn * 0.55; S.by = a.y + hip + cs * 0.55; S.bz = a.z + rz * sn * 0.55; S.br = 0.27;
  S.hx = a.x + rx * sn * 0.8; S.hy = a.y + hip + cs * 0.8; S.hz = a.z + rz * sn * 0.8; S.hr = 0.16; return S;
}
function segSphere(ox, oy, oz, dx, dy, dz, len, cx, cy, cz, r) { // d unitário
  const lx = cx - ox, ly = cy - oy, lz = cz - oz, tc = lx * dx + ly * dy + lz * dz;
  const d2 = lx * lx + ly * ly + lz * lz - tc * tc; if (d2 > r * r) return Infinity;
  const t = tc - Math.sqrt(r * r - d2); return t >= 0 && t <= len ? t : Infinity;
}
function segCapsule(ox, oy, oz, dx, dy, dz, len, S) { // aproximação: menor distância entre o segmento da bala e o eixo do corpo
  const ux = S.bx - S.ax, uy = S.by - S.ay, uz = S.bz - S.az, wx = ox - S.ax, wy = oy - S.ay, wz = oz - S.az;
  const a = len * len, b = len * (dx * ux + dy * uy + dz * uz), c = ux * ux + uy * uy + uz * uz, d = len * (dx * wx + dy * wy + dz * wz), e = ux * wx + uy * wy + uz * wz;
  const D = a * c - b * b; let s = D > 1e-9 ? clamp((b * e - c * d) / D, 0, 1) : 0, t = c > 1e-9 ? clamp((b * s + e) / c, 0, 1) : 0;
  s = clamp((b * t - d) / a, 0, 1);
  const px = ox + dx * len * s - (S.ax + ux * t), py = oy + dy * len * s - (S.ay + uy * t), pz = oz + dz * len * s - (S.az + uz * t);
  return px * px + py * py + pz * pz <= S.br * S.br ? s * len : Infinity;
}
// primeiro personagem atingido pelo segmento
const _S = {};
function rayActors(ox, oy, oz, dx, dy, dz, len, skip, team) {
  let best = Infinity, who = null, head = false;
  const mx = ox + dx * len / 2, mz = oz + dz * len / 2, R = len / 2 + 2.5;
  for (const a of G.actors) {
    if (!a.alive || a === skip || a.mode === 'plane' || (team && a.team === team)) continue;
    if (Math.abs(a.x - mx) > R || Math.abs(a.z - mz) > R) continue;
    hitShape(a, _S);
    const th = segSphere(ox, oy, oz, dx, dy, dz, len, _S.hx, _S.hy, _S.hz, _S.hr);
    if (th < best) { best = th; who = a; head = true; }
    const tb = segCapsule(ox, oy, oz, dx, dy, dz, len, _S);
    if (tb < best - 0.05) { best = tb; who = a; head = false; }
  }
  _out.t = best; _out.a = who; _out.head = head; return _out;
}

// ---------- traçantes e efeitos ----------
const TRC_N = 160;
const trcPos = new Float32Array(TRC_N * 6);
const trcGeo = new T.BufferGeometry(); trcGeo.setAttribute('position', new T.BufferAttribute(trcPos, 3));
const tracers = new T.LineSegments(trcGeo, new T.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.85, fog: false }));
tracers.frustumCulled = false; scene.add(tracers);
const FX = [];
for (let i = 0; i < 40; i++) { const m = new T.Mesh(GEO.sph, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false })); m.visible = false; scene.add(m); FX.push({ m, t: 0, life: 0, s: 1 }); }
let fxI = 0;
function puff(x, y, z, color, size, life) {
  const f = FX[fxI = (fxI + 1) % FX.length]; f.m.position.set(x, y, z); f.m.material.color.set(color); f.m.visible = true; f.t = 0; f.life = life || 0.5; f.s = size || 0.3;
}
function stepFx(dt) {
  for (const f of FX) { if (!f.m.visible) continue; f.t += dt; const k = f.t / f.life; if (k >= 1) { f.m.visible = false; continue; } f.m.scale.setScalar(f.s * (0.6 + k * 1.4)); f.m.material.opacity = 0.8 * (1 - k); }
}

// ---------- disparo ----------
function weaponMods(w) {
  let rec = 1, quiet = false;
  for (const s of ['muzzle', 'grip']) { const k = w.att[s]; if (k) { rec *= ATT[k].rec || 1; quiet = quiet || !!ATT[k].quiet; } }
  return { rec, quiet };
}
function sightZoom(w) { return w && w.att.sight ? ATT[w.att.sight].zoom : 1.1; }
function spreadOf(a, w) {
  const c = CLS[wdef(w).cls], moving = Math.hypot(a.vx, a.vz) > 1;
  let s = a.ads ? c.ads : c.hip;
  if (moving) s *= a.ads ? 1.6 : 1.4;
  if (a.stance === 'crouch') s *= 0.8; else if (a.stance === 'prone') s *= 0.6;
  if (!a.onGround) s *= 3;
  return s * (1 + a.recoil * 0.6) * Math.PI / 180;
}
// atira de (ox,oy,oz) na direção (dx,dy,dz) unitária. Devolve true se saiu o tiro
function fireShot(a, ox, oy, oz, dx, dy, dz) {
  const w = curW(a); if (!w || a.reloadT > 0 || a.healT > 0 || a.fireCd > 0 || a.knocked) return false;
  if (w.mag <= 0) { startReload(a); return false; }
  const d = wdef(w), mods = weaponMods(w);
  w.mag--; a.fireCd = 60 / d.rpm;
  // dispersão
  const sp = spreadOf(a, w), ang = Math.random() * Math.PI * 2, r = Math.abs(gauss()) * sp * 0.6;
  let ux = -dz, uz = dx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul; // perpendicular horizontal
  const vx = dy * uz, vy = dz * ux - dx * uz, vz = -dy * ux; // perpendicular "para cima"
  const ca = Math.cos(ang) * r, sa = Math.sin(ang) * r;
  let fx = dx + ux * ca + vx * sa, fy = dy + vy * sa, fz = dz + uz * ca + vz * sa; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  // zerada em 100 m: a bala sai um pouco para cima e cai com a gravidade
  const zero = GRAV * 100 / (2 * d.v * d.v);
  BUL.push({ x: ox, y: oy, z: oz, vx: fx * d.v, vy: (fy + zero) * d.v, vz: fz * d.v, o: a, team: a.team, dmg: d.dmg, head: CLS[d.cls].head, wn: d.n, life: 0, px: ox, py: oy, pz: oz });
  a.recoil = Math.min(a.recoil + 0.25, 2.5);
  a.kick = (a.kick || 0) + d.rec * mods.rec;
  if (d.burst) a.burstN++;
  shotSound(a, d, mods.quiet);
  if (a === G.player) { G.flash = 0.05; G.camKick = (G.camKick || 0) + d.rec * mods.rec; }
  else if (!mods.quiet) a.lastShotT = G.matchT;
  if (w.mag === 0 && a.bot) startReload(a);
  return true;
}
function stepBullets(dt) {
  let n = 0;
  for (let i = BUL.length - 1; i >= 0; i--) {
    const b = BUL[i];
    b.px = b.x; b.py = b.y; b.pz = b.z;
    const k = 1 - 0.07 * dt; b.vx *= k; b.vz *= k; b.vy = b.vy * k - GRAV * dt;
    const sx = b.vx * dt, sy = b.vy * dt, sz = b.vz * dt, len = Math.hypot(sx, sy, sz), dx = sx / len, dy = sy / len, dz = sz / len;
    const ts = rayStatic(b.x, b.y, b.z, dx, dy, dz, len);
    const ha = rayActors(b.x, b.y, b.z, dx, dy, dz, len, b.o, b.team);
    b.life += dt;
    const hv = rayVehicles(b.x, b.y, b.z, dx, dy, dz, len, b.o.veh);
    if (hv.v && hv.t < ts && (!ha.a || hv.t < ha.t)) {
      puff(b.x + dx * hv.t, b.y + dy * hv.t, b.z + dz * hv.t, '#ffd166', 0.18, 0.25);
      vehHurt(hv.v, b.dmg, b.o); if (b.o === G.player) hudHit(false, false, 0);
      BUL.splice(i, 1); continue;
    }
    if (ha.a && ha.t < ts) {
      const hx = b.x + dx * ha.t, hy = b.y + dy * ha.t, hz = b.z + dz * ha.t;
      puff(hx, hy, hz, '#d61f1f', 0.25, 0.35);
      const dist = Math.hypot(hx - b.o.x, hz - b.o.z);
      hurt(ha.a, b.dmg * (ha.head ? b.head : 1) * (dist > 300 ? 0.9 : 1), b.o, ha.head, b.wn);
      BUL.splice(i, 1); continue;
    }
    if (ts < len) { puff(b.x + dx * ts, b.y + dy * ts, b.z + dz * ts, '#d8cfb8', 0.3, 0.5); BUL.splice(i, 1); continue; }
    b.x += sx; b.y += sy; b.z += sz;
    if (b.life > 2.6 || b.y < -20) { BUL.splice(i, 1); continue; }
    if (n < TRC_N && b.life > 0.02) { const j = n++ * 6; trcPos[j] = b.px; trcPos[j + 1] = b.py; trcPos[j + 2] = b.pz; trcPos[j + 3] = b.x; trcPos[j + 4] = b.y; trcPos[j + 5] = b.z; }
  }
  trcGeo.setDrawRange(0, n * 2); trcGeo.attributes.position.needsUpdate = true;
}

// ---------- dano, derrubado e abate ----------
const teamMates = a => G.actors.filter(m => m.team === a.team && m !== a);
const teamUp = team => G.actors.some(m => m.team === team && m.alive && !m.knocked);
function hurt(a, dmg, src, head, wn) {
  if (!a.alive || dmg <= 0 || a.mode === 'plane' || (G.god && a === G.player)) return;
  if (src && src !== a) { a.lastHitBy = src; a.lastHitT = G.matchT; if (a.bot) botAlert(a, src); }
  if (a.knocked) { a.khp -= dmg; if (src && src.alive) src.dmgDone += dmg; if (a.khp <= 0) kill(a, src || a.knockBy, wn); return; }
  const arm = head ? a.helm : a.vest;
  if (arm && src) { const red = ARMOR_RED[arm.lv]; arm.dur -= dmg * (1 - red * 0.5); dmg *= 1 - red; if (arm.dur <= 0) { if (head) a.helm = null; else a.vest = null; rebuildBody(a); } }
  dmg = Math.min(dmg, a.hp);
  a.hp -= dmg; if (src && src !== a) src.dmgDone += dmg;
  if (a.healT > 0 && src) { a.healT = 0; a.healK = null; }
  if (a === G.player) hudHurt(src, dmg);
  if (src === G.player && a !== G.player) hudHit(head, a.hp <= 0, dmg);
  if (a.hp <= 0.01) {
    if (G.size > 1 && teamMates(a).some(m => m.alive && !m.knocked)) knock(a, src, wn);
    else kill(a, src, wn);
  }
}
function knock(a, src, wn) {
  if (a.veh) leaveVeh(a, true);
  a.knocked = true; a.khp = 100; a.hp = 0; a.healT = 0; a.reloadT = 0; a.ads = false; a.stance = 'prone'; a.knockBy = src; a.lean = 0; a.leanT = 0;
  a.knockN = (a.knockN || 0) + 1;
  addFeed(src, a, wn, true);
  if (a === G.player) toast('Você foi derrubado! Aguarde um colega reviver.', 3, 'bad');
}
function revive(a) { a.knocked = false; a.hp = 15; a.stance = 'crouch'; a.khp = 0; if (a === G.player) toast('Você foi revivido!', 2, 'gold'); }
function kill(a, src, wn) {
  if (!a.alive) return;
  a.alive = false; a.knocked = false; a.hp = 0; a.deadT = G.matchT;
  (G.deathLog = G.deathLog || []).push([Math.round(G.matchT), wn || '?', src && src.bot ? (src.skill > 0.7 ? 'A' : 'M') : src ? 'P' : '-']);
  if (a.veh) leaveVeh(a, true);
  if (src && src !== a && src.team !== a.team) src.kills++;
  addFeed(src, a, wn, false);
  deathBox(a); removeModel(a);
  if (a === G.player) onPlayerDead(src);
  if (!teamUp(a.team)) { // equipe toda fora: quem está derrubado morre também
    for (const m of G.actors) if (m.team === a.team && m.alive) kill(m, m.knockBy || src, wn);
    teamOut(a.team);
  }
}
function deathBox(a) {
  const items = [];
  for (const w of a.wp) if (w) { if (w.mag) a.bag['a:' + wdef(w).ammo] = (a.bag['a:' + wdef(w).ammo] || 0) + w.mag; w.mag = 0; items.push({ k: 'w:' + w.k, n: 1, w }); }
  for (const k in a.bag) items.push({ k, n: a.bag[k] });
  if (a.helm) items.push({ k: 'H' + a.helm.lv, n: 1 }); if (a.vest) items.push({ k: 'V' + a.vest.lv, n: 1 }); if (a.bagLv) items.push({ k: 'B' + a.bagLv, n: 1 });
  a.wp = [null, null, null]; a.bag = {}; a.cur = -1;
  if (!items.length) return;
  addCrate(a.x, a.y, a.z, items, 'Caixa de ' + a.name, 'death');
}
function addCrate(x, y, z, items, name, kind) {
  const geo = kind === 'drop' ? mergeParts([bx(-0.7, 0, -0.7, 1.4, 1.1, 1.4, '#e63946'), bx(-0.72, 0.45, -0.72, 1.44, 0.2, 1.44, '#ffffff')])
    : mergeParts([bx(-0.45, 0, -0.3, 0.9, 0.5, 0.6, '#c58b4b'), bx(-0.47, 0.5, -0.32, 0.94, 0.06, 0.64, '#7a5230')]);
  const m = new T.Mesh(geo, MAT.item); m.position.set(x, y, z); scene.add(m);
  const c = { x, y, z, items, name, kind, mesh: m, vy: 0 }; G.crates.push(c); return c;
}

// soco (sem arma): curto alcance, na frente
function punch(a) {
  if (a.fireCd > 0 || a.knocked || a.healT > 0) return false;
  a.fireCd = 0.55; const fx = fwdX(a.yaw), fz = fwdZ(a.yaw);
  for (const t of G.actors) {
    if (!t.alive || t === a || t.team === a.team || t.mode !== 'ground') continue;
    const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz);
    if (d < 1.7 && (dx * fx + dz * fz) / (d || 1) > 0.5 && Math.abs(t.y - a.y) < 1.2) { hurt(t, 9, a, false, 'soco'); puff(t.x, t.y + 1.3, t.z, '#ffffff', 0.2, 0.2); return true; }
  }
  return true;
}
// ---------- recarga, cura e trocas ----------
function startReload(a) {
  const w = curW(a); if (!w || a.reloadT > 0 || a.knocked) return;
  if (w.mag >= magSize(w) || !ammoOf(a, w)) return;
  a.reloadT = wdef(w).rel; a.healT = 0; a.healK = null;
  if (a === G.player) sfx('reload');
}
function finishReload(a) { const w = curW(a); if (w) autoFill(a, w); }
function canHeal(a, k) {
  const h = HEAL[k]; if (!h || !(a.bag[k] > 0) || a.knocked) return false;
  if (h.hp) return a.hp < h.cap - 0.5;
  return a.boost < 100;
}
function startHeal(a, k) { if (!canHeal(a, k) || a.healT > 0) return false; a.healT = HEAL[k].t; a.healK = k; a.reloadT = 0; a.ads = false; return true; }
function finishHeal(a) {
  const k = a.healK, h = HEAL[k]; a.healK = null; if (!bagTake(a, k, 1)) return;
  if (h.hp) a.hp = Math.min(h.cap, k === 'BAND' ? a.hp + h.hp : Math.max(a.hp, h.hp));
  else a.boost = Math.min(100, a.boost + h.boost);
}
function switchWeapon(a, slot) {
  if (a.knocked) return;
  if (slot === a.cur || !a.wp[slot]) slot = -1;
  a.cur = slot; a.reloadT = 0; a.fireCd = 0.45; a.ads = false; refreshGun(a);
}
// a cada quadro, para todos os personagens vivos
function actorTimers(a, dt) {
  a.fireCd = Math.max(0, a.fireCd - dt);
  a.recoil = Math.max(0, a.recoil - dt * (a.trigger ? 0.6 : 3));
  if (a.reloadT > 0 && (a.reloadT -= dt) <= 0) { a.reloadT = 0; finishReload(a); }
  if (a.healT > 0 && (a.healT -= dt) <= 0) { a.healT = 0; finishHeal(a); }
  if (a.boost > 0) { a.boost = Math.max(0, a.boost - dt * 0.6); if (!a.knocked) a.hp = Math.min(100, a.hp + dt * (a.boost > 60 ? 1.1 : a.boost > 20 ? 0.7 : 0.35)); }
  if (a.knocked) { a.khp -= dt * 100 / (45 - Math.min(25, (a.knockN - 1) * 10)); if (a.khp <= 0) kill(a, a.knockBy, 'sangramento'); }
  if (a.reviving) {
    const t = a.reviving;
    if (!t.alive || !t.knocked || a.knocked || Math.hypot(t.x - a.x, t.z - a.z) > 2.2) { a.reviving = null; a.reviveT = 0; }
    else if ((a.reviveT += dt) >= 6) { revive(t); a.reviving = null; a.reviveT = 0; }
  }
}
