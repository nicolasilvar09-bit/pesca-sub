// ================= clima e hora do dia (muda a cada partida) + sons de ambiente =================
// dia de sol, fim de tarde, nublado e chuva. Na partida online o sorteio usa a semente da partida: todos veem o mesmo.
const WEATHER = {
  dia: { n: 'Dia de sol', el: 42, az: 29, sc: 0xffe2b8, si: 1.9, hs: 0xbfd6ee, hg: 0x6b6150, hi: 0.85, fog: null, fk: 1, ex: 0.92, tb: 6.5, ry: 1.4, sky: true },
  tarde: { n: 'Fim de tarde', el: 9, az: 205, sc: 0xffae6a, si: 1.95, hs: 0xdcc2ad, hg: 0x62524a, hi: 0.85, fog: 0xdcbfa4, fk: 0.85, ex: 1.06, tb: 9, ry: 2.4, sky: true },
  nublado: { n: 'Nublado', el: 55, az: 60, sc: 0xdde3ea, si: 0.75, hs: 0xc6ced6, hg: 0x6f6f68, hi: 1.25, fog: 0xb3bbc2, fk: 0.6, ex: 0.95, tb: 14, ry: 0.6, sky: false },
  noite: { n: 'Noite', el: 38, az: 140, sc: 0x9fb6e8, si: 0.42, hs: 0x3a4868, hg: 0x16181e, hi: 0.62, fog: 0x161d2c, fk: 0.55, ex: 1.15, tb: 1, ry: 0.2, sky: false, night: true },
  chuva: { n: 'Chuva', el: 60, az: 80, sc: 0xc9d1da, si: 0.5, hs: 0xa9b3bc, hg: 0x585d5e, hi: 1.05, fog: 0x98a2aa, fk: 0.42, ex: 0.9, tb: 18, ry: 0.4, sky: false, rain: true },
};
const WX = { k: 'dia', rainOn: false };
const FOG_BASE = SKY_C.clone();
function applyFogColor() {
  scene.fog.color.copy(SKY_C); scene.background.copy(SKY_C);
  if (typeof PP !== 'undefined' && PP && PP.on) { scene.fog.color.convertSRGBToLinear(); scene.background.convertSRGBToLinear(); }
}
function setWeather(k) {
  const w = WEATHER[k] || WEATHER.dia; WX.k = k in WEATHER ? k : 'dia';
  const el = w.el * Math.PI / 180, az = w.az * Math.PI / 180;
  SUN_DIR.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
  sun.color.set(w.sc); sun.intensity = w.si; HEMI.color.set(w.hs); HEMI.groundColor.set(w.hg); HEMI.intensity = w.hi;
  renderer.toneMappingExposure = w.ex;
  SKY_C.set(w.fog == null ? FOG_BASE : w.fog); applyFogColor();
  const q = QUAL[SET.quality] || QUAL[1]; scene.fog.far = q.fog * w.fk; scene.fog.near = q.fog * 0.12 * w.fk;
  if (typeof SKY2 !== 'undefined' && SKY2) { const u = SKY2.material.uniforms; u.sunPosition.value.copy(SUN_DIR); u.turbidity.value = w.tb; u.rayleigh.value = w.ry; SKY2.visible = w.sky; }
  for (const m of SUNDISK) { m.position.copy(SUN_DIR).multiplyScalar(2000); m.lookAt(0, 0, 0); m.visible = w.sky; }
  if (GFX.water) { GFX.water.uniforms.uSun.value.copy(SUN_DIR); GFX.water.uniforms.uSky.value.set(w.sky ? 0xb5c6d2 : w.fog); }
  WX.rainOn = !!w.rain; RAIN.visible = WX.rainOn; nightExtras(!!w.night);
}
// a qualidade gráfica também mexe na névoa: reaplica o clima depois
const _aq = applyQuality; applyQuality = function () { _aq(); if (typeof WX !== 'undefined' && WEATHER[WX.k].fk !== 1) setWeather(WX.k); };
function pickWeather(seed) {
  const r = seed ? mulberry(seed ^ 0x5bd1e995)() : Math.random();
  const tab = MAPID === 'bal' ? [['dia', 34], ['tarde', 20], ['nublado', 15], ['chuva', 23], ['noite', 8]] : [['dia', 44], ['tarde', 20], ['nublado', 16], ['chuva', 12], ['noite', 8]];
  let s = 0; for (const [k, p] of tab) { s += p / 100; if (r < s) return k; } return 'dia';
}
const _smW = startMatch; startMatch = function (opt) { const out = _smW.apply(this, arguments); setWeather(pickWeather(opt && opt.seed)); if (WX.k !== 'dia') setTimeout(() => toast('Clima: ' + WEATHER[WX.k].n, 2.5), 2500); return out; };
const _tlW = toLobby; toLobby = function () { const out = _tlW.apply(this, arguments); setWeather('dia'); return out; };

