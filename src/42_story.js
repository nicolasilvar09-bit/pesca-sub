// ================= modo história: de pescador da vila a campeão mundial =================
// 5 capítulos com objetivos, um treinador que fala com você e um patrocinador com salário.
// contadores do capítulo ficam em SV.story.cnt e zeram a cada capítulo novo.
const COACH = { name: 'Seu Lino', av: '🧔🏽' };
const STORY_SPONSORS = [
  { id: 'netuno', name: 'NETUNO Arbaletes', pay: 900, perk: 'Maior salário: R$ 900 por semana.' },
  { id: 'azul', name: 'AZUL PROFUNDO', pay: 600, perk: 'R$ 600 por semana e +5 s de fôlego (roupa de competição).' },
  { id: 'mare', name: 'MARÉ ALTA Combustíveis', pay: 600, perk: 'R$ 600 por semana e tanque cheio de graça toda manhã.' },
];
const sigFish = () => AMZ ? 'tucunare' : NE ? 'pargo' : 'garoupa'; // peixe símbolo do destino
const STORY = [
  { t: 'Pescador da vila', reward: 500,
    intro: `Então você quer ser pescador sub? Sou o ${COACH.name}, pesco nesse mar há 40 anos. Comece pelo básico: pegue peixe dentro da medida, venda na marina e acostume o corpo com a profundidade.`,
    outro: 'Muito bem! Vendeu o próprio peixe, desceu fundo e respeitou a medida. Tem um campeonato regional chegando: hora de mostrar serviço.',
    obj: [
      { d: 'Pegue 5 peixes dentro da medida', n: 5, k: 'catch' },
      { d: 'Venda seu pescado na marina', n: 1, k: 'sell' },
      { d: 'Mergulhe a 10 m de profundidade', ok: () => (SV.maxDepth || 0) >= 10, p: () => `${Math.floor(SV.maxDepth || 0)}/10 m` },
    ] },
  { t: 'Campeonato regional', reward: 1500,
    intro: 'O regional é aqui mesmo, na aba Campeonato da loja. Mas não chegue cru: conheça os pontos e prove que pega peixe grande.',
    outro: 'CAMPEÃO REGIONAL! A notícia correu na marina. Uns caras de empresa de equipamento ficaram perguntando de você...',
    obj: [
      { d: () => `Pegue ${AMZ ? 'um tucunaré' : NE ? 'um pargo' : 'uma garoupa'} de 3 kg ou mais`, n: 1, k: 'sig' },
      { d: 'Mergulhe em 4 pontos diferentes', ok: () => Object.keys(SV.visited || {}).length >= 4, p: () => `${Object.keys(SV.visited || {}).length}/4` },
      { d: 'Vença um campeonato (1º lugar)', n: 1, k: 'win' },
    ] },
  { t: 'Convite de patrocinador', reward: 2000,
    intro: 'Três empresas querem você. Escolha bem: o patrocinador paga salário toda semana e te dá vantagem. Depois mostre que vale o investimento.',
    outro: 'O patrocinador está feliz e a federação te chamou para a seletiva nacional. Os melhores do país vão estar lá.',
    obj: [
      { d: 'Assine com um patrocinador (aba História)', ok: () => !!SV.story.sp, p: () => SV.story.sp ? 'assinado' : '' },
      { d: 'Pegue um peixe de 8 kg ou mais', n: 1, k: 'kg8' },
      { d: 'Fique 60 s embaixo d\'água num mergulho', ok: () => (SV.maxDive || 0) >= 60, p: () => `${Math.floor(SV.maxDive || 0)}/60 s` },
    ] },
  { t: 'Seletiva nacional', reward: 3000,
    intro: 'Na seletiva não basta pegar peixe: tem que ser constante. Pódio em campeonato, variedade e fundo. Quem passar veste a camisa 10.',
    outro: 'CONVOCADO! Você é da seleção brasileira de pesca sub. A camisa 10 é sua. Agora é o Mundial.',
    obj: [
      { d: 'Fique no pódio (top 3) em 2 campeonatos', n: 2, k: 'podium' },
      { d: 'Pegue 6 espécies diferentes neste capítulo', n: 6, k: 'species' },
      { d: 'Mergulhe a 20 m de profundidade', ok: () => (SV.maxDepth || 0) >= 20, p: () => `${Math.floor(SV.maxDepth || 0)}/20 m` },
    ] },
  { t: 'O Mundial', reward: 20000,
    intro: 'Todo domingo tem Mundial (aba Campeonato). Monte sua seleção, treine nos pontos fundos e traga esse título para o Brasil.',
    outro: 'CAMPEÃO MUNDIAL! Você saiu da vila e chegou ao topo do mundo. O mar continua aí: defenda o título todo domingo.',
    obj: [
      { d: 'Dispute um Mundial', n: 1, k: 'world' },
      { d: 'Fique no pódio do Mundial', n: 1, k: 'worldPod' },
      { d: 'Seja campeão mundial', n: 1, k: 'worldWin' },
    ] },
];
const st = () => (SV.story = SV.story || { ch: 0, cnt: {}, done: {}, seen: -1 });
const objText = o => typeof o.d === 'function' ? o.d() : o.d;
const objOk = (o, s) => o.ok ? o.ok() : (s.cnt[o.k] || 0) >= o.n;
const objProg = (o, s) => o.ok ? (o.p ? o.p() : '') : `${Math.min(o.n, s.cnt[o.k] || 0)}/${o.n}`;

