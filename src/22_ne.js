// ================= destino Costa dos Corais (AL/PE): piscinas naturais, arrecifes, cabeços de coral, naufrágio, parcel e tubarões =================
// a costa corre de oeste para leste ao sul (z positivo); o mar abre para o norte (z negativo)
function neCoast(x) { return 620 + 40 * Math.sin(x * 0.0028) + 15 * Math.sin(x * 0.011 + 2); }
// barras (passagens no recife)
function neGap(x) { return Math.max(1 - smooth(25, 55, Math.abs(x)), 1 - smooth(20, 45, Math.abs(x - 880)), 1 - smooth(18, 40, Math.abs(x + 640))); }
// ilhota do farol (função: o relevo e os pontos são montados antes deste arquivo rodar)
function farolP() { return { x: 1080, z: -230 }; }
function Hne(x, z) {
  const s = neCoast(x) - z; // distância da praia para o mar
  let h;
  if (s < 0) h = 1.2 + 6 * smooth(-10, -160, s) * (0.6 + 0.8 * fbm(x * 0.008, z * 0.008, 3)) + 0.6 * fbm(x * 0.05, z * 0.05, 2);
  else if (s < 50) h = lerp(1.2, -1.6, smooth(0, 50, s));
  else if (s < 255) h = -1.6 - 1.4 * smooth(50, 200, s) + 0.5 * fbm(x * 0.04, z * 0.04, 2); // laguna das piscinas
  else if (s < 310) { const crest = lerp(-0.5 + 0.4 * fbm(x * 0.08, z * 0.08, 2), -4.2, neGap(x)); h = lerp(-3, crest, smooth(255, 268, s) * (1 - smooth(296, 310, s))) + (s > 296 ? lerp(0, -4, smooth(296, 310, s)) : 0); }
  else if (s < 1250) h = lerp(-7, -18, smooth(310, 1250, s)) + 2.2 * fbm(x * 0.012 + 4, z * 0.012, 3) + 1.4 * Math.max(0, fbm(x * 0.05, z * 0.05, 2) - 0.2) * 3;
  else h = lerp(-18, -32, smooth(1250, 1850, s)) + 1.5 * fbm(x * 0.01, z * 0.01, 3);
  // parcel das paredes: crista submersa com parede para o mar aberto
  const ps = Math.abs(s - 1380) / 75; if (ps < 1.8) h = Math.max(h, lerp(-11.5 + 2 * fbm(x * 0.03, z * 0.03, 2), h, smooth(0.6, 1.8, ps)));
  // ilhota do farol
  const FAROL = farolP(), df = Math.hypot(x - FAROL.x, z - FAROL.z); if (df < 160) h = Math.max(h, lerp(9 * (1 - df / 60) + fbm(x * 0.05, z * 0.05, 2) * 2, h, smooth(35, 140, df)));
  return h;
}
function uwNe() { return `  float murk=0.0;
  vec3 ab=vec3(exp(-dp*0.11),exp(-dp*0.026),exp(-dp*0.02));
  gl_FragColor.rgb*=ab;`; }
