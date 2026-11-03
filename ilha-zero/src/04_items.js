// ================= itens: armas, munição, acessórios, proteção, cura e saque no chão =================
const AMMO = {
  '9mm': { n: '9mm', w: 0.375, c: '#f5c542', stack: 30 },
  '45': { n: '.45 ACP', w: 0.4, c: '#ff8c42', stack: 30 },
  '556': { n: '5.56mm', w: 0.5, c: '#52d273', stack: 30 },
  '762': { n: '7.62mm', w: 0.7, c: '#ff5f5f', stack: 30 },
  '300': { n: '.300 Magnum', w: 1, c: '#b26bff', stack: 10 },
};
// cls: pistol | smg | ar | dmr | sr.  dmg = dano no corpo; v = velocidade da bala (m/s); rel = recarga (s); rec = coice
const WEAP = {
  M9: { n: 'M9', cls: 'pistol', ammo: '9mm', dmg: 24, rpm: 420, v: 380, mag: 15, emag: 20, rel: 1.9, rec: 0.7, tier: 1 },
  M1911: { n: 'M1911', cls: 'pistol', ammo: '45', dmg: 40, rpm: 300, v: 250, mag: 7, emag: 12, rel: 2.0, rec: 1.0, tier: 1 },
  G18C: { n: 'G18C', cls: 'pistol', ammo: '9mm', dmg: 22, rpm: 1000, v: 375, mag: 17, emag: 33, rel: 2.1, rec: 0.6, auto: true, tier: 1 },
  UMP45: { n: 'UMP45', cls: 'smg', ammo: '45', dmg: 37, rpm: 650, v: 360, mag: 25, emag: 35, rel: 3.0, rec: 0.55, auto: true, tier: 1 },
  MP5K: { n: 'MP5K', cls: 'smg', ammo: '9mm', dmg: 33, rpm: 900, v: 400, mag: 30, emag: 40, rel: 2.6, rec: 0.5, auto: true, tier: 1 },
  UZI: { n: 'UZI', cls: 'smg', ammo: '9mm', dmg: 26, rpm: 1200, v: 350, mag: 25, emag: 35, rel: 2.4, rec: 0.6, auto: true, tier: 1 },
  AKM: { n: 'AKM', cls: 'ar', ammo: '762', dmg: 47, rpm: 600, v: 715, mag: 30, emag: 40, rel: 2.9, rec: 1.45, auto: true, tier: 1 },
  M416: { n: 'M416', cls: 'ar', ammo: '556', dmg: 41, rpm: 700, v: 880, mag: 30, emag: 40, rel: 2.6, rec: 1.0, auto: true, tier: 2 },
  'SCAR-L': { n: 'SCAR-L', cls: 'ar', ammo: '556', dmg: 41, rpm: 625, v: 870, mag: 30, emag: 40, rel: 2.7, rec: 1.0, auto: true, tier: 2 },
  M16A4: { n: 'M16A4', cls: 'ar', ammo: '556', dmg: 42, rpm: 800, v: 900, mag: 30, emag: 40, rel: 2.5, rec: 0.9, burst: 3, tier: 2 },
  SKS: { n: 'SKS', cls: 'dmr', ammo: '762', dmg: 53, rpm: 220, v: 800, mag: 10, emag: 20, rel: 2.9, rec: 1.6, tier: 2 },
  MINI14: { n: 'Mini 14', cls: 'dmr', ammo: '556', dmg: 46, rpm: 260, v: 990, mag: 20, emag: 30, rel: 3.0, rec: 1.0, tier: 2 },
  KAR98K: { n: 'Kar98k', cls: 'sr', ammo: '762', dmg: 79, rpm: 35, v: 760, mag: 5, emag: 5, rel: 3.6, rec: 2.4, bolt: true, tier: 2 },
  M24: { n: 'M24', cls: 'sr', ammo: '762', dmg: 76, rpm: 38, v: 790, mag: 5, emag: 7, rel: 3.4, rec: 2.2, bolt: true, tier: 3 },
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
};
const HEAL = {
  BAND: { n: 'Bandagem', w: 2, t: 4, hp: 10, cap: 75, c: '#f1e3c8' },
  FAK: { n: 'Kit de primeiros socorros', w: 10, t: 6, hp: 75, cap: 75, c: '#ffffff' },
  MED: { n: 'Kit médico', w: 20, t: 8, hp: 100, cap: 100, c: '#ff4d4d' },
  ENERGY: { n: 'Energético', w: 4, t: 4, boost: 40, c: '#2ec4ff' },
  PAIN: { n: 'Analgésico', w: 10, t: 6, boost: 60, c: '#ffd166' },
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
  if (a.slot === 'sight') return a.zoom <= CLS[d.cls].maxZoom;
  return a.cls.includes(d.cls);
}

