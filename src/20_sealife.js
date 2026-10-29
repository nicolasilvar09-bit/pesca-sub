// ================= mais vida no mar (golfinhos, raias, mar fervendo) e eventos (torneio, frente fria, peixe de condição) =================
const _sl = new V3();

// perfil do corpo (raio, comprimento): testa (melão) arredondada e bico curto e grosso
// no rio, o boto-cor-de-rosa: testa redonda e alta e bico longo e fino
const DOLPH_PROF = AMZ ? [[0, -0.95], [0.06, -0.8], [0.14, -0.5], [0.2, -0.1], [0.21, 0.15], [0.2, 0.34], [0.18, 0.47], [0.14, 0.56], [0.1, 0.61], [0.078, 0.66], [0.068, 0.74], [0.056, 0.83], [0.036, 0.9], [0, 0.93]] : [[0, -0.95], [0.06, -0.8], [0.13, -0.5], [0.19, -0.1], [0.2, 0.15], [0.185, 0.4], [0.16, 0.56], [0.125, 0.68], [0.085, 0.76], [0.07, 0.8], [0.062, 0.87], [0.05, 0.93], [0.028, 0.975], [0, 0.99]];
const dolphR = z => { const P = DOLPH_PROF; for (let i = 1; i < P.length; i++) if (z <= P[i][1]) { const u = (z - P[i - 1][1]) / (P[i][1] - P[i - 1][1]); return P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u; } return 0; };
// ---------- golfinhos: acompanham a proa da lancha e às vezes passam pelo mergulhador ----------
const DOLPH = { pod: [], t: 70, mode: null, life: 0 };
function dolphinGeo() {
  // corpo com testa (melão) e bico curto e grosso de ponta arredondada
  const prof = DOLPH_PROF;
  const body = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 18); body.rotateX(Math.PI / 2); body.scale(1, 0.92, 1);
  const tri = (pts, th = 0.02) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => sh.lineTo(p[0], p[1])); const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); g.translate(0, 0, -th / 2); return g; };
  const dors = AMZ ? tri([[0, 0], [0.36, 0], [0.12, 0.06]]) : tri([[0, 0], [0.26, 0], [0.02, 0.24]]); dors.rotateY(-Math.PI / 2); dors.translate(0, 0.16, -0.05);
  const fl = tri([[0, 0], [0.22, 0.05], [0.16, 0.12]], 0.03); fl.rotateX(Math.PI / 2); fl.translate(-0.11, 0, -0.95);
  const fr = fl.clone(); fr.scale(-1, 1, 1);
  // peitoral em foice: base larga, borda de ataque curva e ponta fina voltada para trás
  const pec = tri([[0, 0.045], [0.07, 0.03], [0.14, -0.01], [0.2, -0.07], [0.215, -0.1], [0.17, -0.08], [0.1, -0.06], [0.03, -0.035], [0, -0.03]], 0.018); pec.rotateX(Math.PI / 2); pec.rotateZ(-0.55); pec.translate(0.15, -0.1, 0.38);
  const pec2 = pec.clone(); pec2.scale(-1, 1, 1);
  const g = mergeGeos([body, dors, fl, fr, pec, pec2]);
  // contra-sombra: dorso cinza-escuro, barriga clara rosada
  const nr = g.attributes.normal, col = new Float32Array(nr.count * 3), c = new THREE.Color(), dark = new THREE.Color(AMZ ? 0xc05a78 : 0x262c33), light = new THREE.Color(AMZ ? 0xff5c86 : 0xf4ebe8);
  const ps = g.attributes.position;
  for (let i = 0; i < nr.count; i++) { c.copy(dark).lerp(light, smooth(0.03, -0.09, ps.getY(i))); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
// olhos: globo escuro com brilho, logo atrás do bico, dos dois lados da cabeça
function dolphinEyes() {
  const g = new THREE.Group(), eye = new THREE.SphereGeometry(0.024, 10, 8), shine = new THREE.SphereGeometry(0.008, 6, 4);
  const em = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.15, metalness: 0.2 }), sm = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(eye, em); e.position.set(sx * dolphR(AMZ ? 0.5 : 0.6) * 0.95, 0.025, AMZ ? 0.5 : 0.6); e.scale.set(0.6, 1, 1.15); g.add(e); const h = new THREE.Mesh(shine, sm); h.position.set(sx * (dolphR(AMZ ? 0.5 : 0.6) * 0.95 + 0.012), 0.035, AMZ ? 0.512 : 0.612); g.add(h); }
  // boca: linha escura ao longo de cada lado do bico, subindo em curva (o "sorriso") até perto do olho
  const mm = new THREE.MeshBasicMaterial({ color: 0x1c2026 });
  for (const sx of [-1, 1]) {
    const pts = [[0.97, -0.006], [0.92, -0.014], [0.85, -0.016], [0.79, -0.014], [0.74, -0.006], [0.69, 0.006]].map(([z, y]) => new V3(sx * Math.sqrt(Math.max(0, (dolphR(z) * 1.01) ** 2 - (y / 0.92) ** 2)), y, z));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0045, 5), mm));
  }
  return g;
}
function spawnPod(mode) {
  if (!DOLPH.geo) { DOLPH.geo = dolphinGeo(); DOLPH.mat = uwify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.1, emissive: AMZ ? 0x6a1830 : 0x000000, emissiveIntensity: 0.45 }), { key: 'dol' }); }
  for (const d of DOLPH.pod) scene.remove(d.m);
  const n = Math.floor(rand(3, 6)); DOLPH.pod = []; DOLPH.mode = mode; DOLPH.life = rand(30, 45);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(DOLPH.geo, DOLPH.mat); m.add(dolphinEyes()); m.scale.setScalar(rand(1.6, 2.2)); scene.add(m); DOLPH.pod.push({ m, side: i % 2 ? 1 : -1, off: rand(2, 7), ph: rand(0, TAU), sp: rand(0.9, 1.1), pos: new V3(), yaw: 0 }); }
  const nm = AMZ ? 'Botos-cor-de-rosa' : 'Golfinhos';
  toast(mode === 'bow' ? nm + ' acompanhando a proa! 🐬' : nm + ' passando perto! 🐬', 3.5, 'gold');
  if (mode === 'pass') { const a = rand(0, TAU); DOLPH.dir = new V3(Math.cos(a), 0, Math.sin(a)); DOLPH.c = P.pos.clone().addScaledVector(DOLPH.dir, -40); }
}
function updateDolphins(dt, t) {
  DOLPH.t -= dt;
  const driving = P.mode === 'boat' && Math.abs(BOAT.speed) > 7, deep = H(BOAT.pos.x, BOAT.pos.z) < -10;
  if (!DOLPH.pod.length && DOLPH.t <= 0) {
    if (driving && deep && Math.random() < 0.5) spawnPod('bow');
    else if (P.mode === 'swim' && P.under && H(P.pos.x, P.pos.z) < -8 && Math.random() < 0.35) spawnPod('pass');
    DOLPH.t = rand(90, 180);
  }
  if (!DOLPH.pod.length) return;
  DOLPH.life -= dt;
  const gone = DOLPH.life <= 0 || (DOLPH.mode === 'bow' && P.mode !== 'boat');
  for (const d of DOLPH.pod) {
    let x, y, z, yaw;
    if (DOLPH.mode === 'bow') {
      const fw = _sl.set(Math.sin(BOAT.heading), 0, Math.cos(BOAT.heading)), rx = fw.z, rz = -fw.x, sp = Math.abs(BOAT.speed);
      const ahead = 6 + d.off * 0.6 + Math.sin(t * 0.7 + d.ph) * 1.5 + (gone ? (DOLPH.life) * 4 : 0);
      x = BOAT.pos.x + fw.x * ahead + rx * d.side * (1.6 + d.off * 0.4); z = BOAT.pos.z + fw.z * ahead + rz * d.side * (1.6 + d.off * 0.4);
      // saltos em arco: sobe, passa pela superfície e mergulha de novo
      const ph = (t * (0.5 + sp * 0.01) * d.sp + d.ph) % 3, jump = ph < 1 ? Math.sin(ph * Math.PI) : 0;
      y = -1.2 + jump * 2.0 - (gone ? 3 : 0); yaw = BOAT.heading; d.pitch = ph < 1 ? Math.cos(ph * Math.PI) * 0.7 : 0;
    } else {
      DOLPH.c.addScaledVector(DOLPH.dir, dt * 4.5);
      x = DOLPH.c.x + DOLPH.dir.z * d.side * d.off; z = DOLPH.c.z - DOLPH.dir.x * d.side * d.off;
      y = Math.min(-1.5, P.pos.y + 1 + Math.sin(t * 1.3 + d.ph) * 1.2); yaw = Math.atan2(DOLPH.dir.x, DOLPH.dir.z); d.pitch = Math.cos(t * 1.3 + d.ph) * 0.3;
    }
    d.pos.lerp(_sl.set(x, y, z), d.pos.lengthSq() ? clamp(dt * 3, 0, 1) : 1);
    d.m.position.copy(d.pos); d.m.rotation.set(-d.pitch, yaw, Math.sin(t * 6 + d.ph) * 0.05, 'YXZ');
    if (d.pos.y > -0.3 && d.pos.y < 0.3 && Math.random() < dt * 3) spawnSpray(d.pos, 3);
  }
  if (gone && DOLPH.life < -4 || (DOLPH.mode === 'pass' && DOLPH.c.distanceTo(P.pos) > 70 && DOLPH.life < 25)) { for (const d of DOLPH.pod) scene.remove(d.m); DOLPH.pod = []; }
}

