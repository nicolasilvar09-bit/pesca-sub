// ================= objetos escaneados espalhados pelo mapa (Poly Haven, CC0): toco e tronco caído no mato, barril e caixa encostados nas casas =================
// as posições saem do próprio mapa (sempre iguais para todos os jogadores) e cada objeto tem colisão: dá para se esconder atrás e as balas param nele
const PROPS = { list: { stump: [], log: [], barrel: [], crate: [] }, inst: {}, ready: false, cx: 1e9, cz: 1e9 };
const phh = (x, z, k) => { const s = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return s - Math.floor(s); };
(function placeProps() {
  const P = PROPS.list, okGround = (x, z) => { const h = groundH(x, z); return h > 1.6 && !bldAt(x, z, 1.5) && roadDist(x, z) > 6 && Math.abs(x) < HALF - 20 && Math.abs(z) < HALF - 20 ? h : null; };
  // no mato: tocos e troncos perto das árvores
  for (const t of TREES) {
    const [x, z] = t, r = phh(x, z, 1);
    if (r < 0.05 && P.stump.length < 650) {
      const a = phh(x, z, 2) * 6.283, d = 2.4 + phh(x, z, 3) * 2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = okGround(px, pz); if (h == null) continue;
      const s = 0.75 + phh(x, z, 4) * 0.45; P.stump.push([px, h, pz, s, a]);
      addCollider(px - 0.42 * s, h - 0.3, pz - 0.42 * s, px + 0.42 * s, h + 0.5 * s, pz + 0.42 * s, 'rock');
    } else if (r > 0.965 && P.log.length < 380) {
      const a = phh(x, z, 5) * 6.283, d = 3 + phh(x, z, 6) * 2.5, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, h = okGround(px, pz); if (h == null) continue;
      const alongX = phh(x, z, 7) < 0.5, s = 1.25 + phh(x, z, 8) * 0.4, hl = 1.55 * s, hr = 0.2 * s;
      if (okGround(px + (alongX ? hl : 0), pz + (alongX ? 0 : hl)) == null || okGround(px - (alongX ? hl : 0), pz - (alongX ? 0 : hl)) == null) continue;
      P.log.push([px, h, pz, s, (alongX ? 0 : Math.PI / 2) + (phh(x, z, 9) - 0.5) * 0.12]);
      addCollider(px - (alongX ? hl : hr), h - 0.3, pz - (alongX ? hr : hl), px + (alongX ? hl : hr), h + hr * 2, pz + (alongX ? hr : hl), 'rock');
    }
  }
  // nas casas: grupinhos de barris e caixas encostados numa parede (longe das portas)
  for (const b of BLD) {
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2; if (phh(cx, cz, 11) > 0.42) continue;
    const side = Math.floor(phh(cx, cz, 12) * 4), t = 0.2 + phh(cx, cz, 13) * 0.6, n = 1 + Math.floor(phh(cx, cz, 14) * 3);
    const ux = side < 2 ? 1 : 0, uz = 1 - ux, out = 0.75;
    let x = side === 0 ? b.x0 + (b.x1 - b.x0) * t : side === 1 ? b.x0 + (b.x1 - b.x0) * t : side === 2 ? b.x0 - out : b.x1 + out;
    let z = side === 0 ? b.z0 - out : side === 1 ? b.z1 + out : b.z0 + (b.z1 - b.z0) * t;
    for (let i = 0; i < n; i++, x += ux * 0.95, z += uz * 0.95) {
      if ((b.doors || []).some(d => Math.hypot(d.ox - x, d.oz - z) < 2.6)) continue;
      const h = groundH(x, z); if (h < 1 || roadDist(x, z) < 5.2 || BLD.some(o => o !== b && x > o.x0 - 0.6 && x < o.x1 + 0.6 && z > o.z0 - 0.6 && z < o.z1 + 0.6)) continue;
      const crate = phh(x, z, 15) < 0.5, rot = phh(x, z, 16) * 6.283;
      if (crate) {
        const stack = phh(x, z, 17) < 0.3 ? 2 : 1; for (let k = 0; k < stack; k++) P.crate.push([x, h + k * 0.62, z, 1, k ? rot + 0.4 : rot]);
        addCollider(x - 0.42, h - 0.2, z - 0.42, x + 0.42, h + 0.62 * stack, z + 0.42, 'w');
      } else { P.barrel.push([x, h, z, 1, rot]); addCollider(x - 0.32, h - 0.2, z - 0.32, x + 0.32, h + 0.92, z + 0.32, 'w'); }
    }
  }
})();
// carrega os modelos e deixa cada um com a base no chão e o tamanho certo (em metros)
function loadProps() {
  const L = new T.GLTFLoader(), H = { stump: 0.55, log: 0.4, barrel: 0.9, crate: 0.62 }, CAP = { stump: 160, log: 110, barrel: 160, crate: 200 };
  let left = 4;
  for (const k of ['stump', 'log', 'barrel', 'crate']) L.load(`assets/nature/ph_${k}.glb`, g => {
    let mesh = null; g.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    if (mesh) {
      const geo = mesh.geometry.clone(); mesh.updateWorldMatrix(true, false); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox();
      const bb = geo.boundingBox, c = bb.getCenter(new T.Vector3()), h = bb.max.y - bb.min.y, sz = bb.getSize(new T.Vector3());
      if (k === 'log' && sz.z > sz.x) geo.rotateY(Math.PI / 2); /* tronco deitado ao longo do X */
      geo.translate(-c.x, -bb.min.y, -c.z); const f = k === 'log' ? 3.1 / Math.max(sz.x, sz.z) : H[k] / h; geo.scale(f, f, f); geo.computeBoundingSphere();
      if (mesh.material.map) mesh.material.map.encoding = T.sRGBEncoding;
      const im = new T.InstancedMesh(geo, new T.MeshLambertMaterial({ map: mesh.material.map, color: 0xffffff }), CAP[k]); im.count = 0; im.castShadow = im.receiveShadow = true; im.frustumCulled = false; scene.add(im); PROPS.inst[k] = im;
    }
    if (--left === 0) { PROPS.ready = true; PROPS.cx = 1e9; }
  }, undefined, () => { if (--left === 0) PROPS.ready = true; });
}
// só os objetos perto da câmera vão para a placa de vídeo (refaz a cada 20 m)
const _pd = new T.Object3D();
function refreshProps(cx, cz) {
  PROPS.cx = cx; PROPS.cz = cz; const R = [70, 110, 150][SET.quality] || 110, R2 = R * R;
  for (const k in PROPS.inst) {
    const im = PROPS.inst[k]; let n = 0;
    for (const [x, y, z, s, rot] of PROPS.list[k]) {
      if ((x - cx) ** 2 + (z - cz) ** 2 > R2) continue; if (n >= im.instanceMatrix.count) break;
      _pd.position.set(x, y - (k === 'stump' ? 0.06 : k === 'log' ? 0.05 : 0.02) * s, z); _pd.rotation.set(0, rot, 0); _pd.scale.setScalar(s); _pd.updateMatrix(); im.setMatrixAt(n++, _pd.matrix);
    }
    im.count = n; im.instanceMatrix.needsUpdate = true;
  }
}
(function hookProps() {
  const base = natureStep;
  natureStep = function (dt, fx, fz, high) {
    base(dt, fx, fz, high);
    if (!PROPS.ready || high) return;
    if (Math.hypot(fx - PROPS.cx, fz - PROPS.cz) > 20) refreshProps(fx, fz);
  };
})();
loadProps();
