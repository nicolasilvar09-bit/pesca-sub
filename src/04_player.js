// ================= equipamentos =================
const GUNS = [
  { id: 'a75', name: 'Arbalete 75 cm', len: 0.75, range: 4.5, bands: 1, power: 6, speed: 18, price: 0, load: 1.5, wood: false, desc: 'Arma de entrada, boa pra toca e água turva.' },
  { id: 'a90', name: 'Arbalete 90 cm', len: 0.9, range: 5.5, bands: 2, power: 12, speed: 20, price: 650, load: 1.3, wood: false, desc: 'Dois elásticos de 16 mm. Versátil.' },
  { id: 'p100', name: 'Pneumático 100', len: 1.0, range: 6.0, bands: 1, power: 15, speed: 22, price: 980, load: 3.2, wood: false, pneu: true, desc: 'Ar comprimido. Potente, mas lento para recarregar.' },
  { id: 'a110', name: 'Arbalete 110 cm madeira', len: 1.1, range: 7.0, bands: 2, power: 24, speed: 23, price: 1600, load: 1.4, wood: true, desc: 'Madeira, tiro silencioso e estável. Para costão.' },
  { id: 'a150', name: 'Roller 150 Big Game', len: 1.5, range: 10, bands: 3, power: 75, speed: 30, price: 6500, load: 1.6, wood: true, desc: 'Arma de caça grande no azul. Tiro longo e muita força.' },
  { id: 'a130', name: 'Roller 130 cm', len: 1.3, range: 8.5, bands: 3, power: 42, speed: 27, price: 3400, load: 1.4, wood: true, desc: 'Sistema roller, alcance de azul. Para olho-de-boi.' },
];
const FINS = [{ name: 'Nadadeira plástica', k: 1.0, price: 0 }, { name: 'Nadadeira de fibra', k: 1.18, price: 700 }, { name: 'Nadadeira de carbono', k: 1.35, price: 1700 }];
const gunById = id => GUNS.find(g => g.id === id);

// ================= estado salvo =================
const SAVE_KEY = 'pescasub_costaverde_v1';
let SV = { money: 300, guns: ['a75'], gun: 'a75', apnea: 0, fins: 0, fuel: 80, cooler: [], best: {}, dest: 'botinas', suit: 0, suits: [0], mask: 0, masks: [0], light: false, boat: 0, boats: [0], wins: 0 };
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) SV = Object.assign(SV, s); } catch (e) { } }
let SAVE_LOCK = false; // ligado ao apagar/restaurar, para o autosave da saída não regravar o progresso antigo
function save() { if (SAVE_LOCK) return; SV.savedAt = Date.now(); const j = JSON.stringify(SV); try { localStorage.setItem(SAVE_KEY, j); } catch (e) { } if (typeof mirrorSave === 'function') mirrorSave(j); }

// ================= jogador / barco =================
const P = { mode: 'boat', pos: new V3(), vel: new V3(), yaw: 0, pitch: -0.1, under: false, o2: 1, bpm: 68, still: 0, noise: 0, diveT: 0, maxD: 0, stringer: [], effort: 0, surfT: 99, out: 0 };
const BOAT = { pos: new V3(PIER.x + 8, 0, PIER.z1 - 8), heading: Math.PI, speed: 0, throttle: 0, anchored: false, mesh: null, camYaw: 0, camPitch: 0.28, roll: 0, pitch: 0 };
// apneia estática: ganho de fôlego por nível (cada nível rende um pouco menos)
const STATIC_STEPS = [10, 10, 8, 8, 6, 6, 5, 5];
const maxBreath = () => 45 + STATIC_STEPS.slice(0, SV.apnea || 0).reduce((a, b) => a + b, 0);
let camUnder = false, camMurk = 0;

function buildBoat() {
  rebuildBoat();
  // âncora
  BOAT.rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), new THREE.LineBasicMaterial({ color: 0xd8d0b0 }));
  BOAT.rope.frustumCulled = false; BOAT.rope.visible = false; scene.add(BOAT.rope);
  // esteira
  const N = 320; BOAT.wakeArr = new Float32Array(N * 3).fill(9999); BOAT.wakeCol = new Float32Array(N * 3); BOAT.wake = []; BOAT.wakeI = 0;
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(BOAT.wakeArr, 3)); wg.setAttribute('color', new THREE.BufferAttribute(BOAT.wakeCol, 3));
  BOAT.wakePts = new THREE.Points(wg, new THREE.PointsMaterial({ size: 0.9, map: dotTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  BOAT.wakePts.frustumCulled = false; scene.add(BOAT.wakePts);
  for (let i = 0; i < N; i++) BOAT.wake.push({ x: 0, z: 0, a: 0 });
}
// bóia de sinalização do mergulhador
let diveBuoy, diveLine;
function buildDiveBuoy() {
  diveBuoy = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xff5a10, roughness: 0.5 })); b.rotation.z = Math.PI / 2; diveBuoy.add(b);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 5), new THREE.MeshStandardMaterial({ color: 0x111111 })); pole.position.y = 0.55; diveBuoy.add(pole);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.32), new THREE.MeshLambertMaterial({ color: 0xd8262a, side: THREE.DoubleSide })); fl.position.set(0.23, 0.92, 0); diveBuoy.add(fl);
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); st.position.set(0.23, 0.92, 0.002); st.rotation.z = -0.5; diveBuoy.add(st);
  scene.add(diveBuoy); diveBuoy.visible = false;
  diveLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), new THREE.LineBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.6 }));
  diveLine.frustumCulled = false; scene.add(diveLine); diveLine.visible = false;
}

