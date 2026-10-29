// ================= visual: céu, pôr do sol, mar raso, espuma e reflexo =================

// ---------- céu compartilhado: o mesmo céu no alto e refletido na água ----------
// OCT = oitavas do ruído das nuvens (o reflexo usa menos, é mais barato)
const SKY_GLSL = oct => `
float skH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float skN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(skH(i),skH(i+vec2(1,0)),f.x),mix(skH(i+vec2(0,1)),skH(i+vec2(1,1)),f.x),f.y);}
float skF(vec2 p){float s=0.0,a=0.5;for(int i=0;i<${oct};i++){s+=a*skN(p);p*=2.03;a*=0.5;}return s;}
vec3 skyCol(vec3 d){
  float y=max(d.y,0.0), s=max(dot(d,uSun),0.0), up=smoothstep(-0.08,0.02,uSun.y);
  vec3 zen=mix(vec3(0.008,0.014,0.04),vec3(0.22,0.46,0.82),uDay);
  zen=mix(zen,vec3(0.26,0.24,0.46)*(0.3+0.7*uDay),uDusk*0.55);             // topo arroxeado no fim da tarde
  zen=mix(zen,vec3(0.5,0.53,0.57)*uDay+0.01,uCloud*0.6);
  vec3 c=mix(uHaze,zen,pow(y,0.45));
  // faixa do pôr do sol: laranja no horizonte, rosa acima, mais forte do lado do sol
  float band=(1.0-smoothstep(0.0,0.42,y))*uDusk*(1.0-uCloud*0.6);
  c+=mix(vec3(1.0,0.42,0.12),vec3(0.9,0.38,0.55),smoothstep(0.02,0.3,y))*band*(0.3+0.9*pow(s,2.5));
  c+=vec3(1.0,0.5,0.18)*uDusk*pow(s,24.0)*1.2*up;                          // brilho grande em volta do sol baixo
  c+=vec3(1.0,0.9,0.75)*pow(s,10.0)*0.18*up*(1.0-uCloud*0.8);
  if(d.y>0.0){
    vec2 cp=d.xz/(d.y+0.12)*1.4+vec2(uTime*0.004,0.0);
    float f0=skF(cp), cl=smoothstep(0.52-uCloud*0.4,0.8,f0)*smoothstep(0.0,0.12,d.y);
    // luz na nuvem: amostra deslocada para o sol, borda iluminada e base mais escura
    float lit=clamp((f0-skF(cp+uSun.xz*0.09))*3.2+0.85,0.62,1.2);
    vec3 cc=vec3(0.97,0.97,0.98)*lit*(0.06+0.94*uDay);
    cc=mix(cc,mix(vec3(1.0,0.5,0.3),vec3(0.95,0.45,0.6),1.0-lit)*(0.55+0.5*lit),uDusk*0.75*(0.5+0.5*pow(s,1.5)));
    cc=mix(cc,vec3(0.5,0.52,0.56)*(0.08+0.92*uDay)*lit,uCloud*0.6);
    cc+=vec3(1.0,0.88,0.7)*pow(s,8.0)*(1.0-cl)*0.6*up;                    // contorno prateado contra o sol
    // cirros: fios altos e finos, bonitos no entardecer
    float ci=smoothstep(0.58,0.86,skF(vec2(cp.x*0.32,cp.y*2.4)+vec2(uTime*0.002,7.0)))*smoothstep(0.03,0.25,d.y)*(1.0-uCloud);
    c+=mix(vec3(0.9,0.93,0.97)*uDay,vec3(1.0,0.55,0.45),uDusk)*ci*0.35;
    c=mix(c,cc,cl*0.88);
  }
  return c;
}`;

