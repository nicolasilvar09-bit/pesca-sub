// ================= itens: armas, munição, acessórios, proteção, cura e saque no chão =================
const AMMO = {
  '9mm': { n: '9mm', w: 0.375, c: '#f5c542', stack: 30 },
  '45': { n: '.45 ACP', w: 0.4, c: '#ff8c42', stack: 30 },
  '556': { n: '5.56mm', w: 0.5, c: '#52d273', stack: 30 },
  '762': { n: '7.62mm', w: 0.7, c: '#ff5f5f', stack: 30 },
  '300': { n: '.300 Magnum', w: 1, c: '#b26bff', stack: 10 },
  '12': { n: 'Calibre 12', w: 1.25, c: '#d63b3b', stack: 15 },
};
// cls: pistol | smg | ar | dmr | sr.  dmg = dano no corpo; v = velocidade da bala (m/s); rel = recarga (s); rec = coice
const WEAP = {
  M17: { n: 'M17 (SIG P320)', cls: 'pistol', ammo: '9mm', dmg: 25, rpm: 420, v: 380, mag: 17, emag: 21, rel: 1.9, rec: 0.7, tier: 1 },
  M625: { n: 'S&W M625', cls: 'pistol', ammo: '45', dmg: 55, rpm: 170, v: 260, mag: 6, emag: 6, rel: 2.6, rec: 1.4, tier: 1 },
  M1911: { n: 'M1911', cls: 'pistol', ammo: '45', dmg: 40, rpm: 300, v: 250, mag: 7, emag: 12, rel: 2.0, rec: 1.0, tier: 1 },
  G18C: { n: 'G18C', cls: 'pistol', ammo: '9mm', dmg: 22, rpm: 1000, v: 375, mag: 17, emag: 33, rel: 2.1, rec: 0.6, auto: true, tier: 1 },
  UMP45: { n: 'UMP45', cls: 'smg', ammo: '45', dmg: 37, rpm: 650, v: 360, mag: 25, emag: 35, rel: 3.0, rec: 0.55, auto: true, tier: 1 },
  MP5K: { n: 'MP5K', cls: 'smg', ammo: '9mm', dmg: 33, rpm: 900, v: 400, mag: 30, emag: 40, rel: 2.6, rec: 0.5, auto: true, tier: 1 },
  UZI: { n: 'UZI', cls: 'smg', ammo: '9mm', dmg: 26, rpm: 1200, v: 350, mag: 25, emag: 35, rel: 2.4, rec: 0.6, auto: true, tier: 1 },
  AKM: { n: 'AKM', cls: 'ar', ammo: '762', dmg: 47, rpm: 600, v: 715, mag: 30, emag: 40, rel: 2.9, rec: 1.45, auto: true, tier: 1 },
  M416: { n: 'M416', cls: 'ar', ammo: '556', dmg: 41, rpm: 700, v: 880, mag: 30, emag: 40, rel: 2.6, rec: 1.0, auto: true, tier: 2 },
  'SCAR-L': { n: 'SCAR-L', cls: 'ar', ammo: '556', dmg: 41, rpm: 625, v: 870, mag: 30, emag: 40, rel: 2.7, rec: 1.0, auto: true, tier: 2 },
  M16A2: { n: 'M16A2', cls: 'ar', ammo: '556', dmg: 42, rpm: 800, v: 900, mag: 30, emag: 40, rel: 2.5, rec: 0.9, burst: 3, tier: 2 },
  SKS: { n: 'SKS', cls: 'dmr', ammo: '762', dmg: 53, rpm: 220, v: 800, mag: 10, emag: 20, rel: 2.9, rec: 1.6, tier: 2 },
  MINI14: { n: 'Mini 14', cls: 'dmr', ammo: '556', dmg: 46, rpm: 260, v: 990, mag: 20, emag: 30, rel: 3.0, rec: 1.0, tier: 2 },
  KAR98K: { n: 'Kar98k', cls: 'sr', ammo: '762', dmg: 79, rpm: 35, v: 760, mag: 5, emag: 5, rel: 3.6, rec: 2.4, bolt: true, tier: 2 },
  MOSIN: { n: 'Mosin-Nagant', cls: 'sr', ammo: '762', dmg: 77, rpm: 36, v: 800, mag: 5, emag: 5, rel: 3.6, rec: 2.3, bolt: true, fixedZoom: 3.5, tier: 2 },
  M24: { n: 'M24', cls: 'sr', ammo: '762', dmg: 76, rpm: 38, v: 790, mag: 5, emag: 7, rel: 3.4, rec: 2.2, bolt: true, tier: 3 },
  // escopetas: pellets = bagos de chumbo por tiro; cone = abertura (graus)
  S1897: { n: 'S1897', cls: 'sg', ammo: '12', dmg: 22, pellets: 9, cone: 4.2, rpm: 55, v: 360, mag: 5, emag: 5, rel: 4.2, rec: 2.4, tier: 1 },
  S686: { n: 'S686', cls: 'sg', ammo: '12', dmg: 23, pellets: 9, cone: 3.8, rpm: 260, v: 370, mag: 2, emag: 2, rel: 2.8, rec: 2.6, tier: 1 },
  S12K: { n: 'S12K', cls: 'sg', ammo: '12', dmg: 20, pellets: 9, cone: 4.8, rpm: 230, v: 350, mag: 5, emag: 8, rel: 3.2, rec: 2.0, tier: 2 },
  // só no drop do avião
  AUG: { n: 'AUG A3', cls: 'ar', ammo: '556', dmg: 41, rpm: 750, v: 940, mag: 30, emag: 40, rel: 2.8, rec: 0.75, auto: true, tier: 4 },
  GROZA: { n: 'Groza', cls: 'ar', ammo: '762', dmg: 47, rpm: 750, v: 715, mag: 30, emag: 40, rel: 2.8, rec: 1.2, auto: true, tier: 4 },
  AWM: { n: 'AWM', cls: 'sr', ammo: '300', dmg: 105, rpm: 32, v: 945, mag: 5, emag: 7, rel: 4.0, rec: 2.8, bolt: true, tier: 4 },
};
const CLS = {
  pistol: { n: 'Pistola', head: 1.8, hip: 1.4, ads: 0.45, maxZoom: 1.3, range: 40 },
  smg: { n: 'Submetralhadora', head: 1.8, hip: 1.7, ads: 0.35, maxZoom: 4, range: 70 },
  ar: { n: 'Fuzil', head: 2.1, hip: 2.3, ads: 0.22, maxZoom: 6, range: 230 },
  dmr: { n: 'Rifle DMR', head: 2.2, hip: 3, ads: 0.1, maxZoom: 10, range: 380 },
  sr: { n: 'Rifle de precisão', head: 2.6, hip: 4.5, ads: 0.02, maxZoom: 10, range: 500 },
  sg: { n: 'Escopeta', head: 1.5, hip: 1.2, ads: 0.9, maxZoom: 1.3, range: 22 },
};
// acessórios. zoom = aumento; slot: sight | muzzle | grip | mag
const ATT = {
  RED: { n: 'Mira red dot', slot: 'sight', zoom: 1.25, ret: 'dot', w: 10, tier: 1 },
  HOLO: { n: 'Mira holográfica', slot: 'sight', zoom: 1.3, ret: 'holo', w: 10, tier: 1 },
  X2: { n: 'Luneta 2x', slot: 'sight', zoom: 2, ret: 'cross', w: 12, tier: 1 },
  X3: { n: 'Luneta 3x', slot: 'sight', zoom: 3, ret: 'cross', w: 12, tier: 2 },
  X4: { n: 'Luneta 4x', slot: 'sight', zoom: 4, ret: 'cross', w: 14, tier: 2 },
  X6: { n: 'Luneta 6x', slot: 'sight', zoom: 6, ret: 'cross', w: 14, tier: 3 },
  X8: { n: 'Luneta 8x', slot: 'sight', zoom: 8, ret: 'mil', w: 16, tier: 3 },
  X10: { n: 'Luneta 10x', slot: 'sight', zoom: 10, ret: 'mil', w: 16, tier: 4 },
  COMP_AR: { n: 'Compensador (fuzil)', slot: 'muzzle', cls: ['ar', 'dmr'], rec: 0.75, w: 10, tier: 1 },
  SUP_AR: { n: 'Silenciador (fuzil)', slot: 'muzzle', cls: ['ar', 'dmr'], rec: 0.92, quiet: true, w: 10, tier: 2 },
  SUP_SR: { n: 'Silenciador (precisão)', slot: 'muzzle', cls: ['sr'], rec: 0.9, quiet: true, w: 12, tier: 2 },
  COMP_SMG: { n: 'Compensador (SMG)', slot: 'muzzle', cls: ['smg', 'pistol'], rec: 0.75, w: 8, tier: 1 },
  SUP_SMG: { n: 'Silenciador (SMG)', slot: 'muzzle', cls: ['smg', 'pistol'], rec: 0.92, quiet: true, w: 8, tier: 1 },
  GRIP: { n: 'Empunhadura vertical', slot: 'grip', cls: ['ar', 'smg'], rec: 0.8, w: 8, tier: 1 },
  EMAG_AR: { n: 'Pente estendido (fuzil)', slot: 'mag', cls: ['ar', 'dmr'], w: 10, tier: 1 },
  EMAG_SMG: { n: 'Pente estendido (SMG)', slot: 'mag', cls: ['smg', 'pistol'], w: 8, tier: 1 },
  EMAG_SR: { n: 'Pente estendido (precisão)', slot: 'mag', cls: ['sr'], w: 10, tier: 2 },
  CHOKE: { n: 'Estrangulador (escopeta)', slot: 'muzzle', cls: ['sg'], rec: 1, choke: 0.6, w: 8, tier: 1 },
  EMAG_SG: { n: 'Pente estendido (S12K)', slot: 'mag', cls: ['sg'], w: 10, tier: 1 },
};
const HEAL = {
  BAND: { n: 'Bandagem', w: 2, t: 4, hp: 10, cap: 75, c: '#f1e3c8' },
  FAK: { n: 'Kit de primeiros socorros', w: 10, t: 6, hp: 75, cap: 75, c: '#ffffff' },
  MED: { n: 'Kit médico', w: 20, t: 8, hp: 100, cap: 100, c: '#ff4d4d' },
  ENERGY: { n: 'Energético', w: 4, t: 4, boost: 40, c: '#2ec4ff' },
  PAIN: { n: 'Analgésico', w: 10, t: 6, boost: 60, c: '#ffd166' },
  ADREN: { n: 'Seringa de adrenalina', w: 20, t: 8, boost: 100, c: '#ff9f1c' },
};
// granadas
const THROW = {
  FRAG: { n: 'Granada', w: 12, c: '#4c5a34', ic: '💣' },
  SMOKE: { n: 'Granada de fumaça', w: 10, c: '#8a9096', ic: '💨' },
  MOLO: { n: 'Coquetel molotov', w: 12, c: '#c9742e', ic: '🔥' },
};
const ARMOR_RED = [0, 0.3, 0.4, 0.55], HELM_DUR = [0, 80, 150, 230], VEST_DUR = [0, 200, 220, 250];
const BAG_CAP = [70, 170, 220, 270];
const LV_C = ['', '#d9c08a', '#4a90e2', '#2b2d42'];

