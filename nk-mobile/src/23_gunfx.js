// ================= tiro estilo PUBG: cápsulas, sangue, clarão que ilumina, fumaça do cano, poeira,
// som em camadas (estalo + corpo + eco) com atraso pela distância e direção (esquerda/direita), zunido de bala perto =================

// ---------- cápsulas ejetadas ----------
const SHELL_GEO = new T.CylinderGeometry(0.0055, 0.0055, 0.028, 6); SHELL_GEO.rotateZ(Math.PI / 2);
const SHELL_MAT = new T.MeshPhongMaterial({ color: 0xc9a14a, shininess: 90, specular: 0x887755 });
const SHOT_SHELL_MAT = new T.MeshPhongMaterial({ color: 0xb8261f, shininess: 40 });
const SHELLS = [];
for (let i = 0; i < 48; i++) { const m = new T.Mesh(SHELL_GEO, SHELL_MAT); m.visible = false; scene.add(m); SHELLS.push({ m, t: 0, vx: 0, vy: 0, vz: 0, sx: 0, sy: 0, fl: 0, b: 0 }); }
let shellI = 0;
const _se = new T.Vector3(), _sv = new T.Vector3(), _sq = new T.Quaternion();
function ejectShell(a, src, shotgun) {
  src.updateMatrixWorld(true);
  src.localToWorld(_se.set(0.025, 0.03, -0.12));
  if ((_se.x - camera.position.x) ** 2 + (_se.z - camera.position.z) ** 2 > 30 * 30) return;
  src.getWorldQuaternion(_sq);
  _sv.set(1.6 + Math.random() * 0.8, 1.4 + Math.random() * 0.8, 0.3 + Math.random() * 0.4).applyQuaternion(_sq); // para a direita, para cima e um pouco para trás
  const s = SHELLS[shellI = (shellI + 1) % SHELLS.length];
  s.m.material = shotgun ? SHOT_SHELL_MAT : SHELL_MAT; s.m.scale.setScalar(shotgun ? 2 : 1);
  s.m.position.copy(_se); s.vx = _sv.x + a.vx * 0.8; s.vy = _sv.y; s.vz = _sv.z + a.vz * 0.8;
  s.sx = (Math.random() - 0.5) * 30; s.sy = (Math.random() - 0.5) * 30; s.t = 2.5; s.b = 0;
  s.fl = a.y - groundH(a.x, a.z) > 0.4 ? a.y : groundH(_se.x, _se.z); // dentro de casa cai no piso
  s.m.visible = true;
}
function stepShells(dt) {
  for (const s of SHELLS) {
    if (!s.m.visible) continue;
    if ((s.t -= dt) <= 0) { s.m.visible = false; continue; }
    if (s.b >= 3) continue;
    s.vy -= 9.81 * dt; const p = s.m.position;
    p.x += s.vx * dt; p.y += s.vy * dt; p.z += s.vz * dt; s.m.rotation.x += s.sx * dt; s.m.rotation.y += s.sy * dt;
    if (p.y < s.fl + 0.005) {
      p.y = s.fl + 0.005; s.b++;
      if (s.b === 1 && (p.x - camera.position.x) ** 2 + (p.z - camera.position.z) ** 2 < 36) tinkSound();
      s.vy = -s.vy * 0.35; s.vx *= 0.45; s.vz *= 0.45; s.sx *= 0.4; s.sy *= 0.4;
      if (s.b >= 3) { s.m.rotation.x = 0; s.m.rotation.z = 0; }
    }
  }
}

// ---------- clarão que ilumina o ambiente (uma luz só, reaproveitada; nunca some da cena para não recompilar shaders) ----------
const MZ_LIGHT = new T.PointLight(0xffb45a, 0, 9, 2); scene.add(MZ_LIGHT); let mzT = 0;

