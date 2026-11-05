// ================= natureza de verdade (Quaternius Ultimate Nature Pack, CC0): árvores e arbustos perto, pedras em toda a ilha; céu realista =================
const NATR = { ready: false, types: {}, near: new Set(), cx: 1e9, cz: 1e9 };
const TREE_ROUND = ['CommonTree_3', 'CommonTree_4', 'BirchTree_2'], TREE_PINE = ['PineTree_2', 'PineTree_4'], TREE_PALM = ['PalmTree_2'];
const BUSHES = ['Bush_1', 'Bush_2'], ROCKS = ['Rock_1', 'Rock_2', 'Rock_3', 'Rock_4', 'Rock_5', 'Rock_Moss_1', 'Rock_Moss_2'];
const NEAR_R = 115;
const ZERO_M = new T.Matrix4().makeScale(0, 0, 0);
// folhas balançando de leve (a base fica parada)
const NAT_WIND = { value: 0 };
function natMat() {
  const m = new T.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = NAT_WIND;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float ph = instanceMatrix[3][0] * 0.13 + instanceMatrix[3][2] * 0.07;
      float hh = max(position.y - 0.3, 0.0);
      transformed.x += sin(uT * 1.3 + ph) * 0.025 * hh * hh; transformed.z += cos(uT * 1.1 + ph) * 0.02 * hh * hh;
      #endif`);
  };
  m.customProgramCacheKey = () => 'natwind';
  return m;
}
// junta as peças do modelo numa geometria só com a cor de cada material, altura 1 e base no chão
function natGeo(scn) {
  scn.updateMatrixWorld(true); const parts = [];
  scn.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); parts.push({ g, c: (Array.isArray(o.material) ? o.material[0] : o.material).color.clone() }); });
  const box = new T.Box3(); for (const p of parts) { p.g.computeBoundingBox(); box.union(p.g.boundingBox); }
  const c = box.getCenter(new T.Vector3()), h = box.max.y - box.min.y;
  const geo = mergeParts(parts.map(p => ({ g: p.g, c: p.c })));
  geo.translate(-c.x, -box.min.y, -c.z); geo.scale(1 / h, 1 / h, 1 / h); geo.computeBoundingSphere();
  return geo;
}
// árvores realistas FoliMesh (bétula, carvalho, abeto): 2 níveis de detalhe (perto ~3,5 mil triângulos, longe ~1 mil), texturas de casca e folha
const FM = { ready: false, sp: {} }, FM_N = ['birch', 'oak', 'spruce'], FM_CAP = { 2: 160, 3: 600 };
function fmMat(src, leaves) {
  const m = new T.MeshLambertMaterial({ map: src.map, color: 0xffffff, alphaTest: leaves ? 0.5 : 0, side: leaves ? T.DoubleSide : T.FrontSide });
  if (leaves) { m.onBeforeCompile = sh => { sh.uniforms.uT = NAT_WIND; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float ph = instanceMatrix[3][0] * 0.13 + instanceMatrix[3][2] * 0.07; float hh = max(position.y * 0.08, 0.0);
      transformed.x += sin(uT * 1.4 + ph + position.y * 0.3) * 0.06 * hh; transformed.z += cos(uT * 1.1 + ph) * 0.05 * hh;
      #endif`); }; m.customProgramCacheKey = () => 'fmleaf'; }
  return m;
}
function loadFoliMesh(L, done) {
  let left = FM_N.length;
  for (const n of FM_N) L.load(`assets/nature/fm_${n}.glb`, g => {
    const box = new T.Box3().setFromObject(g.scene), sp = { h: box.max.y - box.min.y, lv: { 2: [], 3: [] } };
    g.scene.traverse(o => { if (!o.isMesh) return; const mm = o.name.match(/^L([23])_(\w+)/); if (!mm) return; const leaves = mm[2] === 'leaves';
      const im = new T.InstancedMesh(o.geometry, fmMat(o.material, leaves), FM_CAP[mm[1]]); im.count = 0; im.frustumCulled = false; im.castShadow = mm[1] === '2'; im.receiveShadow = true; scene.add(im); sp.lv[mm[1]].push(im); });
    FM.sp[n] = sp; if (--left === 0) { FM.ready = true; NATR.cx = 1e9; done && done(); } // força redesenhar as árvores perto
  }, undefined, () => { if (--left === 0) { FM.ready = Object.keys(FM.sp).length > 0; done && done(); } });
}
// pedra escaneada do Poly Haven (CC0), versão leve: ~1.300 triângulos e textura de 512 px
function loadBoulder(L, done) {
  L.load('assets/nature/ph_boulder.glb', g => { let mesh = null; g.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    if (mesh) { const geo = mesh.geometry.clone(); mesh.updateWorldMatrix(true, false); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox(); const b = geo.boundingBox, c = b.getCenter(new T.Vector3()), h = b.max.y - b.min.y;
      geo.translate(-c.x, -b.min.y, -c.z); geo.scale(1 / h, 1 / h, 1 / h); geo.computeBoundingSphere();
      NATR.boulder = { geo, mat: new T.MeshLambertMaterial({ map: mesh.material.map, color: 0xffffff }) }; }
    done(); }, undefined, () => done());
}
function loadNature(L, done) {
  loadFoliMesh(L);
  const all = [...TREE_ROUND, ...TREE_PINE, ...TREE_PALM, ...BUSHES, ...ROCKS]; let left = all.length + 1;
  loadBoulder(L, () => { if (--left === 0) setupNature(done); });
  for (const k of all) L.load(`assets/nature/${k}.glb`, g => { NATR.types[k] = natGeo(g.scene); if (--left === 0) setupNature(done); }, undefined, () => { if (--left === 0) setupNature(done); });
}
const _nd = new T.Object3D();
function setupNature(done) {
  const mat = natMat(), mk = (k, n) => { if (!NATR.types[k]) return null; const m = new T.InstancedMesh(NATR.types[k], mat, n); m.count = 0; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m; };
  NATR.inst = {}; for (const k of [...TREE_ROUND, ...TREE_PINE, ...TREE_PALM, ...BUSHES]) NATR.inst[k] = mk(k, 420);
  // guarda as matrizes originais das árvores simples (para esconder/mostrar)
  NATR.orig = {}; for (const n of ['trunk', 'crown', 'crown2', 'bush']) NATR.orig[n] = NAT[n].instanceMatrix.array.slice();
  // pedras: troca todas de uma vez (são leves)
  const rk = NAT.rk || [], groups = {};
  rk.forEach((r, i) => { const k = NATR.boulder && (i * 13 + 5) % 10 < 4 ? 'BOULDER' : ROCKS[(i * 7 + 3) % ROCKS.length]; (groups[k] = groups[k] || []).push(r); }); // ~40% viram a pedra escaneada
  for (const k in groups) {
    const bo = k === 'BOULDER'; if (!bo && !NATR.types[k]) continue; const m = new T.InstancedMesh(bo ? NATR.boulder.geo : NATR.types[k], bo ? NATR.boulder.mat : new T.MeshLambertMaterial({ vertexColors: true }), groups[k].length);
    groups[k].forEach(([x, h, z, s], i) => { _nd.position.set(x, h - (bo ? 0.35 : 0.25) * s, z); _nd.rotation.set(0, (x * 3.1 + z) % 6.28, 0); if (bo) _nd.scale.set(2.2 * s, 2.0 * s, 2.2 * s); else _nd.scale.set(2.6 * s, 2.1 * s, 2.4 * s); _nd.updateMatrix(); m.setMatrixAt(i, _nd.matrix); });
    m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  if (Object.keys(groups).length && NATR.types[ROCKS[0]]) NAT.rock.visible = false;
  NATR.ready = true; NATR.cx = 1e9; if (done) done();
}
const hsh = (x, z) => { const s = Math.sin(x * 12.99 + z * 78.23) * 43758.5; return s - Math.floor(s); };
// perto da câmera: árvores e arbustos de verdade; longe: os simples (leves)
function refreshNature(cx, cz) {
  if (!NATR.ready) return;
  NATR.cx = cx; NATR.cz = cz;
  const tm = NAT.trunk.instanceMatrix, cm = NAT.crown.instanceMatrix, c2 = NAT.crown2.instanceMatrix, bm = NAT.bush.instanceMatrix;
  // devolve só as árvores que estavam escondidas da última vez (antes copiava tudo: travava no celular)
  const H = NATR.hid || (NATR.hid = { t: [], c: [], c2: [], b: [] });
  const back = (arr, orig, list) => { for (const i of list) for (let k = 0; k < 16; k++) arr[i * 16 + k] = orig[i * 16 + k]; list.length = 0; };
  const span = l => l.length ? [Math.min(...l), Math.max(...l)] : null, old = { t: span(H.t), c: span(H.c), c2: span(H.c2), b: span(H.b) };
  back(tm.array, NATR.orig.trunk, H.t); back(cm.array, NATR.orig.crown, H.c); back(c2.array, NATR.orig.crown2, H.c2); back(bm.array, NATR.orig.bush, H.b);
  for (const k in NATR.inst) if (NATR.inst[k]) NATR.inst[k].count = 0;
  const useFM = FM.ready && SET.quality >= 1; if (FM.ready) for (const n in FM.sp) for (const l of [2, 3]) for (const im of FM.sp[n].lv[l]) im.count = 0;
  const putFM = (n, x, y, z, hgt, rot) => { const sp = FM.sp[n]; if (!sp) return false; const l = (x - cx) ** 2 + (z - cz) ** 2 < 42 * 42 ? 2 : 3, ims = sp.lv[l]; if (!ims.length || ims[0].count >= FM_CAP[l]) return false; _nd.position.set(x, y, z); _nd.rotation.set(0, rot, 0); _nd.scale.setScalar(hgt / sp.h); _nd.updateMatrix(); for (const im of ims) im.setMatrixAt(im.count++, _nd.matrix); return true; };
  const put = (k, x, y, z, h, rot) => { const m = NATR.inst[k]; if (!m || m.count >= 420) return false; _nd.position.set(x, y, z); _nd.rotation.set(0, rot, 0); _nd.scale.setScalar(h); _nd.updateMatrix(); m.setMatrixAt(m.count++, _nd.matrix); return true; };
  const R = [55, 95, 130][SET.quality] || 95, R2 = R * R;
  for (const t of TREES) {
    const [x, z, h, s, round, ti, idx] = t; if ((x - cx) ** 2 + (z - cz) ** 2 > R2) continue;
    const r = hsh(x, z), beach = h < 6 && Math.hypot(x, z) > 520 * MK || MAPID === 'bal' && r > 0.62; // no Balneário, coqueiros por toda parte
    const k = beach ? TREE_PALM[0] : round ? TREE_ROUND[Math.floor(r * TREE_ROUND.length)] : MAPID === 'bal' ? TREE_PALM[0] : TREE_PINE[Math.floor(r * TREE_PINE.length)];
    const hgt = (round ? 6.6 : 8.2) * s * (0.9 + r * 0.25), fmN = useFM && !beach && k !== TREE_PALM[0] ? (round ? (r < 0.5 ? 'birch' : 'oak') : 'spruce') : null;
    if (!(fmN && putFM(fmN, x, h - 0.08, z, hgt * (round ? 1.35 : 1.25), r * 6.28)) && !put(k, x, h - 0.05, z, hgt, r * 6.28)) continue; // realistas são um pouco maiores (árvore adulta)
    ZERO_M.toArray(tm.array, ti * 16); H.t.push(ti); for (const j of idx) { ZERO_M.toArray(round ? c2.array : cm.array, j * 16); (round ? H.c2 : H.c).push(j); }
  }
  (NAT.bu || []).forEach(([x, h, z, s], i) => { if ((x - cx) ** 2 + (z - cz) ** 2 > R2) return; const r = hsh(x, z); if (put(BUSHES[Math.floor(r * BUSHES.length)], x, h - 0.05, z, 1.5 * s, r * 6.28)) { ZERO_M.toArray(bm.array, i * 16); H.b.push(i); } });
  // envia só o trecho alterado (antigo + novo) em vez do mapa inteiro
  const send = (attr, o, list) => { const n = span(list), lo = Math.min(o ? o[0] : 1e9, n ? n[0] : 1e9), hi = Math.max(o ? o[1] : -1, n ? n[1] : -1); if (hi < 0) return; attr.updateRange.offset = lo * 16; attr.updateRange.count = (hi - lo + 1) * 16; attr.needsUpdate = true; };
  send(tm, old.t, H.t); send(cm, old.c, H.c); send(c2, old.c2, H.c2); send(bm, old.b, H.b);
  for (const k in NATR.inst) if (NATR.inst[k]) NATR.inst[k].instanceMatrix.needsUpdate = true;
  if (FM.ready) for (const n in FM.sp) for (const l of [2, 3]) for (const im of FM.sp[n].lv[l]) im.instanceMatrix.needsUpdate = true;
}
// no alto (avião, queda, paraquedas) não precisa de árvore detalhada: mostra só as simples e para de recalcular
function natureStep(dt, fx, fz, high) {
  NAT_WIND.value += dt; if (!NATR.ready) return;
  if (high) { if (!NATR.off) { NATR.off = true; refreshNature(1e6, 1e6); } return; }
  if (NATR.off || Math.hypot(fx - NATR.cx, fz - NATR.cz) > 24) { NATR.off = false; refreshNature(fx, fz); } // refaz a cada 24 m (antes 14)
}

// ---------- céu realista (dispersão atmosférica) ----------
const SKY2 = (() => {
  if (!T.Sky) return null;
  const s = new T.Sky(); s.scale.setScalar(4000); const u = s.material.uniforms;
  u.turbidity.value = 6.5; u.rayleigh.value = 1.4; u.mieCoefficient.value = 0.006; u.mieDirectionalG.value = 0.82;
  u.sunPosition.value.copy(SUN_DIR); s.material.fog = false; s.renderOrder = -10; scene.add(s);
  SKY.material.visible = false; // o antigo some; o disco do sol continua como brilho
  return s;
})();
