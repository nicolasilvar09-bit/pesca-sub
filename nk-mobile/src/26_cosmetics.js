// ================= cosméticos: caixas, Passe de Elite e armário =================
// skins de arma (2 por arma), roupas (10 + 1 do passe), capacetes (5), mochilas (5), paraquedas (10), veículos (1 por tipo)
// tudo original do NK Mobile; as caixas usam fichas ganhas jogando (sem dinheiro de verdade)
const RAR = { c: { n: 'Comum', c: '#9aa3ad', w: 60 }, r: { n: 'Raro', c: '#3ec7ff', w: 28 }, e: { n: 'Épico', c: '#b36bff', w: 10 }, l: { n: 'Lendário', c: '#ffb703', w: 2 } };
const PATN = { camo: 0, digital: 1, stripe: 2, solid: 3, metal: 4, tiger: 5, carbon: 6, imperial: 7 };
// temas: [id, nome, raridade, estampa, cor 1, cor 2, cor 3]
const THEMES = [
  ['selva', 'Selva', 'c', 'camo', '#3d5a2a', '#6b7f3a', '#2a2f1e'], ['deserto', 'Deserto', 'c', 'camo', '#b89a6a', '#8a7048', '#d8c49a'],
  ['urbano', 'Urbano', 'c', 'digital', '#5c6066', '#8a8f96', '#2e3034'], ['artico', 'Ártico', 'r', 'digital', '#e8eef2', '#9fb4c4', '#5c7486'],
  ['carbono', 'Carbono', 'r', 'carbon', '#1a1b1e', '#3a3d42', '#e1141c'], ['ouro', 'Ouro', 'l', 'metal', '#d4a537', '#fff1b0', '#8a6416'],
  ['lava', 'Lava', 'e', 'tiger', '#1a1110', '#ff5a1f', '#ffb347'], ['oceano', 'Oceano', 'r', 'camo', '#1f4e79', '#3f88c5', '#0f2a44'],
  ['neon', 'Neon', 'e', 'stripe', '#141418', '#ff2bd6', '#2bf3ff'], ['ferrugem', 'Ferrugem', 'c', 'camo', '#7a3b1e', '#a8582c', '#4a2a18'],
  ['rubro', 'Rubro NK', 'e', 'stripe', '#16161a', '#e1141c', '#f2f2f2'], ['noturno', 'Floresta Noturna', 'r', 'camo', '#1e2a22', '#33473a', '#0d120f'],
  ['oliva', 'Oliva', 'c', 'solid', '#5e6b3c', '#46512c', '#2a301a'], ['granito', 'Granito', 'c', 'digital', '#6e6a66', '#9a958e', '#3c3936'],
  ['coral', 'Coral', 'r', 'stripe', '#ff7f6e', '#ffd3b0', '#2a2a2a'], ['marfim', 'Marfim', 'r', 'solid', '#efe6d2', '#c9b98e', '#5a4a30'],
  ['cobra', 'Cobra', 'e', 'tiger', '#2f4a1e', '#c9b23a', '#111'], ['prata', 'Prata', 'e', 'metal', '#b8c0c8', '#f2f6fa', '#5c6670'],
  ['vulcao', 'Vulcão', 'l', 'tiger', '#0d0d0f', '#e1141c', '#ffcf3a'], ['aurora', 'Aurora', 'l', 'stripe', '#1b1f4a', '#3ee07a', '#b36bff'],
  ['imperial', 'Coroa Imperial', 'l', 'imperial', '#0c0c10', '#ff1e1e', '#d9a93a'], // tema exclusivo do Passe de Elite
];
const TH_ROLL = THEMES.filter(t => t[0] !== 'imperial'); // o tema do passe não sai em arma de caixa
const TH = Object.fromEntries(THEMES.map(t => [t[0], { id: t[0], n: t[1], rar: t[2], pat: t[3], c: [t[4], t[5], t[6]] }]));
const COS = {}, COSL = [];
const addCos = (id, cat, n, rar, d) => { const o = Object.assign({ id, cat, n, rar }, d); COS[id] = o; COSL.push(o); return o; };
// armas: 2 temas por arma
Object.keys(WEAP).forEach((k, i) => { for (const j of [(i * 2) % 20, (i * 2 + 7) % 20]) { const t = TH_ROLL[j]; addCos(`w:${k}:${t[0]}`, 'wpn', `${WEAP[k].n} · ${t[1]}`, t[2], { wk: k, th: t[0] }); } });
// roupas
[['out:selva', 'Patrulha da Selva', 'c', 'selva'], ['out:deserto', 'Duna', 'c', 'deserto'], ['out:urbano', 'Concreto', 'c', 'urbano'], ['out:artico', 'Nevasca', 'r', 'artico'],
 ['out:noturno', 'Sombra Noturna', 'r', 'noturno'], ['out:oceano', 'Maré', 'r', 'oceano'], ['out:oliva', 'Recruta', 'c', 'oliva'], ['out:coral', 'Verão', 'r', 'coral'],
 ['out:lava', 'Brasa', 'e', 'lava'], ['out:aurora', 'Aurora Boreal', 'l', 'aurora']].forEach(([id, n, r, th]) => addCos(id, 'out', n, r, { th }));
