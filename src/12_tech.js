// ================= técnicas: agachon, chamar o peixe, moreias nas tocas =================

// ---------- agachon: parado no fundo, colado numa pedra ----------
function updateHide(dt) {
  const was = P.hide;
  P.hide = false;
  if (P.mode === 'swim' && P.under && P.still > 1 && P.pos.y - H(P.pos.x, P.pos.z) < 1.1) {
    for (const R of rocksNear(P.pos.x, P.pos.z)) if (Math.hypot(P.pos.x - R.x, P.pos.z - R.z) < R.r + 1.3) { P.hide = true; break; }
  }
  if (P.hide && !was && !SV.tipHide) { SV.tipHide = true; toast('Agachon: escondido atrás da pedra, os peixes chegam bem mais perto.', 4); }
  $('hideTag').classList.toggle('hide', !P.hide);
}

// ---------- chamar: raspar a pedra atrai os curiosos e espanta os desconfiados ----------
let callCD = 0;
function callFish() {
  if (P.mode !== 'swim' || !P.under || callCD > 0) return;
  callCD = 6; P.noise = Math.max(P.noise, 0.5); AU.scrape(); buzz(25);
  let n = 0;
  for (const f of FISHES) {
    if (!f.alive || !f.vis || f.state === 'hooked' || f.state === 'dead' || f.state === 'flee') continue;
    const d = f.pos.distanceTo(P.pos);
    if (f.sp.curious > 0.45 && d < 24 && !f.leader) { f.state = 'curious'; f.t = rand(7, 11); n++; }
    else if (f.sp.shy > 0.75 && d < 10) f.startFlee();
  }
  toast(n ? 'Raspou a pedra: tem peixe vindo ver o barulho.' : 'Raspou a pedra… nada curioso por perto.', 2.5);
}

// ---------- moreias: cabeça para fora da toca, boca abrindo (é como respiram), bote se chegar perto ----------
const MOR = { holes: [], rigs: [], t: 0 };
function moreiaTex() {
  return canvasTex(128, 64, g => {
    g.fillStyle = '#c8b878'; g.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${50 + rand(0, 30) | 0},${38 + rand(0, 20) | 0},20,${rand(0.55, 0.9)})`; g.beginPath(); g.arc(rand(0, 128), rand(0, 64), rand(1.5, 4), 0, TAU); g.fill(); }
  });
}
function buildMoreias() {
  for (const h of HOLES) if (Math.random() < 0.28 && !/naufragio|cargueiro/.test(h.spot || '') || Math.random() < 0.5 && /naufragio|cargueiro/.test(h.spot || '')) MOR.holes.push({ h, out: 0, bite: 0, ph: rand(0, TAU), seen: false });
  const skin = uwify(new THREE.MeshStandardMaterial({ map: moreiaTex(), roughness: 0.55 }), { key: 'mo' });
  const mouth = uwify(new THREE.MeshStandardMaterial({ color: 0x5a2a2a, roughness: 0.8 }), { key: 'mm' });
  const eye = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.2 });
  for (let k = 0; k < 5; k++) {
    const g = new THREE.Group(), segs = [];
    for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.065 - i * 0.002, 10, 8), skin); s.scale.set(1, 1.15, 1.6); g.add(s); segs.push(s); }
    const head = new THREE.Group(); g.add(head);
    const up = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), skin); up.scale.set(0.85, 0.8, 1.9); up.position.set(0, 0.012, 0.07); head.add(up);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.015, 0.0); head.add(jaw);
    const lo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 6), skin); lo.scale.set(0.8, 0.5, 1.9); lo.position.set(0, -0.012, 0.075); jaw.add(lo);
    const inside = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mouth); inside.scale.set(0.7, 0.4, 1.6); inside.position.set(0, -0.004, 0.08); head.add(inside);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 4), eye); e.position.set(sx * 0.038, 0.035, 0.1); head.add(e); }
    segs.forEach(s => s.scale.multiplyScalar(1.35)); head.scale.setScalar(1.35);
    g.visible = false; scene.add(g); MOR.rigs.push({ g, segs, head, jaw, m: null });
  }
}
function updateMoreias(dt, t) {
  if (!MOR.rigs.length) return;
  // as 5 tocas habitadas mais próximas recebem um rig
  const p = camera.position, near = [];
  if ((MOR.t -= dt) <= 0) {
    MOR.t = 0.5;
    for (const m of MOR.holes) { const d = (m.h.x - p.x) ** 2 + (m.h.z - p.z) ** 2; if (d < 30 * 30) near.push([d, m]); }
    near.sort((a, b) => a[0] - b[0]);
    const want = near.slice(0, MOR.rigs.length).map(x => x[1]);
    for (const r of MOR.rigs) if (r.m && !want.includes(r.m)) { r.m = null; r.g.visible = false; }
    for (const m of want) if (!MOR.rigs.some(r => r.m === m)) { const r = MOR.rigs.find(r => !r.m); if (r) { r.m = m; r.g.visible = true; } }
  }
  for (const r of MOR.rigs) {
    const m = r.m; if (!m) continue;
    const h = m.h, dx = Math.cos(h.dir), dz = Math.sin(h.dir);
    const dP = Math.hypot(P.pos.x - h.x, P.pos.y - h.y, P.pos.z - h.z);
    // sai mais à noite e com o mergulhador parado; recolhe se ele chega rápido
    const want = (P.mode === 'swim' && dP < 2.2 && P.vel.length() > 0.8) ? 0.1 : 0.45 + 0.25 * (1 - DAY.amb) + (P.still > 2 ? 0.15 : 0);
    m.out = lerp(m.out, m.bite > 0 ? 0.85 : want, clamp(dt * (m.bite > 0 ? 8 : 1.2), 0, 1));
    m.bite = Math.max(0, m.bite - dt);
    if (P.mode === 'swim' && P.under && dP < 0.95 && m.bite <= 0 && !m.cool) {
      m.bite = 0.35; m.cool = true; P.o2 = Math.max(0, P.o2 - 0.08); AU.thud(); buzz([60, 30, 60]); FX.shake = 0.8;
      toast('A moreia deu o bote! Nunca enfie a mão na toca sem olhar.', 3.5, 'bad');
      setTimeout(() => { m.cool = false; }, 6000);
    }
    if (!m.seen && P.under && dP < 6) { m.seen = true; if (!SV.tipMor) { SV.tipMor = true; toast('Moreia na toca. Olhe de longe: ela só morde se você chegar perto demais.', 4); } }
    // corpo: segmentos saindo da toca em S
    const L = m.out * 1.05, sway = Math.sin(t * 1.3 + m.ph) * 0.06;
    r.segs.forEach((s, i) => {
      const u = i / (r.segs.length - 1), d = L * u - 0.25, lat = Math.sin(u * 4 + t * 1.6 + m.ph) * 0.03 * u + sway * u * u;
      s.position.set(h.x + dx * d - dz * lat, h.y + 0.05 * u + Math.sin(u * 3 + t) * 0.01, h.z + dz * d + dx * lat);
    });
    const tip = r.segs[r.segs.length - 1].position;
    r.head.position.copy(tip); r.head.rotation.set(-0.15 + Math.sin(t * 0.8 + m.ph) * 0.1, Math.atan2(dx, dz) + sway * 2, 0);
    r.jaw.rotation.x = m.bite > 0 ? 0.6 : 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.2 + m.ph));
  }
}
// moreia como alvo de foto
function moreiaTargets(test) { for (const r of MOR.rigs) if (r.m && r.m.out > 0.3) test(r.head.position, 0.18, { moreia: true, key: 'moreia', pos: r.head.position }); }
