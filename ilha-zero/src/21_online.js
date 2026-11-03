// ================= online (Supabase, o mesmo do Deep Spear): conta, amigos, esquadrão com convite e partida em grupo =================
// A conta é a mesma do jogo de pesca (mesmo site): mesmo código de amigo e mesmos amigos.
const SB = { url: 'https://jtyvqvlruwbryhkrdkaq.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXZxdmxydXdicnloa3Jka2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDI0NDksImV4cCI6MjEwODc3ODQ0OX0.rDC7mcJM7xBVIZcjUWZoaXHM09igXHmU2SAkeE9A3pc' };
const SESS_KEY = 'pescasub_sb';
const ON = { s: null, me: null, friends: [], online: {}, ws: null, ref: 0, joined: {}, err: '', starting: false, hb: null, inv: null };
G.net = { on: false, host: false, uid: null, uid8: 'x', mute: false, applying: false, last: {}, sendT: 0, shots: [], zoneT: 0, hostSeen: 0 };

// ---------- REST e login ----------
async function sbFetch(path, opt = {}) {
  const h = { apikey: SB.key, 'Content-Type': 'application/json', ...(opt.headers || {}) };
  if (ON.s && !opt.noAuth) h.Authorization = 'Bearer ' + ON.s.access_token;
  const r = await fetch(SB.url + path, { ...opt, headers: h });
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { }
  if (!r.ok) throw new Error((j && (j.message || j.msg || j.error_description)) || ('HTTP ' + r.status));
  return j;
}
function keepSess(j) { ON.s = { access_token: j.access_token, refresh_token: j.refresh_token, exp: Date.now() / 1000 + (j.expires_in || 3600), uid: j.user.id }; try { localStorage.setItem(SESS_KEY, JSON.stringify(ON.s)); } catch (e) { } }
async function sbAuth() {
  try { ON.s = JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); } catch (e) { ON.s = null; }
  if (ON.s && ON.s.exp - 120 > Date.now() / 1000) return;
  if (ON.s && ON.s.refresh_token) { try { keepSess(await sbFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', noAuth: true, body: JSON.stringify({ refresh_token: ON.s.refresh_token }) })); return; } catch (e) { } }
  keepSess(await sbFetch('/auth/v1/signup', { method: 'POST', noAuth: true, body: '{}' }));
}
const newCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)]; return c; };
const myName = () => (SET.name || 'Jogador').slice(0, 14);
async function onlineStart() {
  if (ON.starting || ON.me) return; ON.starting = true;
  if (!navigator.onLine) { ON.err = 'Sem internet'; ON.starting = false; return; }
  try {
    await sbAuth();
    G.net.uid = ON.s.uid; G.net.uid8 = ON.s.uid.slice(0, 6);
    wsConnect();
    const p = await sbFetch(`/rest/v1/profiles?id=eq.${ON.s.uid}&select=*`);
    if (p && p.length) ON.me = p[0];
    else for (let k = 0; k < 4 && !ON.me; k++) { try { ON.me = (await sbFetch('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id: ON.s.uid, name: myName(), code: newCode(), level: 1 }) }))[0]; } catch (e) { if (k === 3) throw e; } }
    ON.err = ''; await loadFriends(); cloudLoad();
    setInterval(() => { sbRefresh(); loadFriends(); wsTrack(); }, 25000);
    checkJoinLink();
  } catch (e) { ON.err = 'Sem conexão: ' + e.message; }
  ON.starting = false; if (G.phase === 'lobby') renderLobby();
}
async function sbRefresh() { if (!ON.s || ON.s.exp - 300 > Date.now() / 1000) return; try { await sbAuth(); for (const t in ON.joined) wsSend(t, 'access_token', { access_token: ON.s.access_token }); } catch (e) { } }
async function loadFriends() {
  if (!ON.s) return;
  try {
    const fs = await sbFetch('/rest/v1/friendships?select=owner,friend');
    const ids = [...new Set((fs || []).map(f => f.owner === ON.s.uid ? f.friend : f.owner))];
    ON.friends = ids.length ? await sbFetch(`/rest/v1/profiles?id=in.(${ids.join(',')})&select=id,name,code,level`) : [];
  } catch (e) { }
}
async function addFriendCode(code) {
  code = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) { toast('O código tem 6 letras/números.', 2.5, 'bad'); return; }
  if (ON.me && code === ON.me.code) { toast('Esse é o seu próprio código.', 2.5, 'bad'); return; }
  try {
    const p = await sbFetch(`/rest/v1/profiles?code=eq.${code}&select=id,name,code,level`);
    if (!p || !p.length) { toast('Nenhum jogador com esse código.', 2.5, 'bad'); return; }
    if (ON.friends.some(f => f.id === p[0].id)) { toast(`${p[0].name} já é seu amigo.`, 2.5); return; }
    await sbFetch('/rest/v1/friendships', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ owner: ON.s.uid, friend: p[0].id }) });
    ON.friends.push(p[0]); toast(`${p[0].name} agora é seu amigo!`, 3, 'gold');
    gSend('hello', { to: p[0].id });
  } catch (e) { toast('Não deu para adicionar: ' + e.message, 3, 'bad'); }
  renderFriends();
}
async function renameOnline() { if (!ON.me || ON.me.name === myName()) return; ON.me.name = myName(); try { await sbFetch(`/rest/v1/profiles?id=eq.${ON.s.uid}`, { method: 'PATCH', body: JSON.stringify({ name: myName() }) }); } catch (e) { } wsTrack(); }

