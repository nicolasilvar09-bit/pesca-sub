// ================= humanos realistas (Microsoft Rocketbox, MIT): carregar, animar, segurar a arma, inclinar, deitar, sentar =================
// Modelos com esqueleto e texturas de verdade + animações de captura de movimento (parado, andando, correndo, agachado).
// Por cima da animação, os ossos são ajustados por código: tronco e cabeça seguem a mira, mãos seguram a arma (IK de 2 ossos).
const AVATARS = [
  { k: 'm_casual', n: 'Rafael', f: false, col: ['#e0b18f', '#c62828', '#1f2933', '#2a1a10'] },
  { k: 'm_hoodie', n: 'Leo', f: false, col: ['#7a5136', '#222428', '#3b3a35', '#111'] },
  { k: 'm_soldier1', n: 'Sargento Silva', f: false, mil: true, col: ['#c79a78', '#5d6650', '#5b6249', '#333'] },
  { k: 'm_soldier2', n: 'Cabo Souza', f: false, mil: true, col: ['#b88763', '#5d6650', '#5b6249', '#333'] },
  { k: 'm_police', n: 'Oficial Lima', f: false, col: ['#d0a07c', '#26365e', '#1f2a45', '#222'] },
  { k: 'f_jacket', n: 'Ana', f: true, col: ['#e8c2a0', '#5a2e22', '#3e3a2e', '#d8b56a'] },
  { k: 'f_casual', n: 'Júlia', f: true, col: ['#c8916e', '#7a7f86', '#22314d', '#2a1a10'] },
  { k: 'f_soldier1', n: 'Soldado Bia', f: true, mil: true, col: ['#d9ab86', '#5d6650', '#5b6249', '#3a2a1a'] },
  { k: 'f_soldier2', n: 'Tenente Carla', f: true, mil: true, col: ['#c49572', '#5d6650', '#5b6249', '#3a2a1a'] },
  { k: 'f_police', n: 'Agente Duda', f: true, col: ['#d9ab86', '#1c1c1c', '#1c1c1c', '#222'] },
];
// os personagens do lobby passam a ser os avatares
CHARS.length = 0;
for (const v of AVATARS) CHARS.push({ n: v.n, f: v.f, av: v.k, skin: v.col[0], shirt: v.col[1], pants: v.col[2], hair: v.col[3], hs: v.f ? 'long' : 'short', shoe: '#222' });
if (SET.char >= CHARS.length) SET.char = 0;
function avatarLook(av) { const c = CHARS.find(x => x.av === av.k); return Object.assign({}, c); }
const HUM = { ready: false, src: {}, clips: {}, failed: false, pct: 0 };
function loadHumans(onDone) {
  if (!T.GLTFLoader) { HUM.failed = true; return; }
  const L = new T.GLTFLoader(); const files = ['anims', ...AVATARS.map(a => a.k)]; let left = files.length + 1;
  const done = () => { HUM.pct = 1 - left / (files.length + 1); if (--left === 0) { HUM.ready = !HUM.failed; if (onDone) onDone(); } };
  const fail = e => { HUM.failed = true; console.warn('modelo não carregou', e && e.message); done(); };
  L.load('assets/chars/anims.glb', g => { for (const c of g.animations) HUM.clips[c.name] = c; done(); }, undefined, fail);
  for (const av of AVATARS) L.load(`assets/chars/${av.k}.glb`, g => { prepSource(g.scene); HUM.src[av.k] = g.scene; done(); }, undefined, fail);
  L.load('assets/plane.glb', g => { setPlaneModel(g.scene); done(); }, undefined, () => done());
  left++; loadNature(L, () => done());
  left++; loadRealGuns(L, () => { for (const a of G.actors) if (a.model) refreshGun(a); vmKey = ''; for (const it of G.items) if (it.mesh) { scene.remove(it.mesh); it.mesh = null; } done(); });
}
// materiais mais leves (Lambert) e cores no mesmo espaço do resto do jogo
function prepSource(s) {
  s.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material, nm = new T.MeshLambertMaterial({ name: m.name, map: m.map || null, alphaTest: m.alphaTest || 0, side: m.side, transparent: false });
    if (nm.map) { nm.map.encoding = T.sRGBEncoding; nm.map.anisotropy = 2; }
    o.material = nm; o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
  });
}

