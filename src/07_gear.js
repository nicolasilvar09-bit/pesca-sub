// ================= arbaletes detalhados + mergulhador =================
let THIRD = true; // vista em 3ª pessoa ao nadar
function woodTex() {
  const t = canvasTex(64, 512, (g) => {
    g.fillStyle = '#7a4a26'; g.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 46; i++) { const x = rand(0, 64), w = rand(0.5, 2.5); g.strokeStyle = `rgba(${Math.random() < 0.5 ? '40,20,8' : '150,95,50'},${rand(0.15, 0.45)})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 512; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 2.5, y); g.stroke(); }
    for (let i = 0; i < 6; i++) { const y = rand(0, 512); g.fillStyle = 'rgba(40,20,8,.25)'; g.beginPath(); g.ellipse(rand(10, 54), y, 3, 9, 0, 0, TAU); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function camoTex() {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#4a5a3a'; g.fillRect(0, 0, 256, 256);
    const cols = ['#2c3826', '#6b6a44', '#1b201a', '#5b4a32', '#3c4c34'];
    for (let i = 0; i < 90; i++) {
      const x = rand(0, 256), y = rand(0, 256), r = rand(8, 26), c = pick(cols), k = Math.floor(rand(5, 9));
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.fillStyle = c; g.beginPath(); for (let j = 0; j < k; j++) { const a = j / k * TAU, rr = r * rand(0.5, 1.2); g.lineTo(x + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr * 0.7); } g.fill(); }
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${rand(0, 0.08)})`; g.fillRect(rand(0, 256), rand(0, 256), 1, 1); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
}
function carbonTex() {
  const t = canvasTex(64, 64, (g) => { for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { const a = ((x + y) / 8) % 2; g.fillStyle = a ? '#1a1c20' : '#30343a'; g.fillRect(x, y, 8, 8); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x, y + (a ? 0 : 4), 8, 2); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 8); return t;
}
let _woodT, _camoT, _carbT;
const gtex = () => { if (!_woodT) { _woodT = woodTex(); _camoT = camoTex(); _carbT = carbonTex(); } };

// ---------- arbalete ----------
function buildGunMesh(def, uw) {
  gtex();
  const M = (m, k) => uw ? uwify(m, { key: 'g' + k }) : m;
  const g = new THREE.Group(), L = def.len;
  const wood = M(new THREE.MeshStandardMaterial({ map: _woodT, roughness: 0.42, metalness: 0.05 }), 'w');
  const alu = M(new THREE.MeshStandardMaterial({ color: 0x23292f, metalness: 0.75, roughness: 0.32 }), 'a');
  const poly = M(new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.62 }), 'p');
  const steel = M(new THREE.MeshStandardMaterial({ color: 0xd9dee2, metalness: 1, roughness: 0.16 }), 's');
  const rubber = M(new THREE.MeshStandardMaterial({ color: 0xb4581a, roughness: 0.38, metalness: 0.0 }), 'r');
  const zBack = 0.13, zFront = zBack - L; // cano vai de zBack até zFront
  const add = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  let topY;
  if (def.wood) {
    const s = new THREE.Shape(), w = 0.019, h = 0.03, r = 0.008;
    s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(0.005, h); s.lineTo(0.004, h - 0.004); s.lineTo(-0.004, h - 0.004); s.lineTo(-0.005, h); // trilho do arpão
    s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
    const eg = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 4 });
    eg.translate(0, -0.012, zFront); add(eg, wood); topY = 0.018 - 0.004;
  } else if (def.pneu) {
    add(new THREE.CylinderGeometry(0.022, 0.022, L, 20).rotateX(Math.PI / 2), alu, 0, -0.008, (zBack + zFront) / 2);
    for (const z of [zFront + 0.02, zBack - 0.03]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.035, 20).rotateX(Math.PI / 2), poly, 0, -0.008, z);
    topY = 0.016;
  } else {
    add(new THREE.CylinderGeometry(0.0145, 0.0145, L, 18).rotateX(Math.PI / 2), alu, 0, -0.004, (zBack + zFront) / 2);
    add(new THREE.BoxGeometry(0.011, 0.008, L), alu, 0, 0.012, (zBack + zFront) / 2);
    add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 18).rotateX(Math.PI / 2), poly, 0, -0.004, zBack - 0.012);
    topY = 0.016;
  }
  // empunhadura anatômica
  const gs = new THREE.Shape();
  gs.moveTo(0.025, 0); gs.lineTo(-0.04, 0); gs.quadraticCurveTo(-0.052, -0.05, -0.066, -0.118); gs.quadraticCurveTo(-0.06, -0.14, -0.034, -0.134);
  gs.quadraticCurveTo(-0.026, -0.11, -0.022, -0.1); gs.quadraticCurveTo(-0.012, -0.09, -0.016, -0.075); gs.quadraticCurveTo(-0.006, -0.064, -0.01, -0.05); gs.quadraticCurveTo(0, -0.04, 0.008, -0.026); gs.closePath();
  const gg = new THREE.ExtrudeGeometry(gs, { depth: 0.03, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 3, curveSegments: 8 });
  gg.translate(0, 0, -0.015); gg.rotateY(Math.PI / 2); add(gg, poly, 0, -0.018, 0.02);
  const guard = new THREE.TorusGeometry(0.026, 0.0035, 6, 16, Math.PI); guard.rotateZ(Math.PI); guard.rotateY(Math.PI / 2); add(guard, poly, 0, -0.02, -0.022);
  const trig = add(new THREE.BoxGeometry(0.005, 0.024, 0.007), steel, 0, -0.03, -0.016); trig.rotation.x = -0.25;
  add(new THREE.BoxGeometry(0.004, 0.012, 0.02), steel, 0.02, -0.01, 0.0); // trava
  add(new THREE.BoxGeometry(0.006, 0.014, 0.02), poly, 0, 0.012, zBack - 0.06); // liberador de linha
  // cabeça (muzzle)
  if (def.pneu) { add(new THREE.CylinderGeometry(0.026, 0.02, 0.05, 20).rotateX(Math.PI / 2), poly, 0, -0.008, zFront - 0.02); }
  else {
    const mz = zFront + 0.03;
    add(new THREE.BoxGeometry(0.058, 0.03, 0.05), poly, 0, 0.004, mz);
    for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.012, 0.012, 0.054, 14).rotateX(Math.PI / 2), poly, sx * 0.031, 0.006, mz);
    const arch = new THREE.TorusGeometry(0.009, 0.003, 6, 12, Math.PI); arch.rotateY(Math.PI / 2); add(arch, steel, 0, topY + 0.004, mz - 0.02).rotation.y = Math.PI / 2;
    if (def.id === 'a130') { add(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 16).rotateZ(Math.PI / 2), steel, 0, -0.03, mz - 0.01); for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.004, 0.05, 0.045), poly, sx * 0.027, -0.022, mz - 0.01); }
  }
  // molinete ou ganchos de linha
  const reel = L >= 1.0 && !def.pneu;
  if (reel) { add(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 24).rotateZ(Math.PI / 2), poly, 0, -0.06, -0.08); add(new THREE.CylinderGeometry(0.024, 0.024, 0.032, 24).rotateZ(Math.PI / 2), M(new THREE.MeshStandardMaterial({ color: 0xd8c84a, roughness: 0.6 }), 'y'), 0, -0.06, -0.08); add(new THREE.BoxGeometry(0.01, 0.03, 0.05), poly, 0, -0.035, -0.08); }
  else for (const z of [zBack - 0.17, zFront + 0.12]) add(new THREE.CylinderGeometry(0.003, 0.003, 0.026, 6), steel, 0, -0.026, z);
  // arpão (haste 6,5 mm com aletas e ponta taitiana)
  const S = L + 0.28, sp = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0033, 0.0033, S, 8).rotateX(Math.PI / 2), steel); shaft.position.z = -S / 2; sp.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0042, 0.04, 8).rotateX(-Math.PI / 2), steel); tip.position.z = -S - 0.02; sp.add(tip);
  const flop = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.005, 0.07), steel); flop.position.set(0, 0.004, -S + 0.04); flop.rotation.x = 0.06; sp.add(flop);
  const notches = [];
  for (let i = 0; i < Math.max(1, def.bands); i++) { const z = -0.06 - i * 0.075; const f = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.006, 0.022), steel); f.position.set(0, 0.005, z); sp.add(f); notches.push(z); }
  const spearZ = zBack - 0.02; sp.position.set(0, topY + 0.004, spearZ); g.add(sp);
  // elásticos (borracha âmbar 16 mm) e wishbones
  const bands = [];
  if (!def.pneu) for (let i = 0; i < def.bands; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 1, 8), rubber), r = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 1, 8), rubber);
    const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 5), steel);
    g.add(l, r, wb); bands.push({ l, r, wb, notchZ: spearZ + notches[i], i });
  }
  // linha de tiro enrolada
  const wrapPts = [], ly = -0.03;
  const zF = zFront + 0.06, zR = reel ? -0.08 : zBack - 0.17;
  wrapPts.push(new V3(0, topY + 0.004, spearZ), new V3(0, ly + 0.01, zF - 0.02));
  for (let k = 0; k < (reel ? 1 : 3); k++) wrapPts.push(new V3(0.002, ly, zR), new V3(-0.002, ly, zF));
  if (reel) wrapPts.push(new V3(0, -0.035, -0.08));
  const wrap = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wrapPts), new THREE.LineBasicMaterial({ color: 0xece6c8 }));
  g.add(wrap);
  return { g, L, S, spear: sp, bands, wrap, mz: zFront + 0.03, topY, spearZ, tip: new V3(0, topY + 0.004, spearZ - S - 0.04) };
}
function placeBands(m, loaded, loadingIdx, prog) {
  for (const b of m.bands) {
    const isL = b.i < loaded, isLd = b.i === loadingIdx;
    const hook = new V3(0, m.topY + 0.016, b.notchZ);
    const rest = new V3(0, -0.05, m.mz + 0.2 + b.i * 0.03);
    const end = isL ? hook : isLd ? new V3().lerpVectors(rest, hook, prog) : rest;
    for (const [mesh, sx] of [[b.l, -1], [b.r, 1]]) {
      const st = new V3(sx * 0.031, 0.006, m.mz);
      const e2 = new V3(end.x + sx * (isL || isLd ? 0.012 : 0.014), end.y - 0.004, end.z);
      cylBetween(mesh, st, e2);
    }
    cylBetween(b.wb, new V3(-0.013, end.y - 0.004, end.z), new V3(0.013, end.y - 0.004, end.z));
  }
}
function buildFPArm() {
  gtex();
  const a = new THREE.Group();
  const glove = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.7 });
  const sleeve = new THREE.MeshStandardMaterial({ map: _camoT, roughness: 0.85 });
  const hand = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.05, 4, 10), glove); hand.scale.set(1.25, 1, 0.95); hand.position.set(0, -0.06, 0.035); hand.rotation.x = -0.35; a.add(hand);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.028, 3, 6), glove); f.position.set(-0.018, -0.03 - i * 0.02, 0.012); f.rotation.z = Math.PI / 2; a.add(f); }
  const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.035, 3, 6), glove); th.position.set(0.02, -0.012, 0.02); th.rotation.x = 0.9; a.add(th);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.5, 4, 12), sleeve); fore.position.set(0.05, -0.2, 0.27); fore.rotation.set(-1.05, 0, -0.2); a.add(fore);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.03, 12), glove); cuff.position.set(0.012, -0.1, 0.085); cuff.rotation.set(-1.05, 0, -0.2); a.add(cuff);
  return a;
}
// substitui o arbalete antigo
function buildGun(def) {
  if (GUN.model) camera.remove(GUN.model);
  if (GUN.spear) scene.remove(GUN.spear);
  if (GUN.wm && GUN.wm.g.parent) GUN.wm.g.parent.remove(GUN.wm.g);
  GUN.def = def; GUN.bands = 0; GUN.state = 'ready'; GUN.fish = null; GUN.loadT = 0;
  GUN.vm = buildGunMesh(def, false); GUN.vm.g.add(buildFPArm());
  GUN.model = GUN.vm.g; GUN.model.position.set(0.1, -0.13, -0.42); camera.add(GUN.model); GUN.model.visible = P.mode === 'swim' && !THIRD;
  GUN.wm = buildGunMesh(def, true); if (DIVER) DIVER.handR.add(GUN.wm.g);
  GUN.wm.g.rotation.set(-Math.PI / 2, 0, 0); GUN.wm.g.position.set(0, -0.09, 0.0);
  const ws = GUN.vm.spear.clone(true); ws.position.set(0, 0, 0); ws.traverse(o => { if (o.isMesh) o.material = uwify(o.material.clone(), { key: 'sp' }); });
  GUN.spear = new THREE.Group(); ws.rotation.y = Math.PI; GUN.spear.add(ws); GUN.spear.visible = false; scene.add(GUN.spear); GUN.spearLen = GUN.vm.S;
  if (!GUN.line) {
    GUN.lineGeo = new THREE.BufferGeometry(); GUN.lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    GUN.line = new THREE.Line(GUN.lineGeo, new THREE.LineBasicMaterial({ color: 0xece6c8, transparent: true, opacity: 0.85 })); GUN.line.frustumCulled = false; scene.add(GUN.line);
  }
  GUN.line.visible = false; updateBands();
}
function updateBands() {
  const def = GUN.def, prog = GUN.loadT > 0 ? 1 - GUN.loadT / (def.load * (P.under ? 1.35 : 1)) : 0;
  for (const m of [GUN.vm, GUN.wm]) if (m) placeBands(m, GUN.bands, GUN.loadT > 0 ? GUN.bands : -1, clamp(prog, 0, 1));
}
function setSpearInGun(v) { for (const m of [GUN.vm, GUN.wm]) if (m) { m.spear.visible = v; m.wrap.visible = v; } }
function activeGun() { return THIRD && P.mode === 'swim' && GUN.wm ? GUN.wm : GUN.vm; }
function gunTipWorld(out) { const m = activeGun(); m.g.updateMatrixWorld(true); return m.g.localToWorld(out.copy(m.tip)); }
function aimDir(out, tip) {
  const R = GUN.def.range;
  const tgt = camFwd(out).multiplyScalar(R + (THIRD ? 2.6 : 0)).add(camera.position);
  return out.subVectors(tgt, tip).normalize();
}

