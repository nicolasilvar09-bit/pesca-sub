// ================= instalar como app: botão no menu (Android/PC instala direto; iPhone mostra o passo a passo) =================
// o jogo já é um app instalável (manifest + sw.js): tela cheia, ícone na tela inicial e abre sem internet
const INST = { ev: null };
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function instBtn() {
  if (isStandalone()) return null;
  let b = $('instBtn'); if (b) return b;
  const o = $('optBtn'); if (!o) return null;
  b = document.createElement('button'); b.className = 'btn alt'; b.id = 'instBtn'; b.textContent = '📲 INSTALAR'; b.style.cssText = 'margin:8px 0 0 8px';
  b.onclick = installApp; o.after(b); return b;
}
async function installApp() {
  AU.init(); AU.click();
  if (INST.ev) {
    INST.ev.prompt(); const r = await INST.ev.userChoice.catch(() => null); INST.ev = null;
    if (r && r.outcome === 'accepted') { const b = $('instBtn'); if (b) b.remove(); }
    return;
  }
  const box = $('onInv'); if (!box) return;
  box.innerHTML = isIOS()
    ? `<div class="n">📲 Instalar no iPhone</div><div class="d" style="line-height:1.5;margin-top:4px">1. No Safari, toque em <b>Compartilhar</b> (o quadrado com a seta para cima).<br>2. Toque em <b>Adicionar à Tela de Início</b>.<br>3. Abra o Deep Spear pelo ícone: tela cheia e abre mais rápido.<br><b style="color:var(--acc2)">Importante:</b> no iPhone o app guarda o progresso separado do Safari. Antes de instalar, aqui no Safari vá em Opções › <b>COPIAR CÓDIGO</b>; depois, no app, Opções › <b>COLAR CÓDIGO</b>.</div><div style="text-align:right;margin-top:8px"><button class="btn gold" id="instOk">ENTENDI</button></div>`
    : `<div class="n">📲 Instalar o jogo</div><div class="d" style="line-height:1.5;margin-top:4px">No menu do navegador (⋮), toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>. O jogo abre em tela cheia, mais rápido e até sem internet. Seu progresso continua o mesmo.</div><div style="text-align:right;margin-top:8px"><button class="btn gold" id="instOk">ENTENDI</button></div>`;
  box.classList.remove('hide'); $('instOk').onclick = () => box.classList.add('hide');
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); INST.ev = e; instBtn(); });
addEventListener('appinstalled', () => { const b = $('instBtn'); if (b) b.remove(); toast('Jogo instalado! Abra pelo ícone na tela inicial.', 4, 'gold'); });
// celular sem o aviso do navegador (iPhone, ou Android que ainda não ofereceu): mostra o botão com as instruções
if (matchMedia('(pointer:coarse)').matches) instBtn();
