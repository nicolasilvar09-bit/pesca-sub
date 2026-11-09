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
  if (typeof AVATARS !== 'undefined') { const av = pick(AVATARS.filter(v => v.f === f && !v.special)); return avatarLook(av); /* skins especiais (Múmia) só para jogadores */ }
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
    walk: 0, speed: 0, veh: null, seat: -1, lastHitBy: null, lastHitT: -99, deadT: 0, place: 0, recoil: 0,
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
  if (inf.type === 'pan') { if (a.pan) return 0; a.pan = true; if (a.model) rebuildBody(a); return 1; }
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
  if (inf.type === 'heal') return (a.bag[it.k] || 0) < ({ BAND: 15, FAK: 5, MED: 2, ENERGY: 5, PAIN: 3, ADREN: 1 }[it.k]);
  if (inf.type === 'throw') return (a.bag[it.k] || 0) < 3;
  if (inf.type === 'att') return a.wp.some(w => w && !w.att[inf.d.slot] && attFits(w, it.k)) && !a.bag[it.k];
  if (inf.type === 'helm' || inf.type === 'vest') return !a[inf.type] || a[inf.type].lv < inf.lv;
  if (inf.type === 'bag') return a.bagLv < inf.lv;
  if (inf.type === 'pan') return !a.pan;
  if (inf.type === 'weapon') return !a.wp[0] || !a.wp[1] || (inf.d.cls === 'pistol' && !a.wp[2]);
  return false;
}