// ---------- mergulhador (rig articulado) ----------
let DIVER = null;
// curva suave por nós [t, v]
const knots = K => t => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [a, va] = K[i - 1], [b, vb] = K[i], u = (t - a) / (b - a); return va + (vb - va) * u * u * (3 - 2 * u); } return K[K.length - 1][1]; };
// sólido de revolução com seção elíptica: profundidade diferente na frente (-z) e atrás (+z)
function bodyLathe(prof, seg, fd, bd) {
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); p.setZ(i, z * (z < 0 ? fd(y) : bd(y))); }
  g.computeVertexNormals(); return g;
}
// nadadeira de apneia: pá longa em malha (flexiona) + trilhos laterais de borracha
const FIN_L = 0.74, FIN_ANG = -0.42;
function finGeos() {
  const N = 16, M = 6, L = FIN_L, w = s => 0.105 + 0.095 * smooth(0, 0.32, s), pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) {
    const s = i / N, u = j / M * 2 - 1, x = u * w(s) / 2, d = s * L - 0.06 * u * u * smooth(0.8, 1, s);
    pos.push(x, 0.0025 * (1 - u * u) * (1 - s), -d); uv.push(x, d);
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); blade.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); blade.setIndex(idx);
  // trilhos: perfil triangular que afina até sumir a 80% da pá
  const rp = [], ri = [], R = 12;
  for (const sx of [-1, 1]) for (let i = 0; i <= R; i++) {
    const s = i / R * 0.8, h = 0.03 * Math.pow(1 - s / 0.8, 0.8) + 0.002, x = sx * w(s) / 2, d = s * L, o = rp.length / 3;
    rp.push(x, 0, -d, x - sx * 0.006, h, -d, x - sx * 0.014, 0, -d);
    if (i < R) for (const [a, b] of [[0, 1], [1, 2]]) ri.push(o + a, o + 3 + a, o + b, o + 3 + a, o + 3 + b, o + b);
  }
  const rail = new THREE.BufferGeometry(); rail.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rail.setIndex(ri);
  for (const g of [blade, rail]) { g.userData.base = g.attributes.position.array.slice(); g.computeVertexNormals(); g.computeBoundingSphere(); g.boundingSphere.radius *= 1.4; }
  return [blade, rail];
}
const _fb = new Float32Array(33 * 3);
// curva a pá: ângulo cresce da raiz (rígida, dentro do calçador) até a ponta
function bendFin(fin, A) {
  if (Math.abs(A - (fin.userData.A ?? 9)) < 0.003) return;
  fin.userData.A = A;
  const N = 32, st = FIN_L / N; let y = 0, z = 0;
  for (let i = 0; i <= N; i++) { const a = A * Math.pow(i / N, 1.7); _fb[i * 3] = y; _fb[i * 3 + 1] = z; _fb[i * 3 + 2] = a; y += Math.sin(a) * st; z -= Math.cos(a) * st; }
  for (const g of fin.userData.geos) {
    const b = g.userData.base, p = g.attributes.position.array;
    for (let k = 0; k < b.length; k += 3) {
      const f = clamp(-b[k + 2] / st, 0, N - 0.001), i = f | 0, u = f - i, q = i * 3;
      const Y = _fb[q] + (_fb[q + 3] - _fb[q]) * u, Z = _fb[q + 1] + (_fb[q + 4] - _fb[q + 1]) * u, a = _fb[q + 2] + (_fb[q + 5] - _fb[q + 2]) * u;
      p[k] = b[k]; p[k + 1] = Y + b[k + 1] * Math.cos(a); p[k + 2] = Z + b[k + 1] * Math.sin(a);
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  }
}
function buildDiver(withGun) {
  gtex();
  const suit = new THREE.MeshStandardMaterial({ map: _camoT, roughness: 0.82 });
  const neo = new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.75 });
  const rub = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.55 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc28a62, roughness: 0.6 });
  const lead = new THREE.MeshStandardMaterial({ color: 0x3c3f42, metalness: 0.3, roughness: 0.65 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.85, roughness: 0.3 });
  const finM = new THREE.MeshStandardMaterial({ map: _carbT, roughness: 0.3, metalness: 0.35, side: THREE.DoubleSide });
  for (const m of [suit, neo, rub, skin, lead, steel, finM]) uwify(m, { key: 'dv' });
  const J = () => new THREE.Group();
  const mesh = (geo, m, par, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
  const ball = (r, m, par, x, y, z) => mesh(new THREE.SphereGeometry(r, 14, 10), m, par, x, y, z);
  const root = J();
  // tronco: ombros largos, cintura, glúteos; peito mais fundo na frente, lombar mais rasa atrás
  const fd = knots([[-0.15, 0.62], [-0.04, 0.62], [0.13, 0.58], [0.3, 0.7], [0.42, 0.74], [0.53, 0.6], [0.64, 0.92]]);
  const bd = knots([[-0.15, 0.7], [-0.05, 0.84], [0.1, 0.56], [0.3, 0.62], [0.45, 0.66], [0.55, 0.6], [0.64, 0.92]]);
  const prof = [[0, -0.155], [0.11, -0.148], [0.155, -0.1], [0.168, -0.04], [0.16, 0.04], [0.143, 0.13], [0.15, 0.22], [0.167, 0.32], [0.18, 0.4], [0.183, 0.46], [0.172, 0.52], [0.13, 0.575], [0.075, 0.605], [0.058, 0.635], [0.054, 0.68], [0, 0.685]];
  mesh(bodyLathe(prof, 28, fd, bd), suit, root);
  // pad de carregamento no peito (apoio da coronha)
  const pad = mesh(new THREE.CapsuleGeometry(0.05, 0.06, 4, 10), neo, root, 0, 0.3, -0.112); pad.scale.set(1.15, 1, 0.22);
  // cinto marselhês com chumbos e fivela inox
  mesh(bodyLathe([[0.172, -0.045], [0.176, -0.02], [0.172, 0.005]], 28, fd, bd), rub, root);
  mesh(new THREE.BoxGeometry(0.06, 0.04, 0.012), steel, root, 0, -0.02, -0.112);
  for (const a of [-1.05, -0.62, 0.62, 1.05, 2.2, -2.2]) { const w = mesh(new THREE.CapsuleGeometry(0.018, 0.035, 3, 8), lead, root, Math.sin(a) * 0.174, -0.02, -Math.cos(a) * 0.174 * (Math.cos(a) > 0 ? fd(-0.02) : bd(-0.02))); w.rotation.set(0, -a, Math.PI / 2); w.scale.set(1, 1, 0.6); }
  // cabeça: capuz com abertura do rosto, máscara de baixo volume com tira e snorkel
  const neck = J(); neck.position.set(0, 0.63, 0); root.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.104, 22, 18), neo, neck, 0, 0.115, 0.006); head.scale.set(0.9, 1.12, 1.02);
  mesh(new THREE.CylinderGeometry(0.06, 0.068, 0.09, 16), neo, neck, 0, 0.0, 0.004);
  const face = mesh(new THREE.SphereGeometry(0.07, 16, 12), skin, neck, 0, 0.075, -0.064); face.scale.set(0.78, 0.92, 0.5);
  const mask = mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.034, 20), rub, neck, 0, 0.128, -0.098); mask.rotation.x = Math.PI / 2; mask.scale.set(2.05, 1, 0.92);
  mesh(new THREE.ConeGeometry(0.022, 0.034, 10), rub, neck, 0, 0.088, -0.108).rotation.x = Math.PI;
  for (const sx of [-1, 1]) { const l = mesh(new THREE.CircleGeometry(0.026, 18), new THREE.MeshStandardMaterial({ color: 0x0a1418, metalness: 0.9, roughness: 0.05 }), neck, sx * 0.034, 0.132, -0.1162); l.rotation.y = Math.PI; l.scale.set(1.08, 0.9, 1); }
  const strap = mesh(new THREE.TorusGeometry(0.1, 0.007, 6, 28), rub, neck, 0, 0.13, 0.006); strap.scale.set(0.95, 1, 1.05); strap.rotation.x = Math.PI / 2 + 0.25;
  const snk = new THREE.CatmullRomCurve3([new V3(0.0, 0.05, -0.1), new V3(0.06, 0.06, -0.09), new V3(0.1, 0.12, -0.04), new V3(0.105, 0.26, 0.0), new V3(0.09, 0.33, 0.04)]);
  mesh(new THREE.TubeGeometry(snk, 20, 0.011, 8), rub, neck);
  // mão de luva de neoprene: palma, dedos juntos levemente fechados e polegar
  const hand = (wr, sx, curl) => {
    ball(0.03, neo, wr, 0, -0.012, 0);
    const palm = ball(0.04, neo, wr, 0, -0.055, 0); palm.scale.set(1.05, 1.15, 0.5);
    const fg = J(); fg.position.set(0, -0.09, 0); fg.rotation.x = -curl; wr.add(fg);
    const fi = mesh(new THREE.CapsuleGeometry(0.02, 0.05, 4, 10), neo, fg, 0, -0.035, 0); fi.scale.set(1.9, 1, 0.75);
    const fg2 = J(); fg2.position.set(0, -0.065, 0); fg2.rotation.x = -curl * 0.9; fg.add(fg2);
    const tip = mesh(new THREE.CapsuleGeometry(0.018, 0.03, 4, 10), neo, fg2, 0, -0.022, 0); tip.scale.set(2, 1, 0.75);
    const th = mesh(new THREE.CapsuleGeometry(0.013, 0.045, 4, 8), neo, wr, sx * -0.035, -0.06, -0.018); th.rotation.set(-0.4 - curl * 0.5, 0, sx * -0.5);
  };
  // braços: bíceps, antebraço afinando até o punho
  const arm = (sx, curl) => {
    const sh = J(); sh.position.set(sx * 0.188, 0.5, 0); root.add(sh);
    ball(0.064, suit, sh, sx * 0.004, 0.0, 0).scale.set(1, 0.95, 0.9);
    mesh(bodyLathe([[0, -0.3], [0.039, -0.29], [0.042, -0.25], [0.05, -0.16], [0.054, -0.08], [0.058, 0], [0, 0.04]], 16, knots([[-0.3, 0.95], [-0.15, 1.08], [0, 1]]), knots([[-0.3, 0.95], [0, 0.95]])), suit, sh);
    const el = J(); el.position.set(0, -0.28, 0); sh.add(el);
    ball(0.041, suit, el, 0, 0, 0);
    mesh(bodyLathe([[0, -0.265], [0.028, -0.255], [0.03, -0.22], [0.041, -0.13], [0.047, -0.055], [0.041, 0], [0, 0.03]], 16, knots([[0, 0.9]]), knots([[0, 0.9]])), suit, el);
    const wr = J(); wr.position.set(0, -0.25, 0); el.add(wr);
    mesh(new THREE.CylinderGeometry(0.031, 0.032, 0.025, 14), neo, wr, 0, 0.006, 0);
    hand(wr, sx, curl);
    return { sh, el, wr };
  };
  const aL = arm(-1, 0.35), aR = arm(1, 1.25);
  // pernas: coxa, joelho com joelheira, panturrilha saliente atrás; nadadeira longa de apneia
  const leg = (sx) => {
    const th = J(); th.position.set(sx * 0.088, -0.1, 0); root.add(th);
    mesh(bodyLathe([[0, -0.46], [0.05, -0.45], [0.055, -0.4], [0.066, -0.3], [0.078, -0.18], [0.087, -0.06], [0.086, 0], [0.06, 0.045], [0, 0.055]], 18, knots([[-0.4, 0.92], [-0.2, 1.0]]), knots([[-0.4, 0.88], [-0.1, 0.95]])), suit, th);
    const kn = J(); kn.position.set(0, -0.43, 0); th.add(kn);
    ball(0.053, suit, kn, 0, 0, 0);
    const kp = mesh(new THREE.CapsuleGeometry(0.035, 0.035, 4, 10), neo, kn, 0, -0.01, -0.038); kp.scale.set(1.15, 1, 0.45);
    mesh(bodyLathe([[0, -0.435], [0.033, -0.425], [0.035, -0.38], [0.044, -0.29], [0.054, -0.17], [0.054, -0.09], [0.05, 0], [0, 0.03]], 18, knots([[0, 0.85]]), knots([[-0.32, 0.95], [-0.17, 1.22], [-0.05, 1.0]])), suit, kn);
    if (sx > 0) { const kf = mesh(new THREE.BoxGeometry(0.026, 0.15, 0.045), rub, kn, -0.045, -0.22, 0.008); kf.rotation.z = 0.06; mesh(new THREE.BoxGeometry(0.03, 0.012, 0.05), rub, kn, -0.047, -0.12, 0.008); } // faca na panturrilha
    const an = J(); an.position.set(0, -0.42, 0); kn.add(an);
    ball(0.037, neo, an, 0, 0, 0);
    const foot = mesh(new THREE.CapsuleGeometry(0.038, 0.17, 4, 12), neo, an, 0, -0.035, -0.065); foot.rotation.x = Math.PI / 2; foot.scale.set(1.15, 1, 0.78);
    // calçador fechado de borracha + pá de carbono
    const fin = J(); an.add(fin);
    const pk = mesh(new THREE.CapsuleGeometry(0.047, 0.19, 4, 14), rub, fin, 0, -0.036, -0.075); pk.rotation.x = Math.PI / 2; pk.scale.set(1.12, 1, 0.84);
    const sole = mesh(new THREE.BoxGeometry(0.105, 0.012, 0.2), rub, fin, 0, -0.072, -0.11); sole.rotation.x = -0.12;
    const bl = J(); bl.position.set(0, -0.07, -0.15); bl.rotation.x = FIN_ANG; fin.add(bl);
    const [bg, rg] = finGeos(); mesh(bg, finM, bl); mesh(rg, rub, bl);
    bl.userData.geos = [bg, rg];
    return { th, kn, an, fin, blade: bl };
  };
  const lL = leg(-1), lR = leg(1);
  scene.add(root);
  const rig = { root, neck, aL, aR, lL, lR, handR: aR.wr, suitMat: suit };
  return rig;
}
// poses
function poseDiver(r, mode, t, kick, kickAmp) {
  if (mode === 'drive') {
    r.neck.rotation.set(0.1, 0, 0);
    for (const [a, s] of [[r.aL, -1], [r.aR, 1]]) { a.sh.rotation.set(0.75, 0, s * 0.18); a.el.rotation.set(0.65, 0, 0); a.wr.rotation.set(0.2, 0, 0); }
    const sway = Math.sin(t * 1.3) * 0.04;
    for (const [l, s] of [[r.lL, -1], [r.lR, 1]]) { l.th.rotation.set(-0.08 + sway * s, 0, s * 0.05); l.kn.rotation.set(0.16, 0, 0); l.an.rotation.set(-0.08, 0, 0); l.fin.visible = false; }
    return;
  }
  // nadando: corpo horizontal (orientação no root), braço direito estendido com a arma
  r.neck.rotation.set(1.0, 0, 0);
  r.aR.sh.rotation.set(Math.PI - 0.12, 0, -0.08); r.aR.el.rotation.set(0.12, 0, 0); r.aR.wr.rotation.set(0, 0, 0);
  r.aL.sh.rotation.set(0.15 + Math.sin(kick * 0.5) * 0.05 * kickAmp, 0, -0.14); r.aL.el.rotation.set(0.25, 0, 0); r.aL.wr.rotation.set(0.1, 0, 0.15);
  // pernada de apneia: o movimento nasce no quadril, joelho dobra pouco na recuperação, tornozelo estendido;
  // a pá flexiona contra o sentido do movimento (atraso de fase de 90°)
  for (const [l, s] of [[r.lL, 1], [r.lR, -1]]) {
    const ph = kick + (s > 0 ? 0 : Math.PI), k = Math.sin(ph) * kickAmp, v = Math.cos(ph) * kickAmp;
    l.th.rotation.set(0.05 + k * 0.32, 0, -s * 0.035);
    l.kn.rotation.set(-0.1 - Math.max(0, -k) * 0.42 - Math.max(0, v) * 0.12, 0, 0);
    l.an.rotation.set(-1.02 + k * 0.1, 0, s * 0.04);
    l.fin.visible = true; bendFin(l.blade, -v * 0.5 - 0.04);
  }
}
function updateDiver(dt, t) {
  if (!DIVER) return;
  const show = P.mode === 'swim' && THIRD;
  DIVER.root.visible = show;
  if (!show) return;
  const mv = Math.min(1, Math.hypot(IN.jx, IN.jy) + (IN.held.up ? 1 : 0));
  P.kickAnim = (P.kickAnim || 0) + dt * (2 + mv * 5);
  const bodyP = P.under ? clamp(P.pitch, -1.3, 1.2) * 0.85 : 0;
  const fw = _a.set(-Math.sin(P.yaw) * Math.cos(bodyP), Math.sin(bodyP), -Math.cos(P.yaw) * Math.cos(bodyP));
  DIVER.root.position.set(P.pos.x - fw.x * 0.62, P.pos.y - fw.y * 0.62 - (P.under ? 0.12 : 0.18), P.pos.z - fw.z * 0.62);
  DIVER.root.rotation.set(bodyP - Math.PI / 2, P.yaw, Math.sin(P.kickAnim * 0.5) * 0.05 * mv, 'YXZ');
  poseDiver(DIVER, 'swim', t, P.kickAnim, 0.25 + mv * 0.75);
}
// câmera de 3ª pessoa
function thirdPersonCam(t) {
  const op = P.pitch * 0.55, cp = Math.cos(op), fwd = _a.set(-Math.sin(P.yaw) * cp, Math.sin(op), -Math.cos(P.yaw) * cp);
  const tall = camera.aspect < 1, back = tall ? 6.0 : 5.2, up = (P.under ? 1.2 : 1.4) * (tall ? 1.2 : 1), sideK = 0.55, rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  const c = new V3(P.pos.x - fwd.x * back + rx * sideK, P.pos.y - fwd.y * back + up, P.pos.z - fwd.z * back + rz * sideK);
  const h = H(c.x, c.z); if (c.y < h + 0.35) c.y = h + 0.35;
  pushOutRocks(c, 0.3);
  camera.position.lerp(c, 0.35);
  camera.rotation.set(P.pitch - 0.2, P.yaw, 0, 'YXZ');
}

