// Teste de fumaça da Ilha Zero: roda antes de publicar.
//   python3 build.py && node tests/smoke.js
// 1) compila o JavaScript  2) abre o jogo num navegador sem tela e simula uma partida inteira acelerada
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let fails = 0; const fail = (w, m) => { fails++; console.log(`  ✗ ${w}: ${m}`); };
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
try { new vm.Script(scripts[scripts.length - 1]); console.log('✓ JavaScript compila'); } catch (e) { fail('compilação', e.message); process.exit(1); }
const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS;
const server = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(ROOT, u === '/' ? 'index.html' : u), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200); r.end(d); }); });
(async () => {
  await new Promise(r => server.listen(0, r)); const url = `http://localhost:${server.address().port}/index.html`;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const mode of (process.env.MODES || 'squad,solo').split(',')) {
    const p = await b.newPage({ viewport: { width: 812, height: 375 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(m => { localStorage.clear(); localStorage.setItem('ilhazero_v1', JSON.stringify({ mode: m, diff: 'mix' })); }, mode);
    const t0 = Date.now();
    try {
      await p.goto(url); await p.waitForFunction(() => window.__G, null, { timeout: 120000 });
      console.log(`  mapa pronto em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      if (SHOTS) { await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/lobby_${mode}.png` }); }
      const r = await p.evaluate(() => {
        const X = window.__G, G = X.G; X.play(); window.__freeze = true; G.god = true;
        const log = [], step = (s, dt = 1 / 30) => { for (let i = 0; i < s / dt; i++) X.G.step(dt); };
        const P = G.player;
        log.push('vivos ' + G.actors.length + ', equipes ' + G.nTeams + ', itens no chão ' + G.items.length + ', prédios ' + X.BLD.length);
        step(8); X.jumpOut(P); step(4);
        // o jogador mira para baixo e mergulha
        X.IN.my = 1; step(25); X.IN.my = 0; step(30);
        log.push('jogador: modo ' + P.mode + ' y=' + P.y.toFixed(1));
        log.push('bots no chão: ' + G.actors.filter(a => a.mode === 'ground').length);
        step(60);
        const armed = G.actors.filter(a => a.alive && a.wp.some(Boolean)).length;
        log.push('com arma após ~2 min: ' + armed + '/' + G.actors.filter(a => a.alive).length);
        // dá equipamento ao jogador e testa tiro, recarga e cura
        X.giveItem(P, 'B2', 1); X.giveItem(P, 'X4', 1); X.giveItem(P, 'w:M416', 1, X.mkWeapon('M416'), true); X.giveItem(P, 'a:556', 120); X.giveItem(P, 'BAND', 5); { const ix = P.wp.findIndex(w => w && w.k === 'M416'); if (P.cur !== ix) X.switchWeapon(P, ix); } step(0.6);
        if (!P.wp[P.cur]) return log.concat(['ERRO estado: ' + JSON.stringify({ wp: P.wp.map(w => w && w.k), cur: P.cur, alive: P.alive, kn: P.knocked, mode: P.mode, bag: P.bag })]); const w = P.wp[P.cur]; X.G.player.reloadT = 0; if (!w.mag) { w.mag = 30; P.bag['a:556'] -= 30; } log.push('M416 pente ' + w.mag + ' mira ' + w.att.sight);
        X.IN.fire = true; step(1); X.IN.fire = false; step(0.5);
        log.push('depois de atirar: pente ' + w.mag);
        P.hp = 40; X.startHeal(P, 'BAND'); step(5); log.push('vida após bandagem ' + P.hp.toFixed(0));
        // veículo: entra, acelera, sai
        { const v = X.VEH.find(v => !v.dead && !v.seats[0] && v.hp > v.d.hp * 0.6 && !v.water); P.x = v.x + 2.5; P.z = v.z; P.y = X.groundH(P.x, P.z) + 0.05; step(0.2);
          const vx0 = v.x, vz0 = v.z; X.enterVeh(P, v, 0); X.IN.my = 1; let kmh = 0; for (let k = 0; k < 30; k++) { step(0.1); kmh = Math.max(kmh, Math.abs(v.sp) * 3.6); } X.IN.my = -1; step(2); X.IN.my = 0; step(1); X.leaveVeh(P);
          log.push(`${v.d.n}: ${kmh.toFixed(0)} km/h (máx. em 3 s)`); if (kmh < 30) log.push('NÃO acelerou ' + JSON.stringify({ water: v.water, air: v.air, hp: Math.round(v.hp), y: +v.y.toFixed(1), gh: +X.groundH(v.x, v.z).toFixed(1), x: Math.round(v.x), z: Math.round(v.z), seats: v.seats.map(s => s ? s.name : '-'), moved: Math.round(Math.hypot(v.x - vx0, v.z - vz0)) })); if (P.veh) log.push('NÃO saiu do veículo'); }
        // itens novos: escopeta (bagos), granada, fumaça, molotov
        { P.bag['a:12'] = 15; X.giveItem(P, 'w:S1897', 1, X.mkWeapon('S1897'), true); const sg = P.wp.findIndex(w => w && w.k === 'S1897'); if (P.cur !== sg) X.switchWeapon(P, sg); step(0.6);
          P.wp[sg].mag = 5; P.reloadT = 0; P.fireCd = 0; const nb = X.G.actors.length && window.__G.BULN ? 0 : 0; X.fireShot(P, P.x, P.y + 1.6, P.z, 0, 0, -1);
          const en = G.actors.find(a => a.alive && a.team !== P.team && a.mode === 'ground'); const hp0 = en.hp + (en.knocked ? 0 : 0);
          en.x = P.x + 3; en.z = P.z; en.y = X.groundH(en.x, en.z); en.ai.goal = 'camp'; en.ai.campT = 99; en.ai.think = 99; en.vx = en.vz = 0; en.stance = 'stand';
          P.bag.FRAG = 1; X.throwNade(P, 'FRAG', 1, 0.1, 0, 3); step(4.5); log.push('granada: vida do alvo ' + Math.round(hp0) + ' → ' + (en.alive ? Math.round(en.knocked ? 0 : en.hp) + (en.knocked ? ' (derrubado)' : '') : 'morto'));
          if (en.alive && !en.knocked && en.hp >= hp0) log.push('NÃO causou dano a granada');
          P.bag.SMOKE = 1; X.throwNade(P, 'SMOKE', 0, 0.2, -1, 4); step(6); const s = X.SMOKES[0];
          log.push('fumaça bloqueia visão: ' + (s ? !X.losClear(s.x - 15, s.y, s.z, s.x + 15, s.y, s.z) : 'sem fumaça')); if (!s || X.losClear(s.x - 15, s.y, s.z, s.x + 15, s.y, s.z)) log.push('NÃO bloqueou a fumaça');
          P.bag.MOLO = 1; X.throwNade(P, 'MOLO', 0, 0.5, 1, 6); step(2); log.push('fogo: ' + X.FIRES.length); }
        X.IN.adsOn = true; step(0.5); X.updateCamera(0.1); X.IN.adsOn = false;
        X.openBag(); X.renderBag(); X.closePanels(); X.toggleMap(); X.toggleMap(); X.updateHud(0.2);
        // protege o jogador para ver a partida até o fim
        let t = 0; const imm = () => { P.hp = 100; P.knocked = false; };
        while (!G.over && t < 1500) { step(5); t += 5; imm(); if (!P.alive) break; }
        log.push('fim em ' + (G.matchT / 60).toFixed(1) + ' min, acabou=' + G.over + ', fase da zona ' + X.ZONE.ph + ', vivos ' + G.actors.filter(a => a.alive).length);
        const kills = G.actors.reduce((s, a) => s + a.kills, 0); log.push('mortes: ' + JSON.stringify(G.deathLog.slice(0, 40)));
        log.push('bots dirigiram: ' + new Set(G.vdrivers || []).size);
        log.push('abates no total ' + kills + ', caixas ' + G.crates.length);
        return log;
      });
      r.forEach(l => console.log('   ', l)); r.filter(l => /NÃO/.test(l)).forEach(l => fail(mode, l));
      if (SHOTS) {
        await p.evaluate(() => { window.__freeze = false; });
        await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/fim_${mode}.png` });
      }
      console.log(`${errs.length ? '✗' : '✓'} ${mode} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    } catch (e) { fail(mode, e.message.split('\n')[0]); }
    errs.slice(0, 8).forEach(m => fail(mode, m));
    await p.close();
  }
  await b.close(); server.close();
  console.log(fails ? `\n${fails} problema(s). NÃO publicar.` : '\nTudo certo.');
  process.exit(fails ? 1 : 0);
})();
