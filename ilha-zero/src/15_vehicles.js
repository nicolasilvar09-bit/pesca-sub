// ================= veículos: jipe, sedã, buggy e moto — dirigir, passageiros, atropelar, dano e explosão =================
// hl/hw = meio comprimento/largura; seats = [direita, trás, altura do assento]; max em m/s
const VDEF = {
  jipe: { n: 'Jipe', hp: 1500, max: 25, acc: 8, turn: 1.15, hl: 2.2, hw: 1.0, h: 1.9, seats: [[-0.42, -0.15, 0.55], [0.42, -0.15, 0.55], [-0.42, 0.85, 0.6], [0.42, 0.85, 0.6]], cols: ['#4b5a3a', '#6b5d43', '#3d4a52', '#5a4a3a'] },
  seda: { n: 'Sedã', hp: 1100, max: 29, acc: 10, turn: 1.2, hl: 2.25, hw: 0.95, h: 1.5, seats: [[-0.4, -0.1, 0.45], [0.4, -0.1, 0.45], [-0.4, 0.8, 0.45], [0.4, 0.8, 0.45]], cols: ['#8c2f2a', '#d8d8d2', '#2f5a6a', '#3a3d42', '#9a8a5a'] },
  buggy: { n: 'Buggy', hp: 900, max: 28, acc: 11, turn: 1.45, hl: 1.6, hw: 0.95, h: 1.4, seats: [[-0.38, 0.1, 0.45], [0.38, 0.1, 0.45]], cols: ['#b0632a', '#5a6b3a', '#3a5a7a'] },
  moto: { n: 'Moto', hp: 550, max: 33, acc: 12, turn: 1.9, hl: 1.0, hw: 0.35, h: 1.2, seats: [[0, 0.0, 0.85], [0, 0.5, 0.95]], cols: ['#8a2a22', '#2a2c30', '#4a5a6a', '#6a5a3a'] },
};
const VEH = [];
function vehGeo(k, col) {
  const d = VDEF[k], L = d.hl, W = d.hw, wh = (x, z, r, w) => ({ g: GEO.cyl, x, y: r, z, rz: Math.PI / 2, sx: r * 2, sy: w, sz: r * 2, c: '#1b1b1b' });
  const glass = '#7fd3ff', p = [];
  if (k === 'moto') {
    p.push(bx(-0.12, 0.45, -0.75, 0.24, 0.35, 1.3, col), bx(-0.15, 0.78, -0.1, 0.3, 0.12, 0.75, '#222'), bx(-0.05, 0.6, -0.95, 0.1, 0.55, 0.1, '#9e9e9e'));
    p.push(bx(-0.35, 1.1, -0.95, 0.7, 0.05, 0.06, '#424242'), bx(-0.1, 0.6, -1.02, 0.2, 0.15, 0.05, '#fff59d'));
    p.push(wh(0, -0.78, 0.33, 0.16), wh(0, 0.72, 0.33, 0.2));
  } else if (k === 'buggy') {
    p.push(bx(-W, 0.35, -L, W * 2, 0.35, L * 2, col), bx(-W + 0.1, 0.7, -0.2, W * 2 - 0.2, 0.3, 0.9, '#333'));
    for (const sx of [-1, 1]) { p.push(bx(sx * (W - 0.08) - 0.04, 0.7, -0.5, 0.08, 0.9, 0.08, '#555'), bx(sx * (W - 0.08) - 0.04, 0.7, 0.8, 0.08, 0.9, 0.08, '#555')); }
    p.push(bx(-W, 1.6, -0.5, W * 2, 0.06, 1.38, '#555'));
    p.push(wh(-W - 0.1, -L + 0.45, 0.45, 0.35), wh(W + 0.1, -L + 0.45, 0.45, 0.35), wh(-W - 0.1, L - 0.4, 0.5, 0.4), wh(W + 0.1, L - 0.4, 0.5, 0.4));
  } else {
    const jeep = k === 'jipe', bh = jeep ? 0.75 : 0.6, b0 = jeep ? 0.45 : 0.32;
    p.push(bx(-W, b0, -L, W * 2, bh, L * 2, col));
    const c0 = jeep ? -0.7 : -0.6, c1 = jeep ? 1.6 : 1.1;
    p.push(bx(-W + 0.08, b0 + bh, c0, W * 2 - 0.16, jeep ? 0.7 : 0.55, c1 - c0, glass));
    p.push(bx(-W + 0.05, b0 + bh + (jeep ? 0.7 : 0.55), c0 + 0.05, W * 2 - 0.1, 0.08, c1 - c0 - 0.1, col));
    p.push(bx(-W + 0.15, b0 + 0.25, -L - 0.03, 0.3, 0.15, 0.05, '#fff59d'), bx(W - 0.45, b0 + 0.25, -L - 0.03, 0.3, 0.15, 0.05, '#fff59d'));
    p.push(bx(-W + 0.1, b0 + 0.3, L - 0.02, 0.25, 0.12, 0.05, '#ff1744'), bx(W - 0.35, b0 + 0.3, L - 0.02, 0.25, 0.12, 0.05, '#ff1744'));
    if (jeep) p.push({ g: GEO.cyl, y: b0 + 0.55, z: L + 0.15, rx: Math.PI / 2, sx: 0.7, sy: 0.25, sz: 0.7, c: '#212121' });
    const r = jeep ? 0.45 : 0.36;
    p.push(wh(-W, -L + 0.6, r, 0.3), wh(W, -L + 0.6, r, 0.3), wh(-W, L - 0.6, r, 0.3), wh(W, L - 0.6, r, 0.3));
  }
  return mergeParts(p);
}
const WRECK = new T.MeshLambertMaterial({ vertexColors: true, color: 0x333333 });
function spawnVehicles() {
  for (const v of VEH) scene.remove(v.mesh);
  VEH.length = 0;
  const kinds = ['jipe', 'jipe', 'seda', 'seda', 'seda', 'buggy', 'buggy', 'moto', 'moto', 'moto'];
  let tries = 0;
  while (VEH.length < 30 && tries++ < 600) {
    const r = pick(ROADS), t = rr(0.08, 0.92), dx = r[2] - r[0], dz = r[3] - r[1], L = Math.hypot(dx, dz), side = Math.random() < 0.5 ? -1 : 1;
    const x = r[0] + dx * t - dz / L * 6 * side, z = r[1] + dz * t + dx / L * 6 * side, h = groundH(x, z);
    if (h < 1.5 || bldAt(x, z, 3) || VEH.some(v => Math.hypot(v.x - x, v.z - z) < 30)) continue;
    boxesNear(x - 3, z - 3, x + 3, z + 3, _near); if (_near.some(b => b.y1 > h + 0.5 && b.y0 < h + 2)) continue;
    const k = pick(kinds);
    // nasce com a frente livre (nada de poste, árvore ou parede logo à frente)
    let yaw = Math.atan2(-dx, -dz) + (Math.random() < 0.5 ? 0 : Math.PI) + rr(-0.15, 0.15);
    const clear = yw => [3, 6, 9, 12].every(dd => !pointBlocked(x - Math.sin(yw) * dd, h + 0.2, z - Math.cos(yw) * dd));
    if (!clear(yaw)) { yaw += Math.PI; if (!clear(yaw)) continue; }
    addVehicle(k, x, z, yaw);
  }
}
function addVehicle(k, x, z, yaw) {
  const d = VDEF[k], col = pick(d.cols);
  const v = { k, d, x, z, y: groundH(x, z), yaw, sp: 0, vy: 0, pitch: 0, roll: 0, hp: d.hp, seats: d.seats.map(() => null), thr: 0, str: 0, dead: false, air: false, wait: 0, stuckT: 0, revT: 0, lastHit: null, water: false };
  v.mesh = new T.Mesh(vehGeo(k, col), MAT.world); v.mesh.rotation.order = 'YXZ'; v.mesh.castShadow = v.mesh.receiveShadow = true; scene.add(v.mesh);
  VEH.push(v); syncVehMesh(v); return v;
}
function syncVehMesh(v) { v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.set(v.pitch, v.yaw, v.roll); }
const vfx = v => -Math.sin(v.yaw), vfz = v => -Math.cos(v.yaw);
// altura de apoio (terreno ou plataforma baixa, como o píer)
function vSup(x, z, y) {
  let s = groundH(x, z);
  boxesNear(x - 0.3, z - 0.3, x + 0.3, z + 0.3, _air);
  for (const b of _air) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.y1 <= y + 0.7 && b.y1 > s) s = b.y1;
  return s;
}
// ---------- entrar, sair, trocar de assento ----------
function freeSeat(v, pref) {
  if (v.dead) return -1;
  if (pref >= 0 && !v.seats[pref]) return pref;
  for (let i = pref === 0 ? 0 : 1; i < v.seats.length; i++) if (!v.seats[i]) return i;
  return v.seats.findIndex(s => !s);
}
function passSeat(v) { if (v.dead) return -1; for (let i = 1; i < v.seats.length; i++) if (!v.seats[i]) return i; return -1; }
function enterVeh(a, v, pref) {
  const s = freeSeat(v, pref == null ? 0 : pref); if (s < 0) return false;
  a.veh = v; a.seat = s; v.seats[s] = a; a.vx = a.vz = 0; a.stance = 'crouch'; a.ads = false; a.leanT = a.lean = 0; a.healT = 0; a.reviving = null;
  if (s === 0 && a.bot) (G.vdrivers = G.vdrivers || []).push(a.id);
  if (s === 0) { v.revT = 0; if (a.bot) { a.ai.vstop = false; a.ai.vstuck = 0; } }
  if (a === G.player) { IN.adsOn = false; toast(s === 0 ? `${v.d.n}: joystick acelera e vira. Puxe para trás para frear.` : `Passageiro do ${v.d.n}: dá para atirar daqui.`, 3); sfx('door'); }
  return true;
}
function leaveVeh(a, forced) {
  const v = a.veh; if (!v) return;
  v.seats[a.seat] = null; const s = v.d.seats[a.seat], rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
  const side = s[0] < 0 ? -1 : s[0] > 0 ? 1 : -1, off = v.d.hw + 0.9;
  let x = v.x + rx * side * off, z = v.z + rz * side * off;
  if (pointBlocked(x, v.y, z)) { x = v.x - rx * side * off; z = v.z - rz * side * off; }
  if (pointBlocked(x, v.y, z)) { x = v.x - vfx(v) * (v.d.hl + 1); z = v.z - vfz(v) * (v.d.hl + 1); }
  a.x = x; a.z = z; a.y = Math.max(vSup(x, z, v.y + 0.5), a.y); a.vy = 0; a.vx = vfx(v) * v.sp * 0.4; a.vz = vfz(v) * v.sp * 0.4;
  a.veh = null; a.seat = -1; a.stance = 'stand'; a.onGround = false;
  if (a.ai) a.ai.vehCd = G.matchT + 20;
  if (!forced && Math.abs(v.sp) > 12) hurt(a, (Math.abs(v.sp) - 12) * 4, null, false, 'queda');
  if (a === G.player) sfx('door');
}
function switchSeat(a) {
  const v = a.veh; if (!v) return;
  for (let k = 1; k <= v.seats.length; k++) { const i = (a.seat + k) % v.seats.length; if (!v.seats[i]) { v.seats[a.seat] = null; v.seats[i] = a; a.seat = i; if (a === G.player) toast(i === 0 ? 'Motorista' : 'Passageiro ' + i, 1.2); return; } }
  if (a === G.player) toast('Sem assento livre.', 1.2);
}
// ---------- dano ----------
function vehHurt(v, dmg, src) {
  if (v.dead) return;
  v.hp -= dmg; if (src) v.lastHit = src;
  if (v.hp <= 0) explode(v);
}
function explode(v) {
  v.dead = true; v.hp = 0; v.sp = 0; v.mesh.material = WRECK;
  for (let i = 0; i < 10; i++) puff(v.x + rr(-1.5, 1.5), v.y + rr(0.5, 2.5), v.z + rr(-1.5, 1.5), i % 2 ? '#ff7b00' : '#3a3a3a', 1.6, 1.4);
  sfx('boom');
  for (const a of v.seats.slice()) if (a) { leaveVeh(a, true); hurt(a, 160, v.lastHit, false, 'explosão'); }
  for (const a of G.actors) if (a.alive && a.mode === 'ground' && Math.hypot(a.x - v.x, a.z - v.z) < 5) hurt(a, 55, v.lastHit, false, 'explosão');
}
// bala x veículo (caixa girada)
const _hv = {};
function rayVehicles(ox, oy, oz, dx, dy, dz, len, skip) {
  let best = Infinity, who = null;
  for (const v of VEH) {
    if (v === skip || Math.abs(v.x - ox) > len + 4 || Math.abs(v.z - oz) > len + 4) continue;
    const c = Math.cos(v.yaw), s = Math.sin(v.yaw), px = ox - v.x, pz = oz - v.z;
    // eixos locais: direita (c,-s), trás (s,c)
    const lx = px * c - pz * s, lz = px * s + pz * c, ly = oy - v.y, ddx = dx * c - dz * s, ddz = dx * s + dz * c;
    const H = v.k === 'moto' ? 1.0 : v.d.h * 0.78, ix = 1 / (ddx || 1e-9), iy = 1 / (dy || 1e-9), iz = 1 / (ddz || 1e-9);
    let t1 = (-v.d.hw - lx) * ix, t2 = (v.d.hw - lx) * ix, tn = Math.min(t1, t2), tf = Math.max(t1, t2);
    t1 = (0.25 - ly) * iy; t2 = (H - ly) * iy; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
    t1 = (-v.d.hl - lz) * iz; t2 = (v.d.hl - lz) * iz; tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
    if (tf >= Math.max(tn, 0) && tn < len && tn < best) { best = Math.max(tn, 0); who = v; }
  }
  _hv.t = best; _hv.v = who; return _hv;
}
// ---------- física ----------
function stepVehicles(dt) {
  for (const v of VEH) {
    const d = v.d, drv = v.seats[0];
    if (!drv || v.dead) { v.thr = 0; v.str = 0; }
    const fx = vfx(v), fz = vfz(v), rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw);
    // apoio nas 4 rodas
    const a0 = d.hl * 0.8, hF = vSup(v.x + fx * a0, v.z + fz * a0, v.y), hB = vSup(v.x - fx * a0, v.z - fz * a0, v.y);
    const hL = vSup(v.x - rx * d.hw, v.z - rz * d.hw, v.y), hR = vSup(v.x + rx * d.hw, v.z + rz * d.hw, v.y);
    let gy = (hF + hB + hL + hR) / 4;
    v.water = gy < -1.3; if (v.water) gy = Math.max(gy, -1.25);
    if (v.y > gy + 0.3) { v.air = true; v.vy -= 20 * dt; v.y += v.vy * dt; }
    if (v.y <= gy + 0.3) {
      if (v.air && v.vy < -9) { vehHurt(v, (-v.vy - 9) * 30, null); for (const a of v.seats) if (a) hurt(a, (-v.vy - 9) * 2, null, false, 'queda'); }
      const ny = gy; v.vy = v.air ? 0 : clamp((ny - v.y) / Math.max(dt, 1e-3), -30, 30); v.y = ny; v.air = false;
      v.pitch += (Math.atan2(hF - hB, a0 * 2) - v.pitch) * Math.min(1, dt * 10);
      v.roll += (Math.atan2(hR - hL, d.hw * 2) - v.roll) * Math.min(1, dt * 10);
    }
    if (v.dead) { syncVehMesh(v); continue; }
    // motor
    if (!v.air) {
      const road = roadDist(v.x, v.z) < 5, max = d.max * (road ? 1 : 0.8) * (v.water ? 0.08 : 1);
      if (v.thr > 0.05) v.sp += (v.sp < -0.5 ? 16 : d.acc * (1 - clamp(v.sp / max, 0, 1) * 0.85)) * v.thr * dt;
      else if (v.thr < -0.05) v.sp += (v.sp > 0.5 ? -18 : v.sp > -7 ? -5 : 0) * -v.thr * dt;
      else v.sp -= Math.sign(v.sp) * Math.min(Math.abs(v.sp), (drv ? 2.5 : 6) * dt);
      if (v.sp > max) v.sp += (max - v.sp) * Math.min(1, dt * 2);
      v.sp -= Math.sin(v.pitch) * 7 * dt;
      v.yaw -= v.str * d.turn * clamp(v.sp / 5, -1, 1) * (1 - clamp(Math.abs(v.sp) / 55, 0, 0.45)) * dt;
      if (v.water && drv) v.revT += dt;
    }
    v.x = clamp(v.x + vfx(v) * v.sp * dt, -HALF + 6, HALF - 6); v.z = clamp(v.z + vfz(v) * v.sp * dt, -HALF + 6, HALF - 6);
    // batidas em paredes, árvores e pedras (2 círculos ao longo do veículo)
    const ccs = v.k === 'moto' ? [0.5] : [d.hl - d.hw, -(d.hl - d.hw)], R = v.k === 'moto' ? 0.5 : d.hw + 0.1;
    for (const off of v.k === 'moto' ? [0.45, -0.45] : ccs) {
      const cx = v.x + vfx(v) * off, cz = v.z + vfz(v) * off;
      boxesNear(cx - R - 0.5, cz - R - 0.5, cx + R + 0.5, cz + R + 0.5, _near);
      for (const b of _near) {
        if (b.y1 <= v.y + 0.6 || b.y0 >= v.y + d.h) continue;
        const qx = clamp(cx, b.x0, b.x1), qz = clamp(cz, b.z0, b.z1), ex = cx - qx, ez = cz - qz, dd = Math.hypot(ex, ez);
        if (dd >= R) continue;
        const nx = dd > 1e-6 ? ex / dd : -vfx(v), nz = dd > 1e-6 ? ez / dd : -vfz(v), pen = R - dd;
        v.x += nx * pen; v.z += nz * pen;
        const into = -(vfx(v) * nx + vfz(v) * nz) * v.sp; // velocidade contra a parede
        if (into > 0) { const sp = Math.abs(v.sp); if (sp > 6) { vehHurt(v, (sp - 6) * 22, null); for (const a of v.seats) if (a && sp > 13) hurt(a, (sp - 13) * 2.5, null, false, 'batida'); sfx('crash'); } v.sp *= into > 4 ? -0.15 : 0.5; }
      }
    }
    // veículo x veículo
    for (const o of VEH) {
      if (o === v) continue; const dx = v.x - o.x, dz = v.z - o.z, dd = Math.hypot(dx, dz), m = (d.hl + o.d.hl) * 0.6;
      if (dd < m && dd > 1e-3) { const p = (m - dd) / 2; v.x += dx / dd * p; v.z += dz / dd * p; o.x -= dx / dd * p; o.z -= dz / dd * p; if (Math.abs(v.sp) > 6) { vehHurt(o, Math.abs(v.sp) * 8, drv); vehHurt(v, Math.abs(v.sp) * 6, null); } v.sp *= 0.5; }
    }
    // pedestres: empurra e atropela
    const ax0 = v.x + vfx(v) * (d.hl - 0.2), az0 = v.z + vfz(v) * (d.hl - 0.2), ax1 = v.x - vfx(v) * (d.hl - 0.2), az1 = v.z - vfz(v) * (d.hl - 0.2);
    for (const a of G.actors) {
      if (!a.alive || a.veh || a.mode !== 'ground' || Math.abs(a.x - v.x) > 5 || Math.abs(a.z - v.z) > 5 || a.y > v.y + d.h || a.y < v.y - 1.5) continue;
      const ux = ax1 - ax0, uz = az1 - az0, t = clamp(((a.x - ax0) * ux + (a.z - az0) * uz) / (ux * ux + uz * uz), 0, 1);
      const qx = ax0 + ux * t, qz = az0 + uz * t, ex = a.x - qx, ez = a.z - qz, dd = Math.hypot(ex, ez), lim = d.hw + RAD;
      if (dd >= lim) continue;
      const nx = dd > 1e-6 ? ex / dd : rx, nz = dd > 1e-6 ? ez / dd : rz;
      a.x = qx + nx * lim; a.z = qz + nz * lim;
      const sp = Math.abs(v.sp);
      if (sp > 4 && (!a.runT || G.matchT - a.runT > 0.6)) { a.runT = G.matchT; hurt(a, sp * 6, drv && drv.team !== a.team ? drv : null, false, 'atropelado'); a.vx += nx * sp * 0.5; a.vz += nz * sp * 0.5; v.sp *= 0.85; }
    }
    // afundou na água: motor morre aos poucos
    if (v.water && v.revT > 6) { v.sp *= 0.9; }
    syncVehMesh(v);
    // ocupantes acompanham o assento
    for (let i = 0; i < v.seats.length; i++) {
      const a = v.seats[i]; if (!a) continue;
      if (!a.alive) { v.seats[i] = null; continue; }
      const s = d.seats[i]; a.x = v.x + rx * s[0] - fx * s[1]; a.z = v.z + rz * s[0] - fz * s[1]; a.y = v.y + s[2] - 0.6;
      a.vx = fx * v.sp; a.vz = fz * v.sp; a.vy = 0; a.onGround = true; a.stance = 'crouch';
      if (i === 0 || (!a.trigger && a.bot && !(a.ai && a.ai.vis))) a.yaw = v.yaw;
    }
  }
  engineSound();
}
function engineSound() {
  const p = G.player; let best = null, bd = 90;
  for (const v of VEH) { if (v.dead || !v.seats[0]) continue; const d = Math.hypot(v.x - camera.position.x, v.z - camera.position.z); if (d < bd) { bd = d; best = v; } }
  sfxEngine(best ? Math.abs(best.sp) : 0, best ? (best === p.veh ? 1 : 1 / (1 + bd / 15)) : 0, best && best.k === 'moto');
}
const nearVeh = (a, r) => { let b = null, bd = r; for (const v of VEH) { if (v.dead) continue; const d = Math.hypot(v.x - a.x, v.z - a.z); if (d < bd && Math.abs(v.y - a.y) < 2.5 && freeSeat(v, 0) >= 0) { bd = d; b = v; } } return b; };