// ================= loja, equipamentos, naufrágio, parcel e campeonato =================
const SUITS = [
  { name: 'Roupa 3 mm lisa', o2: 1, shy: 1, price: 0, desc: 'Básica, preta. O peixe vê você de longe.' },
  { name: 'Roupa 5 mm camuflada', o2: 0.93, shy: 0.85, price: 900, desc: 'Camuflagem de costão: o peixe estranha menos. Mais quente, gasta menos fôlego.' },
  { name: 'Roupa 7 mm camuflada pro', o2: 0.86, shy: 0.72, price: 2400, desc: 'Corte de apneia, aberta por dentro. A melhor para fazer espera.' },
];
const MASKS = [
  { name: 'Máscara padrão', o2: 1, fov: 0, price: 0, desc: 'Vem com o kit.' },
  { name: 'Máscara baixo volume', o2: 0.95, fov: 6, price: 450, desc: 'Menos ar para compensar e campo de visão maior.' },
];
const BOATS = [
  { name: 'Lancha 21 pés', max: 30, tank: 100, scale: 1, price: 0, desc: 'Motor de popa 150 hp.' },
  { name: 'Lancha 26 pés', max: 36, tank: 150, scale: 1.15, price: 9000, desc: 'Motor 250 hp, tanque de 150 L.' },
  { name: 'Lancha 32 pés', max: 42, tank: 220, scale: 1.3, price: 24000, desc: 'Dois motores 300 hp, tanque de 220 L. Chega no parcel voando.' },
];
const LIGHT_PRICE = 600;
const suitNow = () => SUITS[SV.suit || 0], maskNow = () => MASKS[SV.mask || 0], boatNow = () => BOATS[SV.boat || 0];
const tankMax = () => boatNow().tank;
const NAUF = { x: 40, z: -430 }, AVENT = { x: 640, z: -600 };