// ---------- progresso na nuvem (se a tabela iz_saves existir; senão fica só no aparelho) ----------
const CLOUD_K = ['name', 'char', 'sens', 'adsSens', 'quality', 'view', 'vol', 'mode', 'diff', 'matches', 'wins', 'kills', 'best', 'dmg'];
let cloudOk = false, cloudT = 0;
async function cloudLoad() {
  try {
    const r = await sbFetch(`/rest/v1/iz_saves?id=eq.${ON.s.uid}&select=data`); cloudOk = true;
    const d = r && r[0] && r[0].data;
    if (d) { // junta: fica o maior número de partidas/vitórias/abates
      for (const k of ['matches', 'wins', 'kills', 'dmg']) SET[k] = Math.max(SET[k] || 0, d[k] || 0);
      if (d.best && (!SET.best || d.best < SET.best)) SET.best = d.best;
      if (!SET.nameSet && d.name) SET.name = d.name;
      saveSet(false); if (G.phase === 'lobby') renderLobby();
    }
    cloudPush();
  } catch (e) { cloudOk = false; }
}
function cloudPush() {
  if (!cloudOk || !ON.s) return; clearTimeout(cloudT);
  cloudT = setTimeout(() => { const data = {}; for (const k of CLOUD_K) data[k] = SET[k]; sbFetch('/rest/v1/iz_saves', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: ON.s.uid, data, updated_at: new Date().toISOString() }) }).catch(() => { }); }, 2500);
}

