// ================= desafio da semana online: mesmo lugar, mesmo horário e mesmo tempo para todo mundo =================
// cada um joga quando puder; vale o peso total de peixes na medida em 8 minutos. O melhor resultado da semana
// vai para o ranking (tabela "records", tipo 'fish' com espécie 'desafio_<destino>', que o servidor só deixa subir)
const CH_TIME = 480, CH_HOUR = 9;
const CH = { rows: null, key: '', busy: false, err: '' };
const chalSp = () => 'desafio_' + REGION;
function chalSpot() {
  const wk = weekKey(), list = SPOTS.filter(s => s.r && !noTakeAt(s)).sort((a, b) => a.id < b.id ? -1 : 1);
  const m = mulberry([...(wk + REGION)].reduce((s, c) => s * 31 + c.charCodeAt(0), 5) >>> 0);
  return list[Math.floor(m() * list.length)];
}
function chalMe() { const wk = weekKey(); if (!SV.chal || SV.chal.wk !== wk) SV.chal = { wk, best: 0, tries: 0, paid: false }; return SV.chal; }
function startChal() {
  const s = chalSpot(); if (!s || COMP.on) return;
  closePanels();
  SV.tod = CH_HOUR; // todo mundo joga com a mesma luz
  startComp(s.id, null, []); if (!COMP.on) return;
  COMP.lobby = false; COMP.weekly = { wk: weekKey() }; COMP.t = CH_TIME; chalMe().tries++;
  const lead = CH.rows && CH.rows[0];
  toast(`🎯 Desafio da semana valendo! 8 minutos na ${s.name}. Vale o peso total de peixe na medida.${lead ? ` Líder: ${rkEsc(lead.name)} com ${fmtKg(lead.value)} kg.` : ''}`, 6, 'gold');
}
async function chalPost(kg) {
  if (!ON.s || kg <= 0) return;
  const row = { uid: ON.s.uid, kind: 'fish', species: chalSp(), week: weekKey(), region: REGION, name: myName(), value: Math.min(399, Math.round(kg * 100) / 100) };
  try { await sbFetch('/rest/v1/records', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify([row]) }); } catch (e) { }
}
async function chalLoad(force) {
  if (!ON.s || CH.busy) return;
  const key = weekKey() + REGION; if (!force && CH.key === key && (CH.rows || CH.err)) return;
  CH.busy = true; CH.key = key;
  try {
    const me = chalMe(); if (me.best > 0) await chalPost(me.best);
    CH.rows = await sbFetch(`/rest/v1/records?select=uid,name,value&kind=eq.fish&species=eq.${chalSp()}&week=eq.${weekKey()}&order=value.desc&limit=50`) || []; CH.err = '';
  } catch (e) { CH.rows = null; CH.err = rkOff(e) ? 'off' : e.message; }
  CH.busy = false; if (shopTab === 'chal' && !$('marinaPanel').classList.contains('hide')) renderShop();
}
function chalEnd() {
  const kg = Math.round(COMP.me.kg * 100) / 100, n = COMP.me.n, me = chalMe(), rec = kg > me.best;
  COMP.weekly = null; let prize = 0;
  if (!me.paid && kg > 0) { me.paid = true; prize += 300; }
  if (rec && me.tries > 1 && kg > 0) prize += 200;
  if (rec) me.best = kg;
  SV.money += prize; addXP(150 + kg * 10); mission('chal'); save();
  chalPost(me.best).then(() => chalLoad(true));
  paused = true; $('marinaPanel').classList.remove('hide');
  $('marinaPanel').querySelector('h2').textContent = 'Desafio da semana';
  $('mSub').textContent = rec && kg > 0 ? `Novo melhor resultado: ${fmtKg(kg)} kg!` : `Você fez ${fmtKg(kg)} kg. Seu melhor da semana continua ${fmtKg(me.best)} kg.`;
  $('mTabs').innerHTML = '';
  $('mBody').innerHTML = `<div class="it"><div><div class="n">${n} peixe(s) na medida · ${fmtKg(kg)} kg</div><div class="d">${prize ? `Prêmio de ${fmtR(prize)} no saldo. ` : ''}${ON.s ? 'Seu melhor resultado já foi para o ranking do desafio (Competições › Desafio da semana).' : 'Entre online para o resultado ir para o ranking.'} Os peixes continuam na fieira para vender.</div></div></div>
    <div class="row2"><span></span><button class="btn gold" id="chRank">VER RANKING</button></div>`;
  $('chRank').onclick = () => { shopTab = 'chal'; openShop(false); };
  AU.coin();
}
function chalHTML() {
  const s = chalSpot(), me = chalMe();
  if (ON.s) setTimeout(chalLoad, 0);
  let h = `<div class="it" style="margin-bottom:8px;flex-direction:column;align-items:stretch;gap:6px">
    <div class="n">🎯 Desafio da semana · ${s ? s.name : ''} <span class="d">(${s ? s.depth : ''})</span></div>
    <div class="d">O mesmo desafio para todos os jogadores: começa às ${CH_HOUR}h na ${s ? s.name : ''}, 8 minutos, sem adversários na água. Vale o <b>peso total</b> de peixe dentro da medida. Jogue quantas vezes quiser: só o seu melhor resultado entra no ranking. Muda toda segunda-feira (${weekLeft()}).</div>
    <div class="d">Prêmio: ${fmtR(300)} na primeira tentativa da semana com peixe, e ${fmtR(200)} cada vez que bater o seu recorde.</div>
    <div class="row2"><span>Seu melhor: <b style="color:var(--acc)">${me.best ? fmtKg(me.best) + ' kg' : '—'}</b> · ${me.tries} tentativa(s)</span><button class="btn gold" id="chGo" ${COMP.on ? 'disabled' : ''}>JOGAR DESAFIO</button></div></div>`;
  if (!ON.s) return h + '<div class="it"><div class="d">Conectando ao servidor... o ranking aparece assim que entrar online.</div></div>';
  if (CH.err === 'off') return h + '<div class="it"><div class="d">O ranking ainda não foi ativado no servidor.</div></div>';
  if (CH.err) return h + `<div class="it"><div class="d">Não deu para carregar: ${rkEsc(CH.err)}</div></div>`;
  if (!CH.rows) return h + '<div class="it"><div class="d">Carregando ranking...</div></div>';
  const seen = new Set(), rows = CH.rows.filter(x => !seen.has(x.uid) && seen.add(x.uid)), fr = new Set(ON.friends.map(f => f.id)), mine = rows.findIndex(r => r.uid === ON.s.uid);
  const medal = i => ['🥇', '🥈', '🥉'][i] || `${i + 1}º`;
  h += '<div class="list">' + (rows.length ? rows.slice(0, 20).map((r, i) => `<div class="it" ${r.uid === ON.s.uid ? 'style="border-color:var(--acc)"' : ''}><span class="av" style="background:${i < 3 ? '#8a6a1a' : '#24414f'}">${medal(i)}</span><div style="flex:1"><div class="n">${rkEsc(r.name)}${r.uid === ON.s.uid ? ' <span class="d">(você)</span>' : fr.has(r.uid) ? ' <span class="d">(amigo)</span>' : ''}</div></div><b>${fmtKg(r.value)} kg</b></div>`).join('')
    : '<div class="it"><div class="d">Ninguém jogou ainda esta semana. Seja o primeiro!</div></div>') + '</div>';
  if (mine >= 20) h += `<div class="it" style="margin-top:8px;border-color:var(--acc)"><div class="n">Você está em ${mine + 1}º · ${fmtKg(rows[mine].value)} kg</div></div>`;
  return h;
}
function bindChal() { const b = $('chGo'); if (b) b.onclick = () => { AU.click(); startChal(); }; }