// ---------- raias: planam rente ao fundo de areia, batendo as asas ----------
const RAYS = [];
function buildRays() {
  const body = new THREE.SphereGeometry(0.22, 12, 6); body.scale(1, 0.18, 1.2);
  const wingSh = new THREE.Shape(); wingSh.moveTo(0, 0.22); wingSh.quadraticCurveTo(0.45, 0.05, 0.62, -0.08); wingSh.quadraticCurveTo(0.3, -0.18, 0, -0.26); wingSh.closePath();
  const wg = new THREE.ShapeGeometry(wingSh, 6); wg.rotateX(-Math.PI / 2);
  const tail = new THREE.CylinderGeometry(0.008, 0.02, 0.9, 5); tail.rotateX(Math.PI / 2); tail.translate(0, 0, 0.7);
  // no rio: arraia-de-fogo, de disco redondo e pintas claras em anel (ocelos)
  const mat = uwify(new THREE.MeshStandardMaterial(AMZ ? { map: arraiaTex(), roughness: 0.7, side: THREE.DoubleSide } : { color: 0x26221e, roughness: 0.7, side: THREE.DoubleSide }), { key: 'ray' });
  const r = mulberry(31);
  for (let i = 0; i < 4000 && RAYS.length < 55; i++) {
    const x = lerp(WB.x0, WB.x1, r()), z = lerp(WB.z0, WB.z1, r()), h = H(x, z);
    if (h > (AMZ ? -1.2 : -4) || h < -22 || rocksNear(x, z).some(R => Math.hypot(R.x - x, R.z - z) < R.r + 6)) continue;
    const g = new THREE.Group(), b = new THREE.Mesh(body, mat); g.add(b, new THREE.Mesh(tail, mat));
    const wl = new THREE.Mesh(wg, mat), wr = new THREE.Mesh(wg, mat); wr.scale.x = -1; g.add(wl, wr);
    const s = rand(0.8, 1.9); g.scale.setScalar(s); g.visible = false; scene.add(g);
    RAYS.push({ g, wl, wr, home: new V3(x, h, z), pos: new V3(x, h + 0.25, z), tgt: new V3(x, h, z), yaw: rand(0, TAU), ph: rand(0, TAU), t: 0, flee: 0, s, key: AMZ ? 'arraiario' : 'raia' });
  }
}
function updateRays(dt, t) {
  const c = camera.position;
  for (const R of RAYS) {
    const near = (R.pos.x - c.x) ** 2 + (R.pos.z - c.z) ** 2 < 70 * 70; R.g.visible = near && camUnder; if (!near) continue;
    R.t -= dt; R.flee = Math.max(0, R.flee - dt);
    if (P.mode === 'swim' && P.under && R.pos.distanceTo(P.pos) < 3.2 && !R.flee) { R.flee = 3; R.tgt.copy(R.pos).addScaledVector(_sl.subVectors(R.pos, P.pos).setY(0).normalize(), 14); }
    if (R.t <= 0 && !R.flee) { R.t = rand(6, 14); const a = rand(0, TAU), d = rand(3, 18); R.tgt.set(R.home.x + Math.cos(a) * d, 0, R.home.z + Math.sin(a) * d); }
    const dx = R.tgt.x - R.pos.x, dz = R.tgt.z - R.pos.z, dist = Math.hypot(dx, dz), sp = R.flee ? 1.8 : 0.45;
    if (dist > 0.4) { R.yaw += angDiff(R.yaw, Math.atan2(-dx, -dz)) * clamp(dt * 1.5, 0, 1); R.pos.x -= Math.sin(R.yaw) * sp * dt; R.pos.z -= Math.cos(R.yaw) * sp * dt; }
    R.pos.y = lerp(R.pos.y, H(R.pos.x, R.pos.z) + 0.45 * R.s + (R.flee ? 0.6 : 0), clamp(dt * 2, 0, 1));
    R.ph += dt * (R.flee ? 7 : 2.4); const f = Math.sin(R.ph) * (R.flee ? 0.45 : 0.25);
    R.wl.rotation.z = f; R.wr.rotation.z = -f;
    R.g.position.copy(R.pos); R.g.rotation.set(0, R.yaw, 0);
    if (AMZ) stingCheck(R);
  }
}

