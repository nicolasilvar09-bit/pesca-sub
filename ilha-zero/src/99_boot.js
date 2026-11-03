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
window.__G = { G, IN, ZONE, BLD, BOX, TOWNS, PLANE, play, toLobby, startMatch, giveItem, mkWeapon, jumpOut, openChute, land, startHeal, switchWeapon, renderBag, openBag, toggleMap, closePanels, updateHud, updateCamera, drawActors, groundH, spawnLoot, callAirdrop, renderer, scene, camera, hurt, kill, gunGeo, dressGun, MAT, VEH, HUM, NADES, SMOKES, FIRES, throwNade, pThrow, losClear, aimAndFire, fireShot, enterVeh, leaveVeh, addVehicle, stepVehicles };
