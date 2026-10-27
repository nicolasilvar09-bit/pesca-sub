// ================= vida marinha ambiente, fieira e decoração extra =================
const SCHOOLS = [], SWARMS = [], TURTLES = [];
function newSchool(spot) {
  const h = H(spot.x, spot.z);
  const sc = { spot, c: new V3(spot.x + rand(-20, 20), Math.max(h + 2, -6), spot.z + rand(-20, 20)), tgt: new V3(), v: new V3(1, 0, 0), t: 0, fish: [], spd: 1.2 };
  const N = Math.floor(rand(80, 150)), rx = rand(3, 5), ry = rand(1.2, 2), rz = rand(3, 5);
  for (let i = 0; i < N; i++) {
    let o; do { o = new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)); } while (o.lengthSq() > 1);
    o.x *= rx; o.y *= ry; o.z *= rz;
    sc.fish.push({ o, d: new V3(), len: rand(0.11, 0.19), ph: rand(0, 10), w: rand(0, TAU) });
  }
  return sc;
}
function turtleTex() {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#5a4126'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 22) for (let x = (y / 22 % 2) * 14; x < 140; x += 28) {
      const gr = g.createRadialGradient(x, y, 2, x, y, 15); gr.addColorStop(0, '#8a6838'); gr.addColorStop(0.7, '#6a4c2a'); gr.addColorStop(1, '#2e2010');
      g.fillStyle = gr; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 12); } g.fill();
    }
  });
}
function buildTurtle() {
  const g = new THREE.Group();
  const skin = uwify(new THREE.MeshStandardMaterial({ color: 0x6f6a4a, roughness: 0.8 }), { key: 'tk' });
  const shellM = uwify(new THREE.MeshStandardMaterial({ map: turtleTex(), roughness: 0.6 }), { key: 'ts' });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), shellM); shell.scale.set(0.5, 0.17, 0.4); g.add(shell);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), uwify(new THREE.MeshStandardMaterial({ color: 0xd8c890, roughness: 0.8 }), { key: 'tb' })); belly.scale.set(0.47, 0.1, 0.37); g.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), skin); head.scale.set(1.4, 0.9, 1); head.position.set(0.58, 0.02, 0); g.add(head);
  const fl = [];
  for (const [x, z, l, w] of [[0.25, 0.32, 0.5, 0.14], [0.25, -0.32, 0.5, 0.14], [-0.38, 0.22, 0.2, 0.1], [-0.38, -0.22, 0.2, 0.1]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, l), skin); m.position.z = Math.sign(z) * l / 2; m.rotation.y = Math.sign(z) * -0.5; piv.add(m); g.add(piv); fl.push(piv);
  }
  g.userData.fl = fl; scene.add(g); return g;
}
const STR = { nodes: [], prev: [], line: null };
function buildLife() {
  makePool('sardinha', 'mack', fishTex('sardinha', { back: '#2c5a78', side: '#c8d6de', belly: '#f4f6f8', fin: '#7a8a96', iris: '#e0e0e0' }), 1600, true);
  makePool('sargentinho', 'deep', fishTex('sargentinho', { back: '#3a5a40', side: '#e8e070', belly: '#f4f0d0', fin: '#9a9a60', iris: '#e0d070' }), 1200, true);
  for (const s of SPOTS) if (s.r) { const n = s.id === 'foz' ? 1 : 2 + (s.id === 'laje' || s.id === 'jorge' ? 1 : 0); for (let i = 0; i < n; i++) SCHOOLS.push(newSchool(s)); }
  for (const s of SPOTS) {
    if (!s.r || s.id === 'foz') continue;
    const rocks = ROCKS.filter(R => R.spot === s.id && R.r > 1.6).sort(() => Math.random() - 0.5).slice(0, 14);
    for (const R of rocks) {
      const sw = { x: R.x, y: R.y + R.r * R.sy * 0.8, z: R.z, r: R.r, fish: [] };
      const n = Math.floor(rand(8, 20));
      for (let i = 0; i < n; i++) sw.fish.push({ a: rand(0, TAU), rad: R.r * rand(0.9, 1.6), h: rand(0.2, 1.8), sp: rand(0.15, 0.45) * (Math.random() < 0.5 ? -1 : 1), len: rand(0.1, 0.18), ph: rand(0, 10), push: 0 });
      SWARMS.push(sw);
    }
  }
  for (const id of ['jorge', 'laje', 'gipoia']) { const s = spotById(id); const m = buildTurtle(); TURTLES.push({ m, spot: s, pos: new V3(s.x, H(s.x, s.z) + 3, s.z), vel: new V3(), tgt: new V3(), t: 0, yaw: 0, flap: 0, breathe: rand(30, 80) }); }
  STR.line = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xd8d0a0 }));
  STR.line.frustumCulled = false; scene.add(STR.line);
  buildDecor2();
}
function buildDecor2() {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(), pp = new V3(), up = new V3(0, 1, 0), d = new V3();
  const coral = [], sponge = [], star = [];
  for (const R of ROCKS) {
    if (!R.spot || R.spot === 'foz') continue;
    if (Math.random() < 0.35) {
      d.set(rand(-1, 1), rand(-0.2, 0.6), rand(-1, 1)).normalize();
      const cx = R.x + d.x * R.r * 0.85, cy = R.y + d.y * R.r * R.sy * 0.85, cz = R.z + d.z * R.r * 0.85;
      for (let k = 0; k < 22; k++) coral.push([cx + rand(-0.25, 0.25), cy + rand(-0.2, 0.2), cz + rand(-0.25, 0.25), d.clone()]);
    }
    if (Math.random() < 0.3) sponge.push([R.x + rand(-0.5, 0.5) * R.r, R.y + R.r * R.sy * 0.7, R.z + rand(-0.5, 0.5) * R.r, rand(0.6, 1.4)]);
    if (Math.random() < 0.4) { const a = rand(0, TAU), x = R.x + Math.cos(a) * R.r * rand(1.1, 1.8), z = R.z + Math.sin(a) * R.r * rand(1.1, 1.8); star.push([x, H(x, z) + 0.02, z]); }
  }
  const cG = new THREE.CylinderGeometry(0.035, 0.03, 0.07, 6); cG.translate(0, 0.035, 0);
  const cIM = new THREE.InstancedMesh(cG, uwify(new THREE.MeshStandardMaterial({ color: 0xff7a18, roughness: 0.5, emissive: 0x401000 }), { key: 'cs' }), coral.length);
  coral.forEach((c, i) => { q.setFromUnitVectors(up, c[3]); s.setScalar(rand(0.7, 1.3)); pp.set(c[0], c[1], c[2]); m4.compose(pp, q, s); cIM.setMatrixAt(i, m4); });
  const sG = new THREE.CylinderGeometry(0.12, 0.07, 0.42, 9, 1, true); sG.translate(0, 0.21, 0);
  const sIM = new THREE.InstancedMesh(sG, uwify(new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), { key: 'sp2' }), sponge.length);
  const sc = [0xe0a020, 0xd05a20, 0x7a3a8a, 0xc8c040];
  sponge.forEach((c, i) => { e.set(rand(-0.2, 0.2), 0, rand(-0.2, 0.2)); q.setFromEuler(e); s.set(c[3], c[3] * rand(0.8, 1.5), c[3]); pp.set(c[0], c[1], c[2]); m4.compose(pp, q, s); sIM.setMatrixAt(i, m4); sIM.setColorAt(i, new THREE.Color(pick(sc))); });
  const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, r = k % 2 ? 0.05 : 0.14; k ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(r, 0); }
  const stG = new THREE.ShapeGeometry(sh); stG.rotateX(-Math.PI / 2);
  const stIM = new THREE.InstancedMesh(stG, uwify(new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }), { key: 'st' }), star.length);
  star.forEach((c, i) => { e.set(0, rand(0, TAU), 0); q.setFromEuler(e); s.setScalar(rand(0.7, 1.4)); pp.set(c[0], c[1], c[2]); m4.compose(pp, q, s); stIM.setMatrixAt(i, m4); stIM.setColorAt(i, new THREE.Color(pick([0xc8401c, 0xe08a20, 0xb03030]))); });
  scene.add(cIM, sIM, stIM);
}
function updateLife(dt, t) {
  const c = camera.position, pu = P.mode === 'swim' && P.under;
  for (const sc of SCHOOLS) {
    if ((sc.c.x - c.x) ** 2 + (sc.c.z - c.z) ** 2 > 130 * 130) continue;
    sc.t -= dt;
    const dp = sc.c.distanceTo(P.pos);
    if (sc.t <= 0 || sc.c.distanceTo(sc.tgt) < 3) {
      for (let k = 0; k < 10; k++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * sc.spot.r * 1.6, x = sc.spot.x + Math.cos(a) * r, z = sc.spot.z + Math.sin(a) * r, h = H(x, z); if (h < -3) { sc.tgt.set(x, rand(h + 1.5, -1.5), z); break; } }
      sc.t = rand(10, 20); sc.spd = 1.2;
    }
    if (pu && dp < 9) { sc.tgt.copy(sc.c).addScaledVector(_t1.subVectors(sc.c, P.pos).normalize(), 20); sc.tgt.y = clamp(sc.tgt.y, H(sc.tgt.x, sc.tgt.z) + 1.5, -1.5); sc.spd = 3; sc.t = 4; }
    _t1.subVectors(sc.tgt, sc.c).normalize().multiplyScalar(sc.spd);
    sc.v.lerp(_t1, clamp(dt * 0.8, 0, 1)); sc.c.addScaledVector(sc.v, dt);
    const hc = H(sc.c.x, sc.c.z); sc.c.y = clamp(sc.c.y, hc + 1.5, -1.2);
    const yaw = Math.atan2(-sc.v.z, sc.v.x), cy = Math.cos(yaw), sy = Math.sin(yaw), spv = sc.v.length();
    for (const f of sc.fish) {
      const ox = f.o.x * cy + f.o.z * sy, oz = -f.o.x * sy + f.o.z * cy;
      let x = sc.c.x + ox + f.d.x, y = sc.c.y + f.o.y + f.d.y + Math.sin(t * 1.3 + f.w) * 0.15, z = sc.c.z + oz + f.d.z;
      if (pu) { const dx = x - P.pos.x, dy = y - P.pos.y, dz = z - P.pos.z, dd = Math.hypot(dx, dy, dz); if (dd < 3.5 && dd > 0.01) { const k = (3.5 - dd) * dt * 5 / dd; f.d.x += dx * k; f.d.y += dy * k; f.d.z += dz * k; } }
      f.d.multiplyScalar(Math.exp(-dt * 0.7));
      f.ph += dt * (6 + spv * 9);
      poolPut('sardinha', x, y, z, yaw + Math.sin(t * 2 + f.w) * 0.15, 0, 0, f.len, f.ph, 0.07);
    }
  }
  for (const sw of SWARMS) {
    if ((sw.x - c.x) ** 2 + (sw.z - c.z) ** 2 > 70 * 70) continue;
    const dp = Math.hypot(sw.x - P.pos.x, sw.z - P.pos.z);
    for (const f of sw.fish) {
      f.a += f.sp * dt; f.ph += dt * 9;
      f.push = lerp(f.push, pu && dp < sw.r + 4 ? 1.8 : 0, dt * 2);
      const r = f.rad + f.push, x = sw.x + Math.cos(f.a) * r, z = sw.z + Math.sin(f.a) * r, y = sw.y + f.h + Math.sin(t * 0.8 + f.ph * 0.1) * 0.25;
      const yaw = f.sp > 0 ? Math.atan2(-Math.cos(f.a), -Math.sin(f.a)) : Math.atan2(Math.cos(f.a), Math.sin(f.a));
      poolPut('sargentinho', x, y, z, yaw, 0, 0, f.len, f.ph, 0.06);
    }
  }
  for (const T of TURTLES) {
    T.breathe -= dt; T.t -= dt;
    if (T.t <= 0 || T.pos.distanceTo(T.tgt) < 2) {
      if (T.breathe <= 0) { T.tgt.set(T.pos.x + rand(-10, 10), -0.4, T.pos.z + rand(-10, 10)); T.breathe = rand(40, 90); T.t = 25; }
      else { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * T.spot.r * 1.4, x = T.spot.x + Math.cos(a) * r, z = T.spot.z + Math.sin(a) * r, h = H(x, z); if (h < -2.5) T.tgt.set(x, rand(h + 0.8, Math.min(-1, h + 5)), z); T.t = rand(12, 25); }
    }
    if (pu && T.pos.distanceTo(P.pos) < 3) T.tgt.copy(T.pos).addScaledVector(_t1.subVectors(T.pos, P.pos).normalize(), 8);
    _t1.subVectors(T.tgt, T.pos); const dd = _t1.length(); _t1.multiplyScalar(Math.min(0.7, dd) / (dd || 1));
    T.vel.lerp(_t1, clamp(dt * 0.6, 0, 1)); T.pos.addScaledVector(T.vel, dt);
    const h = H(T.pos.x, T.pos.z); if (T.pos.y < h + 0.6) T.pos.y = h + 0.6; if (T.pos.y > -0.3) T.pos.y = -0.3;
    pushOutRocks(T.pos, 0.5);
    if (T.vel.length() > 0.05) T.yaw += angDiff(T.yaw, Math.atan2(-T.vel.z, T.vel.x)) * clamp(dt * 1.2, 0, 1);
    T.flap += dt * (1.6 + T.vel.length() * 2);
    T.m.position.copy(T.pos); T.m.rotation.set(0, T.yaw, clamp(T.vel.y, -0.4, 0.4), 'YZX');
    const fl = T.m.userData.fl, fa = Math.sin(T.flap);
    fl[0].rotation.x = fa * 0.6; fl[1].rotation.x = -fa * 0.6; fl[0].rotation.y = fl[1].rotation.y = Math.cos(T.flap) * 0.3;
    fl[2].rotation.x = Math.sin(T.flap + 1) * 0.3; fl[3].rotation.x = -Math.sin(T.flap + 1) * 0.3;
    T.m.visible = (T.pos.x - c.x) ** 2 + (T.pos.z - c.z) ** 2 < 120 * 120;
  }
  updateStringer(dt, t);
}
// fieira presa na cintura: corrente com física de corda (verlet)
function updateStringer(dt, t) {
  const n = P.stringer.length;
  if (P.mode === 'swim' && n > 0) {
    const fw = _t2.set(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)), rt = _t1.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
    const A = new V3(camera.position.x - rt.x * 0.3 + fw.x * 0.35, camera.position.y - 0.62, camera.position.z - rt.z * 0.3 + fw.z * 0.35);
    while (STR.nodes.length < n + 1) { const p = (STR.nodes[STR.nodes.length - 1] || A).clone(); p.y -= 0.2; STR.nodes.push(p); STR.prev.push(p.clone()); }
    STR.nodes.length = STR.prev.length = n + 1;
    STR.nodes[0].copy(A); STR.prev[0].copy(A);
    const g = P.under ? -0.5 : -2.5, seg = 0.24;
    for (let i = 1; i <= n; i++) {
      const p = STR.nodes[i], q = STR.prev[i], tx = p.x, ty = p.y, tz = p.z;
      p.x += (p.x - q.x) * 0.9; p.y += (p.y - q.y) * 0.9 + g * dt * dt; p.z += (p.z - q.z) * 0.9;
      p.x += Math.sin(t * 1.3 + i) * 0.0008; q.set(tx, ty, tz);
      const sy = waveH(p.x, p.z, t) - 0.2; if (!P.under && p.y > sy) p.y = sy;
    }
    for (let it = 0; it < 4; it++) for (let i = 1; i <= n; i++) {
      const a = STR.nodes[i - 1], b = STR.nodes[i], d = a.distanceTo(b) || 1e-4, k = (d - seg) / d;
      if (i === 1) b.addScaledVector(_c.subVectors(a, b), k); else { _c.subVectors(a, b).multiplyScalar(k * 0.5); b.add(_c); a.sub(_c); }
      const h = H(b.x, b.z) + 0.1; if (b.y < h) b.y = h;
    }
    const arr = STR.line.geometry.attributes.position.array;
    for (let i = 0; i < 40; i++) { const p = STR.nodes[Math.min(i, n)]; arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; }
    STR.line.geometry.attributes.position.needsUpdate = true; STR.line.visible = true;
    const fy = Math.atan2(fw.z, -fw.x);
    P.stringer.forEach((f, i) => { const p = STR.nodes[i + 1], L = f.len || f.cm / 100, y = fy + Math.sin(t * 0.6 + i * 1.7) * 0.5 + (i % 2 ? 0.5 : -0.5), pt = 0.95 + Math.sin(t * 0.9 + i) * 0.1, cp = Math.cos(pt);
      poolPut(f.key, p.x - Math.cos(y) * cp * L * 0.36, p.y - Math.sin(pt) * L * 0.36, p.z + Math.sin(y) * cp * L * 0.36, y, pt, Math.PI / 2, L, i, 0.01); });
  } else { STR.line.visible = false; STR.nodes.length = STR.prev.length = 0; }
  // pescado no convés do barco
  if (SV.cooler.length && (BOAT.pos.x - camera.position.x) ** 2 + (BOAT.pos.z - camera.position.z) ** 2 < 150 * 150) {
    const v = new V3();
    SV.cooler.slice(0, 16).forEach((f, i) => {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), L = f.len || f.cm / 100;
      v.set(side * (0.62 - (row % 2) * 0.12), 0.8 + Math.floor(row / 4) * 0.06, 1.3 - (row % 4) * 0.75); BOAT.mesh.localToWorld(v);
      poolPut(f.key, v.x, v.y, v.z, BOAT.heading - Math.PI / 2 + (side > 0 ? 0.08 : -0.08), 0, Math.PI / 2, Math.min(L, 1.3), i, 0.002);
    });
  }
}
