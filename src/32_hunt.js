// ================= tiro e briga mais realistas =================
// arpão cai com a distância e a correnteza empurra; carretilha para peixe grande;
// peixe ferido sangra e o sangue chama predador; tiro bem colocado (cabeça/espinhaço) apaga na hora

// ---------- balística do arpão ----------
const REEL_PRICE = 1200, REEL_LINE = 25; // metros a mais de linha com a carretilha
const _hc = new V3();
// mesma correnteza do mergulhador, sem os avisos
function curQuiet(p) {
  for (const s of SPOTS) {
    if (!s.cur) continue;
    const k = 1 - smooth(s.r, s.r * 2.6, Math.hypot(p.x - s.x, p.z - s.z));
    if (k > 0) return _hc.set(s.cur[0] * k * COND.cur, 0, s.cur[1] * k * COND.cur);
  }
  return null;
}
function spearDrift(dt) {
  if (GUN.pos.y > 0) { GUN.vel.y -= dt * 9.8; return; } // tiro fora d'água
  // perto, o arpão vai reto; perdendo velocidade no fim do alcance, afunda cada vez mais
  const k = clamp(GUN.trav / Math.max(GUN.range, 1), 0, 1.5);
  GUN.vel.y -= dt * (0.6 + 5 * k * k);
  const c = curQuiet(GUN.pos); if (c) GUN.vel.addScaledVector(c, dt * 1.6);
}
const reelLine = () => SV.reel ? REEL_LINE : 0;

// ---------- sangue ----------
const BLOOD = { pool: [], i: 0, t: 0, srcT: 0, warnT: 0 };
function setupHunt() {
  const tex = canvasTex(64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(120,8,8,.75)'); gr.addColorStop(0.55, 'rgba(95,6,10,.35)'); gr.addColorStop(1, 'rgba(80,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }, false);
  for (let i = 0; i < 60; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, color: 0xb02020 });
    const s = new THREE.Sprite(m); s.visible = false; scene.add(s);
    BLOOD.pool.push({ s, life: 0, max: 1, v: new V3(), r0: 0.2, r1: 1 });
  }
}
function bleed(p, n = 1, k = 1) {
  if (!BLOOD.pool.length || p.y > -0.2) return;
  for (let j = 0; j < n; j++) {
    const q = BLOOD.pool[BLOOD.i++ % BLOOD.pool.length];
    q.s.position.set(p.x + rand(-0.1, 0.1), p.y + rand(-0.1, 0.1), p.z + rand(-0.1, 0.1));
    q.v.set(rand(-0.08, 0.08), rand(0.02, 0.1), rand(-0.08, 0.08));
    const c = curQuiet(p); if (c) q.v.addScaledVector(c, 0.5); // a nuvem vai com a correnteza
    q.life = q.max = rand(3, 6) * k; q.r0 = rand(0.15, 0.3) * k; q.r1 = rand(0.9, 1.8) * k; q.s.visible = true;
  }
}
function updateBlood(dt) {
  for (const q of BLOOD.pool) {
    if (q.life <= 0) continue;
    q.life -= dt; if (q.life <= 0) { q.s.visible = false; continue; }
    const a = 1 - q.life / q.max; q.s.position.addScaledVector(q.v, dt);
    q.s.scale.setScalar(lerp(q.r0, q.r1, Math.sqrt(a))); q.s.material.opacity = 0.55 * Math.min(1, a * 6) * (1 - a);
  }
}

