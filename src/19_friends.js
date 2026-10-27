// ================= amigos (bots): adicionar, criar, convidar para pescar e campeonato em dupla =================
const FR_COLORS = [0x1b1e22, 0x23304a, 0x3b2b1e, 0x2e4a2a, 0x5a2328, 0x4a3a62, 0x14505a, 0x6a5a2a];
const FR_SPEC = {
  toca: { n: 'Caçador de toca', d: 'Vai atrás de garoupa, badejo e cherne nas tocas.', pref: f => f.sp.habit === 'hole' ? 12 : 0 },
  azul: { n: 'Pescador de azul', d: 'Prefere peixe de passagem: olhete, xaréu, albacora.', pref: f => f.sp.habit === 'pelagic' ? 12 : 0 },
  espera: { n: 'Mestre da espera', d: 'Paciente: acerta mais quando o peixe vem curioso.', pref: f => f.state === 'curious' ? 8 : 0 },
  raso: { n: 'Pescador de raso', d: 'Fica no raso pegando sargo, salema e cocoroca.', pref: f => f.pos.y > -6 ? 10 : 0 },
};
const FR_LVL = [['Iniciante', 0.12], ['Bom de tiro', 0.18], ['Fera', 0.25]];
const FRIEND_POOL = [
  { id: 'marcao', name: 'Marcão', col: 0, lvl: 2, spec: 'toca', bio: 'Pescador antigo da Jorge Grego. Conhece cada toca.' },
  { id: 'taina', name: 'Tainá', col: 1, lvl: 2, spec: 'espera', bio: 'Campeã de apneia, fica 2 minutos no fundo esperando.' },
  { id: 'zelaje', name: 'Zé da Laje', col: 2, lvl: 1, spec: 'toca', bio: 'Cresceu na Laje Branca. Fala pouco, pesca muito.' },
  { id: 'bia', name: 'Bia Mergulho', col: 6, lvl: 1, spec: 'raso', bio: 'Instrutora de mergulho, ótima companhia para começar.' },
  { id: 'cacau', name: 'Cacau', col: 4, lvl: 2, spec: 'azul', bio: 'Só pensa em olhete e albacora no Parcel de Fora.' },
  { id: 'dudu', name: 'Dudu', col: 3, lvl: 0, spec: 'raso', bio: 'Primo que está aprendendo. Animado, mas erra muito.' },
  { id: 'nego', name: 'Nego da Foz', col: 7, lvl: 1, spec: 'espera', bio: 'Robalo é com ele, mesmo na água turva.' },
  { id: 'lu', name: 'Lu Arpão', col: 5, lvl: 2, spec: 'azul', bio: 'Arbalete de 110 e tiro certeiro de longe.' },
];
const friends = () => (SV.friends = SV.friends || []);
const friendById = id => friends().find(f => f.id === id);
const fLevel = f => Math.min(10, 1 + Math.floor((f.xp || 0) / 120)); // amizade 1–10
const fSkill = f => FR_LVL[f.lvl][1] + fLevel(f) * 0.008;
const withMe = () => friends().filter(f => f.boat);
const FR = { bots: [] };