// ---------- relevo extra (chamado dentro de H) ----------
function Hextra(x, z, h) {
  const dA = Math.hypot(x - AVENT.x, z - AVENT.z);
  if (dA < 320) { h = Math.min(h, lerp(-33, h, smooth(90, 300, dA))); h = Math.max(h, lerp(-13, -33, smooth(0, 75, dA)) + 1.5 * fbm(x * 0.07, z * 0.07, 2)); }
  const dN = Math.hypot(x - NAUF.x, z - NAUF.z);
  if (dN < 120) h = lerp(h, -19 + 0.3 * fbm(x * 0.1, z * 0.1, 2), 1 - smooth(35, 110, dN));
  return h;
}
// ---------- pedras do parcel (antes de instanciar as pedras) ----------
function extraRocks() {
  const r = mulberry(77);
  for (let i = 0; i < 110; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.7) * 52, x = AVENT.x + Math.cos(a) * d, z = AVENT.z + Math.sin(a) * d;
    const rad = lerp(5.2, 1.3, d / 52) * (0.6 + r() * 0.7);
    const R = addRock(x, H(x, z) + rad * 0.25, z, rad, 'aventureiro');
    if (rad > 2.4 && r() < 0.55) addHole(R, r() * TAU, 'aventureiro');
  }
  for (let i = 0; i < 18; i++) { const x = NAUF.x + rand(-30, 30), z = NAUF.z + rand(-30, 30); const h = H(x, z); addRock(x, h + 0.4, z, rand(1, 2.2), 'naufragio'); }
}
// ---------- casco afundado ----------
function buildWreck() {
  const L = 34, B = 7.5, D = 5;
  const sh = new THREE.Shape();
  sh.moveTo(-B / 2, -L / 2); sh.lineTo(B / 2, -L / 2); sh.lineTo(B / 2, L * 0.22); sh.quadraticCurveTo(B * 0.42, L * 0.44, 0, L / 2); sh.quadraticCurveTo(-B * 0.42, L * 0.44, -B / 2, L * 0.22); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: D, steps: 3, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 2 });
  hg.rotateX(Math.PI / 2); hg.translate(0, D / 2, 0);
  const p = hg.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) p.setX(i, p.getX(i) * lerp(1, 0.45, -y / (D / 2))); }
  hg.computeVertexNormals();
  const rt = rockTex(); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(4, 4);
  const rust = uwify(new THREE.MeshStandardMaterial({ color: 0x7a5038, map: rt, roughness: 1, metalness: 0.2 }), { key: 'wr' });
  const dark = uwify(new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 1 }), { key: 'wd' });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(hg, rust));
  const house = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.2, 6), rust); house.position.set(0, D / 2 + 1.6, -6); g.add(house);
  for (const z of [-7.5, -4.5]) for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 1.2), dark); w.position.set(sx * 2.78, D / 2 + 2, z); g.add(w); }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 14, 8), rust); mast.position.set(4, -1.2, 6); mast.rotation.set(0.15, 0, 1.25); g.add(mast);
  for (const z of [-12, -1, 9]) for (const sx of [-1, 1]) { const hole = new THREE.Mesh(new THREE.CircleGeometry(0.9, 10), dark); hole.position.set(sx * (B / 2 + 0.32), 0.2, z); hole.rotation.y = sx * Math.PI / 2; g.add(hole); }
  const hy = H(NAUF.x, NAUF.z);
  g.position.set(NAUF.x, hy + 1.4, NAUF.z); g.rotation.set(-0.04, 0.6, 0.22);
  scene.add(g); g.updateMatrixWorld(true);
  const v = new V3();
  for (let s = -L / 2 + 3; s <= L / 2 - 3; s += 3.2) { v.set(0, 0.6, s); g.localToWorld(v); const R = addRock(v.x, v.y, v.z, B / 2 + 0.6, 'naufragio'); R.sy = 0.75; }
  for (const s of [-12, -1, 9]) for (const sx of [-1, 1]) {
    v.set(sx * (B / 2 + 1.3), 0.2, s); g.localToWorld(v);
    const a = Math.atan2(v.z - g.position.z, v.x - g.position.x);
    HOLES.push({ x: v.x, z: v.z, y: Math.max(v.y, H(v.x, v.z) + 0.5), dir: a, spot: 'naufragio', used: 0 });
  }
}

