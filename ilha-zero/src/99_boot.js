// ================= início =================
G.mode = SET.mode || 'squad'; G.diff = SET.diff || 'mix';
applyQuality();
toLobby();
$('loading').classList.add('hidden');
requestAnimationFrame(frame);
window.__G = { G, IN, ZONE, BLD, BOX, TOWNS, PLANE, play, toLobby, startMatch, giveItem, mkWeapon, jumpOut, openChute, land, startHeal, switchWeapon, renderBag, openBag, toggleMap, closePanels, updateHud, updateCamera, drawActors, groundH, spawnLoot, callAirdrop, renderer, scene, camera, hurt, kill, VEH, fireShot, enterVeh, leaveVeh, addVehicle, stepVehicles };
