// ================= clima embaixo d'água: raios de sol, escurecimento com a profundidade, partículas na lanterna e sons =================

// ---------- raios de sol: inclinados pela posição do sol (com a refração da água), mais fortes perto da superfície ----------
const _rdv = new V3(), _rnv = new V3(), _rxv = new V3(), _rmx = new THREE.Matrix4();
function updateSunRays(c, t, murk) {
  // direção do raio dentro d'água: Snell (ar → água) deixa o raio mais em pé
  const hz = Math.hypot(SUN_DIR.x, SUN_DIR.z) || 1, sinW = Math.min(0.72, Math.sqrt(Math.max(0, 1 - SUN_DIR.y * SUN_DIR.y)) / 1.33), cosW = Math.sqrt(1 - sinW * sinW);
  _rdv.set(-SUN_DIR.x / hz * sinW, -cosW, -SUN_DIR.z / hz * sinW); // aponta para baixo, afastando do sol
  const depth = Math.max(0, -c.y), near = 1 - smooth(4, 30, depth), clear = (1 - murk) * (1 - COND.cloud * 0.7) * clamp(COND.vis, 0.5, 1.4);
  rays.children.forEach(m => {
    const u = m.userData, x = c.x + u.ox - _rdv.x * depth, z = c.z + u.oz - _rdv.z * depth;
    m.position.set(x, waveH(x, z, t), z);
    // billboard cilíndrico em volta do eixo do raio
    _rnv.subVectors(c, m.position); _rnv.addScaledVector(_rdv, -_rnv.dot(_rdv)).normalize();
    const Y = _t2.copy(_rdv).negate(); _rxv.crossVectors(Y, _rnv).normalize();
    _rmx.makeBasis(_rxv, Y, _rnv); m.quaternion.setFromRotationMatrix(_rmx);
    // tremeluz das ondas: cada feixe acende e apaga devagar
    const fl = 0.5 + 0.5 * Math.sin(t * u.sp + u.ph) * Math.sin(t * u.sp * 0.37 + u.ph * 2.1);
    const dc = Math.hypot(u.ox, u.oz); m.renderOrder = 2; m.material.opacity = smooth(3, 9, dc) * (0.03 + 0.1 * fl) * (0.35 + 0.65 * near) * clear * DAY.sun;
  });
}

// ---------- vinheta da profundidade e partículas acesas pela lanterna ----------
let vigEl = null;
function updateDepthLook(dt) {
  if (!vigEl) { vigEl = document.createElement('div'); vigEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 35%,rgba(0,0,0,0) 45%,rgba(0,8,14,.85) 100%);opacity:0;transition:opacity .4s'; $('mask').before(vigEl); }
  const d = camUnder ? Math.max(0, -camera.position.y) : 0;
  vigEl.style.opacity = camUnder ? (0.12 + 0.55 * smooth(3, 28, d) + 0.25 * (1 - DAY.amb)).toFixed(2) : 0;
  if (camUnder && DLIGHT) {
    // flocos em suspensão brilham no facho da lanterna
    const k = clamp(DLIGHT.intensity / 3.2, 0, 1);
    snow.material.color.setRGB(lerp(0.81, 1, k), lerp(0.9, 0.97, k), lerp(0.88, 0.86, k));
    snow.material.opacity = Math.min(1, snow.material.opacity + 0.35 * k); snow.material.size += 0.02 * k;
  }
}

