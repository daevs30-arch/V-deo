// Cenários pintados em camadas (parallax) e efeitos.

const PALETAS = {
  dia: { ceu: ['#5fb4ee', '#9fd6f6', '#e8f4f6'], sol: '#fff6c8', luz: 'rgba(255,250,220,', nuvem: '#ffffff', monte: ['#9fb6c9', '#b9c7cf'], areia: ['#f0cf93', '#e3b06e', '#d39a58'], grama: ['#8fcf5a', '#62b048', '#3f8f3a'] },
  amanhecer: { ceu: ['#5d6fb8', '#e89aa0', '#ffd39a'], sol: '#fff0b0', luz: 'rgba(255,220,160,', nuvem: '#ffd6c4', monte: ['#8d7aa0', '#b58f9f'], areia: ['#e9b689', '#d69a6d', '#bf7f55'], grama: ['#9cc06a', '#6e9e4e', '#4b7a3e'] },
  por: { ceu: ['#3d3a7a', '#d9677a', '#ffb45e'], sol: '#ffe08a', luz: 'rgba(255,190,120,', nuvem: '#ffb7a0', monte: ['#7a4f7e', '#a2607a'], areia: ['#e59a6a', '#c9744e', '#9e5640'], grama: ['#b3a24f', '#8a7f3c', '#5e5a30'] },
  noite: { ceu: ['#070b26', '#16245a', '#2e3f7e'], sol: '#fdf6dc', luz: 'rgba(170,190,255,', nuvem: '#3a4880', monte: ['#1c2350', '#252e62'], areia: ['#3c3f6e', '#2e3160', '#232650'], grama: ['#2a4a52', '#1f3a46', '#162c3a'] },
};

function ceu(ctx, pal, t, solX = 1450, solY = 260, solR = 90) {
  const P = PALETAS[pal];
  ctx.fillStyle = lg(ctx, 0, 0, 0, H * 0.75, P.ceu); ctx.fillRect(0, 0, W, H);
  if (pal === 'noite') {
    estrelasCeu(ctx, t, 1);
    ctx.fillStyle = rg(ctx, solX, solY, solR * 3, ['rgba(255,250,220,0.35)', 'rgba(255,250,220,0)']); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.sol; ctx.beginPath(); ctx.arc(solX, solY, solR * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = PALETAS.noite.ceu[1]; ctx.beginPath(); ctx.arc(solX + solR * 0.25, solY - solR * 0.12, solR * 0.48, 0, TAU); ctx.fill();
    return;
  }
  ctx.fillStyle = rg(ctx, solX, solY, solR * 6, [P.luz + '0.75)', P.luz + '0.25)', P.luz + '0)']); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rg(ctx, solX, solY, solR, ['#ffffff', P.sol, P.sol]); ctx.beginPath(); ctx.arc(solX, solY, solR, 0, TAU); ctx.fill();
  nuvens(ctx, t, P.nuvem);
}

function nuvens(ctx, t, cor, alpha = 0.9) {
  const r = rng(5);
  for (let i = 0; i < 6; i++) {
    const y = 90 + r() * 260, s = 0.6 + r() * 0.8, v = 8 + r() * 14;
    let x = ((r() * (W + 600) + t * v) % (W + 600)) - 300;
    nuvem(ctx, x, y, s, cor, alpha * (0.6 + r() * 0.4), i);
  }
}
function nuvem(ctx, x, y, s, cor, a, semente) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  const r = rng(semente + 40);
  ctx.fillStyle = cor;
  suave(ctx, 2, () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const cx = -120 + i * 48, cy = -Math.sin(i / 5 * Math.PI) * 40 + r() * 10; ctx.moveTo(cx + 60, cy); ctx.arc(cx, cy, 45 + r() * 25, 0, TAU); }
    ctx.moveTo(-150, 10); ctx.ellipse(0, 10, 160, 30, 0, 0, TAU); ctx.fill();
  });
  ctx.restore();
}

function estrelasCeu(ctx, t, aparecer = 1, n = 260) {
  const r = rng(77);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H * 0.8, s = 0.6 + r() * 2.2, ph = r() * TAU, lim = r();
    if (lim > aparecer) continue;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + r() * 3) + ph);
    ctx.fillStyle = `rgba(255,255,240,${tw})`;
    ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    if (s > 2.2) { ctx.fillStyle = `rgba(255,250,220,${tw * 0.25})`; ctx.beginPath(); ctx.arc(x, y, s * 4, 0, TAU); ctx.fill(); }
  }
}

