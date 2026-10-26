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
function buildDiver(withGun) {
  gtex();
  const suit = new THREE.MeshStandardMaterial({ map: _camoT, roughness: 0.82 });
  const neo = new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc28a62, roughness: 0.6 });
  const finM = new THREE.MeshStandardMaterial({ map: _carbT, roughness: 0.35, metalness: 0.3, side: THREE.DoubleSide });
  for (const m of [suit, neo, skin, finM]) uwify(m, { key: 'dv' });
  const J = () => new THREE.Group();
  const mesh = (geo, m, par, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
  const root = J();
  // tronco (perfil anatômico em torno)
  const prof = [[0.0, -0.13], [0.125, -0.12], [0.165, -0.06], [0.16, 0.04], [0.145, 0.16], [0.16, 0.3], [0.18, 0.42], [0.175, 0.5], [0.13, 0.56], [0.07, 0.6], [0.055, 0.64], [0.0, 0.645]].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = mesh(new THREE.LatheGeometry(prof, 22), suit, root); torso.scale.set(1, 1, 0.68);
  // cinto de lastro
  const belt = mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.045, 22, 1, true), neo, root, 0, -0.02, 0); belt.scale.set(1, 1, 0.7);
  for (const a of [-0.9, 0, 0.9, 2.4]) mesh(new THREE.BoxGeometry(0.06, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0x55585c, metalness: 0.6, roughness: 0.5 }), root, Math.sin(a) * 0.17, -0.02, Math.cos(a) * 0.12);
  // cabeça com capuz, máscara e snorkel
  const neck = J(); neck.position.set(0, 0.63, 0); root.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.105, 20, 16), neo, neck, 0, 0.11, 0.0); head.scale.set(0.92, 1.12, 1.0);
  const face = mesh(new THREE.SphereGeometry(0.07, 14, 10), skin, neck, 0, 0.06, -0.068); face.scale.set(0.8, 0.55, 0.5);
  const mask = mesh(new THREE.BoxGeometry(0.15, 0.065, 0.04), neo, neck, 0, 0.13, -0.098);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.058, 0.048, 0.006), new THREE.MeshStandardMaterial({ color: 0x0a1418, metalness: 0.9, roughness: 0.05 }), neck, sx * 0.034, 0.132, -0.12);
  const snk = new THREE.CatmullRomCurve3([new V3(0.0, 0.05, -0.1), new V3(0.06, 0.06, -0.09), new V3(0.1, 0.12, -0.04), new V3(0.105, 0.26, 0.0), new V3(0.09, 0.33, 0.04)]);
  mesh(new THREE.TubeGeometry(snk, 16, 0.011, 8), neo, neck);
  // braços
  const arm = (sx) => {
    const sh = J(); sh.position.set(sx * 0.19, 0.5, 0); root.add(sh);
    mesh(new THREE.SphereGeometry(0.058, 12, 10), suit, sh);
    mesh(new THREE.CapsuleGeometry(0.047, 0.2, 4, 12), suit, sh, 0, -0.14, 0);
    const el = J(); el.position.set(0, -0.28, 0); sh.add(el);
    mesh(new THREE.CapsuleGeometry(0.04, 0.19, 4, 12), suit, el, 0, -0.12, 0);
    const wr = J(); wr.position.set(0, -0.25, 0); el.add(wr);
    const hd = mesh(new THREE.CapsuleGeometry(0.033, 0.06, 4, 10), neo, wr, 0, -0.05, 0); hd.scale.set(1.1, 1, 0.7);
    return { sh, el, wr };
  };
  const aL = arm(-1), aR = arm(1);
  // pernas, nadadeiras longas de apneia
  const leg = (sx) => {
    const th = J(); th.position.set(sx * 0.09, -0.1, 0); root.add(th);
    mesh(new THREE.CapsuleGeometry(0.075, 0.28, 4, 12), suit, th, 0, -0.2, 0);
    const kn = J(); kn.position.set(0, -0.43, 0); th.add(kn);
    mesh(new THREE.CapsuleGeometry(0.056, 0.3, 4, 12), suit, kn, 0, -0.2, 0);
    if (sx > 0) mesh(new THREE.BoxGeometry(0.03, 0.16, 0.05), neo, kn, 0.06, -0.2, 0.01); // faca na panturrilha
    const an = J(); an.position.set(0, -0.42, 0); kn.add(an);
    const foot = mesh(new THREE.BoxGeometry(0.085, 0.07, 0.24), neo, an, 0, -0.03, -0.07);
    const fs = new THREE.Shape(); fs.moveTo(-0.055, 0); fs.lineTo(0.055, 0); fs.lineTo(0.1, 0.72); fs.quadraticCurveTo(0, 0.77, -0.1, 0.72); fs.closePath();
    const fg = new THREE.ShapeGeometry(fs, 6); fg.rotateX(-Math.PI / 2);
    const fin = J(); fin.position.set(0, -0.045, -0.18); an.add(fin);
    const blade = mesh(fg, finM, fin); blade.rotation.x = 0;
    for (const rx of [-1, 1]) mesh(new THREE.BoxGeometry(0.008, 0.02, 0.7), neo, fin, rx * 0.075, 0.005, -0.33).rotation.y = rx * -0.06;
    return { th, kn, an, fin };
  };
  const lL = leg(-1), lR = leg(1);
  scene.add(root);
  const rig = { root, neck, aL, aR, lL, lR, handR: aR.wr };
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
  r.aL.sh.rotation.set(0.15 + Math.sin(kick * 0.5) * 0.05 * kickAmp, 0, -0.18); r.aL.el.rotation.set(0.25, 0, 0); r.aL.wr.rotation.set(0, 0, 0);
  for (const [l, s] of [[r.lL, 1], [r.lR, -1]]) {
    const k = Math.sin(kick + (s > 0 ? 0 : Math.PI)) * kickAmp;
    l.th.rotation.set(0.05 + k * 0.38, 0, -s * 0.04);
    l.kn.rotation.set(-0.12 - Math.max(0, -k) * 0.45, 0, 0);
    l.an.rotation.set(-1.45 + k * 0.15, 0, 0);
    l.fin.visible = true; l.fin.rotation.x = -k * 0.25;
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
  const cp = Math.cos(P.pitch), fwd = _a.set(-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp);
  const tall = camera.aspect < 1, back = tall ? 4.0 : 3.1, up = (P.under ? 0.75 : 1.0) * (tall ? 1.25 : 1), sideK = 0.45, rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  const c = new V3(P.pos.x - fwd.x * back + rx * sideK, P.pos.y - fwd.y * back + up, P.pos.z - fwd.z * back + rz * sideK);
  const h = H(c.x, c.z); if (c.y < h + 0.35) c.y = h + 0.35;
  pushOutRocks(c, 0.3);
  camera.position.lerp(c, 0.5);
  camera.rotation.set(P.pitch - 0.16, P.yaw, 0, 'YXZ');
}
