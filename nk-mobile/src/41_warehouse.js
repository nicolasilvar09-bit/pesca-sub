// ================= galpão realista (teste de gráfico) no campo de treino =================
// texturas de verdade (Poly Haven, CC0: concreto de hangar, parede de fábrica, telha de zinco, base de concreto, porta de enrolar), luz "pré-calculada"
// pintada em mapas (poças de luz das lâmpadas, cantos escuros), sol entrando pelas clarabóias com feixes e poeira no ar, estrutura de aço e porta-paletes.
// Tudo junto por material (≈12 desenhos). Aparece só no treino; sai junto quando o treino acaba.
const WH = { g: null, cols: [], tex: {} };
function whTex(n, rep) {
  const L = new T.TextureLoader(), k = n + rep;
  if (WH.tex[k]) return WH.tex[k];
  const ld = (f, srgb) => { const t = L.load(`assets/tex/wh_${n}_${f}.jpg`); t.wrapS = t.wrapT = T.RepeatWrapping; if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
  return WH.tex[k] = { map: ld('d', true), normalMap: ld('n'), roughnessMap: ld('r') };
}
// caixa com UV em metros (textura não estica): s = metros por repetição
function whBox(x0, y0, z0, x1, y1, z1, s) {
  const g = new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
  for (let i = 0; i < P.count; i++) { const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    if (ny > 0.5) U.setXY(i, x / s, z / s); else if (nx > 0.5) U.setXY(i, z / s, y / s); else U.setXY(i, x / s, y / s); }
  return g;
}
/* junta várias geometrias numa só (posição, normal e uv) */
function whCat(list) {
  const gs = list.map(q => q.index ? q.toNonIndexed() : q), out = new T.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) { const n = gs.reduce((s, g) => s + (g.attributes[k] ? g.attributes[k].count : g.attributes.position.count) * (k === 'uv' ? 2 : 3), 0), a = new Float32Array(n); let o = 0;
    for (const g of gs) { const at = g.attributes[k], cnt = g.attributes.position.count * (k === 'uv' ? 2 : 3); if (at) a.set(at.array.subarray(0, cnt), o); o += cnt; }
    out.setAttribute(k, new T.BufferAttribute(a, k === 'uv' ? 2 : 3)); }
  return out;
}
function whMerge(list) { const g = whCat(list); g.setAttribute('uv2', g.attributes.uv); return g; }
// mapa de luz do chão: lâmpadas, sol das clarabóias, cantos e baixo das prateleiras escuros
function whLightmap(W, D, lamps, sky, racks, sunOff) {
  const c = document.createElement('canvas'), S = 8; c.width = W * S; c.height = D * S; const g = c.getContext('2d');
  g.fillStyle = '#3a3a3a'; g.fillRect(0, 0, c.width, c.height);
  const pool = (x, z, r, col) => { const gr = g.createRadialGradient((x + W / 2) * S, (z + D / 2) * S, 0, (x + W / 2) * S, (z + D / 2) * S, r * S); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); };
  g.globalCompositeOperation = 'lighter';
  for (const [x, z] of lamps) { pool(x, z, 6.5, 'rgba(255,214,150,0.55)'); pool(x, z, 2.5, 'rgba(255,230,190,0.35)'); }
  for (const [x, z0, z1] of sky) for (let z = z0; z <= z1; z += 1.5) pool(x + sunOff[0], z + sunOff[1], 2.6, 'rgba(255,240,215,0.22)');
  g.globalCompositeOperation = 'multiply';
  // cantos e paredes escuros, embaixo das prateleiras ainda mais
  const ed = g.createLinearGradient(0, 0, 3 * S, 0); ed.addColorStop(0, '#555'); ed.addColorStop(1, '#fff'); g.fillStyle = ed; g.fillRect(0, 0, 3 * S, c.height);
  const ed2 = g.createLinearGradient(c.width, 0, c.width - 3 * S, 0); ed2.addColorStop(0, '#555'); ed2.addColorStop(1, '#fff'); g.fillStyle = ed2; g.fillRect(c.width - 3 * S, 0, 3 * S, c.height);
  g.fillStyle = '#6a6a6a'; for (const [x0, z0, x1, z1] of racks) g.fillRect((x0 + W / 2) * S, (z0 + D / 2) * S, (x1 - x0) * S, (z1 - z0) * S);
  const t = new T.CanvasTexture(c); t.encoding = T.LinearEncoding; return t;
}
// textura de feixe (de cima para baixo, some nas pontas)
function whBeamTex() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, 'rgba(255,240,210,0)'); gr.addColorStop(0.15, 'rgba(255,240,210,0.55)'); gr.addColorStop(0.7, 'rgba(255,235,200,0.3)'); gr.addColorStop(1, 'rgba(255,235,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 16, 128); const sd = g.createLinearGradient(0, 0, 16, 0); sd.addColorStop(0, 'rgba(0,0,0,1)'); sd.addColorStop(0.5, 'rgba(0,0,0,0)'); sd.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = sd; g.fillRect(0, 0, 16, 128); return new T.CanvasTexture(c);
}
/* dentro do galpão a luz do céu (ambiente) cai muito: só o sol que entra pelas clarabóias/portas e as lâmpadas iluminam */
const WH_BOX = { value: new T.Vector4(0, 0, 0, 0) }, WH_FY = { value: 0 };
function whInterior(m, k) {
  const ob = m.onBeforeCompile;
  m.onBeforeCompile = sh => { if (ob) ob(sh); sh.uniforms.uWhBox = WH_BOX; sh.uniforms.uWhFy = WH_FY;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWhP;').replace('#include <project_vertex>', '#include <project_vertex>\nvec4 whw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwhw = instanceMatrix * whw;\n#endif\nvWhP = (modelMatrix * whw).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWhP; uniform vec4 uWhBox; uniform float uWhFy;')
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      { vec2 q = abs(vWhP.xz - uWhBox.xy) - uWhBox.zw; float inside = step(max(q.x, q.y), 0.0) * step(vWhP.y, uWhFy + 11.0);
        float k = mix(1.0, ${k.toFixed(2)}, inside); reflectedLight.indirectDiffuse *= k; reflectedLight.indirectSpecular *= k; }`); };
  m.customProgramCacheKey = () => 'wh' + k; m.needsUpdate = true; return m;
}
function buildWarehouse(cx, cz) {
  removeWarehouse();
  const W = 24, D = 36, H = 7, R = 10.5, half = W / 2, hd = D / 2;
  let fy = -1e9; for (let x = -half; x <= half; x += 3) for (let z = -hd; z <= hd; z += 3) fy = Math.max(fy, groundH(cx + x, cz + z)); fy += 0.08;
  whClear(cx, cz, half + 2.5, hd + 2.5);
  const grp = new T.Group(); grp.position.set(cx, fy, cz); scene.add(grp); WH.g = grp; WH.fy = fy; WH.cx = cx; WH.cz = cz;
  WH_BOX.value.set(cx, cz, half, hd); WH_FY.value = fy;
  const col = (x0, y0, z0, x1, y1, z1) => WH.cols.push(addCollider(cx + x0, fy + y0, cz + z0, cx + x1, fy + y1, cz + z1, 'w'));
  const env = typeof ENV_TEX !== 'undefined' ? ENV_TEX : null, std = (n, s, o) => Object.assign(new T.MeshStandardMaterial(Object.assign({ envMap: env, envMapIntensity: 0.35 }, whTex(n, s), o || {})), {});
  const doorW = 7, doorH = 5.2, door2W = 3, door2H = 3.2;
  const lamps = [], sky = [], racks = [];
  for (let z = -hd + 6; z < hd - 3; z += 8) for (const x of [-6, 6]) lamps.push([x, z]);
  for (const x of [-6.5, 6.5]) sky.push([x, -hd + 4, hd - 4]);
  for (const x of [-9.4, -3.2, 3.2]) racks.push([x - 0.6, -hd + 6, x + 0.6, hd - 8]);
  const sd = SUN_DIR, sunOff = [-sd.x / sd.y * (H - 0.2), -sd.z / sd.y * (H - 0.2)];
  // chão (laje que cobre o terreno)
  let fg = whBox(-half, -1.2, -hd, half, 0, hd, 4);
  const lm = whLightmap(W, D, lamps, sky, racks, sunOff), fm = std('floor', 4, { aoMap: lm, aoMapIntensity: 1, lightMap: lm, lightMapIntensity: 4.2, envMapIntensity: 0.5 });
  { const P = fg.attributes.position, U = fg.attributes.uv; const u2 = new Float32Array(P.count * 2); for (let i = 0; i < P.count; i++) { u2[i * 2] = (P.getX(i) + half) / W; u2[i * 2 + 1] = 1 - (P.getZ(i) + hd) / D; } fg = fg.toNonIndexed ? fg : fg; fg.setAttribute('uv2', new T.BufferAttribute(u2, 2)); fg.attributes.uv2.needsUpdate = true; }
  const floor = new T.Mesh(fg, fm); floor.receiveShadow = true; grp.add(floor); col(-half, -1.2, -hd, half, 0, hd); /* chão firme */
  // paredes: base de concreto (1,4 m) + chapa de fábrica até o telhado; portas
  const base = [], wall = [];
  const wallRun = (axis, fixed, a0, a1, gaps) => { // gaps: [centro, largura, altura]
    let cuts = [[a0, a1]]; for (const [c, w] of gaps) cuts = cuts.flatMap(([u, v]) => c - w / 2 > u && c + w / 2 < v ? [[u, c - w / 2], [c + w / 2, v]] : [[u, v]]);
    const piece = (u, v, y0, y1, t, lst, s) => lst.push(axis === 'x' ? whBox(u, y0, fixed - t, v, y1, fixed + t, s) : whBox(fixed - t, y0, u, fixed + t, y1, v, s));
    for (const [u, v] of cuts) { piece(u, v, -4, 1.4, 0.2, base, 3); piece(u, v, 1.4, H, 0.12, wall, 3); axis === 'x' ? col(u, -1, fixed - 0.25, v, H, fixed + 0.25) : col(fixed - 0.25, -1, u, fixed + 0.25, H, v); }
    for (const [c, w, h] of gaps) { piece(c - w / 2, c + w / 2, h, H, 0.12, wall, 3); axis === 'x' ? col(c - w / 2, h, fixed - 0.25, c + w / 2, H, fixed + 0.25) : col(fixed - 0.25, h, c - w / 2, fixed + 0.25, H, c + w / 2); }
  };
  wallRun('z', -half, -hd, hd, [[-4, door2W, door2H]]); wallRun('z', half, -hd, hd, [[6, door2W, door2H]]);
  wallRun('x', -hd, -half, half, [[0, doorW, doorH]]); wallRun('x', hd, -half, half, [[0, doorW, doorH]]);
  // oitões (triângulos acima das paredes do fundo e da frente)
  for (const z of [-hd, hd]) { const s = new T.Shape(); s.moveTo(-half, H); s.lineTo(half, H); s.lineTo(0, R); s.lineTo(-half, H); const g = new T.ShapeGeometry(s); const U = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) / 3, P.getY(i) / 3); g.translate(0, 0, z); wall.push(g); }
  grp.add(Object.assign(new T.Mesh(whMerge(base), std('base', 3)), { castShadow: true, receiveShadow: true }));
  const wm = std('wall', 3, { metalness: 0.4 }); grp.add(Object.assign(new T.Mesh(whMerge(wall), wm), { castShadow: true, receiveShadow: true }));
  // telhado de zinco com faixa de clarabóia (o sol entra de verdade: a sombra deixa passar)
  const roof = [], slope = Math.atan2(R - H, half), L = Math.hypot(half, R - H) + 0.4;
  for (const sg of [-1, 1]) {
    const segs = [[-hd - 0.4, sky[0][1] - 0.2], [sky[0][2] + 0.2, hd + 0.4]]; // deixa o meio aberto na faixa da clarabóia
    for (const [z0, z1] of [[-hd - 0.4, hd + 0.4]]) {
      // telhado em 2 tiras ao longo da água, com a clarabóia (1,6 m) entre elas
      const strips = [[0, 0.4], [0.55, 1.0]];
      for (const [a, b] of strips) { const g = whBox(L * a, -0.06, z0, L * b, 0.06, z1, 3); g.rotateZ(sg > 0 ? -slope : slope); g.translate(0, 0, 0); const m = new T.Matrix4().makeTranslation(sg > 0 ? 0 : 0, R, 0); g.applyMatrix4(m); if (sg < 0) g.scale(-1, 1, 1); roof.push(g); }
    }
  }
  grp.add(Object.assign(new T.Mesh(whMerge(roof), std('roof', 3, { side: T.DoubleSide, metalness: 0.5 })), { castShadow: true, receiveShadow: true }));
  // estrutura de aço: pilares em I, tesouras do telhado e terças
  const steel = [], stm = whInterior(new T.MeshStandardMaterial({ color: 0x3e4f5e, roughness: 0.55, metalness: 0.6, envMap: env, envMapIntensity: 0.5 }), 0.3);
  for (let z = -hd + 3; z <= hd - 3; z += 6) for (const sg of [-1, 1]) {
    const x = sg * (half - 0.45); steel.push(whBox(x - 0.18, 0, z - 0.12, x + 0.18, H, z + 0.12, 2)); col(x - 0.2, 0, z - 0.14, x + 0.2, H, z + 0.14);
    // tesoura: viga inclinada de cada lado + tirante
    const g = whBox(0, -0.18, z - 0.08, L - 0.5, 0.18, z + 0.08, 2); g.rotateZ(-slope); g.applyMatrix4(new T.Matrix4().makeTranslation(0, R - 0.35, 0)); if (sg < 0) g.scale(-1, 1, 1); steel.push(g);
  }
  for (let z = -hd + 3; z <= hd - 3; z += 6) steel.push(whBox(-half + 0.5, H - 0.1, z - 0.05, half - 0.5, H + 0.05, z + 0.05, 2));
  grp.add(Object.assign(new T.Mesh(whMerge(steel), stm), { castShadow: true }));
  // porta-paletes (colunas azuis, vigas laranja) com caixas e barris
  const rk = [], beams = [], ub = whInterior(new T.MeshStandardMaterial({ color: 0x1f4f9a, roughness: 0.5, metalness: 0.5 }), 0.3), ob = whInterior(new T.MeshStandardMaterial({ color: 0xe0661c, roughness: 0.45, metalness: 0.4 }), 0.3);
  const crates = [], barrels = [], cartons = [];
  for (const [x0, z0, x1, z1] of racks) {
    col(x0, 0, z0, x1, 4.2, z1);
    for (let z = z0; z <= z1 + 0.01; z += 2.7) for (const x of [x0, x1]) rk.push(whBox(x - 0.05, 0, z - 0.05, x + 0.05, 4.4, z + 0.05, 2));
    for (const y of [1.4, 2.8, 4.2]) for (const x of [x0, x1]) beams.push(whBox(x - 0.04, y - 0.12, z0, x + 0.04, y, z1, 2));
    for (let z = z0 + 0.6; z < z1 - 0.5; z += 1.35) for (const y of [0, 1.4, 2.8]) { const r = phh(x0 * 7 + z, y, 31);
      if (r < 0.35) crates.push([(x0 + x1) / 2, y + (y ? 0 : 0.02), z, r * 6]); else if (r < 0.55) barrels.push([(x0 + x1) / 2 + 0.05, y, z, r * 9]); else if (r < 0.9) cartons.push([(x0 + x1) / 2, y, z, r]); }
  }
  grp.add(new T.Mesh(whMerge(rk), ub)); grp.add(new T.Mesh(whMerge(beams), ob));
  const cart = []; for (const [x, y, z, r] of cartons) { const h = 0.5 + r * 0.5; cart.push(whBox(x - 0.45, y, z - 0.5, x + 0.45, y + h, z + 0.5, 1.2)); if (r > 0.7) cart.push(whBox(x - 0.35, y + h, z - 0.4, x + 0.35, y + h + 0.4, z + 0.4, 1.2)); }
  { const cm = whInterior(new T.MeshStandardMaterial({ color: 0xa8865a, roughness: 0.9 }), 0.3); const m = new T.Mesh(whMerge(cart), cm); m.castShadow = m.receiveShadow = true; grp.add(m); }
  if (PROPS.inst.crate) { const im = new T.InstancedMesh(PROPS.inst.crate.geometry, whInterior(PROPS.inst.crate.material.clone(), 0.3), crates.length + 12); let n = 0; const o = new T.Object3D();
    for (const [x, y, z, r] of crates) { o.position.set(x, y, z); o.rotation.set(0, r, 0); o.scale.setScalar(1); o.updateMatrix(); im.setMatrixAt(n++, o.matrix); }
    for (let i = 0; i < 12; i++) { const x = -half + 2 + (i % 3) * 1.0, z = hd - 6 + Math.floor(i / 3) * 0.95; o.position.set(x, i % 5 === 0 ? 0.62 : 0, z); o.rotation.set(0, i * 0.7, 0); o.updateMatrix(); im.setMatrixAt(n++, o.matrix); }
    im.count = n; im.castShadow = im.receiveShadow = true; grp.add(im); }
  if (PROPS.inst.barrel) { const im = new T.InstancedMesh(PROPS.inst.barrel.geometry, whInterior(PROPS.inst.barrel.material.clone(), 0.3), barrels.length + 6); let n = 0; const o = new T.Object3D();
    for (const [x, y, z, r] of barrels) { o.position.set(x, y, z); o.rotation.set(0, r, 0); o.updateMatrix(); im.setMatrixAt(n++, o.matrix); }
    for (let i = 0; i < 6; i++) { o.position.set(half - 2 - (i % 2) * 0.7, 0, -hd + 4 + Math.floor(i / 2) * 0.7); o.rotation.set(0, i, 0); o.updateMatrix(); im.setMatrixAt(n++, o.matrix); }
    im.count = n; im.castShadow = im.receiveShadow = true; grp.add(im); col(half - 3, 0, -hd + 3.6, half - 1.6, 0.9, -hd + 5.8); }
  col(-half + 1.5, 0, hd - 6.5, -half + 4.5, 1.25, hd - 2.5);
  // lâmpadas penduradas (cúpula + luz) e cone de luz suave
  const shade = [], bulb = [], cones = [];
  for (const [x, z] of lamps) {
    const s = new T.CylinderGeometry(0.15, 0.55, 0.35, 14, 1, true); s.translate(x, H - 1.6, z); shade.push(s);
    const cab = new T.CylinderGeometry(0.015, 0.015, 1.4, 4); cab.translate(x, H - 0.7, z); shade.push(cab);
    const b = new T.CircleGeometry(0.45, 14); b.rotateX(Math.PI / 2); b.translate(x, H - 1.76, z); bulb.push(b);
    const c = new T.CylinderGeometry(0.5, 3.2, H - 1.8, 18, 1, true); c.translate(x, (H - 1.8) / 2, z); cones.push(c);
  }
  grp.add(new T.Mesh(whCat(shade), new T.MeshStandardMaterial({ color: 0x2b3238, roughness: 0.5, metalness: 0.6, side: T.DoubleSide })));
  grp.add(new T.Mesh(whCat(bulb), new T.MeshBasicMaterial({ color: 0xfff1d0 })));
  const beamT = whBeamTex();
  grp.add(new T.Mesh(whCat(cones), new T.MeshBasicMaterial({ map: beamT, color: 0xffd9a0, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })));
  // feixes de sol entrando pelas clarabóias (na direção do sol), poeira no ar
  const sun = [];
  for (const [x, z0, z1] of sky) for (let z = z0 + 1; z < z1; z += 2.2) {
    const len = (R - 0.4) / sd.y, g = new T.PlaneGeometry(1.5, len); g.translate(0, -len / 2, 0);
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, -1, 0), new T.Vector3(-sd.x, -sd.y, -sd.z)); g.applyQuaternion(q);
    const g2 = g.clone(); g2.rotateOnAxis ? 0 : 0; const m = new T.Matrix4().makeRotationAxis(new T.Vector3(-sd.x, -sd.y, -sd.z).normalize(), Math.PI / 2); g2.applyMatrix4(m);
    for (const gg of [g, g2]) { gg.translate(x, R - 1.6 + (x > 0 ? 0 : 0), z); sun.push(gg); }
  }
  WH.sunMat = new T.MeshBasicMaterial({ map: beamT, color: 0xfff0d8, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  grp.add(new T.Mesh(whCat(sun), WH.sunMat));
  const nd = 500, pd = new Float32Array(nd * 3); for (let i = 0; i < nd; i++) { pd[i * 3] = (Math.random() - 0.5) * W * 0.9; pd[i * 3 + 1] = Math.random() * H; pd[i * 3 + 2] = (Math.random() - 0.5) * D * 0.9; }
  const dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(pd, 3));
  WH.dust = new T.Points(dg, new T.PointsMaterial({ color: 0xffe9c8, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); grp.add(WH.dust);
  WH.t = 0; return grp;
}
/* tira árvores, moitas e pedras de dentro do terreno do galpão (e devolve quando ele some) */
const _wm = new T.Matrix4(), _wv = new T.Vector3(), _wz = new T.Matrix4().makeScale(0, 0, 0);
function whClearInst() {
  if (!WH.area) return; const [cx, cz, hx, hz] = WH.area;
  scene.traverse(o => { if (!o.isInstancedMesh || o.parent === WH.g || o === CAS.mesh) return;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, _wm); _wv.setFromMatrixPosition(_wm); if (_wm.elements[0] !== 0 && Math.abs(_wv.x - cx) < hx && Math.abs(_wv.z - cz) < hz) { WH.hid.push([o, i, _wm.clone()]); o.setMatrixAt(i, _wz); o.instanceMatrix.needsUpdate = true; } } });
}
function whClear(cx, cz, hx, hz) {
  WH.hid = []; WH.area = [cx, cz, hx, hz]; whClearInst();
  const near = []; boxesNear(cx - hx, cz - hz, cx + hx, cz + hz, near);
  WH.offCols = near.filter(b => (b.k === 'tree' || b.k === 'rock') && b.x1 > cx - hx && b.x0 < cx + hx && b.z1 > cz - hz && b.z0 < cz + hz).map(b => [b, b.y0, b.y1]);
  for (const [b] of WH.offCols) { b.y1 = b.y0 - 50; b.y0 -= 60; }
}
function whRestore() {
  if (!WH.area) return; WH.area = null;
  for (const [o, i, m] of WH.hid || []) { o.setMatrixAt(i, m); o.instanceMatrix.needsUpdate = true; } WH.hid = [];
  const c = camera.position; for (const f of [typeof refreshNature === 'function' && refreshNature, typeof refreshUnder === 'function' && refreshUnder, typeof refreshGrass === 'function' && refreshGrass]) if (f) try { f(c.x, c.z); } catch (e) {}
  PROPS.cx = 1e9;
  for (const [b, y0, y1] of WH.offCols || []) { b.y0 = y0; b.y1 = y1; } WH.offCols = [];
}
function removeWarehouse() {
  whRestore();
  if (WH.g) { scene.remove(WH.g); WH.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); WH.g = null; }
  for (const b of WH.cols) { b.y1 = b.y0 - 50; b.y0 -= 60; } WH.cols = [];
}
(function hookWhRefresh() { // a natureza que é refeita perto da câmera não pode voltar a nascer dentro do galpão
  const after = r => { if (WH.area) whClearInst(); return r; };
  { const b = refreshNature; refreshNature = function (...q) { return after(b.apply(this, q)); }; }
  { const b = refreshUnder; refreshUnder = function (...q) { return after(b.apply(this, q)); }; }
  { const b = refreshGrass; refreshGrass = function (...q) { return after(b.apply(this, q)); }; }
  { const b = refreshProps; refreshProps = function (...q) { return after(b.apply(this, q)); }; }
})();
(function hookWarehouse() {
  if (typeof startTraining !== 'function') return;
  const st = startTraining;
  startTraining = function (...q) {
    const r = st.apply(this, q);
    // fica ao lado do campo, de frente para a área das armas (porta grande virada para o jogador)
    const S = TRAIN.spot, fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw), rx = -fz, rz = fx;
    // procura um lugar plano, sem árvores, pedras, casas, estrada nem água perto do campo
    const near = []; let best = null;
    for (const side of [-36, 36, -46, 46, -58, 58, -70, 70]) for (const fw of [16, 30, 2, 44, -12]) { if (best) break;
      const x = S.x + rx * side + fx * fw, z = S.z + rz * side + fz * fw; let lo = 1e9, hi = -1e9;
      for (let u = -15; u <= 15; u += 3) for (let v = -21; v <= 21; v += 3) { const h = groundH(x + u, z + v); lo = Math.min(lo, h); hi = Math.max(hi, h); }
      if (lo < 2 || hi - lo > 3 || bldAt(x, z, 22) || roadDist(x, z) < 26) continue;
      boxesNear(x - 15, z - 21, x + 15, z + 21, near); if (near.some(b => b.k !== 'tree' && b.k !== 'rock')) continue;
      best = [x, z]; break;
    }
    if (!best) best = [S.x + rx * -36 + fx * 16, S.z + rz * -36 + fz * 16];
    try { buildWarehouse(best[0], best[1]); } catch (e) { console.warn('galpão', e); }
    return r;
  };
  const off = trainOff; trainOff = function (...q) { removeWarehouse(); return off.apply(this, q); };
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q);
    if (WH.g && WH.dust) { WH.t += dt; WH.dust.rotation.y = Math.sin(WH.t * 0.05) * 0.05; WH.dust.position.y = Math.sin(WH.t * 0.3) * 0.15; if (WH.sunMat) WH.sunMat.opacity = 0.19 + Math.sin(WH.t * 0.7) * 0.03; }
    return o; };
})();
