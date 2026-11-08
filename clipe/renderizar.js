#!/usr/bin/env node
// Renderiza o clipe completo: node renderizar.js [saida.mp4] [processos]
// Cada processo abre o index.html no Chromium (Playwright), desenha um trecho
// de quadros e envia os JPEGs ao ffmpeg. No fim, junta os trechos com a música.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');

const AQUI = __dirname;
const SAIDA = path.resolve(process.argv[2] || path.join(AQUI, '..', 'abraao_confiou_clipe.mp4'));
const N = parseInt(process.argv[3] || '4', 10);
const FPS = 24;
const ANALISE = JSON.parse(fs.readFileSync(path.join(AQUI, 'dados', 'analise.js'), 'utf8').replace(/^window\.ANALISE=/, '').replace(/;\s*$/, ''));
const TOTAL = Math.ceil(ANALISE.dur * FPS);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'clipe-'));

async function trecho(k, a, b) {
  const nav = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pag = await nav.newPage({ viewport: { width: 1920, height: 1080 } });
  pag.on('pageerror', (e) => console.error(`[${k}] ERRO:`, e.message));
  await pag.goto('file://' + path.join(AQUI, 'index.html') + '?render=1');
  await pag.evaluate(() => window.pronto);
  const arq = path.join(TMP, `parte_${k}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), arq], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = a; i < b; i++) {
    const url = await pag.evaluate((t) => window.quadroJPEG(t, 0.95), i / FPS);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - a) % 120 === 0) console.log(`[${k}] quadro ${i - a}/${b - a}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => c === 0 ? r() : j(new Error('ffmpeg ' + c))));
  await nav.close();
  return arq;
}

(async () => {
  console.log(`${TOTAL} quadros, ${N} processos -> ${SAIDA}`);
  const tam = Math.ceil(TOTAL / N);
  const partes = await Promise.all([...Array(N)].map((_, k) => trecho(k, k * tam, Math.min(TOTAL, (k + 1) * tam))));
  const lista = path.join(TMP, 'lista.txt');
  fs.writeFileSync(lista, partes.map((p) => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-i', path.join(AQUI, 'musica.mp3'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', SAIDA], { stdio: 'inherit' });
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('Pronto:', SAIDA);
})().catch((e) => { console.error(e); process.exit(1); });
