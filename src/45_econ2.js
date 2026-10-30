// ================= economia: lancha grande custa por dia, prêmio de nível menor e coisas caras para mirar =================
// equipamento de competição (o topo de cada categoria) e melhorias da lancha, para o dinheiro ter onde ir

// ---------- equipamento de competição ----------
GUNS.push(
  { id: 'n120', name: 'Netuno Pro 120 carbono', len: 1.2, range: 8.2, bands: 3, power: 38, speed: 28, price: 9000, load: 1.0, wood: false, desc: 'Tubo de carbono, recarga rapidíssima e tiro preciso. A arma dos campeões de costão.' },
  { id: 'n160', name: 'Netuno Mundial 160 roller', len: 1.6, range: 11.5, bands: 4, power: 95, speed: 32, price: 19000, load: 1.3, wood: true, desc: 'A mais forte do jogo: alcance de água azul e força para atum grande.' });
SUITS.push({ name: 'Azul Profundo competição 7 mm', o2: 0.79, shy: 0.68, price: 9500, desc: 'Roupa usada no Mundial: a mais quente e a mais discreta. Gasta o menor fôlego.' });
SUIT_LOOK.push({ camo: ['#16324a', '#0e2234', '#1d3a52', '#244a66', '#0a1826', '#2c5a78'] });
FINS.push({ name: 'Nadadeira de competição carbono 110', k: 1.6, price: 8000, shy: 0.92 });
FIN_DESC.push('Pá de carbono de 110 cm feita para o Mundial: a maior propulsão do jogo.');
FIN_LOOK.push({ color: 0x0e2a44, map: true, rough: 0.25, metal: 0.25 });

// ---------- melhorias da lancha (por lancha) ----------
const BOAT_UP = [
  { id: 'motor', name: 'Motor preparado', d: '+15% de velocidade máxima.', price: i => [3500, 6000, 9000, 14000][i] || 3500 },
  { id: 'tank', name: 'Tanque extra', d: '+50% de combustível: vai mais longe sem voltar.', price: i => [1500, 2500, 4000, 6000][i] || 1500 },
];
const boatUp = (id, i = SV.boat || 0) => !useVoad() && !!((SV.boatUp || {})[i] || {})[id];
const boatSpeedK = () => boatUp('motor') ? 1.15 : 1;
function boatUpHTML() {
  if (useVoad()) return '';
  const i = SV.boat || 0;
  return `<div class="n" style="margin:12px 0 6px">🔧 Melhorias da ${BOATS[i].name}</div><div class="list">` + BOAT_UP.map(u => `<div class="it"><div><div class="n">${u.name}</div><div class="d">${u.d}</div></div>${boatUp(u.id) ? '<span class="d">INSTALADO</span>' : buyBtn(`data-bup="${u.id}"`, u.price(i))}</div>`).join('') + '</div>';
}
function bindBoatUp(on, pay) {
  on('[data-bup]', b => { const u = BOAT_UP.find(x => x.id === b.dataset.bup), i = SV.boat || 0; if (pay(u.price(i))) { SV.boatUp = SV.boatUp || {}; (SV.boatUp[i] = SV.boatUp[i] || {})[u.id] = true; toast(`${u.name} instalado!`, 3, 'gold'); } });
}

// ---------- diária da marina: quanto maior a lancha, mais cara a vaga ----------
const MARINA_FEE = [0, 60, 150, 300];
const marinaFee = () => useVoad() ? 0 : MARINA_FEE[SV.boat || 0] || 0;
function updateEcon2() {
  if (SV.feeDay == null) { SV.feeDay = SV.day; return; } // começa a contar agora (saves antigos não pagam atrasado)
  if (SV.feeDay === SV.day) return;
  const days = Math.max(1, Math.min(7, (SV.day || 1) - SV.feeDay)), fee = marinaFee() * days; SV.feeDay = SV.day;
  if (!fee) return;
  SV.money -= fee; save();
  toast(`⚓ Diária da marina (vaga da ${BOATS[SV.boat || 0].name}): -${fmtR(fee)}${SV.money < 0 ? ' · saldo negativo: venda pescado ou use uma lancha menor' : ''}`, 5, SV.money < 0 ? 'bad' : '');
}
function feeHTML() {
  const f = marinaFee();
  return `<div class="it" style="margin-bottom:8px"><div class="d">⚓ Diária da marina: ${f ? `<b>${fmtR(f)} por dia</b> pela vaga da lancha atual` : 'grátis para a lancha 21 pés'} (26 pés ${fmtR(MARINA_FEE[1])}, 32 pés ${fmtR(MARINA_FEE[2])}, 38 pés ${fmtR(MARINA_FEE[3])}). Escolha a lancha do dia de acordo com o passeio.</div></div>`;
}

// ---------- correção única: recordes acima do peso possível (antes o troféu podia ter até 3x o peso) ----------
function fixOldRecords() {
  if (SV.kgFix) return; SV.kgFix = 1;
  const cap = k => SPECIES[k] ? maxKg(SPECIES[k]) : Infinity;
  for (const k in SV.best || {}) SV.best[k] = Math.min(SV.best[k], cap(k));
  if (SV.rk && SV.rk.fish) for (const k in SV.rk.fish) SV.rk.fish[k] = Math.min(SV.rk.fish[k], cap(k));
  save();
}
