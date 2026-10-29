// ================= destino Amazonas (Baixo Tapajós): rio, igapó, lago, água preta, peixes e bichos =================
// Tudo aqui só roda quando AMZ (o destino atual do save) é verdadeiro; a Costa Verde fica intacta.

// ---------- relevo do rio ----------
// o rio corre de oeste para leste; norte (z negativo) tem o igapó, sul tem a praia, a vila e o lago
function rivC(x) { return -150 + 120 * Math.sin(x * 0.0021); }
function rivW(x) { return 330 + 60 * Math.sin(x * 0.004 + 1); }
function segDist(x, z, ax, az, bx, bz) { const vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(x - ax - vx * t, z - az - vz * t); }
function Hamz(x, z) {
  const c = rivC(x), W = rivW(x), d = z - c, t = Math.abs(d) / W;
  // terra: floresta em morros baixos
  let h = 3 + 7 * smooth(1.05, 1.7, t) * (0.4 + fbm(x * 0.006, z * 0.006, 3)) + 1.2 * fbm(x * 0.03, z * 0.03, 2);
  if (t < 1.08) {
    let w = -17 * Math.pow(Math.max(0, 1 - t * t), 0.7) + 1.5 * fbm(x * 0.01 + 3, z * 0.01, 3) + 0.4 * fbm(x * 0.05, z * 0.05, 2);
    if (d < 0) w = Math.max(w, lerp(-17, -3.4 + 1.1 * fbm(x * 0.03, z * 0.03, 2), smooth(0.55, 0.82, t))); // igapó: plataforma rasa na margem norte
    else w = Math.max(w, lerp(-17, -0.5, smooth(0.72, 1.0, t))); // praia de areia na margem sul
    h = lerp(w, h, smooth(0.98, 1.08, t));
  }
  // ilha de areia no meio do rio
  const di = Math.hypot((x - 220) / 200, (z - (rivC(220) + 70)) / 55);
  if (di < 1.7) h = Math.max(h, lerp(1.3, -7, smooth(0.6, 1.7, di)) + 0.3 * fbm(x * 0.05, z * 0.05, 1));
  // lago verde ao sul, ligado ao rio por um canal
  const dl = Math.hypot(x - 900, z - 560);
  if (dl < 330) h = Math.min(h, lerp(-7.5 + 1.2 * fbm(x * 0.02, z * 0.02, 2), h, smooth(210, 310, dl)));
  if (segDist(x, z, 870, rivC(870) + rivW(870) - 60, 900, 360) < 38) h = Math.min(h, -4.2 + 0.5 * fbm(x * 0.05, z * 0.05, 1));
  // lagoa de água preta ao noroeste e o igarapé que desce até o rio
  const dp = Math.hypot(x + 600, z + 980);
  if (dp < 270) h = Math.min(h, lerp(-9 + fbm(x * 0.03, z * 0.03, 2), h, smooth(170, 260, dp)));
  if (segDist(x, z, -600, -980, -430, rivC(-430) - rivW(-430) + 60) < 42) h = Math.min(h, -4.5 + 0.5 * fbm(x * 0.05, z * 0.05, 1));
  // pedral: leito raso e rochoso a leste
  const dpd = Math.hypot(x - 1250, z - rivC(1250));
  if (dpd < 210) h = Math.max(h, lerp(-5.5 + fbm(x * 0.04, z * 0.04, 2), h, smooth(90, 200, dpd)));
  return amzPoco(x, z, h);
}
// água preta: o igarapé e a lagoa preta (cor de chá, quase sem visibilidade)
function murkAmz(x, z) { return Math.max(1 - smooth(190, 320, Math.hypot(x + 600, z + 980)), 1 - smooth(30, 90, segDist(x, z, -600, -980, -430, rivC(-430) - rivW(-430) + 60))); }
// mesma conta no shader subaquático: absorção de rio (esverdeada) e água preta cor de chá
function uwMurkAmz() {
  const bx = -430 + 600, bz = rivC(-430) - rivW(-430) + 60 + 980;
  return `  float murk=1.0-smoothstep(190.0,320.0,distance(vWP.xz,vec2(-600.0,-980.0)));
  vec2 pa=vWP.xz-vec2(-600.0,-980.0), ba=vec2(${bx.toFixed(1)},${bz.toFixed(1)}); float hq=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
  murk=max(murk,1.0-smoothstep(30.0,90.0,length(pa-ba*hq)));
  vec3 ab=vec3(exp(-dp*0.15),exp(-dp*0.065),exp(-dp*0.11));
  gl_FragColor.rgb*=mix(ab,ab*vec3(0.72,0.48,0.26),murk);`;
}
function pierAmz() { let zs = null; for (let z = 420; z > 0; z -= 2) { const h = Hamz(0, z); if (zs == null && h < 0.6) zs = z; if (h < -4.5) return { x: 0, z0: Math.max(z + 60, zs + 6), z1: z }; } return { x: 0, z0: 320, z1: 230 }; }

// ---------- pontos de pesca ----------
function spotsAmz() {
  return [
    { id: 'porto', name: 'Vila do Tapajós', x: PIER.x, z: PIER.z1 - 10, type: 'marina', desc: 'Porto da vila: venda do pescado, loja, combustível e viagens.' },
    { id: 'praia', name: 'Ilha da Praia Branca', x: 220, z: rivC(220) + 70 - 95, r: 50, depth: '1–5 m', desc: 'Banco de areia branca e água clara. Tucunaré, pacu e cardume de jaraqui. Cuidado com arraia na areia.' },
    { id: 'igapo', name: 'Igapó do Jacaré', x: -150, z: rivC(-150) - rivW(-150) + 70, r: 55, depth: '2–5 m', desc: 'Floresta alagada: troncos e galhadas submersos, tucunaré escondido nas galhas, traíra e aruanã. Jacaré à noite.' },
    { id: 'canal', name: 'Canal do Tapajós', x: 760, z: rivC(760) + 170, r: 60, depth: '10–18 m', cur: [0.38, 0.04], desc: 'Meio do rio, fundo e com correnteza. Surubim, cachorra, dourado e o gigante pirarucu (protegido).' },
    { id: 'lago', name: 'Lago Verde', x: 900, z: 560, r: 60, depth: '3–8 m', desc: 'Lago de várzea de água parada. Tambaqui, pacu, tucunaré e aruanã. Boto e peixe-boi aparecem por lá.' },
    { id: 'pedral', name: 'Pedral da Corredeira', x: 1250, z: rivC(1250) - 140, r: 55, depth: '3–6 m', cur: [0.5, 0.06], desc: 'Pedras e correnteza forte. Dourado e cachorra caçando na água rápida, matrinxã em cardume.' },
    { id: 'negro', name: 'Lagoa da Água Preta', x: -600, z: -980, r: 60, depth: '4–9 m', desc: 'Água preta cor de chá: quase nada de visibilidade. Traíra, tucunaré e piranha. Leve lanterna.' },
  ];
}
// população por ponto (mesmo formato do Costa Verde)
function popAmz() {
  const s = season() === 'cheia', ig = s ? 1.5 : 0.5, lk = s ? 0.8 : 1.4;
  const m = (arr, k) => arr.map(e => [e[0], Math.max(1, Math.round(e[1] * k)), e[2], e[3], e[4]]);
  return {
    praia: [['aracu', 3, [4, 8]], ['bicudario', 2, [1, 2]], ['tucunare', 4, [1, 2]], ['pacu', 4, [3, 6]], ['piranha', 3, [4, 8]], ['jaraqui', 3, [6, 12]], ['aruana', 1, [1, 2]], ['matrinxa', 2, [2, 4]]],
    igapo: m([['aracu', 3, [4, 8]], ['bicudario', 2, [1, 2]], ['tucunare', 6, [1, 3]], ['traira', 4, [1, 1]], ['aruana', 3, [1, 2]], ['piranha', 3, [4, 8]], ['pacu', 2, [2, 4]], ['tambaqui', 2, [1, 2]], ['surubim', 1, [1, 1], 0.6]], ig),
    canal: m([['pescada', 4, [3, 6]], ['apapa', 3, [3, 6]], ['surubim', 4, [1, 1]], ['cachorra', 4, [1, 3]], ['douradorio', 4, [2, 4]], ['matrinxa', 3, [3, 6]], ['tambaqui', 2, [1, 2]], ['pirarucu', 1, [1, 1], 0.5], ['jaraqui', 3, [6, 12]]], lk),
    lago: m([['pescada', 3, [3, 6]], ['aracu', 2, [4, 8]], ['tambaqui', 4, [2, 4]], ['pacu', 4, [3, 6]], ['tucunare', 5, [1, 3]], ['aruana', 3, [1, 2]], ['pirarucu', 2, [1, 1], 0.7], ['piranha', 2, [4, 8]]], lk),
    pedral: [['apapa', 3, [3, 6]], ['bicudario', 2, [1, 2]], ['douradorio', 5, [2, 4]], ['cachorra', 4, [1, 3]], ['matrinxa', 4, [3, 6]], ['surubim', 3, [1, 1]], ['tucunare', 2, [1, 2]]],
    negro: [['traira', 5, [1, 1]], ['tucunare', 4, [1, 2]], ['piranha', 4, [4, 8]], ['aruana', 2, [1, 2]], ['surubim', 1, [1, 1]]],
  };
}
const POP_ZONE_AMZ = [['aracu', 1, [4, 7], 0.7], ['pescada', 1, [3, 5], 0.5], ['bicudario', 1, [1, 2], 0.4], ['tucunare', 2, [1, 2]], ['piranha', 1, [4, 7]], ['pacu', 1, [3, 5], 0.8], ['jaraqui', 1, [5, 9], 0.7], ['traira', 1, [1, 1], 0.6], ['matrinxa', 1, [2, 4], 0.5], ['aruana', 1, [1, 1], 0.4]];

