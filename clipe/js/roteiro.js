// Roteiro do clipe: cenas na linha do tempo da música, letra karaokê e transições.

// ---------- letra / voz ----------
function linhaEm(t) {
  const L = window.LETRA;
  for (let i = 0; i < L.length; i++) if (t >= L[i].t0 - 0.2 && t < L[i].t1) return L[i];
  return null;
}
function cantando(t) {
  for (const l of window.LETRA) { const a = l.p[0][1] - 0.15, b = l.p[l.p.length - 1][1] + 0.9; if (t >= a && t <= b) return l; }
  return null;
}
function bocaVoz(t, fator = 1) {
  if (!cantando(t)) return 0;
  const v = nivelVoz(t);
  return clamp((v - 0.16) * 1.9 * fator) * (0.5 + 0.5 * Math.abs(Math.sin(t * 12.5)));
}
function piscar(t, semente = 0) {
  const p = (t + semente * 1.37) % (3.6 + (semente % 3) * 0.5);
  return p < 0.16 ? Math.sin(p / 0.16 * Math.PI) : 0;
}

// ---------- poses da cantora ----------
function poseCantora(t, tipo) {
  const b = batida(t), sw = Math.sin(t * Math.PI * 86 / 60);
  const base = { inclina: sw * 0.025, cabeca: Math.sin(t * 1.7) * 0.05, salto: 0 };
  switch (tipo) {
    case 'acena': return { ...base, bracoE: { a: 0.55, b: -1.7 }, maoE: 'punho', bracoD: { a: 2.55, b: 0.25 + Math.sin(t * 8) * 0.35 } };
    case 'coracao': return { ...base, bracoE: { a: 0.3, b: -2.35 }, bracoD: { a: 0.32, b: -2.3 } };
    case 'abertos': return { ...base, bracoE: { a: 1.75 + sw * 0.1, b: 0.35 }, bracoD: { a: 1.75 - sw * 0.1, b: 0.35 } };
    case 'cima': return { ...base, bracoE: { a: 2.65 + sw * 0.1, b: 0.15 }, bracoD: { a: 2.65 - sw * 0.1, b: 0.15 } };
    case 'aponta': return { ...base, cabeca: -0.08, bracoE: { a: 0.2, b: 0.1 }, bracoD: { a: 2.8, b: 0.05 } };
    case 'palmas': { const ab = 1 - b.pulso; return { ...base, salto: b.pulso * 10, bracoE: { a: 0.3, b: -2.62 + ab * 0.9 }, bracoD: { a: 0.3, b: -2.62 + ab * 0.9 } }; }
    case 'lado': return { ...base, inclina: sw * 0.06, bracoE: { a: 1.3 + sw * 0.35, b: 0.5 }, bracoD: { a: 1.3 - sw * 0.35, b: 0.5 } };
    default: { // cantando com gestos suaves
      const g = Math.sin(t * 1.3);
      return { ...base, bracoE: { a: 0.45 + g * 0.1, b: -1.3 }, bracoD: { a: 0.9 - g * 0.15, b: 0.7 + g * 0.2 } };
    }
  }
}
function desenhaCantora(ctx, t, x, y, s, tipo, extra = {}) {
  const p = poseCantora(t, tipo);
  cantora(ctx, { x, y, s: s * 1.12, t, boca: bocaVoz(t), piscar: piscar(t, 1), olhar: [Math.sin(t * 0.7) * 0.3, 0], ...p, ...extra });
}

// ---------- grupo de crianças ----------
function criancas(ctx, t, lista, pose, cantam = true) {
  const b = batida(t);
  lista.forEach(([x, y, s, tipo], i) => {
    let ps = typeof pose === 'function' ? pose(i) : pose;
    const pul = ps === 'pula' ? b.pulso : 0;
    if (ps === 'pula') ps = 'cima';
    crianca(ctx, { x, y, s, tipo, t: t + i * 0.37, pose: ps, fase: b.fase, salto: pul * 60 + (ps === 'palmas' ? b.pulso * 12 : 0),
      boca: cantam ? bocaVoz(t + i * 0.05, 0.9) : 0, piscar: piscar(t, i + 3), cabeca: Math.sin(t * 2 + i) * 0.06 });
  });
}

function camera(ctx, z, fx, fy, fn) { ctx.save(); ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy); fn(); ctx.restore(); }

