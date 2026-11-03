// ================= sons sintetizados (sem arquivos): tiros por tipo de arma, acerto, recarga, avião =================
let AC = null, NOISE = null;
function sfxInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  NOISE = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate); const d = NOISE.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function tone(f, t, v, type, f2) {
  if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime;
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, n); if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + t);
  g.gain.setValueAtTime(v * SET.vol, n); g.gain.exponentialRampToValueAtTime(0.0001, n + t); o.connect(g).connect(AC.destination); o.start(n); o.stop(n + t + 0.02);
}
function noise(t, v, freq, q, type) {
  if (!AC) return; const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), n = AC.currentTime;
  s.buffer = NOISE; f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 0.7;
  g.gain.setValueAtTime(v * SET.vol, n); g.gain.exponentialRampToValueAtTime(0.0001, n + t); s.connect(f).connect(g).connect(AC.destination); s.start(n); s.stop(n + t + 0.02);
}
let shotN = 0, shotT = 0;
function shotSound(a, d, quiet) {
  if (!AC || G.phase !== 'match') return;
  const p = G.player, dist = Math.hypot(a.x - camera.position.x, a.z - camera.position.z);
  const now = performance.now(); if (now - shotT < 12 && a !== p) return; // não empilha 50 tiros no mesmo instante
  shotT = now;
  const v = (quiet ? 0.25 : 1) / (1 + dist / 35); if (v < 0.015) return;
  const big = d.cls === 'sr' ? 1.4 : d.cls === 'dmr' ? 1.15 : d.cls === 'ar' ? 1 : d.cls === 'smg' ? 0.75 : 0.6;
  const far = dist > 120;
  noise(quiet ? 0.08 : 0.12 + big * 0.12, v * 0.55 * big, quiet ? 1800 : far ? 700 : 2400 + big * 600, 0.8);
  tone(quiet ? 400 : 140 * (1.6 - big * 0.4), 0.09 + big * 0.06, v * 0.35 * big, 'triangle', 50);
}
function sfx(k) {
  if (!AC) return;
  if (k === 'hit') tone(1600, 0.05, 0.15, 'square');
  else if (k === 'killhit') { tone(900, 0.12, 0.2, 'square'); tone(1400, 0.18, 0.15, 'square'); }
  else if (k === 'reload') { noise(0.05, 0.25, 3000, 3, 'bandpass'); setTimeout(() => noise(0.06, 0.3, 2200, 3, 'bandpass'), 380); }
  else if (k === 'pick') tone(700, 0.06, 0.12, 'sine', 1100);
  else if (k === 'chute') noise(0.5, 0.35, 900, 0.5);
  else if (k === 'plane') tone(90, 2.5, 0.2, 'sawtooth', 70);
  else if (k === 'win') [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.4, 0.2, 'triangle'), i * 150));
  else if (k === 'lose') [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.45, 0.18, 'triangle'), i * 180));
}