// cheia e seca alternam a cada 7 dias de jogo
const season = () => Math.floor(((SV.day || 1) - 1) / 7) % 2 ? 'seca' : 'cheia';

// ---------- mundo: pedras, troncos do igapó, vitórias-régias, zonas ----------
function riverSpot(id, dmin, dmax) {
  // ajusta o ponto para a água certa mais próxima
  const S = spotById(id); if (!S || !S.r) return;
  for (let k = 0; k < 400; k++) { const a = k * 0.7, d = k * 0.6, x = S.x + Math.cos(a) * d, z = S.z + Math.sin(a) * d, h = Hamz(x, z); if (h <= -dmin && h >= -dmax) { S.x = x; S.z = z; return; } }
}
function buildRiverRocks(r) {
  riverSpot('praia', 1.5, 5); riverSpot('igapo', 2, 5); riverSpot('canal', 10, 18); riverSpot('lago', 3, 8); riverSpot('pedral', 3, 6); riverSpot('negro', 4, 9);
  // pedral: blocos arredondados de arenito
  const P0 = spotById('pedral');
  for (let i = 0; i < 160; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.7) * 150, x = P0.x + Math.cos(a) * d, z = P0.z + Math.sin(a) * d, h = H(x, z); if (h > -1) continue;
    const rad = lerp(3.6, 1.0, d / 150) * (0.6 + r() * 0.7), R = addRock(x, h + rad * 0.3, z, rad, 'pedral'); if (rad > 2 && r() < 0.5) addHole(R, r() * TAU, 'pedral');
  }
  // pedras soltas nas margens e na lagoa preta
  for (let i = 0; i < 260; i++) {
    const x = lerp(WB.x0, WB.x1, r()), z = lerp(WB.z0, WB.z1, r()), h = H(x, z); if (h > -1.5 || h < -12) continue;
    if (r() < 0.6) { const rad = 0.8 + r() * 1.8; addRock(x, h + rad * 0.25, z, rad, nearestSpot(x, z)); }
  }
  // zonas de pesca ao longo das margens e do lago
  for (let x = WB.x0 + 120; x < WB.x1 - 120; x += 170) {
    for (const side of [-1, 1]) {
      const z = rivC(x) + side * (rivW(x) - (side < 0 ? 80 : 90)), h = H(x, z);
      if (h < -1.8 && SPOTS.every(s => Math.hypot(s.x - x, s.z - z) > 110)) ZONES.push({ id: 'za' + (x | 0) + side, x, z, r: 40, zone: 'rio' });
    }
  }
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, x = 900 + Math.cos(a) * 170, z = 560 + Math.sin(a) * 170; if (H(x, z) < -2 && SPOTS.every(s => Math.hypot(s.x - x, s.z - z) > 90)) ZONES.push({ id: 'zl' + k, x, z, r: 38, zone: 'rio' }); }
}
function nearestSpot(x, z) { let b = null, bd = 1e9; for (const s of SPOTS) if (s.r) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s; } } for (const s of ZONES) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s; } } return b && bd < 160 ? b.id : null; }

