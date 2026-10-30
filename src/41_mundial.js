// ================= Mundial de Pesca Sub: evento grande todo domingo =================
// frota de equipes de vários países ancorada em volta da arena, boias marcando a área, barco da organização
// com faixas dos patrocinadores, helicóptero e lancha da TV. Duas baterias, pesagem, pódio e prêmios das empresas.
const WORLD = { scene: null, day: 0, boats: [], heli: null, tv: null, buoys: null, chk: 0, hornT: 0 };
const WORLD_ARENA = { cv: 'laje', ne: 'cabecos', amz: 'lago' };
const WORLD_FEE = 500, WORLD_BAT = 420, WORLD_GAP = 25; // inscrição, duração de cada bateria e do intervalo (s)
// marcas inventadas (nada de empresas reais)
const SPONSORS = [
  { name: 'NETUNO', sub: 'Arbaletes', col: '#0d3b66', ink: '#f4d35e', prize: 'maior peixe', val: 2500 },
  { name: 'AZUL PROFUNDO', sub: 'Roupas de mergulho', col: '#1b6ca8', ink: '#ffffff', prize: 'mais espécies', val: 1500 },
  { name: 'MARÉ ALTA', sub: 'Combustíveis', col: '#c0392b', ink: '#ffffff', prize: 'melhor estreante', val: 1000 },
  { name: 'CORAL', sub: 'Relógios de mergulho', col: '#e07a5f', ink: '#1d1d1d', prize: '', val: 0 },
  { name: 'TUBARÃO', sub: 'Energético', col: '#111111', ink: '#7bd389', prize: '', val: 0 },
  { name: 'GAROUPA', sub: 'Seguros náuticos', col: '#3d405b', ink: '#f2cc8f', prize: '', val: 0 },
];
// equipes: país, cores da bandeira (desenho simples), cor da roupa e força
const TEAMS = [
  ['Itália', [['v', '#009246', '#ffffff', '#ce2b37']], 0x1d4f2a, 0.3], ['Espanha', [['h', '#aa151b', '#f1bf00', '#aa151b']], 0x7a1a14, 0.29],
  ['Croácia', [['h', '#ff0000', '#ffffff', '#171796']], 0x2a2a7a, 0.31], ['Portugal', [['v2', '#006600', '#ff0000']], 0x305a20, 0.27],
  ['França', [['v', '#0055a4', '#ffffff', '#ef4135']], 0x1a3a7a, 0.28], ['Grécia', [['st', '#0d5eaf', '#ffffff']], 0x2a5a9a, 0.27],
  ['Chile', [['h2', '#ffffff', '#d52b1e']], 0x8a2020, 0.25], ['México', [['v', '#006847', '#ffffff', '#ce1126']], 0x1a5a3a, 0.24],
  ['Peru', [['v', '#d91023', '#ffffff', '#d91023']], 0x9a1a1a, 0.24], ['África do Sul', [['h', '#e03c31', '#007749', '#001489']], 0x1a4a2a, 0.23],
  ['Japão', [['jp', '#ffffff', '#bc002d']], 0xdadada, 0.26],
];
const isWorldDay = () => (SV.day || 1) % 7 === 0; // todo domingo
const daysToWorld = () => (7 - (SV.day || 1) % 7) % 7;
const worldSpot = () => spotById(WORLD_ARENA[REGION]) || SPOTS.find(s => s.r);

