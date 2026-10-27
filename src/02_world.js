// ================= mundo: relevo da baía =================
const ISLANDS = [
  { x: 420, z: -430, r: 112, h: 58, base: -25, name: 'Jorge Grego' },
  { x: 282, z: 228, r: 30, h: 15, base: -9 },
  { x: 334, z: 266, r: 24, h: 11, base: -9 },
  { x: -160, z: -560, r: 75, h: 32, base: -17 },
  { x: -430, z: 250, r: 42, h: 22, base: -14 },
  { x: 150, z: -150, r: 22, h: 9, base: -14 },
  // expansão leste: ilhotas da Lagoa Azul, Cataguases e Ilha dos Porcos
  { x: 1010, z: -585, r: 26, h: 14, base: -6, name: 'Ilhas do Macaco' },
  { x: 1095, z: -555, r: 19, h: 10, base: -6 },
  { x: 1650, z: -120, r: 48, h: 26, base: -18, name: 'Cataguases' },
  { x: 1745, z: -45, r: 26, h: 13, base: -16 },
  { x: 1585, z: -25, r: 17, h: 8, base: -15 },
  { x: 2060, z: 380, r: 72, h: 38, base: -20, name: 'Ilha dos Porcos' },
];
const LAJE = { x: -330, z: -180 };
const FOZ = { x: -615, z: 560 };
const PIER = { x: 0, z0: 790, z1: 700 };
// área jogável: 3,2 km de lado; a baía original fica no canto sudoeste
const WB = { x0: -780, x1: 2420, z0: -2420, z1: 780 };
const IG = { e: 1480, o: -1640 }; // Ilha Grande: ponta leste (x) e costa de fora (z)
const FORA = { x: 1960, z: -2060 }, CARG = { x: 2080, z: -720 }, LAGOA = { x: 1050, z: -655 };

function H(x, z) {
  let h = -16 + 3.5 * fbm(x * 0.004 + 7, z * 0.004 - 3, 3) + 0.9 * fbm(x * 0.03, z * 0.03, 2);
  // fora da baía o fundo cai: lado de fora da Ilha Grande e canal leste
  h -= 20 * smooth(IG.o + 60, IG.o - 420, z) + 7 * smooth(900, 2200, x) * (1 - smooth(500, 760, z));
  h += 0.1 * Math.sin(x * 0.8 + z * 0.25 + 3 * fbm(x * 0.05, z * 0.05, 1));
  // laje submersa
  const dl = Math.hypot(x - LAJE.x, z - LAJE.z);
  if (dl < 220) {
    h = Math.min(h, lerp(-23, h, smooth(70, 200, dl)));
    h = Math.max(h, lerp(-8.5, -23, smooth(0, 62, dl)) + 1.4 * fbm(x * 0.08, z * 0.08, 2));
  }
  for (const I of ISLANDS) {
    const dx = x - I.x, dz = z - I.z, d = Math.hypot(dx, dz), R = I.r * 1.7;
    if (d > R * 2.2) continue;
    h = lerp(h, I.base + 2, (1 - smooth(R, R * 2.1, d)) * 0.8);
    const a = Math.atan2(dz, dx);
    const nd = d * (1 + 0.22 * fbm(Math.cos(a) * 1.6 + I.x * 0.01, Math.sin(a) * 1.6 + I.z * 0.01, 3));
    const ih = I.h - (I.h - I.base) * Math.pow(clamp(nd / R, 0, 1), 1.2) + 2.2 * fbm(x * 0.05, z * 0.05, 2);
    h = Math.max(h, ih);
  }
  // continente ao sul (Angra) com serra
  const coast = 768 + 22 * fbm(x * 0.006, 3.1, 2);
  const ls = smooth(coast - 90, coast + 40, z);
  if (ls > 0) h = lerp(h, 2 + 10 * smooth(coast, coast + 60, z) + 5 * fbm(x * 0.02, z * 0.02, 2) + 230 * smooth(coast + 80, coast + 420, z) * (0.55 + 0.45 * fbm(x * 0.006, z * 0.006, 4)), ls);
  // continente a oeste, com o rio
  const wc = -668 + 25 * fbm(2.3, z * 0.006, 2);
  const lw = smooth(wc + 70, wc - 40, x);
  if (lw > 0) h = lerp(h, 2 + 12 * smooth(wc, wc - 60, x) + 5 * fbm(x * 0.02 + 5, z * 0.02, 2) + 200 * smooth(wc - 80, wc - 420, x) * (0.55 + 0.45 * fbm(x * 0.006 + 3, z * 0.006, 4)), lw);
  // Ilha Grande ao norte: costa da baía (nc), costa de fora (oc) e ponta leste (ec)
  // a costa de dentro (pontos antigos) fica como era; a de fora e a ponta leste ganham enseadas e pontas
  const zm = (IG.o - 742) / 2, tz = (z - zm) / ((-742 - IG.o) / 2);
  const nc = -742 + 30 * fbm(x * 0.005, 9.1, 2), oc = IG.o + 90 * fbm(x * 0.0045, 4.2, 3), ec = IG.e + 90 * fbm(3.7, z * 0.005, 3) - 420 * tz * tz;
  const wild = Math.max(smooth(-1000, -1250, z), smooth(700, 1100, x));
  const di = Math.min(nc - z, z - oc, ec - x) + wild * (70 * fbm(x * 0.007 + 2, z * 0.007, 3) + 22 * fbm(x * 0.025, z * 0.025 + 5, 2)), ln = smooth(-80, 40, di);
  if (ln > 0) h = lerp(h, 3 + 20 * smooth(0, 50, di) + 6 * fbm(x * 0.02, z * 0.02 + 3, 2) + 300 * smooth(60, 420, di) * (0.5 + 0.5 * fbm(x * 0.005 + 9, z * 0.005, 4)), ln);
  // canal do rio
  const rz = FOZ.z + 18 * Math.sin(x * 0.012);
  const ch = (1 - smooth(14, 34, Math.abs(z - rz))) * smooth(-560, -610, x);
  if (ch > 0) h = lerp(h, -3.2 + 0.4 * fbm(x * 0.1, z * 0.1, 1), ch);
  // estuário raso
  const df = Math.hypot(x - FOZ.x, z - FOZ.z);
  if (h < 0 && df < 220) h = lerp(h, Math.max(h, -5.5 + df * 0.018), 1 - smooth(40, 210, df));
  return Hextra(x, z, h);
}
const murkAt = (x, z) => Math.max(1 - smooth(110, 240, Math.hypot(x - FOZ.x, z - FOZ.z)), smooth(-600, -650, x) * (1 - smooth(40, 80, Math.abs(z - FOZ.z))));

// ================= renderer / cena =================
let renderer, scene, camera, hemi, sun;
const CU = { uTime: { value: 0 }, uDay: { value: 1 }, uDusk: { value: 0 }, uCloud: { value: 0 }, uSwell: { value: 1 } };
const SUN_DIR = new V3(0.45, 0.72, -0.53).normalize();
const HAZE = new THREE.Color(0.70, 0.80, 0.88);
function initRenderer() {
  const LITE = /lite/.test(location.search);
  renderer = new THREE.WebGLRenderer({ antialias: !LITE, powerPreference: 'high-performance' });
  renderer.setPixelRatio(LITE ? 0.4 : Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  document.getElementById('game').appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(HAZE.clone(), 0.0006);
  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 5000);
  scene.add(camera);
  const fit = () => {
    const vv = window.visualViewport, w = Math.max(1, Math.round(vv ? vv.width : innerWidth)), h = Math.max(1, Math.round(vv ? vv.height : innerHeight));
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    try { window.scrollTo(0, 0); } catch (e) { }
    document.body.classList.toggle('portrait', h > w); document.body.classList.toggle('short', h <= 430 && w > h);
  };
  window.__fit = fit; fit();
  addEventListener('resize', fit);
  if (window.visualViewport) visualViewport.addEventListener('resize', fit);
  const onRot = () => { [60, 250, 600, 1100].forEach(t => setTimeout(fit, t)); if (window.__resetTouch) window.__resetTouch(); };
  addEventListener('orientationchange', onRot);
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', onRot);
  document.addEventListener('gesturestart', e => e.preventDefault());
  hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5a5040, 0.75); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff1d8, 1.7); sun.position.copy(SUN_DIR).multiplyScalar(100); scene.add(sun);
}

