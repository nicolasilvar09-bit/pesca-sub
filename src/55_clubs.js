// ================= clubes de pesca: monte um clube com amigos e dispute o ranking semanal de clubes =================
// tabelas "clubs" e "club_members" (supabase/clubs.sql). O total do clube na semana é a soma do
// "Campeão da semana" (kg pescados) de cada membro; vem pronto da visão "club_week".
const CLUB = { me: undefined, info: null, members: null, top: null, busy: false, err: '', key: '', form: false, emblem: '🐟', color: '#2fd0c0' };
const CLUB_EMB = ['🐟', '🐠', '🦈', '🐙', '🦑', '🐢', '🐬', '🐋', '🦞', '⚓', '🔱', '🌊', '🤿', '🏝️', '☀️', '🌙'];
const CLUB_COL = ['#2fd0c0', '#ffb020', '#ff5a4e', '#4a8cff', '#7cf0a8', '#c070ff', '#f0f0f0', '#ff8ac0'];
const clubOff = e => /relation .* does not exist|schema cache|HTTP 404/i.test(e.message);
function newClubId() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
async function clubLoad(force) {
  if (!ON.s || CLUB.busy) return;
  const key = weekKey(); if (!force && CLUB.key === key && CLUB.me !== undefined) return;
  CLUB.busy = true; CLUB.key = key;
  try {
    const m = await sbFetch(`/rest/v1/club_members?uid=eq.${ON.s.uid}&select=club`);
    CLUB.me = m && m[0] ? m[0].club : null; CLUB.info = null; CLUB.members = null;
    if (CLUB.me) {
      const [c, mem] = await Promise.all([sbFetch(`/rest/v1/clubs?id=eq.${CLUB.me}&select=*`), sbFetch(`/rest/v1/club_members?club=eq.${CLUB.me}&select=uid,name`)]);
      CLUB.info = c && c[0] || null;
      const ids = (mem || []).map(x => x.uid), wk = ids.length ? await sbFetch(`/rest/v1/records?select=uid,value&kind=eq.week&week=eq.${key}&uid=in.(${ids.join(',')})`) : [];
      const kg = {}; (wk || []).forEach(r => kg[r.uid] = Math.max(kg[r.uid] || 0, r.value));
      CLUB.members = (mem || []).map(x => ({ ...x, kg: kg[x.uid] || 0 })).sort((a, b) => b.kg - a.kg);
      // o nome no clube acompanha o nome do jogador
      const mine = CLUB.members.find(x => x.uid === ON.s.uid); if (mine && mine.name !== myName()) sbFetch(`/rest/v1/club_members?uid=eq.${ON.s.uid}`, { method: 'PATCH', body: JSON.stringify({ name: myName() }) }).catch(() => { });
    }
    const top = await sbFetch(`/rest/v1/club_week?week=eq.${key}&select=club,total,n&order=total.desc&limit=20`) || [];
    const cl = top.length ? await sbFetch(`/rest/v1/clubs?id=in.(${top.map(t => t.club).join(',')})&select=id,name,emblem,color`) : [];
    CLUB.top = top.map(t => ({ ...t, ...(cl.find(c => c.id === t.club) || { name: t.club, emblem: '🐟', color: '#2fd0c0' }) }));
    CLUB.err = '';
  } catch (e) { CLUB.err = clubOff(e) ? 'off' : e.message; if (CLUB.me === undefined) CLUB.me = null; } // não fica recarregando em erro
  CLUB.busy = false; if (shopTab === 'clube' && !$('marinaPanel').classList.contains('hide')) renderShop();
}
async function clubJoin(id) {
  id = (id || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(id)) { toast('O código do clube tem 6 letras/números.', 3, 'bad'); return; }
  try {
    const c = await sbFetch(`/rest/v1/clubs?id=eq.${id}&select=id,name`); if (!c || !c[0]) { toast('Clube não encontrado. Confira o código.', 3, 'bad'); return; }
    await sbFetch('/rest/v1/club_members', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ uid: ON.s.uid, club: id, name: myName() }) });
    toast(`Você entrou no clube ${c[0].name}! Seus quilos da semana já contam para ele.`, 4, 'gold'); AU.coin();
  } catch (e) { toast(/cheio/.test(e.message) ? 'Esse clube já tem 20 membros.' : 'Não deu para entrar: ' + e.message, 4, 'bad'); }
  clubLoad(true);
}
async function clubCreate(name) {
  name = (name || '').trim().slice(0, 24);
  if (name.length < 2) { toast('Dê um nome ao clube (2 letras ou mais).', 3, 'bad'); return; }
  try {
    let id = null;
    for (let k = 0; k < 4 && !id; k++) { const t = newClubId(); try { await sbFetch('/rest/v1/clubs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ id: t, name, emblem: CLUB.emblem, color: CLUB.color, owner: ON.s.uid }) }); id = t; } catch (e) { if (k === 3 || !/duplicate|unique/i.test(e.message)) throw e; } }
    await sbFetch('/rest/v1/club_members', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ uid: ON.s.uid, club: id, name: myName() }) });
    CLUB.form = false; toast(`Clube ${name} criado! Código ${id}: mande para os amigos entrarem.`, 6, 'gold'); AU.coin();
  } catch (e) { toast('Não deu para criar: ' + e.message, 4, 'bad'); }
  clubLoad(true);
}
async function clubLeave() {
  if (!confirm('Sair do clube? Seus quilos desta semana deixam de contar para ele.')) return;
  try { await sbFetch(`/rest/v1/club_members?uid=eq.${ON.s.uid}`, { method: 'DELETE' }); toast('Você saiu do clube.', 3); } catch (e) { toast('Não deu: ' + e.message, 3, 'bad'); }
  clubLoad(true);
}
// convite de um amigo online
function clubInvite(d) {
  if (!d.club || CLUB.me === d.club) return;
  const b = $('onInv'); if (!b) return;
  b.innerHTML = `<div class="n">${rkEsc(d.emb || '🐟')} ${rkEsc(d.name)} chamou você para o clube ${rkEsc(d.cname || '')}</div><div class="d">${CLUB.me ? 'Você sairá do seu clube atual. ' : ''}Os seus quilos da semana passam a somar para o clube.</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="btn alt" id="invNo">AGORA NÃO</button><button class="btn gold" id="invOk">ENTRAR</button></div>`;
  b.classList.remove('hide'); AU.coin();
  $('invNo').onclick = () => b.classList.add('hide');
  $('invOk').onclick = () => { b.classList.add('hide'); clubJoin(d.club); };
  setTimeout(() => b.classList.add('hide'), 40000);
}
function clubHTML() {
  if (!ON.s || !ON.me) return '<div class="it"><div class="d">Conectando ao servidor... Os clubes aparecem assim que entrar online.</div></div>';
  if (CLUB.me === undefined || CLUB.key !== weekKey()) { setTimeout(clubLoad, 0); return '<div class="it"><div class="d">Carregando clubes...</div></div>'; }
  if (CLUB.err === 'off') return '<div class="it"><div class="d">Os clubes ainda não foram ativados no servidor (falta rodar o arquivo <b>supabase/clubs.sql</b> no Supabase). Assim que for, esta aba funciona sozinha.</div></div>';
  let h = '';
  if (CLUB.err) h += `<div class="it"><div class="d">Não deu para carregar: ${rkEsc(CLUB.err)}</div><button class="btn" id="clRetry">TENTAR DE NOVO</button></div>`;
  const C = CLUB.info;
  if (C) {
    const tot = (CLUB.members || []).reduce((s, m) => s + m.kg, 0), pos = (CLUB.top || []).findIndex(t => t.club === C.id);
    h += `<div class="it" style="flex-direction:column;align-items:stretch;gap:6px;border-color:${C.color}"><div class="row2" style="margin:0"><div class="n" style="font-size:18px"><span style="font-size:26px">${rkEsc(C.emblem)}</span> ${rkEsc(C.name)}</div><b style="color:${C.color}">${fmtKg(tot)} kg na semana${pos >= 0 ? ` · ${pos + 1}º lugar` : ''}</b></div>
      <div class="d">Código do clube: <b style="letter-spacing:2px;font-size:15px;color:var(--ink)">${C.id}</b> · ${(CLUB.members || []).length}/20 membros. Mande o código para os amigos (Social › Clube › ENTRAR COM CÓDIGO).</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn gold" id="clCopy">COPIAR CÓDIGO</button>${ON.friends.filter(f => ON.online[f.id]).length ? '<button class="btn alt" id="clInv">CHAMAR AMIGOS ONLINE</button>' : ''}<button class="btn alt" id="clLeave">SAIR DO CLUBE</button></div></div>
      <div class="n" style="margin:12px 0 6px">Membros · quilos desta semana</div><div class="list">` +
      (CLUB.members || []).map((m, i) => `<div class="it" ${m.uid === ON.s.uid ? 'style="border-color:var(--acc)"' : ''}><span class="av" style="background:${i < 3 ? '#8a6a1a' : '#24414f'}">${i + 1}º</span><div style="flex:1"><div class="n">${rkEsc(m.name)}${m.uid === ON.s.uid ? ' <span class="d">(você)</span>' : C.owner === m.uid ? ' <span class="d">(fundador)</span>' : ''}</div></div><b>${fmtKg(m.kg)} kg</b></div>`).join('') + '</div>';
  } else if (CLUB.form) {
    h += `<div class="it" style="flex-direction:column;align-items:stretch;gap:8px"><div class="n">Criar clube</div>
      <input id="clName" maxlength="24" placeholder="Nome do clube" style="padding:10px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe;font-size:15px">
      <div class="d">Emblema</div><div style="display:flex;gap:4px;flex-wrap:wrap">${CLUB_EMB.map(e => `<button class="btn ${CLUB.emblem === e ? 'gold' : 'alt'}" data-clemb="${e}" style="min-width:44px;font-size:20px;padding:4px">${e}</button>`).join('')}</div>
      <div class="d">Cor</div><div style="display:flex;gap:6px;flex-wrap:wrap">${CLUB_COL.map(c => `<button data-clcol="${c}" style="width:34px;height:34px;border-radius:50%;background:${c};border:3px solid ${CLUB.color === c ? '#fff' : 'transparent'}"></button>`).join('')}</div>
      <div class="row2"><button class="btn alt" id="clCancel">VOLTAR</button><button class="btn gold" id="clMake">CRIAR CLUBE</button></div></div>`;
  } else {
    h += `<div class="it" style="flex-direction:column;align-items:stretch;gap:8px"><div class="n">🏴 Clubes de pesca</div><div class="d">Monte um clube com até 20 amigos. Os quilos que cada um pesca na semana somam para o clube, que disputa o ranking semanal de clubes. Zera toda segunda-feira, junto com o ranking.</div>
      <div class="row2"><button class="btn gold" id="clNew">CRIAR CLUBE</button><span style="display:flex;gap:6px"><input id="clCode" maxlength="6" placeholder="CÓDIGO" style="width:96px;padding:8px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe;text-transform:uppercase;letter-spacing:2px"><button class="btn alt" id="clJoin">ENTRAR COM CÓDIGO</button></span></div></div>`;
  }
  const T = CLUB.top || [];
  h += `<div class="n" style="margin:14px 0 6px">🏆 Ranking de clubes da semana</div><div class="list">` + (T.length ? T.map((t, i) => `<div class="it" ${C && t.club === C.id ? `style="border-color:${t.color}"` : ''}><span class="av" style="background:${t.color}33;font-size:18px">${rkEsc(t.emblem)}</span><div style="flex:1"><div class="n">${i + 1}º ${rkEsc(t.name)}</div><div class="d">${t.n} membro(s) pescando esta semana</div></div><b>${fmtKg(t.total)} kg</b></div>`).join('')
    : '<div class="it"><div class="d">Nenhum clube pescou ainda esta semana.</div></div>') + '</div>';
  return h;
}
function bindClub() {
  const q = id => $(id);
  if (q('clRetry')) q('clRetry').onclick = () => clubLoad(true);
  if (q('clNew')) q('clNew').onclick = () => { CLUB.form = true; AU.click(); renderShop(); };
  if (q('clCancel')) q('clCancel').onclick = () => { CLUB.form = false; renderShop(); };
  if (q('clMake')) q('clMake').onclick = () => clubCreate(q('clName').value);
  if (q('clJoin')) q('clJoin').onclick = () => clubJoin(q('clCode').value);
  if (q('clLeave')) q('clLeave').onclick = clubLeave;
  if (q('clCopy')) q('clCopy').onclick = async () => { const t = `Entra no meu clube "${CLUB.info.name}" no Deep Spear! Código: ${CLUB.info.id} · https://${SHARE.url}/`; try { await navigator.clipboard.writeText(t); toast('Código copiado! Mande para os amigos.', 3, 'gold'); } catch (e) { prompt('Copie o código:', CLUB.info.id); } };
  if (q('clInv')) q('clInv').onclick = () => { const on = ON.friends.filter(f => ON.online[f.id]); on.forEach(f => bcast('club_inv', { to: f.id, club: CLUB.info.id, cname: CLUB.info.name, emb: CLUB.info.emblem })); toast(`Convite enviado para ${on.length} amigo(s) online.`, 3); AU.click(); };
  document.querySelectorAll('[data-clemb]').forEach(b => b.onclick = () => { CLUB.emblem = b.dataset.clemb; const n = q('clName').value; renderShop(); q('clName').value = n; });
  document.querySelectorAll('[data-clcol]').forEach(b => b.onclick = () => { CLUB.color = b.dataset.clcol; const n = q('clName').value; renderShop(); q('clName').value = n; });
}
