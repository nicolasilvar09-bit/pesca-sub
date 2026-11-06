// ================= gráficos: sombras, mar com ondas e espuma, grama ao vento, estradas pintadas, postes, sol e textura procedural =================
const GFX = { t: 0, grassOn: false, shadow: 0, gx: 1e9, gz: 1e9 };
const SUN_DIR = new T.Vector3(320, 330, 180).normalize();
const GLSL_NOISE = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y); }`;
// textura procedural pela posição no mundo (não precisa de imagem nem de UV)
// texturas de detalhe de foto (ambientCG, CC0): chão = grama/terra/rocha, paredes = 6 materiais em 2 imagens
const DET = { tTer: { value: null }, tWA: { value: null }, tWB: { value: null }, tAsph: { value: null }, uDet: { value: 1 } };
(function loadDetail() {
  const blank = new T.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); blank.needsUpdate = true; DET.tTer.value = DET.tWA.value = DET.tWB.value = DET.tAsph.value = blank;
  const L = new T.TextureLoader(), an = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  for (const [k, f] of [['tTer', 'terrain'], ['tWA', 'wallsA'], ['tWB', 'wallsB'], ['tAsph', 'asphalt']]) L.load(`assets/tex/${f}.jpg`, t => { t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = an; DET[k].value = t; });
})();
function patchNoise(mat, kind) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.tTer = DET.tTer; sh.uniforms.tWA = DET.tWA; sh.uniforms.tWB = DET.tWB; sh.uniforms.uDet = DET.uDet;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying float vMt; attribute float mt;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal); vMt = mt;');
    const terr = `
      float n1 = vn(vWP.xz * 0.11), n2 = vn(vWP.xz * 0.8), n3 = vn(vWP.xz * 4.5);
      float gr = clamp((diffuseColor.g - max(diffuseColor.r, diffuseColor.b)) * 4.0, 0.0, 1.0);
      diffuseColor.rgb *= 0.84 + n1 * 0.16 + n2 * 0.1 + (n3 - 0.5) * 0.16 * (0.35 + gr);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.15, 1.06, 0.7), gr * smoothstep(0.55, 0.85, n1) * 0.55);
      { // detalhe de foto: duas escalas misturadas para não se ver repetição
        vec3 d1 = texture2D(tTer, vWP.xz * 0.3).rgb, d2 = texture2D(tTer, vWP.xz * 0.041 + 0.37).rgb, dd = d1 * 0.6 + d2 * 0.4;
        float mx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)), mn = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
        float grey = 1.0 - clamp((mx - mn) * 6.0, 0.0, 1.0), grs = clamp((diffuseColor.g - max(diffuseColor.r, diffuseColor.b)) * 7.0, 0.0, 1.0);
        float det = mix(mix(dd.g, dd.r, grs), dd.b, grey * 0.85);
        float fd = clamp(1.0 - length(vWP - cameraPosition) / 320.0, 0.3, 1.0); // de longe, menos detalhe (evita chiado)
        diffuseColor.rgb *= mix(1.0, max(0.2, 1.0 + (det - 0.5) * 2.7), uDet * fd);
      }`;
    const wall = `
      float w1 = vn(vWP.xz * 1.3 + vWP.y * 1.1);
      vec3 nn = normalize(vWN);
      vec2 uv = abs(nn.y) > 0.6 ? vWP.xz : vec2(abs(nn.x) > abs(nn.z) ? vWP.z : vWP.x, vWP.y);
      float mm = floor(vMt + 0.5), fw = max(length(fwidth(uv)), 1e-4), d;
      float fd = uDet * clamp(1.0 - length(vWP - cameraPosition) / 230.0, 0.3, 1.0);
      /* fotos do ambientCG (CC0) em tons de cinza, uma por canal: A = reboco/tijolo/telha, B = concreto/madeira/metal */
      if (mm < 0.5) { d = 0.5 + (texture2D(tWA, uv * 0.4).r * 0.7 + texture2D(tWA, uv * 0.093 + 0.31).r * 0.3 - 0.5) * 1.7; diffuseColor.rgb *= 0.95 + w1 * 0.08; }
      else if (mm < 1.5) { d = texture2D(tWA, uv * 0.85).g; }
      else if (mm < 2.5) { d = texture2D(tWA, uv * vec2(0.55, 0.62)).b; }
      else if (mm < 3.5) { /* placas de concreto com junta */
        vec2 f = fract(uv / vec2(1.6, 1.05)); float l = clamp(step(f.x, 0.012) + step(f.y, 0.02), 0.0, 1.0) * clamp(1.0 - (fw - 0.02) * 12.0, 0.0, 1.0);
        d = (texture2D(tWB, uv * 0.42).r * 0.7 + texture2D(tWB, uv * 0.1 + 0.2).r * 0.3) * (1.0 - l * 0.3);
      } else if (mm < 4.5) { d = texture2D(tWB, (abs(nn.y) > 0.6 ? uv : uv.yx) * 0.62).g; }
      else { /* chapa ondulada */
        d = texture2D(tWB, uv * 0.5).b * (0.86 + 0.14 * sin(uv.x * 52.0) * clamp(1.0 - (fw - 0.008) * 40.0, 0.0, 1.0));
      }
      diffuseColor.rgb *= mix(1.0, d * 2.0, fd);`;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying float vMt; uniform sampler2D tTer; uniform sampler2D tWA; uniform sampler2D tWB; uniform float uDet;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (kind === 'terrain' ? terr : wall));
  };
  mat.customProgramCacheKey = () => 'noise-' + kind;
  mat.needsUpdate = true;
}
patchNoise(MAT.terrain, 'terrain'); patchNoise(MAT.world, 'wall');

// ---------- vidro nas janelas (só visual: as balas passam) ----------
// vidros separados por bloco do mapa (somem junto com os prédios distantes; antes ficavam flutuando no céu)
(function glass() {
  const mat = new T.MeshLambertMaterial({ color: 0x8fc8e8, emissive: 0x1a3a50, transparent: true, opacity: 0.42, side: T.DoubleSide, depthWrite: false });
  const byChunk = new Map();
  for (const [x0, y0, z0, x1, y1, z1] of GLASS.p) {
    const k = Math.floor((z0 + HALF) / CH) * 1000 + Math.floor((x0 + HALF) / CH); let pos = byChunk.get(k); if (!pos) byChunk.set(k, pos = []);
    if (Math.abs(x1 - x0) > 0.01) pos.push(x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y0, z0, x1, y1, z0, x0, y1, z0);
    else pos.push(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y0, z0, x0, y1, z1, x0, y1, z0);
  }
  GLASS.meshes = [];
  for (const pos of byChunk.values()) {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
    const m = new T.Mesh(g, mat); m.renderOrder = 1; scene.add(m); GLASS.meshes.push(m);
  }
  GLASS.mesh = { material: mat }; GLASS.p = null;
})();

// ---------- sombra de contato no terreno (em volta das casas e embaixo das árvores) ----------
(function terrainAO() {
  const col = TERRAIN.geometry.attributes.color, a = col.array, k = new Float32Array(GN * GN).fill(1);
  const idx = (x, z) => [Math.round((x + HALF) / CELL), Math.round((z + HALF) / CELL)];
  for (const b of BLD) {
    const [i0, j0] = idx(b.x0 - 4, b.z0 - 4), [i1, j1] = idx(b.x1 + 4, b.z1 + 4);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (i < 0 || j < 0 || i >= GN || j >= GN) continue;
      const x = -HALF + i * CELL, z = -HALF + j * CELL, dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.z0 - z, 0, z - b.z1), d = Math.hypot(dx, dz);
      k[j * GN + i] = Math.min(k[j * GN + i], 0.7 + 0.3 * clamp(d / 4, 0, 1));
    }
  }
  for (const [x, z] of TREES) { const [i, j] = idx(x, z); if (i >= 0 && j >= 0 && i < GN && j < GN) k[j * GN + i] = Math.min(k[j * GN + i], 0.78); }
  for (let n = 0; n < GN * GN; n++) if (k[n] < 1) { a[n * 3] *= k[n]; a[n * 3 + 1] *= k[n]; a[n * 3 + 2] *= k[n]; }
  col.needsUpdate = true;
})();

// ---------- mar: ondas, brilho do sol, reflexo do céu, água rasa turquesa e espuma na praia ----------
(function sea() {
  const data = new Uint8Array(GN * GN * 4);
  for (let n = 0; n < GN * GN; n++) { const d = clamp(-H[n] / 16, 0, 1) * 255; data[n * 4] = d; data[n * 4 + 1] = d; data[n * 4 + 2] = d; data[n * 4 + 3] = 255; }
  const tex = new T.DataTexture(data, GN, GN, T.RGBAFormat); tex.magFilter = tex.minFilter = T.LinearFilter; tex.needsUpdate = true;
  const uni = T.UniformsUtils.merge([T.UniformsLib.fog, { uT: { value: 0 }, uSun: { value: SUN_DIR.clone() }, uSky: { value: new T.Color(0xb5c6d2) }, uLin: { value: 0 } }]);
  uni.uDepth = { value: tex };
  const mat = new T.ShaderMaterial({
    uniforms: uni, fog: true, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vWP;\n#include <fog_pars_vertex>\nvoid main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
    fragmentShader: `uniform float uT; uniform float uLin; uniform sampler2D uDepth; uniform vec3 uSun; uniform vec3 uSky; varying vec3 vWP;\n#include <fog_pars_fragment>\n${GLSL_NOISE}
