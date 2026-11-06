// ================= início =================
G.mode = SET.mode || 'squad'; G.diff = SET.diff || 'mix';
applyQuality();
toLobby();
// modelos realistas: enquanto carregam, o jogo usa os bonecos simples; quando chegam, troca todo mundo
loadHumans(() => {
  if (!HUM.ready) return;
  if (G.phase === 'match') for (const a of G.actors) { if (a.alive) { removeModel(a); buildModel(a); } }
  else { lobbyActors(); renderLobby(); }
});
$('loading').classList.add('hidden');
requestAnimationFrame(frame);
window.__G = { DET, GFX, NATR, NAT, frame, drawScene, showPreview, COS, COSL, AUTO, gfxStep, refreshGrass, refreshNature, G, IN, ZONE, BLD, BOX, TOWNS, ROADS, RIVER, setWeather, drawMapOn, MAPID, PLANE, play, toLobby, startMatch, giveItem, mkWeapon, jumpOut, openChute, land, startHeal, switchWeapon, renderBag, openBag, toggleMap, closePanels, updateHud, updateCamera, drawActors, groundH, spawnLoot, callAirdrop, renderer, scene, camera, hurt, kill, gunGeo, dressGun, MAT, VEH, HUM, ON, PARTY, removeItem, pDrop, partyCreate, partyJoin, leaderStart, addFriendCode, tryVault, vaultPlan, NADES, SMOKES, FIRES, throwNade, pThrow, losClear, aimAndFire, fireShot, enterVeh, leaveVeh, addVehicle, stepVehicles };
// instala como app / funciona sem internet
if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').then(r => { try { r.update(); } catch (e) { } }).catch(() => { }); let had = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && G.phase !== 'match') location.reload(); had = true; }); } // versão nova chegou: recarrega sozinho no lobby