// ---------- bots dirigindo ----------
function botDrive(a, v, dt) {
  const ai = a.ai;
  if (v.wait > 0) { v.wait -= dt; v.thr = v.sp > 0.5 ? -1 : 0; v.str = 0; if (!G.actors.some(m => m.team === a.team && m !== a && m.alive && !m.veh && m.ai && m.ai.vehT === v)) v.wait = 0; return; }
  const tx = ai.vtx, tz = ai.vtz, dx = tx - v.x, dz = tz - v.z, dist = Math.hypot(dx, dz);
  if (dist < 22 || v.water || v.hp < 260) ai.vstop = true;
  if (ai.vstop) { v.thr = v.sp > 0.6 ? -1 : 0; v.str = 0; if (Math.abs(v.sp) < 1) leaveVeh(a); return; }
  let diff = wrapA(Math.atan2(-dx, -dz) - v.yaw);
  // antenas na frente (paredes, árvores, mar)
  const look = 4 + Math.abs(v.sp) * 0.55, fwdBlocked = o => pointBlocked(v.x + Math.sin(-(v.yaw + o)) * look, v.y + 0.3, v.z - Math.cos(v.yaw + o) * look);
  if ((ai.vfeel = (ai.vfeel || 0) - dt) <= 0) {
    ai.vfeel = 0.2; ai.vbias = 0;
    if (fwdBlocked(0)) ai.vbias = !fwdBlocked(0.5) ? 0.8 : !fwdBlocked(-0.5) ? -0.8 : !fwdBlocked(1.1) ? 1.4 : -1.4;
  }
  diff += ai.vbias || 0;
  if (ai.vrev > 0) { ai.vrev -= dt; v.thr = -1; v.str = clamp(diff * 2, -1, 1); return; }
  v.str = clamp(-diff * 2.2, -1, 1);
  v.thr = dist < 60 ? 0.5 : Math.abs(diff) > 1 && v.sp > 9 ? 0.15 : 1;
  ai.vstuck = Math.abs(v.sp) < 1.5 ? (ai.vstuck || 0) + dt : 0;
  if (ai.vstuck > 1.6) { ai.vstuck = 0; ai.vrev = rr(1, 1.8); }
}
// bot dentro de veículo
function botInVeh(a, dt) {
  const ai = a.ai, v = a.veh;
  if ((ai.think -= dt) <= 0) {
    ai.think = rr(0.25, 0.35);
    const s = botScan(a);
    if (s) { if (ai.enemy !== s) { ai.enemy = s; ai.react = botP(a).react * rr(0.8, 1.4); ai.engT = 0; } ai.vis = true; ai.seenX = s.x; ai.seenZ = s.z; ai.lostT = 0; } else ai.vis = false;
    if (a.seat === 0 && ai.vis && Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z) < 50 && v.k !== 'moto') ai.vstop = true;
    if (a.seat === 0 && ai.vis && v.k === 'moto' && Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z) < 35) ai.vstop = true;
    if (a.seat !== 0) { const drv = v.seats[0]; if (!drv && Math.abs(v.sp) < 1.5) { leaveVeh(a); return; } if (drv && drv.ai && drv.ai.vstop && Math.abs(v.sp) < 1.5) { leaveVeh(a); return; } }
  }
  if (!a.veh) return;
  if (a.seat === 0) { a.trigger = false; botDrive(a, v, dt); return; }
  if (ai.vis && ai.enemy && hasGun(a)) { botPickWeapon(a, Math.hypot(ai.enemy.x - a.x, ai.enemy.z - a.z)); botFight(a, dt); a.stance = 'crouch'; }
  else { a.trigger = false; a.yaw = v.yaw; }
}
