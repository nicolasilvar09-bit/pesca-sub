// ================= pesca consciente: defeso, selo do pescador consciente e cota diária opcional =================
// o defeso segue o calendário real (mês de hoje). As datas são regras do jogo, inspiradas nas reais:
// na vida real, confira sempre as regras do seu estado.
const DEFESO = {
  cv: [{ keys: ['garoupa'], from: [11, 1], to: [2, 28], n: 'Defeso da garoupa', why: 'A garoupa desova no verão e cresce devagar: sem ela não tem garoupa grande amanhã.' }],
  ne: [{ keys: ['cioba'], from: [11, 1], to: [1, 31], n: 'Defeso da cioba', why: 'Na época de desova as ciobas se juntam nos parcéis e ficam fáceis demais de pegar.' }],
  amz: [{ keys: ['tambaqui', 'matrinxa', 'pacu', 'jaraqui', 'aracu'], from: [11, 15], to: [3, 15], n: 'Piracema', why: 'Os cardumes sobem o rio para desovar. É a regra mais importante da pesca no Amazonas.' }],
};
const ECO_FINE = 600, COTA_KG = 10;
const mdNum = (m, d) => m * 100 + d;
function defesoOn(D, dt = new Date()) { const t = mdNum(dt.getMonth() + 1, dt.getDate()), a = mdNum(...D.from), b = mdNum(...D.to); return a <= b ? t >= a && t <= b : t >= a || t <= b; }
function defesoOf(key) { for (const D of DEFESO[REGION] || []) if (D.keys.includes(key) && defesoOn(D)) return D; return null; }
const mdTxt = ([m, d]) => `${d} de ${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][m - 1]}`;

// ---------- selo do pescador consciente: dias seguidos pescando sem multa ----------
const ECO_LV = [{ d: 0, n: 'Sem selo', k: 0 }, { d: 3, n: 'Bronze', k: 0.05 }, { d: 7, n: 'Prata', k: 0.1 }, { d: 15, n: 'Ouro', k: 0.15 }];
function eco() { if (!SV.eco) SV.eco = { streak: 0, best: 0, fines: 0, day: SV.day || 1, fined: false, caught: false }; return SV.eco; }
const ecoLv = () => { const s = eco().streak; let L = ECO_LV[0]; for (const x of ECO_LV) if (s >= x.d) L = x; return L; };
// multiplicador do preço de venda: selo + regras reais de cota
const ecoK = () => 1 + ecoLv().k + (SV.realRules ? 0.25 : 0);
function ecoDayRoll() {
  const E = eco(); if (E.day === (SV.day || 1)) return;
  if (E.caught && !E.fined) {
    const before = ecoLv(); E.streak++; E.best = Math.max(E.best, E.streak); const after = ecoLv();
    if (after !== before) toast(`🌱 Selo Pescador Consciente ${after.n}! ${E.streak} dias pescando sem multa: o pescado vale +${Math.round(after.k * 100)}%.`, 6, 'gold');
  }
  E.day = SV.day || 1; E.fined = false; E.caught = false;
}
function ecoFine() {
  const E = eco(), had = E.streak >= 3; E.fines++; E.fined = true; E.streak = 0;
  if (had) setTimeout(() => toast('🌱 Você perdeu o Selo Pescador Consciente. Pesque sem multa por 3 dias para recuperar.', 5, 'bad'), 1200);
}
function ecoCatch(kg) { const E = eco(); E.caught = true; if (SV.realRules) { const C = cota(); C.kg += kg; } }

// ---------- cota diária (opcional, Diário › Pesca consciente): 10 kg + 1 exemplar por dia ----------
function cota() { if (!SV.cota || SV.cota.day !== (SV.day || 1)) SV.cota = { day: SV.day || 1, kg: 0 }; return SV.cota; }
const cotaFull = () => SV.realRules && cota().kg >= COTA_KG;