// troncos do igapó: árvores em pé saindo da água, galhos e troncos caídos no fundo (com colisão e tocas)
function buildRiverWorld() {
  const r = mulberry(91), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(), pp = new V3(), up = new V3(0, 1, 0), dv = new V3();
  const trunks = [], crowns = [], logs = [], twigs = [], IG = spotById('igapo'), NG = spotById('negro');
  for (let i = 0; i < 60000 && trunks.length < 2600; i++) {
    // metade das tentativas perto do Igapó do Jacaré e da Água Preta: mata alagada fechada
    const C = i % 4 === 0 ? IG : i % 4 === 1 ? NG : null, a = r() * TAU, dd = Math.sqrt(r()) * 230;
    const x = C ? C.x + Math.cos(a) * dd : lerp(WB.x0, WB.x1, r()), z = C ? C.z + Math.sin(a) * dd : lerp(WB.z0, WB.z1, r()), h = Hamz(x, z), t = (rivC(x) - z) / rivW(x);
    // igapó: plataforma rasa ao norte do rio e beira da lagoa preta
    const igapo = (t > 0.6 && t < 1.1 && h < -1 && h > -5.5) || (Math.hypot(x + 600, z + 980) < 280 && h < -1 && h > -6);
    if (!igapo) continue;
    const tall = rand(5, 14), rad = rand(0.14, 0.34); trunks.push([x, h, z, tall - h, rad]); crowns.push([x, tall, z, rand(3, 6)]);
    for (let y = h + 0.6; y < 0.2; y += 1.2) { const R = addRock(x, y, z, rad + 0.25, nearestSpot(x, z)); R.sy = 1; R.noDecor = true; }
    if (r() < 0.45) logs.push([x + rand(-3, 3), h, z + rand(-3, 3), rand(3, 8), rand(0, TAU), rand(0.15, 0.35)]);
    // galhada: galhos finos saindo do tronco e caídos em volta, onde o tucunaré se esconde
    if (r() < 0.6) for (let k = 0, n = 3 + (r() * 6 | 0); k < n; k++) twigs.push([x + rand(-2.5, 2.5), Math.min(-0.3, h + rand(0, 2.2)), z + rand(-2.5, 2.5), rand(1.2, 4), rand(0.03, 0.09), rand(0, TAU), rand(-1.2, 1.2)]);
  }
  const twG = new THREE.CylinderGeometry(0.6, 1, 1, 5); twG.rotateZ(Math.PI / 2);
  chunked(twG, uwify(new THREE.MeshStandardMaterial({ color: 0x3e3022, roughness: 1 }), { key: 'tw' }), twigs, (f, i, im) => { e.set(0, f[5], f[6], 'YZX'); q.setFromEuler(e); s.set(f[3], f[4] * 2, f[4] * 2); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); }, 110);
  const bark = uwify(new THREE.MeshLambertMaterial({ color: 0x2c231a }), { key: 'bk' });
  const tG = new THREE.CylinderGeometry(0.75, 1, 1, 7); tG.translate(0, 0.5, 0);
  chunked(tG, bark, trunks, (f, i, im) => { q.identity(); s.set(f[4] * 2, f[3], f[4] * 2); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); }, 250);
  const cG = new THREE.IcosahedronGeometry(1, 1); cG.scale(1, 0.6, 1);
  chunked(cG, new THREE.MeshLambertMaterial({ color: 0x2f5a26 }), crowns, (f, i, im) => { e.set(0, rand(0, TAU), 0); q.setFromEuler(e); s.set(f[3], f[3] * rand(0.6, 0.9), f[3] * rand(0.8, 1.2)); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setHSL(rand(0.24, 0.32), 0.45, rand(0.15, 0.25))); }, 900);
  // galhadas no fundo: troncos deitados com galhos, tocas de tucunaré e surubim
  const lG = new THREE.CylinderGeometry(1, 1, 1, 6); lG.rotateZ(Math.PI / 2);
  chunked(lG, bark, logs, (f, i, im) => { e.set(0, f[4], rand(-0.15, 0.15)); q.setFromEuler(e); s.set(f[3], f[5] * 2, f[5] * 2); pp.set(f[0], f[1] + f[5], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); }, 120);
  for (const L of logs) {
    const dx = Math.cos(L[4]), dz = -Math.sin(L[4]), sp = nearestSpot(L[0], L[2]);
    for (let k = -L[3] / 2; k <= L[3] / 2; k += 0.9) { const R = addRock(L[0] + dx * k, L[1] + L[5], L[2] + dz * k, L[5] + 0.2, sp); R.sy = 1; R.noDecor = true; }
    if (sp && r() < 0.35) HOLES.push({ x: L[0] - dz * 0.9, z: L[2] + dx * 0.9, y: L[1] + 0.4, dir: Math.atan2(dx, -dz), spot: sp, used: 0 });
  }
  // vitórias-régias no lago e nas beiras calmas
  const lily = [];
  for (let i = 0; i < 20000 && lily.length < 900; i++) { const x = lerp(WB.x0, WB.x1, r()), z = lerp(WB.z0, WB.z1, r()), h = Hamz(x, z); if (h > -0.6 || h < -3.5) continue; if (Math.hypot(x - 900, z - 560) > 300 && (rivC(x) - z) / rivW(x) < 0.85) continue; lily.push([x, 0.04, z, rand(0.5, 1.4)]); }
  const lyG = new THREE.CylinderGeometry(1, 1, 0.05, 18, 1, true); const lyTop = new THREE.CircleGeometry(1, 18); lyTop.rotateX(-Math.PI / 2); lyTop.translate(0, 0.025, 0);
  chunked(mergeGeos([lyG, lyTop]), new THREE.MeshLambertMaterial({ color: 0x4f8a2e, side: THREE.DoubleSide }), lily, (f, i, im) => { q.identity(); s.set(f[3], 1, f[3]); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color().setHSL(rand(0.24, 0.3), 0.5, rand(0.28, 0.4))); }, 300);
}
// floresta da margem: copas redondas e altas, e a vila em palafitas
function buildForestAmz() {
  const trees = [], houses = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), pp = new V3();
  // mata fechada na beira do rio e dos lagos (onde se vê do barco), mais rala para o interior
  for (let i = 0; i < 90000 && trees.length < 8000; i++) {
    const x = rand(WB.x0 - 300, WB.x1 + 300), z = rand(WB.z0 - 300, WB.z1 + 300), h = H(x, z); if (h < 2.2 || (Math.abs(x - PIER.x) < 18 && z > PIER.z1 - 8 && z < PIER.z0 + 10)) continue;
    const bank = Math.abs(z - rivC(x)) - rivW(x), lake = Math.min(Math.hypot(x - 900, z - 560) - 300, Math.hypot(x + 600, z + 980) - 260);
    if (Math.min(bank, lake) < 380 || Math.random() < 0.15) trees.push([x, h, z]);
  }
  for (let i = 0; i < 4000 && houses.length < 40; i++) { const x = rand(-260, 260), z = rand(PIER.z0 - 20, PIER.z0 + 160), h = H(x, z); if (h > 1.5 && h < 12 && Math.abs(x) > 14) houses.push([x, h, z]); }
  const trunk = new THREE.CylinderGeometry(0.35, 0.5, 8, 5); trunk.translate(0, 4, 0);
  const crown = new THREE.IcosahedronGeometry(4, 0); crown.scale(1, 0.7, 1); crown.translate(0, 9, 0);
  const tIM = new THREE.InstancedMesh(trunk, new THREE.MeshLambertMaterial({ color: 0x4a3a2a }), trees.length), cIM = new THREE.InstancedMesh(crown, new THREE.MeshLambertMaterial({ color: 0x2a5a24 }), trees.length);
  trees.forEach((t, i) => { const k = rand(1.1, 2.3); s.set(k, k * rand(0.9, 1.5), k); pp.set(t[0], t[1] - 0.5, t[2]); q.setFromAxisAngle(new V3(0, 1, 0), rand(0, TAU)); m4.compose(pp, q, s); tIM.setMatrixAt(i, m4); cIM.setMatrixAt(i, m4); cIM.setColorAt(i, new THREE.Color().setHSL(0.27 + rand(-0.05, 0.04), 0.5, rand(0.12, 0.24))); });
  scene.add(tIM, cIM); LAND.push(tIM, cIM);
  // palafitas: casa de madeira sobre estacas, telhado de palha
  const hG = new THREE.BoxGeometry(5, 3, 6); hG.translate(0, 3.2, 0); const rG = new THREE.ConeGeometry(4.8, 2.4, 4); rG.rotateY(Math.PI / 4); rG.translate(0, 5.9, 0);
  const sG = new THREE.CylinderGeometry(0.12, 0.12, 2, 4); sG.translate(0, 1, 0);
  const hIM = new THREE.InstancedMesh(hG, new THREE.MeshLambertMaterial({ color: 0x9a6a3a }), houses.length), rIM = new THREE.InstancedMesh(rG, new THREE.MeshLambertMaterial({ color: 0xb89a5a }), houses.length), sIM = new THREE.InstancedMesh(sG, new THREE.MeshLambertMaterial({ color: 0x4a3a2a }), houses.length * 4);
  houses.forEach((t, i) => { const k = rand(0.8, 1.2); q.setFromAxisAngle(new V3(0, 1, 0), rand(-0.3, 0.3)); s.set(k, k, k); pp.set(t[0], t[1] - 0.3, t[2]); m4.compose(pp, q, s); hIM.setMatrixAt(i, m4); rIM.setMatrixAt(i, m4);
    [[-2, -2.5], [2, -2.5], [-2, 2.5], [2, 2.5]].forEach(([a, b], j) => { pp.set(t[0] + a * k, t[1] - 0.3, t[2] + b * k); m4.compose(pp, q, s.set(k, k * 1.1, k)); sIM.setMatrixAt(i * 4 + j, m4); }); });
  scene.add(hIM, rIM, sIM); LAND.push(hIM, rIM, sIM);
}