// ---------- sons ----------
const ATM = { kickPh: 0, boatT: rand(40, 90), lapT: 0, hullT: 2, birdT: 6, nightT: 3, beatT: 0, wasUnder: false };
function soundOn() { const c = AU.ctx; return c && c.state === 'running' && started && !paused; }
// lancha passando ao longe: ronco que cresce, atravessa de um lado para o outro e some (embaixo d'água se ouve mais grave e mais forte)
function distantBoat() {
  const c = AU.ctx, t = c.currentTime, dur = rand(10, 16), under = camUnder;
  const o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
  o.type = 'sawtooth'; o2.type = 'square'; const base = rand(42, 60); o.frequency.value = base; o2.frequency.value = base * 0.5;
  // efeito Doppler: o tom cai quando passa
  o.frequency.setValueAtTime(base * 1.06, t); o.frequency.linearRampToValueAtTime(base * 0.94, t + dur);
  f.type = 'lowpass'; f.frequency.value = under ? 220 : 380;
  const peak = under ? 0.09 : 0.045;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); o2.connect(f); let n = f.connect(g);
  if (p) { const s = Math.random() < 0.5 ? -1 : 1; p.pan.setValueAtTime(-s * 0.9, t); p.pan.linearRampToValueAtTime(s * 0.9, t + dur); n = n.connect(p); }
  n.connect(AU.master); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
}
// pássaros da beira: arara (grito rouco), bem-te-vi (assobio) e, no fim da tarde, cigarras
function araraCall() { const d = rand(0, 0.2); for (let k = 0; k < 2; k++) { AU.tone(rand(700, 900), rand(1100, 1300), 0.18, 0.05, 'sawtooth', d + k * 0.32); AU.burst(0.16, 1500, 'bandpass', 0.05); } }
function whistleBird() { const d = rand(0, 0.2); AU.tone(2400, 2900, 0.12, 0.03, 'sine', d); AU.tone(2900, 2600, 0.1, 0.03, 'sine', d + 0.16); AU.tone(2200, 3100, 0.22, 0.035, 'sine', d + 0.3); }
function cicada() {
  const c = AU.ctx, t = c.currentTime, dur = rand(3, 6), o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = 'square'; o.frequency.value = rand(4200, 5200); lfo.frequency.value = rand(35, 60); lg.gain.value = 0.012;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.014, t + 0.8); g.gain.setValueAtTime(0.014, t + dur - 1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lfo.connect(lg).connect(g.gain); o.connect(g).connect(AU.master); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
}
// noite: sapos e grilos na margem
function frog() { const d = rand(0, 0.3), f = rand(180, 320); for (let k = 0; k < (Math.random() * 3 | 0) + 1; k++) AU.tone(f, f * 0.7, 0.07, 0.05, 'square', d + k * 0.18); }
function cricket() { const f = rand(3800, 4600); for (let k = 0; k < 4; k++) AU.tone(f, f, 0.025, 0.012, 'sine', k * 0.05); }

function updateAtmosSound(dt) {
  if (!soundOn()) return;
  const c = AU.ctx, now = c.currentTime, under = camUnder, swim = P.mode === 'swim', depth = Math.max(0, -camera.position.y);
  // fundo do mar: o chiado fica mais grave e abafado quanto mais fundo
  if ((ATM.ambT = (ATM.ambT || 0) - dt) <= 0) { ATM.ambT = 0.25;
  if (under) { AU.ambF.frequency.setTargetAtTime(lerp(380, 150, smooth(0, 25, depth)), now, 0.4); AU.ambG.gain.setTargetAtTime(lerp(0.3, 0.2, smooth(0, 25, depth)), now, 0.4); }
  // marolinha batendo: na superfície o ruído sobe e desce com as ondas
  else AU.ambG.gain.setTargetAtTime(0.05 + 0.04 * (0.5 + 0.5 * Math.sin(T * 1.3)) * COND.swell, now, 0.3); }
  // nadadeiras: um "vuush" abafado a cada batida de perna
  if (under && swim) {
    const mv = Math.min(1, P.vel.length() / 1.2), ph = Math.floor((P.kick || 0) / Math.PI);
    if (ph !== ATM.kickPh) { ATM.kickPh = ph; if (mv > 0.15) AU.burst(0.28, 380, 'lowpass', 0.07 * mv); }
  }
  // coração: com o corpo parado no fundo dá para ouvir o próprio coração (o alarme de fôlego baixo continua à parte)
  if (under && swim && P.o2 >= 0.32 && depth > 3) {
    if ((ATM.beatT -= dt) <= 0) { ATM.beatT = 60 / P.bpm; const k = 0.18 + 0.25 * smooth(3, 20, depth); AU.tone(70, 40, 0.12, 0.3 * k); AU.tone(62, 35, 0.1, 0.2 * k, 'sine', 0.19); }
  }
  // casco batendo na marola com o barco parado
  if (!under && P.mode === 'boat' && Math.abs(BOAT.speed) < 2 && (ATM.hullT -= dt) <= 0) { ATM.hullT = rand(1.4, 3.2) / COND.swell; AU.burst(0.18, 220, 'lowpass', 0.12 * COND.swell); AU.burst(0.12, 900, 'bandpass', 0.03); }
  // lancha passando ao longe, de dia
  if ((ATM.boatT -= dt) <= 0) { ATM.boatT = rand(70, 160); if (DAY.amb > 0.4) distantBoat(); }
  // sons da margem: na superfície; mais vivos no Amazonas
  if (!under) {
    const night = DAY.amb < 0.3;
    if (!night && (ATM.birdT -= dt) <= 0) { ATM.birdT = AMZ ? rand(5, 12) : rand(14, 30); if (AMZ && Math.random() < 0.45) araraCall(); else whistleBird(); if (AMZ && DAY.dusk > 0.2 && Math.random() < 0.6) cicada(); }
    if (night && (ATM.nightT -= dt) <= 0) { ATM.nightT = AMZ ? rand(0.6, 2) : rand(2, 5); if (AMZ && Math.random() < 0.55) frog(); else cricket(); }
  }
}

function updateAtmos(dt, t) { updateDepthLook(dt); tunnelLook(); updateAtmosSound(dt); }
