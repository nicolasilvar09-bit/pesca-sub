// ================= fotografia submarina e guia de espécies =================
const CAM_PRICE = 800;
// ficha do guia: nome científico, onde vive, curiosidade
const SP_INFO = {
  sargo: ['Archosargus probatocephalus', 'Costões e lajes rasas, em grupo.', 'Tem dentes largos parecidos com os humanos, bons para quebrar mariscos e cracas.'],
  marimba: ['Diplodus argenteus', 'Costões rasos com ondulação, em cardume.', 'A mancha preta antes da cauda engana predadores sobre onde fica a cabeça.'],
  salema: ['Anisotremus virginicus', 'Pedras e tocas rasas, em grupos.', 'As listras azuis e amarelas ajudam o cardume a se manter junto.'],
  budiao: ['Sparisoma spp.', 'Recifes e costões com algas.', 'Raspa algas das pedras com o bico e pode mudar de cor e de sexo ao longo da vida.'],
  frade: ['Pomacanthus paru', 'Costões e recifes, aos pares.', 'Peixe-anjo: o jovem é preto com listras amarelas e faz limpeza em outros peixes.'],
  garoupa: ['Epinephelus marginatus', 'Tocas em costões e lajes.', 'Nasce fêmea e pode virar macho depois de grande. Cresce devagar, por isso a medida mínima importa.'],
  badejo: ['Mycteroperca bonaci', 'Lajes e costões mais fundos.', 'Caçador de emboscada: espera parado e dá uma arrancada curta.'],
  caranha: ['Lutjanus cyanopterus', 'Naufrágios e pedras fundas.', 'Um dos maiores vermelhos do Atlântico; caça mais no fim do dia e à noite.'],
  robalo: ['Centropomus undecimalis', 'Estuários, foz de rio e costões rasos.', 'Tolera água doce e salobra; a linha lateral preta é a marca registrada.'],
  tainha: ['Mugil liza', 'Meia-água em baías e estuários.', 'Forma grandes cardumes que migram pela costa no inverno.'],
  pampo: ['Trachinotus spp.', 'Meia-água perto de costões e praias.', 'Nadador rápido, de corpo alto e prateado.'],
  enchova: ['Pomatomus saltatrix', 'Meia-água e costões expostos.', 'Voraz, com dentes afiados; ataca cardumes de sardinha.'],
  sororoca: ['Scomberomorus brasiliensis', 'Água aberta, de passagem.', 'Parente da cavala, muito veloz; as pintas douradas brilham ao sol.'],
  xareu: ['Caranx hippos', 'Água aberta e beira de costão.', 'Curioso: costuma vir ver o mergulhador de perto.'],
  olhodeboi: ['Seriola dumerili', 'Água azul, parcéis e costões fundos.', 'Um dos maiores peixes de passagem; briga forte e por muito tempo.'],
  dourado: ['Coryphaena hippurus', 'Mar aberto, perto de objetos boiando.', 'Cresce muito rápido; as cores mudam quando está agitado.'],
  bicuda: ['Sphyraena spp.', 'Água aberta e parcéis.', 'Barracuda: espreita parada e ataca numa arrancada.'],
  dentao: ['Lutjanus jocu', 'Costões fundos e naufrágios.', 'Desconfiado e raro; a marca clara embaixo do olho entrega a espécie.'],
  cherne: ['Hyporthodus niveatus', 'Tocas fundas e naufrágios.', 'Cresce devagar e está em declínio: pegar só os grandes e com moderação.'],
  cocoroca: ['Haemulon aurolineatum', 'Costões rasos, em cardumes grandes.', 'Ronca quando é pega: range os dentes da garganta, daí o nome em inglês "grunt".'],
  canhanha: ['Archosargus rhomboidalis', 'Costões e fundos com algas perto da costa.', 'Parente do sargo, com finas listras douradas e uma mancha escura no ombro.'],
  peixegalo: ['Selene setapinnis', 'Meia-água, perto de costões e praias.', 'Corpo alto e fininho, quase transparente de frente: some quando vira de cara para você.'],
  cangulo: ['Balistes capriscus', 'Pedras e naufrágios.', 'Peixe-porco: tem um "gatilho" na dorsal que trava o espinho em pé dentro da toca.'],
  cioba: ['Lutjanus analis', 'Pedras fundas e naufrágios.', 'Vermelho de carne nobre; as linhas azuis embaixo do olho entregam a espécie.'],
  olhete: ['Seriola lalandi', 'Água azul, parcéis e costões expostos.', 'Primo do olho-de-boi, com a faixa amarela marcada e cauda amarela.'],
  albacora: ['Thunnus albacares', 'Mar aberto, passa perto de parcéis fundos.', 'Atum de nadadeiras amarelas: nadador de longa distância, chega a mais de 100 kg.'],
  mero: ['Epinephelus itajara', 'Naufrágios e tocas grandes.', 'Protegido por lei no Brasil: pode passar de 2 m e 300 kg. Só foto!'],
};
const GUIDE_EXTRA = [['tartaruga', 'Tartaruga-verde', 'Chelonia mydas', 'Costões com algas, sobe para respirar.', 'Ameaçada de extinção e protegida. Só foto!'],
  ['raia', 'Raia-manteiga', 'Dasyatis hypostigma', 'Fundo de areia perto das pedras.', 'Passa o dia meio enterrada na areia. O ferrão na cauda é só defesa: nunca pise ou encoste.'],
  ['golfinho', 'Boto-cinza', 'Sotalia guianensis', 'Baías e estuários, em grupos.', 'Símbolo da Baía da Ilha Grande. Protegido: só olhe e fotografe.'],
  ['moreia', 'Moreia-pintada', 'Gymnothorax moringa', 'Tocas de costão e naufrágio.', 'Abre e fecha a boca o tempo todo para respirar, não é ameaça. Mas morde se você enfiar a mão na toca.']];

