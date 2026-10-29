// ================= ranking online (Supabase, tabela "records") =================
// cada jogador tem 1 linha por (tipo, espécie, semana); o servidor só deixa o valor subir.
// tipos: 'week' = kg pescados na semana (campeão da semana), 'fish' = maior peixe da espécie, 'depth' = mergulho mais fundo
const RK = { need: true, board: 'week', scope: 'all', per: 'week', sp: null, rows: null, key: '', busy: false, err: '' };
function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), wd = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - wd);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return y + '-S' + String(w).padStart(2, '0');
}
function rkWeek() { const wk = weekKey(); if (!SV.rk || SV.rk.wk !== wk) SV.rk = { wk, tot: 0, fish: {}, depth: 0 }; return SV.rk; }
function rankCatch(f) {
  if (f.sp.ornamental) return;
  const r = rkWeek(); r.tot += f.kg; RK.need = true;
  if (!(r.fish[f.key] >= f.kg)) r.fish[f.key] = f.kg;
}
function rankDive(d) { const r = rkWeek(); if (d > r.depth + 0.2) { r.depth = d; RK.need = true; } }
const rkOff = e => /relation|does not exist|schema cache|404/i.test(e.message);
// manda a semana inteira do save (poucas linhas); como o servidor guarda sempre o maior, reenviar não faz mal
async function rankFlush() {
  if (!ON.s || !RK.need || RK.err === 'off') return;
  const r = rkWeek(), base = { uid: ON.s.uid, week: r.wk, region: REGION, name: myName() }, v = x => Math.round(x * 100) / 100;
  const rows = []; if (r.tot > 0) rows.push({ ...base, kind: 'week', species: '', value: v(r.tot) }); if (r.depth > 0) rows.push({ ...base, kind: 'depth', species: '', value: v(r.depth) });
  for (const k in r.fish) rows.push({ ...base, kind: 'fish', species: k, value: v(r.fish[k]) });
  RK.need = false; if (!rows.length) return;
  try { await sbFetch('/rest/v1/records', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) }); }
  catch (e) { RK.need = true; if (rkOff(e)) RK.err = 'off'; }
}

// ---------- telas ----------
const rkSpecies = () => Object.keys(SPECIES).filter(k => spInRegion(k) && !SPECIES[k].protected && !SPECIES[k].ornamental);
const rkEsc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function rkKey() { return [RK.board, RK.scope, RK.board === 'week' ? 'week' : RK.per, RK.board === 'fish' ? RK.sp : '', ON.friends.length].join('|'); }
async function rankLoad() {
  if (!ON.s || RK.busy) return;
  const key = rkKey(); RK.busy = true; RK.key = key;
  let q = `/rest/v1/records?select=uid,name,value,week&kind=eq.${RK.board}`;
  if (RK.board === 'fish') q += `&species=eq.${RK.sp}`;
  if (RK.board === 'week' || RK.per === 'week') q += `&week=eq.${weekKey()}`;
  if (RK.scope === 'friends') q += `&uid=in.(${[ON.s.uid, ...ON.friends.map(f => f.id)].join(',')})`;
  q += '&order=value.desc&limit=200';
  try {
    await rankFlush(); // manda o meu antes, para eu já aparecer
    const seen = new Set(); RK.rows = (await sbFetch(q) || []).filter(x => !seen.has(x.uid) && seen.add(x.uid)); RK.err = '';
  } catch (e) { RK.rows = null; RK.err = rkOff(e) ? 'off' : e.message; }
  RK.busy = false; if (shopTab === 'rank') renderShop();
}
function rankHTML() {
  if (!ON.s || !ON.me) return '<div class="it"><div class="d">Conectando ao servidor do jogo... O ranking aparece assim que entrar online.</div></div>';
  const sps = rkSpecies(); if (!sps.includes(RK.sp)) RK.sp = sps.slice().sort((a, b) => (SV.best[b] || 0) - (SV.best[a] || 0))[0];
  if (RK.key !== rkKey()) setTimeout(rankLoad, 0);
  const seg = (k, opts) => opts.map(([v, n]) => `<button class="btn ${RK[k] === v ? 'gold' : 'alt'}" data-rk="${k}" data-v="${v}">${n}</button>`).join('');
  const unit = RK.board === 'depth' ? 'm' : 'kg';
  let h = `<div class="it" style="margin-bottom:8px;flex-direction:column;align-items:stretch;gap:6px">
    <div style="display:flex;gap:6px;flex-wrap:wrap">${seg('board', [['week', '🏆 Campeão da semana'], ['fish', '🐟 Maior peixe'], ['depth', '🌊 Mais fundo']])}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${seg('scope', [['all', 'Todos'], ['friends', 'Amigos']])}${RK.board !== 'week' ? '<span style="width:10px"></span>' + seg('per', [['week', 'Esta semana'], ['all', 'De todos os tempos']]) : ''}</div>
    ${RK.board === 'fish' ? `<select id="rkSp" style="padding:8px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe">${sps.map(k => `<option value="${k}" ${k === RK.sp ? 'selected' : ''}>${SPECIES[k].name}</option>`).join('')}</select>` : ''}
    <div class="d">${RK.board === 'week' ? 'Soma dos quilos pescados de segunda a domingo (todos os destinos). Zera toda segunda-feira.' : RK.board === 'fish' ? 'O peixe mais pesado de cada jogador nessa espécie.' : 'A maior profundidade de cada jogador num mergulho.'}</div></div>`;
  if (RK.err === 'off') return h + '<div class="it"><div class="d">O ranking ainda não foi ativado no servidor. Assim que for, suas pescarias desta semana entram sozinhas.</div></div>';
  if (RK.err) return h + `<div class="it"><div class="d">Não deu para carregar: ${rkEsc(RK.err)}</div><button class="btn" id="rkRetry">TENTAR DE NOVO</button></div>`;
  if (!RK.rows || RK.busy) return h + '<div class="it"><div class="d">Carregando...</div></div>';
  const rows = RK.rows, mine = rows.findIndex(r => r.uid === ON.s.uid), top = rows.slice(0, 20);
  const medal = i => ['🥇', '🥈', '🥉'][i] || `${i + 1}º`;
  h += '<div class="list">' + (top.length ? top.map((r, i) => `<div class="it" ${r.uid === ON.s.uid ? 'style="border-color:var(--acc)"' : ''}><span class="av" style="background:${i < 3 ? '#8a6a1a' : '#24414f'}">${medal(i)}</span><div style="flex:1"><div class="n">${rkEsc(r.name)}${r.uid === ON.s.uid ? ' <span class="d">(você)</span>' : ''}</div>${RK.board !== 'week' && RK.per === 'all' ? `<div class="d">semana ${r.week.slice(-2)}/${r.week.slice(0, 4)}</div>` : ''}</div><b>${fmtKg(r.value)} ${unit}</b></div>`).join('')
    : '<div class="it"><div class="d">Ninguém ainda. Seja o primeiro!</div></div>') + '</div>';
  if (mine >= 20) h += `<div class="it" style="margin-top:8px;border-color:var(--acc)"><div class="n">Você está em ${mine + 1}º · ${fmtKg(rows[mine].value)} ${unit}</div></div>`;
  return h;
}
function bindRank(B) {
  B.querySelectorAll('[data-rk]').forEach(b => b.onclick = () => { RK[b.dataset.rk] = b.dataset.v; AU.click(); renderShop(); });
  const s = $('rkSp'); if (s) s.onchange = () => { RK.sp = s.value; renderShop(); };
  const r = $('rkRetry'); if (r) r.onclick = () => { RK.key = ''; RK.err = ''; renderShop(); };
}