// ---------- modelo por personagem ----------
const BONES = ['Bip01_Pelvis', 'Bip01_Spine', 'Bip01_Spine1', 'Bip01_Spine2', 'Bip01_Neck', 'Bip01_Head', 'Bip01_R_UpperArm', 'Bip01_R_Forearm', 'Bip01_R_Hand', 'Bip01_L_UpperArm', 'Bip01_L_Forearm', 'Bip01_L_Hand', 'Bip01_R_Thigh', 'Bip01_R_Calf', 'Bip01_R_Foot', 'Bip01_L_Thigh', 'Bip01_L_Calf', 'Bip01_L_Foot'];
function buildHuman(a) {
  let av = AVATARS.find(v => v.k === a.look.av);
  if (!av) { av = pick(AVATARS.filter(v => v.f === !!a.look.f)); a.look = avatarLook(av); }
  const root = T.SkeletonUtils.clone(HUM.src[av.k]); root.rotation.y = Math.PI; // o avatar olha para +z; o jogo usa -z
  const mats = [];
  root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); mats.push(o.material); o.frustumCulled = false; o.castShadow = true; } });
  const b = {}; for (const n of BONES) b[n] = root.getObjectByName(n);
  const mixer = new T.AnimationMixer(root), px = av.f ? 'f_' : 'm_', act = {};
  for (const k of ['idle', 'walk', 'run', 'crouch']) { const c = HUM.clips[px + k] || HUM.clips['m_' + k]; if (c) { act[k] = mixer.clipAction(c); act[k].play(); act[k].setEffectiveWeight(k === 'idle' ? 1 : 0); act[k].time = Math.random() * c.duration; } }
  const g = new T.Group(); g.add(root); scene.add(g);
  const gun = new T.Mesh(gunGeo('M416'), MAT.actor); gun.rotation.order = 'YXZ'; gun.visible = false; gun.castShadow = true; g.add(gun);
  const far = new T.Mesh(farGeo(a.look), MAT.actor); far.visible = false; g.add(far);
  a.model = { human: true, av, g, root, b, mixer, act, w: { idle: 1, walk: 0, run: 0, crouch: 0 }, mats, gun, far, gear: {} };
  g.updateMatrixWorld(true);
  updateHumanGear(a); refreshGun(a);
}
// capacete/colete: os militares já têm (aparecem só quando equipados); os outros recebem peças por cima
function updateHumanGear(a) {
  const m = a.model; if (!m || !m.human) return;
  for (const mt of m.mats) {
    const n = mt.name.toLowerCase();
    if (/helmet/.test(n)) mt.visible = !!a.helm;
    else if (/equipment/.test(n) && m.av.mil) mt.visible = !!a.vest;
    else if (/knife|pistol|shotgun|machinegun/.test(n)) mt.visible = false;
  }
  const hasHelm = m.mats.some(mt => /helmet/.test(mt.name.toLowerCase())), hasVest = m.av.mil;
  const put = (key, on, bone, geoFn, off) => {
    if (m.gear[key]) { m.gear[key].parent.remove(m.gear[key]); m.gear[key] = null; }
    if (!on || !m.b[bone]) return;
    const mesh = new T.Mesh(geoFn(), MAT.actor); mesh.castShadow = true;
    // posição e rotação calculadas na pose de repouso (de pé), presas ao osso
    m.g.updateMatrixWorld(true); const bw = m.b[bone].getWorldPosition(new T.Vector3());
    const wp = bw.add(new T.Vector3(off[0], off[1], off[2])); m.b[bone].worldToLocal(wp); mesh.position.copy(wp);
    const q = m.b[bone].getWorldQuaternion(new T.Quaternion()).invert(); mesh.quaternion.copy(q);
    m.b[bone].add(mesh); m.gear[key] = mesh;
  };
  put('helm', a.helm && !hasHelm, 'Bip01_Head', () => mergeParts([{ g: GEO.hsph, sx: 0.27, sy: 0.24, sz: 0.3, c: LV_C[a.helm.lv] }, bx(-0.14, -0.01, -0.16, 0.28, 0.03, 0.06, shade(LV_C[a.helm.lv], 0.7))]), [0, 0.07, 0.01]);
  put('vest', a.vest && !hasVest, 'Bip01_Spine2', () => mergeParts([bx(-0.2, -0.24, -0.15, 0.4, 0.42, 0.29, LV_C[a.vest.lv]), bx(-0.15, -0.18, -0.165, 0.12, 0.12, 0.03, shade(LV_C[a.vest.lv], 0.75)), bx(0.03, -0.18, -0.165, 0.12, 0.12, 0.03, shade(LV_C[a.vest.lv], 0.75))]), [0, -0.05, 0]);
  put('bag', a.bagLv > 0, 'Bip01_Spine2', () => { const bc = ['', '#8d6e63', '#556b2f', '#37474f'][a.bagLv], h = 0.42 + a.bagLv * 0.06; return mergeParts([bx(-0.16, -h + 0.1, 0.12, 0.32, h, 0.17 + a.bagLv * 0.03, bc), bx(-0.13, -h + 0.16, 0.29 + a.bagLv * 0.03, 0.26, 0.16, 0.05, shade(bc, 0.8))]); }, [0, 0, 0]);
}

