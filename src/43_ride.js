// ================= lancha compartilhada (carona): um pilota, os amigos vão sentados na mesma lancha =================
// o passageiro esconde a própria lancha e acompanha a do piloto pela posição ao vivo; pula na água quando o
// piloto ancora e, ao subir de volta, senta de novo. O piloto vê os passageiros sentados no banco de trás.
const RIDE = { on: false, host: null, hostName: '', seat: 1, lost: 0, pass: {}, last: null };
const SEATS = [new V3(-0.55, 0, -0.95), new V3(0.55, 0, -0.95), new V3(0, 0, -1.85)];
function seatPos(boat, k, out) { const p = boat.userData.pilotPos || new V3(0.15, 0.9, -0.4); return out.copy(p).add(SEATS[((k || 1) - 1) % 3]); }
const hostBoat = () => { const R = ON.remotes[RIDE.host]; return R && R.boat; };
function rideStart(host, name, seat) {
  if (RIDE.on && RIDE.host === host) return;
  RIDE.on = true; RIDE.host = host; RIDE.hostName = name || 'amigo'; RIDE.seat = seat || 1; RIDE.lost = 0; RIDE.last = null;
  if (P.mode === 'swim') climbBoat();
  toast(`🚤 Você está de carona na lancha de ${RIDE.hostName}. Quando ele ancorar, pule na água junto!`, 5, 'gold'); AU.click();
}
function rideStop(why) {
  if (!RIDE.on) return;
  const hb = hostBoat(); RIDE.on = false;
  if (DIVER.root.parent !== scene) scene.add(DIVER.root);
  BOAT.mesh.visible = true; BOAT.speed = 0; if (BOAT.vel) BOAT.vel.set(0, 0, 0);
  // a sua lancha aparece ao lado da do amigo
  if (hb) { const a = hb.rotation.y; BOAT.pos.set(hb.position.x + Math.cos(a) * 7, 0, hb.position.z - Math.sin(a) * 7); BOAT.heading = a; }
  if (P.mode === 'boat') { BOAT.anchored = false; toggleAnchor(); }
  bcast('ride_end', { to: RIDE.host });
  toast(why || 'Você desceu da carona: sua lancha está do lado.', 4);
}
// antes da física do barco: passageiro não pilota
function rideBefore() { if (RIDE.on && P.mode === 'boat') { IN.jx = 0; IN.jy = 0; } }
// depois do mergulhador: lancha (escondida) colada na do piloto, você sentado no banco dela
function rideTick(dt, t) {
  if (!RIDE.on) return;
  const R = ON.remotes[RIDE.host];
  if (!R || !R.boat) { if ((RIDE.lost += dt) > 12) rideStop('O piloto saiu do jogo: você voltou para a sua lancha.'); return; }
  RIDE.lost = 0;
  const prev = RIDE.last || R.bpos.clone(); BOAT.pos.set(R.bpos.x, 0, R.bpos.z); BOAT.heading = R.d.bh; BOAT.speed = 0;
  const an = !!R.d.an; if (an && !BOAT.anchored) { BOAT.anchored = true; BOAT.anchorP = new V3(BOAT.pos.x, H(BOAT.pos.x, BOAT.pos.z), BOAT.pos.z); } else if (!an) BOAT.anchored = false;
  BOAT.mesh.visible = false; BOAT.rope.visible = false; R.boat.visible = true;
  const spd = prev.distanceTo(R.bpos) / Math.max(dt, 1e-3); RIDE.last = R.bpos.clone();
  if (P.mode === 'boat') {
    if (DIVER.root.parent !== R.boat) R.boat.add(DIVER.root);
    seatPos(R.boat, RIDE.seat, DIVER.root.position); DIVER.root.rotation.set(0, Math.PI, 0); DIVER.root.visible = !SV.boatFP; poseDiver(DIVER, 'drive', t);
    AU.setEngine(Math.min(1, spd / 18), !an && spd > 0.4, camUnder);
  } else if (DIVER.root.parent !== scene) scene.add(DIVER.root);
}
// passageiro dos outros: sentado na lancha do piloto (a minha ou a de outro amigo)
function rideRemote(R, d, t) {
  const hb = d.host === ON.s.uid ? BOAT.mesh : (ON.remotes[d.host] && ON.remotes[d.host].boat);
  if (!hb) return false;
  if (R.rig.root.parent !== hb) hb.add(R.rig.root);
  seatPos(hb, d.seat, R.rig.root.position); R.rig.root.rotation.set(0, Math.PI, 0); R.rig.root.visible = true; poseDiver(R.rig, 'drive', t);
  if (R.boat) R.boat.visible = false;
  R.rig.root.getWorldPosition(R.tag.position); R.tag.position.y += 1.05;
  const dd = camera.position.distanceTo(R.tag.position); R.tag.visible = dd < 400; R.tag.scale.set(2.4, 0.6, 1).multiplyScalar(clamp(dd / 18, 0.5, 6));
  return true;
}
// ---------- pedido de carona ----------
function rideAsk(id) { const f = ON.friends.find(x => x.id === id); bcast('ride_req', { to: id }); toast(`Pedido de carona enviado para ${f ? f.name : 'o amigo'}.`, 3); }
function rideMsg(ev, d) {
  if (ev === 'ride_req') {
    const b = $('onInv'); if (!b) return;
    b.innerHTML = `<div class="n">🚤 ${d.name} quer carona na sua lancha!</div><div class="d">Ele vai sentado no banco de trás e pula na água quando você ancorar.</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button class="btn alt" id="invNo">AGORA NÃO</button><button class="btn gold" id="invOk">PODE VIR</button></div>`;
    b.classList.remove('hide'); buzz([60, 40, 60]); AU.coin();
    $('invNo').onclick = () => { b.classList.add('hide'); bcast('ride_no', { to: d.from }); };
    $('invOk').onclick = () => {
      b.classList.add('hide'); const used = Object.values(RIDE.pass); let seat = 1; while (used.includes(seat)) seat++;
      if (seat > 3) { toast('A lancha já está cheia (3 passageiros).', 3, 'bad'); bcast('ride_no', { to: d.from }); return; }
      RIDE.pass[d.from] = seat; bcast('ride_ok', { to: d.from, seat }); toast(`${d.name} subiu na sua lancha!`, 3, 'gold');
    };
    setTimeout(() => b.classList.add('hide'), 40000);
  }
  if (ev === 'ride_ok') { if (P.mode === 'swim' && P.under) { toast('Suba para a superfície para pegar a carona.', 3); } rideStart(d.from, d.name, d.seat); }
  if (ev === 'ride_no') toast(`${d.name} não pode dar carona agora.`, 3);
  if (ev === 'ride_end') { delete RIDE.pass[d.from]; }
}
// ---------- botão SAIR DA CARONA ----------
function setupRide() {
  const a = $('bAnchor'); if (!a) return;
  const b = document.createElement('div'); b.className = 'b'; b.id = 'bRide'; b.innerHTML = 'SAIR DA<br>CARONA'; b.classList.add('hide');
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); rideStop(); }); a.after(b);
}
function rideHUD() {
  const riding = RIDE.on && P.mode === 'boat';
  show('bRide', riding); if (riding) { show('bAnchor', false); show('bMarina', false); }
}