// ---------- texturas ----------
function flagTex(spec) {
  return canvasTex(96, 64, g => {
    const [k, a, b, c] = spec[0];
    if (k === 'v') { g.fillStyle = a; g.fillRect(0, 0, 32, 64); g.fillStyle = b; g.fillRect(32, 0, 32, 64); g.fillStyle = c; g.fillRect(64, 0, 32, 64); }
    else if (k === 'v2') { g.fillStyle = a; g.fillRect(0, 0, 38, 64); g.fillStyle = b; g.fillRect(38, 0, 58, 64); }
    else if (k === 'h') { g.fillStyle = a; g.fillRect(0, 0, 96, 22); g.fillStyle = b; g.fillRect(0, 21, 96, 22); g.fillStyle = c; g.fillRect(0, 42, 96, 22); }
    else if (k === 'h2') { g.fillStyle = a; g.fillRect(0, 0, 96, 32); g.fillStyle = b; g.fillRect(0, 32, 96, 32); }
    else if (k === 'st') { for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * 7.2, 96, 7.2); } }
    else if (k === 'jp') { g.fillStyle = a; g.fillRect(0, 0, 96, 64); g.fillStyle = b; g.beginPath(); g.arc(48, 32, 18, 0, TAU); g.fill(); }
    else if (k === 'br') { g.fillStyle = '#009c3b'; g.fillRect(0, 0, 96, 64); g.fillStyle = '#ffdf00'; g.beginPath(); g.moveTo(48, 6); g.lineTo(90, 32); g.lineTo(48, 58); g.lineTo(6, 32); g.fill(); g.fillStyle = '#002776'; g.beginPath(); g.arc(48, 32, 14, 0, TAU); g.fill(); }
  });
}
function bannerTex(sp, w = 512, h = 96) {
  return canvasTex(w, h, g => {
    g.fillStyle = sp.col; g.fillRect(0, 0, w, h); g.fillStyle = sp.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${h * 0.46}px system-ui, sans-serif`; g.fillText(sp.name, w / 2, h * 0.42); g.font = `600 ${h * 0.2}px system-ui, sans-serif`; g.fillText(sp.sub.toUpperCase(), w / 2, h * 0.82);
  });
}
function titleTex() {
  return canvasTex(1024, 160, g => {
    const gr = g.createLinearGradient(0, 0, 1024, 0); gr.addColorStop(0, '#0a2a3a'); gr.addColorStop(0.5, '#0e4a5e'); gr.addColorStop(1, '#0a2a3a');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 160); g.fillStyle = '#ffb020'; g.fillRect(0, 0, 1024, 10); g.fillRect(0, 150, 1024, 10);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 64px system-ui, sans-serif'; g.fillText('MUNDIAL DE PESCA SUB', 512, 66);
    g.fillStyle = '#7ff0d8'; g.font = '700 30px system-ui, sans-serif'; g.fillText('APNEIA · ARBALETE · ' + (AMZ ? 'TAPAJÓS' : NE ? 'COSTA DOS CORAIS' : 'COSTA VERDE'), 512, 122);
  });
}

// ---------- juntar as peças de um modelo em poucas malhas (uma por material): frota inteira sem pesar ----------
function mergeGroup(g) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), by = new Map(), m4 = new THREE.Matrix4();
  g.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    const k = o.material.uuid; if (!by.has(k)) by.set(k, { mat: o.material, list: [] }); by.get(k).list.push(geo);
  });
  const out = new THREE.Group();
  for (const { mat, list } of by.values()) {
    const names = ['position', 'normal', 'uv', 'color'].filter(n => list.every(gg => gg.attributes[n]));
    const merged = new THREE.BufferGeometry();
    for (const n of names) {
      const sz = list[0].attributes[n].itemSize; let len = 0; list.forEach(gg => len += gg.attributes[n].count * sz);
      const arr = new Float32Array(len); let off = 0; list.forEach(gg => { arr.set(gg.attributes[n].array, off); off += gg.attributes[n].count * sz; });
      merged.setAttribute(n, new THREE.BufferAttribute(arr, sz));
    }
    if (!merged.attributes.normal) merged.computeVertexNormals();
    out.add(new THREE.Mesh(merged, mat));
  }
  return out;
}

// ---------- cenário do evento ----------
function teamBoat(team, i, x, z, yaw) {
  const [name, flag, suit] = team, col = new THREE.Color(suit);
  const paint = { top: [0.95, 0.96, 0.97], stripe: [col.r, col.g, col.b] };
  const g = buildBoatModel(i % 3, paint);
  // mastro com a bandeira do país e placa do patrocinador
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6 }));
  pole.position.set(0, 2.0, -3.0); g.add(pole);
  const fm = new THREE.MeshStandardMaterial({ map: flagTex(flag), side: THREE.DoubleSide, roughness: 0.8 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), fm); fl.position.set(0.47, 2.85, -3.0); fl.rotation.y = Math.PI / 2; g.add(fl);
  const sp = SPONSORS[i % SPONSORS.length], bm = new THREE.MeshStandardMaterial({ map: bannerTex(sp, 256, 48), roughness: 0.7, side: THREE.DoubleSide });
  for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), bm); b.position.set(s * 1.27, 0.95, 0.3); b.rotation.y = s * Math.PI / 2; g.add(b); }
  const m = mergeGroup(g); m.position.set(x, 0, z); m.rotation.y = yaw; m.userData = { x, z, yaw, ph: rand(0, TAU) };
  return m;
}
function orgBoat(x, z, yaw) {
  const g = buildBoatModel(3);
  const pm = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.5 });
  for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.5, 6), pm); p.position.set(s * 2.2, 3.2, -1); g.add(p); }
  const t = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.72), new THREE.MeshStandardMaterial({ map: titleTex(), side: THREE.DoubleSide, roughness: 0.7 })); t.position.set(0, 5.0, -1); g.add(t);
  SPONSORS.slice(0, 4).forEach((sp, k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.38), new THREE.MeshStandardMaterial({ map: bannerTex(sp, 256, 48), side: THREE.DoubleSide })); b.position.set(k < 2 ? 1.4 : -1.4, 1.05, (k % 2 ? -1.6 : 1.4)); b.rotation.y = k < 2 ? Math.PI / 2 : -Math.PI / 2; g.add(b); });
  const m = mergeGroup(g); m.scale.setScalar(1.25); m.position.set(x, 0, z); m.rotation.y = yaw; m.userData = { x, z, yaw, ph: 0 };
  return m;
}
function buildHeli() {
  const g = new THREE.Group(), red = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.4, metalness: 0.3 }), dk = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10).scale(1.0, 0.85, 1.7), red); g.add(body);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8, 0, TAU, 0, Math.PI / 2).rotateX(-Math.PI / 2).scale(1, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0x223844, transparent: true, opacity: 0.6 })); glass.position.set(0, 0.15, 1.1); g.add(glass);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 3.6, 8).rotateX(Math.PI / 2), red); boom.position.set(0, 0.2, -2.9); g.add(boom);
  for (const s of [1, -1]) { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.6), dk); sk.position.set(s * 0.75, -1.05, 0.1); g.add(sk); }
  const rotor = new THREE.Group(); for (let k = 0; k < 2; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.04, 0.28), dk); bl.rotation.y = k * Math.PI / 2; rotor.add(bl); } rotor.position.y = 1.05; g.add(rotor);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.16), dk); tr.position.set(0.25, 0.4, -4.6); g.add(tr);
  g.userData.rotor = rotor; g.userData.tail = tr; return g;
}
function buildWorldScene() {
  const S = worldSpot(); if (!S) return;
  const grp = new THREE.Group(); WORLD.boats = [];
  // frota em anel em volta da arena, proas apontando para fora
  const ring = 82, n = TEAMS.length + 1;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + 0.3; let x = S.x + Math.cos(a) * ring, z = S.z + Math.sin(a) * ring;
    for (let k = 0; k < 10 && H(x, z) > -2.5; k++) { x += Math.cos(a) * 8; z += Math.sin(a) * 8; }
    const team = i < TEAMS.length ? TEAMS[i] : ['Brasil', [['br']], 0x1a7a3a, 0];
    const b = teamBoat(team, i, x, z, -a + Math.PI / 2); b.userData.team = team[0]; grp.add(b); WORLD.boats.push(b);
  }
  // organização do lado de fora do anel, de frente para a arena
  let ox = S.x + Math.cos(-0.25) * (ring + 30), oz = S.z + Math.sin(-0.25) * (ring + 30); for (let k = 0; k < 10 && H(ox, oz) > -2.5; k++) { ox += 8; }
  const org = orgBoat(ox, oz, 0.25 + Math.PI / 2); grp.add(org); WORLD.boats.push(org);
  // boias laranja marcando a arena
  const bG = new THREE.SphereGeometry(0.45, 10, 8), N = 32, bim = new THREE.InstancedMesh(bG, new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.4 }), N), m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { const a = i / N * TAU; m4.makeTranslation(S.x + Math.cos(a) * 130, 0.1, S.z + Math.sin(a) * 130); bim.setMatrixAt(i, m4); }
  grp.add(bim); WORLD.buoys = bim;
  // lancha da TV e helicóptero rodando
  WORLD.tv = mergeGroup(buildBoatModel(1)); grp.add(WORLD.tv);
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.7), new THREE.MeshStandardMaterial({ color: 0x111111 })); cam.position.set(0, 1.9, 2.5); WORLD.tv.add(cam);
  WORLD.heli = buildHeli(); grp.add(WORLD.heli);
  scene.add(grp); WORLD.scene = grp; WORLD.day = SV.day; WORLD.S = S;
}
function clearWorldScene() { if (WORLD.scene) { scene.remove(WORLD.scene); WORLD.scene = null; WORLD.boats = []; } }
function updateWorldScene(dt, t) {
  if ((WORLD.chk -= dt) <= 0) {
    WORLD.chk = 3;
    if (isWorldDay() && !WORLD.scene && started) {
      buildWorldScene();
      toast(`🏆 Hoje é dia do MUNDIAL DE PESCA SUB na ${worldSpot().name}! ${TEAMS.length} países na água. Inscrição na LOJA › Campeonato.`, 7, 'gold'); AU.coin();
    }
    if (!isWorldDay() && WORLD.scene && !(COMP.on && COMP.world)) clearWorldScene();
  }
  if (!WORLD.scene) return;
  const S = WORLD.S, under = camUnder;
  for (const b of WORLD.boats) { const u = b.userData; b.position.y = waveH(u.x, u.z, t) * 0.8; b.rotation.set(Math.sin(t * 0.8 + u.ph) * 0.03, u.yaw, Math.cos(t * 0.7 + u.ph) * 0.04, 'YXZ'); b.visible = !under || camera.position.distanceTo(b.position) < 60; }
  const tv = WORLD.tv, ta = t * 0.045; tv.position.set(S.x + Math.cos(ta) * 112, waveH(S.x, S.z, t) * 0.8, S.z + Math.sin(ta) * 112); tv.rotation.y = -ta;
  const h = WORLD.heli, ha = t * 0.09; h.position.set(S.x + Math.cos(ha) * 150, 55 + Math.sin(t * 0.3) * 4, S.z + Math.sin(ha) * 150); h.rotation.set(0.08, -ha, -0.15);
  h.userData.rotor.rotation.y += dt * 28; h.userData.tail.rotation.x += dt * 40; h.visible = !under;
  // barulho do helicóptero quando perto
  if (!under && camera.position.distanceTo(h.position) < 220 && (WORLD.hornT -= dt) <= 0) { WORLD.hornT = 0.11; AU.burst(0.08, 140, 'lowpass', 0.12 * (1 - camera.position.distanceTo(h.position) / 220)); }
}

// ---------- a prova ----------
function startWorld() {
  if (COMP.on || !isWorldDay()) return;
  if (SV.money < WORLD_FEE) { toast(`A inscrição do Mundial custa ${fmtR(WORLD_FEE)}.`, 3, 'bad'); return; }
  if (!WORLD.scene) buildWorldScene();
  SV.money -= WORLD_FEE; save(); closePanels();
  const S = WORLD.S, me = WORLD.boats[TEAMS.length].userData;
  if (P.mode === 'swim') climbBoat();
  BOAT.pos.set(me.x + Math.cos(me.yaw) * 5, 0, me.z - Math.sin(me.yaw) * 5); BOAT.speed = 0; if (BOAT.vel) BOAT.vel.set(0, 0, 0); BOAT.anchored = false; toggleAnchor();
  // peixe extra na arena: a organização escolheu o melhor pesqueiro
  const pop = (AMZ ? popAmz() : NE ? popNe() : POP)[S.id] || [];
  for (const [key, groups, [a, b]] of pop) for (let g = 0; g < groups; g++) spawnGroup(S, key, Math.round(rand(a, b)), 1.15);
  // um atleta de cada país, saindo do próprio barco (força × 0,55: forte, mas dá para ganhar)
  COMP.bots = TEAMS.map((tm, i) => {
    const u = WORLD.boats[i].userData, b = makeBot({ id: 'w' + i, name: tm[0], col: 0, lvl: 2, spec: 'toca' }, new V3(u.x, -0.2, u.z));
    b.rig.suitMat.color.set(tm[2]); b.skill = tm[3] * 0.55; b.team = tm[0]; b.sp = new Set(); b.best = 0; b.c = { x: lerp(u.x, S.x, 0.55), z: lerp(u.z, S.z, 0.55), r: 70 }; b.pref = null; return b;
  });
  COMP.on = true; COMP.world = { phase: 1, sp: new Set(), best: 0, bestBy: '', bestKey: '' }; COMP.t = WORLD_BAT; COMP.spot = S; COMP.me = { n: 0, kg: 0 }; COMP.lives = []; COMP.live = null; COMP.duo = null; COMP.mult = 1;
  jumpIn(); P.o2 = 1;
  $('compHud').classList.remove('hide');
  toast(`🏆 MUNDIAL DE PESCA SUB · 1ª bateria valendo! ${WORLD_BAT / 60} minutos. Pontos: 10 por kg + 5 por espécie diferente. Peixe pequeno ou protegido desclassifica o peixe.`, 7, 'gold');
  AU.tone(220, 200, 1.4, 0.35, 'sawtooth'); AU.tone(330, 300, 1.4, 0.2, 'sawtooth');
}
const worldPts = (kg, nsp) => Math.round(kg * 10 + nsp * 5);
function worldRows() {
  const w = COMP.world;
  return [{ name: '🇧🇷 Brasil (você)', pts: worldPts(COMP.me.kg, w.sp.size), kg: COMP.me.kg, n: COMP.me.n, nsp: w.sp.size, me: true },
    ...COMP.bots.map(b => ({ name: b.team, pts: worldPts(b.kg, b.sp.size), kg: b.kg, n: b.n, nsp: b.sp.size }))].sort((a, b) => b.pts - a.pts);
}
function worldCatch(f) {
  const w = COMP.world; w.sp.add(f.key);
  if (f.kg > w.best) { w.best = f.kg; w.bestBy = 'Brasil (você)'; w.bestKey = f.sp.name; toast(`Maior peixe do Mundial até agora: ${f.sp.name} de ${fmtKg(f.kg)} kg!`, 3, 'gold'); }
}
function worldBotCatch(b, f) {
  const w = COMP.world; b.n++; b.kg += f.kg; b.sp.add(f.key);
  if (f.kg > w.best) { w.best = f.kg; w.bestBy = b.team; w.bestKey = f.sp.name; }
  if (f.kg > 6 || Math.random() < 0.15) toast(`📻 ${b.team}: ${f.sp.name.toLowerCase()} de ${fmtKg(f.kg)} kg`, 2.2);
}
function worldUpdate(dt, t) {
  const w = COMP.world; COMP.t -= dt;
  if (w.phase !== 'gap') for (const b of COMP.bots) stepBot(b, dt, t, b.c, worldBotCatch);
  const rows = worldRows(), mm = Math.max(0, Math.ceil(COMP.t)), tt = `${Math.floor(mm / 60)}:${String(mm % 60).padStart(2, '0')}`, pos = rows.findIndex(r => r.me);
  const top = rows.slice(0, 5), mine = pos >= 5 ? `<div class="cr me"><span>${pos + 1}º Brasil</span><b>${rows[pos].pts} pts</b></div>` : '';
  $('compHud').innerHTML = `<div class="ct ${COMP.t < 60 ? 'low' : ''}">🏆 ${w.phase === 'gap' ? 'Intervalo' : w.phase + 'ª bateria'} · ${tt}</div>` +
    top.map((r, i) => `<div class="cr ${r.me ? 'me' : ''}"><span>${i + 1}º ${r.me ? 'Brasil' : r.name}</span><b>${r.pts} pts</b></div>`).join('') + mine;
  if (COMP.t > 0) return;
  if (w.phase === 1) { w.phase = 'gap'; COMP.t = WORLD_GAP; toast(`Fim da 1ª bateria! Você está em ${pos + 1}º. Respire: a 2ª bateria começa em ${WORLD_GAP} s.`, 6, 'gold'); AU.tone(220, 200, 1, 0.3, 'sawtooth'); for (const b of COMP.bots) { b.state = 'up'; b.target = null; } }
  else if (w.phase === 'gap') { w.phase = 2; COMP.t = WORLD_BAT; toast('2ª bateria valendo! Última chance.', 4, 'gold'); AU.tone(220, 200, 1.4, 0.35, 'sawtooth'); AU.tone(330, 300, 1.4, 0.2, 'sawtooth'); }
  else endWorld(rows);
}
function endWorld(rows) {
  const w = COMP.world; COMP.on = false; COMP.world = null; $('compHud').classList.add('hide');
  for (const b of COMP.bots) scene.remove(b.rig.root); COMP.bots = [];
  const pos = rows.findIndex(r => r.me), PR = [15000, 8000, 5000, 2000, 2000, 1000, 1000, 500, 500, 500, 500, 500];
  let prize = PR[pos] || 0; const extras = [];
  // prêmios das empresas
  if (w.bestBy === 'Brasil (você)') { prize += SPONSORS[0].val; extras.push(`🎯 ${SPONSORS[0].name} · maior peixe (${w.bestKey} de ${fmtKg(w.best)} kg): ${fmtR(SPONSORS[0].val)}`); }
  const maxSp = Math.max(...rows.map(r => r.nsp)); if (rows[pos].nsp === maxSp && maxSp > 0) { prize += SPONSORS[1].val; extras.push(`🐠 ${SPONSORS[1].name} · mais espécies (${maxSp}): ${fmtR(SPONSORS[1].val)}`); }
  SV.worlds = SV.worlds || []; if (!SV.worlds.length) { prize += SPONSORS[2].val; extras.push(`⭐ ${SPONSORS[2].name} · melhor estreante: ${fmtR(SPONSORS[2].val)}`); }
  SV.worlds.push({ day: SV.day, reg: REGION, pos: pos + 1, pts: rows[pos].pts }); if (pos === 0) SV.worldTitles = (SV.worldTitles || 0) + 1;
  SV.money += prize; addXP([2000, 1200, 800, 400][pos] || 200); save();
  paused = true; $('marinaPanel').classList.remove('hide');
  $('marinaPanel').querySelector('h2').textContent = '🏆 Resultado do Mundial';
  $('mSub').textContent = pos === 0 ? 'CAMPEÃO MUNDIAL! O Brasil é campeão!' : pos < 3 ? `Pódio! O Brasil ficou em ${pos + 1}º no Mundial.` : `O Brasil ficou em ${pos + 1}º de ${rows.length}.`;
  $('mTabs').innerHTML = '';
  const medal = i => ['🥇', '🥈', '🥉'][i] || `${i + 1}º`;
  $('mBody').innerHTML = `<div class="list">` + rows.map((r, i) => `<div class="it" ${r.me ? 'style="border-color:var(--acc)"' : ''}><div><div class="n">${medal(i)} ${r.me ? '🇧🇷 Brasil (você)' : r.name}</div><div class="d">${r.n} peixe(s) · ${fmtKg(r.kg)} kg · ${r.nsp} espécie(s)</div></div><b>${r.pts} pts</b></div>`).join('') + '</div>' +
    `<div class="it" style="margin-top:8px;flex-direction:column;align-items:stretch"><div class="n">Prêmios</div><div class="d">Colocação: ${fmtR(PR[pos] || 0)}${extras.length ? '<br>' + extras.join('<br>') : ''}<br><b>Total: ${fmtR(prize)}</b> (já no saldo). Os peixes continuam na fieira e na caixa para vender.</div></div>`;
  AU.coin(); if (pos < 3) { AU.tone(523, 784, 0.5, 0.2, 'triangle'); AU.tone(659, 988, 0.6, 0.18, 'triangle', 0.2); }
}
// ---------- cartão na aba Campeonato ----------
function worldHTML(at) {
  const S = worldSpot(), d = daysToWorld(), done = (SV.worlds || []).some(x => x.day === SV.day);
  const hist = (SV.worlds || []).slice(-3).reverse().map(x => `dia ${x.day}: ${x.pos}º`).join(' · ');
  return `<div class="it" style="margin-bottom:10px;border-color:var(--acc);flex-wrap:wrap"><div style="flex:1;min-width:240px"><div class="n">🏆 Mundial de Pesca Sub · ${S.name}</div>
    <div class="d">${TEAMS.length + 1} países, 2 baterias de ${WORLD_BAT / 60} min. Pontos: 10 por kg + 5 por espécie. 1º lugar ${fmtR(15000)} · patrocinadores pagam maior peixe (${SPONSORS[0].name}), mais espécies (${SPONSORS[1].name}) e melhor estreante (${SPONSORS[2].name}). Inscrição ${fmtR(WORLD_FEE)}.${SV.worldTitles ? ` · 🥇 Títulos: ${SV.worldTitles}` : ''}${hist ? `<br>Seus Mundiais: ${hist}` : ''}</div></div>
    ${isWorldDay() ? (done ? '<span class="d">Você já competiu hoje</span>' : `<button class="btn gold" id="worldGo" ${COMP.on || SV.money < WORLD_FEE ? 'disabled' : ''}>INSCREVER-SE</button>`) : `<div style="text-align:right"><div class="d">Próximo: domingo (dia ${(SV.day || 1) + d})</div>${at ? `<button class="btn alt" id="worldWait" style="margin-top:4px">ESPERAR ATÉ O MUNDIAL</button>` : ''}</div>`}</div>`;
}
function bindWorld() {
  const g = $('worldGo'); if (g) g.onclick = () => startWorld();
  const w = $('worldWait'); if (w) w.onclick = () => { let rem = daysToWorld() * 24 - (SV.tod || 0) + 8; while (rem > 0) { const s = Math.min(rem, 23); waitHours(s); rem -= s; } save(); renderShop(); toast('Domingo, 8h: dia do Mundial!', 3, 'gold'); };
}