// ---------- ajustes de pose por código ----------
const _A = new T.Vector3(), _B = new T.Vector3(), _C = new T.Vector3(), _D = new T.Vector3(), _E = new T.Vector3(), _Q1 = new T.Quaternion(), _Q2 = new T.Quaternion(), _Q3 = new T.Quaternion();
const _R = new T.Vector3(), _F = new T.Vector3(), _UP = new T.Vector3(0, 1, 0), _P = new T.Vector3(), _H1 = new T.Vector3(), _H2 = new T.Vector3(), _pole = new T.Vector3();
// gira o osso para que o filho fique na direção dir (no mundo)
function aimBone(bone, child, dir) {
  bone.getWorldPosition(_A); child.getWorldPosition(_B);
  _B.sub(_A).normalize(); _C.copy(dir).normalize();
  _Q1.setFromUnitVectors(_B, _C); bone.getWorldQuaternion(_Q2); _Q1.multiply(_Q2);
  bone.parent.getWorldQuaternion(_Q3).invert(); bone.quaternion.copy(_Q3.multiply(_Q1)); bone.updateMatrixWorld(true);
}
function rotWorld(bone, axis, ang) {
  _Q1.setFromAxisAngle(axis, ang); bone.getWorldQuaternion(_Q2); _Q1.multiply(_Q2);
  bone.parent.getWorldQuaternion(_Q3).invert(); bone.quaternion.copy(_Q3.multiply(_Q1)); bone.updateMatrixWorld(true);
}
// IK de 2 ossos (ombro-cotovelo-mão) até o alvo, com o cotovelo puxado para o "pole"
function ik2(up, lo, end, target, pole) {
  if (!up || !lo || !end) return;
  target = target.clone(); pole = pole.clone();
  const S = up.getWorldPosition(new T.Vector3()), M = lo.getWorldPosition(_D), Eh = end.getWorldPosition(_E);
  const l1 = S.distanceTo(M), l2 = M.distanceTo(Eh);
  const Dv = _P.copy(target).sub(S); let d = Dv.length(); if (d < 1e-4) return;
  const dir = Dv.divideScalar(d); d = clamp(d, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.005);
  const a1 = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a1 * a1));
  _pole.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  const elbow = S.clone().addScaledVector(dir, a1).addScaledVector(_pole, h);
  aimBone(up, lo, _H1.copy(elbow).sub(S));
  aimBone(lo, end, _H2.copy(target).sub(elbow));
}
const _frus = new T.Frustum(), _pm = new T.Matrix4(), _sph = new T.Sphere();
function humanFrame() { camera.updateMatrixWorld(); _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _frus.setFromProjectionMatrix(_pm); }
function animateHuman(a, dt, camX, camZ, hideSelf) {
  const m = a.model, vis = a.alive && a.mode !== 'plane' && !hideSelf;
  if (!vis) { m.g.visible = false; return; }
  const d2 = (a.x - camX) ** 2 + (a.z - camZ) ** 2;
  if (d2 > (G.zoomFar ? 900 : 480) ** 2) { m.g.visible = false; return; }
  m.g.visible = true; m.g.position.set(a.x, a.y, a.z); m.g.rotation.set(0, a.yaw, 0);
  const prone = a.knocked || a.stance === 'prone', w = curW(a), armed = !!w && !a.knocked && a.healT <= 0 && !(a.veh && a.seat === 0);
  _sph.set(_A.set(a.x, a.y + 1, a.z), 2);
  const far = d2 > 150 * 150 || !_frus.intersectsSphere(_sph), mid = d2 > 60 * 60;
  m.root.visible = !far; m.far.visible = far;
  if (far) { m.gun.visible = false; m.far.rotation.x = prone ? -Math.PI / 2 : 0; m.far.position.y = prone ? 0.2 : 0; return; }
  // mistura das animações pela velocidade
  const sp = a.veh ? 0 : Math.hypot(a.vx, a.vz), cr = a.stance === 'crouch' && !a.veh;
  const tw = { idle: 0, walk: 0, run: 0, crouch: 0 };
  if (a.veh || a.mode !== 'ground') tw.idle = 1;
  else if (cr && sp < 0.6) tw.crouch = 1;
  else if (sp < 0.4) tw.idle = 1;
  else if (sp < 3.6 || cr || prone) tw.walk = 1;
  else { const k = clamp((sp - 3.6) / 1.6, 0, 1); tw.run = k; tw.walk = 1 - k; }
  // corpo gira atrasado em relação à mira (como no PUBG): parado, o tronco torce até ~60° e depois os pés acompanham
  const free = a.mode === 'ground' && !a.veh && !prone && !a.swim;
  if (m.byaw == null || !free) { m.byaw = a.yaw; m.turn = false; }
  else {
    let dy = wrapA(a.yaw - m.byaw);
    if (Math.abs(dy) > 1.35) { m.byaw = wrapA(a.yaw - Math.sign(dy) * 1.35); dy = Math.sign(dy) * 1.35; }
    if (sp > 0.4) { m.byaw += dy * Math.min(1, dt * 11); m.turn = false; }
    else { if (Math.abs(dy) > 0.95) m.turn = true; if (m.turn) { m.byaw += dy * Math.min(1, dt * 6.5); if (Math.abs(dy) < 0.08) m.turn = false; } }
    m.byaw = wrapA(m.byaw);
  }
  const yawOff = wrapA(a.yaw - m.byaw); m.g.rotation.set(0, m.byaw, 0);
  if (m.turn && tw.idle > 0.5 && !cr) { tw.idle = 0.4; tw.walk = 0.6; } // passinhos ao girar parado
  // velocidade de giro e aceleração: o corpo inclina nas curvas e ao arrancar/frear
  const yv = m.lyaw == null ? 0 : wrapA(a.yaw - m.lyaw) / Math.max(dt, 1e-3); m.lyaw = a.yaw;
  m.yv = (m.yv || 0) + (clamp(yv, -6, 6) - (m.yv || 0)) * Math.min(1, dt * 6);
  const acc = m.lsp == null ? 0 : (sp - m.lsp) / Math.max(dt, 1e-3); m.lsp = sp;
  m.acc2 = (m.acc2 || 0) + (clamp(acc, -25, 25) - (m.acc2 || 0)) * Math.min(1, dt * 5);
  m.runK = (m.runK || 0) + ((sp > 5.6 && a.onGround ? 1 : 0) - (m.runK || 0)) * Math.min(1, dt * 5);
  const k = Math.min(1, dt * 8);
  for (const n in m.act) { m.w[n] += (tw[n] - m.w[n]) * k; m.act[n].setEffectiveWeight(m.w[n]); }
  // direção do movimento em relação para onde olha: de lado gira as pernas, de ré anda ao contrário
  const fx0 = -Math.sin(a.yaw), fz0 = -Math.cos(a.yaw), fwdC = a.vx * fx0 + a.vz * fz0, sideC = a.vx * Math.cos(a.yaw) - a.vz * Math.sin(a.yaw);
  let twistT = 0, back = false;
  if (sp > 0.4 && a.mode === 'ground' && !a.veh && !prone) {
    const ang = Math.atan2(sideC, fwdC);
    if (Math.abs(ang) > 1.9) { back = true; twistT = clamp(wrapA(ang - Math.PI), -0.9, 0.9); } else twistT = clamp(ang, -1.1, 1.1);
  }
  m.twist = (m.twist || 0) + (twistT - (m.twist || 0)) * Math.min(1, dt * 7);
  if (m.act.walk) m.act.walk.timeScale = m.turn && sp < 0.4 ? 1.1 : clamp(sp / (cr ? 1.1 : 1.45), 0.5, 2.2) * (back ? -1 : 1);
  if (m.act.run) m.act.run.timeScale = clamp(sp / 5.2, 0.7, 1.5) * (back ? -1 : 1);
  // de longe atualiza a animação a cada 2 quadros
  m.acc = (m.acc || 0) + dt; m.fr = (m.fr || 0) + 1;
  if (!mid || m.fr % 2 === 0) { m.mixer.update(m.acc); m.acc = 0; }
  // coice e reação a tiro
  m.kickV = ((m.kickV || 0) + (a.kick || 0) * 0.6) * Math.exp(-dt * 11); a.kick = 0;
  const hitK = clamp(1 - (G.matchT - a.lastHitT) / 0.3, 0, 1);
  const wa = m.act.walk && m.w.walk > 0.2 ? m.act.walk : m.act.run && m.w.run > 0.2 ? m.act.run : null;
  const ph = wa ? wa.time / wa.getClip().duration * Math.PI * 4 : 0, bob = Math.min(1, sp / 5);
  // corpo deitado / caindo / agachado andando
  // transições suaves: deitar leva ~0,7 s, agachar andando desce aos poucos, aterrissar dobra o joelho
  m.pk = (m.pk == null ? (prone ? 1 : 0) : m.pk) + ((prone ? 1 : 0) - (m.pk || 0)) * Math.min(1, dt * 3.8);
  m.cy = (m.cy || 0) + ((cr && sp >= 0.6 ? -0.32 : 0) - (m.cy || 0)) * Math.min(1, dt * 9);
  const ld = a.mode === 'ground' ? landDip(a) : 0;
  m.root.position.set(0, 0, 0); m.root.rotation.set(0, Math.PI, 0);
  if (m.pk > 0.01 && a.mode === 'ground') { m.root.rotation.set(-Math.PI / 2 * m.pk, Math.PI, 0); m.root.position.set(0, 0.16 * m.pk - Math.sin(m.pk * Math.PI) * 0.3, 0); }
  else if (a.mode === 'fall') m.root.rotation.set(-0.95 - (a.diveK || 0) * 0.55 + (a.glideK || 0) * 0.1, Math.PI, Math.sin(G.t * 2.1 + a.id) * 0.04); // mergulho de cabeça; planando, mais deitado
  if (!prone) m.root.position.y += m.cy - ld * 0.2;
  if (Math.abs(m.twist) > 0.01 && !prone && a.mode === 'ground') m.root.rotation.y = Math.PI - m.twist;
  m.g.updateMatrixWorld(true);
  const B = m.b, yaw = a.yaw, pitch = a.pitch;
  _F.set(-Math.sin(yaw), 0, -Math.cos(yaw)); _R.set(Math.cos(yaw), 0, -Math.sin(yaw));
  // inclinação e mira no tronco/cabeça
  if (!prone && a.mode === 'ground' && !a.veh) {
    if (B.Bip01_Spine && Math.abs(m.twist) > 0.01) rotWorld(B.Bip01_Spine, _UP, m.twist * 0.9); // tronco volta a olhar para a mira
    if (B.Bip01_Spine && a.lean) rotWorld(B.Bip01_Spine, _F, a.lean * 0.38);
    if (B.Bip01_Spine && Math.abs(yawOff) > 0.01) { rotWorld(B.Bip01_Spine, _UP, yawOff * 0.5); if (B.Bip01_Spine1) rotWorld(B.Bip01_Spine1, _UP, yawOff * 0.3); }
    if (B.Bip01_Spine) { // corrida inclina para frente; curva inclina para dentro; arrancada/freada balança o tronco
      const bank = clamp(-m.yv * 0.035, -0.16, 0.16) * Math.min(1, sp / 4), pitchB = -m.runK * 0.16 - clamp(m.acc2 * 0.012, -0.1, 0.1);
      if (Math.abs(bank) > 0.003) rotWorld(B.Bip01_Spine, _F, bank);
      if (Math.abs(pitchB) > 0.003) rotWorld(B.Bip01_Spine, _R, pitchB);
    }
    if (ld > 0.01) for (const s of ['L', 'R']) { const th = B[`Bip01_${s}_Thigh`], ca = B[`Bip01_${s}_Calf`]; if (th && ca) { rotWorld(th, _R, 0.75 * ld); rotWorld(ca, _R, -1.2 * ld); } }
    if (B.Bip01_Spine1) { rotWorld(B.Bip01_Spine1, _F, Math.sin(ph) * 0.045 * bob); rotWorld(B.Bip01_Spine1, _UP, Math.sin(ph) * 0.05 * bob); }
    if (B.Bip01_Spine2 && sp < 0.4) rotWorld(B.Bip01_Spine2, _R, Math.sin(G.t * 1.7 + a.id) * 0.018); // respiração
    if (B.Bip01_Spine1 && (m.kickV > 0.01 || hitK > 0)) rotWorld(B.Bip01_Spine1, _R, m.kickV * 0.035 - hitK * 0.16);
    if (B.Bip01_Head && hitK > 0) rotWorld(B.Bip01_Head, _F, hitK * 0.25 * (a.id % 2 ? 1 : -1));
    if (!a.onGround && !a.swim) for (const s of ['L', 'R']) { const th = B[`Bip01_${s}_Thigh`], ca = B[`Bip01_${s}_Calf`]; if (th && ca) { rotWorld(th, _R, 0.7); rotWorld(ca, _R, -1.1); } } // pulo: encolhe as pernas
    if (B.Bip01_Spine1 && armed) rotWorld(B.Bip01_Spine1, _R, clamp(pitch, -1, 1) * 0.45);
    if (B.Bip01_Head) rotWorld(B.Bip01_Head, _R, clamp(pitch, -1, 1) * (armed ? 0.25 : 0.5));
    if (cr && sp >= 0.6) for (const s of ['L', 'R']) { const th = B[`Bip01_${s}_Thigh`], ca = B[`Bip01_${s}_Calf`], ft = B[`Bip01_${s}_Foot`]; if (th) { rotWorld(th, _R, 0.9); rotWorld(ca, _R, -1.4); } }
  }
  if (prone && B.Bip01_Head) rotWorld(B.Bip01_Neck || B.Bip01_Head, _R, 0.9);
  // sentado no veículo
  if (a.veh) for (const s of ['L', 'R']) {
    const th = B[`Bip01_${s}_Thigh`], ca = B[`Bip01_${s}_Calf`], ft = B[`Bip01_${s}_Foot`];
    if (th && ca && ft) { aimBone(th, ca, _C.copy(_F).multiplyScalar(1).addScaledVector(_UP, -0.12).addScaledVector(_R, s === 'L' ? -0.08 : 0.08)); aimBone(ca, ft, _D.set(0, -1, 0).addScaledVector(_F, 0.2)); }
  }
  // braços
  if (a.mode === 'chute') {
    for (const s of ['L', 'R']) { const sg = s === 'L' ? -1 : 1; ik2(B[`Bip01_${s}_UpperArm`], B[`Bip01_${s}_Forearm`], B[`Bip01_${s}_Hand`], B.Bip01_Head.getWorldPosition(_E).addScaledVector(_UP, 0.45).addScaledVector(_R, sg * 0.3), _pole.copy(_R).multiplyScalar(sg)); }
  } else if (a.mode === 'fall') {
    const dk = a.diveK || 0; // mergulhando: braços para trás colados ao corpo; planando: abertos
    for (const s of ['L', 'R']) { const sg = s === 'L' ? -1 : 1; aimBone(B[`Bip01_${s}_UpperArm`], B[`Bip01_${s}_Forearm`], _C.copy(_R).multiplyScalar(sg * (1 - dk * 0.75)).addScaledVector(_UP, 0.5 - dk * 0.9).addScaledVector(_F, -dk * 0.9)); }
  } else if (a.veh && a.seat === 0) {
    const ch = B.Bip01_Spine2.getWorldPosition(new T.Vector3());
    for (const s of ['L', 'R']) { const sg = s === 'L' ? -1 : 1; ik2(B[`Bip01_${s}_UpperArm`], B[`Bip01_${s}_Forearm`], B[`Bip01_${s}_Hand`], _H1.copy(ch).addScaledVector(_F, 0.42).addScaledVector(_UP, -0.12).addScaledVector(_R, sg * 0.17), _pole.set(0, -1, 0).addScaledVector(_R, sg * 0.5)); }
  }
  // arma nas mãos
  m.gun.visible = armed && !far;
  if (armed && B.Bip01_Spine2) {
    const d = wdef(w), pistol = d.cls === 'pistol', cp = Math.cos(pitch);
    const dir = _D.set(_F.x * cp, Math.sin(pitch), _F.z * cp);
    const ch = B.Bip01_Spine2.getWorldPosition(new T.Vector3());
    const P = prone ? ch.addScaledVector(_UP, 0.05).addScaledVector(dir, 0.35) : ch.addScaledVector(_UP, pistol ? 0.12 : 0.16).addScaledVector(_R, pistol ? 0.02 : 0.12).addScaledVector(dir, pistol ? 0.5 : 0.3);
    const rel = a.reloadT > 0, sprint = sp > 5.6 && !a.trigger && !a.ads && !prone && a.mode === 'ground';
    // balanço da arma com os passos, coice para trás e posição de corrida (arma baixa)
    P.addScaledVector(_UP, Math.sin(ph) * 0.014 * bob).addScaledVector(_R, Math.cos(ph * 0.5) * 0.012 * bob).addScaledVector(dir, -m.kickV * 0.035);
    m.lowK = (m.lowK || 0) + ((sprint ? 1 : 0) - (m.lowK || 0)) * Math.min(1, dt * 6);
    if (m.lowK > 0.01) P.addScaledVector(_UP, -0.12 * m.lowK).addScaledVector(_R, -0.08 * m.lowK).addScaledVector(dir, -0.08 * m.lowK);
    m.gun.position.copy(m.g.worldToLocal(P.clone())); m.gun.rotation.set(pitch + (rel ? -0.5 : 0) + m.kickV * 0.06 - m.lowK * 0.75, m.lowK * 0.5, (rel ? 0.5 : 0) + m.lowK * 0.3);
    m.gun.updateMatrixWorld(true);
    const grip = m.gun.localToWorld(new T.Vector3(0, -0.08, 0.06)), fore = m.gun.localToWorld(new T.Vector3(0, -0.06, foreOf(w.k)));
    ik2(B.Bip01_R_UpperArm, B.Bip01_R_Forearm, B.Bip01_R_Hand, grip, _pole.set(0, -1, 0).addScaledVector(_R, 0.7));
    ik2(B.Bip01_L_UpperArm, B.Bip01_L_Forearm, B.Bip01_L_Hand, rel ? m.gun.localToWorld(new T.Vector3(0, -0.16, -0.1)) : fore, _pole.set(0, -1, 0).addScaledVector(_R, -0.6));
  }
}

