// ================= encontros raros: tubarão-baleia, raia-manta, mero gigante, pirarucu gigante =================
// um encontro sorteado por dia (pode não ter), numa hora e num ponto; o rádio dos pescadores avisa.
// chegar perto embaixo d'água conta o encontro; foto paga bem. Nenhum pode ser pescado.
const RARE = { today: null, on: null, chk: 0, warned: false };
const RARE_DEF = {
  cv: [['tubbaleia', ['fora', 'plataforma', 'lajefunda', 'aventureiro'], 0.2], ['manta', ['laje', 'fora', 'pedrameio', 'castelhanos'], 0.25], ['merogig', ['naufragio', 'cargueiro', 'rebocador'], 0.3]],
  ne: [['tubbaleia', ['parcel_ne', 'paredefunda', 'sueste'], 0.25], ['manta', ['parcel_ne', 'cabecos', 'paredefunda'], 0.3], ['merogig', ['naufragio_ne', 'cargueiro_ne'], 0.35]],
  amz: [['pirarucugig', ['lago', 'pocao', 'negro'], 0.6]],
};
const RARE_INFO = {
  tubbaleia: { name: 'Tubarão-baleia', radio: 'um tubarão-baleia', sci: 'Rhincodon typus', hab: 'Mar aberto e água azul, perto da superfície.', fact: 'O maior peixe do mundo (até 12 m), mas só come plâncton. Manso e protegido: nade ao lado, nunca encoste.' },
  manta: { name: 'Raia-manta', radio: 'uma raia-manta', sci: 'Mobula birostris', hab: 'Parcéis e lajes com água azul.', fact: 'Pode passar de 5 m de ponta a ponta das asas. Curiosa: se você ficar parado, ela vem dar uma volta. Protegida.' },
  merogig: { name: 'Mero gigante', radio: 'um mero gigante', sci: 'Epinephelus itajara', hab: 'Naufrágios fundos.', fact: 'Os maiores passam de 2,5 m e 300 kg e vivem mais de 30 anos. Protegido: só foto.' },
  pirarucugig: { name: 'Pirarucu gigante', radio: 'um pirarucu gigante', sci: 'Arapaima gigas', hab: 'Lagos e poções fundos do rio.', fact: 'Exemplar de quase 3 m, sobe para respirar com um estalo. Protegido: só foto.' },
};
// fichas no guia de espécies (aparecem depois do primeiro encontro ou foto)
['tubbaleia', 'manta'].forEach(k => GUIDE_EXTRA.push([k, RARE_INFO[k].name, RARE_INFO[k].sci, RARE_INFO[k].hab, RARE_INFO[k].fact]));
// sorteio do dia
function rollRare() {
  const r = mulberry((SV.day || 1) * 613 + 5), defs = (RARE_DEF[REGION] || []);
  RARE.today = null;
  for (const [kind, spots, p] of defs) {
    if (r() >= p || RARE.today) continue;
    const ok = spots.filter(id => spotById(id)); if (!ok.length) continue;
    RARE.today = { kind, spot: ok[Math.floor(r() * ok.length)], hour: lerp(8, 15, r()), seen: false };
  }
  RARE.dayRolled = SV.day; RARE.warned = false;
}
function rareTxt() { const d = RARE.today; return d && RARE.on ? `Rádio: ${RARE_INFO[d.kind].radio} está no ${spotById(d.spot).name}!` : ''; }

