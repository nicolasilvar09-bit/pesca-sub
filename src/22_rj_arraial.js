// ================= destino Arraial do Cabo (RJ): água fria e muito clara, paredões da Ilha do Farol e o Boqueirão =================
// a costa corre de oeste para leste ao sul (z positivo); a Ilha do Farol fica ao norte-leste, separada do Pontal pelo Boqueirão.
// a ressurgência traz água fria e transparente do fundo: visibilidade alta, peixe pelágico encostando no costão.
function acCoast(x) { return 560 + 50 * Math.sin(x * 0.003) + 20 * Math.sin(x * 0.013 + 1); }
function acFarol() { return { x: 900, z: -340 }; }  // Ilha do Farol (Ilha de Cabo Frio), alongada leste-oeste
function acPorcos() { return { x: -420, z: -120 }; }
function acPedra() { return { x: -80, z: -720 }; } // Pedra Vermelha (laje submersa)
// distância até o segmento do Pontal do Atalaia (da praia até a ponta, de frente para a ilha)
function acPontal(x, z) { const ax = 380, az = acCoast(380) - 10, bx = 470, bz = -40, dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t); }
function Hac(x, z) {
  const s = acCoast(x) - z;
  let h;
  if (s < 0) h = 1.4 + 8 * smooth(-10, -140, s) * (0.6 + 0.8 * fbm(x * 0.008, z * 0.008, 3)) + 55 * smooth(-160, -520, s) * (0.5 + 0.5 * fbm(x * 0.005 + 3, z * 0.005, 3));
  else if (s < 70) h = lerp(1.2, -3, smooth(0, 70, s));
  else if (s < 950) h = lerp(-3, -16, smooth(70, 950, s)) + 1.6 * fbm(x * 0.012 + 4, z * 0.012, 3) + 0.5 * fbm(x * 0.06, z * 0.06, 2);
  else h = lerp(-16, -42, smooth(950, 1650, s)) + 1.5 * fbm(x * 0.01, z * 0.01, 3);
  // Ilha do Farol: morro alto, paredão que cai direto para ~26 m
  const F = acFarol(), df = Math.hypot((x - F.x) / 1.55, z - F.z) * (1 + 0.12 * fbm(x * 0.01, z * 0.01, 2));
  if (df < 255) h = df < 215 ? 4 + 112 * (1 - (df / 215) ** 2) + 3 * fbm(x * 0.04, z * 0.04, 2) : lerp(2, -26 + 2 * fbm(x * 0.05, z * 0.05, 2), smooth(215, 252, df));
  else if (df < 400) h = Math.min(h, lerp(-26, h, smooth(255, 400, df)));
  // Pontal do Atalaia: crista de pedra saindo da praia em direção à ilha (o Boqueirão é o canal entre os dois)
  const dp = acPontal(x, z); if (dp < 70) h = Math.max(h, lerp(26 * (1 - dp / 40) + 3 * fbm(x * 0.05, z * 0.05, 2), h, smooth(28, 70, dp)));
  // Ilha dos Porcos
  const P = acPorcos(), dq = Math.hypot(x - P.x, z - P.z); if (dq < 150) h = Math.max(h, lerp(34 * (1 - dq / 55) + 2 * fbm(x * 0.05, z * 0.05, 2), h, smooth(40, 150, dq)));
  // Pedra Vermelha: pináculo que sobe até ~9 m
  const V = acPedra(), dv = Math.hypot(x - V.x, z - V.z); if (dv < 90) h = Math.max(h, lerp(-9 + 1.5 * fbm(x * 0.08, z * 0.08, 2), h, smooth(10, 90, dv)));
  return h;
}
function uwAc() { return `  float murk=0.0;
  vec3 ab=vec3(exp(-dp*0.1),exp(-dp*0.022),exp(-dp*0.024));
  gl_FragColor.rgb*=ab;`; }
