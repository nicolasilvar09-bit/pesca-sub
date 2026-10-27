// ================= HUD / interface =================
const $ = id => document.getElementById(id);
function toast(msg, dur = 2.5, cls = '') {
  const box = $('toast'); while (box.children.length > 3) box.firstChild.remove();
  const d = document.createElement('div'); d.className = 't ' + cls; d.textContent = msg; box.appendChild(d);
  setTimeout(() => d.remove(), dur * 1000);
}
let started = false, paused = false, T = 0, sky;
const JOY = { id: null, x: 0, y: 0 }, LOOK = { id: null, x: 0, y: 0 };
function setupInput() {
  const joy = $('joy'), knob = $('knob');
  const joyMove = e => { const r = joy.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const R = r.width * 0.4, l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } JOY.x = dx / R; JOY.y = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`; };
  joy.addEventListener('pointerdown', e => { e.preventDefault(); JOY.id = e.pointerId; joyMove(e); AU.init(); });
  addEventListener('pointermove', e => {
    if (e.pointerId === JOY.id) joyMove(e);
    if (e.pointerId === LOOK.id) { IN.lookX += e.clientX - LOOK.x; IN.lookY += e.clientY - LOOK.y; LOOK.x = e.clientX; LOOK.y = e.clientY; }
  });
  const up = e => { if (e.pointerId === JOY.id) { JOY.id = null; JOY.x = JOY.y = 0; knob.style.transform = ''; } if (e.pointerId === LOOK.id) LOOK.id = null; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  window.__resetTouch = () => { JOY.id = null; JOY.x = JOY.y = 0; knob.style.transform = ''; LOOK.id = null; for (const k in IN.held) IN.held[k] = false; document.querySelectorAll('.b.on').forEach(b => b.classList.remove('on')); };
  addEventListener('blur', () => window.__resetTouch());
  renderer.domElement.addEventListener('pointerdown', e => { if (LOOK.id === null) { LOOK.id = e.pointerId; LOOK.x = e.clientX; LOOK.y = e.clientY; } AU.init(); });
  const BTN = { bFire: ['p', 'fire'], bArm: ['p', 'arm'], bPull: ['h', 'pull'], bUp: ['h', 'up'], bDive: ['p', 'dive'], bCtx: ['p', 'ctx'], bAnchor: ['p', 'anchor'], bJump: ['p', 'jump'], bMarina: ['p', 'marina'], bMap: ['p', 'map'], bView: ['p', 'view'], bShop: ['p', 'shop'] };
  for (const [id, [kind, name]] of Object.entries(BTN)) {
    const el = $(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AU.init(); if (kind === 'p') IN.pressed[name] = true; else IN.held[name] = true; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (_) { } });
    const rel = () => { if (kind === 'h') IN.held[name] = false; el.classList.remove('on'); };
    el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel); el.addEventListener('lostpointercapture', rel);
  }
  addEventListener('keydown', e => {
    if (e.repeat) return; IN.keys[e.code] = true;
    const m = { Space: 'fire', KeyR: 'arm', KeyQ: 'dive', KeyE: 'ctx', KeyM: 'map', KeyT: 'anchor', KeyV: 'view', KeyL: 'shop' }; if (m[e.code]) IN.pressed[m[e.code]] = true;
    if (e.code === 'KeyF') IN.held.pull = true; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') IN.held.up = true;
    if (e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', e => { IN.keys[e.code] = false; if (e.code === 'KeyF') IN.held.pull = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') IN.held.up = false; });
  addEventListener('contextmenu', e => e.preventDefault());
}
function readKeys(dt) {
  const k = IN.keys, kx = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), ky = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
  IN.jx = clamp(JOY.x + kx, -1, 1); IN.jy = clamp(JOY.y + ky, -1, 1);
  IN.lookX += ((k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0)) * 260 * dt; IN.lookY += ((k.ArrowDown ? 1 : 0) - (k.ArrowUp ? 1 : 0)) * 200 * dt;
}

// ---- mapa ----
let mapDrawn = false;
function drawMap() {
  const cv = $('mapCv'), g = cv.getContext('2d'), N = 240, img = g.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = WB.x0 + (i + 0.5) / N * (WB.x1 - WB.x0), z = WB.z0 + (j + 0.5) / N * (WB.z1 - WB.z0), h = H(x, z), o = (j * N + i) * 4;
    let c;
    if (h > 0) { const k = clamp(h / 60, 0, 1); c = [lerp(120, 60, k), lerp(150, 100, k), lerp(90, 70, k)]; if (h < 2) c = [215, 200, 160]; }
    else { const k = clamp(-h / 32, 0, 1); c = [lerp(150, 20, k), lerp(215, 80, k), lerp(225, 140, k)]; const m = murkAt(x, z); c = c.map((v, n) => lerp(v, [140, 130, 90][n], m * 0.6)); }
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = N; tmp.getContext('2d').putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(tmp, 0, 0, cv.width, cv.height);
  g.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 45, 0); g.lineTo(i * 45, 360); g.moveTo(0, i * 45); g.lineTo(360, i * 45); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = 'bold 11px system-ui'; g.fillText('N ↑', 8, 16); g.fillText('OCEANO ATLÂNTICO', 120, 24); g.fillText('ILHA GRANDE', 70, 160); g.fillText('ANGRA DOS REIS', 215, 352);
  const box = $('mapBox');
  SPOTS.forEach(s => {
    const m = document.createElement('div'); m.className = 'mk' + (s.type === 'marina' ? ' m' : '') + (mapU(s.x) > 70 ? ' l' : ''); m.dataset.id = s.id;
    m.style.left = mapU(s.x) + '%'; m.style.top = mapV(s.z) + '%';
    m.innerHTML = `<span>${s.name}</span>`; m.onclick = () => setDest(s.id); box.appendChild(m);
  });
  const list = $('spotList');
  list.innerHTML = SPOTS.map(s => `<div class="it"><div><div class="n">${s.name}</div><div class="d">${s.depth ? s.depth + ' · ' : ''}${s.desc}</div></div><div style="display:flex;gap:6px"><button class="btn" data-dest="${s.id}">ROTA</button><button class="btn gold" data-go="${s.id}">IR</button></div></div>`).join('');
  list.querySelectorAll('[data-dest]').forEach(b => b.onclick = () => setDest(b.dataset.dest));
  list.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goTo(b.dataset.go));
  mapDrawn = true;
}
function setDest(id) { SV.dest = id; save(); AU.click(); toast('Rota traçada: ' + spotById(id).name); closePanels(); }
function openMap() {
  if (!mapDrawn) drawMap();
  document.querySelectorAll('.mk').forEach(m => m.classList.toggle('sel', m.dataset.id === SV.dest));
  const b = $('meBoat'), ref = P.mode === 'boat' ? BOAT.pos : P.pos;
  b.style.zIndex = 3; b.style.left = `calc(${mapU(ref.x)}% - 7px)`; b.style.top = `calc(${mapV(ref.z)}% - 9px)`;
  document.querySelectorAll('[data-go]').forEach(g => { const s = spotById(g.dataset.go), d = Math.hypot(s.x - BOAT.pos.x, s.z - BOAT.pos.z), L = travelFuel(d); g.textContent = `IR · ${Math.ceil(L)} L`; g.disabled = P.mode !== 'boat' || COMP.on || d < 120 || SV.fuel < L; });
  b.style.transform = `rotate(${(Math.PI - BOAT.heading) * 180 / Math.PI}deg)`;
  $('mapPanel').classList.remove('hide'); paused = true;
}
function closePanels() { $('mapPanel').classList.add('hide'); $('marinaPanel').classList.add('hide'); paused = false; save(); }
$('mapClose').onclick = closePanels; $('mClose').onclick = closePanels;

// ---- HUD ----
let hudT = 0, lowWarned = false, beatT = 0;
const show = (id, v) => $(id).classList.toggle('hide', !v);
function nearMarina() { return Math.hypot(BOAT.pos.x - PIER.x, BOAT.pos.z - PIER.z1) < 42 && Math.abs(BOAT.speed) < 3; }
function aimOnFish() {
  if (P.mode !== 'swim' || !P.under || GUN.state !== 'ready' || !GUN.bands) return null;
  const o = camera.position, d = camFwd(_a), R = GUN.def.range * Math.sqrt(GUN.bands / GUN.def.bands);
  for (const f of FISHES) { if (!f.vis || f.state === 'dead') continue; _b.subVectors(f.pos, o); const t = _b.dot(d); if (t < 0 || t > R * 1.6) continue; if (_b.addScaledVector(d, -t).length() < f.radius + 0.05) return { f, ok: t <= R }; }
  return null;
}
function updateHUD(dt) {
  hudT -= dt; const swim = P.mode === 'swim';
  show('btns', true);
  ['bFire', 'bArm', 'bPull'].forEach(id => show(id, swim));
  show('bUp', swim && P.under); show('bDive', swim && !P.under);
  show('bAnchor', !swim); show('bJump', !swim && BOAT.anchored); show('bMarina', !swim && nearMarina());
  $('bAnchor').innerHTML = BOAT.anchored ? 'LEVANTAR<br>ÂNCORA' : 'ANCORAR';
  const ctx = $('bCtx');
  if (swim && !P.under && P.boatDist < 6) { ctx.textContent = 'SUBIR NO BARCO'; show('bCtx', true); }
  else if (!swim && SV.fuel <= 0 && !nearMarina()) { ctx.textContent = 'REBOQUE (R$ 150)'; show('bCtx', true); }
  else show('bCtx', false);
  show('cross', swim); show('bands', swim); show('bView', swim); show('bShop', !swim); show('compass', !COMP.on); show('fuelChip', true);
  const aim = aimOnFish(); $('cross').classList.toggle('ok', !!(aim && aim.ok));
  const al = $('aimLbl'); if (aim) { al.textContent = `${aim.f.sp.rare ? '★ RARO · ' : isTrophy(aim.f) ? '★ TROFÉU · ' : ''}${aim.f.sp.name} · ~${Math.round(aim.f.len * 100 / 5) * 5} cm${aim.ok ? '' : ' · longe'}`; al.classList.remove('hide'); } else al.classList.add('hide');
  const fighting = GUN.state === 'hooked' && GUN.fish && GUN.fish.fight > 0;
  show('fight', fighting); if (fighting) { $('fFill').style.width = clamp(GUN.fish.fight / GUN.fight0, 0, 1) * 100 + '%'; fightHUD(); }
  // máscara / alerta
  $('mask').style.opacity = swim && camUnder && !THIRD ? 1 : 0;
  const low = swim && P.under && P.o2 < 0.32;
  if (low) { beatT -= dt; if (beatT <= 0) { AU.beat(); beatT = 60 / P.bpm; $('warn').style.opacity = clamp((0.32 - P.o2) / 0.32 + 0.3, 0, 1); setTimeout(() => $('warn').style.opacity = 0, 220); } if (!lowWarned) { lowWarned = true; toast('SUBA! O fôlego está acabando.', 2.5, 'bad'); } }
  if (!P.under) lowWarned = false;
  if (hudT > 0) return; hudT = 0.1;
  const dep = swim ? Math.max(0, -P.pos.y) : 0;
  $('hDepth').innerHTML = dep.toFixed(1) + '<small>m</small>';
  const tt = P.under ? P.diveT : P.surfT; $('hTime').textContent = (P.under ? '' : 'Sup. ') + Math.floor(tt / 60) + ':' + String(Math.floor(tt % 60)).padStart(2, '0');
  $('hO2').textContent = Math.round(P.o2 * 100) + '%'; $('o2fill').style.width = clamp(P.o2, 0, 1) * 100 + '%'; $('o2bar').classList.toggle('low', P.o2 < 0.35);
  $('hBpm').textContent = Math.round(P.bpm); $('hMax').textContent = P.maxD.toFixed(1) + ' m';
  $('hMoney').textContent = fmtR(SV.money); $('money').style.color = SV.money < 0 ? 'var(--bad)' : '';
  const sk = P.stringer.reduce((s, f) => s + f.kg, 0), ck = SV.cooler.reduce((s, f) => s + f.kg, 0);
  $('hStr').textContent = `${P.stringer.length} · ${fmtKg(sk)} kg`; $('hCool').textContent = `${SV.cooler.length} · ${fmtKg(ck)} kg`;
  $('hFuel').textContent = Math.round(SV.fuel) + ' L'; $('hFuel').style.color = SV.fuel < 15 ? 'var(--bad)' : '';
  // bússola
  const d = spotById(SV.dest);
  if (d) {
    const ref = swim ? P.pos : BOAT.pos, dx = d.x - ref.x, dz = d.z - ref.z, dist = Math.hypot(dx, dz);
    const f = camFwd(_a); const rel = Math.atan2(dx, -dz) - Math.atan2(f.x, -f.z);
    $('cArr').style.transform = `rotate(${rel * 180 / Math.PI}deg)`;
    $('cTxt').textContent = `${d.name} · ${dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(1).replace('.', ',') + ' km'}`;
    if (swim) { $('cTxt').textContent = `Barco · ${Math.round(P.boatDist)} m`; const bx = BOAT.pos.x - P.pos.x, bz = BOAT.pos.z - P.pos.z; $('cArr').style.transform = `rotate(${(Math.atan2(bx, -bz) - Math.atan2(f.x, -f.z)) * 180 / Math.PI}deg)`; }
  }
  // elásticos
  const def = GUN.def; let pips = '';
  for (let i = 0; i < def.bands; i++) { const ld = i === GUN.bands && GUN.loadT > 0; pips += `<span class="pip ${i < GUN.bands ? 'on' : ld ? 'ld' : ''}" style="--p:${ld ? Math.round((1 - GUN.loadT / (def.load * (P.under ? 1.35 : 1))) * 100) : 0}%"></span>`; }
  $('bands').innerHTML = `${def.name} ${pips}${GUN.state !== 'ready' ? '<br><b style="color:#ffb020">arpão fora, puxe a linha</b>' : ''}`;
}

// ================= loop principal =================
const MURKC = new THREE.Color(0.25, 0.28, 0.15), _col = new THREE.Color();
let lastUnder = null;
function ctxAction() {
  if (P.mode === 'swim') { if (!P.under && P.boatDist < 6) climbBoat(); return; }
  if (SV.fuel <= 0 && !nearMarina()) { SV.money -= 150; SV.fuel = 12; BOAT.pos.set(PIER.x + 14, 0, PIER.z1 - 6); BOAT.heading = Math.PI; BOAT.speed = 0; BOAT.anchored = false; toast('Rebocado até a marina. R$ 150 e 12 L de cortesia.', 4); save(); return; }
  if (nearMarina()) { openMarina(); return; }
  if (BOAT.anchored) jumpIn(); else toggleAnchor();
}
function step(dt) {
  dt *= timeScale(dt);
  if (took('map')) { openMap(); return; }
  if (took('shop')) { if (P.mode === 'boat') openShop(nearMarina()); return; }
  if (took('marina') && P.mode === 'boat' && nearMarina()) { openMarina(); return; }
  if (took('ctx')) ctxAction();
  if (took('anchor') && P.mode === 'boat') toggleAnchor();
  if (took('jump') && P.mode === 'boat') jumpIn();
  if (took('view')) { THIRD = !THIRD; toast(THIRD ? 'Vista em 3ª pessoa' : 'Vista em 1ª pessoa (mira de precisão)'); }
  if (took('fire')) gunFire();
  if (took('arm')) gunArm();
  updateBoat(dt, T);
  if (P.mode === 'swim') { updateSwim(dt, T); if (THIRD) thirdPersonCam(T); }
  else { took('dive'); diveBuoy.visible = false; diveLine.visible = false; P.pos.copy(BOAT.pos); P.under = false; P.o2 = Math.min(1, P.o2 + dt / (maxBreath() * 0.85)); P.bpm = lerp(P.bpm, 70, dt * 0.5); P.surfT += dt; P.still = 0; }
  updateDiver(dt, T);
  updateGun(dt);
  updateFishes(dt, performance.now() / 1000);
  updateComp(dt, T); updateLight(); updateRare(dt);
  applyShake(dt);
}
function updateEnv(dt) {
  const c = camera.position, sY = waveH(c.x, c.z, T);
  camUnder = c.y < sY - 0.02; camMurk = murkAt(c.x, c.z); updateTerrain(c);
  if (camUnder) {
    const k = clamp(-c.y / 28, 0, 1);
    _col.setRGB(lerp(0.10, 0.02, k), lerp(0.42, 0.12, k), lerp(0.48, 0.19, k)).lerp(MURKC, camMurk);
    scene.fog.color.copy(_col); scene.fog.density = lerp(0.042, 0.15, camMurk);
    scene.background = scene.fog.color; sky.visible = false; sun.intensity = lerp(1.3, 0.7, k) * (1 - camMurk * 0.4); hemi.intensity = 0.65;
  } else { scene.fog.color.copy(HAZE); scene.fog.density = 0.0006; scene.background = null; sky.visible = true; sun.intensity = 1.7; hemi.intensity = 0.75; }
  waterMat.uniforms.uUnder.value = camUnder ? 1 : 0; waterMat.uniforms.uFogC.value.copy(scene.fog.color); waterMat.uniforms.uFogD.value = scene.fog.density;
  water.position.set(c.x, 0, c.z); sky.position.copy(c);
  const base = camera.aspect < 1 ? clamp(2 * Math.atan(Math.tan(37 * Math.PI / 180) / camera.aspect) * 180 / Math.PI, 70, 100) : 70;
  const fov = (camUnder ? base * 0.84 : base) + (P.mode === 'swim' && camUnder ? maskNow().fov : 0); if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = lerp(camera.fov, fov, clamp(dt * 6, 0, 1)); camera.updateProjectionMatrix(); }
  if (lastUnder !== camUnder) { AU.setEnv(camUnder); lastUnder = camUnder; }
  BUOYS.forEach((b, i) => { b.position.y = waveH(b.position.x, b.position.z, T) - 0.15; b.rotation.set(Math.sin(T * 1.2 + i) * 0.12, i, Math.cos(T + i) * 0.1); });
  updateFX(dt, camUnder, camMurk, T);
  poolsBegin(); drawFishes(); updateLife(dt, T); poolsEnd();
}
let lastT = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now(); const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; T += dt; CU.uTime.value = T;
  readKeys(dt);
  if (!started) {
    const a = T * 0.06; camera.position.set(BOAT.pos.x + Math.sin(a) * 26, 7 + Math.sin(T * 0.2) * 1.5, BOAT.pos.z + Math.cos(a) * 26); camera.lookAt(BOAT.pos.x, 1.5, BOAT.pos.z);
    updateBoat(dt, T); camera.position.set(BOAT.pos.x + Math.sin(a) * 26, 7, BOAT.pos.z + Math.cos(a) * 26); camera.lookAt(BOAT.pos.x, 1.5, BOAT.pos.z);
    updateFishes(dt, now / 1000);
  } else if (!paused && !window.__freeze) step(dt);
  IN.lookX = 0; IN.lookY = 0;
  updateEnv(dt);
  if (started) updateHUD(dt);
  renderer.render(scene, camera);
}
function startGame() {
  AU.init(); started = true; $('menu').classList.add('hide'); $('hud').classList.remove('hide');
  if (innerHeight > innerWidth) toast('Dica: na horizontal o jogo fica melhor.', 4);
  try { const d = document.documentElement; if (d.requestFullscreen && matchMedia('(pointer:coarse)').matches) d.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } catch (e) { }
  BOAT.camYaw = 0; camera.position.set(BOAT.pos.x, 6, BOAT.pos.z + 12);
  toast('Joystick: acelera e vira a lancha. Siga a seta laranja até o ponto.', 5);
  toast('Toque MAPA para escolher outro destino.', 5);
  const D = ensureDaily(); if (D.list.some(m => !m.done)) toast(`Missões do dia: ${D.list.filter(m => !m.done).length} abertas (LOJA › Missões).`, 5);
}
function init() {
  loadSave();
  initRenderer(); sky = buildSky(); buildTerrain(); buildWater(); buildRocksAndDecor(); buildLand(); buildFX();
  DIVER = buildDiver(true); buildBoat(); buildDiveBuoy(); buildGun(gunById(SV.gun) || GUNS[0]); spawnAll(); buildLife(); initExtra();
  BOAT.pos.set(PIER.x + 14, 0, PIER.z1 - 6);
  setupInput();
  $('playBtn').onclick = startGame;
  window.__G = { P, BOAT, GUN, FISHES, SV, SPOTS, startGame, step, camera, scene, H, T: () => T, fire: gunFire, hold: v => { IN.held.pull = v; }, equip: id => { SV.gun = id; buildGun(gunById(id)); } };
  loop();
}
