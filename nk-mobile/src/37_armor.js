// ================= armadura 3D das skins: placas de verdade vestidas no corpo (couraça, ombreiras em camadas, braçadeiras, caneleiras, penas e asas) =================
// as placas são medidas no corpo de cada personagem (anéis em volta de cada osso, no raio do corpo + folga) e copiam os pesos dos ossos do
// vértice do corpo mais perto: acompanham todas as animações, servem em homem e mulher e não precisam de arquivo novo.
// uma malha só por personagem (ouro + borda acesa); some de longe (70 m) para não pesar no celular.
const ARMOR = { geo: {}, mats: {} };
const ARMOR_TH = { s_fenix: { gold: 0xa8661a, neon: 0xff3c00, rough: 0.24, feathers: true, wings: true, emblem: 'wings' } };
function armorMats(th) {
  if (ARMOR.mats[th]) return ARMOR.mats[th];
  const c = ARMOR_TH[th], env = typeof ENV_TEX !== 'undefined' ? ENV_TEX : null;
  return ARMOR.mats[th] = [
    new T.MeshStandardMaterial({ color: c.gold, metalness: 1, roughness: c.rough, envMap: env, envMapIntensity: 1.6, side: T.DoubleSide }),
    new T.MeshStandardMaterial({ color: c.neon, emissive: c.neon, emissiveIntensity: 3.2, roughness: 0.45, side: T.DoubleSide }),
  ];
}
// ---- monta a geometria a partir do corpo (espaço da malha, pose de origem) ----
function armorGeo(host, th) {
  const g = host.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, sk = host.skeleton;
  const cp = (at, i, k) => k === 0 ? at.getX(i) : k === 1 ? at.getY(i) : k === 2 ? at.getZ(i) : at.getW(i);
  const bi = n => sk.bones.findIndex(b => b.name === n), V = (x, y, z) => new T.Vector3(x, y, z);
  const joint = n => { const i = bi(n); if (i < 0) return null; return V().setFromMatrixPosition(new T.Matrix4().copy(sk.boneInverses[i]).invert()); }; /* já no espaço da malha (a matriz de ligação é a identidade) */
  const wOf = (i, set) => { let s = 0; for (let k = 0; k < 4; k++) if (set.has(cp(SI, i, k))) s += cp(SW, i, k); return s; };
  const pel = joint('Bip01_Pelvis'), hd = joint('Bip01_Head'), H = hd.distanceTo(pel);
  const UP = hd.clone().sub(pel).normalize();
  const RT = joint('Bip01_R_UpperArm').sub(joint('Bip01_L_UpperArm')); RT.addScaledVector(UP, -RT.dot(UP)).normalize();
  let FW = UP.clone().cross(RT).normalize(); const nose = joint('Bip01_MNose'); if (nose && nose.clone().sub(hd).dot(FW) < 0) FW.negate();
  const pos = [], idx = [], si = [], sw = [], grp = [[], []]; const C = ARMOR_TH[th];
  const vp = new T.Vector3();
  // vértices do corpo de uma região (para medir o raio e copiar pesos)
  const region = names => { const set = new Set(names.map(bi).filter(i => i >= 0)), out = []; for (let i = 0; i < P.count; i++) if (wOf(i, set) > 0.35) out.push(i); return out; };
  const nearest = (p, list) => { let best = list[0], bd = 1e18; for (const i of list) { const dx = P.getX(i) - p.x, dy = P.getY(i) - p.y, dz = P.getZ(i) - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = i; } } return best; };
  const addV = (p, wsrc, rigid) => { pos.push(p.x, p.y, p.z); if (rigid != null) { si.push(rigid, 0, 0, 0); sw.push(1, 0, 0, 0); } else { for (let k = 0; k < 4; k++) { si.push(cp(SI, wsrc, k)); sw.push(cp(SW, wsrc, k)); } } return pos.length / 3 - 1; };
  const quad = (a, b, c, d, m) => grp[m].push(a, b, c, b, d, c);
  /* casca medida: eixo a->b, anéis de t0 a t1, setores no arco (a0..a1 em volta de ref), raio = corpo + folga */
  function shell(o) {
    const a = joint(o.a), b = joint(o.b); if (!a || !b) return;
    const L = a.distanceTo(b), d = b.clone().sub(a).normalize();
    const ref = o.ref.clone().addScaledVector(d, -o.ref.dot(d)).normalize(), side = d.clone().cross(ref).normalize();
    const reg = region(o.bones), NR = o.rings || 7, NS = o.sec || 20, full = o.arc >= 6.28, a0 = full ? 0 : -o.arc / 2, span = full ? Math.PI * 2 : o.arc;
    const R = []; for (let k = 0; k < NR; k++) R.push(new Array(NS + 1).fill(0));
    const band = (o.t1 - o.t0) / (NR - 1) * 0.8 + 0.04;
    for (const i of reg) {
      vp.fromBufferAttribute(P, i).sub(a); const t = vp.dot(d) / L; if (t < o.t0 - band || t > o.t1 + band) continue;
      vp.addScaledVector(d, -t * L); const r = vp.length(); let ang = Math.atan2(vp.dot(side), vp.dot(ref));
      const ks = []; for (let k = 0; k < NR; k++) { const tk = o.t0 + (o.t1 - o.t0) * k / (NR - 1); if (Math.abs(tk - t) < band) ks.push(k); }
      for (let j = 0; j <= NS; j++) { const aj = a0 + span * j / NS; let da = Math.abs(((ang - aj) % 6.283 + 9.42) % 6.283 - 3.14); if (da < span / NS * 0.9 + 0.12) for (const k of ks) R[k][j] = Math.max(R[k][j], r); }
    }
    // preenche buracos e alisa
    let mean = 0, n = 0; for (const row of R) for (const r of row) if (r > 0) { mean += r; n++; } mean = n ? mean / n : H * 0.08;
    for (const row of R) for (let j = 0; j <= NS; j++) if (!row[j]) row[j] = mean;
    for (let it = 0; it < (o.smooth || 3); it++) for (let k = 0; k < NR; k++) { const row = R[k], nw = row.slice(); for (let j = 0; j <= NS; j++) { const jl = full ? (j + NS - 1) % NS : Math.max(0, j - 1), jr = full ? (j + 1) % NS : Math.min(NS, j + 1), up = R[Math.max(0, k - 1)][j], dn = R[Math.min(NR - 1, k + 1)][j]; nw[j] = (row[j] * 2 + row[jl] + row[jr] + up + dn) / 6; } R[k] = nw; }
    const outer = [], inner = [];
    for (let k = 0; k < NR; k++) {
      const tk = o.t0 + (o.t1 - o.t0) * k / (NR - 1), ok = [], ik = [];
      for (let j = 0; j <= NS; j++) {
        if (full && j === NS) { ok.push(ok[0]); ik.push(ik[0]); continue; }
        const aj = a0 + span * j / NS, dir = ref.clone().multiplyScalar(Math.cos(aj)).addScaledVector(side, Math.sin(aj));
        const shape = o.shape ? o.shape(tk, aj) : 1, ro = R[k][j] * shape + o.off * H * (o.offF ? o.offF(tk, aj) : 1);
        const po = a.clone().addScaledVector(d, tk * L).addScaledVector(dir, ro), pi = a.clone().addScaledVector(d, tk * L).addScaledVector(dir, ro - o.th * H);
        const ws = nearest(pi, reg); ok.push(addV(po, ws, o.rigid != null ? bi(o.rigid) : null)); ik.push(addV(pi, ws, o.rigid != null ? bi(o.rigid) : null));
      }
      outer.push(ok); inner.push(ik);
    }
    for (let k = 0; k < NR - 1; k++) for (let j = 0; j < NS; j++) {
      const tk = o.t0 + (o.t1 - o.t0) * (k + 0.5) / (NR - 1), aj = a0 + span * (j + 0.5) / NS, m = o.neon && o.neon(tk, aj) ? 1 : 0;
      quad(outer[k][j], outer[k][j + 1], outer[k + 1][j], outer[k + 1][j + 1], m); quad(inner[k][j + 1], inner[k][j], inner[k + 1][j + 1], inner[k + 1][j], 0);
    }
    for (let j = 0; j < NS; j++) { quad(outer[0][j + 1], outer[0][j], inner[0][j + 1], inner[0][j], 1); const e = NR - 1; quad(outer[e][j], outer[e][j + 1], inner[e][j], inner[e][j + 1], 1); }
    if (!full) for (let k = 0; k < NR - 1; k++) { quad(outer[k][0], outer[k + 1][0], inner[k][0], inner[k + 1][0], 1); quad(outer[k + 1][NS], outer[k][NS], inner[k + 1][NS], inner[k][NS], 1); }
    return { a, d, L, ref, side, R, o, NR, NS, a0, span, full, reg };
  }
  /* ponto na superfície de uma casca (t ao longo do osso, ang em volta) + altura extra */
  function surf(S, t, ang, ex) {
    const { o, NR, NS, a0, span, R, a, d, L, ref, side } = S, fk = Math.max(0, Math.min(NR - 1, (t - o.t0) / (o.t1 - o.t0) * (NR - 1)));
    let fj = (ang - a0) / span * NS; if (S.full) fj = ((fj % NS) + NS) % NS; fj = Math.max(0, Math.min(NS, fj));
    const k0 = Math.floor(fk), k1 = Math.min(NR - 1, k0 + 1), j0 = Math.floor(fj), j1 = Math.min(NS, j0 + 1), u = fk - k0, w = fj - j0;
    const r = (R[k0][j0] * (1 - w) + R[k0][j1 % (S.full ? NS : NS + 1)] * w) * (1 - u) + (R[k1][j0] * (1 - w) + R[k1][j1 % (S.full ? NS : NS + 1)] * w) * u;
    const dir = ref.clone().multiplyScalar(Math.cos(ang)).addScaledVector(side, Math.sin(ang));
    return a.clone().addScaledVector(d, t * L).addScaledVector(dir, r * (o.shape ? o.shape(t, ang) : 1) + o.off * H * (o.offF ? o.offF(t, ang) : 1) + ex);
  }
  /* fita acesa em relevo seguindo um caminho [t, ang] na superfície */
  function ribbon(S, path, wid, hgt) {
    const pts = [], n = path.length; let prev = null;
    for (let i = 0; i < n; i++) {
      const [t, ang] = path[i], base = surf(S, t, ang, 0), top = surf(S, t, ang, hgt);
      const nx = path[Math.min(n - 1, i + 1)], pv = path[Math.max(0, i - 1)], tg = surf(S, nx[0], nx[1], 0).sub(surf(S, pv[0], pv[1], 0)).normalize();
      const nrm = top.clone().sub(base).normalize(), bi2 = tg.clone().cross(nrm).normalize().multiplyScalar(wid / 2), ws = nearest(base, S.reg);
      pts.push([addV(base.clone().add(bi2), ws), addV(top.clone().add(bi2), ws), addV(top.clone().sub(bi2), ws), addV(base.clone().sub(bi2), ws)]);
    }
    for (let i = 0; i < n - 1; i++) { const A = pts[i], B = pts[i + 1]; quad(A[0], A[1], B[0], B[1], 1); quad(A[1], A[2], B[1], B[2], 1); quad(A[2], A[3], B[2], B[3], 1); }
  }
  /* lâmina (pena/asa): rígida num osso */
  function blade(base, dir, wv, len, wid, bone, neonFrom) {
    const b = bi(bone); if (b < 0) return; const nv = dir.clone().cross(wv).normalize(), n = 6, ring = [];
    for (let j = 0; j <= n; j++) { const t = j / n, w = wid * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95)), 0.8) * (1 - t * 0.3), c = base.clone().addScaledVector(dir, len * t).addScaledVector(nv, len * 0.1 * t * t);
      ring.push([addV(c.clone().addScaledVector(wv, w), 0, b), addV(c.clone().addScaledVector(wv, -w), 0, b), addV(c.clone().addScaledVector(nv, wid * 0.22 * (1 - t)), 0, b), addV(c.clone().addScaledVector(nv, -wid * 0.12 * (1 - t)), 0, b)]); }
    const tip = addV(base.clone().addScaledVector(dir, len * 1.1).addScaledVector(nv, len * 0.12), 0, b);
    for (let j = 0; j < n; j++) { const A = ring[j], B = ring[j + 1], m = j / n >= neonFrom ? 1 : 0; quad(A[0], A[2], B[0], B[2], m); quad(A[2], A[1], B[2], B[1], m); quad(A[1], A[3], B[1], B[3], m); quad(A[3], A[0], B[3], B[0], m); }
    const A = ring[n]; for (const [x, y] of [[0, 2], [2, 1], [1, 3], [3, 0]]) grp[1].push(A[x], A[y], tip);
  }
  // couraça: tronco inteiro, peito mais saliente, asas de fênix acesas no peito
  const torso = shell({ a: 'Bip01_Spine', b: 'Bip01_Neck', bones: ['Bip01_Spine', 'Bip01_Spine1', 'Bip01_Spine2'], ref: FW, arc: 6.3, t0: 0.2, t1: 0.86, rings: 16, sec: 48, off: 0.024, th: 0.014,
    offF: (t, a) => 1 + 0.9 * Math.max(0, Math.cos(a)) * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.25) / 0.7))),
  });
  if (C.emblem && torso) { // fênix no peito: corpo, duas asas abertas em leque e a cauda; frisos na barriga e nas costas
    const hw = H * 0.012, hh = H * 0.006, seg = (t0, a0, t1, a1, n) => Array.from({ length: n || 10 }, (_, i) => { const u = i / ((n || 10) - 1); return [t0 + (t1 - t0) * u, a0 + (a1 - a0) * u]; });
    ribbon(torso, seg(0.3, 0, 0.72, 0, 12), hw * 1.3, hh);
    for (const sg of [-1, 1]) {
      for (const [tt, aa] of [[0.86, 1.05], [0.8, 1.2], [0.72, 1.28]]) ribbon(torso, Array.from({ length: 12 }, (_, i) => { const u = i / 11; return [0.6 + (tt - 0.6) * Math.sin(u * 1.57), sg * aa * u]; }), hw, hh);
      ribbon(torso, seg(0.3, 0, 0.22, sg * 0.35, 6), hw, hh);
      ribbon(torso, seg(0.26, sg * 0.6, 0.26, sg * 1.5, 8), hw * 0.8, hh); ribbon(torso, seg(0.26, Math.PI - sg * 0.3, 0.26, Math.PI - sg * 1.5, 8), hw * 0.8, hh);
    }
    ribbon(torso, seg(0.3, Math.PI, 0.8, Math.PI, 10), hw, hh);
  }
  for (const s of ['L', 'R']) {
    const sg = s === 'R' ? 1 : -1, out = RT.clone().multiplyScalar(sg);
    // ombreira em 3 camadas (cada uma mais curta e mais afastada), em cima e por fora do ombro
    for (const [t1, off, k] of [[0.5, 0.03, 0], [0.37, 0.048, 1], [0.24, 0.066, 2]])
      shell({ a: `Bip01_${s}_UpperArm`, b: `Bip01_${s}_Forearm`, bones: [`Bip01_${s}_UpperArm`, `Bip01_${s}_Clavicle`], ref: UP.clone().add(out.clone().multiplyScalar(0.6)), arc: 3.9, t0: -0.16, t1, rings: 6, sec: 16, off, th: 0.011, rigid: `Bip01_${s}_UpperArm`,
        shape: (t) => t < 0 ? 0.55 + 0.45 * (1 + t / 0.16) : 1, offF: (t) => 1 + Math.max(0, t) * 0.8 });
    shell({ a: `Bip01_${s}_Forearm`, b: `Bip01_${s}_Hand`, bones: [`Bip01_${s}_Forearm`], ref: UP, arc: 6.3, t0: 0.3, t1: 0.88, rings: 5, sec: 16, off: 0.016, th: 0.01, offF: t => 1 + (1 - t) * 0.6,
      neon: (t, a) => Math.abs(t - 0.6) < 0.06 });
    shell({ a: `Bip01_${s}_Calf`, b: `Bip01_${s}_Foot`, bones: [`Bip01_${s}_Calf`], ref: FW, arc: 3.4, t0: -0.02, t1: 0.72, rings: 7, sec: 14, off: 0.012, th: 0.01,
      shape: t => t < 0.06 ? 1.08 : 1, neon: (t, a) => Math.abs(a) < 0.12 && t > 0.15 });
    // penas de fogo saindo da ombreira (presas no braço)
    if (C.feathers) { const sh = joint(`Bip01_${s}_UpperArm`), el = joint(`Bip01_${s}_Forearm`), dArm = el.clone().sub(sh).normalize();
      for (let k = 0; k < 3; k++) { const f = -0.5 + k * 0.5, dir = dArm.clone().multiplyScalar(0.45).add(out.clone().multiplyScalar(0.75)).addScaledVector(FW, -f * 0.5).addScaledVector(UP, 0.15).normalize();
        blade(sh.clone().addScaledVector(UP, H * 0.07).addScaledVector(out, H * 0.06).addScaledVector(FW, f * H * 0.06), dir, FW.clone(), H * (0.34 - Math.abs(f) * 0.1), H * 0.04, `Bip01_${s}_UpperArm`, 0.55); } }
  }
  // asas nas costas (presas no tronco)
  if (C.wings) { const sp = joint('Bip01_Spine2'), back = FW.clone().negate();
    for (const sg of [-1, 1]) for (let k = 0; k < 5; k++) { const th2 = 0.3 + k * 0.32, dir = UP.clone().multiplyScalar(Math.cos(th2)).addScaledVector(RT, sg * Math.sin(th2)).addScaledVector(back, 0.3).normalize();
      blade(sp.clone().addScaledVector(back, H * 0.2).addScaledVector(RT, sg * H * 0.06).addScaledVector(UP, H * 0.02), dir, back.clone().cross(dir).normalize(), H * (0.85 - Math.abs(k - 1.2) * 0.13), H * 0.13, 'Bip01_Spine2', 0.45); } }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
  geo.setIndex([...grp[0], ...grp[1]]); geo.addGroup(0, grp[0].length, 0); geo.addGroup(grp[0].length, grp[1].length, 1);
  geo.computeVertexNormals(); return geo;
}
function armorHost(root) { let h = null; root.traverse(o => { if (o.isSkinnedMesh && !h && /_body/i.test((Array.isArray(o.material) ? o.material[0] : o.material).name)) h = o; }); return h; }
// veste a armadura no personagem (ou tira, se o traje não tem)
function armorWear(root, avk, th) {
  const old = root.userData.armor; if (old && old.userData.th === th) return old;
  if (old) { old.parent && old.parent.remove(old); root.userData.armor = null; }
  if (!th || !ARMOR_TH[th]) return null;
  const host = armorHost(root); if (!host) return null;
  const key = th + '|' + avk; const geo = ARMOR.geo[key] || (ARMOR.geo[key] = armorGeo(host, th));
  const mesh = new T.SkinnedMesh(geo, armorMats(th)); mesh.position.copy(host.position); mesh.quaternion.copy(host.quaternion); mesh.scale.copy(host.scale);
  host.parent.add(mesh); mesh.bind(host.skeleton, host.bindMatrix); mesh.frustumCulled = false; mesh.castShadow = true; mesh.userData.th = th;
  return root.userData.armor = mesh;
}
function armorTheme(a) { const e = cosOf(a), o = e.out && COS[e.out]; return o && ARMOR_TH[o.th] ? o.th : null; }
(function hookArmor() {
  const ug = updateHumanGear;
  updateHumanGear = function (a) { const r = ug.apply(this, arguments); const m = a.model; if (m && m.human) { const th = armorTheme(a); if (th || m.root.userData.armor) m.armor = armorWear(m.root, m.av.k, th);
      if (m.armor) { for (const mt of m.mats) if (/equipment/.test(mt.name.toLowerCase())) mt.visible = false; if (m.gear.vest) m.gear.vest.visible = false; } } /* colete fica por baixo da couraça */ return r; };
  const gs = gfxStep; gfxStep = function (dt, ...q) { const o = gs.call(this, dt, ...q);
    const cx = camera.position.x, cz = camera.position.z;
    for (const a of (G.phase === 'match' ? G.actors : LOB.actors)) { const m = a.model; if (m && m.armor) m.armor.visible = m.g.visible !== false && Math.hypot(a.x - cx, a.z - cz) < 70; }
    return o; };
})();
