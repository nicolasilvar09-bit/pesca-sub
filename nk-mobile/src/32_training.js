// ================= campo de treino: todas as armas e acessórios no chão, munição infinita, alvos de 10 a 300 m e um alvo andando =================
// sem bots, sem zona e sem avião; você não toma dano. Sai pelo menu (☰ > SAIR DA PARTIDA).
const TRAIN = { on: false, spot: null, stats: null, ammoT: 0, mover: null, signs: [] };
const TRAIN_D = [10, 25, 50, 100, 150, 200, 300];
// procura um campo plano e aberto (sem casas nem estrada) com 320 m livres numa direção
function trainSpot() {
  if (TRAIN.spot) return TRAIN.spot;
  let best = null;
  for (let k = 0; k < 900 && !best; k++) {
    const x = (Math.random() - 0.5) * HALF * 1.2, z = (Math.random() - 0.5) * HALF * 1.2, a = Math.random() * 6.283, h = groundH(x, z);
    if (h < 3 || bldAt(x, z, 25) || roadDist(x, z) < 15) continue;
    const fx = -Math.sin(a), fz = -Math.cos(a); let ok = true;
    for (let d = -20; d <= 330 && ok; d += 10) for (const s of [-12, 0, 12]) { const px = x + fx * d - fz * s, pz = z + fz * d + fx * s, ph = groundH(px, pz); if (ph < 2 || Math.abs(ph - h) > 6 + d * 0.03 || bldAt(px, pz, 3) || riverDist(px, pz) < 8) { ok = false; break; } }
    if (ok) best = { x, z, yaw: a };
  }
  return TRAIN.spot = best || { x: 0, z: 0, yaw: 0 };
}
// placa com a distância em cima de cada alvo
function trainSign(txt) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = 'rgba(15,20,40,0.85)'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#ffd166'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 90);
  g.fillStyle = '#ffd166'; g.font = 'bold 56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 50);
  const t = new T.CanvasTexture(c), s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: true }));
  return s;
}
function startTraining() {
  sfxInit();
  for (const a of LOB.actors) removeModel(a); LOB.actors = [];
  $('lobby').classList.add('hidden'); $('result').classList.add('hidden'); $('hud').classList.remove('hidden');
  buildHud(); IN.adsOn = false; IN.fire = false;
  trainOff(); for (const sg of TRAIN.signs) scene.remove(sg); TRAIN.signs = [];
  clearMatch(); for (const it of G.items.slice()) removeItem(it);
  for (const v of VEH) scene.remove(v.mesh); VEH.length = 0;
  const S = trainSpot(), fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw), rx = -fz, rz = fx, at = (side, fwd) => [S.x + rx * side + fx * fwd, S.z + rz * side + fz * fwd];
  G.size = 1; G.training = TRAIN.on = true; G.god = true;
  // você
  const p = makeActor({ name: SET.name || 'Jogador', team: 1, bot: false, skill: 1, look: Object.assign({}, CHARS[SET.char] || CHARS[0]), uid: 'me', ix: 0 });
  p.ai = null; p.mode = 'ground'; p.x = S.x; p.z = S.z; p.y = groundH(S.x, S.z) + 0.1; p.onGround = true; p.yaw = S.yaw; p.bagLv = 3; p.helm = { lv: 3, dur: 999 }; p.vest = { lv: 3, dur: 999 };
  G.actors = [p]; buildModel(p); G.player = p;
  // alvos (bonecos parados, cada um numa equipe; não atiram e não morrem: só mostram o dano)
  const placed = [];
  TRAIN_D.forEach((d, i) => {
    const [x, z] = at((i % 2 ? 1 : -1) * 2.5, d), a = makeActor({ name: d + ' m', team: 10 + i, bot: false, look: randLook(), ix: 1 + i });
    a.ai = null; a.dummy = true; a.mode = 'ground'; a.x = x; a.z = z; a.y = groundH(x, z) + 0.05; a.onGround = true; a.yaw = S.yaw + Math.PI; a.relax = true;
    G.actors.push(a); buildModel(a); placed.push(a);
    const sg = trainSign(d + ' m'); sg.position.set(x, a.y + 2.6 + d * 0.004, z); sg.scale.set(1.2 + d * 0.012, (1.2 + d * 0.012) * 0.375, 1); scene.add(sg); a.trainSign = sg; TRAIN.signs.push(sg);
  });
  { const [x, z] = at(0, 60), a = makeActor({ name: 'alvo móvel', team: 30, bot: false, look: randLook(), ix: 9 }); a.ai = null; a.dummy = true; a.mode = 'ground'; a.x = x; a.z = z; a.y = groundH(x, z) + 0.05; a.onGround = true; a.yaw = S.yaw + Math.PI; G.actors.push(a); buildModel(a); TRAIN.mover = { a, x0: x, z0: z, rx, rz, t: 0 };
    const sg = trainSign('móvel 60 m'); sg.position.set(x, a.y + 2.7, z); sg.scale.set(1.9, 0.71, 1); scene.add(sg); a.trainSign = sg; TRAIN.signs.push(sg); }
  // mesa de armas: todas as armas em fileiras ao lado, com acessórios, cura e granadas
  const ks = Object.keys(WEAP); let n = 0;
  for (const k of ks) { const row = Math.floor(n / 8), col = n % 8, [x, z] = at(-5 - row * 1.6, -4 + col * 1.1); dropItem('w:' + k, 1, x, groundH(x, z) + 0.05, z); n++; }
  const extra = [...Object.keys(ATT), 'FAK', 'MED', 'ENERGY', 'PAIN', 'BAND', 'FRAG', 'SMOKE', 'MOLO', 'PAN']; n = 0;
  for (const k of extra) { const row = Math.floor(n / 9), col = n % 9, [x, z] = at(5 + row * 1.3, -4 + col * 1.0); dropItem(k, k === 'BAND' ? 10 : 3, x, groundH(x, z) + 0.05, z); n++; }
  // carros para testar
  [['seda', 9, 8], ['jipe', 13, 8], ['moto', 17, 6]].forEach(([k, s, f]) => { const [x, z] = at(s, f); addVehicle(k, x, z, S.yaw + Math.PI / 2); });
  Object.assign(ZONE, { cx: S.x, cz: S.z, r: 1e5, nr: 1e5, ph: PHASES.length, st: 'end', dmg: 0 });
  PLANE.on = DROPP.on = false; PLANE.m.visible = DROPP.m.visible = false;
  G.view = { yaw: S.yaw, pitch: -0.05, fpp: SET.view === 'fpp', spect: null };
  G.teams = {}; G.teamsLeft = 99; G.nTeams = 99; G.teamOut = {};
  G.matchT = 0; G.over = false; G.watch = false; G.deathLog = []; G.place = 0; G.feed = []; G.drops = []; G.result = null;
  TRAIN.stats = { hits: 0, dmg: 0, last: null };
  G.phase = 'match'; hudDirty();
  trainHud(); toast('Campo de treino: armas à esquerda, acessórios e cura à direita. Munição infinita.', 4);
}
// placar do treino (canto de cima)
function trainHud() {
  let el = $('trainHud'); if (!el) { el = document.createElement('div'); el.id = 'trainHud'; $('hud').appendChild(el); }
  el.style.display = TRAIN.on ? '' : 'none';
  const s = TRAIN.stats, l = s && s.last;
  el.innerHTML = `<b>🎯 CAMPO DE TREINO</b><span>${l ? `último: <i>${l.dmg}</i> de dano · ${l.d} m · ${l.head ? '<em>CABEÇA</em>' : 'corpo'}` : 'atire nos alvos'}</span><span>acertos ${s ? s.hits : 0} · dano total ${s ? Math.round(s.dmg) : 0}</span>`;
}
// alvos não morrem: mostram o dano, caem por 1,5 s e voltam
(function hookTrainHurt() {
  const base = hurtLocal;
  hurtLocal = function (a, dmg, src, head, wn) {
    if (!TRAIN.on || !a.dummy) return base(a, dmg, src, head, wn);
    if (!a.alive || dmg <= 0) return;
    if (src === G.player) { hudHit(head, false, dmg); const d = Math.round(Math.hypot(a.x - src.x, a.z - src.z)); TRAIN.stats.hits++; TRAIN.stats.dmg += dmg; TRAIN.stats.last = { dmg: Math.round(dmg), d, head }; trainHud(); }
    a.hp -= dmg; if (a.hp <= 0) { a.hp = 100; if (a.model) { a.model.g.visible = false; setTimeout(() => { if (a.model) a.model.g.visible = true; }, 1500); } if (src === G.player) toast(`Abatido a ${Math.round(Math.hypot(a.x - src.x, a.z - src.z))} m`, 1.2); }
  };
})();
// a cada passo: munição infinita, alvo móvel andando de um lado para o outro
(function hookTrainStep() {
  const base = stepMatch;
  stepMatch = function (dt) {
    base(dt);
    if (!TRAIN.on) return;
    const p = G.player;
    if ((TRAIN.ammoT -= dt) <= 0) { TRAIN.ammoT = 0.5; for (const w of p.wp) if (w) { const ak = 'a:' + WEAP[w.k].ammo; if ((p.bag[ak] || 0) < 300) p.bag[ak] = 300; } }
    const m = TRAIN.mover; if (m && m.a.alive) { m.t += dt; const off = Math.sin(m.t * 0.55) * 9, sp = Math.cos(m.t * 0.55) * 9 * 0.55; m.a.x = m.x0 + m.rx * off; m.a.z = m.z0 + m.rz * off; m.a.vx = m.rx * sp; m.a.vz = m.rz * sp; m.a.y = groundH(m.a.x, m.a.z) + 0.05; m.a.yaw = Math.atan2(-m.a.vx, -m.a.vz); if (m.a.trainSign) m.a.trainSign.position.set(m.a.x, m.a.y + 2.7, m.a.z); }
  };
})();
// voltar ao lobby ou começar partida normal: desliga o treino e limpa as placas
function trainOff() {
  if (!TRAIN.on) return; TRAIN.on = G.training = false; G.god = false; TRAIN.mover = null;
  for (const sg of TRAIN.signs) scene.remove(sg); TRAIN.signs = [];
  const el = $('trainHud'); if (el) el.style.display = 'none';
}
(function hookTrainExit() {
  const tl = toLobby; toLobby = function (...a) { trainOff(); return tl.apply(this, a); };
  const sm = startMatch; startMatch = function (...a) { trainOff(); return sm.apply(this, a); };
  const rl = renderLobby; renderLobby = function (...a) {
    const r = rl.apply(this, a); const side = document.querySelector('#lobby .lb-side');
    if (side && !$('lTrain')) { const b = document.createElement('button'); b.className = 'lb-ic'; b.id = 'lTrain'; b.innerHTML = '<span>🎯</span><small>Treino</small>'; b.onclick = () => { if (PARTY.pid && PARTY.members.length > 1) { toast('Saia do esquadrão para treinar.'); return; } startTraining(); }; side.appendChild(b); }
    return r;
  };
})();
// no treino o campo é roçado: sem capim e mato alto escondendo armas e alvos
(function hookTrainGrass() {
  const base = gfxStep;
  gfxStep = function (...a) {
    const r = base.apply(this, a);
    if (TRAIN.on) { grassM.visible = flowerM.visible = false; if (typeof UNDER !== 'undefined') { if (UNDER.tall) UNDER.tall.visible = false; for (const k in UNDER.inst) UNDER.inst[k].visible = false; } TRAIN.hid = true; }
    else if (TRAIN.hid) { TRAIN.hid = false; grassM.visible = flowerM.visible = GFX.grassOn; if (typeof UNDER !== 'undefined') { if (UNDER.tall) UNDER.tall.visible = true; for (const k in UNDER.inst) UNDER.inst[k].visible = true; } }
    return r;
  };
})();
