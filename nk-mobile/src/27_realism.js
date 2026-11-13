// ================= mais realismo: reflexo de ambiente nas armas e mato denso perto do jogador =================

// ---------- mapa de reflexo (céu claro em cima, chão terroso embaixo, sol forte): metal da arma reflete o ambiente ----------
const ENV_TEX = (() => {
  try {
    const sc = new T.Scene(), g = new T.SphereGeometry(10, 32, 16), p = g.attributes.position, col = [], c = new T.Color();
    const top = new T.Color(0x6f9ccc), hor = new T.Color(0xdfe6e8), gnd = new T.Color(0x5a5040);
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10; if (y >= 0) c.copy(hor).lerp(top, Math.pow(y, 0.6)); else c.copy(hor).lerp(gnd, Math.min(1, -y * 3)); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    sc.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const sunM = new T.Mesh(new T.SphereGeometry(1.1, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff })); sunM.position.copy(SUN_DIR).multiplyScalar(8.5); sc.add(sunM);
    const pm = new T.PMREMGenerator(renderer), rt = pm.fromScene(sc, 0.02); pm.dispose(); return rt.texture;
  } catch (e) { return null; }
})();
// arma e braços da 1ª pessoa: material físico (metal/polímero) com reflexo
if (ENV_TEX) {
  MAT.view = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.42, envMap: ENV_TEX, envMapIntensity: 1.2 });
  vmGun.material = MAT.view; vmGun.userData.orig = MAT.view;
  vmArms.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) { o.material.envMap = ENV_TEX; o.material.envMapIntensity = 0.6; o.material.needsUpdate = true; } });
}

// ---------- mato denso perto do jogador (arbustos e moitas que não bloqueiam; mais cheio na floresta) ----------
const UNDER = { inst: {}, ready: false, cx: 1e9, cz: 1e9 };
function underSetup() {
  if (UNDER.ready || !NATR.ready) return UNDER.ready;
  const mat = natMat();
  for (const k of BUSHES) { if (!NATR.types[k]) continue; const m = new T.InstancedMesh(NATR.types[k], mat, 1100); m.count = 0; m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); UNDER.inst[k] = m; }
  // capim alto em moitas (folhas finas que balançam): dá a leitura de mato denso de perto
  UNDER.tall = new T.InstancedMesh(tuftGeo(12, 0.7, 1.4, '#2c3a1b', '#868a4a'), windMat(), 2600); UNDER.tall.count = 0; UNDER.tall.frustumCulled = false; UNDER.tall.receiveShadow = true; scene.add(UNDER.tall);
  return UNDER.ready = Object.keys(UNDER.inst).length > 0;
}
function refreshUnder(cx, cz) {
  if (!underSetup()) return;
  for (const k in UNDER.inst) UNDER.inst[k].count = 0; UNDER.tall.count = 0;
  const R = [0, 42, 60][SET.quality] || 0; if (!R || cx > 1e5) { for (const k in UNDER.inst) UNDER.inst[k].instanceMatrix.needsUpdate = true; UNDER.tall.instanceMatrix.needsUpdate = true; return; }
  const S = 2.4, R2 = R * R, BAL = MAPID === 'bal', ks = Object.keys(UNDER.inst);
  const i0 = Math.floor((cx - R) / S), i1 = Math.ceil((cx + R) / S), j0 = Math.floor((cz - R) / S), j1 = Math.ceil((cz + R) / S);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const r = hsh(i * 1.7 + 3.3, j * 2.9 - 1.1), x = (i + r) * S, z = (j + hsh(j + 7.1, i - 4.4)) * S;
    if ((x - cx) ** 2 + (z - cz) ** 2 > R2 || !grassAt(x, z)) continue;
    const forest = NZ.fbm(x / 230 + 17, z / 230 - 5, 2), p = forest > -0.15 ? (BAL ? 0.75 : 0.55) : (BAL ? 0.3 : 0.14);
    const roll = hsh(x * 0.37, z * 0.53);
    if (roll < p * 1.6 && UNDER.tall.count < 2600) { // moitas de capim: 2 a 3 por ponto
      for (let q = 0; q < 3; q++) { const ox = (hsh(x + q, z) - 0.5) * 1.6, oz = (hsh(z - q, x) - 0.5) * 1.6, sc = 0.8 + hsh(x * q, z) * 0.7; _nd.position.set(x + ox, groundH(x + ox, z + oz), z + oz); _nd.rotation.set(0, (r + q) * 2.1, 0); _nd.scale.set(sc, sc, sc); _nd.updateMatrix(); UNDER.tall.setMatrixAt(UNDER.tall.count++, _nd.matrix); }
    }
    if (roll > p * 0.55) continue; // arbustos: menos e menores
    const m = UNDER.inst[ks[Math.floor(r * ks.length)]]; if (m.count >= 1100) continue;
    const s = 0.4 + hsh(x, z) * 0.6; _nd.position.set(x, groundH(x, z) - 0.05, z); _nd.rotation.set(0, r * 6.28, 0); _nd.scale.set(s * 1.15, s, s * 1.15); _nd.updateMatrix(); m.setMatrixAt(m.count++, _nd.matrix);
  }
  for (const k in UNDER.inst) UNDER.inst[k].instanceMatrix.needsUpdate = true; UNDER.tall.instanceMatrix.needsUpdate = true;
}
const _rnU = refreshNature; refreshNature = function (cx, cz) { _rnU(cx, cz); refreshUnder(cx, cz); };