// vaivém da ondulação de fundo (surge): mesma fórmula no shader e no JS, tudo balança junto
const SURGE_GLSL = 'vec2 surge=vec2(sin(uTime*0.55),cos(uTime*0.44)*0.6);';
const surgeAt = (t, out) => out.set(Math.sin(t * 0.55), 0, Math.cos(t * 0.44) * 0.6);
// ===== shader subaquático compartilhado (absorção da luz + cáusticas) =====
const UW_FRAG_HEAD = `uniform float uTime; uniform float uDay; varying vec3 vWP;
float causF(vec2 uv){ vec2 p=mod(uv*6.28318,6.28318)-250.0; vec2 i=p; float c=1.0; float inten=0.005;
 for(int n=0;n<4;n++){ float t=uTime*0.45*(1.0-(3.5/float(n+1))); i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
 c+=1.0/length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten))); }
 c/=4.0; c=1.17-pow(c,1.4); return clamp(pow(abs(c),8.0),0.0,2.0); }
`;
const UW_FRAG_BODY = `
 if(vWP.y<0.05){ float dp=max(-vWP.y,0.0);
  float murk=1.0-smoothstep(110.0,240.0,distance(vWP.xz,vec2(${FOZ.x}.0,${FOZ.z}.0)));
  murk=max(murk,smoothstep(-600.0,-650.0,vWP.x)*(1.0-smoothstep(40.0,80.0,abs(vWP.z-(${FOZ.z}.0)))));
  vec3 ab=vec3(exp(-dp*0.13),exp(-dp*0.035),exp(-dp*0.028));
  gl_FragColor.rgb*=mix(ab,ab*vec3(0.55,0.6,0.32),murk);
  vec3 upV=normalize((viewMatrix*vec4(0.0,1.0,0.0,0.0)).xyz);
  float facing=clamp(dot(normal,upV),0.0,1.0);
  float cs=causF(vWP.xz/8.5+vec2(vWP.y*0.02));
  gl_FragColor.rgb+=vec3(0.5,0.78,0.85)*min(cs,1.2)*0.3*facing*exp(-dp*0.065)*smoothstep(0.0,1.2,dp)*(1.0-murk*0.9)*uDay*uDay;
 }
`;
function uwify(mat, ext = {}) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = CU.uTime; sh.uniforms.uDay = CU.uDay;
    if (ext.uniforms) Object.assign(sh.uniforms, ext.uniforms);
    sh.vertexShader = 'varying vec3 vWP;\nuniform float uTime;\n' + (ext.vHead || '') + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (ext.vBody || ''))
      .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\n vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;\n#else\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz;\n#endif\n');
    sh.fragmentShader = UW_FRAG_HEAD + sh.fragmentShader.replace('#include <fog_fragment>', UW_FRAG_BODY + '\n#include <fog_fragment>');
  };
  mat.customProgramCacheKey = () => 'uw' + (ext.key || '');
  return mat;
}

// ================= céu =================
function buildSky() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN_DIR }, uHaze: { value: HAZE }, uTime: CU.uTime, uDay: CU.uDay, uDusk: CU.uDusk, uCloud: CU.uCloud },
    vertexShader: `varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z=gl_Position.w*0.99999; }`,
    fragmentShader: `uniform vec3 uSun; uniform vec3 uHaze; uniform float uTime; uniform float uDay; uniform float uDusk; uniform float uCloud; varying vec3 vD;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fb(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=0.5;}return s;}
      void main(){ vec3 d=normalize(vD); float y=max(d.y,0.0);
        vec3 zen=mix(vec3(0.008,0.014,0.04),vec3(0.30,0.53,0.84),uDay); zen=mix(zen,vec3(0.5,0.53,0.57)*uDay+0.01,uCloud*0.6);
        vec3 c=mix(uHaze,zen,pow(y,0.5));
        float s=max(dot(d,uSun),0.0), up=smoothstep(-0.08,0.02,uSun.y);
        c+=vec3(1.0,0.88,0.65)*(pow(s,900.0)*10.0+pow(s,10.0)*0.22)*up*(1.0-uCloud*0.85);
        c+=vec3(1.0,0.4,0.12)*uDusk*pow(s,3.0)*(1.0-y)*0.8;
        // lua e estrelas
        vec3 md=normalize(vec3(-uSun.x,abs(uSun.y)*0.8+0.25,uSun.z)); float mn=max(dot(d,md),0.0);
        c+=vec3(0.85,0.9,1.0)*(pow(mn,2500.0)*4.0+pow(mn,40.0)*0.04)*(1.0-uDay)*(1.0-uCloud*0.8);
        if(d.y>0.0){ vec2 sp=floor(d.xz/(d.y+0.06)*220.0); c+=vec3(step(0.9975,h(sp)))*(1.0-smoothstep(0.1,0.45,uDay))*smoothstep(0.04,0.3,d.y)*(1.0-uCloud); }
        if(d.y>0.0){ vec2 cp=d.xz/(d.y+0.12)*1.4+vec2(uTime*0.004,0.0); float cl=smoothstep(0.52-uCloud*0.4,0.78,fb(cp)); cl*=smoothstep(0.0,0.12,d.y);
          vec3 cc=vec3(0.95,0.96,0.97)*(0.85+0.3*s)*(0.06+0.94*uDay); cc=mix(cc,vec3(1.0,0.55,0.35)*0.9,uDusk*0.55); cc=mix(cc,vec3(0.5,0.52,0.56)*(0.08+0.92*uDay),uCloud*0.6);
          c=mix(c,cc,cl*0.85); }
        else c=uHaze*0.92;
        gl_FragColor=vec4(c,1.0);
      }`,
    side: THREE.BackSide, depthWrite: false, fog: false
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), m);
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky); return sky;
}

