// ================= recarga em 1ª pessoa: a mão esquerda busca o pente novo e encaixa, cartucho por cartucho na escopeta e no ferrolho, sons gravados =================
// sons: "Gun Reload Sounds" de SpringySpringo (OpenGameArt, CC0), cortados em pedaços: pente sai, pente entra, ferrolho, ferrolho de pistola e bomba de escopeta.
const RL_SND = ['rl_out', 'rl_in', 'rl_bolt', 'rl_pout', 'rl_slide', 'rl_pump'];
SND_FILES.push(...RL_SND);
// estilo de recarga de cada arma
function rlStyle(k) {
  const d = WEAP[k]; if (!d) return 'mag';
  if (k === 'DP28') return 'pan';
  if (d.lmg) return 'box';
  if (k === 'S1897' || k === 'S686' || k === 'KAR98K' || k === 'MOSIN') return 'shell';
  return d.cls === 'pistol' ? 'pistol' : 'mag';
}
// onde fica o pente em cada arma: procura a parte mais baixa entre o gatilho e o guarda-mão (no modelo de verdade, quando já carregou)
const RL_INFO = {};
const _rv = new T.Vector3();
function rlInfo(k) {
  const real = REALGUN[k] && REALGUN[k].obj, key = k + (real ? 'r' : 'p');
  if (RL_INFO[key]) return RL_INFO[key];
  const st = rlStyle(k), pis = st === 'pistol', fore = foreOf(k);
  const z0 = pis ? -0.01 : fore + 0.07, z1 = pis ? 0.12 : 0.0;
  let minY = 0, sz = 0, n = 0;
  const scan = (geo, mw) => { const p = geo.attributes && geo.attributes.position; if (!p) return;
    for (let i = 0; i < p.count; i++) { _rv.fromBufferAttribute(p, i); if (mw) _rv.applyMatrix4(mw); if (_rv.z < z0 || _rv.z > z1 || Math.abs(_rv.x) > 0.06) continue;
      if (_rv.y < minY - 0.004) { minY = _rv.y; sz = _rv.z; n = 1; } else if (_rv.y < minY + 0.004) { sz += _rv.z; n++; } } };
  if (real) { real.updateMatrixWorld(true); real.traverse(o => { if (o.isMesh) scan(o.geometry, o.matrixWorld); }); }
  else scan(gunGeo(k));
  const z = n ? sz / n : (pis ? 0.05 : fore * 0.4);
  const bot = Math.max(pis ? -0.2 : -0.3, Math.min(minY, pis ? -0.08 : -0.07));
  return RL_INFO[key] = { st, fore, z, bot, top: pis ? -0.04 : -0.02 };
}
// peças na mão: pente, caixa de munição, carregador de prato e cartucho
const RL_MAT = new T.MeshStandardMaterial({ color: 0x2b2d31, metalness: 0.6, roughness: 0.5 });
const RL_SHELL_SG = new T.MeshStandardMaterial({ color: 0xa8281e, roughness: 0.6 }), RL_SHELL_SR = new T.MeshStandardMaterial({ color: 0xc9a24e, metalness: 0.8, roughness: 0.35 });
const rlMag = new T.Mesh(new T.BoxGeometry(1, 1, 1), RL_MAT), rlPan = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 1, 18), RL_MAT), rlShell = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 8), RL_SHELL_SG);
for (const m of [rlMag, rlPan, rlShell]) { m.visible = false; m.castShadow = false; m.renderOrder = vmGun.renderOrder; VM.add(m); }
// pontos-chave (em metros, no espaço da arma) e caminho da mão; a mão anda suave de um ponto ao outro
const smooth3 = x => x * x * (3 - 2 * x);
function rlKeys(I, k) {
  const R = null, W = [0, I.bot - 0.015, I.z], D = [-0.09, I.bot - 0.32, I.z + 0.14];
  if (I.st === 'pistol') return { keys: [[0, R], [0.1, R], [0.26, D], [0.36, D], [0.55, W], [0.61, W], [0.72, [-0.035, 0.035, 0.07]], [0.8, [-0.035, 0.035, 0.07]], [1, R]], mag: [0.4, 0.6], snd: [[0.12, 'rl_pout'], [0.56, 'rl_in', 1.25], [0.75, 'rl_slide']] };
  if (I.st === 'shell') {
    const sg = WEAP[k].cls === 'sg', P = sg ? [0, -0.045, -0.06] : [0, 0.03, 0.0], Q = [-0.08, -0.2, 0.06], keys = [[0, R], [0.12, R]], snd = [], cyc = k === 'S686' ? 2 : 4, a = 0.14, b = 0.78, st = (b - a) / cyc;
    for (let i = 0; i < cyc; i++) { const t = a + i * st; keys.push([t + st * 0.35, Q], [t + st * 0.8, P], [t + st, P]); snd.push([t + st * 0.82, 'rl_in', sg ? 1.45 : 1.7, 0.5]); }
    keys.push([0.86, R], [1, R]);
    snd.push(k === 'S1897' ? [0.88, 'rl_pump'] : k === 'S686' ? [0.86, 'rl_slide', 0.8] : [0.86, 'rl_bolt']);
    return { keys, shell: [a, b, st, sg], snd, pump: k === 'S1897' };
  }
  if (I.st === 'pan') { const T2 = [0, 0.11, -0.07]; return { keys: [[0, R], [0.12, R], [0.28, T2], [0.32, T2], [0.46, [-0.1, 0.32, 0.12]], [0.52, [-0.1, 0.32, 0.12]], [0.66, T2], [0.72, T2], [0.84, [-0.05, 0.03, 0.02]], [0.9, [-0.05, 0.03, 0.02]], [1, R]], pan: [0.5, 0.7], snd: [[0.3, 'rl_out'], [0.68, 'rl_in', 0.85], [0.87, 'rl_bolt']] }; }
  const lmg = I.st === 'box';
  return { keys: [[0, R], [0.15, R], [0.27, W], [0.31, W], [0.44, D], [0.5, D], [0.63, W], [0.69, W], [0.79, [-0.06, 0.035, -0.04]], [0.87, [-0.06, 0.035, -0.04]], [1, R]], mag: [0.46, 0.68],
    snd: lmg ? [[0.08, 'rl_bolt', 0.8, 0.5], [0.3, 'rl_out'], [0.66, 'rl_in', 0.85], [0.74, 'rl_slide', 0.7, 0.6], [0.86, 'rl_bolt']] : [[0.29, 'rl_out'], [0.65, 'rl_in'], [0.84, 'rl_bolt']] };
}
const RL = { k: '', plan: null, info: null, palm0: new T.Vector3(), q: new T.Quaternion() };
const _ra = new T.Vector3(), _rb = new T.Vector3();
function rlPalmRest(I) { const w = vmArmPose(-1, I.fore, I.st === 'pistol').wrist; return RL.palm0.set(w[0] + 0.008, w[1] - 0.012, w[2] - 0.055); }
function rlAt(keys, t, out) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [ta, pa] = keys[i], [tb, pb] = keys[i + 1], u = smooth3(clamp((t - ta) / Math.max(1e-4, tb - ta), 0, 1));
  const A = pa ? _ra.set(...pa) : _ra.copy(RL.palm0), B = pb ? _rb.set(...pb) : _rb.copy(RL.palm0);
  return out.copy(A).lerp(B, u);
}
const _rp = new T.Vector3();
function rlStep() {
  const p = G.player; rlMag.visible = rlPan.visible = rlShell.visible = false;
  if (!p || !VM.visible) return; const w = curW(p); if (!w || !(p.reloadT > 0) || !p.relTot) return;
  if (RL.k !== w.k || !RL.plan) { RL.k = w.k; RL.info = rlInfo(w.k); RL.plan = rlKeys(RL.info, w.k); }
  const I = RL.info, P = RL.plan, t = 1 - p.reloadT / p.relTot;
  rlPalmRest(I);
  rlAt(P.keys, t, _rp); // onde a palma deve estar (espaço da arma = espaço do VM)
  // bomba da escopeta: a mão no guarda-mão puxa para trás e volta
  if (P.pump && t > 0.86) _rp.z += Math.sin(clamp((t - 0.86) / 0.1, 0, 1) * Math.PI) * 0.09;
  // leva a palma até o ponto: desloca o braço no espaço dos braços (que gira um pouco junto)
  RL.q.copy(vmArms.quaternion).invert();
  const tgt = _ra.copy(_rp).applyQuaternion(RL.q), far = Math.min(1, _rb.copy(tgt).sub(RL.palm0).length() / 0.25);
  vmArmL.rotation.set(-0.25 * far, 0.15 * far, 0.1 * far); vmArmL.updateMatrix();
  vmArmL.position.copy(tgt).sub(_rb.copy(RL.palm0).applyEuler(vmArmL.rotation)); // gira o braço e corrige para a palma cair no ponto
  const inHand = (r) => r && t > r[0] && t < r[1];
  if (inHand(P.mag)) { // pente novo na mão até encaixar no lugar do antigo
    const h = clamp(I.top - I.bot, 0.06, 0.26), lmg = I.st === 'box';
    rlMag.scale.set(lmg ? 0.085 : I.st === 'pistol' ? 0.024 : 0.03, lmg ? 0.1 : h, lmg ? 0.11 : I.st === 'pistol' ? 0.04 : 0.065);
    rlMag.position.set(_rp.x, _rp.y + 0.015 + (lmg ? 0.05 : h / 2), _rp.z); rlMag.rotation.set(0, 0, 0); rlMag.visible = true;
  }
  if (inHand(P.pan)) { rlPan.scale.set(0.27, 0.03, 0.27); rlPan.position.set(_rp.x, _rp.y - 0.04, _rp.z); rlPan.visible = true; }
  if (P.shell && t > P.shell[0] && t < P.shell[1]) { // cartucho entre a mão subir e entrar
    const ph = ((t - P.shell[0]) / P.shell[2]) % 1; if (ph > 0.3 && ph < 0.82) { const sg = P.shell[3];
      rlShell.material = sg ? RL_SHELL_SG : RL_SHELL_SR; rlShell.scale.set(sg ? 0.0105 : 0.0055, sg ? 0.065 : 0.075, sg ? 0.0105 : 0.0055);
      rlShell.position.set(_rp.x, _rp.y + 0.012, _rp.z - 0.01); rlShell.rotation.set(Math.PI / 2, 0, 0); rlShell.visible = true; }
  }
}
(function hookRlCam() { const base = updateCamera; updateCamera = function (dt) { const r = base(dt); rlStep(); return r; }; })();
// sons gravados no ritmo da animação (se ainda não carregaram, usa os sintetizados)
(function hookRlSnd() {
  const synth = reloadSounds;
  reloadSounds = function (a, tot, cls) {
    const w = curW(a); if (!w || !RL_SND.every(n => SND.buf[n])) return synth(a, tot, cls);
    const plan = rlKeys(rlInfo(w.k), w.k), t0 = performance.now(), k0 = w.k;
    for (const [t, n, rate, vol] of plan.snd) setTimeout(() => { if (a.reloadT > 0 && a.alive && curW(a) && curW(a).k === k0 && performance.now() - t0 < tot * 1000 + 200) sndPlay(n, camera.position.x, camera.position.z, (vol || 0.85) * 0.9, { rate: (rate || 1) * (0.97 + Math.random() * 0.06), lp: 12000 }); }, t * tot * 1000);
  };
})();
// som de sacar a arma ao trocar (curto, baixo)
function rlDrawSound() { if (SND.buf.rl_slide) sndPlay('rl_slide', camera.position.x, camera.position.z, 0.35, { rate: 1.3, lp: 9000 }); }