// conjunto Coroa Imperial: só no Passe de Elite (arte de referência em assets/pass)
addCos('out:pass', 'out', 'Traje Coroa Imperial', 'l', { th: 'imperial', pass: true, img: 'roupa' });
addCos('w:M416:imperial', 'wpn', 'M416 · Coroa Imperial', 'l', { wk: 'M416', th: 'imperial', pass: true, img: 'arma' });
addCos('helm:imperial', 'helm', 'Capacete Coroa Imperial', 'l', { th: 'imperial', pass: true, img: 'capacete' });
addCos('veh:imperial', 'veh', 'Sedã Coroa Imperial', 'l', { vk: 'seda', th: 'imperial', col: '#0c0c10', pass: true, img: 'carro' });
// capacetes e mochilas
[['helm:selva', 'Capacete Selva', 'c', 'selva'], ['helm:urbano', 'Capacete Urbano', 'c', 'urbano'], ['helm:artico', 'Capacete Ártico', 'r', 'artico'], ['helm:rubro', 'Capacete Rubro', 'e', 'rubro'], ['helm:ouro', 'Capacete Dourado', 'l', 'ouro']].forEach(([id, n, r, th]) => addCos(id, 'helm', n, r, { th }));
[['bag:deserto', 'Mochila Duna', 'c', 'deserto'], ['bag:oliva', 'Mochila Recruta', 'c', 'oliva'], ['bag:oceano', 'Mochila Maré', 'r', 'oceano'], ['bag:neon', 'Mochila Neon', 'e', 'neon'], ['bag:prata', 'Mochila Prata', 'l', 'prata']].forEach(([id, n, r, th]) => addCos(id, 'bag', n, r, { th }));
// paraquedas (cores das 9 células)
[['chute:fogo', 'Fogo', 'c', ['#e8562a', '#ffb347', '#e8562a', '#ffb347', '#e8562a', '#ffb347', '#e8562a', '#ffb347', '#e8562a']],
 ['chute:mar', 'Mar Aberto', 'c', ['#1f4e79', '#f4f1ea', '#1f4e79', '#3f88c5', '#f4f1ea', '#3f88c5', '#1f4e79', '#f4f1ea', '#1f4e79']],
 ['chute:mata', 'Mata', 'c', ['#3d5a2a', '#6b7f3a', '#3d5a2a', '#6b7f3a', '#2a2f1e', '#6b7f3a', '#3d5a2a', '#6b7f3a', '#3d5a2a']],
 ['chute:arco', 'Arco-íris', 'r', ['#e63946', '#f4a261', '#e9c46a', '#8ac926', '#2a9d8f', '#1982c4', '#6a4c93', '#b5179e', '#e63946']],
 ['chute:noite', 'Meia-noite', 'r', ['#141418', '#2b2d42', '#141418', '#2b2d42', '#8d99ae', '#2b2d42', '#141418', '#2b2d42', '#141418']],
 ['chute:rubro', 'Rubro NK', 'e', ['#16161a', '#e1141c', '#16161a', '#e1141c', '#f2f2f2', '#e1141c', '#16161a', '#e1141c', '#16161a']],
 ['chute:neon', 'Neon', 'e', ['#ff2bd6', '#141418', '#2bf3ff', '#141418', '#ff2bd6', '#141418', '#2bf3ff', '#141418', '#ff2bd6']],
 ['chute:areia', 'Areia', 'c', ['#d8c49a', '#b89a6a', '#d8c49a', '#b89a6a', '#d8c49a', '#b89a6a', '#d8c49a', '#b89a6a', '#d8c49a']],
 ['chute:aurora', 'Aurora', 'l', ['#1b1f4a', '#3ee07a', '#2bf3ff', '#b36bff', '#3ee07a', '#b36bff', '#2bf3ff', '#3ee07a', '#1b1f4a']],
 ['chute:ouro', 'Ouro', 'l', ['#8a6416', '#d4a537', '#fff1b0', '#d4a537', '#8a6416', '#d4a537', '#fff1b0', '#d4a537', '#8a6416']]].forEach(([id, n, r, cols]) => addCos(id, 'chute', 'Paraquedas ' + n, r, { cols }));
