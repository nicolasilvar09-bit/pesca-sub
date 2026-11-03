// ================= laço principal =================
const CHUTE_GEO = mergeParts([{ g: GEO.hsph, y: 0, sx: 5.2, sy: 2.2, sz: 3.6, c: '#ff4fa3' }, { g: GEO.hsph, y: 0.05, sx: 3.2, sy: 2.25, sz: 3.65, c: '#ffe14d' }]);
function drawActors(dt, hideSelf) {
  const cx = camera.position.x, cz = camera.position.z; humanFrame(); stepCorpses(dt);
  for (const a of G.actors) {
    if (!a.model) continue;
    animateModel(a, dt, cx, cz, hideSelf && a === G.player);
    const m = a.model, on = a.alive && a.mode === 'chute';
    if (on && !m.chute) { m.chute = new T.Mesh(CHUTE_GEO, MAT.actor); m.chute.position.y = 4.4; m.g.add(m.chute); }
    if (m.chute) m.chute.visible = on;
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
  if (!(G.phase === 'match' && panelOpen()) || (fpsN % 6 === 0)) renderer.render(scene, camera);
  fpsN++; if ((fpsT += dt) > 1) { G.fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
}
