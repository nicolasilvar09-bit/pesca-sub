// ================= dupla de mergulho: um sobe, o outro desce =================
const BUDDY_PRICE = 150;
const BUDDY = { rig: null, pos: new V3(), yaw: 0, kick: 0, state: 'surf', t: 0, a: 0, tipDay: 0 };
const hasBuddy = () => SV.buddyDay === (SV.day || 1);
function hireBuddy() {
  if (hasBuddy() || SV.money < BUDDY_PRICE) return;
  SV.money -= BUDDY_PRICE; SV.buddyDay = SV.day || 1; AU.coin(); save();
  toast('Dupla contratada para hoje: ela fica na superfície de olho em você.', 4, 'gold');
}
function updateBuddy(dt, t) {
  const on = hasBuddy() && P.mode === 'swim' && !COMP.on;
  if (!BUDDY.rig) {
    if (!on) return;
    const r = buildDiver(false); r.suitMat.map = null; r.suitMat.color.set(0x24364e); r.suitMat.needsUpdate = true; BUDDY.rig = r;
    BUDDY.pos.set(P.pos.x + 3, 0, P.pos.z + 2);
  }
  BUDDY.rig.root.visible = on; if (!on) return;
  // vigia na superfície a ~3,5 m; com o mergulhador descansando muito tempo, faz o seu mergulho
  BUDDY.a += dt * 0.12; BUDDY.t -= dt;
  const surf = waveH(BUDDY.pos.x, BUDDY.pos.z, t) - 0.15, tg = _t1.set(P.pos.x + Math.cos(BUDDY.a) * 3.5, surf, P.pos.z + Math.sin(BUDDY.a) * 3.5);
  if (BUDDY.state === 'surf' && !P.under && P.surfT > 25 && BUDDY.t <= 0) { BUDDY.state = 'dive'; BUDDY.t = rand(18, 26); }
  if (BUDDY.state === 'dive') {
    tg.y = Math.max(H(BUDDY.pos.x, BUDDY.pos.z) + 1.5, -12);
    if (P.under) { BUDDY.state = 'up'; toast('Dupla: espera eu subir! Um sobe, o outro desce.', 3); }
    else if (BUDDY.t <= 0) BUDDY.state = 'up';
  }
  if (BUDDY.state === 'up' && BUDDY.pos.y > surf - 0.3) { BUDDY.state = 'surf'; BUDDY.t = 30; }
  const d = _t2.subVectors(tg, BUDDY.pos), dist = d.length(), sp = BUDDY.state === 'surf' ? Math.min(1.4, dist * 0.6) : 0.9;
  if (dist > 0.05) BUDDY.pos.addScaledVector(d, Math.min(1, sp * dt / dist));
  if (BUDDY.state === 'surf') BUDDY.pos.y = surf;
  const mv = clamp(sp / 1.4, 0, 1), under = BUDDY.state !== 'surf';
  const ty = dist > 0.6 ? Math.atan2(-d.x, -d.z) : Math.atan2(-(P.pos.x - BUDDY.pos.x), -(P.pos.z - BUDDY.pos.z));
  BUDDY.yaw += angDiff(BUDDY.yaw, ty) * clamp(dt * 2, 0, 1); BUDDY.kick += dt * (1.5 + mv * 4);
  placeRig(BUDDY.rig, BUDDY.pos, BUDDY.yaw, BUDDY.state === 'dive' ? -0.9 : BUDDY.state === 'up' ? 1.0 : 0, under, mv, BUDDY.kick);
}
// dica de intervalo de superfície ao descer cedo demais
function buddyDiveTip() {
  if (P.lastDiveT > 15 && P.surfT < P.lastDiveT * 1.5) toast(`${hasBuddy() ? 'Dupla' : 'Cuidado'}: descansa mais! Fique na superfície pelo menos o dobro do tempo do mergulho (${Math.round(P.lastDiveT * 2)} s).`, 4, 'bad');
  if (!hasBuddy() && BUDDY.tipDay !== SV.day) { BUDDY.tipDay = SV.day; toast(`Mergulhando sem dupla. Contrate uma na loja (${fmtR(BUDDY_PRICE)}/dia): ela te resgata num apagão.`, 4); }
}