// ---------- canal ao vivo (Supabase Realtime) ----------
const GTOP = 'realtime:ilhazero';
let joinRef = 0;
function wsSend(topic, event, payload) { const ws = ON.ws; if (ws && ws.readyState === 1) ws.send(JSON.stringify({ topic, event, payload, ref: String(++ON.ref), join_ref: ON.joined[topic] || '1' })); }
function wsJoin(topic, presence) {
  const jr = String(++joinRef); ON.joined[topic] = jr;
  const ws = ON.ws; if (!ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ topic, event: 'phx_join', ref: jr, join_ref: jr, payload: { config: { broadcast: { self: false, ack: false }, presence: { key: presence ? ON.s.uid : '' }, private: false }, access_token: ON.s.access_token } }));
}
function wsLeave(topic) { if (!ON.joined[topic]) return; wsSend(topic, 'phx_leave', {}); delete ON.joined[topic]; }
function wsConnect() {
  if (ON.ws) return;
  let ws; try { ws = new WebSocket(`${SB.url.replace('https', 'wss')}/realtime/v1/websocket?apikey=${SB.key}&vsn=1.0.0`); } catch (e) { return; }
  ON.ws = ws;
  ws.onopen = () => {
    const tops = Object.keys(ON.joined); ON.joined = {};
    wsJoin(GTOP, true); for (const t of tops) if (t !== GTOP) wsJoin(t, false);
    clearInterval(ON.hb); ON.hb = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ON.ref) })); }, 25000);
    setTimeout(wsTrack, 600);
  };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } wsMsg(m); };
  ws.onclose = () => { if (ON.ws !== ws) return; ON.ws = null; clearInterval(ON.hb); setTimeout(() => { if (ON.s && !ON.ws) wsConnect(); }, 3000); };
  ws.onerror = () => { };
}
function wsTrack() { if (!ON.joined[GTOP] || !ON.s) return; wsSend(GTOP, 'presence', { type: 'presence', event: 'track', payload: { uid: ON.s.uid, name: myName(), st: G.phase === 'match' ? 'jogando' : 'lobby' } }); }
const gSend = (ev, d) => wsSend(GTOP, 'broadcast', { type: 'broadcast', event: ev, payload: { ...d, from: ON.s && ON.s.uid, name: myName() } });
function presenceMeta(state, fn) { for (const k in state) { const m = state[k] && state[k].metas && state[k].metas[0]; if (m) fn(k, m); } }
function wsMsg(m) {
  if (m.topic === GTOP) {
    if (m.event === 'presence_state') { ON.online = {}; presenceMeta(m.payload, (k, v) => { if (k !== ON.s.uid) ON.online[k] = v; }); renderFriends(); return; }
    if (m.event === 'presence_diff') { presenceMeta(m.payload.joins || {}, (k, v) => { if (k !== ON.s.uid) ON.online[k] = v; }); presenceMeta(m.payload.leaves || {}, k => delete ON.online[k]); renderFriends(); return; }
  }
  if (m.event !== 'broadcast' || !m.payload) return;
  const ev = m.payload.event, d = m.payload.payload || {};
  if (!d.from || d.from === (ON.s && ON.s.uid)) return;
  if (d.to && d.to !== ON.s.uid) return;
  if (m.topic === GTOP) return globalMsg(ev, d);
  if (PARTY.pid && m.topic === partyTop()) return partyMsg(ev, d);
}
function globalMsg(ev, d) {
  if (ev === 'hello') { if (!ON.friends.some(f => f.id === d.from)) loadFriends().then(renderFriends); toast(`${d.name} adicionou você como amigo!`, 3, 'gold'); }
  if (ev === 'p_inv') { ON.inv = d; showInvite(d); }
  if (ev === 'p_join_req' && PARTY.pid === d.pid && partyLead()) partyAccept(d);
}

