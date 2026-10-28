// ================= online (Supabase): login anônimo, save na nuvem, amigos por código, amigo ao vivo e desafio =================
// Só a URL e a chave pública (anon) ficam no jogo; as regras do banco (RLS) garantem que cada um só mexe no que é seu.
const SB = { url: 'https://jtyvqvlruwbryhkrdkaq.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0eXZxdmxydXdicnloa3Jka2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDI0NDksImV4cCI6MjEwODc3ODQ0OX0.rDC7mcJM7xBVIZcjUWZoaXHM09igXHmU2SAkeE9A3pc' };
const SESS_KEY = 'pescasub_sb';
const ON = { s: null, me: null, friends: [], online: {}, ws: null, ref: 0, joined: false, pushed: 0, pushT: 0, posT: 0, err: '', cloud: null, remotes: {}, inv: null, hb: null };

// ---------- REST ----------
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
  if (ON.s && ON.s.refresh_token) {
    try { keepSess(await sbFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', noAuth: true, body: JSON.stringify({ refresh_token: ON.s.refresh_token }) })); return; } catch (e) { }
  }
  keepSess(await sbFetch('/auth/v1/signup', { method: 'POST', noAuth: true, body: '{}' }));
}
// renova o token antes de vencer e avisa o canal ao vivo
async function sbRefresh() {
  if (!ON.s || ON.s.exp - 300 > Date.now() / 1000) return;
  try { await sbAuth(); wsSend('realtime:pesca', 'access_token', { access_token: ON.s.access_token }); } catch (e) { }
}
const newCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)]; return c; };
const myName = () => (ON.me && ON.me.name) || SV.onName || 'Mergulhador';

async function onlineStart() {
  if (!navigator.onLine) { ON.err = 'Sem internet.'; return; }
  try {
    await sbAuth();
    const p = await sbFetch(`/rest/v1/profiles?id=eq.${ON.s.uid}&select=*`);
    if (p && p.length) ON.me = p[0];
    else {
      for (let k = 0; k < 4 && !ON.me; k++) {
        try { ON.me = (await sbFetch('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id: ON.s.uid, name: SV.onName || 'Mergulhador', code: newCode(), level: level() }) }))[0]; } catch (e) { if (k === 3) throw e; }
      }
    }
    ON.err = '';
    await loadFriends(); await cloudCheck(); wsConnect();
    setInterval(onlineTick, 20000);
  } catch (e) { ON.err = 'Não conectou: ' + e.message; }
}

// ---------- save na nuvem ----------
async function cloudPush(force) {
  if (!ON.s || SAVE_LOCK || (!force && SV.savedAt === ON.pushed)) return;
  const at = SV.savedAt;
  try {
    await sbFetch('/rest/v1/saves', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: ON.s.uid, data: SV, updated_at: new Date().toISOString() }) });
    ON.pushed = at; ON.pushT = Date.now();
    const lv = level(); if (ON.me && ON.me.level !== lv) { ON.me.level = lv; sbFetch(`/rest/v1/profiles?id=eq.${ON.s.uid}`, { method: 'PATCH', body: JSON.stringify({ level: lv, updated_at: new Date().toISOString() }) }).catch(() => { }); }
  } catch (e) { }
}
// save da nuvem mais novo que o do aparelho: se o aparelho está zerado, restaura sozinho; senão oferece na aba Online
async function cloudCheck() {
  const r = await sbFetch(`/rest/v1/saves?id=eq.${ON.s.uid}&select=data,updated_at`);
  if (!r || !r.length) { cloudPush(true); return; }
  const d = r[0].data; ON.pushed = SV.savedAt;
  const fresh = !SV.savedAt || (!(SV.xp > 0) && SV.money <= 300);
  if ((d.savedAt || 0) > (SV.savedAt || 0) + 60000) { if (fresh) cloudRestore(d); else ON.cloud = d; }
  else cloudPush(true);
}
function cloudRestore(d) {
  SAVE_LOCK = true; const j = JSON.stringify(d);
  try { localStorage.setItem(SAVE_KEY, j); } catch (e) { } idbPut(j);
  toast('Progresso restaurado da nuvem!', 3, 'gold'); setTimeout(() => location.reload(), 600);
}
function onlineTick() { sbRefresh(); cloudPush(); if (ON.joined) wsTrack(); loadFriends(); }