// ---------- modelos ----------
function whaleTex() {
  return canvasTex(256, 128, g => {
    const gr = g.createLinearGradient(0, 0, 0, 100); gr.addColorStop(0, '#1c2a38'); gr.addColorStop(0.38, '#2a3c4e'); gr.addColorStop(0.47, '#c8d2d8'); gr.addColorStop(0.53, '#c8d2d8'); gr.addColorStop(0.62, '#2a3c4e'); gr.addColorStop(1, '#1c2a38');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 100); g.fillStyle = '#2a3c4e'; g.fillRect(0, 100, 256, 28);
    // pintas brancas e listras finas em xadrez, a assinatura do tubarão-baleia
    const R = mulberry(77);
    g.strokeStyle = 'rgba(230,240,245,.35)'; g.lineWidth = 1.2; for (let x = 8; x < 230; x += 14) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 34); g.moveTo(x, 66); g.lineTo(x, 100); g.stroke(); }
    g.fillStyle = 'rgba(240,246,250,.85)';
    for (let i = 0; i < 520; i++) { const x = R() * 240, y = R() < 0.5 ? R() * 44 : 56 + R() * 44; g.beginPath(); g.arc(x, y, 0.8 + R() * 1.6, 0, TAU); g.fill(); }
    for (let i = 0; i < 120; i++) { g.beginPath(); g.arc(R() * 256, 101 + R() * 26, 0.8 + R(), 0, TAU); g.fill(); }
    g.fillStyle = '#101418'; for (const y of [25, 75]) { g.beginPath(); g.arc(229, y, 3, 0, TAU); g.fill(); }
  });
}
function buildWhale() {
  if (!SHAPES.whale) SHAPES.whale = { jaw: 0.1, h: 0.21, w: 0.27, pk: 0.55, fork: true, hetero: true, tailH: 0.2, dors: 0.07, pec: 0.2, keel: 0.02 };
  if (!POOLS.tubbaleia) makePool('tubbaleia', 'whale', whaleTex(), 2);
}
function buildManta() {
  const g = new THREE.Group();
  const top = uwify(new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.6, side: THREE.DoubleSide }), { key: 'manta' });
  const bel = uwify(new THREE.MeshStandardMaterial({ color: 0xe4e6e2, roughness: 0.7 }), { key: 'mantab' });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8).scale(1, 0.22, 1.1), top); g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 6).scale(1, 0.12, 1).translate(0, -0.05, 0), bel); g.add(belly);
  const sh = new THREE.Shape(); sh.moveTo(0, 0.45); sh.quadraticCurveTo(1.1, 0.2, 2.1, -0.45); sh.quadraticCurveTo(1.0, -0.35, 0, -0.5); sh.closePath();
  const wg = new THREE.ShapeGeometry(sh, 10); wg.rotateX(-Math.PI / 2);
  const wl = new THREE.Mesh(wg, top), wr = new THREE.Mesh(wg, top); wr.scale.x = -1; g.add(wl, wr);
  // nadadeiras cefálicas (os "chifres" da frente) e cauda fina
  for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.42), top); c.position.set(s * 0.28, 0, -0.62); c.rotation.y = s * 0.15; g.add(c); }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 1.4, 5).rotateX(Math.PI / 2).translate(0, 0, 1.2), top); g.add(tail);
  g.scale.setScalar(1.15); g.visible = false; scene.add(g);
  return { g, wl, wr };
}