// ================= arbalete =================
const GUN = { def: null, bands: 0, loadT: 0, state: 'ready', model: null, bandMeshes: [], spearVM: null, spear: null, line: null, pos: new V3(), vel: new V3(), dir: new V3(), trav: 0, range: 0, fish: null, freeT: 0, rock: false, lineLen: 0, tearT: 0, recoil: 0, q: '' };
const _a = new V3(), _b = new V3(), _c = new V3(), _up = new V3(0, 1, 0), _rockN = new V3(), _rn2 = new V3();
function cylBetween(m, a, b) { _c.subVectors(b, a); const l = _c.length(); m.position.copy(a).addScaledVector(_c, 0.5); m.scale.set(1, Math.max(l, 0.001), 1); m.quaternion.setFromUnitVectors(_up, _c.normalize()); }
function camFwd(out) { return out.set(0, 0, -1).applyQuaternion(camera.quaternion); }

function gunArm() {
  if (P.mode !== 'swim') return;
  if (GUN.state !== 'ready') { toast('Recolha o arpão primeiro (PUXAR LINHA)'); return; }
  if (GUN.loadT > 0 || GUN.bands >= GUN.def.bands) return;
  GUN.loadT = GUN.def.load * (P.under ? 1.35 : 1); AU.stretch();
}
function gunFire() {
  if (P.mode !== 'swim') return;
  if (GUN.state !== 'ready') return;
  if (GUN.bands <= 0) { toast('Arbalete desarmado. Toque em ARMAR.'); AU.click(); return; }
  const f = Math.sqrt(GUN.bands / GUN.def.bands);
  GUN.aimF = (aimOnFish() || {}).f || null; GUN.waitShot = P.under && P.still > 2;
  gunTipWorld(GUN.pos); aimDir(GUN.dir, GUN.pos);
  GUN.vel.copy(GUN.dir).multiplyScalar(GUN.def.speed * f);
  GUN.range = GUN.def.range * f; GUN.trav = 0; GUN.state = 'flying'; GUN.bands = 0; GUN.loadT = 0; GUN.rock = false;
  setSpearInGun(false); GUN.spear.visible = true; GUN.line.visible = true; GUN.recoil = 1;
  AU.shot(); FEAR.pos.copy(P.pos); FEAR.r = 7; FEAR.t = 0.8; P.noise = 1; updateBands();
  if (P.under) spawnBubbles(GUN.pos, 8, 0.1);
}
function catchFish(f) {
  const sp = f.sp, cm = Math.round(f.len * 100);
  GUN.fish = null; f.remove();
  RESPAWN.push({ key: f.key, spot: f.spot.id, n: sp.school ? Math.round(rand(3, 6)) : 1, t: performance.now() / 1000 + rand(90, 160) });
  if (sp.protected) { SV.money -= 1000; toast(`MERO, espécie protegida por lei! Multa ambiental: R$ 1.000.`, 5, 'bad'); AU.bad(); save(); return; }
  if (f.len < sp.min) { SV.money -= 200; toast(`${sp.name} de ${cm} cm está abaixo da medida mínima (${Math.round(sp.min * 100)} cm). Peixe apreendido e multa de R$ 200.`, 5, 'bad'); AU.bad(); save(); return; }
  P.stringer.push({ key: f.key, name: sp.name, cm, kg: f.kg, len: f.len });
  if (!sp.ornamental) addXP(15 + f.kg * 12);
  if ((SV.tod || 12) >= 19 || (SV.tod || 12) < 5) SV.nightCatch = true;
  compOnCatch(f);
  if (!sp.ornamental) { mission('catch', { key: f.key }); mission('catchkg', { kg: f.kg }); if (GUN.waitShot) mission('wait'); }
  if (sp.rare) toast(`${sp.name}! Peixe raro na fieira.`, 4, 'gold'); else if (isTrophy(f)) toast(`Troféu! ${sp.name} acima do tamanho comum.`, 4, 'gold');
  if (sp.ornamental) toast(`${sp.name} é peixe ornamental, ninguém compra. Prefira deixar no mar.`, 4, 'bad');
  toast(`${sp.name} · ${cm} cm · ${fmtKg(f.kg)} kg`, 3.5, 'gold'); AU.coin();
  if (!SV.best[f.key] || SV.best[f.key] < f.kg) { SV.best[f.key] = f.kg; if (f.kg > 3) toast('Novo recorde da espécie!', 3, 'gold'); }
  save();
}
function updateGun(dt) {
  const def = GUN.def; if (!def) return;
  GUN.model.visible = P.mode === 'swim' && !THIRD;
  if (GUN.loadT > 0) { GUN.loadT -= dt; if (GUN.loadT <= 0) { GUN.loadT = 0; GUN.bands++; AU.click(); } updateBands(); }
  GUN.recoil = Math.max(0, GUN.recoil - dt * 5);
  // balanço da arma
  const sw = P.vel.length(), t = performance.now() / 1000;
  GUN.model.position.set(0.1 + Math.sin(t * 2.2) * 0.004 * (1 + sw * 3), -0.13 + Math.cos(t * 4.4) * 0.003 * (1 + sw * 3) - (GUN.loadT > 0 ? 0.05 : 0), -0.42 + GUN.recoil * 0.07 + (GUN.loadT > 0 ? 0.12 : 0));
  GUN.model.rotation.x = GUN.recoil * 0.12;
  if (GUN.state === 'ready') { GUN.line.visible = false; GUN.spear.visible = false; setSpearInGun(true); return; }
  const tip = gunTipWorld(_a);
  const pulling = IN.held.pull && P.mode === 'swim';
  if (GUN.state === 'flying') {
    const prev = _b.copy(GUN.pos);
    GUN.pos.addScaledVector(GUN.vel, dt); const step = prev.distanceTo(GUN.pos); GUN.trav += step;
    GUN.vel.multiplyScalar(Math.exp(-dt * (GUN.trav > GUN.range ? 5 : 0.5))); GUN.vel.y -= dt * 0.5;
    // acerto em peixe
    for (const f of FISHES) {
      if (!f.alive || !f.vis || f.state === 'dead') continue;
      if (f.pos.distanceToSquared(GUN.pos) > 9) continue;
      // ponto mais próximo do segmento
      _c.subVectors(GUN.pos, prev); const l2 = _c.lengthSq() || 1e-6; const tt = clamp(_c.dot(_t1.subVectors(f.pos, prev)) / l2, 0, 1);
      const cp = _t2.copy(prev).addScaledVector(_c, tt); const fd = f.dir(new V3()); const loc = cp.sub(f.pos); const along = loc.dot(fd) / f.len; const perp = loc.addScaledVector(fd, -along * f.len).length();
      if (Math.abs(along) < 0.47 && perp < f.radius * 1.15) { hitFish(f, along); return; }
    }
    if (insideRock(GUN.pos)) { GUN.state = 'stuck'; GUN.rock = true; GUN.freeT = 1.0; AU.tink(); toast('Arpão bateu na pedra!'); missed(); }
    else if (GUN.pos.y < H(GUN.pos.x, GUN.pos.z) + 0.05) { GUN.state = 'stuck'; GUN.rock = false; GUN.freeT = 0.2; AU.thud(); missed(); sandPuff(GUN.pos, 7, 1); }
    else if (GUN.trav > GUN.range * 1.5 || GUN.vel.length() < 0.5) { GUN.state = 'spent'; missed(); }
  } else if (GUN.state === 'spent') {
    if (!pulling) { GUN.pos.y = Math.max(GUN.pos.y - dt * 0.4, H(GUN.pos.x, GUN.pos.z) + 0.05); }
  } else if (GUN.state === 'hooked') {
    const f = GUN.fish;
    if (!f || !f.alive) { GUN.state = 'spent'; GUN.fish = null; }
    else {
      GUN.pos.copy(f.pos).addScaledVector(GUN.dir, -0.05);
      // tensão da linha
      const d = f.pos.distanceTo(tip), maxL = def.range * 2.0;
      if (f.fight > 0) GUN.lineLen = Math.min(maxL, Math.max(GUN.lineLen, d));
      if (f.fight > 0) fightStep(f, dt, pulling);
      if (pulling) GUN.lineLen -= dt * (f.fight > 0 ? 0.35 : 2.0);
      GUN.lineLen = Math.max(GUN.lineLen, 0.5);
      if (d > GUN.lineLen) { f.pos.copy(tip).addScaledVector(_c.subVectors(f.pos, tip).normalize(), GUN.lineLen); }
      if (d > maxL && f.fight > 0) { P.pos.addScaledVector(_c.subVectors(f.pos, P.pos).normalize(), (d - maxL) * 0.5); }
      // chance de rasgar
      if (f.fight > 0) {
        GUN.tearT -= dt;
        if (GUN.tearT <= 0) {
          GUN.tearT = 0.5;
          const ratio = f.kg * f.sp.str / def.power, qf = GUN.q === 'tail' ? 1.7 : 0.6;
          const p = (clamp(ratio - 0.55, 0, 1.5) * 0.22 * qf + (pulling && f.fight > 0 ? 0.03 : 0)) * (0.35 + (GUN.tension || 0) * 2.2) + (GUN.tension >= 0.99 ? 0.25 : 0);
          if (Math.random() < p) {
            f.state = 'wander'; f.fight = 0; f.startFlee(); GUN.fish = null; GUN.state = 'spent';
            toast(`Rasgou! ${f.sp.name} de ~${fmtKg(f.kg)} kg escapou.${GUN.tension > 0.6 ? ' Puxou na arrancada.' : ''}`, 3, 'bad'); AU.bad(); buzz(150);
          }
        }
      }
      if (GUN.fish && d < 1.25) { catchFish(f); GUN.state = 'ready'; GUN.trav = 0; AU.click(); }
    }
  } else if (GUN.state === 'stuck') {
    if (pulling) { GUN.freeT -= dt; if (GUN.freeT <= 0) GUN.state = 'spent'; }
  }
  if ((GUN.state === 'spent' || GUN.state === 'flying') && pulling) {
    _c.subVectors(tip, GUN.pos); const d = _c.length();
    if (d < 0.6) { GUN.state = 'ready'; AU.click(); }
    else { GUN.pos.addScaledVector(_c.normalize(), Math.min(d, dt * 3.2)); GUN.dir.lerp(_c, dt * 3).normalize(); GUN.vel.set(0, 0, 0); GUN.state = 'spent'; if (Math.random() < 0.3) AU.reel(); }
  }
  // desenha arpão e linha
  if (GUN.state === 'flying' && GUN.vel.lengthSq() > 0.01) GUN.dir.copy(GUN.vel).normalize();
  const tail = _b.copy(GUN.pos).addScaledVector(GUN.dir, -GUN.spearLen);
  GUN.spear.position.copy(tail); GUN.spear.lookAt(_c.copy(tail).add(GUN.dir));
  const arr = GUN.lineGeo.attributes.position.array, d = tip.distanceTo(tail), slack = Math.max(0, (GUN.state === 'hooked' ? GUN.lineLen : GUN.range) - d) * 0.25;
  for (let i = 0; i < 16; i++) { const s = i / 15; _c.lerpVectors(tip, tail, s); _c.y -= Math.sin(s * Math.PI) * slack; arr[i * 3] = _c.x; arr[i * 3 + 1] = _c.y; arr[i * 3 + 2] = _c.z; }
  GUN.lineGeo.attributes.position.needsUpdate = true;
}
function hitFish(f, along) {
  GUN.state = 'hooked'; GUN.fish = f; GUN.lineLen = f.pos.distanceTo(gunTipWorld(_a)); GUN.tearT = 0.4; GUN.aimF = null; GUN.tension = 0;
  f.run = true; f.runT = rand(0.5, 1.2);
  FEAR.pos.copy(f.pos); FEAR.r = 14; FEAR.t = 1.5;
  f.state = 'hooked'; f.leader = null;
  for (const o of FISHES) if (o.leader === f) o.leader = null;
  AU.thud();
  if (along > 0.27) { GUN.q = 'head'; f.fight = 0; f.state = 'dead'; toast('Tiro na cabeça! Peixe apagado.', 2.5, 'gold'); }
  else if (along > -0.05) { GUN.q = 'body'; f.fight = 1.5 + f.kg * 0.25 * f.sp.str; toast('Acertou! Puxe a linha.', 2); }
  else { GUN.q = 'tail'; f.fight = 3 + f.kg * 0.45 * f.sp.str; toast('Tiro no rabo, cuidado que pode rasgar!', 2.5, 'bad'); }
  GUN.fight0 = Math.max(f.fight, 0.01);
  hitFX(GUN.q); if (GUN.q === 'head') mission('head');
  spawnBubbles(f.pos, 10, 0.2);
}

