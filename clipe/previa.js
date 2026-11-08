// Gera PNGs de pré-visualização: node previa.js saida_dir t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERRO:', e.message));
  await p.goto('file://' + path.join(__dirname, 'index.html') + '?render=1');
  await p.evaluate(() => window.pronto);
  for (const t of ts) {
    const url = await p.evaluate((t) => window.quadroJPEG(t, 0.9), parseFloat(t));
    require('fs').writeFileSync(path.join(out, `q_${t}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
