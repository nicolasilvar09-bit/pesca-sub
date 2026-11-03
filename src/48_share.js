// ================= foto da pesca para compartilhar: cartão com o peixe, peso, lugar e seu nome =================
// cada peixe bom entra no álbum (Diário › Álbum); o botão 📸 gera o cartão e abre o compartilhar do celular
const SHARE = { url: 'nicolasilvar09-bit.github.io/pesca-sub', btnT: 0, last: null, blob: null, wasPaused: false };
const REGION_NAME = { cv: 'Costa Verde · RJ', ne: 'Costa dos Corais · AL/PE', amz: 'Baixo Tapajós · PA' };
const shareWorthy = (f, rec) => rec || isTrophy(f) || f.sp.rare || f.kg >= 2.5;
function albumAdd(f, rec) {
  const e = { key: f.key, cm: Math.round(f.len * 100), kg: Math.round(f.kg * 100) / 100, spot: (f.spot && f.spot.name) || '', region: REGION, day: SV.day || 1, date: Date.now(), trophy: isTrophy(f), rec: !!rec, rare: !!f.sp.rare };
  SV.album = [e, ...(SV.album || [])].slice(0, 40);
  if (!shareWorthy(f, rec)) return;
  SHARE.last = e; SHARE.btnT = 12; show('shareBtn', true); $('shareBtn').innerHTML = `📸 COMPARTILHAR<br><small>${SPECIES[f.key].name} · ${fmtKg(f.kg)} kg</small>`;
}
function updateShareBtn(dt) { if (SHARE.btnT > 0 && (SHARE.btnT -= dt) <= 0) show('shareBtn', false); }