void main(){
  vec2 uv = (vWP.xz + ${HALF.toFixed(1)}) / ${MAP.toFixed(1)}; float depth = 1.0;
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) depth = texture2D(uDepth, uv).r;
  vec2 p = vWP.xz;
  float dx = 0.15 * cos(p.x * 0.15 + uT * 1.1) + 0.21 * cos((p.x + p.y) * 0.42 + uT * 1.7) + 0.27 * cos((p.x - p.y) * 0.9 - uT * 2.3) + 0.2 * cos(p.x * 1.9 + uT * 3.1);
  float dz = 0.19 * cos(p.y * 0.19 - uT * 0.9) + 0.21 * cos((p.x + p.y) * 0.42 + uT * 1.7) - 0.27 * cos((p.x - p.y) * 0.9 - uT * 2.3) + 0.2 * cos(p.y * 2.3 - uT * 2.7);
  vec3 n = normalize(vec3(dx * 0.35, 1.0, dz * 0.35));
  vec3 V = normalize(cameraPosition - vWP);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  vec3 col = mix(vec3(0.42, 0.66, 0.6), vec3(0.17, 0.44, 0.52), smoothstep(0.0, 0.12, depth));
  col = mix(col, vec3(0.08, 0.25, 0.36), smoothstep(0.12, 0.65, depth));
  col = mix(col, uSky, fres * 0.55);
  vec3 Hh = normalize(uSun + V); col += pow(max(dot(n, Hh), 0.0), 160.0) * vec3(1.4, 1.25, 1.0);
  float wave = sin(uT * 1.4 - depth * 90.0) * 0.5 + 0.5;
  float foam = smoothstep(0.045, 0.0, depth - wave * 0.02) * (0.6 + 0.4 * vn(p * 1.5 + uT * 0.6));
  col = mix(col, vec3(0.92, 0.93, 0.9), clamp(foam, 0.0, 1.0) * 0.6);
  float alpha = mix(0.5, 0.93, smoothstep(0.0, 0.3, depth)); alpha = max(alpha, foam);
  if (uLin > 0.5) col = pow(col, vec3(2.2)); // com pós-processamento a cena é gravada em cor linear
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`,
  });
  WATER.material = mat; GFX.water = mat;
})();

// ---------- estradas com faixas e postes de luz ----------
(function roads() {
  const pos = [], colA = [], c = new T.Color();
  const strip = (x0, z0, ux, uz, L, a, b, lift, color, dash) => {
    const n = Math.max(1, Math.ceil(L / 3)), px = -uz, pz = ux; c.set(color);
    for (let i = 0; i < n; i++) {
      if (dash && i % 2) continue;
      const t0 = i * L / n, t1 = (i + 1) * L / n, P = [];
      for (const [t, o] of [[t0, a], [t0, b], [t1, b], [t1, a]]) { const x = x0 + ux * t + px * o, z = z0 + uz * t + pz * o; P.push([x, groundH(x, z) + lift, z]); }
      for (const q of [P[0], P[2], P[1], P[0], P[3], P[2]]) { pos.push(...q); colA.push(c.r, c.g, c.b); }
    }
  };
  for (const r of ROADS) {
    const dx = r[2] - r[0], dz = r[3] - r[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    strip(r[0], r[1], ux, uz, L, -4.4, 4.4, 0.1, '#4a4d55');
    strip(r[0], r[1], ux, uz, L, -3.9, -3.7, 0.13, '#f1f1f1'); strip(r[0], r[1], ux, uz, L, 3.7, 3.9, 0.13, '#f1f1f1');
    strip(r[0], r[1], ux, uz, L, -0.13, 0.13, 0.13, '#ffd23f', true);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(colA, 3)); g.computeVertexNormals();
  const m = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  /* asfalto de foto (ambientCG Asphalt021, CC0): rachaduras no asfalto e tinta gasta nas faixas */
  m.onBeforeCompile = sh => {
    sh.uniforms.tAsph = DET.tAsph; sh.uniforms.uDet = DET.uDet;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform sampler2D tAsph; uniform float uDet;')
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 a1 = texture2D(tAsph, vWP.xz * 0.15).rgb, a2 = texture2D(tAsph, vWP.xz * 0.047 + 0.37).rgb;
        vec3 col = (a1 * 0.7 + a2 * 0.3) / 0.37;
        float fd = uDet * clamp(1.0 - length(vWP - cameraPosition) / 260.0, 0.25, 1.0);
        float line = step(0.5, max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)));
        float l = dot(col, vec3(0.333));
        vec3 asph = mix(vec3(1.0), pow(col, vec3(2.3)) * 1.18, fd);
        vec3 paint = vec3(mix(1.0, clamp(pow(l, 2.6) * 1.08, 0.2, 1.08), fd));
        diffuseColor.rgb *= mix(asph, paint, line);
      }`);
  };
  m.customProgramCacheKey = () => 'road-asph';
  const mesh = new T.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh); GFX.road = mesh;
  // postes
  const L = [];
  for (const r of ROADS) {
    const dx = r[2] - r[0], dz = r[3] - r[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    for (let t = 20, s = 1; t < len - 10; t += 42, s = -s) {
      const x = r[0] + ux * t - uz * 5.4 * s, z = r[1] + uz * t + ux * 5.4 * s, h = groundH(x, z);
      if (h < 1.5 || bldAt(x, z, 1.5) || L.some(l => Math.hypot(l[0] - x, l[1] - z) < 18)) continue;
      L.push([x, z, h, Math.atan2(uz * s, -ux * s)]);
    }
  }
  const d = new T.Object3D(), mk = (geo, color, em) => new T.InstancedMesh(geo, new T.MeshLambertMaterial({ color, emissive: em || 0 }), L.length);
  const pole = mk(new T.CylinderGeometry(0.06, 0.09, 1, 6), 0x5c6470), arm = mk(new T.BoxGeometry(1, 1, 1), 0x5c6470), head = mk(new T.BoxGeometry(1, 1, 1), 0xfff3b0, 0xffe27a);
  L.forEach(([x, z, h, a], i) => {
    d.rotation.set(0, a, 0); d.position.set(x, h + 2.9, z); d.scale.set(1, 5.8, 1); d.updateMatrix(); pole.setMatrixAt(i, d.matrix);
    const ax = Math.sin(a), az = Math.cos(a);
    d.position.set(x + ax * 0.7, h + 5.75, z + az * 0.7); d.scale.set(0.1, 0.1, 1.5); d.updateMatrix(); arm.setMatrixAt(i, d.matrix);
    d.position.set(x + ax * 1.35, h + 5.65, z + az * 1.35); d.scale.set(0.3, 0.12, 0.55); d.updateMatrix(); head.setMatrixAt(i, d.matrix);
    addCollider(x - 0.1, h, z - 0.1, x + 0.1, h + 5.8, z + 0.1, 'pole');
  });
  for (const m2 of [pole, arm, head]) { m2.castShadow = true; scene.add(m2); NATURE_MESH.push(m2); }
  GFX.lamps = L;
})();

