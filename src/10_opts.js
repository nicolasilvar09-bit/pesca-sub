// ================= opções: qualidade, controles, som =================
const OPT_KEY = 'deepspear_opt';
const QUALITY = [
  { name: 'Baixa', pr: 0.65, terr: 420, decor: 45, fish: 70 },
  { name: 'Média', pr: 1.15, terr: 650, decor: 90, fish: 110 },
  { name: 'Alta', pr: 2, terr: 950, decor: 140, fish: 150 },
];
const OPT = { q: matchMedia('(pointer:coarse)').matches ? 1 : 2, sens: 1, inv: false, vol: 0.8, mus: true, vib: true, third: true };
try { Object.assign(OPT, JSON.parse(localStorage.getItem(OPT_KEY) || '{}')); } catch (e) { }
const QF = () => QUALITY[OPT.q] || QUALITY[1];
function saveOpt() { try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (e) { } }
function applyOpt() {
  if (renderer && !/lite/.test(location.search)) { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QF().pr)); if (window.__fit) window.__fit(); }
  if (AU.master) AU.master.gain.value = OPT.vol;
}
function optRow(label, ctrl) { return `<div class="it"><div class="n">${label}</div><div style="display:flex;gap:6px;align-items:center">${ctrl}</div></div>`; }
function renderOpt() {
  const seg = (k, opts) => opts.map(([v, n]) => `<button class="btn ${OPT[k] === v ? 'gold' : 'alt'}" data-opt="${k}" data-v="${v}">${n}</button>`).join('');
  $('optBody').innerHTML = '<div class="list">' +
    optRow('Qualidade gráfica', seg('q', QUALITY.map((q, i) => [i, q.name]))) +
    optRow('Sensibilidade da câmera', `<input type="range" min="0.4" max="2.2" step="0.1" value="${OPT.sens}" data-range="sens"><b>${OPT.sens.toFixed(1)}×</b>`) +
    optRow('Inverter eixo vertical', seg('inv', [[false, 'NÃO'], [true, 'SIM']])) +
    optRow('Volume', `<input type="range" min="0" max="1" step="0.05" value="${OPT.vol}" data-range="vol"><b>${Math.round(OPT.vol * 100)}%</b>`) +
    optRow('Música', seg('mus', [[true, 'LIGADA'], [false, 'DESLIGADA']])) +
    optRow('Vibração', seg('vib', [[true, 'LIGADA'], [false, 'DESLIGADA']])) +
    optRow('Vista ao nadar', seg('third', [[true, '3ª PESSOA'], [false, '1ª PESSOA']])) +
    optRow('Progresso', `<button class="btn alt" id="optReset">APAGAR SAVE</button>`) +
    `</div><div class="it" style="margin-top:8px"><div class="d">Qualidade baixa reduz a resolução e o alcance do detalhe do fundo e dos peixes. Use se o celular esquentar ou travar.</div></div>`;
  const B = $('optBody');
  B.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
    const k = b.dataset.opt, raw = b.dataset.v; OPT[k] = raw === 'true' ? true : raw === 'false' ? false : +raw;
    if (k === 'third' && P.mode !== 'swim') THIRD = OPT.third;
    saveOpt(); applyOpt(); AU.click(); renderOpt();
  });
  B.querySelectorAll('[data-range]').forEach(r => r.oninput = () => { OPT[r.dataset.range] = +r.value; r.nextElementSibling.textContent = r.dataset.range === 'vol' ? Math.round(OPT.vol * 100) + '%' : OPT.sens.toFixed(1) + '×'; saveOpt(); applyOpt(); });
  $('optReset').onclick = () => { if (confirm('Apagar todo o progresso (dinheiro, equipamentos, recordes)? Não dá para desfazer.')) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); } };
}
function openOpt() { renderOpt(); $('optPanel').classList.remove('hide'); paused = true; }
function setupOpt() {
  $('optClose').onclick = () => { $('optPanel').classList.add('hide'); paused = false; };
  const open = e => { e.preventDefault(); e.stopPropagation(); AU.init(); openOpt(); };
  $('optChip').addEventListener('pointerdown', open); $('optBtn').addEventListener('click', open);
  THIRD = OPT.third; applyOpt();
}
