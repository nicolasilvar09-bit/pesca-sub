// ================= primeira impressão: boas-vindas, primeiro peixe garantido e dicas na hora certa =================
const INTRO = { fish: null, uw: 0, tipT: 0 };

// ponto fácil para a primeira pescaria: o mais perto da marina, raso, sem correnteza e onde se pode pescar
function beginnerSpot() {
  const b = BOAT.pos;
  return SPOTS.filter(s => s.r && !s.cur && !s.noTake && s.id !== 'plataforma' && -H(s.x, s.z) < 12 && Math.hypot(s.x - b.x, s.z - b.z) > 60)
    .sort((a, c) => Math.hypot(a.x - b.x, a.z - b.z) - Math.hypot(c.x - b.x, c.z - b.z))[0];
}
// chamado ao tocar JOGAR
function introStart() {
  if (SV.tut !== 0 || SV.welcomed) return;
  SV.welcomed = true;
  const s = beginnerSpot(); if (s) SV.dest = s.id;
  save(); showWelcome(s);
}
function showWelcome(s) {
  const el = document.createElement('div'); el.id = 'welcome'; el.className = 'panel';
  const step = (ic, t, d) => `<div class="it" style="gap:12px;justify-content:flex-start;text-align:left"><span style="font-size:28px">${ic}</span><div><div class="n">${t}</div><div class="d">${d}</div></div></div>`;
  el.innerHTML = `<div class="card" style="max-width:520px">
    <h2>Bem-vindo ao ${AMZ ? 'Tapajós' : NE ? 'Nordeste' : 'mar de Angra'}!</h2>
    <div class="sub">Você é mergulhador de pesca sub: desce no fôlego, escolhe o peixe e vende o que pescar.</div>
    <div class="list">${step('🚤', 'Pilote até o ponto', `Siga a seta laranja no topo até ${s ? `${s.name}, a ${Math.round(Math.hypot(s.x - BOAT.pos.x, s.z - BOAT.pos.z) / 10) * 10} m daqui` : 'o ponto de pesca'}.`)}
    ${step('🤿', 'Mergulhe e fique parado', 'Peixe tem medo de quem nada atrás dele. Parado no fundo, ele vem ver você.')}
    ${step('🎯', 'Mire e atire', 'Mira verde = ao alcance. Na cabeça o peixe apaga na hora. Respeite a medida mínima.')}</div>
    <div style="display:flex;justify-content:center;margin-top:12px"><button class="btn gold play" id="welOk">BORA PESCAR</button></div></div>`;
  document.body.appendChild(el); paused = true;
  $('welOk').onclick = () => { el.remove(); paused = false; AU.click(); };
}

// ---------- primeiro peixe: um peixe manso, na medida, aparece quando o tutorial pede o tiro ----------
const tutKey = () => ['sargo', 'ariaco', 'tucunare', 'guaiuba', 'pacu'].find(k => SPECIES[k] && spInRegion(k));
function spawnTutFish() {
  const key = tutKey(); if (!key) return;
  const sp = SPECIES[key], len = Math.max(sp.min * 1.3, sp.len[0]);
  const f0 = camFwd(_t1); f0.y = 0; if (f0.lengthSq() < 1e-4) f0.set(1, 0, 0); f0.normalize();
  const pos = P.pos.clone().addScaledVector(f0, 7); pos.y = Math.max(P.pos.y, H(pos.x, pos.z) + 0.8);
  const spot = spotById(SV.dest) || SPOTS.find(s => s.r);
  const f = new Fish(key, spot, pos, { len }); f.radius *= 1.5; f.tut = true; f.state = 'curious'; f.t = 8; FISHES.push(f);
  INTRO.fish = f; toast(`Olha um ${sp.name.toLowerCase()} vindo ver você! Fique parado e espere ele chegar perto.`, 5, 'gold');
}
function updateTutFish(dt) {
  if (!tutActive() || SV.tut < 4 || SV.tut > 6 || P.mode !== 'swim') return;
  if (P.under) INTRO.uw += dt; else INTRO.uw = 0;
  const f = INTRO.fish;
  if ((!f || !f.alive) && P.under && INTRO.uw > 2.5 && P.stringer.length === 0) { spawnTutFish(); return; }
  if (!f || !f.alive || f.state === 'hooked' || f.state === 'dead') return;
  // manso: não foge nem entra na toca, fica rodeando o mergulhador
  if (f.state !== 'curious' || f.t < 1) { f.state = 'curious'; f.t = 6; f.home = null; }
  f.speed = f.sp.cruise * (f.pos.distanceTo(P.pos) > 5 ? 1.2 : 0.6);
}

// ---------- dicas que aparecem uma vez, na hora certa ----------
function tipOnce(id, msg, kind) {
  SV.tips = SV.tips || {}; if (SV.tips[id] || INTRO.tipT > T || COMP.on) return false;
  SV.tips[id] = 1; INTRO.tipT = T + 20; toast(msg, 6, kind); save(); return true;
}
let tipChk = 0;
function updateTips(dt) {
  if ((tipChk -= dt) > 0) return; tipChk = 0.5;
  if (tutActive() && SV.tut < 4) return; // nos primeiros passos o tutorial fala sozinho
  const aim = aimOnFish();
  if (aim) {
    const s = aim.f.sp;
    if (s.protected) tipOnce('prot', `${s.name} é espécie protegida: atirar dá multa pesada. Só foto!`, 'bad');
    else if (aim.f.len < s.min) tipOnce('small', `Esse ${s.name.toLowerCase()} está abaixo da medida mínima (${Math.round(s.min * 100)} cm). Atirar dá multa: espere um maior.`, 'bad');
    else if (s.ornamental) tipOnce('orn', `${s.name} é peixe ornamental: ninguém compra. Deixe no mar.`);
  }
  if (P.mode === 'swim' && P.stringer.length >= 4) tipOnce('fieira', 'Fieira pesada gasta mais fôlego e chama predador. Suba e guarde no barco.');
  if (P.mode === 'swim' && P.under && -P.pos.y > 7) tipOnce('fundo', 'Quanto mais fundo, mais rápido o fôlego acaba. Volte com folga: apagão perde a fieira.');
  if (P.mode === 'boat' && SV.fuel < tankMax() * 0.25) tipOnce('fuel', 'Combustível baixo! Abasteça na marina (LOJA › Combustível) antes de ir longe.', 'bad');
  if ((SV.tod || 12) >= 18 && !SV.light && P.mode === 'swim') tipOnce('noite', 'Está escurecendo. A lanterna (LOJA › Equipamentos) acende sozinha no fundo e à noite.');
  if (!tutActive() && SV.soldOnce && SV.money >= 700) tipOnce('upgrade', 'Com esse dinheiro já dá para um arbalete maior: mais alcance e força para peixe grande (LOJA › Equipamentos).', 'gold');
  if (!tutActive() && SV.tut >= TUT.length && SV.soldOnce && SV.tips && SV.tips.upgrade) tipOnce('next', 'Dica: o Boletim do mar mostra visibilidade e correnteza do dia. Missões e campeonatos pagam bem (LOJA).');
}
function updateIntro(dt) { updateTutFish(dt); updateTips(dt); }
// botões que só atrapalham no começo: aparecem depois do tutorial
function introHideButtons() { if (tutActive()) ['bCall', 'bView', 'bWp', 'bChum', 'bPhoto'].forEach(id => show(id, false)); }
