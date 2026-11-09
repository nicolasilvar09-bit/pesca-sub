// ================= efeitos da Múmia Flamejante: olhos e frestas incandescentes, chaminhas entre as ataduras e brasas em volta =================
// leve para celular: brilho vem de uma textura (sem luz extra), chamas são poucos sprites somados, brasas são um único Points por personagem;
// só nos 4 mais próximos da câmera (até 60 m). Configurações > "Efeitos das skins" liga/desliga (vem desligado no gráfico Leve).
const SKFX = { k: 'm_soldier1_mumia', tex: {}, flameTex: null, emberTex: null, t: 0 };
if (SET.skinFx == null) SET.skinFx = SET.quality > 0;
(function skfxTex() {
  const L = new T.TextureLoader();
  for (const p of ['body', 'head']) SKFX.tex[p] = L.load(`assets/chars/${SKFX.k}_${p}_glow.png`);
  const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(16, 46, 1, 16, 40, 30); gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.25, 'rgba(255,170,40,0.95)'); gr.addColorStop(0.6, 'rgba(230,70,10,0.5)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(16, 2); g.bezierCurveTo(30, 26, 30, 44, 16, 62); g.bezierCurveTo(2, 44, 2, 26, 16, 2); g.fill();
  SKFX.flameTex = new T.CanvasTexture(c);
  const e = document.createElement('canvas'); e.width = e.height = 16; const h = e.getContext('2d'), er = h.createRadialGradient(8, 8, 0, 8, 8, 8); er.addColorStop(0, 'rgba(255,220,140,1)'); er.addColorStop(0.4, 'rgba(255,120,20,0.8)'); er.addColorStop(1, 'rgba(255,60,0,0)'); h.fillStyle = er; h.fillRect(0, 0, 16, 16);
  SKFX.emberTex = new T.CanvasTexture(e);
})();
// chamas do tronco e halos dos olhos: posição = osso + deslocamento na direção do personagem (direita, cima, frente), em metros, recalculada a cada quadro
const SKFX_PTS = [['Bip01_Spine2', 0.06, 0.02, 0.13, 1], ['Bip01_Spine2', -0.07, -0.1, 0.12, 0.8], ['Bip01_Spine2', 0, -0.02, -0.15, 1], ['Bip01_Spine2', -0.06, -0.15, -0.14, 0.8], ['Bip01_Spine2', -0.13, 0.12, 0.06, 0.7], ['Bip01_Spine', 0.03, -0.04, 0.13, 0.7]];
// nos membros as chamas vão presas direto no osso
const SKFX_BONES = [['Bip01_R_Forearm', 0.75], ['Bip01_L_Forearm', 0.75], ['Bip01_R_Calf', 0.7], ['Bip01_L_Thigh', 0.7]];
const SKFX_EYES = [['Bip01_Head', 0.024, 0.095, 0.1], ['Bip01_Head', -0.024, 0.095, 0.1]];
const _skv = new T.Vector3();
function skfxPlace(a, sp) { const [bn, r, u, f] = sp.userData.off, b = a.model.b[bn]; if (!b) return; b.getWorldPosition(_skv); const fx = -Math.sin(a.yaw), fz = -Math.cos(a.yaw); sp.position.set(_skv.x + fx * f - fz * r, _skv.y + u, _skv.z + fz * f + fx * r); }
function skfxBuild(a) {
  const m = a.model; if (!m || !m.human || m.av.k !== SKFX.k || m.skfx) return;
  for (const mt of m.mats) { const n = mt.name.toLowerCase(), p = /_body/.test(n) ? 'body' : /_head/.test(n) ? 'head' : null; if (!p) continue;
    mt.emissive = new T.Color(0xff6a10); mt.emissiveMap = SKFX.tex[p]; mt.emissiveIntensity = 1.4; mt.userData.skfx = 1; mt.userData.skp = p; mt.needsUpdate = true; }
  const fx = { flames: [], eyes: [], free: [] };
  const mk = (col) => new T.Sprite(new T.SpriteMaterial({ map: col ? SKFX.flameTex : SKFX.emberTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, color: col || 0xffa040 }));
  for (const [bn, r, u, f, sc] of SKFX_PTS) { const sp = mk(0xff7a24); sp.userData = { s: sc, ph: Math.random() * 10, k: 1, off: [bn, r, u, f] }; sp.center.set(0.5, 0.1); scene.add(sp); fx.flames.push(sp); fx.free.push(sp); }
  for (const [bn, sc] of SKFX_BONES) { const b = m.b[bn]; if (!b) continue; const sp = new T.Sprite(new T.SpriteMaterial({ map: SKFX.flameTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, color: 0xff7a24 })); sp.userData.s = sc; sp.userData.ph = Math.random() * 10; sp.center.set(0.5, 0.1); sp.userData.k = 1 / b.getWorldScale(new T.Vector3()).x; b.add(sp); fx.flames.push(sp); }
  for (const e of SKFX_EYES) { const sp = mk(0); sp.userData = { ph: Math.random() * 10, k: 1, off: e }; scene.add(sp); fx.eyes.push(sp); fx.free.push(sp); }
  // brasas: sobem em volta do corpo e recomeçam embaixo
  const n = 18, geo = new T.BufferGeometry(), pa = new Float32Array(n * 3); fx.emb = [];
  for (let i = 0; i < n; i++) fx.emb.push({ a: Math.random() * 6.28, r: 0.25 + Math.random() * 0.35, y: Math.random() * 2, v: 0.35 + Math.random() * 0.5 });
  geo.setAttribute('position', new T.BufferAttribute(pa, 3));
  fx.pts = new T.Points(geo, new T.PointsMaterial({ size: 0.07, map: SKFX.emberTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, color: 0xffb060 }));
  fx.pts.frustumCulled = false; scene.add(fx.pts);
  m.skfx = fx;
}
function skfxOn(m, on) { const fx = m.skfx; if (!fx) return; for (const s of fx.flames) s.visible = on; for (const s of fx.eyes) s.visible = on; fx.pts.visible = on; }
function skfxStep(dt) {
  SKFX.t += dt; const t = SKFX.t, cx = camera.position.x, cz = camera.position.z;
  const list = [...(G.phase === 'match' ? G.actors : []), ...(G.phase !== 'match' ? LOB.actors : [])].filter(a => a.model && a.model.human && a.model.av.k === SKFX.k);
  list.sort((p, q) => Math.hypot(p.x - cx, p.z - cz) - Math.hypot(q.x - cx, q.z - cz));
  list.forEach((a, i) => {
    skfxBuild(a); const m = a.model, fx = m.skfx; if (!fx) return;
    const on = SET.skinFx && a.alive !== false && i < 4 && Math.hypot(a.x - cx, a.z - cz) < 60 && m.g.visible !== false;
    const fl = 0.75 + 0.25 * Math.sin(t * 13 + a.id) * Math.sin(t * 7.3 + a.id * 2);
    for (const mt of m.mats) if (mt.userData.skfx) mt.emissiveIntensity = (mt.userData.skp === 'head' ? 1.8 : 0.7) * (SET.skinFx ? 0.75 + 0.35 * fl : 0.7); /* desligado: olhos ainda acesos, sem piscar */
    skfxOn(m, on); if (!on) return;
    for (const sp of fx.free) skfxPlace(a, sp);
    for (const s of fx.flames) { const k = s.userData.k, f = 0.7 + 0.3 * Math.sin(t * 17 + s.userData.ph) * Math.sin(t * 9.1 + s.userData.ph * 3); s.scale.set(0.08 * s.userData.s * k * (0.85 + 0.2 * f), 0.17 * s.userData.s * k * f, 1); s.material.opacity = 0.55 + 0.35 * f; }
    for (const s of fx.eyes) { const k = s.userData.k, f = 0.85 + 0.15 * Math.sin(t * 11 + s.userData.ph); s.scale.set(0.075 * k * f, 0.04 * k * f, 1); }
    const pa = fx.pts.geometry.attributes.position;
    fx.emb.forEach((e, j) => { e.y += e.v * dt; e.a += dt * 0.6; if (e.y > 2.2) { e.y = 0.2; e.a = Math.random() * 6.28; e.r = 0.25 + Math.random() * 0.35; } pa.setXYZ(j, a.x + Math.cos(e.a) * e.r, a.y + e.y, a.z + Math.sin(e.a) * e.r); });
    pa.needsUpdate = true;
  });
}
(function hookSkfx() {
  const base = gfxStep; gfxStep = function (dt, ...r) { const o = base.call(this, dt, ...r); skfxStep(dt); return o; };
  const rm = removeModel; removeModel = function (a) { if (a && a.model && a.model.skfx) { scene.remove(a.model.skfx.pts); for (const sp of a.model.skfx.free) scene.remove(sp); } return rm.apply(this, arguments); };
  const om = openMenu; openMenu = function (...q) { const r = om.apply(this, q);
    const box = document.querySelector('#menuP .box'), ref = $('sQ') && $('sQ').closest('label');
    if (box && ref && !$('sSkfx')) { const l = document.createElement('label'); l.innerHTML = 'Efeitos das skins (fogo) <input type="checkbox" id="sSkfx">'; ref.after(l); $('sSkfx').checked = !!SET.skinFx; $('sSkfx').onchange = e => { SET.skinFx = e.target.checked; saveSet(); }; }
    return r; };
})();
// treino com a Múmia: sem capacete, colete e mochila (para ver a skin inteira)
(function hookSkfxTrain() {
  if (typeof startTraining !== 'function') return;
  const base = startTraining;
  startTraining = function (...q) { const r = base.apply(this, q); const P = G.player, c = CHARS[SET.char];
    if (P && c && c.av === SKFX.k) { P.helm = null; P.vest = null; P.bagLv = 0; if (P.model) rebuildBody(P); } return r; };
})();
