// ================= telas no console da lancha: sonar à esquerda, GPS (carta náutica) à direita =================
// saem da tela do celular e ficam no painel do barco, como num barco de verdade; acendem no escuro
const CON = { boat: null, mapCv: null, mapT: 0, sonarTex: null, mapTex: null, off: null };
function consoleTex(cv) { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; }
function addConsoleScreens(g) {
  CON.boat = g; if (!g || !g.userData.pilotPos) return;
  const p = g.userData.pilotPos, eye = g.userData.eye || new V3(p.x, p.y + 0.8, p.z + 0.12);
  if (!CON.mapCv) { CON.mapCv = document.createElement('canvas'); CON.mapCv.width = 256; CON.mapCv.height = 168; CON.mapTex = consoleTex(CON.mapCv); }
  if (!CON.off) { CON.off = document.createElement('canvas'); CON.off.width = 150; CON.off.height = 96; const o = CON.off.getContext('2d'); o.fillStyle = '#021018'; o.fillRect(0, 0, 150, 96); o.fillStyle = '#4a7a8a'; o.font = 'bold 12px system-ui'; o.textAlign = 'center'; o.fillText('SONAR', 75, 40); o.font = '10px system-ui'; o.fillText('não instalado (LOJA › Extras)', 75, 60); }
  g.updateMatrixWorld(true);
  const mk = (tex, dx) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.165), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    // no painel à frente do piloto, inclinada para os olhos dele
    m.position.set(p.x + dx, eye.y - 0.3, p.z + 0.66); g.add(m); m.updateMatrixWorld(); m.lookAt(g.localToWorld(eye.clone()));
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.275, 0.19), new THREE.MeshStandardMaterial({ color: 0x111417, roughness: 0.5 })); fr.position.z = -0.004; m.add(fr);
    return m;
  };
  g.userData.scr = [mk(null, 0.16), mk(CON.mapTex, -0.16)]; // de frente para a proa, +x fica à esquerda
}
function drawConsoleMap() {
  if (!mapDrawn) drawMap();
  const src = $('mapCv'), g = CON.mapCv.getContext('2d'), W = 256, Hh = 168, b = P.mode === 'boat' ? BOAT.pos : P.pos;
  const pxm = src.width / (WB.x1 - WB.x0), span = 520, sx = (b.x - WB.x0) * pxm - span * pxm / 2, sz = (b.z - WB.z0) * pxm - span * pxm * Hh / W / 2;
  g.fillStyle = '#06222e'; g.fillRect(0, 0, W, Hh);
  g.drawImage(src, sx, sz, span * pxm, span * pxm * Hh / W, 0, 0, W, Hh);
  const toS = (x, z) => [(x - b.x) / span * W + W / 2, (z - b.z) / span * W + Hh / 2];
  // pontos de pesca e destino
  const d = spotById(SV.dest) || (typeof wpById === 'function' ? wpById(SV.dest) : null);
  if (d) { const [x, y] = toS(d.x, d.z); g.strokeStyle = '#ffb020'; g.setLineDash([4, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(W / 2, Hh / 2); g.lineTo(x, y); g.stroke(); g.setLineDash([]); }
  for (const s of SPOTS) { if (!s.r) continue; const [x, y] = toS(s.x, s.z); if (x < -10 || y < -10 || x > W + 10 || y > Hh + 10) continue; g.fillStyle = s === d ? '#ffb020' : '#2fd0c0'; g.beginPath(); g.arc(x, y, s === d ? 4 : 3, 0, TAU); g.fill(); }
  // lancha no centro, apontando para o rumo
  g.save(); g.translate(W / 2, Hh / 2); g.rotate(Math.PI - BOAT.heading); g.fillStyle = '#ff4a3a'; g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore();
  // barra de dados
  g.fillStyle = 'rgba(2,12,18,.85)'; g.fillRect(0, 0, W, 18); g.fillStyle = '#9ff'; g.font = 'bold 11px system-ui';
  const kn = Math.abs(BOAT.speed) * 1.944, dist = d ? Math.hypot(d.x - b.x, d.z - b.z) : 0;
  g.fillText(`GPS  ${kn.toFixed(0)} nós`, 6, 13); if (d) { g.textAlign = 'right'; g.fillText(`${(d.name || '').slice(0, 18)} · ${dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(1).replace('.', ',') + ' km'}`, W - 6, 13); g.textAlign = 'left'; }
  CON.mapTex.needsUpdate = true;
}
function updateConsole(dt) {
  if (BOAT.mesh !== CON.boat) addConsoleScreens(BOAT.mesh);
  const scr = BOAT.mesh && BOAT.mesh.userData.scr; if (!scr) return;
  const near = P.mode === 'boat' || camera.position.distanceTo(BOAT.pos) < 25;
  scr.forEach(m => m.visible = near && !camUnder);
  if (!near) return;
  // sonar: o mesmo desenho de antes, agora numa tela do barco
  const sm = scr[0].material, want = SV.sonar && SON.cv ? SON.cv : CON.off;
  if (!sm.map || sm.map.image !== want) { sm.map = consoleTex(want); sm.needsUpdate = true; }
  if (SV.sonar) sm.map.needsUpdate = true;
  if ((CON.mapT -= dt) <= 0) { CON.mapT = 0.25; drawConsoleMap(); }
}
// ---------- painel da esquerda enxuto: no barco só o nível e a história; na água, os dados do mergulho ----------
function setupHudCompact() {
  for (const id of ['hDepth', 'hTime', 'hO2', 'o2bar', 'hBpm', 'hMax', 'hPrep']) { const e = $(id); if (!e) continue; (e.classList.contains('bar') || e.classList.contains('dep') ? e : e.parentElement).classList.add('hsw'); }
}