// veículos
[['veh:jipe', 'jipe', 'Jipe Caçador', 'e', '#2a2f1e'], ['veh:seda', 'seda', 'Sedã Rubro', 'e', '#b3121a'], ['veh:buggy', 'buggy', 'Buggy Duna', 'r', '#d8a24a'], ['veh:moto', 'moto', 'Moto Neon', 'e', '#ff2bd6'], ['veh:lancha', 'lancha', 'Lancha Ouro', 'l', '#d4a537']]
  .forEach(([id, k, n, r, col]) => addCos(id, 'veh', n, r, { vk: k, col }));
const CAT = { wpn: ['🔫', 'Armas'], out: ['👕', 'Roupas'], helm: ['⛑', 'Capacetes'], bag: ['🎒', 'Mochilas'], chute: ['🪂', 'Paraquedas'], veh: ['🚗', 'Veículos'] };
const cosCols = o => o.th ? TH[o.th].c : o.cols ? [o.cols[0], o.cols[1], o.cols[4]] : [o.col, '#222', '#ddd'];

// ---------- inventário salvo ----------
function cosInit() {
  if (SET.coins == null) SET.coins = 300; // começa com 3 caixas
  if (!Array.isArray(SET.inv)) SET.inv = [];
  if (!SET.equip || typeof SET.equip !== 'object') SET.equip = {};
  SET.equip.wpn = SET.equip.wpn || {}; SET.equip.veh = SET.equip.veh || {};
  if (SET.pxp == null) SET.pxp = 0; if (!Array.isArray(SET.pcl)) SET.pcl = [];
}
cosInit();
const owns = id => SET.inv.includes(id);

