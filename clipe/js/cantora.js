// A cantora — baseada na foto: cabelo preto chanel, óculos brancos,
// blusa canelada verde-oliva, colar com estrela, calça jeans clara larga
// e sandália marrom. Coordenadas: pés em (0,0), cabeça em y≈-1010.
const PELE = { base: '#f0c3a2', sombra: '#d4977a', luz: '#fbe2cf', blush: 'rgba(235,120,120,0.32)' };
const CABELO = { base: '#17110f', luz: '#4a3c3a', brilho: 'rgba(150,170,210,0.35)' };

// o: { x, y, s, t, boca(0..1), piscar(0..1), bracoE:{a,b}, bracoD:{a,b}, maoE, maoD,
//      inclina, cabeca, olhar, passo (null ou fase), salto, flip }
function cantora(ctx, o) {
  const t = o.t || 0;
  ctx.save();
  ctx.translate(o.x, o.y - (o.salto || 0));
  ctx.scale(o.s * (o.flip ? -1 : 1), o.s);

  // sombra no chão
  suave(ctx, 10, () => {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(0, 4 + (o.salto || 0) / o.s, 190 - (o.salto || 0) * 0.3, 26, 0, 0, TAU); ctx.fill();
  });

  const passo = o.passo;
  const pe = (lado) => passo == null ? 0 : Math.sin(passo + (lado > 0 ? Math.PI : 0));

  // ----- pés (atrás da barra) -----
  for (const lado of [-1, 1]) {
    const px = lado * 62 + pe(lado) * 24, py = -Math.max(0, pe(lado)) * 14;
    sandalia(ctx, px, py, lado);
  }

  // ----- calça -----
  ctx.save();
  ctx.rotate((o.inclina || 0) * 0.25);
  calca(ctx, pe);
  ctx.restore();

  // ----- tronco (com inclinação) -----
  ctx.save();
  ctx.translate(0, -560); ctx.rotate(o.inclina || 0); ctx.translate(0, 560);
  // braço de trás? (ambos à frente do tronco, desenhados depois)
  tronco(ctx);
  pescocoECabeca(ctx, o, t);
  for (const [lado, br, mao] of [[-1, o.bracoE, o.maoE], [1, o.bracoD, o.maoD]]) {
    braco(ctx, lado, br || { a: 0.12, b: 0.1 }, mao || 'aberta');
  }
  ctx.restore();

  ctx.restore();
}

