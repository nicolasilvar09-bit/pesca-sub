'use strict';
// ================= utilidades =================
const TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function mulberry(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const NP = new Uint8Array(512);
(function () { const r = mulberry(1337); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) NP[i] = p[i & 255]; })();
function hash2(x, z) { return NP[(NP[x & 255] + (z & 255)) & 511] / 255; }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v) * 2 - 1;
}
function fbm(x, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
const fmtKg = k => k.toFixed(1).replace('.', ',');
const fmtR = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

// ================= ondas (mesma fórmula no JS e no shader) =================
const WAVES = [ // dirX, dirZ, k, amplitude
  [0.83, 0.56, 0.19, 0.28], [-0.45, 0.89, 0.33, 0.15], [0.97, -0.24, 0.55, 0.07], [0.2, 0.98, 0.95, 0.035]];
WAVES.forEach(w => w.push(Math.sqrt(9.8 * w[2])));
function waveH(x, z, t) { let h = 0; for (const w of WAVES) h += w[3] * Math.sin((x * w[0] + z * w[1]) * w[2] - t * w[4]); return h; }
const _f = n => n.toFixed(5);
const WAVE_GLSL = `
float waveH(vec2 p,float t){float h=0.0;${WAVES.map(w => `h+=${_f(w[3])}*sin(dot(p,vec2(${_f(w[0])},${_f(w[1])}))*${_f(w[2])}-t*${_f(w[4])});`).join('')}return h;}
vec2 waveG(vec2 p,float t){vec2 g=vec2(0.0);${WAVES.map(w => `g+=${_f(w[3] * w[2])}*cos(dot(p,vec2(${_f(w[0])},${_f(w[1])}))*${_f(w[2])}-t*${_f(w[4])})*vec2(${_f(w[0])},${_f(w[1])});`).join('')}return g;}
`;

// ================= áudio procedural =================
const AU = {
  ctx: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = last * 0.6 + w * 0.4; d[i] = last * 1.6; }
    this.noiseBuf = b;
    const n = c.createBufferSource(); n.buffer = b; n.loop = true;
    this.ambF = c.createBiquadFilter(); this.ambF.type = 'lowpass'; this.ambF.frequency.value = 1200;
    this.ambG = c.createGain(); this.ambG.gain.value = 0.06;
    n.connect(this.ambF).connect(this.ambG).connect(this.master); n.start();
    this.eng = c.createOscillator(); this.eng.type = 'sawtooth'; this.eng.frequency.value = 40;
    this.eng2 = c.createOscillator(); this.eng2.type = 'square'; this.eng2.frequency.value = 20;
    this.engF = c.createBiquadFilter(); this.engF.type = 'lowpass'; this.engF.frequency.value = 280;
    this.engG = c.createGain(); this.engG.gain.value = 0;
    const g2 = c.createGain(); g2.gain.value = 0.4; this.eng2.connect(g2).connect(this.engF);
    this.eng.connect(this.engF).connect(this.engG).connect(this.master); this.eng.start(); this.eng2.start();
  },
  setEnv(under) { if (!this.ctx) return; const t = this.ctx.currentTime; this.ambF.frequency.setTargetAtTime(under ? 320 : 1300, t, 0.15); this.ambG.gain.setTargetAtTime(under ? 0.32 : 0.06, t, 0.25); },
  setEngine(th, on, under) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.engG.gain.setTargetAtTime(on ? (0.04 + 0.09 * th) * (under ? 0.35 : 1) : 0, t, 0.2);
    this.eng.frequency.setTargetAtTime(38 + th * 85, t, 0.25); this.eng2.frequency.setTargetAtTime(19 + th * 42, t, 0.25);
    this.engF.frequency.setTargetAtTime(under ? 180 : 260 + th * 500, t, 0.2);
  },
  burst(dur, freq, type, gain) {
    const c = this.ctx; if (!c) return; const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = c.createGain(); const t = c.currentTime;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  tone(f0, f1, dur, gain, type = 'sine', delay = 0) {
    const c = this.ctx; if (!c) return; const o = c.createOscillator(); o.type = type; const g = c.createGain(); const t = c.currentTime + delay;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  shot() { this.burst(0.18, 700, 'bandpass', 0.7); this.tone(160, 45, 0.3, 0.5); },
  tink() { this.tone(2600, 2000, 0.15, 0.18, 'triangle'); this.tone(3400, 2900, 0.1, 0.08, 'triangle', 0.02); },
  thud() { this.tone(120, 60, 0.18, 0.4); this.burst(0.1, 400, 'lowpass', 0.3); },
  bubbles(n = 6) { for (let i = 0; i < n; i++) this.tone(rand(350, 800), rand(900, 1700), 0.06, 0.05, 'sine', i * rand(0.02, 0.07)); },
  splash() { this.burst(0.6, 1200, 'highpass', 0.4); this.burst(0.4, 300, 'lowpass', 0.3); },
  beat() { this.tone(75, 40, 0.13, 0.55); this.tone(65, 35, 0.11, 0.38, 'sine', 0.2); },
  click() { this.tone(900, 650, 0.05, 0.08, 'square'); },
  stretch() { this.tone(110, 210, 0.35, 0.12, 'sawtooth'); },
  reel() { this.tone(1800, 1600, 0.03, 0.03, 'square'); },
  coin() { this.tone(880, 1320, 0.1, 0.12, 'triangle'); this.tone(1320, 1760, 0.14, 0.1, 'triangle', 0.09); },
  breath() { this.burst(0.5, 600, 'bandpass', 0.35); this.burst(0.8, 900, 'bandpass', 0.22); },
  bad() { this.tone(300, 120, 0.4, 0.2, 'sawtooth'); },
};

// ================= entrada =================
const IN = { jx: 0, jy: 0, lookX: 0, lookY: 0, held: {}, pressed: {}, keys: {} };
const took = n => { const v = IN.pressed[n]; IN.pressed[n] = false; return !!v; };