// ---------- sangue: borrifo + mancha no chão ----------
const BLOOD_GEO = new T.SphereGeometry(1, 5, 4);
const BLOOD_MAT = new T.MeshBasicMaterial({ color: 0x7a0c0c });
const BLOOD = [];
for (let i = 0; i < 60; i++) { const m = new T.Mesh(BLOOD_GEO, BLOOD_MAT); m.visible = false; scene.add(m); BLOOD.push({ m, t: 0, vx: 0, vy: 0, vz: 0, fl: 0 }); }
let bloodI = 0;
const STAIN = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
  for (let i = 0; i < 9; i++) { const x = 32 + (Math.random() - 0.5) * 30, y = 32 + (Math.random() - 0.5) * 30, r = 4 + Math.random() * 11; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(95,6,6,0.9)'); gr.addColorStop(0.7, 'rgba(80,4,4,0.7)'); gr.addColorStop(1, 'rgba(70,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  const mat = new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  mat.map.encoding = T.sRGBEncoding;
  const geo = new T.PlaneGeometry(0.7, 0.7); geo.rotateX(-Math.PI / 2); const pool = [];
  for (let i = 0; i < 24; i++) { const m = new T.Mesh(geo, mat); m.visible = false; scene.add(m); pool.push(m); }
  return { pool, i: 0 };
})();
function bloodFx(x, y, z, dx, dy, dz, victim) {
  if ((x - camera.position.x) ** 2 + (z - camera.position.z) ** 2 > 140 * 140) return;
  const fl = victim && victim.y - groundH(victim.x, victim.z) > 0.4 ? victim.y : groundH(x, z);
  for (let i = 0; i < 7; i++) {
    const b = BLOOD[bloodI = (bloodI + 1) % BLOOD.length];
    b.m.position.set(x, y, z); b.m.scale.setScalar(0.018 + Math.random() * 0.025);
    const sp = 1.5 + Math.random() * 2.5;
    b.vx = dx * sp + (Math.random() - 0.5) * 1.6; b.vy = dy * sp + Math.random() * 1.5; b.vz = dz * sp + (Math.random() - 0.5) * 1.6;
    b.t = 0.8; b.fl = fl; b.m.visible = true;
  }
  puff(x, y, z, '#a01515', 0.22, 0.25);
  if (Math.random() < 0.6) { // mancha no chão atrás de quem levou o tiro
    const m = STAIN.pool[STAIN.i = (STAIN.i + 1) % STAIN.pool.length];
    m.position.set(x + dx * 0.7, fl + 0.025, z + dz * 0.7); m.rotation.y = Math.random() * 6.28; m.scale.setScalar(0.6 + Math.random() * 0.7); m.visible = true;
  }
}
function stepBlood(dt) {
  for (const b of BLOOD) {
    if (!b.m.visible) continue;
    if ((b.t -= dt) <= 0) { b.m.visible = false; continue; }
    b.vy -= 9.81 * dt; const p = b.m.position; p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt;
    if (p.y < b.fl) b.m.visible = false;
  }
}
// bala no chão de terra: levanta poeira
function dirtFx(x, y, z) {
  if ((x - camera.position.x) ** 2 + (z - camera.position.z) ** 2 > 160 * 160) return;
  puff(x, y + 0.1, z, '#9b8466', 0.45, 0.7); puff(x, y + 0.3, z, '#b8a588', 0.25, 0.45);
}

