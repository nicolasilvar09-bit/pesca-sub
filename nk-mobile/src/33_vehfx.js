// ================= efeitos dos veículos: rodas que giram e viram, poeira na terra, fumaça e fogo quando danificado, faróis à noite =================
// rodas: todas as rodas de todos os veículos numa peça só (uma chamada de desenho), atualizadas a cada quadro
const VFX = { wheels: null, cap: 0, parts: [], pi: 0, tex: null, spot: null, acc: new Map() };
(function wheelMesh() {
  VW_COLLECT = null; const p = []; vwheel(p, 0, 0, 1, 1, 1, '#9a9ea3', 6);
  const g = vehMerge(p); g.translate(0, -1, 0); /* centro da roda na origem */
  VFX.geo = g;
})();
function vfxEnsure(n) {
  if (VFX.wheels && VFX.cap >= n) return;
  if (VFX.wheels) { scene.remove(VFX.wheels); VFX.wheels.dispose(); }
  VFX.cap = Math.max(64, n + 32); VFX.wheels = new T.InstancedMesh(VFX.geo, vehMat(), VFX.cap); VFX.wheels.castShadow = VFX.wheels.receiveShadow = true; VFX.wheels.frustumCulled = false;
  VFX.wheels.instanceColor = new T.InstancedBufferAttribute(new Float32Array(VFX.cap * 3).fill(1), 3); scene.add(VFX.wheels);
}
// fumaça e poeira: bolinhas suaves que sobem/espalham e somem
(function partPool() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  VFX.tex = new T.CanvasTexture(c);
  for (let i = 0; i < 140; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: VFX.tex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); VFX.parts.push({ s, t: 0, life: 1, vx: 0, vy: 0, vz: 0, s0: 1, s1: 2, op: 0.5 }); }
})();
function vfxPart(x, y, z, col, o) {
  const q = VFX.parts[VFX.pi = (VFX.pi + 1) % VFX.parts.length];
  q.s.position.set(x, y, z); q.s.material.color.set(col); q.s.visible = true; q.t = 0; q.life = o.life || 1.2;
  q.vx = o.vx || 0; q.vy = o.vy || 0; q.vz = o.vz || 0; q.s0 = o.s0 || 0.6; q.s1 = o.s1 || 2.2; q.op = o.op || 0.45; q.add = !!o.add;
  q.s.material.blending = o.add ? T.AdditiveBlending : T.NormalBlending;
}
const _vfm = new T.Matrix4(), _vfq = new T.Quaternion(), _vfe = new T.Euler(0, 0, 0, 'YXZ'), _vfp = new T.Vector3(), _vfs = new T.Vector3(), _vfc = new T.Color();
function vehFxStep(dt) {
  const night = typeof WX !== 'undefined' && WX.k === 'noite'; VEH_NIGHT.value = night ? 1 : 0;
  let n = 0; const cx = camera.position.x, cz = camera.position.z;
  const total = VEH.reduce((s, v) => s + (v.wheels ? v.wheels.length : 0), 0); vfxEnsure(total);
  for (const v of VEH) {
    if (!v.wheels || !v.wheels.length) continue;
    const d = Math.hypot(v.x - cx, v.z - cz);
    v.wrot = (v.wrot || 0) + v.sp * dt / 0.4;
    v.mesh.updateMatrix(); v.mesh.updateMatrixWorld();
    const tint = v.dead ? 0.12 : v.k === 'jipe' || v.k === 'buggy' || v.k === 'pickup' ? 0.5 : 1;
    for (const w of v.wheels) {
      const front = w.z < 0, left = w.s < 0;
      _vfe.set(left ? v.wrot : -v.wrot, (front ? -(v.str || 0) * 0.45 : 0) + (left ? Math.PI : 0), 0, 'YXZ');
      _vfq.setFromEuler(_vfe); _vfp.set(w.x, w.r, w.z); _vfs.set(w.w, w.r, w.r);
      _vfm.compose(_vfp, _vfq, _vfs).premultiply(v.mesh.matrixWorld);
      VFX.wheels.setMatrixAt(n, _vfm); _vfc.setScalar(tint); VFX.wheels.setColorAt(n, _vfc); n++;
    }
    if (d > 140 || v.d.boat) continue;
    const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw), spd = Math.abs(v.sp);
    // poeira na terra/grama (na estrada quase nada)
    if (spd > 5 && !v.air && !v.dead && !v.water) {
      const road = roadDist(v.x, v.z) < 4.6, rate = (road ? 0.15 : 1) * Math.min(1, spd / 16) * 34 * dt;
      let acc = (VFX.acc.get(v) || 0) + rate;
      while (acc >= 1) { acc--; const w = v.wheels[2 + Math.floor(Math.random() * Math.max(1, v.wheels.length - 2))] || v.wheels[0], side = w.x;
        const x = v.x - fx * (v.d.hl * 0.8) + -fz * side * 0.9 + (Math.random() - 0.5) * 0.4, z = v.z - fz * (v.d.hl * 0.8) + fx * side * 0.9 + (Math.random() - 0.5) * 0.4;
        vfxPart(x, groundH(x, z) + 0.25, z, road ? '#8f8a80' : groundH(v.x, v.z) < 3.5 ? '#d8c8a0' : '#a08a66', { life: 1.4 + Math.random() * 0.6, vx: -fx * spd * 0.12 + (Math.random() - 0.5), vy: 0.6 + Math.random() * 0.5, vz: -fz * spd * 0.12 + (Math.random() - 0.5), s0: 0.9, s1: 4.2, op: 0.62 }); }
      VFX.acc.set(v, acc);
    }
    // danificado: fumaça cinza; quase explodindo: fumaça preta e fogo
    const hpk = v.hp / v.d.hp;
    if (!v.dead && hpk < 0.45 && Math.random() < dt * (hpk < 0.2 ? 16 : 7)) {
      const x = v.x + fx * v.d.hl * 0.6, z = v.z + fz * v.d.hl * 0.6, y = v.y + v.d.h * 0.75;
      vfxPart(x, y, z, hpk < 0.2 ? '#2a2a2a' : '#8a8a8a', { life: 2.2, vx: (Math.random() - 0.5) * 0.4, vy: 1.6, vz: (Math.random() - 0.5) * 0.4, s0: 0.6, s1: 3.4, op: 0.5 });
      if (hpk < 0.2 && Math.random() < 0.5) vfxPart(x, y - 0.1, z, '#ff7a1a', { life: 0.35, vy: 1.2, s0: 0.5, s1: 0.9, op: 0.9, add: true });
    }
    if (v.dead && Math.random() < dt * 4) vfxPart(v.x, v.y + 1.2, v.z, '#1e1e1e', { life: 3, vy: 1.8, s0: 1, s1: 5, op: 0.5 });
  }
  if (VFX.wheels) { VFX.wheels.count = n; VFX.wheels.instanceMatrix.needsUpdate = true; if (VFX.wheels.instanceColor) VFX.wheels.instanceColor.needsUpdate = true; }
  for (const q of VFX.parts) {
    if (!q.s.visible) continue; q.t += dt; const k = q.t / q.life; if (k >= 1) { q.s.visible = false; continue; }
    q.s.position.x += q.vx * dt; q.s.position.y += q.vy * dt; q.s.position.z += q.vz * dt; q.vx *= 0.97; q.vz *= 0.97;
    q.s.scale.setScalar(q.s0 + (q.s1 - q.s0) * k); q.s.material.opacity = q.op * (1 - k) * Math.min(1, k * 6);
  }
  // à noite: farol de verdade no veículo que você está
  const pv = G.player && G.player.veh;
  if (night && pv && !pv.dead && !pv.d.boat) {
    if (!VFX.spot) { VFX.spot = new T.SpotLight(0xfff1d0, 4, 70, 0.55, 0.5, 1.2); scene.add(VFX.spot, VFX.spot.target); }
    const fx = -Math.sin(pv.yaw), fz = -Math.cos(pv.yaw); VFX.spot.visible = true;
    VFX.spot.position.set(pv.x + fx * pv.d.hl, pv.y + 0.8, pv.z + fz * pv.d.hl); VFX.spot.target.position.set(pv.x + fx * 22, groundH(pv.x + fx * 22, pv.z + fz * 22), pv.z + fz * 22);
  } else if (VFX.spot) VFX.spot.visible = false;
}
(function hookVehFx() {
  const base = stepVehicles;
  stepVehicles = function (dt) { base(dt); vehFxStep(dt); };
  const cm = clearMatch; clearMatch = function (...a) { const r = cm.apply(this, a); for (const q of VFX.parts) q.s.visible = false; if (VFX.wheels) VFX.wheels.count = 0; return r; };
})();
