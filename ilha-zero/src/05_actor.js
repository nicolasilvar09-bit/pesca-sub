// ================= personagens: aparência (masculino/feminino), modelo 3D, animação e inventário =================
const CHARS = [
  { n: 'Rafael', f: false, skin: '#c68a5a', hair: '#2b1a10', hs: 'short', shirt: '#2f80ed', pants: '#2d3142', shoe: '#1c1c1c' },
  { n: 'Marcos', f: false, skin: '#8d5524', hair: '#111111', hs: 'buzz', shirt: '#f2994a', pants: '#3a5a40', shoe: '#3b2f2f' },
  { n: 'Ana', f: true, skin: '#e0ac69', hair: '#5a3214', hs: 'pony', shirt: '#eb5757', pants: '#22313f', shoe: '#ffffff' },
  { n: 'Júlia', f: true, skin: '#f1c27d', hair: '#e2b04a', hs: 'long', shirt: '#27ae60', pants: '#34495e', shoe: '#1c1c1c' },
  { n: 'Diego', f: false, skin: '#f0c8a0', hair: '#7a4a1f', hs: 'short', shirt: '#9b51e0', pants: '#4f4f4f', shoe: '#222' },
  { n: 'Bia', f: true, skin: '#a0663d', hair: '#151515', hs: 'long', shirt: '#f2c94c', pants: '#2c3e50', shoe: '#c0392b' },
];
const SKINS = ['#f1c27d', '#e0ac69', '#c68a5a', '#a0663d', '#8d5524', '#f0c8a0'];
const HAIRC = ['#111', '#2b1a10', '#5a3214', '#7a4a1f', '#e2b04a', '#3b3b3b'];
const SHIRTS = ['#2f80ed', '#eb5757', '#27ae60', '#f2994a', '#9b51e0', '#f2c94c', '#56ccf2', '#ff6f91', '#00b894', '#e17055', '#6c5ce7', '#fdcb6e'];
const PANTS = ['#2d3142', '#22313f', '#3a5a40', '#4f4f4f', '#6d4c41', '#34495e', '#1e3799'];
const BOT_NAMES = ['Lobo', 'Tigrão', 'Falcão', 'Neguinho', 'Mineiro', 'Carioca', 'Baiano', 'Gaúcho', 'Fera', 'Zé', 'Kaique', 'Rafa', 'Duda', 'Lari', 'Bruna', 'Gabi', 'Malu', 'Isa', 'Thiago', 'Vini', 'Pedrão', 'Japa', 'Alemão', 'Sniper', 'Ninja', 'Raio', 'Cobra', 'Pantera', 'Onça', 'Jaguar', 'Corvo', 'Tubarão', 'Sombra', 'Fantasma', 'Trovão', 'Gelo', 'Brasa', 'Pimenta', 'Tatu', 'Gavião', 'Mel', 'Lua', 'Nina', 'Clara', 'Sol', 'Rubi', 'Zara', 'Tati', 'Leo', 'Gui', 'Biel', 'Caio', 'Davi', 'Enzo', 'Igor', 'Juca', 'Lipe', 'Nando'];
function randLook() {
  const f = Math.random() < 0.45;
  return { f, skin: pick(SKINS), hair: pick(HAIRC), hs: f ? pick(['pony', 'long', 'bun']) : pick(['short', 'buzz', 'short']), shirt: pick(SHIRTS), pants: pick(PANTS), shoe: pick(['#1c1c1c', '#ffffff', '#3b2f2f', '#c0392b']) };
}

let ACT_ID = 0;
function makeActor(o) {
  return Object.assign({
    id: ++ACT_ID, name: 'Bot', team: 0, bot: true, skill: 0.5, look: randLook(),
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, stance: 'stand', lean: 0, leanT: 0,
    hp: 100, boost: 0, alive: true, knocked: false, khp: 0, kills: 0, dmgDone: 0, mode: 'plane', onGround: false, swim: false,
    wp: [null, null, null], cur: -1, bag: {}, bagLv: 0, helm: null, vest: null,
    fireCd: 0, reloadT: 0, healT: 0, healK: null, reviveT: 0, reviving: null, ads: false, trigger: false, trigPrev: false, burstN: 0,
    walk: 0, speed: 0, lastHitBy: null, lastHitT: -99, deadT: 0, place: 0, recoil: 0,
  }, o);
}
const curW = a => a.cur >= 0 ? a.wp[a.cur] : null;
const actorH = a => a.knocked || a.stance === 'prone' ? 0.6 : a.stance === 'crouch' ? 1.25 : 1.8;
const eyeH = a => a.knocked || a.stance === 'prone' ? 0.4 : a.stance === 'crouch' ? 1.15 : 1.62;
const fwdX = y => -Math.sin(y), fwdZ = y => -Math.cos(y);