// ---------- chamado a cada tiro ----------
function gunFx(a, d, mods) {
  const w = curW(a); if (!w) return;
  let src = null;
  if (a === G.player && VM.visible) src = vmGun; else if (a.model && a.model.gun && a.model.gun.visible && a.model.g.visible) src = a.model.gun;
  if (src && d.cls !== 'sr' || src && a !== G.player) ejectShell(a, src, d.cls === 'sg'); // ferrolho: cápsula sai ao recarregar o tiro
  if (src && !mods.quiet) {
    src.localToWorld(_mz.set(0, 0.012, (GUN_MUZ[w.k] || -0.6) - 0.05));
    const d2 = _mz.distanceToSquared(camera.position);
    if (d2 < 70 * 70 && (SET.quality || 0) > 0) { MZ_LIGHT.position.copy(_mz); MZ_LIGHT.intensity = d.cls === 'pistol' ? 1.6 : 2.6; mzT = 0.05; }
    if (a !== G.player && d2 < 40 * 40 && Math.random() < 0.3) puff(_mz.x, _mz.y, _mz.z, '#c9c6c0', 0.06, 0.5); // fumacinha no cano (dos outros)
  }
  if (a === G.player && d.cls === 'sr') setTimeout(() => { sfxBolt(); if (VM.visible) ejectShell(a, vmGun, false); }, 420);
}
function stepGunFx(dt) {
  stepShells(dt); stepBlood(dt);
  if (mzT > 0) { mzT -= dt; if (mzT <= 0) MZ_LIGHT.intensity = 0; else MZ_LIGHT.intensity *= 0.6; }
}
// bala inimiga passando perto da cabeça: zunido/estalo (como no PUBG, dá para perceber de onde vem)
const _hd = {};
function nearMiss(b, dx, dy, dz, len) {
  const p = G.player; if (!p || !p.alive || p.mode !== 'ground') return;
  eyePos(p, _hd);
  const ex = _hd.x - b.x, ey = _hd.y - b.y, ez = _hd.z - b.z, t = clamp(ex * dx + ey * dy + ez * dz, 0, len);
  const cx = b.x + dx * t - _hd.x, cy = b.y + dy * t - _hd.y, cz = b.z + dz * t - _hd.z;
  if (cx * cx + cy * cy + cz * cz < 2.4 * 2.4 && Math.hypot(b.x - b.o.x, b.z - b.o.z) > 6) { b.wz = 1; whizSound(b.x + dx * t, b.z + dz * t); }
}

