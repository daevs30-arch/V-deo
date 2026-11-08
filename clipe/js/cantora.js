// A cantora — estilo animação infantil com volume (cabeça grande, olhos enormes),
// baseada na referência: cabelo castanho ondulado na altura dos ombros com risca
// lateral, óculos pretos retangulares, olhos castanhos, pinta perto da boca,
// brincos de pérola e camiseta roxa (calça jeans clara e sandálias da foto).
// Coordenadas: pés em (0,0), topo do cabelo em y≈-950.
const PELE = { base: '#f2c09c', sombra: '#d8957a', luz: '#ffe0cc', blush: 'rgba(255,120,130,0.38)' };
const CABELO = { base: '#7a3a18', escuro: '#4e2410', luz: '#b0602e' };
const ROXO = '#7d2fa6';

// o: { x, y, s, t, boca(0..1), piscar, bracoE:{a,b}, bracoD, maoE, maoD, inclina, cabeca, olhar, passo, salto, flip }
function cantora(ctx, o) {
  ctx.save();
  ctx.translate(o.x, o.y - (o.salto || 0));
  ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  suave(ctx, 10, () => {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(0, 4 + (o.salto || 0) / o.s, 180, 26, 0, 0, TAU); ctx.fill();
  });
  const passo = o.passo;
  const pe = (lado) => passo == null ? 0 : Math.sin(passo + (lado > 0 ? Math.PI : 0));
  for (const lado of [-1, 1]) sandalia(ctx, lado * 62 + pe(lado) * 24, -Math.max(0, pe(lado)) * 14, lado);
  // calça (cintura em -450): reaproveita a calça larga, achatada na vertical
  ctx.save(); ctx.rotate((o.inclina || 0) * 0.25); ctx.scale(1.06, 0.6); calca(ctx, pe); ctx.restore();
  ctx.translate(0, 90); // tronco desce (pernas mais curtas)

  ctx.save();
  ctx.translate(0, -440); ctx.rotate(o.inclina || 0); ctx.translate(0, 440);
  camiseta(ctx);
  cabecaCantora(ctx, o);
  for (const [lado, br, mao] of [[-1, o.bracoE, o.maoE], [1, o.bracoD, o.maoD]]) braco(ctx, lado, br || { a: 0.12, b: 0.1 }, mao || 'aberta');
  ctx.restore();
  ctx.restore();
}

function camiseta(ctx) {
  // pescoço
  vol(ctx, () => { ctx.roundRect(-30, -700, 60, 70, 20); }, PELE.base, -30, -700, 60, 70, { sombra: 0.5, luz: 0.1 });
  const pts = [[-86, -446], [-92, -520], [-96, -600], [-104, -648], [-60, -668], [-30, -662], [0, -660], [30, -662], [60, -668], [104, -648], [96, -600], [92, -520], [86, -446], [0, -438]];
  vol(ctx, () => curva(ctx, pts, true), ROXO, -105, -670, 210, 232, { sombra: 0.45, luz: 0.25 });
  // gola redonda
  ctx.strokeStyle = tom(ROXO, -0.25); ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-36, -662); ctx.quadraticCurveTo(0, -628, 36, -662); ctx.stroke();
  ctx.strokeStyle = tom(ROXO, 0.15); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-36, -656); ctx.quadraticCurveTo(0, -622, 36, -656); ctx.stroke();
  // dobras suaves
  suave(ctx, 6, () => {
    ctx.strokeStyle = 'rgba(40,0,60,0.25)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-60, -560); ctx.quadraticCurveTo(-30, -520, -50, -470); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(62, -575); ctx.quadraticCurveTo(40, -520, 58, -470); ctx.stroke();
  });
  // barra por cima do cós
  ctx.fillStyle = tom(ROXO, -0.15); ctx.beginPath(); ctx.ellipse(0, -444, 88, 10, 0, 0, TAU); ctx.fill();
}

