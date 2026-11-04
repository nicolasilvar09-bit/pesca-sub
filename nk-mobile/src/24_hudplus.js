// ================= HUD estilo PUBG: equipe com vida, aviso de abate, alertas, tela de fim com estatísticas e ranking,
// e editor de botões (arrastar, tamanho e transparência) =================

// ---------- ranking por pontos ----------
const TIERS = [['Bronze', 0, '#c98a55'], ['Prata', 1200, '#c9d2dc'], ['Ouro', 1500, '#ffd23f'], ['Platina', 1800, '#6ee0d0'], ['Diamante', 2100, '#8fb8ff'], ['Mestre', 2400, '#ff6b8b']];
function rankOf(rp) {
  rp = rp == null ? 1000 : rp; let i = 0; while (i < TIERS.length - 1 && rp >= TIERS[i + 1][1]) i++;
  const t = TIERS[i], nx = TIERS[i + 1], k = nx ? (rp - t[1]) / (nx[1] - t[1]) : 1, sub = nx ? 5 - Math.min(4, Math.floor(k * 5)) : 0;
  return { n: t[0] + (sub ? ' ' + ['', 'I', 'II', 'III', 'IV', 'V'][sub] : ''), c: t[2], k, rp: Math.round(rp), next: nx ? nx[1] : null };
}

// ---------- estatísticas da partida ----------
function statReset() { G.st = { hs: 0, longest: 0, walk: 0, drive: 0, heals: 0, revives: 0, shots: 0, hits: 0, kn: 0 }; }
statReset();
const _sm = startMatch; startMatch = function (...a) { statReset(); hudPlusReset(); return _sm.apply(this, a); };
const _hl = hurtLocal; hurtLocal = function (a, dmg, src, head, wn) {
  if (src === G.player && a !== G.player && a.alive && dmg > 0) { G.st.hits++; if (head) G.st.hs++; }
  return _hl(a, dmg, src, head, wn);
};
const _kl = kill; kill = function (a, src, wn) {
  if (a.alive && src === G.player && a !== G.player) G.st.longest = Math.max(G.st.longest, Math.hypot(a.x - src.x, a.z - src.z));
  return _kl(a, src, wn);
};
const _fs = fireShot; fireShot = function (a, ...r) { const ok = _fs(a, ...r); if (ok && a === G.player) G.st.shots++; return ok; };
const _sh = startHeal; startHeal = function (a, k) { const ok = _sh(a, k); if (ok && a === G.player) G.st.heals++; return ok; };
function statStep(dt) {
  const p = G.player; if (!p || !p.alive || G.phase !== 'match') return;
  if (p.veh) G.st.drive += Math.abs(p.veh.sp) * dt; else if (p.mode === 'ground') G.st.walk += Math.hypot(p.vx, p.vz) * dt;
  if (p.reviving && p.reviveT + dt >= 6) G.st.revives++;
}