function pierNe() { const zs = neCoast(0); for (let z = zs; z > zs - 260; z -= 2) if (Hne(0, z) < -2.4) return { x: 0, z0: Math.max(z + 70, zs + 6), z1: z }; return { x: 0, z0: zs + 6, z1: zs - 90 }; }
function spotsNe() {
  const c = x => neCoast(x);
  return [
    { id: 'pontal', name: 'Marina do Pontal', x: PIER.x, z: PIER.z1 - 10, type: 'marina', desc: 'Marina na laguna: venda do pescado, loja, combustível e viagens. Saia pela barra do recife.' },
    { id: 'piscinas', name: 'Piscinas Naturais', x: -480, z: c(-480) - 190, r: 55, depth: '1–3 m', noTake: true, desc: 'Área de preservação: SÓ FOTO. Água cristalina com sargentinho, peixe-cirurgião, budião-azul e tartaruga.' },
    { id: 'arrecife', name: 'Arrecife da Barra', x: 420, z: c(420) - 330, r: 50, depth: '3–8 m', desc: 'Lado de fora do recife: guaiúba, ariacó, saramunete, sargo e moreia nas tocas.' },
    { id: 'cabecos', name: 'Cabeços de Coral', x: -260, z: c(-260) - 650, r: 55, depth: '8–14 m', desc: 'Cabeços de coral no meio da areia: cioba, dentão, garoupa-gato e cardume de xaréu.' },
    { id: 'naufragio_ne', name: 'Naufrágio do Vapor', x: 640, z: c(640) - 1020, r: 45, depth: '15–20 m', desc: 'Vapor de ferro afundado: pargo, cioba e mero. O tubarão-lixa descansa embaixo do casco.' },
    { id: 'parcel_ne', name: 'Parcel das Paredes', x: 80, z: c(80) - 1380, r: 60, depth: '12–30 m', cur: [0.3, -0.1], desc: 'Paredão para o mar aberto, água azul: cavala, dourado, bicuda e olho-de-boi. Cuidado com o tubarão cabeça-chata.' },
    { id: 'farol', name: 'Lajes do Farol', x: farolP().x, z: farolP().z + 70, r: 50, depth: '5–15 m', desc: 'Costão da ilhota do farol: garoupa, badejo, budião e cangulo.' },
  ];
}
function fitSpot(id, dmin, dmax) { const S = spotById(id); if (!S || !S.r) return; for (let k = 0; k < 500; k++) { const a = k * 0.7, d = k * 0.6, x = S.x + Math.cos(a) * d, z = S.z + Math.sin(a) * d, h = H(x, z); if (h <= -dmin && h >= -dmax) { S.x = x; S.z = z; return; } } }