// ---------- amigos por código ----------
async function loadFriends() {
  if (!ON.s) return;
  const seq = ON.fseq = (ON.fseq || 0) + 1; // só a busca mais recente vale (evita uma resposta velha apagar um amigo novo)
  try {
    const fs = await sbFetch('/rest/v1/friendships?select=owner,friend');
    const ids = [...new Set((fs || []).map(f => f.owner === ON.s.uid ? f.friend : f.owner))];
    const list = ids.length ? await sbFetch(`/rest/v1/profiles?id=in.(${ids.join(',')})&select=id,name,code,level`) : [];
    if (seq === ON.fseq) ON.friends = list;
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
    ON.fseq = (ON.fseq || 0) + 1; ON.friends.push(p[0]); toast(`${p[0].name} agora é seu amigo!`, 3, 'gold'); AU.coin();
    bcast('hello', { to: p[0].id, lvl: level() });
  } catch (e) { toast('Não deu para adicionar: ' + e.message, 3, 'bad'); }
  if (shopTab === 'online') renderShop();
}
async function delFriendOnline(id) {
  try { await sbFetch(`/rest/v1/friendships?or=(and(owner.eq.${ON.s.uid},friend.eq.${id}),and(owner.eq.${id},friend.eq.${ON.s.uid}))`, { method: 'DELETE' }); } catch (e) { }
  ON.friends = ON.friends.filter(f => f.id !== id); dropRemote(id);
}
async function renameOnline(n) {
  n = (n || '').trim().slice(0, 16); if (!n) return;
  SV.onName = n; save();
  if (ON.me) { ON.me.name = n; try { await sbFetch(`/rest/v1/profiles?id=eq.${ON.s.uid}`, { method: 'PATCH', body: JSON.stringify({ name: n, updated_at: new Date().toISOString() }) }); } catch (e) { } }
  wsTrack(); toast('Nome atualizado.', 2);
}
const isFriend = id => ON.friends.some(f => f.id === id);

// ---------- canal ao vivo (Supabase Realtime, protocolo Phoenix) ----------
function wsSend(topic, event, payload) { if (ON.ws && ON.ws.readyState === 1) ON.ws.send(JSON.stringify({ topic, event, payload, ref: String(++ON.ref), join_ref: '1' })); }
function wsConnect() {
  if (ON.ws) return;
  let ws; try { ws = new WebSocket(`${SB.url.replace('https', 'wss')}/realtime/v1/websocket?apikey=${SB.key}&vsn=1.0.0`); } catch (e) { return; }
  ON.ws = ws;
  ws.onopen = () => {
    ws.send(JSON.stringify({ topic: 'realtime:pesca', event: 'phx_join', ref: '1', join_ref: '1', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: ON.s.uid }, private: false }, access_token: ON.s.access_token } }));
    clearInterval(ON.hb); ON.hb = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ON.ref) })); }, 25000);
  };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } wsMsg(m); };
  ws.onclose = () => { ON.ws = null; ON.joined = false; clearInterval(ON.hb); setTimeout(() => { if (ON.s) wsConnect(); }, 5000); };
  ws.onerror = () => { };
}
function wsTrack() { if (!ON.joined) return; wsSend('realtime:pesca', 'presence', { type: 'presence', event: 'track', payload: { uid: ON.s.uid, name: myName(), region: REGION, lvl: level() } }); }
function bcast(ev, data) { if (!ON.joined) return; wsSend('realtime:pesca', 'broadcast', { type: 'broadcast', event: ev, payload: { ...data, from: ON.s.uid, name: myName(), region: REGION } }); }
function presenceMeta(state, fn) { for (const k in state) { const m = state[k] && state[k].metas && state[k].metas[0]; if (m) fn(k, m); } }
function wsMsg(m) {
  if (m.topic !== 'realtime:pesca') return;
  if (m.event === 'phx_reply' && m.ref === '1') { if (m.payload && m.payload.status === 'ok') { ON.joined = true; wsTrack(); } return; }
  if (m.event === 'presence_state') { ON.online = {}; presenceMeta(m.payload, (k, v) => { if (k !== ON.s.uid) ON.online[k] = v; }); return; }
  if (m.event === 'presence_diff') {
    presenceMeta(m.payload.joins || {}, (k, v) => { if (k === ON.s.uid) return; const was = ON.online[k]; ON.online[k] = v; if (!was && isFriend(k)) toast(`${v.name} entrou no jogo${v.region === REGION ? '' : ' (' + (v.region === 'amz' ? 'no Amazonas' : 'na Costa Verde') + ')'}.`, 3); });
    presenceMeta(m.payload.leaves || {}, k => { if (ON.online[k] && isFriend(k)) toast(`${ON.online[k].name} saiu do jogo.`, 2.5); delete ON.online[k]; dropRemote(k); });
    if (shopTab === 'online' && !$('marinaPanel').classList.contains('hide')) renderShop();
    return;
  }
  if (m.event === 'broadcast' && m.payload) onBcast(m.payload.event, m.payload.payload || {});
}
function onBcast(ev, d) {
  if (!d.from || d.from === ON.s.uid) return;
  if (d.to && d.to !== ON.s.uid) return;
  if (ev === 'hello') { if (!isFriend(d.from)) ON.friends.push({ id: d.from, name: d.name, level: d.lvl || 1 }); toast(`${d.name} adicionou você como amigo!`, 3.5, 'gold'); loadFriends(); return; }
  if (!isFriend(d.from)) return;
  if (ev === 'pos' && d.region === REGION) remoteState(d);
  if (ev === 'chal') { ON.inv = d; showInvite(d); }
  if (ev === 'chal_ok' && ON.wait && ON.wait.to === d.from) { const w = ON.wait; ON.wait = null; startLive(w.spot, d.from, d.name, d.at); }
  if (ev === 'chal_no' && ON.wait && ON.wait.to === d.from) { ON.wait = null; toast(`${d.name} recusou o desafio.`, 3); }
  if (ev === 'chal_sc' && COMP.on && COMP.live && COMP.live.uid === d.from) { COMP.live.n = d.n; COMP.live.kg = d.kg; if (d.last) toast(`${d.name} pegou ${d.last}`, 2.2); }
}