// ---------- painel da equipe, aviso de abate e alertas ----------
const HP_ = { zst: null, alive: 0, alT: 0, kbT: 0, kills: 0 };
function hudPlusReset() { HP_.zst = null; HP_.alive = 0; HP_.kills = 0; const a = $('alert'); if (a) a.className = ''; const k = $('kb'); if (k) k.className = ''; }
function alertMsg(html, cls, s) { const el = $('alert'); if (!el) return; el.innerHTML = html; el.className = 'show ' + (cls || ''); clearTimeout(el._t); el._t = setTimeout(() => el.className = '', (s || 3) * 1000); }
function killBanner(a, wn) {
  const el = $('kb'); if (!el) return; const p = G.player;
  const dist = Math.round(Math.hypot(a.x - p.x, a.z - p.z));
  el.innerHTML = `<div class="kbn">${p.kills}</div><div class="kbt"><small>${p.kills === 1 ? 'ABATE' : 'ABATES'}</small><div>Você abateu <b>${a.name}</b></div><small>${wn || ''} · ${dist} m</small></div>`;
  el.className = ''; void el.offsetWidth; el.className = 'show';
  clearTimeout(el._t); el._t = setTimeout(() => el.className = '', 2600);
}
function hudPlus() {
  const p = G.player; if (!p) return;
  // queda/paraquedas: altura e velocidade (como nos battle royale)
  const ai = $('airI'), air = p.alive && (p.mode === 'fall' || p.mode === 'chute');
  if (ai) { ai.classList.toggle('hidden', !air); if (air) { const h = Math.max(0, p.y - Math.max(groundH(p.x, p.z), 0)), sp = Math.hypot(p.vx, p.vy, p.vz) * 3.6;
    ai.innerHTML = `<div class="ab"><i style="height:${clamp(h / 7.2, 0, 100)}%"></i></div><div><b>${Math.round(h)}</b> m<br><b>${Math.round(sp)}</b> km/h<br><small>${p.mode === 'fall' ? (p.diveK > 0.5 ? 'MERGULHANDO' : p.glideK > 0.5 ? 'PLANANDO' : 'QUEDA LIVRE') : 'PARAQUEDAS'}</small></div>`; } }
  // equipe: nome, vida (derrubado em vermelho, morto riscado)
  const tm = $('team');
  if (tm) {
    const mates = G.size > 1 ? G.actors.filter(a => a.team === p.team) : [];
    tm.innerHTML = mates.map((a, i) => {
      const hp = !a.alive ? 0 : a.knocked ? a.khp : a.hp, st = !a.alive ? 'dead' : a.knocked ? 'kn' : '';
      return `<div class="tmr ${st} ${a === p ? 'me' : ''}"><i>${i + 1}</i><span>${(a.name || '').replace(/</g, '')}${a.veh ? ' 🚗' : ''}${a.knocked ? ' ✚' : ''}</span><u><b style="width:${hp}%"></b></u></div>`;
    }).join('');
  }
  // alertas da zona
  const z = ZONE, key = z.st + ':' + z.ph;
  if (HP_.zst !== key) {
    if (HP_.zst !== null && z.st === 'shrink') alertMsg('⚠ A ZONA ESTÁ FECHANDO<br><small>Corra para dentro do círculo branco</small>', 'zone', 3.5);
    else if (HP_.zst !== null && z.st === 'wait') alertMsg(`Fase ${z.ph + 1}: nova área segura marcada no mapa<br><small>Fecha em ${fmtT(z.t)}</small>`, 'zone', 3.5);
    HP_.zst = key; HP_.warn30 = false;
  }
  if (z.st === 'wait' && z.t < 30 && z.t > 25 && !HP_.warn30) { HP_.warn30 = true; alertMsg('A zona começa a fechar em 30 segundos', 'zone', 3); }
  // jogadores restantes
  const alv = G.actors.filter(a => a.alive).length;
  if (HP_.alive && alv < HP_.alive && [25, 10, 5, 3, 2].includes(alv) && p.alive) alertMsg(`Restam <b>${alv}</b> jogadores`, '', 2.5);
  HP_.alive = alv;
}

