// ================= laço principal =================
// paraquedas de células (velame retangular em arco) com cordas até o arnês
const CHUTE_GEO = (() => {
  const p = [], N = 9, W = 7.2, cols = ['#e8562a', '#f4f1ea', '#e8562a', '#2c4a6e', '#f4f1ea', '#2c4a6e', '#e8562a', '#f4f1ea', '#e8562a'];
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N - 0.5, a = t * 1.15, x = Math.sin(a) * W * 0.62, y = Math.cos(a) * 1.4 + 1.0;
    p.push({ g: GEO.box, x, y, z: 0, sx: W / N * 1.04, sy: 0.32, sz: 2.8, rz: -a, c: cols[i] });
    p.push({ g: GEO.box, x, y: y - 0.2, z: -1.35, sx: W / N * 1.0, sy: 0.12, sz: 0.12, rz: -a, c: '#1d1d1d' }); // boca das células
  }
  for (const sx of [-1, 1]) for (const z of [-1.0, 0.0, 1.0]) for (const k of [0.25, 0.5]) {
    const a = sx * k * 1.15, x = Math.sin(a) * W * 0.62, y = Math.cos(a) * 1.4 + 0.85, dx = x, dy = y - (-3.0), len = Math.hypot(dx, dy, z);
    p.push({ g: GEO.cyl6, x: x / 2, y: (y - 3.0) / 2, z: z / 2, sx: 0.025, sy: len, sz: 0.025, rz: -Math.atan2(dx, dy), rx: Math.atan2(z, dy), c: '#dddddd' });
  }
  return mergeParts(p);
})();
function drawActors(dt, hideSelf) {
  const cx = camera.position.x, cz = camera.position.z; humanFrame(); stepCorpses(dt);
  for (const a of G.actors) {
    if (!a.model) continue;
    animateModel(a, dt, cx, cz, hideSelf && a === G.player);
    const m = a.model, on = a.alive && a.mode === 'chute';
    if (on && !m.chute) { m.chute = new T.Mesh(CHUTE_GEO, MAT.actor); m.chute.position.y = 4.4; m.g.add(m.chute); }
    if (m.chute) { m.chute.visible = on; if (on) { const o = smooth(clamp((a.chuteT || 0) / 0.9, 0, 1)); m.chute.scale.set(0.25 + 0.75 * o, 0.4 + 0.6 * o, 0.5 + 0.5 * o); m.chute.rotation.set(Math.sin(G.t * 1.3 + a.id) * 0.04 - Math.min(0.12, Math.hypot(a.vx, a.vz) * 0.006), 0, -(a.bank || 0) * 0.32); } } // abre enchendo e inclina nas curvas
  }
}
let last = performance.now(), fpsN = 0, fpsT = 0;
G.step = function (dt) {
  G.t += dt;
  if (G.phase === 'match') {
    playerStep(dt);
    stepMatch(dt);
  }
};
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (window.__freeze) return;
  G.step(dt);
  if (G.phase === 'match') {
    const hide = updateCamera(dt);
    drawActors(dt, hide);
    const p = G.player, t = p.alive ? p : G.view.spect || p;
    updateItemVisuals(dt, t.x, t.z);
    for (const c of G.crates) c.mesh.position.y = c.y;
    gfxStep(dt, t.alive ? t.x : camera.position.x, t.alive ? t.y : camera.position.y - 10, t.alive ? t.z : camera.position.z);
    updateHud(dt);
  } else { lobbyCamera(dt); gfxStep(dt, LOB.x, LOB.y, LOB.z); }
  // com painel aberto cobrindo a tela, desenha o 3D só de vez em quando (alivia o celular)
  if (!(G.phase === 'match' && panelOpen()) || (fpsN % 6 === 0)) drawScene();
  fpsN++; if ((fpsT += dt) > 1) { G.fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
}