// ---------- inventário ----------
function bagWeight(a) { let w = 0; for (const k in a.bag) w += itemInfo(k).w * a.bag[k]; return w; }
const bagCap = a => BAG_CAP[a.bagLv];
function bagAdd(a, k, n) {
  const w = itemInfo(k).w, room = w > 0 ? Math.floor((bagCap(a) - bagWeight(a) + 1e-6) / w) : n;
  const take = Math.max(0, Math.min(n, room)); if (take) a.bag[k] = (a.bag[k] || 0) + take; return take;
}
function bagTake(a, k, n) { const h = a.bag[k] || 0, t = Math.min(h, n); if (t) { a.bag[k] = h - t; if (!a.bag[k]) delete a.bag[k]; } return t; }
const ammoOf = (a, w) => w ? a.bag['a:' + wdef(w).ammo] || 0 : 0;
const dropNear = (a, k, n, w) => dropItem(k, n, a.x + rr(-0.6, 0.6), a.y + 0.02, a.z + rr(-0.6, 0.6), w);
// tenta pegar um item. swap = trocar a arma da mão se não houver espaço. Devolve quantos pegou
function giveItem(a, k, n, w, swap) {
  const inf = itemInfo(k);
  if (inf.type === 'weapon') {
    w = w || mkWeapon(k.slice(2));
    const pistol = inf.d.cls === 'pistol';
    let slot = pistol ? (a.wp[2] ? -1 : 2) : (!a.wp[0] ? 0 : !a.wp[1] ? 1 : -1);
    if (slot < 0) {
      if (!swap) return 0;
      slot = pistol ? 2 : (a.cur === 0 || a.cur === 1 ? a.cur : 0);
      const old = a.wp[slot];
      for (const s in old.att) if (old.att[s]) { if (!w.att[s] && attFits(w, old.att[s])) w.att[s] = old.att[s]; else bagAdd(a, old.att[s], 1) || dropNear(a, old.att[s], 1); old.att[s] = null; }
      if (old.mag) { bagAdd(a, 'a:' + wdef(old).ammo, old.mag); old.mag = 0; }
      dropNear(a, 'w:' + old.k, 1, old);
    }
    a.wp[slot] = w;
    if (a.bot) { const ak = 'a:' + inf.d.ammo; a.bag[ak] = (a.bag[ak] || 0) + magSize(w) * 2; } // bots: munição que achariam saqueando
    if (a.cur < 0 || !a.wp[a.cur] || (a.bot && slot !== 2)) a.cur = slot;
    autoAttach(a, w);
    if (!w.mag) autoFill(a, w);
    if (a.model) refreshGun(a);
    return 1;
  }
  if (inf.type === 'helm' || inf.type === 'vest') {
    const cur = a[inf.type];
    if (cur && cur.lv >= inf.lv && !swap) return 0;
    if (cur) dropNear(a, (inf.type === 'helm' ? 'H' : 'V') + cur.lv, 1);
    a[inf.type] = { lv: inf.lv, dur: (inf.type === 'helm' ? HELM_DUR : VEST_DUR)[inf.lv] };
    if (a.model) rebuildBody(a); return 1;
  }
  if (inf.type === 'bag') {
    if (a.bagLv >= inf.lv && !swap) return 0;
    if (a.bagLv) dropNear(a, 'B' + a.bagLv, 1);
    a.bagLv = inf.lv; if (a.model) rebuildBody(a); return 1;
  }
  const t = bagAdd(a, k, n);
  if (t && inf.type === 'att') for (const ww of a.wp) if (ww && autoAttach(a, ww)) break;
  return t;
}
// coloca acessórios da mochila em encaixes vazios
function autoAttach(a, w) {
  let any = false;
  for (const k in a.bag) {
    const at = ATT[k]; if (!at || w.att[at.slot] || !attFits(w, k)) continue;
    if (at.slot === 'sight' && a.bot && at.zoom > 6 && WEAP[w.k].cls !== 'sr' && WEAP[w.k].cls !== 'dmr') continue;
    bagTake(a, k, 1); w.att[at.slot] = k; any = true;
  }
  return any;
}
function autoFill(a, w) { const need = magSize(w) - w.mag; if (need > 0) w.mag += bagTake(a, 'a:' + wdef(w).ammo, need); }
// itens que valem pegar automaticamente (munição das suas armas, cura, acessório que encaixa, proteção melhor)
function wantAuto(a, it) {
  const inf = itemInfo(it.k);
  if (inf.type === 'ammo') return a.wp.some(w => w && wdef(w).ammo === it.k.slice(2)) && (a.bag[it.k] || 0) < 240;
  if (inf.type === 'heal') return (a.bag[it.k] || 0) < ({ BAND: 15, FAK: 5, MED: 2, ENERGY: 5, PAIN: 3 }[it.k]);
  if (inf.type === 'att') return a.wp.some(w => w && !w.att[inf.d.slot] && attFits(w, it.k)) && !a.bag[it.k];
  if (inf.type === 'helm' || inf.type === 'vest') return !a[inf.type] || a[inf.type].lv < inf.lv;
  if (inf.type === 'bag') return a.bagLv < inf.lv;
  if (inf.type === 'weapon') return !a.wp[0] || !a.wp[1] || (inf.d.cls === 'pistol' && !a.wp[2]);
  return false;
}

