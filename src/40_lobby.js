// ================= grupo (lobby): chamar amigos, escolher destino e modo, sair todo mundo junto =================
// tudo pelo canal ao vivo (broadcast) com o id do grupo; o líder é a fonte da verdade e manda o estado para todos
const LB_MAX = 4, LB_KEY = 'pescasub_lb';
const LB = { pid: null, lead: null, members: [], dest: 'cv', spot: null, mode: 'livre', chat: [], open: false, here: {}, phase: 'lobby', invites: {} };
// pontos de cada destino (nomes fixos: os pontos dos outros destinos não estão carregados)
const LB_SPOTS = {
  cv: [['botinas', 'Ilhas Botinas'], ['laje', 'Laje Branca'], ['jorge', 'Jorge Grego'], ['naufragio', 'Naufrágio'], ['aventureiro', 'Aventureiro'], ['cargueiro', 'Cargueiro'], ['fora', 'Parcel de Fora'], ['pedrameio', 'Pedra do Meio'], ['lajefunda', 'Laje Funda'], ['plataforma', 'Plataforma de Fora']],
  ne: [['arrecife', 'Arrecife da Barra'], ['cabecos', 'Cabeços'], ['naufragio_ne', 'Naufrágio do Vapor'], ['parcel_ne', 'Parcel das Paredes'], ['farol', 'Farol'], ['paredefunda', 'Paredão Fundo'], ['sueste', 'Parcel do Sueste'], ['cargueiro_ne', 'Naufrágio do Cargueiro']],
  amz: [['praia', 'Praia'], ['igapo', 'Igapó'], ['canal', 'Canal do Tapajós'], ['lago', 'Lago Verde'], ['pedral', 'Pedral'], ['pocao', 'Poção do Tapajós']],
};
const LB_DEST = { cv: 'Costa Verde', ne: 'Costa dos Corais', amz: 'Amazonas' };
const LB_MODES = [['livre', '🤿 Pesca livre', 'Todos no mesmo ponto, sem placar. Cada um vende o que pegar.'], ['desafio', '⚔️ Desafio 10 min', 'Cada um por si: ganha quem pegar mais na medida. Prêmio 1º R$ 800 · 2º R$ 350 · 3º R$ 150.'], ['dupla', '🤝 Dupla vs bots', 'Só com 2: vocês dois contra 2 duplas. Prêmio 1º R$ 1.800 para cada.']];
const LB_CHAT = ['Bora!', 'Tô pronto', '1 minuto', 'Onde vamos?', 'Partiu fundo!', 'GG'];
const lbIsLead = () => LB.pid && LB.lead === (ON.s && ON.s.uid);
const lbMe = () => ({ uid: ON.s.uid, name: myName(), lvl: level(), code: ON.me ? ON.me.code : '', region: REGION, ready: false, suit: SV.suit || 0 });
const lbSave = () => { try { sessionStorage.setItem(LB_KEY, JSON.stringify({ pid: LB.pid, lead: LB.lead, members: LB.members, dest: LB.dest, spot: LB.spot, mode: LB.mode, phase: LB.phase })); } catch (e) { } };