function pierAc() { const zs = acCoast(0); for (let z = zs; z > zs - 260; z -= 2) if (Hac(0, z) < -2.6) return { x: 0, z0: Math.max(z + 60, zs + 6), z1: z }; return { x: 0, z0: zs + 6, z1: zs - 90 }; }
function spotsAc() {
  const c = x => acCoast(x), F = acFarol();
  return [
    { id: 'anjos', name: 'Marina da Praia dos Anjos', x: PIER.x, z: PIER.z1 - 10, type: 'marina', desc: 'Porto dos pescadores de Arraial: venda do pescado, loja, combustível e viagens.' },
    { id: 'forno', name: 'Praia do Forno', x: -230, z: c(-230) - 140, r: 45, depth: '3–10 m', desc: 'Costão abrigado e água clarinha: sargo, salema, marimbá, budião e frade. Ótimo para começar.' },
    { id: 'porcos_ac', name: 'Ilha dos Porcos', x: acPorcos().x, z: acPorcos().z + 80, r: 50, depth: '5–18 m', desc: 'Costão da ilha cheio de tocas: garoupa, badejo, sargo e cangulo.' },
    { id: 'boqueirao', name: 'Boqueirão', x: 520, z: -200, r: 50, depth: '8–22 m', cur: [0.38, 0.08], desc: 'Canal entre o Pontal e a Ilha do Farol: correnteza forte e peixe de passagem. Olho-de-boi, xaréu, enchova e sororoca.' },
    { id: 'gruta', name: 'Gruta Azul', x: F.x + 390, z: F.z + 60, r: 45, depth: '4–15 m', noTake: true, desc: 'Área de preservação: SÓ FOTO. Gruta de água azul-turquesa no paredão da ilha, com tartarugas e cardumes.' },
    { id: 'cherne_ac', name: 'Saco do Cherne', x: F.x - 230, z: F.z - 230, r: 50, depth: '15–28 m', desc: 'Pé do paredão, fundo de pedra grande: garoupa, badejo e cherne nas tocas fundas.' },
    { id: 'pedravermelha', name: 'Pedra Vermelha', x: acPedra().x, z: acPedra().z, r: 50, depth: '9–25 m', desc: 'Pináculo isolado no azul. Olho-de-boi, enchova, bicuda e dourado rondando a pedra.' },
    { id: 'farol_fora', name: 'Paredão do Farol', x: F.x + 170, z: F.z - 280, r: 60, depth: '18–40 m', cur: [0.42, -0.15], desc: 'Lado de fora da ilha, mar aberto batendo no paredão: albacora, dourado e olho-de-boi grande. Correnteza e água fria.' },
    { id: 'naufragio_ac', name: 'Naufrágio do Inglês', x: 160, z: -260, r: 45, depth: '12–20 m', desc: 'Casco de ferro de um cargueiro antigo: garoupas, badejos e cardume de cocoroca dentro das chapas.' },
  ];
}
function noTakeAc(p) { const S = spotById('gruta'); return !!S && Math.hypot(p.x - S.x, p.z - S.z) < 110; }

// ---------- peixes: os da Costa Verde que também vivem em Arraial ----------
for (const k of ['sargo', 'marimba', 'salema', 'budiao', 'frade', 'garoupa', 'badejo', 'cherne', 'cangulo', 'xareu', 'enchova', 'sororoca', 'olhodeboi', 'bicuda', 'dourado', 'albacora', 'olhete', 'pampo', 'cocoroca', 'mero']) if (SPECIES[k]) SPECIES[k].regs = [...new Set([...(SPECIES[k].regs || ['cv']), 'ac'])];
function popAc() {
  return {
    forno: [['sargo', 4, [4, 8]], ['salema', 3, [6, 10]], ['marimba', 3, [5, 9]], ['budiao', 3, [1, 3]], ['frade', 2, [1, 2]], ['garoupa', 2, [1, 1]], ['cocoroca', 2, [6, 10]]],
    porcos_ac: [['garoupa', 5, [1, 1]], ['badejo', 3, [1, 1]], ['sargo', 3, [4, 8]], ['cangulo', 3, [1, 3]], ['salema', 2, [6, 10]], ['xareu', 2, [3, 6]], ['budiao', 2, [1, 2]]],
    boqueirao: [['olhodeboi', 4, [1, 3], 1, 1.2], ['xareu', 4, [3, 7]], ['enchova', 4, [3, 7]], ['sororoca', 3, [2, 5]], ['olhete', 3, [2, 5]], ['bicuda', 2, [1, 3]], ['garoupa', 2, [1, 1]]],
    gruta: [['frade', 3, [1, 2]], ['budiao', 3, [1, 3]], ['salema', 3, [6, 10]], ['sargo', 2, [4, 7]], ['marimba', 2, [5, 9]]],
    cherne_ac: [['garoupa', 5, [1, 1], 1, 1.25], ['badejo', 4, [1, 1], 1, 1.2], ['cherne', 3, [1, 1], 0.9], ['mero', 1, [1, 1], 0.5], ['cangulo', 2, [1, 3]], ['xareu', 2, [3, 6]]],
    pedravermelha: [['olhodeboi', 4, [1, 3], 1, 1.25], ['enchova', 3, [3, 7]], ['bicuda', 3, [1, 3]], ['dourado', 3, [2, 5]], ['olhete', 3, [2, 5]], ['xareu', 2, [3, 6]], ['garoupa', 2, [1, 1]]],
    farol_fora: [['albacora', 3, [3, 6], 0.8], ['dourado', 3, [2, 5]], ['olhodeboi', 4, [1, 3], 1, 1.35], ['enchova', 3, [3, 7]], ['bicuda', 2, [1, 3]], ['sororoca', 2, [2, 5]]],
    naufragio_ac: [['garoupa', 4, [1, 1], 1, 1.2], ['badejo', 3, [1, 1]], ['cocoroca', 4, [8, 14]], ['cherne', 1, [1, 1], 0.7], ['xareu', 2, [3, 6]], ['cangulo', 2, [1, 3]]],
  };
}
function popZoneAc() { return [['sargo', 1, [4, 7], 0.8], ['salema', 1, [5, 9], 0.7], ['garoupa', 2, [1, 1], 0.8], ['budiao', 1, [1, 2], 0.6], ['xareu', 1, [3, 5], 0.4], ['cangulo', 1, [1, 2], 0.6], ['enchova', 1, [3, 5], 0.35]]; }