// ---------- estampas (shader) ----------
const SKIN_GLSL = `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uPat;
vec3 skinPat(vec3 p) {
  if (uPat < 0.5) { float n = vn(p.xy * 2.1) * 0.6 + vn(p.yz * 2.7 + 3.1) * 0.4; return n < 0.42 ? uA : n < 0.62 ? uB : uC; }
  if (uPat < 1.5) { vec3 q = floor(p * 5.0); float n = h21(q.xy + q.z * 1.7); return n < 0.45 ? uA : n < 0.8 ? uB : uC; }
  if (uPat < 2.5) { float s = fract((p.x + p.y * 0.6 + p.z * 0.3) * 1.6); return s < 0.55 ? uA : s < 0.86 ? uB : uC; }
  if (uPat < 3.5) { float s = fract(p.y * 1.2 + p.z); return s < 0.9 ? mix(uA, uB, vn(p.xz * 1.5) * 0.4) : uC; }
  if (uPat < 4.5) { float n = vn(p.xy * 1.4 + p.z); return mix(uA, uB, smoothstep(0.3, 0.8, n)) * 1.08; }
  if (uPat < 5.5) { float s = sin((p.x + vn(p.yz * 1.7) * 1.4) * 5.0); return s > 0.35 ? uB : s > 0.2 ? uC : uA; }
  if (uPat < 6.5) { vec2 g = floor(p.xy * 9.0); float c = mod(g.x + g.y, 2.0); return mix(uA, uB, c * 0.6) + uC * step(0.97, fract(p.y * 0.6)) * 0.4; }
  vec3 col = uA * (0.9 + vn(p.xy * 1.2) * 0.2); // fibra preta
  float a = fract((p.x * 0.7 + p.y * 0.45 + p.z * 0.3) * 0.55), b = fract((p.x * -0.5 + p.y * 0.8 + p.z * 0.2) * 0.42);
  float wa = fwidth(a) * 1.2, wb = fwidth(b) * 1.2; // de longe as linhas viram uma média suave (sem pontinhos)
  float ka = clamp(1.0 - wa * 12.0, 0.0, 1.0), kb = clamp(1.0 - wb * 12.0, 0.0, 1.0);
  float ga = smoothstep(0.94 - wa, 0.94 + wa, a), gb = smoothstep(0.965 - wb, 0.965 + wb, b);
  float ra = 1.0 - smoothstep(0.035 - wa, 0.035 + wa, abs(a - 0.5)), rb = 1.0 - smoothstep(0.02 - wb, 0.02 + wb, abs(b - 0.25));
  col = mix(col, uC, clamp(mix(0.04, ga, ka) * 0.95 + mix(0.02, gb, kb) * 0.9, 0.0, 1.0)); // filetes dourados
  col = mix(col, uB, clamp(mix(0.03, ra, ka) + mix(0.015, rb, kb), 0.0, 1.0) * 0.85); // faixas vermelhas
  // coroa: 3 pontas sobre uma base, repetida espaçada
  vec2 c = fract(vec2(p.x + p.z * 0.7, p.y) * 0.22) - 0.5; c *= 3.2;
  float crown = step(abs(c.x), 0.55) * step(-0.38, c.y) * step(c.y, -0.18);
  crown = max(crown, step(abs(c.x), 0.55) * step(-0.18, c.y) * step(c.y, 0.32 - min(min(abs(c.x + 0.42), abs(c.x)), abs(c.x - 0.42)) * 1.5));
  return mix(col, uC * 1.15, crown);
}
float skinGlow(vec3 p) { // linhas que brilham (só no tema imperial)
  if (uPat < 6.5) return 0.0;
  float a = fract((p.x * 0.7 + p.y * 0.45 + p.z * 0.3) * 0.55), b = fract((p.x * -0.5 + p.y * 0.8 + p.z * 0.2) * 0.42);
  float wa = fwidth(a) * 1.2, wb = fwidth(b) * 1.2, ka = clamp(1.0 - wa * 12.0, 0.0, 1.0), kb = clamp(1.0 - wb * 12.0, 0.0, 1.0);
  return clamp((1.0 - smoothstep(0.035 - wa, 0.035 + wa, abs(a - 0.5))) * ka + (1.0 - smoothstep(0.02 - wb, 0.02 + wb, abs(b - 0.25))) * kb, 0.0, 1.0); // de longe, sem brilho
}`;
const _skinMats = {};
// material de skin para armas, capacete e mochila (estampa no espaço do objeto)
function skinMat(th, vc, scale) {
  const key = th + (vc ? 'v' : 'n') + (scale || 1); if (_skinMats[key]) return _skinMats[key];
  const t = TH[th], metal = t.pat === 'metal';
  const m = new T.MeshPhongMaterial({ color: 0x9a9a9a, vertexColors: !!vc, shininess: metal ? 110 : 38, specular: metal ? 0x9a8a60 : 0x2a2a2a });
  const U = { uA: { value: new T.Color(t.c[0]) }, uB: { value: new T.Color(t.c[1]) }, uC: { value: new T.Color(t.c[2]) }, uPat: { value: PATN[t.pat] } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOp;').replace('#include <begin_vertex>', `#include <begin_vertex>\nvOp = position * ${(12 * (scale || 1)).toFixed(1)};`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOp;\n' + GLSL_NOISE + SKIN_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = skinPat(vOp) * (0.55 + l * 1.1); }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uB * skinGlow(vOp) * 0.55;');
  };
  m.customProgramCacheKey = () => 'skin' + (vc ? 'v' : 'n');
  return _skinMats[key] = m;
}
// roupa: tinge o tecido da textura do personagem (mantém tons de pele)
function outfitPatch(mt, th, keepSkin) {
  const t = TH[th];
  mt.userData.cos = th;
  const U = { uA: { value: new T.Color(t.c[0]) }, uB: { value: new T.Color(t.c[1]) }, uC: { value: new T.Color(t.c[2]) }, uPat: { value: PATN[t.pat] }, uKeep: { value: keepSkin ? 1 : 0 } };
  mt.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uKeep;\n' + GLSL_NOISE + SKIN_GLSL)
      .replace('#include <map_fragment>', `#include <map_fragment>
  #ifdef USE_UV
  { vec3 tc = diffuseColor.rgb; float l = dot(tc, vec3(0.3, 0.59, 0.11));
    float gr = tc.g / max(tc.r, 1e-3), br = tc.b / max(tc.r, 1e-3); // pele: verde ~40-85% do vermelho, azul ~22-80% (roupa vermelha fica de fora)
    float skinK = uKeep * smoothstep(0.36, 0.46, gr) * (1.0 - smoothstep(0.84, 0.94, gr)) * smoothstep(0.2, 0.3, br) * (1.0 - smoothstep(0.78, 0.88, br)) * step(tc.b, tc.g) * step(0.05, tc.r);
    diffuseColor.rgb = mix(skinPat(vec3(vUv * 14.0, 0.0)) * (0.32 + l * 1.5), tc, skinK); }
  #endif`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  #ifdef USE_UV
  totalEmissiveRadiance += uB * skinGlow(vec3(vUv * 14.0, 0.0)) * 0.45;
  #endif`);
  };
  mt.customProgramCacheKey = () => 'outfit' + (keepSkin ? 'k' : 'n'); mt.needsUpdate = true;
}