// ---------- mar fervendo: predadores atacando um cardume de sardinha na superfície ----------
const BOIL = { on: false, t: 150, n: 0 };
function startBoil() {
  // perto do jogador, em água com mais de 8 m
  for (let k = 0; k < 30; k++) {
    const a = rand(0, TAU), d = rand(90, 320), x = P.pos.x + Math.cos(a) * d, z = P.pos.z + Math.sin(a) * d;
    if (x < WB.x0 + 50 || x > WB.x1 - 50 || z < WB.z0 + 50 || z > WB.z1 - 50 || H(x, z) > -8) continue;
    const spot = { id: 'boil' + (++BOIL.n), x, z, r: 25, zone: 'boil' }; ZONES.push(spot);
    const sc = newSchool(spot); sc.c.set(x, -1.2, z); sc.boil = true; SCHOOLS.push(sc);
    const preds = AMZ ? ['tucunare', 'tucunare', 'douradorio', 'douradorio', 'cachorra'] : NE ? ['xareu', 'cavala', 'cavala', 'bicuda', 'dourado'] : ['xareu', 'xareu', 'olhete', 'sororoca', 'enchova', 'bicuda'];
    for (let i = 0; i < 3; i++) spawnGroup(spot, pick(preds), Math.round(rand(3, 6)));
    Object.assign(BOIL, { on: true, x, z, t: rand(110, 160), sc, spot });
    const dir = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'][Math.round(((Math.atan2(x - P.pos.x, -(z - P.pos.z)) + TAU) % TAU) / (TAU / 8)) % 8];
    toast(AMZ ? `Rebojo a ~${Math.round(d)} m para o ${dir}! Dourado e tucunaré atacando cardume de sardinha.` : `Mar fervendo a ~${Math.round(d)} m para o ${dir}! Predador atacando sardinha.`, 5, 'gold'); buzz([30, 30, 30]);
    return;
  }
}
function updateBoil(dt) {
  BOIL.t -= dt;
  if (!BOIL.on) { if (BOIL.t <= 0) { BOIL.t = rand(160, 300); if (DAY.amb > 0.3 && Math.random() < 0.6) startBoil(); } return; }
  const sc = BOIL.sc;
  sc.c.y = lerp(sc.c.y, -0.9, clamp(dt, 0, 1)); sc.tgt.set(BOIL.x + rand(-6, 6), -0.9, BOIL.z + rand(-6, 6)); sc.spd = 2.6; sc.t = 1;
  if (Math.random() < dt * 9) spawnSpray(_sl.set(sc.c.x + rand(-4, 4), waveH(sc.c.x, sc.c.z, T), sc.c.z + rand(-4, 4)), 4);
  // predadores circulam o cardume
  for (const f of FISHES) if (f.spot === BOIL.spot && f.state === 'wander') f.target.set(sc.c.x + rand(-5, 5), rand(-4, -1), sc.c.z + rand(-5, 5));
  if (BOIL.t <= 0) { BOIL.on = false; sc.boil = false; SCHOOLS.splice(SCHOOLS.indexOf(sc), 1); BOIL.t = rand(200, 360); }
}
// seta da bússola aponta para o mar fervendo quando ele está acontecendo
function boilTarget() { return BOIL.on ? BOIL : null; }