// ---------- surgimento e comportamento ----------
function spawnRare(d) {
  const S = spotById(d.spot); if (!S) return;
  const o = { kind: d.kind, S, life: 480, a: rand(0, TAU), pos: new V3(S.x, -4, S.z), yaw: 0, ph: 0, seen: false };
  if (d.kind === 'tubbaleia') { buildWhale(); o.len = 7.5; }
  else if (d.kind === 'manta') { Object.assign(o, buildManta()); o.pos.y = Math.max(H(S.x, S.z) + 4, -9); }
  else {
    // mero e pirarucu gigantes são peixes de verdade (com IA e foto), só que enormes
    const key = d.kind === 'merogig' ? 'mero' : 'pirarucu';
    spawnGroup(S, key, 1, 1.9); o.fish = FISHES[FISHES.length - 1]; o.fish.len = SPECIES[key].len[1] * (d.kind === 'merogig' ? 1.15 : 1.1); o.fish.kg = SPECIES[key].k * o.fish.len ** 3; o.fish.giant = true; if (o.fish.home) { o.fish.home.used--; o.fish.home = null; } o.fish.state = 'wander';
    o.fish.radius = shapeOf(key, SPECIES[key].shape).h * 0.45 * o.fish.len; o.pos = o.fish.pos;
  }
  RARE.on = o;
  toast(`📻 Rádio dos pescadores: ${RARE_INFO[d.kind].radio} apareceu no ${S.name}! Vale a viagem.`, 7, 'gold'); AU.coin();
}
function endRare() {
  const o = RARE.on; if (!o) return;
  if (o.g) scene.remove(o.g);
  RARE.on = null;
}
function updateRare2(dt) {
  if (RARE.dayRolled !== SV.day) rollRare();
  const d = RARE.today;
  if ((RARE.chk -= dt) <= 0) {
    RARE.chk = 2;
    if (d && !RARE.on && !d.done && started && (SV.tod || 0) >= d.hour && (SV.tod || 0) < d.hour + 6) { d.done = true; spawnRare(d); }
  }
  const o = RARE.on; if (!o) return;
  o.life -= dt; if (o.life <= 0 || (o.fish && !o.fish.alive)) { if (o.life <= 0 && camera.position.distanceTo(o.pos) > 60) { endRare(); return; } if (o.fish && !o.fish.alive) { endRare(); return; } }
  const S = o.S, near = P.mode === 'swim' && P.under && o.pos.distanceTo(P.pos) < (o.kind === 'tubbaleia' ? 12 : 8);
  if (o.kind === 'tubbaleia') {
    // nada devagar em volta do ponto, perto da superfície, com a boca aberta filtrando plâncton
    o.a += dt * 0.022; const R = 38, tx = S.x + Math.cos(o.a) * R, tz = S.z + Math.sin(o.a) * R, ty = Math.max(H(tx, tz) + 3, -4 + Math.sin(o.a * 3) * 1.5);
    const dx = tx - o.pos.x, dz = tz - o.pos.z; o.pos.x += dx * clamp(dt * 0.6, 0, 1); o.pos.z += dz * clamp(dt * 0.6, 0, 1); o.pos.y = lerp(o.pos.y, ty, clamp(dt * 0.3, 0, 1));
    o.yaw = Math.atan2(-(dz || 0.001), dx || 0.001); o.ph += dt * 1.6;
  } else if (o.kind === 'manta') {
    // voa em círculo; com o mergulhador parado por perto, vem dar uma volta em volta dele
    const curious = P.mode === 'swim' && P.under && P.still > 1.5 && o.pos.distanceTo(P.pos) < 25;
    const c = curious ? P.pos : S, R = curious ? 4 : 14; o.a += dt * (curious ? 0.25 : 0.12);
    const tx = c.x + Math.cos(o.a) * R, tz = c.z + Math.sin(o.a) * R, ty = curious ? P.pos.y + 1 : Math.max(H(tx, tz) + 3.5, -10);
    const dx = tx - o.pos.x, dz = tz - o.pos.z, dist = Math.hypot(dx, dz) || 1, sp = Math.min(dist, 1.4) * dt;
    o.pos.x += dx / dist * sp; o.pos.z += dz / dist * sp; o.pos.y = lerp(o.pos.y, ty, clamp(dt * 0.5, 0, 1));
    o.yaw += angDiff(o.yaw, Math.atan2(-dx, -dz)) * clamp(dt * 1.2, 0, 1); o.ph += dt * 1.1;
    const f = Math.sin(o.ph) * 0.38; o.wl.rotation.z = f; o.wr.rotation.z = -f;
    o.g.position.copy(o.pos); o.g.rotation.set(Math.sin(o.ph) * 0.05, o.yaw, 0); o.g.visible = camUnder && camera.position.distanceToSquared(o.pos) < 90 * 90;
  } else if (o.fish && o.fish.state !== 'hooked') {
    // gigante manso: não foge do mergulhador, só se afasta devagar
    if (o.fish.state === 'flee' || o.fish.state === 'tohole') { o.fish.state = 'wander'; o.fish.t = 6; }
  }
  if (near && !o.seen) {
    o.seen = true; SV.rareSeen = SV.rareSeen || {}; const first = !SV.rareSeen[o.kind]; SV.rareSeen[o.kind] = (SV.rareSeen[o.kind] || 0) + 1;
    addXP(first ? 250 : 80); toast(`Encontro raro: ${RARE_INFO[o.kind].name}! ${RARE_INFO[o.kind].fact}`, 7, 'gold'); if (first) toast('Primeiro encontro registrado! Com a câmera, a foto dele paga muito bem.', 5, 'gold'); save();
  }
}
// desenho (dentro da janela dos cardumes) e alvo de foto
function drawRare() { const o = RARE.on; if (o && o.kind === 'tubbaleia' && camUnder && camera.position.distanceToSquared(o.pos) < 110 * 110) poolPut('tubbaleia', o.pos.x, o.pos.y, o.pos.z, o.yaw, 0, 0, o.len, o.ph, 0.035, 0); }
function rareTargets(test) {
  const o = RARE.on; if (!o || o.fish) return;
  test(o.pos, o.kind === 'tubbaleia' ? 1.4 : 1.6, { turtle: true, rareBig: true, key: o.kind, pos: o.pos });
}
