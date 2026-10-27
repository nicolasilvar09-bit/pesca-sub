// ================= som ambiente: estalos do fundo, snorkel, gaivotas e trilha =================
const SND = { crT: 0, brT: 2, gullT: 18, chordT: 0, chord: 0, arpT: 0 };
// trilha: acordes suaves (Am7, Dm7, G7, Cmaj7) com um dedilhado por cima
const CHORDS = [[220, 261.6, 329.6, 392], [146.8, 174.6, 220, 261.6], [196, 246.9, 293.7, 349.2], [130.8, 164.8, 196, 246.9]];
function pad(freqs, dur) {
  const c = AU.ctx; if (!c || !AU.musG) return; const t = c.currentTime;
  for (const f of freqs) for (const det of [-4, 4]) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.4);
    o.connect(g).connect(AU.musG); o.start(t); o.stop(t + dur + 1.5);
  }
}
function pluck(f) {
  const c = AU.ctx; if (!c || !AU.musG) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  o.connect(g).connect(AU.musG); o.start(t); o.stop(t + 1.2);
}
function gull() { const d = rand(0, 0.3); AU.tone(1700, 2300, 0.12, 0.035, 'triangle', d); AU.tone(2300, 1500, 0.22, 0.035, 'triangle', d + 0.12); AU.tone(1800, 2200, 0.1, 0.025, 'triangle', d + 0.45); }
function updateSound(dt) {
  const c = AU.ctx; if (!c || c.state !== 'running') return;
  if (!AU.musG) { AU.musG = c.createGain(); AU.musG.gain.value = 0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; AU.musG.connect(lp).connect(AU.master); }
  const under = camUnder, swim = P.mode === 'swim';
  // trilha: no barco, nos menus e na superfície; some embaixo d'água
  AU.musG.gain.setTargetAtTime(OPT.mus && !under ? (paused || !started ? 0.5 : 0.32) : 0, c.currentTime, 0.8);
  if (OPT.mus && !under) {
    if ((SND.chordT -= dt) <= 0) { SND.chordT = 4; SND.chord = (SND.chord + 1) % 4; pad(CHORDS[SND.chord], 4); }
    if ((SND.arpT -= dt) <= 0) { SND.arpT = pick([0.5, 0.5, 1, 0.25]); if (Math.random() < 0.7) pluck(pick(CHORDS[SND.chord]) * 2); }
  }
  if (paused) return;
  // estalos de camarão-pistola: o "chiado" típico do fundo de costão
  if (under) { SND.crT -= dt; let n = 0; while (SND.crT < 0 && n++ < 6) { SND.crT += rand(0.02, 0.09); AU.burst(0.006, rand(3500, 7500), 'highpass', rand(0.015, 0.05) * (1 - camMurk * 0.5)); } }
  // respiração no snorkel na superfície
  if (swim && !P.under) { if ((SND.brT -= dt) <= 0) { SND.brT = P.surfT < 10 ? rand(2.2, 2.8) : rand(3.6, 4.6); AU.burst(0.8, 650, 'bandpass', 0.16); setTimeout(() => AU.burst(1.0, 420, 'bandpass', 0.12), 1000); } }
  else SND.brT = 1.5;
  // gaivotas de dia, fora d'água
  if (!under && DAY.amb > 0.5 && (SND.gullT -= dt) <= 0) { SND.gullT = rand(20, 45); gull(); }
}
