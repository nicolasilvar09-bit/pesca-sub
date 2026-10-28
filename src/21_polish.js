// ================= detalhes: areia levantando e aves sobre o mar fervendo =================

// ---------- nuvens de areia (sprites que crescem e somem) ----------
const SAND = { pool: [], i: 0, footT: 0, col: new THREE.Color(0xcfc6a8), tmp: new THREE.Color() };
function puffTex() {
  return canvasTex(64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(230,220,190,.9)'); gr.addColorStop(0.6, 'rgba(210,200,170,.35)'); gr.addColorStop(1, 'rgba(200,190,160,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(160,150,120,${rand(0.1, 0.3)})`; g.fillRect(rand(16, 48), rand(16, 48), 2, 2); }
  }, false);
}
function setupSand() {
  const tex = puffTex();
  for (let i = 0; i < 70; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, color: 0xd8d0b4 });
    const s = new THREE.Sprite(m); s.visible = false; scene.add(s);
    SAND.pool.push({ s, life: 0, max: 1, v: new V3(), r0: 0.3, r1: 1 });
  }
}
// n partículas no ponto p; força k (0..1)
function sandPuff(p, n = 6, k = 1) {
  if (!SAND.pool.length) return;
  const h = H(p.x, p.z); if (p.y - h > 1.6) return; // só perto do fundo de areia
  for (let i = 0; i < n; i++) {
    const q = SAND.pool[SAND.i++ % SAND.pool.length], a = rand(0, TAU), sp = rand(0.15, 0.55) * k;
    q.s.position.set(p.x + rand(-0.2, 0.2), h + rand(0.05, 0.3), p.z + rand(-0.2, 0.2));
    q.v.set(Math.cos(a) * sp, rand(0.1, 0.35) * k, Math.sin(a) * sp);
    q.life = q.max = rand(2, 3.5); q.r0 = rand(0.25, 0.45) * (0.6 + k * 0.4); q.r1 = q.r0 * rand(2.5, 4); q.s.visible = true;
  }
}
function updateSand(dt) {
  for (const q of SAND.pool) {
    if (q.life <= 0) continue;
    q.life -= dt; if (q.life <= 0) { q.s.visible = false; continue; }
    const u = 1 - q.life / q.max;
    q.v.multiplyScalar(Math.exp(-dt * 1.4)); q.s.position.addScaledVector(q.v, dt); q.s.position.x += _sg.x * dt * 0.1; q.s.position.z += _sg.z * dt * 0.1;
    // a nuvem toma a cor da água em volta (absorção e névoa), como a areia do fundo
    q.s.scale.setScalar(lerp(q.r0, q.r1, Math.sqrt(u))); q.s.material.opacity = 0.42 * (1 - u) * Math.min(1, u * 8);
    q.s.material.color.copy(SAND.col).lerp(scene.fog.color, 0.62).multiplyScalar(0.25 + 0.6 * DAY.amb);
  }
  // nadadeiras batendo rente ao fundo
  if (P.mode === 'swim' && P.under && (SAND.footT -= dt) <= 0) {
    const mv = Math.hypot(IN.jx, IN.jy) + (IN.held.up ? 1 : 0), feet = _t2.set(P.pos.x + Math.sin(P.yaw) * 1.6, P.pos.y - 0.3, P.pos.z + Math.cos(P.yaw) * 1.6);
    if (mv > 0.3 && feet.y - H(feet.x, feet.z) < 0.9) { sandPuff(feet, 3, 0.6); SAND.footT = 0.35; } else SAND.footT = 0.1;
  }
}

// ---------- atobás: circulam e mergulham sobre o mar fervendo ----------
const BIRDS = { list: [], geo: null };
function birdGeo() {
  // corpo fusiforme + asas longas em V raso + pontas pretas
  const parts = [], body = new THREE.SphereGeometry(0.09, 8, 6); body.scale(0.8, 0.7, 2.6); parts.push(body);
  const head = new THREE.ConeGeometry(0.05, 0.22, 6); head.rotateX(Math.PI / 2); head.translate(0, 0.01, 0.32); parts.push(head);
  for (const sx of [-1, 1]) { const w = new THREE.BoxGeometry(0.62, 0.012, 0.13); w.translate(sx * 0.33, 0, 0); w.rotateZ(sx * 0.12); parts.push(w); }
  const tail = new THREE.ConeGeometry(0.06, 0.2, 4); tail.rotateX(-Math.PI / 2); tail.translate(0, 0, -0.3); parts.push(tail);
  const g = mergeGeos(parts), ps = g.attributes.position, col = new Float32Array(ps.count * 3);
  for (let i = 0; i < ps.count; i++) { const tip = Math.abs(ps.getX(i)) > 0.5 || ps.getZ(i) > 0.38; col.set(tip ? [0.08, 0.08, 0.09] : [0.96, 0.95, 0.9], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
function updateBirds(dt, t) {
  const want = BOIL.on ? 9 : 0;
  if (want && !BIRDS.list.length) {
    if (!BIRDS.geo) { BIRDS.geo = birdGeo(); BIRDS.mat = new THREE.MeshLambertMaterial({ vertexColors: true }); }
    for (let i = 0; i < want; i++) { const m = new THREE.Mesh(BIRDS.geo, BIRDS.mat); m.scale.setScalar(rand(1.6, 2)); scene.add(m); BIRDS.list.push({ m, a: rand(0, TAU), r: rand(6, 16), h: rand(9, 20), w: rand(0.35, 0.6) * (Math.random() < 0.5 ? 1 : -1), dive: 0, pos: new V3() }); }
  }
  if (!want && BIRDS.list.length) { for (const b of BIRDS.list) scene.remove(b.m); BIRDS.list = []; return; }
  for (const b of BIRDS.list) {
    b.a += b.w * dt;
    let x = BOIL.x + Math.cos(b.a) * b.r, z = BOIL.z + Math.sin(b.a) * b.r, y = b.h + Math.sin(t * 0.7 + b.a) * 1.5;
    // mergulho: asas fechadas, cai reto e espirra água; depois volta a subir
    if (!b.dive && Math.random() < dt * 0.06) b.dive = 1;
    if (b.dive > 0) {
      b.dive += dt * 0.9; const u = b.dive - 1;
      if (u < 1) y = lerp(b.h, -0.4, u * u); else if (u < 1.6) y = -0.4; else if (u < 3) y = lerp(-0.4, b.h, (u - 1.6) / 1.4); else b.dive = 0;
      if (u >= 1 && u - dt * 0.9 < 1) { spawnSpray(_sl.set(x, waveH(x, z, T), z), 10); if (camera.position.distanceTo(_sl) < 60) AU.burst(0.25, 900, 'highpass', 0.15); }
    }
    const diving = b.dive && b.dive - 1 < 1;
    b.m.position.set(x, y, z);
    b.m.rotation.set(diving ? 1.35 : -0.05, Math.atan2(-Math.sin(b.a) * Math.sign(b.w), Math.cos(b.a) * Math.sign(b.w)) , diving ? 0 : -Math.sign(b.w) * 0.35, 'YXZ');
    b.m.scale.x = (diving ? 0.35 : 1 + Math.sin(t * 9 + b.a) * 0.05) * b.m.scale.y;
    b.m.visible = y > -0.35;
  }
}

// ---------- escamas brilhando quando o arpão acerta ----------
const SCALES = { list: [], pts: null };
function setupScales() {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(90 * 3).fill(9999), 3));
  SCALES.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.045, map: dotTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xe8f4ff }));
  SCALES.pts.frustumCulled = false; scene.add(SCALES.pts);
}
function spawnScales(p, n = 16) {
  for (let i = 0; i < n; i++) { if (SCALES.list.length >= 90) SCALES.list.shift(); SCALES.list.push({ x: p.x, y: p.y, z: p.z, vx: rand(-0.5, 0.5), vy: rand(-0.1, 0.4), vz: rand(-0.5, 0.5), t: rand(1.5, 3), ph: rand(0, TAU) }); }
}
function updateScales(dt, t) {
  if (!SCALES.pts) return;
  const a = SCALES.pts.geometry.attributes.position.array; a.fill(9999);
  for (let i = SCALES.list.length - 1; i >= 0; i--) { const s = SCALES.list[i]; s.t -= dt; if (s.t <= 0) { SCALES.list.splice(i, 1); continue; } s.vx *= Math.exp(-dt * 2); s.vz *= Math.exp(-dt * 2); s.vy = lerp(s.vy, -0.12, dt); s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; }
  // pisca como escama virando contra a luz
  SCALES.list.forEach((s, i) => { const on = Math.sin(t * 14 + s.ph) > -0.2; a[i * 3] = on ? s.x : 9999; a[i * 3 + 1] = s.y; a[i * 3 + 2] = s.z; });
  SCALES.pts.geometry.attributes.position.needsUpdate = true;
}

// ---------- fundos novos: prado de algas e cascalho ----------
const meadowAt = (x, z) => fbm(x * 0.012 + 300, z * 0.012 - 70, 3);
const gravelAt = (x, z) => fbm(x * 0.03 + 500, z * 0.03 + 120, 2);
function buildBottoms() {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(), pp = new V3(), r = mulberry(77);
  // tufo de capim-marinho: 7 folhas finas em leque
  const blades = []; for (let k = 0; k < 7; k++) { const b = new THREE.PlaneGeometry(0.035, rand(0.35, 0.6), 1, 3); b.translate(0, b.parameters.height / 2, 0); b.rotateY(k / 7 * Math.PI + rand(-0.2, 0.2)); b.rotateZ(rand(-0.25, 0.25)); b.translate(rand(-0.08, 0.08), 0, rand(-0.08, 0.08)); blades.push(b); }
  const grassG = mergeGeos(blades);
  const grassM = uwify(new THREE.MeshLambertMaterial({ color: 0x4f7a32, side: THREE.DoubleSide }), {
    key: 'sg', vBody: SURGE_GLSL + ' float sw=max(position.y,0.0); sw*=sw; transformed.x+=(surge.x*0.35+sin(uTime*1.6+instanceMatrix[3].x)*0.06)*sw; transformed.z+=(surge.y*0.35+cos(uTime*1.3+instanceMatrix[3].z)*0.06)*sw;'
  });
  const grass = [], peb = [];
  // manchas densas: em cada ponto do prado, um tapete de tufos a ~0,5 m um do outro
  for (let i = 0; i < 90000 && grass.length < 30000; i++) {
    const x = lerp(WB.x0, WB.x1, r()), z = lerp(WB.z0, WB.z1, r()), h = H(x, z);
    if (h > -1.5 || h < -10 || meadowAt(x, z) < 0.47 || murkAt(x, z) > 0.5) continue;
    for (let k = 0; k < 14; k++) { const it = [x + rand(-2.2, 2.2), 0, z + rand(-2.2, 2.2)]; if (meadowAt(it[0], it[2]) < 0.45) continue; it[1] = H(it[0], it[2]); grass.push(it); }
  }
  for (let i = 0; i < 60000 && peb.length < 9000; i++) {
    const x = lerp(WB.x0, WB.x1, r()), z = lerp(WB.z0, WB.z1, r()), h = H(x, z);
    if (h > -3 || h < -26 || gravelAt(x, z) < 0.38) continue;
    for (let k = 0; k < 6; k++) { const it = [x + rand(-1.5, 1.5), 0, z + rand(-1.5, 1.5)]; it[1] = H(it[0], it[2]); peb.push(it); }
  }
  chunked(grassG, grassM, grass, (f, i, im) => { e.set(0, rand(0, TAU), 0); q.setFromEuler(e); const k = rand(1.0, 1.8); s.set(k, k * rand(0.9, 1.5), k); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setHSL(rand(0.22, 0.3), 0.45, rand(0.25, 0.4))); }, 60);
  const pebG = new THREE.IcosahedronGeometry(0.1, 0); pebG.scale(1, 0.55, 1);
  chunked(pebG, uwify(new THREE.MeshStandardMaterial({ roughness: 0.9 }), { key: 'pb' }), peb, (f, i, im) => { e.set(rand(0, 3), rand(0, TAU), rand(0, 3)); q.setFromEuler(e); s.setScalar(rand(0.4, 1.4)); pp.set(f[0], f[1] + 0.02, f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setHSL(rand(0.06, 0.12), rand(0.05, 0.2), rand(0.25, 0.55))); }, 30);
}

// ---------- arcos de pedra: passagens para atravessar nadando ----------
const ARCHES = [];
function buildArches() {
  for (const id of ['jorge', 'cataguases', 'castelhanos', 'porcos', 'laje', 'gipoia']) {
    const S = spotById(id); if (!S) continue;
    for (let k = 0; k < 40; k++) {
      const a = k * 0.9, d = 12 + k * 0.8, x = S.x + Math.cos(a) * d, z = S.z + Math.sin(a) * d, h = H(x, z);
      if (h > -7 || h < -16) continue;
      const ry = rand(0, TAU), rx = Math.cos(ry), rz = Math.sin(ry);
      if (Math.abs(H(x + rx * 4.5, z + rz * 4.5) - H(x - rx * 4.5, z - rz * 4.5)) > 1.6) continue;
      if (rocksNear(x, z).some(R => Math.hypot(R.x - x, R.z - z) < R.r + 4)) continue;
      const Rr = 4.5;
      for (let i = 0; i <= 12; i++) {
        const th = i / 12 * Math.PI, px = x + rx * Math.cos(th) * Rr, pz = z + rz * Math.cos(th) * Rr, py = H(px, pz) * (1 - Math.sin(th)) + (h + Math.sin(th) * Rr * 1.05) * Math.sin(th);
        const R = addRock(px, py, pz, i === 0 || i === 12 ? 1.9 : 1.3, id); R.sy = 1;
      }
      ARCHES.push({ x, z, y: h + 2, n: x * rz - z * rx, rx, rz, spot: S.name }); break;
    }
  }
}
function updateArches() {
  if (P.mode !== 'swim' || !P.under) return;
  for (const A of ARCHES) {
    const dx = P.pos.x - A.x, dz = P.pos.z - A.z, side = dx * -A.rz + dz * A.rx, along = dx * A.rx + dz * A.rz;
    if (Math.abs(along) < 3.2 && P.pos.y - (A.y - 2) < 4.3 && Math.abs(side) < 1.5) {
      if (A.last != null && Math.sign(side) !== Math.sign(A.last) && A.day !== SV.day) { A.day = SV.day; toast(`Você atravessou o arco de pedra da ${A.spot}!`, 3, 'gold'); addXP(30); }
      A.last = side;
    } else if (Math.hypot(dx, dz) > 10) A.last = null;
  }
}

// ---------- compensar os ouvidos ----------
// a cada poucos metros de descida a pressão aperta; COMPENSAR (G) alivia. Subindo, alivia sozinho.
function equalize() {
  if (!P.under) return;
  const d = -P.pos.y; if (d - (P.eqD || 0) < 0.4) return;
  P.eqD = d; AU.tone(700, 1100, 0.05, 0.05, 'sine'); P.eqFlash = 0.4;
  if (d > comfortDepth()) P.o2 -= 0.01; // abaixo do limite treinado, compensar custa ar
}
function updateEars(dt) {
  if (P.mode !== 'swim' || !P.under) { P.ear = 0; P.eqD = 0; P.earWarn = false; return; }
  const d = -P.pos.y, step = 2.6 + lvl('trEq') * 0.7;
  P.eqD = Math.min(P.eqD || 0, d); // subindo, o ar expande e alivia
  P.ear = clamp((d - P.eqD) / step, 0, 2);
  if (OPT.autoEq && P.ear > 0.8) equalize();
  P.eqFlash = Math.max(0, (P.eqFlash || 0) - dt);
  if (P.ear > 1) {
    P.o2 -= dt * 0.012 * (P.ear - 1) * 2;
    if (P.ear > 1.5) P.vel.y = Math.max(P.vel.y, 0.25); // a dor não deixa descer mais
    if (!P.earWarn) { P.earWarn = true; toast('Ouvido doendo! Toque COMPENSAR (G) para equalizar.', 3, 'bad'); buzz([50, 40, 50]); }
  } else if (P.ear < 0.6) P.earWarn = false;
  const b = $('bEq'); b.classList.toggle('warn', P.ear > 0.8); b.classList.toggle('ok', P.eqFlash > 0);
}
