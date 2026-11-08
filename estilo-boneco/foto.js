// Screenshot de uma página 3D: node foto.js pagina.html?params saida.png
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [pag, out] = process.argv.slice(2);
  const srv = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: __dirname, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', (m) => console.log('console:', m.text())); p.on('pageerror', (e) => console.log('ERRO:', e.message));
  await p.goto('http://127.0.0.1:8765/' + pag);
  await p.waitForFunction(() => window.pronto === true, null, { timeout: 180000 });
  const t0 = Date.now();
  await p.locator('canvas').screenshot({ path: out });
  console.log('ok', Date.now() - t0, 'ms');
  await b.close(); srv.kill();
})();