// ================= terreno =================
// terreno em blocos de 400 m: malha grossa sempre, malha fina (8 m) só perto da câmera, gerada sob demanda.
// bordas com saia vertical escondem as frestas entre blocos de detalhe diferente.
const TERR = { list: [], mat: null, S: 400, x0: -1600, z0: -3200, nx: 12, nz: 12 };
function terrColor(x, y, z, ny, c) {
  const v = fbm(x * 0.05, z * 0.05, 2);
  if (y > 2.2) {
    const rock = smooth(0.82, 0.62, ny);
    c.setRGB(0.07 + 0.03 * v, 0.17 + 0.05 * v, 0.06 + 0.02 * v);
    if (y < 4) c.lerp(_tc.setRGB(0.55, 0.5, 0.36), smooth(4, 2.2, y));
    c.lerp(_tc.setRGB(0.28, 0.26, 0.22), rock * 0.8);
  } else if (y > -0.6) {
    c.setRGB(0.78 + 0.05 * v, 0.70 + 0.05 * v, 0.52 + 0.04 * v);
  } else {
    c.setRGB(0.6 + 0.06 * v, 0.55 + 0.06 * v, 0.42 + 0.05 * v);
    const deep = smooth(-8, -24, y); c.lerp(_tc.setRGB(0.55, 0.53, 0.45), deep * 0.6);
    c.lerp(_tc.setRGB(0.32, 0.30, 0.26), smooth(0.9, 0.65, ny));
    const m = murkAt(x, z); c.lerp(_tc.setRGB(0.36, 0.31, 0.22), m * 0.85);
    if (fbm(x * 0.02 + 40, z * 0.02, 2) > 0.25 && y > -14) c.lerp(_tc.setRGB(0.30, 0.38, 0.22), 0.35); // manchas de alga
  }
  return c;
}
const _tc = new THREE.Color();
function terrGeo(cx, cz, n) {
  const S = TERR.S, d = S / n, W = n + 3, hs = new Float32Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) hs[j * W + i] = H(cx - S / 2 + (i - 1) * d, cz - S / 2 + (j - 1) * d);
  const pos = [], nor = [], col = [], uv = [], idx = [], c = new THREE.Color(), nv = new V3();
  const vtx = (i, j, drop) => {
    const x = cx - S / 2 + i * d, z = cz - S / 2 + j * d, k = (j + 1) * W + i + 1, y = hs[k];
    nv.set(hs[k - 1] - hs[k + 1], 2 * d, hs[k - W] - hs[k + W]).normalize();
    pos.push(x, y - drop, z); nor.push(nv.x, nv.y, nv.z); terrColor(x, y, z, nv.y, c); col.push(c.r, c.g, c.b); uv.push(x / 7.06, z / 7.06);
    return pos.length / 3 - 1;
  };
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) vtx(i, j, 0);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + n + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // saias nas 4 bordas
  const edges = [[i => [i, 0]], [i => [n, i]], [i => [n - i, n]], [i => [0, n - i]]];
  for (const [f] of edges) for (let i = 0; i < n; i++) {
    const [i0, j0] = f(i), [i1, j1] = f(i + 1), a = j0 * (n + 1) + i0, b = j1 * (n + 1) + i1, a2 = vtx(i0, j0, 6), b2 = vtx(i1, j1, 6);
    idx.push(a, a2, b, b, a2, b2, a, b, a2, b, b2, a2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeBoundingSphere(); return g;
}
function buildTerrain() {
  const st = sandTex(); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.anisotropy = 8;
  TERR.mat = uwify(new THREE.MeshLambertMaterial({ vertexColors: true, map: st }), { key: 't' });
  for (let j = 0; j < TERR.nz; j++) for (let i = 0; i < TERR.nx; i++) {
    const cx = TERR.x0 + (i + 0.5) * TERR.S, cz = TERR.z0 + (j + 0.5) * TERR.S;
    const lo = new THREE.Mesh(terrGeo(cx, cz, 12), TERR.mat); scene.add(lo);
    TERR.list.push({ cx, cz, lo, hi: null });
  }
  updateTerrain(new V3(PIER.x, 0, PIER.z1), 99);
}
// troca para a malha fina nos blocos perto da câmera; gera no máximo `budget` por chamada
function updateTerrain(c, budget = 1) {
  for (const t of TERR.list) {
    const d = Math.max(Math.abs(c.x - t.cx), Math.abs(c.z - t.cz)), near = d < QF().terr;
    if (near && !t.hi && budget > 0) { t.hi = new THREE.Mesh(terrGeo(t.cx, t.cz, 50), TERR.mat); scene.add(t.hi); budget--; }
    if (t.hi) { t.hi.visible = near; t.lo.visible = !near; if (d > QF().terr + 750) { scene.remove(t.hi); t.hi.geometry.dispose(); t.hi = null; t.lo.visible = true; } }
  }
}

let water, waterMat;
function buildWater() {
  const RINGS = 160, SEG = 112, RMAX = 5200, pos = [], idx = [];
  pos.push(0, 0, 0);
  for (let i = 1; i <= RINGS; i++) {
    const r = RMAX * Math.pow(i / RINGS, 2.4);
    for (let j = 0; j < SEG; j++) { const a = j / SEG * TAU; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  }
  for (let j = 0; j < SEG; j++) idx.push(0, 1 + (j + 1) % SEG, 1 + j);
  for (let i = 1; i < RINGS; i++) {
    const a0 = 1 + (i - 1) * SEG, a1 = 1 + i * SEG;
    for (let j = 0; j < SEG; j++) { const j1 = (j + 1) % SEG; idx.push(a0 + j, a0 + j1, a1 + j, a0 + j1, a1 + j1, a1 + j); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: CU.uTime, uSun: { value: SUN_DIR }, uUnder: { value: 0 }, uFogC: { value: new THREE.Color() }, uFogD: { value: 0.0006 }, uHaze: { value: HAZE }, uDay: CU.uDay, uSwell: CU.uSwell },
    vertexShader: WAVE_GLSL + `uniform float uTime; varying vec3 vW;
      void main(){ vec4 w=modelMatrix*vec4(position,1.0); float fade=1.0-smoothstep(250.0,1100.0,length(position.xz));
        w.y+=waveH(w.xz,uTime)*fade; vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: WAVE_GLSL + `uniform float uTime; uniform vec3 uSun; uniform float uUnder; uniform vec3 uFogC; uniform float uFogD; uniform vec3 uHaze; uniform float uDay; varying vec3 vW;
      vec3 sky(vec3 d){ float y=max(d.y,0.0); return mix(uHaze,vec3(0.30,0.53,0.84)*uDay+0.01,pow(y,0.5)); }
      void main(){
        vec3 Vd=cameraPosition-vW; float dist=length(Vd); vec3 V=Vd/dist;
        vec2 p=vW.xz; float t=uTime; float rf=1.0-smoothstep(20.0,260.0,dist);
        vec2 g=waveG(p,t);
        g+=rf*(0.028*cos(dot(p,vec2(0.6,0.8))*2.3-t*4.7)*vec2(0.6,0.8)
              +0.03*cos(dot(p,vec2(-0.9,0.44))*3.9-t*6.2)*vec2(-0.9,0.44)
              +0.03*cos(dot(p,vec2(0.2,-0.98))*6.1-t*7.7)*vec2(0.2,-0.98)
              +0.025*cos(dot(p,vec2(-0.7,-0.7))*9.3-t*9.5)*vec2(-0.7,-0.7));
        vec3 N=normalize(vec3(-g.x,1.0,-g.y));
        vec3 col; float a;
        if(uUnder<0.5){
          float fr=0.02+0.98*pow(1.0-max(dot(N,V),0.0),5.0);
          vec3 R=reflect(-V,N); R.y=abs(R.y);
          vec3 refl=sky(R)+vec3(1.0,0.9,0.72)*pow(max(dot(R,uSun),0.0),600.0)*7.0*smoothstep(-0.05,0.05,uSun.y);
          vec3 deep=vec3(0.03,0.19,0.24)*(0.1+0.9*uDay);
          col=mix(deep,refl,fr);
          col+=vec3(0.0,0.10,0.08)*clamp(waveH(p,t)+0.3,0.0,1.0);
          a=mix(0.5,1.0,max(fr,smoothstep(6.0,80.0,dist)));
          col=mix(col,uHaze,1.0-exp(-dist*uFogD));
        } else {
          float cw=dot(-V,N);
          float win=smoothstep(0.60,0.70,cw);
          vec3 tir=uFogC*1.25;
          vec3 skyc=(vec3(0.75,0.93,0.97)+vec3(1.0,0.95,0.8)*pow(max(dot(-V,uSun),0.0),30.0)*3.0*smoothstep(-0.05,0.05,uSun.y))*(0.06+0.94*uDay);
          col=mix(tir,skyc,win);
          col=mix(col,uFogC,1.0-exp(-dist*uFogD));
          a=mix(0.94,0.62,win);
        }
        gl_FragColor=vec4(col,a);
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false
  });
  water = new THREE.Mesh(g, waterMat); water.frustumCulled = false; water.renderOrder = 1;
  scene.add(water);
}

// ================= pedras / lajes =================
const ROCKS = [], HOLES = [], ROCKGRID = new Map();
const rkey = (x, z) => (Math.floor(x / 20) + 1000) * 10000 + (Math.floor(z / 20) + 1000);
function addRock(x, y, z, r, spot) {
  const R = { x, y, z, r, sy: rand(0.55, 0.95), spot };
  ROCKS.push(R);
  const x0 = Math.floor((x - r) / 20), x1 = Math.floor((x + r) / 20), z0 = Math.floor((z - r) / 20), z1 = Math.floor((z + r) / 20);
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = (i + 1000) * 10000 + (j + 1000); if (!ROCKGRID.has(k)) ROCKGRID.set(k, []); ROCKGRID.get(k).push(R); }
  return R;
}
function rocksNear(x, z) { return ROCKGRID.get(rkey(x, z)) || []; }
// empurra um ponto para fora das pedras (colisão esférica achatada)
function pushOutRocks(p, pad) {
  let hit = false;
  for (const R of rocksNear(p.x, p.z)) {
    const dx = p.x - R.x, dy = (p.y - R.y) / R.sy, dz = p.z - R.z; const d = Math.hypot(dx, dy, dz); const rr = R.r * 0.86 + pad;
    if (d < rr && d > 1e-4) { const k = rr / d; p.x = R.x + dx * k; p.y = R.y + dy * k * R.sy; p.z = R.z + dz * k; hit = true; }
  }
  return hit;
}
// colisão precisa: usa a superfície real da pedra (mesmo ruído e rotação do modelo 3D).
// devolve true se empurrou; em nrm fica a normal da superfície no ponto de contato
const _ip = new V3(), _rl = new V3(), _rq = new THREE.Quaternion();
function rockPush(R, p, pad, nrm) {
  const sx = R.r, sy = R.r * R.sy;
  _rl.set(p.x - R.x, p.y - R.y, p.z - R.z);
  if (R.q) _rl.applyQuaternion(_rq.copy(R.q).invert());
  const vx = _rl.x / sx, vy = _rl.y / sy, vz = _rl.z / sx, L = Math.hypot(vx, vy, vz);
  if (L < 1e-4 || L > 2.2) return false;
  const dx = vx / L, dy = vy / L, dz = vz / L;
  const n = R.q && ROCK_O[R.gi] ? rockN(_rl.set(dx, dy, dz), ROCK_O[R.gi][0], ROCK_O[R.gi][1]) : 1;
  const surf = n + pad / lerp(sx, sy, Math.abs(dy));
  if (L >= surf) return false;
  _rl.set(dx * surf * sx, dy * surf * sy, dz * surf * sx);
  if (R.q) _rl.applyQuaternion(R.q);
  p.set(R.x + _rl.x, R.y + _rl.y, R.z + _rl.z);
  if (nrm) { nrm.set(dx / sx, dy / sy, dz / sx); if (R.q) nrm.applyQuaternion(R.q); nrm.normalize(); }
  return true;
}
// versão precisa para o mergulhador, o arpão e a câmera; acumula a normal do contato mais "de cima"
const _rn = new V3();
function solidPush(p, pad, out) {
  let hit = false; if (out) out.set(0, 0, 0);
  for (const R of rocksNear(p.x, p.z)) if (rockPush(R, p, pad, _rn)) { hit = true; if (out && _rn.y > out.y) out.copy(_rn); }
  return hit;
}
function insideRock(p) {
  const q = _ip.copy(p); return solidPush(q, 0) && q.distanceToSquared(p) > 0.0004;
}
// raio da pedra na direção unitária v (o mesmo ruído que deforma a malha)
const rockN = (v, o1, o2) => 1 + 0.3 * vnoise(v.x * 1.6 + o1, v.y * 1.6 + v.z * 1.2) + 0.14 * vnoise(v.z * 3.4 + o2, v.x * 3.1 - v.y * 2.3) + 0.07 * vnoise(v.x * 7 + v.z * 5, v.y * 7 + o1) + 0.035 * vnoise(v.x * 15 + o2, v.z * 15 - v.y * 11) + 0.08 * Math.max(0, vnoise(v.x * 2.2 - o1, v.z * 2.2) - 0.3);
const ROCK_O = [];
// ponto na superfície real da pedra R na direção local dir (y para cima); devolve a normal aproximada em nrm
function rockSurf(R, dir, out, nrm, k = 0.97) {
  const [o1, o2] = ROCK_O[R.gi], n = rockN(dir, o1, o2);
  out.copy(dir).multiplyScalar(n * k); if (out.y < -0.35) out.y = -0.35 + (out.y + 0.35) * 0.3;
  out.set(out.x * R.r, out.y * R.r * R.sy, out.z * R.r).applyQuaternion(R.q); out.x += R.x; out.y += R.y; out.z += R.z;
  if (nrm) nrm.set(dir.x / R.r, dir.y / (R.r * R.sy), dir.z / R.r).applyQuaternion(R.q).normalize();
  return out;
}
function rockGeo(seed) {
  const g = new THREE.IcosahedronGeometry(1, 4), p = g.attributes.position, r = mulberry(seed), o1 = r() * 100, o2 = r() * 100;
  const v = new V3(), col = new Float32Array(p.count * 3), c = new THREE.Color();
  ROCK_O.push([o1, o2]);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = rockN(v, o1, o2);
    v.multiplyScalar(n); if (v.y < -0.35) v.y = -0.35 + (v.y + 0.35) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
    const top = smooth(0.15, 0.7, v.y / n), k = 0.85 + 0.3 * vnoise(v.x * 5 + o2, v.z * 5);
    c.setRGB(0.2 * k, 0.185 * k, 0.165 * k);
    c.lerp(new THREE.Color(0.15 * k, 0.2 * k, 0.1 * k), top * 0.75);
    if (vnoise(v.x * 4 + o1, v.z * 4 - v.y * 3) > 0.45) c.lerp(new THREE.Color(0.42, 0.22, 0.28), 0.45); // alga calcária rosada
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); smoothNormals(g);
  return g;
}
// instâncias agrupadas por ponto de pesca; cada grupo só é desenhado com a câmera por perto
const CHUNKS = [], _cv = new V3();
function chunked(geo, mat, items, place, far = 90) {
  const by = new Map(); for (const it of items) { const k = Math.floor(it[0] / 160) + ':' + Math.floor(it[2] / 160); if (!by.has(k)) by.set(k, []); by.get(k).push(it); }
  for (const list of by.values()) {
    const im = new THREE.InstancedMesh(geo, mat, list.length), c = new V3(); let r = 0;
    list.forEach(it => c.add(_cv.set(it[0], it[1], it[2]))); c.divideScalar(list.length);
    list.forEach((it, i) => { place(it, i, im); r = Math.max(r, c.distanceTo(_cv.set(it[0], it[1], it[2]))); });
    im.frustumCulled = false; CHUNKS.push({ im, c, r, fk: far / 90 }); scene.add(im);
  }
}
function updateChunks() { const p = camera.position, f = QF().decor; for (const k of CHUNKS) { const R = k.r + f * k.fk; k.im.visible = p.distanceToSquared(k.c) < R * R; } }
// junta geometrias (sem índice) numa só
function mergeGeos(list) {
  const pa = [], na = [];
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0; pa.push(...g.attributes.position.array); na.push(...g.attributes.normal.array); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(na, 3)); return g;
}
// ouriço-preto: carapaça achatada com espinhos longos irradiando (mais curtos embaixo)
function urchinGeo() {
  const parts = [new THREE.SphereGeometry(0.07, 7, 4).scale(1, 0.7, 1)], up = new V3(0, 1, 0), d = new V3(), r = mulberry(5);
  for (let i = 0; i < 30; i++) {
    const y = 1 - 2 * (i + 0.5) / 30, a = i * 2.39996, rr = Math.sqrt(1 - y * y); d.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
    if (d.y < -0.45) continue;
    const L = (0.13 + r() * 0.07) * (d.y < 0 ? 0.55 : 1), c = new THREE.ConeGeometry(0.007, L, 3, 1, true); c.translate(0, L / 2 + 0.05, 0);
    c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d)); parts.push(c);
  }
  return mergeGeos(parts);
}
function smoothNormals(g) {
  const p = g.attributes.position, n = g.attributes.normal, map = new Map(), key = i => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
  for (let i = 0; i < p.count; i++) { const k = key(i); let a = map.get(k); if (!a) map.set(k, a = [0, 0, 0]); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); }
  for (let i = 0; i < p.count; i++) { const a = map.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
}

