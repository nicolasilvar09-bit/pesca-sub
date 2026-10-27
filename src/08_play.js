// ================= jogabilidade: missões do dia, peixes raros, retorno do tiro e briga =================

// ---------- missões do dia (3 por dia, sorteadas pela data) ----------
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const MISSION_POOL = [
  r => { const k = r.pick(['sargo', 'marimba', 'salema', 'garoupa', 'robalo', 'xareu', 'pampo', 'badejo', 'caranha']), n = SPECIES[k].school ? 3 : 1; return { t: `Pegue ${n} ${SPECIES[k].name} dentro da medida`, ev: 'catch', key: k, goal: n, rew: 200 + n * 90 }; },
  r => { const kg = r.pick([3, 5, 8]); return { t: `Pegue um peixe de ${kg} kg ou mais`, ev: 'catchkg', kg, goal: 1, rew: kg * 90 }; },
  r => { const d = r.pick([10, 14, 18]); return { t: `Mergulhe até ${d} m de profundidade`, ev: 'depth', d, goal: 1, rew: d * 25 }; },
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
  SV.daily = { day, list: idx.slice(0, 3).map(i => Object.assign(MISSION_POOL[i](r), { prog: 0, done: false })) };
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
    if (m.prog >= m.goal) { m.done = true; SV.money += m.rew; toast(`Missão cumprida: ${m.t}! +${fmtR(m.rew)}`, 4, 'gold'); AU.coin(); buzz([40, 60, 40]); }
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
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
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