// ---------- corpo caindo ao morrer (fica alguns segundos e some) ----------
G.corpses = [];
function toCorpse(a) {
  const m = a.model; a.model = null; m.gun.visible = false;
  m.g.position.set(a.x, a.y, a.z); m.g.rotation.set(0, a.yaw, 0); m.root.visible = true; m.far.visible = false;
  m.g.visible = Math.hypot(a.x - camera.position.x, a.z - camera.position.z) < 150;
  G.corpses.push({ m, t: 0, dir: Math.random() < 0.5 ? 1 : -1, prone: a.stance === 'prone' || a.knocked });
}
function stepCorpses(dt) {
  for (let i = G.corpses.length - 1; i >= 0; i--) {
    const c = G.corpses[i]; c.t += dt; const m = c.m;
    m.g.visible = Math.hypot(m.g.position.x - camera.position.x, m.g.position.z - camera.position.z) < 150;
    const k = smooth(clamp(c.t / 0.7, 0, 1));
    if (!c.prone) { m.root.rotation.set(c.dir * k * Math.PI / 2 * 0.98, Math.PI, 0); m.root.position.y = k * 0.12; }
    if (c.t > 8) { scene.remove(m.g); if (m.mixer) m.mixer.stopAllAction(); G.corpses.splice(i, 1); }
  }
}
function clearCorpses() { for (const c of G.corpses) scene.remove(c.m.g); G.corpses.length = 0; }

