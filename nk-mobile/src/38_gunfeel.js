// ================= sensação das armas: padrão de recuo de cada arma, balanço da luneta, peso na mira e cápsulas que pulam no chão =================
// recuo: cada arma tem um desenho fixo (sobe e puxa para um lado e para o outro sempre do mesmo jeito, como no PUBG/CS) — dá para aprender a
// controlar puxando o dedo. Os primeiros tiros sobem menos; a rajada longa sobe mais. Empunhadura e compensador continuam reduzindo.
const GF = { n: 0, lastT: -9, k: '', sway: [0, 0], swT: 0, sprintT: 0 };
const GF_CLS = { ar: [0.36, 1.0], smg: [0.48, 0.9], pistol: [0.28, 1.0], dmr: [0.22, 1.05], sr: [0.05, 1], sg: [0.16, 1] }; // [lado, subida]
function gfSeed(k) { let h = 7; for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 9973; return h / 9973; }
function recoilPattern(k, n) {
  const d = WEAP[k], c = GF_CLS[d.cls] || GF_CLS.ar, s = gfSeed(k), lmg = d.lmg ? 0.75 : 1;
  const up = (n < 1 ? 0.7 : n < 6 ? 0.8 + n * 0.07 : 1.12 - Math.min(0.12, (n - 6) * 0.01)) * c[1] * lmg;
  const bias = (s - 0.5) * 0.5, wave = Math.sin(n * (0.42 + s * 0.3) + s * 6.28) * (n < 4 ? 0.4 : 1);
  return [up, (bias + wave) * c[0] * (n < 2 ? 0.4 : 1) + (Math.random() - 0.5) * c[0] * 0.25];
}
// velocidade de mirar (maior = mais rápido): pistola e SMG levantam rápido, sniper e metralhadora devagar
function adsSpeed(w) { if (!w) return 16; const d = WEAP[w.k]; return d.lmg ? 8 : { pistol: 20, smg: 18, ar: 15, sg: 14, dmr: 11, sr: 9 }[d.cls] || 15; }
// cápsulas: sai uma por tiro pela janela de ejeção, quica no chão e some
const CAS = { n: 32, i: 0, list: [] };
(function casInit() {
  const g = new T.CylinderGeometry(1, 1, 1, 6); g.rotateX(Math.PI / 2);
  CAS.mesh = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: 0xc89b3c, metalness: 0.9, roughness: 0.3, envMap: typeof ENV_TEX !== 'undefined' ? ENV_TEX : null }), CAS.n);
  CAS.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); CAS.mesh.frustumCulled = false; CAS.mesh.count = 0; scene.add(CAS.mesh);
  for (let i = 0; i < CAS.n; i++) CAS.list.push({ t: 0 });
})();
const _cm = new T.Matrix4(), _cq = new T.Quaternion(), _ce = new T.Euler(), _cs = new T.Vector3(), _csp = new T.Vector3(), _cr = new T.Vector3();
function casEject(a, d, delay) {
  const c = CAS.list[CAS.i = (CAS.i + 1) % CAS.n], sg = d.cls === 'sg', big = d.cls === 'sr' || d.cls === 'dmr';
  if (a === G.player && VM.visible) { vmGun.updateMatrixWorld(true); _csp.set(0.03, 0.03, -0.02); vmGun.localToWorld(_csp); }
  else if (a.model && a.model.gun) { a.model.gun.updateMatrixWorld(true); _csp.set(0.03, 0.03, -0.05); a.model.gun.localToWorld(_csp); }
  else return;
  const yaw = a === G.player ? G.view.yaw : a.yaw; _cr.set(Math.cos(yaw), 0, -Math.sin(yaw)); // direita
  const sp = 2.2 + Math.random() * 1.2;
  Object.assign(c, { x: _csp.x, y: _csp.y, z: _csp.z, vx: _cr.x * sp - Math.sin(yaw) * -0.6 + (Math.random() - 0.5) * 0.5, vy: 1.6 + Math.random() * 1.1, vz: _cr.z * sp - Math.cos(yaw) * -0.6 + (Math.random() - 0.5) * 0.5,
    rx: Math.random() * 6, ry: Math.random() * 6, wx: 15 + Math.random() * 20, wy: 8 + Math.random() * 10, t: 3.2, wait: delay || 0, floor: Math.max(groundH(_csp.x, _csp.z), a.y), bounce: 0,
    s: sg ? [0.011, 0.011, 0.034] : big ? [0.0062, 0.0062, 0.032] : d.cls === 'pistol' || d.cls === 'smg' ? [0.0048, 0.0048, 0.012] : [0.0052, 0.0052, 0.024], red: sg });
}
function casStep(dt) {
  let n = 0;
  for (const c of CAS.list) {
    if (c.t <= 0) continue;
    if (c.wait > 0) { c.wait -= dt; continue; }
    c.t -= dt; c.vy -= 9.8 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.rx += c.wx * dt; c.ry += c.wy * dt;
    if (c.y < c.floor + c.s[0]) { c.y = c.floor + c.s[0]; if (c.vy < -0.6 && c.bounce < 3) { c.vy *= -0.35; c.vx *= 0.5; c.vz *= 0.5; c.wx *= 0.5; c.bounce++; } else { c.vy = 0; c.vx *= 0.8; c.vz *= 0.8; c.wx *= 0.8; c.wy *= 0.8; c.rx = c.rx * 0.9; } }
    _ce.set(c.rx, c.ry, 0); _cq.setFromEuler(_ce); _cs.set(...c.s); _csp.set(c.x, c.y, c.z); _cm.compose(_csp, _cq, _cs); CAS.mesh.setMatrixAt(n, _cm);
    CAS.mesh.setColorAt(n, c.red ? _casRed : _casGold); n++;
  }
  CAS.mesh.count = n; CAS.mesh.instanceMatrix.needsUpdate = true; if (CAS.mesh.instanceColor) CAS.mesh.instanceColor.needsUpdate = true;
}
const _casRed = new T.Color(0xb02a20), _casGold = new T.Color(0xffffff);
// balanço da mira com luneta (respiração); agachado e deitado firmam, andando balança mais
function swayStep(dt) {
  const p = G.player, v = G.view; if (!p || !v || G.phase !== 'match') return;
  const w = curW(p), z = p.ads && w ? sightZoom(w) : 1;
  let amp = !p.ads ? 0 : z >= 3.5 ? 0.0017 : z >= 1.8 ? 0.0011 : 0.00045;
  amp *= p.stance === 'prone' ? 0.3 : p.stance === 'crouch' ? 0.6 : 1;
  amp *= 1 + Math.min(1.5, Math.hypot(p.vx || 0, p.vz || 0) / 2.5) + (GF.sprintT > 0 ? 1.5 : 0);
  if (w && WEAP[w.k].cls === 'sr') amp *= 1.15;
  GF.swT += dt; const t = GF.swT, nx = Math.sin(t * 1.3) * amp + Math.sin(t * 2.9) * amp * 0.3, ny = Math.sin(t * 2.6) * amp * 0.6 + Math.cos(t * 0.9) * amp * 0.25;
  v.yaw += nx - GF.sway[0]; v.pitch += ny - GF.sway[1]; GF.sway[0] = nx; GF.sway[1] = ny;
  // depois de correr a mira leva um instante para firmar
  if (Math.hypot(p.vx || 0, p.vz || 0) > 5.6) GF.sprintT = 0.5; else GF.sprintT = Math.max(0, GF.sprintT - dt);
}
(function hookGunfeel() {
  const fs = fireShot;
  fireShot = function (a, ...q) {
    const ok = fs.call(this, a, ...q);
    if (!ok && ok !== undefined) return ok;
    const w = curW(a); if (!w) return ok; const d = wdef(w);
    if (a === G.player) {
      const now = G.t; if (now - GF.lastT > 60 / d.rpm + 0.25 || GF.k !== w.k) GF.n = 0; GF.lastT = now; GF.k = w.k;
      const [up, yw] = recoilPattern(w.k, GF.n++); G.recUp = up; G.recYaw = yw;
    }
    if (a === G.player || Math.hypot(a.x - camera.position.x, a.z - camera.position.z) < 25) {
      if (w.k !== 'S686' && w.k !== 'M625') casEject(a, d, d.bolt ? 0.45 : w.k === 'S1897' ? 0.3 : 0);
    }
    return ok;
  };
  const ps = playerStep; playerStep = function (dt, ...q) { swayStep(dt); return ps.call(this, dt, ...q); };
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q); casStep(Math.min(dt, 0.05)); return o; };
})();