// estrelas grandes de 4 pontas (brilho), aparecendo uma a uma
function estrelasPromessa(ctx, t, t0, n = 40, cx = W / 2, cy = 330) {
  const r = rng(321);
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * W * 0.95, y = cy + (r() - 0.5) * 520, tt = t - t0 - i * 0.06;
    if (tt < 0) continue;
    const s = easeOutBack(tt * 2.5) * (8 + r() * 14) * (0.8 + 0.2 * Math.sin(t * 4 + i));
    brilho(ctx, x, y, s, `rgba(255,245,200,0.95)`);
  }
}
function brilho(ctx, x, y, s, cor) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = rg(ctx, 0, 0, s * 2.5, ['rgba(255,250,220,0.6)', 'rgba(255,250,220,0)']);
  ctx.beginPath(); ctx.arc(0, 0, s * 2.5, 0, TAU); ctx.fill();
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.moveTo(0, -s * 2); ctx.quadraticCurveTo(0, 0, s * 2, 0); ctx.quadraticCurveTo(0, 0, 0, s * 2); ctx.quadraticCurveTo(0, 0, -s * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 2); ctx.fill();
  ctx.restore();
}

function montanhas(ctx, cor, y, amp, semente, scroll = 0, blur = 0) {
  const r = rng(semente); const pts = [];
  const off = ((scroll % 400) + 400) % 400;
  for (let i = -1; i < 9; i++) pts.push([i * 400 - off + (r() * 100), y - amp * (0.4 + r() * 0.6)]);
  const doit = () => { ctx.beginPath(); ctx.moveTo(-400, H); curva(ctx, pts, false, false); ctx.lineTo(W + 400, H); ctx.closePath(); ctx.fillStyle = cor; ctx.fill(); };
  blur ? suave(ctx, blur, doit) : doit();
}

function dunas(ctx, pal, t, scroll = 0) {
  const P = PALETAS[pal];
  montanhas(ctx, P.monte[0], 640, 160, 3, scroll * 0.1, 3);
  montanhas(ctx, P.monte[1], 700, 90, 4, scroll * 0.2, 1);
  const camadas = [[730, 70, P.areia[0], 0.35], [820, 60, P.areia[1], 0.6], [930, 50, P.areia[2], 1]];
  camadas.forEach(([y, amp, cor, par], k) => {
    const off = scroll * par;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, y - Math.sin((x + off) / (260 + k * 90) + k) * amp - Math.sin((x + off) / 97 + k * 3) * amp * 0.2);
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, y - amp, 0, H, [cor, P.areia[2]]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = padrao(ctx, 'areia'); ctx.translate(-off % 256, 0); ctx.fillRect(0, y - amp, W + 256, H); ctx.restore();
  });
}

function prado(ctx, pal, t, scroll = 0, tendas = true) {
  const P = PALETAS[pal];
  montanhas(ctx, P.monte[0], 640, 150, 13, scroll * 0.1, 3);
  montanhas(ctx, P.monte[1], 700, 80, 14, scroll * 0.2, 1);
  // colinas
  const col = [[720, 50, P.grama[0], 0.35], [800, 40, P.grama[1], 0.6]];
  col.forEach(([y, amp, cor, par], k) => {
    const off = scroll * par;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, y - Math.sin((x + off) / (300 + k * 120) + k * 2) * amp);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = lg(ctx, 0, y - amp, 0, H, [cor, P.grama[2]]); ctx.fill();
    if (k === 0) {
      if (tendas) { tenda(ctx, 380 - off % (W + 600) + (off > 0 ? W + 600 : 0), y + 10, 0.55, pal, '#c9a77a'); tenda(ctx, 1560 - off * 1, y + 20, 0.45, pal, '#b98d6a'); }
      oliveira(ctx, 1180 - off, y + 15, 0.55, pal); oliveira(ctx, 160 - off + W + 300, y + 10, 0.5, pal);
    }
  });
  // chão da frente
  const yc = 900;
  ctx.fillStyle = lg(ctx, 0, yc - 30, 0, H, [P.grama[1], P.grama[2]]);
  ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 20; x += 40) ctx.lineTo(x, yc - Math.sin((x + scroll) / 400) * 20); ctx.lineTo(W, H); ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = padrao(ctx, 'grama'); ctx.translate(-scroll % 256, 0); ctx.fillRect(0, yc - 40, W + 256, H); ctx.restore();
  flores(ctx, t, scroll, pal);
}