// texturas procedurais pequenas
function canvasTex(w, h, draw, srgb = true) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); if (srgb) t.encoding = THREE.sRGBEncoding; return t; }
function sandTex() {
  return canvasTex(256, 256, (g) => {
    const img = g.createImageData(256, 256), d = img.data;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const w = Math.sin((x / 256) * TAU * 2 + Math.sin((y / 256) * TAU * 3) * 0.8) ;
      const rip = Math.pow(Math.abs(Math.sin((y / 256) * TAU * 9 + w * 1.6)), 6);
      const v = 0.86 + (Math.random() - 0.5) * 0.16 - rip * 0.13 + 0.04 * Math.sin((x / 256) * TAU * 4) * Math.sin((y / 256) * TAU * 5);
      const o = (y * 256 + x) * 4; d[o] = d[o + 1] = d[o + 2] = clamp(v, 0, 1) * 255; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 260; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = rand(0.6, 2.2); g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,35,30' : '255,250,240'},${rand(0.15, 0.4)})`; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); } }
  }, false);
}
function rockTex() {
  return canvasTex(256, 256, (g) => {
    const img = g.createImageData(256, 256), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = 0.78 + (Math.random() - 0.5) * 0.3; d[i] = d[i + 1] = d[i + 2] = v * 255; d[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 160; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = rand(3, 18); for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.fillStyle = `rgba(${Math.random() < 0.6 ? '20,20,20' : '255,255,255'},${rand(0.06, 0.18)})`; g.beginPath(); g.ellipse(x + ox, y + oy, r, r * rand(0.4, 1), rand(0, 3), 0, TAU); g.fill(); } }
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.2;
    for (let i = 0; i < 30; i++) { let x = Math.random() * 256, y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rand(-12, 12); y += rand(-12, 12); g.lineTo(x, y); } g.stroke(); }
  });
}
function fanTex() {
  return canvasTex(128, 128, (g) => {
    g.strokeStyle = '#fff'; g.lineCap = 'round';
    const br = (x, y, a, l, w, d) => { if (d > 6 || l < 3) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - rand(0.2, 0.5), l * 0.78, w * 0.75, d + 1); br(x2, y2, a + rand(0.2, 0.5), l * 0.78, w * 0.75, d + 1); };
    br(64, 128, -Math.PI / 2, 26, 4, 0); br(64, 128, -Math.PI / 2 - 0.5, 20, 3, 1); br(64, 128, -Math.PI / 2 + 0.5, 20, 3, 1);
    // rede fina entre os ramos (gorgônia-leque)
    g.lineWidth = 0.8; g.globalAlpha = 0.85;
    for (let i = 0; i < 260; i++) { const a = rand(-2.6, -0.55), d = rand(14, 62), x = 64 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, b = a + rand(-1, 1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * 7, y + Math.sin(b) * 7); g.stroke(); }
  });
}
function algaeTex() {
  return canvasTex(64, 128, (g) => {
    for (let s = 0; s < 6; s++) {
      let x = 32 + rand(-10, 10), y = 128; g.strokeStyle = `rgb(${120 + rand(-20, 20)},${95 + rand(-15, 15)},${40})`; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += rand(-4, 4); y -= rand(8, 13); g.lineTo(x, y); } g.stroke();
      g.fillStyle = `rgb(${150 + rand(-20, 20)},${110 + rand(-20, 10)},${45})`;
      for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(x + rand(-12, 12), rand(10, 120), rand(3, 6), rand(1.5, 3), rand(0, 3), 0, TAU); g.fill(); }
    }
  });
}
function rayTex() {
  return canvasTex(32, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h);
  }, false);
}
function dotTex() { return canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }, false); }