// ---------- som ----------
// lado do som em relação para onde a câmera olha: -1 esquerda, +1 direita
function panOf(x, z) {
  const ang = Math.atan2(-(x - camera.position.x), -(z - camera.position.z)) - G.view.yaw;
  return clamp(-Math.sin(ang), -1, 1) * 0.85;
}
function sOut(at, pan) {
  let out = AC.destination;
  if (pan && AC.createStereoPanner) { const pn = AC.createStereoPanner(); pn.pan.setValueAtTime(pan, at); pn.connect(out); out = pn; }
  return out;
}
function sNoise(at, dur, v, freq, q, type, out) {
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NOISE; s.playbackRate.value = 0.8 + Math.random() * 0.4; f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 0.7;
  g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(v * SET.vol, at + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 0.3); s.stop(at + dur + 0.02);
}
function sTone(at, f0, f1, dur, v, type, out) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  g.gain.setValueAtTime(v * SET.vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); o.connect(g).connect(out); o.start(at); o.stop(at + dur + 0.02);
}
let shotN2 = 0, shotT2 = 0;
// substitui o som antigo: estalo seco + corpo grave + eco que some; longe chega abafado e atrasado (velocidade do som)
shotSound = function (a, d, quiet) {
  if (!AC || G.phase !== 'match') return;
  const p = G.player, me = a === p, dist = Math.hypot(a.x - camera.position.x, a.z - camera.position.z);
  const now = performance.now(); if (now - shotT2 < 14 && !me) return; shotT2 = now;
  const v = (quiet ? 0.3 : 1) / (1 + dist / 40); if (v < 0.012) return;
  const big = d.cls === 'sr' ? 1.45 : d.cls === 'dmr' ? 1.2 : d.cls === 'sg' ? 1.3 : d.cls === 'ar' ? 1 : d.cls === 'lmg' ? 1.05 : d.cls === 'smg' ? 0.72 : 0.6;
  const at = AC.currentTime + (me ? 0 : Math.min(1.6, dist / 343)), out = sOut(at, me ? 0 : panOf(a.x, a.z));
  const town = typeof TOWNS !== 'undefined' && TOWNS.some(t => Math.hypot(t.x - a.x, t.z - a.z) < (t.r || 60)); // entre prédios ecoa mais
  if (quiet) { sNoise(at, 0.07, v * 0.5, 1700, 1.2, 'bandpass', out); sTone(at, 260, 120, 0.05, v * 0.15, 'triangle', out); return; }
  if (dist < 90) {
    sNoise(at, 0.045, v * 0.75 * big, 4200, 0.6, 'highpass', out); // estalo
    sNoise(at, 0.11 + big * 0.1, v * 0.7 * big, 1500 + big * 300, 0.8, 'lowpass', out); // corpo
    sTone(at, 150 - big * 25, 42, 0.12 + big * 0.07, v * 0.55 * big, 'triangle', out); // pancada grave
  } else {
    sNoise(at, 0.25 + big * 0.15, v * 0.9 * big, 520, 0.6, 'lowpass', out); // longe: estrondo abafado
  }
  sNoise(at + 0.04, (town ? 0.9 : 0.55) + big * 0.3, v * (town ? 0.32 : 0.2) * big, 420, 0.5, 'lowpass', out); // eco/cauda
};
function whizSound(x, z) {
  if (!AC) return; const at = AC.currentTime, out = sOut(at, panOf(x, z));
  sNoise(at, 0.06, 0.45, 3200, 2.5, 'bandpass', out); sTone(at, 2400, 700, 0.09, 0.06, 'sine', out);
}
function tinkSound() { if (!AC) return; const at = AC.currentTime; sTone(at, 4200 + Math.random() * 800, 3600, 0.05, 0.035, 'sine', AC.destination); sTone(at + 0.08, 4600, 4000, 0.03, 0.02, 'sine', AC.destination); }
function sfxBolt() { if (!AC) return; const at = AC.currentTime; sNoise(at, 0.05, 0.3, 2500, 3, 'bandpass', AC.destination); sNoise(at + 0.16, 0.06, 0.35, 1800, 3, 'bandpass', AC.destination); }
// recarga em fases: tira o pente, coloca, puxa o ferrolho (o tempo acompanha a animação)
function reloadSounds(a, tot, cls) {
  const t0 = performance.now(), ok = () => a.reloadT > 0 && a.alive && performance.now() - t0 < tot * 1000 + 200;
  const at = (k, fn) => setTimeout(() => { if (ok() && AC) fn(AC.currentTime); }, tot * k * 1000);
  if (!AC) return;
  if (cls === 'sg' || cls === 'sr' && tot > 3) { for (let i = 0; i < 4; i++) at(0.15 + i * 0.17, t => sNoise(t, 0.05, 0.3, 2600, 3, 'bandpass', AC.destination)); return; }
  at(0.15, t => { sNoise(t, 0.06, 0.3, 1800, 2.5, 'bandpass', AC.destination); sTone(t, 300, 200, 0.05, 0.05, 'square', AC.destination); }); // pente sai
  at(0.6, t => { sNoise(t, 0.05, 0.4, 2300, 3, 'bandpass', AC.destination); sNoise(t + 0.05, 0.04, 0.35, 3200, 3, 'bandpass', AC.destination); }); // pente entra (clique)
  at(0.86, t => { sNoise(t, 0.05, 0.35, 2800, 3, 'bandpass', AC.destination); sNoise(t + 0.12, 0.05, 0.4, 2000, 3, 'bandpass', AC.destination); }); // ferrolho
}
const _sfxOld = sfx;
sfx = function (k) {
  if (k === 'dry') { if (AC) { const t = AC.currentTime; sNoise(t, 0.03, 0.35, 3500, 4, 'bandpass', AC.destination); } return; }
  return _sfxOld(k);
};