// ---------- mapa de profundidade para a cor do raso e a espuma da arrebentação ----------
const SHAL = { done: false };
function bakeShallow() {
  if (SHAL.done || !waterMat) return; SHAL.done = true; const t0 = performance.now();
  const N = 256, x0 = WB.x0 - 150, x1 = WB.x1 + 150, z0 = WB.z0 - 150, z1 = WB.z1 + 150, d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = x0 + (i + 0.5) / N * (x1 - x0), z = z0 + (j + 0.5) / N * (z1 - z0), k = (j * N + i) * 4;
    d[k] = Math.round(clamp(-H(x, z), 0, 25.5) * 10); d[k + 3] = 255;
  }
  const tex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  waterMat.uniforms.uShal.value = tex; waterMat.uniforms.uShalB.value.set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)); SHAL.ms = performance.now() - t0;
}
const SHAL_COL = () => AMZ ? 'vec3(0.17,0.21,0.10)' : NE ? 'vec3(0.10,0.66,0.62)' : 'vec3(0.08,0.42,0.38)';

// trecho do shader da água vista de cima: raso claro, espuma na beira e nas cristas, brilho do sol
const WATER_TOP = () => `
  float dep=25.0; vec2 su=(vW.xz-uShalB.xy)*uShalB.zw;
  if(su.x>0.0&&su.y>0.0&&su.x<1.0&&su.y<1.0) dep=texture2D(uShal,su).r*25.5;
  float shl=exp(-dep*0.3)*(1.0-smoothstep(300.0,900.0,dist));
  deep=mix(deep,${SHAL_COL()}*(0.1+0.9*uDay),shl*0.9);
  col=mix(deep,refl,fr*(1.0-shl*0.35));
  col+=vec3(0.0,0.10,0.08)*clamp(waveH(p,t)+0.3,0.0,1.0);
  // luz atravessando a crista da onda contra o sol
  vec3 sh=normalize(vec3(uSun.x,0.0,uSun.z)); col+=vec3(0.02,0.22,0.18)*clamp(waveH(p,t)/max(uSwell,0.3),0.0,1.0)*pow(max(dot(-V,sh),0.0),3.0)*uDay*0.6;
  // espuma: na beira (raso) com linhas de arrebentação chegando, e carneirinhos com mar mexido
  float fn=skN(p*0.35+vec2(t*0.05,t*0.03))*0.6+skN(p*1.4-vec2(t*0.12))*0.4;
  float shore=(1.0-smoothstep(0.1,2.0,dep))*smoothstep(0.25,0.55,fn);
  float surfL=smoothstep(0.7,1.0,sin(dep*2.0+t*1.4+fn*2.5))*(1.0-smoothstep(0.5,4.5,dep))*smoothstep(0.2,0.5,fn);
  float cap=smoothstep(0.36,0.5,waveH(p,t)/max(uSwell,0.01))*smoothstep(0.55,0.78,fn)*smoothstep(1.05,1.6,uSwell);
  float foam=clamp(shore+surfL*(0.5+0.5*uSwell)+cap*0.8,0.0,1.0)*(1.0-smoothstep(160.0,700.0,dist));
  // pingos de chuva: anéis pequenos abrindo na água perto da câmera
  if(uRain>0.02){ vec2 q=p*1.6, cc=floor(q); float hh=skH(cc+7.0), ph=fract(t*1.4+hh*5.0);
    vec2 ctr=cc+0.5+0.3*(vec2(skH(cc),skH(cc+3.0))-0.5); float rr=length(q-ctr);
    float rp=smoothstep(0.05,0.0,abs(rr-ph*0.45))*(1.0-ph)*step(hh,uRain);
    col+=vec3(0.2,0.22,0.24)*rp*(1.0-smoothstep(6.0,40.0,dist)); col*=1.0-0.1*uRain; }
  // brilho do sol picando na água
  float gl=pow(max(dot(R,uSun),0.0),70.0)*step(0.93,skH(floor(p*5.0)+floor(t*6.0)))*2.5*smoothstep(-0.05,0.1,uSun.y)*(1.0-uCloud);
  col+=vec3(1.0,0.92,0.75)*gl;
  col=mix(col,vec3(0.9,0.95,0.96)*(0.12+0.88*uDay),foam*0.9);
  a=mix(mix(0.5,0.3,shl),1.0,max(fr,smoothstep(6.0,80.0,dist))); a=max(a,foam*0.95);
  col=mix(col,uHaze,1.0-exp(-dist*uFogD));`;