function flores(ctx, t, scroll, pal) {
  const r = rng(55); const cores = ['#ff7aa8', '#ffd84a', '#ffffff', '#b98cff', '#ff9a4a'];
  const esc = pal === 'noite' ? 0.35 : 1;
  for (let i = 0; i < 60; i++) {
    let x = (r() * (W + 200) - scroll) % (W + 200); if (x < -100) x += W + 200;
    const y = 900 + r() * 170, s = 4 + r() * 6 * (y - 880) / 170;
    const sw = Math.sin(t * 2 + i) * 2;
    ctx.globalAlpha = esc;
    ctx.strokeStyle = '#3f8f3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + s * 2.5); ctx.lineTo(x + sw, y); ctx.stroke();
    ctx.fillStyle = cores[i % cores.length];
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ctx.beginPath(); ctx.arc(x + sw + Math.cos(a) * s * 0.7, y + Math.sin(a) * s * 0.7, s * 0.55, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.arc(x + sw, y, s * 0.4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function tenda(ctx, x, y, s, pal, cor = '#c9a77a') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const esc = pal === 'noite' ? 0.45 : pal === 'por' ? 0.8 : 1;
  ctx.filter = `brightness(${esc})`;
  sombraChao(ctx, 300, 30, 0.2);
  ctx.fillStyle = cor;
  ctx.beginPath(); ctx.moveTo(-300, 0); ctx.lineTo(-220, -260); ctx.lineTo(0, -330); ctx.lineTo(220, -260); ctx.lineTo(300, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(80,50,20,0.25)'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 80 - 12, 0); ctx.lineTo(i * 50 - 6, -300); ctx.lineTo(i * 50 + 6, -300); ctx.lineTo(i * 80 + 12, 0); ctx.fill(); }
  ctx.fillStyle = '#4a2f1c'; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(0, -200); ctx.lineTo(60, 0); ctx.fill();
  ctx.fillStyle = pal === 'noite' ? 'rgba(255,170,80,0.75)' : 'rgba(30,15,5,0.5)'; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(0, -160); ctx.lineTo(40, 0); ctx.fill();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-220, -260); ctx.lineTo(-340, 10); ctx.moveTo(220, -260); ctx.lineTo(340, 10); ctx.stroke();
  ctx.restore();
}

function oliveira(ctx, x, y, s, pal) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (pal === 'noite') ctx.filter = 'brightness(0.4)'; else if (pal === 'por') ctx.filter = 'brightness(0.85) sepia(0.2)';
  ctx.fillStyle = '#6a4a30'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-10, -100, -40, -180); ctx.lineTo(10, -190); ctx.quadraticCurveTo(10, -100, 24, 0); ctx.fill();
  const r = rng(9);
  for (let i = 0; i < 14; i++) {
    const a = r() * TAU, d = r() * 110;
    ctx.fillStyle = ['#6f8f4a', '#5a7a3c', '#87a65a'][i % 3];
    ctx.beginPath(); ctx.arc(Math.cos(a) * d * 1.3, -250 + Math.sin(a) * d * 0.6, 60 + r() * 30, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function palmeira(ctx, x, y, s, t, pal = 'dia') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 34; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(30, -250, 10, -500); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,40,20,0.4)'; ctx.lineWidth = 4;
  for (let i = 1; i < 14; i++) { const yy = -i * 36; ctx.beginPath(); ctx.moveTo(-14 + i * 1.2, yy); ctx.lineTo(16 + i * 1.2, yy - 6); ctx.stroke(); }
  const sw = Math.sin(t * 1.3) * 0.05;
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i - 3.5) * 0.42 + sw;
    ctx.save(); ctx.translate(10, -500); ctx.rotate(a);
    ctx.fillStyle = i % 2 ? '#3f8a3e' : '#56a24a';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(120, -40, 230, 40); ctx.quadraticCurveTo(120, 0, 0, 14); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#6a4a2a'; for (const [dx, dy] of [[-8, -490], [16, -486], [4, -478]]) { ctx.beginPath(); ctx.arc(dx, dy, 12, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Cidade de Ur: casas de tijolo de barro e zigurate ao fundo.
function cidadeUr(ctx, t, zoom = 1) {
  ceu(ctx, 'dia', t, 1500, 200, 80);
  montanhas(ctx, '#c9b9a6', 640, 80, 21, 0, 2);
  // zigurate
  ctx.save(); ctx.translate(560, 640);
  const niveis = [[420, 70, '#c79a68'], [320, 70, '#d2a774'], [220, 70, '#dcb381'], [120, 60, '#e4be8e']];
  let y = 0;
  for (const [w, h, c] of niveis) { ctx.fillStyle = c; ctx.fillRect(-w / 2, y - h, w, h); ctx.fillStyle = 'rgba(80,40,10,0.18)'; ctx.fillRect(w / 2 - 40, y - h, 40, h); y -= h; }
  ctx.fillStyle = '#b8875a'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-14, y); ctx.lineTo(14, y); ctx.lineTo(30, 0); ctx.fill();
  ctx.restore();
  // chão
  ctx.fillStyle = lg(ctx, 0, 650, 0, H, ['#e7c896', '#cfa46c']); ctx.fillRect(0, 640, W, H);
  ctx.save(); ctx.fillStyle = padrao(ctx, 'areia'); ctx.fillRect(0, 640, W, H); ctx.restore();
  // casas
  const casas = [[90, 760, 260, 200], [330, 740, 200, 170], [1300, 750, 240, 210], [1560, 770, 300, 230], [1840, 760, 220, 190]];
  palmeira(ctx, 1450, 760, 0.8, t); palmeira(ctx, 250, 740, 0.7, t + 1);
  for (const [x, yb, w, h] of casas) casa(ctx, x, yb, w, h);
  palmeira(ctx, 1780, 880, 0.95, t + 2);
}
function casa(ctx, x, yb, w, h) {
  ctx.save(); ctx.translate(x, yb);
  ctx.fillStyle = '#dcb07a'; ctx.fillRect(-w / 2, -h, w, h);
  ctx.fillStyle = '#c99a62'; ctx.fillRect(-w / 2 - 8, -h - 14, w + 16, 18);
  ctx.fillStyle = 'rgba(90,50,20,0.2)'; ctx.fillRect(w / 2 - w * 0.22, -h, w * 0.22, h);
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(-w * 0.12, 0); ctx.lineTo(-w * 0.12, -h * 0.45); ctx.arc(0, -h * 0.45, w * 0.12, Math.PI, 0); ctx.lineTo(w * 0.12, 0); ctx.fill();
  ctx.fillStyle = '#4a2f1c'; ctx.fillRect(-w * 0.38, -h * 0.75, w * 0.14, h * 0.16);
  ctx.strokeStyle = 'rgba(120,80,40,0.25)'; ctx.lineWidth = 2;
  for (let yy = -h + 20; yy < 0; yy += 22) { ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(w / 2, yy); ctx.stroke(); }
  ctx.restore();
}

// Raios de luz vindos do céu.
function raiosCeu(ctx, x, y, t, a = 1, larg = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const ang = Math.PI / 2 + (i - 4) * 0.13 * larg + Math.sin(t * 0.6 + i) * 0.03;
    const comp = 1500, w = 0.05 + (i % 3) * 0.02;
    ctx.fillStyle = lg(ctx, x, y, x + Math.cos(ang) * comp, y + Math.sin(ang) * comp, [`rgba(255,240,190,${0.22 * a})`, 'rgba(255,240,190,0)']);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang - w) * comp, y + Math.sin(ang - w) * comp); ctx.lineTo(x + Math.cos(ang + w) * comp, y + Math.sin(ang + w) * comp); ctx.fill();
  }
  ctx.fillStyle = rg(ctx, x, y, 320, [`rgba(255,250,220,${0.8 * a})`, `rgba(255,240,190,${0.25 * a})`, 'rgba(255,240,190,0)']);
  ctx.beginPath(); ctx.arc(x, y, 320, 0, TAU); ctx.fill();
  ctx.restore();
}