// ---------- esquadrão (lobby com amigos) ----------
const PARTY = { pid: null, lead: null, members: [], mode: null, diff: null, inMatch: false };
const partyTop = () => 'realtime:iz-' + PARTY.pid;
const partyLead = () => PARTY.pid && PARTY.lead === (ON.s && ON.s.uid);
const pSend = (ev, d) => PARTY.pid && wsSend(partyTop(), 'broadcast', { type: 'broadcast', event: ev, payload: { ...d, from: ON.s.uid } });
const meMember = () => ({ uid: ON.s.uid, name: myName(), char: SET.char });
function partyCreate() {
  if (!ON.s || !ON.me) { toast('Conectando ao servidor... tente em instantes.', 2.5); return false; }
  if (PARTY.pid) return true;
  PARTY.pid = ON.s.uid.slice(0, 8) + Date.now().toString(36); PARTY.lead = ON.s.uid; PARTY.members = [meMember()];
  wsJoin(partyTop(), false); return true;
}
function partyState() { if (partyLead()) { pSend('p_state', { members: PARTY.members, mode: G.mode, diff: G.diff, lead: PARTY.lead }); renderLobby(); } }
function partyInvite(uid) {
  if (!partyCreate()) return;
  if (PARTY.members.length >= 4) { toast('O esquadrão está cheio (4).', 2.5); return; }
  gSend('p_inv', { to: uid, pid: PARTY.pid, lead: PARTY.lead }); toast('Convite enviado!', 2);
}
function partyLink() { if (!partyCreate()) return ''; return `${location.origin}${location.pathname}?sala=${PARTY.pid}.${PARTY.lead}`; }
async function partyShare() {
  const url = partyLink(); if (!url) return;
  const txt = `Bora jogar Ilha Zero no meu esquadrão? ${url}`;
  try { if (navigator.share) { await navigator.share({ title: 'Ilha Zero', text: txt }); return; } } catch (e) { }
  try { await navigator.clipboard.writeText(txt); toast('Link copiado! Mande no WhatsApp.', 3, 'gold'); } catch (e) { toast(url, 8); }
}
function partyJoin(pid, lead) {
  if (PARTY.pid === pid) return;
  if (PARTY.pid) partyLeave(true);
  PARTY.pid = pid; PARTY.lead = lead; PARTY.members = []; wsJoin(partyTop(), false);
  // o líder pode demorar a ver: repete o pedido até entrar
  const t0 = Date.now(); clearInterval(PARTY.joinIv);
  const ask = () => { if (PARTY.pid !== pid || PARTY.members.some(m => m.uid === ON.s.uid)) { clearInterval(PARTY.joinIv); return; } if (Date.now() - t0 > 90000) { clearInterval(PARTY.joinIv); toast('O líder não respondeu.', 4, 'bad'); partyLeave(true); return; } gSend('p_join_req', { to: lead, pid, me: meMember() }); };
  setTimeout(ask, 700); PARTY.joinIv = setInterval(ask, 3000);
  toast('Entrando no esquadrão...', 2); renderLobby();
}
function partyAccept(d) {
  if (PARTY.members.some(m => m.uid === d.from)) { partyState(); return; }
  if (PARTY.members.length >= 4) return;
  PARTY.members.push(d.me); toast(`${d.me.name} entrou no esquadrão!`, 2.5, 'gold');
  const sizeNow = { solo: 1, duo: 2, trio: 3, squad: 4 }[G.mode];
  if (PARTY.members.length > sizeNow) { G.mode = PARTY.members.length <= 2 ? 'duo' : PARTY.members.length === 3 ? 'trio' : 'squad'; SET.mode = G.mode; saveSet(); }
  partyState(); if (G.phase === 'lobby') { lobbyActors(); renderLobby(); }
}
function partyLeave(quiet) {
  if (!PARTY.pid) return;
  pSend('p_leave', {}); wsLeave(partyTop());
  PARTY.pid = null; PARTY.lead = null; PARTY.members = []; if (!quiet) toast('Você saiu do esquadrão.', 2);
  if (G.phase === 'lobby') { lobbyActors(); renderLobby(); }
}
function partyMsg(ev, d) {
  if (ev === 'p_state' && d.from === PARTY.lead) {
    PARTY.members = d.members; G.mode = d.mode; G.diff = d.diff; clearInterval(PARTY.joinIv);
    if (!d.members.some(m => m.uid === ON.s.uid)) { partyLeave(true); return; }
    if (G.phase === 'lobby') { lobbyActors(); renderLobby(); }
    return;
  }
  if (ev === 'p_leave') {
    if (d.from === PARTY.lead) { toast('O líder saiu do esquadrão.', 3, 'bad'); if (G.phase === 'match' && G.net.on) netAbort('O líder saiu da partida.'); partyLeave(true); return; }
    PARTY.members = PARTY.members.filter(m => m.uid !== d.from); if (G.net.on) netPeerGone(d.from); partyState(); return;
  }
  if (ev === 'p_char' && partyLead()) { const m = PARTY.members.find(x => x.uid === d.from); if (m) { m.char = d.char; m.name = d.name; partyState(); } return; }
  if (ev === 'p_start' && d.from === PARTY.lead) { netStart(d); return; }
  if (G.net.on) netMsg(ev, d);
}
function showInvite(d) {
  const el = $('invP'); el.classList.remove('hidden');
  el.innerHTML = `<div class="box"><h3>Convite</h3><p><b>${(d.name || 'Um amigo').replace(/</g, '')}</b> chamou você para o esquadrão.</p><div class="row"><button class="btn" id="invOk">ENTRAR</button><button class="btn alt" id="invNo">AGORA NÃO</button></div></div>`;
  $('invOk').onclick = () => { el.classList.add('hidden'); if (G.phase === 'match') toLobby(); partyJoin(d.pid, d.lead); };
  $('invNo').onclick = () => el.classList.add('hidden');
}
function checkJoinLink() {
  const q = new URLSearchParams(location.search).get('sala'); if (!q) return;
  const [pid, lead] = q.split('.'); history.replaceState(null, '', location.pathname);
  if (pid && lead && lead !== ON.s.uid) partyJoin(pid, lead);
}
// painel de amigos (lobby)
function openFriends() { $('frP').classList.remove('hidden'); renderFriends(); }
function renderFriends() {
  const el = $('frP'); if (!el || el.classList.contains('hidden')) return;
  const fr = ON.friends.slice().sort((a, b) => (!!ON.online[b.id]) - (!!ON.online[a.id]));
  el.innerHTML = `<div class="box wide"><h3>Amigos e esquadrão</h3>
    ${ON.me ? `<div class="mycode">Seu código: <b>${ON.me.code}</b> <small>(o mesmo do Deep Spear)</small></div>` : `<div class="mycode">${ON.err || 'Conectando...'}</div>`}
    <div class="row"><input id="frCode" maxlength="8" placeholder="Código do amigo"><button class="btn" id="frAdd">ADICIONAR</button></div>
    <div class="row"><button class="btn alt" id="frLink">📲 CONVIDAR PELO WHATSAPP</button></div>
    <div class="flist">${fr.length ? fr.map(f => { const on = ON.online[f.id], inP = PARTY.members.some(m => m.uid === f.id);
      return `<div class="fi"><span>${on ? '🟢' : '⚪'} <b>${(f.name || '').replace(/</g, '')}</b> <small>${on ? on.st || 'online' : 'offline'}</small></span>${inP ? '<small>no esquadrão</small>' : on ? `<button class="btn" data-inv="${f.id}">CONVIDAR</button>` : ''}</div>`; }).join('') : '<div class="fi"><small>Nenhum amigo ainda. Mande o seu código ou o link.</small></div>'}</div>
    <div class="row">${PARTY.pid ? '<button class="btn red" id="frLeave">SAIR DO ESQUADRÃO</button>' : ''}<button class="btn alt" id="frX">FECHAR</button></div></div>`;
  $('frAdd').onclick = () => addFriendCode($('frCode').value);
  $('frLink').onclick = partyShare; $('frX').onclick = () => el.classList.add('hidden');
  if ($('frLeave')) $('frLeave').onclick = () => { partyLeave(); renderFriends(); };
  el.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => partyInvite(b.dataset.inv));
}