// ======= pontos de pesca =======
const SPOTS = [
  { id: 'marina', name: 'Marina Balneário', x: 0, z: 690, type: 'marina', desc: 'Venda do pescado, loja e combustível.' },
  { id: 'botinas', name: 'Ilhas Botinas', x: 300, z: 196, r: 40, depth: '2–10 m', desc: 'Parcel raso e água clara. Muito sargo, garoupas pequenas e robalo de passagem.' },
  { id: 'laje', name: 'Laje Branca', x: LAJE.x, z: LAJE.z, r: 42, depth: '5–23 m', desc: 'Laje isolada no meio da baía, cheia de tocas. Garoupa, badejo, cardume de xaréu. Dizem que tem mero.' },
  { id: 'jorge', name: 'Ilha Jorge Grego', x: 0, z: 0, r: 48, depth: '3–25 m', desc: 'Costão fundo e de água azul. Garoupa e badejo grandes, e olho-de-boi passando no azul.' },
  { id: 'gipoia', name: 'Ilha da Gipóia', x: 0, z: 0, r: 45, depth: '3–17 m', desc: 'Costão abrigado e cheio de vida. Garoupa, sargo, salema, budião e tartaruga.' },
  { id: 'comprida', name: 'Ilha Comprida', x: 0, z: 0, r: 42, depth: '3–14 m', desc: 'Pedras soltas e tocas rasas. Bom pra começar: garoupa, salema e xaréu de passagem.' },
  { id: 'naufragio', name: 'Naufrágio do Pinguino', x: 40, z: -430, r: 45, depth: '12–19 m', desc: 'Casco afundado cheio de tocas. Garoupas, badejos e caranhas grandes moram lá dentro. Leve lanterna.' },
  { id: 'aventureiro', name: 'Parcel do Aventureiro', x: 640, z: -600, r: 55, depth: '13–33 m', desc: 'Mar aberto e água azul. Peixe grande: olho-de-boi, dourado, bicuda e garoupa troféu.' },
  { id: 'lagoa', name: 'Lagoa Azul', x: LAGOA.x, z: LAGOA.z, r: 50, depth: '2–6 m', desc: 'Piscina natural entre as Ilhas do Macaco e a Ilha Grande. Água clarinha, muito peixe manso. Ótima para começar.' },
  { id: 'cataguases', name: 'Ilhas de Cataguases', x: 0, z: 0, r: 48, depth: '4–20 m', desc: 'Arquipélago no meio da baía. Costão com tocas, garoupa, badejo e cardume de xaréu.' },
  { id: 'porcos', name: 'Ilha dos Porcos', x: 0, z: 0, r: 50, depth: '5–22 m', desc: 'Ilha grande na boca leste da baía. Costão fundo onde passa sororoca, enchova e olho-de-boi.' },
  { id: 'cargueiro', name: 'Naufrágio do Cargueiro', x: CARG.x, z: CARG.z, r: 50, depth: '20–27 m', desc: 'Casco grande deitado na areia, fundo de verdade. Garoupas e chernes enormes nas tocas. Só com fôlego treinado.' },
  { id: 'castelhanos', name: 'Ponta de Castelhanos', x: 0, z: 0, r: 52, depth: '8–28 m', cur: [0.32, 0.1], desc: 'Lado de fora da Ilha Grande, mar aberto batendo no costão. Correnteza forte e peixe grande.' },
  { id: 'fora', name: 'Parcel de Fora', x: FORA.x, z: FORA.z, r: 58, depth: '15–40 m', cur: [0.45, -0.18], desc: 'Pináculo isolado no oceano. Água azul, correnteza e pelágicos grandes. Leve combustível de sobra.' },
  { id: 'foz', name: 'Foz do Rio Mambucaba', x: FOZ.x + 30, z: FOZ.z, r: 60, depth: '2–6 m', desc: 'Água turva de rio. Robalo encostado no fundo e cardume de tainha. Visibilidade baixa.' },
];
// zonas: pedaços de costão e lajes fora dos pontos do mapa, com peixe próprio (não aparecem na carta)
const ZONES = [];
const spotById = id => SPOTS.find(s => s.id === id) || ZONES.find(s => s.id === id);
// lajes submersas espalhadas pela baía
const LAJES2 = [{ x: 40, z: 130 }, { x: 1000, z: 300 }, { x: 1250, z: -60 }, { x: 1720, z: -540 }, { x: -470, z: -520 }];

