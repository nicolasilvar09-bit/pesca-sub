// ================= trilha por destino (só no menu), eco embaixo d'água e ondas =================
// tudo sintetizado na hora (sem arquivos): sequenciador de 16 passos agendado à frente no relógio do áudio
const MUS = { on: false, bus: null, step: 0, next: 0, bar: 0, rev: null, revSend: null, wave: 0, shoreT: 0, last: '' };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// estilos: acordes (MIDI), andamento e quem toca
const STYLES = {
  // Costa Verde: bossa nova (ii-V-I com sétimas)
  cv: { bpm: 118, chords: [[48, 52, 55, 59], [45, 52, 55, 60], [50, 53, 57, 60], [43, 50, 53, 59]], scale: [0, 2, 4, 7, 9], root: 60,
    comp: [0, 3, 6, 10, 12], bass: [[0, 0], [6, 7], [8, 0], [14, 7]], perc: 'shaker' },
  // Nordeste: baião (mixolídio, zabumba e triângulo)
  ne: { bpm: 112, chords: [[43, 47, 50, 53], [41, 45, 48, 53], [48, 52, 55, 58], [43, 47, 50, 53]], scale: [0, 2, 4, 5, 7, 9, 10], root: 67,
    comp: [0, 4, 8, 12], bass: [[0, 0], [3, 0], [8, 7], [12, 0]], perc: 'baiao' },
  // Amazonas: carimbó lento com flauta
  amz: { bpm: 96, chords: [[45, 48, 52, 55], [43, 47, 50, 55], [41, 45, 48, 52], [40, 44, 47, 50]], scale: [0, 3, 5, 7, 10], root: 69,
    comp: [0, 6, 8, 14], bass: [[0, 0], [8, 7], [11, 0]], perc: 'curimbo' },
};
function musInit() {
  const c = AU.ctx; if (!c || MUS.bus) return;
  MUS.bus = c.createGain(); MUS.bus.gain.value = 0;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; MUS.bus.connect(lp).connect(AU.master);
  // eco: resposta ao impulso gerada (ruído decaindo); o mar inteiro passa por ele, mais forte embaixo d'água
  const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  MUS.rev = c.createConvolver(); MUS.rev.buffer = ir; MUS.revSend = c.createGain(); MUS.revSend.gain.value = 0.08;
  AU.master.connect(MUS.revSend).connect(MUS.rev).connect(c.destination);
  const mr = c.createGain(); mr.gain.value = 0.25; MUS.bus.connect(mr).connect(MUS.rev);
  MUS.next = c.currentTime + 0.1; MUS.on = true;
}
// ---------- instrumentos (todos recebem o instante t do relógio do áudio) ----------
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function osc(type, f, t, a, peak, d, dest, det = 0) { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; env(g, t, a, peak, d); o.connect(g).connect(dest); o.start(t); o.stop(t + a + d + 0.05); return o; }
function noiseHit(t, dur, freq, type, peak, dest) { const c = AU.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.noiseBuf; f.type = type; f.frequency.value = freq; env(g, t, 0.003, peak, dur); s.connect(f).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05); }
const INS = {
  pad: (ms, t, dur, k) => { for (const m of ms) for (const det of [-6, 6]) osc('triangle', mtof(m + 12), t, 0.9, 0.022 * k, dur, MUS.bus, det); },
  nylon: (m, t, k) => { osc('triangle', mtof(m), t, 0.004, 0.07 * k, 0.9, MUS.bus); osc('sine', mtof(m) * 2, t, 0.002, 0.025 * k, 0.4, MUS.bus); },
  bass: (m, t, k) => { osc('sine', mtof(m - 12), t, 0.01, 0.16 * k, 0.5, MUS.bus); osc('triangle', mtof(m - 12), t, 0.005, 0.05 * k, 0.25, MUS.bus); },
  shaker: (t, acc) => noiseHit(t, 0.05, 7000, 'highpass', acc ? 0.045 : 0.022, MUS.bus),
  zabumba: (t, k) => { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18); env(g, t, 0.004, 0.22 * k, 0.25); o.connect(g).connect(MUS.bus); o.start(t); o.stop(t + 0.3); },
  triangulo: (t, open) => { osc('sine', 4200, t, 0.002, open ? 0.03 : 0.015, open ? 0.35 : 0.06, MUS.bus); osc('sine', 6100, t, 0.002, open ? 0.012 : 0.006, open ? 0.3 : 0.05, MUS.bus); },
  curimbo: (t, k) => { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.12); env(g, t, 0.004, 0.14 * k, 0.2); o.connect(g).connect(MUS.bus); o.start(t); o.stop(t + 0.25); noiseHit(t, 0.04, 1200, 'bandpass', 0.03 * k, MUS.bus); },
  flute: (m, t, dur) => { const c = AU.ctx, o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(m); v.frequency.value = 5.2; vg.gain.value = mtof(m) * 0.008; v.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.12); g.gain.setValueAtTime(0.05, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(MUS.bus); o.start(t); v.start(t); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05);
    noiseHit(t, 0.12, 2500, 'bandpass', 0.012, MUS.bus); },
};
// ---------- um passo (semicolcheia) do estilo atual ----------
function musStep(S, st, t, night) {
  const s16 = st % 16, ch = S.chords[MUS.bar % S.chords.length], k = night ? 0.6 : 1, sp = 60 / S.bpm / 4;
  if (s16 === 0) INS.pad(ch, t, sp * 15, night ? 1.2 : 0.8);
  if (night) { if (s16 % 4 === 0 && Math.random() < 0.5) INS.nylon(pick(ch) + 12, t, 0.7); if (s16 === 0) INS.bass(ch[0], t, 0.7); return; }
  if (S.comp.includes(s16)) { const n = s16 === 0 ? ch : ch.slice(1); n.forEach((m, j) => INS.nylon(m + 12, t + j * 0.012, 0.55)); }
  for (const [p, iv] of S.bass) if (p === s16) INS.bass(ch[0] + iv, t, k);
  if (S.perc === 'shaker') INS.shaker(t, s16 % 4 === 2);
  if (S.perc === 'baiao') { if (s16 === 0 || s16 === 6 || s16 === 8) INS.zabumba(t, s16 === 8 ? 0.7 : 1); if (s16 % 2 === 0) INS.triangulo(t, s16 % 4 === 2); }
  if (S.perc === 'curimbo') { if (s16 === 0 || s16 === 3 || s16 === 8 || s16 === 11 || s16 === 14) INS.curimbo(t, s16 === 0 ? 1 : 0.6); if (s16 % 4 === 2) INS.shaker(t, false); }
  // melodia: frases curtas na escala do estilo (flauta no rio, violão nos outros)
  if (s16 % 4 === 0 && Math.random() < 0.35) { const m = S.root + pick(S.scale) + (Math.random() < 0.3 ? 12 : 0); if (REGION === 'amz') INS.flute(m, t, sp * rand(3, 7)); else INS.nylon(m + 12, t, 0.6); }
}
// ---------- vinhetas ----------
function musStinger(kind) {
  if (!kind || !MUS.on || !OPT.mus || started) return; // sem vinheta no mar const c = AU.ctx, t = c.currentTime + 0.05;
  const notes = kind === 'record' ? [72, 76, 79, 84, 88] : kind === 'rare' ? [69, 73, 76, 81, 85] : [67, 71, 74, 79];
  notes.forEach((m, i) => { osc('triangle', mtof(m), t + i * 0.09, 0.005, 0.08, 0.7, AU.master); osc('sine', mtof(m) * 2, t + i * 0.09, 0.003, 0.03, 0.5, AU.master); });
}
// ---------- por quadro ----------
function shoreNear() { // costa a menos de ~40 m da câmera: onda quebrando mais alto
  const p = camera.position; let n = 0; for (let a = 0; a < 8; a++) if (H(p.x + Math.cos(a * 0.785) * 40, p.z + Math.sin(a * 0.785) * 40) > -0.8) n++; return n / 8;
}
function updateMusic(dt) {
  const c = AU.ctx; if (!c || c.state !== 'running') return;
  musInit(); if (!MUS.on) return;
  const now = c.currentTime, under = camUnder, night = DAY.amb < 0.35;
  const S = STYLES[REGION] || STYLES.cv;
  // trilha só com menu aberto (tela inicial, loja, pausa); no mar fica só o som ambiente
  const play = OPT.mus && (!started || paused);
  MUS.bus.gain.setTargetAtTime(play ? 0.8 : 0, now, play ? 0.8 : 0.3);
  MUS.revSend.gain.setTargetAtTime(under ? 0.32 : 0.06, now, 0.3);
  // agenda as semicolcheias dos próximos 400 ms
  const sp = 60 / (S.bpm * (night ? 0.8 : 1)) / 4;
  // atrasou (aparelho travou, aba em segundo plano): pula para o tempo certo sem perder o compasso
  if (MUS.next < now) { const miss = Math.ceil((now - MUS.next) / sp); for (let i = 0; i < miss; i++) { MUS.step++; if (MUS.step % 16 === 0) MUS.bar++; } MUS.next += miss * sp; }
  while (MUS.next < now + 0.4) {
    if (play) musStep(S, MUS.step, MUS.next, night);
    MUS.step++; if (MUS.step % 16 === 0) MUS.bar++;
    MUS.next += sp;
  }
  // ondas: o chiado do mar vai e vem com a ondulação; perto da costa, arrebentação
  if (!under && AU.ambG) {
    const sh = (MUS.shoreT -= dt) <= 0 ? (MUS.shoreT = 1, MUS.shore = shoreNear()) : MUS.shore || 0;
    const sw = 0.5 + 0.5 * Math.sin(T * 0.55 + Math.sin(T * 0.13) * 2);
    AU.ambG.gain.setTargetAtTime((0.04 + 0.05 * sw * COND.swell) * (1 + sh * 1.5), now, 0.3);
    if (sh > 0.1 && (MUS.wave -= dt) <= 0) { MUS.wave = rand(5, 9) / COND.swell; AU.burst(2.2, 900, 'lowpass', 0.12 * sh * COND.swell); AU.burst(1.4, 2600, 'highpass', 0.05 * sh); }
  }
}