// ---------- criar, convidar, entrar, sair ----------
function lbCreate() {
  if (!ON.s || !ON.me) { toast('Conectando ao servidor do jogo... tente de novo em instantes.', 3); return false; }
  LB.pid = ON.s.uid.slice(0, 8) + Date.now().toString(36); LB.lead = ON.s.uid; LB.members = [lbMe()]; LB.dest = REGION; LB.spot = LB.spot || (LB_SPOTS[REGION][0][0]); LB.mode = 'livre'; LB.chat = []; LB.phase = 'lobby'; lbSave(); return true;
}
function lbState() { if (lbIsLead()) { bcast('lb_state', { pid: LB.pid, lead: LB.lead, members: LB.members, dest: LB.dest, spot: LB.spot, mode: LB.mode }); lbSave(); } }
function lbInvite(uid) {
  if (!LB.pid && !lbCreate()) return;
  if (LB.members.length >= LB_MAX) { toast('O grupo está cheio (4).', 2.5); return; }
  LB.invites[uid] = Date.now(); bcast('lb_inv', { to: uid, pid: LB.pid, lead: LB.lead, n: LB.members.length });
  toast('Convite enviado!', 2); lbRender();
}
function lbLink() {
  if (!LB.pid && !lbCreate()) return '';
  return `${location.origin}${location.pathname}?grupo=${ON.me.code}.${LB.pid}`;
}
async function lbShare() {
  const url = lbLink(); if (!url) return;
  const txt = `Bora mergulhar comigo no Deep Spear? Entra no meu grupo: ${url}`;
  try { if (navigator.share) { await navigator.share({ title: 'Deep Spear', text: txt }); return; } } catch (e) { }
  try { await navigator.clipboard.writeText(txt); toast('Link do grupo copiado! Mande no WhatsApp.', 3, 'gold'); } catch (e) { toast(url, 8); }
}
function lbJoin(pid, lead) {
  if (LB.pid && LB.pid !== pid) lbLeave(true);
  LB.pid = pid; LB.lead = lead; LB.members = []; LB.phase = 'lobby'; LB.chat = [];
  bcast('lb_join', { pid, me: lbMe() }); lbSave(); lbOpen();
}
function lbLeave(quiet) {
  if (!LB.pid) return;
  bcast('lb_leave', { pid: LB.pid });
  if (!quiet) toast('Você saiu do grupo.', 2);
  LB.pid = null; LB.lead = null; LB.members = []; LB.chat = []; LB.phase = 'lobby'; try { sessionStorage.removeItem(LB_KEY); } catch (e) { } lbRender();
}
// amigo silencioso: membros do grupo viram amigos para se verem no mar
async function lbBefriend(m) {
  if (!m.code || isFriend(m.uid) || m.uid === ON.s.uid) return;
  try { await sbFetch('/rest/v1/friendships', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ owner: ON.s.uid, friend: m.uid }) }); } catch (e) { }
  if (!isFriend(m.uid)) ON.friends.push({ id: m.uid, name: m.name, code: m.code, level: m.lvl || 1 });
}