// ---------- peixes do Nordeste ----------
Object.assign(SHAPES, { shark: { jaw: 0.2, h: 0.19, w: 0.17, pk: 0.55, fork: true, tailH: 0.27, dors: 0.13, df: 'two', pec: 0.26, hetero: true } });
const NE_SPECIES = {
  guaiuba: { name: 'Guaiúba', shape: 'snap', len: [0.25, 0.6], k: 12, price: 30, min: 0.28, cruise: 0.8, burst: 4.2, shy: 0.6, curious: 0.55, habit: 'mid', str: 1.0, school: true, col: { back: '#4a5a7a', side: '#c8a8b0', belly: '#f4ecec', fin: '#f0c830', iris: '#e04030' } },
  ariaco: { name: 'Ariacó', shape: 'snap', len: [0.2, 0.45], k: 14, price: 28, min: 0.22, cruise: 0.6, burst: 3.6, shy: 0.55, curious: 0.45, habit: 'reef', str: 0.9, school: true, col: { back: '#b06060', side: '#e8a8a0', belly: '#f6e4e0', fin: '#e8b040', iris: '#e05030' } },
  cavala: { name: 'Cavala', shape: 'mack', len: [0.6, 1.4], k: 6, price: 32, min: 0.6, cruise: 1.4, burst: 6.4, shy: 0.5, curious: 0.5, habit: 'pelagic', str: 1.6, school: true, col: { back: '#2a4a6a', side: '#c4ccd4', belly: '#f0f2f4', fin: '#4a5a6a', iris: '#e0e0c0' } },
  saramunete: { name: 'Saramunete', shape: 'slim', len: [0.15, 0.32], k: 12, price: 16, min: 0.15, cruise: 0.5, burst: 3.2, shy: 0.4, curious: 0.6, habit: 'reef', str: 0.6, school: true, col: { back: '#c08060', side: '#f0d0b8', belly: '#fbf2ea', fin: '#e0b060', iris: '#e0c060' } },
  garoupagato: { name: 'Garoupa-gato', shape: 'grouper', len: [0.25, 0.55], k: 15, price: 45, min: 0.25, cruise: 0.4, burst: 3.0, shy: 0.7, curious: 0.35, habit: 'hole', str: 1.0, col: { back: '#7a5a48', side: '#d8c0a8', belly: '#f2e4d4', fin: '#8a5a40', iris: '#d08040' } },
  pargo: { name: 'Pargo', shape: 'snap', len: [0.35, 0.85], k: 14, price: 40, min: 0.35, cruise: 0.6, burst: 3.6, shy: 0.8, curious: 0.3, habit: 'reef', str: 1.3, col: { back: '#a03028', side: '#e06050', belly: '#f8c8b8', fin: '#c04030', iris: '#e8c040' } },
  budiaoazul: { name: 'Budião-azul', shape: 'parrot', len: [0.4, 0.9], k: 15, price: 0, min: 9, cruise: 0.5, burst: 3.0, shy: 0.4, curious: 0.4, habit: 'reef', str: 1.2, protected: true, col: { back: '#1a5a9a', side: '#3a8ad0', belly: '#9ad0f0', fin: '#2a6ab0', iris: '#e0e060' } },
  cirurgiao: { name: 'Peixe-cirurgião', shape: 'disc', len: [0.15, 0.3], k: 26, price: 0, min: 0.15, cruise: 0.5, burst: 3.0, shy: 0.35, curious: 0.5, habit: 'reef', str: 0.6, ornamental: true, school: true, col: { back: '#1a2a7a', side: '#2a4ab0', belly: '#3a5ac0', fin: '#1a2a6a', iris: '#e0c040' } },
  tubaraolixa: { name: 'Tubarão-lixa', shape: 'shark', len: [1.4, 2.5], k: 6, price: 0, min: 9, cruise: 0.3, burst: 2.0, shy: 0.1, curious: 0.2, habit: 'hole', str: 3, protected: true, col: { back: '#7a6640', side: '#a08a5a', belly: '#d8caa0', fin: '#6a5634', iris: '#c0a040' } },
  cabecachata: { name: 'Tubarão cabeça-chata', shape: 'shark', len: [1.8, 2.8], k: 7, price: 0, min: 9, cruise: 0.7, burst: 4.0, shy: 0.05, curious: 0.6, habit: 'pelagic', str: 4, protected: true, col: { back: '#5a6066', side: '#8a9096', belly: '#eef0f0', fin: '#4a5056', iris: '#202020' } },
};
for (const k in NE_SPECIES) NE_SPECIES[k].regs = ['ne'];
Object.assign(SPECIES, NE_SPECIES);
// espécies da Costa Verde que também vivem no Nordeste
for (const k of ['cioba', 'dentao', 'xareu', 'bicuda', 'dourado', 'olhodeboi', 'albacora', 'cangulo', 'budiao', 'sargo', 'garoupa', 'badejo', 'mero', 'frade', 'cocoroca', 'salema']) SPECIES[k].regs = ['cv', 'ne'];
const spInRegion = k => (SPECIES[k].regs || (SPECIES[k].amz ? ['amz'] : ['cv'])).includes(REGION);
Object.assign(SP_INFO, {
  guaiuba: ['Ocyurus chrysurus', 'Meia-água sobre o recife, em cardume.', 'A faixa amarela que vai do focinho à cauda bifurcada entrega a guaiúba.'],
  ariaco: ['Lutjanus synagris', 'Fundo de areia perto do recife.', 'Vermelho rosado com finas linhas amarelas e uma mancha escura no dorso.'],
  cavala: ['Scomberomorus cavalla', 'Água azul, de passagem.', 'Uma das mais rápidas do mar: corta cardumes de sardinha em velocidade.'],
  saramunete: ['Pseudupeneus maculatus', 'Areia entre os corais.', 'Usa os dois barbilhões do queixo para revirar a areia atrás de comida.'],
  garoupagato: ['Epinephelus adscensionis', 'Tocas de coral rasas.', 'Pintada de vermelho-alaranjado, territorial: volta sempre para a mesma toca.'],
  pargo: ['Lutjanus purpureus', 'Naufrágios e fundo de pedra mais fundo.', 'Vermelho intenso, peixe nobre que forma grupos sobre as estruturas.'],
  budiaoazul: ['Scarus trispinosus', 'Recifes de coral.', 'Ameaçado e protegido: o maior budião do Brasil, essencial para a saúde dos corais. Só foto!'],
  cirurgiao: ['Acanthurus coeruleus', 'Recifes rasos, em grupos.', 'Tem uma lâmina afiada na base da cauda, como um bisturi. Peixe ornamental.'],
  tubaraolixa: ['Ginglymostoma cirratum', 'Embaixo de lajes e cascos, descansando.', 'Passa o dia parado no fundo e caça à noite. Ameaçado e protegido: só foto.'],
  cabecachata: ['Carcharhinus leucas', 'Mar aberto e parcéis.', 'Atraído por peixe sangrando: com peixe na fieira perto dele, suba para o barco. Protegido: só foto.'],
});
function neTex(key, g, blob, bars, R) {
  if (key === 'guaiuba') { g.fillStyle = 'rgba(245,205,40,.85)'; g.fillRect(0, 22, 256, 7); g.fillRect(0, 71, 256, 7); for (let i = 0; i < 30; i++) blob(R() * 150, R() * 20, 3, 2, 'rgba(240,210,60,.6)'); }
  if (key === 'ariaco') { g.strokeStyle = 'rgba(240,200,60,.6)'; g.lineWidth = 1.5; for (const y of [30, 38, 62, 70]) { g.beginPath(); g.moveTo(0, y); g.lineTo(220, y); g.stroke(); } blob(110, 20, 8, 6, 'rgba(40,20,20,.5)'); blob(110, 80, 8, 6, 'rgba(40,20,20,.5)'); }
  if (key === 'cavala') { g.fillStyle = 'rgba(40,60,80,.25)'; for (let x = 20; x < 220; x += 14) g.fillRect(x, 8, 4, 18); }
  if (key === 'saramunete') { for (let i = 0; i < 3; i++) blob(80 + i * 45, 25, 7, 6, 'rgba(160,40,30,.55)'); }
  if (key === 'garoupagato') { for (let i = 0; i < 120; i++) blob(R() * 230, R() * 100, 2.5, 2.5, 'rgba(200,60,30,.7)'); }
  if (key === 'pargo') { for (let i = 0; i < 30; i++) blob(R() * 200, R() * 100, 3, 2, 'rgba(255,200,180,.3)'); }
  if (key === 'budiaoazul') { g.strokeStyle = 'rgba(120,200,255,.4)'; g.lineWidth = 2; for (let y = 4; y < 100; y += 7) for (let x = 0; x < 210; x += 8) g.strokeRect(x + (y % 14 ? 4 : 0), y, 7, 6); }
  if (key === 'cirurgiao') { g.strokeStyle = 'rgba(80,120,230,.6)'; g.lineWidth = 1.2; for (let y = 6; y < 100; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(220, y + 3); g.stroke(); } g.fillStyle = '#f0e8d0'; g.fillRect(14, 46, 10, 8); }
  if (key === 'tubaraolixa') { for (let i = 0; i < 40; i++) blob(R() * 220, R() * 100, 3, 3, 'rgba(60,45,20,.25)'); }
}
function popNe() {
  return {
    piscinas: [['cirurgiao', 3, [4, 8]], ['budiaoazul', 2, [1, 2]], ['sargo', 2, [4, 7]], ['saramunete', 2, [3, 6]], ['frade', 1, [1, 2]]],
    arrecife: [['guaiuba', 4, [4, 8]], ['ariaco', 3, [3, 6]], ['saramunete', 3, [3, 6]], ['sargo', 3, [4, 8]], ['garoupagato', 3, [1, 1]], ['budiao', 2, [1, 2]], ['cirurgiao', 2, [3, 6]], ['cocoroca', 2, [6, 10]], ['budiaoazul', 1, [1, 1]]],
    cabecos: [['cioba', 3, [1, 2]], ['dentao', 2, [1, 1], 0.6], ['garoupagato', 4, [1, 1]], ['xareu', 3, [3, 6]], ['guaiuba', 3, [4, 8]], ['ariaco', 2, [3, 5]], ['badejo', 2, [1, 1]], ['bicuda', 1, [1, 2], 0.6], ['tubaraolixa', 1, [1, 1], 0.6]],
    naufragio_ne: [['pargo', 4, [2, 4]], ['cioba', 3, [1, 2], 1, 1.2], ['garoupa', 4, [1, 1], 1, 1.2], ['badejo', 2, [1, 1], 1, 1.2], ['mero', 1, [1, 1], 0.7], ['tubaraolixa', 2, [1, 1]], ['xareu', 2, [3, 6]], ['dentao', 1, [1, 1], 0.6]],
    parcel_ne: [['cavala', 4, [3, 6]], ['dourado', 3, [2, 5]], ['bicuda', 3, [1, 3]], ['olhodeboi', 3, [1, 3], 1, 1.2], ['albacora', 2, [3, 6], 0.6], ['xareu', 3, [3, 7]], ['pargo', 2, [2, 4]], ['cabecachata', 1, [1, 1], 0.8]],
    farol: [['garoupa', 5, [1, 1]], ['badejo', 3, [1, 1]], ['budiao', 3, [1, 3]], ['cangulo', 3, [1, 3]], ['sargo', 3, [4, 8]], ['salema', 2, [6, 10]], ['xareu', 2, [3, 6]]],
  };
}
const POP_ZONE_NE = [['guaiuba', 1, [4, 7]], ['ariaco', 1, [3, 5], 0.8], ['saramunete', 1, [3, 5], 0.7], ['garoupagato', 2, [1, 1], 0.8], ['sargo', 1, [4, 7], 0.7], ['cioba', 1, [1, 1], 0.5], ['budiao', 1, [1, 2], 0.6], ['cirurgiao', 1, [3, 5], 0.5], ['xareu', 1, [3, 5], 0.35]];

