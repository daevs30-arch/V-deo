// Pré-visualização: node previa.js pasta t1 t2 ...  (salva JPEGs desses segundos)
const { abrir, quadro } = require('./comum');
const fs = require('fs'), path = require('path');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  const t0 = Date.now(); const { pag, fechar } = await abrir(8770 + Math.floor(Math.random() * 100));
  console.log('carregou em', ((Date.now() - t0) / 1000).toFixed(1), 's');
  for (const t of ts) { const a = Date.now(); fs.writeFileSync(path.join(out, `c3_${t}.jpg`), await quadro(pag, parseFloat(t), 0.9)); console.log('t=' + t, (Date.now() - a) + 'ms'); }
  await fechar();
})();