// ================= partida em grupo =================
// O líder simula o mundo (bots, zona, saque, drop, veículos sem motorista humano). Cada jogador simula o próprio personagem.
// Dano em quem é de outro aparelho é enviado para o dono aplicar.
const ST = ['stand', 'crouch', 'prone'], MD = ['plane', 'fall', 'chute', 'ground'];
function netSend(ev, d) { if (G.net.on) pSend(ev, d); }
function netItem(it) { if (G.net.on && !G.net.applying) netSend('it', { id: it.id, n: it.n }); }
function netCrate(c) { if (G.net.on && !G.net.applying && c.id) netSend('cr', { id: c.id, items: c.items.map(e => ({ k: e.k, n: e.n, w: e.w })) }); }
function leaderStart() {
  if (!partyLead()) return false;
  const seed = 1 + Math.floor(Math.random() * 2e9);
  const d = { seed, mode: G.mode, diff: G.diff, members: PARTY.members };
  pSend('p_start', d); netStart(Object.assign({ from: ON.s.uid }, d));
  return true;
}
function netStart(d) {
  G.mode = d.mode; G.diff = d.diff;
  G.net.on = true; G.net.host = d.from === ON.s.uid; G.net.hostUid = d.from; G.net.last = {}; G.net.hostSeen = performance.now(); G.net.peerSeen = {};
  for (const a of LOB.actors) removeModel(a); LOB.actors = [];
  $('lobby').classList.add('hidden'); $('result').classList.add('hidden'); $('hud').classList.remove('hidden'); $('frP').classList.add('hidden');
  buildHud(); IN.adsOn = false; IN.fire = false;
  startMatch({ seed: d.seed, humans: d.members, me: ON.s.uid, online: true, host: G.net.host });
  if (!G.net.host) G.drops = [];
  hudDirty(); wsTrack();
  toast(G.net.host ? 'Você é o líder: a partida começou!' : 'Partida do esquadrão começou!', 2.5, 'gold');
}
const actIx = a => a ? G.actors.indexOf(a) : -1;
const ownerOf = a => a.uid || G.net.hostUid;
// estado de um personagem em números (compacto)
function packA(a) {
  const w = curW(a);
  return [actIx(a), +a.x.toFixed(2), +a.y.toFixed(2), +a.z.toFixed(2), +a.yaw.toFixed(3), +a.pitch.toFixed(3),
    (a.alive ? 1 : 0) | (a.knocked ? 2 : 0) | (ST.indexOf(a.stance) << 2) | (MD.indexOf(a.mode) << 4) | (a.ads ? 64 : 0) | (a.trigger ? 128 : 0),
    w ? w.k : 0, a.veh ? VEH.indexOf(a.veh) : -1, a.seat, Math.round(a.knocked ? a.khp : a.hp), +a.lean.toFixed(2),
    (a.helm ? a.helm.lv : 0) | ((a.vest ? a.vest.lv : 0) << 2) | (a.bagLv << 4), a.kills, w && w.att.sight ? w.att.sight : 0];
}
function unpackA(s) {
  const a = G.actors[s[0]]; if (!a || !a.remote) return;
  const f = s[6], wasAlive = a.alive;
  a.net = { x: s[1], y: s[2], z: s[3], yaw: s[4], pitch: s[5], t: performance.now() };
  if (!a.netInit) { a.x = s[1]; a.y = s[2]; a.z = s[3]; a.netInit = 1; }
  a.stance = ST[(f >> 2) & 3] || 'stand'; a.mode = MD[(f >> 4) & 3] || 'ground'; a.ads = !!(f & 64); a.trigger = !!(f & 128); a.leanT = s[11]; a.lean = s[11];
  const kn = !!(f & 2); a.knocked = kn; if (kn) a.khp = s[10]; else a.hp = s[10];
  a.kills = s[13];
  // arma na mão
  const wk = s[7];
  if (wk && WEAP[wk]) { const cur = curW(a); if (!cur || cur.k !== wk) { a.wp[0] = mkWeapon(wk); a.cur = 0; } if (a.wp[a.cur] && (a.wp[a.cur].att.sight || 0) !== s[14]) a.wp[a.cur].att.sight = s[14] || null; } else a.cur = -1;
  // proteção visível
  const g = s[12], hl = g & 3, vl = (g >> 2) & 3, bl = (g >> 4) & 3;
  if ((a.helm ? a.helm.lv : 0) !== hl || (a.vest ? a.vest.lv : 0) !== vl || a.bagLv !== bl) { a.helm = hl ? { lv: hl, dur: 100 } : null; a.vest = vl ? { lv: vl, dur: 100 } : null; a.bagLv = bl; rebuildBody(a); }
  // veículo
  const vi = s[8], v = vi >= 0 ? VEH[vi] : null;
  if (v !== a.veh) { if (a.veh) { a.veh.seats[a.seat] = null; a.veh = null; } if (v && !v.seats[s[9]]) { a.veh = v; a.seat = s[9]; v.seats[a.seat] = a; } }
  if (wasAlive && !(f & 1)) puppetDeath(a);
}
function puppetDeath(a) {
  if (!a.alive) return;
  a.alive = false; a.knocked = false; if (a.veh) { a.veh.seats[a.seat] = null; a.veh = null; }
  if (a.model && a.model.human) toCorpse(a); else removeModel(a);
  if (!teamUp(a.team)) teamOut(a.team);
}
// interpolação dos personagens de outros aparelhos (andam suave entre as mensagens)
function netInterp(a, dt) {
  const n = a.net; if (!n) return;
  const k = Math.min(1, dt * 10), ox = a.x, oz = a.z;
  if (!a.veh) { a.x += (n.x - a.x) * k; a.y += (n.y - a.y) * k; a.z += (n.z - a.z) * k; }
  a.yaw += wrapA(n.yaw - a.yaw) * k; a.pitch += (n.pitch - a.pitch) * k;
  a.vx = (a.x - ox) / Math.max(dt, 1e-3); a.vz = (a.z - oz) / Math.max(dt, 1e-3); a.onGround = true;
  if (Math.hypot(n.x - a.x, n.z - a.z) > 25) { a.x = n.x; a.y = n.y; a.z = n.z; }
}
function packV(v) { return [VEH.indexOf(v), +v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2), +v.yaw.toFixed(3), +v.pitch.toFixed(3), +v.roll.toFixed(3), +v.sp.toFixed(2), Math.round(v.hp), v.dead ? 1 : 0]; }
function unpackV(s, own) {
  const v = VEH[s[0]]; if (!v) return;
  if (!own) { v.nx = s[1]; v.ny = s[2]; v.nz = s[3]; v.nyaw = s[4]; v.pitch = s[5]; v.roll = s[6]; v.sp = s[7]; v.netT = performance.now(); if (v.x === undefined) { v.x = s[1]; v.z = s[3]; } }
  if (s[8] < v.hp || !own) v.hp = s[8];
  if (s[9] && !v.dead) explodeNet(v);
}
function explodeNet(v) { v.dead = true; v.hp = 0; v.sp = 0; v.mesh.material = WRECK; for (let i = 0; i < 8; i++) puff(v.x + rr(-1.5, 1.5), v.y + rr(0.5, 2.5), v.z + rr(-1.5, 1.5), i % 2 ? '#ff7b00' : '#3a3a3a', 1.6, 1.4); sfx('boom'); if (G.player.veh === v) leaveVeh(G.player, true); }
// veículo é simulado neste aparelho?
function vehLocal(v) {
  if (!G.net.on) return true;
  const d = v.seats[0];
  if (G.net.host) return !(d && d.remote);
  return d === G.player;
}
function netVehInterp(v, dt) {
  if (v.nx == null) return;
  const k = Math.min(1, dt * 10);
  v.x += (v.nx - v.x) * k; v.y += (v.ny - v.y) * k; v.z += (v.nz - v.z) * k; v.yaw += wrapA(v.nyaw - v.yaw) * k;
}
// envio periódico (10 vezes por segundo)
function netTick(dt) {
  if (!G.net.on || G.phase !== 'match') return;
  const N = G.net;
  if ((N.sendT -= dt) > 0) return; N.sendT = 0.1;
  const p = G.player;
  if (N.host) {
    const acts = G.actors.filter(a => !a.remote && (a.alive || !N.sentDead || !N.sentDead[a.ix])).map(packA);
    N.sentDead = N.sentDead || {}; for (const a of G.actors) if (!a.remote && !a.alive) N.sentDead[a.ix] = (N.sentDead[a.ix] || 0) + 1;
    const vs = VEH.filter(v => vehLocal(v) && (v.seats.some(Boolean) || Math.abs(v.sp) > 0.2 || v.netDirty)).map(v => { v.netDirty = false; return packV(v); });
    const msg = { t: +G.matchT.toFixed(2), a: acts, v: vs, sh: N.shots.splice(0) };
    if ((N.zoneT -= 0.1) <= 0) { N.zoneT = 1; msg.z = ZONE; }
    netSend('snap', msg);
  } else {
    const msg = { a: [packA(p)], sh: N.shots.splice(0) };
    if (p.veh && p.seat === 0) msg.v = [packV(p.veh)];
    netSend('snap', msg);
  }
  // ninguém do esquadrão respondendo
  if (!N.host && performance.now() - N.hostSeen > 15000) netAbort('Perdeu a conexão com o líder.');
  if (N.host) for (const a of G.actors) if (a.remote && a.alive && a.netT0 && performance.now() - a.netT0 > 20000) { a.hp = 0; kill(a, null, 'desconectou'); }
}
function netMsg(ev, d) {
  const N = G.net; N.applying = true;
  try {
    if (ev === 'snap') {
      if (d.from === N.hostUid) N.hostSeen = performance.now();
      for (const s of d.a || []) { const a = G.actors[s[0]]; if (a) a.netT0 = performance.now(); unpackA(s); }
      for (const s of d.v || []) { const v = VEH[s[0]]; if (v && !(v.seats[0] === G.player)) unpackV(s, false); }
      for (const sh of d.sh || []) netShotVis(sh);
      if (d.z && !N.host) Object.assign(ZONE, d.z);
    } else if (ev === 'hit') { // alguém acertou um personagem que é meu
      const a = G.actors[d.ix], src = G.actors[d.src];
      if (a && !a.remote) hurtLocal(a, d.dmg, src, d.head, d.wn);
    } else if (ev === 'vhit') { const v = VEH[d.ix]; if (v && N.host) vehHurt(v, d.dmg, G.actors[d.src]); }
    else if (ev === 'it') { const it = G.items.find(x => x.id === d.id); if (it) { if (d.n <= 0) removeItem(it); else it.n = d.n; } }
    else if (ev === 'drop') { if (!G.items.some(x => x.id === d.id)) dropItem(d.k, d.n, d.x, d.y, d.z, d.w, d.id); }
    else if (ev === 'crate') { if (!G.crates.some(c => c.id === d.id)) { const c = addCrate(d.x, d.y, d.z, d.items, d.name, d.kind, d.id); if (d.vy) { c.vy = d.vy; c.chute = new T.Mesh(GEO.hsph, new T.MeshLambertMaterial({ color: 0xff3b3b })); c.chute.scale.set(5, 3, 5); scene.add(c.chute); } } }
    else if (ev === 'cr') { const c = G.crates.find(x => x.id === d.id); if (c) { c.items = d.items; crateCleanup(c); } }
    else if (ev === 'feed') { G.feed.push({ html: d.html, t: G.matchT, me: d.team === G.player.team }); if (G.feed.length > 5) G.feed.shift(); if (d.killer === actIx(G.player) && !d.kn) { G.player.kills++; toast('💀 Você abateu ' + d.vname + '!', 1.8, 'gold'); } hudDirty(); }
    else if (ev === 'veh') { const v = VEH[d.ix], a = G.actors[d.a]; if (v && a && a.remote) { if (d.in) { if (!v.seats[d.seat]) { if (a.veh) a.veh.seats[a.seat] = null; a.veh = v; a.seat = d.seat; v.seats[d.seat] = a; } } else { if (a.veh) a.veh.seats[a.seat] = null; a.veh = null; } } }
    else if (ev === 'nade') { const a = G.actors[d.a]; const m = new T.Mesh(itemGeo(d.k), MAT.item); m.position.set(d.x, d.y, d.z); scene.add(m); NADES.push({ k: d.k, o: a, x: d.x, y: d.y, z: d.z, vx: d.vx, vy: d.vy, vz: d.vz, t: 0, m, rest: false, vis: true }); }
    else if (ev === 'drop_plane' && !N.host) { setPath(DROPP, d.ang, 0, d.tx, d.tz); DROPP.tx = d.tx; DROPP.tz = d.tz; DROPP.dropped = true; toast('✈ Avião de suprimentos chegando!', 3, 'gold'); }
  } finally { N.applying = false; }
}
// tiro de outro aparelho: só o visual (a bala de verdade é do dono)
function netShotVis(sh) {
  const a = G.actors[sh[0]]; if (!a) return; const d = WEAP[sh[7]] || WEAP.M416;
  BUL.push({ x: sh[1], y: sh[2], z: sh[3], vx: sh[4] * d.v, vy: sh[5] * d.v, vz: sh[6] * d.v, o: a, team: a.team, dmg: 0, head: 1, wn: d.n, life: 0, px: sh[1], py: sh[2], pz: sh[3], vis: true });
  shotSound(a, d, false); muzzleFlash(a, false);
}
function netAbort(msg) { toast(msg, 4, 'bad'); G.net.on = false; setTimeout(toLobby, 1500); }
function netPeerGone(uid) { const a = G.actors.find(x => x.uid === uid); if (a && a.alive && G.net.host) { kill(a, null, 'saiu'); } }
function netEnd() { G.net.on = false; G.net.shots.length = 0; }
// começa a conexão assim que o jogo abre (não atrapalha jogar sem internet)
setTimeout(onlineStart, 1500);