// ---------- amigo ao vivo: mergulhador e barco desenhados a partir das posições recebidas ----------
function myBoatIdx() { return typeof curBoatIdx === 'function' ? curBoatIdx() : SV.boat || 0; }
function sendPos(dt) {
  if (!ON.joined || (ON.posT -= dt) > 0) return;
  const anyHere = Object.keys(ON.online).some(k => isFriend(k) && ON.online[k].region === REGION); if (!anyHere) return;
  ON.posT = 0.18;
  const r = v => Math.round(v * 100) / 100;
  bcast('pos', { m: P.mode, u: P.under ? 1 : 0, x: r(P.pos.x), y: r(P.pos.y), z: r(P.pos.z), yw: r(P.yaw), pt: r(P.pitch), bx: r(BOAT.pos.x), bz: r(BOAT.pos.z), bh: r(BOAT.heading), bi: myBoatIdx(), an: BOAT.anchored ? 1 : 0 });
}
function nameTag(name) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d');
  g.fillStyle = 'rgba(3,16,24,.7)'; if (g.roundRect) { g.beginPath(); g.roundRect(8, 10, 240, 44, 22); g.fill(); } else g.fillRect(8, 10, 240, 44);
  g.fillStyle = '#7ff0d8'; g.font = 'bold 28px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name.slice(0, 16), 128, 33);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true })); s.scale.set(2.4, 0.6, 1); s.renderOrder = 5; return s;
}
function remoteState(d) {
  let R = ON.remotes[d.from];
  if (!R) {
    const rig = buildDiver(false); rig.suitMat.map = null; rig.suitMat.color.set(0x7a2a2a); rig.suitMat.needsUpdate = true;
    const tag = nameTag(d.name); scene.add(tag);
    R = ON.remotes[d.from] = { rig, tag, pos: new V3(d.x, d.y, d.z), boat: null, bi: null, bpos: new V3(d.bx, 0, d.bz), yaw: d.yw, pitch: d.pt, kick: 0, name: d.name };
  }
  R.d = d; R.seen = performance.now();
  if (R.bi !== d.bi) { if (R.boat) scene.remove(R.boat); R.boat = buildBoatModel(d.bi); scene.add(R.boat); R.bi = d.bi; }
}
function dropRemote(id) { const R = ON.remotes[id]; if (!R) return; scene.remove(R.rig.root, R.tag); if (R.boat) scene.remove(R.boat); delete ON.remotes[id]; }
function updateRemotes(dt, t) {
  for (const id in ON.remotes) {
    const R = ON.remotes[id], d = R.d;
    if (performance.now() - R.seen > 12000 || !ON.online[id]) { dropRemote(id); continue; }
    const k = clamp(dt * 6, 0, 1), old = _t1.copy(R.pos);
    R.pos.lerp(_t2.set(d.x, d.y, d.z), k); R.yaw += angDiff(R.yaw, d.yw) * k; R.pitch = lerp(R.pitch, d.pt, k);
    R.bpos.lerp(_t2.set(d.bx, waveH(d.bx, d.bz, t), d.bz), k);
    const mv = Math.min(1, old.distanceTo(R.pos) / Math.max(dt, 1e-3) / 1.2); R.kick += dt * (2 + mv * 5);
    const swim = d.m === 'swim';
    R.rig.root.visible = swim && camera.position.distanceTo(R.pos) < 120;
    if (swim) placeRig(R.rig, R.pos, R.yaw, d.u ? R.pitch : 0, !!d.u, mv, R.kick);
    if (R.boat) {
      R.boat.position.copy(R.bpos); R.boat.rotation.set(0, d.bh, 0, 'YXZ');
      const pl = R.boat.userData.pilot; if (pl) pl.forEach(o => o.visible = !swim);
      R.boat.visible = camera.position.distanceTo(R.bpos) < 900;
    }
    R.tag.position.copy(swim ? R.pos : R.bpos).add(_t2.set(0, swim ? 0.9 : 3.4, 0));
    const dd = camera.position.distanceTo(R.tag.position); R.tag.visible = dd < 400; R.tag.scale.set(2.4, 0.6, 1).multiplyScalar(clamp(dd / 18, 0.5, 6));
  }
}