// ---------- noite: lua, estrelas, janelas acesas e brilho dos postes ----------
const STARS = (() => {
  const N = 900, p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, y = Math.abs(u) * 0.95 + 0.05, r = Math.sqrt(1 - y * y); p.set([Math.cos(a) * r * 2100, y * 2100, Math.sin(a) * r * 2100], i * 3); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3));
  const m = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false })); // opaco: desenhado antes de tudo, então prédio e morro cobrem
  m.visible = false; m.renderOrder = -9; m.frustumCulled = false; SKY.add(m); return m;
})();
let LAMPGLOW = null;
function lampGlow() {
  if (LAMPGLOW || !GFX.lamps) return LAMPGLOW;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,225,150,0.9)'); gr.addColorStop(0.3, 'rgba(255,200,110,0.35)'); gr.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const L = GFX.lamps, pos = new Float32Array(L.length * 3);
  L.forEach(([x, z, h, a], i) => pos.set([x + Math.sin(a) * 1.35, h + 5.55, z + Math.cos(a) * 1.35], i * 3));
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  LAMPGLOW = new T.Points(geo, new T.PointsMaterial({ map: new T.CanvasTexture(cv), size: 9, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  LAMPGLOW.visible = false; scene.add(LAMPGLOW); return LAMPGLOW;
}
const _glassEm = new T.Color(0x1a3a50);
function nightExtras(on) {
  WX.night = on; STARS.visible = on;
  for (const m of SUNDISK) { m.material.color.set(on ? 0xdfe8ff : 0xfff4cc); m.visible = m.visible || on; m.scale.setScalar(on ? 0.45 : 1); }
  if (on) for (const m of SUNDISK) m.visible = true;
  if (GLASS.mesh) { GLASS.mesh.material.emissive.set(on ? 0xc9883a : _glassEm); GLASS.mesh.material.opacity = on ? 0.75 : 0.42; } // janelas acesas
  const lg = lampGlow(); if (lg) lg.visible = on;
}
// ---------- chuva: riscos que caem numa caixa em volta da câmera (tudo na placa de vídeo) ----------
const RAIN = (() => {
  const N = 2600, pos = new Float32Array(N * 2 * 3), end = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const x = Math.random() * 70, y = Math.random() * 34, z = Math.random() * 70; for (let k = 0; k < 2; k++) { pos.set([x, y, z], (i * 2 + k) * 3); end[i * 2 + k] = k; } }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('end', new T.BufferAttribute(end, 1));
  const mat = new T.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uCam: { value: new T.Vector3() } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float end; uniform float uT; uniform vec3 uCam; varying float vA;
      void main(){ vec3 p = position; p.y = mod(p.y - uT * 22.0, 34.0); p.x = mod(p.x - uCam.x + uT * 2.5, 70.0) - 35.0 + uCam.x; p.z = mod(p.z - uCam.z, 70.0) - 35.0 + uCam.z; p.y += uCam.y - 12.0;
        p.y += end * 0.75; p.x -= end * 0.09; vA = 0.32 * (1.0 - end * 0.6);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `varying float vA; void main(){ gl_FragColor = vec4(0.78, 0.82, 0.88, vA); }`,
  });
  const m = new T.LineSegments(g, mat); m.frustumCulled = false; m.visible = false; m.renderOrder = 5; scene.add(m);
  return m;
})();

