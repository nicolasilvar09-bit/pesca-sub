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
