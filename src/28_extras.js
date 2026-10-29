// ================= extras: sonar, GPS com pontos próprios, engodo e flasher, licença com fiscalização e rancho com troféus =================
const SONAR_PRICE = 1800, GPS_PRICE = 1200, FLASH_PRICE = 350, CHUM_PRICE = 45, LIC_PRICE = 400, LIC_DAYS = 60, RANCHO_PRICE = 6000, MOUNT_PRICE = 150;

// ---------- GPS: pontos marcados pelo jogador (valem como destino no mapa) ----------
const myWps = () => (SV.wps || []).filter(w => (w.region || 'cv') === REGION);
function wpById(id) {
  if (typeof id !== 'string' || !id.startsWith('wp:')) return null;
  const w = (SV.wps || []).find(w => 'wp:' + w.id === id && (w.region || 'cv') === REGION);
  return w ? { id, name: '📍 ' + w.n, x: w.x, z: w.z, r: 20, wp: true } : null;
}
function markWp() {
  if (!SV.gps) return;
  SV.wps = SV.wps || []; if (myWps().length >= 12) { toast('O GPS guarda até 12 pontos por destino. Apague algum no mapa.', 3, 'bad'); return; }
  const n = (SV.wpN = (SV.wpN || 0) + 1), depth = -H(BOAT.pos.x, BOAT.pos.z);
  SV.wps.push({ id: n.toString(36) + Date.now().toString(36).slice(-3), n: `Ponto ${n} · ${Math.max(0, Math.round(depth))} m`, x: Math.round(BOAT.pos.x), z: Math.round(BOAT.pos.z), region: REGION });
  save(); AU.coin(); toast(`GPS: "Ponto ${n}" marcado (${Math.round(depth)} m de fundo). Ele aparece no mapa.`, 3, 'gold');
}
// marcadores e lista dos pontos no mapa (refeitos sempre que o mapa abre)
function drawWps() {
  document.querySelectorAll('.mk.wpm').forEach(m => m.remove());
  const box = $('mapBox');
  for (const w of myWps()) {
    const m = document.createElement('div'); m.className = 'mk wpm' + (mapU(w.x) > 70 ? ' l' : ''); m.dataset.id = 'wp:' + w.id;
    m.style.left = mapU(w.x) + '%'; m.style.top = mapV(w.z) + '%'; m.style.filter = 'hue-rotate(160deg)';
    m.innerHTML = `<span>${w.n.split(' · ')[0]}</span>`; m.onclick = () => setDest('wp:' + w.id); box.appendChild(m);
  }
  let L = $('wpList'); if (!L) { L = document.createElement('div'); L.id = 'wpList'; $('spotList').before(L); }
  const ws = myWps();
  L.innerHTML = !SV.gps ? '' : `<div class="n" style="margin:4px 0">📍 Seus pontos no GPS (${ws.length})</div>` + (ws.length ? ws.map(w => `<div class="it"><div><div class="n">${w.n}</div></div><div style="display:flex;gap:6px"><button class="btn" data-dest="wp:${w.id}">ROTA</button><button class="btn gold" data-go="wp:${w.id}">IR</button><button class="btn alt" data-wpdel="${w.id}">✕</button></div></div>`).join('') : '<div class="it"><div class="d">Na lancha, toque MARCAR (tecla K) para salvar o ponto onde você está.</div></div>');
  L.querySelectorAll('[data-dest]').forEach(b => b.onclick = () => setDest(b.dataset.dest));
  L.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goTo(b.dataset.go));
  L.querySelectorAll('[data-wpdel]').forEach(b => b.onclick = () => { SV.wps = SV.wps.filter(w => w.id !== b.dataset.wpdel); if (SV.dest === 'wp:' + b.dataset.wpdel) SV.dest = SPOTS[1].id; save(); drawWps(); });
}