// ---------- sol ----------
const SUNDISK = [];
(function sunDisk() {
  const p = SUN_DIR.clone().multiplyScalar(2000);
  for (const [r, op] of [[55, 1], [140, 0.22], [300, 0.08]]) {
    const m = new T.Mesh(new T.CircleGeometry(r, 32), new T.MeshBasicMaterial({ color: 0xfff4cc, transparent: op < 1, opacity: op, fog: false, depthWrite: false }));
    m.position.copy(p); m.lookAt(0, 0, 0); m.renderOrder = -9; SKY.add(m); SUNDISK.push(m);
  }
})();

// ---------- grama e flores perto da câmera (balançam com o vento) ----------
const GMASK = new Uint8Array(GN * GN); // 0 sem grama, 1 grama, 2 grama perto da estrada (confere na hora)
(function grassMask() {
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
    const x = -HALF + i * CELL, z = -HALF + j * CELL, h = H[j * GN + i];
    if (h < 2 || h > 55) continue;
    const t = townAt(x, z); if (t && (t.kind === 'city' || t.kind === 'military' || t.kind === 'port' || t.kind === 'factory') && Math.hypot(t.x - x, t.z - z) < t.r) continue;
    const sl = Math.abs(H[Math.min(j * GN + i + 1, H.length - 1)] - h) + Math.abs(H[Math.min((j + 1) * GN + i, H.length - 1)] - h); if (sl > 3) continue;
    GMASK[j * GN + i] = roadDist(x, z) < 10 ? 2 : 1;
  }
  for (const b of BLD) for (let j = Math.floor((b.z0 - 3 + HALF) / CELL); j <= Math.ceil((b.z1 + 3 + HALF) / CELL); j++) for (let i = Math.floor((b.x0 - 3 + HALF) / CELL); i <= Math.ceil((b.x1 + 3 + HALF) / CELL); i++) if (i >= 0 && j >= 0 && i < GN && j < GN) GMASK[j * GN + i] = 0;
})();
function tuftGeo(blades, hMin, hMax, base, tip, head) {
  const pos = [], col = [], nor = [], cb = new T.Color(base), ct = new T.Color(tip);
  for (let k = 0; k < blades; k++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.18, x = Math.cos(a) * r, z = Math.sin(a) * r, h = hMin + Math.random() * (hMax - hMin), w = 0.045, ra = Math.random() * Math.PI;
    const ox = Math.cos(ra) * w, oz = Math.sin(ra) * w, lean = (Math.random() - 0.5) * 0.25;
    // os dois lados da folha (com a normal para cima, não fica preta por trás)
    pos.push(x - ox, 0, z - oz, x + ox, 0, z + oz, x + lean, h, z + lean * 0.5, x + ox, 0, z + oz, x - ox, 0, z - oz, x + lean, h, z + lean * 0.5);
    for (let s2 = 0; s2 < 2; s2++) { col.push(cb.r, cb.g, cb.b, cb.r, cb.g, cb.b, ct.r, ct.g, ct.b); for (let i = 0; i < 3; i++) nor.push(0, 1, 0); }
  }
  if (head) { // flor: pétalas brancas (a cor vem de cada instância)
    const y = hMax + 0.02;
    for (const [dx, dz] of [[0.07, 0], [-0.07, 0], [0, 0.07], [0, -0.07]]) { pos.push(0, y, 0, dx - dz * 0.6, y, dz + dx * 0.6, dx + dz * 0.6, y, dz - dx * 0.6); for (let i = 0; i < 3; i++) { col.push(1, 1, 1); nor.push(0, 1, 0); } }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  return g;
}
const GRASS_U = { value: 0 };
function windMat() {
  const m = new T.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = GRASS_U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      vec3 ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
      float sw = sin(uT * 2.1 + ip.x * 0.45 + ip.z * 0.3) + 0.5 * sin(uT * 3.7 + ip.z * 0.8);
      transformed.x += sw * 0.09 * position.y; transformed.z += cos(uT * 1.6 + ip.x * 0.3) * 0.06 * position.y;
      #endif`);
  };
  return m;
}
const GRASS_N = MAPID === 'bal' ? 9500 : 6500, FLOWER_N = MAPID === 'bal' ? 900 : 700; // Balneário: mato mais alto e mais denso
const grassM = new T.InstancedMesh((MAPID === 'bal' ? tuftGeo(7, 0.34, 0.78, '#2f5a1e', '#86a845') : tuftGeo(6, 0.28, 0.55, '#4a5626', '#a59d55')), windMat(), GRASS_N);
const flowerM = new T.InstancedMesh(tuftGeo(2, 0.3, 0.42, '#3f5a24', '#7d9a44', true), windMat(), FLOWER_N);
grassM.frustumCulled = flowerM.frustumCulled = false; grassM.count = flowerM.count = 0; scene.add(grassM, flowerM);
const FLOWER_C = ['#e8d66a', '#e9e4d8', '#c9a8d8', '#d8c05a', '#f0f0e8', '#b9c870'].map(c => new T.Color(c));
const hash2 = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function grassAt(x, z) {
  const i = Math.round((x + HALF) / CELL), j = Math.round((z + HALF) / CELL);
  if (i < 0 || j < 0 || i >= GN || j >= GN) return false;
  const m = GMASK[j * GN + i]; if (!m) return false;
  if (m === 2 && roadDist(x, z) < 5.2) return false;
  return true;
}
function refreshGrass(cx, cz) {
  const S = SET.quality >= 2 ? 0.85 : 1.15, R = SET.quality >= 2 ? 42 : 32, d = new T.Object3D();
  let n = 0, f = 0;
  const i0 = Math.floor((cx - R) / S), i1 = Math.ceil((cx + R) / S), j0 = Math.floor((cz - R) / S), j1 = Math.ceil((cz + R) / S);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const hx = hash2(i, j), hz = hash2(j + 17, i - 9), x = (i + hx) * S, z = (j + hz) * S;
    if ((x - cx) ** 2 + (z - cz) ** 2 > R * R || !grassAt(x, z)) continue;
    const y = groundH(x, z), s = 0.8 + hash2(i + 3, j + 5) * 0.7;
    d.position.set(x, y, z); d.rotation.set(0, hx * 6.28, 0); d.scale.set(s, s, s); d.updateMatrix();
    const fl = hash2(i - 31, j + 47);
    if (fl < 0.1 && f < FLOWER_N) { flowerM.setMatrixAt(f, d.matrix); flowerM.setColorAt(f++, FLOWER_C[Math.floor(fl * 60) % FLOWER_C.length]); }
    else if (n < GRASS_N && hz > 0.15) grassM.setMatrixAt(n++, d.matrix);
  }
  grassM.count = n; flowerM.count = f; grassM.instanceMatrix.needsUpdate = flowerM.instanceMatrix.needsUpdate = true; if (flowerM.instanceColor) flowerM.instanceColor.needsUpdate = true;
  GFX.gx = cx; GFX.gz = cz;
}

