// ================= clima dinâmico: pancadas de chuva, trovoada, mar crescendo e plâncton brilhante =================
// a previsão do dia é sorteada pelo número do dia (igual para todos); a chuva entra e sai ao longo das horas
const WX = { ev: [], rain: 0, storm: 0, glow: false, flash: 0, boltT: 8, lastCloud: -1, cloud0: 0, lastSwell: -1, swell0: 1, rainN: null, rain3: null, fl: null, glowP: null };
function rollWeather() {
  const r = mulberry((SV.day || 1) * 977 + 31), ev = [];
  // cada destino com seu jeito: Amazonas chove de tarde quase todo dia, Nordeste tem pancadas de manhã, Costa Verde trovoada de verão à tarde
  const n = AMZ ? (r() < 0.75 ? 1 + (r() < 0.3) : 0) : NE ? (r() < 0.5 ? 1 + (r() < 0.25) : 0) : (r() < 0.4 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const start = AMZ ? lerp(13, 17, r()) : NE ? (i === 0 ? lerp(6, 10, r()) : lerp(14, 18, r())) : lerp(13, 18, r());
    const peak = lerp(0.35, 1, r()), dur = lerp(0.7, 2.4, r());
    ev.push({ start, end: start + dur, peak, thunder: peak > 0.65 && r() < (NE ? 0.35 : 0.7) });
  }
  WX.ev = ev; WX.warned = false; WX.glowTip = false;
  // noite de plâncton brilhante (bioluminescência): só no mar, mais comum na água quente do Nordeste
  WX.glow = !AMZ && r() < (NE ? 0.5 : 0.35);
}
// texto da previsão para o boletim
function wxTxt() {
  const p = WX.ev.map(e => `${e.thunder ? 'trovoada' : e.peak > 0.7 ? 'chuva forte' : 'pancada de chuva'} por volta das ${Math.round(e.start)}h`);
  return (p.length ? p.join(', ') : 'sem chuva') + (WX.glow ? ' · à noite, plâncton brilhante' : '');
}
function wxTarget(h) {
  let rain = 0, storm = 0;
  for (const e of WX.ev) { const k = smooth(e.start - 0.3, e.start + 0.25, h) * (1 - smooth(e.end - 0.35, e.end, h)); rain = Math.max(rain, e.peak * k); if (e.thunder) storm = Math.max(storm, k); }
  if (COND.frontOn) { rain = Math.max(rain, 0.85); storm = Math.max(storm, 0.6); } // frente fria traz chuva forte
  return [rain, storm];
}
function setupWeather() {
  // chuva: riscos em volta da câmera
  const N = 900, pos = new Float32Array(N * 6);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  WX.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xc8d4e0, transparent: true, opacity: 0, depthWrite: false }));
  WX.lines.frustumCulled = false; WX.lines.visible = false; WX.drops = []; scene.add(WX.lines);
  for (let i = 0; i < N; i++) WX.drops.push([rand(-25, 25), rand(-2, 22), rand(-25, 25), rand(0.8, 1.2)]);
  // clarão do raio
  WX.fl = document.createElement('div'); WX.fl.style.cssText = 'position:fixed;inset:0;background:#e8f0ff;opacity:0;pointer-events:none;z-index:4';
  document.body.appendChild(WX.fl);
  // brilho do plâncton: pontos aditivos que acendem quando a água mexe
  const GN = 400, gp = new Float32Array(GN * 3).fill(9999), gc = new Float32Array(GN * 3);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gg.setAttribute('color', new THREE.BufferAttribute(gc, 3));
  WX.glowP = new THREE.Points(gg, new THREE.PointsMaterial({ size: 0.12, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  WX.glowP.frustumCulled = false; WX.glowList = []; scene.add(WX.glowP);
  rollWeather();
}
function glowAt(x, y, z, n, spread) {
  for (let i = 0; i < n; i++) { if (WX.glowList.length >= 400) WX.glowList.shift(); WX.glowList.push({ x: x + rand(-spread, spread), y: y + rand(-spread, spread), z: z + rand(-spread, spread), t: rand(0.8, 1.8), m: 1.8 }); }
}
function thunder(dist) {
  if (!AU.ctx) return; const d = dist * 0.003; // som chega depois do clarão
  setTimeout(() => { AU.burst(2.8, 140, 'lowpass', 0.55 / (1 + dist / 900)); AU.burst(1.6, 60, 'lowpass', 0.5 / (1 + dist / 900)); AU.burst(0.5, 900, 'bandpass', 0.12 / (1 + dist / 400)); }, d * 1000);
}
function rainSound(under) {
  const c = AU.ctx; if (!c || c.state !== 'running') return;
  if (!WX.rainN) {
    const s = c.createBufferSource(); s.buffer = AU.noiseBuf; s.loop = true;
    WX.rainF = c.createBiquadFilter(); WX.rainF.type = 'highpass'; WX.rainF.frequency.value = 2200;
    WX.rainG = c.createGain(); WX.rainG.gain.value = 0; s.connect(WX.rainF).connect(WX.rainG).connect(AU.master); s.start(); WX.rainN = s;
  }
  const t = c.currentTime;
  WX.rainF.type = under ? 'lowpass' : 'highpass'; WX.rainF.frequency.setTargetAtTime(under ? 700 : 2200, t, 0.2);
  WX.rainG.gain.setTargetAtTime(WX.rain * (under ? 0.05 : 0.16) * (started ? 1 : 0.5), t, 0.5);
}
function updateWeather(dt) {
  if (!WX.lines) return;
  if (WX.day !== SV.day) { WX.day = SV.day; rollWeather(); }
  const [tr, ts] = wxTarget(SV.tod || 12);
  WX.rain = lerp(WX.rain, tr, clamp(dt * 0.25, 0, 1)); WX.storm = lerp(WX.storm, ts, clamp(dt * 0.25, 0, 1));
  // céu fecha e mar cresce com a chuva (respeitando o que o dia e a frente fria já definiram)
  if (COND.cloud !== WX.lastCloud) WX.cloud0 = COND.cloud;
  COND.cloud = WX.lastCloud = Math.max(WX.cloud0, WX.rain * 0.92); CU.uCloud.value = COND.cloud;
  if (COND.swell !== WX.lastSwell) WX.swell0 = COND.swell;
  COND.swell = WX.lastSwell = WX.swell0 * (1 + WX.storm * 0.45); SWELL.k = COND.swell; CU.uSwell.value = COND.swell;
  const c = camera.position, under = camUnder;
  if (!under) { scene.fog.density *= 1 + WX.rain * 5; waterMat.uniforms.uFogD.value = scene.fog.density; }
  if (waterMat.uniforms.uRain) waterMat.uniforms.uRain.value = WX.rain;
  // riscos de chuva caindo inclinados pelo vento
  const on = WX.rain > 0.03 && !under; WX.lines.visible = on;
  if (on) {
    const a = WX.lines.geometry.attributes.position.array, wind = 2 + WX.storm * 4, L = 0.9;
    WX.drops.forEach((d, i) => {
      d[1] -= dt * 14 * d[3]; d[0] += dt * wind;
      if (d[1] < -1) { d[1] = rand(16, 22); d[0] = rand(-25, 25); d[2] = rand(-25, 25); }
      if (d[0] > 25) d[0] -= 50;
      const x = c.x + d[0], y = c.y + d[1] - 4, z = c.z + d[2], j = i * 6, show = i < 900 * WX.rain;
      a[j] = x; a[j + 1] = show ? y : -999; a[j + 2] = z; a[j + 3] = x - wind * 0.06; a[j + 4] = show ? y + L : -999; a[j + 5] = z;
    });
    WX.lines.geometry.attributes.position.needsUpdate = true; WX.lines.material.opacity = 0.25 + 0.3 * WX.rain;
  }
  // raios: clarão no céu e trovão atrasado pela distância
  WX.flash = Math.max(0, WX.flash - dt * 4);
  if (WX.storm > 0.3 && (WX.boltT -= dt) <= 0) {
    WX.boltT = rand(7, 22) / WX.storm; WX.flash = 1; const dist = rand(300, 3000); thunder(dist);
    if (!WX.warned && started) { WX.warned = true; toast('Trovoada! Raio cai no ponto mais alto: no mar aberto, o mais seguro é voltar para a marina.', 5, 'bad'); }
  }
  hemi.intensity += WX.flash * (under ? 0.4 : 2.2);
  WX.fl.style.opacity = (WX.flash * (under ? 0.08 : 0.35)).toFixed(3);
  rainSound(under);
  // plâncton brilhante: só à noite, acende com o movimento do mergulhador, dos peixes, do arpão e da lancha
  const night = DAY.amb < 0.3 && WX.glow;
  if (night) {
    if (P.mode === 'swim' && P.under) { const v = P.vel.length(); if (v > 0.15 && Math.random() < v * dt * 40) glowAt(P.pos.x, P.pos.y - 0.3, P.pos.z, 5, 0.6); }
    if (GUN.state === 'flying' && Math.random() < 0.8) glowAt(GUN.pos.x, GUN.pos.y, GUN.pos.z, 1, 0.08);
    if (P.mode === 'boat' && Math.abs(BOAT.speed) > 1.5 && Math.random() < dt * 25) { const h = BOAT.heading; glowAt(BOAT.pos.x - Math.sin(h) * 4, -0.25, BOAT.pos.z - Math.cos(h) * 4, 3, 1.0); }
    if ((WX.fT = (WX.fT || 0) - dt) <= 0) { WX.fT = 0.12; for (const f of FISHES) if (f.vis && f.alive && f.vel.lengthSq() > 1.2 && f.pos.distanceToSquared(c) < 225) glowAt(f.pos.x, f.pos.y, f.pos.z, 1, f.len * 0.3); }
    if (!WX.glowTip && P.mode === 'swim' && P.under) { WX.glowTip = true; toast('Noite de plâncton brilhante: a água acende quando alguma coisa se mexe!', 5, 'gold'); }
  }
  const ga = WX.glowP.geometry.attributes, gp = ga.position.array, gc = ga.color.array; gp.fill(9999);
  for (let i = WX.glowList.length - 1; i >= 0; i--) { const s = WX.glowList[i]; s.t -= dt; if (s.t <= 0) WX.glowList.splice(i, 1); }
  WX.glowList.forEach((s, i) => { const k = Math.min(1, s.t / s.m * 1.6); gp[i * 3] = s.x; gp[i * 3 + 1] = s.y; gp[i * 3 + 2] = s.z; gc[i * 3] = 0.15 * k; gc[i * 3 + 1] = 0.95 * k; gc[i * 3 + 2] = 0.85 * k; });
  ga.position.needsUpdate = ga.color.needsUpdate = true; WX.glowP.visible = WX.glowList.length > 0;
}
