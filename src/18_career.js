// ================= carreira (nível, XP, conquistas), tutorial guiado e qualidade automática =================

// ---------- carreira ----------
const RANKS = ['Iniciante', 'Aprendiz de costão', 'Pescador de toca', 'Caçador de laje', 'Apneísta', 'Arpoador experiente', 'Mestre da espera', 'Caçador de azul', 'Lenda do parcel', 'Lenda da Costa Verde'];
const xpFor = l => Math.round(250 * Math.pow(l, 1.55)); // XP total para chegar ao nível l+1
const level = () => { let l = 1; while (l < 30 && (SV.xp || 0) >= xpFor(l)) l++; return l; };
const rankName = l => RANKS[Math.min(RANKS.length - 1, Math.floor((l - 1) / 3))];
function addXP(n, why) {
  if (!n || n < 1) return;
  const l0 = level(); SV.xp = (SV.xp || 0) + Math.round(n); const l1 = level();
  if (l1 > l0) {
    const prize = 250 * l1; SV.money += prize; AU.coin(); buzz([40, 60, 40, 60, 80]);
    toast(`NÍVEL ${l1}! ${rankName(l1)} · prêmio ${fmtR(prize)}`, 5, 'gold');
  }
  careerHUD();
}
function careerHUD() {
  const l = level(), a = l > 1 ? xpFor(l - 1) : 0, b = xpFor(l), k = clamp(((SV.xp || 0) - a) / (b - a), 0, 1);
  $('hLvl').textContent = 'Nv ' + l; $('lvFill').style.width = Math.round(k * 100) + '%';
}

