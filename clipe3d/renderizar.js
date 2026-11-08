#!/usr/bin/env node
// Renderiza o clipe 3D em trechos que ficam salvos em disco (pode ser retomado):
//   node renderizar.js trechos <pasta> <de> <ate> [processos]   -> gera <pasta>/q_<de>_<ate>.mp4 por processo
//   node renderizar.js juntar <pasta> [saida.mp4]                -> junta os trechos com a música
//   node renderizar.js tudo [saida.mp4] [processos]              -> faz tudo de uma vez
const { abrir, quadro } = require('./comum');
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), os = require('os');
const RAIZ = path.join(__dirname, '..'), FPS = 24;
const ANALISE = JSON.parse(fs.readFileSync(path.join(RAIZ, 'clipe', 'dados', 'analise.js'), 'utf8').replace(/^window\.ANALISE=/, '').replace(/;\s*$/, ''));
const TOTAL = Math.ceil(ANALISE.dur * FPS);

async function trecho(k, a, b, pasta) {
  const arq = path.join(pasta, `q_${String(a).padStart(5, '0')}_${String(b).padStart(5, '0')}.mp4`);
  if (fs.existsSync(arq)) { console.log('já existe', arq); return arq; }
  const { pag, fechar } = await abrir(8800 + k);
  const tmp = arq + '.parcial.mp4';
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = a; i < b; i++) {
    const buf = await quadro(pag, i / FPS, 0.95);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - a) % 60 === 0) console.log(`[${k}] ${i}/${b} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
  fs.renameSync(tmp, arq); await fechar(); return arq;
}
async function trechos(pasta, de, ate, n) {
  fs.mkdirSync(pasta, { recursive: true });
  const tam = Math.ceil((ate - de) / n);
  return Promise.all([...Array(n)].map((_, k) => trecho(k, de + k * tam, Math.min(ate, de + (k + 1) * tam), pasta)));
}
function juntar(pasta, saida) {
  const partes = fs.readdirSync(pasta).filter((f) => /^q_\d+_\d+\.mp4$/.test(f)).sort().map((f) => path.join(pasta, f));
  const lista = path.join(pasta, 'lista.txt'); fs.writeFileSync(lista, partes.map((p) => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-i', path.join(RAIZ, 'clipe', 'musica.mp3'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', saida], { stdio: 'inherit' });
  console.log('Pronto:', saida);
}
(async () => {
  const [modo, ...a] = process.argv.slice(2);
  if (modo === 'trechos') { await trechos(path.resolve(a[0]), parseInt(a[1], 10), Math.min(TOTAL, parseInt(a[2], 10)), parseInt(a[3] || '4', 10)); console.log('Trechos prontos'); }
  else if (modo === 'juntar') juntar(path.resolve(a[0]), path.resolve(a[1] || path.join(RAIZ, 'abraao_confiou_clipe_3d.mp4')));
  else { const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'clipe3d-')); await trechos(pasta, 0, TOTAL, parseInt(a[1] || '4', 10)); juntar(pasta, path.resolve(a[0] || path.join(RAIZ, 'abraao_confiou_clipe_3d.mp4'))); }
})().catch((e) => { console.error(e); process.exit(1); });
