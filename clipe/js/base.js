// Utilidades comuns do clipe "Abraão Confiou".
// Tudo é função pura do tempo t (segundos), para o render ser determinístico.
const W = 1920, H = 1080, FPS = 24;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = (t) => Math.pow(clamp(t), 3);
const easeOutBack = (t) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const TAU = Math.PI * 2;

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

function lg(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (stops.length - 1), c));
  return g;
}
function rg(ctx, x, y, r, stops, r0 = 0, x0 = x, y0 = y) {
  const g = ctx.createRadialGradient(x0, y0, r0, x, y, r);
  stops.forEach((c, i) => Array.isArray(c) ? g.addColorStop(c[0], c[1]) : g.addColorStop(i / (stops.length - 1), c));
  return g;
}

// Caminho suave passando por pontos (Catmull-Rom -> Bézier).
function curva(ctx, pts, fechada = false, mover = true) {
  const n = pts.length;
  const P = (i) => fechada ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  if (mover) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
  const lim = fechada ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (fechada) ctx.closePath();
}
function forma(ctx, pts, fill, fechada = true) {
  ctx.beginPath(); curva(ctx, pts, fechada); ctx.fillStyle = fill; ctx.fill();
}

// Sombra/luz suave: desenha com desfoque (para aparência pintada).
function suave(ctx, blur, fn) {
  ctx.save(); ctx.filter = `blur(${blur}px)`; fn(); ctx.restore();
}

// Membro afunilado (cápsula) de a até b.
function membro(ctx, ax, ay, bx, by, ra, rb, fill) {
  const ang = Math.atan2(by - ay, bx - ax), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.beginPath();
  ctx.moveTo(ax + nx * ra, ay + ny * ra);
  ctx.lineTo(bx + nx * rb, by + ny * rb);
  ctx.arc(bx, by, rb, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(ax - nx * ra, ay - ny * ra);
  ctx.arc(ax, ay, ra, ang - Math.PI / 2, ang + Math.PI / 2, true);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}

// Texturas pré-geradas (determinísticas).
const TEX = {};
function textura(nome, w, h, fn) {
  if (!TEX[nome]) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); TEX[nome] = c; }
  return TEX[nome];
}
function padrao(ctx, nome) { return ctx.createPattern(TEX[nome], 'repeat'); }

function criarTexturas() {
  // Jeans "lavado" (acid wash): manchas claras sobre azul.
  textura('jeans', 256, 256, (c, w, h) => {
    c.fillStyle = '#a3bcd6'; c.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 700; i++) { // marmorizado suave
      const x = r() * w, y = r() * h, s = 3 + r() * 14;
      c.fillStyle = r() < 0.6 ? `rgba(232,240,250,${0.06 + r() * 0.14})` : `rgba(80,115,165,${0.05 + r() * 0.1})`;
      c.beginPath(); c.ellipse(x, y, s * 0.5, s, 0, 0, TAU); c.fill();
    }
    for (let i = 0; i < 3000; i++) { // trama vertical
      c.fillStyle = r() < 0.5 ? `rgba(40,70,120,${r() * 0.12})` : `rgba(255,255,255,${r() * 0.1})`;
      c.fillRect(r() * w, r() * h, 1, 3 + r() * 6);
    }
  });
  // Areia
  textura('areia', 256, 256, (c, w, h) => {
    c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = r() < 0.5 ? `rgba(255,240,210,${r() * 0.25})` : `rgba(120,70,30,${r() * 0.18})`;
      c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  });
  // Grama
  textura('grama', 256, 128, (c, w, h) => {
    const r = rng(23);
    for (let i = 0; i < 1400; i++) {
      const x = r() * w, y = r() * h;
      c.strokeStyle = r() < 0.5 ? `rgba(200,240,120,${r() * 0.35})` : `rgba(20,80,30,${r() * 0.3})`;
      c.lineWidth = 1 + r();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 4, y - 4 - r() * 8); c.stroke();
    }
  });
  // Tecido listrado (túnicas)
  textura('papel', 512, 512, (c, w, h) => { // grão de pintura para todo o quadro
    const r = rng(99);
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = r() < 0.5 ? `rgba(255,255,255,${r() * 0.05})` : `rgba(0,0,0,${r() * 0.05})`;
      c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  });
}

// ---------- Música ----------
function nivelVoz(t) {
  const A = window.ANALISE; if (!A) return 0;
  const i = clamp(Math.floor(t * A.fps), 0, A.voc.length - 1);
  // média curta para suavizar
  let s = 0, n = 0;
  for (let k = -1; k <= 1; k++) { const j = clamp(i + k, 0, A.voc.length - 1); s += A.voc[j]; n++; }
  return s / n;
}
function batida(t) { // 1 logo na batida, decai até a próxima
  const b = window.ANALISE ? window.ANALISE.beats : [];
  let lo = 0, hi = b.length - 1;
  if (!b.length || t < b[0]) return { fase: 0, pulso: 0, idx: -1 };
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (b[m] <= t) lo = m; else hi = m - 1; }
  const p = b[lo], q = b[lo + 1] || p + 0.7;
  const fase = clamp((t - p) / (q - p));
  return { fase, pulso: Math.pow(1 - fase, 3), idx: lo };
}