// ---------- mundo: recife de franja, cabeços, paredão, ilhota, naufrágio ----------
function buildReefNe(r) {
  fitSpot('piscinas', 1, 3); fitSpot('arrecife', 3, 8); fitSpot('cabecos', 8, 14); fitSpot('naufragio_ne', 15, 21); fitSpot('parcel_ne', 11, 18); fitSpot('farol', 5, 15);
  const spotNear = (x, z) => { let b = null, bd = 140; for (const s of SPOTS) if (s.r) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; b = s.id; } } return b; };
  // recife de franja: blocos de coral na crista, fora das barras
  for (let x = WB.x0 + 4; x < WB.x1 - 4; x += 4.2) {
    if (neGap(x) > 0.3) continue;
    for (const ds of [262, 272, 284, 294, 304, 316]) {
      if (r() < 0.25) continue;
      const z = neCoast(x) - ds - r() * 6, h = H(x, z), rad = 1.2 + r() * 2.4; if (h > -0.3) continue;
      const R = addRock(x + (r() - 0.5) * 3, Math.min(h + rad * 0.2, -0.25 - rad * 0.75), z, rad, spotNear(x, z)); if (ds > 280 && rad > 2.2 && r() < 0.35) addHole(R, -Math.PI / 2 + (r() - 0.5), R.spot);
    }
  }
  // cabeços de coral espalhados na areia, mais concentrados no ponto
  const C = spotById('cabecos');
  for (let i = 0; i < 420; i++) {
    const near = i < 140, x = near ? C.x + (r() - 0.5) * 160 : lerp(WB.x0, WB.x1, r()), s = near ? null : 360 + r() * 850, z = near ? C.z + (r() - 0.5) * 160 : neCoast(x) - s, h = H(x, z);
    if (h > -5 || h < -19) continue;
    const rad = 1.4 + r() * (near ? 3.6 : 2.6), R = addRock(x, h + rad * 0.35, z, rad, spotNear(x, z)); if (rad > 2.4 && r() < 0.5) addHole(R, r() * TAU, R.spot);
    if (rad > 3 && r() < 0.5) addRock(x + (r() - 0.5) * 2, h + rad * 0.9, z + (r() - 0.5) * 2, rad * 0.55, R.spot);
  }
  // paredão do parcel: blocos grandes na crista, tocas viradas para o mar
  for (let x = WB.x0 + 30; x < WB.x1 - 30; x += 3.2) {
    const z = neCoast(x) - 1380 - (r() - 0.3) * 70, h = H(x, z); if (h < -24) continue;
    const rad = 2 + r() * 3.4, R = addRock(x, h + rad * 0.3, z, rad, spotNear(x, z)); if (rad > 3 && r() < 0.45) addHole(R, -Math.PI / 2 + (r() - 0.5) * 0.8, R.spot);
  }
  // laguna das piscinas: cabeços baixos de coral espalhados na areia clara, mais juntos no ponto
  const Pi = spotById('piscinas');
  for (let i = 0; i < 520; i++) {
    const near = i < 220, x = near ? Pi.x + (r() - 0.5) * 220 : lerp(WB.x0, WB.x1, r()), z = near ? Pi.z + (r() - 0.5) * 140 : neCoast(x) - 70 - r() * 175, h = H(x, z);
    if (h > -1.1 || neGap(x) > 0.5) continue;
    const rad = 0.6 + r() * 1.5; addRock(x, Math.min(h + rad * 0.25, -0.35 - rad * 0.7), z, rad, spotNear(x, z) || (near ? 'piscinas' : null));
  }
  // costão da ilhota do farol
  scatterRocksRing({ x: farolP().x, z: farolP().z, r: 40 }, 260, 81, 'farol', 0.5);
  // zonas de pesca: borda de fora do recife, cabeços e paredão
  for (let x = WB.x0 + 150; x < WB.x1 - 150; x += 200) {
    if (neGap(x) > 0.2) continue;
    for (const [ds, zone] of [[330, 'recife'], [700, 'cabeco'], [1390, 'parede']]) { const z = neCoast(x) - ds, h = H(x, z); if (h < -2.5 && SPOTS.every(s => Math.hypot(s.x - x, s.z - z) > 120)) ZONES.push({ id: 'zn' + zone[0] + Math.round(x), x, z, r: 40, zone }); }
  }
}
function buildWorldNe() { const W = spotById('naufragio_ne'); buildWreck({ x: W.x, z: W.z, ry: 0.9, L: 40, spot: 'naufragio_ne' }); }
// praia: coqueiros, pousadas coloridas, jangadas na areia e espuma na crista do recife
const NEFX = { foam: null, foamM: null };
function buildCoastNe() {
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), pp = new V3(), e = new THREE.Euler(), palms = [], houses = [];
  for (let i = 0; i < 40000 && palms.length < 1500; i++) {
    const x = rand(WB.x0 - 200, WB.x1 + 200), z = rand(400, 1300), sd = neCoast(x) - z, h = H(x, z);
    if (h < 0.8 || sd > -8 || (Math.abs(x - PIER.x) < 20 && z < PIER.z0 + 12)) continue;
    if (sd < -260 && Math.random() < 0.6) continue;
    palms.push([x, h, z]);
  }
  for (let i = 0; i < 6000 && houses.length < 45; i++) { const x = rand(-420, 420), z = neCoast(x) + rand(40, 220), h = H(x, z); if (h > 1 && Math.abs(x - PIER.x) > 22) houses.push([x, h, z]); }
  // coqueiro: tronco curvo e copa de folhas em leque
  const tr = new THREE.CylinderGeometry(0.16, 0.24, 1, 6); tr.translate(0, 0.5, 0);
  const leaves = []; for (let k = 0; k < 8; k++) { const l = new THREE.PlaneGeometry(0.5, 3.2, 1, 4); l.translate(0, 1.6, 0); const p = l.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -0.18 * y * y); } l.rotateX(-1.0); l.rotateY(k / 8 * TAU); leaves.push(l); }
  const crown = mergeGeos(leaves);
  const tIM = new THREE.InstancedMesh(tr, new THREE.MeshLambertMaterial({ color: 0x8a7458 }), palms.length), cIM = new THREE.InstancedMesh(crown, new THREE.MeshLambertMaterial({ color: 0x4f8a32, side: THREE.DoubleSide }), palms.length);
  palms.forEach((t, i) => { const hgt = rand(6, 11), lean = rand(-0.25, 0.25), yaw = rand(0, TAU); e.set(lean, yaw, 0, 'YXZ'); q.setFromEuler(e); s.set(1, hgt, 1); pp.set(t[0], t[1] - 0.2, t[2]); m4.compose(pp, q, s); tIM.setMatrixAt(i, m4);
    const top = new V3(0, hgt, 0).applyQuaternion(q).add(pp); e.set(rand(-0.2, 0.2), rand(0, TAU), 0); q.setFromEuler(e); const k = rand(0.8, 1.2); s.set(k, k, k); m4.compose(top, q, s); cIM.setMatrixAt(i, m4); cIM.setColorAt(i, new THREE.Color().setHSL(rand(0.24, 0.3), 0.55, rand(0.25, 0.38))); });
  scene.add(tIM, cIM); LAND.push(tIM, cIM);
  const hG = new THREE.BoxGeometry(6, 3.4, 6); hG.translate(0, 1.7, 0); const rG = new THREE.ConeGeometry(4.8, 2, 4); rG.rotateY(Math.PI / 4); rG.translate(0, 4.4, 0);
  const HC = [0xf4e2a0, 0x9ad0e0, 0xf0b0a0, 0xc8e0a8, 0xffffff, 0xf8c870];
  const hIM = new THREE.InstancedMesh(hG, new THREE.MeshLambertMaterial({ color: 0xffffff }), houses.length), rIM = new THREE.InstancedMesh(rG, new THREE.MeshLambertMaterial({ color: 0xb4532a }), houses.length);
  houses.forEach((t, i) => { const k = rand(0.8, 1.3); q.setFromAxisAngle(new V3(0, 1, 0), rand(-0.3, 0.3)); s.set(k, k, k); pp.set(t[0], t[1] - 0.3, t[2]); m4.compose(pp, q, s); hIM.setMatrixAt(i, m4); rIM.setMatrixAt(i, m4); hIM.setColorAt(i, new THREE.Color(HC[i % HC.length])); });
  scene.add(hIM, rIM); LAND.push(hIM, rIM);
  // jangadas na areia: casco de troncos e vela triangular
  const sailM = new THREE.MeshLambertMaterial({ color: 0xf2ece0, side: THREE.DoubleSide }), wood = new THREE.MeshLambertMaterial({ color: 0x9a7a52 });
  for (let k = 0; k < 7; k++) {
    const x = -700 + k * 110 + rand(-20, 20), z = neCoast(x) + rand(6, 16), h = H(x, z); if (h < 0.2) continue;
    const g = new THREE.Group(); g.position.set(x, h, z); g.rotation.y = rand(-0.4, 0.4) + Math.PI / 2;
    const raft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 5), wood); raft.position.y = 0.15; g.add(raft);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 5, 6), wood); mast.position.set(0, 2.6, 0.8); g.add(mast);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 4.4); sh.lineTo(-2.2, 0.3); sh.closePath(); const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), sailM); sail.position.set(0, 0.5, 0.8); sail.rotation.y = Math.PI / 2; g.add(sail);
    scene.add(g);
  }
  // espuma das ondas quebrando na crista do recife
  const foam = []; for (let x = WB.x0; x < WB.x1; x += 7) if (neGap(x) < 0.3) foam.push([x + rand(-2, 2), 0.06, neCoast(x) - rand(266, 282)]);
  const fG = new THREE.PlaneGeometry(9, 2.4); fG.rotateX(-Math.PI / 2);
  NEFX.foamM = new THREE.MeshBasicMaterial({ map: dotTex(), color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false });
  const fIM = new THREE.InstancedMesh(fG, NEFX.foamM, foam.length); foam.forEach((f, i) => { q.setFromAxisAngle(new V3(0, 1, 0), rand(-0.2, 0.2)); s.set(rand(0.7, 1.3), 1, rand(0.6, 1.2)); pp.set(f[0], f[1], f[2]); m4.compose(pp, q, s); fIM.setMatrixAt(i, m4); });
  fIM.frustumCulled = false; scene.add(NEFX.foam = fIM);
}