// ---------- eventos que avançam os objetivos ----------
function storyEvent(kind, a) {
  const s = st(); if (s.ch >= STORY.length) return;
  const c = s.cnt, inc = k => c[k] = (c[k] || 0) + 1;
  if (kind === 'catch') { const f = a; if (f.sp.ornamental) return; inc('catch'); if (f.key === sigFish() && f.kg >= 3) inc('sig'); if (f.kg >= 8) inc('kg8'); c.sp = c.sp || {}; if (!c.sp[f.key]) { c.sp[f.key] = 1; inc('species'); } }
  if (kind === 'sell') inc('sell');
  if (kind === 'comp') { if (a === 0) inc('win'); if (a < 3) inc('podium'); }
  if (kind === 'world') { inc('world'); if (a < 3) inc('worldPod'); if (a === 0) inc('worldWin'); }
  storyCheck();
}
let storyT = 0;
function storyCheck() {
  const s = st(); if (s.ch >= STORY.length) return;
  const C = STORY[s.ch];
  for (let i = 0; i < C.obj.length; i++) { const k = s.ch + '_' + i; if (!s.done[k] && objOk(C.obj[i], s)) { s.done[k] = 1; toast(`📖 Objetivo cumprido: ${objText(C.obj[i])}`, 4, 'gold'); AU.coin(); } }
  if (C.obj.every((o, i) => s.done[s.ch + '_' + i])) {
    SV.money += C.reward; addXP(C.reward / 3); s.ch++; s.cnt = {}; save();
    storyCard(`Capítulo ${s.ch} concluído: ${C.t}`, C.outro, `Prêmio: ${fmtR(C.reward)}`, () => { if (s.ch < STORY.length) storyIntro(); });
  }
  storyHUD();
}
function storyIntro() { const s = st(); if (s.ch >= STORY.length || s.seen === s.ch) return; s.seen = s.ch; save(); const C = STORY[s.ch]; storyCard(`Capítulo ${s.ch + 1}: ${C.t}`, C.intro, C.obj.map(o => '• ' + objText(o)).join('<br>')); }
// ---------- telas ----------
function storyCard(title, text, extra, then) {
  const el = document.createElement('div'); el.className = 'panel'; el.style.zIndex = 35;
  el.innerHTML = `<div class="card" style="max-width:520px"><h2>📖 ${title}</h2><div class="it" style="gap:12px;justify-content:flex-start;align-items:flex-start;margin:8px 0"><span style="font-size:34px">${COACH.av}</span><div><div class="n">${COACH.name}, seu treinador</div><div class="d" style="font-size:13px;line-height:1.45">${text}</div></div></div>${extra ? `<div class="d" style="margin:6px 2px">${extra}</div>` : ''}<div style="display:flex;justify-content:center;margin-top:10px"><button class="btn gold play">BORA</button></div></div>`;
  document.body.appendChild(el); const wasP = paused; paused = true;
  el.querySelector('button').onclick = () => { el.remove(); paused = wasP && !$('marinaPanel').classList.contains('hide'); AU.click(); if (then) then(); };
}
function storyHUD() {
  const el = $('hStory'); if (!el) return; const s = st();
  if (s.ch >= STORY.length) { el.textContent = '🏆 Campeão mundial'; return; }
  const C = STORY[s.ch], i = C.obj.findIndex((o, k) => !s.done[s.ch + '_' + k]), o = C.obj[Math.max(0, i)];
  el.textContent = `📖 ${s.ch + 1}/${STORY.length} · ${objText(o)}${objProg(o, s) ? ' (' + objProg(o, s) + ')' : ''}`;
}
function storyHTML() {
  const s = st();
  let h = `<div class="it" style="margin-bottom:8px;gap:12px;justify-content:flex-start"><span style="font-size:30px">${COACH.av}</span><div><div class="n">Modo história · ${s.ch >= STORY.length ? 'concluído!' : `capítulo ${s.ch + 1} de ${STORY.length}`}</div><div class="d">De pescador da vila a campeão mundial, com ${COACH.name} de treinador.${s.sp ? ` Patrocinador: <b>${STORY_SPONSORS.find(x => x.id === s.sp).name}</b>.` : ''}</div></div></div><div class="list">`;
  STORY.forEach((C, ci) => {
    const cur = ci === s.ch, done = ci < s.ch;
    h += `<div class="it" style="flex-direction:column;align-items:stretch;${cur ? 'border-color:var(--acc)' : done ? '' : 'opacity:.55'}"><div class="n">${done ? '✅' : cur ? '▶️' : '🔒'} Capítulo ${ci + 1}: ${C.t} <span class="d">· prêmio ${fmtR(C.reward)}</span></div>`;
    if (cur || done) h += C.obj.map((o, i) => { const ok = done || s.done[ci + '_' + i]; return `<div class="d">${ok ? '☑️' : '⬜'} ${objText(o)}${cur && !ok && objProg(o, s) ? ` · <b>${objProg(o, s)}</b>` : ''}</div>`; }).join('');
    if (cur && ci === 2 && !s.sp) h += `<div class="list" style="margin-top:6px">${STORY_SPONSORS.map(p => `<div class="it"><div><div class="n">${p.name}</div><div class="d">${p.perk}</div></div><button class="btn gold" data-sponsor="${p.id}">ASSINAR</button></div>`).join('')}</div>`;
    h += '</div>';
  });
  return h + '</div>';
}
function bindStory() {
  document.querySelectorAll('[data-sponsor]').forEach(b => b.onclick = () => {
    const s = st(), p = STORY_SPONSORS.find(x => x.id === b.dataset.sponsor); s.sp = p.id; s.payDay = SV.day; save(); AU.coin();
    storyCard('Contrato assinado!', `Agora você é atleta ${p.name}. ${p.perk} O salário cai todo domingo. Não decepcione!`, '', () => storyCheck()); renderShop();
  });
}
// ---------- por quadro: salário, vantagens e primeiro capítulo ----------
function updateStory(dt) {
  if ((storyT -= dt) > 0) return; storyT = 1;
  const s = st();
  if (started && !paused && SV.tut >= TUT.length && s.seen < s.ch && s.ch < STORY.length && !COMP.on) storyIntro();
  if (s.sp && s.lastDay !== SV.day) {
    s.lastDay = SV.day;
    if (s.sp === 'mare') SV.fuel = Math.max(SV.fuel, tankMax());
    if ((SV.day || 1) % 7 === 0 && s.paidDay !== SV.day) { s.paidDay = SV.day; const p = STORY_SPONSORS.find(x => x.id === s.sp); SV.money += p.pay; toast(`💼 Salário do patrocinador ${p.name}: ${fmtR(p.pay)}`, 5, 'gold'); AU.coin(); }
    save();
  }
  storyCheck();
}
function setupStory() {
  // linha do objetivo atual no painel da esquerda; toque abre a aba História
  const lv = $('hLvl') && $('hLvl').parentElement; if (!lv) return;
  const el = document.createElement('div'); el.id = 'hStory'; el.style.cssText = 'font-size:11px;line-height:1.3;margin-top:4px;color:var(--acc);max-width:170px;cursor:pointer;pointer-events:auto';
  el.onclick = () => { shopTab = 'hist'; openShop(nearMarina()); }; lv.after(el); storyHUD();
}