// ---------- tela de fim estilo PUBG ----------
function rateMatch(win) {
  const r = G.result; if (!r || r.rated) return; r.rated = true;
  const n = Math.max(2, G.nTeams || 2), pl = r.place || n;
  const before = SET.rp == null ? 1000 : SET.rp;
  const d = Math.round((n - pl) / (n - 1) * 45 - 15 + r.kills * 6 + (win ? 25 : 0) + Math.min(10, r.dmg / 100));
  SET.rp = Math.max(0, before + d); r.rpd = d; r.rpBefore = before;
  if (pl <= 10) SET.top10 = (SET.top10 || 0) + 1;
  saveSet();
}
const _efp = endForPlayer; endForPlayer = function (win) { if (G.result) return; _efp(win); rateMatch(win); };
showResult = function (r) {
  const el = $('result'); el.classList.remove('hidden');
  const st = G.st || {}, p = G.player, rk = rankOf(SET.rp), acc = st.shots ? Math.round(st.hits / st.shots * 100) : 0;
  const team = G.size > 1 ? G.actors.filter(a => a.team === p.team) : [p];
  const km = v => v >= 1000 ? (v / 1000).toFixed(1) + ' km' : Math.round(v) + ' m';
  el.innerHTML = `<div class="rbox2 ${r.win ? 'win' : ''}">
  <div class="rhead"><div class="rname">${(SET.name || 'Jogador').replace(/</g, '')}</div>
    <div class="rtitle">${r.win ? 'VITÓRIA! O ÚLTIMO DE PÉ!' : r.place <= 10 ? 'BOA! VOCÊ FICOU ENTRE OS 10 MELHORES' : 'MAIS SORTE NA PRÓXIMA'}</div></div>
  <div class="rplace"><b>#${r.place}</b><small>/${G.nTeams}</small></div>
  <div class="rgrid">
    <div><b>${r.kills}</b>abates</div><div><b>${st.hs || 0}</b>na cabeça</div><div><b>${r.dmg}</b>dano</div><div><b>${Math.round(st.longest || 0)} m</b>abate mais longe</div>
    <div><b>${fmtT(r.time)}</b>sobreviveu</div><div><b>${km((st.walk || 0) + (st.drive || 0))}</b>percorridos</div><div><b>${acc}%</b>precisão</div><div><b>${st.heals || 0}</b>curas</div>
  </div>
  ${G.size > 1 ? `<div class="rteam">${team.map(a => `<div class="${a === p ? 'me' : ''}"><span>${(a.name || '').replace(/</g, '')}${a.alive ? '' : ' 💀'}</span><span>${a.kills} abates</span><span>${Math.round(a.dmgDone || 0)} dano</span></div>`).join('')}</div>` : ''}
  <div class="rrank"><span class="rk2" style="color:${rk.c}">🏅 ${rk.n}</span><span class="rpd ${(r.rpd || 0) >= 0 ? 'up' : 'dn'}">${(r.rpd || 0) >= 0 ? '+' : ''}${r.rpd || 0} pontos</span>
    <div class="rbar"><i style="width:${Math.round(rk.k * 100)}%;background:${rk.c}"></i></div><small>${rk.rp} pontos${rk.next ? ' · próximo nível em ' + rk.next : ''}</small></div>
  ${G.killer && !r.win ? `<div class="rk">Abatido por <b>${G.killer.name}</b></div>` : ''}
  <div class="row"><button class="btn big" id="rLobby">VOLTAR AO LOBBY</button>${!r.win && G.actors.some(a => a.alive) ? '<button class="btn alt" id="rWatch">ASSISTIR</button>' : ''}</div></div>`;
  $('rLobby').onclick = toLobby;
  if ($('rWatch')) $('rWatch').onclick = () => { el.classList.add('hidden'); G.watch = true; G.view.spect = G.actors.find(a => a.alive); G.deathX = G.player.x; G.deathZ = G.player.z; };
};