// ---------- sonar: fundo e peixes embaixo do barco, rolando da direita para a esquerda ----------
const SON = { cv: null, g: null, t: 0, col: 0 };
function updateSonar(dt) {
  const on = SV.sonar && P.mode === 'boat' && started;
  if (!SON.cv) { const c = SON.cv = document.createElement('canvas'); c.width = 150; c.height = 96; c.style.cssText = 'position:fixed;right:10px;top:68px;width:150px;height:96px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:#021018;pointer-events:none;z-index:2'; document.body.appendChild(c); SON.g = c.getContext('2d'); SON.g.fillStyle = '#021018'; SON.g.fillRect(0, 0, 150, 96); }
  SON.cv.style.display = on ? 'block' : 'none'; if (!on || (SON.t -= dt) > 0) return; SON.t = 0.12;
  const g = SON.g, bx = BOAT.pos.x, bz = BOAT.pos.z, depth = Math.max(0.5, -H(bx, bz)), maxD = Math.max(10, Math.ceil(depth / 10) * 10 + 5), yOf = d => 14 + d / maxD * 80;
  // rola uma coluna
  const img = g.getImageData(1, 14, 149, 82); g.putImageData(img, 0, 14);
  g.fillStyle = '#04263a'; g.fillRect(149, 14, 1, 82);
  const yb = yOf(depth); g.fillStyle = '#d8a040'; g.fillRect(149, yb, 1, 2); g.fillStyle = '#7a3a18'; g.fillRect(149, yb + 2, 1, 96 - yb);
  let n = 0;
  for (const f of FISHES) { if (!f.alive) continue; const d = Math.hypot(f.pos.x - bx, f.pos.z - bz); if (d > 18) continue; n++; const y = yOf(-f.pos.y), s = Math.max(1, Math.min(4, f.len * 3)); g.fillStyle = f.len > 0.6 ? '#ff5050' : '#ffe060'; g.fillRect(149 - (d < 6 ? 0 : 1), y - s / 2, 1 + (d < 6 ? 1 : 0), s); }
  for (const sc of SCHOOLS) if (Math.hypot(sc.c.x - bx, sc.c.z - bz) < 20) { g.fillStyle = '#40e0ff'; for (let k = 0; k < 6; k++) g.fillRect(149, yOf(-sc.c.y) + rand(-3, 3), 1, 1); }
  // cabeçalho
  g.fillStyle = '#021018'; g.fillRect(0, 0, 150, 14); g.fillStyle = '#9ff'; g.font = 'bold 10px system-ui';
  g.fillText(`SONAR  ${depth.toFixed(1).replace('.', ',')} m`, 5, 10); g.fillStyle = n ? '#ffe060' : '#6aa'; g.fillText(n ? `🐟 ${n}` : '—', 118, 10);
}

// ---------- engodo (isca moída) e flasher ----------
let chumN = 0;
function throwChum() {
  if (!(SV.chum > 0) || P.mode !== 'swim') return;
  SV.chum--; save(); AU.bubbles(10); spawnBubbles(P.pos, 20, 0.6); spawnScales(_t1.copy(P.pos).add(_t2.set(0, -0.3, 0)), 40);
  // os peixes em volta vêm ver
  for (const f of FISHES) if (f.alive && (f.state === 'wander' || f.state === 'alert') && f.pos.distanceTo(P.pos) < 30 && !f.sp.protected) { f.state = 'curious'; f.t = rand(10, 18); }
  // e chega um grupo novo atrás do cheiro
  const opts = AMZ ? ['pacu', 'tambaqui', 'piranha', 'matrinxa', 'aracu'] : NE ? ['guaiuba', 'ariaco', 'saramunete', 'sargo', 'xareu'] : ['sargo', 'salema', 'cocoroca', 'marimba', 'xareu', 'canhanha'];
  const z = { id: 'chum' + (++chumN), x: P.pos.x, z: P.pos.z, r: 12, zone: 'chum' }; ZONES.push(z);
  const k = pick(opts); spawnGroup(z, k, Math.round(rand(3, 7)));
  toast(`Engodo na água! O cheiro atrai peixe${AMZ && k === 'piranha' ? '... e piranha!' : '.'} Fique parado. (${SV.chum} restante${SV.chum === 1 ? '' : 's'})`, 3.5, 'gold');
}