// ---------- modelo 3D ----------
// partes: pernas (2), corpo (tronco+cabeça+cabelo+proteção), braços com a arma (giram com a mira)
function bodyGeo(L, a) {
  const f = L.f, sw = f ? 0.4 : 0.47, p = [];
  p.push(bx(-sw / 2, 0, -0.13, sw, 0.6, 0.26, L.shirt)); // tronco
  p.push(bx(-(f ? 0.2 : 0.19), -0.06, -0.12, f ? 0.4 : 0.38, 0.14, 0.24, L.pants)); // quadril
  p.push({ g: GEO.cyl, y: 0.66, sx: 0.1, sy: 0.12, sz: 0.1, c: L.skin }); // pescoço
  p.push({ g: GEO.sph, y: 0.8, sx: 0.23, sy: 0.27, sz: 0.25, c: L.skin }); // cabeça
  p.push(bx(-0.08, 0.78, -0.13, 0.05, 0.03, 0.01, '#222'), bx(0.03, 0.78, -0.13, 0.05, 0.03, 0.01, '#222')); // olhos
  const hc = L.hair;
  if (L.hs === 'buzz') p.push({ g: GEO.hsph, y: 0.82, sx: 0.245, sy: 0.18, sz: 0.265, c: hc });
  else p.push({ g: GEO.hsph, y: 0.8, sx: 0.255, sy: 0.24, sz: 0.275, c: hc });
  if (L.hs === 'long') p.push(bx(-0.13, 0.5, 0.02, 0.26, 0.34, 0.12, hc));
  if (L.hs === 'pony') p.push(bx(-0.04, 0.52, 0.11, 0.08, 0.28, 0.08, hc));
  if (L.hs === 'bun') p.push({ g: GEO.sph, y: 0.95, z: 0.08, sx: 0.13, sy: 0.13, sz: 0.13, c: hc });
  if (f) p.push(bx(-0.16, 0.34, -0.15, 0.32, 0.14, 0.04, L.shirt));
  if (a && a.vest) p.push(bx(-sw / 2 - 0.03, 0.08, -0.16, sw + 0.06, 0.48, 0.32, LV_C[a.vest.lv]));
  if (a && a.helm) p.push({ g: GEO.hsph, y: 0.84, sx: 0.29, sy: 0.25, sz: 0.31, c: LV_C[a.helm.lv] });
  if (a && a.bagLv) p.push(bx(-0.17, 0.05, 0.13, 0.34, 0.45 + a.bagLv * 0.05, 0.18 + a.bagLv * 0.03, ['', '#a1887f', '#6d8a3f', '#3e4a5b'][a.bagLv]));
  return mergeParts(p);
}
function legGeo(L) { return mergeParts([bx(-0.085, -0.82, -0.09, 0.17, 0.82, 0.18, L.pants), bx(-0.09, -0.92, -0.14, 0.18, 0.1, 0.26, L.shoe)]); }
function armsGeo(L) { // braços apontando para -y a partir do ombro (o grupo gira para frente quando armado)
  const s = L.f ? 0.2 : 0.235;
  return mergeParts([bx(-s - 0.06, -0.3, -0.06, 0.12, 0.3, 0.12, L.shirt), bx(s - 0.06, -0.3, -0.06, 0.12, 0.3, 0.12, L.shirt),
  bx(-s - 0.05, -0.6, -0.05, 0.1, 0.3, 0.1, L.skin), bx(s - 0.05, -0.6, -0.05, 0.1, 0.3, 0.1, L.skin)]);
}
function farGeo(L) {
  return mergeParts([bx(-0.2, 0, -0.1, 0.4, 0.9, 0.2, L.pants), bx(-0.24, 0.9, -0.13, 0.48, 0.62, 0.26, L.shirt), { g: GEO.sph, y: 1.72, sx: 0.25, sy: 0.28, sz: 0.26, c: L.skin }, { g: GEO.hsph, y: 1.74, sx: 0.27, sy: 0.22, sz: 0.28, c: L.hair }]);
}
function buildModel(a) {
  const L = a.look, root = new T.Group();
  const upper = new T.Group(); upper.position.y = 0.92; root.add(upper);
  const body = new T.Mesh(bodyGeo(L, a), MAT.actor); upper.add(body);
  const legL = new T.Mesh(legGeo(L), MAT.actor), legR = new T.Mesh(legGeo(L), MAT.actor);
  legL.position.set(-0.1, 0.92, 0); legR.position.set(0.1, 0.92, 0); root.add(legL, legR);
  const arms = new T.Group(); arms.position.set(0, 0.52, -0.02); upper.add(arms);
  arms.add(new T.Mesh(armsGeo(L), MAT.actor));
  const gun = new T.Mesh(gunGeo('M416'), MAT.actor); gun.rotation.x = -Math.PI / 2; gun.position.set(0.05, -0.5, 0.12); gun.visible = false; arms.add(gun);
  const far = new T.Mesh(farGeo(L), MAT.actor); far.visible = false;
  const g = new T.Group(); g.add(root, far); scene.add(g);
  a.model = { g, root, upper, body, legL, legR, arms, gun, far };
  refreshGun(a);
}
function rebuildBody(a) { const m = a.model; if (!m) return; m.body.geometry.dispose(); m.body.geometry = bodyGeo(a.look, a); }
function refreshGun(a) { const m = a.model; if (!m) return; const w = curW(a); m.gun.visible = !!w; if (w) m.gun.geometry = gunGeo(w.k); }
function removeModel(a) { if (a.model) { scene.remove(a.model.g); a.model.body.geometry.dispose(); a.model = null; } }