// ---------- editor de botões ----------
const LAY_SEL = '#hud .hb, #joy, #wslots, #mini, #hpbar';
const layKey = el => el.id;
function applyLayout() {
  const L = SET.lay || {};
  document.querySelectorAll(LAY_SEL).forEach(el => {
    const v = L[layKey(el)];
    if (v) { el.style.left = (v[0] * 100) + '%'; el.style.top = (v[1] * 100) + '%'; el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = `translate(-50%,-50%) scale(${v[2] || 1})`; }
    else { el.style.left = el.style.top = el.style.right = el.style.bottom = el.style.transform = ''; }
  });
  document.documentElement.style.setProperty('--hudA', SET.hudA == null ? 1 : SET.hudA);
}
const _bh = buildHud; buildHud = function () { _bh(); applyLayout(); };
function openLayout() {
  if (G.net && G.net.on) { toast('Personalize os botões no lobby (fora da partida online).', 2.5); return; }
  closePanels(); resetInput();
  const fromLobby = G.phase !== 'match';
  buildHud(); window.__freeze = true;
  const hud = $('hud'), wasHidden = hud.classList.contains('hidden'); hud.classList.remove('hidden');
  if (fromLobby) $('lobby').classList.add('hidden');
  // no editor aparecem os botões de quem está a pé (os de dirigir ficam no lugar padrão)
  const hiddenEls = [...document.querySelectorAll(LAY_SEL)].filter(e => e.classList.contains('hidden') && !/^b_(drvL|drvR|gas|brake|seat|act)$/.test(e.id));
  hiddenEls.forEach(e => e.classList.remove('hidden'));
  const draft = JSON.parse(JSON.stringify(SET.lay || {})); let alpha = SET.hudA == null ? 1 : SET.hudA, sel = null, drag = null;
  const ov = document.createElement('div'); ov.id = 'layE';
  ov.innerHTML = `<div class="lbar"><b>Arraste os botões</b><label>Tamanho <input type="range" id="lyS" min="0.6" max="1.8" step="0.05" value="1"></label><label>Transparência <input type="range" id="lyA" min="0.25" max="1" step="0.05" value="${alpha}"></label><button class="btn alt" id="lyR">PADRÃO</button><button class="btn" id="lyOk">SALVAR</button></div>`;
  document.body.appendChild(ov);
  const keyOf = el => layKey(el);
  const cur = el => { const r = el.getBoundingClientRect(), v = draft[keyOf(el)]; return v ? v.slice() : [(r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight, 1]; };
  const put = (el, v) => { draft[keyOf(el)] = v; el.style.left = (v[0] * 100) + '%'; el.style.top = (v[1] * 100) + '%'; el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = `translate(-50%,-50%) scale(${v[2]})`; };
  const pickAt = (x, y) => document.elementsFromPoint(x, y).find(e => e.matches && e.matches(LAY_SEL)) || document.elementsFromPoint(x, y).map(e => e.closest && e.closest(LAY_SEL)).find(Boolean);
  const select = el => { document.querySelectorAll('.laysel').forEach(e => e.classList.remove('laysel')); sel = el; if (el) { el.classList.add('laysel'); $('lyS').value = cur(el)[2]; } };
  ov.addEventListener('pointerdown', e => {
    if (e.target.closest('.lbar')) return; e.preventDefault(); e.stopPropagation();
    const el = pickAt(e.clientX, e.clientY); select(el || null); if (!el) return;
    drag = { id: e.pointerId, el, sx: e.clientX, sy: e.clientY, v: cur(el) };
  });
  ov.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const v = drag.v; put(drag.el, [clamp(v[0] + (e.clientX - drag.sx) / innerWidth, 0.03, 0.97), clamp(v[1] + (e.clientY - drag.sy) / innerHeight, 0.04, 0.96), v[2]]); });
  ov.addEventListener('pointerup', () => { drag = null; });
  $('lyS').oninput = e => { if (!sel) return; const v = cur(sel); v[2] = +e.target.value; put(sel, v); };
  $('lyA').oninput = e => { alpha = +e.target.value; document.documentElement.style.setProperty('--hudA', alpha); };
  const done = save => {
    if (save) { SET.lay = draft; SET.hudA = alpha; saveSet(); }
    ov.remove(); select(null); applyLayout(); hiddenEls.forEach(e => e.classList.add('hidden'));
    if (fromLobby) { if (wasHidden) hud.classList.add('hidden'); $('lobby').classList.remove('hidden'); }
    window.__freeze = false; hudDirty();
    if (save) toast('Botões salvos!', 1.5);
  };
  $('lyOk').onclick = () => done(true);
  $('lyR').onclick = () => { for (const k in draft) delete draft[k]; SET.lay = {}; alpha = 1; $('lyA').value = 1; applyLayout(); };
}
addEventListener('resize', () => { if (hudBuilt) applyLayout(); });