// ---------- bichos e perigos ----------
// jacaré: à noite, na superfície do igapó e da água preta; dá o bote se você chega muito perto
const JAC = { list: [] };
function buildJacares() {
  const body = new THREE.SphereGeometry(0.3, 10, 6); body.scale(1, 0.45, 3.2);
  const head = new THREE.BoxGeometry(0.34, 0.16, 0.9); head.translate(0, 0, 1.25);
  const tail = new THREE.ConeGeometry(0.22, 1.9, 6); tail.rotateX(-Math.PI / 2); tail.translate(0, 0, -1.8);
  const g = mergeGeos([body, head, tail]);
  const mat = uwify(new THREE.MeshStandardMaterial({ color: 0x2c3420, roughness: 0.9 }), { key: 'jac' }), eyeM = new THREE.MeshBasicMaterial({ color: 0xd8c040 });
  for (const id of ['igapo', 'igapo', 'negro', 'lago']) {
    const S = spotById(id); if (!S) continue;
    const m = new THREE.Mesh(g, mat); for (const sx of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), eyeM); ey.position.set(sx * 0.12, 0.12, 1.0); m.add(ey); }
    m.visible = false; scene.add(m);
    JAC.list.push({ m, S, pos: new V3(S.x + rand(-30, 30), 0, S.z + rand(-30, 30)), yaw: rand(0, TAU), t: 0, cd: 0, mode: 'boia' });
  }
}
function updateJacares(dt, t) {
  const night = DAY.amb < 0.35;
  for (const J of JAC.list) {
    const near = (J.pos.x - camera.position.x) ** 2 + (J.pos.z - camera.position.z) ** 2 < 90 * 90; J.m.visible = night && near; if (!J.m.visible) continue;
    J.cd = Math.max(0, J.cd - dt);
    const dP = Math.hypot(P.pos.x - J.pos.x, P.pos.z - J.pos.z), inWater = P.mode === 'swim';
    let tx = J.S.x + Math.cos(t * 0.05 + J.yaw) * 25, tz = J.S.z + Math.sin(t * 0.05 + J.yaw) * 25, sp = 0.35;
    if (inWater && dP < 14 && !J.cd) { tx = P.pos.x; tz = P.pos.z; sp = dP < 6 ? 1.6 : 0.7; if (!J.warned) { J.warned = true; toast('Olhos amarelos na superfície... é um jacaré! Afaste-se devagar.', 4, 'bad'); buzz([80, 50, 80]); } }
    else if (dP > 25) J.warned = false;
    if (inWater && dP < 1.8 && !J.cd) {
      J.cd = 25; P.o2 = Math.max(0, P.o2 - 0.25); FX.shake = 1; buzz([200, 80, 200]); AU.thud(); spawnSpray(_sl.set(J.pos.x, 0, J.pos.z), 14);
      toast('O jacaré deu o bote! Saia da água do igapó à noite.', 5, 'bad');
    }
    if (J.cd > 20) { tx = J.pos.x - (P.pos.x - J.pos.x) * 3; tz = J.pos.z - (P.pos.z - J.pos.z) * 3; sp = 1.2; }
    const dx = tx - J.pos.x, dz = tz - J.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.5) { J.yaw += angDiff(J.yaw, Math.atan2(dx, dz)) * clamp(dt * 1.5, 0, 1); J.pos.x += Math.sin(J.yaw) * sp * dt; J.pos.z += Math.cos(J.yaw) * sp * dt; }
    J.pos.y = waveH(J.pos.x, J.pos.z, t) - 0.12;
    J.m.position.copy(J.pos); J.m.rotation.set(0, J.yaw, Math.sin(t * 2 + J.yaw) * 0.04);
  }
}
// peixe-boi: lento, no lago, sobe para respirar; protegido (só foto)
const PBOI = { list: [] };
function buildPeixeBoi() {
  // corpo roliço que afina num pescoço curto, cabeça arredondada com focinho largo; cauda em remo e nadadeiras em pá
  const prof = [[0, -1.2], [0.14, -1.12], [0.3, -0.85], [0.45, -0.4], [0.5, 0], [0.46, 0.45], [0.36, 0.76], [0.28, 0.88], [0.29, 1.0], [0.26, 1.14], [0.2, 1.24], [0.08, 1.3], [0, 1.31]];
  const body = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 18); body.rotateX(Math.PI / 2); body.scale(1, 0.82, 1);
  const tex = canvasTex(128, 64, g => { g.fillStyle = '#5d564c'; g.fillRect(0, 0, 128, 64); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,26,22' : '140,130,115'},${rand(0.12, 0.3)})`; g.beginPath(); g.ellipse(rand(0, 128), rand(0, 64), rand(2, 9), rand(1, 4), rand(0, 3), 0, TAU); g.fill(); } });
  const skin = uwify(new THREE.MeshLambertMaterial({ map: tex }), { key: 'pboi' }), dark = new THREE.MeshLambertMaterial({ color: 0x14110e });
  const tailG = new THREE.SphereGeometry(1, 16, 6); tailG.scale(0.5, 0.05, 0.42); tailG.translate(0, 0, -0.38);
  const finG = new THREE.SphereGeometry(1, 10, 6); finG.scale(0.24, 0.035, 0.12); finG.translate(0.2, 0, 0);
  const S = spotById('lago'); if (!S) return;
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Group(); m.add(new THREE.Mesh(body, skin));
    const tail = new THREE.Group(); tail.position.set(0, 0, -1.12); tail.add(new THREE.Mesh(tailG, skin)); m.add(tail);
    const fins = [];
    for (const sx of [-1, 1]) {
      const f = new THREE.Group(); f.position.set(sx * 0.4, -0.18, 0.62); const fm = new THREE.Mesh(finG, skin); fm.scale.x = sx; f.add(fm); f.rotation.z = sx * -0.5; m.add(f); fins.push(f);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), dark); e.position.set(sx * 0.2, 0.08, 1.08); m.add(e);
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), dark); n.position.set(sx * 0.06, 0.12, 1.27); m.add(n);
    }
    m.scale.setScalar(1.3); m.visible = false; scene.add(m);
    PBOI.list.push({ m, tail, fins, S, a: rand(0, TAU), pos: new V3(S.x, -3, S.z), breathe: rand(20, 60), key: 'peixeboi' });
  }
}
function updatePeixeBoi(dt, t) {
  for (const B of PBOI.list) {
    const near = (B.pos.x - camera.position.x) ** 2 + (B.pos.z - camera.position.z) ** 2 < 80 * 80; B.m.visible = near; if (!near) continue;
    B.a += dt * 0.04; B.breathe -= dt;
    const tx = B.S.x + Math.cos(B.a) * 40, tz = B.S.z + Math.sin(B.a * 1.3) * 30, h = H(B.pos.x, B.pos.z);
    const ty = B.breathe < 0 ? -0.4 : Math.max(h + 1.2, -4); if (B.breathe < -6) B.breathe = rand(40, 80);
    B.pos.x = lerp(B.pos.x, tx, dt * 0.05); B.pos.z = lerp(B.pos.z, tz, dt * 0.05); B.pos.y = lerp(B.pos.y, ty, dt * 0.3);
    B.m.position.copy(B.pos); B.m.rotation.set(Math.sin(t * 0.3) * 0.08, Math.atan2(tx - B.pos.x, tz - B.pos.z), 0, 'YXZ');
    B.tail.rotation.x = Math.sin(t * 1.1 + B.a) * 0.25; B.fins.forEach((f, k) => f.rotation.x = Math.sin(t * 0.7 + k) * 0.3);
  }
}
// piranhas: fieira com peixe ferido perto de cardume de piranha → elas roubam um peixe
let piraT = 15;
// peixe ferido no rio: piranhas por perto sentem o sangue, cercam e acabam com ele
let frenzyT = 0;
function piranhaFrenzy(dt) {
  if ((frenzyT -= dt) > 0) return; frenzyT = 0.5;
  for (const v of FISHES) {
    if (!(v.hurt > 0) || !v.alive || v.state === 'hooked' || v.key === 'piranha') continue;
    let near = 0;
    for (const f of FISHES) { if (f.key !== 'piranha' || !f.alive || f.state === 'hooked') continue; const d = f.pos.distanceTo(v.pos); if (d < 30) { f.state = 'flee'; f.t = 1; f.speed = f.sp.burst; f.target.copy(v.pos); if (d < 1.6) near++; } }
    v.eaten = near >= 3 ? (v.eaten || 0) + 0.5 : 0;
    if (v.eaten >= 4) {
      if (v.vis) { spawnScales(v.pos, 30); if (camera.position.distanceTo(v.pos) < 20) toast(`As piranhas pegaram o ${v.sp.name.toLowerCase()} ferido!`, 3, 'bad'); }
      v.remove();
    }
  }
}
function updatePiranhas(dt) {
  piranhaFrenzy(dt);
  if ((piraT -= dt) > 0) return; piraT = 12;
  if (P.mode !== 'swim' || !P.under || !P.stringer.length) return;
  const n = FISHES.filter(f => f.key === 'piranha' && f.alive && f.pos.distanceTo(P.pos) < 14).length;
  if (n >= 3 && Math.random() < 0.3) {
    const f = P.stringer.pop(); spawnScales(_sl.copy(P.pos).add(_t2.set(0, -0.4, 0)), 20); buzz([40, 30, 40, 30, 40]);
    toast(`Piranhas atacaram a fieira e levaram ${f.name.toLowerCase()} de ${fmtKg(f.kg)} kg! Suba para guardar o peixe no barco.`, 4, 'bad');
  }
}

