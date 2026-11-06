// ================= sons reais (CC0): tiros gravados de verdade por tipo de arma e passos na terra/pedra, com direção (esquerda/direita) e distância =================
// tiros: "The Free Firearm Sound Library" (OpenGameArt, CC0), 14 armas gravadas de perto e de longe; passos: "Fantozzi's Footsteps" (OpenGameArt, CC0)
const SND = { buf: {}, loading: false, ready: false };
const GUN_SND = ['ak', 'ar', 'smg', 'ppsh', 'pistol', 'p45', 'rev', 'sg', 'sgp', 'sgm', 'dmr', 'sr', 'sr2', 'sr3'];
const SND_FILES = [...GUN_SND.flatMap(k => [k + '1', k + '2', k + '_far']),
  ...['sand', 'stone'].flatMap(s => ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'].map(k => `step_${s}${k}`))];
/* qual gravação cada arma usa (perto: 2 tiros diferentes; longe: gravada a média distância) */
const SND_MAP = [[/AKM|Beryl|Groza|DP-28/, 'ak'], [/M416|SCAR|M16|AUG|M249|Mini/, 'ar'], [/UMP|Vector/, 'smg'], [/MP5K|UZI/, 'ppsh'], [/M1911/, 'p45'], [/M625/, 'rev'], [/G18C|M17/, 'pistol'],
  [/S1897/, 'sgp'], [/S686/, 'sgm'], [/S12K/, 'sg'], [/SKS|SLR|Mk14/, 'dmr'], [/Kar98k/, 'sr3'], [/Mosin/, 'sr'], [/M24|AWM/, 'sr2']];
const SND_CLS = { ar: 'ar', smg: 'smg', pistol: 'pistol', sg: 'sg', dmr: 'dmr', sr: 'sr' };
function sndKey(d) { for (const [re, k] of SND_MAP) if (re.test(d.n)) return k; return SND_CLS[d.cls] || 'ar'; }
// mesa de som: tudo passa por um compressor (muitos tiros juntos não estouram) e por dois ecos: campo aberto e dentro de casa
const AUD = {};
function impulse(sec, kind) {
  const n = Math.floor(AC.sampleRate * sec), b = AC.createBuffer(2, n, AC.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / AC.sampleRate; let v = (Math.random() * 2 - 1);
      if (kind === 'in') v *= Math.exp(-t * 9) * 0.9; /* sala: reverberação curta e densa */
      else { /* campo: ecos que voltam dos morros e prédios, mais um rabo grave e longo */
        let e = Math.exp(-t * 2.2) * 0.12;
        for (const [at, w] of [[0.11 + ch * 0.02, 0.55], [0.32 - ch * 0.03, 0.4], [0.68 + ch * 0.05, 0.28], [1.15, 0.16]]) e += w * Math.exp(-Math.abs(t - at) * 60);
        v *= e;
      }
      lp += (v - lp) * (kind === 'in' ? 0.5 : 0.18); d[i] = lp; /* eco perde os agudos */
    }
  }
  return b;
}
function audInit() {
  if (AUD.master || !AC) return;
  const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
  AUD.master = AC.createGain(); AUD.master.connect(comp).connect(AC.destination);
  for (const k of ['out', 'in']) { const c = AC.createConvolver(); c.buffer = impulse(k === 'in' ? 0.7 : 2.0, k); c.connect(AUD.master); AUD[k] = c; }
}
function sndLoad() {
  if (SND.loading || !AC) return; SND.loading = true; audInit(); let left = SND_FILES.length;
  for (const f of SND_FILES) fetch(`assets/snd/${f}.mp3`).then(r => r.arrayBuffer()).then(ab => new Promise((ok, no) => AC.decodeAudioData(ab, ok, no)))
    .then(b => { SND.buf[f] = b; }).catch(() => {}).finally(() => { if (--left === 0) SND.ready = true; });
}
(function hookInit() { const base = sfxInit; sfxInit = function () { base(); sndLoad(); }; })();
// toca um som do mundo: volume e agudos pela distância, chega atrasado (velocidade do som), vem do lado certo e com eco do lugar
function sndPlay(name, x, z, vol, opt) {
  const b = SND.buf[name]; if (!AC || !b || vol < 0.008) return false; opt = opt || {};
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter(); s.buffer = b; s.playbackRate.value = opt.rate || 1;
  const dx = x - camera.position.x, dz = z - camera.position.z, d = Math.hypot(dx, dz) || 1;
  f.type = 'lowpass'; f.frequency.value = opt.lp || Math.max(900, 16000 / (1 + d / 60)); f.Q.value = 0.5;
  g.gain.value = Math.min(1.6, vol * SET.vol);
  let node = s.connect(f).connect(g);
  if (AC.createStereoPanner && d > 1.5) { const yaw = camera.rotation.y, rx = Math.cos(yaw), rz = -Math.sin(yaw), p = AC.createStereoPanner(); p.pan.value = Math.max(-0.85, Math.min(0.85, (dx * rx + dz * rz) / d)); node = node.connect(p); }
  const out = AUD.master || AC.destination; node.connect(out);
  if (opt.wet && AUD[opt.room || 'out']) { const w = AC.createGain(); w.gain.value = opt.wet; node.connect(w).connect(AUD[opt.room || 'out']); }
  s.start(AC.currentTime + (opt.delay || 0)); return true;
}
// cápsulas caindo no chão depois do tiro (só as suas, para não poluir)
function casingSound(sg) {
  if (!AC) return; const t0 = AC.currentTime + 0.32 + Math.random() * 0.12, out = AUD.master || AC.destination;
  for (let i = 0; i < (sg ? 2 : 3); i++) {
    const o = AC.createOscillator(), g = AC.createGain(), t = t0 + i * (0.07 + Math.random() * 0.06);
    o.type = sg ? 'triangle' : 'sine'; o.frequency.setValueAtTime(sg ? 700 + Math.random() * 200 : 3800 + Math.random() * 1800, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * SET.vol / (i + 1), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + (sg ? 0.08 : 0.05));
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.1);
  }
}
const inside = (x, z, y) => { const b = bldAt(x, z); return !!b && y < b.top + 0.5; };
// tiro: gravação de verdade de cada arma; de longe usa a gravação distante, abafada e atrasada; com silenciador vira um "tuf"
let _casN = 0;
(function hookShot() {
  const base = shotSound;
  shotSound = function (a, d, quiet) {
    if (!AC || G.phase !== 'match' || !SND.ready) return base(a, d, quiet);
    const now = performance.now(); if (now - shotT < 12 && a !== G.player) return; shotT = now;
    const me = a === G.player, dist = me ? 0 : Math.hypot(a.x - camera.position.x, a.z - camera.position.z), k = sndKey(d);
    const far = dist > 55, name = far ? k + '_far' : k + (Math.random() < 0.5 ? 1 : 2);
    const room = inside(a.x, a.z, a.y) || inside(camera.position.x, camera.position.z, camera.position.y) && dist < 30 ? 'in' : 'out';
    let v = (far ? 1.7 : 1) / (1 + dist / 45) * (me ? (G.view.fpp ? 1 : 0.9) : 0.95), lp = far ? Math.max(650, 12000 / (1 + (dist - 55) / 80)) : 18000, wet = room === 'in' ? 0.42 : 0.16 + Math.min(0.5, dist / 450);
    if (quiet) { v *= 0.32; lp = 1100; wet *= 0.4; }
    const rate = (/AWM/.test(d.n) ? 0.9 : 1) * (0.97 + Math.random() * 0.06), delay = me ? 0 : Math.min(1.5, dist / 343);
    if (!sndPlay(name, a.x, a.z, v * 0.9, { rate, lp, wet, room, delay })) return base(a, d, quiet);
    if (quiet && dist < 60) setTimeout(() => noise(0.06, 0.12 / (1 + dist / 15), 2600, 1.2, 'bandpass'), delay * 1000); /* o "pfft" do silenciador */
    if (dist > 220 && !quiet) setTimeout(() => noise(0.6, v * 0.35, 220, 0.6), delay * 1000 + 30); /* estrondo grave de muito longe */
    if (me && (!d.auto || ++_casN % 3 === 0)) casingSound(d.cls === 'sg');
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