// ---------- quem usa o quê ----------
// jogador: o que está equipado; bots: às vezes algo aleatório (o mundo fica com cara de jogo cheio de skins)
const OUTS = COSL.filter(o => o.cat === 'out' && !o.pass), CHUTES = COSL.filter(o => o.cat === 'chute'), HELMS = COSL.filter(o => o.cat === 'helm'), BAGS = COSL.filter(o => o.cat === 'bag');
function cosOf(a) {
  if (a === G.player || a.cosMe) return SET.equip;
  if (!a.cosR) { const r = Math.random; a.cosR = { out: r() < 0.3 ? pick(OUTS).id : null, chute: r() < 0.4 ? pick(CHUTES).id : null, helm: r() < 0.25 ? pick(HELMS).id : null, bag: r() < 0.25 ? pick(BAGS).id : null, wpn: {} }; }
  return a.cosR;
}
function applyOutfit(a) {
  const m = a.model; if (!m || !m.human) return;
  const e = cosOf(a), out = e.out && COS[e.out], helm = e.helm && COS[e.helm];
  for (const mt of m.mats) {
    const n = mt.name.toLowerCase();
    if (/_body/.test(n)) { if (out && mt.userData.cos !== out.th) outfitPatch(mt, out.th, true); }
    else if (/helmet/.test(n)) { if (helm && mt.userData.cos !== helm.th) outfitPatch(mt, helm.th, false); }
  }
}
const _bmC = buildModel; buildModel = function (a) { const r = _bmC(a); applyOutfit(a); return r; };
const _ugC = updateHumanGear; updateHumanGear = function (a) {
  _ugC(a); const m = a.model; if (!m || !m.human) return; const e = cosOf(a);
  if (m.gear.helm && e.helm && COS[e.helm]) m.gear.helm.material = skinMat(COS[e.helm].th, true, 2);
  if (m.gear.bag && e.bag && COS[e.bag]) m.gear.bag.material = skinMat(COS[e.bag].th, true, 1.4);
};
// armas: skin na arma do personagem e na arma em 1ª pessoa
function skinGun(mesh, k, a) {
  const e = a ? cosOf(a) : SET.equip, sid = e.wpn && e.wpn[k], s = sid && COS[sid];
  mesh.traverse(o => {
    if (!o.isMesh) return;
    if (o.userData.orig === undefined) o.userData.orig = o.material;
    o.material = s ? skinMat(s.th, !!o.geometry.attributes.color, 1) : o.userData.orig;
  });
}
const _rgC = refreshGun; refreshGun = function (a) { _rgC(a); const w = curW(a); if (w && a.model) skinGun(a.model.gun, w.k, a); };
const _dgC = dressGun; dressGun = function (mesh, w) { const r = _dgC(mesh, w); if (mesh === vmGun && w) skinGun(mesh, w.k, G.player); return r; };
// paraquedas
const _chuteGeo = {};
function chuteGeoFor(a) {
  const e = cosOf(a), s = e.chute && COS[e.chute]; if (!s) return CHUTE_GEO;
  if (_chuteGeo[s.id]) return _chuteGeo[s.id];
  const p = [], N = 9, W = 7.2;
  for (let i = 0; i < N; i++) { const t = (i + 0.5) / N - 0.5, an = t * 1.15, x = Math.sin(an) * W * 0.62, y = Math.cos(an) * 1.4 + 1.0; p.push({ g: GEO.box, x, y, z: 0, sx: W / N * 1.04, sy: 0.32, sz: 2.8, rz: -an, c: s.cols[i] }, { g: GEO.box, x, y: y - 0.2, z: -1.35, sx: W / N, sy: 0.12, sz: 0.12, rz: -an, c: '#1d1d1d' }); }
  for (const sx of [-1, 1]) for (const z of [-1.0, 0.0, 1.0]) for (const k of [0.25, 0.5]) { const an = sx * k * 1.15, x = Math.sin(an) * W * 0.62, y = Math.cos(an) * 1.4 + 0.85, dy = y + 3, len = Math.hypot(x, dy, z); p.push({ g: GEO.cyl6, x: x / 2, y: (y - 3) / 2, z: z / 2, sx: 0.025, sy: len, sz: 0.025, rz: -Math.atan2(x, dy), rx: Math.atan2(z, dy), c: '#dddddd' }); }
  return _chuteGeo[s.id] = mergeParts(p);
}
// veículos: ao assumir o volante, o carro ganha a sua pintura
const _evC = enterVeh; enterVeh = function (a, v, seat) {
  const ok = _evC(a, v, seat);
  if (ok && a === G.player && v.seats[0] === a) { const sid = SET.equip.veh[v.k], s = sid && COS[sid]; if (s && v.skin !== sid && !v.dead) { v.mesh.geometry.dispose(); v.mesh.geometry = vehGeo(v.k, s.col); if (s.th) v.mesh.material = skinMat(s.th, true, 0.07); v.skin = sid; } }
  return ok;
};