// chave única de item no chão/mochila: 'w:AKM' arma, 'a:556' munição, 'BAND' cura, 'X4' acessório, 'H2' capacete, 'V3' colete, 'B1' mochila
function itemInfo(k) {
  if (k.startsWith('w:')) { const d = WEAP[k.slice(2)]; return { type: 'weapon', n: d.n, w: 0, d }; }
  if (k.startsWith('a:')) { const d = AMMO[k.slice(2)]; return { type: 'ammo', n: d.n, w: d.w, d }; }
  if (HEAL[k]) return { type: 'heal', n: HEAL[k].n, w: HEAL[k].w, d: HEAL[k] };
  if (ATT[k]) return { type: 'att', n: ATT[k].n, w: ATT[k].w, d: ATT[k] };
  if (THROW[k]) return { type: 'throw', n: THROW[k].n, w: THROW[k].w, d: THROW[k] };
  const lv = +k[1];
  if (k[0] === 'H') return { type: 'helm', n: 'Capacete nv. ' + lv, w: 0, lv };
  if (k[0] === 'V') return { type: 'vest', n: 'Colete nv. ' + lv, w: 0, lv };
  if (k[0] === 'B') return { type: 'bag', n: 'Mochila nv. ' + lv, w: 0, lv };
  return { type: '?', n: k, w: 0 };
}
const mkWeapon = k => ({ k, mag: 0, att: { sight: null, muzzle: null, grip: null, mag: null } });
const wdef = w => WEAP[w.k];
const magSize = w => w.att.mag ? WEAP[w.k].emag : WEAP[w.k].mag;
function attFits(w, ak) {
  const a = ATT[ak], d = WEAP[w.k]; if (!a) return false;
  if (a.slot === 'sight') return !d.fixedZoom && a.zoom <= CLS[d.cls].maxZoom;
  return a.cls.includes(d.cls);
}

