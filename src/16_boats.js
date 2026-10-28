// ================= lanchas: modelo próprio para cada uma, com pintura =================
// 21 pés: console central aberto, bimini de lona e um motor de popa
// 26 pés: cabinada, cabine na proa com vigias, T-top com radar e motor grande
// 32 pés: pesca oceânica, cabine longa com para-brisa, hardtop com torre, tangones e dois motores
const PAINTS = [
  { name: 'Branco e azul', top: [0.95, 0.96, 0.97], stripe: [0.06, 0.16, 0.3] },
  { name: 'Azul-marinho', top: [0.07, 0.13, 0.26], stripe: [0.9, 0.9, 0.92] },
  { name: 'Vermelho regata', top: [0.62, 0.07, 0.07], stripe: [0.95, 0.95, 0.95] },
  { name: 'Grafite e dourado', top: [0.16, 0.17, 0.19], stripe: [0.82, 0.62, 0.2] },
  { name: 'Verde Costa Verde', top: [0.1, 0.33, 0.27], stripe: [0.95, 0.88, 0.62] },
  { name: 'Amarelo', top: [0.95, 0.76, 0.12], stripe: [0.1, 0.1, 0.12] },
];
const PAINT_PRICE = 400;
// pintura padrão de cada modelo
const BOAT_LOOK = [
  { paint: 0, len: 1, beam: 1, canvas: 0x1d4f7a },
  { paint: 1, len: 1.1, beam: 1.04, canvas: 0xf2f2ee },
  { paint: 3, len: 1.2, beam: 1.1, canvas: 0x24262a },
];
const boatPaint = i => { const p = (SV.boatPaint || {})[i]; return PAINTS[p != null ? p : BOAT_LOOK[i].paint]; };