// ---------- desafio ao vivo: você contra o amigo, 10 minutos no mesmo ponto ----------
function challenge(id) {
  const f = ON.friends.find(x => x.id === id), o = ON.online[id];
  if (!f || !o) return; if (o.region !== REGION) { toast(`${f.name} está em outro destino.`, 3, 'bad'); return; }
  const near = SPOTS.filter(s => s.r).sort((a, b) => Math.hypot(a.x - BOAT.pos.x, a.z - BOAT.pos.z) - Math.hypot(b.x - BOAT.pos.x, b.z - BOAT.pos.z))[0];
  ON.wait = { to: id, spot: near.id }; bcast('chal', { to: id, spot: near.id, spotName: near.name });
  toast(`Desafio enviado para ${f.name} na ${near.name}. Esperando resposta...`, 4);
  setTimeout(() => { if (ON.wait && ON.wait.to === id) { ON.wait = null; toast(`${f.name} não respondeu ao desafio.`, 3); } }, 45000);
}
function showInvite(d) {
  const b = $('onInv'); if (!b) return;
  b.innerHTML = `<div class="n">⚔️ ${d.name} te desafiou!</div><div class="d">10 minutos na ${d.spotName}. Ganha quem pegar mais peixes na medida.</div><div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px"><button class="btn alt" id="invNo">RECUSAR</button><button class="btn gold" id="invOk">ACEITAR</button></div>`;
  b.classList.remove('hide'); buzz([60, 40, 60]); AU.coin();
  $('invNo').onclick = () => { bcast('chal_no', { to: d.from }); b.classList.add('hide'); ON.inv = null; };
  $('invOk').onclick = () => { const at = Date.now() + 4000; bcast('chal_ok', { to: d.from, at }); b.classList.add('hide'); ON.inv = null; startLive(d.spot, d.from, d.name, at); };
  setTimeout(() => { if (ON.inv === d) { b.classList.add('hide'); ON.inv = null; } }, 40000);
}
function startLive(spotId, uid, name, at) {
  if (COMP.on) return;
  closePanels(); toast(`Desafio contra ${name} começa em instantes!`, 3, 'gold');
  setTimeout(() => {
    startComp(spotId, null, { uid, name });
    toast('Valendo! O placar do amigo atualiza ao vivo.', 3, 'gold');
  }, Math.max(0, at - Date.now()));
}
function liveCatch(f) { if (COMP.on && COMP.live) bcast('chal_sc', { to: COMP.live.uid, n: COMP.me.n, kg: Math.round(COMP.me.kg * 10) / 10, last: `${f.sp.name.toLowerCase()} de ${fmtKg(f.kg)} kg` }); }

