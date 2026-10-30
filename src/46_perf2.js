// ================= desempenho na superfície: juntar peças paradas e desenhar menos o que não dá para ver =================
// medido no celular: marina 41 FPS (496 desenhos), Mundial 33 FPS (632 desenhos, 1,6 milhão de triângulos).

// junta as malhas paradas de 'root' em uma por material (as de 'keep' e as escondidas ficam como estão)
function mergeStatic(root, keep = new Set(), sig = m => m.uuid) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m4 = new THREE.Matrix4(), by = new Map(), drop = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o === root || !o.visible || !o.geometry || o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) return;
    for (let p = o; p && p !== root; p = p.parent) if (keep.has(p) || !p.visible) return;
    const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    const names = ['position', 'normal', 'uv', 'color'].filter(n => geo.attributes[n]), key = sig(o.material) + '|' + names.join(',');
    if (!by.has(key)) by.set(key, { mat: o.material, names, list: [] }); by.get(key).list.push(geo); drop.push(o);
  });
  if (drop.length < 4) return 0; // não compensa
  drop.forEach(o => o.parent.remove(o));
  for (const { mat, names, list } of by.values()) {
    const g = new THREE.BufferGeometry();
    for (const n of names) {
      const sz = list[0].attributes[n].itemSize; let len = 0; list.forEach(x => len += x.attributes[n].count * sz);
      const arr = new Float32Array(len); let off = 0; list.forEach(x => { arr.set(x.attributes[n].array, off); off += x.attributes[n].count * sz; });
      g.setAttribute(n, new THREE.BufferAttribute(arr, sz));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    g.computeBoundingSphere(); root.add(new THREE.Mesh(g, mat));
  }
  return drop.length;
}
// lancha (a sua e a dos amigos): tudo menos o piloto vira poucas peças
const mergeBoat = g => { if (g && !g.userData.merged) { mergeStatic(g, new Set(g.userData.pilot || [])); g.userData.merged = true; } return g; };

// marina: píer, estacas, tábuas, quiosques e placas viram poucas peças; os barcos de pesca, uma peça cada (continuam balançando)
function mergeMarina() {
  const used = new Set([water, sky, ...MAR.boats.map(b => b.m), ...MAR.people.map(p => p.m)]);
  const box = new THREE.Group(); scene.add(box);
  for (const o of [...scene.children]) {
    if (o === box || used.has(o) || o.isInstancedMesh || o.isLight || o.isPoints || o.isLine || o.isSprite) continue;
    if (o.isMesh && o.material === TERR.mat) continue;
    if (Object.keys(o.userData || {}).length) continue; // animado (tartaruga, bandeira, etc.)
    if (!o.isMesh && o.type !== 'Group') continue;
    if ((o.position.x - PIER.x) ** 2 + (o.position.z - (PIER.z0 + PIER.z1) / 2) ** 2 > 160 * 160) continue;
    box.attach(o);
  }
  const n = mergeStatic(box); MAR.boats.forEach(b => mergeStatic(b.m));
  return n;
}

// mergulhador-bot longe: uma silhueta de 1 peça no lugar das ~85 do corpo inteiro
const BOT_FAR = { geo: null };
function botLod(b) {
  const r = b.rig; if (!r.far) {
    if (!BOT_FAR.geo) BOT_FAR.geo = new THREE.CapsuleGeometry(0.17, 1.35, 3, 6).translate(0, -0.15, 0);
    r.far = new THREE.Mesh(BOT_FAR.geo, r.suitMat); r.root.add(r.far); r.parts = r.root.children.filter(c => c !== r.far);
  }
  const d = camera.position.distanceTo(b.pos), near = d < 32;
  r.root.visible = d < 110; if (!r.root.visible) return;
  if (r.lodNear !== near) { r.lodNear = near; r.parts.forEach(c => c.visible = near); r.far.visible = !near; }
}

// assinatura de material: mesmos parâmetros = mesma peça (a frota do Mundial inteira vira ~30 desenhos)
const matSig = m => [m.type, m.color && m.color.getHexString(), m.emissive && m.emissive.getHexString(), m.map ? m.map.uuid : '', m.transparent ? m.opacity : 1, m.side, m.vertexColors ? 1 : 0, (m.roughness || 0).toFixed(2), (m.metalness || 0).toFixed(2), m.customProgramCacheKey ? m.customProgramCacheKey() : ''].join('/');