// ---------- licença de pesca e fiscalização ----------
const licOk = () => (SV.licUntil || 0) >= (SV.day || 1);
const FISC = { m: null, t: 0, phase: null, chk: 20 };
function startFisc() {
  if (!FISC.m) { FISC.m = buildBoatModel(1, { name: 'fisc', top: [0.92, 0.93, 0.94], stripe: [0.95, 0.45, 0.05] }); scene.add(FISC.m); }
  const ref = P.mode === 'boat' ? BOAT.pos : P.pos, a = rand(0, TAU);
  FISC.from = new V3(ref.x + Math.cos(a) * 70, 0, ref.z + Math.sin(a) * 70); FISC.to = new V3(ref.x + Math.cos(a) * 9, 0, ref.z + Math.sin(a) * 9);
  FISC.m.position.copy(FISC.from); FISC.m.visible = true; FISC.phase = 'in'; FISC.t = 0; SV.inspDay = SV.day;
  toast('🚤 Barco da fiscalização ambiental se aproximando para conferir a licença e o pescado...', 4);
}
function updateFisc(dt, t) {
  if (FISC.phase) {
    FISC.t += dt; const m = FISC.m;
    if (FISC.phase === 'in') { const k = smooth(0, 10, FISC.t); m.position.lerpVectors(FISC.from, FISC.to, k); if (FISC.t > 10) { FISC.phase = 'chk'; FISC.t = 0; inspect(); } }
    else if (FISC.phase === 'chk') { if (FISC.t > 5) { FISC.phase = 'out'; FISC.t = 0; } }
    else { const k = smooth(0, 10, FISC.t); m.position.lerpVectors(FISC.to, FISC.from, k); if (FISC.t > 10) { FISC.phase = null; m.visible = false; } }
    const dir = FISC.phase === 'out' ? _t1.subVectors(FISC.from, FISC.to) : _t1.subVectors(FISC.to, FISC.from);
    m.position.y = waveH(m.position.x, m.position.z, t); m.rotation.set(0, Math.atan2(dir.x, dir.z), 0, 'YXZ');
    const pl = m.userData.pilot; if (pl) pl.forEach(o => o.visible = true);
    return;
  }
  if ((FISC.chk -= dt) > 0) return; FISC.chk = 20;
  if (SV.inspDay === SV.day || DAY.amb < 0.3 || COMP.on || P.mode === 'boat' && nearMarina()) return;
  const ref = P.mode === 'boat' ? BOAT.pos : P.pos, atSpot = SPOTS.some(s => s.r && Math.hypot(s.x - ref.x, s.z - ref.z) < 160);
  if (atSpot && Math.random() < 0.05) startFisc();
}
function inspect() {
  if (licOk()) { toast('✅ Fiscalização: licença de pesca em dia e pescado dentro da medida. Bom mergulho!', 4, 'gold'); return; }
  const lost = P.stringer.length; SV.money -= 400; P.stringer = [];
  toast(`❌ Fiscalização: pescando sem licença! Multa de R$ 400${lost ? ` e ${lost} peixe(s) da fieira apreendidos` : ''}. Compre a licença na loja (aba Extras).`, 7, 'bad'); AU.bad(); save();
}

