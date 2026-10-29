// ================= jogabilidade: missões do dia, peixes raros, retorno do tiro e briga =================

// ---------- missões do dia (3 por dia de jogo) ----------
const today = () => 'dia-' + (SV.day || 1) + (REGION === 'cv' ? '' : '-' + REGION); // missões trocam a cada dia de jogo
const MISSION_POOL = [
  r => { const k = r.pick(NE ? ['guaiuba', 'ariaco', 'cavala', 'saramunete', 'garoupagato', 'pargo', 'cioba', 'xareu', 'sargo', 'badejo'] : AMZ ? ['tucunare', 'pacu', 'tambaqui', 'aruana', 'matrinxa', 'surubim', 'traira', 'jaraqui', 'douradorio', 'cachorra', 'pescada', 'apapa', 'aracu', 'bicudario'] : ['sargo', 'marimba', 'salema', 'garoupa', 'robalo', 'xareu', 'pampo', 'badejo', 'caranha', 'cocoroca', 'cioba', 'olhete', 'cangulo']), n = SPECIES[k].school ? 3 : 1; return { t: `Pegue ${n} ${SPECIES[k].name} dentro da medida`, ev: 'catch', key: k, goal: n, rew: 200 + n * 90 }; },
  r => { const kg = r.pick([3, 5, 8]); return { t: `Pegue um peixe de ${kg} kg ou mais`, ev: 'catchkg', kg, goal: 1, rew: kg * 90 }; },
  r => { const d = r.pick(AMZ ? [6, 10, 14] : [10, 14, 18]); return { t: `Mergulhe até ${d} m de profundidade`, ev: 'depth', d, goal: 1, rew: d * 25 }; },
  () => ({ t: 'Acerte 2 tiros na cabeça', ev: 'head', goal: 2, rew: 400 }),
  () => ({ t: 'Pegue um peixe fazendo espera (parado, sem nadar)', ev: 'wait', goal: 1, rew: 350 }),
  r => { const v = r.pick([400, 700, 1000]); return { t: `Venda ${fmtR(v)} em pescado`, ev: 'sell', goal: v, rew: Math.round(v * 0.3) }; },
  r => { const n = r.pick([5, 8]); return { t: `Pegue ${n} peixes dentro da medida no dia`, ev: 'catch', key: null, goal: n, rew: n * 70 }; },
];
function ensureDaily() {
  const day = today();
  if (SV.daily && SV.daily.day === day) return SV.daily;
  const seed = [...day].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0, m = mulberry(seed);
  const r = { pick: a => a[Math.floor(m() * a.length)] }, idx = [...MISSION_POOL.keys()];
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(m() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  SV.daily = { day, list: idx.slice(0, 3).map(i => { const m = Object.assign(MISSION_POOL[i](r), { prog: 0, done: false }); m.rew = Math.round(m.rew * 0.55 / 10) * 10; return m; }) };
  save(); return SV.daily;
}
function mission(ev, data = {}) {
  const D = ensureDaily(); let changed = false;
  for (const m of D.list) {
    if (m.done || m.ev !== ev) continue;
    let inc = 0;
    if (ev === 'catch') inc = !m.key || m.key === data.key ? 1 : 0;
    else if (ev === 'catchkg') inc = data.kg >= m.kg ? 1 : 0;
    else if (ev === 'depth') inc = data.d >= m.d ? 1 : 0;
    else if (ev === 'sell') inc = data.v;
    else inc = 1;
    if (!inc) continue;
    m.prog = Math.min(m.goal, m.prog + inc); changed = true;
    if (m.prog >= m.goal) { m.done = true; SV.money += m.rew; addXP(m.rew / 4); toast(`Missão cumprida: ${m.t}! +${fmtR(m.rew)}`, 4, 'gold'); AU.coin(); buzz([40, 60, 40]); }
    else if (ev !== 'sell') toast(`Missão: ${m.t} (${m.prog}/${m.goal})`, 2.5);
  }
  if (changed) save();
}
function missionsHTML() {
  const D = ensureDaily();
  return `<div class="it" style="margin-bottom:8px"><div class="d">Três missões novas por dia. A recompensa entra direto no saldo.</div></div><div class="list">` +
    D.list.map(m => `<div class="it"><div style="flex:1"><div class="n">${m.done ? '✓ ' : ''}${m.t}</div><div class="d">${m.ev === 'sell' ? fmtR(m.prog) + ' de ' + fmtR(m.goal) : m.prog + ' de ' + m.goal} · recompensa ${fmtR(m.rew)}</div><div class="bar"><i style="width:${Math.round(m.prog / m.goal * 100)}%"></i></div></div><b style="color:${m.done ? 'var(--acc)' : 'inherit'}">${m.done ? 'FEITA' : ''}</b></div>`).join('') + '</div>';
}

// ---------- peixes raros: aviso ao avistar ----------
let rareT = 0;
function updateRare(dt) {
  if ((rareT -= dt) > 0 || P.mode !== 'swim' || !P.under) return; rareT = 0.5;
  for (const f of FISHES) if (f.sp.rare && f.alive && !f.seen && f.pos.distanceToSquared(P.pos) < 15 * 15) { f.seen = true; toast(`${f.sp.name} à vista! Peixe raro, vale muito.`, 4, 'gold'); buzz(30); }
}
const isTrophy = f => f.len > f.sp.len[1];

// ---------- retorno do tiro: câmera lenta, tremor, marcador na mira, vibração ----------
const FX = { slowT: 0, shake: 0, hitT: 0 };
const buzz = p => { try { if (OPT.vib && navigator.vibrate) navigator.vibrate(p); } catch (e) { } };
function timeScale(dt) { if (FX.slowT > 0) { FX.slowT -= dt; return 0.3; } return 1; }
function hitFX(q) {
  FX.slowT = q === 'head' ? 0.22 : 0.12; FX.shake = q === 'head' ? 1 : 0.6; FX.hitT = 0.35;
  const c = $('cross'); c.classList.remove('hit', 'hHead', 'hTail'); void c.offsetWidth; c.classList.add('hit', q === 'head' ? 'hHead' : q === 'tail' ? 'hTail' : 'hBody');
  buzz(q === 'head' ? [30, 40, 60] : 45);
}
function applyShake(dt) {
  if (FX.hitT > 0 && (FX.hitT -= dt) <= 0) $('cross').classList.remove('hit');
  if (FX.shake <= 0) return;
  FX.shake = Math.max(0, FX.shake - dt * 4);
  camera.rotation.x += (Math.random() - 0.5) * FX.shake * 0.03; camera.rotation.y += (Math.random() - 0.5) * FX.shake * 0.03;
}
// arpão parou sem acertar o peixe que estava na mira
function missed() { if (GUN.aimF) { toast(`Errou! O ${GUN.aimF.sp.name} desviou.`, 2, 'bad'); GUN.aimF = null; } }

// ---------- briga: o peixe alterna arrancadas e descanso ----------
// puxar na arrancada sobe a tensão (risco de rasgar); puxar no descanso recolhe linha e cansa o peixe
function fightStep(f, dt, pulling) {
  f.runT -= dt;
  if (f.runT <= 0) {
    f.run = !f.run; f.runT = f.run ? rand(0.8, 1.8) * (0.7 + 0.3 * f.sp.str) : rand(0.9, 1.6);
    if (f.run) { buzz(60); spawnBubbles(f.pos, 4, 0.15); }
  }
  GUN.tension = clamp((GUN.tension || 0) + (pulling ? (f.run ? 1.5 : -0.4) : -1.2) * dt, 0, 1);
  if (pulling && !f.run) { GUN.lineLen -= dt * 1.1; f.fight -= dt * 0.6; }
}
function fightHUD() {
  const f = GUN.fish;
  $('fTxt').textContent = f.run ? `${f.sp.name} arrancou! Solte a linha` : `${f.sp.name} cansou. PUXE a linha!`;
  $('fight').classList.toggle('run', !!f.run);
  $('fTen').style.width = Math.round((GUN.tension || 0) * 100) + '%';
}

// ---------- mapa maior: combustível, correnteza, navegação direta ----------
const FUEL_RATE = 0.2; // L/s com o acelerador no máximo
const mapU = x => (x - WB.x0) / (WB.x1 - WB.x0) * 100, mapV = z => (z - WB.z0) / (WB.z1 - WB.z0) * 100;
// combustível para cobrir d metros em velocidade máxima, com margem de manobra
const travelFuel = d => d / boatNow().max * FUEL_RATE * 1.15;
let curSpot = null;
const _cur = new V3();
function currentAt(p) {
  for (const s of SPOTS) {
    if (!s.cur) continue;
    const d = Math.hypot(p.x - s.x, p.z - s.z), k = 1 - smooth(s.r, s.r * 2.6, d);
    if (k <= 0) continue;
    if (curSpot !== s) { curSpot = s; toast(`Correnteza forte em ${s.name}! Nade contra ela ou ela leva você.`, 4, 'bad'); }
    return _cur.set(s.cur[0] * k * COND.cur, 0, s.cur[1] * k * COND.cur);
  }
  curSpot = null; return null;
}
// leva o barco direto ao ponto, gastando o combustível do trajeto
function goTo(id) {
  const s = spotById(id); if (!s || P.mode !== 'boat' || COMP.on) return;
  const d = Math.hypot(s.x - BOAT.pos.x, s.z - BOAT.pos.z), L = travelFuel(d);
  if (SV.fuel < L) { toast(`Combustível insuficiente: precisa de ${Math.ceil(L)} L.`, 3, 'bad'); return; }
  let bx = s.x, bz = s.z;
  if (s.type !== 'marina') for (let k = 0; k < 24; k++) { const a = k / 24 * TAU + 0.3, x = s.x + Math.cos(a) * 22, z = s.z + Math.sin(a) * 22; if (H(x, z) < -4 && H(x + Math.cos(a) * 6, z + Math.sin(a) * 6) < -3) { bx = x; bz = z; break; } }
  else { bx = PIER.x + 14; bz = PIER.z1 - 6; }
  SV.fuel -= L; SV.dest = id;
  BOAT.pos.set(bx, 0, bz); BOAT.speed = 0; if (BOAT.vel) BOAT.vel.set(0, 0, 0); BOAT.anchored = false; BOAT.heading = Math.atan2(s.x - bx, s.z - bz);
  AU.click(); closePanels(); toast(`Chegou em ${s.name}. Gastou ${Math.ceil(L)} L.`, 3); save();
}