// ---------- conta com e-mail e senha: leva o save para outro aparelho ----------
async function protectAccount(email, pass) {
  email = (email || '').trim(); if (!/^\S+@\S+\.\S+$/.test(email) || (pass || '').length < 6) { toast('Use um e-mail válido e senha de 6+ caracteres.', 3, 'bad'); return; }
  try {
    await sbFetch('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ email, password: pass }) });
    SV.onEmail = email; save(); toast(`Enviamos um link de confirmação para ${email}. Abra o e-mail e confirme.`, 6, 'gold');
  } catch (e) { toast('Não deu: ' + e.message, 4, 'bad'); }
}
async function loginAccount(email, pass) {
  try {
    keepSess(await sbFetch('/auth/v1/token?grant_type=password', { method: 'POST', noAuth: true, body: JSON.stringify({ email: (email || '').trim(), password: pass }) }));
    const r = await sbFetch(`/rest/v1/saves?id=eq.${ON.s.uid}&select=data`);
    if (r && r.length) { toast('Conta encontrada! Trazendo o seu progresso...', 3, 'gold'); cloudRestore(r[0].data); }
    else { toast('Conta conectada, mas ainda sem save na nuvem.', 3); setTimeout(() => location.reload(), 1500); }
  } catch (e) { toast(/invalid/i.test(e.message) ? 'E-mail ou senha errados (ou e-mail ainda não confirmado).' : 'Não deu: ' + e.message, 4, 'bad'); }
}

// ---------- aba Online ----------
function onlineHTML() {
  if (!ON.s || !ON.me) return `<div class="it"><div><div class="n">Conectando...</div><div class="d">${ON.err || 'Entrando no servidor do jogo.'}</div></div><button class="btn" id="onRetry">TENTAR DE NOVO</button></div>`;
  const ago = ON.pushT ? Math.round((Date.now() - ON.pushT) / 60000) : null;
  let h = `<div class="it" style="margin-bottom:8px;flex-direction:column;align-items:stretch;gap:6px"><div class="n">Seu código de amigo: <b style="color:var(--acc);letter-spacing:3px;font-size:1.25em">${ON.me.code}</b> <button class="btn alt" id="onCopy" style="margin-left:6px">COPIAR</button></div>
    <div class="d">Mande esse código para quem vai jogar com você. Cada um adiciona o código do outro (basta um dos dois).</div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="d">Seu nome:</span><input id="onName" maxlength="16" value="${myName().replace(/"/g, '')}" style="flex:1;min-width:120px;padding:8px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe"><button class="btn" id="onNameOk">SALVAR</button></div>
    <div class="d">☁️ Save na nuvem: ${ON.pushT ? (ago < 1 ? 'enviado agora há pouco' : `enviado há ${ago} min`) : 'ativo'}. ${ON.ws && ON.joined ? '🟢 ao vivo' : '⚪ reconectando ao vivo...'}</div></div>`;
  if (ON.cloud) h += `<div class="it" style="margin-bottom:8px;border-color:var(--acc)"><div><div class="n">Save mais novo na nuvem</div><div class="d">Gravado em ${new Date(ON.cloud.savedAt).toLocaleString('pt-BR')} com ${fmtR(ON.cloud.money || 0)}. O deste aparelho é mais antigo.</div></div><button class="btn gold" id="onRestore">RESTAURAR</button></div>`;
  h += `<div class="it" style="margin-bottom:8px;gap:6px"><input id="onCode" maxlength="6" placeholder="CÓDIGO DO AMIGO" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe;text-transform:uppercase;letter-spacing:2px"><button class="btn gold" id="onAdd">ADICIONAR</button></div>`;
  const inp = 'style="flex:1;min-width:120px;padding:8px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe"';
  h += `<div class="it" style="margin-bottom:8px;flex-direction:column;align-items:stretch;gap:6px"><div class="n">🔒 Conta</div>
    <div class="d">${SV.onEmail ? `Protegida com <b>${SV.onEmail}</b> (confirme pelo link do e-mail). Em outro aparelho, use "Entrar" com esse e-mail e senha.` : 'Hoje a conta fica presa a este aparelho. Coloque e-mail e senha para recuperar tudo se trocar ou apagar o celular.'}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><input id="onMail" type="email" placeholder="e-mail" value="${(SV.onEmail || '').replace(/"/g, '')}" ${inp}><input id="onPass" type="password" placeholder="senha (6+)" ${inp}></div>
    <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap"><button class="btn alt" id="onLogin">ENTRAR (OUTRO APARELHO)</button><button class="btn gold" id="onProtect">PROTEGER ESTA CONTA</button></div></div>`;
  h += `<div class="n" style="margin:6px 0">Amigos online (${ON.friends.length})</div><div class="list">` + (ON.friends.length ? ON.friends.map(f => {
    const o = ON.online[f.id], here = o && o.region === REGION;
    const where = o ? (here ? '🟢 jogando no mesmo destino' : `🟡 jogando ${o.region === 'amz' ? 'no Amazonas' : 'na Costa Verde'}`) : '⚪ offline';
    return `<div class="it"><span class="av" style="background:#7a2a2a">${f.name[0]}</span><div style="flex:1"><div class="n">${f.name} <span class="d">· Nv ${f.level || 1}</span></div><div class="d">${where}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${here ? `<button class="btn" data-ongo="${f.id}">IR ATÉ</button><button class="btn gold" data-onchal="${f.id}" ${COMP.on ? 'disabled' : ''}>DESAFIAR</button>` : ''}<button class="btn alt" data-ondel="${f.id}">✕</button></div></div>`;
  }).join('') : '<div class="it"><div class="d">Nenhum amigo ainda. Adicione pelo código.</div></div>') + '</div>';
  h += `<div class="it" style="margin-top:8px"><div class="d">No mesmo destino, vocês veem o barco e o mergulhador um do outro ao vivo, com o nome em cima. Cada um tem os próprios peixes. No <b>desafio</b>, ganha quem pegar mais peixes na medida em 10 minutos (vencedor R$ 800, perdedor R$ 300).</div></div>`;
  return h;
}
function bindOnline(B, on) {
  const q = id => $(id);
  if (q('onRetry')) q('onRetry').onclick = () => { ON.err = 'Tentando...'; renderShop(); onlineStart().then(() => renderShop()); };
  if (q('onCopy')) q('onCopy').onclick = () => { try { navigator.clipboard.writeText(ON.me.code); toast('Código copiado!', 2); } catch (e) { toast('Código: ' + ON.me.code, 4); } };
  if (q('onNameOk')) q('onNameOk').onclick = () => { renameOnline(q('onName').value).then(() => renderShop()); };
  if (q('onAdd')) q('onAdd').onclick = () => addFriendCode(q('onCode').value);
  if (q('onProtect')) q('onProtect').onclick = () => protectAccount(q('onMail').value, q('onPass').value);
  if (q('onLogin')) q('onLogin').onclick = () => { if (confirm('Entrar em outra conta troca o progresso deste aparelho pelo dessa conta. Continuar?')) loginAccount(q('onMail').value, q('onPass').value); };
  if (q('onRestore')) q('onRestore').onclick = () => { if (confirm('Trocar o progresso deste aparelho pelo save da nuvem?')) cloudRestore(ON.cloud); };
  B.querySelectorAll('[data-ondel]').forEach(b => b.onclick = () => { const f = ON.friends.find(x => x.id === b.dataset.ondel); if (f && confirm(`Remover ${f.name} dos amigos online?`)) delFriendOnline(f.id).then(() => renderShop()); });
  B.querySelectorAll('[data-onchal]').forEach(b => b.onclick = () => { challenge(b.dataset.onchal); closePanels(); });
  B.querySelectorAll('[data-ongo]').forEach(b => b.onclick = () => {
    const R = ON.remotes[b.dataset.ongo]; if (!R) { toast('Ainda sem a posição dele. Espere uns segundos.', 2.5); return; }
    const near = SPOTS.filter(s => s.r).sort((a, c) => Math.hypot(a.x - R.bpos.x, a.z - R.bpos.z) - Math.hypot(c.x - R.bpos.x, c.z - R.bpos.z))[0];
    SV.dest = near.id; save(); closePanels(); toast(`Rota traçada até ${R.name}, perto de ${near.name}.`, 3);
  });
}

function setupOnline() {
  onlineStart();
  addEventListener('pagehide', () => cloudPush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) cloudPush(); });
  setInterval(() => cloudPush(), 60000);
}
function updateOnline(dt, t) { sendPos(dt); updateRemotes(dt, t); }
