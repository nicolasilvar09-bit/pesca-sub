// ================= cena: renderizador, câmera, luz, céu e utilitários de geometria =================
const renderer = new T.WebGLRenderer({ canvas: $('cv'), antialias: false, powerPreference: 'high-performance' });
renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
const QUAL = [{ pr: 0.75, fog: 600, shadow: 0, grass: 0, post: 0 }, { pr: 1.15, fog: 850, shadow: 1024, grass: 1, post: 1, rain: 1300 }, { pr: 2, fog: 1200, shadow: 2048, grass: 1, post: 1, rain: 2600 }];
var AUTO = { lv: 0, t: 0, low: 0 }; // ajuste automático de desempenho (0 = tudo ligado)
var DYN = 1; // escala de resolução dinâmica (baixa sozinha se o celular não segurar o FPS)
const scene = new T.Scene();
const SKY_C = new T.Color(MAPID === 'bal' ? 0xc6d4cf : 0xc3ced6); // névoa atmosférica (no Balneário, mais úmida e esverdeada)
scene.background = SKY_C.clone();
scene.fog = new T.Fog(SKY_C, 120, 950);
const camera = new T.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2600); // near maior = profundidade mais precisa (menos tremido de faces próximas no celular)
camera.rotation.order = 'YXZ';
scene.add(camera);
const HEMI = new T.HemisphereLight(0xbfd6ee, 0x6b6150, 0.85); scene.add(HEMI);
const sun = new T.DirectionalLight(0xffe2b8, 1.9); sun.position.set(320, 330, 180); scene.add(sun); // sol quente e mais baixo

function applyQuality() {
  const q = QUAL[SET.quality] || QUAL[1];
  scene.fog.far = q.fog; scene.fog.near = q.fog * 0.12;
  applyRes();
  if (typeof gfxQuality === 'function') gfxQuality(q);
}
function applyRes() {
  const q = QUAL[SET.quality] || QUAL[1];
  renderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio || 1, q.pr) * DYN));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (typeof postResize === 'function') postResize();
}
addEventListener('resize', applyQuality);

// céu em degradê (azul vivo em cima, claro no horizonte)
const SKY = (() => {
  const g = new T.SphereGeometry(2300, 24, 12), p = g.attributes.position, c = [];
  const top = new T.Color(0x4f86c6), hor = new T.Color(0xd3dde3), tmp = new T.Color();
  for (let i = 0; i < p.count; i++) { const k = Math.pow(clamp(p.getY(i) / 2300 * 1.8, 0, 1), 0.7); tmp.copy(hor).lerp(top, k); c.push(tmp.r, tmp.g, tmp.b); }
  g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
  const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10; scene.add(m); return m;
})();

const MAT = {
  world: new T.MeshLambertMaterial({ vertexColors: true }),
  terrain: new T.MeshLambertMaterial({ vertexColors: true }),
  actor: new T.MeshLambertMaterial({ vertexColors: true }),
  item: new T.MeshLambertMaterial({ vertexColors: true, emissive: 0x222222 }),
  view: new T.MeshPhongMaterial({ vertexColors: true, depthTest: true, shininess: 45, specular: 0x4a4a4a, emissive: 0x16171a }),
};

// junta várias peças (caixa, esfera, cilindro) numa geometria só com cor por vértice: 1 desenho por objeto
const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _p3 = new T.Vector3(), _s3 = new T.Vector3(), _col = new T.Color();
const GEO = {
  box: new T.BoxGeometry(1, 1, 1), sph: new T.SphereGeometry(0.5, 10, 8), hsph: new T.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
  cyl: new T.CylinderGeometry(0.5, 0.5, 1, 10), cyl6: new T.CylinderGeometry(0.5, 0.5, 1, 6), cone: new T.ConeGeometry(0.5, 1, 8),
};
function mergeParts(parts) {
  const pos = [], nor = [], col = [];
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    _e.set(p.rx || 0, p.ry || 0, p.rz || 0); _q.setFromEuler(_e);
    _s3.set(p.sx == null ? 1 : p.sx, p.sy == null ? 1 : p.sy, p.sz == null ? 1 : p.sz);
    _m4.compose(_p3.set(p.x || 0, p.y || 0, p.z || 0), _q, _s3); g.applyMatrix4(_m4);
    const pa = g.attributes.position.array, na = g.attributes.normal.array; _col.set(p.c);
    for (let i = 0; i < pa.length; i++) { pos.push(pa[i]); nor.push(na[i]); }
    for (let i = 0; i < pa.length / 3; i++) col.push(_col.r, _col.g, _col.b);
    g.dispose();
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.computeBoundingSphere(); return g;
}
// caixa com o canto de baixo em (x0,y0,z0) e tamanho (w,h,d): atalho para montar peças
const bx = (x0, y0, z0, w, h, d, c, extra) => Object.assign({ g: GEO.box, x: x0 + w / 2, y: y0 + h / 2, z: z0 + d / 2, sx: w, sy: h, sz: d, c }, extra || {});