// ---------- rancho do pescador (Costa Verde, ao lado da marina) com parede de troféus ----------
const RANCH = { g: null, wall: null };
function ranchPos() { const x = PIER.x - 46, z = PIER.z0 + 20; return { x, z, y: H(x, z) }; }
function buildRancho() {
  if (REGION !== 'cv' || !SV.rancho) return;
  if (RANCH.g) scene.remove(RANCH.g);
  const p = ranchPos(), g = new THREE.Group(); g.position.set(p.x, p.y - 0.2, p.z);
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a5a34 }), dark = new THREE.MeshLambertMaterial({ color: 0x5a3a22 }), roofM = new THREE.MeshLambertMaterial({ color: 0x6a3a26 }), white = new THREE.MeshLambertMaterial({ color: 0xece4d4 });
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  box(9, 0.3, 8, 0, 0.15, 0, dark);                // deck
  box(8, 3.2, 5.5, 0, 1.9, 1, wood);               // casa
  box(1.1, 2.1, 0.08, 1.8, 1.35, -1.78, dark);     // porta
  for (const x of [-2.6, 3.4]) box(1.1, 0.9, 0.08, x, 2.1, -1.78, white); // janelas
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 2.4, 4), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.82); roof.position.set(0, 4.7, 0.6); g.add(roof);
  for (const x of [-4.2, 4.2]) box(0.18, 3, 0.18, x, 1.6, -3.6, dark); box(9, 0.18, 2.4, 0, 3.1, -2.6, roofM); // varanda
  // placa
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c2 = cv.getContext('2d'); c2.fillStyle = '#3a2412'; c2.fillRect(0, 0, 256, 64); c2.fillStyle = '#f2d8a0'; c2.font = 'bold 30px system-ui'; c2.textAlign = 'center'; c2.fillText('RANCHO DO ' + (SV.onName || 'PESCADOR').toUpperCase().slice(0, 10), 128, 42);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sign.position.set(0, 3.0, -3.75); sign.rotation.y = Math.PI; g.add(sign);
  // parede de troféus: peixes empalhados em placas de madeira
  const wall = new THREE.Group(); g.add(wall); RANCH.wall = wall;
  (SV.mounted || []).slice(0, 9).forEach((t, i) => {
    const sp = SPECIES[t.key]; if (!sp) return;
    // grade 3 x 3 entre a porta e as janelas; peixe de lado, cabeça para a direita
    const x = -1.3 + (i % 3) * 1.1, y = 2.35 - Math.floor(i / 3) * 0.68;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.6, 0.06), dark); plank.position.set(x, y, -1.8); wall.add(plank);
    const fm = new THREE.Mesh(fishGeo(SHAPES[sp.shape], true), new THREE.MeshStandardMaterial({ map: fishTex(t.key), roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }));
    fm.scale.setScalar(0.8 + 0.25 * smooth(0.3, 1.2, t.len || 0.5)); fm.position.set(x - 0.05, y, -1.9); wall.add(fm);
  });
  scene.add(RANCH.g = g);
}
function ranchoHTML(at) {
  if (REGION !== 'cv') return '<div class="it"><div class="d">Seu rancho fica na Costa Verde, ao lado da Marina Balneário.</div></div>';
  if (!SV.rancho) return `<div class="it"><div style="flex:1"><div class="n">🏠 Rancho do pescador</div><div class="d">Casa de madeira ao lado da marina: parede de troféus com seus maiores peixes empalhados, freezer para o pescado não estragar e cama para dormir de graça e acordar descansado (+5 s de fôlego no dia).</div></div>${buyBtn('id="buyRancho"', RANCHO_PRICE)}</div>`;
  const best = Object.keys(SV.best || {}).filter(k => SPECIES[k] && !SPECIES[k].protected && !(SV.mounted || []).some(m => m.key === k)).sort((a, b) => SV.best[b] - SV.best[a]);
  let h = `<div class="it" style="margin-bottom:8px"><div><div class="n">🏠 Seu rancho</div><div class="d">Fica ao lado da marina. ${at ? '' : 'Freezer e cama só quando você estiver na marina.'}</div></div></div><div class="list">`;
  h += `<div class="it"><div><div class="n">🧊 Freezer</div><div class="d">Congela o pescado da caixa térmica: ele volta a ficar fresco e não estraga mais.</div></div><button class="btn" id="ranchFreeze" ${at && SV.cooler.length ? '' : 'disabled'}>CONGELAR</button></div>`;
  h += `<div class="it"><div><div class="n">🛏️ Dormir no rancho</div><div class="d">Dorme até as 6h sem pagar pousada e acorda descansado: +5 s de fôlego no dia seguinte.</div></div><button class="btn gold" id="ranchSleep" ${at ? '' : 'disabled'}>DORMIR</button></div>`;
  h += `<div class="n" style="margin:8px 0 4px">🏆 Parede de troféus (${(SV.mounted || []).length}/9)</div>` + (SV.mounted || []).map(m => `<div class="it"><div><div class="n">${SPECIES[m.key].name}</div><div class="d">${fmtKg(m.kg)} kg · empalhado</div></div></div>`).join('');
  if ((SV.mounted || []).length < 9) h += best.length ? best.slice(0, 8).map(k => `<div class="it"><div><div class="n">${SPECIES[k].name}</div><div class="d">Recorde: ${fmtKg(SV.best[k])} kg</div></div>${buyBtn(`data-mount="${k}"`, MOUNT_PRICE, 'EMPALHAR ' + fmtR(MOUNT_PRICE))}</div>`).join('') : '<div class="it"><div class="d">Pesque peixes para ter recordes para empalhar.</div></div>';
  return h + '</div>';
}