// ---------- mensagens do grupo ----------
function lobbyMsg(ev, d) {
  if (ev === 'lb_inv') { lbInviteBox(d); return true; }
  if (!LB.pid || d.pid !== LB.pid) return ev.startsWith('lb_');
  const lead = lbIsLead();
  if (ev === 'lb_join' && lead) {
    if (LB.members.length >= LB_MAX) { bcast('lb_full', { to: d.from, pid: LB.pid }); return true; }
    if (!LB.members.some(m => m.uid === d.from)) { LB.members.push({ ...d.me, ready: false }); lbChatAdd('', `${d.me.name} entrou no grupo.`); AU.coin(); }
    lbBefriend(d.me); lbState(); lbRender(); return true;
  }
  if (ev === 'lb_full') { toast('O grupo já está cheio.', 3, 'bad'); LB.pid = null; lbRender(); return true; }
  if (ev === 'lb_state' && !lead) {
    const was = LB.members.length; LB.lead = d.lead; LB.members = d.members; LB.dest = d.dest; LB.spot = d.spot; LB.mode = d.mode; lbSave();
    LB.members.forEach(lbBefriend); if (!was) toast('Você entrou no grupo!', 2.5, 'gold'); lbRender(); return true;
  }
  if (ev === 'lb_ready' && lead) { const m = LB.members.find(m => m.uid === d.from); if (m) { m.ready = !!d.ready; lbState(); lbRender(); } return true; }
  if (ev === 'lb_chat') { lbChatAdd(d.name, d.msg); return true; }
  if (ev === 'lb_leave') {
    if (d.from === LB.lead && !lead) { toast('O líder desfez o grupo.', 3); LB.pid = null; LB.members = []; try { sessionStorage.removeItem(LB_KEY); } catch (e) { } lbRender(); return true; }
    if (lead) { const m = LB.members.find(m => m.uid === d.from); LB.members = LB.members.filter(m => m.uid !== d.from); if (m) lbChatAdd('', `${m.name} saiu do grupo.`); lbState(); lbRender(); }
    return true;
  }
  if (ev === 'lb_go') { lbGo(d); return true; }
  if (ev === 'lb_here' && lead) { LB.here[d.from] = 1; lbCheckAll(); return true; }
  if (ev === 'lb_start') { lbStart(d.at); return true; }
  if (ev === 'chal_sc' && COMP.on && COMP.lobby) { const l = COMP.lives.find(l => l.uid === d.from); if (l) { l.n = d.n; l.kg = d.kg; if (d.last) toast(`${d.name} pegou ${d.last}`, 2.2); } return true; }
  return false;
}
function lbChatAdd(name, msg) { LB.chat.push({ name, msg, t: Date.now() }); LB.chat = LB.chat.slice(-5); if (name && !LB.open && started) toast(`💬 ${name}: ${msg}`, 2.5); lbRender(); }
function lbInviteBox(d) {
  const b = $('onInv'); if (!b) return;
  b.innerHTML = `<div class="n">👥 ${d.name} te chamou para o grupo!</div><div class="d">${d.n} no grupo agora. Vocês escolhem destino e modo juntos e saem ao mesmo tempo.</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="btn alt" id="invNo">AGORA NÃO</button><button class="btn gold" id="invOk">ENTRAR</button></div>`;
  b.classList.remove('hide'); buzz([60, 40, 60]); AU.coin();
  $('invNo').onclick = () => b.classList.add('hide');
  $('invOk').onclick = () => { b.classList.add('hide'); lbJoin(d.pid, d.lead); };
  setTimeout(() => b.classList.add('hide'), 40000);
}