// ---------- tabelas de saque ----------
const POOL = {
  1: { w: [['M9', 6], ['M1911', 5], ['G18C', 3], ['UMP45', 7], ['MP5K', 6], ['UZI', 6], ['AKM', 6], ['M416', 3], ['SKS', 2], ['KAR98K', 1.5], ['MINI14', 1.5]], gear: [[1, 7], [2, 3]], sight: [['RED', 5], ['HOLO', 5], ['X2', 4], ['X3', 1], ['X4', 0.6]] },
  2: { w: [['M9', 2], ['UMP45', 5], ['MP5K', 4], ['UZI', 3], ['AKM', 7], ['M416', 6], ['SCAR-L', 6], ['M16A4', 4], ['SKS', 3], ['MINI14', 3], ['KAR98K', 3], ['M24', 0.6]], gear: [[1, 4], [2, 5], [3, 1]], sight: [['RED', 4], ['HOLO', 4], ['X2', 4], ['X3', 3], ['X4', 3], ['X6', 1], ['X8', 0.4]] },
  3: { w: [['AKM', 6], ['M416', 7], ['SCAR-L', 7], ['M16A4', 4], ['SKS', 4], ['MINI14', 4], ['KAR98K', 4], ['M24', 3], ['UMP45', 2]], gear: [[1, 1], [2, 5], [3, 4]], sight: [['HOLO', 3], ['X2', 3], ['X3', 3], ['X4', 4], ['X6', 3], ['X8', 2], ['X10', 0.3]] },
};
const OTHER_ATT = ['COMP_AR', 'SUP_AR', 'COMP_SMG', 'SUP_SMG', 'GRIP', 'GRIP', 'EMAG_AR', 'EMAG_SMG', 'EMAG_SR', 'SUP_SR'];
function rollLoot(tier) {
  const P = POOL[Math.min(tier, 3)], out = [];
  const cat = wpick([['w', 26], ['ammo', 22], ['heal', 20], ['att', 15], ['gear', 13], ['bag', 4]]);
  if (cat === 'w') { const k = wpick(P.w); out.push({ k: 'w:' + k, n: 1 }); out.push({ k: 'a:' + WEAP[k].ammo, n: AMMO[WEAP[k].ammo].stack }); if (Math.random() < 0.5) out.push({ k: 'a:' + WEAP[k].ammo, n: AMMO[WEAP[k].ammo].stack }); }
  else if (cat === 'ammo') out.push({ k: 'a:' + wpick([['9mm', 3], ['45', 2], ['556', 4], ['762', 4]]), n: 30 });
  else if (cat === 'heal') { const h = wpick([['BAND', 6], ['FAK', 3], ['MED', 0.6], ['ENERGY', 3], ['PAIN', 1.5]]); out.push({ k: h, n: h === 'BAND' ? 5 : 1 }); }
  else if (cat === 'att') out.push({ k: Math.random() < 0.45 ? wpick(P.sight) : pick(OTHER_ATT), n: 1 });
  else if (cat === 'gear') out.push({ k: (Math.random() < 0.5 ? 'H' : 'V') + wpick(P.gear), n: 1 });
  else out.push({ k: 'B' + wpick(P.gear), n: 1 });
  return out;
}
function rollDrop() {
  const w = pick(['AWM', 'AUG', 'GROZA']), out = [{ k: 'w:' + w, n: 1, w: mkWeapon(w) }, { k: 'a:' + WEAP[w].ammo, n: w === 'AWM' ? 20 : 60 }];
  out.push({ k: Math.random() < 0.5 ? 'X10' : 'X8', n: 1 }, { k: 'H3', n: 1 }, { k: 'V3', n: 1 }, { k: 'MED', n: 1 }, { k: 'PAIN', n: 1 });
  out.push({ k: w === 'AWM' ? 'SUP_SR' : 'SUP_AR', n: 1 });
  return out;
}

