// ================= equipamentos em abas (com foto) e treinos de apneia =================

// ---------- cintos de lastro: o peso decide em que profundidade o mergulhador fica neutro ----------
const BELTS = [
  { name: 'Cinto de nylon 3 kg', kg: 3, o2: 1, price: 0, desc: 'Vem com o kit. Fivela de plástico, aperta a barriga.' },
  { name: 'Cinto marselhês 2 kg', kg: 2, o2: 0.97, price: 260, desc: 'Borracha que estica e não aperta o diafragma. Pouco lastro: para o raso, até uns 8 m.' },
  { name: 'Cinto marselhês 4 kg', kg: 4, o2: 0.97, price: 320, desc: 'Lastro de meia-água, bom de 8 a 15 m.' },
  { name: 'Cinto marselhês 6 kg', kg: 6, o2: 0.97, price: 420, desc: 'Muito lastro: desce fácil e sobe pesado. Para costão fundo e naufrágio.' },
];
const beltNow = () => BELTS[SV.belt || 0];
const neutralDepth = () => (2 + beltNow().kg * 1.7) * (AMZ ? 0.65 : 1); // água doce: o mesmo lastro afunda mais

// ---------- acessórios ----------
const COMP_PRICE = 1200;

// ---------- treinos de apneia ----------
const TRAIN = [
  { id: 'apnea', name: 'Apneia estática', max: STATIC_STEPS.length, price: l => 300 + l * 250, desc: l => `Tabelas de CO₂ e O₂ deitado na areia. Próximo nível: +${STATIC_STEPS[l] || 0} s de fôlego. Hoje: ${maxBreath()} s.` },
  { id: 'trKick', name: 'Pernada eficiente', max: 5, price: l => 400 + l * 300, desc: () => `Pernada longa e solta: −7% de ar gasto nadando e +3% de velocidade por nível.` },
  { id: 'trEq', name: 'Equalização (Frenzel)', max: 5, price: l => 350 + l * 300, desc: () => `Compensa os ouvidos sem esforço. Desce sem aperto até ${comfortDepth()} m (+4 m por nível).` },
  { id: 'trRec', name: 'Recuperação na superfície', max: 4, price: l => 300 + l * 250, desc: l => `Respiração de recuperação: +20% de velocidade para recuperar o fôlego por nível${l ? ` (hoje +${l * 20}%)` : ''}.` },
  { id: 'trRelax', name: 'Relaxamento', max: 3, price: l => 500 + l * 400, desc: () => `A respiração calma na superfície rende até +${Math.round(relaxMax() * 100)}% de fôlego no próximo mergulho.` },
];
const lvl = id => SV[id] || 0;
const kickEff = () => 1 - 0.07 * lvl('trKick');
const comfortDepth = () => 12 + 4 * lvl('trEq');
const recMult = () => 1 + 0.2 * lvl('trRec');
const relaxMax = () => 0.08 + 0.04 * lvl('trRelax');
// equalização: além da profundidade confortável, cada metro custa mais ar
function eqPenalty(depth) {
  const over = depth - comfortDepth();
  if (over > 0 && !P.eqWarned) { P.eqWarned = true; toast(`Ouvidos apertando a ${Math.round(depth)} m. Treine equalização (aba Apneia) para descer mais fundo.`, 4, 'bad'); }
  return 1 + Math.max(0, over) * 0.025;
}
// respiração calma: parado e tranquilo na superfície, prepara o próximo mergulho
function updateApnea(dt) {
  if (P.mode !== 'swim') { P.relax = 0; return; }
  if (!P.under) {
    const calm = Math.hypot(IN.jx, IN.jy) < 0.05 && P.o2 > 0.97;
    const was = P.relax || 0;
    P.relax = clamp(was + (calm ? dt / 25 : -dt / 4), 0, 1);
    if (was < 1 && P.relax >= 1) toast(`Respiração calma: +${Math.round(relaxMax() * 100)}% de fôlego no próximo mergulho. Nunca hiperventile!`, 4);
  }
  // computador: alarme de profundidade e de fôlego
  if (SV.comp && P.under) {
    const d = -P.pos.y;
    if (d > comfortDepth() && !P.compDepthAl) { P.compDepthAl = true; buzz([80, 60, 80]); toast(`Computador: ${Math.round(d)} m, além do seu limite confortável.`, 2.5, 'bad'); }
    if (P.o2 < 0.4 && !P.compO2Al) { P.compO2Al = true; buzz([120, 80, 120]); toast('Computador: fôlego em 40%. Hora de subir.', 2.5, 'bad'); }
  }
}
function onDiveStart() { P.diveBonus = (P.relax || 0) * relaxMax(); P.relax = 0; P.eqWarned = false; P.compDepthAl = false; P.compO2Al = false; }
function prepHUD() {
  const L = $('hPrepL'), V = $('hPrep');
  if (P.mode !== 'swim') { L.textContent = 'Preparo'; V.textContent = '—'; return; }
  if (P.under) { L.textContent = 'Bônus'; V.textContent = P.diveBonus ? '+' + Math.round(P.diveBonus * 100) + '%' : '—'; return; }
  if (SV.comp && P.lastDiveT > 5) { const left = Math.max(0, P.lastDiveT * 2 - P.surfT); L.textContent = 'Intervalo'; V.textContent = left > 0 ? Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0') : 'PRONTO'; V.style.color = left > 0 ? 'var(--bad)' : 'var(--acc)'; return; }
  V.style.color = ''; L.textContent = 'Preparo'; V.textContent = Math.round((P.relax || 0) * 100) + '%';
}

// ---------- visual no mergulhador: nadadeira, máscara e chumbos do cinto ----------
const FIN_LOOK = [{ color: 0x1b1f25, map: false, rough: 0.6, metal: 0 }, { color: 0x3c7d78, map: false, rough: 0.3, metal: 0.15 }, { color: 0xffffff, map: true, rough: 0.3, metal: 0.35 }];
function lookFin(m, i) { const L = FIN_LOOK[i] || FIN_LOOK[2]; m.map = L.map ? _carbT : null; m.color.set(L.color); m.roughness = L.rough; m.metalness = L.metal; m.needsUpdate = true; }
function applyDiverLook(r) {
  if (!r || !r.finM) return;
  lookFin(r.finM, SV.fins || 0);
  r.mask.scale.set((SV.mask || 0) === 0 ? 2.3 : 2.05, 1, (SV.mask || 0) === 0 ? 1.05 : 0.92);
  r.leads.forEach((w, i) => w.visible = i < beltNow().kg);
}

// ---------- fotos dos itens: renderiza o modelo 3D numa textura e guarda como imagem ----------
const THUMBS = {}; let _th = null;
function thumb(id, build, dir = [1, 0.35, 0.6], zoom = 1) {
  if (THUMBS[id]) return THUMBS[id];
  if (!_th) {
    const W = 192, Hh = 128, rt = new THREE.WebGLRenderTarget(W, Hh);
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0d2f39);
    sc.add(new THREE.HemisphereLight(0xdff2ff, 0x30404a, 1.3)); const dl = new THREE.DirectionalLight(0xffffff, 1.3); dl.position.set(3, 5, 4); sc.add(dl);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    _th = { W, Hh, rt, sc, cam: new THREE.PerspectiveCamera(30, W / Hh, 0.01, 60), buf: new Uint8Array(W * Hh * 4), cv };
  }
  const T = _th, obj = build(); if (obj.parent) obj.parent.remove(obj);
  const holder = new THREE.Group(); holder.position.y = 300; holder.add(obj); T.sc.add(holder); holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder), c = box.getCenter(new V3()), s = box.getSize(new V3());
  // enquadra pela projeção do volume no plano da câmera (objetos compridos ocupam a largura)
  const fw = new V3(...dir).normalize(), rt2 = new V3().crossVectors(fw, new V3(0, 1, 0)).normalize(), up2 = new V3().crossVectors(rt2, fw);
  const ext = v => Math.abs(v.x) * s.x + Math.abs(v.y) * s.y + Math.abs(v.z) * s.z;
  const R = Math.max(ext(rt2) / (T.W / T.Hh), ext(up2)) * 0.5, dist = R / Math.tan(15 * Math.PI / 180) * 1.08 / zoom + Math.max(s.x, s.y, s.z) * 0.5;
  T.cam.position.copy(c).add(new V3(...dir).normalize().multiplyScalar(dist)); T.cam.lookAt(c);
  renderer.setRenderTarget(T.rt); renderer.render(T.sc, T.cam); renderer.readRenderTargetPixels(T.rt, 0, 0, T.W, T.Hh, T.buf); renderer.setRenderTarget(null);
  const g = T.cv.getContext('2d'), img = g.createImageData(T.W, T.Hh);
  for (let y = 0; y < T.Hh; y++) img.data.set(T.buf.subarray((T.Hh - 1 - y) * T.W * 4, (T.Hh - y) * T.W * 4), y * T.W * 4);
  g.putImageData(img, 0, 0); THUMBS[id] = T.cv.toDataURL('image/png');
  T.sc.remove(holder); holder.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return THUMBS[id];
}
const stdM = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6 }, o));
function maskObj(i) {
  const g = new THREE.Group(), rub = stdM(0x111316, { roughness: 0.5 }), glass = stdM(0x0c1a20, { metalness: 0.9, roughness: 0.05 });
  const w = i === 0 ? 1.15 : 1;
  const fr = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.034, 24), rub); fr.rotation.x = Math.PI / 2; fr.scale.set(2.1 * w, 1, 0.95 * w); g.add(fr);
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.027 * w, 20), glass); l.position.set(sx * 0.035 * w, 0.004, 0.0175); l.scale.set(1.1, 0.9, 1); g.add(l); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.034, 10), rub); nose.position.set(0, -0.035, 0.01); nose.rotation.x = Math.PI; g.add(nose);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.007, 6, 28, Math.PI), rub); strap.rotation.y = Math.PI / 2; strap.position.z = -0.1; strap.scale.set(1, 0.6, 1); g.add(strap);
  return g;
}
function finObj(i) {
  gtex(); const g = new THREE.Group(), m = stdM(0xffffff, { side: THREE.DoubleSide }); lookFin(m, i);
  const pk = new THREE.Mesh(new THREE.CapsuleGeometry(0.047, 0.19, 4, 14), stdM(0x0c0d0f, { roughness: 0.55 })); pk.rotation.x = Math.PI / 2; pk.scale.set(1.12, 1, 0.84); g.add(pk);
  const bl = new THREE.Group(); bl.position.set(0, -0.03, -0.08); bl.rotation.x = FIN_ANG * 0.4; g.add(bl);
  const [bg, rg] = finGeos(); bl.add(new THREE.Mesh(bg, m), new THREE.Mesh(rg, stdM(0x0c0d0f)));
  return g;
}
function beltObj(b) {
  const g = new THREE.Group(), band = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 6, 40), stdM(b.o2 < 1 ? 0x1a1a1c : 0x2b2f38, { roughness: 0.7 })); band.rotation.x = Math.PI / 2; band.scale.set(1, 0.72, 0.6); g.add(band);
  const lead = stdM(0x4a4e52, { metalness: 0.3, roughness: 0.65 });
  for (let k = 0; k < b.kg; k++) { const a = (k - (b.kg - 1) / 2) * 0.5 + Math.PI; const w = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.035, 3, 8), lead); w.position.set(Math.sin(a) * 0.17, 0, Math.cos(a) * 0.17 * 0.72); w.rotation.set(0, -a, Math.PI / 2); g.add(w); }
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.012), stdM(b.o2 < 1 ? 0xc0c4c8 : 0x222222, { metalness: b.o2 < 1 ? 0.85 : 0, roughness: 0.3 })); buckle.position.z = 0.125; g.add(buckle);
  return g;
}
function lightObj() {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 18), stdM(0x1c1f24, { roughness: 0.4 })); body.rotation.z = Math.PI / 2; g.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.03, 0.05, 18), stdM(0xd8a020, { metalness: 0.4, roughness: 0.4 })); head.rotation.z = Math.PI / 2; head.position.x = 0.1; g.add(head);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.036, 18), new THREE.MeshBasicMaterial({ color: 0xfff6d0 })); lens.rotation.y = Math.PI / 2; lens.position.x = 0.1251; g.add(lens);
  return g;
}
function camObj() {
  const g = new THREE.Group(), hs = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.09), stdM(0x2a2f36, { metalness: 0.5, roughness: 0.35 })); g.add(hs);
  const port = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 10, 0, TAU, 0, Math.PI / 2), stdM(0x16303a, { metalness: 0.9, roughness: 0.05 })); port.rotation.x = Math.PI / 2; port.position.z = 0.045; g.add(port);
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI), stdM(0x111111)); h.position.set(sx * 0.1, 0.02, 0); h.rotation.set(0, Math.PI / 2, Math.PI / 2 * sx); g.add(h); }
  return g;
}
function compObj() {
  const g = new THREE.Group(), face = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 24), stdM(0x202428, { metalness: 0.6, roughness: 0.3 })); face.rotation.x = Math.PI / 2; g.add(face);
  const scr = new THREE.Mesh(new THREE.CircleGeometry(0.024, 24), new THREE.MeshBasicMaterial({ color: 0x7cf0a8 })); scr.position.z = 0.0075; g.add(scr);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 24), stdM(0x111111)); strap.scale.set(1, 1.3, 1); strap.rotation.y = Math.PI / 2; g.add(strap);
  return g;
}
function diverObj(color, map) {
  const r = buildDiver(false); r.suitMat.map = map || null; r.suitMat.color.set(color); r.suitMat.needsUpdate = true; poseDiver(r, 'drive', 0);
  r.aL.sh.rotation.set(0.1, 0, -0.15); r.aR.sh.rotation.set(0.1, 0, 0.15); r.aL.el.rotation.set(0.2, 0, 0); r.aR.el.rotation.set(0.2, 0, 0);
  r.lL.th.rotation.set(0, 0, 0.04); r.lR.th.rotation.set(0, 0, -0.04); r.lL.kn.rotation.set(0, 0, 0); r.lR.kn.rotation.set(0, 0, 0);
  return r.root;
}