// alvo no centro da tela: peixe ou tartaruga até 8 m
function photoTarget() {
  const o = camera.position, d = camFwd(_a); let best = null, bt = 8;
  const test = (pos, rad, obj) => { _b.subVectors(pos, o); const t = _b.dot(d); if (t < 0.4 || t > bt) return; const off = _b.addScaledVector(d, -t).length(); if (off < rad + 0.2) { best = { obj, t, off: off / (rad + 0.2) }; bt = t; } };
  for (const f of FISHES) if (f.vis && f.state !== 'dead' && f.state !== 'hooked') test(f.pos, f.radius, f);
  for (const T of TURTLES) test(T.pos, 0.55, { turtle: true, key: AMZ ? 'tracaja' : 'tartaruga', pos: T.pos });
  for (const R of RAYS) if (R.g.visible) test(R.pos, 0.4 * R.s, { turtle: true, key: R.key, pos: R.pos });
  for (const d of DOLPH.pod) test(d.pos, 0.6, { turtle: true, key: AMZ ? 'boto' : 'golfinho', pos: d.pos });
  amzTargets(test);
  moreiaTargets(test);
  return best;
}
function takePhoto() {
  if (P.mode !== 'swim' || !P.under || !SV.cam) return;
  const fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = 0.85; void fl.offsetWidth; fl.style.transition = 'opacity .35s'; fl.style.opacity = 0;
  AU.tone(2400, 1800, 0.04, 0.05, 'square'); AU.tone(900, 700, 0.06, 0.04, 'square', 0.05); P.noise = Math.max(P.noise, 0.45);
  const tg = photoTarget();
  if (!tg) { toast('Foto de água azul. Mire num peixe ou numa tartaruga.', 2); return; }
  const o = tg.obj, key = o.key, sp = SPECIES[key], name = sp ? sp.name : (GUIDE_EXTRA.find(g => g[0] === key) || [0, 'Tartaruga-verde'])[1];
  // valor: espécie (raro/protegido valem mais), tamanho, distância, centralizado e peixe calmo
  let base = o.moreia ? 150 : key === 'golfinho' || key === 'boto' || key === 'peixeboi' ? 320 : key === 'jacare' ? 280 : key === 'raia' || key === 'arraiario' ? 180 : o.turtle ? 260 : sp.protected ? 380 : sp.rare ? 300 : sp.ornamental ? 110 : 40 + sp.price * 1.4;
  const size = o.turtle || o.moreia ? 1 : clamp(o.len / sp.len[1], 0.4, 1.5), dist = 1 - smooth(2.2, 8, tg.t) * 0.6, cen = 1 - tg.off * 0.4;
  const calm = o.turtle || o.moreia || o.state === 'wander' || o.state === 'curious' || o.state === 'hidden' ? 1.25 : 0.8;
  const D = SV.photoDay && SV.photoDay.day === SV.day ? SV.photoDay : (SV.photoDay = { day: SV.day, n: {} });
  const rep = D.n[key] || 0; D.n[key] = rep + 1;
  const score = Math.round(base * size * dist * cen * calm), pay = Math.round(score / (1 + rep * 0.8));
  SV.photos = SV.photos || {}; const first = !SV.photos[key];
  SV.photos[key] = Math.max(SV.photos[key] || 0, score);
  SV.money += pay + (first ? 150 : 0); addXP(pay / 4 + (first ? 40 : 0));
  toast(`Foto: ${name}${o.len ? ' · ~' + Math.round(o.len * 100) + ' cm' : ''} · nota ${score} · revista paga ${fmtR(pay)}${rep ? ' (já fotografou hoje)' : ''}`, 3.5, 'gold');
  if (first) toast(`${name} entrou no guia de espécies! +${fmtR(150)}`, 3.5, 'gold');
  AU.coin(); save();
}