function addFriend(def) { if (friendById(def.id)) return; friends().push({ id: def.id, name: def.name, col: def.col, lvl: def.lvl, spec: def.spec, bio: def.bio, xp: 0, custom: !!def.custom }); save(); }
function makeBot(f, pos) {
  const rig = buildDiver(false); rig.suitMat.map = null; rig.suitMat.color.set(FR_COLORS[f.col] ?? FR_COLORS[0]); rig.suitMat.needsUpdate = true;
  const gm = buildGunMesh(gunById(f.lvl >= 2 ? 'a110' : 'a90'), true); gm.g.rotation.set(-Math.PI / 2, 0, 0); gm.g.position.set(0, -0.09, 0); rig.handR.add(gm.g);
  const spec = FR_SPEC[f.spec] || FR_SPEC.toca;
  return { id: f.id, f, name: f.name, rig, pos: pos.clone(), vel: new V3(), yaw: rand(0, TAU), pitch: 0, state: 'surf', t: rand(3, 8), target: null, aimT: 0, n: 0, kg: 0, kick: 0, skill: () => fSkill(f), pref: spec.pref };
}
function clearFriendBots() { for (const b of FR.bots) scene.remove(b.rig.root); FR.bots = []; }
// amigo pegou: o peixe vai para a caixa térmica do barco (pescaria em grupo)
function friendCatch(b, f) {
  SV.cooler.push({ key: f.key, name: f.sp.name, cm: Math.round(f.len * 100), kg: f.kg, len: f.len, by: b.name });
  b.f.xp = (b.f.xp || 0) + 10 + f.kg * 4;
  toast(`${b.name} pegou ${f.sp.name.toLowerCase()} de ${fmtKg(f.kg)} kg · vai para a caixa`, 2.5); save();
}
const FR_LINES = ['Tem garoupa naquela toca grande!', 'Água boa hoje, hein!', 'Vou descer ali na pedra.', 'Cuidado com a correnteza.', 'Viu o cardume de xaréu passando?', 'Descansa na superfície antes de descer de novo!', 'Bora mais um mergulho!'];
let frTalkT = 20;
function updateFriends(dt, t) {
  const want = P.mode === 'swim' && !COMP.on ? withMe() : [];
  // cria/remove os bots conforme quem está na lancha
  if (want.length !== FR.bots.length || want.some(f => !FR.bots.find(b => b.id === f.id))) {
    clearFriendBots();
    want.forEach((f, i) => { const a = i * 2.4 + 1; FR.bots.push(makeBot(f, new V3(P.pos.x + Math.cos(a) * 4, -0.2, P.pos.z + Math.sin(a) * 4))); });
    if (want.length) toast(`${want.map(f => f.name).join(' e ')} ${want.length > 1 ? 'pularam' : 'pulou'} na água com você.`, 3);
  }
  if (!FR.bots.length) return;
  const c = { x: P.pos.x, z: P.pos.z, r: 22 };
  for (const b of FR.bots) { stepBot(b, dt, t, c, friendCatch); b.f.xp = (b.f.xp || 0) + dt * 0.05; }
  if ((frTalkT -= dt) <= 0) { frTalkT = rand(35, 70); const b = pick(FR.bots); if (b.pos.distanceTo(P.pos) < 40) toast(`${b.name}: "${pick(FR_LINES)}"`, 3); }
}