// ---------- mundo: costões, paredão, pontal, laje e naufrágio ----------
function acRing(cx, cz, sx, n, seed, holeChance, spotNear) {
  const r = mulberry(seed);
  for (let k = 0; k < n; k++) {
    const a = r() * TAU, ca = Math.cos(a) * sx, sa = Math.sin(a); let shore = null;
    for (let d = 10; d < 400; d += 2) if (H(cx + ca * d, cz + sa * d) < -1.2) { shore = d; break; }
    if (shore == null) continue;
    const dd = shore + Math.pow(r(), 1.5) * 34, x = cx + ca * dd, z = cz + sa * dd, h = H(x, z); if (h > -1) continue;
    const rad = lerp(4.6, 1.1, (dd - shore) / 34) * (0.55 + r() * 0.7), R = addRock(x, h + rad * 0.25, z, rad, spotNear(x, z));
    if (rad > 2.2 && r() < holeChance) addHole(R, a + Math.PI + rand(-0.6, 0.6), R.spot);
  }
}
function buildRocksAc(r) {
  fitSpot('forno', 3, 10); fitSpot('porcos_ac', 5, 18); fitSpot('boqueirao', 8, 22); fitSpot('gruta', 4, 15); fitSpot('cherne_ac', 15, 28); fitSpot('pedravermelha', 9, 25); fitSpot('farol_fora', 18, 40); fitSpot('naufragio_ac', 12, 20);
  const spotNear = (x, z) => { let b = null, bd = 150; for (const s of SPOTS) if (s.r) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s.id; } } return b; };
  const F = acFarol(), P = acPorcos(), V = acPedra();
  acRing(F.x, F.z, 1.55, 1900, 301, 0.55, spotNear);   // paredão da Ilha do Farol, todo em volta
  acRing(P.x, P.z, 1, 320, 302, 0.5, spotNear);         // Ilha dos Porcos
  // Pontal do Atalaia: pedras dos dois lados da crista
  for (let i = 0; i < 260; i++) { const t = r(), x = lerp(380, 470, t) + (r() - 0.5) * 90, z = lerp(acCoast(380) - 10, -40, t) + (r() - 0.5) * 90, h = H(x, z); if (h > -1.2 || h < -20) continue; const rad = 1.2 + r() * 3.4, R = addRock(x, h + rad * 0.25, z, rad, spotNear(x, z)); if (rad > 2.6 && r() < 0.4) addHole(R, r() * TAU, R.spot); }
  // Pedra Vermelha: monte de pedras com tocas
  for (let i = 0; i < 110; i++) { const a = r() * TAU, d = Math.pow(r(), 0.75) * 55, x = V.x + Math.cos(a) * d, z = V.z + Math.sin(a) * d, rad = lerp(5, 1.2, d / 55) * (0.6 + r() * 0.7), R = addRock(x, H(x, z) + rad * 0.25, z, rad, 'pedravermelha'); if (rad > 2.4 && r() < 0.5) addHole(R, r() * TAU, 'pedravermelha'); }
  // costão da praia (Forno e arredores)
  for (let x = WB.x0 + 40; x < 380; x += 4.5) { if (r() < 0.55) continue; const z0 = acCoast(x); let z = z0; for (let i = 0; i < 60 && H(x, z) > -1.2; i++) z -= 3; z -= r() * 14; const h = H(x, z); if (h > -1 || h < -9) continue; const rad = 0.9 + r() * 2.2; addRock(x, h + rad * 0.25, z, rad, spotNear(x, z)); }
  // zonas de pesca no costão da ilha e da praia
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = F.x + Math.cos(a) * 1.55 * 285, z = F.z + Math.sin(a) * 285, h = H(x, z); if (h < -6 && SPOTS.every(s => Math.hypot(s.x - x, s.z - z) > 110)) ZONES.push({ id: 'zfa' + k, x, z, r: 40, zone: 'costao' }); }
  for (let x = WB.x0 + 120; x < 360; x += 190) { const z = acCoast(x) - 110, h = H(x, z); if (h < -3 && SPOTS.every(s => Math.hypot(s.x - x, s.z - z) > 110)) ZONES.push({ id: 'zpr' + Math.round(x), x, z, r: 40, zone: 'costao' }); }
}
function buildWorldAc() { const W = spotById('naufragio_ac'); buildWreck({ x: W.x, z: W.z, ry: -0.7, L: 38, spot: 'naufragio_ac' }); }
// terra: dunas brancas, restinga, casas da vila e o farol no alto da ilha
const ACFX = { lamp: null, beam: null };
function buildCoastAc() {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), pp = new V3(), bush = [], houses = [];
  for (let i = 0; i < 40000 && bush.length < 2600; i++) {
    const x = rand(WB.x0 - 200, WB.x1 + 200), z = rand(-480, 1300), h = H(x, z);
    if (h < 1.6 || (Math.abs(x - PIER.x) < 22 && z < PIER.z0 + 12)) continue;
    if (h > 3 || Math.random() < 0.5) bush.push([x, h, z]);
  }
  for (let i = 0; i < 8000 && houses.length < 70; i++) { const x = rand(-480, 380), z = acCoast(x) + rand(35, 260), h = H(x, z); if (h > 1.5 && h < 30 && Math.abs(x - PIER.x) > 22) houses.push([x, h, z]); }
  // restinga: arbustos baixos e arredondados (vento forte do cabo)
  const bG = new THREE.IcosahedronGeometry(1.6, 0); bG.scale(1.4, 0.7, 1.4); bG.translate(0, 0.5, 0);
  const bIM = new THREE.InstancedMesh(bG, new THREE.MeshLambertMaterial({ color: 0xffffff }), bush.length);
  bush.forEach((t, i) => { const k = rand(0.6, 1.8); s.set(k, k * rand(0.7, 1.2), k); pp.set(t[0], t[1] - 0.3, t[2]); q.setFromAxisAngle(new V3(0, 1, 0), rand(0, TAU)); m4.compose(pp, q, s); bIM.setMatrixAt(i, m4); bIM.setColorAt(i, new THREE.Color().setHSL(rand(0.22, 0.3), 0.35, rand(0.2, 0.32))); });
  scene.add(bIM); LAND.push(bIM);
  const hG = new THREE.BoxGeometry(6, 3.6, 7); hG.translate(0, 1.8, 0); const rG = new THREE.ConeGeometry(5, 2.2, 4); rG.rotateY(Math.PI / 4); rG.translate(0, 4.7, 0);
  const HC = [0xffffff, 0xf4f0e4, 0x9fd4e8, 0xf6d48a, 0xe8b0a8, 0xb8e0c0];
  const hIM = new THREE.InstancedMesh(hG, new THREE.MeshLambertMaterial({ color: 0xffffff }), houses.length), rIM = new THREE.InstancedMesh(rG, new THREE.MeshLambertMaterial({ color: 0xb4532a }), houses.length);
  houses.forEach((t, i) => { const k = rand(0.8, 1.3); q.setFromAxisAngle(new V3(0, 1, 0), rand(-0.3, 0.3)); s.set(k, k, k); pp.set(t[0], t[1] - 0.3, t[2]); m4.compose(pp, q, s); hIM.setMatrixAt(i, m4); rIM.setMatrixAt(i, m4); hIM.setColorAt(i, new THREE.Color(HC[i % HC.length])); });
  scene.add(hIM, rIM); LAND.push(hIM, rIM);
  // o farol no alto da ilha: torre branca e lanterna que acende à noite
  const F = acFarol(), fy = H(F.x, F.z), g = new THREE.Group(); g.position.set(F.x, fy - 1, F.z);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 18, 12), new THREE.MeshLambertMaterial({ color: 0xf6f6f2 })); tower.position.y = 9; g.add(tower);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.6, 2.4, 12), new THREE.MeshLambertMaterial({ color: 0xc8302a })); band.position.y = 13; g.add(band);
  ACFX.lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 10), new THREE.MeshStandardMaterial({ color: 0xfff4c8, emissive: 0xffe9a0, emissiveIntensity: 0.2 })); ACFX.lamp.position.y = 19.4; g.add(ACFX.lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2, 10), new THREE.MeshLambertMaterial({ color: 0xc8302a })); cap.position.y = 21.6; g.add(cap);
  ACFX.beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xfff0b0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); ACFX.beam.position.y = 19.4; ACFX.beam.scale.setScalar(0.1); g.add(ACFX.beam);
  scene.add(g);
}
function updateAc(dt, t) {
  if (!AC || !ACFX.lamp) return;
  // o farol pisca à noite (um lampejo a cada 10 s, visível de longe)
  const night = clamp((0.5 - DAY.amb) * 3, 0, 1), flash = Math.max(0, Math.sin(t * TAU / 10) * 4 - 3);
  ACFX.lamp.material.emissiveIntensity = 0.2 + night * (0.6 + flash * 1.5);
  const d = camera.position.distanceTo(ACFX.beam.getWorldPosition(_t1));
  ACFX.beam.visible = night > 0.05; ACFX.beam.scale.setScalar(night * (6 + flash * 18) * clamp(d / 400, 0.5, 4));
}