// ---------- viagem entre destinos ----------
const TRIP_PRICE = 3000, TRIP_DAYS = 1;
const DESTS = [
  { id: 'cv', name: 'Costa Verde (RJ)', desc: 'Baía da Ilha Grande: costões, lajes, naufrágios e mar aberto.' },
  { id: 'amz', name: 'Amazonas · Baixo Tapajós (PA)', desc: 'Rio de água clara, igapó, lago de várzea e água preta. Tucunaré, dourado, cachorra, pirarucu.' },
  { id: 'ne', name: 'Costa dos Corais (AL/PE)', desc: 'Água azul e quente: piscinas naturais, arrecifes, cabeços de coral, naufrágio e parcel. Guaiúba, cavala, pargo e tubarões.', price: 4000, flag: 'neUnlocked' },
];
const marinaName = () => AMZ ? 'Porto da Vila do Tapajós' : NE ? 'Marina do Pontal' : 'Marina Balneário';
// preço e marca de liberação de cada destino (a Costa Verde já vem liberada)
const destPrice = d => d.id === 'amz' ? TRIP_PRICE : d.price || 0;
const destOwned = d => d.id === 'cv' || (d.id === 'amz' ? SV.amzUnlocked : SV[d.flag]);
function travelHTML(at) {
  const here = REGION;
  if (!at) return `<div class="it"><div class="d">As viagens saem ${AMZ ? 'do porto da vila' : 'da ' + marinaName()}. Volte lá com o barco para viajar.</div></div>`;
  return `<div class="it" style="margin-bottom:8px"><div class="d">Viajar leva ${TRIP_DAYS} dia. Dinheiro, equipamentos, carreira, amigos e a lancha (de balsa) vão com você. O peixe da fieira vai para a caixa térmica. Cada destino novo é liberado uma vez; depois é só ir e voltar.</div></div><div class="list">` +
    DESTS.map(d => { const cur = d.id === here, locked = !destOwned(d), pr = destPrice(d);
      return `<div class="it"><div style="flex:1"><div class="n">${cur ? '📍 ' : ''}${d.name}</div><div class="d">${d.desc}</div></div>${cur ? '<span class="d">VOCÊ ESTÁ AQUI</span>' : locked ? `<button class="btn gold" data-trip="${d.id}" ${SV.money < pr ? 'disabled' : ''}>LIBERAR ${fmtR(pr)}</button>` : `<button class="btn gold" data-trip="${d.id}">VIAJAR</button>`}</div>`; }).join('') + '</div>';
}
function travelTo(id) {
  if (id === REGION) return;
  const d = DESTS.find(x => x.id === id); if (!d) return;
  if (!destOwned(d)) { const pr = destPrice(d); if (SV.money < pr) return; SV.money -= pr; if (id === 'amz') SV.amzUnlocked = true; else SV[d.flag] = true; }
  if (P.stringer.length) { SV.cooler.push(...P.stringer); P.stringer = []; }
  SV.region = id; SV.dest = { amz: 'praia', ne: 'arrecife' }[id] || 'botinas'; SV.tod = 7; SV.day = (SV.day || 1) + TRIP_DAYS; SV.fuel = Math.max(SV.fuel, 40);
  save(); SAVE_LOCK = true;
  $('black').style.opacity = 1; toast({ amz: 'Embarcando para Santarém e Alter do Chão...', ne: 'Voando para Maceió e seguindo para a Costa dos Corais...' }[id] || 'Voltando para Angra dos Reis...', 3);
  setTimeout(() => location.reload(), 900);
}
function bindTravel(on) { on('[data-trip]', b => travelTo(b.dataset.trip)); }

function setupAmazon() {
  if (!AMZ) return;
  $('menuReg').textContent = 'PESCA SUB · AMAZONAS'; $('mapTitle').textContent = 'Carta do rio · Baixo Tapajós'; $('menuTag').textContent = 'Apneia, arbalete e igapó no Baixo Tapajós';
  buildJacares(); buildPeixeBoi();
  if (!SV.amzVisited) { SV.amzVisited = true; save(); setTimeout(() => { toast('Bem-vindo ao Baixo Tapajós! Água doce: você afunda mais fácil, use menos lastro.', 6, 'gold'); toast('Na vida real, a pesca subaquática em rios da Amazônia tem regras próprias e em muitos lugares é proibida. Informe-se antes.', 7); }, 1500); }
}
function updateAmazon(dt, t) { if (!AMZ) return; updateJacares(dt, t); updatePeixeBoi(dt, t); updatePiranhas(dt); }

