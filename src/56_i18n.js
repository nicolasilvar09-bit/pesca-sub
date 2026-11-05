// ================= idioma: português (original) ou inglês =================
// o jogo é escrito em português; em inglês, cada texto que aparece na tela (menus, botões, avisos, painéis) é
// traduzido na hora por trechos: um dicionário de frases e pedaços de frase (EN_DICT, em 57_en.js).
// Nomes de lugares ficam em português (são nomes próprios). Troca em Opções › Idioma (ou no menu).
// sem escolha salva: quem já tem save continua em português; jogador novo segue o idioma do aparelho
const LANG = (() => { try { const o = JSON.parse(localStorage.getItem('deepspear_opt') || '{}'); if (o.lang) return o.lang; if (localStorage.getItem('pescasub_costaverde_v1')) return 'pt'; } catch (e) { } return /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en'; })();
const EN = LANG === 'en';
const I18N = { re: null, map: null, obs: null, done: new WeakMap() };
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function i18nBuild() {
  if (I18N.re || !EN) return;
  const keys = Object.keys(EN_DICT).filter(k => k.length > 1).sort((a, b) => b.length - a.length);
  I18N.map = EN_DICT;
  // o trecho só troca se não estiver grudado em outra letra (não traduz pedaço de palavra)
  I18N.re = new RegExp('(^|[^\\p{L}])(' + keys.map(escRe).join('|') + ')(?![\\p{L}])', 'gu');
}
function tr(s) {
  if (!EN || !s || typeof s !== 'string') return s;
  i18nBuild();
  if (!/[A-Za-zÀ-ú]/.test(s)) return s;
  const exact = I18N.map[s.trim()]; if (exact) return s.replace(s.trim(), exact);
  return s.replace(I18N.re, (m, pre, k) => pre + I18N.map[k]);
}
const SKIP_TAG = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CANVAS: 1 };
function trNode(n) {
  // um texto que nós mesmos já traduzimos não é traduzido de novo (evita laço com o observador)
  if (n.nodeType === 3) { const p = n.parentNode; if (!p || SKIP_TAG[p.nodeName]) return; const v = n.nodeValue; if (I18N.done.get(n) === v) return; const t = tr(v); I18N.done.set(n, t); if (t !== v) n.nodeValue = t; return; }
  if (n.nodeType !== 1 || SKIP_TAG[n.nodeName] && n.nodeName !== 'INPUT') return;
  if (n.placeholder) { const t = tr(n.placeholder); if (t !== n.placeholder) n.placeholder = t; }
  if (SKIP_TAG[n.nodeName]) return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let c = w.nextNode(); c; c = w.nextNode()) if (c.nodeType === 3) trNode(c); else if (c.placeholder) trNode(c);
}
function setupI18n() {
  document.documentElement.lang = EN ? 'en' : 'pt-BR';
  // botão de idioma no menu
  const o = $('optBtn');
  if (o && !$('langBtn')) { const b = document.createElement('button'); b.className = 'btn alt'; b.id = 'langBtn'; b.style.cssText = 'margin:8px 0 0 8px'; b.textContent = EN ? '🇧🇷 PORTUGUÊS' : '🇺🇸 ENGLISH'; b.onclick = () => setLang(EN ? 'pt' : 'en'); o.after(b); }
  if (!EN) return;
  i18nBuild(); trNode(document.body); document.title = 'Deep Spear · Spearfishing';
  I18N.obs = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') trNode(m.target); else m.addedNodes.forEach(trNode); } });
  I18N.obs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
function setLang(l) { OPT.lang = l; saveOpt(); SAVE_LOCK = false; try { save(); } catch (e) { } location.reload(); }