// ---------- recompensas: fichas e XP do passe ao fim de cada partida ----------
const PASS_N = 30, PASS_XP = 300;
const passLv = () => Math.min(PASS_N, Math.floor(SET.pxp / PASS_XP));
function passReward(l) { // l = 1..30
  if (l === PASS_N) return { out: 'out:pass', t: 'Traje Coroa Imperial' };
  if (l === 10) return { out: 'helm:imperial', t: 'Capacete Coroa Imperial' };
  if (l === 20) return { out: 'w:M416:imperial', t: 'M416 Coroa Imperial' };
  if (l === 25) return { out: 'veh:imperial', t: 'Sedã Coroa Imperial' };
  if (l % 5 === 0) return { box: 1, t: 'Caixa NK' };
  if (l === 12 || l === 24) return { item: 'e', t: 'Item épico' };
  return { coins: 40 + l * 4, t: (40 + l * 4) + ' fichas' };
}
const _efC = endForPlayer; endForPlayer = function (win) {
  if (G.result) return _efC(win);
  _efC(win); const r = G.result; if (!r || r.cosDone) return; r.cosDone = true;
  const place = r.place || G.nTeams || 50;
  r.coinsGain = 20 + r.kills * 6 + (place <= 10 ? 15 : 0) + (win ? 60 : 0);
  r.pxpGain = 100 + r.kills * 30 + (place <= 10 ? 50 : 0) + (win ? 150 : 0);
  const before = passLv(); SET.coins += r.coinsGain; SET.pxp += r.pxpGain; r.passUp = passLv() > before; saveSet();
};