// ---------- saída: todos para o mesmo destino e ponto ----------
function lbLaunch() {
  if (!lbIsLead()) return;
  const others = LB.members.filter(m => m.uid !== LB.lead);
  if (LB.mode !== 'livre' && !others.length) { toast('Chame pelo menos um amigo para esse modo.', 3, 'bad'); return; }
  if (LB.mode === 'dupla' && others.length !== 1) { toast('Dupla vs bots é só com 2 jogadores.', 3, 'bad'); return; }
  if (others.some(m => !m.ready)) { toast('Ainda tem gente que não marcou PRONTO.', 3, 'bad'); return; }
  const d = { pid: LB.pid, dest: LB.dest, spot: LB.spot, mode: LB.mode, members: LB.members, lead: LB.lead };
  bcast('lb_go', d); lbGo({ ...d, from: ON.s.uid });
}
function lbGo(d) {
  LB.dest = d.dest; LB.spot = d.spot; LB.mode = d.mode; LB.members = d.members; LB.lead = d.lead; LB.phase = 'go'; LB.here = {}; lbSave();
  if (d.dest !== REGION) {
    // viagem do grupo é de graça (sem liberar o destino para sempre)
    if (P.stringer.length) { SV.cooler.push(...P.stringer); P.stringer = []; }
    SV.region = d.dest; SV.dest = d.spot; SV.tod = 7; SV.fuel = Math.max(SV.fuel, 40); save(); SAVE_LOCK = true;
    $('black').style.opacity = 1; toast(`Viajando com o grupo para ${LB_DEST[d.dest]}...`, 3); setTimeout(() => location.reload(), 900); return;
  }
  lbArrived();
}
// chegou no destino certo (direto ou depois de recarregar): avisa o líder
function lbArrived() {
  LB.phase = 'arrived'; lbSave(); lbClose();
  if (!started) startGame();
  SV.dest = LB.spot; save();
  if (lbIsLead()) { LB.here[ON.s.uid] = 1; lbCheckAll(); toast('Esperando o grupo chegar...', 3); setTimeout(() => { if (LB.phase === 'arrived') lbCheckAll(true); }, 45000); }
  else { const send = () => bcast('lb_here', { pid: LB.pid }); send(); setTimeout(send, 3000); setTimeout(send, 8000); toast('Chegando... esperando o líder dar a largada.', 3); }
}
function lbCheckAll(force) {
  if (!lbIsLead() || LB.phase !== 'arrived') return;
  const n = LB.members.filter(m => LB.here[m.uid]).length;
  if (n < LB.members.length && !force) { toast(`Grupo chegando: ${n}/${LB.members.length}`, 2); return; }
  const at = Date.now() + 5000; bcast('lb_start', { pid: LB.pid, at }); lbStart(at);
}
function lbStart(at) {
  if (LB.phase === 'play') return; LB.phase = 'play'; lbSave();
  const S = spotById(LB.spot) || SPOTS.find(s => s.r), others = LB.members.filter(m => m.uid !== ON.s.uid), idx = LB.members.findIndex(m => m.uid === ON.s.uid);
  closePanels(); toast(`Grupo reunido na ${S.name}! Largada em 5 s.`, 4, 'gold');
  setTimeout(() => {
    if (LB.mode === 'livre') {
      // lanchas lado a lado em volta do ponto
      const a = idx / Math.max(1, LB.members.length) * TAU; if (P.mode === 'swim') climbBoat();
      BOAT.pos.set(S.x + Math.cos(a) * 16, 0, S.z + Math.sin(a) * 16); BOAT.speed = 0; if (BOAT.vel) BOAT.vel.set(0, 0, 0); BOAT.anchored = false; toggleAnchor();
      toast('Pesca livre com o grupo: cada um vende o que pegar. Boa pescaria!', 4, 'gold');
    } else if (LB.mode === 'desafio') startComp(S.id, null, others.map(m => ({ uid: m.uid, name: m.name })));
    else if (LB.mode === 'dupla') { const o = others[0]; if (lbIsLead()) startDuoHost(S.id, o.uid, o.name, Date.now()); else startDuoGuest(S.id, LB.lead, (LB.members.find(m => m.uid === LB.lead) || {}).name || 'Líder', Date.now()); }
    LB.phase = 'lobby'; lbSave();
  }, Math.max(0, at - Date.now()));
}

