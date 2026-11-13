// ================= visual de cinema: céu com nuvens de verdade, luz com mais contraste, bloom, cor realista, grão e relevo nas superfícies =================
// liga/desliga em Configurações > "Visual realista (cinema)". Vem ligado no Médio e no Alto. O passe de cor e o bloom ficam em 22_post.js.
if (SET.cine == null) SET.cine = true;
const CINE = { on: false, bloom: 0.5, t: 0 };
// camada de nuvens: um disco grande acima da câmera com nuvens de ruído (macias, iluminadas pelo sol, somem no horizonte)
const CLOUDS = (() => {
  const g = new T.CircleGeometry(2250, 48); g.rotateX(Math.PI / 2);
  const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: T.DoubleSide,
    uniforms: { uT: { value: 0 }, uSun: { value: SUN_DIR }, uCov: { value: 0.5 }, uLit: { value: new T.Color(0xffffff) }, uDark: { value: new T.Color(0x8a97a8) }, uOff: { value: new T.Vector2() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP; uniform float uT; uniform vec3 uSun; uniform float uCov; uniform vec3 uLit; uniform vec3 uDark; uniform vec2 uOff;
${GLSL_NOISE}
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 17.3; a *= 0.5; } return s; }
void main(){
  vec2 p = (vP.xz + uOff) * 0.0035 + vec2(uT * 0.006, uT * 0.002);
  float n = fbm(p) / 0.97, n2 = fbm(p * 3.1 + 5.0) / 0.97;
  float thr = mix(0.66, 0.26, uCov), d = smoothstep(thr, thr + 0.2, n * 0.8 + n2 * 0.2);
  // luz: lado do sol claro, miolo e base mais escuros
  float sh = fbm(p + uSun.xz * 0.06);
  float lit = clamp(0.55 + (n - sh) * 2.2, 0.0, 1.0);
  vec3 c = mix(uDark, uLit, lit * (1.0 - d * 0.35));
  float r = length(vP.xz) / 2250.0, fade = 1.0 - smoothstep(0.35, 0.98, r);
  gl_FragColor = vec4(c, d * fade * 0.92);
}` });
  const mesh = new T.Mesh(g, m); mesh.renderOrder = -8; mesh.frustumCulled = false; mesh.visible = false; mesh.position.y = 400; SKY.add(mesh); return mesh; /* segue a câmera junto com o céu (partida e lobby) */
})();
const CINE_WX = { dia: [0.3, 0xffffff, 0xa9b6c6], tarde: [0.52, 0xffd9b0, 0x8a6f78], nublado: [0.86, 0xd9dee4, 0x7c858f], chuva: [0.95, 0xb4bcc4, 0x5c646c], noite: [0.5, 0x4a5878, 0x141a28] };
function cineApply() {
  const want = !!SET.cine && SET.quality > 0;
  CINE.on = want;
  DET.uBump.value = want ? 1 : 0;
  CLOUDS.visible = want; if (NAT.clouds) NAT.clouds.visible = !want;
  const w = CINE_WX[typeof WX !== 'undefined' ? WX.k : 'dia'] || CINE_WX.dia, u = CLOUDS.material.uniforms; u.uCov.value = w[0]; u.uLit.value.set(w[1]); u.uDark.value.set(w[2]);
  if (typeof PP !== 'undefined' && PP && PP.on) { u.uLit.value.convertSRGBToLinear(); u.uDark.value.convertSRGBToLinear(); }
}
(function hookCinema() {
  // luz: no visual de cinema o sol pesa mais e o céu "enche" menos as sombras (mais contraste, como em foto)
  const sw = setWeather;
  setWeather = function (k) { const r = sw.apply(this, arguments);
    if (SET.cine && SET.quality > 0) { const w = WEATHER[WX.k]; sun.intensity = w.si * 1.12; HEMI.intensity = w.hi * (w.night ? 1 : 0.78);
      if (typeof SKY2 !== 'undefined' && SKY2 && WX.k === 'dia') { const u = SKY2.material.uniforms; u.turbidity.value = 2.2; u.rayleigh.value = 1.9; } } /* céu mais azul e limpo */
    cineApply(); return r; };
  const aq = applyQuality; applyQuality = function () { const r = aq.apply(this, arguments); cineApply(); return r; };
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q);
    if (CINE.on) { CINE.t += dt; const u = CLOUDS.material.uniforms; u.uT.value = CINE.t; u.uOff.value.set(camera.position.x, camera.position.z); }
    return o; };
  const om = openMenu; openMenu = function (...q) { const r = om.apply(this, q);
    const box = document.querySelector('#menuP .box'), ref = $('sQ') && $('sQ').closest('label');
    if (box && ref && !$('sCine')) { const l = document.createElement('label'); l.innerHTML = 'Visual realista (cinema) <input type="checkbox" id="sCine">'; ref.after(l); $('sCine').checked = !!SET.cine; $('sCine').onchange = e => { SET.cine = e.target.checked; saveSet(); setWeather(WX.k); }; }
    return r; };
  cineApply();
})();