// ---------- caixa ----------
const BOX_COST = 100;
function rollItem(rarFilter) {
  const pool = COSL.filter(o => !o.pass && (!rarFilter || o.rar === rarFilter));
  let rar = rarFilter;
  if (!rar) { let t = Math.random() * 100; for (const k of ['c', 'r', 'e', 'l']) { t -= RAR[k].w; if (t <= 0) { rar = k; break; } } rar = rar || 'c'; }
  const cand = pool.filter(o => o.rar === rar), notOwned = cand.filter(o => !owns(o.id));
  return pick(notOwned.length && Math.random() < 0.75 ? notOwned : cand);
}
function grant(o) { if (owns(o.id)) { SET.coins += 40; saveSet(); return false; } SET.inv.push(o.id); saveSet(); return true; }
function cardHtml(o, extra) {
  const c = cosCols(o), r = RAR[o.rar];
  const sw = o.img ? `<div class="cos-sw" style="background:#000 url(assets/pass/${o.img}.jpg) center/cover"></div>` : `<div class="cos-sw" style="background:linear-gradient(135deg,${c[0]} 0 45%,${c[1]} 45% 75%,${c[2]} 75%)">${CAT[o.cat][0]}</div>`;
  return `<div class="cos-card" style="--rc:${r.c}">${sw}<b>${o.n}</b><small style="color:${r.c}">${r.n}</small>${extra || ''}</div>`;
}
// painel de caixas/passe/armário: ✕ fixo no canto (sempre visível, mesmo em tela baixa) + fechar tocando fora da caixa
function cosPanel(html) {
  const el = $('cosP'); el.classList.remove('hidden');
  el.innerHTML = `<button class="cos-x" aria-label="Fechar">✕</button><div class="box cosb">${html}</div>`;
  const close = () => { el.classList.add('hidden'); renderLobby(); };
  el.querySelectorAll('[data-x], .cos-x').forEach(x => x.onclick = close);
  el.onclick = e => { if (e.target === el) close(); };
  return el;
}
function openBox() {
  const odds = ['c', 'r', 'e', 'l'].map(k => `<span style="color:${RAR[k].c}">${RAR[k].n} ${RAR[k].w}%</span>`).join(' · ');
  const el = cosPanel(`<h3>🎁 Caixa NK</h3><div class="cos-coins">🪙 <b>${SET.coins}</b> fichas</div><div class="cos-reel"><div class="cos-strip" id="cStrip"></div><i class="cos-mark"></i></div>
    <div class="cos-odds">${odds}<br><small>Itens repetidos viram 40 fichas. Você ganha fichas jogando: abates, top 10 e vitória dão mais.</small></div>
    <div class="row"><button class="btn" id="cOpen" ${SET.coins < BOX_COST ? 'disabled' : ''}>ABRIR (${BOX_COST} 🪙)</button><button class="btn alt" data-x>FECHAR</button></div>`);
  $('cOpen').onclick = () => {
    if (SET.coins < BOX_COST) return; SET.coins -= BOX_COST; saveSet(); spinBox(rollItem(), () => openBox());
  };
}
// roleta: cartas passam e param no prêmio
function spinBox(prize, again) {
  const strip = $('cStrip'), N = 34, P = 28, cards = [];
  for (let i = 0; i < N; i++) cards.push(i === P ? prize : rollItem());
  strip.innerHTML = cards.map(o => cardHtml(o)).join(''); strip.style.transition = 'none'; strip.style.transform = 'translateX(0)';
  $('cOpen').disabled = true; sfx('pick');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const cw = strip.children[0].getBoundingClientRect().width + 8, off = P * cw - strip.parentElement.clientWidth / 2 + cw / 2 + (Math.random() - 0.5) * cw * 0.5;
    strip.style.transition = 'transform 3.2s cubic-bezier(.12,.75,.15,1)'; strip.style.transform = `translateX(${-off}px)`;
    let tick = 0; const iv = setInterval(() => { if (++tick > 16) clearInterval(iv); else sfx('pick'); }, 180);
    setTimeout(() => {
      const isNew = grant(prize); sfx(prize.rar === 'l' || prize.rar === 'e' ? 'win' : 'killhit');
      const el = cosPanel(`<h3>${isNew ? 'Você ganhou!' : 'Repetido: +40 fichas'}</h3><div class="cos-prize">${cardHtml(prize)}</div>
        <div class="row"><button class="btn" id="cEq">EQUIPAR</button><button class="btn alt" id="cAg">ABRIR OUTRA</button><button class="btn alt" data-x>FECHAR</button></div>`);
      $('cEq').onclick = () => { equip(prize); el.classList.add('hidden'); renderLobby(); };
      $('cAg').onclick = again;
    }, 3400);
  }));
}
function equip(o) {
  if (o.cat === 'wpn') SET.equip.wpn[o.wk] = SET.equip.wpn[o.wk] === o.id ? null : o.id;
  else if (o.cat === 'veh') SET.equip.veh[o.vk] = SET.equip.veh[o.vk] === o.id ? null : o.id;
  else SET.equip[o.cat] = SET.equip[o.cat] === o.id ? null : o.id;
  saveSet(); if (G.phase !== 'match') lobbyActors();
}
const isEq = o => o.cat === 'wpn' ? SET.equip.wpn[o.wk] === o.id : o.cat === 'veh' ? SET.equip.veh[o.vk] === o.id : SET.equip[o.cat] === o.id;

