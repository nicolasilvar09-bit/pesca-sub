// ================= efeitos: clarão do cano e marcas de bala nas paredes =================
const FLASH = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.25, 'rgba(255,200,90,0.9)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new T.CanvasTexture(cv), pool = [];
  for (let i = 0; i < 14; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: tex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); s.visible = false; s.renderOrder = 3; scene.add(s); pool.push({ s, t: 0 }); }
  return { pool, i: 0 };
})();
const _mz = new T.Vector3();
function muzzleFlash(a, quiet) {
  if (quiet) return;
  const w = curW(a); if (!w) return;
  let src = null;
  if (a === G.player && VM.visible) src = vmGun; else if (a.model && a.model.gun && a.model.gun.visible && a.model.g.visible) src = a.model.gun;
  if (!src) return;
  src.updateMatrixWorld(true); src.localToWorld(_mz.set(0, 0.012, (GUN_MUZ[w.k] || -0.6) - 0.03));
  if (_mz.distanceTo(camera.position) > 160) return;
  const f = FLASH.pool[FLASH.i = (FLASH.i + 1) % FLASH.pool.length];
  f.s.position.copy(_mz); const sz = wdef(w).cls === 'pistol' ? 0.22 : 0.38; f.s.scale.set(sz, sz, sz); f.s.material.rotation = Math.random() * 6.28; f.s.visible = true; f.t = 0.045;
}
const DECAL = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(10,10,10,0.95)'); gr.addColorStop(0.35, 'rgba(25,22,20,0.8)'); gr.addColorStop(1, 'rgba(40,35,30,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  const mat = new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const geo = new T.PlaneGeometry(0.11, 0.11), pool = [];
  for (let i = 0; i < 70; i++) { const m = new T.Mesh(geo, mat); m.visible = false; scene.add(m); pool.push(m); }
  return { pool, i: 0 };
})();
const _dn = new T.Vector3();
// marca de bala no ponto (x,y,z) da caixa b (normal = face mais próxima)
function bulletDecal(x, y, z, b) {
  if (!b || (x - camera.position.x) ** 2 + (z - camera.position.z) ** 2 > 90 * 90) return;
  const d = [[Math.abs(x - b.x0), -1, 0, 0], [Math.abs(x - b.x1), 1, 0, 0], [Math.abs(y - b.y0), 0, -1, 0], [Math.abs(y - b.y1), 0, 1, 0], [Math.abs(z - b.z0), 0, 0, -1], [Math.abs(z - b.z1), 0, 0, 1]].sort((p, q) => p[0] - q[0])[0];
  const m = DECAL.pool[DECAL.i = (DECAL.i + 1) % DECAL.pool.length];
  m.position.set(x + d[1] * 0.012, y + d[2] * 0.012, z + d[3] * 0.012); _dn.set(x + d[1], y + d[2], z + d[3]); m.lookAt(_dn); m.rotateZ(Math.random() * 6.28); m.visible = true;
  puff(x, y, z, '#ffcf7a', 0.06, 0.12);
}
function stepFx2(dt) { for (const f of FLASH.pool) if (f.s.visible && (f.t -= dt) <= 0) f.s.visible = false; }
