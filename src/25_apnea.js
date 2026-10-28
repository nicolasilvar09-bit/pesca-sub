// ================= apneia mais real: coração e consumo, contrações, visão de túnel, apagão na subida, samba e intervalo de superfície =================
const APN = { contrT: 6, wasUnder: false, sambaT: 0, tipC: false, tipA: false, tipF: false };

// consumo de ar: coração acelerado gasta mais; parado no fundo (reflexo de mergulho) gasta menos;
// nos últimos metros da subida, com pouco ar, a pressão cai e o oxigênio "some" mais rápido (apagão de águas rasas)
function apneaDrain(depth) {
  let k = (0.86 + 0.28 * clamp((P.bpm - 52) / 45, 0, 1)) * (P.still > 2 ? 0.9 : 1);
  if (P.o2 < 0.16 && depth < 6 && P.vel.y > 0.25) {
    k *= 2.2;
    if (!APN.tipA) { APN.tipA = true; toast('Os últimos metros da subida são os mais perigosos: é onde acontece o apagão. Suba antes!', 4.5, 'bad'); }
  }
  return k;
}
// teto do fôlego na superfície: cansaço acumulado de mergulhos sem descanso
const o2Cap = () => 1 - (P.fatigue || 0);

function updateApneaReal(dt) {
  const swim = P.mode === 'swim';
  if (!swim) { APN.wasUnder = false; P.fatigue = Math.max(0, (P.fatigue || 0) - dt * 0.004); return; }
  // começo de mergulho: intervalo de superfície curto demais acumula cansaço
  if (P.under && !APN.wasUnder) {
    const need = (P.lastDiveT || 0) * 1.5;
    if (P.lastDiveT > 20 && P.surfT < need) {
      P.fatigue = Math.min(0.4, (P.fatigue || 0) + 0.06 + 0.1 * (1 - P.surfT / need));
      if (!APN.tipF) { APN.tipF = true; toast(`Desceu cedo: o intervalo de superfície ideal é o dobro do tempo do mergulho (${Math.round((P.lastDiveT || 0) * 2)} s). Seu fôlego máximo caiu um pouco.`, 5, 'bad'); }
    }
  }
  // chegada na superfície quase sem ar: samba (perde o controle do corpo alguns segundos)
  if (!P.under && APN.wasUnder && P.o2 < 0.08 && !P.blackT) {
    APN.sambaT = 4.5; FX.shake = 1.4; buzz([60, 40, 60, 40, 60, 40, 60]);
    toast('SAMBA! O corpo tremeu e perdeu o controle. Respiração de recuperação: inspire fundo e segure um pouco. Foi por pouco!', 6, 'bad');
  }
  APN.wasUnder = P.under;
  if (!P.under) P.fatigue = Math.max(0, (P.fatigue || 0) - dt * (P.surfT > 30 ? 0.006 : 0.002));
  if (APN.sambaT > 0) { APN.sambaT -= dt; P.o2 = Math.min(P.o2, 0.35); }
  // contrações do diafragma no fim do fôlego: trancos cada vez mais seguidos
  if (P.under && P.o2 < 0.38) {
    APN.contrT -= dt;
    if (APN.contrT <= 0) {
      APN.contrT = lerp(2.2, 7, clamp((P.o2 - 0.05) / 0.33, 0, 1)) * rand(0.8, 1.2);
      P.pitch += 0.035; FX.shake = Math.max(FX.shake || 0, 0.35); AU.tone(95, 55, 0.16, 0.22); buzz(35);
      if (!APN.tipC) { APN.tipC = true; toast('Contrações do diafragma: o corpo está pedindo ar. Hora de pensar em subir.', 4); }
    }
  } else APN.contrT = 6;
}
// durante a samba os comandos quase não respondem e a cabeça treme
function sambaInput() { if (APN.sambaT > 0) { IN.jx *= 0.1; IN.jy *= 0.1; IN.lookX += Math.sin(T * 23) * 3; IN.lookY += Math.cos(T * 19) * 2; IN.pressed.dive = false; } }
// visão de túnel: as bordas fecham com o oxigênio acabando (usa a mesma vinheta da profundidade)
function tunnelLook() {
  if (!vigEl) return;
  const k = P.mode === 'swim' ? (1 - smooth(0.06, 0.3, P.o2)) : 0, s = APN.sambaT > 0 ? 0.6 : 0, m = Math.max(k, s);
  const inner = Math.round(45 - 33 * m);
  vigEl.style.background = `radial-gradient(ellipse at 50% ${35 + 10 * m}%,rgba(0,0,0,0) ${inner}%,rgba(0,${Math.round(8 * (1 - m))},${Math.round(14 * (1 - m))},${(0.85 + 0.15 * m).toFixed(2)}) 100%)`;
  if (m > 0) vigEl.style.opacity = Math.max(+vigEl.style.opacity || 0, 0.35 + 0.6 * m).toFixed(2);
}
