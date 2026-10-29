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
// resolução dinâmica: fração da resolução da qualidade atual (baixa sozinha quando o FPS cai)
const AQ = { t: 0, n: 0, sum: 0, scale: 1, drops: 0 };
function saveOpt() { try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (e) { } }
function applyOpt() {
  if (renderer && !/lite/.test(location.search)) { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QF().pr) * AQ.scale); if (window.__fit) window.__fit(); }
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
    optRow('Compensar ouvidos', seg('autoEq', [[false, 'MANUAL'], [true, 'AUTOMÁTICO']])) +
    optRow('Vista ao nadar', seg('third', [[true, '3ª PESSOA'], [false, '1ª PESSOA']])) +
    optRow('Backup em arquivo' + (SV.backupAt ? `<div class="d">Último: ${new Date(SV.backupAt).toLocaleDateString('pt-BR')}</div>` : '<div class="d">Nunca feito</div>'), `<button class="btn gold" id="optFile">SALVAR ARQUIVO</button><button class="btn alt" id="optOpen">ABRIR ARQUIVO</button>`) +
    optRow('Backup por código', `<button class="btn alt" id="optExp">COPIAR CÓDIGO</button><button class="btn alt" id="optImp">COLAR CÓDIGO</button>`) +
    `<div class="it" id="optBk" style="display:none;flex-direction:column;align-items:stretch;gap:6px"><div class="d" id="optBkTxt"></div><textarea id="optCode" rows="4" style="width:100%;box-sizing:border-box;font:12px monospace;background:#031018;color:#cfe;border:1px solid var(--line);border-radius:8px;padding:6px"></textarea><div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn gold hide" id="optLoad">CARREGAR ESTE PROGRESSO</button></div></div>` +
    optRow('Progresso', `<button class="btn alt" id="optReset">APAGAR SAVE</button>`) +
    `</div><div class="it" style="margin-top:8px"><div class="d">Qualidade baixa reduz a resolução e o alcance do detalhe do fundo e dos peixes. Use se o celular esquentar ou travar.</div></div>`;
  const B = $('optBody');
  B.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
    const k = b.dataset.opt, raw = b.dataset.v; OPT[k] = raw === 'true' ? true : raw === 'false' ? false : +raw; if (k === 'q') OPT.qManual = true;
    if (k === 'third' && P.mode !== 'swim') THIRD = OPT.third;
    saveOpt(); applyOpt(); AU.click(); renderOpt();
  });
  B.querySelectorAll('[data-range]').forEach(r => r.oninput = () => { OPT[r.dataset.range] = +r.value; r.nextElementSibling.textContent = r.dataset.range === 'vol' ? Math.round(OPT.vol * 100) + '%' : OPT.sens.toFixed(1) + '×'; saveOpt(); applyOpt(); });
  // backup: o save inteiro vira um código de texto (copiar e colar em outro app, navegador ou aparelho)
  const bk = $('optBk'), code = $('optCode'), txt = $('optBkTxt'), load = $('optLoad');
  $('optExp').onclick = async () => {
    SV.backupAt = Date.now(); const c = backupCode();
    bk.style.display = 'flex'; load.classList.add('hide'); code.value = c; code.select();
    let ok = false; try { await navigator.clipboard.writeText(c); ok = true; } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) { } }
    txt.textContent = ok ? 'Código copiado! Guarde nas Notas ou mande para você mesmo no WhatsApp. Para recuperar, toque em COLAR CÓDIGO.' : 'Selecione e copie o código abaixo (segure em cima → Selecionar tudo → Copiar) e guarde nas Notas.';
    AU.click();
  };
  $('optImp').onclick = async () => {
    bk.style.display = 'flex'; load.classList.remove('hide'); code.value = ''; txt.textContent = 'Cole aqui o código do backup e toque em CARREGAR.';
    try { const c = await navigator.clipboard.readText(); if (c && c.startsWith('DS1:')) code.value = c; } catch (e) { }
    code.focus();
  };
  $('optFile').onclick = async () => { bk.style.display = 'flex'; load.classList.add('hide'); code.value = ''; txt.textContent = await saveBackupFile(); AU.click(); };
  $('optOpen').onclick = () => openBackupFile(c => { bk.style.display = 'flex'; load.classList.remove('hide'); code.value = c; txt.textContent = 'Arquivo lido. Toque em CARREGAR para restaurar.'; load.onclick(); });
  load.onclick = () => {
    const c = code.value.trim();
    try {
      if (!c.startsWith('DS1:')) throw 0;
      const d = JSON.parse(decodeURIComponent(escape(atob(c.slice(4)))));
      if (typeof d !== 'object' || d.money == null) throw 0;
      if (!confirm(`Carregar este progresso (${fmtR(d.money)}, ${(d.guns || []).length} arbalete(s), ${(d.boats || [0]).length} lancha(s))? O progresso atual deste aparelho será substituído.`)) return;
      SAVE_LOCK = true; d.savedAt = Date.now(); const j = JSON.stringify(d); localStorage.setItem(SAVE_KEY, j); idbPut(j); setTimeout(() => location.reload(), 300);
    } catch (e) { txt.textContent = 'Código inválido. Confira se copiou ele inteiro, começando com DS1:'; AU.bad(); }
  };
  $('optReset').onclick = () => { if (confirm('Apagar todo o progresso (dinheiro, equipamentos, recordes)? Não dá para desfazer.')) { SAVE_LOCK = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { } idbDel(); setTimeout(() => location.reload(), 300); } };
}
function openOpt() { renderOpt(); $('optPanel').classList.remove('hide'); paused = true; }
function setupOpt() {
  $('optClose').onclick = () => { $('optPanel').classList.add('hide'); paused = false; };
  const open = e => { e.preventDefault(); e.stopPropagation(); AU.init(); openOpt(); };
  $('optChip').addEventListener('pointerdown', open); $('optBtn').addEventListener('click', open);
  THIRD = OPT.third; applyOpt();
}