function sandalia(ctx, x, y, lado) {
  ctx.save(); ctx.translate(x, y);
  // sola plataforma
  ctx.fillStyle = lg(ctx, 0, -18, 0, 2, ['#9a5a3c', '#6e3b25']);
  ctx.beginPath(); ctx.ellipse(lado * 6, -8, 46, 14, 0, 0, TAU); ctx.fill();
  // dedos
  ctx.fillStyle = PELE.base;
  ctx.beginPath(); ctx.ellipse(lado * 8, -22, 36, 13, 0, Math.PI, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#e9a9a0';
    ctx.beginPath(); ctx.ellipse(lado * (-18 + i * 12) + lado * 8, -27 + Math.abs(i - 1.5) * 1.2, 4.2, 3.2, 0, 0, TAU); ctx.fill();
  }
  // tiras com tachas douradas
  ctx.fillStyle = '#8a4a2e';
  ctx.fillRect(lado * 8 - 34, -30, 68, 11);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = rg(ctx, lado * 8 - 26 + i * 13, -25, 4, ['#fff2b0', '#c9962a']);
    ctx.beginPath(); ctx.arc(lado * 8 - 26 + i * 13, -25, 3.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function calca(ctx, pe) {
  const yC = -600; // cintura alta
  const pernas = [-1, 1].map((lado) => {
    const off = pe(lado) * 26;
    return [
      [lado * 2, yC], [lado * 78, yC], [lado * 99, -515], [lado * 112, -330],
      [lado * 132 + off, -120], [lado * 148 + off * 1.2, -12], [lado * 85 + off, -2], [lado * 14 + off * 0.8, -8],
      [lado * 10 + off * 0.5, -200], [lado * 4, -430],
    ];
  });
  for (let k = 0; k < 2; k++) {
    const lado = k ? 1 : -1, pts = pernas[k];
    ctx.save();
    ctx.beginPath(); curva(ctx, pts, true);
    ctx.fillStyle = padrao(ctx, 'jeans'); ctx.fill();
    ctx.clip();
    // volume: bordas mais escuras, centro claro (lavagem)
    ctx.fillStyle = lg(ctx, lado * 150, 0, 0, 0, [[0, 'rgba(40,70,120,0.45)'], [0.35, 'rgba(255,255,255,0.08)'], [0.65, 'rgba(255,255,255,0.18)'], [1, 'rgba(40,70,120,0.4)']]);
    ctx.fillRect(-200, -620, 400, 640);
    // dobras verticais
    suave(ctx, 4, () => {
      ctx.strokeStyle = 'rgba(50,80,130,0.35)'; ctx.lineWidth = 6;
      for (const fx of [0.45, 0.75]) {
        ctx.beginPath(); ctx.moveTo(lado * (30 + fx * 60), -420);
        ctx.quadraticCurveTo(lado * (40 + fx * 80), -200, lado * (30 + fx * 110) + pe(lado) * 20, -10); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(lado * 60, -400); ctx.quadraticCurveTo(lado * 70, -200, lado * 80 + pe(lado) * 20, -20); ctx.stroke();
    });
    // dobras da barra amontoada
    ctx.strokeStyle = 'rgba(60,90,140,0.4)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(lado * (30 + i * 30), -40 - i * 8); ctx.quadraticCurveTo(lado * (50 + i * 30), -60, lado * (70 + i * 28), -30 - i * 6); ctx.stroke();
    }
    // sombra sob o cós
    ctx.fillStyle = lg(ctx, 0, yC, 0, yC + 60, ['rgba(30,50,90,0.4)', 'rgba(30,50,90,0)']);
    ctx.fillRect(-200, yC, 400, 60);
    ctx.restore();
  }
  // cós, botão, zíper e bolsos
  ctx.fillStyle = lg(ctx, 0, yC - 6, 0, yC + 30, ['#b9cde2', '#93abc7']);
  ctx.beginPath(); ctx.moveTo(-80, yC - 4); ctx.lineTo(80, yC - 4); ctx.lineTo(84, yC + 30); ctx.lineTo(-84, yC + 30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(200,140,60,0.7)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(-80, yC + 25); ctx.lineTo(80, yC + 25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12, yC + 30); ctx.lineTo(-12, yC + 120); ctx.quadraticCurveTo(-10, yC + 135, 6, yC + 140); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-58, yC + 32); ctx.quadraticCurveTo(-55, yC + 80, -95, yC + 95); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(58, yC + 32); ctx.quadraticCurveTo(55, yC + 80, 95, yC + 95); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(40,70,120,0.55)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-62, yC + 30); ctx.quadraticCurveTo(-60, yC + 85, -98, yC + 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(62, yC + 30); ctx.quadraticCurveTo(60, yC + 85, 98, yC + 100); ctx.stroke();
  ctx.fillStyle = rg(ctx, 2, yC + 10, 9, ['#f2f2f2', '#8a8f99']);
  ctx.beginPath(); ctx.arc(2, yC + 11, 8, 0, TAU); ctx.fill();
  // passantes
  ctx.fillStyle = '#a7bdd6';
  for (const x of [-70, -35, 35, 70]) ctx.fillRect(x - 4, yC - 6, 8, 30);
}

function tronco(ctx) {
  const pts = [[-78, -598], [-86, -650], [-94, -705], [-100, -760], [-104, -786], [-58, -796],
    [-34, -760], [0, -742], [34, -760], [58, -796], [104, -786], [100, -760], [94, -705], [86, -650], [78, -598], [0, -592]];
  // pescoço e colo (pele por trás do decote)
  ctx.fillStyle = PELE.base;
  ctx.beginPath(); ctx.moveTo(-60, -800); ctx.lineTo(60, -800); ctx.lineTo(40, -735); ctx.lineTo(-40, -735); ctx.closePath(); ctx.fill();
  ctx.save();
  ctx.beginPath(); curva(ctx, pts, true);
  ctx.fillStyle = '#6b6431'; ctx.fill();
  ctx.clip();
  // canelado: listras verticais acompanhando o corpo
  for (let i = -24; i <= 24; i++) {
    const x = i * 4.6;
    ctx.strokeStyle = i % 2 ? 'rgba(255,250,200,0.10)' : 'rgba(30,30,0,0.16)';
    ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(x * 1.06, -800); ctx.quadraticCurveTo(x * 1.12, -700, x * 0.86, -590); ctx.stroke();
  }
  // volume: lados escuros, busto iluminado
  ctx.fillStyle = lg(ctx, -110, 0, 110, 0, [[0, 'rgba(30,28,5,0.55)'], [0.3, 'rgba(255,255,220,0.04)'], [0.5, 'rgba(255,255,220,0.1)'], [0.75, 'rgba(0,0,0,0.05)'], [1, 'rgba(30,28,5,0.6)']]);
  ctx.fillRect(-120, -810, 240, 230);
  suave(ctx, 10, () => {
    ctx.fillStyle = 'rgba(255,250,210,0.16)';
    ctx.beginPath(); ctx.ellipse(-42, -718, 30, 22, 0, 0, TAU); ctx.ellipse(42, -718, 30, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(20,20,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, -672, 80, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(20,20,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0, -600, 90, 14, 0, 0, TAU); ctx.fill();
  });
  // costura lateral (princesa)
  ctx.strokeStyle = 'rgba(30,30,0,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-70, -770); ctx.quadraticCurveTo(-55, -690, -64, -600); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(70, -770); ctx.quadraticCurveTo(55, -690, 64, -600); ctx.stroke();
  ctx.restore();
  // borda do decote
  ctx.strokeStyle = '#5a5427'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-58, -796); ctx.quadraticCurveTo(-46, -748, 0, -742); ctx.quadraticCurveTo(46, -748, 58, -796); ctx.stroke();
  // sombra do decote no colo
  suave(ctx, 5, () => {
    ctx.fillStyle = 'rgba(160,90,60,0.25)';
    ctx.beginPath(); ctx.ellipse(0, -790, 40, 10, 0, 0, TAU); ctx.fill();
  });
  // colar com estrela
  ctx.strokeStyle = '#d9dde3'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-34, -812); ctx.quadraticCurveTo(-20, -760, 0, -752); ctx.quadraticCurveTo(20, -760, 34, -812); ctx.stroke();
  estrelaDavi(ctx, 0, -744, 9);
}

function estrelaDavi(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#eef1f5'; ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 4;
  for (const rot of [0, Math.PI]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { const a = rot - Math.PI / 2 + i * TAU / 3; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}

// braço: a = ângulo do ombro (0 = para baixo, + = para fora), b = cotovelo (+ dobra para fora/cima, - para dentro)
function braco(ctx, lado, br, mao) {
  const sx = lado * 96, sy = -772;
  const L1 = 150, L2 = 138;
  const a1 = br.a, a2 = br.a + br.b;
  const ex = sx + lado * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
  const hx = ex + lado * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
  // antebraço
  membro(ctx, ex, ey, hx, hy, 17, 12.5, PELE.base);
  ctx.save();
  ctx.beginPath(); membroPath(ctx, ex, ey, hx, hy, 17, 12.5); ctx.clip();
  suave(ctx, 5, () => { ctx.strokeStyle = 'rgba(190,120,90,0.45)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(ex + lado * 10, ey); ctx.lineTo(hx + lado * 8, hy); ctx.stroke(); });
  ctx.restore();
  // braço
  membro(ctx, sx, sy, ex, ey, 22, 17, PELE.base);
  ctx.save();
  ctx.beginPath(); membroPath(ctx, sx, sy, ex, ey, 22, 17); ctx.clip();
  suave(ctx, 5, () => { ctx.strokeStyle = 'rgba(190,120,90,0.5)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(sx + lado * 14, sy); ctx.lineTo(ex + lado * 12, ey); ctx.stroke(); });
  ctx.restore();
  // manga curta (cobre ~45% do braço)
  const mx = sx + lado * Math.sin(a1) * 70, my = sy + Math.cos(a1) * 70;
  membro(ctx, sx - lado * 2, sy + 2, mx, my, 22, 22, '#625b2b');
  ctx.save(); ctx.beginPath(); membroPath(ctx, sx - lado * 2, sy + 2, mx, my, 22, 22); ctx.clip();
  ctx.fillStyle = lg(ctx, sx - lado * 25, 0, sx + lado * 25, 0, ['rgba(255,255,220,0.12)', 'rgba(0,0,0,0.3)']);
  ctx.fillRect(sx - 60, sy - 40, 120, 140);
  ctx.restore();
  ctx.strokeStyle = '#4f4923'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const ang = Math.atan2(my - sy, mx - sx), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.beginPath(); ctx.moveTo(mx + nx * 21, my + ny * 21); ctx.lineTo(mx - nx * 21, my - ny * 21); ctx.stroke();
  // relógio no braço esquerdo dela (lado da tela +1)
  if (lado === 1) {
    const wx = lerp(ex, hx, 0.86), wy = lerp(ey, hy, 0.86);
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(Math.atan2(hy - ey, hx - ex));
    ctx.fillStyle = '#c4c8cf'; ctx.fillRect(-6, -15, 12, 30);
    ctx.fillStyle = '#e9ecf0'; ctx.fillRect(-7, -9, 14, 18);
    ctx.restore();
  }
  maoDesenho(ctx, hx, hy, Math.atan2(hy - ey, hx - ex), lado, mao);
}
function membroPath(ctx, ax, ay, bx, by, ra, rb) {
  const ang = Math.atan2(by - ay, bx - ax), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.moveTo(ax + nx * ra, ay + ny * ra); ctx.lineTo(bx + nx * rb, by + ny * rb);
  ctx.arc(bx, by, rb, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(ax - nx * ra, ay - ny * ra); ctx.arc(ax, ay, ra, ang - Math.PI / 2, ang + Math.PI / 2, true);
}

function maoDesenho(ctx, x, y, ang, lado, tipo, pele = PELE) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang - Math.PI / 2);
  if (lado < 0) ctx.scale(-1, 1);
  ctx.fillStyle = pele.base;
  if (tipo === 'punho' || tipo === 'bolso') {
    ctx.beginPath(); ctx.ellipse(0, 18, 16, 20, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = pele.sombra; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-10, 12 + i * 8); ctx.lineTo(8, 14 + i * 8); ctx.stroke(); }
  } else {
    // palma + dedos abertos
    ctx.beginPath(); ctx.ellipse(0, 16, 17, 19, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const fx = -10 + i * 7, comp = [24, 28, 27, 22][i];
      membro(ctx, fx, 26, fx + (i - 1.5) * 3, 26 + comp, 4.2, 3.6, pele.base);
    }
    membro(ctx, 14, 12, 28, 28, 5, 4.2, pele.base); // polegar
  }
  ctx.restore();
}

function pescocoECabeca(ctx, o, t) {
  // pescoço
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-29, -790); ctx.lineTo(-26, -860); ctx.lineTo(26, -860); ctx.lineTo(29, -790);
  ctx.quadraticCurveTo(0, -780, -29, -790);
  ctx.fillStyle = PELE.base; ctx.fill(); ctx.clip();
  suave(ctx, 6, () => { ctx.fillStyle = 'rgba(170,100,70,0.5)';
    ctx.beginPath(); ctx.ellipse(0, -846, 34, 18, 0, 0, TAU); ctx.fill(); });
  ctx.restore();

  ctx.save();
  ctx.translate(0, -850); ctx.rotate(o.cabeca || 0); ctx.scale(1.12, 1.12); ctx.translate(0, 850);
  const cy = -925;
  // cabelo de trás (chanel um pouco aberto embaixo)
  ctx.fillStyle = CABELO.base;
  ctx.beginPath(); curva(ctx, [[10, -1034], [70, -1018], [100, -968], [104, -900], [108, -852], [90, -838], [40, -846], [0, -850],
    [-40, -846], [-92, -836], [-110, -852], [-104, -905], [-98, -972], [-62, -1020]], true); ctx.fill();

  // rosto
  const rosto = [[0, -1000], [56, -990], [76, -950], [76, -905], [66, -870], [44, -845], [18, -832], [0, -830], [-18, -832], [-44, -845], [-66, -870], [-76, -905], [-76, -950], [-56, -990]];
  ctx.save();
  ctx.beginPath(); curva(ctx, rosto, true);
  ctx.fillStyle = rg(ctx, -6, -925, 110, [PELE.luz, PELE.base, PELE.base, PELE.sombra], 0, -16, -945);
  ctx.fill(); ctx.clip();
  suave(ctx, 9, () => {
    ctx.fillStyle = PELE.blush;
    ctx.beginPath(); ctx.ellipse(-46, -888, 19, 11, 0, 0, TAU); ctx.ellipse(46, -888, 19, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,80,55,0.45)'; // sombra projetada do cabelo
    ctx.translate(4, 7); cabeloFrente(ctx); ctx.fill();
  });
  ctx.restore();
  ctx.strokeStyle = 'rgba(150,85,60,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); curva(ctx, rosto, true); ctx.stroke();

  // olhos
  const piscar = o.piscar || 0;
  const olhar = o.olhar || [0, 0];
  for (const lado of [-1, 1]) {
    const ex = lado * 32, ey = cy;
    const abre = 1 - piscar, ry = 11 * abre + 0.6;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(ex, ey, 17, ry, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#fbf7f2'; ctx.fillRect(ex - 20, ey - 14, 40, 28);
    const ix = ex + olhar[0] * 5, iy = ey + 1 + olhar[1] * 3;
    ctx.fillStyle = rg(ctx, ix, iy, 9.5, ['#1c0f0a', '#5a331f', '#2a170f']);
    ctx.beginPath(); ctx.arc(ix, iy, 9.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0403'; ctx.beginPath(); ctx.arc(ix, iy, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ix + 3.5, iy - 3.5, 2.8, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(ix - 3, iy + 3.5, 1.4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,60,40,0.22)'; ctx.fillRect(ex - 20, ey - 14, 40, 6);
    ctx.restore();
    // cílios e dobra da pálpebra
    ctx.strokeStyle = '#1a0e0a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(ex, ey, 17.5, ry, 0, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex + lado * 16, ey - 4 * abre); ctx.lineTo(ex + lado * 22, ey - 8 * abre); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,85,60,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(ex, ey - 3, 16, ry + 4, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // sobrancelha
    ctx.strokeStyle = '#21140f'; ctx.lineWidth = 5;
    const sob = (o.sobrancelha || 0) * -5;
    ctx.beginPath(); ctx.moveTo(ex - lado * 15, ey - 24 + sob); ctx.quadraticCurveTo(ex + lado * 3, ey - 32 + sob, ex + lado * 20, ey - 25 + sob); ctx.stroke();
  }
  // nariz
  suave(ctx, 2, () => {
    ctx.strokeStyle = 'rgba(175,105,80,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(5, -912); ctx.quadraticCurveTo(10, -893, 3, -886); ctx.stroke();
  });
  ctx.fillStyle = 'rgba(160,90,65,0.55)';
  ctx.beginPath(); ctx.ellipse(-6, -885, 3.4, 1.8, 0.2, 0, TAU); ctx.ellipse(7, -885, 3.4, 1.8, -0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,230,0.55)'; ctx.beginPath(); ctx.ellipse(1, -899, 2.6, 5, 0, 0, TAU); ctx.fill();

  boca(ctx, 0, -864, o.boca || 0);
  oculos(ctx, cy);

  // cabelo da frente
  ctx.save();
  cabeloFrente(ctx);
  ctx.fillStyle = lg(ctx, 0, -1040, 0, -840, [CABELO.luz, CABELO.base, CABELO.base]); ctx.fill();
  ctx.clip();
  ctx.lineCap = 'round';
  suave(ctx, 4, () => {
    ctx.strokeStyle = CABELO.brilho; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(4, -1018); ctx.quadraticCurveTo(-55, -1004, -86, -950); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, -1016); ctx.quadraticCurveTo(84, -995, 92, -940); ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(90,80,90,0.5)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    ctx.beginPath(); ctx.moveTo(20 - k * 30, -1030); ctx.quadraticCurveTo(-60 - k * 30, -1000 + k * 10, -76 - k * 26, -850); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24 + k * 30, -1030); ctx.quadraticCurveTo(80 + k * 20, -1000 + k * 10, 74 + k * 30, -850); ctx.stroke();
  }
  ctx.restore();
  // brinco pequeno
  ctx.fillStyle = '#e7ebf0'; ctx.beginPath(); ctx.arc(-80, -864, 2.6, 0, TAU); ctx.arc(80, -864, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
}

// contorno do cabelo da frente (risca do lado, emoldurando o rosto)
function cabeloFrente(ctx) {
  ctx.beginPath();
  curva(ctx, [[22, -1012], [-14, -1002], [-50, -984], [-68, -950], [-74, -905], [-76, -868], [-82, -846], [-96, -838], [-110, -852], [-106, -905], [-100, -972], [-66, -1022], [-10, -1040]], false);
  curva(ctx, [[30, -1038], [76, -1020], [102, -970], [106, -905], [110, -852], [96, -838], [80, -848], [74, -872], [72, -910], [68, -955], [52, -990], [22, -1012]], false, false);
  ctx.closePath();
}

function oculos(ctx, cy) {
  ctx.save();
  ctx.lineJoin = 'round';
  for (const lado of [-1, 1]) {
    const x = lado * 35, y = cy - 2;
    ctx.beginPath(); ctx.roundRect(x - 31, y - 22, 62, 42, 10);
    ctx.fillStyle = 'rgba(200,225,255,0.12)'; ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,130,0.5)'; ctx.lineWidth = 8.5; ctx.stroke();
    ctx.strokeStyle = '#f7f6f2'; ctx.lineWidth = 6.5; ctx.stroke();
    // reflexo
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(x - 20, y + 20); ctx.lineTo(x + 2, y - 22); ctx.lineTo(x + 14, y - 22); ctx.lineTo(x - 8, y + 20); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = '#f7f6f2'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-5, cy - 8); ctx.quadraticCurveTo(0, cy - 13, 5, cy - 8); ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-66, cy - 14); ctx.lineTo(-78, cy - 12); ctx.moveTo(66, cy - 14); ctx.lineTo(78, cy - 12); ctx.stroke();
  ctx.restore();
}

function boca(ctx, x, y, abre) {
  abre = clamp(abre, 0, 1);
  ctx.save(); ctx.translate(x, y);
  if (abre < 0.08) {
    ctx.strokeStyle = '#b0605a'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-17, -2); ctx.quadraticCurveTo(0, 7, 17, -2); ctx.stroke();
    ctx.fillStyle = 'rgba(200,110,100,0.5)';
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(0, 10, 12, 2); ctx.quadraticCurveTo(0, 6, -12, 2); ctx.fill();
  } else {
    const w = 15 + abre * 4, h = 4 + abre * 15;
    ctx.beginPath();
    ctx.moveTo(-w, -2); ctx.quadraticCurveTo(0, -5, w, -2); ctx.quadraticCurveTo(w * 0.8, h, 0, h + 2); ctx.quadraticCurveTo(-w * 0.8, h, -w, -2);
    ctx.fillStyle = '#5b1d22'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#fbf6f0'; ctx.fillRect(-w, -4, w * 2, 5.5);
    ctx.fillStyle = '#d96a72'; ctx.beginPath(); ctx.ellipse(0, h + 3, w * 0.6, h * 0.45, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-w, -2); ctx.quadraticCurveTo(0, -5, w, -2); ctx.quadraticCurveTo(w * 0.8, h, 0, h + 2); ctx.quadraticCurveTo(-w * 0.8, h, -w, -2);
    ctx.strokeStyle = '#b0605a'; ctx.lineWidth = 2.6; ctx.stroke();
  }
  ctx.restore();
}
