// ================= lobby: personagem, modo (solo/dupla/trio/esquadrão), dificuldade dos bots e equipe =================
const LOB = { actors: [], x: 0, z: 0, y: 0, yaw: 0, t: 0 };
(function findSpot() { // praia com o mar ao fundo
  for (let r = 300; r < 600; r += 4) { const a = 2.2, x = Math.cos(a) * r, z = Math.sin(a) * r, h = groundH(x, z); if (h < 5 && !bldAt(x, z, 6)) { LOB.x = x; LOB.z = z; LOB.y = h; LOB.yaw = a; break; } }
})();
const MODES = [['solo', 'Solo', 1], ['duo', 'Dupla', 2], ['trio', 'Trio', 3], ['squad', 'Esquadrão', 4]];
const DIFFS = [['medio', 'Médio'], ['alto', 'Alto'], ['mix', 'Misto']];
function lobbyActors() {
  for (const a of LOB.actors) removeModel(a);
  LOB.actors = [];
  const n = MODES.find(m => m[0] === G.mode)[2];
  for (let i = 0; i < n; i++) {
    const a = makeActor({ look: i === 0 ? Object.assign({}, CHARS[SET.char]) : randLook(), mode: 'ground' });
    if (i === 0) a.wp[0] = mkWeapon('M416'); else a.wp[0] = mkWeapon(pick(['AKM', 'SCAR-L', 'UMP45', 'KAR98K']));
    a.cur = 0; a.vest = i === 0 ? { lv: 2, dur: 1 } : null; a.helm = i === 0 ? { lv: 2, dur: 1 } : null;
    buildModel(a);
    const side = [0, -1.3, 1.3, -2.6][i], back = [0, 0.9, 0.9, 1.8][i];
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
  camera.position.set(LOB.x - fx * d + rx * 1.3, LOB.y + 1.6, LOB.z - fz * d + rz * 1.3);
  camera.lookAt(LOB.x + rx * 1.3 * 0.6, LOB.y + 1.05, LOB.z + rz * 0.6);
  if (Math.abs(camera.fov - 50) > 0.1) { camera.fov = 50; camera.updateProjectionMatrix(); }
  SKY.position.copy(camera.position); if (typeof SKY2 !== 'undefined' && SKY2) SKY2.position.copy(camera.position);
  humanFrame();
  for (const a of LOB.actors) { a.pitch = Math.sin(LOB.t * 0.8 + a.id) * 0.05 - 0.15; animateModel(a, dt, camera.position.x, camera.position.z, false); }
  VM.visible = false;
}
function renderLobby() {
  const el = $('lobby');
  const c = CHARS[SET.char];
  const n = MODES.find(m => m[0] === G.mode)[2];
  el.innerHTML = `
  <div class="lgo"><div class="logo">ILHA <span>ZERO</span></div><div class="sub">Battle Royale · 50 jogadores</div></div>
  <div class="lst"><div class="pill">🏆 <b>${SET.wins}</b> vitórias</div><div class="pill">💀 <b>${SET.kills}</b> abates</div><div class="pill">🎮 <b>${SET.matches}</b> partidas</div><div class="hb2" id="lSet">⚙</div></div>
  <div class="lleft">
    <label class="lab">Seu nome</label><input id="lName" maxlength="14" value="${(SET.name || '').replace(/"/g, '')}">
    <label class="lab">Personagem</label>
    <div class="chsel"><button id="chP">◀</button><div><b>${c.n}</b><small>${c.f ? 'Feminino' : 'Masculino'}</small></div><button id="chN">▶</button></div>
  </div>
  <div class="lright">
    <label class="lab">Modo</label>
    <div class="seg">${MODES.map(m => `<button data-m="${m[0]}" class="${G.mode === m[0] ? 'on' : ''}">${m[1]}</button>`).join('')}</div>
    <label class="lab">Bots</label>
    <div class="seg">${DIFFS.map(d => `<button data-d="${d[0]}" class="${G.diff === d[0] ? 'on' : ''}">${d[1]}</button>`).join('')}</div>
    <button class="btn play" id="lPlay">JOGAR</button>
    <div class="hint">Mapa: Ilha Zero · bots completam as 50 vagas${HUM.ready || HUM.failed ? "" : "<br>Carregando personagens realistas..."}</div>
  </div>
  <div class="squad">${Array.from({ length: n }, (_, i) => i === 0 ? `<div class="slot me">${SET.name || 'Você'}</div>` : `<div class="slot"><span>🤖 Bot colega</span><button class="inv" data-inv="1">+ Convidar amigo</button></div>`).join('')}</div>`;
  $('lName').oninput = e => { SET.name = e.target.value.trim().slice(0, 14) || 'Jogador'; saveSet(); };
  $('chP').onclick = () => { SET.char = (SET.char + CHARS.length - 1) % CHARS.length; saveSet(); lobbyActors(); renderLobby(); };
  $('chN').onclick = () => { SET.char = (SET.char + 1) % CHARS.length; saveSet(); lobbyActors(); renderLobby(); };
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { G.mode = SET.mode = b.dataset.m; saveSet(); lobbyActors(); renderLobby(); });
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { G.diff = SET.diff = b.dataset.d; saveSet(); renderLobby(); });
  el.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => toast('Convidar amigos chega com o modo online (próxima fase). Por enquanto, bots ocupam a vaga.', 3.5));
  $('lSet').onclick = () => { G.phase = 'lobbyMenu'; openMenu(); $('mQuit').style.display = 'none'; $('mBack').onclick = () => { closePanels(); G.phase = 'lobby'; }; };
  $('lPlay').onclick = play;
}
function play() {
  sfxInit();
  for (const a of LOB.actors) removeModel(a); LOB.actors = [];
  $('lobby').classList.add('hidden'); $('result').classList.add('hidden'); $('hud').classList.remove('hidden');
  buildHud(); IN.adsOn = false; IN.fire = false;
  startMatch(); hudDirty();
  try { if (document.documentElement.requestFullscreen && matchMedia('(pointer:coarse)').matches) document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
}
function toLobby() {
  clearMatch(); G.phase = 'lobby'; G.result = null; G.view = null;
  $('hud').classList.add('hidden'); $('result').classList.add('hidden'); closePanels(); $('lobby').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
  lobbyActors(); renderLobby();
}