// ---------- tabelas de saque ----------
const POOL = {
  1: { w: [['M17', 5], ['M625', 2], ['M1911', 5], ['S1897', 5], ['S686', 4], ['G18C', 3], ['UMP45', 7], ['MP5K', 6], ['UZI', 6], ['AKM', 6], ['M416', 3], ['SKS', 2], ['KAR98K', 1.5], ['MINI14', 1.5]], gear: [[1, 7], [2, 3]], sight: [['RED', 5], ['HOLO', 5], ['X2', 4], ['X3', 1], ['X4', 0.6]] },
  2: { w: [['M17', 2], ['M625', 1], ['S1897', 3], ['S686', 2], ['S12K', 3], ['UMP45', 5], ['MP5K', 4], ['UZI', 3], ['AKM', 7], ['M416', 6], ['SCAR-L', 6], ['M16A2', 4], ['SKS', 3], ['MINI14', 3], ['KAR98K', 3], ['MOSIN', 2.5], ['M24', 0.6]], gear: [[1, 4], [2, 5], [3, 1]], sight: [['RED', 4], ['HOLO', 4], ['X2', 4], ['X3', 3], ['X4', 3], ['X6', 1], ['X8', 0.4]] },
  3: { w: [['AKM', 6], ['M416', 7], ['SCAR-L', 7], ['M16A2', 4], ['SKS', 4], ['MINI14', 4], ['KAR98K', 4], ['MOSIN', 3], ['M24', 3], ['UMP45', 2], ['S12K', 3]], gear: [[1, 1], [2, 5], [3, 4]], sight: [['HOLO', 3], ['X2', 3], ['X3', 3], ['X4', 4], ['X6', 3], ['X8', 2], ['X10', 0.3]] },
};
const OTHER_ATT = ['COMP_AR', 'SUP_AR', 'COMP_SMG', 'SUP_SMG', 'GRIP', 'GRIP', 'EMAG_AR', 'EMAG_SMG', 'EMAG_SR', 'SUP_SR', 'CHOKE', 'EMAG_SG'];
function rollLoot(tier) {
  const P = POOL[Math.min(tier, 3)], out = [];
  const cat = wpick([['w', 26], ['ammo', 22], ['heal', 20], ['att', 15], ['gear', 13], ['bag', 4], ['throw', 9]]);
  if (cat === 'w') { const k = wpick(P.w); out.push({ k: 'w:' + k, n: 1 }); out.push({ k: 'a:' + WEAP[k].ammo, n: AMMO[WEAP[k].ammo].stack }); if (Math.random() < 0.5) out.push({ k: 'a:' + WEAP[k].ammo, n: AMMO[WEAP[k].ammo].stack }); }
  else if (cat === 'ammo') { const am = wpick([['9mm', 3], ['45', 2], ['556', 4], ['762', 4], ['12', 2]]); out.push({ k: 'a:' + am, n: AMMO[am].stack }); }
  else if (cat === 'throw') out.push({ k: wpick([['FRAG', 5], ['SMOKE', 3], ['MOLO', 2.5]]), n: 1 });
  else if (cat === 'heal') { const h = wpick([['BAND', 6], ['FAK', 3], ['MED', 0.6], ['ENERGY', 3], ['PAIN', 1.5], ['ADREN', tier >= 3 ? 0.6 : 0.1]]); out.push({ k: h, n: h === 'BAND' ? 5 : 1 }); }
  else if (cat === 'att') out.push({ k: Math.random() < 0.45 ? wpick(P.sight) : pick(OTHER_ATT), n: 1 });
  else if (cat === 'gear') out.push({ k: (Math.random() < 0.5 ? 'H' : 'V') + wpick(P.gear), n: 1 });
  else out.push({ k: 'B' + wpick(P.gear), n: 1 });
  return out;
}
function rollDrop() {
  const w = pick(['AWM', 'AUG', 'GROZA']), out = [{ k: 'w:' + w, n: 1, w: mkWeapon(w) }, { k: 'a:' + WEAP[w].ammo, n: w === 'AWM' ? 20 : 60 }];
  out.push({ k: Math.random() < 0.5 ? 'X10' : 'X8', n: 1 }, { k: 'H3', n: 1 }, { k: 'V3', n: 1 }, { k: 'MED', n: 1 }, { k: 'PAIN', n: 1 }, { k: 'ADREN', n: 1 }, { k: 'FRAG', n: 2 });
  out.push({ k: w === 'AWM' ? 'SUP_SR' : 'SUP_AR', n: 1 });
  return out;
}

// ---------- itens no chão (grade para achar rápido) ----------
const IGRID = Array.from({ length: GW * GW }, () => []);
let ITEM_N = 0;
function dropItem(k, n, x, y, z, w, id) {
  const it = { id: id || (G.net && G.net.on && !G.net.mute ? G.net.uid8 + '-' + (++ITEM_N) : 'i' + (++ITEM_N)), k, n, x, y, z, w: w || (k.startsWith('w:') ? mkWeapon(k.slice(2)) : null), mesh: null, cell: gcell(z) * GW + gcell(x) };
  IGRID[it.cell].push(it); G.items.push(it);
  if (G.net && G.net.on && !G.net.mute && !G.net.applying) netSend('drop', { id: it.id, k, n, x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), w: it.w });
  return it;
}
function removeItem(it) {
  if (G.net && G.net.on && !G.net.mute && !G.net.applying) netSend('it', { id: it.id, n: 0 });
  const c = IGRID[it.cell], i = c.indexOf(it); if (i >= 0) c.splice(i, 1);
  const j = G.items.indexOf(it); if (j >= 0) G.items.splice(j, 1);
  if (it.mesh) { scene.remove(it.mesh); it.mesh = null; }
}
function itemsNear(x, z, r, out) {
  out.length = 0;
  for (let cz = gcell(z - r); cz <= gcell(z + r); cz++) for (let cx = gcell(x - r); cx <= gcell(x + r); cx++)
    for (const it of IGRID[cz * GW + cx]) if ((it.x - x) ** 2 + (it.z - z) ** 2 < r * r) out.push(it);
  return out;
}
function spawnLoot() {
  ITEM_N = 0;
  for (const it of G.items.slice()) removeItem(it);
  for (const b of BLD) for (const s of b.spots) {
    if (Math.random() > 0.62 + b.tier * 0.06) continue;
    rollLoot(b.tier).forEach((e, i) => dropItem(e.k, e.n, s[0] + rr(-0.5, 0.5) + i * 0.35, s[1], s[2] + rr(-0.5, 0.5)));
  }
  for (let k = 0; k < 120; k++) { // pelo mato e estradas
    const x = rr(-480, 480), z = rr(-480, 480), h = groundH(x, z); if (h < 2) continue;
    rollLoot(1).forEach((e, i) => dropItem(e.k, e.n, x + i * 0.4, h + 0.02, z));
  }
}

