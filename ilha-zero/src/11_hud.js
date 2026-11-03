// ================= tela do jogo: botões de toque, joystick, mira, mochila, mapa, avisos =================
const BTN = [ // id, rótulo, classe de posição
  ['fireR', '<i class="ic-fire"></i>', 'fire fireR'], ['fireL', '<i class="ic-fire"></i>', 'fire fireL'], ['ads', '<i class="ic-ads"></i>', 'ads'],
  ['jump', '⤒', 'jump'], ['crouch', '<b>AGACHAR</b>', 'crouch'], ['prone', '<b>DEITAR</b>', 'prone'], ['reload', '⟳', 'reload'],
  ['leanL', '◤', 'leanL'], ['leanR', '◥', 'leanR'], ['bag', '🎒', 'bag'], ['heal', '✚', 'heal'], ['act', 'PULAR', 'act'], ['seat', '⇄', 'seat'], ['view', '3P', 'view'], ['menu', '☰', 'menu'],
];
let hudBuilt = false, hudDirtyF = true;
const hudDirty = () => { hudDirtyF = true; };
function buildHud() {
  if (hudBuilt) return; hudBuilt = true;
  const h = $('hud');
  h.insertAdjacentHTML('beforeend', BTN.map(([id, l, c]) => `<div class="hb ${c}" data-b="${id}" id="b_${id}">${l}</div>`).join('') +
    `<div id="joy"><div id="joyK"></div></div><div id="wslots">${[0, 1, 2].map(i => `<div class="ws" data-b="w${i}" id="ws${i}"></div>`).join('')}</div>`);
}
// ---------- toque e mouse ----------
const PT = {}; let joyId = null, joyOx = 0, joyOy = 0;
const inGame = () => G.phase === 'match' && $('bagP').classList.contains('hidden') && $('mapP').classList.contains('hidden') && $('menuP').classList.contains('hidden');
function onDown(e) {
  if (G.phase !== 'match') return;
  const b = e.target.closest && e.target.closest('[data-b]');
  if (e.target.closest && e.target.closest('.panel')) return;
  if (b) { e.preventDefault(); btnDown(b.dataset.b, e); if (b.dataset.b === 'fireR' || b.dataset.b === 'fireL') PT[e.pointerId] = { k: 'look', x: e.clientX, y: e.clientY, fire: true }; return; }
  if (!inGame()) return;
  if (e.target.closest && e.target.closest('#pick')) return;
  if (e.pointerType === 'mouse') { if (document.pointerLockElement !== $('cv')) { try { $('cv').requestPointerLock(); } catch (x) { } } else if (e.button === 0) IN.fire = true; else if (e.button === 2) IN.adsOn = !IN.adsOn; return; }
  if (e.clientX < innerWidth * 0.42 && joyId === null && e.clientY > innerHeight * 0.3) {
    joyId = e.pointerId; joyOx = e.clientX; joyOy = e.clientY; PT[e.pointerId] = { k: 'joy' };
    const j = $('joy'); j.style.left = (joyOx - 60) + 'px'; j.style.top = (joyOy - 60) + 'px'; j.classList.add('on');
  } else PT[e.pointerId] = { k: 'look', x: e.clientX, y: e.clientY };
}
function onMove(e) {
  if (document.pointerLockElement === $('cv') && e.pointerType === 'mouse') { IN.ldx += e.movementX * 0.6; IN.ldy += e.movementY * 0.6; return; }
  const t = PT[e.pointerId]; if (!t) return;
  if (t.k === 'joy') {
    let dx = e.clientX - joyOx, dy = e.clientY - joyOy; const d = Math.hypot(dx, dy), R = 55;
    IN.sprint = dy < -R * 1.35; // empurrar além do círculo = correr
    if (d > R) { dx *= R / d; dy *= R / d; }
    IN.mx = dx / R; IN.my = -dy / R; $('joyK').style.transform = `translate(${dx}px,${dy}px)`;
  } else if (t.k === 'look') { IN.ldx += e.clientX - t.x; IN.ldy += e.clientY - t.y; t.x = e.clientX; t.y = e.clientY; }
}
function onUp(e) {
  if (e.pointerType === 'mouse' && document.pointerLockElement === $('cv')) { if (e.button === 0) IN.fire = false; }
  const t = PT[e.pointerId]; if (!t) return;
  if (t.k === 'joy') { joyId = null; IN.mx = IN.my = 0; IN.sprint = false; $('joyK').style.transform = ''; $('joy').classList.remove('on'); }
  if (t.fire) IN.fire = Object.values(PT).some(o => o !== t && o.fire);
  delete PT[e.pointerId];
}
addEventListener('pointerdown', onDown, { passive: false });
addEventListener('pointermove', onMove);
addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
addEventListener('contextmenu', e => e.preventDefault());
function btnDown(id) {
  const p = G.player; sfxInit();
  if (!p) return;
  if (id === 'fireR' || id === 'fireL') { IN.fire = true; return; }
  if (id === 'ads') { IN.adsOn = !IN.adsOn; return; }
  if (id === 'jump') { tryJump(p); return; }
  if (id === 'crouch') { setStance(p, 'crouch'); return; }
  if (id === 'prone') { setStance(p, 'prone'); return; }
  if (id === 'reload') { startReload(p); return; }
  if (id === 'leanL') { pLean(-1); return; }
  if (id === 'leanR') { pLean(1); return; }
  if (id === 'bag') { G.openCrate = null; openBag(); return; }
  if (id === 'heal') { $('healL').classList.toggle('hidden'); renderHealList(); return; }
  if (id === 'act') { pAct(); return; }
  if (id === 'seat') { switchSeat(p); return; }
  if (id === 'view') { G.view.fpp = !G.view.fpp; SET.view = G.view.fpp ? 'fpp' : 'tpp'; saveSet(); return; }
  if (id === 'menu') { openMenu(); return; }
  if (id === 'map') { toggleMap(); return; }
  if (id[0] === 'w') { switchWeapon(p, +id[1]); IN.adsOn = false; return; }
}
// teclado (para testar no computador)
const KEY = {};
addEventListener('keydown', e => {
  if (G.phase !== 'match' || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase(); if (KEY[k]) return; KEY[k] = true; const p = G.player;
  if (k === ' ') tryJump(p); else if (k === 'c') setStance(p, 'crouch'); else if (k === 'z') setStance(p, 'prone'); else if (k === 'r') startReload(p);
  else if (k === 'q') pLean(-1); else if (k === 'e') pLean(1); else if (k === 'f') { const c = ctx(); if (p.mode !== 'ground' || c.knocked || c.crate) pAct(); else { const n = nearList()[0]; if (n) pPickup(n.it, n.c); } }
  else if (k === 'tab') { e.preventDefault(); if ($('bagP').classList.contains('hidden')) { G.openCrate = null; openBag(); } else closePanels(); }
  else if (k === 'm') toggleMap(); else if (k === 'v') btnDown('view'); else if (k === 'h') { const hk = ['MED', 'FAK', 'BAND', 'PAIN', 'ENERGY'].find(x => canHeal(p, x)); if (hk) pHeal(hk); }
  else if (k === '1' || k === '2' || k === '3') btnDown('w' + (+k - 1));
  else if (k === 'escape') closePanels();
  updKeys();
});
addEventListener('keyup', e => { KEY[e.key.toLowerCase()] = false; updKeys(); });
function updKeys() { if (G.phase !== 'match') return; IN.mx = (KEY.d ? 1 : 0) - (KEY.a ? 1 : 0); IN.my = (KEY.w ? 1 : 0) - (KEY.s ? 1 : 0); IN.sprint = !!KEY.shift; }

// ---------- itens por perto ----------
const _nl = [];
function nearList() {
  const p = G.player, out = []; if (!p.alive || p.mode !== 'ground' || p.knocked) return out;
  for (const it of itemsNear(p.x, p.z, 2.3, _nl)) if (Math.abs(it.y - p.y) < 1.6) out.push({ it, d: Math.hypot(it.x - p.x, it.z - p.z) });
  out.sort((a, b) => (b.it.k.startsWith('w:') - a.it.k.startsWith('w:')) || a.d - b.d);
  return out;
}
const itemLabel = (k, n) => { const i = itemInfo(k); return i.n + (n > 1 ? ` <small>x${n}</small>` : ''); };
const itemIcon = k => { const t = itemInfo(k).type; return { weapon: '🔫', ammo: '▮', heal: '✚', att: '◎', helm: '⛑', vest: '🦺', bag: '🎒' }[t] || '•'; };

// ---------- atualização da tela ----------
let hudT = 0, feedEl = null;
function updateHud(dt) {
  const p = G.player, v = G.view; if (!p) return;
  const w = curW(p), zoom = p.alive && p.ads && w ? sightZoom(w) : 1;
  const air = p.mode !== 'ground', alive = p.alive;
  // mira / luneta
  const scope = $('scope'), scoped = alive && p.ads && zoom >= 2;
  scope.classList.toggle('hidden', !scoped);
  if (scoped) scope.dataset.z = Math.round(zoom) + 'x';
  const ch = $('cross'); ch.classList.toggle('hidden', !alive || air || scoped || p.knocked || !w);
  if (w && !scoped) { const sp = spreadOf(p, w) * 180 / Math.PI; ch.style.setProperty('--g', (p.ads ? 2 : 6 + sp * 9) + 'px'); ch.classList.toggle('dot', p.ads && !!w.att.sight); }
  $('flash').style.opacity = G.flash > 0 ? 0.25 : 0; G.flash -= dt;
  if ((hudT -= dt) > 0 && !hudDirtyF) { compass(v.yaw); return; }
  hudT = 0.12; hudDirtyF = false;
  compass(v.yaw);
  // barra de vida
  $('hpF').style.width = (p.knocked ? p.khp : p.hp) + '%'; $('hpF').className = p.knocked ? 'knock' : p.hp < 30 ? 'low' : '';
  $('boostF').style.width = p.boost + '%';
  $('armor').innerHTML = (p.helm ? `<span class="lv${p.helm.lv}">⛑${p.helm.lv}</span>` : '') + (p.vest ? `<span class="lv${p.vest.lv}">🦺${p.vest.lv}</span>` : '') + (p.bagLv ? `<span class="lv${p.bagLv}">🎒${p.bagLv}</span>` : '');
  const alv = G.actors.filter(a => a.alive).length;
  $('topR').innerHTML = `<div class="pill">👥 <b>${alv}</b> vivos</div><div class="pill">💀 <b>${p.kills}</b></div>`;
  // zona
  const z = ZONE, out = alive && Math.hypot(p.x - z.cx, p.z - z.cz) > z.r;
  $('zoneT').innerHTML = z.st === 'end' ? '' : `${z.st === 'wait' ? '⏳ Zona fecha em' : '⚠ Zona fechando'} <b>${fmtT(Math.max(0, z.t))}</b>${out ? ' · <span class="red">VOCÊ ESTÁ FORA</span>' : ''}`;
  // armas
  for (let i = 0; i < 3; i++) {
    const el = $('ws' + i), ww = p.wp[i];
    el.className = 'ws' + (i === p.cur ? ' on' : '') + (ww ? '' : ' empty');
    el.innerHTML = ww ? `<div class="wn">${wdef(ww).n}</div><div class="wa"><b>${ww.mag}</b>/${ammoOf(p, ww)}</div>${ww.att.sight ? `<div class="wsg">${ATT[ww.att.sight].n.replace('Luneta ', '').replace('Mira ', '')}</div>` : ''}` : `<div class="wn">${i === 2 ? 'Pistola' : 'Arma ' + (i + 1)}</div>`;
  }
  // barra de progresso (recarga, cura, reviver)
  const prog = $('prog');
  if (alive && (p.reloadT > 0 || p.healT > 0 || p.reviving)) {
    const tot = p.reloadT > 0 ? wdef(w).rel : p.healT > 0 ? HEAL[p.healK].t : 6, left = p.reloadT > 0 ? p.reloadT : p.healT > 0 ? p.healT : 6 - p.reviveT;
    prog.classList.remove('hidden'); prog.querySelector('span').textContent = p.reloadT > 0 ? 'Recarregando' : p.healT > 0 ? HEAL[p.healK].n : 'Revivendo';
    prog.querySelector('i').style.width = (100 * (1 - left / tot)) + '%';
  } else prog.classList.add('hidden');
  // revivendo você
  const rv = alive && p.knocked && G.actors.find(a => a.reviving === p);
  if (p.knocked) { prog.classList.remove('hidden'); prog.querySelector('span').textContent = rv ? rv.name + ' está te revivendo' : 'Derrubado: rasteje até um colega'; prog.querySelector('i').style.width = (rv ? rv.reviveT / 6 * 100 : p.khp) + '%'; }
  // botão de ação
  const act = $('b_act'), c = ctx();
  let at = '';
  if (alive) { if (p.mode === 'plane') at = 'PULAR'; else if (p.mode === 'fall') at = 'PARAQUEDAS'; else if (p.veh) at = 'SAIR'; else if (c.knocked) at = 'REVIVER'; else if (c.crate) at = 'SAQUEAR'; else if (c.veh) at = 'ENTRAR'; }
  act.textContent = at; act.classList.toggle('hidden', !at);
  // botões que só fazem sentido no chão
  for (const id of ['fireR', 'fireL', 'ads', 'jump', 'crouch', 'prone', 'reload', 'leanL', 'leanR', 'heal']) $('b_' + id).classList.toggle('hidden', !!(!alive || air || p.knocked || (p.veh && (p.seat === 0 || ['jump', 'crouch', 'prone', 'leanL', 'leanR'].includes(id)))));
  $('b_seat').classList.toggle('hidden', !alive || !p.veh);
  const vi = $('vehI'); vi.classList.toggle('hidden', !alive || !p.veh);
  if (p.veh) { const ve = p.veh; vi.innerHTML = `<b>${Math.round(Math.abs(ve.sp) * 3.6)}</b> km/h · ${ve.d.n}<div class="vb"><i style="width:${ve.hp / ve.d.hp * 100}%"></i></div>`; }
  $('b_leanL').classList.toggle('on', p.leanT < 0); $('b_leanR').classList.toggle('on', p.leanT > 0);
  $('b_crouch').classList.toggle('on', p.stance === 'crouch'); $('b_prone').classList.toggle('on', p.stance === 'prone'); $('b_ads').classList.toggle('on', IN.adsOn);
  $('b_view').textContent = G.view.fpp ? '1P' : '3P';
  $('wslots').classList.toggle('hidden', !alive || air);
  // lista de itens no chão (toque para pegar)
  const nl = alive && !air ? nearList().slice(0, 7) : [];
  $('pick').innerHTML = nl.map((n, i) => `<div class="pk" data-pk="${i}">${itemIcon(n.it.k)} ${itemLabel(n.it.k, n.it.n)}</div>`).join('');
  $('pick').onclick = e => { const el = e.target.closest('[data-pk]'); if (el) pPickup(nl[+el.dataset.pk].it); };
  if (!$('healL').classList.contains('hidden')) renderHealList();
  // painel aberto
  if (!$('bagP').classList.contains('hidden')) renderBag();
  // alerta do avião
  $('planeT').classList.toggle('hidden', !(alive && p.mode === 'plane'));
  if (p.mode === 'plane') $('planeT').innerHTML = `Avião sobre a ilha · toque em <b>PULAR</b> quando quiser<br><small>${PLANE.t * PLANE.sp > PLANE.len - 300 ? 'Últimos segundos!' : ''}</small>`;
  // feed de abates
  const now = G.matchT; G.feed = G.feed.filter(f => now - f.t < 6);
  $('feed').innerHTML = G.feed.map(f => `<div class="${f.me ? 'me' : ''}">${f.html}</div>`).join('');
  drawMini();
}
function compass(yaw) {
  const deg = ((-yaw * 180 / Math.PI) % 360 + 360) % 360, el = $('comp');
  const L = { 0: 'N', 45: 'NE', 90: 'L', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };
  let h = ''; for (let d = -60; d <= 60; d += 15) { const a = Math.round((deg + d) / 15) * 15, v = ((a % 360) + 360) % 360, x = (a - deg) * 2.2; h += `<span style="left:calc(50% + ${x}px)" class="${L[v] ? 'big' : ''}">${L[v] || v}</span>`; }
  el.innerHTML = h + `<b>${Math.round(deg)}°</b>`;
}
function renderHealList() {
  const p = G.player, ks = ['BAND', 'FAK', 'MED', 'ENERGY', 'PAIN'].filter(k => p.bag[k]);
  $('healL').innerHTML = ks.length ? ks.map(k => `<div class="hi ${canHeal(p, k) ? '' : 'off'}" data-h="${k}">${HEAL[k].n} <b>${p.bag[k]}</b></div>`).join('') : '<div class="hi off">Nenhum item de cura</div>';
  $('healL').onclick = e => { const el = e.target.closest('[data-h]'); if (el) { pHeal(el.dataset.h); $('healL').classList.add('hidden'); } };
}
// ---------- avisos de acerto e dano ----------
function hudHit(head, kill, dmg) {
  const el = $('hitm'); el.className = 'show' + (kill ? ' kill' : head ? ' head' : ''); clearTimeout(el._t); el._t = setTimeout(() => el.className = '', kill ? 500 : 160);
  sfx(kill ? 'killhit' : 'hit');
}
function hudHurt(src, dmg) {
  const el = $('hurt'); el.style.opacity = Math.min(0.7, 0.25 + dmg / 40); clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = 0, 250);
  if (src && src !== G.player) {
    const a = Math.atan2(-(src.x - G.player.x), -(src.z - G.player.z)) - G.view.yaw;
    const d = document.createElement('div'); d.className = 'dmgdir'; d.style.transform = `translate(-50%,-50%) rotate(${-a}rad)`; $('hud').appendChild(d); setTimeout(() => d.remove(), 900);
  }
  hudDirty();
}
function addFeed(src, a, wn, knocked) {
  const me = src === G.player || a === G.player || (src && src.team === G.player.team) || a.team === G.player.team;
  const s = src && src !== a ? `<b>${src.name}</b> ${knocked ? 'derrubou' : 'abateu'} <b>${a.name}</b> <small>${wn || ''}</small>` : `<b>${a.name}</b> ${wn === 'zona' ? 'morreu na zona' : wn === 'queda' ? 'caiu de muito alto' : knocked ? 'foi derrubado' : 'morreu'}`;
  G.feed.push({ html: s, t: G.matchT, me }); if (G.feed.length > 5) G.feed.shift();
  if (src === G.player && !knocked) toast(`💀 Você abateu ${a.name}!`, 1.8, 'gold');
  hudDirty();
}