function braco(ctx, lado, br, mao) {
  const sx = lado * 88, sy = -640, L1 = 125, L2 = 118;
  const a1 = br.a, a2 = br.a + br.b;
  const ex = sx + lado * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
  const hx = ex + lado * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
  const bb = (ax, ay, bx, by, ra, rb, cor) => {
    const x0 = Math.min(ax, bx) - ra, y0 = Math.min(ay, by) - ra;
    vol(ctx, () => membroPath(ctx, ax, ay, bx, by, ra, rb), cor, x0, y0, Math.abs(bx - ax) + ra * 2, Math.abs(by - ay) + ra * 2, { sombra: 0.4, luz: 0.25 });
  };
  bb(ex, ey, hx, hy, 24, 20, PELE.base);
  bb(sx, sy, ex, ey, 27, 24, PELE.base);
  // manga
  const mx = sx + lado * Math.sin(a1) * 62, my = sy + Math.cos(a1) * 62;
  bb(sx - lado * 10, sy + 4, mx, my, 30, 29, ROXO);
  ctx.strokeStyle = tom(ROXO, -0.25); ctx.lineWidth = 5; ctx.lineCap = 'round';
  const ang = Math.atan2(my - sy, mx - sx), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.beginPath(); ctx.moveTo(mx + nx * 28, my + ny * 28); ctx.lineTo(mx - nx * 28, my - ny * 28); ctx.stroke();
  if (lado === 1) { // relógio
    const wx = lerp(ex, hx, 0.84), wy = lerp(ey, hy, 0.84);
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(Math.atan2(hy - ey, hx - ex));
    ctx.fillStyle = '#c4c8cf'; ctx.fillRect(-7, -20, 14, 40); ctx.fillStyle = '#eef1f5'; ctx.fillRect(-9, -11, 18, 22);
    ctx.restore();
  }
  maoDesenho(ctx, hx, hy, Math.atan2(hy - ey, hx - ex), lado, mao);
}

// mão gordinha (estilo fofo)
function maoDesenho(ctx, x, y, ang, lado, tipo, pele = PELE) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang - Math.PI / 2);
  if (lado < 0) ctx.scale(-1, 1);
  const k = pele.escala || 1; ctx.scale(k, k);
  if (tipo === 'punho' || tipo === 'bolso') {
    vol(ctx, () => ctx.ellipse(0, 18, 24, 26, 0, 0, TAU), pele.base, -24, -8, 48, 52, { sombra: 0.35 });
    ctx.strokeStyle = tom(pele.base, -0.25); ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14, 16 + i * 9); ctx.lineTo(10, 18 + i * 9); ctx.stroke(); }
  } else {
    for (let i = 0; i < 4; i++) { const fx = -14 + i * 9.5; membro(ctx, fx, 30, fx + (i - 1.5) * 3, 30 + [20, 24, 23, 18][i], 6, 5.5, tom(pele.base, -0.03)); }
    membro(ctx, 18, 14, 32, 30, 7, 6, pele.base);
    vol(ctx, () => ctx.ellipse(0, 18, 23, 24, 0, 0, TAU), pele.base, -23, -6, 46, 48, { sombra: 0.3 });
  }
  ctx.restore();
}

function cabelosCantoraTras(ctx) {
  const pts = [[0, -962], [96, -944], [152, -870], [164, -780], [158, -716], [176, -668], [184, -626], [160, -600], [120, -612], [100, -648], [40, -664], [-40, -664], [-100, -648], [-124, -610], [-166, -598], [-186, -630], [-176, -676], [-160, -730], [-166, -800], [-148, -884], [-90, -946]];
  vol(ctx, () => curva(ctx, pts, true), CABELO.escuro, -186, -962, 370, 365, { sombra: 0.5, luz: 0.1, rim: false });
}

function caminhoFranja(ctx) {
  curva(ctx, [[-46, -958], [40, -962], [114, -928], [154, -858], [160, -772], [154, -712], [172, -664], [182, -624], [156, -604], [122, -616], [124, -660], [126, -740], [120, -800], [104, -836], [70, -852], [30, -864], [-8, -884], [-36, -910]], false);
  ctx.closePath();
  curva(ctx, [[-52, -954], [-106, -936], [-150, -874], [-160, -784], [-156, -716], [-176, -664], [-180, -622], [-152, -602], [-118, -616], [-120, -670], [-124, -750], [-120, -820], [-98, -874], [-64, -910]], false);
  ctx.closePath();
}
function cabelosCantoraFrente(ctx) {
  vol(ctx, () => caminhoFranja(ctx), CABELO.base, -182, -962, 364, 360, { sombra: 0.45, luz: 0.3 });
  ctx.save(); ctx.beginPath(); caminhoFranja(ctx); ctx.clip();
  ctx.lineCap = 'round';
  suave(ctx, 5, () => { // mechas escuras largas
    ctx.strokeStyle = 'rgba(60,20,5,0.35)'; ctx.lineWidth = 12;
    for (const k of [0, 1, 2]) {
      ctx.beginPath(); ctx.moveTo(-30 + k * 30, -950); ctx.quadraticCurveTo(80 + k * 20, -920 + k * 20, 136 + k * 10, -760 + k * 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-70 - k * 20, -940); ctx.quadraticCurveTo(-130 - k * 10, -870, -140 - k * 8, -700 + k * 20); ctx.stroke();
    }
  });
  suave(ctx, 4, () => { // brilho
    ctx.strokeStyle = 'rgba(255,200,150,0.6)'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(-10, -940); ctx.quadraticCurveTo(70, -936, 118, -888); ctx.stroke();
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-84, -922); ctx.quadraticCurveTo(-134, -874, -142, -800); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150, -760); ctx.quadraticCurveTo(152, -700, 168, -650); ctx.stroke();
  });
  ctx.restore();
  // risca
  ctx.strokeStyle = 'rgba(70,25,8,0.6)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-48, -956); ctx.quadraticCurveTo(-44, -930, -40, -912); ctx.stroke();
}

