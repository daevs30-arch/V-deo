// Personagens da história: Abraão, Sara, bebê Isaque, crianças, camelo e ovelhas.
// Mesma convenção da cantora: pés em (0,0), y para cima negativo, altura ~1000.

const PELE_ABRAAO = { base: '#d49c74', sombra: '#a8704e', luz: '#ecc29f' };
const PELE_SARA = { base: '#e3ad87', sombra: '#b97d5c', luz: '#f6cfb0' };

function sombraChao(ctx, rx, ry = 22, a = 0.28) {
  suave(ctx, 10, () => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(0, 2, rx, ry, 0, 0, TAU); ctx.fill(); });
}

// Braço genérico com manga larga (túnicas).
function bracoManga(ctx, sx, sy, lado, br, pele, corManga, L1 = 150, L2 = 140, mao = 'aberta', rManga = [30, 34]) {
  const a1 = br.a, a2 = br.a + br.b;
  const ex = sx + lado * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
  const hx = ex + lado * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
  const wx = lerp(ex, hx, 0.8), wy = lerp(ey, hy, 0.8);
  maoDesenho(ctx, hx, hy, Math.atan2(hy - ey, hx - ex), lado, mao, pele);
  membro(ctx, sx, sy, ex, ey, rManga[0], rManga[0] - 4, corManga);
  membro(ctx, ex, ey, wx, wy, rManga[0] - 4, rManga[1], corManga);
  ctx.save(); ctx.beginPath(); membroPath(ctx, sx, sy, ex, ey, rManga[0], rManga[0] - 4); membroPath(ctx, ex, ey, wx, wy, rManga[0] - 4, rManga[1]); ctx.clip();
  suave(ctx, 6, () => { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(sx + lado * 22, sy); ctx.lineTo(ex + lado * 20, ey); ctx.lineTo(wx + lado * 22, wy); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(sx - lado * 10, sy + 10); ctx.lineTo(ex - lado * 12, ey); ctx.stroke(); });
  ctx.restore();
  return { ex, ey, hx, hy };
}

