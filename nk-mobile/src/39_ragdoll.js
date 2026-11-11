// ================= ragdoll: quem morre cai de verdade (física), empurrado na direção do tiro =================
// o corpo vira 16 pontos ligados por "varetas" (cabeça, pescoço, ombros, cotovelos, mãos, quadril, joelhos, pés) que caem com a gravidade,
// batem no chão e escorregam; os ossos do personagem seguem os pontos. Só nos 4 mais perto (até 60 m); os outros usam a animação de queda.
const RAG = { J: { pel: 'Bip01_Pelvis', neck: 'Bip01_Neck', head: 'Bip01_Head', lsh: 'Bip01_L_UpperArm', lel: 'Bip01_L_Forearm', lha: 'Bip01_L_Hand', rsh: 'Bip01_R_UpperArm', rel: 'Bip01_R_Forearm', rha: 'Bip01_R_Hand',
  lhip: 'Bip01_L_Thigh', lkn: 'Bip01_L_Calf', lft: 'Bip01_L_Foot', rhip: 'Bip01_R_Thigh', rkn: 'Bip01_R_Calf', rft: 'Bip01_R_Foot' },
  E: [['pel', 'neck'], ['neck', 'head'], ['head', 'htop'], ['neck', 'lsh'], ['neck', 'rsh'], ['lsh', 'lel'], ['lel', 'lha'], ['rsh', 'rel'], ['rel', 'rha'], ['pel', 'lhip'], ['pel', 'rhip'], ['lhip', 'lkn'], ['lkn', 'lft'], ['rhip', 'rkn'], ['rkn', 'rft'],
    ['lsh', 'rsh'], ['lhip', 'rhip'], ['lsh', 'pel'], ['rsh', 'pel'], ['lhip', 'neck'], ['rhip', 'neck'], ['lsh', 'lhip'], ['rsh', 'rhip'], ['htop', 'lsh'], ['htop', 'rsh'], ['head', 'pel']],
  // osso, ponto de origem, ponto para onde aponta
  D: [['Bip01_L_UpperArm', 'lsh', 'lel'], ['Bip01_L_Forearm', 'lel', 'lha'], ['Bip01_R_UpperArm', 'rsh', 'rel'], ['Bip01_R_Forearm', 'rel', 'rha'],
    ['Bip01_L_Thigh', 'lhip', 'lkn'], ['Bip01_L_Calf', 'lkn', 'lft'], ['Bip01_R_Thigh', 'rhip', 'rkn'], ['Bip01_R_Calf', 'rkn', 'rft'], ['Bip01_Neck', 'neck', 'head'], ['Bip01_Head', 'head', 'htop']] };
