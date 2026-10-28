// ================= hora do dia e condições do mar =================
// 1 hora de jogo = HOUR_S segundos reais; o sol nasce às 6h e se põe às 18h.
const HOUR_S = 50;
const DAY = { sun: 1, amb: 1, dusk: 0, moon: 0, el: 1 };
const COND = { vis: 1, swell: 1, cur: 1, cloud: 0 };
const HAZE_D = new THREE.Color(0.70, 0.80, 0.88), HAZE_DUSK = new THREE.Color(0.88, 0.6, 0.42), HAZE_N = new THREE.Color(0.03, 0.045, 0.08), HAZE_C = new THREE.Color(0.6, 0.63, 0.66);
const SUN_COL = new THREE.Color(1, 0.945, 0.85), DUSK_COL = new THREE.Color(1, 0.62, 0.38), MOON_COL = new THREE.Color(0.55, 0.65, 0.95);
const hhmm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor(h % 1 * 60)).padStart(2, '0')}`;

// condições sorteadas pelo número do dia: visibilidade, ondulação, correnteza e nuvens
function rollCond() {
  const r = mulberry((SV.day || 1) * 7919 + 13);
  COND.vis = lerp(0.6, 1.6, r()); COND.swell = lerp(0.55, 1.7, Math.pow(r(), 1.3)); COND.cur = lerp(0.6, 1.5, r());
  COND.cloud = r() < 0.28 ? lerp(0.55, 1, r()) : r() * 0.3;
  SWELL.k = COND.swell; CU.uSwell.value = COND.swell; CU.uCloud.value = COND.cloud;
  rollFront();
}
const visM = () => Math.round(0.83 / (0.042 / COND.vis));
const condTxt = () => `Visibilidade ~${visM()} m · ondas ${(0.55 * COND.swell).toFixed(1).replace('.', ',')} m · correnteza ${COND.cur < 0.85 ? 'fraca' : COND.cur < 1.2 ? 'moderada' : 'forte'} · ${COND.cloud > 0.5 ? 'nublado' : COND.cloud > 0.2 ? 'poucas nuvens' : 'céu limpo'}`;

function updateClock(dt) {
  if (SV.tod == null) { SV.tod = 7; SV.day = SV.day || 1; }
  if (!DAY.ready) { rollCond(); DAY.ready = true; }
  SV.tod += dt / HOUR_S;
  if (SV.tod >= 24) newDay(SV.tod - 24);
  if (dt > 0 && Math.floor(SV.tod - dt / HOUR_S) !== Math.floor(SV.tod)) {
    const h = Math.floor(SV.tod);
    if (h === 17) toast('O sol está baixando. Fim de tarde: robalo e caranha mais ativos.', 4);
    if (h === 19) toast(SV.light ? 'Anoiteceu. A lanterna acende sozinha embaixo d\'água.' : 'Anoiteceu. Sem lanterna, o fundo fica escuro: compre uma na loja.', 4, SV.light ? '' : 'bad');
    if (h === 6) toast('Amanhecendo. Garoupas saindo da toca.', 4);
  }
  applyDay();
}
function newDay(tod) {
  SV.day = (SV.day || 1) + 1; SV.tod = tod; rollCond(); save();
  toast(`Dia ${SV.day}. Boletim do mar: ${condTxt()}`, 6);
}
// espera na marina/barco: pula horas (e talvez para o dia seguinte)
function waitHours(h) { SV.tod += h; if (SV.tod >= 24) newDay(SV.tod - 24); applyDay(); save(); }
function waitUntil(hour) { waitHours((hour - SV.tod + 24) % 24 || 24); }

function applyDay() {
  const a = (SV.tod - 6) / 12 * Math.PI, el = Math.sin(a);
  SUN_DIR.set(Math.cos(a) * 0.85, el, -0.45).normalize();
  const day = smooth(-0.15, 0.3, el);
  DAY.el = el;
  DAY.sun = smooth(-0.05, 0.25, el) * (1 - COND.cloud * 0.5);
  DAY.dusk = smooth(0.4, 0.06, el) * smooth(-0.16, 0.02, el);
  DAY.moon = 1 - smooth(-0.12, 0.05, el);
  DAY.amb = (0.07 + 0.93 * day) * (1 - COND.cloud * 0.3);
  HAZE.copy(HAZE_N).lerp(HAZE_D, day).lerp(HAZE_DUSK, DAY.dusk * 0.7).lerp(HAZE_C.clone().multiplyScalar(0.1 + 0.9 * day), COND.cloud * 0.55);
  CU.uDay.value = DAY.amb; CU.uDusk.value = DAY.dusk;
  // de noite a luz direcional vira luar, vinda do lado oposto
  if (el > -0.02) { sun.position.copy(SUN_DIR).multiplyScalar(100); sun.color.copy(SUN_COL).lerp(DUSK_COL, DAY.dusk); }
  else { sun.position.set(-SUN_DIR.x, 0.6, SUN_DIR.z).multiplyScalar(100); sun.color.copy(MOON_COL); }
}

// atividade dos peixes ao longo do dia: noturnos rendem no fim da tarde e à noite
const NOCT = { robalo: 1, caranha: 1, dentao: 1, cherne: 1, bicuda: 1 };
function fishAct(key) { const k = smooth(-0.1, 0.35, DAY.el); return NOCT[key] ? 1.25 - 0.45 * k + 0.3 * DAY.dusk : 0.45 + 0.55 * k; }

// aba "Boletim do mar" na loja/marina
function bulletinHTML() {
  return eventsHTML() + `<div class="it" style="margin-bottom:8px"><div><div class="n">Dia ${SV.day || 1} · ${hhmm(SV.tod || 7)}</div><div class="d">${condTxt()}</div></div></div>
    <div class="list">
    <div class="it"><div><div class="n">Visibilidade</div><div class="d">${COND.vis > 1.25 ? 'Água azul: dia de procurar peixe longe, no Parcel de Fora ou em Castelhanos.' : COND.vis < 0.8 ? 'Água turva: fique nos pontos rasos e abrigados, e leve lanterna.' : 'Água normal na baía.'}</div></div></div>
    <div class="it"><div><div class="n">Mar</div><div class="d">${COND.swell > 1.25 ? 'Ondulação grande: o lado de fora da Ilha Grande fica perigoso. Prefira a baía.' : 'Mar tranquilo para atravessar.'}</div></div></div>
    <div class="it"><div><div class="n">Esperar</div><div class="d">O peixe muda com a hora: de manhã a garoupa sai da toca, no fim da tarde o robalo caça.</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn" data-wait="3">+3 h</button><button class="btn" data-until="17">ATÉ 17h</button><button class="btn gold" data-until="6">DORMIR ATÉ 6h</button></div></div>
    </div>`;
}
