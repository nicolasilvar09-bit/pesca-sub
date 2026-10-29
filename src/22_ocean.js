// ================= pesca oceânica (Costa Verde): plataforma de petróleo fictícia em água azul, atum-rabino e anchova =================
// fica bem longe da costa, a leste da Ilha Grande; o fundo cai para ~85 m em volta (água azul, sem fundo à vista)
function platP() { return { x: 2250, z: -1650 }; }
function platDeep(x, z, h) { const P0 = platP(), d = Math.hypot(x - P0.x, z - P0.z); return d < 750 ? Math.min(h, lerp(-85 + 3 * fbm(x * 0.01, z * 0.01, 2), h, smooth(160, 700, d))) : h; }

// ---------- peixes ----------
Object.assign(SHAPES, { tunal: { jaw: 0.4, h: 0.3, w: 0.2, pk: 0.72, fork: true, tailH: 0.38, dors: 0.17, df: 'two', pec: 0.24 } });
SPECIES.atumrabino = { name: 'Atum-rabino', shape: 'tunal', len: [0.9, 1.8], k: 15, price: 30, min: 0.9, cruise: 1.6, burst: 7.2, shy: 0.6, curious: 0.45, habit: 'pelagic', str: 3.2, school: true,
  col: { back: '#14234a', side: '#8aa0b8', belly: '#eef2f6', fin: '#f2cc18', iris: '#d0d0d0' } };
SPECIES.enchova.name = 'Anchova'; // anchova e enchova são o mesmo peixe (Pomatomus saltatrix)
SP_INFO.atumrabino = ['Thunnus albacares (adulto)', 'Mar aberto, em volta de plataformas e boias.', 'O atum-rabil, que muitos pescadores chamam de rabino: os grandes, acima de 40 kg, só aparecem longe da costa. A nadadeira em foice e as pínulas amarelas marcam a espécie.'];
function oceanTex(key, g, blob, bars, R) {
  if (key !== 'atumrabino') return;
  g.fillStyle = 'rgba(240,200,30,.6)'; g.fillRect(20, 33, 210, 4); g.fillRect(20, 63, 210, 4);
  g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = 20; x < 190; x += 8) for (const y of [42, 52]) g.fillRect(x, y, 2, 6);
  g.fillStyle = '#f2cc18'; for (let x = 2; x < 64; x += 8) { g.fillRect(x, 3, 4, 7); g.fillRect(x, 90, 4, 7); }
}
POP.plataforma = [['atumrabino', 3, [3, 6], 1, 1.1], ['enchova', 3, [4, 8]], ['olhodeboi', 3, [1, 3], 1, 1.3], ['dourado', 3, [2, 5], 1, 1.2], ['olhete', 3, [2, 5]], ['xareu', 3, [3, 7]], ['bicuda', 2, [1, 3]], ['albacora', 2, [3, 6]], ['sororoca', 2, [3, 5]]];