// guia: uma ficha por espécie, revelada quando pescada ou fotografada
function guideHTML() {
  const seen = k => (SV.best && SV.best[k]) || (SV.photos && SV.photos[k]);
  const rows = Object.keys(SP_INFO).map(k => [k, SPECIES[k].name, ...SP_INFO[k]]).concat(GUIDE_EXTRA);
  const n = rows.filter(r => seen(r[0])).length;
  return `<div class="it" style="margin-bottom:8px"><div class="d">${n} de ${rows.length} espécies registradas. Pesque ou fotografe para liberar a ficha.${SV.cam ? '' : ' A câmera submarina está na aba Roupa e acessórios.'}</div></div><div class="list">` +
    rows.map(([k, name, sci, hab, fact]) => {
      const sp = SPECIES[k], tag = k === 'tartaruga' || k === 'peixeboi' || k === 'boto' || k === 'tracaja' || (sp && sp.protected) ? ' · <b style="color:var(--bad)">PROTEGIDO</b>' : sp && sp.rare ? ' · <b style="color:var(--acc)">RARO</b>' : sp && sp.ornamental ? ' · ornamental' : '';
      if (!seen(k)) return `<div class="it"><div><div class="n" style="opacity:.55">??? ${sp ? '· ' + ({ reef: 'costão', hole: 'toca', mid: 'meia-água', pelagic: 'água aberta' }[sp.habit]) : ''}</div><div class="d">Ainda não registrado.</div></div></div>`;
      const sw = sp ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${sp.col.side};border:2px solid ${sp.col.back};margin-right:6px"></span>` : '';
      return `<div class="it"><div><div class="n">${sw}${name} <i style="opacity:.6;font-weight:400">${sci}</i>${tag}</div><div class="d">${hab} ${fact}${sp && !sp.protected && !sp.ornamental ? ` Medida mínima ${Math.round(sp.min * 100)} cm.` : ''}</div>
        <div class="d">${SV.best && SV.best[k] ? 'Recorde ' + fmtKg(SV.best[k]) + ' kg' : ''}${SV.best && SV.best[k] && SV.photos && SV.photos[k] ? ' · ' : ''}${SV.photos && SV.photos[k] ? 'Melhor foto: nota ' + SV.photos[k] : ''}</div></div></div>`;
    }).join('') + '</div>';
}