// ---------- visual dos itens ----------
// ---------- armas detalhadas (formas reais de cada modelo; cano para -z, cabo perto de z=+0.06) ----------
const GUNGEO = {}, GUN_MUZ = {}, GUN_TOP = {};
const GC_ = { st: '#43464c', bk: '#2c2e33', pl: '#36383d', wd: '#8a5530', dw: '#5e3a1e', tan: '#b89a6a', od: '#56633f', gr: '#5e6e44', bl: '#454b55' };
const Bc = (x, y, z, w, h, d, c, rx, ry, rz) => ({ g: GEO.box, x, y, z, sx: w, sy: h, sz: d, c, rx: rx || 0, ry: ry || 0, rz: rz || 0 });
const Cz = (x, y, z, r, len, c, seg) => ({ g: seg === 6 ? GEO.cyl6 : GEO.cyl, x, y, z, rx: Math.PI / 2, sx: r * 2, sy: len, sz: r * 2, c });
const GUNS = {
  AKM: () => [Bc(0, 0, -0.02, 0.05, 0.065, 0.36, GC_.st), Bc(0, 0.037, -0.01, 0.044, 0.016, 0.32, GC_.st), Bc(0, -0.004, -0.31, 0.056, 0.052, 0.2, GC_.wd), Bc(0, 0.034, -0.31, 0.046, 0.026, 0.17, GC_.wd), Cz(0, 0.044, -0.4, 0.011, 0.12, GC_.st),
    Cz(0, 0.012, -0.55, 0.0105, 0.3, GC_.st), Bc(0, 0.045, -0.64, 0.008, 0.05, 0.014, GC_.st), Cz(0, 0.012, -0.72, 0.015, 0.05, GC_.st), Bc(0, 0.055, -0.17, 0.02, 0.016, 0.04, GC_.st),
    Bc(0, -0.08, 0.09, 0.034, 0.11, 0.045, GC_.dw, 0.35), Bc(0, -0.045, 0.03, 0.008, 0.012, 0.07, GC_.st), Bc(0, -0.085, -0.1, 0.03, 0.08, 0.062, '#a0521d', -0.12), Bc(0, -0.155, -0.122, 0.029, 0.07, 0.058, '#a0521d', -0.35), Bc(0, -0.212, -0.15, 0.028, 0.06, 0.055, '#a0521d', -0.6),
    Bc(0, -0.012, 0.27, 0.04, 0.066, 0.22, GC_.wd, 0.12), Bc(0, -0.04, 0.385, 0.043, 0.12, 0.035, GC_.wd), Bc(0, -0.04, 0.404, 0.045, 0.125, 0.006, GC_.bk)],
  M416: () => [Bc(0, 0.01, -0.03, 0.05, 0.06, 0.3, GC_.bk), Bc(0, -0.032, 0.03, 0.044, 0.04, 0.18, GC_.pl), Bc(0, 0.047, -0.12, 0.024, 0.012, 0.48, '#141518'), Bc(0, 0.006, -0.3, 0.056, 0.064, 0.26, GC_.pl),
    Bc(0.031, 0.006, -0.3, 0.006, 0.02, 0.24, '#141518'), Bc(-0.031, 0.006, -0.3, 0.006, 0.02, 0.24, '#141518'), Cz(0, 0.006, -0.52, 0.0095, 0.2, GC_.st), Cz(0, 0.006, -0.64, 0.014, 0.05, GC_.bk), Bc(0, 0.062, -0.4, 0.012, 0.022, 0.02, GC_.bk),
    Bc(0, -0.05, -0.06, 0.032, 0.04, 0.066, GC_.bk), Bc(0, -0.115, -0.07, 0.026, 0.12, 0.06, GC_.bk, -0.15), Bc(0, -0.085, 0.085, 0.031, 0.1, 0.04, GC_.pl, 0.3), Bc(0, -0.045, 0.025, 0.007, 0.012, 0.07, GC_.bk),
    Cz(0, 0.006, 0.21, 0.014, 0.16, GC_.bk), Bc(0, -0.012, 0.29, 0.04, 0.08, 0.12, GC_.pl), Bc(0, 0.03, 0.27, 0.03, 0.02, 0.09, GC_.pl), Bc(0, 0.03, 0.135, 0.04, 0.012, 0.02, GC_.bk)],
  'SCAR-L': () => [Bc(0, 0.015, -0.1, 0.056, 0.076, 0.48, GC_.tan), Bc(0, 0.06, -0.1, 0.026, 0.012, 0.46, '#2a2620'), Bc(0, -0.03, 0.04, 0.05, 0.042, 0.18, GC_.tan), Cz(0, 0.01, -0.44, 0.0095, 0.14, GC_.st), Cz(0, 0.01, -0.53, 0.014, 0.05, GC_.bk),
    Bc(0, -0.055, -0.06, 0.032, 0.04, 0.066, GC_.tan), Bc(0, -0.12, -0.07, 0.026, 0.12, 0.06, GC_.bk, -0.15), Bc(0, -0.085, 0.085, 0.031, 0.1, 0.04, GC_.bk, 0.3), Bc(0.035, 0.035, 0.0, 0.014, 0.012, 0.03, GC_.bk),
    Bc(0, 0.0, 0.25, 0.046, 0.07, 0.2, GC_.tan), Bc(0, -0.03, 0.35, 0.046, 0.13, 0.03, GC_.tan), Bc(0, 0.04, 0.24, 0.036, 0.024, 0.13, GC_.tan)],
  M16A2: () => [Bc(0, 0.01, -0.03, 0.05, 0.06, 0.3, GC_.bk), Bc(0, -0.032, 0.03, 0.044, 0.04, 0.18, GC_.pl), Bc(0, 0.047, -0.08, 0.024, 0.012, 0.3, '#141518'), Cz(0, 0.006, -0.34, 0.03, 0.3, GC_.pl, 6),
    Cz(0, 0.006, -0.62, 0.0095, 0.3, GC_.st), Bc(0, 0.045, -0.53, 0.01, 0.06, 0.018, GC_.bk), Cz(0, 0.006, -0.79, 0.013, 0.05, GC_.bk), Bc(0, -0.05, -0.06, 0.032, 0.04, 0.066, GC_.bk), Bc(0, -0.115, -0.07, 0.026, 0.12, 0.06, GC_.bk, -0.15),
    Bc(0, -0.085, 0.085, 0.031, 0.1, 0.04, GC_.pl, 0.3), Bc(0, -0.01, 0.3, 0.044, 0.08, 0.26, GC_.pl, 0.06), Bc(0, -0.03, 0.43, 0.046, 0.11, 0.015, GC_.bk)],
  AUG: () => [Bc(0, -0.02, 0.06, 0.07, 0.1, 0.44, GC_.od), Bc(0, 0.035, -0.1, 0.05, 0.03, 0.38, GC_.od), Cz(0, 0.005, -0.38, 0.012, 0.36, GC_.st), Cz(0, 0.005, -0.57, 0.015, 0.04, GC_.bk),
    Bc(0, -0.09, -0.18, 0.028, 0.1, 0.035, GC_.od, 0.2), Bc(0, -0.08, -0.06, 0.022, 0.06, 0.15, GC_.od), Bc(0, -0.085, 0.02, 0.03, 0.1, 0.04, GC_.od, 0.3), Bc(0, -0.1, 0.14, 0.028, 0.12, 0.055, '#2f3430', -0.1),
    Bc(0, 0.06, -0.06, 0.03, 0.03, 0.18, GC_.od), Bc(0, -0.02, 0.29, 0.07, 0.11, 0.02, GC_.bk)],
  GROZA: () => [Bc(0, -0.01, 0.05, 0.06, 0.09, 0.34, GC_.bk), Bc(0, 0.04, -0.05, 0.03, 0.014, 0.28, '#141518'), Bc(0, 0.0, -0.2, 0.05, 0.06, 0.16, GC_.pl), Cz(0, 0.005, -0.33, 0.012, 0.14, GC_.st), Cz(0, 0.005, -0.42, 0.016, 0.05, GC_.bk),
    Bc(0, -0.085, -0.06, 0.03, 0.1, 0.04, GC_.pl, 0.3), Bc(0, -0.07, -0.12, 0.02, 0.05, 0.1, GC_.pl), Bc(0, -0.09, 0.12, 0.028, 0.08, 0.06, GC_.st, -0.15), Bc(0, -0.15, 0.135, 0.027, 0.07, 0.056, GC_.st, -0.4), Bc(0, -0.02, 0.23, 0.062, 0.1, 0.02, GC_.bk)],
  KAR98K: () => [Bc(0, -0.018, 0.0, 0.046, 0.05, 0.66, GC_.wd), Bc(0, -0.05, 0.33, 0.044, 0.1, 0.2, GC_.wd, 0.18), Bc(0, -0.07, 0.44, 0.046, 0.14, 0.04, GC_.wd), Bc(0, -0.06, 0.13, 0.03, 0.06, 0.06, GC_.wd, 0.5),
    Cz(0, 0.022, -0.04, 0.014, 0.22, GC_.st), Cz(0, 0.02, -0.5, 0.0095, 0.5, GC_.st), Cz(0, 0.006, -0.42, 0.028, 0.012, GC_.st), Cz(0, 0.006, -0.22, 0.028, 0.012, GC_.st), Bc(0, 0.035, -0.74, 0.008, 0.03, 0.012, GC_.st),
    Bc(0.03, 0.02, 0.07, 0.05, 0.008, 0.008, GC_.st), { g: GEO.sph, x: 0.058, y: 0.012, z: 0.07, sx: 0.022, sy: 0.022, sz: 0.022, c: GC_.st }, Bc(0, -0.05, -0.01, 0.028, 0.012, 0.08, GC_.st), Bc(0, -0.04, 0.06, 0.008, 0.03, 0.05, GC_.st)],
  M24: () => [Bc(0, -0.02, 0.0, 0.05, 0.055, 0.6, '#3d4535'), Bc(0, -0.06, 0.32, 0.048, 0.11, 0.22, '#3d4535', 0.15), Bc(0, -0.08, 0.44, 0.05, 0.15, 0.03, GC_.bk), Bc(0, -0.06, 0.12, 0.034, 0.08, 0.05, '#3d4535', 0.45),
    Cz(0, 0.024, -0.04, 0.016, 0.24, GC_.st), Cz(0, 0.02, -0.48, 0.0125, 0.48, GC_.bk), Bc(0.03, 0.022, 0.07, 0.05, 0.008, 0.008, GC_.st), { g: GEO.sph, x: 0.058, y: 0.014, z: 0.07, sx: 0.022, sy: 0.022, sz: 0.022, c: GC_.bk }, Bc(0, -0.05, -0.02, 0.03, 0.014, 0.08, GC_.st)],
  AWM: () => [Bc(0, -0.01, 0.0, 0.056, 0.07, 0.42, GC_.gr), Bc(0, -0.03, 0.3, 0.05, 0.12, 0.22, GC_.gr), Bc(0, -0.01, 0.3, 0.02, 0.04, 0.1, '#00000000'), Bc(0, -0.09, 0.08, 0.034, 0.1, 0.045, GC_.gr, 0.3), Bc(0, -0.06, 0.43, 0.05, 0.16, 0.03, GC_.bk),
    Cz(0, 0.03, -0.02, 0.017, 0.26, GC_.st), Cz(0, 0.024, -0.5, 0.0125, 0.56, GC_.bk), Bc(0, 0.024, -0.8, 0.04, 0.03, 0.06, GC_.bk), Bc(0, -0.08, -0.05, 0.03, 0.08, 0.07, GC_.bk), Bc(0.032, 0.03, 0.07, 0.05, 0.008, 0.008, GC_.st), { g: GEO.sph, x: 0.06, y: 0.022, z: 0.07, sx: 0.024, sy: 0.024, sz: 0.024, c: GC_.bk },
    Bc(0.012, -0.03, -0.3, 0.008, 0.008, 0.18, GC_.bk), Bc(-0.012, -0.03, -0.3, 0.008, 0.008, 0.18, GC_.bk)],
  SKS: () => [Bc(0, -0.02, 0.0, 0.046, 0.055, 0.62, GC_.wd), Bc(0, -0.05, 0.32, 0.044, 0.1, 0.2, GC_.wd, 0.16), Bc(0, -0.07, 0.42, 0.046, 0.14, 0.035, GC_.wd), Bc(0, 0.024, -0.03, 0.04, 0.03, 0.24, GC_.st), Bc(0, 0.024, -0.3, 0.04, 0.026, 0.2, GC_.wd),
    Cz(0, 0.042, -0.32, 0.01, 0.2, GC_.st), Cz(0, 0.018, -0.5, 0.0105, 0.36, GC_.st), Bc(0, -0.05, -0.04, 0.028, 0.05, 0.1, GC_.st), Bc(0, -0.0, -0.55, 0.01, 0.01, 0.25, '#55585e'), Bc(0, 0.05, -0.68, 0.008, 0.04, 0.012, GC_.st)],
  MINI14: () => [Bc(0, -0.02, 0.0, 0.046, 0.055, 0.58, GC_.wd), Bc(0, -0.05, 0.3, 0.044, 0.1, 0.2, GC_.wd, 0.16), Bc(0, -0.07, 0.4, 0.046, 0.14, 0.035, GC_.wd), Bc(0, 0.025, -0.02, 0.042, 0.032, 0.26, '#6a6f76'),
    Cz(0, 0.016, -0.46, 0.0105, 0.34, '#6a6f76'), Bc(0, -0.08, -0.06, 0.026, 0.09, 0.055, GC_.bk, -0.2), Bc(0, 0.045, -0.62, 0.008, 0.04, 0.012, GC_.st)],
  UMP45: () => [Bc(0, 0.0, -0.03, 0.056, 0.09, 0.36, GC_.pl), Bc(0, 0.052, -0.04, 0.024, 0.012, 0.3, '#141518'), Cz(0, 0.012, -0.25, 0.012, 0.08, GC_.st), Bc(0, -0.1, -0.06, 0.032, 0.13, 0.068, GC_.bk, -0.05),
    Bc(0, -0.075, 0.1, 0.032, 0.09, 0.045, GC_.pl, 0.3), Bc(0, -0.04, 0.04, 0.008, 0.012, 0.07, GC_.pl), Bc(0, 0.01, 0.24, 0.03, 0.06, 0.18, GC_.pl), Bc(0, -0.0, 0.33, 0.04, 0.1, 0.025, GC_.pl)],
  MP5K: () => [Bc(0, 0.005, -0.04, 0.044, 0.062, 0.25, GC_.bk), Cz(0, 0.038, -0.04, 0.014, 0.22, GC_.st), Cz(0, 0.005, -0.2, 0.011, 0.06, GC_.st), Bc(0, -0.07, -0.13, 0.026, 0.08, 0.034, GC_.pl, 0.15),
    Bc(0, -0.075, -0.035, 0.026, 0.07, 0.05, GC_.st, -0.25), Bc(0, -0.13, -0.05, 0.025, 0.06, 0.048, GC_.st, -0.5), Bc(0, -0.075, 0.07, 0.03, 0.09, 0.04, GC_.pl, 0.25), Bc(0, 0.06, 0.06, 0.012, 0.02, 0.03, GC_.st)],
  UZI: () => [Bc(0, 0.005, -0.02, 0.05, 0.07, 0.28, GC_.st), Bc(0, 0.045, -0.02, 0.04, 0.012, 0.24, GC_.st), Cz(0, 0.01, -0.19, 0.011, 0.06, GC_.st), Bc(0, -0.1, 0.03, 0.03, 0.16, 0.045, GC_.bk, 0.12),
    Bc(0, -0.04, -0.06, 0.008, 0.012, 0.07, GC_.st), Bc(0.02, 0.0, 0.2, 0.006, 0.05, 0.14, GC_.st), Bc(-0.02, 0.0, 0.2, 0.006, 0.05, 0.14, GC_.st), Bc(0, -0.01, 0.27, 0.046, 0.06, 0.012, GC_.st)],
  M17: () => [Bc(0, 0.02, -0.03, 0.03, 0.034, 0.2, GC_.bk), Cz(0, 0.024, -0.135, 0.009, 0.02, GC_.st), Bc(0, -0.006, -0.06, 0.028, 0.022, 0.14, GC_.bk), Bc(0, -0.06, 0.045, 0.032, 0.1, 0.045, '#3b2c22', 0.25), Bc(0, -0.03, -0.02, 0.006, 0.014, 0.05, GC_.bk), Bc(0, 0.04, 0.06, 0.012, 0.01, 0.01, GC_.bk)],
  M1911: () => [Bc(0, 0.02, -0.03, 0.03, 0.034, 0.21, GC_.bl), Bc(0, -0.006, -0.05, 0.028, 0.022, 0.15, GC_.bl), Bc(0, -0.06, 0.045, 0.033, 0.1, 0.044, '#7a4a28', 0.25), Bc(0, -0.03, -0.02, 0.006, 0.014, 0.05, GC_.bl), Bc(0, 0.025, 0.075, 0.01, 0.012, 0.012, GC_.bl)],
  S1897: () => [Bc(0, 0.005, -0.03, 0.045, 0.05, 0.22, GC_.bl), Cz(0, 0.018, -0.42, 0.012, 0.56, GC_.bl), Bc(0, -0.022, -0.32, 0.045, 0.04, 0.17, GC_.wd), Cz(0, -0.02, -0.5, 0.009, 0.36, GC_.bl), Bc(0, -0.05, 0.12, 0.034, 0.08, 0.1, GC_.wd, 0.45), Bc(0, -0.04, 0.3, 0.042, 0.11, 0.28, GC_.wd, 0.18), Bc(0, -0.07, 0.44, 0.044, 0.15, 0.03, GC_.dw), Bc(0, -0.035, 0.03, 0.008, 0.012, 0.06, GC_.bl)],
  S686: () => [Bc(0, 0.0, -0.02, 0.05, 0.05, 0.16, '#8a8f96'), Cz(-0.012, 0.02, -0.38, 0.012, 0.56, GC_.bl), Cz(0.012, 0.02, -0.38, 0.012, 0.56, GC_.bl), Bc(0, -0.008, -0.3, 0.05, 0.03, 0.22, GC_.wd), Bc(0, -0.04, 0.12, 0.036, 0.08, 0.1, GC_.wd, 0.45), Bc(0, -0.035, 0.3, 0.044, 0.11, 0.28, GC_.wd, 0.15), Bc(0, -0.065, 0.44, 0.046, 0.15, 0.03, GC_.dw)],
  S12K: () => [Bc(0, 0.0, -0.02, 0.05, 0.07, 0.36, GC_.bk), Bc(0, 0.04, -0.01, 0.042, 0.016, 0.3, GC_.st), Bc(0, -0.002, -0.3, 0.056, 0.05, 0.2, GC_.pl), Cz(0, 0.012, -0.5, 0.013, 0.24, GC_.st), Bc(0, -0.1, -0.08, 0.04, 0.12, 0.08, GC_.bk, -0.1), Bc(0, -0.08, 0.09, 0.034, 0.11, 0.045, GC_.pl, 0.35), Bc(0, -0.012, 0.27, 0.04, 0.066, 0.22, GC_.pl, 0.12), Bc(0, -0.04, 0.385, 0.043, 0.12, 0.035, GC_.pl)],
  G18C: () => [Bc(0, 0.02, -0.03, 0.03, 0.032, 0.19, GC_.bk), Bc(0, -0.006, -0.05, 0.029, 0.024, 0.15, GC_.pl), Bc(0, -0.065, 0.045, 0.032, 0.11, 0.046, GC_.pl, 0.2), Bc(0, -0.13, 0.06, 0.028, 0.06, 0.04, GC_.bk, 0.2), Bc(0, -0.03, -0.02, 0.006, 0.014, 0.05, GC_.pl)],
};
const MUZ = { S1897: -0.7, S686: -0.66, S12K: -0.62, AKM: -0.74, M416: -0.66, 'SCAR-L': -0.55, M16A2: -0.81, MOSIN: -0.86, M625: -0.19, AUG: -0.59, GROZA: -0.44, KAR98K: -0.75, M24: -0.72, AWM: -0.83, SKS: -0.68, MINI14: -0.63, UMP45: -0.29, MP5K: -0.23, UZI: -0.22, M17: -0.16, M1911: -0.14, G18C: -0.13 };
function gunGeo(k) {
  if (GUNGEO[k]) return GUNGEO[k];
  GUN_MUZ[k] = MUZ[k] || -0.6; GUN_TOP[k] = WEAP[k].cls === 'pistol' ? 0.04 : 0.06;
  const alias = { MOSIN: 'KAR98K', M625: 'M1911' };
  return GUNGEO[k] = mergeParts((GUNS[k] || GUNS[alias[k]] || GUNS.M416)().filter(p => p.c.length === 7));
}
// modelos de verdade (Sketchfab, CC BY 4.0): ficam como filho do objeto da arma
const REALGUN = { AKM: { f: 'akm', fore: -0.3 }, M16A2: { f: 'm16a2', fore: -0.36 }, MOSIN: { f: 'mosin', fore: -0.42 }, M17: { f: 'p226', fore: 0.02 }, M625: { f: 'm625', fore: 0.02 } };
const EMPTY_GEO = new T.BufferGeometry();
function loadRealGuns(L, done) {
  const ks = Object.keys(REALGUN); let left = ks.length;
  for (const k of ks) L.load(`assets/guns/${REALGUN[k].f}.glb`, g => {
    const o = g.scene; o.traverse(n => { if (!n.isMesh) return; const m = n.material; n.material = new T.MeshPhongMaterial({ map: m.map || null, normalMap: m.normalMap || null, color: m.map ? 0xffffff : m.color, shininess: 38, specular: 0x2a2a2a }); if (n.material.map) n.material.map.encoding = T.sRGBEncoding; n.castShadow = true; });
    const b = new T.Box3().setFromObject(o); REALGUN[k].obj = o; GUN_MUZ[k] = b.min.z; GUN_TOP[k] = b.max.y - 0.006;
    for (const id in GUNGEO) if (id === k) delete GUNGEO[id];
    if (--left === 0) done();
  }, undefined, () => { if (--left === 0) done(); });
}
function setGunVisual(mesh, k) {
  for (let i = mesh.children.length - 1; i >= 0; i--) if (mesh.children[i].userData.real) mesh.remove(mesh.children[i]);
  const r = REALGUN[k];
  if (r && r.obj) { mesh.geometry = EMPTY_GEO; const c = r.obj.clone(); c.userData.real = 1; mesh.add(c); }
  else mesh.geometry = gunGeo(k);
}
const foreOf = k => REALGUN[k] && REALGUN[k].obj ? REALGUN[k].fore : WEAP[k].cls === 'pistol' ? 0.02 : -0.32;
// acessórios visíveis na arma (mira em cima, silenciador/compensador no cano, empunhadura embaixo)
const ATTGEO = {};
function attGeo(ak) {
  if (ATTGEO[ak]) return ATTGEO[ak];
  const a = ATT[ak], p = [];
  if (a.slot === 'sight') {
    if (ak === 'RED') p.push(Bc(0, 0.018, 0, 0.026, 0.026, 0.05, GC_.bk), Cz(0, 0.03, -0.02, 0.012, 0.01, '#ff3b3b'), Bc(0, 0.004, 0, 0.022, 0.008, 0.04, GC_.bk));
    else if (ak === 'HOLO') p.push(Bc(0, 0.01, 0.0, 0.034, 0.016, 0.08, GC_.bk), Bc(0.015, 0.035, -0.02, 0.004, 0.035, 0.03, GC_.bk), Bc(-0.015, 0.035, -0.02, 0.004, 0.035, 0.03, GC_.bk), Bc(0, 0.052, -0.02, 0.034, 0.004, 0.03, GC_.bk), Bc(0, 0.035, -0.02, 0.026, 0.03, 0.002, '#7fd3ff'));
    else { const L = 0.1 + a.zoom * 0.012, R = 0.016 + Math.min(a.zoom, 8) * 0.0015;
      p.push(Cz(0, 0.042, 0, R, L, GC_.bk), Cz(0, 0.042, -L / 2 - 0.02, R + 0.008, 0.05, GC_.bk), Cz(0, 0.042, L / 2 + 0.012, R + 0.004, 0.03, GC_.bk), Cz(0, 0.042, -L / 2 - 0.046, R + 0.006, 0.002, '#4fc3ff'),
        Bc(0, 0.012, -0.03, 0.02, 0.03, 0.016, GC_.bk), Bc(0, 0.012, 0.03, 0.02, 0.03, 0.016, GC_.bk), Cz(0, 0.062 + R, 0, 0.008, 0.02, GC_.bk)); }
  } else if (a.slot === 'muzzle') p.push(a.quiet ? Cz(0, 0, -0.08, 0.017, 0.16, GC_.bk) : Cz(0, 0, -0.025, 0.016, 0.05, GC_.st));
  else if (a.slot === 'grip') p.push(Bc(0, -0.06, 0, 0.026, 0.08, 0.03, GC_.pl, 0.1));
  else p.push(Bc(0, -0.06, 0, 0.03, 0.06, 0.06, GC_.bk));
  return ATTGEO[ak] = mergeParts(p);
}
// arma com os acessórios montados (para o boneco e para a 1ª pessoa)
function dressGun(mesh, w) {
  for (let i = mesh.children.length - 1; i >= 0; i--) if (mesh.children[i].userData.att) mesh.remove(mesh.children[i]);
  if (!w) return;
  gunGeo(w.k);
  for (const s of ['sight', 'muzzle', 'grip']) {
    const ak = w.att[s]; if (!ak) continue;
    const m = new T.Mesh(attGeo(ak), mesh.material); m.userData.att = 1;
    if (s === 'sight') m.position.set(0, GUN_TOP[w.k], WEAP[w.k].cls === 'pistol' ? -0.02 : -0.06);
    else if (s === 'muzzle') m.position.set(0, WEAP[w.k].cls === 'pistol' ? 0.024 : (w.k === 'AWM' || w.k === 'M24' || w.k === 'KAR98K' ? 0.02 : 0.008), GUN_MUZ[w.k]);
    else m.position.set(0, 0.0, -0.28);
    mesh.add(m);
  }
}
const IGEO = {};
function itemGeo(k) {
  if (IGEO[k]) return IGEO[k];
  const inf = itemInfo(k); let p;
  if (inf.type === 'weapon') return gunGeo(k.slice(2));
  if (inf.type === 'ammo') p = [bx(-0.14, 0, -0.1, 0.28, 0.14, 0.2, inf.d.c), bx(-0.12, 0.14, -0.08, 0.24, 0.02, 0.16, '#ffffff')];
  else if (inf.type === 'heal') {
    const c = inf.d.c;
    p = k === 'BAND' ? [{ g: GEO.cyl, y: 0.07, sx: 0.16, sy: 0.14, sz: 0.16, c }] : k === 'ENERGY' ? [{ g: GEO.cyl, y: 0.1, sx: 0.1, sy: 0.2, sz: 0.1, c }] : k === 'PAIN' ? [{ g: GEO.cyl, y: 0.06, sx: 0.12, sy: 0.12, sz: 0.12, c }]
      : [bx(-0.18, 0, -0.12, 0.36, 0.18, 0.24, c), bx(-0.03, 0.18, -0.09, 0.06, 0.01, 0.18, k === 'MED' ? '#fff' : '#e63946'), bx(-0.09, 0.18, -0.03, 0.18, 0.01, 0.06, k === 'MED' ? '#fff' : '#e63946')];
  } else if (inf.type === 'att') {
    const a = inf.d;
    p = a.slot === 'sight' ? [{ g: GEO.cyl, y: 0.05, rx: Math.PI / 2, sx: 0.06 + a.zoom * 0.004, sy: 0.12 + a.zoom * 0.02, sz: 0.06 + a.zoom * 0.004, c: '#1d1f24' }, bx(-0.02, 0, -0.02, 0.04, 0.03, 0.04, '#e63946')]
      : a.slot === 'muzzle' ? [{ g: GEO.cyl, y: 0.04, rx: Math.PI / 2, sx: 0.06, sy: a.quiet ? 0.26 : 0.12, sz: 0.06, c: '#2f3237' }]
        : a.slot === 'grip' ? [bx(-0.03, 0, -0.03, 0.06, 0.14, 0.06, '#2f3237')] : [bx(-0.03, 0, -0.06, 0.06, 0.22, 0.12, '#2f3237')];
  } else if (inf.type === 'helm') p = [{ g: GEO.hsph, y: 0, sx: 0.32, sy: 0.3, sz: 0.34, c: LV_C[inf.lv] }];
  else if (inf.type === 'vest') p = [bx(-0.22, 0, -0.16, 0.44, 0.1, 0.32, LV_C[inf.lv]), bx(-0.18, 0.1, -0.12, 0.36, 0.04, 0.24, '#3a3a3a')];
  else p = [bx(-0.18, 0, -0.12, 0.36, 0.42, 0.24, LV_C[inf.lv]), bx(-0.15, 0.08, 0.12, 0.3, 0.2, 0.06, '#333')];
  return IGEO[k] = mergeParts(p);
}
let itemVisT = 0;
function updateItemVisuals(dt, cx, cz) {
  if ((itemVisT -= dt) > 0) return; itemVisT = 0.3;
  const R2 = 55 * 55;
  for (const it of G.items) {
    const near = (it.x - cx) ** 2 + (it.z - cz) ** 2 < R2;
    if (near && !it.mesh) {
      const m = it.mesh = new T.Mesh(itemGeo(it.k), MAT.item); if (it.k.startsWith('w:')) setGunVisual(m, it.k.slice(2));
      m.position.set(it.x, it.y + (it.k.startsWith('w:') ? 0.06 : 0), it.z);
      m.rotation.set(it.k.startsWith('w:') ? Math.PI / 2 * 0 : 0, (it.x * 7 + it.z * 13) % 6.28, it.k.startsWith('w:') ? Math.PI / 2 : 0);
      m.scale.setScalar(1.25); scene.add(m);
    } else if (!near && it.mesh) { scene.remove(it.mesh); it.mesh = null; }
  }
}