function scatterRocksRing(I, n, seed, spot, holeChance) {
  const r = mulberry(seed);
  for (let k = 0; k < n; k++) {
    const a = r() * TAU; let d = I.r * 0.4, shore = null;
    for (; d < I.r * 2.4; d += 2) { if (H(I.x + Math.cos(a) * d, I.z + Math.sin(a) * d) < -1.2) { shore = d; break; } }
    if (shore == null) continue;
    const dd = shore + Math.pow(r(), 1.6) * 30; const x = I.x + Math.cos(a) * dd, z = I.z + Math.sin(a) * dd; const h = H(x, z);
    if (h > -1) continue;
    const rad = lerp(3.6, 1.0, (dd - shore) / 30) * (0.55 + r() * 0.7);
    const R = addRock(x, h + rad * 0.25, z, rad, spot);
    if (rad > 2.2 && r() < holeChance) addHole(R, a + Math.PI + rand(-0.6, 0.6), spot);
  }
}
// pedras ao longo de uma costa reta: anda de dentro da terra na direção (dx, dz) até achar água
function scatterCoast(S, dx, dz, spread, n, seed, spot, holeChance) {
  const r = mulberry(seed), px = -dz, pz = dx;
  for (let k = 0; k < n; k++) {
    const o = (r() * 2 - 1) * spread, x0 = S.x + px * o - dx * 200, z0 = S.z + pz * o - dz * 200; let shore = null;
    for (let d = 0; d < 420; d += 3) if (H(x0 + dx * d, z0 + dz * d) < -1.2) { shore = d; break; }
    if (shore == null) continue;
    const dd = shore + Math.pow(r(), 1.6) * 36, x = x0 + dx * dd, z = z0 + dz * dd, h = H(x, z); if (h > -1) continue;
    const rad = lerp(4.2, 1.1, (dd - shore) / 36) * (0.55 + r() * 0.7), R = addRock(x, h + rad * 0.25, z, rad, spot);
    if (rad > 2.2 && r() < holeChance) addHole(R, Math.atan2(-dz, -dx) + rand(-0.6, 0.6), spot);
  }
}
function addHole(R, a, spot) {
  const x = R.x + Math.cos(a) * R.r * 0.95, z = R.z + Math.sin(a) * R.r * 0.95;
  const x2 = R.x + Math.cos(a) * R.r * 1.1, z2 = R.z + Math.sin(a) * R.r * 1.1;
  const h = { x: x2, z: z2, y: H(x2, z2) + 0.45, dir: a, spot, used: 0 };
  HOLES.push(h); return h;
}

