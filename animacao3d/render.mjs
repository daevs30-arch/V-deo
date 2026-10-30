// Renderiza cena.html quadro a quadro no Chromium headless e gera o MP4.
// Uso: node render.mjs                -> ../por_que_o_ceu_e_azul.mp4
//      node render.mjs --stills 5,12  -> build/still_5.jpg, build/still_12.jpg
//      node render.mjs --cena lua.html --build build/lua --out ../a_lua_muda_de_forma.mp4 \
//        --titulo "Por que a Lua muda de forma?"
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { '.png': 'image/png', '.mjs': 'text/javascript', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw new Error('fora');
    const body = await readFile(p);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const args = process.argv.slice(2);
const stills = args.includes('--stills') ? args[args.indexOf('--stills') + 1].split(',').map(Number) : null;
const opt = (name, def) => args.includes(name) ? args[args.indexOf(name) + 1] : def;
const cena = opt('--cena', 'cena.html');
const buildDir = path.join(ROOT, opt('--build', 'build'));
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, '..', 'por_que_o_ceu_e_azul.mp4');

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[erro]', e.message));
await page.goto(`http://localhost:${port}/${cena}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const total = await page.evaluate(() => window.TOTAL);

if (args.includes('--imagem')) {
  // imagem estática: node render.mjs --imagem "comemoracao.html?story" --tamanho 1080x1920 --out ../x.png
  const [w, h] = opt('--tamanho', '1080x1350').split('x').map(Number);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`http://localhost:${port}/${opt('--imagem')}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('ok:', out);
} else if (args.includes('--perfil')) {
  await page.goto(`http://localhost:${port}/cena.html?perfil`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.evaluate(() => window.renderPerfil());
  await page.screenshot({ path: path.join(ROOT, 'perfil.png'), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  console.log('ok: perfil.png');
} else if (stills) {
  for (const t of stills) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: path.join(buildDir, `still_${t}.jpg`), type: 'jpeg', quality: 85 });
  }
} else {
  const fps = 30, n = Math.round(total * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(fps), '-i', '-',
    '-i', path.join(buildDir, 'audio.wav'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-pix_fmt', 'yuv420p', '-metadata', `title=${opt('--titulo', 'Por que o céu é azul?')} | Faísca Curioso`,
    '-metadata', 'artist=@faisca.curioso', '-metadata', 'comment=Curiosidades rápidas de ciência, espaço e do mundo, explicadas pelo Faísca.',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    await page.evaluate(t => window.renderAt(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0) console.log(`quadro ${f}/${n}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('ok:', out);
}
await browser.close();
server.close();