// ---------- tela ----------
function lbOpen() {
  if (!ON.s || !ON.me) { toast('Conectando ao servidor do jogo... tente de novo em instantes.', 3); return; }
  if (!LB.pid) lbCreate();
  LB.open = true; $('lobby').classList.remove('hide'); if (started) paused = true; lbRender();
}
function lbClose() { LB.open = false; $('lobby').classList.add('hide'); if (started && $('mapPanel').classList.contains('hide') && $('marinaPanel').classList.contains('hide')) paused = false; }
const lbEsc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LB_COLS = ['#2a8a7a', '#8a5a2a', '#5a3a8a', '#8a2a4a'];
function lbRender() {
  const el = $('lobbyBody'); if (!el || !LB.open) return;
  const lead = lbIsLead(), me = ON.s && ON.s.uid, mine = LB.members.find(m => m.uid === me);
  const slot = (m, i) => m ? `<div class="lbs ${m.ready || m.uid === LB.lead ? 'ok' : ''}"><span class="av" style="background:${LB_COLS[i]}">${lbEsc(m.name[0])}</span><div style="flex:1;min-width:0"><div class="n">${m.uid === LB.lead ? '👑 ' : ''}${lbEsc(m.name)}${m.uid === me ? ' <span class="d">(você)</span>' : ''}</div><div class="d">Nv ${m.lvl || 1} · ${LB_DEST[m.region] || ''}</div></div><b class="st">${m.uid === LB.lead ? 'LÍDER' : m.ready ? 'PRONTO' : 'ESPERANDO'}</b></div>`
    : `<div class="lbs empty"><span class="av" style="background:rgba(255,255,255,.06)">+</span><div class="d">Vaga livre: convide um amigo</div></div>`;
  const slots = [0, 1, 2, 3].map(i => slot(LB.members[i], i)).join('');
  const seg = (k, opts, dis) => opts.map(([v, n]) => `<button class="btn ${LB[k] === v ? 'gold' : 'alt'}" data-lb="${k}" data-v="${v}" ${dis ? 'disabled' : ''}>${n}</button>`).join('');
  const online = ON.friends.filter(f => ON.online[f.id] && !LB.members.some(m => m.uid === f.id));
  const modeInfo = (LB_MODES.find(m => m[0] === LB.mode) || LB_MODES[0])[2];
  el.innerHTML = `
    <div class="lbgrid">${slots}</div>
    <div class="lbcols">
      <div class="lbcol">
        <div class="lbh">Destino ${lead ? '' : '<span class="d">(o líder escolhe)</span>'}</div>
        <div class="lbseg">${seg('dest', Object.entries(LB_DEST), !lead)}</div>
        <div class="lbh">Ponto</div>
        <select id="lbSpot" ${lead ? '' : 'disabled'}>${LB_SPOTS[LB.dest].map(([id, n]) => `<option value="${id}" ${id === LB.spot ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <div class="lbh">Modo</div>
        <div class="lbseg">${seg('mode', LB_MODES.map(m => [m[0], m[1]]), !lead)}</div>
        <div class="d" style="margin-top:4px">${modeInfo}${LB.dest !== REGION ? ` · Quem não estiver em ${LB_DEST[LB.dest]} viaja de graça com o grupo.` : ''}</div>
      </div>
      <div class="lbcol">
        <div class="lbh">Convidar</div>
        <button class="btn gold" id="lbShare" style="width:100%">📲 MANDAR LINK DO GRUPO (WhatsApp)</button>
        <div class="list" style="margin-top:6px">${online.length ? online.map(f => `<div class="it"><div><div class="n">${lbEsc(f.name)}</div><div class="d">🟢 online · Nv ${f.level || 1}</div></div><button class="btn" data-lbinv="${f.id}" ${LB.invites[f.id] && Date.now() - LB.invites[f.id] < 30000 ? 'disabled' : ''}>${LB.invites[f.id] && Date.now() - LB.invites[f.id] < 30000 ? 'ENVIADO' : 'CONVIDAR'}</button></div>`).join('') : '<div class="it"><div class="d">Nenhum amigo online agora. Mande o link: quem tocar entra direto no grupo.</div></div>'}</div>
        <div class="lbh">Conversa</div>
        <div class="lbchat">${LB.chat.length ? LB.chat.map(c => `<div>${c.name ? `<b>${lbEsc(c.name)}:</b> ` : '<i>'}${lbEsc(c.msg)}${c.name ? '' : '</i>'}</div>`).join('') : '<div class="d">Mensagens rápidas aparecem aqui.</div>'}</div>
        <div class="lbseg" style="margin-top:6px">${LB_CHAT.map(t => `<button class="btn alt" data-lbchat="${t}">${t}</button>`).join('')}</div>
      </div>
    </div>
    <div class="row2">
      <button class="btn alt" id="lbLeave">${LB.members.length > 1 ? 'SAIR DO GRUPO' : 'FECHAR'}</button>
      <div style="display:flex;gap:8px">
        ${lead ? `<button class="btn gold play" id="lbGo">INICIAR ▶</button>` : `<button class="btn ${mine && mine.ready ? 'alt' : 'gold'} play" id="lbReady">${mine && mine.ready ? 'NÃO ESTOU PRONTO' : 'ESTOU PRONTO ✔'}</button>`}
      </div>
    </div>`;
  el.querySelectorAll('[data-lb]').forEach(b => b.onclick = () => { const k = b.dataset.lb; LB[k] = b.dataset.v; if (k === 'dest') LB.spot = LB_SPOTS[LB.dest][0][0]; AU.click(); lbState(); lbRender(); });
  const sp = $('lbSpot'); if (sp) sp.onchange = () => { LB.spot = sp.value; lbState(); lbRender(); };
  el.querySelectorAll('[data-lbinv]').forEach(b => b.onclick = () => lbInvite(b.dataset.lbinv));
  el.querySelectorAll('[data-lbchat]').forEach(b => b.onclick = () => { bcast('lb_chat', { pid: LB.pid, msg: b.dataset.lbchat }); lbChatAdd(myName(), b.dataset.lbchat); AU.click(); });
  $('lbShare').onclick = lbShare;
  $('lbLeave').onclick = () => { if (LB.members.length > 1) lbLeave(); lbClose(); };
  if ($('lbGo')) $('lbGo').onclick = lbLaunch;
  if ($('lbReady')) $('lbReady').onclick = () => { if (mine) mine.ready = !mine.ready; bcast('lb_ready', { pid: LB.pid, ready: mine && mine.ready }); AU.click(); lbRender(); };
}
function setupLobby() {
  const el = document.createElement('div'); el.id = 'lobby'; el.className = 'panel hide'; el.style.zIndex = 40;
  el.innerHTML = `<div class="card lbcard"><h2>👥 Grupo</h2><div class="sub">Até 4 jogadores. Chame os amigos, escolham destino e modo, e saiam juntos.</div><div id="lobbyBody"></div></div>`;
  document.body.appendChild(el);
  // botão no menu inicial, ao lado de JOGAR
  const pb = $('playBtn'); if (pb) { const b = document.createElement('button'); b.className = 'btn alt play'; b.id = 'grpBtn'; b.textContent = '👥 GRUPO'; b.style.marginLeft = '8px'; b.onclick = () => { AU.init(); lbOpen(); }; pb.after(b); }
  // volta de uma viagem do grupo, ou chegada por link de convite
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem(LB_KEY) || 'null'); } catch (e) { }
  const q = new URLSearchParams(location.search).get('grupo');
  const wait = fn => { const t0 = Date.now(), iv = setInterval(() => { if (ON.joined && ON.me) { clearInterval(iv); fn(); } else if (Date.now() - t0 > 120000) clearInterval(iv); }, 150); };
  if (saved && saved.pid) { Object.assign(LB, saved); if (LB.phase === 'go') wait(() => lbArrived()); }
  if (q) {
    try { history.replaceState(null, '', location.pathname); } catch (e) { }
    const [code, pid] = q.split('.');
    // abre a tela do grupo na hora, mostrando que está entrando, enquanto a conexão termina
    LB.open = true; el.classList.remove('hide');
    $('lobbyBody').innerHTML = `<div class="it" style="justify-content:center;padding:28px"><div style="text-align:center"><div class="n">Entrando no grupo do amigo...</div><div class="d">Conectando ao servidor do jogo. Leva só alguns segundos.</div></div></div>`;
    wait(async () => {
      try {
        const p = await sbFetch(`/rest/v1/profiles?code=eq.${code}&select=id,name,code,level`); if (!p || !p.length) { toast('Convite de grupo inválido.', 3, 'bad'); lbClose(); return; }
        if (p[0].id === ON.s.uid) { lbOpen(); return; }
        await lbBefriend({ uid: p[0].id, name: p[0].name, code: p[0].code, lvl: p[0].level }); bcast('hello', { to: p[0].id, lvl: level() });
        lbJoin(pid, p[0].id);
      } catch (e) { toast('Não deu para entrar no grupo: ' + e.message, 3, 'bad'); lbClose(); }
    });
  }
}
