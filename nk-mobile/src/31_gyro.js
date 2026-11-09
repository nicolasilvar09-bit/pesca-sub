// ================= mira por giroscópio (igual ao PUBG Mobile): mexer o celular gira a câmera, com sensibilidade por luneta =================
// modos: 0 = desligado, 1 = só mirando (ADS), 2 = sempre. 100% = o celular gira 10° e a câmera gira 10°.
const GYRO_DEF = { tpp: 100, fpp: 100, red: 90, x2: 70, x3: 55, x4: 45, x6: 35, x8: 25 };
if (!SET.sensG) SET.sensG = Object.assign({}, GYRO_DEF);
for (const k in GYRO_DEF) if (SET.sensG[k] == null) SET.sensG[k] = GYRO_DEF[k];
if (SET.gyro == null) SET.gyro = 0;
const GYRO = { yaw: 0, pitch: 0, last: 0, ok: false, asked: false };
function gyroAsk() { // iPhone: precisa pedir permissão dentro de um toque
  if (GYRO.asked) return; GYRO.asked = true;
  const D = window.DeviceMotionEvent;
  if (D && typeof D.requestPermission === 'function') D.requestPermission().then(r => { GYRO.ok = r === 'granted'; if (!GYRO.ok) toast('Giroscópio sem permissão: libere em Ajustes > Safari > Movimento e Orientação', 4); }).catch(() => { GYRO.asked = false; });
  else GYRO.ok = !!D;
}
addEventListener('devicemotion', e => {
  const r = e.rotationRate, now = performance.now(), dt = GYRO.last ? Math.min(0.1, (now - GYRO.last) / 1000) : 0; GYRO.last = now;
  if (!r || !SET.gyro || r.beta == null) return; GYRO.ok = true;
  // deitado (paisagem): girar o corpo = eixo x do aparelho; inclinar para cima/baixo = eixo y. O lado do aparelho muda o sinal.
  const ang = (screen.orientation && screen.orientation.angle != null ? screen.orientation.angle : (window.orientation || 0)), s = ang === 270 || ang === -90 ? -1 : 1, D2R = Math.PI / 180;
  GYRO.yaw += s * r.beta * D2R * dt * (SET.gyroInvX ? -1 : 1); GYRO.pitch += -s * r.gamma * D2R * dt * (SET.gyroInvY ? -1 : 1);
});
// pede a permissão no primeiro toque (o iPhone só deixa assim)
addEventListener('touchend', () => { if (SET.gyro && !GYRO.ok) gyroAsk(); }, { passive: true });
(function hookGyro() {
  const base = playerStep;
  playerStep = function (dt) {
    const p = G.player, v = G.view;
    if (SET.gyro && p && p.alive && G.phase === 'match' && (SET.gyro === 2 || p.ads) && Math.abs(GYRO.yaw) + Math.abs(GYRO.pitch) < 1.5) {
      const w = curW(p), zoom = p.ads && w ? sightZoom(w) : 1;
      const sk = !p.ads ? (v.fpp ? 'fpp' : 'tpp') : zoom < 1.8 ? 'red' : zoom < 2.5 ? 'x2' : zoom < 3.5 ? 'x3' : zoom < 5 ? 'x4' : zoom < 7 ? 'x6' : 'x8';
      const k = (SET.sensG[sk] || 100) / 100;
      v.yaw += GYRO.yaw * k; v.pitch += GYRO.pitch * k; if (GYRO.yaw || GYRO.pitch) G.lookT = G.t;
    }
    GYRO.yaw = GYRO.pitch = 0;
    return base(dt);
  };
})();