// ---------- plataforma: jaqueta de 4 pernas com travessas cobertas de vida, convés em níveis, heliponto, guindaste e tocha ----------
const PLAT = { flame: null, lights: null, light: null, warned: false };
function buildPlatform() {
  const P0 = platP(), g = new THREE.Group(); g.position.set(P0.x, 0, P0.z); scene.add(g);
  const bottom = H(P0.x, P0.z), S = 12; // meia-largura da jaqueta na linha d'água
  // crosta de vida marinha nas partes submersas (mexilhão, alga, coral-sol): tinta de ferrugem/verde por cima da textura de pedra
  const rt = rockTex(); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(2, 8);
  const growth = uwify(new THREE.MeshStandardMaterial({ map: rt, color: 0x6a7a52, roughness: 0.95 }), { key: 'plg' });
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8c040, roughness: 0.6, metalness: 0.3 }), grey = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.55, metalness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc83a2a, roughness: 0.6 }), white = new THREE.MeshStandardMaterial({ color: 0xe8ecee, roughness: 0.5 });
  const member = (a, b, r, mat, coll) => {
    const d = new V3().subVectors(b, a), L = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 12), mat);
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.clone().normalize()); g.add(m);
    if (coll) for (let s = 0; s <= L; s += Math.max(0.8, r * 1.2)) { const p = _t1.copy(a).addScaledVector(d, s / L).add(g.position); if (p.y > 0.5) continue; const R = addRock(p.x, p.y, p.z, r + 0.1, 'plataforma'); R.sy = 1; R.noDecor = true; }
  };
  // pernas inclinadas (mais abertas no fundo), parte submersa com crosta, parte de cima amarela
  const legs = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const top = new V3(sx * S, 0, sz * S), bot = new V3(sx * (S + 7), bottom, sz * (S + 7)); legs.push([top, bot]);
    member(bot, top, 1.2, growth, true); member(top, new V3(sx * S, 24, sz * S), 1.2, steel, false);
  }
  const at = (k, y) => { const [t, b] = legs[k], u = y / bottom; return new V3(lerp(t.x, b.x, u), y, lerp(t.z, b.z, u)); };
  // travessas horizontais e diagonais em níveis
  for (const y of [-6, -20, -38, -60].filter(y => y > bottom + 3)) {
    for (let k = 0; k < 4; k++) member(at(k, y), at((k + 1) % 4, y), 0.45, growth, true);
    member(at(0, y), at(2, y), 0.35, growth, true);
  }
  const lv = [-6, -20, -38, -60].filter(y => y > bottom + 3);
  for (let i = 0; i < lv.length - 1; i++) for (let k = 0; k < 4; k++) member(at(k, lv[i]), at((k + 1) % 4, lv[i + 1]), 0.35, growth, true);
  // convés: três níveis, módulos, heliponto, guindaste, tocha
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  box(30, 1, 30, 0, 14, 0, grey); box(30, 1, 30, 0, 20, 0, grey); box(28, 1, 28, 0, 26, 0, grey);
  for (const [x, z, w, d, c] of [[-7, -6, 10, 8, white], [6, -7, 8, 10, red], [-6, 7, 9, 9, white], [7, 6, 9, 8, grey]]) { box(w, 5, d, x, 17, z, c); box(w, 5, d, x, 23, z, c === red ? white : red); }
  const heli = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x2a3a2a })); heli.position.set(-10, 30, -10); g.add(heli);
  const hm = new THREE.Mesh(new THREE.TorusGeometry(5, 0.25, 4, 16), new THREE.MeshBasicMaterial({ color: 0xf0e040 })); hm.rotation.x = Math.PI / 2; hm.position.set(-10, 30.3, -10); g.add(hm);
  for (const [x, z] of [[-14, -14], [-6, -14], [-14, -6]]) member(new V3(x, 26, z), new V3(x, 29.8, z), 0.3, grey, false);
  member(new V3(10, 26, -10), new V3(10, 38, -10), 0.6, steel, false); member(new V3(10, 37, -10), new V3(26, 30, 4), 0.4, steel, false); // guindaste
  member(new V3(14, 24, 14), new V3(40, 44, 40), 0.5, grey, false); // lança da tocha
  const fl = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6, 10), new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.85 })); fl.position.set(40, 47, 40); g.add(fl); PLAT.flame = fl;
  // luzes do convés (acendem à noite) e uma luz real que ilumina a água em volta
  PLAT.lights = new THREE.MeshStandardMaterial({ color: 0xfff4d0, emissive: 0xfff0c0, emissiveIntensity: 0 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), PLAT.lights); b.position.set(Math.cos(a) * 15, 14.6 + (k % 3) * 6, Math.sin(a) * 15); g.add(b); }
  PLAT.light = new THREE.PointLight(0xffe0b0, 0, 90, 1.5); PLAT.light.position.set(0, 12, 0); g.add(PLAT.light);
  // a lancha bate nas pernas
  MAR.rects.push({ x0: P0.x - S - 2, x1: P0.x + S + 2, z0: P0.z - S - 2, z1: P0.z + S + 2 });
  // cardumes de isca girando nas pernas
  const sp = spotById('plataforma'); for (let i = 0; i < 4; i++) { const sc = newSchool(sp); sc.c.set(P0.x + rand(-15, 15), rand(-12, -3), P0.z + rand(-15, 15)); SCHOOLS.push(sc); }
}
function updatePlatform(dt, t) {
  if (!PLAT.flame) return;
  const P0 = platP(), near = Math.hypot(camera.position.x - P0.x, camera.position.z - P0.z);
  PLAT.flame.scale.set(1 + 0.15 * Math.sin(t * 13), 1 + 0.25 * Math.sin(t * 9) + 0.1 * Math.sin(t * 23), 1); PLAT.flame.visible = near < 2500;
  const night = clamp((0.5 - DAY.amb) * 3, 0, 1); PLAT.lights.emissiveIntensity = 0.2 + 1.4 * night; PLAT.light.intensity = 2.5 * night * (near < 300 ? 1 : 0);
  if (!PLAT.warned && near < 400 && started) { PLAT.warned = true; toast('Plataforma de Fora: pesca oceânica em água azul, ~85 m de fundo. Atum-rabino, anchova e olho-de-boi rodando as pernas.', 6, 'gold'); toast('Na vida real é proibido navegar a menos de 500 m de plataformas de petróleo (zona de segurança). Esta plataforma é fictícia.', 7); }
  // ronco grave dos geradores perto da plataforma
  if (near < 260 && AU.ctx && AU.ctx.state === 'running' && (PLAT.humT = (PLAT.humT || 0) - dt) <= 0) { PLAT.humT = 1.9; AU.tone(48, 46, 2.0, 0.05 * (1 - near / 260), 'sawtooth'); }
}