// ---------- sombras: mapa de sombra que acompanha a câmera ----------
function gfxQuality(q) {
  const sh = q.shadow || 0;
  if (sh !== GFX.shadow) {
    GFX.shadow = sh; renderer.shadowMap.enabled = sh > 0; renderer.shadowMap.type = T.PCFSoftShadowMap;
    sun.castShadow = sh > 0;
    if (sh) { if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } sun.shadow.mapSize.set(sh, sh); const c = sun.shadow.camera; c.left = c.bottom = -60; c.right = c.top = 60; c.near = 20; c.far = 900; c.updateProjectionMatrix(); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.06; }
    scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  }
  DET.uDet.value = SET.quality > 0 ? 1 : 0; // no Leve, sem textura de detalhe
  GFX.grassOn = !!q.grass; grassM.visible = flowerM.visible = GFX.grassOn; GFX.gx = 1e9;
}
scene.add(sun.target);
TERRAIN.receiveShadow = true;
for (const m of CHUNK_MESH) { m.castShadow = true; m.receiveShadow = true; }
for (const m of NATURE_MESH) { m.castShadow = true; m.receiveShadow = true; }
function shadowFollow(x, y, z) {
  if (!GFX.shadow) return;
  const tx = 120 / GFX.shadow; x = Math.round(x / tx) * tx; z = Math.round(z / tx) * tx;
  sun.position.set(x + SUN_DIR.x * 400, y + SUN_DIR.y * 400, z + SUN_DIR.z * 400); sun.target.position.set(x, y, z); sun.target.updateMatrixWorld();
}
// chamado todo quadro
function gfxStep(dt, fx, fy, fz) {
  // alto = mais de 45 m acima do chão (avião, queda livre, paraquedas): sem grama, sem árvore detalhada, sombra congelada
  const high = fy - Math.max(groundH(fx, fz), 0) > 45;
  GFX.t += dt; GRASS_U.value = GFX.t; if (typeof natureStep === 'function') natureStep(dt, fx, fz, high); if (GFX.water) GFX.water.uniforms.uT.value = GFX.t;
  // sombra: no Alto todo quadro; no Médio um quadro sim, outro não (quase não se nota e alivia muito o celular); no alto, congelada
  if (GFX.shadow) renderer.shadowMap.autoUpdate = high ? (GFX.shT = (GFX.shT || 0) + dt) > 1 && !(GFX.shT = 0) : (SET.quality >= 2 && !AUTO.lv) || ((GFX.shN = ((GFX.shN || 0) + 1) % (AUTO.lv >= 1 ? 3 : 2)) === 0);
  shadowFollow(fx, fy, fz);
  grassM.visible = flowerM.visible = GFX.grassOn && !high && AUTO.lv < 4 && G.phase === 'match';
  if (GFX.grassOn && !high && Math.hypot(fx - GFX.gx, fz - GFX.gz) > 12) refreshGrass(fx, fz);
}
