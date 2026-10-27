// ================= save seguro: cópia no IndexedDB, armazenamento persistente, autosave e backup em arquivo =================
const IDB = { db: null };
function idbOpen() {
  if (IDB.db || !window.indexedDB) return Promise.resolve(IDB.db);
  return new Promise(res => {
    try {
      const r = indexedDB.open('deepspear', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('save');
      r.onsuccess = () => { IDB.db = r.result; res(IDB.db); };
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
function idbPut(v) { idbOpen().then(db => { if (!db) return; try { db.transaction('save', 'readwrite').objectStore('save').put(v, 'main'); } catch (e) { } }); }
function idbDel() { idbOpen().then(db => { if (!db) return; try { db.transaction('save', 'readwrite').objectStore('save').delete('main'); } catch (e) { } }); }
function idbGet() {
  return idbOpen().then(db => db && new Promise(res => { try { const r = db.transaction('save', 'readonly').objectStore('save').get('main'); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); } catch (e) { res(null); } }));
}
// toda gravação vai para os dois lugares, com a data
function mirrorSave(json) { idbPut(json); }
// se o localStorage foi apagado mas a cópia no IndexedDB existe, recupera e recarrega
function recoverSave() {
  let has = false; try { has = !!localStorage.getItem(SAVE_KEY); } catch (e) { }
  idbGet().then(v => {
    if (!v) { if (has) idbPut(localStorage.getItem(SAVE_KEY)); return; }
    let local = null; try { local = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { }
    const copy = JSON.parse(v);
    if (!local || (copy.savedAt || 0) > (local.savedAt || 0) + 5000) {
      try { localStorage.setItem(SAVE_KEY, v); } catch (e) { }
      SV = Object.assign(SV, copy); applyGear();
      toast('Progresso recuperado da cópia de segurança.', 4, 'gold');
    }
  });
}
function setupSafeSave() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  recoverSave();
  setInterval(() => { if (started) save(); }, 30000);
  const flush = () => save();
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
}
// ---------- backup em arquivo ----------
const backupCode = () => { save(); return 'DS1:' + btoa(unescape(encodeURIComponent(JSON.stringify(SV)))); };
async function saveBackupFile() {
  const d = new Date(), name = `deep-spear-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.txt`;
  const file = new File([backupCode()], name, { type: 'text/plain' });
  SV.backupAt = Date.now(); save();
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Backup Deep Spear' }); return 'Escolha "Salvar em Arquivos" (iCloud Drive) ou mande para você mesmo.'; } } catch (e) { if (e && e.name === 'AbortError') return 'Backup cancelado.'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  return 'Arquivo de backup baixado.';
}
function openBackupFile(onCode) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.txt,text/plain';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; f.text().then(t => onCode(t.trim())); };
  inp.click();
}
// lembrete: progresso relevante e sem backup há mais de 7 dias
function backupReminder() {
  const worth = SV.money > 1500 || (SV.boats || []).length > 1 || (SV.guns || []).length > 1;
  if (worth && Date.now() - (SV.backupAt || 0) > 7 * 864e5) toast('Dica: faça um backup do progresso em Opções › Backup (arquivo ou código).', 5);
}