// ---------- avião de verdade (A320 sem logotipo, CC BY 4.0 amvlab) ----------
function setPlaneModel(src) {
  const box = new T.Box3().setFromObject(src), size = box.getSize(new T.Vector3());
  // eixo do comprimento: o maior entre x e z; nariz = ponta oposta à cauda (cauda é onde fica o ponto mais alto)
  let top = null, topY = -1e9; src.updateMatrixWorld(true);
  src.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position, v = new T.Vector3(); for (let i = 0; i < p.count; i += 7) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.y > topY) { topY = v.y; top = v.clone(); } } });
  const c = box.getCenter(new T.Vector3()), alongX = size.x > size.z, len = Math.max(size.x, size.z), s = 38 / len;
  const tailSign = Math.sign(alongX ? top.x - c.x : top.z - c.z) || 1;
  const wrap = new T.Group(); src.position.sub(c); wrap.add(src);
  // queremos a cauda em +z (o avião anda para -z)
  wrap.rotation.y = alongX ? (tailSign > 0 ? -Math.PI / 2 : Math.PI / 2) : (tailSign > 0 ? 0 : Math.PI);
  wrap.scale.setScalar(s);
  src.traverse(o => { if (o.isMesh) { const m = o.material; o.material = new T.MeshLambertMaterial({ map: m.map || null, color: m.map ? 0xffffff : m.color }); if (o.material.map) o.material.map.encoding = T.sRGBEncoding; o.castShadow = false; } });
  for (const P of [PLANE, DROPP]) {
    const w2 = P === PLANE ? wrap : wrap.clone();
    P.m.geometry = new T.BufferGeometry(); P.m.add(w2);
  }
}
