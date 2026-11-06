// ================= cenário do lobby: acampamento militar ao pôr do sol (céu de foto do Poly Haven, caixas, barris, postes acesos, poeira no ar) =================
// céu: "The Sky is on Fire" (Poly Haven, CC0), só o pedaço que aparece atrás do personagem, em alta resolução
// objetos: Wooden/Old Military Crate, Metal Jerrycan, Ammo Box, Barrel 02, Street Lamp 01 (Poly Haven, CC0); piso: Concrete034 (ambientCG, CC0)
const LSET = { g: new T.Group(), ready: false, lights: [], fog: new T.Color(0xe7a98f) };
scene.add(LSET.g); LSET.g.visible = false;
(function buildLobbySet() {
  const fx = Math.cos(LOB.yaw), fz = Math.sin(LOB.yaw), rx = -fz, rz = fx;
  const at = (side, back, y) => new T.Vector3(LOB.x + rx * side + fx * back, LOB.y + (y || 0), LOB.z + rz * side + fz * back);
  const face = Math.atan2(rx, rz); /* gira os objetos junto com o palco */
  const TL = new T.TextureLoader();
  // céu: pedaço de esfera que acompanha a câmera (como o céu normal), centrado para onde a câmera olha
  const sky = TL.load('assets/lobby/sky.jpg', t => { t.encoding = T.sRGBEncoding; });
  sky.wrapS = T.RepeatWrapping; sky.repeat.x = -1; sky.offset.x = 1; /* visto por dentro: desespelha */
  const dome = new T.Mesh(new T.SphereGeometry(2000, 48, 16, -55 * Math.PI / 180, 110 * Math.PI / 180, 58 * Math.PI / 180, 40 * Math.PI / 180), new T.MeshBasicMaterial({ map: sky, side: T.BackSide, fog: false, depthWrite: false }));
  dome.rotation.y = Math.atan2(fz, -fx); dome.renderOrder = -9; dome.frustumCulled = false; LSET.dome = dome; LSET.g.add(dome);
  // palco: concreto de foto com faixa de perigo amarela e preta
  const floor = TL.load('assets/lobby/floor.jpg', t => { t.encoding = T.sRGBEncoding; }); floor.wrapS = floor.wrapT = T.RepeatWrapping; floor.repeat.set(4, 6); floor.anisotropy = 8;
  const gm = new T.MeshStandardMaterial({ color: 0x5a5753, roughness: 0.9 });
  const slab = new T.Mesh(new T.BoxGeometry(9, 0.3, 14), [gm, gm, new T.MeshStandardMaterial({ map: floor, color: 0x7c776f, roughness: 0.85 }), gm, gm, gm]);
  slab.position.copy(at(-0.2, 2.2, -0.1)); slab.rotation.y = face; slab.receiveShadow = true; LSET.g.add(slab);
  // a plataforma fica sobre o mar: pilares de concreto e vigas de aço até a água
  const pm = new T.MeshStandardMaterial({ color: 0x4d4a46, roughness: 0.95 }), st = new T.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.6, metalness: 0.4 });
  for (const sd of [-6.4, -2.2, 2.0, 6.0]) for (const bk of [-1.8, 2.2, 6.2]) { const c = new T.Mesh(new T.CylinderGeometry(0.32, 0.38, 6, 10), pm); c.position.copy(at(sd, bk, -3.2)); LSET.g.add(c); }
  for (const bk of [-1.8, 2.2, 6.2]) { const v = new T.Mesh(new T.BoxGeometry(0.3, 0.4, 13.6), st); v.position.copy(at(-0.2, bk, -0.45)); v.rotation.y = face; LSET.g.add(v); }
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; const cx = cv.getContext('2d'); cx.fillStyle = '#e0a800'; cx.fillRect(0, 0, 256, 32); cx.fillStyle = '#1a1a1a';
  for (let i = -2; i < 20; i++) { cx.beginPath(); cx.moveTo(i * 16, 32); cx.lineTo(i * 16 + 8, 32); cx.lineTo(i * 16 + 24, 0); cx.lineTo(i * 16 + 16, 0); cx.fill(); }
  const hz = new T.CanvasTexture(cv); hz.encoding = T.sRGBEncoding; hz.wrapS = T.RepeatWrapping; hz.repeat.x = 7;
  const hm = new T.Mesh(new T.BoxGeometry(0.26, 0.02, 14), new T.MeshStandardMaterial({ map: hz, roughness: 0.7 })); hm.position.copy(at(-0.2, -2.15, 0.06)); hm.rotation.y = face; LSET.g.add(hm);
  // guarda-corpo nas laterais e no fundo
  for (const [sd, bk, len, along] of [[-7.1, 2.2, 9, 'f'], [6.7, 2.2, 9, 'f'], [-0.2, 6.6, 14, 'r']]) {
    const rail = new T.Mesh(new T.BoxGeometry(along === 'f' ? len : 0.06, 0.06, along === 'f' ? 0.06 : len), st); rail.position.copy(at(sd, bk, 1.05)); rail.rotation.y = face; LSET.g.add(rail);
    const rail2 = rail.clone(); rail2.position.y -= 0.5; LSET.g.add(rail2);
    for (let i = 0; i <= Math.round(len / 1.5); i++) { const t = -len / 2 + i * len / Math.round(len / 1.5), post = new T.Mesh(new T.BoxGeometry(0.07, 1.05, 0.07), st); post.position.copy(along === 'f' ? at(sd, bk + t, 0.53) : at(sd + t, bk, 0.53)); post.rotation.y = face; LSET.g.add(post); }
  }
  // luz do lobby: sol baixo atrás (contorno laranja) + luz de frente suave + postes acesos
  const rim = new T.DirectionalLight(0xff9a5c, 1.4); rim.position.copy(at(-6, 40, 14)); rim.target.position.copy(at(0, 0, 1)); LSET.g.add(rim, rim.target);
  const key = new T.DirectionalLight(0xffe7cf, 0.55); key.position.copy(at(3, -12, 5)); key.target.position.copy(at(0, 0, 1)); LSET.g.add(key, key.target);
  LSET.lights.push(rim, key);
  // poeira dourada flutuando na luz
  const n = 70, pg = new T.BufferGeometry(), pa = new Float32Array(n * 3); LSET.dust = [];
  for (let i = 0; i < n; i++) { const p = at((Math.random() - 0.5) * 9, Math.random() * 5 - 0.5, 0.2 + Math.random() * 3); pa.set([p.x, p.y, p.z], i * 3); LSET.dust.push([p.x, p.y, p.z, Math.random() * 6.28]); }
  pg.setAttribute('position', new T.BufferAttribute(pa, 3));
  const dv = document.createElement('canvas'); dv.width = dv.height = 32; const dc = dv.getContext('2d'), gr = dc.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,230,180,1)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); dc.fillStyle = gr; dc.fillRect(0, 0, 32, 32);
  const dust = new T.Points(pg, new T.PointsMaterial({ size: 0.06, map: new T.CanvasTexture(dv), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 })); LSET.g.add(dust); LSET.dustM = dust;
  // objetos escaneados
  const L = T.GLTFLoader ? new T.GLTFLoader() : null; if (!L) return;
  const put = (f, list) => L.load(`assets/lobby/${f}.glb`, g => {
    for (const [side, back, y, rot, s] of list) {
      const o = g.scene.clone(true); o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; if (m.material) { m.material = m.material.clone(); if (m.material.map) m.material.map.encoding = T.sRGBEncoding; if (typeof ENV_TEX !== 'undefined' && ENV_TEX) { m.material.envMap = ENV_TEX; m.material.envMapIntensity = 0.5; } if (/bulb|glass/i.test(m.material.name)) { m.material.emissive = new T.Color(0xffc27a); m.material.emissiveIntensity = 2.2; } } } });
      const b = new T.Box3().setFromObject(o); o.position.copy(at(side, back, (y || 0) - b.min.y + 0.08)); o.rotation.y = face + (rot || 0); o.scale.setScalar(s || 1); LSET.g.add(o);
    }
  });
  put('mcrate', [[3.3, 1.0, 0, 0.25], [3.25, 1.05, 0.46, 0.05], [4.4, 2.6, 0, -0.6]]);
  put('ocrate', [[3.9, 3.6, 0, 1.45]]);
  put('ammo', [[2.95, 0.95, 0.92, 0.4], [2.4, 0.2, 0, 1.2]]);
  put('jerry', [[2.35, 0.95, 0, 0.9], [-2.3, 0.45, 0, -0.3]]);
  put('barrel2', [[-2.75, 1.1, 0, 0], [-3.25, 1.75, 0, 0.6]]);
  put('lamp', [[-5.6, 4.6, 0, 0.3], [5.2, 4.4, 0, -0.4]]);
  for (const side of [-5.6, 5.2]) { const pl = new T.PointLight(0xffb36b, 1.6, 11, 2); pl.position.copy(at(side * 0.93, 4.4, 3.6)); LSET.g.add(pl); LSET.lights.push(pl); }
  LSET.ready = true;
})();
// liga/desliga o cenário: no lobby troca o céu e a névoa (cor do pôr do sol); na partida volta tudo
(function hookLobbySet() {
  const base = lobbyCamera;
  lobbyCamera = function (dt) {
    base(dt);
    const on = G.phase !== 'match'; LSET.g.visible = on; if (LOB.stage) LOB.stage.visible = false;
    if (NAT.clouds) NAT.clouds.visible = !on;
    if (on) {
      LSET.dome.position.copy(camera.position);
      scene.fog.color.copy(LSET.fog); scene.background.copy(LSET.fog); if (typeof PP !== 'undefined' && PP && PP.on) { scene.fog.color.convertSRGBToLinear(); scene.background.convertSRGBToLinear(); }
      const t = LOB.t, pa = LSET.dustM.geometry.attributes.position;
      LSET.dust.forEach(([x, y, z, ph], i) => pa.setXYZ(i, x + Math.sin(t * 0.3 + ph) * 0.25, y + Math.cos(t * 0.21 + ph * 2) * 0.12, z + Math.sin(t * 0.17 + ph) * 0.3));
      pa.needsUpdate = true; LSET.was = true;
    } else if (LSET.was) { LSET.was = false; if (typeof applyFogColor === 'function') applyFogColor(); }
  };
})();
// começou a partida: some o cenário do lobby e volta o céu/névoa do clima
(function hookStart() {
  const base = startMatch;
  startMatch = function (...a) { LSET.g.visible = false; if (NAT.clouds) NAT.clouds.visible = true; LSET.was = false; const r = base.apply(this, a); if (typeof applyFogColor === 'function') applyFogColor(); return r; };
})();