// ---------- área de preservação e tubarão cabeça-chata ----------
function noTakeAt(p) { if (!NE) return false; const S = spotById('piscinas'); return !!S && Math.hypot(p.x - S.x, p.z - S.z) < 170; }
let ntTip = false, sharkT = 0;
function updateNe(dt, t) {
  if (!NE) return;
  if (NEFX.foamM) NEFX.foamM.opacity = 0.28 + 0.14 * Math.sin(t * 1.3) * COND.swell;
  if (!ntTip && P.mode === 'swim' && noTakeAt(P.pos)) { ntTip = true; toast('Área de preservação das piscinas naturais: aqui é SÓ FOTO. Atirar dá multa.', 5, 'bad'); }
  // cabeça-chata: com peixe na fieira por perto, ronda cada vez mais perto e leva a fieira
  if ((sharkT -= dt) > 0) return; sharkT = 0.25;
  for (const f of FISHES) {
    if (f.key !== 'cabecachata' || !f.alive || f.state === 'hooked' || f.state === 'dead') continue;
    const d = f.pos.distanceTo(P.pos), hunting = P.mode === 'swim' && P.under && P.stringer.length >= 2 && d < 35 && !(f.cool > T);
    if (!hunting) { if (f.circ) { f.circ = 0; f.state = 'wander'; } continue; }
    if (!f.circ) { f.circ = 12; f.ca = Math.atan2(f.pos.z - P.pos.z, f.pos.x - P.pos.x); toast('Tubarão cabeça-chata rondando! O peixe na fieira atrai tubarão: suba para o barco.', 5, 'bad'); buzz([100, 60, 100]); }
    f.circ = Math.max(2, f.circ - 0.25 * 0.6); f.ca += 0.25 * 0.5;
    f.state = 'flee'; f.t = 1; f.speed = f.sp.cruise * 2.2; f.target.set(P.pos.x + Math.cos(f.ca) * f.circ, P.pos.y + 0.5, P.pos.z + Math.sin(f.ca) * f.circ);
    if (d < 2.6) {
      const n = P.stringer.length; P.stringer = []; f.cool = T + 120; f.circ = 0; f.state = 'flee'; f.t = 6; f.target.copy(f.pos).addScaledVector(_t1.subVectors(f.pos, P.pos).normalize(), 40);
      FX.shake = 1.4; buzz([200, 80, 200]); AU.thud(); spawnScales(_t2.copy(P.pos), 40); P.o2 = Math.max(0, P.o2 - 0.12);
      toast(`O tubarão levou a fieira inteira (${n} peixe${n > 1 ? 's' : ''})! Com peixe na fieira, não demore no fundo perto dele.`, 6, 'bad');
    }
  }
}