// ---------- conquistas ----------
const ACH = [
  { id: 'first', n: 'Primeiro peixe', d: 'Pegue o primeiro peixe dentro da medida.', r: 200, t: () => Object.keys(SV.best || {}).length > 0 },
  { id: 'kg5', n: 'Peixe de respeito', d: 'Pegue um peixe de 5 kg ou mais.', r: 500, t: () => Object.values(SV.best || {}).some(k => k >= 5) },
  { id: 'kg15', n: 'Monstro do costão', d: 'Pegue um peixe de 15 kg ou mais.', r: 1500, t: () => Object.values(SV.best || {}).some(k => k >= 15) },
  { id: 'sp8', n: 'Variedade', d: 'Pegue 8 espécies diferentes.', r: 800, t: () => Object.keys(SV.best || {}).length >= 8 },
  { id: 'rare', n: 'Peixe raro', d: 'Pegue um dentão ou um cherne.', r: 700, t: () => !!((SV.best || {}).dentao || (SV.best || {}).cherne) },
  { id: 'd15', n: 'Abaixo dos 15', d: 'Mergulhe a 15 m.', r: 400, t: () => (SV.maxDepth || 0) >= 15 },
  { id: 'd25', n: 'Fundo de verdade', d: 'Mergulhe a 25 m.', r: 1200, t: () => (SV.maxDepth || 0) >= 25 },
  { id: 'b90', n: 'Pulmão de aço', d: 'Fique 90 s embaixo d\'água num mergulho.', r: 900, t: () => (SV.maxDive || 0) >= 90 },
  { id: 'ph5', n: 'Fotógrafo', d: 'Fotografe 5 espécies.', r: 500, t: () => Object.keys(SV.photos || {}).length >= 5 },
  { id: 'mero', n: 'Gigante protegido', d: 'Fotografe um mero (sem atirar!).', r: 800, t: () => !!(SV.photos || {}).mero },
  { id: 'guide', n: 'Guia completo', d: 'Registre todas as espécies do guia.', r: 5000, t: () => { const k = [...Object.keys(SP_INFO), 'tartaruga', 'moreia']; return k.every(x => (SV.best || {})[x] || (SV.photos || {})[x]); } },
  { id: 'win', n: 'Campeão', d: 'Vença um campeonato.', r: 1000, t: () => (SV.wins || 0) >= 1 },
  { id: 'boat3', n: 'Frota', d: 'Tenha as três lanchas.', r: 2000, t: () => (SV.boats || []).length >= 3 },
  { id: 'fora', n: 'Mar aberto', d: 'Mergulhe no Parcel de Fora.', r: 600, t: () => !!(SV.visited || {}).fora },
  { id: 'all', n: 'Conhece a baía', d: 'Mergulhe em todos os pontos de pesca.', r: 2500, t: () => SPOTS.filter(s => s.r).every(s => (SV.visited || {})[s.id]) },
  { id: 'night', n: 'Noturno', d: 'Pegue um peixe depois das 19h.', r: 400, t: () => !!SV.nightCatch },
];
let achT = 0;
function checkAch(dt) {
  if ((achT -= dt) > 0) return; achT = 1;
  SV.ach = SV.ach || {};
  // registros usados pelas conquistas
  if (P.mode === 'swim' && P.under) {
    SV.maxDepth = Math.max(SV.maxDepth || 0, -P.pos.y); SV.maxDive = Math.max(SV.maxDive || 0, P.diveT || 0);
    for (const s of SPOTS) if (s.r && Math.hypot(P.pos.x - s.x, P.pos.z - s.z) < s.r * 1.4) { SV.visited = SV.visited || {}; if (!SV.visited[s.id]) { SV.visited[s.id] = 1; save(); } }
  }
  for (const a of ACH) if (!SV.ach[a.id] && a.t()) {
    SV.ach[a.id] = Date.now(); SV.money += a.r; addXP(a.r / 4);
    toast(`🏆 Conquista: ${a.n} · +${fmtR(a.r)}`, 5, 'gold'); AU.coin(); save();
  }
}
function careerHTML() {
  const l = level(), a = l > 1 ? xpFor(l - 1) : 0, b = xpFor(l), done = ACH.filter(x => (SV.ach || {})[x.id]).length;
  return `<div class="it" style="margin-bottom:8px"><div style="flex:1"><div class="n">Nível ${l} · ${rankName(l)}</div><div class="d">${Math.round((SV.xp || 0) - a)} de ${b - a} XP para o nível ${l + 1} (prêmio ${fmtR(250 * (l + 1))}). XP vem de peixe vendido, missões, fotos e conquistas.</div><div class="bar"><i style="width:${Math.round(clamp(((SV.xp || 0) - a) / (b - a), 0, 1) * 100)}%"></i></div></div></div>
    <div class="it" style="margin-bottom:8px"><div class="d">Recordes: ${fmtKg(SV.maxDepth || 0)} m de profundidade · ${Math.floor(SV.maxDive || 0)} s no maior mergulho · ${Object.keys(SV.visited || {}).length} pontos visitados · conquistas ${done}/${ACH.length}</div></div><div class="list">` +
    ACH.map(x => { const ok = (SV.ach || {})[x.id]; return `<div class="it"><div><div class="n" style="${ok ? '' : 'opacity:.6'}">${ok ? '🏆' : '🔒'} ${x.n}</div><div class="d">${x.d}</div></div><b style="color:${ok ? 'var(--acc)' : 'inherit'}">${ok ? 'FEITA' : fmtR(x.r)}</b></div>`; }).join('') + '</div>';
}

