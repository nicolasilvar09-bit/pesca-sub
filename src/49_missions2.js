// ================= missões: mais tipos no dia, bônus por fechar as 3, sequência e missões da semana =================
// as do dia trocam a cada dia de jogo; as da semana seguem a semana real (renovam na segunda, junto com o ranking)

// ---------- novos tipos de missão do dia ----------
MISSION_POOL[0] = r => { const k = r.pick((NE ? ['guaiuba', 'ariaco', 'cavala', 'saramunete', 'garoupagato', 'pargo', 'cioba', 'xareu', 'sargo', 'badejo'] : AMZ ? ['tucunare', 'pacu', 'tambaqui', 'aruana', 'matrinxa', 'surubim', 'traira', 'jaraqui', 'douradorio', 'cachorra', 'pescada', 'apapa', 'aracu', 'bicudario'] : ['sargo', 'marimba', 'salema', 'garoupa', 'robalo', 'xareu', 'pampo', 'badejo', 'caranha', 'cocoroca', 'cioba', 'olhete', 'cangulo']).filter(k => SPECIES[k] && !defesoOf(k))), n = SPECIES[k].school ? 3 : 1; return { t: `Pegue ${n} ${SPECIES[k].name} dentro da medida`, ev: 'catch', key: k, goal: n, rew: 200 + n * 90 }; };
MISSION_POOL.push(
  r => { const s = r.pick(SPOTS.filter(s => s.r && !noTakeAt(s))); return { t: `Pegue 2 peixes na ${s.name}`, ev: 'catch', spot: s.id, goal: 2, rew: 420 }; },
  () => SV.cam ? { t: 'Fotografe 2 espécies diferentes', ev: 'photo', goal: 2, rew: 380, seen: [] } : { t: 'Pegue um peixe de 4 kg ou mais', ev: 'catchkg', kg: 4, goal: 1, rew: 380 },
  () => ({ t: 'Pegue 3 espécies diferentes no dia', ev: 'catchsp', goal: 3, rew: 380, seen: [] }),
);
// as 3 do dia feitas: bônus que cresce com a sequência de dias
function dailyAllDone() {
  const st = SV.dstreak = SV.dstreak || { last: 0, n: 0 }, d = SV.day || 1;
  if (st.last === d) return;
  st.n = st.last === d - 1 ? st.n + 1 : 1; st.last = d;
  const bonus = 250 + 60 * Math.min(st.n - 1, 6);
  SV.money += bonus; addXP(bonus / 3);
  toast(`🔥 As 3 missões do dia feitas! Bônus ${fmtR(bonus)}${st.n > 1 ? ` · ${st.n} dias seguidos` : ''}`, 5, 'gold'); AU.coin();
  weekEv('daily');
}