// ---------- aba Equipamentos ----------
let eqTab = 'guns';
const EQ_TABS = [['guns', 'Arbaletes'], ['suits', 'Roupas'], ['masks', 'Máscaras'], ['fins', 'Nadadeiras'], ['belts', 'Cintos'], ['acc', 'Acessórios']];
const FIN_DESC = ['Pá curta de plástico. Vem com o kit.', 'Pá de fibra de vidro: mais longa e com mais resposta.', 'Pá de carbono: leve e nervosa, a mais eficiente.'];
function card(img, name, desc, btn) { return `<div class="it eq"><img class="thumb" src="${img}" alt=""><div style="flex:1"><div class="n">${name}</div><div class="d">${desc}</div></div>${btn}</div>`; }
const owned = (eq, own, attrEq, attrBuy, price) => eq ? '<span class="d">EM USO</span>' : own ? `<button class="btn alt" ${attrEq}>USAR</button>` : buyBtn(attrBuy, price);
function equipHTML() {
  let h = `<div class="tabs sub">${EQ_TABS.map(([k, n]) => `<div class="tab ${k === eqTab ? 'on' : ''}" data-eqtab="${k}">${n}</div>`).join('')}</div><div class="list">`;
  if (eqTab === 'guns') h += GUNS.map(g => card(thumb('g' + g.id, () => { const m = buildGunMesh(g, false); placeBands(m, m.bands.length, -1, 1); return m.g; }, [1, 0.3, -0.08], 1.9), g.name, `Alcance ${fmtKg(g.range)} m · ${g.pneu ? 'pneumático' : g.bands + ' elástico(s)'} · segura peixe de até ~${g.power} kg. ${g.desc}`,
    owned(SV.gun === g.id, SV.guns.includes(g.id), `data-eq="${g.id}"`, `data-buy="${g.id}"`, g.price))).join('');
  if (eqTab === 'suits') h += SUITS.map((s, i) => card(thumb('s' + i, () => (gtex(), diverObj(i === 0 ? 0x1b1e22 : i === 2 ? 0xd8e0c8 : 0xffffff, i ? _camoT : null)), [0.2, 0.05, -1], 1.6), s.name, `${s.desc} Fôlego ×${s.o2.toFixed(2)}.`,
    owned((SV.suit || 0) === i, (SV.suits || [0]).includes(i), `data-suit="${i}"`, `data-bsuit="${i}"`, s.price))).join('');
  if (eqTab === 'masks') h += MASKS.map((s, i) => card(thumb('m' + i, () => maskObj(i), [0.45, 0.25, 1]), s.name, `${s.desc}${s.fov ? ` Campo de visão +${s.fov}°.` : ''} Fôlego ×${s.o2.toFixed(2)}.`,
    owned((SV.mask || 0) === i, (SV.masks || [0]).includes(i), `data-mask="${i}"`, `data-bmask="${i}"`, s.price))).join('');
  if (eqTab === 'fins') h += FINS.map((f, i) => card(thumb('f' + i, () => finObj(i), [1, 0.9, -0.2]), f.name, `${FIN_DESC[i]} Velocidade ×${f.k.toFixed(2)}.`,
    i <= SV.fins ? `<span class="d">${i === SV.fins ? 'EM USO' : 'TEM'}</span>` : `<button class="btn" data-fin="${i}" ${SV.money < f.price || i !== SV.fins + 1 ? 'disabled' : ''}>${fmtR(f.price)}</button>`)).join('');
  if (eqTab === 'belts') h += `<div class="it"><div class="d">Com o cinto certo você fica neutro na profundidade onde vai pescar: nem afunda, nem sobe. Hoje: neutro a ~${Math.round(neutralDepth())} m.</div></div>` + BELTS.map((b, i) => card(thumb('b' + i, () => beltObj(b), [0.3, 1, 0.9]), b.name, `${b.desc} Neutro a ~${Math.round(2 + b.kg * 1.7)} m.${b.o2 < 1 ? ' Fôlego ×0,97.' : ''}`,
    owned((SV.belt || 0) === i, (SV.belts || [0]).includes(i), `data-belt="${i}"`, `data-bbelt="${i}"`, b.price))).join('');
  if (eqTab === 'acc') {
    h += card(thumb('aLight', lightObj, [0.4, 0.5, 1]), 'Lanterna de mergulho', 'Acende sozinha abaixo de 7 m, na água turva e à noite. Ilumina toca e naufrágio.', SV.light ? '<span class="d">TEM</span>' : buyBtn('id="buyLight"', LIGHT_PRICE));
    h += card(thumb('aCam', camObj, [0.6, 0.4, 1]), 'Câmera submarina', 'Botão FOTO embaixo d\'água. Revistas pagam pelas fotos: peixe raro, mero e tartaruga valem mais.', SV.cam ? '<span class="d">TEM</span>' : buyBtn('id="buyCam"', CAM_PRICE));
    h += card(thumb('aComp', compObj, [0.3, 0.4, 1]), 'Computador de apneia', 'No pulso: mostra o intervalo de superfície recomendado (2× o mergulho), alarme de profundidade e alarme de fôlego em 40%.', SV.comp ? '<span class="d">TEM</span>' : buyBtn('id="buyComp"', COMP_PRICE));
    h += card(thumb('aBuddy', () => diverObj(0x24364e), [0.2, 0.05, -1], 1.6), 'Dupla de mergulho · hoje', 'Fica na superfície vigiando enquanto você desce (um sobe, o outro desce). Num apagão, ela te resgata e salva a fieira.', hiredBuddy() ? '<span class="d">CONTRATADA</span>' : buyBtn('id="buyBuddy"', BUDDY_PRICE));
  }
  return h + '</div>';
}
// ---------- aba Apneia ----------
function apneaHTML() {
  return `<div class="it" style="margin-bottom:8px"><div class="d">Fôlego hoje: <b>${maxBreath()} s</b> · equalização confortável até <b>${comfortDepth()} m</b> · lastro neutro a <b>~${Math.round(neutralDepth())} m</b>.
    Na superfície, fique parado respirando calmo antes de descer: o "Preparo" no painel enche e rende fôlego extra. Hiperventilar é perigoso e não ajuda.</div></div><div class="list">` +
    TRAIN.map(t => { const l = lvl(t.id), maxed = l >= t.max, pips = Array.from({ length: t.max }, (_, i) => `<i class="lv ${i < l ? 'on' : ''}"></i>`).join('');
      return `<div class="it"><div style="flex:1"><div class="n">${t.name} · nível ${l}/${t.max}</div><div class="d">${t.desc(l)}</div><div class="lvs">${pips}</div></div>${maxed ? '<span class="d">MÁXIMO</span>' : buyBtn(`data-train="${t.id}"`, t.price(l))}</div>`; }).join('') + '</div>';
}
function bindEquip(B, on, pay) {
  B.querySelectorAll('[data-eqtab]').forEach(t => t.onclick = () => { eqTab = t.dataset.eqtab; AU.click(); renderShop(); });
  on('[data-bbelt]', b => { const i = +b.dataset.bbelt; if (pay(BELTS[i].price)) { SV.belts = [...new Set([...(SV.belts || [0]), i])]; SV.belt = i; applyGear(); } });
  on('[data-belt]', b => { SV.belt = +b.dataset.belt; applyGear(); AU.click(); });
  on('[data-train]', b => { const t = TRAIN.find(t => t.id === b.dataset.train), l = lvl(t.id); if (l < t.max && pay(t.price(l))) { SV[t.id] = l + 1; toast(`${t.name}: nível ${l + 1}!`, 2.5, 'gold'); } });
  const bc = $('buyComp'); if (bc) bc.onclick = () => { if (pay(COMP_PRICE)) SV.comp = true; save(); renderShop(); };
}
