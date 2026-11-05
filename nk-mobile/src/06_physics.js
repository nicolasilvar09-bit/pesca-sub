// ================= física: andar, pular, escadas, colisão com paredes, nadar, queda =================
const STEP_H = 0.45, RAD = 0.32;
const _near = [];
function stepPhys(a, dt) {
  const h = actorH(a);
  a.vy -= 20 * dt;
  let nx = a.x + a.vx * dt, nz = a.z + a.vz * dt, ny = a.y + a.vy * dt;
  boxesNear(nx - 1.2, nz - 1.2, nx + 1.2, nz + 1.2, _near);
  const base = a.y;
  for (let it = 0; it < 2; it++) for (const b of _near) {
    if (b.y1 <= base + STEP_H || b.y0 >= Math.max(base, ny) + h) continue;
    const cx = clamp(nx, b.x0, b.x1), cz = clamp(nz, b.z0, b.z1);
    const dx = nx - cx, dz = nz - cz, d2 = dx * dx + dz * dz;
    if (d2 >= RAD * RAD) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), push = (RAD - d) / d; nx += dx * push; nz += dz * push; }
    else {
      const l = nx - b.x0, r = b.x1 - nx, f = nz - b.z0, k = b.z1 - nz, m = Math.min(l, r, f, k);
      if (m === l) nx = b.x0 - RAD; else if (m === r) nx = b.x1 + RAD; else if (m === f) nz = b.z0 - RAD; else nz = b.z1 + RAD;
    }
  }
  // veículos parados ou andando devagar: não dá para atravessar (caixa girada do veículo)
  if (typeof VEH !== 'undefined' && !a.veh) for (const v of VEH) {
    const dx = nx - v.x, dz = nz - v.z; if (dx * dx + dz * dz > 30 || ny > v.y + v.d.h + 0.3 || ny + h < v.y) continue;
    const c = Math.cos(v.yaw), s = Math.sin(v.yaw), lx = dx * c - dz * s, lz = dx * s + dz * c; // no referencial do veículo
    const hx = v.d.hw + RAD, hz = v.d.hl + RAD; if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) continue;
    let px = lx, pz = lz; if (hx - Math.abs(lx) < hz - Math.abs(lz)) px = Math.sign(lx || 1) * hx; else pz = Math.sign(lz || 1) * hz;
    if (ny >= v.y + v.d.h * 0.75 && a.vy <= 0) continue; // em cima do capô/teto: deixa (pode subir)
    nx = v.x + px * c + pz * s; nz = v.z - px * s + pz * c;
  }
  // chão: terreno ou topo de caixa (piso, degrau, telhado)
  let sup = groundH(nx, nz);
  const terr = sup;
  for (const b of _near) {
    if (nx > b.x0 - 0.12 && nx < b.x1 + 0.12 && nz > b.z0 - 0.12 && nz < b.z1 + 0.12 && b.y1 <= base + STEP_H && b.y1 > sup) sup = b.y1;
  }
  // teto
  if (a.vy > 0) for (const b of _near) {
    if (nx > b.x0 - 0.2 && nx < b.x1 + 0.2 && nz > b.z0 - 0.2 && nz < b.z1 + 0.2 && b.y0 > base + 0.2 && b.y0 < ny + h) { ny = b.y0 - h; a.vy = 0; }
  }
  const landV = a.vy;
  if (!a.onGround) a.fallTop = Math.max(a.fallTop == null ? a.y : a.fallTop, a.y); // ponto mais alto desde que saiu do chão
  if (ny <= sup) { ny = sup;
    if (!a.onGround && a.mode === 'ground') {
      fallDamage(a, (a.fallTop == null ? a.y : a.fallTop) - ny);
      if (landV < -4.5) { a.landK = clamp((-landV - 3) / 10, 0.15, 1); a.landAt = G.t; } // amortece a queda: joelho dobra, câmera desce, anda mais devagar
    }
    a.vy = 0; a.onGround = true; a.fallTop = null; }
  else if (a.onGround && ny - sup < 0.55 && a.vy <= 0) { ny = sup; a.vy = 0; }
  else { if (a.onGround) a.fallTop = a.y; a.onGround = false; }
  // água funda: nada na superfície
  a.swim = false;
  if (sup === terr && terr < -1.3 && ny < -1.3) { ny = -1.3; a.vy = Math.max(0, a.vy); a.onGround = true; a.swim = true; }
  a.x = clamp(nx, -HALF + 4, HALF - 4); a.z = clamp(nz, -HALF + 4, HALF - 4); a.y = ny;
}
// dano de queda pela altura (igual sempre, venha de pulo, beirada ou salto de janela): até 4,5 m nada; 10 m ≈ 50; ~17 m mata sem colete
function fallDamage(a, drop) {
  if (!(drop > 4.5) || a.swim) return;
  hurt(a, (drop - 4.5) * 6 + (drop - 4.5) ** 2 * 0.15, null, false, 'queda');
}
// velocidade desejada (m/s) conforme postura e situação
function moveSpeed(a, sprint) {
  if (a.knocked) return 0.9;
  if (a.swim) return 2.6;
  let s = a.stance === 'prone' ? 1.1 : a.stance === 'crouch' ? 2.7 : sprint ? 6.4 : 5.0;
  if (a.ads && a.stance !== 'prone') s = Math.min(s, 2.9);
  if (a.healT > 0) s = Math.min(s, 1.8);
  if (a.boost > 60) s *= 1.05;
  return s;
}
// movimento com peso (estilo PUBG): acelera em ~0,3 s, freia um pouco mais rápido, sobe ladeira mais devagar
function applyMove(a, dt, wx, wz, speed) { // wx,wz = direção no mundo (comprimento 0..1)
  const wl = Math.hypot(wx, wz);
  if (a.onGround && !a.swim && wl > 0.05 && speed > 0 && a.y - groundH(a.x, a.z) < 0.15) {
    const ux = wx / wl, uz = wz / wl, g = (groundH(a.x + ux * 0.6, a.z + uz * 0.6) - groundH(a.x, a.z)) / 0.6;
    if (g > 0.22) speed *= clamp(1 - (g - 0.22) * 0.85, 0.45, 1); // ladeira acima
    else if (g < -0.5) speed *= 1.06; // ladeira abaixo, embala um pouco
  }
  if (a.landAt != null) { const lt = G.t - a.landAt; if (lt < 0.45) speed *= 1 - (a.landK || 0) * 0.55 * (1 - lt / 0.45); }
  const tx = wx * speed, tz = wz * speed, cur2 = a.vx * a.vx + a.vz * a.vz;
  const rate = !a.onGround ? 1.6 : a.swim ? 3 : tx * tx + tz * tz > cur2 + 0.01 ? 8.5 : 11;
  const k = 1 - Math.exp(-dt * rate);
  a.vx += (tx - a.vx) * k; a.vz += (tz - a.vz) * k;
}
function tryJump(a) {
  if (!a.onGround || a.knocked || a.swim) return;
  if (a.stance !== 'stand') { a.stance = a.stance === 'prone' ? 'crouch' : 'stand'; return; }
  a.vy = 5.3; a.onGround = false; a.jumpAt = G.t;
}
function setStance(a, s) {
  if (a.knocked || a.swim) return;
  if (a.stance === s) s = 'stand';
  // não levanta embaixo de algo baixo
  if (s !== 'prone' && a.stance !== 'stand') {
    const need = s === 'stand' ? 1.8 : 1.25;
    boxesNear(a.x - 0.4, a.z - 0.4, a.x + 0.4, a.z + 0.4, _near);
    if (_near.some(b => b.y0 > a.y + 0.3 && b.y0 < a.y + need && a.x > b.x0 - 0.3 && a.x < b.x1 + 0.3 && a.z > b.z0 - 0.3 && a.z < b.z1 + 0.3)) return;
  }
  a.stance = s;
}