// ---------- eventos do calendário ----------
const WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const weekday = () => WEEK[((SV.day || 1) - 1) % 7];
const weekend = () => ((SV.day || 1) - 1) % 7 >= 5;
const fullMoon = () => (SV.day || 1) % 7 === 4; // a cada 7 dias
const compMult = () => weekend() ? 2 : 1;
// frente fria: sorteada no dia, chega à tarde e piora o mar
function rollFront() { const r = mulberry((SV.day || 1) * 131 + 7); COND.front = !AMZ && r() < 0.22 ? lerp(11, 16, r()) : null; COND.frontOn = false; }
function updateFront() {
  if (COND.front == null || COND.frontOn || (SV.tod || 0) < COND.front) return;
  COND.frontOn = true; COND.cloud = Math.max(COND.cloud, 0.85); COND.swell = Math.min(2.2, COND.swell * 1.5); COND.vis *= 0.7; COND.cur = Math.min(2, COND.cur * 1.4);
  SWELL.k = COND.swell; CU.uSwell.value = COND.swell; CU.uCloud.value = COND.cloud;
  toast('Frente fria chegando: o céu fechou, o mar cresceu e a água turvou. Cuidado no lado de fora!', 6, 'bad'); buzz([80, 60, 80]);
}
// peixes que só aparecem em certas condições
const EVSPAWN = [
  { id: 'azul', when: () => COND.vis > 1.3, spot: 'fora', key: 'albacora', n: [4, 7], msg: 'Água azul no Parcel de Fora: cardume de albacora subiu!' },
  { id: 'azul2', when: () => COND.vis > 1.3, spot: 'aventureiro', key: 'dourado', n: [3, 6], msg: 'Água azul: dourados passando no Aventureiro!' },
  { id: 'lua', when: () => fullMoon() && (SV.tod >= 19 || SV.tod < 5), spot: 'laje', key: 'cherne', n: [1, 2], msg: 'Lua cheia: chernes saíram da toca na Laje Branca.' },
  { id: 'lua2', when: () => fullMoon() && (SV.tod >= 19 || SV.tod < 5), spot: 'jorge', key: 'dentao', n: [1, 2], msg: 'Lua cheia: dentão caçando no costão da Jorge Grego.' },
  { id: 'frente', when: () => COND.frontOn, spot: 'foz', key: 'robalo', n: [3, 5], msg: 'Água mexida da frente fria: robalo entrou na foz!' },
  { id: 'atum', when: () => COND.vis > 1.15 && SV.tod >= 5.5 && SV.tod < 9, spot: 'plataforma', key: 'atumrabino', n: [4, 7], msg: 'Amanhecer de água azul: cardume de atum-rabino subiu na Plataforma de Fora!' },
  ...evAmz(), ...evNe(),
];
let evT = 0;
function updateEvents(dt) {
  updateFront();
  if ((evT -= dt) > 0) return; evT = 2;
  const done = SV.evDone && SV.evDone.day === SV.day ? SV.evDone : (SV.evDone = { day: SV.day, ids: [] });
  for (const e of EVSPAWN) {
    if ((e.reg || (e.amz ? 'amz' : 'cv')) !== REGION || done.ids.includes(e.id) || !e.when()) continue;
    const s = spotById(e.spot); if (Math.hypot(P.pos.x - s.x, P.pos.z - s.z) > 420) continue;
    done.ids.push(e.id); for (let i = 0; i < (e.key === 'albacora' || e.key === 'dourado' || e.key === 'atumrabino' ? 1 : e.n[1]); i++) spawnGroup(s, e.key, Math.round(rand(e.n[0], e.n[1])), 1.1);
    toast(e.msg, 5, 'gold');
  }
}
function eventsHTML() {
  const ev = [];
  if (AMZ) return eventsAmzHTML();
  if (NE) return eventsNeHTML();
  if (weekend()) ev.push(['Torneio do fim de semana', 'Campeonatos pagam o dobro hoje.']);
  if (fullMoon()) ev.push(['Lua cheia', 'À noite, chernes e dentões saem para caçar na Laje Branca e na Jorge Grego.']);
  if (COND.vis > 1.3) ev.push(['Água azul', 'Albacora e dourado subindo no Parcel de Fora e no Aventureiro.']);
  if (COND.front != null) ev.push(['Frente fria', COND.frontOn ? 'Chegou: mar grande e água turva. Robalo entra na foz.' : `Previsão de chegar por volta das ${Math.floor(COND.front)}h.`]);
  return `<div class="it" style="margin-bottom:8px"><div><div class="n">${weekday()} · eventos do dia</div><div class="d">${ev.length ? ev.map(([n, d]) => `<b>${n}:</b> ${d}`).join('<br>') : 'Nenhum evento especial hoje.'}</div></div></div>`;
}
function setupSealife() { buildRays(); }