// ---------- textos, eventos e chegada ----------
function evNe() {
  return [
    { reg: 'ne', id: 'azul_ne', when: () => COND.vis > 1.3, spot: 'parcel_ne', key: 'cavala', n: [4, 7], msg: 'Água azul no Parcel das Paredes: cardume de cavala subiu!' },
    { reg: 'ne', id: 'mare_ne', when: () => SV.tod >= 6 && SV.tod < 10, spot: 'arrecife', key: 'guaiuba', n: [5, 9], msg: 'Maré enchendo de manhã: cardume de guaiúba encostou no Arrecife da Barra.' },
    { reg: 'ne', id: 'lua_ne', when: () => fullMoon() && (SV.tod >= 19 || SV.tod < 5), spot: 'naufragio_ne', key: 'pargo', n: [2, 4], msg: 'Lua cheia: pargos grandes saíram do Naufrágio do Vapor.' },
  ];
}
function eventsNeHTML() {
  const ev = [];
  if (weekend()) ev.push(['Torneio do fim de semana', 'Campeonatos pagam o dobro hoje.']);
  ev.push(['Maré', 'De manhã cedo a maré enche e a guaiúba encosta no recife.']);
  if (fullMoon()) ev.push(['Lua cheia', 'À noite, pargos grandes no Naufrágio do Vapor.']);
  if (COND.vis > 1.3) ev.push(['Água azul', 'Cavala e dourado no Parcel das Paredes. O cabeça-chata também aparece.']);
  return `<div class="it" style="margin-bottom:8px"><div><div class="n">${weekday()} · eventos do dia</div><div class="d">${ev.map(([n, d]) => `<b>${n}:</b> ${d}`).join('<br>')}</div></div></div>`;
}
function bulletinNe() {
  return `<div class="it"><div><div class="n">Visibilidade</div><div class="d">${COND.vis > 1.25 ? 'Água azul cristalina: dia de ir no Parcel das Paredes.' : COND.vis < 0.8 ? 'Água mexida pelo vento: fique por dentro da barra e nos cabeços.' : 'Água verde-azulada boa no recife.'}</div></div></div>
    <div class="it"><div><div class="n">Mar</div><div class="d">${COND.swell > 1.25 ? 'Onda forte quebrando na crista do recife: saia e entre só pela barra.' : 'Mar tranquilo fora do recife.'}</div></div></div>
    <div class="it"><div><div class="n">Regras</div><div class="d">Piscinas naturais são área de preservação: só foto. Tubarão-lixa, cabeça-chata, budião-azul e mero são protegidos.</div></div></div>`;
}
function setupNe() {
  if (!NE) return;
  $('menuReg').textContent = 'PESCA SUB · COSTA DOS CORAIS'; $('menuTag').textContent = 'Apneia, arbalete e recifes de coral do Nordeste'; $('mapTitle').textContent = 'Carta náutica · Costa dos Corais';
  if (!SV.neVisited) { SV.neVisited = true; save(); setTimeout(() => { toast('Bem-vindo à Costa dos Corais! Água azul e quente: saia da laguna pela barra do recife, na frente da marina.', 6, 'gold'); toast('Na vida real, aqui a pesca sub é só em apneia e fora das áreas de preservação, como as piscinas naturais. Informe-se antes.', 7); }, 1500); }
}