function cabecaCantora(ctx, o) {
  ctx.save();
  ctx.translate(0, -660); ctx.rotate(o.cabeca || 0); ctx.scale(1.14, 1.14); ctx.translate(0, 676);
  cabelosCantoraTras(ctx);
  // orelhas + brincos de pérola
  for (const l of [-1, 1]) {
    vol(ctx, () => ctx.ellipse(l * 116, -786, 18, 26, 0, 0, TAU), PELE.base, l * 116 - 18, -812, 36, 52, { sombra: 0.4 });
    ctx.fillStyle = rg(ctx, l * 116 - 3, -762, 10, ['#ffffff', '#e8e4ea', '#b9b2c0'], 0, l * 116 - 5, -766);
    ctx.beginPath(); ctx.arc(l * 116, -758, 9, 0, TAU); ctx.fill();
  }
  // rosto
  const rosto = [[0, -930], [78, -912], [118, -846], [120, -780], [104, -722], [64, -682], [0, -666], [-64, -682], [-104, -722], [-120, -780], [-118, -846], [-78, -912]];
  vol(ctx, () => curva(ctx, rosto, true), PELE.base, -120, -930, 240, 264, { sombra: 0.32, luz: 0.3 });
  suave(ctx, 10, () => {
    ctx.fillStyle = PELE.blush;
    ctx.beginPath(); ctx.ellipse(-70, -748, 24, 15, 0, 0, TAU); ctx.ellipse(70, -748, 24, 15, 0, 0, TAU); ctx.fill();
  });
  // olhos castanhos grandes
  const pisc = o.piscar || 0, olhar = o.olhar || [0, 0];
  for (const l of [-1, 1]) {
    olhoGrande(ctx, l * 46, -790, 27, 30, '#7a4422', pisc, olhar, false, l);
    ctx.fillStyle = '#2a1410'; ctx.beginPath(); ctx.moveTo(l * 66, -808 + pisc * 14); ctx.lineTo(l * 82, -816 + pisc * 14); ctx.lineTo(l * 70, -798 + pisc * 14); ctx.fill();
  }
  // sobrancelhas
  ctx.strokeStyle = CABELO.escuro; ctx.lineWidth = 8; ctx.lineCap = 'round';
  const sob = (o.sobrancelha || 0) * -6;
  for (const l of [-1, 1]) { ctx.beginPath(); ctx.moveTo(l * 22, -840 + sob); ctx.quadraticCurveTo(l * 48, -856 + sob, l * 76, -842 + sob); ctx.stroke(); }
  narizFofo(ctx, 0, -748, 13, PELE.base);
  bocaFofa(ctx, 0, -714, 32, o.boca || 0);
  // pinta perto da boca
  ctx.fillStyle = '#3a1a10'; ctx.beginPath(); ctx.arc(46, -716, 3.6, 0, TAU); ctx.fill();
  // óculos pretos retangulares
  ctx.lineJoin = 'round';
  for (const l of [-1, 1]) {
    ctx.beginPath(); ctx.roundRect(l * 48 - 40, -820, 80, 60, 14);
    ctx.fillStyle = 'rgba(210,230,255,0.10)'; ctx.fill();
    ctx.strokeStyle = '#141011'; ctx.lineWidth = 8; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.moveTo(l * 48 - 30, -760); ctx.lineTo(l * 48 + 2, -822); ctx.lineTo(l * 48 + 18, -822); ctx.lineTo(l * 48 - 14, -760); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(l * 48 - 32, -818); ctx.lineTo(l * 48 + 20, -818); ctx.stroke();
  }
  ctx.strokeStyle = '#141011'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-8, -804); ctx.quadraticCurveTo(0, -812, 8, -804); ctx.moveTo(-88, -808); ctx.lineTo(-112, -804); ctx.moveTo(88, -808); ctx.lineTo(112, -804); ctx.stroke();
  cabelosCantoraFrente(ctx);
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

function membroPath(ctx, ax, ay, bx, by, ra, rb) {
  const ang = Math.atan2(by - ay, bx - ax), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.moveTo(ax + nx * ra, ay + ny * ra); ctx.lineTo(bx + nx * rb, by + ny * rb);
  ctx.arc(bx, by, rb, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(ax - nx * ra, ay - ny * ra); ctx.arc(ax, ay, ra, ang - Math.PI / 2, ang + Math.PI / 2, true);
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