// ---------- textos ----------
function textoContorno(ctx, txt, x, y, tam, cor, contorno = '#3a1f5a', lw = 0.16, fonte = 'Baloo') {
  ctx.font = `800 ${tam}px ${fonte}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = tam * lw; ctx.strokeStyle = contorno; ctx.strokeText(txt, x, y);
  ctx.fillStyle = cor; ctx.fillText(txt, x, y);
}

function titulo(ctx, t, t0, x = W / 2, y = 330, esc = 1) {
  const k = easeOutBack((t - t0) * 1.4);
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k * esc, k * esc); ctx.rotate(Math.sin(t * 2) * 0.015);
  ctx.shadowColor = 'rgba(60,20,80,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  const g = lg(ctx, 0, -80, 0, 80, ['#fff6a8', '#ffc83a', '#ff8a2a']);
  textoContorno(ctx, 'Abraão', -10, -70, 150, g, '#5a2a7a', 0.14);
  textoContorno(ctx, 'Confiou!', 20, 75, 170, g, '#5a2a7a', 0.14);
  ctx.restore();
}

function palavraGrande(ctx, t, t0, txt, y, cor, tam = 190) {
  const tt = t - t0; if (tt < 0 || tt > 3.2) return;
  const k = easeOutBack(tt * 3), a = clamp((3.2 - tt) * 2);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, y); ctx.scale(k, k); ctx.rotate(Math.sin(tt * 6) * 0.03);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  textoContorno(ctx, txt, 0, 0, tam, cor, '#ffffff', 0.18);
  ctx.shadowColor = 'transparent';
  textoContorno(ctx, txt, 0, 0, tam, cor, 'rgba(0,0,0,0)', 0);
  ctx.restore();
}

// Legenda karaokê.
function legenda(ctx, t) {
  const l = linhaEm(t); if (!l) return;
  if (l.sec === 'ponte' && /^(Confiar|Acreditar)/.test(l.p[0][0])) return; // palavras grandes na tela
  const ain = smooth((t - (l.t0 - 0.2)) / 0.3), aout = smooth((l.t1 - t) / 0.3), a = Math.min(ain, aout);
  const tam = 66;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `700 ${tam}px Fredoka`; ctx.textBaseline = 'middle';
  const esp = ctx.measureText(' ').width + 16;
  const larg = l.p.map(([w]) => ctx.measureText(w).width);
  const total = larg.reduce((s, v) => s + v, 0) + esp * (l.p.length - 1);
  const y = H - 92 + (1 - ain) * 20;
  // painel
  ctx.fillStyle = 'rgba(30,15,60,0.55)';
  ctx.beginPath(); ctx.roundRect(W / 2 - total / 2 - 46, y - 52, total + 92, 104, 52); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.stroke();
  let x = W / 2 - total / 2;
  l.p.forEach(([w, tw], i) => {
    const prox = i + 1 < l.p.length ? l.p[i + 1][1] : tw + 0.6;
    const prog = clamp((t - tw) / Math.max(0.12, Math.min(0.6, prox - tw)));
    const pop = t >= tw ? 1 + 0.1 * Math.exp(-(t - tw) * 7) : 1;
    const eco = w.startsWith('(');
    ctx.save(); ctx.translate(x + larg[i] / 2, y); ctx.scale(pop, pop);
    ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#2a1450'; ctx.textAlign = 'center';
    ctx.strokeText(w, 0, 0);
    ctx.fillStyle = eco ? '#bfe6ff' : '#ffffff'; ctx.fillText(w, 0, 0);
    if (prog > 0) { // preenchimento dourado da esquerda para a direita
      ctx.save(); ctx.beginPath(); ctx.rect(-larg[i] / 2 - 4, -tam, (larg[i] + 8) * prog, tam * 2); ctx.clip();
      ctx.fillStyle = eco ? '#7fd6ff' : lg(ctx, 0, -tam / 2, 0, tam / 2, ['#fff3a0', '#ffc52e']); ctx.fillText(w, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    x += larg[i] + esp;
  });
  ctx.restore();
}

// ================= CENAS =================
const KIDS_FESTA = [[290, 1010, 0.62, 0], [560, 1040, 0.66, 1], [1360, 1040, 0.66, 2], [1630, 1010, 0.62, 3]];

const CENAS = [
  { t0: 0, t1: 6.6, fn: (ctx, t) => { // abertura: amanhecer + título
    const z = 1 + t * 0.012;
    camera(ctx, z, W / 2, H / 2, () => {
      ceu(ctx, 'amanhecer', t, 980, 720 - easeOut(t / 6) * 260, 110);
      dunas(ctx, 'amanhecer', t, t * 30);
      const sil = '#4a2a48';
      andarilho(ctx, { tipo: 'abraao', x: 600 + t * 25, y: 860, s: 0.18, fase: t * 4, silhueta: sil });
      andarilho(ctx, { tipo: 'sara', x: 540 + t * 25, y: 862, s: 0.17, fase: t * 4 + 1, silhueta: sil });
      camelo(ctx, { x: 450 + t * 25, y: 864, s: 0.2, fase: t * 4, silhueta: sil });
    });
    brilhos(ctx, t, 18, [200, 80, 1500, 500], 2);
    titulo(ctx, t, 0.7);
    if (t > 2.4) { ctx.save(); ctx.globalAlpha = smooth((t - 2.4) * 2); textoContorno(ctx, 'Uma história de fé', W / 2, 560, 58, '#ffffff', '#5a2a7a', 0.16, 'Fredoka'); ctx.restore(); }
  } },
  { t0: 6.6, t1: 15.45, fn: (ctx, t, lt) => { // boas-vindas no prado
    ceu(ctx, 'dia', t, 1500, 200, 80); prado(ctx, 'dia', t, 0);
    const entra = easeOut(lt / 2.6), x = lerp(-200, W / 2, entra);
    criancas(ctx, t, KIDS_FESTA, (i) => lt > 2.6 ? 'acena' : 'parado', false);
    desenhaCantora(ctx, t, x, 1060, 0.86, lt > 2.4 ? 'acena' : 'canta', { passo: entra < 1 ? t * 9 : null, boca: lt > 2.6 && lt < 4.5 ? 0.6 * Math.abs(Math.sin(t * 9)) : 0 });
    notasMusicais(ctx, t, 8);
    titulo(ctx, t, 6.6 + 0.4 - 10, 330, 150, 0.42);
  } },
  { t0: 15.45, t1: 27.0, fn: (ctx, t, lt) => { // Deus chama Abraão em Ur
    const z = 1 + lt * 0.02;
    const chamado = t > 21.6;
    camera(ctx, z, 1100, 700, () => {
      cidadeUr(ctx, t);
      raiosCeu(ctx, 1250, -60, t, chamado ? 1.3 : 0.7 + 0.2 * Math.sin(t * 2));
      abraao(ctx, { x: 1100, y: 1060, s: 0.82, olhaCima: true, piscar: piscar(t, 2), cabeca: -0.06,
        bracoE: chamado ? { a: 2.4 + Math.sin(t * 2) * 0.05, b: 0.3 } : { a: 0.3, b: -1.7 }, maoE: 'aberta',
        bracoD: chamado ? { a: 2.2, b: 0.4 } : { a: 0.25, b: -0.3 }, cajado: !chamado, maoD: 'aberta' });
      ovelha(ctx, { x: 1500, y: 930, s: 0.5, fase: 0, flip: true });
      ovelha(ctx, { x: 640, y: 940, s: 0.55, fase: 0, flip: false, semente: 5 });
    });
    brilhos(ctx, t, chamado ? 26 : 10, [700, 0, 1000, 700], 4);
  } },
  { t0: 27.0, t1: 32.7, fn: (ctx, t, lt) => caravana(ctx, t, lt, 'dia') },
  { t0: 32.7, t1: 38.85, fn: (ctx, t, lt) => { // "Eu vou Te obedecer!"
    ceu(ctx, 'por', t, 1500, 380, 120); dunas(ctx, 'por', t, 0);
    raiosCeu(ctx, 1500, 380, t, 0.6, 1.6);
    const z = 1 + lt * 0.015;
    camera(ctx, z, W / 2, 500, () => {
      abraao(ctx, { x: 960, y: 1640, s: 1.3, piscar: piscar(t, 2), boca: bocaVoz(t), cabeca: Math.sin(t * 3) * 0.04 + (t > 34.3 && t < 36 ? Math.sin((t - 34.3) * 8) * 0.06 : 0),
        bracoD: { a: 0.3, b: -2.25 }, maoD: 'aberta', bracoE: { a: 0.12, b: 0.05 }, cajado: false, olhar: [0, -0.4] });
    });
    coracoes(ctx, t, 35.0, 8, '#ff7a8a');
  } },
  { t0: 38.85, t1: 44.25, fn: (ctx, t, lt) => { // "Passo a passo, pela fé" — caminhando juntos
    const sc = lt * 260;
    ceu(ctx, 'dia', t, 1500, 200, 80); prado(ctx, 'dia', t, sc, false);
    pegadas(ctx, t, sc);
    const b = batida(t);
    [[300, 1030, 0.6, 1], [520, 1050, 0.62, 2]].forEach(([x, y, s, tp], i) =>
      crianca(ctx, { x, y, s, tipo: tp, t, pose: 'parado', salto: Math.abs(Math.sin(t * 7 + i)) * 18, boca: bocaVoz(t, 0.8), piscar: piscar(t, i) }));
    desenhaCantora(ctx, t, 900, 1060, 0.8, 'canta', { passo: t * 7, salto: Math.abs(Math.sin(t * 7)) * 10 });
    [[1270, 1050, 0.62, 0], [1490, 1030, 0.6, 4]].forEach(([x, y, s, tp], i) =>
      crianca(ctx, { x, y, s, tipo: tp, t, pose: 'parado', salto: Math.abs(Math.sin(t * 7 + i + 1)) * 18, boca: bocaVoz(t, 0.8), piscar: piscar(t, i + 5) }));
  } },
  { t0: 44.25, t1: 49.85, fn: (ctx, t, lt) => { // "Quem confia no Senhor..."
    ceu(ctx, 'dia', t, 1500, 200, 80); prado(ctx, 'dia', t, 0);
    ctx.fillStyle = 'rgba(255,250,235,0.25)'; ctx.fillRect(0, 0, W, H);
    raiosCeu(ctx, 960, -100, t, 0.5);
    camera(ctx, 1 + lt * 0.02, W / 2, 400, () => desenhaCantora(ctx, t, 960, 1360, 1.15, t < 46.4 ? 'coracao' : 'abertos'));
    brilhos(ctx, t, 16, [200, 100, 1500, 700], 9);
  } },
  { t0: 49.85, t1: 61.55, fn: (ctx, t, lt) => festa(ctx, t, lt, { fiel: 58.8 }) },
  { t0: 61.55, t1: 64.25, fn: (ctx, t, lt) => noiteEstrelada(ctx, t, lt, 'abraao') },
  { t0: 64.25, t1: 67.1, fn: (ctx, t, lt) => familia(ctx, t, lt, 0) },
  { t0: 67.1, t1: 75.6, fn: (ctx, t, lt) => porDoSol(ctx, t, lt) },
  { t0: 75.6, t1: 84.1, fn: (ctx, t, lt) => ponteFesta(ctx, t, lt, [[75.76, 'CONFIAR!', '#ff5a7a'], [78.28, 'CONFIAR!', '#ffb02a'], [81.1, 'ACREDITAR!', '#4ab0f0'], [82.7, 'ACREDITAR!', '#5fd0a0']]) },
  { t0: 84.1, t1: 90.2, fn: (ctx, t, lt) => { // "O Deus de Abraão nunca vai falhar!"
    fundoFesta(ctx, t, ['#ffd84a', '#ffb03a', '#fff2a0']);
    raiosCeu(ctx, W / 2, 200, t, 1.2, 2);
    criancas(ctx, t, KIDS_FESTA, 'cima');
    desenhaCantora(ctx, t, W / 2, 1050, 0.9, 'cima');
    brilhos(ctx, t, 30, [100, 50, 1700, 800], 12);
  } },
  { t0: 90.2, t1: 94.35, fn: (ctx, t, lt) => caravana(ctx, t, lt, 'por', true) },
  { t0: 94.35, t1: 105.6, fn: (ctx, t, lt) => festa(ctx, t, lt, { cima: [95.9, 99.9], variacao: 1 }) },
  { t0: 105.6, t1: 108.4, fn: (ctx, t, lt) => noiteEstrelada(ctx, t, lt, 'cantora') },
  { t0: 108.4, t1: 111.25, fn: (ctx, t, lt) => familia(ctx, t, lt, 1) },
  { t0: 111.25, t1: 119.7, fn: (ctx, t, lt) => caravana(ctx, t, lt, 'dia') },
  { t0: 119.7, t1: 128.75, fn: (ctx, t, lt) => fogueiraNoite(ctx, t, lt) },
  { t0: 128.75, t1: 140.0, fn: (ctx, t, lt) => festa(ctx, t, lt, { fiel: 137.4, pula: true, variacao: 2 }) },
  { t0: 140.0, t1: 142.8, fn: (ctx, t, lt) => noiteEstrelada(ctx, t, lt, 'abraao2') },
  { t0: 142.8, t1: 145.85, fn: (ctx, t, lt) => familia(ctx, t, lt, 2) },
  { t0: 145.85, t1: 154.15, fn: (ctx, t, lt) => porDoSol(ctx, t, lt, true) },
  { t0: 154.15, t1: 165.2, fn: (ctx, t, lt) => ponteFesta(ctx, t, lt, [[154.26, 'CONFIAR!', '#ff5a7a'], [156.96, 'CONFIAR!', '#ffb02a'], [159.5, 'ACREDITAR!', '#4ab0f0'], [160.88, 'ACREDITAR!', '#a07aff']]) },
  { t0: 165.2, t1: 999, fn: (ctx, t, lt) => final(ctx, t, lt) },
];

function caravana(ctx, t, lt, pal, silhueta = false) {
  const sc = t * 140;
  ceu(ctx, pal, t, pal === 'por' ? 1450 : 1500, pal === 'por' ? 560 : 200, pal === 'por' ? 150 : 80);
  dunas(ctx, pal, t, sc);
  if (!silhueta) { palmeira(ctx, ((1900 - sc * 0.6) % 2600 + 2600) % 2600 - 300, 850, 0.55, t); }
  const f = t * 5.2, sil = silhueta ? '#3a1c3a' : null, yb = silhueta ? 880 : 1000, k = silhueta ? 0.7 : 1;
  const x0 = silhueta ? 300 : 120;
  ovelha(ctx, { x: x0 + 0, y: yb + 10, s: 0.42 * k, fase: f + 1, silhueta: sil, semente: 4 });
  ovelha(ctx, { x: x0 + 170, y: yb + 30, s: 0.46 * k, fase: f, silhueta: sil, semente: 6 });
  camelo(ctx, { x: x0 + 470 * k, y: yb, s: 0.62 * k, fase: f, silhueta: sil });
  andarilho(ctx, { tipo: 'sara', x: x0 + 900 * k, y: yb, s: 0.6 * k, fase: f + 1.4, silhueta: sil });
  andarilho(ctx, { tipo: 'abraao', x: x0 + 1170 * k, y: yb + 6, s: 0.64 * k, fase: f, silhueta: sil });
  ovelha(ctx, { x: x0 + 1400 * k, y: yb + 40, s: 0.4 * k, fase: f + 2, silhueta: sil, semente: 8 });
  if (!silhueta && t < 33) { // pontos de interrogação: "sem saber pra onde ia chegar"
    for (let i = 0; i < 3; i++) {
      const tt = t - 28 - i * 0.5; if (tt < 0) continue;
      ctx.save(); ctx.globalAlpha = clamp(1 - (tt - 2.5)); const y = 340 - tt * 30 + Math.sin(t * 3 + i) * 8;
      textoContorno(ctx, '?', 1220 + (i - 1) * 90 + 120, y, 90 + i * 10, '#ffd84a', '#5a2a7a', 0.12); ctx.restore();
    }
  }
}

function pegadas(ctx, t, sc) {
  for (let i = 0; i < 16; i++) {
    let x = ((i * 130 - sc * 1) % 2200 + 2200) % 2200 - 140;
    const y = 1000 + (i % 2) * 26;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(255,240,170,0.8)'; ctx.shadowColor = '#ffe08a'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 24, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-9 + k * 6, -28 - Math.abs(k - 1.5) * 2, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

function festa(ctx, t, lt, op = {}) {
  const v = op.variacao || 0;
  ceu(ctx, 'dia', t, 1500, 200, 80); prado(ctx, 'dia', t, 0);
  const z = 1.04 + Math.sin(lt * 0.5) * 0.03;
  camera(ctx, z, W / 2, 700 + v * 40, () => {
    const cima = op.cima && t >= op.cima[0] && t <= op.cima[1];
    criancas(ctx, t, KIDS_FESTA, cima ? 'cima' : (op.pula ? (i) => (i % 2 ? 'pula' : 'palmas') : 'palmas'));
    const pose = cima ? 'cima' : (op.fiel && t > op.fiel ? 'coracao' : (Math.floor(lt / 2.8) % 2 ? 'palmas' : 'canta'));
    desenhaCantora(ctx, t, W / 2, 1060, 0.86, pose);
  });
  notasMusicais(ctx, t, 10);
  if (op.fiel) coracoes(ctx, t, op.fiel, 16);
  if (op.pula) confete(ctx, t, 128.75, 60);
}

function noiteEstrelada(ctx, t, lt, quem) {
  const t0 = t - lt;
  ceu(ctx, 'noite', t, 1600, 160, 70);
  estrelasPromessa(ctx, t, t0 + 0.1, quem === 'abraao2' ? 70 : 45);
  montanhas(ctx, '#141a40', 900, 90, 31, 0, 1);
  ctx.fillStyle = lg(ctx, 0, 860, 0, H, ['#1d2650', '#0d1230']); ctx.fillRect(0, 880, W, H);
  tenda(ctx, 1500, 960, 0.55, 'noite', '#8a7a6a');
  if (quem === 'cantora') {
    ctx.save(); ctx.filter = 'brightness(0.75) saturate(0.8)';
    criancas(ctx, t, [[620, 1050, 0.5, 2], [1270, 1050, 0.5, 4]], 'parado');
    desenhaCantora(ctx, t, 940, 1060, 0.62, 'aponta', { olhar: [0.2, -1], cabeca: -0.12 });
    ctx.restore();
  } else {
    ctx.save(); ctx.filter = 'brightness(0.72) saturate(0.85)';
    const x = quem === 'abraao2' ? 760 : 900;
    abraao(ctx, { x, y: 1050, s: quem === 'abraao2' ? 0.62 : 0.5, olhaCima: true, cabeca: -0.08, piscar: piscar(t, 6),
      bracoD: { a: 2.75, b: 0.05 }, maoD: 'aberta', cajado: false, bracoE: { a: 0.2, b: -0.3 } });
    ctx.restore();
  }
  ctx.fillStyle = rg(ctx, W / 2, 300, 900, ['rgba(120,140,255,0.08)', 'rgba(0,0,0,0)']); ctx.fillRect(0, 0, W, H);
}

function familia(ctx, t, lt, v) {
  ceu(ctx, 'por', t, 400, 420, 130); prado(ctx, 'por', t, 0, false);
  tenda(ctx, 1450, 900, 0.9, 'por', '#c9a77a');
  const z = v === 1 ? 1.0 : 1 + lt * 0.02;
  camera(ctx, z, W / 2, 600, () => {
    if (v === 1) {
      sara(ctx, { x: 960, y: 1600, s: 1.3, bebe: true, bebeAcordado: true, t, piscar: piscar(t, 4), olhar: [0, 0.6], cabeca: Math.sin(t * 1.5) * 0.05 });
    } else {
      sara(ctx, { x: 820, y: 1060, s: 0.82, bebe: true, bebeAcordado: v === 2, t, piscar: piscar(t, 4), olhar: [0.3, 0.6], cabeca: 0.06 });
      abraao(ctx, { x: 1150, y: 1060, s: 0.86, piscar: piscar(t, 2), olhar: [-0.5, 0.3], cabeca: -0.06,
        bracoE: { a: 0.2, b: -0.4 }, bracoD: { a: 2.0 + Math.sin(t * 3) * 0.1, b: 0.5 }, maoD: 'aberta', cajado: false });
    }
  });
  brilhos(ctx, t, 22, [500, 250, 900, 500], 14);
  coracoes(ctx, t, t - lt + 0.3, 10, '#ff8aa0');
}

function porDoSol(ctx, t, lt, acenar = false) {
  ceu(ctx, 'por', t, 960, 600, 150); prado(ctx, 'por', t, 0);
  ctx.fillStyle = 'rgba(255,170,100,0.12)'; ctx.fillRect(0, 0, W, H);
  const fim = acenar && lt > 5.5;
  criancas(ctx, t, KIDS_FESTA, fim ? 'acena' : 'lado');
  desenhaCantora(ctx, t, W / 2, 1060, 0.86, fim ? 'acena' : 'lado');
  brilhos(ctx, t, 14, [200, 200, 1500, 500], 21);
}

function ponteFesta(ctx, t, lt, palavras) {
  fundoFesta(ctx, t);
  const b = batida(t);
  camera(ctx, 1 + b.pulso * 0.012, W / 2, H / 2, () => {
    criancas(ctx, t, KIDS_FESTA, 'pula');
    desenhaCantora(ctx, t, W / 2, 1075, 0.76, 'palmas');
  });
  confete(ctx, t, t - lt, 110);
  palavras.forEach(([tp, txt, cor], i) => palavraGrande(ctx, t, tp, txt, 150 + (i % 2) * 20, cor, 165));
}

function fogueiraNoite(ctx, t, lt) {
  ceu(ctx, 'noite', t, 1600, 150, 60);
  montanhas(ctx, '#141a40', 820, 80, 41, 0, 1);
  ctx.fillStyle = lg(ctx, 0, 780, 0, H, ['#22304e', '#0e1328']); ctx.fillRect(0, 800, W, H);
  tenda(ctx, 300, 880, 0.6, 'noite', '#8a7a6a');
  ctx.save(); ctx.filter = 'brightness(0.85) sepia(0.15)';
  criancas(ctx, t, [[380, 1040, 0.54, 0], [620, 1060, 0.56, 3], [1560, 1060, 0.56, 1], [1770, 1040, 0.54, 2]], 'lado');
  desenhaCantora(ctx, t, 1260, 1070, 0.7, 'lado');
  ctx.restore();
  fogueira(ctx, 930, 1060, 0.85, t);
  [[119.9, 'Confiar...'], [122.52, 'Confiar...'], [125.44, 'Acreditar...'], [127.0, 'Acreditar...']].forEach(([tp, txt], i) => {
    const tt = t - tp; if (tt < 0 || tt > 2.8) return;
    ctx.save(); ctx.globalAlpha = Math.min(smooth(tt * 2), smooth((2.8 - tt) * 1.5));
    ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 30;
    textoContorno(ctx, txt, W / 2, 260 - tt * 12, 130, '#fff3c8', 'rgba(90,50,10,0.5)', 0.06, 'Fredoka');
    ctx.restore();
  });
}

function final(ctx, t, lt) {
  ceu(ctx, 'por', t, 960, 520, 140); prado(ctx, 'por', t, 0);
  raiosCeu(ctx, 960, 520, t, 1, 2.2);
  const sai = smooth((lt - 2.2) / 1.2);
  camera(ctx, 1 + lt * 0.015, W / 2, 800, () => {
    criancas(ctx, t, KIDS_FESTA, 'acena');
    desenhaCantora(ctx, t, W / 2, 1060, 0.86, lt < 2.5 ? 'abertos' : 'acena');
  });
  brilhos(ctx, t, 30, [100, 50, 1700, 700], 33);
  if (lt > 2.3) {
    ctx.fillStyle = `rgba(40,15,50,${0.6 * sai})`; ctx.fillRect(0, 0, W, H);
    titulo(ctx, t, t - lt + 2.4, W / 2, 360, 0.95);
    ctx.save(); ctx.globalAlpha = smooth((lt - 3.2) * 1.5);
    textoContorno(ctx, '“Olhe para o céu e conte as estrelas...”', W / 2, 640, 54, '#ffffff', '#3a1f5a', 0.14, 'Fredoka');
    textoContorno(ctx, 'Gênesis 15:5', W / 2, 715, 46, '#ffd84a', '#3a1f5a', 0.14, 'Fredoka');
    ctx.restore();
  }
}

// ================= COMPOSIÇÃO =================
let BUF = null;
const TRANS = 0.45;
function cenaEm(t) { for (let i = CENAS.length - 1; i >= 0; i--) if (t >= CENAS[i].t0) return i; return 0; }
function desenhaCena(ctx, i, t) { ctx.save(); CENAS[i].fn(ctx, t, t - CENAS[i].t0); ctx.restore(); }

function quadro(ctx, t) {
  const i = cenaEm(t);
  const dt = t - CENAS[i].t0;
  if (i > 0 && dt < TRANS) {
    desenhaCena(ctx, i - 1, t);
    if (!BUF) { BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; }
    const b = BUF.getContext('2d'); b.clearRect(0, 0, W, H);
    desenhaCena(b, i, t);
    ctx.save(); ctx.globalAlpha = smooth(dt / TRANS); ctx.drawImage(BUF, 0, 0); ctx.restore();
  } else desenhaCena(ctx, i, t);
  acabamento(ctx, 0.3);
  legenda(ctx, t);
  // fade in/out
  const dur = window.ANALISE ? window.ANALISE.dur : 172.4;
  const f = Math.max(clamp(1 - t / 0.8), clamp((t - (dur - 1.2)) / 1.2));
  if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); }
}
