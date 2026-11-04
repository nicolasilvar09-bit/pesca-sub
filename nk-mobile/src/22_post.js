// ================= pós-processamento: antisserrilhado (MSAA), curva de cinema, cor estilo PUBG, nitidez, vinheta =================
// a cena (já com a curva de cinema ACES) é desenhada numa textura com 4 amostras por pixel; depois um único passe
// aplica nitidez, cor e vinheta e manda para a tela.
// sem WebGL2/float (celular muito antigo) cai no desenho direto de antes.
var PP = null;
function postSupported() {
  try { return renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float')); } catch (e) { return false; }
}
function postInit() {
  if (PP) return PP;
  const rt = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, samples: 4, depthBuffer: true, stencilBuffer: true }); // com stencil a profundidade é de 24 bits (16 bits dá faixas no chão visto de longe)
  const mat = new T.ShaderMaterial({
    uniforms: { tD: { value: rt.texture }, uPx: { value: new T.Vector2(1, 1) }, uSharp: { value: 0.2 }, uVig: { value: 0.42 }, uGrade: { value: 1 } },
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tD; uniform vec2 uPx; uniform float uSharp; uniform float uVig; uniform float uGrade; varying vec2 vUv;
vec3 ppSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec3 c = texture2D(tD, vUv).rgb;
  // nitidez leve (recupera detalhe perdido na resolução reduzida do celular)
  vec3 n = texture2D(tD, vUv + vec2(uPx.x, 0.0)).rgb + texture2D(tD, vUv - vec2(uPx.x, 0.0)).rgb + texture2D(tD, vUv + vec2(0.0, uPx.y)).rgb + texture2D(tD, vUv - vec2(0.0, uPx.y)).rgb;
  c = clamp(c + (c - n * 0.25) * uSharp, c * 0.6, c * 1.6 + 0.02);
  c = clamp(c, 0.0, 1.0);
  // cor estilo PUBG: um pouco mais saturada, sombras levemente frias, luz do sol levemente quente
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  vec3 g = mix(vec3(l), c, 1.0 + 0.06 * (1.0 - smoothstep(0.15, 0.6, sat))); // vibração: realça cor apagada sem estourar a forte
  g *= mix(vec3(0.97, 0.995, 1.035), vec3(1.025, 1.005, 0.985), smoothstep(0.05, 0.5, l) * (1.0 - smoothstep(0.6, 0.9, l)));
  c = mix(c, g, uGrade);
  c = ppSRGB(clamp(c, 0.0, 1.0));
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.2 * uGrade); // contraste em S (nítido, estilo cinema)
  vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * uVig;
  gl_FragColor = vec4(c, 1.0);
}`,
  });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
  const sc = new T.Scene(); sc.add(quad);
  PP = window.__PP = { rt, mat, sc, cam: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), on: false, lt: 0, cool: 0, v: new T.Vector2() };
  return PP;
}
function postResize() {
  if (!PP) return;
  renderer.getDrawingBufferSize(PP.v); PP.rt.setSize(Math.max(4, PP.v.x), Math.max(4, PP.v.y));
  PP.mat.uniforms.uPx.value.set(1 / Math.max(4, PP.v.x), 1 / Math.max(4, PP.v.y));
  PP.mat.uniforms.uSharp.value = renderer.getPixelRatio() < 1.5 ? 0.28 : 0.16;
}
function postWanted() { const q = QUAL[SET.quality] || QUAL[1]; return !!q.post && !window.__noPost && postSupported(); }
function drawScene() {
  dynRes(); // antes de desenhar: mudar o tamanho da tela limpa a imagem, então nunca depois
  const want = postWanted();
  if (want && !PP) { postInit(); postResize(); }
  if (PP && PP.on !== want) { PP.on = want; if (GFX.water) GFX.water.uniforms.uLin.value = want ? 1 : 0; applyFogColor(); } // névoa: mesma cor final na tela com ou sem o passe
  if (PP && PP.on) {
    renderer.setRenderTarget(PP.rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(PP.sc, PP.cam);
  } else renderer.render(scene, camera);
}
// resolução dinâmica: se cair abaixo de ~38 FPS reduz a resolução aos poucos; com folga, volta
function dynRes() {
  const now = performance.now();
  if (!dynRes.t) dynRes.t = now;
  if (now - dynRes.t < 3000 || G.phase !== 'match' || !G.fps) return;
  dynRes.t = now;
  // cada troca de resolução recria a imagem interna (dá um soluço): troca pouco, num passo só, e sobe devagar
  let d = DYN;
  if (G.fps < 36 && DYN > 0.6) { d = Math.max(0.6, Math.round(DYN * Math.sqrt(G.fps / 48) * 10) / 10); dynRes.good = 0; }
  else if (G.fps > 56 && DYN < 1) { if ((dynRes.good = (dynRes.good || 0) + 1) >= 4) { d = Math.min(1, DYN + 0.1); dynRes.good = 0; } }
  else dynRes.good = 0;
  if (Math.abs(d - DYN) > 0.01) { DYN = d; applyRes(); }
}