// ---------- aba Extras ----------
function extrasHTML(at) {
  const own = '<span class="d">TEM</span>';
  let h = '<div class="list">';
  h += `<div class="it"><div style="flex:1"><div class="n">📡 Sonar</div><div class="d">Na lancha, mostra a profundidade e os peixes embaixo do barco (amarelo pequeno, vermelho grande, azul cardume).</div></div>${SV.sonar ? own : buyBtn('id="buySonar"', SONAR_PRICE)}</div>`;
  h += `<div class="it"><div style="flex:1"><div class="n">🛰️ GPS</div><div class="d">Botão MARCAR na lancha salva o ponto onde você está. Seus pontos aparecem no mapa para traçar rota ou ir direto.</div></div>${SV.gps ? own : buyBtn('id="buyGps"', GPS_PRICE)}</div>`;
  h += `<div class="it"><div style="flex:1"><div class="n">✨ Flasher</div><div class="d">Placa refletiva presa ao cinto: na espera, o peixe fica curioso com mais frequência.</div></div>${SV.flasher ? own : buyBtn('id="buyFlash"', FLASH_PRICE)}</div>`;
  h += `<div class="it"><div style="flex:1"><div class="n">🪣 Engodo ${AMZ ? '(farelo e frutas)' : '(sardinha moída)'} · você tem ${SV.chum || 0}</div><div class="d">Botão ENGODO embaixo d'água: o cheiro atrai os peixes em volta e chama um cardume novo.${AMZ ? ' Atenção: atrai piranha.' : ''}</div></div>${buyBtn('id="buyChum"', CHUM_PRICE, '+1 · ' + fmtR(CHUM_PRICE))}</div>`;
  const left = (SV.licUntil || 0) - (SV.day || 1);
  h += `<div class="it"><div style="flex:1"><div class="n">📜 Licença de pesca amadora ${licOk() ? `· <b style="color:var(--acc)">válida por mais ${left + 1} dia(s)</b>` : '· <b style="color:var(--bad)">VENCIDA</b>'}</div><div class="d">Vale ${LIC_DAYS} dias de jogo. A fiscalização passa nos pontos de pesca: sem licença, multa de R$ 400 e o peixe da fieira é apreendido. Na vida real, a licença de pesca amadora é obrigatória.</div></div>${buyBtn('id="buyLic"', LIC_PRICE, licOk() ? 'RENOVAR ' + fmtR(LIC_PRICE) : fmtR(LIC_PRICE))}</div>`;
  return h + '</div><div style="margin-top:10px">' + ranchoHTML(at) + '</div>';
}
function bindExtras(at, pay) {
  const B = $('mBody'), q = id => $(id), done = () => { save(); renderShop(); };
  if (q('buySonar')) q('buySonar').onclick = () => { if (pay(SONAR_PRICE)) { SV.sonar = true; toast('Sonar instalado na lancha.', 3, 'gold'); } done(); };
  if (q('buyGps')) q('buyGps').onclick = () => { if (pay(GPS_PRICE)) { SV.gps = true; toast('GPS instalado: toque MARCAR na lancha.', 3, 'gold'); } done(); };
  if (q('buyFlash')) q('buyFlash').onclick = () => { if (pay(FLASH_PRICE)) SV.flasher = true; done(); };
  if (q('buyChum')) q('buyChum').onclick = () => { if (pay(CHUM_PRICE)) SV.chum = (SV.chum || 0) + 1; done(); };
  if (q('buyLic')) q('buyLic').onclick = () => { if (pay(LIC_PRICE)) { SV.licUntil = Math.max(SV.licUntil || 0, (SV.day || 1) - 1) + LIC_DAYS; toast(`Licença válida até o dia ${SV.licUntil}.`, 3, 'gold'); } done(); };
  if (q('buyRancho')) q('buyRancho').onclick = () => { if (pay(RANCHO_PRICE)) { SV.rancho = true; buildRancho(); toast('O rancho é seu! Fica ao lado da marina.', 4, 'gold'); } done(); };
  if (q('ranchFreeze')) q('ranchFreeze').onclick = () => { SV.cooler.forEach(f => { f.at = nowH(); f.ice = true; f.frozen = true; }); toast('Pescado congelado no freezer do rancho.', 3, 'gold'); done(); };
  if (q('ranchSleep')) q('ranchSleep').onclick = () => { waitUntil(6); SV.restDay = SV.day; P.fatigue = 0; toast('Dormiu no rancho e acordou descansado: +5 s de fôlego hoje.', 4, 'gold'); done(); };
  B.querySelectorAll('[data-mount]').forEach(b => b.onclick = () => { const k = b.dataset.mount; if (pay(MOUNT_PRICE)) { SV.mounted = [...(SV.mounted || []), { key: k, kg: SV.best[k], len: Math.cbrt(SV.best[k] / SPECIES[k].k) }]; buildRancho(); toast(`${SPECIES[k].name} empalhado na parede do rancho!`, 3, 'gold'); } done(); });
}

function setupExtras() {
  if (SV.licUntil == null) { SV.licUntil = (SV.day || 1) + 5; setTimeout(() => toast('Novidade: licença de pesca! Você ganhou 5 dias de licença provisória. Renove na LOJA › Extras.', 6), 4000); }
  buildRancho();
}
function updateExtras(dt, t) {
  show('bWp', P.mode === 'boat' && !!SV.gps); show('bChum', P.mode === 'swim' && (SV.chum || 0) > 0);
  if (took('wp') && P.mode === 'boat') markWp();
  if (took('chum')) throwChum();
  updateSonar(dt); updateFisc(dt, t);
}