// ---------- peixes do rio ----------
Object.assign(SHAPES, {
  cichlid: { jaw: 1.2, h: 0.34, w: 0.13, pk: 0.74, fork: false, tailH: 0.19, dors: 0.1, df: 'one', pec: 0.12 },      // tucunaré
  traira: { jaw: 1.4, h: 0.23, w: 0.15, pk: 0.68, fork: false, tailH: 0.16, dors: 0.09, df: 'one', pec: 0.1 },
  cat: { jaw: 0.5, barbels: true, h: 0.17, w: 0.19, pk: 0.62, fork: true, tailH: 0.17, dors: 0.1, df: 'one', pec: 0.14 },           // surubim (bagre)
  arapaima: { jaw: 1.0, h: 0.2, w: 0.15, pk: 0.66, fork: false, tailH: 0.15, dors: 0.11, df: 'back', pec: 0.1 },     // pirarucu
  aruana: { jaw: 1.7, h: 0.21, w: 0.07, pk: 0.86, fork: false, tailH: 0.12, dors: 0.1, df: 'back', pec: 0.08 },
});
const AMZ_SPECIES = {
  tucunare: { name: 'Tucunaré-açu', shape: 'cichlid', len: [0.3, 0.72], k: 13, price: 45, min: 0.35, cruise: 0.55, burst: 4.2, shy: 0.6, curious: 0.45, habit: 'reef', str: 1.5,
    col: { back: '#4a5a24', side: '#d0bc48', belly: '#f2e2a0', fin: '#c85a28', iris: '#d03a18' } },
  tambaqui: { name: 'Tambaqui', shape: 'deep', len: [0.4, 0.9], k: 22, price: 25, min: 0.55, cruise: 0.6, burst: 3.2, shy: 0.55, curious: 0.4, habit: 'mid', str: 1.6, school: true,
    col: { back: '#22241e', side: '#5e5c46', belly: '#c4b48a', fin: '#1a1a16', iris: '#c0a050' } },
  pacu: { name: 'Pacu', shape: 'deep', len: [0.2, 0.5], k: 24, price: 18, min: 0.25, cruise: 0.6, burst: 3.4, shy: 0.45, curious: 0.55, habit: 'reef', str: 1.0, school: true,
    col: { back: '#575d62', side: '#b8bcbe', belly: '#e2c88e', fin: '#c07a3a', iris: '#d8b060' } },
  aruana: { name: 'Aruanã', shape: 'aruana', len: [0.4, 0.95], k: 5, price: 20, min: 0.5, cruise: 0.5, burst: 4.0, shy: 0.5, curious: 0.5, habit: 'mid', str: 1.1,
    col: { back: '#5a6a4c', side: '#c4ccb8', belly: '#eef0e6', fin: '#6a7a5c', iris: '#e0d080' } },
  matrinxa: { name: 'Matrinxã', shape: 'snap', len: [0.25, 0.6], k: 13, price: 22, min: 0.3, cruise: 0.9, burst: 4.6, shy: 0.6, curious: 0.4, habit: 'mid', str: 1.2, school: true,
    col: { back: '#3d4a52', side: '#c6cdd0', belly: '#eef0f0', fin: '#d08a40', iris: '#e0c070' } },
  surubim: { name: 'Surubim', shape: 'cat', len: [0.6, 1.5], k: 6, price: 40, min: 0.8, cruise: 0.4, burst: 3.0, shy: 0.7, curious: 0.25, habit: 'hole', str: 1.7,
    col: { back: '#4a4a46', side: '#8c8c84', belly: '#ecece4', fin: '#5a5a54', iris: '#c0b080' } },
  traira: { name: 'Traíra', shape: 'traira', len: [0.25, 0.6], k: 11, price: 15, min: 0.3, cruise: 0.35, burst: 4.4, shy: 0.35, curious: 0.25, habit: 'reef', str: 1.1,
    col: { back: '#36321e', side: '#6a6440', belly: '#b4ac84', fin: '#4a4430', iris: '#d04020' } },
  jaraqui: { name: 'Jaraqui', shape: 'slim', len: [0.2, 0.4], k: 14, price: 10, min: 0.2, cruise: 0.9, burst: 4.0, shy: 0.7, curious: 0.3, habit: 'mid', str: 0.7, school: true,
    col: { back: '#4a5a66', side: '#c2cacc', belly: '#eef0f2', fin: '#2a2a28', iris: '#e0e0c0' } },
  piranha: { name: 'Piranha-vermelha', shape: 'deep', len: [0.15, 0.3], k: 30, price: 8, min: 0.15, cruise: 0.7, burst: 4.2, shy: 0.2, curious: 0.85, habit: 'mid', str: 0.8, school: true,
    col: { back: '#55595a', side: '#a6aaac', belly: '#d8502e', fin: '#3a3a3a', iris: '#e02a1a' } },
  douradorio: { name: 'Dourado-de-rio', shape: 'slim', len: [0.45, 1.0], k: 11, price: 40, min: 0.55, cruise: 1.0, burst: 5.4, shy: 0.55, curious: 0.5, habit: 'mid', str: 1.8, school: true,
    col: { back: '#8a6a1c', side: '#e6b42e', belly: '#f6e2a2', fin: '#e05420', iris: '#e0c050' } },
  cachorra: { name: 'Cachorra', shape: 'mack', len: [0.4, 0.85], k: 5.5, price: 18, min: 0.4, cruise: 0.9, burst: 5.6, shy: 0.5, curious: 0.55, habit: 'mid', str: 1.4,
    col: { back: '#4a5866', side: '#c8d0d4', belly: '#f0f2f2', fin: '#d4a040', iris: '#e0d080' } },
  pirarucu: { name: 'Pirarucu', shape: 'arapaima', len: [1.4, 2.6], k: 9, price: 0, min: 9, cruise: 0.35, burst: 2.2, shy: 0.2, curious: 0.5, habit: 'mid', str: 3.5, protected: true,
    col: { back: '#363628', side: '#786e56', belly: '#d8c8a0', fin: '#a03020', iris: '#c0a050' } },
  pescada: { name: 'Pescada-branca', shape: 'snap', len: [0.3, 0.65], k: 11, price: 22, min: 0.3, cruise: 0.6, burst: 3.8, shy: 0.55, curious: 0.4, habit: 'mid', str: 1.1, school: true,
    col: { back: '#6a7078', side: '#d2d6da', belly: '#f4f4f2', fin: '#c8b890', iris: '#d8d0a0' } },
  apapa: { name: 'Apapá', shape: 'jack', len: [0.35, 0.75], k: 12, price: 14, min: 0.35, cruise: 1.0, burst: 5.0, shy: 0.6, curious: 0.45, habit: 'mid', str: 1.3, school: true,
    col: { back: '#6a6040', side: '#e2d494', belly: '#f6f0d4', fin: '#c8a850', iris: '#e0d080' } },
  aracu: { name: 'Aracu', shape: 'slim', len: [0.2, 0.45], k: 13, price: 12, min: 0.2, cruise: 0.7, burst: 3.6, shy: 0.45, curious: 0.5, habit: 'reef', str: 0.8, school: true,
    col: { back: '#5a5a40', side: '#cac2a2', belly: '#eee8d2', fin: '#c89040', iris: '#e0b060' } },
  bicudario: { name: 'Bicuda-de-rio', shape: 'barra', len: [0.4, 0.85], k: 3.4, price: 16, min: 0.4, cruise: 0.8, burst: 6.0, shy: 0.4, curious: 0.7, habit: 'mid', str: 1.1,
    col: { back: '#4a5a50', side: '#c8ccc0', belly: '#f2f2ea', fin: '#c86030', iris: '#e0c070' } },
};
for (const k in AMZ_SPECIES) AMZ_SPECIES[k].amz = true;
Object.assign(SPECIES, AMZ_SPECIES);
Object.assign(NOCT, { traira: 1, surubim: 1, piranha: 1 });
Object.assign(SP_INFO, {
  tucunare: ['Cichla temensis', 'Galhadas do igapó, lagos e beira de praia.', 'O ocelo (a "pinta-olho") na cauda engana predadores. Cuida dos filhotes e ataca tudo que chega perto do ninho.'],
  tambaqui: ['Colossoma macropomum', 'Lagos e floresta alagada na cheia.', 'Come frutos e sementes que caem na água: espalha as árvores da floresta pelo rio.'],
  pacu: ['Myloplus spp.', 'Praias e lagos, em cardume.', 'Parente da piranha, mas vegetariano: tem dentes parecidos com os humanos.'],
  aruana: ['Osteoglossum bicirrhosum', 'Logo abaixo da superfície, nas margens.', 'Pula até 2 m fora da água para pegar insetos e até pássaros nos galhos.'],
  matrinxa: ['Brycon amazonicus', 'Corredeiras e canal, em cardume.', 'Nada contra a correnteza por quilômetros na piracema, a migração para desovar.'],
  surubim: ['Pseudoplatystoma punctifer', 'Fundo do canal e tocas em galhada.', 'Bagre de couro com listras e pintas; caça à noite, guiado pelos barbilhões.'],
  traira: ['Hoplias malabaricus', 'Água parada, rasa e cheia de galhos.', 'Fica imóvel esperando e ataca de surpresa. Aguenta água com pouco oxigênio.'],
  jaraqui: ['Semaprochilodus spp.', 'Rio aberto, em cardumes enormes.', 'Peixe do dia a dia em Manaus: "quem come jaraqui não sai mais daqui".'],
  piranha: ['Pygocentrus nattereri', 'Lagos e remansos, em cardume.', 'Mais medrosa do que parece: ataca peixe ferido e sangue na água, raramente gente.'],
  douradorio: ['Salminus brasiliensis', 'Corredeiras e pedrais com água rápida.', 'O "rei do rio": dourado brilhante que salta alto e caça em água rápida.'],
  cachorra: ['Hydrolycus scomberoides', 'Canal e corredeiras, meia-água.', 'Tem dois caninos enormes na mandíbula de baixo que encaixam em buracos no céu da boca.'],
  pescada: ['Plagioscion squamosissimus', 'Canal e lagos, meia-água, em grupo.', 'Parente das corvinas do mar: ronca com a bexiga natatória e tem pedrinhas no ouvido (otólitos) usadas como amuleto.'],
  apapa: ['Pellona castelnaeana', 'Canal e corredeiras, de passagem.', 'Prateado-dourado e de escama solta: salta muito e briga como um peixe de mar.'],
  aracu: ['Leporinus friderici', 'Praias e beira do igapó, em cardume.', 'As três manchas escuras no flanco e a boca pequena virada para a frente entregam o aracu.'],
  bicudario: ['Boulengerella cuvieri', 'Logo abaixo da superfície, perto de galhos e pedras.', 'Focinho longo e fino como o da bicuda do mar, mas é parente das piabas: caça peixinhos na superfície.'],
  pirarucu: ['Arapaima gigas', 'Lagos de várzea, sobe para respirar.', 'Um dos maiores peixes de água doce do mundo: respira ar e pode passar de 2,5 m. Protegido: só foto!'],
});
GUIDE_EXTRA.push(
  ['boto', 'Boto-cor-de-rosa', 'Inia geoffrensis', 'Rios e lagos da Amazônia.', 'Fica mais rosado com a idade. Ameaçado e protegido: só olhe e fotografe.'],
  ['peixeboi', 'Peixe-boi-da-amazônia', 'Trichechus inunguis', 'Lagos de várzea com capim.', 'Mamífero que come plantas aquáticas e sobe para respirar. Ameaçado de extinção. Só foto!'],
  ['tracaja', 'Tartaruga-da-amazônia', 'Podocnemis expansa', 'Rios e praias de areia, onde desova na seca.', 'A maior tartaruga de rio da América do Sul. Protegida: só foto!'],
  ['arraiario', 'Arraia-de-fogo', 'Potamotrygon motoro', 'Fundo de areia rasa no rio.', 'Fica enterrada na areia. O ferrão causa uma dor fortíssima: arraste os pés e nunca pise nela.'],
  ['poraque', 'Poraquê', 'Electrophorus electricus', 'Galhadas e água parada.', 'Não é enguia, é parente do peixe-faca. Dá choques de até 800 volts e sobe para respirar ar.'],
  ['jacare', 'Jacaré-açu', 'Melanosuchus niger', 'Igapó e água preta, à noite.', 'Os olhos brilham na lanterna. Evite nadar perto à noite.'],
);

