// Textos sobre o vídeo 3D (legenda karaokê, título, palavras grandes) — mesmos da versão 2D.
// Depende de ../clipe/js/base.js (utilidades) e de LETRA/ANALISE.
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

