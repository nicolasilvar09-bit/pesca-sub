// ================= avisos de som na tela: marcas em volta da mira mostram de onde vêm tiros, passos e carros de inimigos =================
// tiro inimigo (laranja) até 250 m (com silenciador só até 50 m), passos (branco) até 30 m (agachado 12 m, deitado nada), motor de carro (azul) até 120 m.
// a marca fica mais forte quanto mais perto; aliados não aparecem. Configurações > "Avisos de som na tela" liga/desliga.
if (SET.soundViz == null) SET.soundViz = true;
const SVZ = { m: new Map(), el: null, acc: 0 };
const SVZ_ICON = {
  shot: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1c2 2 3 4 3 7v6H5V8c0-3 1-5 3-7z" fill="#ff9a3c"/></svg>',
  step: '<svg width="16" height="16" viewBox="0 0 16 16"><ellipse cx="5" cy="9" rx="2.3" ry="3.6" fill="#fff"/><ellipse cx="11" cy="6" rx="2.3" ry="3.6" fill="#fff"/></svg>',
  car: '<svg width="18" height="16" viewBox="0 0 18 16"><path d="M2 10l2-5h10l2 5v3H2z" fill="#6cc4ff"/><circle cx="5" cy="13" r="2" fill="#6cc4ff"/><circle cx="13" cy="13" r="2" fill="#6cc4ff"/></svg>'
};
const SVZ_COL = { shot: '#ff9a3c', step: '#ffffff', car: '#6cc4ff' };
function svzRoot() {
  if (SVZ.el && SVZ.el.isConnected) return SVZ.el;
  const h = $('hud'); if (!h) return null;
  const el = document.createElement('div'); el.id = 'sndRing'; h.appendChild(el); return SVZ.el = el;
}
function svzEnemy(a) { const p = G.player; return a && p && a !== p && a.alive && a.team !== p.team; }
// registra/renova uma marca (uma por inimigo e tipo; tiro ganha de passo)
function svzPing(a, kind, strength, life) {
  if (!SET.soundViz || G.phase !== 'match' || !G.player || !G.player.alive || G.watch) return;
  const key = a.id + kind; let m = SVZ.m.get(key);
  if (!m) { m = { a, kind, t: 0, s: 0, el: null }; SVZ.m.set(key, m); }
  m.t = Math.max(m.t, life); m.s = Math.max(m.s * 0.6, strength); m.x = a.x; m.z = a.z;
}
function svzStep(dt) {
  const root = svzRoot(); if (!root) return;
  const on = SET.soundViz && G.phase === 'match' && G.player && G.player.alive && !G.watch;
  root.style.display = on ? '' : 'none';
  if (!on) { for (const m of SVZ.m.values()) if (m.el) m.el.remove(); SVZ.m.clear(); return; }
  const p = G.player;
  // passos e motores: varre os inimigos 4x por segundo
  if ((SVZ.acc += dt) > 0.25) { SVZ.acc = 0;
    for (const a of G.actors) {
      if (!svzEnemy(a)) continue; const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (a.veh) { const v = a.veh; if (d < 120 && Math.hypot(v.vx || 0, v.vz || 0) + Math.abs(v.sp || 0) > 1) svzPing(a, 'car', 1 - d / 120, 0.6); continue; }
      if (a.mode !== 'ground' || !a.onGround || a.stance === 'prone') continue;
      const sp = Math.hypot(a.vx || 0, a.vz || 0), rng = a.stance === 'crouch' ? 12 : sp > 5.6 ? 36 : 30;
      if (sp > 0.9 && d < rng) svzPing(a, 'step', 1 - d / rng, 0.55);
    }
  }
  const yaw = G.view ? G.view.yaw : camera.rotation.y, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const R = Math.min(innerWidth, innerHeight) * 0.24;
  for (const [k, m] of SVZ.m) {
    m.t -= dt;
    if (m.t <= 0 || !m.a.alive) { if (m.el) m.el.remove(); SVZ.m.delete(k); continue; }
    if (m.kind !== 'shot') { m.x = m.a.x; m.z = m.a.z; } // tiro fica onde foi ouvido
    const dx = m.x - p.x, dz = m.z - p.z, th = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
    if (!m.el) { m.el = document.createElement('div'); m.el.className = 'sv sv-' + m.kind; m.el.innerHTML = `<svg class="arc" width="44" height="14" viewBox="0 0 44 14"><path d="M3 12 Q22 -2 41 12" stroke="${SVZ_COL[m.kind]}" stroke-width="5" fill="none" stroke-linecap="round"/></svg><div class="ic">${SVZ_ICON[m.kind]}</div>`; root.appendChild(m.el); }
    const r = R + (m.kind === 'shot' ? 0 : m.kind === 'car' ? 16 : 8);
    m.el.style.transform = `translate(${Math.sin(th) * r}px,${-Math.cos(th) * r}px) rotate(${th}rad)`;
    m.el.style.opacity = (0.35 + 0.65 * Math.min(1, m.s)) * Math.min(1, m.t / 0.35);
  }
}
(function hookSvz() {
  const sh = shotSound;
  shotSound = function (a, d, quiet) {
    const r = sh.apply(this, arguments);
    if (svzEnemy(a)) { const dd = Math.hypot(a.x - G.player.x, a.z - G.player.z), rng = quiet ? 50 : 250; if (dd < rng) svzPing(a, 'shot', 1 - dd / rng * 0.8, 1.6); }
    return r;
  };
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q); svzStep(dt); return o; };
  const om = openMenu; openMenu = function (...q) { const r = om.apply(this, q);
    const box = document.querySelector('#menuP .box'), ref = $('sQ') && $('sQ').closest('label');
    if (box && ref && !$('sSvz')) { const l = document.createElement('label'); l.innerHTML = 'Avisos de som na tela (tiros e passos) <input type="checkbox" id="sSvz">'; ref.after(l); $('sSvz').checked = !!SET.soundViz; $('sSvz').onchange = e => { SET.soundViz = e.target.checked; saveSet(); }; }
    return r; };
})();