// ---------- sons de ambiente: ondas perto do mar, passarinhos na mata, vento no alto, chuva ----------
const AMB = { t: 0, waveT: 0, birdT: 2, sea: 0, loops: null };
function ambLoops() {
  if (AMB.loops || !AC) return AMB.loops;
  const mk = (freq, type, q) => { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = NOISE; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0; s.connect(f).connect(g).connect(AC.destination); s.start(); return g; };
  AMB.loops = { rain: mk(1400, 'lowpass', 0.5), wind: mk(420, 'bandpass', 0.6) };
  return AMB.loops;
}
function stepWeather(dt) {
  AMB.t += dt;
  if (RAIN.visible) { RAIN.material.uniforms.uT.value = AMB.t; RAIN.material.uniforms.uCam.value.copy(camera.position); }
  if (!AC || AC.state !== 'running') return;
  const L = ambLoops(); if (!L) return;
  const inMatch = G.phase === 'match', vol = SET.vol, p = G.player, now = AC.currentTime;
  // chuva contínua (mais baixa dentro de casa)
  const indoor = inMatch && p && p.alive && typeof bldAt === 'function' && bldAt(p.x, p.z, -0.3) && p.y < bldAt(p.x, p.z, -0.3).top;
  L.rain.gain.setTargetAtTime(WX.rainOn ? (indoor ? 0.05 : 0.13) * vol : 0, now, 0.5);
  // vento: mais forte no alto (morro, avião, queda livre)
  const cy = camera.position.y, gh = groundH(camera.position.x, camera.position.z), fall = inMatch && p && (p.mode === 'fall' || p.mode === 'chute');
  L.wind.gain.setTargetAtTime((clamp((cy - Math.max(gh, 0) - 6) / 80, 0, 1) * 0.07 + clamp((cy - 45) / 120, 0, 1) * 0.05 + (fall ? 0.1 : 0) + (WX.k === 'nublado' ? 0.02 : 0)) * vol, now, 0.6);
  // mar: a cada meio segundo vê quanto de água há em volta
  if ((AMB.waveT -= dt) <= 0) {
    AMB.waveT = 0.5; let n = 0; const x = camera.position.x, z = camera.position.z;
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; if (groundH(x + Math.cos(a) * 45, z + Math.sin(a) * 45) < -0.8) n++; }
    AMB.sea = n / 8 * clamp(1 - (cy - 4) / 60, 0, 1);
    if (AMB.sea > 0.05 && Math.random() < 0.28) sNoise(now, 2.6, AMB.sea * 0.12, 500 + Math.random() * 200, 0.5, 'lowpass', AC.destination); // onda quebrando
  }
  // passarinhos de dia na mata (mais no Balneário)
  if ((AMB.birdT -= dt) <= 0) {
    AMB.birdT = rr(1.5, MAPID === 'bal' ? 4 : 7);
    if (WX.night && cy - gh < 30) { // grilos à noite
      const out = sOut(now, rr(-0.8, 0.8)), f = rr(4200, 5200), v = 0.012 * (inMatch ? 1 : 0.7);
      for (let i = 0; i < 6; i++) sTone(now + i * 0.06, f, f * 0.98, 0.035, v, 'sine', out);
    } else if (!WX.rainOn && WX.k !== 'nublado' && cy - gh < 30 && AMB.sea < 0.6) {
      const out = sOut(now, rr(-0.8, 0.8)), f0 = rr(2200, 4200), nn = 2 + Math.floor(Math.random() * 4), v = (MAPID === 'bal' ? 0.03 : 0.02) * (inMatch ? 1 : 0.7);
      for (let i = 0; i < nn; i++) sTone(now + i * rr(0.08, 0.16), f0 * rr(0.9, 1.15), f0 * rr(1.1, 1.4), 0.07, v, 'sine', out);
    }
  }
}
const _gsW = gfxStep; gfxStep = function (dt, fx, fy, fz) { _gsW(dt, fx, fy, fz); stepWeather(dt); };
// ---------- desempenho: blocos do cenário além da névoa não são desenhados ----------
let _cullT = 0; const _cv = new T.Vector3();
const _gsC = gfxStep; gfxStep = function (dt, fx, fy, fz) {
  _gsC(dt, fx, fy, fz);
  if ((_cullT -= dt) > 0) return; _cullT = 0.4;
  const far = scene.fog.far + 60, cp = camera.position;
  for (const m of CHUNK_MESH) { const bs = m.geometry.boundingSphere; if (!bs) continue; m.visible = _cv.copy(bs.center).distanceTo(cp) - bs.radius < far; }
};