function buildRocksAndDecor() {
  const r = mulberry(42);
  // Laje Branca
  for (let i = 0; i < 90; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.75) * 44, x = LAJE.x + Math.cos(a) * d, z = LAJE.z + Math.sin(a) * d;
    const rad = lerp(4.6, 1.1, d / 44) * (0.6 + r() * 0.7);
    const R = addRock(x, H(x, z) + rad * 0.25, z, rad, 'laje');
    if (rad > 2.3 && r() < 0.55) addHole(R, r() * TAU, 'laje');
  }
  for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r() * 14, x = LAJE.x + Math.cos(a) * d, z = LAJE.z + Math.sin(a) * d; const rad = 1.4 + r() * 2.2; addRock(x, H(x, z) + 2.4 + rad * 0.3, z, rad, 'laje'); }
  // costões
  scatterRocksRing(ISLANDS[0], 400, 7, 'jorge', 0.5);
  scatterRocksRing(ISLANDS[1], 100, 8, 'botinas', 0.35);
  scatterRocksRing(ISLANDS[2], 80, 9, 'botinas', 0.35);
  scatterRocksRing(ISLANDS[3], 260, 10, 'gipoia', 0.5);
  scatterRocksRing(ISLANDS[4], 200, 11, 'comprida', 0.5);
  scatterRocksRing(ISLANDS[5], 70, 12, 'z_cobras', 0.35);
  // posiciona o ponto da Jorge Grego no costão sudoeste
  const placeSpot = (id, I, dx, dz, depth) => { const J = spotById(id), L = Math.hypot(dx, dz); for (let d = 20; d < 360; d += 2) { const x = I.x + dx / L * d, z = I.z + dz / L * d; if (H(x, z) < depth) { J.x = x; J.z = z; break; } } };
  placeSpot('jorge', ISLANDS[0], -0.62, 0.78, -7); placeSpot('gipoia', ISLANDS[3], 0.45, 0.9, -5); placeSpot('comprida', ISLANDS[4], 0.85, -0.35, -5);
  // expansão: Lagoa Azul, Cataguases, Porcos, Castelhanos, Parcel de Fora
  placeSpot('cataguases', ISLANDS[8], 0.3, -0.95, -6); placeSpot('porcos', ISLANDS[11], -0.8, -0.6, -7); placeSpot('castelhanos', { x: 1250, z: -1350 }, 0, -1, -10);
  scatterRocksRing(ISLANDS[6], 70, 13, 'lagoa', 0.25); scatterRocksRing(ISLANDS[7], 45, 14, 'lagoa', 0.25);
  scatterRocksRing(ISLANDS[8], 260, 15, 'cataguases', 0.5); scatterRocksRing(ISLANDS[9], 85, 16, 'cataguases', 0.45); scatterRocksRing(ISLANDS[10], 60, 17, 'cataguases', 0.35);
  scatterRocksRing(ISLANDS[11], 300, 18, 'porcos', 0.45);
  // zonas de costão em volta das ilhas, longe dos pontos do mapa (uma a cada ~120 m de costa)
  const far = (x, z, m) => SPOTS.every(s => Math.hypot(s.x - x, s.z - z) > m) && ZONES.every(s => Math.hypot(s.x - x, s.z - z) > 95);
  ISLANDS.forEach((I, idx) => {
    if (idx === 5) { ZONES.push({ id: 'z_cobras', x: I.x, z: I.z, r: I.r * 2.2, zone: 'costao' }); return; }
    const n = Math.max(3, Math.round(TAU * I.r * 1.9 / 120));
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU + idx; let px = null, pz = null;
      for (let d = I.r * 0.5; d < I.r * 3; d += 3) { const x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d; if (H(x, z) < -3) { px = x + Math.cos(a) * 14; pz = z + Math.sin(a) * 14; break; } }
      if (px != null && H(px, pz) < -3 && far(px, pz, 110)) ZONES.push({ id: 'zi' + idx + '_' + k, x: px, z: pz, r: 38, zone: 'costao' });
    }
  });
  // costões da Ilha Grande (lado da baía e lado de fora) e do continente, cada zona com seu trecho de pedras
  const coastZ = (x0, x1, step, zFrom, dz, id) => { for (let x = x0, k = 0; x <= x1; x += step, k++) { let z = zFrom; for (let i = 0; i < 160 && H(x, z) > -3; i++) z += dz * 3; z += dz * 10; if (H(x, z) < -3 && far(x, z, 110)) { const Z = { id: id + k, x, z, r: 40, zone: 'costao' }; ZONES.push(Z); scatterCoast(Z, 0, dz, 45, 45, 50 + k + id.length * 7, Z.id, 0.45); } } };
  coastZ(-600, 1380, 170, -900, 1, 'zg');         // Ilha Grande, lado da baía
  coastZ(-700, 1350, 230, -1300, -1, 'zf');      // Ilha Grande, lado de fora (oceano)
  coastZ(-500, 900, 210, 900, -1, 'zc');          // continente (Angra)
  // lajes novas: monte de pedras com tocas
  LAJES2.forEach((L, k) => {
    const id = 'lj' + k; ZONES.push({ id, x: L.x, z: L.z, r: 40, zone: 'laje' });
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, d = Math.pow(r(), 0.75) * 40, x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d, rad = lerp(4.2, 1.1, d / 40) * (0.6 + r() * 0.7);
      const R = addRock(x, H(x, z) + rad * 0.25, z, rad, id); if (rad > 2.2 && r() < 0.5) addHole(R, r() * TAU, id);
    }
  });
  scatterCoast(spotById('castelhanos'), 0, -1, 140, 190, 19, 'castelhanos', 0.55);
  for (let i = 0; i < 120; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.7) * 62, x = FORA.x + Math.cos(a) * d, z = FORA.z + Math.sin(a) * d, rad = lerp(5.5, 1.4, d / 62) * (0.6 + r() * 0.7);
    const R = addRock(x, H(x, z) + rad * 0.25, z, rad, 'fora'); if (rad > 2.5 && r() < 0.5) addHole(R, r() * TAU, 'fora');
  }
  // foz: poucas pedras
  for (let i = 0; i < 25; i++) { const x = FOZ.x + rand(-60, 90), z = FOZ.z + rand(-70, 70); const h = H(x, z); if (h < -1.5) addRock(x, h + 0.3, z, rand(0.8, 2.0), 'foz'); }

  extraRocks();
  // instancia as pedras em 6 variações
  const geos = [1, 2, 3, 4, 5, 6].map(s => rockGeo(s * 17));
  const rtex = rockTex(); rtex.wrapS = rtex.wrapT = THREE.RepeatWrapping; rtex.repeat.set(3, 2);
  const mat = uwify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, map: rtex }), { key: 'r' });
  const groups = geos.map(() => []);
  ROCKS.forEach((R, i) => groups[i % 6].push(R));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(), pp = new V3();
  // pedras desenhadas por blocos de 160 m, só com a câmera por perto (vistas de longe também da superfície)
  groups.forEach((list, gi) => {
    chunked(geos[gi], mat, list.map(R => { const it = [R.x, R.y, R.z]; it.R = R; return it; }), (it, k, im) => { const R = it.R; e.set(rand(-0.15, 0.15), rand(0, TAU), rand(-0.15, 0.15)); q.setFromEuler(e); R.q = q.clone(); R.gi = gi; s.set(R.r, R.r * R.sy, R.r); pp.set(R.x, R.y, R.z); m4.compose(pp, q, s); im.setMatrixAt(k, m4); }, 300);
  });
  buildWreck({ x: NAUF.x, z: NAUF.z, ry: 0.6, L: 34, spot: 'naufragio' });
  buildWreck({ x: CARG.x, z: CARG.z, ry: -0.45, L: 48, spot: 'cargueiro' });

  // troncos no rio
  const logMat = uwify(new THREE.MeshStandardMaterial({ color: 0x3b2c1e, roughness: 1 }), { key: 'l' });
  for (let i = 0; i < 14; i++) {
    const x = FOZ.x + rand(-80, 60), z = FOZ.z + rand(-50, 50), h = H(x, z); if (h > -1) continue;
    const l = rand(3, 8); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, l, 7), logMat);
    m.position.set(x, h + 0.2, z); m.rotation.set(Math.PI / 2 + rand(-0.2, 0.2), 0, rand(0, TAU)); m.rotation.order = 'ZXY'; scene.add(m);
    addRock(x, h + 0.2, z, 0.6, 'foz');
  }

  // decoração: gorgônias, sargaço, ouriços
  const fanM = uwify(new THREE.MeshLambertMaterial({ map: fanTex(), alphaTest: 0.4, side: THREE.DoubleSide }), {
    key: 'f', vBody: SURGE_GLSL + ' float fy=max(position.y,0.0); transformed.z+=(dot(surge,vec2(instanceMatrix[2].x,instanceMatrix[2].z))*0.22+sin(uTime*1.7+instanceMatrix[3].x)*0.03)*fy*fy;'
  });
  const algM = uwify(new THREE.MeshLambertMaterial({ map: algaeTex(), alphaTest: 0.45, side: THREE.DoubleSide }), {
    key: 'a', vBody: SURGE_GLSL + ' float sw=max(position.y,0.0); vec3 sw3=vec3(surge.x,0.0,surge.y), c0=instanceMatrix[0].xyz, c2=instanceMatrix[2].xyz; vec3 sl=vec3(dot(normalize(c0),sw3),0.0,dot(normalize(c2),sw3)); transformed.x+=(sin(uTime*1.3+instanceMatrix[3].x*0.7+instanceMatrix[3].z*0.3)*0.08+sl.x*0.18)*sw; transformed.z+=(cos(uTime*0.9+instanceMatrix[3].z*0.6)*0.05+sl.z*0.18)*sw;'
  });
  const fanG = new THREE.PlaneGeometry(1, 1); fanG.translate(0, 0.5, 0);
  const algG = (() => { const a = new THREE.PlaneGeometry(0.7, 1.2); a.translate(0, 0.6, 0); const b = a.clone(); b.rotateY(Math.PI / 2); const pa = [...a.attributes.position.array, ...b.attributes.position.array], ua = [...a.attributes.uv.array, ...b.attributes.uv.array], na = [...a.attributes.normal.array, ...b.attributes.normal.array]; const ia = [...a.index.array, ...b.index.array.map(i => i + 4)]; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(ua, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(na, 3)); g.setIndex(ia); return g; })();
  const urG = urchinGeo();
  const urM = uwify(new THREE.MeshStandardMaterial({ color: 0x1a0d1c, roughness: 0.6 }), { key: 'u' });
  const fans = [], algs = [], urs = [];
  ROCKS.forEach(R => {
    if (R.spot === 'foz' || !R.spot) { if (Math.random() < 0.5) algs.push([R.x + rand(-1, 1), R.y + R.r * R.sy * 0.75, R.z + rand(-1, 1), rand(0.6, 1.2)]); return; }
    const n = Math.floor(rand(0, 4.5));
    for (let k = 0; k < n; k++) { const a = rand(0, TAU), x = R.x + Math.cos(a) * R.r * 1.05, z = R.z + Math.sin(a) * R.r * 1.05; fans.push([x, H(x, z), z, rand(0.5, 1.4), a]); }
    for (let k = 0; k < 4; k++) algs.push([R.x + rand(-R.r, R.r) * 0.5, R.y + R.r * R.sy * rand(0.55, 0.85), R.z + rand(-R.r, R.r) * 0.5, rand(0.5, 1.1)]);
    for (let k = 0; k < 5; k++) { const a = rand(0, TAU), x = R.x + Math.cos(a) * R.r * 0.92, z = R.z + Math.sin(a) * R.r * 0.92, u = [x, H(x, z) + 0.08, z]; u.spot = R.spot; urs.push(u); }
  });
  
  const fanCols = [0x8a3fa0, 0xd9a520, 0xc0502a, 0x6a2a80, 0xe0d0b0];
  chunked(fanG, fanM, fans, (f, i, fanIM) => { e.set(0, f[4], rand(-0.2, 0.2)); q.setFromEuler(e); s.set(f[3], f[3] * rand(0.8, 1.3), f[3]); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); fanIM.setMatrixAt(i, m4); fanIM.setColorAt(i, new THREE.Color(pick(fanCols))); });
  chunked(algG, algM, algs, (f, i, algIM) => { e.set(0, rand(0, TAU), 0); q.setFromEuler(e); s.set(f[3], f[3], f[3]); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); algIM.setMatrixAt(i, m4); });
  chunked(urG, urM, urs, (f, i, im) => { e.set(0, rand(0, TAU), 0); q.setFromEuler(e); s.setScalar(rand(0.75, 1.2)); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); });
  // capim/sargaço espalhado no fundo arenoso da baía
  const sea = []; for (let i = 0; i < 6500; i++) { const x = rand(WB.x0, WB.x1), z = rand(WB.z0, WB.z1), h = H(x, z); if (h < -2 && h > -16 && fbm(x * 0.02 + 40, z * 0.02, 2) > 0.2) sea.push([x, h, z]); }
  const seaIM = new THREE.InstancedMesh(algG, algM, sea.length);
  sea.forEach((f, i) => { e.set(0, rand(0, TAU), 0); q.setFromEuler(e); const k = rand(0.35, 0.8); s.set(k, k, k); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); seaIM.setMatrixAt(i, m4); });
  scene.add(seaIM);
}