// ---------- predadores sentem o sangue ----------
let PRED = null;
const predKeys = () => PRED || (PRED = Object.keys(SPECIES).filter(k => spInRegion(k) && (SPECIES[k].shape === 'shark' || ['bicuda', 'barracuda', 'xareu', 'olhodeboi', 'cavala'].includes(k))));
const isShark = f => f.sp.shape === 'shark';
function bloodSources() {
  const out = [];
  const g = GUN.fish; if (g && g.alive && GUN.state === 'hooked' && GUN.q !== 'head' && GUN.q !== 'spine') out.push({ pos: g.pos, k: 1, fish: g });
  for (const f of FISHES) if (f.bleed > 0 && f.alive && f !== g && f.state !== 'hooked') out.push({ pos: f.pos, k: 0.7, fish: f });
  if (P.mode === 'swim' && P.under && P.bleedT > T && P.stringer.length) out.push({ pos: P.pos, k: 0.5, fish: null });
  return out;
}
function huntPredators(srcs) {
  const keys = predKeys(); if (!keys.length || !srcs.length) return;
  for (const f of FISHES) {
    if (!keys.includes(f.key) || !f.alive || f.state === 'hooked' || f.state === 'dead' || f.circ || f.pcool > T) continue;
    let best = null, bd = 1e9;
    for (const s of srcs) { const d = f.pos.distanceTo(s.pos); if (d < 45 * s.k && d < bd) { bd = d; best = s; } }
    if (!best) { f.chase = 0; continue; }
    f.chase = (f.chase || 0) + 0.5;
    if (f.chase > 25) { f.chase = 0; f.pcool = T + 60; continue; } // desiste
    const a = T * 0.8 + f.ph;
    f.state = 'flee'; f.t = 1; f.speed = f.sp.cruise * (bd > 8 ? 2.6 : 1.4);
    f.target.set(best.pos.x + Math.cos(a) * 2.5, best.pos.y + 0.3, best.pos.z + Math.sin(a) * 2.5);
    if (bd < 25 && BLOOD.warnT < T && P.mode === 'swim') {
      BLOOD.warnT = T + 25;
      toast(isShark(f) ? `${f.sp.name} sentiu o sangue e está vindo! Tire o peixe da água rápido.` : `Uma ${f.sp.name.toLowerCase()} sentiu o sangue e veio ver. Chance de tiro!`, 4, isShark(f) ? 'bad' : '');
      if (isShark(f)) buzz([80, 50, 80]);
    }
    // tubarão chegando no peixe ferido: leva (do arpão, inclusive)
    if (isShark(f) && best.fish && bd < 1.6) {
      const v = best.fish; bleed(v.pos, 8, 1.6); spawnScales(v.pos, 30); FX.shake = 0.8; AU.thud();
      if (v === GUN.fish) { GUN.fish = null; GUN.state = 'spent'; toast(`O ${f.sp.name.toLowerCase()} arrancou o ${v.sp.name.toLowerCase()} do arpão!`, 5, 'bad'); buzz([200, 80, 200]); }
      else if (v.vis && camera.position.distanceTo(v.pos) < 25) toast(`O tubarão pegou o ${v.sp.name.toLowerCase()} ferido.`, 3, 'bad');
      v.remove(); f.pcool = T + 90; f.chase = 0; f.state = 'flee'; f.t = 4; f.target.copy(f.pos).add(_t1.set(rand(-30, 30), -3, rand(-30, 30)));
    }
  }
}
function updateHunt(dt) {
  updateBlood(dt);
  // emissores: peixe no arpão, peixe ferido que escapou e fieira com peixe fresco
  if ((BLOOD.t -= dt) <= 0) {
    BLOOD.t = 0.18;
    const g = GUN.fish; if (g && g.alive && GUN.state === 'hooked' && camera.position.distanceToSquared(g.pos) < 1600) bleed(g.pos, 1, 0.6 + Math.min(0.8, g.kg / 20));
    for (const f of FISHES) if (f.bleed > 0 && f.alive && f.vis && Math.random() < 0.4 && camera.position.distanceToSquared(f.pos) < 1600) bleed(f.pos, 1, 0.6);
    if (P.mode === 'swim' && P.under && P.bleedT > T && P.stringer.length && Math.random() < 0.25) bleed(_t1.copy(P.pos).add(_t2.set(0, -0.5, 0)), 1, 0.5);
  }
  for (const f of FISHES) if (f.bleed > 0) f.bleed -= dt;
  if ((BLOOD.srcT -= dt) <= 0) { BLOOD.srcT = 0.5; if (!AMZ) huntPredators(bloodSources()); } // no rio, quem sente o sangue são as piranhas
}
// ganchos chamados pelo tiro e pela captura
function huntHit(f) {
  if (GUN.q === 'head' || GUN.q === 'spine') return;
  f.bleed = GUN.q === 'tail' ? 70 : 50; bleed(f.pos, 4, 0.8);
  if (f.kg > 12 && !SV.reel && !SV.reelTip) { SV.reelTip = true; toast('Peixe grande! Com uma carretilha no arbalete (Loja › Extras) dá para dar linha sem ser arrastado.', 6); }
}
function huntCatch(f) { if (!f.sp.ornamental) P.bleedT = T + 60; }
function huntTear(f) { f.bleed = 45; bleed(f.pos, 5, 0.9); }