// ---------- aba Amigos ----------
let frForm = null;
function friendsHTML() {
  const mine = friends(), pool = FRIEND_POOL.filter(p => !friendById(p.id));
  const card = f => { const sp = FR_SPEC[f.spec] || FR_SPEC.toca, lv = fLevel(f);
    return `<div class="it"><span class="av" style="background:#${(FR_COLORS[f.col] ?? 0).toString(16).padStart(6, '0')}">${f.name[0]}</span><div style="flex:1"><div class="n">${f.name} <span class="d">· ${FR_LVL[f.lvl][0]} · ${sp.n}</span></div><div class="d">${f.bio || sp.d} Amizade ${lv}/10.</div><div class="lvs">${Array.from({ length: 10 }, (_, i) => `<i class="lv ${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${f.boat ? `<button class="btn gold" data-fboat="${f.id}">NA LANCHA ✓</button>` : `<button class="btn alt" data-fboat="${f.id}" ${withMe().length >= 2 ? 'disabled' : ''}>CONVIDAR</button>`}<button class="btn alt" data-fdel="${f.id}">✕</button></div></div>`; };
  let h = `<div class="it" style="margin-bottom:8px"><div class="d">Convide até 2 amigos para a lancha: eles mergulham junto, o que pegam vai para a caixa térmica e contam como dupla de segurança. Quanto mais pescam com você, maior a amizade e melhor o tiro deles. No Campeonato dá para competir em dupla.</div></div>`;
  h += `<div class="n" style="margin:6px 0">Seus amigos (${mine.length})</div><div class="list">${mine.length ? mine.map(card).join('') : '<div class="it"><div class="d">Ainda sem amigos. Adicione alguém da turma abaixo ou crie o seu.</div></div>'}</div>`;
  if (frForm) {
    h += `<div class="it" style="flex-direction:column;align-items:stretch;gap:8px;margin-top:8px"><div class="n">Criar amigo</div>
      <input id="frName" maxlength="16" placeholder="Nome" value="${frForm.name.replace(/"/g, '')}" style="padding:8px;border-radius:8px;border:1px solid var(--line);background:#031018;color:#cfe">
      <div style="display:flex;gap:6px;flex-wrap:wrap">${FR_COLORS.map((c, i) => `<button class="sw ${frForm.col === i ? 'on' : ''}" data-frc="${i}" style="background:#${c.toString(16).padStart(6, '0')}"></button>`).join('')}<span class="d" style="align-self:center">cor da roupa</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${FR_LVL.map(([n], i) => `<button class="btn ${frForm.lvl === i ? 'gold' : 'alt'}" data-frl="${i}">${n}</button>`).join('')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${Object.entries(FR_SPEC).map(([k, v]) => `<button class="btn ${frForm.spec === k ? 'gold' : 'alt'}" data-frs="${k}">${v.n}</button>`).join('')}</div>
      <div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn alt" id="frCancel">CANCELAR</button><button class="btn gold" id="frSave">CRIAR</button></div></div>`;
  } else h += `<div style="display:flex;justify-content:flex-end;margin:8px 0"><button class="btn gold" id="frNew">+ CRIAR AMIGO</button></div>`;
  if (pool.length) h += `<div class="n" style="margin:6px 0">Turma da Costa Verde</div><div class="list">` + pool.map(p => { const sp = FR_SPEC[p.spec];
    return `<div class="it"><span class="av" style="background:#${FR_COLORS[p.col].toString(16).padStart(6, '0')}">${p.name[0]}</span><div style="flex:1"><div class="n">${p.name} <span class="d">· ${FR_LVL[p.lvl][0]} · ${sp.n}</span></div><div class="d">${p.bio}</div></div><button class="btn" data-fadd="${p.id}">ADICIONAR</button></div>`; }).join('') + '</div>';
  return h;
}
function bindFriends(B, on) {
  on('[data-fadd]', b => { addFriend(FRIEND_POOL.find(p => p.id === b.dataset.fadd)); AU.coin(); });
  on('[data-fboat]', b => { const f = friendById(b.dataset.fboat); if (!f.boat && withMe().length >= 2) return; f.boat = !f.boat; AU.click(); });
  on('[data-fdel]', b => { const f = friendById(b.dataset.fdel); if (confirm(`Remover ${f.name} dos amigos?`)) SV.friends = friends().filter(x => x !== f); });
  const nb = $('frNew'); if (nb) nb.onclick = () => { frForm = { name: '', col: 1, lvl: 1, spec: 'toca' }; AU.click(); renderShop(); };
  if (frForm) {
    const keep = () => { const n = $('frName'); if (n) frForm.name = n.value; };
    B.querySelectorAll('[data-frc]').forEach(x => x.onclick = () => { keep(); frForm.col = +x.dataset.frc; renderShop(); });
    B.querySelectorAll('[data-frl]').forEach(x => x.onclick = () => { keep(); frForm.lvl = +x.dataset.frl; renderShop(); });
    B.querySelectorAll('[data-frs]').forEach(x => x.onclick = () => { keep(); frForm.spec = x.dataset.frs; renderShop(); });
    $('frCancel').onclick = () => { frForm = null; renderShop(); };
    $('frSave').onclick = () => {
      keep(); const name = frForm.name.trim(); if (!name) { toast('Dê um nome para o seu amigo.', 2, 'bad'); return; }
      addFriend({ id: 'c' + Date.now().toString(36), name, col: frForm.col, lvl: frForm.lvl, spec: frForm.spec, bio: 'Amigo criado por você.', custom: true });
      toast(`${name} entrou na sua turma!`, 2.5, 'gold'); frForm = null; AU.coin(); renderShop();
    };
  }
}

// ---------- campeonato em dupla ----------
const DUO_RIVALS = [['Rafa Bicuda', 0x5a2328], ['Gui Garoupa', 0x2e4a2a], ['Leo do Parcel', 0x14505a], ['Mari Sub', 0x4a3a62], ['Joca', 0x3b2b1e], ['Tiago Costão', 0x1b1e22], ['Duda Apneia', 0x23304a], ['Beto Cherne', 0x6a5a2a]];
let duoPartner = null;
function duoHTML() {
  const mine = friends(); if (!duoPartner || !friendById(duoPartner)) duoPartner = mine[0] ? mine[0].id : null;
  return `<div class="it" style="margin:10px 0 8px"><div><div class="n">Campeonato em dupla · 10 minutos</div><div class="d">Você e um amigo contra 2 duplas. Conta a soma de peixes da equipe; empate decide pelo peso. Inscrição R$ 200. Prêmios para a dupla: 1º R$ 3.000 · 2º R$ 1.200.</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${mine.length ? mine.map(f => `<button class="btn ${duoPartner === f.id ? 'gold' : 'alt'}" data-duop="${f.id}">${f.name}</button>`).join('') : '<span class="d">Adicione um amigo na aba Amigos para competir em dupla.</span>'}</div></div></div><div class="list">` +
    SPOTS.filter(s => s.r).map(s => `<div class="it"><div><div class="n">${s.name}</div><div class="d">${s.depth}</div></div><button class="btn gold" data-duo="${s.id}" ${COMP.on || SV.money < 200 || !duoPartner ? 'disabled' : ''}>EM DUPLA</button></div>`).join('') + '</div>';
}
function bindDuo(on) {
  on('[data-duop]', b => { duoPartner = b.dataset.duop; AU.click(); });
  on('[data-duo]', b => { closePanels(); startDuo(b.dataset.duo); });
}
function startDuo(id) {
  const f = friendById(duoPartner) || friends()[0]; if (!f) { toast('Adicione um amigo na aba Amigos para competir em dupla.', 3); return; }
  startComp(id, true);
  if (!COMP.on) return;
  clearFriendBots();
  const s = COMP.spot, mk = (name, col, team, skill) => { const a = rand(0, TAU); const fake = { id: name, name, col: 0, lvl: 1, spec: 'toca' }; const b = makeBot(fake, new V3(s.x + Math.cos(a) * 12, -0.2, s.z + Math.sin(a) * 12)); b.rig.suitMat.color.set(col); b.skill = skill; b.team = team; b.pref = null; return b; };
  for (const b of COMP.bots) scene.remove(b.rig.root);
  const partner = makeBot(f, new V3(P.pos.x + 3, -0.2, P.pos.z + 2)); partner.team = 0;
  // rivais sorteados, sem repetir nomes da sua turma
  const mine = new Set(friends().map(x => x.name)), rv = DUO_RIVALS.filter(r => !mine.has(r[0])).sort(() => Math.random() - 0.5).slice(0, 4);
  COMP.bots = [partner, mk(rv[0][0], rv[0][1], 1, 0.2), mk(rv[1][0], rv[1][1], 1, 0.17), mk(rv[2][0], rv[2][1], 2, 0.21), mk(rv[3][0], rv[3][1], 2, 0.16)];
  COMP.duo = { names: [`Você + ${f.name}`, `${rv[0][0]} + ${rv[1][0]}`, `${rv[2][0]} + ${rv[3][0]}`], friend: f };
  toast(`Dupla com ${f.name}! 10 minutos na ${s.name}.`, 4, 'gold');
}
// parceiro de dupla: conta para a equipe e o peixe vai para a caixa
function duoPartnerCatch(b, f) { b.n++; b.kg += f.kg; friendCatch(b, f); }
// placar por equipe
function duoRows() {
  const T = [{ name: COMP.duo.names[0], n: COMP.me.n, kg: COMP.me.kg, me: true }, { name: COMP.duo.names[1], n: 0, kg: 0 }, { name: COMP.duo.names[2], n: 0, kg: 0 }];
  for (const b of COMP.bots) { T[b.team].n += b.n; T[b.team].kg += b.kg; }
  return T.sort((a, b) => b.n - a.n || b.kg - a.kg);
}