// Fundo de festa: raios coloridos girando.
function fundoFesta(ctx, t, cores = ['#ff7a59', '#ffb03a', '#ffd84a', '#5fd0a0', '#4ab0f0', '#a07aff'], cx = W / 2, cy = H * 0.55) {
  ctx.fillStyle = rg(ctx, cx, cy, W * 0.8, ['#fff8e0', '#ffd27a', '#ff9a5a']); ctx.fillRect(0, 0, W, H);
  const n = 18, rot = t * 0.25;
  for (let i = 0; i < n; i++) {
    const a0 = rot + i * TAU / n, a1 = a0 + TAU / n * 0.5;
    ctx.fillStyle = cores[i % cores.length]; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * 2400, cy + Math.sin(a0) * 2400); ctx.lineTo(cx + Math.cos(a1) * 2400, cy + Math.sin(a1) * 2400); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = rg(ctx, cx, cy, 700, ['rgba(255,255,240,0.9)', 'rgba(255,255,240,0)']); ctx.fillRect(0, 0, W, H);
  // chão de palco
  ctx.fillStyle = lg(ctx, 0, 900, 0, H, ['#7a4fd0', '#4a2f90']); ctx.beginPath(); ctx.ellipse(W / 2, 1010, 1200, 150, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(W / 2, 990, 900, 90, 0, 0, TAU); ctx.fill();
}

function fogueira(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fl = 0.85 + Math.sin(t * 17) * 0.08 + Math.sin(t * 7.3) * 0.07;
  ctx.fillStyle = rg(ctx, 0, -80, 700 * fl, ['rgba(255,170,60,0.45)', 'rgba(255,120,40,0.12)', 'rgba(255,120,40,0)']);
  ctx.beginPath(); ctx.arc(0, -80, 700 * fl, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(80, -40); ctx.moveTo(90, 0); ctx.lineTo(-80, -40); ctx.stroke();
  for (let k = 0; k < 3; k++) {
    const hh = [230, 170, 110][k] * fl, w = [80, 60, 36][k], c = ['#ff6a2a', '#ffb02a', '#fff2a0'][k];
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-w, -20);
    ctx.quadraticCurveTo(-w * 0.8, -hh * 0.5, Math.sin(t * 9 + k) * 14, -hh);
    ctx.quadraticCurveTo(w * 0.8, -hh * 0.5, w, -20); ctx.closePath(); ctx.fill();
  }
  // faíscas
  const r = rng(4);
  for (let i = 0; i < 14; i++) {
    const ph = (t * (0.5 + r()) + r()) % 1, sx = (r() - 0.5) * 120 + Math.sin(t * 3 + i) * 20 * ph;
    ctx.fillStyle = `rgba(255,220,120,${1 - ph})`; ctx.beginPath(); ctx.arc(sx, -60 - ph * 380, 4 * (1 - ph) + 1, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------- efeitos ----------
function confete(ctx, t, t0, n = 120) {
  const r = rng(888), cores = ['#ff5a7a', '#ffd84a', '#5fd0a0', '#4ab0f0', '#a07aff', '#ff9a4a'];
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, v = 160 + r() * 200, ph = r() * 6, c = cores[i % cores.length], s = 8 + r() * 10;
    const tt = t - t0 + ph;
    if (tt < 0) continue;
    const y = ((tt * v) % (H + 100)) - 60, x = x0 + Math.sin(tt * 2 + i) * 40;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tt * 3 + i); ctx.scale(1, Math.sin(tt * 6 + i));
    ctx.fillStyle = c; ctx.fillRect(-s / 2, -s / 3, s, s * 0.66); ctx.restore();
  }
}
function coracoes(ctx, t, t0, n = 14, cor = '#ff5a7a') {
  const r = rng(31);
  for (let i = 0; i < n; i++) {
    const x = 150 + r() * (W - 300), tt = t - t0 - r() * 1.5;
    if (tt < 0 || tt > 3) continue;
    const y = 900 - tt * 260, a = clamp(1 - tt / 3), s = 18 + r() * 22;
    ctx.globalAlpha = a; ctx.fillStyle = cor;
    coracao(ctx, x + Math.sin(tt * 3 + i) * 30, y, s);
    ctx.globalAlpha = 1;
  }
}
function coracao(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); ctx.fill();
}
function brilhos(ctx, t, n, area, semente = 1) {
  const r = rng(semente);
  for (let i = 0; i < n; i++) {
    const x = area[0] + r() * area[2], y = area[1] + r() * area[3], ph = r() * TAU, sp = 2 + r() * 3;
    const s = Math.max(0, Math.sin(t * sp + ph)) * (6 + r() * 8);
    if (s > 0.5) brilho(ctx, x, y, s, 'rgba(255,250,220,0.95)');
  }
}
function notasMusicais(ctx, t, n = 8) {
  const r = rng(61);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < n; i++) {
    const per = 4 + r() * 2, ph = (t / per + r()) % 1, x = 100 + r() * (W - 200) + Math.sin(ph * 8) * 30, y = 820 - ph * 700;
    ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
    ctx.font = `700 ${40 + r() * 30}px Fredoka`; ctx.fillText(r() < 0.5 ? '♪' : '♫', x, y);
  }
  ctx.globalAlpha = 1;
}

// Vinheta e grão de pintura (acabamento "pintado").
function acabamento(ctx, forca = 0.35) {
  ctx.fillStyle = rg(ctx, W / 2, H / 2, W * 0.75, ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', `rgba(20,10,30,${forca})`]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = padrao(ctx, 'papel'); ctx.fillRect(0, 0, W, H);
}