// chamado no catchFish antes de pôr o peixe na fieira: true = apreendido
function ecoCheck(f) {
  const sp = f.sp, D = defesoOf(f.key);
  if (D) { SV.money -= ECO_FINE; ecoFine(); toast(`${sp.name} está em ${D.n.toLowerCase()} (até ${mdTxt(D.to)})! Peixe apreendido e multa de ${fmtR(ECO_FINE)}.`, 6, 'bad'); AU.bad(); save(); return true; }
  if (cotaFull()) { SV.money -= 300; ecoFine(); toast(`Cota do dia estourada (${COTA_KG} kg + 1 peixe já na conta)! Peixe apreendido e multa de ${fmtR(300)}. Volte amanhã.`, 6, 'bad'); AU.bad(); save(); return true; }
  return false;
}
function ecoHTML() {
  const E = eco(), L = ecoLv(), nx = ECO_LV.find(x => x.d > E.streak), defs = DEFESO[REGION] || [];
  let h = `<div class="it" style="margin-bottom:8px"><div style="flex:1"><div class="n">🌱 Selo Pescador Consciente · <b style="color:${L.k ? 'var(--acc2)' : 'inherit'}">${L.n}</b></div>
    <div class="d">${E.streak} dia(s) seguidos pescando sem nenhuma multa${L.k ? ` · seu pescado vale <b>+${Math.round(L.k * 100)}%</b> na venda` : ''}.${nx ? ` Faltam ${nx.d - E.streak} dia(s) para o selo ${nx.n} (+${Math.round(nx.k * 100)}%).` : ' Nível máximo!'} Qualquer multa zera a sequência. Melhor sequência: ${E.best} dia(s).</div>
    <div class="bar"><i style="width:${nx ? Math.round(E.streak / nx.d * 100) : 100}%"></i></div></div></div>`;
  h += `<div class="n" style="margin:12px 0 6px">📅 Defeso neste destino</div><div class="list">` + (defs.length ? defs.map(D => {
    const on = defesoOn(D);
    return `<div class="it"><div style="flex:1"><div class="n">${D.n} · ${mdTxt(D.from)} a ${mdTxt(D.to)} ${on ? '· <b style="color:var(--bad)">EM VIGOR AGORA</b>' : '· fora de época'}</div><div class="d">${D.keys.filter(k => SPECIES[k]).map(k => SPECIES[k].name).join(', ')}. ${D.why} ${on ? `Atirar dá multa de ${fmtR(ECO_FINE)}.` : ''}</div></div></div>`;
  }).join('') : '<div class="it"><div class="d">Nenhum defeso neste destino.</div></div>') + '</div>';
  const prot = Object.keys(SPECIES).filter(k => SPECIES[k].protected && spInRegion(k)).map(k => SPECIES[k].name);
  h += `<div class="n" style="margin:12px 0 6px">📏 Regras que dão multa</div><div class="list">
    <div class="it"><div class="d"><b>Medida mínima</b> de cada espécie (lista em Diário › Recordes): peixe pequeno ainda não se reproduziu. Multa ${fmtR(200)}.</div></div>
    <div class="it"><div class="d"><b>Espécies protegidas</b>, só foto: ${prot.join(', ') || '—'}. Multa ${fmtR(1000)}.</div></div>
    ${NE || AC ? `<div class="it"><div class="d"><b>Área de preservação</b> ${AC ? 'da Gruta Azul' : 'das piscinas naturais'}: só foto. Multa ${fmtR(500)}.</div></div>` : ''}
    <div class="it"><div class="d"><b>Licença de pesca</b> em dia (LOJA › Extras): ${licOk() ? '<b style="color:var(--acc)">válida</b>' : '<b style="color:var(--bad)">vencida</b>'}. Sem ela, multa de ${fmtR(400)} e a fieira é apreendida.</div></div></div>`;
  const C = cota();
  h += `<div class="n" style="margin:12px 0 6px">⚖️ Cota diária (opcional)</div><div class="it"><div style="flex:1"><div class="n">Regras reais de cota: ${COTA_KG} kg + 1 peixe por dia ${SV.realRules ? '· <b style="color:var(--acc)">LIGADA</b>' : ''}</div>
    <div class="d">Como na pesca amadora de verdade: depois de ${COTA_KG} kg no dia, só vale mais um peixe. Em troca, todo o seu pescado vale <b>+25%</b>.${SV.realRules ? ` Hoje: ${fmtKg(C.kg)} de ${COTA_KG} kg${C.kg >= COTA_KG ? ' · <b style="color:var(--bad)">cota cheia, só amanhã</b>' : ''}.` : ''}</div></div>
    <button class="btn ${SV.realRules ? 'alt' : 'gold'}" id="ecoCota">${SV.realRules ? 'DESLIGAR' : 'LIGAR'}</button></div>`;
  h += '<div class="it" style="margin-top:8px"><div class="d">As datas de defeso do jogo são inspiradas nas regras reais, mas mudam de estado para estado. Na vida real, confira sempre as regras locais antes de pescar.</div></div>';
  return h;
}
function bindEco() { const b = $('ecoCota'); if (b) b.onclick = () => { SV.realRules = !SV.realRules; AU.click(); toast(SV.realRules ? `Cota real ligada: ${COTA_KG} kg + 1 peixe por dia, pescado +25%.` : 'Cota real desligada.', 3); save(); renderShop(); }; }