// ---------- mapa ----------
const MAPC = document.createElement('canvas'); MAPC.width = MAPC.height = 512;
(function paintMap() {
  const g = MAPC.getContext('2d'), img = g.createImageData(512, 512);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
    const x = -HALF + i / 512 * MAP, z = -HALF + j / 512 * MAP, h = groundH(x, z), k = (j * 512 + i) * 4;
    let c;
    if (h < 0) c = h < -6 ? [38, 78, 104] : [70, 120, 128]; else if (h < 1.6) c = [190, 176, 135];
    else if (roadDist(x, z) < 4) c = [92, 92, 96]; else { const s = clamp(h / 60, 0, 1); c = [lerp(104, 140, s), lerp(138, 136, s), lerp(70, 100, s)]; }
    img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = '#8a7f72'; for (const b of BLD) { const s = 512 / MAP; g.fillRect((b.x0 + HALF) * s, (b.z0 + HALF) * s, Math.max(2, (b.x1 - b.x0) * s), Math.max(2, (b.z1 - b.z0) * s)); }
})();
const m2c = (v, S) => (v + HALF) / MAP * S;
function drawMapOn(cv, S, cx, cz, span) { // span = metros mostrados (MAP = mapa inteiro)
  const g = cv.getContext('2d'), sc = S / span, ox = cx - span / 2, oz = cz - span / 2;
  const P = (x, z) => [(x - ox) * sc, (z - oz) * sc];
  g.clearRect(0, 0, S, S);
  g.drawImage(MAPC, (ox + HALF) / MAP * 512, (oz + HALF) / MAP * 512, span / MAP * 512, span / MAP * 512, 0, 0, S, S);
  const z = ZONE;
  // fora da zona em azul
  g.save(); g.fillStyle = 'rgba(40,90,255,.28)'; g.beginPath(); g.rect(0, 0, S, S); const [zx, zy] = P(z.cx, z.cz); g.arc(zx, zy, Math.max(0, z.r * sc), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore();
  g.lineWidth = 2; g.strokeStyle = '#4da3ff'; g.beginPath(); g.arc(zx, zy, Math.max(0, z.r * sc), 0, Math.PI * 2); g.stroke();
  if (z.st !== 'end') { const [nx, ny] = P(z.nx, z.nz); g.strokeStyle = '#fff'; g.setLineDash([5, 4]); g.beginPath(); g.arc(nx, ny, z.nr * sc, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
  if (span > 600) { g.font = 'bold 13px system-ui'; g.textAlign = 'center'; for (const t of TOWNS) { const [x, y] = P(t.x, t.z); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(t.n, x + 1, y + 1); g.fillStyle = '#fff'; g.fillText(t.n, x, y); } }
  if (PLANE.on && span > 600) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.setLineDash([8, 6]); g.beginPath(); const [a1, b1] = P(PLANE.x0, PLANE.z0), [a2, b2] = P(PLANE.x0 + PLANE.dx * PLANE.len, PLANE.z0 + PLANE.dz * PLANE.len); g.moveTo(a1, b1); g.lineTo(a2, b2); g.stroke(); g.setLineDash([]); }
  for (const c of G.crates) if (c.kind === 'drop') { const [x, y] = P(c.x, c.z); g.fillStyle = '#ff3b3b'; g.fillRect(x - 4, y - 4, 8, 8); }
  const me = G.player;
  for (const a of G.actors) if (a.team === me.team && a.alive) {
    const [x, y] = P(a.x, a.z); g.fillStyle = a === me ? '#ffd23f' : a.knocked ? '#ff4d4d' : '#3ee07a';
    g.save(); g.translate(x, y); g.rotate(-a.yaw); g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); g.restore();
  }
}
function drawMini() { const p = G.player, t = p.alive ? p : G.view.spect || p; drawMapOn($('mini'), 128, t.x, t.z, 260); }
function toggleMap() { const m = $('mapP'); if (m.classList.contains('hidden')) { m.classList.remove('hidden'); drawMapOn($('mapC'), $('mapC').width, 0, 0, MAP); } else m.classList.add('hidden'); }
function closePanels() { for (const id of ['bagP', 'mapP', 'menuP']) $(id).classList.add('hidden'); G.openCrate = null; }

// ---------- mochila / saque ----------
function openBag() { $('bagP').classList.remove('hidden'); renderBag(); }
function renderBag() {
  const p = G.player, cr = G.openCrate;
  if (cr && (Math.hypot(cr.x - p.x, cr.z - p.z) > 3 || !G.crates.includes(cr))) G.openCrate = null;
  const near = nearList();
  const left = (G.openCrate ? `<h4>${G.openCrate.name}</h4>` + G.openCrate.items.map((e, i) => `<div class="li" data-ci="${i}">${itemIcon(e.k)} ${itemLabel(e.k, e.n)}</div>`).join('') : '') +
    `<h4>No chão</h4>` + (near.length ? near.map((n, i) => `<div class="li" data-ni="${i}">${itemIcon(n.it.k)} ${itemLabel(n.it.k, n.it.n)}</div>`).join('') : '<div class="li off">Nada por perto</div>');
  const bagItems = Object.keys(p.bag).sort((a, b) => itemInfo(a).type.localeCompare(itemInfo(b).type));
  const mid = `<h4>Mochila <small>${Math.round(bagWeight(p))}/${bagCap(p)}</small></h4>` + (bagItems.length ? bagItems.map(k => {
    const t = itemInfo(k).type;
    return `<div class="li"><span>${itemIcon(k)} ${itemLabel(k, p.bag[k])}</span><span class="acts">${t === 'heal' ? `<button data-use="${k}">usar</button>` : ''}${t === 'att' ? `<button data-att="${k}">equipar</button>` : ''}<button data-drop="${k}">soltar</button></span></div>`;
  }).join('') : '<div class="li off">Vazia</div>');
  const slotN = { sight: 'Mira', muzzle: 'Cano', grip: 'Empunh.', mag: 'Pente' };
  const right = `<h4>Equipamento</h4>` + [0, 1, 2].map(i => {
    const w = p.wp[i]; if (!w) return `<div class="wcard off">${i === 2 ? 'Pistola' : 'Arma ' + (i + 1)}: vazio</div>`;
    const d = wdef(w), slots = d.cls === 'sr' ? ['sight', 'muzzle', 'mag'] : d.cls === 'pistol' ? ['sight', 'muzzle', 'mag'] : d.cls === 'dmr' ? ['sight', 'muzzle', 'mag'] : ['sight', 'muzzle', 'grip', 'mag'];
    return `<div class="wcard"><div class="wt"><b>${d.n}</b> <small>${CLS[d.cls].n} · ${AMMO[d.ammo].n}</small><button data-dw="${i}">soltar</button></div><div class="atts">${slots.map(s => `<span class="at ${w.att[s] ? 'on' : ''}" data-det="${i}:${s}">${w.att[s] ? ATT[w.att[s]].n.replace(/ \(.*\)/, '') : slotN[s]}</span>`).join('')}</div></div>`;
  }).join('') + `<div class="gear">${p.helm ? `<span>⛑ Capacete nv.${p.helm.lv} <small>${Math.max(0, Math.round(p.helm.dur))}</small></span>` : '<span class="off">⛑ sem capacete</span>'}${p.vest ? `<span>🦺 Colete nv.${p.vest.lv} <small>${Math.max(0, Math.round(p.vest.dur))}</small></span>` : '<span class="off">🦺 sem colete</span>'}<span>🎒 Mochila nv.${p.bagLv}</span></div>`;
  $('bagL').innerHTML = left; $('bagM').innerHTML = mid; $('bagR').innerHTML = right;
  $('bagP').onclick = e => {
    const t = e.target, d = t.dataset;
    if (t.id === 'bagX' || t.closest('#bagX')) { closePanels(); return; }
    const li = t.closest('[data-ci],[data-ni]');
    if (d.use) pHeal(d.use); else if (d.att) pAttach(d.att); else if (d.drop) pDrop(d.drop, p.bag[d.drop]); else if (d.dw) pDropWeapon(+d.dw);
    else if (d.det) { const [i, s] = d.det.split(':'); pDetach(+i, s); }
    else if (li && li.dataset.ci != null && G.openCrate) pPickup(G.openCrate.items[+li.dataset.ci], G.openCrate);
    else if (li && li.dataset.ni != null) { const n = near[+li.dataset.ni]; if (n) pPickup(n.it); }
    renderBag();
  };
}
// ---------- menu, morte e resultado ----------
function openMenu() {
  $('menuP').classList.remove('hidden');
  $('menuP').innerHTML = `<div class="box"><h3>Configurações</h3>
  <label>Sensibilidade <input type="range" min="0.3" max="2.5" step="0.05" value="${SET.sens}" id="sSens"></label>
  <label>Sensibilidade na mira <input type="range" min="0.3" max="2" step="0.05" value="${SET.adsSens}" id="sAds"></label>
  <label>Gráficos <select id="sQ"><option value="0">Leve</option><option value="1">Médio</option><option value="2">Alto</option></select></label>
  <label>Volume <input type="range" min="0" max="1" step="0.05" value="${SET.vol}" id="sVol"></label>
  <div class="row"><button id="mBack" class="btn">VOLTAR AO JOGO</button><button id="mQuit" class="btn red">SAIR DA PARTIDA</button></div></div>`;
  $('sQ').value = SET.quality;
  $('sSens').oninput = e => { SET.sens = +e.target.value; saveSet(); }; $('sAds').oninput = e => { SET.adsSens = +e.target.value; saveSet(); };
  $('sVol').oninput = e => { SET.vol = +e.target.value; saveSet(); }; $('sQ').onchange = e => { SET.quality = +e.target.value; saveSet(); applyQuality(); };
  $('mBack').onclick = () => closePanels();
  $('mQuit').onclick = () => { closePanels(); if (!G.result && G.player.alive) { G.place = G.actors.filter(a => a.alive && a.team !== G.player.team).length + 1; } toLobby(); };
}
function hudDeadButTeam() {
  G.deathX = G.player.x; G.deathY = G.player.y; G.deathZ = G.player.z;
  toast('Você foi abatido. Assistindo sua equipe...', 3.5, 'bad');
}
function showResult(r) {
  const el = $('result'); el.classList.remove('hidden');
  el.innerHTML = `<div class="rbox ${r.win ? 'win' : ''}"><div class="rt">${r.win ? '🏆 CAMPEÃO DA ILHA!' : 'Fim de jogo'}</div>
  <div class="rp">#${r.place}<small>/${G.nTeams}</small></div>
  <div class="rs"><div><b>${r.kills}</b>abates</div><div><b>${r.dmg}</b>dano</div><div><b>${fmtT(r.time)}</b>sobreviveu</div>${G.size > 1 ? `<div><b>${r.teamKills}</b>abates da equipe</div>` : ''}</div>
  ${G.killer && !r.win ? `<div class="rk">Abatido por <b>${G.killer.name}</b></div>` : ''}
  <div class="row"><button class="btn big" id="rLobby">VOLTAR AO LOBBY</button>${!r.win && G.actors.some(a => a.alive) ? '<button class="btn alt" id="rWatch">ASSISTIR</button>' : ''}</div></div>`;
  $('rLobby').onclick = toLobby;
  if ($('rWatch')) $('rWatch').onclick = () => { el.classList.add('hidden'); G.watch = true; G.view.spect = G.actors.find(a => a.alive); G.deathX = G.player.x; G.deathZ = G.player.z; };
}
