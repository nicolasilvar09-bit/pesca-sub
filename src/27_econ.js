// ================= economia: peixe vale menos, pescado estraga sem gelo, elásticos gastam e motor pede revisão =================
// preços do pescado pela metade (o jogo dava dinheiro rápido demais) e conquistas mais modestas
for (const k in SPECIES) SPECIES[k].price = Math.max(SPECIES[k].price ? 4 : 0, Math.round(SPECIES[k].price * 0.5));
ACH.forEach(a => { a.r = Math.max(50, Math.round(a.r * 0.5 / 50) * 50); });

// ---------- frescor do pescado ----------
const ICE_PRICE = 40;
const nowH = () => (SV.day || 1) * 24 + (SV.tod || 7);
const iceOn = () => SV.iceDay === SV.day;
// com gelo: segura bem por 12 h e depois perde pouco; sem gelo: depois de 4 h perde rápido
function freshK(f) {
  if (f.at == null || f.frozen) return 1;
  const h = nowH() - f.at;
  return f.ice ? clamp(1 - Math.max(0, h - 12) / 6 * 0.03, 0.5, 1) : clamp(1 - Math.max(0, h - 4) / 6 * 0.12, 0.35, 1);
}
const fishVal = f => f.kg * SPECIES[f.key].price * freshK(f);
const freshTag = f => { const k = freshK(f); return k > 0.95 ? '🟢 fresco' : k > 0.75 ? '🟡 bom' : k > 0.5 ? '🟠 passando' : '🔴 quase estragado'; };
// marca hora e gelo em cada peixe que entra na fieira
function tagCatch(o) { o.at = nowH(); o.ice = iceOn(); return o; }
function iceHTML(at) {
  if (!at) return '';
  return `<div class="it" style="margin-bottom:8px"><div><div class="n">🧊 Gelo para a caixa térmica ${iceOn() ? '· <b style="color:var(--acc)">COM GELO HOJE</b>' : ''}</div><div class="d">Sem gelo o peixe começa a perder valor depois de 4 horas. Com gelo ele aguenta o dia todo. Vale para o que você pegar hoje.</div></div>${iceOn() ? '' : buyBtn('id="buyIce"', ICE_PRICE, 'GELO ' + fmtR(ICE_PRICE))}</div>`;
}

// ---------- desgaste dos elásticos (ou revisão do pneumático) ----------
const BAND_PRICE = 90, PNEU_PRICE = 150;
const gunShots = id => ((SV.wear || {})[id] || 0);
const gunWearK = (id = SV.gun) => 1 - 0.25 * smooth(60, 220, gunShots(id));
function gunShot() {
  SV.wear = SV.wear || {}; const n = SV.wear[SV.gun] = gunShots(SV.gun) + 1;
  if (n === 120) toast(GUN.def.pneu ? 'O pneumático está perdendo pressão: faça a revisão na loja.' : 'Os elásticos estão ressecando e o tiro perde alcance: troque na loja (aba Equipamentos).', 4, 'bad');
}
function wearTxt(g) { const k = gunWearK(g.id); return k > 0.97 ? '' : ` <b style="color:var(--bad)">${g.pneu ? 'Pressão' : 'Elásticos'} ${Math.round(k * 100)}%</b>`; }
function wearBtn(g) { return SV.guns.includes(g.id) && gunShots(g.id) > 40 ? `<button class="btn alt" data-band="${g.id}" ${SV.money < (g.pneu ? PNEU_PRICE : BAND_PRICE) ? 'disabled' : ''}>${g.pneu ? 'REVISÃO' : 'ELÁSTICOS'} ${fmtR(g.pneu ? PNEU_PRICE : BAND_PRICE)}</button>` : ''; }

// ---------- revisão do motor (a voadeira é da pousada: manutenção por conta dela) ----------
const ENG_PRICE = [250, 450, 800], ENG_LIFE = 25;
const engineK = () => useVoad() ? 1 : 1 - 0.2 * smooth(ENG_LIFE, ENG_LIFE + 20, SV.engH || 0);
function engineTick(dt) {
  if (useVoad() || P.mode !== 'boat' || Math.abs(BOAT.throttle) < 0.05) return;
  const was = SV.engH || 0; SV.engH = was + dt / HOUR_S * Math.abs(BOAT.throttle);
  if (was < ENG_LIFE && SV.engH >= ENG_LIFE) toast('O motor está pedindo revisão: a lancha vai perdendo velocidade. Faça na marina (aba Combustível).', 5, 'bad');
}
function engineHTML(at) {
  if (useVoad()) return '';
  const h = SV.engH || 0, price = ENG_PRICE[SV.boat || 0] || 250, k = engineK();
  return `<div class="it" style="margin-top:8px"><div><div class="n">🔧 Revisão do motor · ${Math.floor(h)} h de uso</div><div class="d">Revisão a cada ${ENG_LIFE} h de motor.${k < 0.99 ? ` <b style="color:var(--bad)">Rendimento ${Math.round(k * 100)}%</b>.` : ' Motor em dia.'}${at ? '' : ' Só na marina.'}</div></div>${at && h > 3 ? buyBtn('id="buyEng"', price, 'REVISAR ' + fmtR(price)) : ''}</div>`;
}
function bindEcon(at, pay) {
  const bi = $('buyIce'); if (bi) bi.onclick = () => { if (pay(ICE_PRICE)) { SV.iceDay = SV.day; P.stringer.forEach(f => f.ice = true); toast('Caixa térmica com gelo: o peixe de hoje fica fresco.', 3, 'gold'); } save(); renderShop(); };
  const be = $('buyEng'); if (be) be.onclick = () => { if (pay(ENG_PRICE[SV.boat || 0] || 250)) { SV.engH = 0; toast('Motor revisado: lancha voando de novo!', 3, 'gold'); } save(); renderShop(); };
  $('mBody').querySelectorAll('[data-band]').forEach(b => b.onclick = () => { const g = gunById(b.dataset.band); if (pay(g.pneu ? PNEU_PRICE : BAND_PRICE)) { SV.wear[g.id] = 0; toast(g.pneu ? 'Pneumático revisado.' : 'Elásticos novos: tiro com alcance total.', 3, 'gold'); } save(); renderShop(); });
}