// peixe renderizado sozinho, de lado, com fundo transparente
function fishRender(key, W, Hh) {
  const sp = SPECIES[key], rt = new THREE.WebGLRenderTarget(W, Hh), sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xe8f6ff, 0x24404a, 1.5)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(1, 4, 5); sc.add(dl);
  const m = new THREE.Mesh(fishGeo(shapeOf(key, sp.shape), false), new THREE.MeshStandardMaterial({ map: fishTex(key), roughness: 0.36, metalness: 0.25, side: THREE.DoubleSide }));
  m.rotation.set(0.05, -0.18, 0.04); sc.add(m); m.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new V3()), s = box.getSize(new V3());
  const cam = new THREE.PerspectiveCamera(24, W / Hh, 0.01, 50), half = Math.max(s.x / (W / Hh), s.y) * 0.56;
  cam.position.set(c.x, c.y + half * 0.15, c.z + half / Math.tan(12 * Math.PI / 180)); cam.lookAt(c);
  const oc = renderer.getClearColor(new THREE.Color()), oa = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(sc, cam);
  const buf = new Uint8Array(W * Hh * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, Hh, buf); renderer.setRenderTarget(null); renderer.setClearColor(oc, oa);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), img = g.createImageData(W, Hh);
  // o alvo é linear: corrige para sRGB, senão o peixe sai escuro
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const i = ((Hh - 1 - y) * W + x) * 4, o = (y * W + x) * 4, a = buf[i + 3];
    for (let k = 0; k < 3; k++) img.data[o + k] = a ? Math.min(255, 255 * Math.pow(buf[i + k] / 255, 1 / 2.2)) : 0;
    img.data[o + 3] = a;
  }
  g.putImageData(img, 0, 0); rt.dispose(); m.geometry.dispose(); m.material.dispose();
  return cv;
}
function shareCard(e) {
  const W = 1080, Hh = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), sp = SPECIES[e.key];
  const F = (w, s, f = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif') => `${w} ${s}px ${f}`;
  // mar: degradê, raios de sol e bolhas
  const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#0d6a86'); bg.addColorStop(0.45, '#08415a'); bg.addColorStop(1, '#021018'); g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  const r = mulberry(e.date % 100000);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const x = r() * W, w = 40 + r() * 120, gr = g.createLinearGradient(0, 0, 0, Hh * 0.8); gr.addColorStop(0, 'rgba(180,240,255,.13)'); gr.addColorStop(1, 'rgba(180,240,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 2.4 - 200, Hh * 0.8); g.lineTo(x - 200, Hh * 0.8); g.closePath(); g.fill(); }
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * Hh, rr = 2 + r() * 7; g.strokeStyle = `rgba(200,245,255,${0.12 + r() * 0.2})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  // cabeçalho
  g.fillStyle = '#fff'; g.font = F('900', 58); g.textBaseline = 'top'; g.fillText('DEEP SPEAR', 64, 60);
  g.fillStyle = 'rgba(200,240,250,.75)'; g.font = F('600', 28); g.fillText('PESCA SUB', 68, 126);
  g.textAlign = 'right'; g.fillText(REGION_NAME[e.region] || '', W - 64, 72); g.font = F('500', 26); g.fillText(new Date(e.date).toLocaleDateString('pt-BR'), W - 64, 110); g.textAlign = 'left';
  // selos
  const tags = [e.rec && '🏅 RECORDE PESSOAL', e.trophy && '🏆 TROFÉU', e.rare && '★ PEIXE RARO'].filter(Boolean);
  let tx = 64; g.font = F('800', 30);
  for (const t of tags) { const w = g.measureText(t).width + 44; g.fillStyle = '#ffb020'; rr(g, tx, 196, w, 56, 28); g.fill(); g.fillStyle = '#2a1a00'; g.fillText(t, tx + 22, 208); tx += w + 16; }
  // o peixe
  const fw = 1000, fh = 520, fish = fishRender(e.key, fw, fh), fy = 290;
  const sh = g.createRadialGradient(W / 2, fy + fh * 0.9, 10, W / 2, fy + fh * 0.9, 420); sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.save(); g.scale(1, 0.18); g.fillRect(0, (fy + fh * 0.9) / 0.18 - 420, W, 840); g.restore();
  g.drawImage(fish, (W - fw) / 2, fy);
  // nome
  g.fillStyle = '#fff'; g.font = F('900', 84); g.fillText(sp.name, 64, 840);
  const info = SP_INFO[e.key];
  if (info) { g.fillStyle = 'rgba(200,240,250,.7)'; g.font = F('italic 400', 34, 'Georgia,serif'); g.fillText(info[0], 66, 936); }
  // números
  const box = (x, lab, val) => { g.fillStyle = 'rgba(2,16,24,.6)'; rr(g, x, 1000, 300, 150, 22); g.fill(); g.strokeStyle = 'rgba(47,208,192,.5)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(200,240,250,.7)'; g.font = F('700', 24); g.fillText(lab, x + 24, 1022); g.fillStyle = '#fff'; g.font = F('900', val.length > 12 ? 34 : 52); g.fillText(val, x + 24, 1066, 262); };
  box(64, 'PESO', fmtKg(e.kg) + ' kg'); box(390, 'TAMANHO', e.cm + ' cm'); box(716, 'LOCAL', e.spot || '—');
  g.fillStyle = '#7cf0a8'; g.font = F('700', 28); g.fillText(`✓ Na medida (mínimo ${Math.round(sp.min * 100)} cm) · pescado por ${myName()}`, 64, 1182, W - 128);
  // rodapé
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, Hh - 104, W, 104);
  g.textAlign = 'center'; g.fillStyle = 'rgba(220,245,250,.8)'; g.font = F('600', 24); g.fillText('JOGUE GRÁTIS NO NAVEGADOR', W / 2, Hh - 88); g.fillStyle = '#2fd0c0'; g.font = F('800', 34); g.fillText(SHARE.url, W / 2, Hh - 54); g.textAlign = 'left';
  return cv;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function shareOpen(e) {
  if (!e || !SPECIES[e.key]) return;
  SHARE.wasPaused = paused; paused = true; SHARE.blob = null; show('shareBtn', false); SHARE.btnT = 0;
  const cv = shareCard(e), box = $('shareBox'), sp = SPECIES[e.key];
  box.innerHTML = `<div class="shw"><img src="${cv.toDataURL('image/jpeg', 0.9)}" alt=""><div class="d">Mande para os amigos no WhatsApp, Instagram ou onde quiser.</div>
    <div class="row2"><button class="btn alt" id="shClose">FECHAR</button><button class="btn alt" id="shSave">BAIXAR</button><button class="btn gold" id="shGo">COMPARTILHAR</button></div></div>`;
  box.classList.remove('hide');
  cv.toBlob(b => SHARE.blob = b, 'image/jpeg', 0.9);
  const name = `deep-spear-${e.key}-${fmtKg(e.kg).replace(',', '-')}kg.jpg`, text = `Peguei um(a) ${sp.name} de ${fmtKg(e.kg)} kg${e.spot ? ' na ' + e.spot : ''} no Deep Spear! 🤿 https://${SHARE.url}/`;
  const save2 = () => { const a = document.createElement('a'); a.href = cv.toDataURL('image/jpeg', 0.9); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  $('shClose').onclick = () => { box.classList.add('hide'); paused = SHARE.wasPaused; AU.click(); };
  $('shSave').onclick = () => { save2(); AU.click(); };
  $('shGo').onclick = async () => {
    AU.click(); const file = SHARE.blob && new File([SHARE.blob], name, { type: 'image/jpeg' });
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text, title: 'Deep Spear' });
      else if (navigator.share) { save2(); await navigator.share({ text, title: 'Deep Spear' }); }
      else { save2(); toast('Imagem baixada: é só mandar para os amigos.', 3); }
    } catch (err) { if (err && err.name !== 'AbortError') { save2(); toast('Imagem baixada: é só mandar para os amigos.', 3); } }
  };
}
function albumHTML() {
  const A = SV.album || [];
  if (!A.length) return '<div class="it"><div class="d">Seu álbum ainda está vazio. Cada peixe que você pescar aparece aqui, e os melhores ganham um cartão para compartilhar.</div></div>';
  return '<div class="it" style="margin-bottom:8px"><div class="d">Seus últimos peixes. Toque em 📸 para gerar o cartão e mandar para os amigos.</div></div><div class="list">' +
    A.map((e, i) => `<div class="it"><div style="flex:1"><div class="n">${e.rec ? '🏅 ' : e.trophy ? '🏆 ' : ''}${(SPECIES[e.key] || { name: e.key }).name} · ${fmtKg(e.kg)} kg</div><div class="d">${e.cm} cm${e.spot ? ' · ' + e.spot : ''} · ${REGION_NAME[e.region] || ''} · dia ${e.day}</div></div>${SPECIES[e.key] ? `<button class="btn" data-share="${i}">📸</button>` : ''}</div>`).join('') + '</div>';
}
function bindAlbum(B) { B.querySelectorAll('[data-share]').forEach(b => b.onclick = () => { closePanels(); shareOpen((SV.album || [])[+b.dataset.share]); SHARE.wasPaused = false; }); }
function setupShare() {
  const b = document.createElement('div'); b.id = 'shareBtn'; b.className = 'hide';
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); shareOpen(SHARE.last); });
  $('btns').appendChild(b);
  const box = document.createElement('div'); box.id = 'shareBox'; box.className = 'hide'; document.body.appendChild(box);
}