function animateModel(a, dt, camX, camZ, hideSelf) {
  const m = a.model; if (!m) return;
  const vis = a.alive && a.mode !== 'plane' && !hideSelf;
  m.g.visible = vis; if (!vis) return;
  const d2 = (a.x - camX) ** 2 + (a.z - camZ) ** 2;
  const far = d2 > 70 * 70, hidden = d2 > (G.zoomFar ? 900 : 480) ** 2;
  m.g.visible = !hidden; if (hidden) return;
  m.g.position.set(a.x, a.y, a.z); m.g.rotation.y = a.yaw;
  m.root.visible = !far; m.far.visible = far;
  const prone = a.knocked || a.stance === 'prone';
  if (far) { m.far.rotation.x = prone ? -Math.PI / 2 : 0; m.far.position.y = prone ? 0.2 : 0; return; }
  const sp = Math.hypot(a.vx, a.vz); a.walk += dt * sp * (prone ? 2.5 : 1.9);
  const sw = Math.sin(a.walk) * Math.min(1, sp / 3) * 0.65;
  const w = curW(a), armed = !!w && !a.knocked && a.healT <= 0;
  m.root.rotation.set(0, 0, 0); m.root.position.y = 0;
  if (a.mode === 'chute' || a.mode === 'fall') {
    m.root.rotation.x = a.mode === 'fall' ? -1.2 : 0; m.upper.position.y = 0.92; m.legL.rotation.x = 0.4; m.legR.rotation.x = -0.2;
    m.arms.rotation.set(a.mode === 'fall' ? 2.6 : Math.PI, 0, 0); m.legL.scale.y = m.legR.scale.y = 1; return;
  }
  if (a.veh) { // sentado
    m.upper.position.y = 0.62; m.legL.position.y = m.legR.position.y = 0.62; m.legL.scale.y = m.legR.scale.y = 1;
    m.legL.rotation.x = m.legR.rotation.x = 1.45; m.upper.rotation.set(0, 0, 0);
    const drive = a.seat === 0; m.arms.rotation.set(drive ? 1.2 : armed ? Math.PI / 2 + a.pitch : 0.4, 0, 0); m.gun.visible = armed && !drive; return;
  }
  if (prone) {
    m.root.rotation.x = -Math.PI / 2 + 0.05; m.root.position.y = 0.18; m.root.position.z = 0;
    m.upper.position.y = 0.92; m.upper.rotation.z = 0; m.legL.rotation.x = sw * 0.4; m.legR.rotation.x = -sw * 0.4; m.legL.scale.y = m.legR.scale.y = 1;
    m.arms.rotation.set(armed ? Math.PI + a.pitch * 0.5 : Math.PI + sw, 0, 0);
  } else {
    const cr = a.stance === 'crouch';
    m.upper.position.y = cr ? 0.62 : 0.92; m.legL.position.y = m.legR.position.y = cr ? 0.62 : 0.92;
    m.legL.scale.y = m.legR.scale.y = cr ? 0.7 : 1;
    m.legL.rotation.x = cr ? 0.9 + sw * 0.3 : sw; m.legR.rotation.x = cr ? -0.2 - sw * 0.3 : -sw;
    m.upper.rotation.set(cr ? -0.15 : 0, 0, -a.lean * 0.38);
    m.arms.rotation.set(armed ? Math.PI / 2 + a.pitch : (a.healT > 0 ? 1.2 : sw * 0.8), 0, 0);
  }
  m.gun.visible = armed;
}