function olhoSimples(ctx, x, y, r, piscar, olhar = [0, 0], cor = '#3b2414') {
  const ry = r * 0.75 * (1 - piscar) + 0.6;
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = '#fbf7f2'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  const ix = x + olhar[0] * r * 0.35, iy = y + olhar[1] * r * 0.3;
  ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(ix, iy, r * 0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0503'; ctx.beginPath(); ctx.arc(ix, iy, r * 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ix + r * 0.22, iy - r * 0.22, r * 0.17, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#2a1810'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.02, ry, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
}

// ================= ABRAÃO (frente) =================
// o: { x, y, s, piscar, boca, bracoE, bracoD, cajado, olhar, cabeca(rot), olhaCima }
function abraao(ctx, o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  sombraChao(ctx, 200);
  // cajado atrás (mão direita = lado +1)
  const bd = o.bracoD || { a: 0.25, b: -0.3 }, be = o.bracoE || { a: 0.15, b: 0.05 };
  // pés
  for (const l of [-1, 1]) {
    ctx.fillStyle = '#6e4228'; ctx.beginPath(); ctx.ellipse(l * 55, -8, 40, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = PELE_ABRAAO.base; ctx.beginPath(); ctx.ellipse(l * 55, -18, 30, 11, 0, Math.PI, TAU); ctx.fill();
  }
  // túnica
  ctx.save();
  ctx.beginPath(); curva(ctx, [[-108, -790], [-120, -600], [-138, -300], [-160, -20], [0, -12], [160, -20], [138, -300], [120, -600], [108, -790], [0, -800]], true);
  ctx.fillStyle = '#e9dcc0'; ctx.fill(); ctx.clip();
  for (let i = -6; i <= 6; i++) { // listras
    ctx.fillStyle = i % 2 ? 'rgba(150,100,50,0.28)' : 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.moveTo(i * 16 - 6, -800); ctx.lineTo(i * 22 - 8, 0); ctx.lineTo(i * 22 + 4, 0); ctx.lineTo(i * 16 + 2, -800); ctx.fill();
  }
  ctx.fillStyle = lg(ctx, -160, 0, 160, 0, ['rgba(80,50,20,0.4)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.08)', 'rgba(80,50,20,0.45)']);
  ctx.fillRect(-170, -810, 340, 820);
  ctx.restore();
  // manto marrom (abertura central)
  for (const l of [-1, 1]) {
    ctx.save();
    ctx.beginPath(); curva(ctx, [[l * 40, -800], [l * 112, -792], [l * 128, -600], [l * 150, -300], [l * 172, -16], [l * 78, -12], [l * 66, -300], [l * 52, -600]], true);
    ctx.fillStyle = '#7b4a2a'; ctx.fill(); ctx.clip();
    ctx.fillStyle = lg(ctx, l * 40, 0, l * 175, 0, ['rgba(255,220,170,0.15)', 'rgba(0,0,0,0)', 'rgba(30,10,0,0.45)']);
    ctx.fillRect(-200, -820, 400, 830);
    suave(ctx, 5, () => { ctx.strokeStyle = 'rgba(40,20,5,0.4)'; ctx.lineWidth = 8;
      for (const k of [0.4, 0.7]) { ctx.beginPath(); ctx.moveTo(l * (60 + k * 60), -700); ctx.quadraticCurveTo(l * (70 + k * 70), -350, l * (80 + k * 85), -20); ctx.stroke(); } });
    ctx.restore();
    ctx.strokeStyle = '#c9a25a'; ctx.lineWidth = 4; // barra bordada
    ctx.beginPath(); ctx.moveTo(l * 42, -798); ctx.quadraticCurveTo(l * 50, -500, l * 78, -14); ctx.stroke();
  }
  // faixa na cintura
  ctx.fillStyle = lg(ctx, 0, -585, 0, -545, ['#b5492f', '#8a3020']);
  ctx.beginPath(); ctx.moveTo(-62, -585); ctx.quadraticCurveTo(0, -575, 62, -585); ctx.lineTo(64, -545); ctx.quadraticCurveTo(0, -535, -64, -545); ctx.fill();
  ctx.fillStyle = '#8a3020'; ctx.beginPath(); ctx.moveTo(18, -550); ctx.lineTo(8, -470); ctx.lineTo(26, -472); ctx.lineTo(30, -550); ctx.fill();

  // cajado
  if (o.cajado !== false) {
    const a1 = bd.a, a2 = bd.a + bd.b;
    const ex = 100 + Math.sin(a1) * 150, ey = -770 + Math.cos(a1) * 150;
    const hx = ex + Math.sin(a2) * 140, hy = ey + Math.cos(a2) * 140;
    ctx.strokeStyle = lg(ctx, hx - 8, 0, hx + 8, 0, ['#8a5a32', '#5a3418']); ctx.lineWidth = 13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 330); ctx.lineTo(hx, hy - 330); ctx.quadraticCurveTo(hx - 4, hy - 400, hx - 50, hy - 392); ctx.quadraticCurveTo(hx - 70, hy - 380, hx - 58, hy - 356); ctx.stroke();
  }
  // braços
  bracoManga(ctx, -100, -770, -1, be, PELE_ABRAAO, '#7b4a2a', 150, 140, o.maoE || 'aberta');
  bracoManga(ctx, 100, -770, 1, bd, PELE_ABRAAO, '#7b4a2a', 150, 140, o.cajado === false ? (o.maoD || 'aberta') : 'punho');

  // cabeça
  ctx.save(); ctx.translate(0, -800); ctx.rotate(o.cabeca || 0); ctx.scale(1.42, 1.42); ctx.translate(0, 790);
  const cy = -900;
  // pano da cabeça (atrás)
  ctx.fillStyle = '#eee5d2';
  ctx.beginPath(); curva(ctx, [[0, -1010], [78, -985], [96, -920], [104, -820], [126, -760], [0, -770], [-126, -760], [-104, -820], [-96, -920], [-78, -985]], true); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = lg(ctx, -120, 0, 120, 0, ['rgba(120,100,70,0.45)', 'rgba(0,0,0,0)', 'rgba(120,100,70,0.5)']); ctx.fillRect(-130, -1020, 260, 270);
  ctx.strokeStyle = 'rgba(160,140,110,0.6)'; ctx.lineWidth = 3;
  for (const l of [-1, 1]) { ctx.beginPath(); ctx.moveTo(l * 70, -950); ctx.quadraticCurveTo(l * 100, -850, l * 112, -770); ctx.stroke(); }
  ctx.restore();
  // rosto
  const rosto = [[0, -968], [50, -958], [64, -915], [62, -870], [50, -835], [0, -815], [-50, -835], [-62, -870], [-64, -915], [-50, -958]];
  vol(ctx, () => curva(ctx, rosto, true), PELE_ABRAAO.base, -64, -968, 128, 153, { sombra: 0.32, luz: 0.3 });
  ctx.save(); ctx.beginPath(); curva(ctx, rosto, true); ctx.clip();
  suave(ctx, 7, () => { ctx.fillStyle = 'rgba(220,110,90,0.3)'; ctx.beginPath(); ctx.ellipse(-36, -880, 15, 9, 0, 0, TAU); ctx.ellipse(36, -880, 15, 9, 0, 0, TAU); ctx.fill(); });
  ctx.restore();
  const olhar = o.olhaCima ? [0, -1] : (o.olhar || [0, 0]);
  for (const l of [-1, 1]) {
    olhoGrande(ctx, l * 27, -902, 15, 17, '#6a4428', o.piscar || 0, olhar, false, l);
    ctx.strokeStyle = 'rgba(120,70,45,0.6)'; ctx.lineWidth = 2; // rugas
    ctx.beginPath(); ctx.moveTo(l * 44, -898); ctx.lineTo(l * 51, -894); ctx.moveTo(l * 44, -906); ctx.lineTo(l * 51, -909); ctx.stroke();
    ctx.fillStyle = '#f2f0ea'; // sobrancelhas brancas e fartas
    ctx.beginPath(); ctx.ellipse(l * 27, -927 - (o.olhaCima ? 4 : 0), 19, 7, l * -0.15, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,70,45,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-22, -945); ctx.lineTo(22, -945); ctx.moveTo(-16, -952); ctx.lineTo(16, -952); ctx.stroke();
  // nariz
  narizFofo(ctx, 0, -872, 12, PELE_ABRAAO.base);
  // barba branca
  ctx.save();
  ctx.beginPath(); curva(ctx, [[-62, -880], [-54, -846], [-30, -850], [0, -842], [30, -850], [54, -846], [62, -880], [72, -820], [58, -760], [32, -712], [0, -690], [-32, -712], [-58, -760], [-72, -820]], true);
  ctx.fillStyle = lg(ctx, 0, -880, 0, -690, ['#f6f5f0', '#dcdcd6']); ctx.fill(); ctx.clip();
  ctx.strokeStyle = 'rgba(160,160,155,0.6)'; ctx.lineWidth = 2;
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(i * 11, -840); ctx.quadraticCurveTo(i * 13 + 4, -770, i * 6, -700); ctx.stroke(); }
  ctx.restore();
  // boca e bigode
  const ab = clamp(o.boca || 0);
  ctx.fillStyle = '#5b2a22';
  ctx.beginPath(); ctx.ellipse(0, -840, 13, 3 + ab * 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f4f3ee';
  ctx.beginPath(); curva(ctx, [[-2, -858], [-26, -852], [-44, -836], [-30, -838], [-2, -848], [2, -848], [30, -838], [44, -836], [26, -852], [2, -858]], true); ctx.fill();
  // faixa da cabeça (agal) e pano da frente
  ctx.fillStyle = '#eee5d2';
  ctx.beginPath(); curva(ctx, [[0, -1012], [72, -990], [90, -940], [74, -948], [40, -962], [0, -968], [-40, -962], [-74, -948], [-90, -940], [-72, -990]], true); ctx.fill();
  ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-84, -958); ctx.quadraticCurveTo(0, -985, 84, -958); ctx.stroke();
  ctx.strokeStyle = '#3f2616'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ================= SARA (frente, opcional com bebê) =================
function sara(ctx, o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  sombraChao(ctx, 180);
  // vestido
  ctx.save();
  ctx.beginPath(); curva(ctx, [[-90, -770], [-98, -620], [-120, -320], [-150, -14], [0, -6], [150, -14], [120, -320], [98, -620], [90, -770], [0, -780]], true);
  ctx.fillStyle = '#3f7f8c'; ctx.fill(); ctx.clip();
  ctx.fillStyle = lg(ctx, -150, 0, 150, 0, ['rgba(10,30,40,0.5)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.12)', 'rgba(10,30,40,0.5)']); ctx.fillRect(-160, -790, 320, 800);
  suave(ctx, 6, () => { ctx.strokeStyle = 'rgba(10,40,50,0.35)'; ctx.lineWidth = 9;
    for (const x of [-60, -15, 35, 80]) { ctx.beginPath(); ctx.moveTo(x * 0.6, -560); ctx.quadraticCurveTo(x * 0.9, -300, x * 1.2, -10); ctx.stroke(); } });
  // barra bordada
  ctx.fillStyle = '#d9b45a'; ctx.fillRect(-160, -46, 320, 10);
  ctx.fillStyle = '#b8462f'; ctx.fillRect(-160, -34, 320, 8);
  ctx.restore();
  // faixa
  ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.moveTo(-70, -585); ctx.quadraticCurveTo(0, -575, 70, -585); ctx.lineTo(70, -560); ctx.quadraticCurveTo(0, -552, -70, -560); ctx.fill();
  // pés
  for (const l of [-1, 1]) { ctx.fillStyle = PELE_SARA.base; ctx.beginPath(); ctx.ellipse(l * 45, -10, 26, 10, 0, Math.PI, TAU); ctx.fill(); }

  const comBebe = !!o.bebe;
  const be = comBebe ? { a: 0.35, b: -1.75 } : (o.bracoE || { a: 0.15, b: 0.1 });
  const bd = comBebe ? { a: 0.3, b: -1.5 } : (o.bracoD || { a: 0.15, b: 0.1 });
  if (!comBebe) {
    bracoManga(ctx, -86, -755, -1, be, PELE_SARA, '#35707c', 140, 130, 'aberta', [24, 28]);
    bracoManga(ctx, 86, -755, 1, bd, PELE_SARA, '#35707c', 140, 130, 'aberta', [24, 28]);
  }
  cabecaSara(ctx, o);
  if (comBebe) {
    const r1 = bracoManga(ctx, -86, -755, -1, be, PELE_SARA, '#35707c', 140, 125, 'punho', [24, 28]);
    const r2 = bracoManga(ctx, 86, -755, 1, bd, PELE_SARA, '#35707c', 140, 120, 'punho', [24, 28]);
    bebe(ctx, 0, -640, 1.15, o.t || 0, o.bebeAcordado);
    ctx.fillStyle = PELE_SARA.base;
    ctx.beginPath(); ctx.ellipse(r2.hx - 6, r2.hy - 6, 20, 14, -0.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function cabecaSara(ctx, o) {
  ctx.save(); ctx.translate(0, -790); ctx.rotate(o.cabeca || 0); ctx.scale(1.42, 1.42); ctx.translate(0, 780);
  // véu atrás
  ctx.fillStyle = '#d7a48e';
  ctx.beginPath(); curva(ctx, [[0, -1000], [74, -980], [96, -910], [104, -820], [130, -740], [60, -720], [0, -760], [-60, -720], [-130, -740], [-104, -820], [-96, -910], [-74, -980]], true); ctx.fill();
  // pescoço
  ctx.fillStyle = PELE_SARA.base; ctx.fillRect(-24, -830, 48, 70);
  // rosto
  const rosto = [[0, -965], [50, -955], [64, -912], [60, -866], [42, -830], [14, -812], [0, -810], [-14, -812], [-42, -830], [-60, -866], [-64, -912], [-50, -955]];
  vol(ctx, () => curva(ctx, rosto, true), PELE_SARA.base, -64, -965, 128, 155, { sombra: 0.32, luz: 0.32 });
  ctx.save(); ctx.beginPath(); curva(ctx, rosto, true); ctx.clip();
  suave(ctx, 7, () => { ctx.fillStyle = 'rgba(235,110,110,0.32)'; ctx.beginPath(); ctx.ellipse(-36, -868, 15, 9, 0, 0, TAU); ctx.ellipse(36, -868, 15, 9, 0, 0, TAU); ctx.fill(); });
  ctx.restore();
  // cabelo castanho escuro na testa
  ctx.fillStyle = '#3a2216';
  ctx.beginPath(); curva(ctx, [[0, -968], [46, -960], [62, -930], [50, -936], [20, -950], [0, -946], [-20, -950], [-50, -936], [-62, -930], [-46, -960]], true); ctx.fill();
  for (const l of [-1, 1]) {
    olhoGrande(ctx, l * 26, -893, 15, 17, '#6a3a1a', o.piscar || 0, o.olhar || [0, 0.25], true, l);
    ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(l * 12, -915); ctx.quadraticCurveTo(l * 26, -922, l * 38, -914); ctx.stroke();
  }
  narizFofo(ctx, 0, -866, 8, PELE_SARA.base);
  bocaFofa(ctx, 0, -846, 15, o.boca || 0);
  // véu da frente (emoldura o rosto)
  ctx.fillStyle = lg(ctx, 0, -1010, 0, -720, ['#e6b7a2', '#c99079']);
  ctx.beginPath();
  curva(ctx, [[0, -1004], [-60, -990], [-92, -930], [-96, -850], [-120, -760], [-80, -740], [-66, -820], [-64, -900], [-54, -955], [-20, -972], [0, -974], [20, -972], [54, -955], [64, -900], [66, -820], [80, -740], [120, -760], [96, -850], [92, -930], [60, -990]], true);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,90,70,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-80, -950); ctx.quadraticCurveTo(-90, -850, -108, -760); ctx.moveTo(80, -950); ctx.quadraticCurveTo(90, -850, 108, -760); ctx.stroke();
  ctx.restore();
}

function bebe(ctx, x, y, s, t, acordado) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.rotate(-0.12 + Math.sin(t * 2) * 0.04);
  // manta
  ctx.fillStyle = lg(ctx, 0, -60, 0, 60, ['#fbf4e6', '#e2d3b8']);
  ctx.beginPath(); ctx.ellipse(0, 0, 120, 62, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(170,150,110,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-60, -40); ctx.quadraticCurveTo(0, 20, 90, -20); ctx.stroke();
  // rostinho
  ctx.fillStyle = rg(ctx, -62, -8, 44, ['#ffd9c0', '#f1b796']);
  ctx.beginPath(); ctx.arc(-62, -6, 40, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbf4e6'; ctx.beginPath(); ctx.arc(-62, -6, 44, Math.PI * 0.95, Math.PI * 1.75); ctx.lineTo(-62, -6); ctx.fill();
  ctx.fillStyle = 'rgba(240,120,120,0.35)'; ctx.beginPath(); ctx.arc(-80, 6, 8, 0, TAU); ctx.arc(-46, 6, 8, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  if (acordado) {
    ctx.fillStyle = '#2a1810'; ctx.beginPath(); ctx.arc(-76, -6, 4, 0, TAU); ctx.arc(-50, -6, 4, 0, TAU); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(-76, -8, 6, 0.2, Math.PI - 0.2); ctx.moveTo(-44, -8); ctx.arc(-50, -8, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(-63, 10, 7, 0.3, Math.PI - 0.3); ctx.stroke();
  ctx.restore();
}

// ================= CRIANÇAS (frente) =================
const CRIANCAS = [
  { pele: { base: '#8a5536', sombra: '#663a22', luz: '#a8704e' }, cabelo: 'puffs', corCabelo: '#1c120c', camisa: '#f2b632', baixo: 'saia', corBaixo: '#e2575b' },
  { pele: { base: '#f3caa8', sombra: '#d39a7c', luz: '#ffe2cc' }, cabelo: 'curto', corCabelo: '#7a4a24', camisa: '#4aa3df', baixo: 'short', corBaixo: '#3a4f7a' },
  { pele: { base: '#c98f63', sombra: '#a46a44', luz: '#e2ae86' }, cabelo: 'trancas', corCabelo: '#2a1a10', camisa: '#e86fa3', baixo: 'saia', corBaixo: '#7a5bc4' },
  { pele: { base: '#e8b48c', sombra: '#c48a66', luz: '#f8d0b0' }, cabelo: 'cachos', corCabelo: '#3b2414', camisa: '#5dbb63', baixo: 'short', corBaixo: '#c9873a' },
  { pele: { base: '#6e4128', sombra: '#4e2a16', luz: '#8a5a3c' }, cabelo: 'raspado', corCabelo: '#120a06', camisa: '#ff8a3d', baixo: 'short', corBaixo: '#2f6f8f' },
];

// o: { x, y, s, tipo(0..4), t, boca, piscar, pose:'palmas'|'cima'|'acena'|'parado'|'lado', fase(0..1 da batida), salto }
const OLHOS_KIDS = ['#6a3a1a', '#3a7fd0', '#5a3418', '#3f9a5a', '#4a2a14'];
function crianca(ctx, o) {
  const c = CRIANCAS[o.tipo % CRIANCAS.length];
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * 1.12, o.s * 1.12);
  suave(ctx, 8, () => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 100 - (o.salto || 0) * 0.2, 16, 0, 0, TAU); ctx.fill(); });
  ctx.translate(0, -(o.salto || 0));
  const P = c.pele;
  // perninhas e tênis
  for (const l of [-1, 1]) {
    vol(ctx, () => membroPath(ctx, l * 30, -190, l * 32, -40, 23, 20), P.base, l * 30 - 24, -212, 48, 190, { sombra: 0.4 });
    vol(ctx, () => ctx.ellipse(l * 38, -22, 40, 24, 0, 0, TAU), '#ef5b52', l * 38 - 40, -46, 80, 48, { sombra: 0.4, luz: 0.4 });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(l * 38, -6, 38, 8, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(l * 38 - 12, -36, 24, 5);
  }
  // roupa de baixo
  if (c.baixo === 'saia') {
    vol(ctx, () => { ctx.moveTo(-70, -262); ctx.lineTo(70, -262); ctx.quadraticCurveTo(108, -190, 112, -152); ctx.quadraticCurveTo(0, -136, -112, -152); ctx.quadraticCurveTo(-108, -190, -70, -262); }, c.corBaixo, -112, -262, 224, 126, { sombra: 0.4 });
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 4;
    for (const x of [-50, 0, 50]) { ctx.beginPath(); ctx.moveTo(x * 0.6, -255); ctx.lineTo(x * 1.4, -148); ctx.stroke(); }
  } else {
    vol(ctx, () => { ctx.moveTo(-72, -268); ctx.lineTo(72, -268); ctx.quadraticCurveTo(80, -200, 78, -160); ctx.lineTo(8, -160); ctx.lineTo(0, -200); ctx.lineTo(-8, -160); ctx.lineTo(-78, -160); ctx.quadraticCurveTo(-80, -200, -72, -268); }, c.corBaixo, -80, -268, 160, 108, { sombra: 0.4 });
  }
  // camiseta (barriguinha redonda)
  const tor = [[-66, -250], [-74, -300], [-70, -342], [-36, -356], [0, -350], [36, -356], [70, -342], [74, -300], [66, -250], [0, -238]];
  vol(ctx, () => curva(ctx, tor, true), c.camisa, -75, -356, 150, 118, { sombra: 0.42, luz: 0.3 });
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; estrela(ctx, 0, -292, 20, 8);

  // braços
  const fase = o.fase || 0, pulso = Math.pow(1 - fase, 3);
  let bE, bD;
  switch (o.pose) {
    case 'palmas': { const ab = 1 - pulso; bE = { a: 0.35, b: -2.4 + ab * 0.9 }; bD = { a: 0.35, b: -2.4 + ab * 0.9 }; break; }
    case 'cima': { const w = Math.sin((o.t || 0) * 5) * 0.12; bE = { a: 2.05 + w, b: 0.6 }; bD = { a: 2.05 - w, b: 0.6 }; break; }
    case 'acena': { const w = Math.sin((o.t || 0) * 9) * 0.35; bE = { a: 0.15, b: 0.05 }; bD = { a: 2.1, b: 0.5 + w }; break; }
    case 'lado': { const w = Math.sin((o.t || 0) * 3.4); bE = { a: 1.0 + w * 0.3, b: 0.6 }; bD = { a: 1.0 - w * 0.3, b: 0.6 }; break; }
    default: bE = { a: 0.15, b: 0.08 }; bD = { a: 0.15, b: 0.08 };
  }
  for (const [l, br] of [[-1, bE], [1, bD]]) {
    const sx = l * 64, sy = -332, a1 = br.a, a2 = br.a + br.b;
    const ex = sx + l * Math.sin(a1) * 74, ey = sy + Math.cos(a1) * 74;
    const hx = ex + l * Math.sin(a2) * 66, hy = ey + Math.cos(a2) * 66;
    const v = (ax, ay, bx, by, ra, rb, cor) => vol(ctx, () => membroPath(ctx, ax, ay, bx, by, ra, rb), cor, Math.min(ax, bx) - ra, Math.min(ay, by) - ra, Math.abs(bx - ax) + ra * 2, Math.abs(by - ay) + ra * 2, { sombra: 0.38 });
    v(ex, ey, hx, hy, 18, 16, P.base);
    v(sx, sy, ex, ey, 20, 18, P.base);
    v(sx - l * 6, sy, sx + l * Math.sin(a1) * 34, sy + Math.cos(a1) * 34, 25, 23, c.camisa);
    const mx = hx + l * Math.sin(a2) * 12, my = hy + Math.cos(a2) * 12;
    vol(ctx, () => ctx.arc(mx, my, 21, 0, TAU), P.base, mx - 21, my - 21, 42, 42, { sombra: 0.35 });
  }

  // cabeção (desenho antigo reescalado + rosto novo)
  ctx.save(); ctx.translate(0, -350); ctx.rotate(o.cabeca || 0); ctx.translate(0, 350);
  ctx.translate(0, -478); ctx.scale(1.32, 1.32); ctx.translate(0, 640);
  const cy = -640, cab = c.corCabelo;
  const gcab = lg(ctx, 0, cy - 130, 0, cy + 120, [tom(cab, 0.25), cab, tom(cab, -0.3)]);
  ctx.fillStyle = gcab;
  if (c.cabelo === 'puffs') for (const l of [-1, 1]) vol(ctx, () => ctx.arc(l * 92, cy - 85, 48, 0, TAU), cab, l * 92 - 48, cy - 133, 96, 96, { sombra: 0.45, luz: 0.25 });
  if (c.cabelo === 'trancas') {
    for (const l of [-1, 1]) {
      for (let i = 0; i < 5; i++) vol(ctx, () => ctx.ellipse(l * (86 + i * 2), cy + 10 + i * 30, 16, 19, 0, 0, TAU), cab, l * (86 + i * 2) - 16, cy - 9 + i * 30, 32, 38, { sombra: 0.4, luz: 0.25 });
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(l * 96, cy + 162, 10, 0, TAU); ctx.fill();
    }
  }
  if (c.cabelo === 'cachos') for (let i = 0; i < 16; i++) { const a = Math.PI * (0.85 + i / 15 * 1.3), x = Math.cos(a) * 95, y = cy + Math.sin(a) * 95 + 5; vol(ctx, () => ctx.arc(x, y, 32, 0, TAU), cab, x - 32, y - 32, 64, 64, { sombra: 0.45, luz: 0.2, rim: false }); }
  // orelhas
  for (const l of [-1, 1]) vol(ctx, () => ctx.ellipse(l * 90, cy + 12, 15, 20, 0, 0, TAU), P.base, l * 90 - 15, cy - 8, 30, 40, { sombra: 0.4 });
  // rosto redondo
  vol(ctx, () => ctx.ellipse(0, cy + 4, 92, 88, 0, 0, TAU), P.base, -92, cy - 84, 184, 176, { sombra: 0.32, luz: 0.32 });
  suave(ctx, 7, () => { ctx.fillStyle = 'rgba(255,100,120,0.38)'; ctx.beginPath(); ctx.ellipse(-56, cy + 34, 17, 11, 0, 0, TAU); ctx.ellipse(56, cy + 34, 17, 11, 0, 0, TAU); ctx.fill(); });
  // cabelo da frente
  const frente = (fn) => vol(ctx, fn, cab, -100, cy - 115, 200, 140, { sombra: 0.4, luz: 0.3 });
  if (c.cabelo === 'curto') frente(() => curva(ctx, [[-94, cy + 4], [-96, cy - 60], [-50, cy - 104], [20, cy - 108], [80, cy - 80], [96, cy - 10], [80, cy - 40], [40, cy - 62], [10, cy - 50], [-20, cy - 66], [-60, cy - 50], [-84, cy - 20]], true));
  else if (c.cabelo === 'raspado') frente(() => { ctx.ellipse(0, cy - 26, 93, 70, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(0, cy - 66, -93, cy - 30); });
  else if (c.cabelo === 'cachos') { for (let i = 0; i < 9; i++) { const x = -78 + i * 19.5, y = cy - 76 + Math.abs(i - 4) * 4; vol(ctx, () => ctx.arc(x, y, 28, 0, TAU), cab, x - 28, y - 28, 56, 56, { sombra: 0.4, luz: 0.25, rim: false }); } }
  else frente(() => curva(ctx, [[-94, cy], [-92, cy - 64], [-40, cy - 104], [40, cy - 104], [92, cy - 64], [94, cy], [70, cy - 50], [10, cy - 70], [0, cy - 60], [-10, cy - 70], [-70, cy - 50]], true));
  if (c.cabelo === 'puffs' || c.cabelo === 'trancas') {
    ctx.fillStyle = c.cabelo === 'puffs' ? '#ff6b9a' : '#ffd34d';
    ctx.beginPath(); ctx.ellipse(52, cy - 82, 16, 10, 0.5, 0, TAU); ctx.ellipse(74, cy - 66, 16, 10, 0.5, 0, TAU); ctx.fill();
  }
  // olhos enormes e brilhantes
  const menina = c.baixo === 'saia';
  for (const l of [-1, 1]) {
    olhoGrande(ctx, l * 36, cy + 4, 21, 25, OLHOS_KIDS[o.tipo % 5], o.piscar || 0, o.olhar || [0, 0], menina, l);
    ctx.strokeStyle = tom(cab, -0.2); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(l * 22, cy - 32); ctx.quadraticCurveTo(l * 38, cy - 40, l * 54, cy - 32); ctx.stroke();
  }
  narizFofo(ctx, 0, cy + 34, 7, P.base);
  bocaFofa(ctx, 0, cy + 54, 17, o.boca || 0);
  ctx.restore();
  ctx.restore();
}

function estrela(ctx, x, y, r1, r2, pontas = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < pontas * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / pontas; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill();
}

// ================= ANDARILHOS (perfil, andando para a direita) =================
// tipo: 'abraao' | 'sara'; fase: ciclo de passo em radianos; silhueta: cor única (contraluz)
function andarilho(ctx, o) {
  const ab = o.tipo === 'abraao', f = o.fase || 0, sil = o.silhueta;
  const bob = Math.abs(Math.sin(f)) * 10;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s, o.s);
  if (!sil) sombraChao(ctx, 140, 18);
  ctx.translate(0, -bob);
  const corManto = sil || (ab ? '#7b4a2a' : '#3f7f8c'), corTun = sil || (ab ? '#e9dcc0' : '#2f6a76');
  const corPele = sil || (ab ? PELE_ABRAAO.base : PELE_SARA.base);
  // pernas/pés aparecendo
  for (const k of [0, 1]) {
    const s = Math.sin(f + k * Math.PI);
    ctx.fillStyle = sil || '#6e4228';
    ctx.beginPath(); ctx.ellipse(s * 50 + 12, -8 + bob - Math.max(0, s) * 12, 34, 11, 0, 0, TAU); ctx.fill();
  }
  // braço de trás
  const sw = Math.sin(f) * 0.4;
  membro(ctx, -6, -760, -6 - Math.sin(-sw) * 260, -760 + Math.cos(-sw) * 260, 26, 30, sil || (ab ? '#5f3820' : '#2a5c66'));
  // corpo/túnica
  const h1 = Math.sin(f) * 16;
  ctx.beginPath(); curva(ctx, [[-66, -790], [-86, -560], [-108, -280], [-124 + h1, -14], [124 + h1, -14], [100, -280], [82, -560], [66, -790], [0, -806]], true);
  ctx.fillStyle = corTun; ctx.fill();
  if (!sil) {
    ctx.save(); ctx.clip();
    ctx.fillStyle = corManto; ctx.beginPath(); curva(ctx, [[-66, -790], [-86, -560], [-108, -280], [-124 + h1, -14], [-10 + h1, -14], [0, -300], [10, -560], [36, -796]], true); ctx.fill();
    ctx.fillStyle = lg(ctx, -100, 0, 100, 0, ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.3)']); ctx.fillRect(-120, -810, 240, 820);
    ctx.restore();
    ctx.fillStyle = ab ? '#b5492f' : '#d9b45a'; ctx.fillRect(-80, -585, 160, 30);
  }
  // cabeça de perfil
  ctx.save(); ctx.translate(10, -880); ctx.scale(1.7, 1.7);
  ctx.fillStyle = corPele; ctx.beginPath(); ctx.ellipse(10, 0, 58, 70, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(60, -16); ctx.quadraticCurveTo(84, 10, 64, 18); ctx.fill(); // nariz
  if (!sil) {
    ctx.fillStyle = '#2a1810'; ctx.beginPath(); ctx.ellipse(44, -8, 5, 6.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(230,110,100,0.35)'; ctx.beginPath(); ctx.arc(34, 16, 12, 0, TAU); ctx.fill();
  }
  if (ab) {
    ctx.fillStyle = sil || '#f2f1ec';
    ctx.beginPath(); curva(ctx, [[66, 26], [60, 60], [40, 120], [6, 150], [-10, 100], [-20, 40], [0, 30], [30, 34]], true); ctx.fill();
    ctx.beginPath(); ctx.ellipse(36, -26, 18, 6, 0, 0, TAU); ctx.fill();
  } else if (!sil) {
    boca(ctx, 50, 38, 0);
  }
  // pano na cabeça
  ctx.fillStyle = sil || (ab ? '#eee5d2' : '#d7a48e');
  ctx.beginPath(); curva(ctx, [[48, -60], [20, -82], [-40, -74], [-66, -20], [-76, 80], [-96, 160], [-30, 120], [-10, 40], [-6, -10], [20, -44]], true); ctx.fill();
  if (ab && !sil) { ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(40, -58); ctx.quadraticCurveTo(-10, -62, -56, -40); ctx.stroke(); }
  ctx.restore();
  // braço da frente (+ cajado para Abraão)
  const ang = ab ? -0.5 + Math.sin(f) * 0.12 : -sw;
  const hx = 4 + Math.sin(-ang) * -200, hy = -760 + Math.cos(ang) * 200;
  if (ab) {
    const cx = 120 + Math.sin(f) * 30;
    ctx.strokeStyle = sil || '#7a4c26'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 20, bob - 4); ctx.lineTo(cx + 10, -940); ctx.quadraticCurveTo(cx + 14, -1010, cx - 36, -1004); ctx.quadraticCurveTo(cx - 56, -994, cx - 46, -970); ctx.stroke();
    membro(ctx, 6, -760, cx - 6, -620, 28, 30, corManto);
    ctx.fillStyle = corPele; ctx.beginPath(); ctx.arc(cx - 2, -616, 18, 0, TAU); ctx.fill();
  } else {
    membro(ctx, 6, -760, 6 + Math.sin(sw) * 250, -760 + Math.cos(sw) * 250, 24, 28, corManto);
    ctx.fillStyle = corPele; ctx.beginPath(); ctx.arc(6 + Math.sin(sw) * 272, -760 + Math.cos(sw) * 272, 16, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ================= CAMELO (perfil, para a direita) =================
function camelo(ctx, o) {
  const f = o.fase || 0, sil = o.silhueta;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s, o.s);
  if (!sil) sombraChao(ctx, 260, 24);
  const bob = Math.abs(Math.sin(f)) * 8;
  ctx.translate(0, -bob);
  const cor = sil || '#c99a63', esc = sil || '#a87a48';
  // pernas (4), duas de trás mais escuras
  const perna = (x, fase, c) => {
    const s = Math.sin(fase);
    const kx = x + s * 26, ky = -230, px = x + s * 60, py = -Math.max(0, s) * 26 + bob;
    membro(ctx, x, -420, kx, ky, 32, 21, c);
    membro(ctx, kx, ky, px, py, 21, 15, c);
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(px + 6, py - 6, 22, 9, 0, 0, TAU); ctx.fill();
  };
  perna(-150, f + Math.PI, esc); perna(140, f, esc);
  // corpo e corcova
  ctx.fillStyle = cor;
  ctx.beginPath(); curva(ctx, [[-210, -440], [-190, -560], [-90, -640], [0, -690], [80, -620], [190, -560], [230, -470], [190, -390], [0, -380], [-170, -390]], true); ctx.fill();
  // pescoço e cabeça
  membro(ctx, 180, -490, 300, -720, 70, 40, cor);
  ctx.beginPath(); ctx.ellipse(330, -740, 70, 36, 0.25, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(304, -778, 10, 18, -0.3, 0, TAU); ctx.fill(); // orelha
  if (!sil) {
    ctx.fillStyle = '#2a1810'; ctx.beginPath(); ctx.arc(330, -752, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(372, -718); ctx.quadraticCurveTo(388, -712, 396, -720); ctx.stroke();
    // manta de sela
    ctx.fillStyle = '#b8462f'; ctx.beginPath(); curva(ctx, [[-110, -620], [0, -688], [100, -616], [110, -470], [-110, -470]], true); ctx.fill();
    ctx.fillStyle = '#e8b84a'; ctx.fillRect(-110, -490, 220, 14);
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-100 + i * 28, -462, 7, 0, TAU); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, -700, 0, -380, ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0)', 'rgba(60,30,0,0.25)']);
    ctx.beginPath(); curva(ctx, [[-210, -440], [-190, -560], [-90, -640], [0, -690], [80, -620], [190, -560], [230, -470], [190, -390], [0, -380], [-170, -390]], true); ctx.fill();
  }
  perna(-120, f, cor); perna(170, f + Math.PI, cor);
  // rabo
  ctx.strokeStyle = cor; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-205, -470); ctx.quadraticCurveTo(-240 + Math.sin(f * 2) * 10, -400, -228, -340); ctx.stroke();
  ctx.restore();
}

// ================= OVELHA (perfil, para a direita) =================
function ovelha(ctx, o) {
  const f = o.fase || 0, sil = o.silhueta;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  if (!sil) sombraChao(ctx, 110, 14, 0.22);
  const bob = Math.abs(Math.sin(f * 1.3)) * 8;
  ctx.translate(0, -bob);
  for (const [x, ph] of [[-60, 0], [-30, Math.PI], [40, Math.PI], [70, 0]]) {
    const s = Math.sin(f * 1.3 + ph);
    membro(ctx, x, -90, x + s * 16, -2 + bob, 9, 7, sil || '#3a2c26');
  }
  ctx.fillStyle = sil || '#f7f4ec';
  const r = rng(o.semente || 3);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 80, -130 + Math.sin(a) * 44, 34 + r() * 8, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, -130, 90, 52, 0, 0, TAU); ctx.fill();
  if (!sil) {
    ctx.fillStyle = 'rgba(160,150,130,0.3)'; ctx.beginPath(); ctx.ellipse(0, -100, 86, 26, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-10, -160, 50, 18, 0, 0, TAU); ctx.fill();
  }
  // cabeça
  ctx.fillStyle = sil || '#3a2c26';
  ctx.beginPath(); ctx.ellipse(110, -150, 30, 38, 0.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(92, -178, 22, 9, -0.5, 0, TAU); ctx.fill();
  if (!sil) {
    ctx.fillStyle = '#f7f4ec'; ctx.beginPath(); ctx.arc(96, -184, 20, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(118, -160, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(120, -160, 3.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
