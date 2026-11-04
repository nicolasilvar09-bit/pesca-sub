// ================= lobby: personagem, modo (solo/dupla/trio/esquadrão), dificuldade dos bots e equipe =================
const LOB = { actors: [], x: 0, z: 0, y: 0, yaw: 0, t: 0 };
(function findSpot() { // praia com o mar ao fundo
  for (let r = 420 * MK; r < 840 * MK; r += 4) { const a = 2.2, x = Math.cos(a) * r, z = Math.sin(a) * r, h = groundH(x, z); if (h < 5 && h > 0.7 && !bldAt(x, z, 6)) { LOB.x = x; LOB.z = z; LOB.y = h; LOB.yaw = a; break; } }
})();
const MODES = [['solo', 'Solo', 1], ['duo', 'Dupla', 2], ['trio', 'Trio', 3], ['squad', 'Esquadrão', 4]];
const DIFFS = [['medio', 'Médio'], ['alto', 'Alto'], ['mix', 'Misto']];
function lobbyActors() {
  for (const a of LOB.actors) removeModel(a);
  LOB.actors = [];
  const n = MODES.find(m => m[0] === G.mode)[2];
  for (let i = 0; i < n; i++) {
    const pm = PARTY.pid && PARTY.members[i] && PARTY.members[i].uid !== (ON.s && ON.s.uid) ? PARTY.members[i] : null, mine = PARTY.pid ? PARTY.members[i] && PARTY.members[i].uid === (ON.s && ON.s.uid) : i === 0;
    const a = makeActor({ look: mine ? Object.assign({}, CHARS[SET.char]) : pm ? Object.assign({}, CHARS[pm.char] || CHARS[0]) : randLook(), mode: 'ground' });
    if (i === 0) a.wp[0] = mkWeapon('M416'); else a.wp[0] = mkWeapon(pick(['AKM', 'SCAR-L', 'UMP45', 'KAR98K']));
    a.cur = 0; a.vest = i === 0 ? { lv: 2, dur: 1 } : null; a.helm = i === 0 ? { lv: 2, dur: 1 } : null;
    buildModel(a);
    const row = { 1: [0], 2: [0, -1.7], 3: [0, -1.7, 1.7], 4: [0.85, -0.85, 2.55, -2.55] }[n], side = row[i], back = i ? 0.35 : 0; // fila lado a lado (nomes não se sobrepõem)
    // a fila fica de frente para a câmera
    const fx = Math.cos(LOB.yaw), fz = Math.sin(LOB.yaw), rx = -fz, rz = fx;
    a.x = LOB.x + rx * side + fx * back; a.z = LOB.z + rz * side + fz * back; a.y = groundH(a.x, a.z);
    a.yaw = Math.atan2(fx, fz) + (i ? rr(-0.3, 0.3) : 0);
    LOB.actors.push(a);
  }
}
function lobbyCamera(dt) {
  LOB.t += dt;
  const fx = Math.cos(LOB.yaw), fz = Math.sin(LOB.yaw), rx = -fz, rz = fx, d = 6.2;
  camera.position.set(LOB.x - fx * d + rx * 1.9, LOB.y + 1.6, LOB.z - fz * d + rz * 1.9); // fila um pouco à esquerda: o lado direito é do botão JOGAR
  camera.lookAt(LOB.x + rx * 1.15, LOB.y + 1.05, LOB.z + rz * 1.15);
  if (Math.abs(camera.fov - 50) > 0.1) { camera.fov = 50; camera.updateProjectionMatrix(); }
  SKY.position.copy(camera.position); if (typeof SKY2 !== 'undefined' && SKY2) SKY2.position.copy(camera.position);
  humanFrame();
  for (const a of LOB.actors) { a.pitch = Math.sin(LOB.t * 0.8 + a.id) * 0.05 - 0.15; animateModel(a, dt, camera.position.x, camera.position.z, false); }
  VM.visible = false; camera.updateMatrixWorld(); lobbyTags();
}
// nível do jogador (cresce com partidas, abates e vitórias)
function playerLevel() { const xp = (SET.matches || 0) * 100 + (SET.kills || 0) * 40 + (SET.wins || 0) * 300, lv = 1 + Math.floor(Math.sqrt(xp / 120)); const a = (lv - 1) ** 2 * 120, b = lv ** 2 * 120; return { lv, k: (xp - a) / (b - a) }; }
const esc = t => String(t || '').replace(/[<>"&]/g, '');
// formato de lobby de battle royale: jogador no topo, esquadrão no centro com nome em cima, JOGAR grande à direita, atalhos à esquerda
function renderLobby() {
  const el = $('lobby');
  const n = MODES.find(m => m[0] === G.mode)[2], r = rankOf(SET.rp), L = playerLevel(), nm = esc(SET.name || 'Jogador');
  const onl = Object.keys(ON.online).filter(k => ON.friends.some(f => f.id === k)).length;
  el.innerHTML = `
  <div class="lb-card" id="lChr"><div class="lb-av">${nm.slice(0, 2).toUpperCase()}</div><div class="lb-ci"><b>${nm}</b><small>Nível ${L.lv} · <span style="color:${r.c}">🏅 ${r.n}</span></small><div class="lb-xp"><i style="width:${Math.round(L.k * 100)}%"></i></div></div></div>
  <div class="lb-logo"><div class="logo nk"><b>N</b><i>K</i><em>MOBILE</em></div><small>versão ${BUILD}</small></div>
  <div class="lb-stats"><div class="pill">🏆 <b>${SET.wins}</b></div><div class="pill">💀 <b>${SET.kills}</b></div><div class="hb2" id="lSet">⚙</div></div>
  <div class="lb-side">
    <button class="lb-ic" id="lChr2"><span>🧍</span><small>Personagem</small></button>
    <button class="lb-ic" id="lCar"><span>🏆</span><small>Carreira</small></button>
    <button class="lb-ic" id="lFr"><span>👥</span><small>Amigos${onl ? ' · ' + onl : ''}</small></button>
    <button class="lb-ic" id="lLay"><span>🎛</span><small>Botões</small></button>
  </div>
  <div class="lb-play">
    <button class="btn play" id="lPlay">JOGAR</button>
    <button class="mapbtn" id="lMap" data-map="1"><img src="assets/maps/${MAPID}.jpg" alt=""><span><small>MAPA</small><b>${MAPS[MAPID].n}</b></span><i>TROCAR ›</i></button>
    <div class="seg sm">${MODES.map(m => `<button data-m="${m[0]}" class="${G.mode === m[0] ? 'on' : ''}">${m[1]}</button>`).join('')}</div>
    <div class="seg sm"><span class="segl">BOTS</span>${DIFFS.map(d => `<button data-d="${d[0]}" class="${G.diff === d[0] ? 'on' : ''}">${d[1]}</button>`).join('')}</div>
    ${HUM.ready || HUM.failed ? '' : '<div class="hint">Carregando personagens realistas...</div>'}
  </div>
  <div id="lTags">${Array.from({ length: n }, (_, i) => { const m = PARTY.pid ? PARTY.members[i] : (i === 0 ? { uid: 'me', name: SET.name } : null);
    if (m) { const me = !PARTY.pid || m.uid === (ON.s && ON.s.uid); return `<div class="ltag ${me ? 'me' : 'fr'}" id="tg${i}"><b>${esc(m.name || 'Jogador')}${m.uid === PARTY.lead ? ' 👑' : ''}</b><small>${me ? 'você' : 'amigo'}</small></div>`; }
    return `<div class="ltag bot" id="tg${i}"><small>🤖 bot</small><button class="inv" data-inv="1">+ CONVIDAR</button></div>`; }).join('')}</div>
  <div class="lb-bot"><span class="pill">${ON.me ? '🟢 Código <b>' + ON.me.code + '</b>' : ON.err ? '⚪ ' + esc(ON.err) : '⚪ conectando...'}</span></div>`;
  const openChr = () => openCharPanel();
  $('lChr').onclick = openChr; $('lChr2').onclick = openChr; $('lCar').onclick = openCareer; $('lLay').onclick = openLayout;
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const sz = MODES.find(m => m[0] === b.dataset.m)[2]; if (PARTY.pid && PARTY.members.length > sz) { toast('O esquadrão tem ' + PARTY.members.length + ' pessoas: escolha um modo maior.', 2.5); return; } G.mode = SET.mode = b.dataset.m; saveSet(); lobbyActors(); renderLobby(); partyState(); });
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { G.diff = SET.diff = b.dataset.d; saveSet(); renderLobby(); partyState(); });
  el.querySelectorAll('[data-map]').forEach(b => b.onclick = openMapSel);
  el.querySelectorAll('[data-inv]').forEach(b => b.onclick = openFriends); $('lFr').onclick = openFriends;
  const guest = PARTY.pid && !partyLead();
  if (guest) { $('lPlay').textContent = 'AGUARDANDO O LÍDER'; $('lPlay').disabled = true; $('lPlay').classList.add('wait'); el.querySelectorAll('[data-m],[data-d],[data-map]').forEach(b => b.disabled = true); }
  $('lSet').onclick = () => { G.phase = 'lobbyMenu'; openMenu(); $('mQuit').style.display = 'none'; $('mBack').onclick = () => { closePanels(); G.phase = 'lobby'; }; };
  $('lPlay').onclick = play;
}
// nome em cima de cada personagem do esquadrão (acompanha a posição na tela)
const _tg = new T.Vector3();
function lobbyTags() {
  for (let i = 0; i < LOB.actors.length; i++) {
    const el = document.getElementById('tg' + i); if (!el) continue; const a = LOB.actors[i];
    _tg.set(a.x, a.y + 2.15, a.z).project(camera);
    if (_tg.z > 1) { el.style.display = 'none'; continue; }
    el.style.display = ''; el.style.left = ((_tg.x * 0.5 + 0.5) * innerWidth) + 'px'; el.style.top = ((-_tg.y * 0.5 + 0.5) * innerHeight) + 'px';
  }
}
// painel do personagem: nome e visual
function openCharPanel() {
  const el = $('chrP'); el.classList.remove('hidden');
  const draw = () => { const c = CHARS[SET.char]; el.innerHTML = `<div class="box"><h3>Personagem</h3>
    <label class="lab">Seu nome</label><input id="lName" maxlength="14" value="${esc(SET.name)}">
    <label class="lab">Visual</label><div class="chsel"><button id="chP">◀</button><div><b>${c.n}</b><small>${c.f ? 'Feminino' : 'Masculino'}</small></div><button id="chN">▶</button></div>
    <div class="row"><button class="btn" id="chOk">PRONTO</button></div></div>`;
    $('lName').oninput = e => { SET.name = e.target.value.trim().slice(0, 14) || 'Jogador'; saveSet(); };
    $('lName').onchange = () => { renameOnline(); charChanged(); };
    $('chP').onclick = () => { SET.char = (SET.char + CHARS.length - 1) % CHARS.length; saveSet(); charChanged(); lobbyActors(); draw(); };
    $('chN').onclick = () => { SET.char = (SET.char + 1) % CHARS.length; saveSet(); charChanged(); lobbyActors(); draw(); };
    $('chOk').onclick = () => { el.classList.add('hidden'); renderLobby(); }; };
  draw();
}
// painel de carreira: estatísticas de todas as partidas
function openCareer() {
  const el = $('carP'); el.classList.remove('hidden');
  const m = SET.matches || 0, w = SET.wins || 0, k = SET.kills || 0, r = rankOf(SET.rp), L = playerLevel();
  const pct = v => m ? Math.round(v / m * 100) + '%' : '—';
  el.innerHTML = `<div class="box car"><h3>Carreira</h3><div class="car-r"><span style="color:${r.c}">🏅 ${r.n}</span> · ${r.rp} pontos · Nível ${L.lv}</div>
    <div class="car-g"><div><b>${m}</b>partidas</div><div><b>${w}</b>vitórias</div><div><b>${pct(w)}</b>taxa de vitória</div><div><b>${SET.top10 || 0}</b>top 10</div>
    <div><b>${k}</b>abates</div><div><b>${(k / Math.max(1, m - w)).toFixed(2)}</b>abates por morte</div><div><b>${m ? (k / m).toFixed(1) : '—'}</b>abates por partida</div><div><b>${SET.best ? '#' + SET.best : '—'}</b>melhor colocação</div>
    <div><b>${Math.round(SET.dmg || 0)}</b>dano total</div><div><b>${m ? Math.round((SET.dmg || 0) / m) : '—'}</b>dano por partida</div></div>
    <div class="row"><button class="btn" id="carX">FECHAR</button></div></div>`;
  $('carX').onclick = () => el.classList.add('hidden');
}
// painel com a imagem das duas ilhas para escolher
function openMapSel() {
  const el = $('mapSelP'); el.classList.remove('hidden');
  el.innerHTML = `<div class="box mapsel"><h3>Escolha o mapa</h3><div class="mcards">${Object.keys(MAPS).map(k => `<div class="mcard ${k === MAPID ? 'on' : ''}" data-pick="${k}"><img src="assets/maps/${k}.jpg" alt=""><b>${MAPS[k].n}</b><small>${MAPS[k].d}</small><button class="btn ${k === MAPID ? 'alt' : ''}">${k === MAPID ? 'MAPA ATUAL' : 'JOGAR AQUI'}</button></div>`).join('')}</div><button class="btn alt" id="msX">FECHAR</button></div>`;
  el.querySelectorAll('[data-pick]').forEach(c => c.onclick = () => { const k = c.dataset.pick; if (k === MAPID) { el.classList.add('hidden'); return; } switchMap(k); });
  $('msX').onclick = e => { e.stopPropagation(); el.classList.add('hidden'); };
}
function switchMap(id) {
  if (id === MAPID || !MAPS[id]) return;
  if (PARTY.pid && PARTY.members.length > 1) { toast('Escolha o mapa antes de chamar o esquadrão (ou saia dele para trocar).', 3); return; }
  if (PARTY.pid) partyLeave(true);
  SET.map = id; saveSet(false); $('loading').classList.remove('hidden'); location.href = location.pathname;
}
function charChanged() { if (PARTY.pid) { if (partyLead()) { const m = PARTY.members.find(x => x.uid === ON.s.uid); if (m) { m.char = SET.char; m.name = myName(); } partyState(); } else pSend('p_char', { char: SET.char, name: myName() }); } }
function play() {
  sfxInit();
  if (PARTY.pid && PARTY.members.length > 1) { if (partyLead()) leaderStart(); return; }
  for (const a of LOB.actors) removeModel(a); LOB.actors = [];
  $('lobby').classList.add('hidden'); $('result').classList.add('hidden'); $('hud').classList.remove('hidden');
  buildHud(); IN.adsOn = false; IN.fire = false;
  startMatch(); hudDirty();
  try { if (document.documentElement.requestFullscreen && matchMedia('(pointer:coarse)').matches) document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
}
function toLobby() {
  if (G.net.on) netEnd();
  clearMatch(); G.phase = 'lobby'; G.result = null; G.view = null;
  $('hud').classList.add('hidden'); $('result').classList.add('hidden'); closePanels(); $('lobby').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  lobbyActors(); renderLobby();
}
