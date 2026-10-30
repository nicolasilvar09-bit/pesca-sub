// Teste de fumaça do Deep Spear: roda antes de publicar.
//   python3 build.py && node tests/smoke.js
// 1) compila o JavaScript do jogo (pega erro de sintaxe e nome declarado duas vezes)
// 2) abre o jogo nos 3 destinos num navegador sem tela e exercita o básico:
//    carregar, pilotar, mergulhar, todas as abas da loja, um campeonato inteiro e um Mundial
// Sai com código 1 se qualquer erro aparecer.
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let fails = 0; const fail = (where, msg) => { fails++; console.log(`  ✗ ${where}: ${msg}`); };

// ---------- 1) compilação ----------
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const game = scripts[scripts.length - 1];
try { new vm.Script(game, { filename: 'jogo.js' }); console.log('✓ JavaScript compila'); }
catch (e) { fail('compilação', e.message); console.log('\nNÃO publicar.'); process.exit(1); }

// ---------- 2) no navegador ----------
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.log('(playwright não instalado: pulando o teste no navegador)'); process.exit(fails ? 1 : 0); }
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (err, d) => { if (err) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(d); }); });
(async () => {
  await new Promise(res => server.listen(0, res)); const url = `http://localhost:${server.address().port}/index.html`;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const region of ['cv', 'ne', 'amz']) {
    const p = await b.newPage({ viewport: { width: 812, height: 375 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route(/supabase\.co/, r => r.abort()); // sem internet no teste: o jogo tem que seguir sem o online
    await p.addInitScript(r => { localStorage.clear(); localStorage.setItem('pescasub_costaverde_v1', JSON.stringify({ region: r, neUnlocked: true, amzUnlocked: true, tut: 99, day: 7, tod: 10, money: 5000, licUntil: 99, sonar: true, story: { ch: 1, cnt: {}, done: {}, seen: 9 } })); }, region);
    const t0 = Date.now();
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForFunction(() => window.__G, null, { timeout: 180000 });
      const steps = await p.evaluate(() => {
        const G = window.__G, done = []; G.startGame(); window.__freeze = true;
        const run = (n, dt = 1 / 30) => { for (let i = 0; i < n; i++) G.step(dt); };
        run(60); done.push('lancha');
        G.toggleAnchor(); G.jumpIn(); run(60); G.P.under = true; G.P.pos.y = -4; run(60); done.push('mergulho');
        G.climbBoat(); run(10);
        G.openShop(true); for (const A of G.areas) for (const [k] of A.tabs) G.tab(k); done.push('loja ' + G.areas.reduce((n, A) => n + A.tabs.length, 0) + ' abas');
        document.getElementById('mClose').click();
        G.startComp(G.SPOTS.find(s => s.r).id); run(2400, 0.25); done.push(G.COMP.on ? 'campeonato NÃO terminou' : 'campeonato');
        document.getElementById('mClose').click();
        G.startWorld(); const ok = G.COMP.on && G.COMP.world; if (ok) { run(200, 0.25); G.COMP.world.phase = 2; G.COMP.t = 0.1; run(4, 0.25); }
        done.push(ok && !G.COMP.on ? 'Mundial' : 'Mundial NÃO rodou');
        return done;
      });
      const bad = steps.filter(s => /NÃO/.test(s)); bad.forEach(s => fail(region, s));
      console.log(`${errs.length || bad.length ? '✗' : '✓'} ${region}: ${steps.join(', ')} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    } catch (e) { fail(region, e.message.split('\n')[0]); }
    errs.slice(0, 5).forEach(m => fail(region, 'erro no jogo: ' + m));
    await p.close();
  }
  await b.close(); server.close();
  console.log(fails ? `\n${fails} problema(s). NÃO publicar.` : '\nTudo certo.');
  process.exit(fails ? 1 : 0);
})();