// ---------- missões da semana ----------
const WEEK_POOL = [
  r => { const n = r.pick([20, 30, 40]); return { t: `Pegue ${n} peixes dentro da medida`, ev: 'catch', goal: n, rew: n * 60 }; },
  r => { const kg = r.pick([40, 60, 90]); return { t: `Pesque ${kg} kg na semana`, ev: 'kg', goal: kg, rew: kg * 30 }; },
  r => { const n = r.pick([6, 8, 10]); return { t: `Pegue ${n} espécies diferentes`, ev: 'catchsp', goal: n, rew: n * 220, seen: [] }; },
  r => { const n = r.pick([3, 5]); return { t: `Feche as 3 missões do dia em ${n} dias`, ev: 'daily', goal: n, rew: n * 500 }; },
  () => ({ t: 'Jogue o Desafio da semana (Competições)', ev: 'chal', goal: 1, rew: 900 }),
  r => { const n = r.pick([2, 3]); return { t: `Participe de ${n} campeonatos`, ev: 'comp', goal: n, rew: n * 450 }; },
  r => { const n = r.pick([4, 6]); return { t: `Fotografe ${n} espécies diferentes`, ev: 'photo', goal: n, rew: n * 260, seen: [] }; },
  r => { const d = r.pick([18, 22, 26]); return { t: `Mergulhe até ${d} m`, ev: 'depth', d, goal: 1, rew: d * 70 }; },
  () => ({ t: 'Pegue um peixe-troféu (acima do tamanho comum)', ev: 'trophy', goal: 1, rew: 1500 }),
];
function ensureWeekly() {
  const wk = weekKey();
  if (SV.weekly && SV.weekly.wk === wk) return SV.weekly;
  const seed = [...wk].reduce((s, c) => s * 31 + c.charCodeAt(0), 11) >>> 0, m = mulberry(seed), r = { pick: a => a[Math.floor(m() * a.length)] };
  const idx = [...WEEK_POOL.keys()].filter(i => SV.cam || i !== 6);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(m() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  SV.weekly = { wk, list: idx.slice(0, 3).map(i => Object.assign(WEEK_POOL[i](r), { prog: 0, done: false })) };
  return SV.weekly;
}
// avança uma missão (do dia ou da semana); devolve true se mexeu
function missionStep(m, ev, data) {
  if (m.done || m.ev !== ev) return 0;
  if (ev === 'catch') return (!m.key || m.key === data.key) && (!m.spot || m.spot === data.spot) ? 1 : 0;
  if (ev === 'catchkg') return data.kg >= m.kg ? 1 : 0;
  if (ev === 'depth') return data.d >= m.d ? 1 : 0;
  if (ev === 'sell' || ev === 'kg') return data.v;
  if (ev === 'photo' || ev === 'catchsp') { if (m.seen.includes(data.key)) return 0; m.seen.push(data.key); return 1; }
  return 1;
}
function weekEv(ev, data = {}) {
  const W = ensureWeekly(); let ch = false;
  for (const m of W.list) {
    const inc = missionStep(m, ev, data); if (!inc) continue;
    m.prog = Math.min(m.goal, m.prog + inc); ch = true;
    if (m.prog >= m.goal) { m.done = true; SV.money += m.rew; addXP(m.rew / 3); toast(`⭐ Missão da semana cumprida: ${m.t}! +${fmtR(m.rew)}`, 5, 'gold'); AU.coin(); buzz([40, 60, 40, 60, 40]); }
  }
  if (ch) save();
}
function weekLeft() { const d = new Date(), wd = d.getDay() || 7, left = 8 - wd; return left <= 1 ? 'renova amanhã' : `renova em ${left} dias`; }
function weeklyHTML() {
  const W = ensureWeekly(), st = SV.dstreak || { n: 0, last: 0 }, alive = st.last >= (SV.day || 1) - 1 ? st.n : 0;
  return `<div class="n" style="margin:14px 0 6px">⭐ Missões da semana <span class="d">· ${weekLeft()} (segunda-feira)</span></div><div class="list">` +
    W.list.map(m => `<div class="it"><div style="flex:1"><div class="n">${m.done ? '✓ ' : ''}${m.t}</div><div class="d">${m.ev === 'kg' ? fmtKg(m.prog) + ' de ' + m.goal + ' kg' : Math.floor(m.prog) + ' de ' + m.goal} · recompensa ${fmtR(m.rew)}</div><div class="bar"><i style="width:${Math.round(m.prog / m.goal * 100)}%"></i></div></div><b style="color:${m.done ? 'var(--acc)' : 'inherit'}">${m.done ? 'FEITA' : ''}</b></div>`).join('') + '</div>' +
    `<div class="it" style="margin-top:8px"><div class="d">🔥 Feche as 3 missões do dia para ganhar bônus: ${fmtR(250)} no primeiro dia, e mais ${fmtR(60)} por dia seguido (até ${fmtR(610)}).${alive > 0 ? ` <b style="color:var(--acc2)">Sequência atual: ${alive} dia(s).</b>` : ''}</div></div>`;
}
