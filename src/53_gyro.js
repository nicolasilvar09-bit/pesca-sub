// ================= mira por giroscópio: incline o celular para ajustar a mira enquanto nada =================
// usa a velocidade de giro do aparelho (devicemotion.rotationRate, graus/s) e converte para guinada e arfagem
// conforme a tela está em pé ou deitada. O dedo continua funcionando junto.
const GY = { dy: 0, dp: 0, live: false, last: 0 };
function gyroAngle() { const o = screen.orientation; return o && typeof o.angle === 'number' ? o.angle : (window.orientation || 0); }
function onGyro(e) {
  const r = e.rotationRate; if (!r || r.beta == null) return;
  GY.live = true; const now = performance.now(), dt = GY.last ? Math.min(0.1, (now - GY.last) / 1000) : 0; GY.last = now;
  if (!OPT.gyro || !dt) return;
  const k = dt * Math.PI / 180, a = ((gyroAngle() % 360) + 360) % 360;
  let yaw, pit;
  if (a === 90) { yaw = r.beta; pit = -r.gamma; }        // deitado, topo do celular para a esquerda
  else if (a === 270) { yaw = -r.beta; pit = r.gamma; }  // deitado, topo para a direita
  else { yaw = r.gamma; pit = r.beta; }                  // em pé
  GY.dy += yaw * k; GY.dp += pit * k;
}
async function gyroEnable(on) {
  if (on && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try { if (await DeviceMotionEvent.requestPermission() !== 'granted') { toast('Sem permissão para o giroscópio. Libere nos ajustes do Safari.', 4, 'bad'); OPT.gyro = false; saveOpt(); return false; } } catch (e) { OPT.gyro = false; saveOpt(); return false; }
  }
  OPT.gyro = on; saveOpt(); GY.dy = GY.dp = 0;
  if (on) setTimeout(() => { if (!GY.live) toast('Este aparelho não mandou dados do giroscópio.', 4, 'bad'); }, 1500);
  return true;
}
// chamado no nado, junto com o arrastar do dedo
function gyroApply() {
  if (!OPT.gyro) { GY.dy = GY.dp = 0; return; }
  const s = OPT.gyroK || 1;
  P.yaw += GY.dy * s; P.pitch = clamp(P.pitch + GY.dp * s * (OPT.inv ? -1 : 1), -1.5, 1.4);
  GY.dy = GY.dp = 0;
}
function setupGyro() {
  addEventListener('devicemotion', onGyro);
  // no iPhone a permissão vale só até fechar a página: pede de novo no primeiro toque se a opção estiver ligada
  const ask = () => { removeEventListener('pointerdown', ask, true); if (OPT.gyro && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().catch(() => { }); };
  addEventListener('pointerdown', ask, true);
}