function boatHull(look, paint) {
  const sh = new THREE.Shape();
  sh.moveTo(-1.15, -3.5); sh.lineTo(1.15, -3.5); sh.lineTo(1.25, 0.8); sh.quadraticCurveTo(1.05, 2.9, 0, 3.9); sh.quadraticCurveTo(-1.05, 2.9, -1.25, 0.8); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 1.15, steps: 5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 10 });
  hg.rotateX(Math.PI / 2); hg.translate(0, 0.62, 0);
  const p = hg.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const dn = clamp((0.62 - y) / 1.25, 0, 1); x *= lerp(1, 0.28, dn * dn); if (dn > 0.5) y += Math.max(0, z - 0.8) * 0.18 * dn;
    p.setXYZ(i, x * look.beam, y, z * look.len);
    let c = paint.top; if (y < 0.3 && y > 0.05) c = paint.stripe; if (y <= -0.12) c = look.bottom || [0.45, 0.08, 0.06];
    col.set(c, i * 3);
  }
  hg.setAttribute('color', new THREE.BufferAttribute(col, 3)); hg.computeVertexNormals();
  const deckG = new THREE.ShapeGeometry(sh); deckG.rotateX(-Math.PI / 2); deckG.scale(0.9 * look.beam, 1, 0.93 * look.len);
  return [hg, deckG];
}
function outboard(g, x, z, h, m, cowl) {
  const b = (w, hh, d, y, mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat); o.position.set(x, y, z); g.add(o); return o; };
  b(0.5 * h, 0.85 * h, 0.55 * h, 1.0, m);
  b(0.52 * h, 0.12, 0.57 * h, 1.0 + 0.36 * h, cowl);
  b(0.16, 1.1, 0.24, 0.1, m).position.z = z - 0.04;
}
function buildBoatModel(idx, paintOverride) {
  if (idx === 'v') return buildVoadeira();
  const look = BOAT_LOOK[idx] || BOAT_LOOK[0], paint = paintOverride || boatPaint(idx), L = look.len, Bm = look.beam;
  const g = new THREE.Group();
  const [hg, deckG] = boatHull(look, paint);
  g.add(new THREE.Mesh(hg, uwify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }), { key: 'b' })));
  const deck = new THREE.Mesh(deckG, new THREE.MeshStandardMaterial({ color: idx === 2 ? 0x9a9a92 : 0xb08a5a, roughness: 0.8 })); deck.position.y = 0.715; g.add(deck);
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f6f6, roughness: 0.4 }), cream = new THREE.MeshStandardMaterial({ color: 0xece2cc, roughness: 0.7 });
  const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(...paint.top).lerp(new THREE.Color(1, 1, 1), 0.15), roughness: 0.4 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc8cdd0, metalness: 0.8, roughness: 0.25 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x223844, transparent: true, opacity: 0.5, roughness: 0.1 });
  const canvas = new THREE.MeshStandardMaterial({ color: look.canvas, roughness: 0.8 });
  const box = (w, h, d, x, y, z, m = white) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  const pipe = (a, b, r = 0.03) => { const d = new V3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), steel); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); g.add(m); return m; };
  // guarda-mancebo de inox ao longo da borda da proa
  for (const sx of [-1, 1]) { const pts = []; for (let k = 0; k <= 6; k++) { const z = lerp(0.6, 3.5, k / 6) * L, w = (1.15 - 0.95 * Math.pow(k / 6, 2)) * Bm; pts.push(new V3(sx * w, 1.05, z)); } for (let k = 0; k < 6; k++) { pipe(pts[k], pts[k + 1], 0.018); pipe(pts[k], new V3(pts[k].x, 0.75, pts[k].z), 0.015); } }
  let pilotZ = -0.62, pilotY = 0.715 + 1.02;
  if (idx === 0) {
    // console central + bimini
    box(0.95, 0.95, 0.75, 0, 1.12, 0.2);
    const gl = box(1.05, 0.5, 0.04, 0, 1.78, 0.62, glassM); gl.rotation.x = -0.45;
    for (const [x, z] of [[-0.75, 1], [0.75, 1], [-0.75, -0.9], [0.75, -0.9]]) pipe(new V3(x, 0.72, z), new V3(x, 2.55, z));
    box(1.7, 0.07, 2.2, 0, 2.58, 0.05, canvas);
    box(2.0, 0.42, 0.65, 0, 0.88, -2.7, cream); box(1.2, 0.5, 0.7, 0, 0.92, 1.9, cream);
    outboard(g, 0, -3.78, 1, dark, dark);
  } else if (idx === 1) {
    // cabinada: cabine na proa com vigias, console atrás, T-top com radar
    const cab = box(1.9 * Bm, 0.62, 1.9, 0, 1.03, 1.85 * L, trim); cab.scale.x = 1;
    const roof = box(1.75 * Bm, 0.08, 1.75, 0, 1.38, 1.85 * L, white);
    const ws = box(1.7 * Bm, 0.5, 0.05, 0, 1.55, 0.85 * L, glassM); ws.rotation.x = -0.6;
    for (const sx of [-1, 1]) for (const z of [1.5, 2.15]) { const v = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), glassM); v.position.set(sx * 0.951 * Bm, 1.06, z * L); v.rotation.y = sx * Math.PI / 2; g.add(v); }
    box(1.0, 1.0, 0.7, 0, 1.15, -0.15, white);
    for (const [x, z] of [[-0.6, 0.4], [0.6, 0.4], [-0.6, -0.8], [0.6, -0.8]]) pipe(new V3(x, 1.65, z), new V3(x, 2.6, z), 0.035);
    box(1.6, 0.1, 1.6, 0, 2.62, -0.2, white);
    const rad = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16), white); rad.position.set(0, 2.75, -0.2); g.add(rad);
    pipe(new V3(0.5, 2.67, -0.6), new V3(0.5, 3.35, -0.6), 0.015);
    for (const x of [-0.45, -0.15, 0.15, 0.45]) pipe(new V3(x, 2.62, -1.0), new V3(x, 3.1, -1.25), 0.012); // porta-varas no T-top
    box(2.1 * Bm, 0.4, 0.6, 0, 0.88, -2.85 * L, cream);
    outboard(g, 0, -3.82 * L, 1.2, white, new THREE.MeshStandardMaterial({ color: 0x1d2a3a, roughness: 0.4 }));
    pilotZ = -0.95;
  } else {
    // oceânica: cabine longa com para-brisa envolvente, hardtop, torre e tangones, dois motores
    box(2.1 * Bm, 0.75, 2.6, 0, 1.1, 1.75 * L, trim);
    const ws = box(2.0 * Bm, 0.55, 0.05, 0, 1.7, 0.5 * L, glassM); ws.rotation.x = -0.7;
    for (const sx of [-1, 1]) { const sw = box(0.05, 0.4, 1.4, sx * 1.05 * Bm, 1.6, 1.5 * L, glassM); sw.rotation.z = sx * 0.25; }
    box(1.9 * Bm, 0.12, 2.9, 0, 2.55, 0.0, white);
    for (const [x, z] of [[-0.85, 1.2], [0.85, 1.2], [-0.85, -1.2], [0.85, -1.2]]) pipe(new V3(x * Bm, 0.72, z), new V3(x * Bm, 2.5, z), 0.04);
    // torre de observação
    for (const [x, z] of [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]) pipe(new V3(x, 2.6, z), new V3(x * 0.7, 3.7, z * 0.7), 0.03);
    box(1.0, 0.06, 1.0, 0, 3.72, 0, white); pipe(new V3(-0.5, 4.05, 0.5), new V3(0.5, 4.05, 0.5), 0.02); pipe(new V3(-0.5, 4.05, -0.5), new V3(0.5, 4.05, -0.5), 0.02);
    for (const [x, z] of [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]) pipe(new V3(x, 3.72, z), new V3(x, 4.05, z), 0.015);
    // tangones (outriggers)
    for (const sx of [-1, 1]) pipe(new V3(sx * 0.9, 2.6, -0.3), new V3(sx * 2.3, 4.3, -1.6), 0.025);
    // poltrona de briga no cockpit
    box(0.55, 0.45, 0.5, 0, 0.95, -2.3 * L, cream); box(0.55, 0.5, 0.1, 0, 1.35, -2.55 * L, cream);
    for (const sx of [-1, 1]) outboard(g, sx * 0.48, -3.85 * L, 1.25, white, new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.5, roughness: 0.35 }));
    pilotZ = -0.4;
  }
  // piloto
  const pilot = buildDiver(false); scene.remove(pilot.root); g.add(pilot.root); pilot.root.position.set(0.15, pilotY, pilotZ); pilot.root.rotation.y = Math.PI;
  poseDiver(pilot, 'drive', 0); g.userData.pilot = [pilot.root]; g.userData.rig = pilot;
  g.scale.setScalar(BOATS[idx] ? BOATS[idx].scale : 1);
  return g;
}
// troca o modelo da lancha mantendo posição e rumo
function rebuildBoat() {
  const old = BOAT.mesh, g = buildBoatModel(curBoatIdx());
  if (old) { g.position.copy(old.position); g.quaternion.copy(old.quaternion); scene.remove(old); old.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  scene.add(g); BOAT.mesh = g; BOAT.meshIdx = curBoatIdx(); BOAT.meshPaint = JSON.stringify(SV.boatPaint || {});
}
function boatsHTML() {
  return '<div class="list">' + (AMZ ? voadHTML() : '') + BOATS.map((b, i) => {
    const own = (SV.boats || [0]).includes(i), use = !useVoad() && (SV.boat || 0) === i, pi = (SV.boatPaint || {})[i] ?? BOAT_LOOK[i].paint;
    const img = thumb('boat' + i + '_' + pi, () => buildBoatModel(i), [1, 0.45, 0.8], 1.15);
    const paints = own ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${PAINTS.map((p, k) => `<button class="sw ${k === pi ? 'on' : ''}" title="${p.name}" data-paint="${i}:${k}" style="background:linear-gradient(180deg,rgb(${p.top.map(v => v * 255 | 0)}) 60%,rgb(${p.stripe.map(v => v * 255 | 0)}) 60%)"></button>`).join('')}<span class="d" style="align-self:center">Pintura ${fmtR(PAINT_PRICE)}</span></div>` : '';
    return `<div class="it eq"><img class="thumb" src="${img}" alt=""><div style="flex:1"><div class="n">${b.name}</div><div class="d">${b.desc} Velocidade máx. ${Math.round(b.max * 1.94)} nós · tanque ${b.tank} L.</div>${paints}</div>${use ? '<span class="d">EM USO</span>' : own ? `<button class="btn alt" data-boat="${i}">USAR</button>` : buyBtn(`data-bboat="${i}"`, b.price)}</div>`;
  }).join('') + '</div>';
}
function bindBoats(on, pay) {
  on('[data-paint]', b => { const [i, k] = b.dataset.paint.split(':').map(Number), cur = (SV.boatPaint || {})[i] ?? BOAT_LOOK[i].paint; if (k === cur) return; if (pay(PAINT_PRICE)) { SV.boatPaint = Object.assign({}, SV.boatPaint, { [i]: k }); applyGear(); toast(`Lancha pintada: ${PAINTS[k].name}.`, 2.5, 'gold'); } });
}