// ================= terra: árvores, casas, píer, bóias =================
function buildLand() {
  const trees = [], houses = [];
  for (let i = 0; i < 26000 && trees.length < 5200; i++) {
    const x = rand(-1500, 3000), z = rand(-2600, 1300), h = H(x, z);
    if (h > 3 && h < 140) trees.push([x, h, z]);
  }
  for (let i = 0; i < 4000 && houses.length < 70; i++) {
    const x = rand(-500, 500), z = rand(770, 900), h = H(x, z);
    if (h > 2.5 && h < 25 && Math.abs(x) > 18) houses.push([x, h, z]);
  }
  const tG = new THREE.ConeGeometry(2.6, 7, 6); tG.translate(0, 3.2, 0);
  const tM = new THREE.MeshLambertMaterial({ color: 0x1f4a22 });
  const tIM = new THREE.InstancedMesh(tG, tM, trees.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), pp = new V3();
  trees.forEach((t, i) => { const k = rand(0.7, 1.6); s.set(k, k * rand(0.8, 1.3), k); pp.set(t[0], t[1] - 0.5, t[2]); q.setFromAxisAngle(new V3(0, 1, 0), rand(0, TAU)); m4.compose(pp, q, s); tIM.setMatrixAt(i, m4); tIM.setColorAt(i, new THREE.Color().setHSL(0.3 + rand(-0.04, 0.03), 0.45, rand(0.12, 0.22))); });
  scene.add(tIM);
  const hG = new THREE.BoxGeometry(6, 4, 7); hG.translate(0, 2, 0);
  const rG = new THREE.ConeGeometry(5.4, 2.6, 4); rG.rotateY(Math.PI / 4); rG.translate(0, 5.3, 0);
  const hIM = new THREE.InstancedMesh(hG, new THREE.MeshLambertMaterial({ color: 0xf2efe6 }), houses.length);
  const rIM = new THREE.InstancedMesh(rG, new THREE.MeshLambertMaterial({ color: 0xb4532a }), houses.length);
  houses.forEach((t, i) => { const k = rand(0.8, 1.4); s.set(k, k, k); pp.set(t[0], t[1] - 0.3, t[2]); q.setFromAxisAngle(new V3(0, 1, 0), rand(-0.3, 0.3)); m4.compose(pp, q, s); hIM.setMatrixAt(i, m4); rIM.setMatrixAt(i, m4); });
  scene.add(hIM, rIM);
  // píer da marina
  const wood = uwify(new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 }), { key: 'w' });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, PIER.z0 - PIER.z1), wood);
  deck.position.set(PIER.x, 1.3, (PIER.z0 + PIER.z1) / 2); scene.add(deck);
  const tdeck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 3.2), wood); tdeck.position.set(PIER.x, 1.3, PIER.z1); scene.add(tdeck);
  for (let z = PIER.z1; z <= PIER.z0; z += 6) for (const sx of [-1.4, 1.4]) {
    const h = H(PIER.x + sx, z); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.5 - h, 6), wood);
    post.position.set(PIER.x + sx, (1.5 + h) / 2, z); scene.add(post);
  }
  const shed = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 8), new THREE.MeshLambertMaterial({ color: 0xe8f0f2 }));
  const hz = PIER.z0 + 10; shed.position.set(PIER.x + 12, H(PIER.x + 12, hz) + 2, hz); scene.add(shed);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 9), new THREE.MeshLambertMaterial({ color: 0x1f6f8b })); roof.position.copy(shed.position).add(new V3(0, 2.2, 0)); scene.add(roof);
  // bóias de sinalização dos pontos
  const bG = new THREE.SphereGeometry(0.6, 12, 8), bM = new THREE.MeshStandardMaterial({ color: 0xff6a00, roughness: 0.5 });
  const pole = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), poleM = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const flagG = new THREE.PlaneGeometry(0.8, 0.5), flagM = new THREE.MeshLambertMaterial({ color: 0xd8262a, side: THREE.DoubleSide });
  BUOYS.length = 0;
  SPOTS.forEach(sp => {
    if (sp.type === 'marina') return;
    const g = new THREE.Group(); g.add(new THREE.Mesh(bG, bM)); const p = new THREE.Mesh(pole, poleM); p.position.y = 1.2; g.add(p);
    const f = new THREE.Mesh(flagG, flagM); f.position.set(0.4, 2.0, 0); g.add(f);
    g.position.set(sp.x, 0, sp.z); scene.add(g); BUOYS.push(g);
  });
}
const BUOYS = [];

// ================= partículas / raios de luz =================
let snow, snowPos, rays, bubbles, plank;
const _sg = new V3();
function buildFX() {
  const N = 900; snowPos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) snowPos[i] = rand(-14, 14);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  snow = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.05, map: dotTex(), transparent: true, opacity: 0.55, depthWrite: false, color: 0xcfe6e0 }));
  snow.frustumCulled = false; scene.add(snow);
  const pg = new THREE.BufferGeometry(), pp = new Float32Array(160 * 3); for (let i = 0; i < pp.length; i++) pp[i] = rand(-9, 9);
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  plank = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.11, map: dotTex(), transparent: true, opacity: 0.4, depthWrite: false, color: 0xe8f4e0 }));
  plank.frustumCulled = false; scene.add(plank);
  rays = new THREE.Group(); const rt = rayTex();
  for (let i = 0; i < 22; i++) {
    const w = rand(1.2, 4), pg = new THREE.PlaneGeometry(w, 40); pg.translate(0, -20, 0);
    const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, color: 0x9fe8ff }));
    m.userData = { ox: rand(-18, 18), oz: rand(-18, 18), ph: rand(0, TAU) }; rays.add(m);
  }
  scene.add(rays);
  // bolhas
  const BN = 140, bp = new Float32Array(BN * 3).fill(9999);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  bubbles = new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.07, map: dotTex(), transparent: true, opacity: 0.8, depthWrite: false, color: 0xeaffff }));
  bubbles.frustumCulled = false; bubbles.userData = { list: [], arr: bp }; scene.add(bubbles);
}
function spawnBubbles(p, n, spread = 0.15) {
  const L = bubbles.userData.list;
  for (let i = 0; i < n; i++) { if (L.length > 135) L.shift(); L.push({ x: p.x + rand(-spread, spread), y: p.y + rand(-spread, spread), z: p.z + rand(-spread, spread), vy: rand(0.4, 1.0), t: rand(0, 6) }); }
}
function updateFX(dt, camUnder, murk, t) {
  updateChunks();
  snow.visible = plank.visible = camUnder;
  surgeAt(t, _sg);
  if (camUnder) {
    const c = camera.position;
    // plâncton: flocos maiores, poucos, deriva lenta com o vaivém
    const pa = plank.geometry.attributes.position.array;
    for (let i = 0; i < pa.length; i += 3) {
      pa[i] += (_sg.x * 0.18 + Math.sin(t * 0.3 + i) * 0.04) * dt; pa[i + 1] += Math.sin(t * 0.5 + i * 0.7) * 0.02 * dt; pa[i + 2] += (_sg.z * 0.18 + Math.cos(t * 0.27 + i) * 0.04) * dt;
      for (let k = 0; k < 3; k++) { const cc = k === 0 ? c.x : k === 1 ? c.y : c.z; let v = pa[i + k]; if (v - cc > 9) v -= 18; else if (v - cc < -9) v += 18; pa[i + k] = v; }
    }
    plank.geometry.attributes.position.needsUpdate = true; plank.material.opacity = 0.35 + murk * 0.3;
    for (let i = 0; i < snowPos.length; i += 3) {
      snowPos[i] += _sg.x * dt * 0.12; snowPos[i + 1] -= dt * 0.03; snowPos[i + 2] += _sg.z * dt * 0.12;
      for (let k = 0; k < 3; k++) { const cc = k === 0 ? c.x : k === 1 ? c.y : c.z; let v = snowPos[i + k]; if (v - cc > 14) v -= 28; else if (v - cc < -14) v += 28; snowPos[i + k] = v; }
    }
    snow.geometry.attributes.position.needsUpdate = true;
    snow.material.opacity = 0.45 + murk * 0.4; snow.material.size = 0.045 + murk * 0.03;
  }
  rays.visible = camUnder && murk < 0.6;
  if (rays.visible) {
    const c = camera.position;
    rays.children.forEach(m => {
      const u = m.userData; m.position.set(c.x + u.ox, waveH(c.x + u.ox, c.z + u.oz, t), c.z + u.oz);
      m.rotation.set(0, Math.atan2(c.x - m.position.x, c.z - m.position.z), 0);
      m.rotateZ(0.25 + Math.sin(t * 0.13 + u.ph) * 0.06); m.material.opacity = (0.045 + 0.035 * Math.sin(t * 0.7 + u.ph)) * (1 - murk) * DAY.sun;
    });
  }
  const L = bubbles.userData.list, arr = bubbles.userData.arr;
  for (let i = L.length - 1; i >= 0; i--) { const b = L[i]; b.t += dt; b.y += b.vy * dt; b.x += Math.sin(b.t * 7) * 0.003; if (b.y > waveH(b.x, b.z, t)) L.splice(i, 1); }
  for (let i = 0; i < arr.length / 3; i++) { const b = L[i]; if (b) { arr[i * 3] = b.x; arr[i * 3 + 1] = b.y; arr[i * 3 + 2] = b.z; } else arr[i * 3 + 1] = 9999; }
  bubbles.geometry.attributes.position.needsUpdate = true;
}