const _rv1 = new T.Vector3(), _rv2 = new T.Vector3(), _rq1 = new T.Quaternion(), _rq2 = new T.Quaternion(), _rq3 = new T.Quaternion();
function ragStart(c, a, src) {
  const m = c.m; m.g.updateMatrixWorld(true);
  const B = n => m.root.getObjectByName(n), P = {};
  for (const k in RAG.J) { const b = B(RAG.J[k]); if (!b) return false; P[k] = b.getWorldPosition(new T.Vector3()); }
  P.htop = P.head.clone().add(P.head.clone().sub(P.neck).normalize().multiplyScalar(0.2));
  const pts = {}, dt = 1 / 60;
  let ix = 0, iz = 0; if (src && src !== a) { ix = a.x - src.x; iz = a.z - src.z; const l = Math.hypot(ix, iz) || 1; ix /= l; iz /= l; }
  const push = { head: 3.2, htop: 3.4, neck: 2.6, lsh: 2.2, rsh: 2.2, pel: 1.0 };
  for (const k in P) { const p = P[k], f = push[k] || 0.5, vx = (a.vx || 0) * 0.8 + ix * f, vz = (a.vz || 0) * 0.8 + iz * f, vy = 0.4 + Math.random() * 0.3;
    pts[k] = { x: p.x, y: p.y, z: p.z, px: p.x - vx * dt, py: p.y - vy * dt, pz: p.z - vz * dt }; }
  const edges = RAG.E.map(([u, v]) => [pts[u], pts[v], P[u].distanceTo(P[v])]);
  // direção de cada osso (no espaço do próprio osso) até o ponto filho
  const drive = [];
  const pel = B('Bip01_Pelvis'); pel.getWorldQuaternion(_rq1).invert();
  const pAx = P.neck.clone().sub(P.pel).normalize().applyQuaternion(_rq1), pTw = P.rhip.clone().sub(P.lhip).normalize().applyQuaternion(_rq1);
  for (const [bn, u, v] of RAG.D) { const b = B(bn); b.getWorldQuaternion(_rq2).invert(); drive.push({ b, u: pts[u], v: pts[v], ax: P[v].clone().sub(P[u]).normalize().applyQuaternion(_rq2) }); }
  const inside = !!bldAt(a.x, a.z);
  c.rag = { pts, edges, drive, pel, pAx, pTw, t: 0, floor: inside ? a.y : null }; c.anim = false; c.prone = true;
  if (m.one && m.one.death) m.one.death.stop();
  return true;
}
function ragFloor(r, x, z) { return r.floor != null ? r.floor : groundH(x, z); }
function ragSim(r, dt) {
  const g = 9.8 * dt * dt, P = Object.values(r.pts);
  for (const p of P) { const vx = (p.x - p.px) * 0.995, vy = (p.y - p.py) * 0.995, vz = (p.z - p.pz) * 0.995; p.px = p.x; p.py = p.y; p.pz = p.z; p.x += vx; p.y += vy - g; p.z += vz; }
  for (let it = 0; it < 8; it++) {
    for (const [a, b, L] of r.edges) { const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6, k = (d - L) / d * 0.5; a.x += dx * k; a.y += dy * k; a.z += dz * k; b.x -= dx * k; b.y -= dy * k; b.z -= dz * k; }
    for (const p of P) { const fl = ragFloor(r, p.x, p.z) + 0.07; if (p.y < fl) { p.y = fl; p.px = p.x - (p.x - p.px) * 0.6; p.pz = p.z - (p.z - p.pz) * 0.6; } }
  }
}
function ragPose(r) {
  const v3 = (p, o) => o.set(p.x, p.y, p.z);
  // quadril: posição no ponto e virado para o pescoço, girado pelo eixo das coxas
  const pel = r.pel, par = pel.parent; par.updateMatrixWorld(true);
  pel.position.copy(par.worldToLocal(v3(r.pts.pel, _rv1)));
  pel.updateMatrixWorld(true); pel.getWorldQuaternion(_rq1);
  const want = v3(r.pts.neck, _rv1).sub(v3(r.pts.pel, _rv2)).normalize(), cur = r.pAx.clone().applyQuaternion(_rq1);
  _rq2.setFromUnitVectors(cur, want); _rq1.premultiply(_rq2);
  const tw = r.pTw.clone().applyQuaternion(_rq1), tWant = v3(r.pts.rhip, new T.Vector3()).sub(v3(r.pts.lhip, _rv2));
  tw.addScaledVector(want, -tw.dot(want)).normalize(); tWant.addScaledVector(want, -tWant.dot(want)).normalize();
  if (tw.lengthSq() > 0.5 && tWant.lengthSq() > 0.5) { _rq2.setFromUnitVectors(tw, tWant); _rq1.premultiply(_rq2); }
  par.getWorldQuaternion(_rq3).invert(); pel.quaternion.copy(_rq3.multiply(_rq1)); pel.updateMatrixWorld(true);
  // membros: cada osso aponta para o ponto filho
  for (const d of r.drive) {
    const b = d.b; b.parent.updateMatrixWorld(true); b.updateMatrixWorld(true); b.getWorldQuaternion(_rq1);
    const cur2 = d.ax.clone().applyQuaternion(_rq1), want2 = v3(d.v, _rv1).sub(v3(d.u, _rv2)); if (want2.lengthSq() < 1e-8) continue;
    _rq2.setFromUnitVectors(cur2, want2.normalize()); _rq1.premultiply(_rq2);
    b.parent.getWorldQuaternion(_rq3).invert(); b.quaternion.copy(_rq3.multiply(_rq1)); b.updateMatrixWorld(true);
  }
}
(function hookRagdoll() {
  const tc = toCorpse;
  toCorpse = function (a) {
    const m = a.model, src = a.lastHitBy, veh = a.veh; tc.apply(this, arguments);
    const c = G.corpses[G.corpses.length - 1]; if (!c || c.m !== m || veh || !m.human) return;
    const near = Math.hypot(a.x - camera.position.x, a.z - camera.position.z) < 60, busy = G.corpses.filter(q => q.rag && q.rag.t < 3.5).length;
    if (near && busy < 4) { try { ragStart(c, a, src); } catch (e) { c.rag = null; } }
  };
  const sc = stepCorpses;
  stepCorpses = function (dt) {
    for (const c of G.corpses) if (c.rag && c.rag.t < 3.5) { const r = c.rag; r.t += dt; const h = Math.min(dt, 1 / 30) / 2; ragSim(r, h); ragSim(r, h); if (c.m.g.visible) ragPose(r); }
    return sc.apply(this, arguments);
  };
})();