// ---------- equipamentos aplicados ----------
let DLIGHT = null;
function initExtra() {
  DLIGHT = new THREE.SpotLight(0xfff2dc, 0, 28, 0.42, 0.6, 1.3);
  DLIGHT.position.set(0.15, -0.1, 0); DLIGHT.target.position.set(0, -0.3, -6); camera.add(DLIGHT, DLIGHT.target);
  applyGear();
}
function applyGear() {
  if (BOAT.mesh) BOAT.mesh.scale.setScalar(boatNow().scale);
  SV.fuel = Math.min(SV.fuel, tankMax());
  if (DIVER && DIVER.suitMat) { const m = DIVER.suitMat; if ((SV.suit || 0) === 0) { m.map = null; m.color.set(0x1b1e22); } else { m.map = _camoT; m.color.set(SV.suit === 2 ? 0xd8e0c8 : 0xffffff); } m.needsUpdate = true; }
}
function updateLight() {
  if (!DLIGHT) return;
  const on = SV.light && P.mode === 'swim' && camUnder && (-camera.position.y > 7 || camMurk > 0.3);
  DLIGHT.intensity = lerp(DLIGHT.intensity, on ? 3.2 : 0, 0.2);
}

// ---------- loja / marina ----------
let shopTab = 'sell', shopAtMarina = false;
function openShop(atMarina) { shopAtMarina = !!atMarina; paused = true; $('marinaPanel').classList.remove('hide'); renderShop(); }
function openMarina() { openShop(true); }
function buyBtn(attr, price, label) { return `<button class="btn" ${attr} ${SV.money < price ? 'disabled' : ''}>${label || fmtR(price)}</button>`; }
function renderShop() {
  const at = shopAtMarina;
  $('marinaPanel').querySelector('h2').textContent = at ? 'Marina Balneário' : 'Loja Deep Spear';
  $('mSub').textContent = `Saldo: ${fmtR(SV.money)} · Combustível: ${Math.round(SV.fuel)}/${tankMax()} L · Fôlego: ${maxBreath()} s`;
  const tabs = [['sell', 'Vender pescado'], ['guns', 'Arbaletes'], ['gear', 'Roupa e acessórios'], ['boats', 'Lanchas'], ['fuel', 'Combustível'], ['comp', 'Campeonato'], ['rec', 'Recordes']];
  $('mTabs').innerHTML = tabs.map(([k, n]) => `<div class="tab ${k === shopTab ? 'on' : ''}" data-k="${k}">${n}</div>`).join('');
  $('mTabs').querySelectorAll('.tab').forEach(t => t.onclick = () => { shopTab = t.dataset.k; AU.click(); renderShop(); });
  let h = '';
  if (shopTab === 'sell') {
    const rate = at ? 1 : 0.75;
    const tot = SV.cooler.reduce((s, f) => s + f.kg * SPECIES[f.key].price, 0) * rate;
    const note = at ? 'Preço cheio da peixaria da marina.' : 'Longe da marina, o atravessador paga 75% do preço. Na marina você recebe o valor cheio.';
    h = `<div class="it" style="margin-bottom:8px"><div class="d">${note}${P.mode === 'swim' ? ' O que está na fieira só pode ser vendido depois que você subir no barco.' : ''}</div></div>`;
    h += SV.cooler.length ? `<div class="list">${SV.cooler.map(f => `<div class="it"><div><div class="n">${f.name}</div><div class="d">${f.cm} cm · ${fmtKg(f.kg)} kg · ${fmtR(SPECIES[f.key].price * rate)}/kg</div></div><b>${fmtR(f.kg * SPECIES[f.key].price * rate)}</b></div>`).join('')}</div>
      <div class="row2"><span>Total: <b style="color:var(--acc)">${fmtR(tot)}</b></span><button class="btn gold" id="sellAll">VENDER TUDO</button></div>`
      : '<div class="it">A caixa térmica está vazia. Vá pescar!</div>';
  }
  if (shopTab === 'guns') h = '<div class="list">' + GUNS.map(g => {
    const own = SV.guns.includes(g.id), eq = SV.gun === g.id;
    return `<div class="it"><div><div class="n">${g.name}</div><div class="d">Alcance ${fmtKg(g.range)} m · ${g.pneu ? 'pneumático' : g.bands + ' elástico(s)'} · segura peixe de até ~${g.power} kg · ${g.desc}</div></div>
      ${eq ? '<span class="d">EM USO</span>' : own ? `<button class="btn alt" data-eq="${g.id}">USAR</button>` : buyBtn(`data-buy="${g.id}"`, g.price)}</div>`;
  }).join('') + '</div>';
  if (shopTab === 'gear') {
    const lvl = SV.apnea, ap = 350 * (lvl + 1);
    h = '<div class="list">';
    h += SUITS.map((s, i) => `<div class="it"><div><div class="n">${s.name}</div><div class="d">${s.desc}</div></div>${(SV.suit || 0) === i ? '<span class="d">EM USO</span>' : (SV.suits || [0]).includes(i) ? `<button class="btn alt" data-suit="${i}">USAR</button>` : buyBtn(`data-bsuit="${i}"`, s.price)}</div>`).join('');
    h += MASKS.map((s, i) => `<div class="it"><div><div class="n">${s.name}</div><div class="d">${s.desc}</div></div>${(SV.mask || 0) === i ? '<span class="d">EM USO</span>' : (SV.masks || [0]).includes(i) ? `<button class="btn alt" data-mask="${i}">USAR</button>` : buyBtn(`data-bmask="${i}"`, s.price)}</div>`).join('');
    h += `<div class="it"><div><div class="n">Lanterna de mergulho</div><div class="d">Acende sozinha abaixo de 7 m e na água turva. Ilumina toca e naufrágio.</div></div>${SV.light ? '<span class="d">TEM</span>' : buyBtn('id="buyLight"', LIGHT_PRICE)}</div>`;
    h += FINS.map((f, i) => `<div class="it"><div><div class="n">${f.name}</div><div class="d">Velocidade de nado ×${f.k.toFixed(2)}</div></div>${i <= SV.fins ? `<span class="d">${i === SV.fins ? 'EM USO' : 'TEM'}</span>` : `<button class="btn" data-fin="${i}" ${SV.money < f.price || i !== SV.fins + 1 ? 'disabled' : ''}>${fmtR(f.price)}</button>`}</div>`).join('');
    h += `<div class="it"><div><div class="n">Treino de apneia · nível ${lvl}/5</div><div class="d">+10 s de fôlego por nível. Hoje: ${maxBreath()} s.</div></div>${lvl >= 5 ? '<span class="d">MÁXIMO</span>' : buyBtn('id="buyAp"', ap)}</div></div>`;
  }
  if (shopTab === 'boats') h = '<div class="list">' + BOATS.map((b, i) => `<div class="it"><div><div class="n">${b.name}</div><div class="d">${b.desc} Velocidade máx. ${Math.round(b.max * 1.94)} nós · tanque ${b.tank} L.</div></div>${(SV.boat || 0) === i ? '<span class="d">EM USO</span>' : (SV.boats || [0]).includes(i) ? `<button class="btn alt" data-boat="${i}">USAR</button>` : buyBtn(`data-bboat="${i}"`, b.price)}</div>`).join('') + '</div>';
  if (shopTab === 'fuel') {
    const need = tankMax() - SV.fuel, cost = need * 6.5;
    h = at ? `<div class="list"><div class="it"><div><div class="n">Gasolina · ${Math.round(SV.fuel)}/${tankMax()} L</div><div class="d">R$ 6,50 por litro.</div></div><button class="btn" id="fill" ${need < 1 || SV.money < 7 ? 'disabled' : ''}>ENCHER ${fmtR(Math.min(cost, Math.max(0, SV.money)))}</button></div></div>`
      : `<div class="it"><div><div class="n">Gasolina · ${Math.round(SV.fuel)}/${tankMax()} L</div><div class="d">Só dá para abastecer no posto da Marina Balneário.</div></div></div>`;
  }
  if (shopTab === 'comp') {
    h = `<div class="it" style="margin-bottom:8px"><div><div class="n">Campeonato de pesca sub · 10 minutos</div><div class="d">Você contra 3 pescadores. Ganha quem pegar mais peixes dentro da medida; empate decide pelo peso. Inscrição R$ 100. Prêmios: 1º R$ 1.500 · 2º R$ 600 · 3º R$ 250.</div></div></div><div class="list">` +
      SPOTS.filter(s => s.r).map(s => `<div class="it"><div><div class="n">${s.name}</div><div class="d">${s.depth}</div></div><button class="btn gold" data-comp="${s.id}" ${COMP.on || SV.money < 100 ? 'disabled' : ''}>COMPETIR</button></div>`).join('') + '</div>';
  }
  if (shopTab === 'rec') h = '<div class="list">' + Object.keys(SPECIES).filter(k => !SPECIES[k].protected && !SPECIES[k].ornamental).map(k => `<div class="it"><div><div class="n">${SPECIES[k].name}</div><div class="d">Medida mínima ${Math.round(SPECIES[k].min * 100)} cm · ${fmtR(SPECIES[k].price)}/kg</div></div><b>${SV.best[k] ? fmtKg(SV.best[k]) + ' kg' : '—'}</b></div>`).join('') + `<div class="it"><div class="n">Campeonatos vencidos</div><b>${SV.wins || 0}</b></div></div>`;
  $('mBody').innerHTML = h;
  const B = $('mBody'), on = (sel, fn) => B.querySelectorAll(sel).forEach(b => b.onclick = () => { fn(b); save(); renderShop(); });
  const pay = p => { if (SV.money < p) return false; SV.money -= p; AU.coin(); return true; };
  const sa = $('sellAll'); if (sa) sa.onclick = () => { const tot = SV.cooler.reduce((s, f) => s + f.kg * SPECIES[f.key].price, 0) * (at ? 1 : 0.75); SV.money += tot; SV.cooler = []; AU.coin(); toast(`Vendido por ${fmtR(tot)}!`, 3, 'gold'); save(); renderShop(); };
  on('[data-buy]', b => { const g = gunById(b.dataset.buy); if (pay(g.price)) { SV.guns.push(g.id); SV.gun = g.id; buildGun(g); } });
  on('[data-eq]', b => { SV.gun = b.dataset.eq; buildGun(gunById(SV.gun)); AU.click(); });
  on('[data-bsuit]', b => { const i = +b.dataset.bsuit; if (pay(SUITS[i].price)) { SV.suits = [...new Set([...(SV.suits || [0]), i])]; SV.suit = i; applyGear(); } });
  on('[data-suit]', b => { SV.suit = +b.dataset.suit; applyGear(); AU.click(); });
  on('[data-bmask]', b => { const i = +b.dataset.bmask; if (pay(MASKS[i].price)) { SV.masks = [...new Set([...(SV.masks || [0]), i])]; SV.mask = i; } });
  on('[data-mask]', b => { SV.mask = +b.dataset.mask; AU.click(); });
  on('[data-bboat]', b => { const i = +b.dataset.bboat; if (pay(BOATS[i].price)) { SV.boats = [...new Set([...(SV.boats || [0]), i])]; SV.boat = i; applyGear(); } });
  on('[data-boat]', b => { SV.boat = +b.dataset.boat; applyGear(); AU.click(); });
  on('[data-fin]', b => { const i = +b.dataset.fin; if (pay(FINS[i].price)) SV.fins = i; });
  on('[data-comp]', b => { closePanels(); startComp(b.dataset.comp); });
  const ap = $('buyAp'); if (ap) ap.onclick = () => { if (pay(350 * (SV.apnea + 1))) SV.apnea++; save(); renderShop(); };
  const bl = $('buyLight'); if (bl) bl.onclick = () => { if (pay(LIGHT_PRICE)) SV.light = true; save(); renderShop(); };
  const fl = $('fill'); if (fl) fl.onclick = () => { const L = Math.min(tankMax() - SV.fuel, SV.money / 6.5); SV.fuel += L; SV.money -= L * 6.5; AU.coin(); save(); renderShop(); };
}

