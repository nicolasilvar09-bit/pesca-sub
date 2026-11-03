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
  if (ny <= sup) { ny = sup; if (!a.onGround && landV < -13 && a.mode === 'ground') hurt(a, (-landV - 13) * 7, null, false, 'queda'); a.vy = 0; a.onGround = true; }
  else if (a.onGround && ny - sup < 0.55 && a.vy <= 0) { ny = sup; a.vy = 0; }
  else a.onGround = false;
  // água funda: nada na superfície
  a.swim = false;
  if (sup === terr && terr < -1.3 && ny < -1.3) { ny = -1.3; a.vy = Math.max(0, a.vy); a.onGround = true; a.swim = true; }
  a.x = clamp(nx, -HALF + 4, HALF - 4); a.z = clamp(nz, -HALF + 4, HALF - 4); a.y = ny;
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
function applyMove(a, dt, wx, wz, speed) { // wx,wz = direção no mundo (comprimento 0..1)
  const k = Math.min(1, dt * (a.onGround ? 12 : 2));
  a.vx += (wx * speed - a.vx) * k; a.vz += (wz * speed - a.vz) * k;
}
function tryJump(a) {
  if (!a.onGround || a.knocked || a.swim) return;
  if (a.stance !== 'stand') { a.stance = a.stance === 'prone' ? 'crouch' : 'stand'; return; }
  a.vy = 5.6; a.onGround = false;
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
