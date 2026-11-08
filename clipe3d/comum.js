// Abre o clipe num Chromium sem tela (WebGL por software) servido pela raiz do repositório.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
async function abrir(porta) {
  const srv = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pag = await nav.newPage({ viewport: { width: 1920, height: 1080 } });
  pag.on('pageerror', (e) => { console.error('ERRO NA PÁGINA:', e.message); process.exit(2); });
  pag.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await pag.goto(`http://127.0.0.1:${porta}/clipe3d/index.html?render=1`, { waitUntil: 'commit', timeout: 300000 });
  await pag.waitForFunction(() => window.pronto === true, null, { timeout: 600000 });
  return { nav, pag, fechar: async () => { await nav.close(); srv.kill(); } };
}
async function quadro(pag, t, q = 0.93) { const url = await pag.evaluate(([t, q]) => window.quadroJPEG(t, q), [t, q]); return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'); }
module.exports = { abrir, quadro };