// marcas próprias de cada peixe do rio na textura
function amzTex(key, g, blob, bars, R) {
  if (key === 'tucunare') { bars(3, 70, 50, 14, 'rgba(15,18,8,.7)'); for (const y of [50]) { g.fillStyle = '#f0b020'; g.beginPath(); g.arc(12, y, 9, 0, TAU); g.fill(); g.fillStyle = '#101008'; g.beginPath(); g.arc(12, y, 5.5, 0, TAU); g.fill(); } for (let i = 0; i < 40; i++) blob(R() * 200, R() * 100, 1.6, 1.6, 'rgba(255,250,200,.55)'); }
  if (key === 'tambaqui') { g.fillStyle = 'rgba(10,10,8,.35)'; g.fillRect(0, 0, 256, 30); g.fillRect(0, 70, 256, 30); }
  if (key === 'pacu') { g.fillStyle = 'rgba(230,150,60,.35)'; g.fillRect(0, 42, 256, 16); }
  if (key === 'aruana') { g.strokeStyle = 'rgba(255,220,180,.35)'; g.lineWidth = 1.2; for (let y = 4; y < 100; y += 9) for (let x = 0; x < 210; x += 10) { g.strokeRect(x + (y % 18 ? 5 : 0), y, 9, 8); } }
  if (key === 'matrinxa') { blob(150, 26, 7, 6, 'rgba(10,10,10,.45)'); blob(150, 74, 7, 6, 'rgba(10,10,10,.45)'); g.fillStyle = 'rgba(10,10,10,.5)'; g.fillRect(0, 44, 30, 12); }
  if (key === 'surubim') { g.fillStyle = 'rgba(15,15,14,.7)'; for (let i = 0; i < 9; i++) { const x = 20 + i * 22; g.fillRect(x, 0, 6, 32); g.fillRect(x + 4, 68, 6, 32); } for (let i = 0; i < 60; i++) blob(R() * 220, R() * 100, 2, 2, 'rgba(15,15,14,.55)'); }
  if (key === 'traira') { for (let i = 0; i < 45; i++) blob(R() * 220, R() * 100, 5 + R() * 8, 3 + R() * 6, 'rgba(20,18,8,.42)'); }
  if (key === 'jaraqui') { g.fillStyle = '#f0d040'; for (let i = 0; i < 4; i++) g.fillRect(2 + i * 8, 101, 4, 27); }
  if (key === 'piranha') { for (let i = 0; i < 90; i++) blob(R() * 200, 10 + R() * 50, 1.6, 1.6, 'rgba(230,235,240,.5)'); g.fillStyle = 'rgba(200,40,20,.4)'; g.fillRect(150, 60, 106, 40); }
  if (key === 'douradorio') { g.strokeStyle = 'rgba(70,40,5,.55)'; g.lineWidth = 1.4; for (let y = 6; y < 100; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(210, y); g.stroke(); } g.fillStyle = 'rgba(10,10,8,.85)'; g.fillRect(0, 46, 40, 8); }
  if (key === 'cachorra') { blob(190, 22, 9, 7, 'rgba(10,10,10,.75)'); blob(190, 78, 9, 7, 'rgba(10,10,10,.75)'); g.fillStyle = 'rgba(10,10,10,.6)'; g.fillRect(0, 45, 20, 10); }
  if (key === 'pescada') { g.fillStyle = 'rgba(80,90,100,.08)'; for (let y = 10; y < 30; y += 6) g.fillRect(0, y, 210, 1.2); }
  if (key === 'apapa') { g.fillStyle = 'rgba(240,210,90,.35)'; g.fillRect(0, 30, 256, 40); }
  if (key === 'aracu') for (const x of [70, 120, 170]) for (const y of [30, 70]) blob(x, y, 8, 7, 'rgba(15,15,10,.7)');
  if (key === 'bicudario') { for (let i = 0; i < 70; i++) blob(R() * 220, 5 + R() * 40, 1.6, 1.6, 'rgba(20,20,15,.55)'); g.fillStyle = 'rgba(20,20,15,.4)'; g.fillRect(0, 47, 210, 5); }
  if (key === 'pirarucu') { for (let y = 4; y < 100; y += 8) for (let x = 0; x < 200; x += 9) { const a = smooth(160, 20, x) * 0.75; g.strokeStyle = `rgba(200,40,20,${a})`; g.lineWidth = 1.6; g.beginPath(); g.arc(x + (y % 16 ? 4 : 0), y, 4, 0.2, Math.PI - 0.2); g.stroke(); } }
}
// arraia-de-fogo: disco marrom com ocelos amarelos
function arraiaTex() {
  const t = canvasTex(64, 64, g => { g.fillStyle = '#4a3a28'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 26; i++) { const x = rand(0, 64), y = rand(0, 64); g.fillStyle = '#e0a030'; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.fillStyle = '#1a120a'; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// ferroada: pisar/encostar na arraia parada no fundo
function stingCheck(R) {
  if (P.mode !== 'swim' || !P.under || R.flee > 2.5 || R.stungT > T) return;
  const d = Math.hypot(P.pos.x - R.pos.x, P.pos.z - R.pos.z), up = P.pos.y - R.pos.y;
  if (d < 0.75 * R.s + 0.2 && up < 0.9) { R.stungT = T + 30; R.flee = 3; P.o2 = Math.max(0, P.o2 - 0.2); FX.shake = 1; buzz([200, 60, 200]); AU.bad(); toast('Ferroada de arraia! Dor forte: suba e descanse. Olhe o fundo antes de encostar na areia.', 5, 'bad'); }
}
// alvos de foto exclusivos do rio
function amzTargets(test) {
  for (const B of PBOI.list) if (B.m.visible) test(B.pos, 0.8, { turtle: true, key: 'peixeboi', pos: B.pos });
  for (const J of JAC.list) if (J.m.visible) test(J.pos, 0.6, { turtle: true, key: 'jacare', pos: J.pos });
}
// eventos do rio (marcados amz: só valem no Amazonas)
function evAmz() {
  return [
    { amz: true, id: 'piracema', when: () => season() === 'cheia' && SV.tod >= 6 && SV.tod < 11, spot: 'pedral', key: 'douradorio', n: [3, 6], msg: 'Piracema: cardume de dourado subindo a corredeira do pedral!' },
    { amz: true, id: 'clara', when: () => COND.vis > 1.3, spot: 'canal', key: 'cachorra', n: [2, 4], msg: 'Água clara no canal: cachorras caçando na meia-água!' },
    { amz: true, id: 'lua_amz', when: () => fullMoon() && (SV.tod >= 19 || SV.tod < 5), spot: 'negro', key: 'traira', n: [1, 2], msg: 'Lua cheia: traíras grandes caçando na água preta.' },
    { amz: true, id: 'seca', when: () => season() === 'seca', spot: 'lago', key: 'tambaqui', n: [2, 4], msg: 'Seca: o lago encolheu e o tambaqui está concentrado no Lago Verde.' },
  ];
}
function eventsAmzHTML() {
  const s = season(), dLeft = 7 - ((SV.day || 1) - 1) % 7, ev = [];
  ev.push([s === 'cheia' ? 'Cheia' : 'Seca', s === 'cheia' ? `Rio alto: o peixe entra no igapó e se espalha pela floresta alagada. De manhã tem piracema no pedral. Vira seca em ${dLeft} dia(s).` : `Rio baixo: o peixe se concentra no canal e no Lago Verde; o igapó fica raso. Vira cheia em ${dLeft} dia(s).`]);
  if (weekend()) ev.push(['Torneio do fim de semana', 'Campeonatos pagam o dobro hoje.']);
  if (fullMoon()) ev.push(['Lua cheia', 'À noite, traíras grandes na Lagoa da Água Preta. Cuidado com o jacaré.']);
  if (COND.vis > 1.3) ev.push(['Água clara', 'Cachorra e dourado caçando no canal.']);
  return `<div class="it" style="margin-bottom:8px"><div><div class="n">${weekday()} · eventos do dia</div><div class="d">${ev.map(([n, d]) => `<b>${n}:</b> ${d}`).join('<br>')}</div></div></div>`;
}

// boletim do rio (aba Boletim)
function bulletinAmz() {
  const s = season();
  return `<div class="it"><div><div class="n">Visibilidade</div><div class="d">${COND.vis > 1.25 ? 'Água bem clara: bom dia para o canal e o pedral, atrás de dourado e cachorra.' : COND.vis < 0.8 ? 'Água barrenta: fique no raso da praia e do lago, e leve lanterna.' : 'Água verde normal do Tapajós.'} Na Lagoa da Água Preta a visibilidade é sempre de poucos metros.</div></div></div>
    <div class="it"><div><div class="n">Rio</div><div class="d">${s === 'cheia' ? 'Cheia: o peixe entra na floresta alagada. Igapó cheio de tucunaré e tambaqui comendo frutos.' : 'Seca: o igapó fica raso e o peixe desce para o canal e para o Lago Verde.'} Correnteza forte no canal e no pedral.</div></div></div>
    <div class="it"><div><div class="n">Perigos</div><div class="d">Arraia na areia rasa (olhe antes de encostar no fundo), poraquê nas galhadas, piranha cercando quem nada com peixe na fieira e jacaré no igapó à noite.</div></div></div>`;
}

// ---------- voadeira: barco de alumínio da pousada, raso e leve ----------
const VOAD = { name: 'Voadeira 6 m', max: 26, tank: 60, scale: 1, price: 0, desc: 'Barco de alumínio da pousada, raso e leve: entra em qualquer igarapé. Motor de popa 40 hp com cana de leme.' };
const useVoad = () => AMZ && SV.voad !== false;
const curBoatIdx = () => useVoad() ? 'v' : SV.boat || 0;
function buildVoadeira() {
  const look = { len: 0.78, beam: 0.62, bottom: [0.62, 0.64, 0.66], fb: 0.72 }, paint = { top: [0.74, 0.76, 0.78], stripe: [0.12, 0.42, 0.26] };
  const g = new THREE.Group(), [hg, deckG] = boatHull(look, paint);
  hg.scale(1, 0.7, 1); hg.translate(0, 0.12, 0);
  g.add(new THREE.Mesh(hg, uwify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.55, side: THREE.DoubleSide }), { key: 'bv' })));
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.85 }), alu = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.4, metalness: 0.6 });
  const deck = new THREE.Mesh(deckG, alu); deck.position.y = 0.42; g.add(deck);
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  // bancos de madeira atravessados, assoalho e borda reforçada
  for (const z of [-2.2, -0.6, 0.9]) box(1.4, 0.06, 0.34, 0, 0.72, z, wood);
  for (const sx of [-1, 1]) box(0.06, 0.08, 4.9, sx * 0.74, 0.86, -0.3, alu);
  box(1.3, 0.08, 0.8, 0, 0.62, 2.3, alu); // proa coberta
  // motor de popa com cana de leme
  outboard(g, 0, -2.85, 0.75, new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0x1f5a8a, roughness: 0.4 }));
  const tiller = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), alu); tiller.rotation.x = Math.PI / 2 - 0.25; tiller.position.set(0, 1.15, -2.45); g.add(tiller);
  // piloto sentado no banco de trás, mão na cana
  const pilot = buildDiver(false); scene.remove(pilot.root); g.add(pilot.root); pilot.root.position.set(0.1, 0.72 + 0.62, -2.15); pilot.root.rotation.y = Math.PI;
  poseDiver(pilot, 'drive', 0); g.userData.pilot = [pilot.root]; g.userData.rig = pilot; g.userData.eye = new V3(0.1, 0.72 + 0.62 + 0.8, -2.05);
  return g;
}
function voadHTML() {
  const use = useVoad(), img = thumb('voadeira', () => buildVoadeira(), [1, 0.45, 0.8], 1.15);
  return `<div class="it eq"><img class="thumb" src="${img}" alt=""><div style="flex:1"><div class="n">${VOAD.name} · da pousada</div><div class="d">${VOAD.desc} Velocidade máx. ${Math.round(VOAD.max * 1.94)} nós · tanque ${VOAD.tank} L. Grátis enquanto estiver no Amazonas.</div></div>${use ? '<span class="d">EM USO</span>' : '<button class="btn" data-voad="1">USAR</button>'}</div>`;
}

// torneio do rio: tucunaré e dourado valem mais (grandes valem 3)
function compPts(f) { if (!AMZ || (f.key !== 'tucunare' && f.key !== 'douradorio')) return 1; return f.len >= f.sp.len[1] * 0.8 ? 3 : 2; }