// ---------- modelo 3D ----------
// partes: pernas (2), corpo (tronco+cabeça+cabelo+proteção), braços com a arma (giram com a mira)
function shade(c, k) { const t = new T.Color(c); t.multiplyScalar(k); return '#' + t.getHexString(); }
function bodyGeo(L, a) {
  const f = L.f, sw = f ? 0.4 : 0.48, p = [], sk = L.skin, skD = shade(sk, 0.82), hc = L.hair;
  // tronco: peito mais largo, cintura mais fina
  p.push(bx(-sw / 2, 0.24, -0.13, sw, 0.36, 0.26, L.shirt));
  p.push(bx(-(sw - (f ? 0.1 : 0.07)) / 2, 0.02, -0.12, sw - (f ? 0.1 : 0.07), 0.24, 0.24, L.shirt));
  p.push(bx(-sw / 2 - 0.005, 0.5, -0.135, sw + 0.01, 0.06, 0.27, shade(L.shirt, 0.85))); // ombros/gola
  p.push(bx(-0.07, 0.56, -0.135, 0.14, 0.04, 0.02, sk)); // decote
  if (f) p.push({ g: GEO.sph, x: -0.085, y: 0.38, z: -0.12, sx: 0.15, sy: 0.13, sz: 0.1, c: L.shirt }, { g: GEO.sph, x: 0.085, y: 0.38, z: -0.12, sx: 0.15, sy: 0.13, sz: 0.1, c: L.shirt });
  else p.push(bx(0.06, 0.36, -0.14, 0.1, 0.1, 0.02, shade(L.shirt, 0.8))); // bolso
  p.push(bx(-(f ? 0.205 : 0.195), -0.08, -0.125, f ? 0.41 : 0.39, 0.16, 0.25, L.pants)); // quadril
  p.push(bx(-(f ? 0.2 : 0.19), 0.02, -0.13, f ? 0.4 : 0.38, 0.05, 0.26, '#3b2a1e'), bx(-0.035, 0.015, -0.135, 0.07, 0.06, 0.01, '#d4af37')); // cinto e fivela
  // pescoço e cabeça
  p.push({ g: GEO.cyl, y: 0.64, sx: 0.11, sy: 0.12, sz: 0.11, c: sk });
  p.push({ g: GEO.sph, y: 0.8, sx: f ? 0.22 : 0.23, sy: 0.27, sz: 0.25, c: sk });
  p.push({ g: GEO.sph, x: -0.115, y: 0.79, sx: 0.04, sy: 0.07, sz: 0.05, c: skD }, { g: GEO.sph, x: 0.115, y: 0.79, sx: 0.04, sy: 0.07, sz: 0.05, c: skD }); // orelhas
  p.push(bx(-0.075, 0.795, -0.125, 0.045, 0.03, 0.01, '#ffffff'), bx(0.03, 0.795, -0.125, 0.045, 0.03, 0.01, '#ffffff')); // olhos
  p.push(bx(-0.062, 0.797, -0.131, 0.022, 0.026, 0.01, '#2b1a10'), bx(0.043, 0.797, -0.131, 0.022, 0.026, 0.01, '#2b1a10'));
  p.push(bx(-0.08, 0.835, -0.125, 0.055, 0.014, 0.01, shade(hc, 0.9)), bx(0.025, 0.835, -0.125, 0.055, 0.014, 0.01, shade(hc, 0.9))); // sobrancelhas
  p.push(bx(-0.018, 0.74, -0.14, 0.036, 0.05, 0.03, skD)); // nariz
  p.push(bx(-0.035, 0.705, -0.122, 0.07, 0.014, 0.01, f ? '#c0485a' : shade(sk, 0.6))); // boca
  if (!f && L.hs === 'buzz') p.push(bx(-0.09, 0.67, -0.115, 0.18, 0.05, 0.04, shade(hc, 0.95))); // barba curta
  // cabelo
  if (L.hs === 'buzz') p.push({ g: GEO.hsph, y: 0.83, sx: 0.245, sy: 0.17, sz: 0.265, c: hc });
  else {
    p.push({ g: GEO.hsph, y: 0.8, sx: 0.258, sy: 0.25, sz: 0.278, c: hc });
    p.push(bx(-0.11, 0.84, -0.14, 0.22, 0.06, 0.05, hc, { rz: f ? 0.15 : -0.1 })); // franja
    p.push(bx(-0.128, 0.7, -0.05, 0.03, 0.14, 0.15, hc), bx(0.098, 0.7, -0.05, 0.03, 0.14, 0.15, hc)); // costeletas/laterais
  }
  if (L.hs === 'long') p.push(bx(-0.135, 0.48, 0.0, 0.27, 0.38, 0.13, hc), bx(-0.14, 0.56, -0.08, 0.04, 0.24, 0.1, hc), bx(0.1, 0.56, -0.08, 0.04, 0.24, 0.1, hc));
  if (L.hs === 'pony') p.push({ g: GEO.sph, y: 0.84, z: 0.13, sx: 0.07, sy: 0.07, sz: 0.06, c: '#e63946' }, bx(-0.045, 0.5, 0.12, 0.09, 0.32, 0.08, hc, { rx: 0.15 }));
  if (L.hs === 'bun') p.push({ g: GEO.sph, y: 0.96, z: 0.07, sx: 0.14, sy: 0.13, sz: 0.14, c: hc });
  // proteção e mochila
  if (a && a.vest) { const vc = LV_C[a.vest.lv]; p.push(bx(-sw / 2 - 0.03, 0.06, -0.16, sw + 0.06, 0.48, 0.32, vc)); for (const x of [-0.14, 0.02]) p.push(bx(x, 0.12, -0.175, 0.12, 0.12, 0.03, shade(vc, 0.75))); p.push(bx(-sw / 2 - 0.035, 0.42, -0.165, sw + 0.07, 0.04, 0.33, shade(vc, 0.7))); }
  if (a && a.helm) { const hc2 = LV_C[a.helm.lv]; p.push({ g: GEO.hsph, y: 0.84, sx: 0.3, sy: 0.26, sz: 0.32, c: hc2 }, bx(-0.15, 0.835, -0.17, 0.3, 0.035, 0.06, shade(hc2, 0.7))); }
  if (a && a.bagLv) { const bc = ['', '#a1887f', '#6d8a3f', '#3e4a5b'][a.bagLv], bh = 0.45 + a.bagLv * 0.05; p.push(bx(-0.17, 0.05, 0.13, 0.34, bh, 0.18 + a.bagLv * 0.03, bc), bx(-0.14, 0.08, 0.3 + a.bagLv * 0.03, 0.28, 0.18, 0.05, shade(bc, 0.8)), bx(-0.18, 0.04 + bh, 0.12, 0.36, 0.06, 0.2, shade(bc, 0.7))); }
  return mergeParts(p);
}
function legGeo(L) {
  return mergeParts([bx(-0.085, -0.44, -0.09, 0.17, 0.44, 0.18, L.pants), bx(-0.08, -0.82, -0.085, 0.16, 0.4, 0.17, L.pants), bx(-0.082, -0.5, -0.095, 0.164, 0.06, 0.02, shade(L.pants, 0.8)),
  bx(-0.09, -0.9, -0.15, 0.18, 0.1, 0.27, L.shoe), bx(-0.092, -0.92, -0.155, 0.184, 0.035, 0.28, '#f5f5f5')]);
}
function armsGeo(L) { // braços apontando para -y a partir do ombro (o grupo gira para frente quando armado)
  const s = L.f ? 0.2 : 0.24, sk = L.skin;
  const one = x => [bx(x - 0.065, -0.24, -0.065, 0.13, 0.24, 0.13, L.shirt), bx(x - 0.05, -0.52, -0.05, 0.1, 0.3, 0.1, sk), bx(x - 0.055, -0.62, -0.06, 0.11, 0.1, 0.12, shade(sk, 0.92))];
  return mergeParts([...one(-s), ...one(s)]);
}
function farGeo(L) {
  return mergeParts([bx(-0.2, 0, -0.1, 0.4, 0.9, 0.2, L.pants), bx(-0.24, 0.9, -0.13, 0.48, 0.62, 0.26, L.shirt), { g: GEO.sph, y: 1.72, sx: 0.25, sy: 0.28, sz: 0.26, c: L.skin }, { g: GEO.hsph, y: 1.74, sx: 0.27, sy: 0.22, sz: 0.28, c: L.hair }]);
}
function buildModel(a) {
  if (HUM.ready) return buildHuman(a);
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
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  a.model = { g, root, upper, body, legL, legR, arms, gun, far };
  refreshGun(a);
}
function rebuildBody(a) { const m = a.model; if (!m) return; if (m.human) { updateHumanGear(a); return; } m.body.geometry.dispose(); m.body.geometry = bodyGeo(a.look, a); }
const gunKey = w => w ? w.k + '|' + (w.att.sight || '') + (w.att.muzzle || '') + (w.att.grip || '') : '';
function refreshGun(a) { const m = a.model; if (!m) return; const w = curW(a); m.gun.visible = !!w; m.gunKey = gunKey(w); if (w) { setGunVisual(m.gun, w.k); dressGun(m.gun, w); } }
function syncGun(a) { const m = a.model; if (m && m.gunKey !== gunKey(curW(a))) refreshGun(a); }
function removeModel(a) { if (a.model) { scene.remove(a.model.g); if (a.model.body) a.model.body.geometry.dispose(); if (a.model.mixer) a.model.mixer.stopAllAction(); a.model = null; } }

function animateModel(a, dt, camX, camZ, hideSelf) {
  const m = a.model; if (!m) return;
  syncGun(a);
  if (m.human) return animateHuman(a, dt, camX, camZ, hideSelf);
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