// ---------- itens no chão (grade para achar rápido) ----------
const IGRID = Array.from({ length: GW * GW }, () => []);
function dropItem(k, n, x, y, z, w) {
  const it = { k, n, x, y, z, w: w || (k.startsWith('w:') ? mkWeapon(k.slice(2)) : null), mesh: null, cell: gcell(z) * GW + gcell(x) };
  IGRID[it.cell].push(it); G.items.push(it); return it;
}
function removeItem(it) {
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
const GUNGEO = {};
function gunGeo(k) {
  if (GUNGEO[k]) return GUNGEO[k];
  const d = WEAP[k], L = { pistol: 0.22, smg: 0.48, ar: 0.82, dmr: 0.95, sr: 1.12 }[d.cls];
  const wood = k === 'AKM' || k === 'SKS' || k === 'KAR98K' || k === 'M24', body = k === 'AWM' ? '#4f6d3a' : k === 'SCAR-L' ? '#c8a26b' : k === 'AUG' ? '#5c6f50' : '#2b2d31';
  const p = [bx(-0.035, -0.04, -L * 0.55, 0.07, 0.09, L * 0.75, body)];
  p.push(bx(-0.015, -0.01, -L, 0.03, 0.03, L * 0.48, '#18191c')); // cano
  if (d.cls !== 'pistol') p.push(bx(-0.03, -0.07, L * 0.18, 0.06, 0.1, L * 0.28, wood ? '#8a5a2b' : '#3a3c42')); // coronha
  p.push(bx(-0.025, -0.16, -L * 0.15, 0.05, d.cls === 'sr' ? 0.07 : 0.13, 0.06, '#1f2023')); // pente
  p.push(bx(-0.025, -0.15, d.cls === 'pistol' ? 0.02 : L * 0.05, 0.05, 0.12, 0.05, wood ? '#6b4423' : '#26272b')); // cabo
  if (wood && d.cls !== 'pistol') p.push(bx(-0.04, -0.06, -L * 0.7, 0.08, 0.06, L * 0.4, '#8a5a2b'));
  return GUNGEO[k] = mergeParts(p);
}
const IGEO = {};
function itemGeo(k) {
  if (IGEO[k]) return IGEO[k];
  const inf = itemInfo(k); let p;
  if (inf.type === 'weapon') return IGEO[k] = gunGeo(k.slice(2));
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
      const m = it.mesh = new T.Mesh(itemGeo(it.k), MAT.item);
      m.position.set(it.x, it.y + (it.k.startsWith('w:') ? 0.06 : 0), it.z);
      m.rotation.set(it.k.startsWith('w:') ? Math.PI / 2 * 0 : 0, (it.x * 7 + it.z * 13) % 6.28, it.k.startsWith('w:') ? Math.PI / 2 : 0);
      m.scale.setScalar(1.25); scene.add(m);
    } else if (!near && it.mesh) { scene.remove(it.mesh); it.mesh = null; }
  }
}
