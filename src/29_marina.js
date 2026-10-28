// ================= marina: píer de madeira largo, praça com cabine, placa, dedos de atracação, barcos de pesca e gente passeando =================
const MAR = { rects: [], boats: [], people: [], lamps: null, deckY: 1.45 };
// retângulos do píer e dos barcos atracados (colisão da lancha)
function pierHit(x, z, pad = 1.3) { for (const r of MAR.rects) if (x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad) return true; return false; }

function plankTex() {
  const t = canvasTex(256, 256, g => {
    g.fillStyle = '#6e4526'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      const c = 0.85 + Math.random() * 0.3; g.fillStyle = `rgb(${110 * c | 0},${70 * c | 0},${40 * c | 0})`; g.fillRect(0, y + 1, 256, 14);
      for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(40,22,10,${Math.random() * 0.2})`; g.fillRect(Math.random() * 256, y + 1 + Math.random() * 14, 20 + Math.random() * 60, 1); }
      g.fillStyle = 'rgba(25,14,6,.85)'; g.fillRect(0, y, 256, 1.5);
      const off = (y / 16 % 2) * 128; g.fillRect(off + 60, y, 1.5, 16); g.fillStyle = 'rgba(30,30,30,.7)'; for (const x of [off + 54, off + 66]) for (const yy of [y + 4, y + 12]) g.fillRect(x, yy, 2, 2);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function signTex(txt, sub) {
  const t = canvasTex(512, 128, g => {
    g.fillStyle = '#4a2c16'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#c8a060'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
    g.fillStyle = '#f2dca8'; g.font = `bold ${txt.length > 12 ? 42 : 54}px Georgia, serif`; g.textAlign = 'center'; g.fillText(txt, 256, 68);
    g.font = 'italic 24px Georgia, serif'; g.fillStyle = '#e0c088'; g.fillText(sub, 256, 104);
  });
  return t;
}

// ---------- barco de pesca atracado: casco de madeira pintado, casaria, mastro ----------
const FB_PAINTS = [[[0.95, 0.95, 0.93], [0.1, 0.3, 0.6]], [[0.2, 0.42, 0.7], [0.95, 0.85, 0.3]], [[0.75, 0.15, 0.12], [0.95, 0.95, 0.9]], [[0.95, 0.8, 0.2], [0.15, 0.4, 0.25]], [[0.2, 0.5, 0.35], [0.95, 0.95, 0.9]], [[0.95, 0.95, 0.93], [0.8, 0.2, 0.15]]];
function fishingBoat(r) {
  const [top, stripe] = FB_PAINTS[Math.floor(r() * FB_PAINTS.length)], g = new THREE.Group();
  const [hg, deckG] = boatHull({ len: 1.05, beam: 0.95, bottom: [0.25, 0.12, 0.08] }, { top, stripe });
  g.add(new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })));
  const deck = new THREE.Mesh(deckG, new THREE.MeshLambertMaterial({ color: 0x8a6440 })); deck.position.y = 0.715; g.add(deck);
  const wood = new THREE.MeshLambertMaterial({ color: 0xe8e2d4 }), roofM = new THREE.MeshLambertMaterial({ color: new THREE.Color(...stripe) }), dark = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  box(1.7, 1.4, 1.9, 0, 1.45, -0.6, wood); box(1.9, 0.12, 2.2, 0, 2.2, -0.6, roofM);       // casaria
  for (const sx of [-1, 1]) box(0.04, 0.45, 1.2, sx * 0.86, 1.65, -0.6, dark);           // janelas
  box(1.3, 0.45, 0.04, 0, 1.65, 0.36, dark);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4, 6), wood); mast.position.set(0, 3.2, 1.5); g.add(mast);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), wood); boom.rotation.x = Math.PI / 2 - 0.5; boom.position.set(0, 2.6, 0.6); g.add(boom);
  box(0.9, 0.3, 0.6, 0, 0.9, -2.6, new THREE.MeshLambertMaterial({ color: 0x2a5a8a })); // caixa de gelo
  return g;
}

// ---------- gente passeando: corpo simples com camisa, calça, chapéu ----------
const SHIRTS = [0xd84a3a, 0x2a6ab0, 0xf0f0e8, 0x3a8a4a, 0xe8b830, 0x7a4aa0, 0x20a0a0, 0xe87a40], PANTS = [0x2a3040, 0x5a4a38, 0x3a4a6a, 0xd8cdb0], SKINS = [0xe0b090, 0xc08860, 0x8a5a38, 0x6a4026, 0xf0c8a8];
function person(r) {
  const pk = a => a[Math.floor(r() * a.length)], g = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: pk(SHIRTS) }), pants = new THREE.MeshLambertMaterial({ color: pk(PANTS) }), skin = new THREE.MeshLambertMaterial({ color: pk(SKINS) });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 4, 8), shirt); torso.position.y = 1.18; torso.scale.set(1, 1, 0.7); g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skin); head.position.y = 1.62; g.add(head);
  if (r() < 0.45) { const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 12), new THREE.MeshLambertMaterial({ color: 0xd8c080 })); hat.position.y = 1.72; g.add(hat); const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 10), hat.material); cr.position.y = 1.77; g.add(cr); }
  const limb = (m, len, rad, x, y) => { const piv = new THREE.Group(); piv.position.set(x, y, 0); const l = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 3, 6), m); l.position.y = -len / 2 - rad; piv.add(l); g.add(piv); return piv; };
  const legL = limb(pants, 0.62, 0.075, -0.09, 0.86), legR = limb(pants, 0.62, 0.075, 0.09, 0.86);
  const armL = limb(shirt, 0.42, 0.055, -0.24, 1.42), armR = limb(skin, 0.42, 0.055, 0.24, 1.42);
  g.userData = { legL, legR, armL, armR };
  return g;
}

function buildMarina() {
  const X = PIER.x, Z0 = PIER.z0, Z1 = PIER.z1, r = mulberry(707);
  // o deck fica um pouco acima da areia da praça de entrada (sem afundar no terreno)
  let hp = -9; for (let x = -10; x <= 10; x += 2) for (let z = Z0 - 14; z <= Z0 + 2; z += 2) hp = Math.max(hp, H(X + x, z));
  const Y = MAR.deckY = clamp(hp + 0.35, 1.45, 2.8);
  const pt = plankTex(), wood = uwify(new THREE.MeshStandardMaterial({ map: pt, color: 0xb08a68, roughness: 0.9 }), { key: 'w' });
  const beam = uwify(new THREE.MeshStandardMaterial({ color: 0x4e3018, roughness: 0.95 }), { key: 'w' });
  const deckBox = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0, geo = new THREE.BoxGeometry(w, 0.3, d), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 4, uv.getY(i) * d / 4); // tábuas atravessadas, 4 m por repetição
    const m = new THREE.Mesh(geo, wood); m.position.set((x0 + x1) / 2, Y - 0.15, (z0 + z1) / 2); scene.add(m);
    // vigas laterais e estacas até o fundo
    for (const sx of [x0, x1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, d), beam); b.position.set(sx, Y - 0.35, (z0 + z1) / 2); scene.add(b); }
    for (let z = z0; z <= z1 + 0.01; z += 4) for (const x of [x0 + 0.2, x1 - 0.2]) { const h = Math.min(H(x, z), Y - 0.5); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, Y - h, 6), beam); p.position.set(x, (Y + h) / 2 - 0.2, z); scene.add(p); }
    MAR.rects.push({ x0, x1, z0, z1 });
  };
  const rail = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2.5)), a = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k <= n; k++) { const x = lerp(ax, bx, k / n), z = lerp(az, bz, k / n), p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), beam); p.position.set(x, Y + 0.5, z); scene.add(p); }
    for (const yy of [0.95, 0.5]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, L), beam); t.position.set((ax + bx) / 2, Y + yy, (az + bz) / 2); t.rotation.y = a; scene.add(t); }
  };
  // passarela, ponta em T e praça de entrada
  const W = 2.6, TW = 13, plazaZ = Z0 - 14;
  deckBox(X - W, X + W, Z1 + 3, plazaZ);
  deckBox(X - TW, X + TW, Z1 - 3, Z1 + 3);
  deckBox(X - 10, X + 10, plazaZ, Z0 + 2);
  rail(X - TW, Z1 - 3, X + TW, Z1 - 3); rail(X - TW, Z1 - 3, X - TW, Z1 + 3); rail(X + TW, Z1 - 3, X + TW, Z1 + 3);
  // dedos de atracação com barcos de pesca dos dois lados
  const fingers = []; for (let z = Z1 + 22; z < plazaZ - 8; z += 20) fingers.push(z);
  for (const fz of fingers) for (const s of [-1, 1]) {
    if (H(X + s * (W + 9), fz) > -1.2) continue; // dedo só onde tem água
    deckBox(s > 0 ? X + W : X - W - 10, s > 0 ? X + W + 10 : X - W, fz - 0.8, fz + 0.8);
    for (const side of [-1, 1]) {
      const bx = X + s * (W + 5.4), bz = fz + side * 2.7;
      if (r() < 0.25 || [-3.4, 0, 3.4].some(dx => H(bx + dx, bz) > -1.4)) continue; // barco só onde flutua
      const b = r() < 0.7 ? fishingBoat(r) : buildBoatModel(Math.floor(r() * 2), { top: FB_PAINTS[Math.floor(r() * 6)][0], stripe: [0.1, 0.2, 0.35] });
      if (b.userData.pilot) b.userData.pilot.forEach(o => o.visible = false);
      b.scale.multiplyScalar(0.92); const head = s > 0 ? Math.PI / 2 : -Math.PI / 2; b.position.set(bx, 0, bz); b.rotation.y = head + (r() - 0.5) * 0.08; scene.add(b);
      MAR.boats.push({ m: b, x: bx, z: bz, h: b.rotation.y, ph: r() * TAU });
      MAR.rects.push({ x0: bx - 3.6, x1: bx + 3.6, z0: bz - 1.3, z1: bz + 1.3 });
      // cabos de amarração
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.2, 4), new THREE.MeshLambertMaterial({ color: 0xd8d0b0 })); line.rotation.x = Math.PI / 2; line.rotation.z = 0.3; line.position.set(bx - s * 2, Y - 0.4, (bz + fz) / 2); scene.add(line);
    }
  }
  // postes de luz ao longo da passarela
  const lampM = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffd890, emissiveIntensity: 0 }); MAR.lamps = lampM;
  for (let z = Z1 + 10; z < plazaZ; z += 18) for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), beam); p.position.set(X + s * (W - 0.15), Y + 1.6, z); scene.add(p);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), lampM); bulb.position.set(X + s * (W - 0.15), Y + 3.3, z); scene.add(bulb);
  }
  // praça: cabine da marina, bancos e floreiras
  const cabX = X + 5.2, cabZ = plazaZ + 6.5, walls = new THREE.MeshLambertMaterial({ color: 0x8a5a32 }), trim = new THREE.MeshLambertMaterial({ color: 0xf0e8d8 }), roofM = new THREE.MeshLambertMaterial({ color: 0x3a5a3a });
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); scene.add(b); return b; };
  box(6, 3, 5, cabX, Y + 1.5, cabZ, walls);
  box(1.0, 2.0, 0.08, cabX - 1.5, Y + 1.0, cabZ - 2.52, beam);                                   // porta
  for (const dx of [0.6, 2.0]) box(1.0, 1.0, 0.06, cabX + dx, Y + 1.8, cabZ - 2.52, new THREE.MeshStandardMaterial({ color: 0x9ac8d8, metalness: 0.6, roughness: 0.1 })); // janelas
  for (const dx of [0.6, 2.0]) box(1.15, 0.1, 0.12, cabX + dx, Y + 1.25, cabZ - 2.55, trim);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.8); roof.position.set(cabX, Y + 3.9, cabZ); scene.add(roof);
  const cabSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signTex(AMZ ? 'PORTO' : 'MARINA', 'loja · combustível · pescado') })); cabSign.position.set(cabX + 0.3, Y + 2.65, cabZ - 2.56); cabSign.rotation.y = Math.PI; scene.add(cabSign);
  for (const [bx, bz] of [[X - 6, plazaZ + 3], [X - 6, plazaZ + 9]]) { box(2.2, 0.08, 0.5, bx, Y + 0.48, bz, beam); for (const dx of [-0.9, 0.9]) box(0.08, 0.45, 0.45, bx + dx, Y + 0.23, bz, beam); box(2.2, 0.5, 0.06, bx, Y + 0.75, bz + 0.25, beam); }
  for (const [fx, fz] of [[X - 9, plazaZ + 0.8], [X + 9, plazaZ + 0.8]]) { box(1, 0.6, 1, fx, Y + 0.3, fz, beam); const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshLambertMaterial({ color: 0x3a7a32 })); bush.position.set(fx, Y + 0.95, fz); scene.add(bush); }
  // placa em arco na entrada do píer
  for (const s of [-1, 1]) box(0.3, 4.4, 0.3, X + s * (W + 0.4), Y + 2.2, plazaZ - 0.3, beam);
  box(2 * W + 1.4, 0.35, 0.35, X, Y + 4.3, plazaZ - 0.3, beam);
  const arch = new THREE.Mesh(new THREE.PlaneGeometry(2 * W + 0.6, 1.3), new THREE.MeshBasicMaterial({ map: signTex(AMZ ? 'VILA DO TAPAJÓS' : 'MARINA BALNEÁRIO', AMZ ? 'porto · Baixo Tapajós' : 'Angra dos Reis · Costa Verde'), side: THREE.DoubleSide }));
  arch.position.set(X, Y + 3.5, plazaZ - 0.5); arch.rotation.y = Math.PI; scene.add(arch);
  // pontos onde as pessoas param: beira da ponta em T, pontas dos dedos, bancos da praça
  const views = [];
  for (let x = -TW + 1.5; x <= TW - 1.5; x += 3) views.push([X + x, Z1 - 2.1, Math.PI]);
  for (const fz of fingers) for (const s of [-1, 1]) views.push([X + s * (W + 8.8), fz, s > 0 ? -Math.PI / 2 : Math.PI / 2]);
  for (const [bx, bz] of [[X - 6, plazaZ + 3], [X - 6, plazaZ + 9]]) views.push([bx, bz - 0.5, Math.PI]);
  views.push([X + 5, plazaZ + 2, Math.PI], [X, plazaZ + 5, Math.PI]);
  MAR.views = views;
  const n = AMZ ? 6 : 9;
  for (let i = 0; i < n; i++) {
    const m = person(r), v = views[Math.floor(r() * views.length)]; m.position.set(v[0], Y, v[1]); scene.add(m);
    MAR.people.push({ m, tgt: null, wait: r() * 6, speed: 1 + r() * 0.5, ph: r() * TAU, look: v[2] });
  }
}
// pessoa anda pela passarela (corredor central) até um ponto de vista, para olhando os barcos e segue
function walkTo(p, dt) {
  const m = p.m, pos = m.position, [tx, tz] = p.tgt, lane = PIER.x + (p.ph > Math.PI ? 0.7 : -0.7);
  let gx, gz;
  const onMain = Math.abs(pos.x - PIER.x) < 2.6;
  if (Math.abs(pos.z - tz) > 1.2 && !onMain && Math.abs(pos.z - PIER.z1) > 3.5 && pos.z < PIER.z0 - 14) { gx = lane; gz = pos.z; } // sai do dedo para a passarela
  else if (Math.abs(pos.z - tz) > 1.2 && Math.abs(pos.x - tx) > 2 && pos.z < PIER.z0 - 14 && Math.abs(pos.z - PIER.z1) > 3.5) { gx = lane; gz = tz; }
  else { gx = tx; gz = tz; }
  const dx = gx - pos.x, dz = gz - pos.z, d = Math.hypot(dx, dz);
  if (d < 0.15) { if (gx === tx && gz === tz) return true; }
  else { const s = Math.min(d, p.speed * dt); pos.x += dx / d * s; pos.z += dz / d * s; m.rotation.y = Math.atan2(dx, dz); }
  return false;
}
function updateMarina(dt, t) {
  if (!MAR.people.length) return;
  const near = (camera.position.x - PIER.x) ** 2 + (camera.position.z - PIER.z0) ** 2 < 420 * 420;
  if (MAR.lamps) MAR.lamps.emissiveIntensity = clamp((0.45 - DAY.amb) * 4, 0, 1.6);
  for (const b of MAR.boats) { b.m.visible = near; if (!near) continue; b.m.position.y = waveH(b.x, b.z, t) * 0.8 - 0.05; b.m.rotation.set(Math.sin(t * 0.9 + b.ph) * 0.03, b.h, Math.sin(t * 0.7 + b.ph) * 0.04, 'YXZ'); }
  for (const p of MAR.people) {
    p.m.visible = near; if (!near) continue;
    const u = p.m.userData;
    if (!p.tgt) {
      p.wait -= dt;
      p.m.rotation.y += angDiff(p.m.rotation.y, p.look) * clamp(dt * 2, 0, 1);
      for (const k of ['legL', 'legR', 'armL', 'armR']) u[k].rotation.x *= 0.85;
      u.armR.rotation.x = Math.sin(t * 0.8 + p.ph) * 0.05;
      if (p.wait <= 0) { const v = MAR.views[Math.floor(Math.random() * MAR.views.length)]; p.tgt = [v[0], v[1]]; p.look = v[2]; }
    } else {
      const arrived = walkTo(p, dt), sw = Math.sin(t * p.speed * 5.5 + p.ph) * 0.55;
      u.legL.rotation.x = sw; u.legR.rotation.x = -sw; u.armL.rotation.x = -sw * 0.7; u.armR.rotation.x = sw * 0.7;
      if (arrived) { p.tgt = null; p.wait = rand(5, 14); }
    }
    p.m.position.y = MAR.deckY + Math.abs(Math.sin(t * p.speed * 5.5 + p.ph)) * (p.tgt ? 0.03 : 0);
  }
}