// ================= controle do barco =================
function updateBoat(dt, t) {
  const B = BOAT, driving = P.mode === 'boat';
  if (driving && !B.anchored) {
    const thIn = clamp(IN.jy, -0.35, 1);
    B.throttle = lerp(B.throttle, SV.fuel > 0 ? thIn : 0, clamp(dt * 2, 0, 1));
    const maxS = boatNow().max;
    B.speed += (B.throttle * maxS - B.speed) * clamp(dt * (B.throttle > Math.abs(B.speed) / maxS ? 0.55 : 0.8), 0, 1);
    B.heading -= IN.jx * dt * (0.35 + 0.75 * Math.min(1, Math.abs(B.speed) / 6)) * (B.speed < -0.2 ? -1 : 1);
    SV.fuel = Math.max(0, SV.fuel - Math.abs(B.throttle) * dt * FUEL_RATE);
  } else { B.throttle = lerp(B.throttle, 0, dt * 3); B.speed *= Math.exp(-dt * (B.anchored ? 3 : 0.6)); }
  const dir = _a.set(Math.sin(B.heading), 0, Math.cos(B.heading));
  if (!B.vel) B.vel = new V3();
  B.vel.lerp(_b.copy(dir).multiplyScalar(B.speed), clamp(dt * 1.6, 0, 1)); // deriva lateral nas curvas
  const nx = B.pos.x + B.vel.x * dt, nz = B.pos.z + B.vel.z * dt;
  const bowH = H(nx + dir.x * 3.6, nz + dir.z * 3.6), midH = H(nx, nz);
  const onPier = Math.abs(nx - PIER.x) < 3.2 && nz > PIER.z1 - 3.5 && nz < PIER.z0;
  const onTee = Math.abs(nx - PIER.x) < 10 && Math.abs(nz - PIER.z1) < 3.5;
  if (bowH > -0.8 || midH > -0.9 || onPier || onTee) {
    if (Math.abs(B.speed) > 2) { toast('Cuidado! Encostou no raso/píer.', 2, 'bad'); AU.thud(); }
    B.speed *= -0.25; B.vel.multiplyScalar(-0.25);
  } else { B.pos.x = clamp(nx, WB.x0, WB.x1); B.pos.z = clamp(nz, WB.z0, WB.z1); }
  if (B.pos.x <= WB.x0 || B.pos.x >= WB.x1 || B.pos.z <= WB.z0 || B.pos.z >= WB.z1) { if (Math.random() < dt) toast('Limite do mapa. Volte para a baía.'); }
  // flutuação
  const wy = waveH(B.pos.x, B.pos.z, t), wf = waveH(B.pos.x + dir.x * 3, B.pos.z + dir.z * 3, t), wb = waveH(B.pos.x - dir.x * 3, B.pos.z - dir.z * 3, t);
  const wl = waveH(B.pos.x + dir.z * 1.2, B.pos.z - dir.x * 1.2, t), wr = waveH(B.pos.x - dir.z * 1.2, B.pos.z + dir.x * 1.2, t);
  const plane = clamp(B.speed / 30, 0, 1);
  B.pos.y = lerp(B.pos.y, wy * 0.85 + plane * 0.25, clamp(dt * 4, 0, 1));
  B.pitch = lerp(B.pitch, -Math.atan2(wf - wb, 6) - plane * 0.08 * Math.min(1, B.throttle * 1.5) + Math.sin(t * 6.5) * 0.018 * plane, clamp(dt * 3, 0, 1));
  B.roll = lerp(B.roll, Math.atan2(wl - wr, 2.4) + IN.jx * plane * 0.18 * (driving ? 1 : 0), clamp(dt * 3, 0, 1));
  B.mesh.position.copy(B.pos); B.mesh.rotation.set(B.pitch, B.heading, B.roll, 'YXZ');
  B.mesh.userData.pilot.forEach(o => o.visible = driving); if (driving) poseDiver(B.mesh.userData.rig, 'drive', t);
  // corda da âncora
  B.rope.visible = B.anchored;
  if (B.anchored) { const bow = B.mesh.localToWorld(_b.set(0, 0.7, 3.6)); const a = B.rope.geometry.attributes.position; a.setXYZ(0, bow.x, bow.y, bow.z); const ax = B.anchorP; a.setXYZ(1, ax.x, ax.y, ax.z); a.needsUpdate = true; }
  // esteira
  if (Math.abs(B.speed) > 3) {
    for (let k = 0; k < 4; k++) { const w = B.wake[B.wakeI]; B.wakeI = (B.wakeI + 1) % B.wake.length; const s = k % 2 ? 1 : -1, back = k < 2; w.x = B.pos.x - dir.x * (back ? 3.9 : 0.5) + (back ? rand(-0.6, 0.6) : dir.z * s * 1.3); w.z = B.pos.z - dir.z * (back ? 3.9 : 0.5) + (back ? rand(-0.6, 0.6) : -dir.x * s * 1.3); w.a = Math.min(1, Math.abs(B.speed) / 12); const out = back ? rand(-1.5, 1.5) : s * rand(2, 4); w.vx = dir.z * out; w.vz = -dir.x * out; }
  }
  B.wake.forEach((w, i) => { w.a = Math.max(0, w.a - dt * 0.25); w.x += (w.vx || 0) * dt; w.z += (w.vz || 0) * dt; B.wakeArr[i * 3] = w.x; B.wakeArr[i * 3 + 1] = waveH(w.x, w.z, t) + 0.08; B.wakeArr[i * 3 + 2] = w.z; B.wakeCol[i * 3] = B.wakeCol[i * 3 + 1] = B.wakeCol[i * 3 + 2] = w.a * 0.7; });
  B.wakePts.geometry.attributes.position.needsUpdate = true; B.wakePts.geometry.attributes.color.needsUpdate = true;
  AU.setEngine(Math.abs(B.throttle), !B.anchored && (driving || Math.abs(B.speed) > 0.3), camUnder);
  if (driving) {
    B.camYaw -= IN.lookX * 0.005 * OPT.sens; B.camPitch = clamp(B.camPitch + IN.lookY * 0.004 * OPT.sens * (OPT.inv ? -1 : 1), 0.05, 1.1);
    if (!IN.lookX && Math.abs(B.speed) > 4) B.camYaw *= Math.exp(-dt * 0.8);
    const cy = B.heading + Math.PI + B.camYaw, R = (12 + Math.abs(B.speed) * 0.2) * (camera.aspect < 1 ? 1.5 : 1);
    const tx = B.pos.x + Math.sin(cy) * Math.cos(B.camPitch) * R, tz = B.pos.z + Math.cos(cy) * Math.cos(B.camPitch) * R;
    const ty = Math.max(B.pos.y + 1.2 + Math.sin(B.camPitch) * R, waveH(tx, tz, t) + 0.6);
    camera.position.lerp(_c.set(tx, ty, tz), clamp(dt * 6, 0, 1));
    camera.lookAt(B.pos.x, B.pos.y + 1.8, B.pos.z);
  }
}
function toggleAnchor() {
  const B = BOAT;
  if (B.anchored) { B.anchored = false; toast('Âncora recolhida.'); AU.click(); return; }
  if (Math.abs(B.speed) > 2.5) { toast('Reduza a velocidade para ancorar.'); return; }
  const h = H(B.pos.x, B.pos.z);
  if (h < -40) { toast('Fundo demais para ancorar.'); return; }
  B.anchored = true; B.anchorP = new V3(B.pos.x + Math.sin(B.heading) * 8, h, B.pos.z + Math.cos(B.heading) * 8);
  toast(`Ancorado em ${Math.round(-h)} m de fundo.`); AU.splash();
}
function jumpIn() {
  if (!BOAT.anchored) { toast('Ancore o barco antes de pular.'); return; }
  P.mode = 'swim'; const side = _a.set(Math.cos(BOAT.heading), 0, -Math.sin(BOAT.heading));
  P.pos.set(BOAT.pos.x + side.x * 3.6, -0.2, BOAT.pos.z + side.z * 3.6); P.vel.set(0, 0, 0);
  P.yaw = BOAT.heading + Math.PI / 2; P.pitch = -0.25; P.under = false; P.o2 = Math.max(P.o2, 0.6);
  diveBuoy.position.set(P.pos.x + 3, 0, P.pos.z); AU.splash(); spawnBubbles(_b.set(P.pos.x, -0.6, P.pos.z), 25, 0.5);
  toast('Na água! Olhe para baixo e toque MERGULHAR.', 3);
}
function climbBoat() {
  P.mode = 'boat'; P.under = false;
  if (P.stringer.length) { const kg = P.stringer.reduce((s, f) => s + f.kg, 0); SV.cooler.push(...P.stringer); toast(`${P.stringer.length} peixe(s), ${fmtKg(kg)} kg, guardados na caixa térmica.`, 3, 'gold'); P.stringer = []; save(); }
  if (GUN.state !== 'ready') { GUN.state = 'ready'; GUN.fish = null; }
  BOAT.camYaw = 0; AU.setEnv(false);
}
function blackout() {
  P.blackT = 3.2; document.getElementById('black').style.opacity = 1;
  // com dupla: ela desce, traz você e a fieira; sozinho: resgate de um barco que passava
  const buddy = hasBuddy(), lost = buddy ? 0 : P.stringer.length;
  if (buddy) { SV.cooler.push(...P.stringer); } P.stringer = [];
  if (GUN.fish) { GUN.fish.state = 'dead'; GUN.fish = null; } GUN.state = 'ready';
  setTimeout(() => {
    P.mode = 'boat'; P.o2 = 0.35; P.under = false; P.blackT = 0; AU.setEnv(false);
    document.getElementById('black').style.opacity = 0;
    if (buddy) toast('APAGÃO! Sua dupla viu, desceu e te trouxe para a superfície. A fieira foi para a caixa térmica.', 6, 'bad');
    else { SV.money -= 300; waitHours(3); toast('APAGÃO sozinho! Um barco que passava te resgatou: perdeu a fieira' + (lost ? ` (${lost} peixe(s))` : '') + ', pagou R$ 300 de atendimento e perdeu 3 horas.', 7, 'bad'); }
    toast('Na vida real um apagão sem dupla costuma ser fatal: nunca mergulhe sozinho e respeite o intervalo de superfície.', 7);
    save();
  }, 1800);
}