// ---------- textos, eventos e chegada ----------
function evAc() {
  return [
    { reg: 'ac', id: 'ressur_ac', when: () => COND.vis > 1.25, spot: 'farol_fora', key: 'olhodeboi', n: [3, 6], msg: 'Ressurgência: a água fria e azul subiu no Paredão do Farol e o olho-de-boi encostou!' },
    { reg: 'ac', id: 'manha_ac', when: () => SV.tod >= 6 && SV.tod < 10, spot: 'boqueirao', key: 'enchova', n: [4, 8], msg: 'Maré virando de manhã: cardume de enchova passando no Boqueirão.' },
    { reg: 'ac', id: 'lua_ac', when: () => fullMoon() && (SV.tod >= 19 || SV.tod < 5), spot: 'cherne_ac', key: 'badejo', n: [1, 2], msg: 'Lua cheia: badejos grandes saíram das tocas no Saco do Cherne.' },
  ];
}
function eventsAcHTML() {
  const ev = [];
  if (weekend()) ev.push(['Torneio do fim de semana', 'Campeonatos pagam o dobro hoje.']);
  ev.push(['Maré', 'De manhã a maré vira e a enchova passa no Boqueirão.']);
  if (fullMoon()) ev.push(['Lua cheia', 'À noite, badejos grandes no Saco do Cherne.']);
  if (COND.vis > 1.25) ev.push(['Ressurgência', 'Água fria e azul: olho-de-boi e dourado no Paredão do Farol e na Pedra Vermelha.']);
  return `<div class="it" style="margin-bottom:8px"><div><div class="n">${weekday()} · eventos do dia</div><div class="d">${ev.map(([n, d]) => `<b>${n}:</b> ${d}`).join('<br>')}</div></div></div>`;
}
function bulletinAc() {
  return `<div class="it"><div><div class="n">Visibilidade</div><div class="d">${COND.vis > 1.25 ? 'Ressurgência: água fria e cristalina, mais de 20 m de visibilidade. Dia de ir no Paredão do Farol.' : COND.vis < 0.8 ? 'Vento sul mexeu a água: fique na Praia do Forno e na Ilha dos Porcos.' : 'Água azul e fria, boa em todo lugar.'}</div></div></div>
    <div class="it"><div><div class="n">Mar</div><div class="d">${COND.swell > 1.25 ? 'Mar grande batendo no paredão de fora: cuidado no Boqueirão e no Paredão do Farol.' : 'Mar tranquilo por dentro da ilha.'}</div></div></div>
    <div class="it"><div><div class="n">Regras</div><div class="d">A Gruta Azul é área de preservação: só foto. Mero é protegido. Na vida real, Arraial é Reserva Extrativista Marinha e a pesca sub tem regras próprias: informe-se antes.</div></div></div>`;
}
function setupAc() {
  if (!AC) return;
  $('menuReg').textContent = 'PESCA SUB · ARRAIAL DO CABO'; $('menuTag').textContent = 'Apneia na água fria e cristalina do cabo'; $('mapTitle').textContent = 'Carta náutica · Arraial do Cabo';
  if (!SV.acVisited) { SV.acVisited = true; save(); setTimeout(() => { toast('Bem-vindo a Arraial do Cabo! A ressurgência traz água fria e muito clara: dá para ver o peixe de longe, e ele também vê você.', 7, 'gold'); toast('Na vida real, Arraial é Reserva Extrativista Marinha: a pesca subaquática tem regras próprias. Informe-se antes.', 7); }, 1500); }
}