// ---------- Passe de Elite ----------
function openPass() {
  const lv = passLv(), into = SET.pxp - lv * PASS_XP;
  const cards = Array.from({ length: PASS_N }, (_, i) => {
    const l = i + 1, rw = passReward(l), got = SET.pcl.includes(l), can = l <= lv && !got;
    const icon = rw.out ? `<img src="assets/pass/${COS[rw.out].img}.jpg" alt="">` : rw.box ? '🎁' : rw.item ? '✨' : '🪙';
    return `<div class="ps-c ${l <= lv ? 'on' : ''} ${rw.out ? 'big' : ''}"><small>NÍVEL ${l}</small><div class="ps-i">${icon}</div><b>${rw.t}</b>${got ? '<em>✔ pego</em>' : can ? `<button class="btn" data-cl="${l}">PEGAR</button>` : `<em>🔒</em>`}</div>`;
  }).join('');
  const el = cosPanel(`<div class="ps-ban" style="background-image:url(assets/pass/banner.jpg)"><div><b>PASSE DE ELITE · TEMPORADA 1</b><span>Coroa Imperial</span><small class="free">GRÁTIS</small></div></div>
    <div class="ps-top">Nível <b>${lv}</b>/${PASS_N} <div class="ps-bar"><i style="width:${lv >= PASS_N ? 100 : Math.round(into / PASS_XP * 100)}%"></i></div><small>${lv >= PASS_N ? 'completo!' : into + ' / ' + PASS_XP + ' XP'} · cada partida dá XP (abates, top 10 e vitória dão mais)</small></div>
    <div class="ps-row">${cards}</div>
    <div class="ps-ex">${['out:pass', 'w:M416:imperial', 'veh:imperial', 'helm:imperial'].map(id => `<div class="ps-ii"><img src="assets/pass/${COS[id].img}.jpg" alt=""><b>${COS[id].n}</b><small>nível ${{ 'out:pass': 30, 'w:M416:imperial': 20, 'veh:imperial': 25, 'helm:imperial': 10 }[id]}${owns(id) ? ' · ✔ seu' : ''}</small></div>`).join('')}</div>
    <div class="row"><button class="btn alt" data-x>FECHAR</button></div>`);
  el.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => {
    const l = +b.dataset.cl, rw = passReward(l); if (SET.pcl.includes(l) || l > passLv()) return; SET.pcl.push(l);
    if (rw.coins) SET.coins += rw.coins; if (rw.box) SET.coins += BOX_COST; if (rw.out) { if (!owns(rw.out)) SET.inv.push(rw.out); equip(COS[rw.out]); }
    if (rw.item) grant(rollItem(rw.item));
    saveSet(); sfx('win'); toast(rw.out ? COS[rw.out].n + ' desbloqueado e equipado!' : rw.box ? 'Caixa grátis: +100 fichas para abrir' : 'Recompensa recebida!', 2); openPass();
  });
  const row = el.querySelector('.ps-row'); if (row) row.scrollLeft = Math.max(0, (lv - 2) * 96);
}

// ---------- Armário ----------
function openLocker(cat, wk) {
  cat = cat || 'out';
  const tabs = Object.keys(CAT).map(k => `<button data-t="${k}" class="${k === cat ? 'on' : ''}">${CAT[k][0]} ${CAT[k][1]}</button>`).join('');
  let list = COSL.filter(o => o.cat === cat && owns(o.id)), sub = '';
  if (cat === 'wpn') {
    const ws = Object.keys(WEAP).filter(k => COSL.some(o => o.wk === k && owns(o.id)));
    wk = wk && ws.includes(wk) ? wk : ws[0];
    sub = ws.length ? `<div class="seg sm lk-w">${ws.map(k => `<button data-w="${k}" class="${k === wk ? 'on' : ''}">${WEAP[k].n}</button>`).join('')}</div>` : '';
    list = list.filter(o => o.wk === wk);
  }
  const total = COSL.filter(o => o.cat === cat).length, have = COSL.filter(o => o.cat === cat && owns(o.id)).length;
  const el = cosPanel(`<h3>🎒 Armário <small>${have}/${total} ${CAT[cat][1].toLowerCase()}</small></h3><div class="seg sm lk-t">${tabs}</div>${sub}
    <div class="lk-g">${list.length ? list.map(o => `<div class="lk-i ${isEq(o) ? 'eq' : ''}" data-id="${o.id}">${cardHtml(o, isEq(o) ? '<em>EQUIPADO</em>' : '<em class="u">usar</em>')}</div>`).join('') : '<div class="lk-empty">Nenhum item ainda. Abra caixas ou suba o Passe de Elite!</div>'}</div>
    <div class="row"><button class="btn" id="lkBox">🎁 ABRIR CAIXAS</button><button class="btn alt" data-x>FECHAR</button></div>`);
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => openLocker(b.dataset.t));
  el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => openLocker('wpn', b.dataset.w));
  el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { equip(COS[b.dataset.id]); openLocker(cat, wk); });
  $('lkBox').onclick = openBox;
}
// na partida, o modelo do jogador é montado antes de G.player existir: reaplica o visual dele no começo
const _smCos = startMatch; startMatch = function () { const r = _smCos.apply(this, arguments); const p = G.player; if (p) { p.cosMe = true; applyOutfit(p); updateHumanGear(p); refreshGun(p); } return r; };