// ---------- pular janela / saltar obstáculo / escalar (estilo PUBG) ----------
const _vb = [];
// coluna livre entre y0 e y1 no ponto (x,z)
function columnFree(x, z, y0, y1, r) {
  r = r || 0.26; boxesNear(x - r - 0.3, z - r - 0.3, x + r + 0.3, z + r + 0.3, _vb);
  for (const b of _vb) if (b.y1 > y0 && b.y0 < y1 && x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false;
  return true;
}
// maior altura de obstáculo (caixa) na coluna, abaixo de "teto"
function obstTop(x, z, base, ceil) {
  boxesNear(x - 0.3, z - 0.3, x + 0.3, z + 0.3, _vb); let top = -1e9;
  for (const b of _vb) if (x > b.x0 - 0.1 && x < b.x1 + 0.1 && z > b.z0 - 0.1 && z < b.z1 + 0.1 && b.y1 > base + STEP_H && b.y0 < base + 1.2 && b.y1 <= ceil && b.y1 > top) top = b.y1;
  return top;
}
function supportAt(x, z, maxY) {
  let s = groundH(x, z); boxesNear(x - 0.2, z - 0.2, x + 0.2, z + 0.2, _vb);
  for (const b of _vb) if (x > b.x0 - 0.05 && x < b.x1 + 0.05 && z > b.z0 - 0.05 && z < b.z1 + 0.05 && b.y1 <= maxY + 0.01 && b.y1 > s) s = b.y1;
  return s;
}
// devolve o plano do movimento ou null
function vaultPlan(a) {
  if (a.mode !== 'ground' || !a.onGround || a.knocked || a.veh || a.swim || a.vault) return null;
  const fx = fwdX(a.yaw), fz = fwdZ(a.yaw), y = a.y;
  for (let d = 0.4; d <= 1.0; d += 0.15) {
    const px = a.x + fx * d, pz = a.z + fz * d, top = obstTop(px, pz, y, y + 2.7);
    if (top < -1e8) continue;
    const h = top - y;
    if (h <= STEP_H || h > 2.65) return null;
    // o caminho por cima do obstáculo precisa estar livre (janela: do peitoril para cima)
    const clear = h <= 1.35 ? 0.85 : 1.7;
    if (!columnFree(px, pz, top + 0.02, top + clear, 0.18)) return null;
    // procura onde aterrissar do outro lado
    for (let e = d + 0.35; e <= d + 1.9; e += 0.15) {
      const lx = a.x + fx * e, lz = a.z + fz * e;
      if (!columnFree(lx, lz, top + 0.02, top + clear, 0.22)) break;
      const s = supportAt(lx, lz, top);
      if (h <= 1.35 && s < top - 0.3 && columnFree(lx, lz, s + 0.05, s + 1.7, 0.25)) return { x: lx, z: lz, y: s, peak: top + 0.15, T: 0.6, kind: 'saltar' };
      if (s >= top - 0.05 && columnFree(lx, lz, top + 0.05, top + 1.75, 0.25)) return { x: lx, z: lz, y: top, peak: top + 0.2, T: h > 1.35 ? 0.95 : 0.55, kind: h > 1.35 ? 'escalar' : 'subir' };
    }
    return null;
  }
  return null;
}
function tryVault(a) {
  const p = vaultPlan(a); if (!p) return false;
  a.vault = Object.assign(p, { t: 0, x0: a.x, y0: a.y, z0: a.z, st: a.stance });
  a.stance = 'crouch'; a.vx = a.vz = a.vy = 0; a.ads = false; a.reloadT = 0; a.healT = 0;
  if (a === G.player) { IN.adsOn = false; sfx('door'); }
  return true;
}
function stepVault(a, dt) {
  const v = a.vault; v.t += dt; const k = Math.min(1, v.t / v.T), e = smooth(k);
  a.x = lerp(v.x0, v.x, e); a.z = lerp(v.z0, v.z, e);
  // sobe rápido até o topo, passa por cima e desce
  const up = Math.min(1, k / 0.45);
  a.y = k < 0.6 ? lerp(v.y0, v.peak, smooth(up)) : lerp(v.peak, v.y, smooth((k - 0.6) / 0.4));
  a.vx = (v.x - v.x0) / v.T; a.vz = (v.z - v.z0) / v.T;
  if (k >= 1) { a.vault = null; a.y = v.y; a.vy = 0; a.onGround = true; a.fallTop = null; if (a.mode === 'ground') fallDamage(a, v.peak - v.y); /* saltar a beirada do prédio também machuca */ a.vx *= 0.4; a.vz *= 0.4; a.stance = v.st === 'prone' ? 'stand' : v.st; }
}