// ================= nado / apneia =================
function updateSwim(dt, t) {
  const sens = 0.0042 * OPT.sens;
  P.yaw -= IN.lookX * sens; P.pitch = clamp(P.pitch - IN.lookY * sens * (OPT.inv ? -1 : 1), -1.5, 1.4);
  const surfY = waveH(P.pos.x, P.pos.z, t);
  const cp = Math.cos(P.pitch), fwd = _a.set(-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp), right = _b.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  const finK = FINS[SV.fins].k * (1 + 0.03 * lvl('trKick')), mv = Math.hypot(IN.jx, IN.jy);
  const fighting = GUN.state === 'hooked' && GUN.fish && GUN.fish.fight > 0;
  P.effort = clamp(mv * 0.8 + (IN.held.up ? 0.7 : 0) + (GUN.loadT > 0 ? 0.8 : 0) + (fighting ? 0.9 : 0) + (IN.held.pull ? 0.3 : 0), 0, 1.6);
  if (!P.under) {
    // na superfície
    const flat = _c.set(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
    const des = new V3().addScaledVector(flat, IN.jy * 1.6 * finK).addScaledVector(right, IN.jx * 1.0);
    P.vel.lerp(des, clamp(dt * 2, 0, 1)); P.pos.addScaledVector(P.vel, dt);
    P.pos.y = surfY - 0.15;
    if (took('dive') || (IN.jy > 0.5 && P.pitch < -0.75)) {
      P.under = true; P.pos.y = surfY - 0.8; P.vel.set(fwd.x * 0.6, -1.4, fwd.z * 0.6); P.pitch = Math.min(P.pitch, -0.9);
      P.diveT = 0; P.maxD = 0; AU.splash(); spawnBubbles(_c.set(P.pos.x, P.pos.y + 0.3, P.pos.z), 20, 0.4);
      P.startO2 = P.o2; buddyDiveTip(); onDiveStart();
      if (P.o2 < 0.6) toast('Pouco fôlego! Respire mais na superfície antes de descer.', 3, 'bad');
      if (DAY.amb < 0.35 && !P.nightTip) { P.nightTip = true; toast('Na vida real, confira as regras locais: em muitos lugares a pesca sub noturna é proibida.', 5); }
    }
    P.o2 = Math.min(1, P.o2 + dt / (maxBreath() * 0.85) * recMult()); P.surfT += dt;
    P.still = 0;
  } else {
    const des = new V3().addScaledVector(fwd, IN.jy * 2.1 * finK).addScaledVector(right, IN.jx * 0.9);
    if (IN.held.up) des.y += 1.8 * finK;
    const depth = -P.pos.y;
    const nd = neutralDepth(), buoy = clamp((nd - depth) / nd, -1, 1) * 0.22; // flutuabilidade: neutro conforme o cinto de lastro
    // segurando na pedra: imóvel até mexer o joystick ou subir
    if (P.grip && (mv > 0.05 || IN.held.up)) P.grip = false;
    if (P.grip) P.vel.set(0, 0, 0);
    else { P.vel.lerp(des, clamp(dt * 2.2, 0, 1)); P.vel.y += buoy * dt; }
    if (mv < 0.05 && !IN.held.up) P.vel.multiplyScalar(Math.exp(-dt * 0.9));
    P.pos.addScaledVector(P.vel, dt);
    const h = H(P.pos.x, P.pos.z);
    if (P.pos.y < h + 0.4) { P.pos.y = h + 0.4; P.vel.y = Math.max(P.vel.y, 0); }
    // pedra e naufrágio são sólidos: cabeça/tronco e também quadril e pés (o corpo deitado atrás do ponto da câmera)
    P.onRock = (solidPush(P.pos, 0.45, _rockN) && _rockN.y > 0.45) || P.grip;
    const bf = _c.set(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
    for (const k of [0.75, 1.5]) {
      const q = _b.copy(P.pos).addScaledVector(bf, -k); q.y -= 0.14;
      const q0 = _t1.copy(q);
      if (solidPush(q, 0.22, _rn2)) { P.pos.add(q.sub(q0)); if (_rn2.y > 0.45) P.onRock = true; }
    }
    // apoiado em cima: não afunda nem escorrega, e parado fica imóvel para fazer a espera
    if (P.onRock) {
      P.vel.y = Math.max(P.vel.y, 0);
      if (mv < 0.05 && !IN.held.up) { P.vel.multiplyScalar(Math.exp(-dt * 7)); if (P.vel.length() < 0.25) P.grip = true; }
      if (!P.rockTip && P.still > 1.5) { P.rockTip = true; toast('Deitado na pedra: fique parado que os peixes vêm ver.', 3.5); }
    }
    P.diveT += dt; P.maxD = Math.max(P.maxD, -P.pos.y);
    // consumo de oxigênio
    P.o2 -= dt / maxBreath() * (0.7 + 0.65 * P.effort * kickEff() + depth / 45) * eqPenalty(depth) * (P.stringer.length > 6 ? 1.1 : 1) * suitNow().o2 * maskNow().o2 * beltNow().o2 / (1 + (P.diveBonus || 0));
    if (P.pos.y > surfY - 0.45 && P.vel.y > -0.05) {
      P.under = false; P.grip = false; AU.breath(); P.surfT = 0; P.lastDiveT = P.diveT;
      const d = P.maxD; if (d > 2) toast(`Mergulho: ${fmtKg(d)} m · ${Math.floor(P.diveT)} s`, 2.2);
      mission('depth', { d });
    }
    if (P.o2 <= 0 && !P.blackT) blackout();
    // espera
    const speed = P.vel.length();
    if (speed < 0.18 && mv < 0.05 && !IN.held.up) P.still += dt; else P.still = 0;
  }
  const spd = P.vel.length();
  P.noise = lerp(P.noise, clamp(spd / 2.0 + (mv > 0.1 ? 0.15 : 0) + (IN.held.up ? 0.2 : 0), 0, 1), clamp(dt * 3, 0, 1));
  if (P.under && P.still > 2) P.noise *= 0.5;
  // batimentos (reflexo de mergulho)
  const bTarget = P.under ? 52 + P.effort * 45 + (P.o2 < 0.3 ? 25 : 0) - Math.min(8, P.still * 1.5) : 72 + (1 - P.o2) * 25;
  P.bpm = lerp(P.bpm, bTarget, clamp(dt * 0.6, 0, 1));
  // correnteza dos pontos expostos
  // correnteza (segurando na pedra, parado, ela não leva)
  const cu = currentAt(P.pos); if (cu && !P.grip) { P.pos.x += cu.x * dt; P.pos.z += cu.z * dt; }
  // limites do mapa
  P.pos.x = clamp(P.pos.x, WB.x0, WB.x1); P.pos.z = clamp(P.pos.z, WB.z0, WB.z1);
  if (H(P.pos.x, P.pos.z) > -0.3 && !P.under) { P.pos.addScaledVector(P.vel, -dt * 2); P.vel.multiplyScalar(-0.3); }
  // câmera
  P.kick = (P.kick || 0) + dt * 5.5 * Math.min(1, mv + (IN.held.up ? 1 : 0));
  let camY = P.pos.y + 0.2 + (P.under ? Math.sin(P.kick) * 0.025 * Math.min(1, mv + (IN.held.up ? 1 : 0)) : 0);
  if (!P.under) camY = surfY + 0.13 + Math.min(0, P.pitch) * 0.45;
  camera.position.set(P.pos.x, camY, P.pos.z);
  const shake = P.o2 < 0.18 && P.under ? Math.sin(t * 9) * 0.006 * (1 - P.o2 / 0.18) : 0;
  camera.rotation.set(P.pitch + shake, P.yaw, P.under ? Math.sin(P.kick * 0.5) * 0.008 : 0, 'YXZ');
  // bóia de sinalização
  diveBuoy.visible = true;
  const bx = diveBuoy.position; const dx = P.pos.x - bx.x, dz = P.pos.z - bx.z, dd = Math.hypot(dx, dz), lineL = Math.max(3, -P.pos.y + 3);
  if (dd > lineL) { bx.x += dx / dd * (dd - lineL) * clamp(dt * 3, 0, 1); bx.z += dz / dd * (dd - lineL) * clamp(dt * 3, 0, 1); }
  bx.y = waveH(bx.x, bx.z, t); diveBuoy.rotation.set(Math.sin(t * 1.3) * 0.15, Math.atan2(dx, dz), Math.cos(t * 1.1) * 0.12);
  diveLine.visible = P.under; if (P.under) { const a = diveLine.geometry.attributes.position; a.setXYZ(0, bx.x, bx.y, bx.z); a.setXYZ(1, P.pos.x + Math.sin(P.yaw) * 0.5, P.pos.y - 0.55, P.pos.z + Math.cos(P.yaw) * 0.5); a.needsUpdate = true; }
  // distância do barco
  P.boatDist = Math.hypot(P.pos.x - BOAT.pos.x, P.pos.z - BOAT.pos.z);
}
