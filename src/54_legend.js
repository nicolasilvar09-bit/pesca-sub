// ================= peixes lendários: um por destino, com nome, pistas e uma caçada de paciência =================
// 1) boato no rádio  2) três pistas em pontos diferentes (mergulhe perto para achar)  3) o lendário aparece no
// ponto dele só no amanhecer ou no fim da tarde, uma vez por dia. Desconfiado: só chega perto de quem fica parado.
// Errou o tiro, nadou em cima ou ele escapou do arpão: some e só volta no dia seguinte.
const LEGENDS = {
  cv: { key: 'badejo', name: 'O Velho da Laje', mul: 1.45, home: ['lajefunda', 'laje', 'pedrameio'], prize: 6000,
    rumor: 'Seu Lino no rádio: "Tem um badejo-quadrado do tamanho de uma porta rondando a baía. Os antigos chamam de O Velho da Laje. Ninguém nunca tirou ele de lá."',
    clues: ['Uma escama do tamanho de uma moeda grande, presa na pedra.', 'Um pescador da marina mostra no celular a foto de uma sombra enorme saindo da toca.', 'Uma toca com a entrada lisa de tanto um peixe grande entrar e sair.'],
    lore: 'Badejo-quadrado de mais de 1,6 m que vive há décadas na mesma laje. Dizem que já quebrou três arpões.' },
  ne: { key: 'cavala', name: 'A Flecha do Pontal', mul: 1.4, home: ['parcel_ne', 'paredefunda', 'sueste'], prize: 6000,
    rumor: 'Os jangadeiros comentam: "Uma cavala comprida como uma canoa passa no parcel quando o sol nasce. Chamam ela de A Flecha do Pontal."',
    clues: ['Um cardume de sardinha estourando na superfície, como se algo enorme caçasse por baixo.', 'Uma linha de pesca cortada com um corte limpo, de dente afiado.', 'Um velho jangadeiro conta que viu A Flecha pular inteira para fora da água.'],
    lore: 'Cavala de quase 2 m que caça sozinha no parcel ao amanhecer. Passa rápido e não dá segunda chance.' },
  amz: { key: 'tucunare', name: 'O Imperador do Igapó', mul: 1.4, home: ['igapo', 'lago', 'pocao'], prize: 6000,
    rumor: 'Na vila contam: "No igapó mora um tucunaré-açu de um metro, com a pinta do rabo brilhando como um olho. É O Imperador."',
    clues: ['Peixinhos pulando fora da água em pânico, perto da galhada.', 'Uma marca de ataque enorme num isca artificial perdida no tronco.', 'Um ribeirinho jura que viu a pinta do rabo dele brilhando debaixo da água escura.'],
    lore: 'Tucunaré-açu de 1 m, o maior que alguém já viu no Tapajós. Briga pelo território e conhece cada galho do igapó.' },
};
const LEG_HOURS = [[5, 8.5], [16.5, 19.5]];
const LEG = { f: null, phase: null, t: 0, shotSeen: false, chk: 0, cluesAt: null };
const legDef = () => LEGENDS[REGION];
function legState() { SV.leg = SV.leg || {}; return SV.leg[REGION] = SV.leg[REGION] || { stage: 0, clues: [], day: 0, caught: null, tries: 0 }; }
// os 3 pontos das pistas e o ponto do lendário (fixos por destino)
function legSpots() {
  const D = legDef(); if (!D) return null;
  if (LEG.cluesAt && LEG.cluesAt.region === REGION) return LEG.cluesAt;
  const home = D.home.map(spotById).find(Boolean) || SPOTS.find(s => s.r);
  const m = mulberry([...REGION].reduce((s, c) => s * 31 + c.charCodeAt(0), 3));
  const pool = SPOTS.filter(s => s.r && s !== home && !noTakeAt(s)).sort((a, b) => a.id < b.id ? -1 : 1);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(m() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return LEG.cluesAt = { region: REGION, home, clues: pool.slice(0, 3) };
}
const legHour = () => { const h = SV.tod || 0; return LEG_HOURS.some(([a, b]) => h >= a && h < b); };

function updateLegend(dt) {
  const D = legDef(); if (!D || !started || COMP.on) return;
  const L = legState(), S = legSpots();
  if ((LEG.chk -= dt) <= 0) {
    LEG.chk = 1;
    // boato: depois do 2º dia no destino (ou nível 3)
    if (L.stage === 0 && ((SV.day || 1) >= 2 || level() >= 3) && P.mode === 'boat') { L.stage = 1; save(); toast('📻 ' + D.rumor, 9, 'gold'); setTimeout(() => toast(`🐉 Caçada ao lendário: ache as 3 pistas (Diário › História).`, 6, 'gold'), 9500); AU.coin(); }
    // pistas: mergulhe perto do ponto
    if (L.stage === 1 && P.mode === 'swim' && P.under) {
      S.clues.forEach((s, i) => {
        if (L.clues.includes(i) || Math.hypot(P.pos.x - s.x, P.pos.z - s.z) > s.r + 10) return;
        L.clues.push(i); addXP(120); AU.coin(); buzz([30, 40, 30]);
        toast(`🔎 Pista ${L.clues.length}/3: ${D.clues[i]}`, 7, 'gold');
        if (L.clues.length >= 3) { L.stage = 2; setTimeout(() => toast(`🐉 ${D.name} mora no ${S.home.name}. Ele só sai ao amanhecer (5h–8h30) ou no fim da tarde (16h30–19h30). Fique parado e espere ele chegar.`, 9, 'gold'), 7200); }
        save();
      });
    }
    // o lendário aparece: uma vez por dia, na hora certa, com você perto do ponto
    if (L.stage === 2 && !LEG.f && L.day !== (SV.day || 1) && legHour() && Math.hypot(P.pos.x - S.home.x, P.pos.z - S.home.z) < 220) legSpawn(D, L, S.home);
  }
  if (LEG.f) legTick(dt, D, L);
}
function legSpawn(D, L, S) {
  const sp = SPECIES[D.key]; if (!sp || !POOLS[D.key]) return;
  L.day = SV.day || 1; L.tries++; save();
  spawnGroup(S, D.key, 1, 1); const f = FISHES[FISHES.length - 1]; if (!f || f.key !== D.key) return;
  f.len = sp.len[1] * D.mul; f.kg = sp.k * f.len ** 3; f.legend = true; f.giant = true;
  if (f.home) { f.home.used--; f.home = null; } f.state = 'wander'; f.radius = shapeOf(D.key, sp.shape).h * 0.45 * f.len;
  LEG.f = f; LEG.phase = 'out'; LEG.t = 420; LEG.shotSeen = false; LEG.warned = false;
  toast(`🐉 A água ficou quieta no ${S.name}... ${D.name} saiu para caçar. Fique parado no fundo e espere.`, 7, 'gold'); buzz([80, 60, 80]);
}
function legGone(msg) { const f = LEG.f; if (f && f.alive) f.remove(); LEG.f = null; LEG.phase = null; if (msg) toast(msg, 6, 'bad'); }
function legTick(dt, D, L) {
  const f = LEG.f;
  if (!f.alive) { LEG.f = null; return; } // pescado (legendCatch já cuidou) ou removido
  if (f.state === 'hooked') return;
  if ((LEG.t -= dt) <= 0 || !legHour() && LEG.phase === 'out' && LEG.t < 300) { legGone(`${D.name} voltou para a toca. Ele sai de novo amanhã, na mesma hora.`); return; }
  const d = f.pos.distanceTo(P.pos), swim = P.mode === 'swim' && P.under;
  if (LEG.phase === 'out') {
    // tiro errado: o barulho espanta
    if (GUN.state === 'flying' && !LEG.shotSeen) LEG.shotSeen = true;
    if (LEG.shotSeen && GUN.state !== 'flying' && f.state !== 'hooked') { LEG.phase = 'flee'; f.startFlee(); toast(`${D.name} sentiu o arpão passar e sumiu no azul! Amanhã tem outra chance.`, 6, 'bad'); }
    // nadou em cima dele: foge
    else if (swim && d < 7 && P.vel.length() > 0.6) { LEG.phase = 'flee'; f.startFlee(); toast(`Você chegou rápido demais: ${D.name} fugiu. Ele só se aproxima de quem espera parado.`, 6, 'bad'); }
    else if (f.state === 'flee' || f.state === 'tohole') { f.state = 'wander'; f.t = 4; }
    // quem espera parado por perto: ele vem ver de perto, devagar
    else if (swim && P.still > 2.2 && d < 26 && f.state !== 'curious') { f.state = 'curious'; f.t = rand(8, 12); if (!LEG.warned) { LEG.warned = true; toast(`🐉 ${D.name} está vindo... não se mexa.`, 4, 'gold'); buzz(40); } }
  } else if (LEG.phase === 'flee') {
    if (f.state !== 'flee') f.startFlee();
    if ((LEG.fleeT = (LEG.fleeT || 0) + dt) > 5) { LEG.fleeT = 0; legGone(); }
  }
}
// chamado no catchFish
function legendCatch(f) {
  const D = legDef(), L = legState(); if (!D) return;
  L.stage = 3; L.caught = { kg: Math.round(f.kg * 10) / 10, cm: Math.round(f.len * 100), day: SV.day || 1, date: Date.now() };
  SV.money += D.prize; addXP(1500); SV.mounted = SV.mounted || [];
  if (!SV.mounted.some(m => m.legend)) SV.mounted.unshift({ key: f.key, kg: f.kg, len: f.len, legend: true });
  LEG.f = null; LEG.phase = null; save();
  toast(`🐉 LENDÁRIO! Você pegou ${D.name}: ${fmtKg(f.kg)} kg, ${Math.round(f.len * 100)} cm! Prêmio de ${fmtR(D.prize)}.`, 9, 'gold'); AU.coin(); buzz([100, 60, 100, 60, 200]);
  setTimeout(() => toast('O troféu dele vai para a parede do rancho, e o cartão especial já está no álbum.', 6, 'gold'), 4000);
}
function legHTML() {
  const D = legDef(); if (!D) return '';
  const L = legState(), S = legSpots(), sp = SPECIES[D.key];
  let h = `<div class="n" style="margin:14px 0 6px">🐉 Lendário deste destino</div><div class="it" style="flex-direction:column;align-items:stretch;gap:6px">`;
  if (L.stage === 0) return h + '<div class="d">Ainda não se ouviu nenhum boato por aqui... Continue pescando: o rádio dos pescadores avisa.</div></div>';
  h += `<div class="n">${D.name} · ${sp.name} ${L.stage === 3 ? '· <b style="color:var(--acc2)">PESCADO!</b>' : ''}</div><div class="d">${D.lore}</div>`;
  if (L.stage === 1) h += `<div class="d">Pistas encontradas: <b>${L.clues.length}/3</b>. Mergulhe perto destes pontos para procurar sinais dele:</div>` +
    S.clues.map((s, i) => `<div class="row2" style="margin-top:2px"><span class="d">${L.clues.includes(i) ? '✅ ' + D.clues[i] : '🔎 ' + s.name + ' (' + s.depth + ')'}</span>${L.clues.includes(i) ? '' : `<button class="btn alt" data-legdest="${s.id}">IR</button>`}</div>`).join('');
  if (L.stage === 2) h += `<div class="d">Ele mora no <b>${S.home.name}</b> (${S.home.depth}). Sai só ao amanhecer (5h–8h30) ou no fim da tarde (16h30–19h30), uma vez por dia. Desça, fique <b>parado</b> e espere ele chegar perto. Errou ou nadou em cima? Só amanhã. Tentativas: ${L.tries}.</div><div class="row2"><span></span><button class="btn gold" data-legdest="${S.home.id}">IR PARA O ${S.home.name.toUpperCase()}</button></div>`;
  if (L.stage === 3) h += `<div class="d">Pescado no dia ${L.caught.day}: <b>${fmtKg(L.caught.kg)} kg</b>, ${L.caught.cm} cm, em ${L.tries} tentativa(s). O troféu está no rancho.</div>`;
  return h + '</div>';
}
function bindLeg(B) { B.querySelectorAll('[data-legdest]').forEach(b => b.onclick = () => { SV.dest = b.dataset.legdest; save(); closePanels(); toast('Destino marcado: siga a seta laranja.', 3); AU.click(); }); }
