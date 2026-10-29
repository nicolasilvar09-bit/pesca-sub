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
  { name: 'Azul-noite metálico', top: [0.05, 0.09, 0.18], stripe: [0.85, 0.86, 0.88] },
  { name: 'Preto e prata', top: [0.06, 0.06, 0.07], stripe: [0.75, 0.76, 0.78] },
  { name: 'Cinza grafite', top: [0.32, 0.34, 0.37], stripe: [0.08, 0.1, 0.14] },
];
const PAINT_PRICE = 400;
// pintura padrão de cada modelo
const BOAT_LOOK = [
  { paint: 0, len: 1, beam: 1, canvas: 0x1d4f7a },
  { paint: 1, len: 1.1, beam: 1.04, canvas: 0xf2f2ee },
  { paint: 3, len: 1.2, beam: 1.1, canvas: 0x24262a },
  { paint: 6, len: 1.08, beam: 1.04, canvas: 0xf2f2ee },
];
const boatPaint = i => { const p = (SV.boatPaint || {})[i]; return PAINTS[p != null ? p : BOAT_LOOK[i].paint]; };

// casco por seções (loft): fundo em V com quina viva, costado abrindo para fora, proa lançada subindo e popa reta (espelho).
// mesmas medidas do casco antigo (popa z=-3.5, proa z=3.9, boca 2,5 m, borda a 0,72 m), escaladas por look.len / look.beam
function hullShape(t, fb = 1.2) {
  // meia-boca na borda, altura da borda (tosado), linha da quilha
  const bw = t < 0.42 ? lerp(1.1, 1.25, smooth(0, 0.42, t)) : 1.25 * Math.pow(Math.max(0, 1 - Math.pow((t - 0.42) / 0.58, 2.1)), 0.55);
  const sh = fb + 0.32 * Math.pow(Math.max(0, (t - 0.45) / 0.55), 2); // borda alta: o convés (0,715) fica meio metro abaixo
  const kd = -0.52 + 0.06 * t + (t > 0.62 ? Math.pow((t - 0.62) / 0.38, 1.7) * (sh + 0.46) : 0);
  return { bw, sh, kd };
}
function boatHull(look, paint) {
  const fb = look.fb || 1.2, N = 30, L0 = -3.5, L1 = 3.9, dead = Math.tan(19 * Math.PI / 180), bottom = look.bottom || [0.45, 0.08, 0.06];
  const pos = [], col = [], idx = [];
  const colAt = y => y <= -0.12 ? bottom : y < 0.3 && y > 0.05 ? paint.stripe : paint.top;
  const vtx = (x, y, z) => { pos.push(x * look.beam, y, z * look.len); col.push(...colAt(y)); return pos.length / 3 - 1; };
  // perfil de cada seção (meio casco): quilha → fundo → quina → aba da quina → costado → borda → topo da borda (por dentro)
  const sect = t => {
    const { bw, sh, kd } = hullShape(t, fb), cw = bw * 0.86, ch = Math.min(kd + cw * dead, sh - 0.05);
    return { bot: [[0, kd], [cw * 0.5, kd + cw * 0.5 * dead * 0.92], [cw, ch]], side: [[cw, ch], [cw + 0.05 * bw, ch + 0.015], [bw * 0.97, lerp(ch, sh, 0.45)], [bw, sh], [Math.max(0, bw - 0.09), sh]] };
  };
  // faixas: cada uma com vértices próprios para a quina e a borda ficarem vivas
  const strip = key => {
    for (const sx of [1, -1]) {
      const base = pos.length / 3; let M = 0;
      for (let i = 0; i <= N; i++) {
        const t = i / N, z = lerp(L0, L1, t), pts = sect(t)[key]; M = pts.length;
        for (const [x, y] of pts) vtx(sx * x, y, z);
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < M - 1; k++) {
        const a = base + i * M + k, b = a + M;
        if (sx > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  };
  strip('bot'); strip('side');
  // espelho de popa
  const s0 = sect(0), ring = [...s0.bot, ...s0.side.slice(1, 4)], c0 = vtx(0, (s0.bot[0][1] + s0.side[3][1]) / 2, L0);
  const rr = [], rl = [];
  for (const [x, y] of ring) { rr.push(vtx(x, y, L0)); rl.push(vtx(-x, y, L0)); }
  for (let k = 0; k < ring.length - 1; k++) { idx.push(c0, rr[k + 1], rr[k]); idx.push(c0, rl[k], rl[k + 1]); }
  idx.push(c0, rl[ring.length - 1], rr[ring.length - 1]);
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); hg.setIndex(idx); hg.computeVertexNormals();
  // convés: contorno por dentro da borda, na altura em que os barcos já colocam (0,715)
  const shp = new THREE.Shape(), out = [];
  for (let i = 0; i <= N; i++) { const t = i / N, { bw } = hullShape(t, fb); out.push([Math.max(0, bw - 0.12), lerp(L0, L1, t) * 0.985]); }
  shp.moveTo(-out[0][0], out[0][1]); for (const [x, z] of out) shp.lineTo(x, z); for (let i = out.length - 1; i >= 0; i--) shp.lineTo(-out[i][0], out[i][1]);
  const deckG = new THREE.ShapeGeometry(shp); deckG.rotateX(Math.PI / 2); deckG.scale(look.beam, 1, look.len);
  const di = deckG.index.array; for (let k = 0; k < di.length; k += 3) { const tmp = di[k]; di[k] = di[k + 2]; di[k + 2] = tmp; } deckG.computeVertexNormals(); // virado para cima
  return [hg, deckG];
}
// motor de popa: capô arredondado, carenagem, rabeta afinando, quilha e hélice
function outboard(g, x, z, h, m, cowl) {
  const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o);
  const cw = new THREE.Mesh(new THREE.CapsuleGeometry(0.19 * h, 0.3 * h, 6, 14), cowl); cw.scale.set(1, 1.1, 1.3); cw.position.set(0, 1.25, -0.06); o.add(cw);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * h, 0.2 * h, 0.05, 16), m); band.scale.set(1, 1, 1.3); band.position.set(0, 1.02, -0.06); o.add(band);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.13 * h, 1.1, 0.26 * h), cowl); shaft.position.set(0, 0.45, -0.02); o.add(shaft);
  const torp = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 4, 10), m); torp.rotation.x = Math.PI / 2; torp.position.set(0, -0.12, -0.04); o.add(torp);
  const skeg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.14), m); skeg.position.set(0, -0.26, -0.1); o.add(skeg);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34 * h, 0.02, 0.32), m); plate.position.set(0, 0.04, -0.05); o.add(plate);
  for (let k = 0; k < 3; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.07), new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.85, roughness: 0.25 })); bl.position.set(0, -0.12, -0.27); bl.rotation.z = k * TAU / 3; o.add(bl); }
  return o;
}
function buildBoatModel(idx, paintOverride) {
  if (idx === 'v') return buildVoadeira();
  const look = BOAT_LOOK[idx] || BOAT_LOOK[0], paint = paintOverride || boatPaint(idx), L = look.len, Bm = look.beam;
  const g = new THREE.Group();
  const [hg, deckG] = boatHull(look, paint);
  g.add(new THREE.Mesh(hg, uwify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, side: THREE.DoubleSide }), { key: 'b' })));
  const deck = new THREE.Mesh(deckG, new THREE.MeshStandardMaterial({ color: idx === 2 ? 0x9a9a92 : idx === 3 ? 0xa8743e : 0xb08a5a, roughness: 0.8 })); deck.position.y = 0.715; g.add(deck);
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f6f6, roughness: 0.4 }), cream = new THREE.MeshStandardMaterial({ color: 0xece2cc, roughness: 0.7 });
  const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(...paint.top).lerp(new THREE.Color(1, 1, 1), 0.15), roughness: 0.4 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc8cdd0, metalness: 0.8, roughness: 0.25 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0x223844, transparent: true, opacity: 0.5, roughness: 0.1 });
  const canvas = new THREE.MeshStandardMaterial({ color: look.canvas, roughness: 0.8 });
  const box = (w, h, d, x, y, z, m = white) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  const pipe = (a, b, r = 0.03) => { const d = new V3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), steel); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); g.add(m); return m; };
  // guarda-mancebo de inox acompanhando o tosado da proa
  for (const sx of [-1, 1]) { const pts = []; for (let k = 0; k <= 7; k++) { const zz = lerp(0.6, 3.55, k / 7), hs = hullShape((zz + 3.5) / 7.4); pts.push(new V3(sx * Math.max(0.05, hs.bw - 0.1) * Bm, hs.sh + 0.28, zz * L)); } for (let k = 0; k < 7; k++) { pipe(pts[k], pts[k + 1], 0.018); if (k % 2 === 0) pipe(_t1.copy(pts[k]).setY(pts[k].y - 0.28), pts[k], 0.015); } }
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
  } else if (idx === 3) {
    // 38 pés sport: para-brisa envolvente, hardtop com arco de radar, posto de comando com telas, cockpit em U, solário na proa,
    // plataforma de popa em teca, vigias da cabine no costado, friso cromado e três motores de popa
    const teak = new THREE.MeshStandardMaterial({ color: 0xa8743e, roughness: 0.75 }), cush = new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.85 });
    const screen = new THREE.MeshStandardMaterial({ color: 0x0a1a24, emissive: 0x2ab0d8, emissiveIntensity: 0.6, roughness: 0.2 });
    const tint = new THREE.MeshStandardMaterial({ color: 0x1a2a34, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.4, side: THREE.DoubleSide });
    // friso cromado ao longo da borda
    for (const sx of [-1, 1]) { const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, hs = hullShape(t); pts.push(new V3(sx * hs.bw * Bm * 1.005, hs.sh - 0.03, lerp(-3.5, 3.9, t) * L)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6), steel)); }
    // vigias da cabine
    for (const sx of [-1, 1]) for (const [zz, w] of [[1.1, 0.7], [1.95, 0.55], [2.6, 0.35]]) { const hs = hullShape((zz + 3.5) / 7.4), v = box(0.04, 0.13, w, sx * hs.bw * Bm * 0.985, hs.sh - 0.25, zz * L, dark); v.rotation.z = sx * 0.12; }
    // plataforma de popa e escada
    for (const sx of [-1, 1]) box(0.7, 0.08, 0.95, sx * 0.85 * Bm, 0.2, -3.5 * L - 0.45, teak);
    for (let k = 0; k < 3; k++) pipe(new V3(1.05 * Bm, 0.2 - k * 0.22, -3.5 * L - 0.85), new V3(1.05 * Bm, 0.0 - k * 0.22, -3.5 * L - 0.85), 0.02);
    for (const x of [-0.5, 0, 0.5]) outboard(g, x * Bm, -3.5 * L - 0.3, 1.0, dark, new THREE.MeshStandardMaterial({ color: 0x14181e, metalness: 0.4, roughness: 0.3 }));
    // cockpit em U com almofadas e mesa
    box(2.1 * Bm, 0.42, 0.62, 0, 0.95, -2.85 * L, cush); box(2.1 * Bm, 0.5, 0.14, 0, 1.38, -3.12 * L, cush);
    for (const sx of [-1, 1]) { box(0.55, 0.42, 1.5, sx * 0.88 * Bm, 0.95, -2.0 * L, cush); box(0.14, 0.45, 1.5, sx * 1.1 * Bm, 1.35, -2.0 * L, cush); }
    box(0.9, 0.06, 0.6, 0, 1.12, -2.1 * L, teak); pipe(new V3(0, 0.72, -2.1 * L), new V3(0, 1.1, -2.1 * L), 0.04);
    // posto de comando: console com painel inclinado, duas telas, volante e manetes; bancos com encosto
    const con = box(1.5 * Bm, 0.95, 0.95, 0.25 * Bm, 1.2, 0.15 * L, white);
    const dash = box(1.3 * Bm, 0.05, 0.55, 0.25 * Bm, 1.72, 0.2 * L, dark); dash.rotation.x = -0.5;
    for (const dx of [-0.25, 0.3]) { const sc = box(0.42, 0.02, 0.28, 0.25 * Bm + dx, 1.76, 0.22 * L, screen); sc.rotation.x = -0.5; }
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 24), dark); wheel.position.set(0.35 * Bm, 1.72, -0.3 * L); wheel.rotation.x = -0.7; g.add(wheel);
    pipe(new V3(0.35 * Bm, 1.62, -0.15 * L), new V3(0.35 * Bm, 1.72, -0.3 * L), 0.025);
    for (const dx of [0.6, 0.72]) pipe(new V3(dx * Bm, 1.65, -0.1 * L), new V3(dx * Bm, 1.85, -0.25 * L), 0.02);
    for (const sx of [-0.35, 0.45]) { box(0.6, 0.18, 0.55, sx * Bm, 1.2, -0.85 * L, cush); box(0.6, 0.55, 0.14, sx * Bm, 1.5, -1.12 * L, cush); pipe(new V3(sx * Bm, 0.72, -0.85 * L), new V3(sx * Bm, 1.1, -0.85 * L), 0.05); }
    // para-brisa envolvente (arco de vidro fumê) e moldura
    const ws = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.62, 28, 1, true, -1.15, 2.3), tint); ws.scale.set(Bm, 1, 0.7); ws.position.set(0, 2.0, 0.25 * L); ws.rotation.x = 0.12; g.add(ws);
    // hardtop sobre colunas, com arco de radar, cúpula, antenas e luzes
    for (const [x, z] of [[-0.95, 0.75], [0.95, 0.75], [-0.95, -1.3], [0.95, -1.3]]) pipe(new V3(x * Bm, 0.72, z * L), new V3(x * Bm * 0.95, 2.7, z * L), 0.045);
    const top = box(2.2 * Bm, 0.13, 2.7, 0, 2.75, -0.25 * L, white); top.scale.z = L;
    box(2.0 * Bm, 0.05, 2.5, 0, 2.68, -0.25 * L, new THREE.MeshStandardMaterial({ color: 0xd8d2c4 })).scale.z = L;
    const rad = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, TAU, 0, Math.PI / 2), white); rad.position.set(0, 2.82, -0.2 * L); g.add(rad);
    for (const x of [-0.75, 0.75]) pipe(new V3(x * Bm, 2.82, -1.2 * L), new V3(x * Bm, 3.9, -1.5 * L), 0.012);
    box(1.6 * Bm, 0.06, 0.08, 0, 2.72, 1.1 * L, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d0, emissiveIntensity: 0.4 }));
    // solário na proa
    box(1.5 * Bm, 0.16, 1.4, 0, 0.98, 2.15 * L, cush); box(1.2 * Bm, 0.16, 0.6, 0, 1.0, 2.95 * L, cush);
    pilotZ = -0.55 * L; pilotY = 0.715 + 1.02;
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
  poseDiver(pilot, 'drive', 0); g.userData.pilot = [pilot.root]; g.userData.rig = pilot; g.userData.eye = new V3(0.15, pilotY + 0.8, pilotZ + 0.12);
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
