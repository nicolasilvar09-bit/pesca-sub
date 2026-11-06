// ================= sons reais (CC0): tiros gravados de verdade por tipo de arma e passos na terra/pedra, com direção (esquerda/direita) e distância =================
// tiros: "The Free Firearm Sound Library" (OpenGameArt, CC0); passos: "Fantozzi's Footsteps" (OpenGameArt, CC0)
const SND = { buf: {}, loading: false, ready: false };
const SND_FILES = ['ak1', 'ak2', 'ar1', 'ar2', 'smg1', 'smg2', 'pistol1', 'pistol2', 'sg1', 'sg2', 'dmr1', 'dmr2', 'sr1', 'sr2',
  ...['sand', 'stone'].flatMap(s => ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'].map(k => `step_${s}${k}`))];
function sndLoad() {
  if (SND.loading || !AC) return; SND.loading = true; let left = SND_FILES.length;
  for (const f of SND_FILES) fetch(`assets/snd/${f}.mp3`).then(r => r.arrayBuffer()).then(ab => new Promise((ok, no) => AC.decodeAudioData(ab, ok, no)))
    .then(b => { SND.buf[f] = b; }).catch(() => {}).finally(() => { if (--left === 0) SND.ready = true; });
}
(function hookInit() { const base = sfxInit; sfxInit = function () { base(); sndLoad(); }; })();
// toca um som do mundo: volume pela distância, abafado de longe, e vindo do lado certo
function sndPlay(name, x, z, vol, opt) {
  const b = SND.buf[name]; if (!AC || !b || vol < 0.01) return false;
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter(); s.buffer = b; s.playbackRate.value = (opt && opt.rate) || 1;
  const dx = x - camera.position.x, dz = z - camera.position.z, d = Math.hypot(dx, dz) || 1;
  f.type = 'lowpass'; f.frequency.value = (opt && opt.lp) || Math.max(900, 16000 / (1 + d / 60)); f.Q.value = 0.5;
  g.gain.value = Math.min(1.5, vol * SET.vol);
  let node = s.connect(f).connect(g);
  if (AC.createStereoPanner && d > 1.5) { const yaw = camera.rotation.y, rx = Math.cos(yaw), rz = -Math.sin(yaw), p = AC.createStereoPanner(); p.pan.value = Math.max(-0.85, Math.min(0.85, (dx * rx + dz * rz) / d)); node = node.connect(p); }
  node.connect(AC.destination); s.start(); return true;
}
// tiro: troca o som sintetizado pela gravação (se ainda não carregou, usa o antigo)
(function hookShot() {
  const base = shotSound;
  shotSound = function (a, d, quiet) {
    if (!AC || G.phase !== 'match' || !SND.ready) return base(a, d, quiet);
    const now = performance.now(); if (now - shotT < 12 && a !== G.player) return; shotT = now;
    const dist = Math.hypot(a.x - camera.position.x, a.z - camera.position.z), self = a === G.player && !G.view.fpp ? 0.9 : a === G.player ? 1 : 0.95;
    const cls = d.cls === 'ar' ? (/AK|Beryl|Groza|DP-28/i.test(d.n) ? 'ak' : 'ar') : d.cls, name = cls + (Math.random() < 0.5 ? 1 : 2);
    const v = (quiet ? 0.28 : 1) * self / (1 + dist / 45);
    if (!sndPlay(name, a.x, a.z, v * 0.9, { rate: 0.96 + Math.random() * 0.08, lp: quiet ? 1400 : null })) base(a, d, quiet);
    if (dist > 160 && !quiet) noise(0.5, v * 0.25, 300, 0.6); /* eco grave de longe */
  };
})();
// passos: cada um que anda perto faz barulho (agachado mais baixo, deitado quase nada); pedra na rua e dentro das casas
const _stepAcc = new Map();
function stepSounds(dt) {
  if (!AC || !SND.ready || G.phase !== 'match') return;
  let n = 0;
  for (const a of G.actors) {
    if (!a.alive || a.mode !== 'ground' || a.veh || !a.onGround || a.stance === 'prone') continue;
    const sp = Math.hypot(a.vx || 0, a.vz || 0); if (sp < 0.9) continue;
    const d = Math.hypot(a.x - camera.position.x, a.z - camera.position.z); if (d > 48) continue;
    const acc = (_stepAcc.get(a) || 0) + sp * dt, stride = a.stance === 'crouch' ? 0.95 : sp > 5.6 ? 1.75 : 1.4;
    if (acc < stride) { _stepAcc.set(a, acc); continue; } _stepAcc.set(a, acc - stride);
    if (n++ > 5) continue;
    const gh = groundH(a.x, a.z), stone = roadDist(a.x, a.z) < 4.6 || a.y > gh + 0.6 || !!bldAt(a.x, a.z), side = (a._stepSide = !a._stepSide) ? 'L' : 'R';
    const name = `step_${stone ? 'stone' : 'sand'}${side}${1 + Math.floor(Math.random() * 3)}`;
    const quiet = a.stance === 'crouch' ? 0.35 : 1, run = sp > 5.6 ? 1.25 : 1;
    const v = a === G.player ? 0.22 * quiet * run : 0.75 * quiet * run / (1 + d / 7);
    sndPlay(name, a.x, a.z, v, { rate: 0.92 + Math.random() * 0.16 });
  }
}
(function hookSteps() { const base = natureStep; natureStep = function (dt, fx, fz, high) { base(dt, fx, fz, high); stepSounds(dt); }; })();