// ---------- rig genérico (bots) ----------
function placeRig(r, pos, yaw, pitch, under, mv, kick) {
  const bp = under ? clamp(pitch, -1.3, 1.2) * 0.85 : 0;
  const fx = -Math.sin(yaw) * Math.cos(bp), fy = Math.sin(bp), fz = -Math.cos(yaw) * Math.cos(bp);
  r.root.position.set(pos.x - fx * 0.62, pos.y - fy * 0.62 - (under ? 0.12 : 0.18), pos.z - fz * 0.62);
  r.root.rotation.set(bp - Math.PI / 2, yaw, Math.sin(kick * 0.5) * 0.05 * mv, 'YXZ');
  poseDiver(r, 'swim', 0, kick, 0.25 + mv * 0.75);
}

// ---------- campeonato ----------
const COMP = { on: false, t: 0, spot: null, bots: [], me: { n: 0, kg: 0 } };
const BOT_DEF = [['Marcão', 0x1b1e22], ['Tainá', 0x23304a], ['Zé da Laje', 0x3b2b1e]];
const legalFish = f => f.alive && f.vis !== undefined && f.len >= f.sp.min && !f.sp.protected && !f.sp.ornamental && f.state !== 'hooked' && f.state !== 'dead';
function startComp(id) {
  const s = spotById(id); if (!s || COMP.on) return;
  if (SV.money < 100) { toast('Inscrição custa R$ 100.'); return; }
  SV.money -= 100; save();
  if (P.mode === 'swim') climbBoat();
  let bx = s.x + 18, bz = s.z + 18; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; const x = s.x + Math.cos(a) * 20, z = s.z + Math.sin(a) * 20; if (H(x, z) < -4) { bx = x; bz = z; break; } }
  BOAT.pos.set(bx, 0, bz); BOAT.speed = 0; if (BOAT.vel) BOAT.vel.set(0, 0, 0); BOAT.anchored = false; toggleAnchor();
  jumpIn(); P.o2 = 1;
  COMP.on = true; COMP.t = 600; COMP.spot = s; COMP.me = { n: 0, kg: 0 };
  COMP.bots = BOT_DEF.map(([name, col], i) => {
    const rig = buildDiver(false); rig.suitMat.map = null; rig.suitMat.color.set(col); rig.suitMat.needsUpdate = true;
    const gm = buildGunMesh(gunById(i === 0 ? 'a110' : 'a90'), true); gm.g.rotation.set(-Math.PI / 2, 0, 0); gm.g.position.set(0, -0.09, 0); rig.handR.add(gm.g);
    const a = rand(0, TAU), pos = new V3(s.x + Math.cos(a) * 12, -0.2, s.z + Math.sin(a) * 12);
    return { name, rig, pos, vel: new V3(), yaw: rand(0, TAU), pitch: 0, state: 'surf', t: rand(4, 10), target: null, aimT: 0, n: 0, kg: 0, kick: 0, skill: [0.24, 0.2, 0.16][i] };
  });
  $('compHud').classList.remove('hide');
  toast(`Valendo! 10 minutos na ${s.name}. Peixe abaixo da medida não conta.`, 5, 'gold'); AU.coin();
}
function compOnCatch(f) { if (!COMP.on) return; COMP.me.n++; COMP.me.kg += f.kg; }
function updateComp(dt, t) {
  if (!COMP.on) return;
  COMP.t -= dt;
  const s = COMP.spot;
  for (const b of COMP.bots) {
    const sy = waveH(b.pos.x, b.pos.z, t);
    let des = _t1.set(0, 0, 0), under = b.state !== 'surf';
    b.t -= dt;
    if (b.state === 'surf') {
      b.pos.y = sy - 0.15; des.set(s.x - b.pos.x, 0, s.z - b.pos.z); if (des.length() > 8) des.normalize().multiplyScalar(0.6); else des.set(0, 0, 0);
      if (b.t <= 0) { b.state = 'dive'; b.t = rand(35, 50); b.target = null; spawnBubbles(b.pos, 10, 0.3); }
    } else if (b.state === 'dive') {
      if (!b.target || !legalFish(b.target) || b.target.pos.distanceTo(b.pos) > 35) {
        let best = null, bd = 30; for (const f of FISHES) { if (!legalFish(f)) continue; const d = f.pos.distanceTo(b.pos); if (d < bd && Math.hypot(f.pos.x - s.x, f.pos.z - s.z) < s.r * 1.8) { bd = d; best = f; } }
        b.target = best; b.aimT = 0;
      }
      if (b.target) {
        const tp = b.target.pos; des.subVectors(tp, b.pos); const d = des.length();
        if (d > 3.4) des.multiplyScalar(1.35 / d); else { des.set(0, 0, 0); b.aimT += dt; b.yaw = Math.atan2(-(tp.x - b.pos.x), -(tp.z - b.pos.z)); }
        if (b.aimT > rand(1.8, 3.4)) {
          b.aimT = 0;
          const f = b.target, ok = Math.random() < b.skill * (f.state === 'curious' || f.state === 'hidden' ? 1.4 : 1);
          if (ok) {
            b.n++; b.kg += f.kg; spawnBubbles(f.pos, 14, 0.3);
            if (camera.position.distanceTo(f.pos) < 25) AU.thud();
            toast(`${b.name} pegou ${f.sp.name.toLowerCase()} de ${fmtKg(f.kg)} kg`, 2.2);
            RESPAWN.push({ key: f.key, spot: f.spot.id, n: 1, t: performance.now() / 1000 + rand(60, 120) });
            f.remove();
          } else f.startFlee();
          b.target = null;
        }
      } else des.set(Math.sin(t * 0.3 + b.yaw), -0.2, Math.cos(t * 0.3 + b.yaw)).multiplyScalar(0.8);
      if (b.t <= 0) b.state = 'up';
    } else if (b.state === 'up') {
      des.set(0, 1.3, 0);
      if (b.pos.y > sy - 0.5) { b.state = 'surf'; b.t = rand(18, 28); }
    }
    b.vel.lerp(des, clamp(dt * 2, 0, 1));
    b.pos.addScaledVector(b.vel, dt);
    const h = H(b.pos.x, b.pos.z); if (b.pos.y < h + 0.5) b.pos.y = h + 0.5;
    if (under) pushOutRocks(b.pos, 0.45);
    const v = b.vel.length();
    if (v > 0.1) { b.yaw += angDiff(b.yaw, Math.atan2(-b.vel.x, -b.vel.z)) * clamp(dt * 3, 0, 1); b.pitch = lerp(b.pitch, clamp(Math.atan2(b.vel.y, Math.hypot(b.vel.x, b.vel.z)), -1.2, 1.2), clamp(dt * 3, 0, 1)); }
    b.kick += dt * (2 + Math.min(1, v) * 5);
    b.rig.root.visible = camera.position.distanceTo(b.pos) < 90;
    placeRig(b.rig, b.pos, b.yaw, under ? b.pitch : 0, under, Math.min(1, v), b.kick);
  }
  // placar
  const rows = [{ name: 'Você', n: COMP.me.n, kg: COMP.me.kg, me: true }, ...COMP.bots.map(b => ({ name: b.name, n: b.n, kg: b.kg }))].sort((a, b) => b.n - a.n || b.kg - a.kg);
  const mm = Math.max(0, Math.ceil(COMP.t)), tt = `${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}`;
  $('compHud').innerHTML = `<div class="ct ${COMP.t < 60 ? 'low' : ''}">⏱ ${tt}</div>` + rows.map((r, i) => `<div class="cr ${r.me ? 'me' : ''}"><span>${i + 1}º ${r.name}</span><b>${r.n} · ${fmtKg(r.kg)} kg</b></div>`).join('');
  if (COMP.t <= 0) endComp(rows);
}
function endComp(rows) {
  COMP.on = false; $('compHud').classList.add('hide');
  for (const b of COMP.bots) scene.remove(b.rig.root); COMP.bots = [];
  const pos = rows.findIndex(r => r.me), prize = [1500, 600, 250, 0][pos];
  SV.money += prize; if (pos === 0) SV.wins = (SV.wins || 0) + 1; save();
  paused = true; $('marinaPanel').classList.remove('hide');
  $('marinaPanel').querySelector('h2').textContent = 'Resultado do campeonato';
  $('mSub').textContent = pos === 0 ? 'Você é o campeão da ' + COMP.spot.name + '!' : `Você ficou em ${pos + 1}º lugar.`;
  $('mTabs').innerHTML = '';
  $('mBody').innerHTML = '<div class="list">' + rows.map((r, i) => `<div class="it" ${r.me ? 'style="border-color:var(--acc)"' : ''}><div><div class="n">${i + 1}º ${r.name}</div><div class="d">${r.n} peixe(s) · ${fmtKg(r.kg)} kg</div></div><b>${fmtR([1500, 600, 250, 0][i])}</b></div>`).join('') + '</div>' +
    `<div class="it" style="margin-top:8px"><div class="d">${prize ? 'Prêmio de ' + fmtR(prize) + ' já está no seu saldo. ' : ''}Os peixes que você pegou continuam na fieira e na caixa para vender.</div></div>`;
  AU.coin();
}
