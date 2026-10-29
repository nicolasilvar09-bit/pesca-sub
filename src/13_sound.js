// ================= som ambiente: estalos do fundo, snorkel, gaivotas e trilha =================
const SND = { crT: 0, brT: 2, gullT: 18 };
function gull() { const d = rand(0, 0.3); AU.tone(1700, 2300, 0.12, 0.035, 'triangle', d); AU.tone(2300, 1500, 0.22, 0.035, 'triangle', d + 0.12); AU.tone(1800, 2200, 0.1, 0.025, 'triangle', d + 0.45); }
function updateSound(dt) {
  const c = AU.ctx; if (!c || c.state !== 'running') return;
  const under = camUnder, swim = P.mode === 'swim';
  updateMusic(dt); // trilha por destino, fundo do mar e tensão (37_music)
  if (paused) return;
  // estalos de camarão-pistola: o "chiado" típico do fundo de costão
  if (under) { SND.crT -= dt; let n = 0; while (SND.crT < 0 && n++ < 6) { SND.crT += rand(0.02, 0.09); AU.burst(0.006, rand(3500, 7500), 'highpass', rand(0.015, 0.05) * (1 - camMurk * 0.5)); } }
  // respiração no snorkel na superfície
  if (swim && !P.under) { if ((SND.brT -= dt) <= 0) { SND.brT = P.surfT < 10 ? rand(2.2, 2.8) : rand(3.6, 4.6); AU.burst(0.8, 650, 'bandpass', 0.16); setTimeout(() => AU.burst(1.0, 420, 'bandpass', 0.12), 1000); } }
  else SND.brT = 1.5;
  // gaivotas de dia, fora d'água
  if (!under && DAY.amb > 0.5 && (SND.gullT -= dt) <= 0) { SND.gullT = rand(20, 45); gull(); }
}