// ---------- tutorial guiado (só para quem está começando) ----------
const TUT = [
  { t: 'Siga a seta laranja no topo até o ponto de pesca. Joystick: acelera e vira a lancha.', btn: null, ok: () => { const d = spotById(SV.dest); return d && Math.hypot(BOAT.pos.x - d.x, BOAT.pos.z - d.z) < 70; } },
  { t: 'Chegou! Toque ANCORAR para parar a lancha.', btn: 'bAnchor', ok: () => BOAT.anchored },
  { t: 'Toque PULAR NA ÁGUA.', btn: 'bJump', ok: () => P.mode === 'swim' },
  { t: 'Respire parado uns segundos (o Preparo enche) e toque MERGULHAR.', btn: 'bDive', ok: () => P.under },
  { t: 'Toque ARMAR para esticar o elástico do arbalete.', btn: 'bArm', ok: () => GUN.bands > 0 },
  { t: 'Mire num peixe: a mira fica verde quando ele está ao alcance. Toque ATIRAR.', btn: 'bFire', ok: () => GUN.state !== 'ready' },
  { t: 'Acertou? Segure PUXAR LINHA para trazer o peixe (ou o arpão de volta).', btn: 'bPull', ok: () => P.stringer.length > 0 || (GUN.state === 'ready' && GUN.bands === 0 && P.tutShots > 1) },
  { t: 'Suba (botão SUBIR) e volte ao barco: SUBIR NO BARCO. O peixe vai para a caixa térmica.', btn: 'bUp', ok: () => P.mode === 'boat' && SV.cooler.length > 0 },
  { t: 'Agora venda: na marina ganha o preço cheio. Toque LOJA (ou MARINA) › Vender pescado.', btn: 'bShop', ok: () => SV.soldOnce },
];
// XP inicial para quem já jogava antes da carreira existir (sem pagar prêmios de nível retroativos)
function seedXP() {
  if (SV.xp != null) return;
  const kg = Object.values(SV.best || {}).reduce((a, b) => a + b, 0);
  SV.xp = Math.min(xpFor(8), Math.round(kg * 30 + ((SV.boats || [0]).length - 1) * 400 + ((SV.guns || []).length - 1) * 150 + Math.max(0, SV.money - 300) / 20 + (SV.apnea || 0) * 80));
}
function tutActive() { return SV.tut != null && SV.tut < TUT.length; }
function setupTut() {
  // quem já tem progresso não vê o tutorial
  if (SV.tut == null) SV.tut = (SV.money !== 300 || (SV.guns || []).length > 1 || Object.keys(SV.best || {}).length || (SV.boats || []).length > 1) ? TUT.length : 0;
  $('tutSkip').onclick = () => { SV.tut = TUT.length; save(); tutHUD(); AU.click(); };
  tutHUD();
}
let tutBtn = null;
function tutHUD() {
  const on = started && tutActive(); $('tut').classList.toggle('hide', !on);
  if (tutBtn) { $(tutBtn).classList.remove('pulse'); tutBtn = null; }
  if (!on) return;
  const s = TUT[SV.tut]; $('tutTxt').textContent = s.t; $('tutN').textContent = `${SV.tut + 1}/${TUT.length}`;
  if (s.btn) { tutBtn = s.btn; $(tutBtn).classList.add('pulse'); }
}
function updateTut() {
  if (!tutActive() || !started) return;
  if (GUN.state === 'flying') P.tutShots = (P.tutShots || 0) + (P.tutFly ? 0 : 1), P.tutFly = true; else P.tutFly = false;
  if (TUT[SV.tut].ok()) {
    SV.tut++; AU.coin(); save();
    if (SV.tut >= TUT.length) { SV.money += 300; toast('Tutorial completo! +R$ 300. Agora é com você: missões na LOJA, condições no Boletim do mar.', 6, 'gold'); }
    tutHUD();
  }
}

// ---------- qualidade automática: mede o FPS e baixa a qualidade se o aparelho sofrer ----------
const AQ = { t: 0, n: 0, sum: 0, checks: 0 };
function autoQuality(dtReal) {
  if (OPT.qManual || OPT.q === 0 || AQ.checks >= 2 || !started || paused) return;
  AQ.t += dtReal; AQ.n++; AQ.sum += dtReal;
  if (AQ.t < 12) return;
  const fps = AQ.n / AQ.sum; AQ.t = AQ.n = AQ.sum = 0; AQ.checks++;
  if (fps < 24) { OPT.q--; saveOpt(); applyOpt(); toast(`O aparelho estava pesado (${Math.round(fps)} FPS): qualidade ajustada para ${QF().name}. Dá para mudar em Opções.`, 5); }
  else AQ.checks = 2; // está bom: para de medir
}
