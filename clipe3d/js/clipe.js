// Clipe 3D "Abraão Confiou": personagens do estilo-boneco, cenários 3D, câmera por cena,
// boca sincronizada com a voz e legenda karaokê por cima.
import * as THREE from 'three';
import { criarPalco } from '../../estilo-boneco/src/lights.js';
import { createCharacter, POSES } from '../../estilo-boneco/src/character.js';
import { ELENCO } from '../../estilo-boneco/src/elenco.js';
import * as C from './cenario.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };

// ---------------- palco ----------------
const c3d = document.getElementById('c3d');
const P = criarPalco(c3d, 1920, 1080);
P.camera.fov = 32; P.camera.far = 900; P.camera.updateProjectionMatrix();
const cena = P.scene;
cena.fog = new THREE.Fog('#cfe6f5', 60, 260);
const ceu = C.criarCeu(); cena.add(ceu);
const sol = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.2), toneMapped: false, fog: false }));
cena.add(sol);

// ---------------- ambientes (céu, névoa, luz) ----------------
const AMB = {
  dia: { topo: '#4fa8ea', meio: '#9fd6f6', hor: '#fff0d6', nevoa: '#d9ecf6', chave: ['#fff1de', 2.7], ceu: ['#e6f2ff', '#cfe8b8', 0.7], sol: [80, 70, -220], bloom: 0.12, env: 0.35, rim: '#ffd6a0' },
  amanhecer: { topo: '#5d6fb8', meio: '#e89aa0', hor: '#ffd39a', nevoa: '#f2c4a8', chave: ['#ffc896', 2.2], ceu: ['#f0c8d8', '#d8b090', 0.6], sol: [0, 18, -240], bloom: 0.25, env: 0.3, rim: '#ffb070' },
  por: { topo: '#3d3a7a', meio: '#d9677a', hor: '#ffb45e', nevoa: '#f0a080', chave: ['#ffb070', 2.5], ceu: ['#f0a8b8', '#c09060', 0.55], sol: [-60, 22, -230], bloom: 0.3, env: 0.3, rim: '#ffa060' },
  noite: { topo: '#05081e', meio: '#14205a', hor: '#2c3c7e', nevoa: '#141c44', chave: ['#9fb8ff', 0.75], ceu: ['#4060b0', '#101830', 0.2], sol: [90, 80, -230], bloom: 0.55, env: 0.12, rim: '#a8c4ff' },
  festa: { topo: '#ff9ad0', meio: '#ffd27a', hor: '#fff4c8', nevoa: '#ffe2c0', chave: ['#fff0dc', 2.8], ceu: ['#ffe8f4', '#ffe0a0', 0.8], sol: [0, 60, -220], bloom: 0.3, env: 0.4, rim: '#ffc0e0' },
};
function ambiente(nome) {
  const a = AMB[nome], u = ceu.material.uniforms;
  u.topo.value.set(a.topo); u.meio.value.set(a.meio); u.horizonte.value.set(a.hor);
  cena.fog.color.set(a.nevoa);
  P.luzes.chave.color.set(a.chave[0]); P.luzes.chave.intensity = a.chave[1];
  P.luzes.ceu.color.set(a.ceu[0]); P.luzes.ceu.groundColor.set(a.ceu[1]); P.luzes.ceu.intensity = a.ceu[2];
  P.luzes.rim.color.set(a.rim); P.luzes.rim2.color.set(a.rim);
  P.luzes.preench.intensity = nome === 'noite' ? 0.5 : 0.9;
  cena.environmentIntensity = a.env; P.bloom.strength = a.bloom;
  sol.position.set(...a.sol); sol.visible = nome !== 'noite';
  sol.material.color.setRGB(...(nome === 'por' || nome === 'amanhecer' ? [3, 1.9, 1.0] : [3, 2.8, 2.2]));
}
// sombra acompanha o centro da ação
function luzEm(x, z, raio = 14) {
  const k = P.luzes.chave;
  k.position.set(x + 10, 22, z + 14); k.target.position.set(x, 0, z); k.target.updateMatrixWorld();
  Object.assign(k.shadow.camera, { left: -raio, right: raio, top: raio, bottom: -raio, near: 1, far: 80 }); k.shadow.camera.updateProjectionMatrix();
}
cena.add(P.luzes.chave.target);

// ---------------- cenários ----------------
const G = {};
function grupo(nome, ...objs) { const g = new THREE.Group(); objs.forEach((o) => g.add(o)); g.visible = false; cena.add(g); G[nome] = g; return g; }
// prado com tendas e árvores
grupo('prado', C.criarTerreno({ cor: '#86d45e', cor2: '#5fb24a', amp: 2.4 }), C.criarFlores(320, 30), C.criarMontanhas('#a6c2d2', 10, 3, 170), C.criarNuvens(10, 4));
[[-16, -14, 1.2], [15, -18, 1.4], [-30, -40, 1.6], [34, -36, 1.5], [-6, -46, 1.3]].forEach(([x, z, s]) => { const a = C.criarArvore(s, ['#5fb24a', '#6cc04e', '#4fa040'][Math.abs(x) % 3]); a.position.set(x, 0, z); G.prado.add(a); });
[[-24, -24, 1.0, '#d8b07a'], [21, -27, 0.9, '#e0c08a'], [4, -38, 1.1, '#cfa06a']].forEach(([x, z, s, c]) => { const t = C.criarTenda(s, c); t.position.set(x, 0, z); t.rotation.y = -x * 0.02; G.prado.add(t); });
// deserto (dunas, palmeiras)
grupo('deserto', C.criarTerreno({ cor: '#f0cf93', cor2: '#dcae6c', amp: 3.2, freq: 0.8, semente: 4 }), C.criarMontanhas('#c9a88a', 9, 8, 180), C.criarNuvens(6, 8));
for (let i = 0; i < 9; i++) { const p = C.criarPalmeira(1 + (i % 3) * 0.2); p.position.set(-30 + i * 14 + (i % 2) * 4, 0, -16 - (i % 3) * 9); G.deserto.add(p); }
// cidade de Ur
grupo('ur', C.criarTerreno({ cor: '#ecd09c', cor2: '#d9b07a', amp: 1.2, semente: 9 }), C.criarMontanhas('#d0bca4', 9, 11, 170), C.criarNuvens(7, 11));
const zig = C.criarZigurate(); zig.position.set(-14, 0, -48); G.ur.add(zig);
[[-14, -10, 7, 4.5, 6], [-24, -18, 6, 4, 5], [13, -12, 8, 5, 6], [24, -20, 6, 4.5, 5], [6, -26, 7, 4, 5], [-6, -30, 6, 4, 5]].forEach(([x, z, l, a, p], i) => { const c = C.criarCasa(l, a, p, ['#e2b884', '#dcae78', '#e8c494'][i % 3]); c.position.set(x, 0, z); c.rotation.y = (i % 2 ? 0.15 : -0.15); G.ur.add(c); });
[[-8, -6], [9, -5], [18, -6]].forEach(([x, z]) => { const p = C.criarPalmeira(1.1); p.position.set(x, 0, z); G.ur.add(p); });
// extras
const estrelas = C.criarEstrelas(); cena.add(estrelas);
const estrelasG = C.criarEstrelasGrandes(46); cena.add(estrelasG);
const lua = C.criarLua(); lua.position.set(70, 90, -230); cena.add(lua);
const fogueira = C.criarFogueira(); cena.add(fogueira);
const feixe = C.criarFeixe(); cena.add(feixe);
const confete = C.criarConfete(520); cena.add(confete);
const camelo = C.criarCamelo(); cena.add(camelo);
const ovelhas = [0, 1, 2, 3].map(() => { const o = C.criarOvelha(); cena.add(o); return o; });

// ---------------- personagens ----------------
const prof = createCharacter({ ...ELENCO.professora, res: 96 });
const kids = ELENCO.criancas.map((p) => createCharacter({ ...p, res: 88 }));
const abraao = createCharacter({ ...ELENCO.abraao, res: 96 });
const sara = createCharacter({ ...ELENCO.sara, res: 96, pose: POSES.colo });
const TODOS = [prof, ...kids, abraao, sara];
TODOS.forEach((c) => cena.add(c));
const extras = [estrelas, estrelasG, lua, fogueira, feixe, confete, camelo, ...ovelhas];

// boca: fala com a voz da música (visemas variando)
function voz(t, fator = 1) {
  const l = window.cantando(t); if (!l) return { fala: 0, visema: null };
  const v = cl((window.nivelVoz(t) - 0.16) * 1.9 * fator);
  return { fala: v * (0.55 + 0.45 * Math.abs(Math.sin(t * 12.5))), visema: ['A', 'E', 'O', 'A', 'E'][Math.floor(t * 7.5) % 5] };
}
const coro = (t) => { const l = window.linhaEm(t); return l && ['refrao', 'ponte', 'final', 'estrelas', 'isaque'].includes(l.sec); };

function por(c, x, z, ry = 0) { c.visible = true; c.position.set(x, 0, z); c.rotation.set(0, ry, 0); }
function camera(px, py, pz, lx, ly, lz, fov = 32) { P.camera.position.set(px, py, pz); P.camera.lookAt(lx, ly, lz); if (P.camera.fov !== fov) { P.camera.fov = fov; P.camera.updateProjectionMatrix(); } }

// poses nomeadas da professora / crianças
const PO = {
  coracao: { bracoE: { frente: 0.62, abre: -0.36, dobra: 1.35, aceno: -0.75 }, bracoD: { frente: 0.6, abre: -0.36, dobra: 1.4, aceno: -0.75 } },
  abertos: { bracoE: { abre: 0.85, frente: 0.3, dobra: 0.35 }, bracoD: { abre: 0.85, frente: 0.3, dobra: 0.35 } },
  cima: { bracoE: { abre: 1.25, frente: 0.15, aceno: 1.1 }, bracoD: { abre: 1.25, frente: 0.15, aceno: 1.1 }, cabecaFrente: -0.12 },
  aponta: { bracoD: { abre: 1.35, frente: 0.35, aceno: 1.3 }, cabecaFrente: -0.35 },
  lado: (t) => ({ bracoE: { abre: 0.45 + 0.18 * Math.sin(t * 3.4), dobra: 0.35, frente: 0.15 }, bracoD: { abre: 0.45 - 0.18 * Math.sin(t * 3.4), dobra: 0.35, frente: 0.15 } }),
};
function animKids(t, pos, modo) {
  kids.forEach((k, i) => {
    const [x, z, ry] = pos[i]; por(k, x, z, ry);
    const vz = coro(t) ? voz(t + i * 0.03, 0.9) : { fala: 0 };
    const m = typeof modo === 'function' ? modo(i) : modo;
    const op = { bpm: 172, expressao: 'feliz', ...vz };
    if (m === 'palmas') op.palmas = true;
    else if (m === 'acenar') op.acenar = true;
    else if (m === 'pula') { op.pose = PO.cima; }
    else if (m === 'cima') op.pose = PO.cima;
    else if (m === 'lado') op.pose = PO.lado(t + i);
    else if (m === 'olhaCima') op.pose = { cabecaFrente: -0.4 };
    k.userData.animar(t + i * 0.37, op);
    if (m === 'pula') { const f = (t * 172 / 60 + i * 0.25) % 1; k.position.y = 0.9 * Math.sin(f * Math.PI) ** 2; }
  });
}
function cantoraAnim(t, x, z, ry, pose, extra = {}) {
  por(prof, x, z, ry);
  prof.userData.animar(t, { bpm: 172, expressao: 'feliz', ...voz(t), ...(typeof pose === 'string' ? { [pose]: true } : { pose }), ...extra });
}

// ---------------- cenas (mesma linha do tempo da versão 2D) ----------------
const KF = [[-7.2, 1.5, 0.35], [-3.9, 2.6, 0.2], [3.9, 2.6, -0.2], [7.2, 1.5, -0.35]];
function caravana(t, lt, amb, silhueta = false) {
  G.deserto.visible = true; ambiente(amb);
  const x0 = -8 + lt * 1.5, f = t * 5.4, sil = silhueta;
  por(abraao, x0 + 6, 0, Math.PI / 2); abraao.userData.animar(t, { pose: { passo: f }, balancar: false, expressao: lt < 2 && !silhueta ? 'surpreso' : 'feliz' });
  por(sara, x0 + 2.6, 1.2, Math.PI / 2); sara.userData.animar(t, { pose: { passo: f + 1.2 }, balancar: false, expressao: 'feliz' });
  if (sara.userData.bebe) sara.userData.bebe.visible = false;
  camelo.visible = true; camelo.position.set(x0 - 3.5, 0, -0.6); camelo.rotation.y = 0; camelo.userData.animar(f);
  ovelhas.forEach((o, i) => { o.visible = true; o.position.set(x0 - 8 - i * 2.2, 0, 2 + (i % 2) * 1.6); o.rotation.y = 0; o.userData.animar(f + i); });
  if (abraao.userData.cajado) abraao.userData.cajado.visible = true;
  luzEm(x0, 0, 18);
  camera(x0 + 0.5 + lt * 0.2, 5.0, 33, x0 + 0.5, 4.6, 0, 30);
}
function familia(t, lt, close) {
  G.prado.visible = true; ambiente('por');
  por(sara, close ? 0 : -2.2, 0, close ? 0 : 0.25); sara.userData.animar(t, { pose: POSES.colo, expressao: 'feliz', balancar: false });
  if (sara.userData.bebe) sara.userData.bebe.visible = true;
  if (!close) { por(abraao, 2.6, 0, -0.3); abraao.userData.animar(t, { pose: { bracoE: { abre: 0.9, frente: 0.3, dobra: 0.6 }, cabecaInclina: -0.12, cabecaGira: -0.3 }, expressao: 'rindo', balancar: false }); }
  luzEm(0, 0, 10);
  if (close) camera(0.4, 7.2 + lt * 0.05, 9.5 - lt * 0.3, 0, 6.6, 0, 30);
  else camera(0, 6.0, 21 - lt * 0.6, 0, 5.2, 0, 30);
}
function noite(t, lt, quem) {
  G.prado.visible = true; ambiente('noite'); estrelas.visible = true; lua.visible = true;
  estrelas.userData.animar(t, 1); estrelasG.visible = true; estrelasG.userData.animar(t, cl(lt / 2.2));
  if (quem === 'cantora') {
    cantoraAnim(t, 0, 0, 0.1, PO.aponta, { expressao: 'surpreso' });
    animKids(t, [[-4.2, 1.6, 0.4], [-2.2, 2.6, 0.2], [2.4, 2.6, -0.2], [4.4, 1.6, -0.4]], 'olhaCima');
    camera(0, 3.6, 24, 0, 6.2, 0, 34);
  } else {
    por(abraao, quem === 'abraao2' ? -1 : 0, 0, 0.35); abraao.userData.animar(t, { pose: PO.aponta, expressao: 'surpreso', balancar: false });
    camera(-3, 2.6, 21, 0, 8.5, 0, 36);
  }
  luzEm(0, 0, 12);
}
function ponteFesta(t, lt) {
  G.prado.visible = true; ambiente('festa'); confete.visible = true; confete.userData.animar(t);
  cantoraAnim(t, 0, 0, 0, 'palmas');
  animKids(t, KF, 'pula');
  const b = Math.sin(t * Math.PI * 172 / 60);
  camera(Math.sin(lt * 0.4) * 3, 4.4, 27 - b * 0.15, 0, 4.4, 0, 32);
  luzEm(0, 0, 14);
}
function festa(t, lt, op = {}) {
  G.prado.visible = true; ambiente('dia');
  const cima = op.cima && t >= op.cima[0] && t <= op.cima[1];
  const fiel = op.fiel && t > op.fiel;
  cantoraAnim(t, 0, 0, 0, cima ? PO.cima : (fiel ? PO.coracao : (Math.floor(lt / 2.8) % 2 ? 'palmas' : PO.lado(t))));
  animKids(t, KF, cima ? 'cima' : (op.pula ? (i) => (i % 2 ? 'pula' : 'palmas') : 'palmas'));
  if (op.pula) { confete.visible = true; confete.userData.animar(t); }
  const v = op.variacao || 0;
  camera(Math.sin(lt * 0.3 + v) * 4, 4.6 + v * 0.3, 25 - Math.sin(lt * 0.5) * 1.5, 0, 4.6, 0, 32);
  luzEm(0, 0, 14);
}

const CENAS = [
  [0, 6.6, (t, lt) => { // abertura: amanhecer no deserto, caravana ao longe (título no overlay)
    G.deserto.visible = true; ambiente('amanhecer');
    const x0 = -10 + t * 1.2, f = t * 5.4;
    por(abraao, x0 + 4, -18, Math.PI / 2); abraao.userData.animar(t, { pose: { passo: f }, balancar: false }); abraao.userData.cajado.visible = true;
    camelo.visible = true; camelo.position.set(x0 - 2, 0, -18.6); camelo.userData.animar(f);
    luzEm(x0, -18, 14); camera(0, 6 + t * 0.3, 40 - t * 0.8, 0, 9, -18, 34);
  }],
  [6.6, 15.45, (t, lt) => { // boas-vindas: professora chega andando e acena; crianças acenam
    G.prado.visible = true; ambiente('dia');
    const entra = sm(lt / 2.8), x = -14 + 14 * entra;
    if (entra < 1) { por(prof, x, 0, Math.PI / 2 * (1 - entra)); prof.userData.animar(t, { pose: { passo: t * 6.5 }, balancar: false, expressao: 'feliz' }); }
    else cantoraAnim(t, 0, 0, 0, 'acenar', { fala: lt > 3 && lt < 5 ? 0.6 * Math.abs(Math.sin(t * 9)) : 0, visema: 'A' });
    animKids(t, KF, lt > 2.6 ? 'acenar' : 'parado');
    luzEm(0, 0, 14); camera(-2 + lt * 0.3, 4.8, 26, 0, 4.6, 0, 32);
  }],
  [15.45, 27.0, (t, lt) => { // Deus chama Abraão em Ur
    G.ur.visible = true; ambiente('dia');
    const chamado = t > 21.6;
    por(abraao, 0, 0, 0.15);
    abraao.userData.animar(t, { pose: chamado ? { ...PO.cima, cabecaFrente: -0.3 } : { cabecaFrente: -0.32, bracoE: { frente: 0.3, dobra: 0.5 } }, expressao: chamado ? 'rindo' : 'surpreso', balancar: false });
    feixe.visible = true; feixe.position.set(0.5, 0, 0.5); feixe.userData.forca(chamado ? 0.9 : 0.45 + 0.1 * Math.sin(t * 2));
    ovelhas.slice(0, 2).forEach((o, i) => { o.visible = true; o.position.set(i ? 7 : -7.5, 0, -3 + i); o.rotation.y = i ? Math.PI : 0; o.userData.animar(0); });
    luzEm(0, 0, 14); camera(2 - lt * 0.15, 5.2, 26 - lt * 0.5, 0, 6, 0, 32);
  }],
  [27.0, 32.7, (t, lt) => caravana(t, lt, 'dia')],
  [32.7, 38.85, (t, lt) => { // "Eu vou Te obedecer!" — close do Abraão, pôr do sol
    G.deserto.visible = true; ambiente('por');
    const acena = t > 34.3 && t < 36 ? Math.sin((t - 34.3) * 8) * 0.08 : 0;
    por(abraao, 0, 0, 0.1);
    abraao.userData.animar(t, { pose: { ...PO.coracao, bracoE: { abre: 0.05, dobra: 0.2 }, cabecaFrente: 0.06 + acena }, expressao: 'feliz', balancar: false, ...voz(t) });
    feixe.visible = true; feixe.position.set(-6, 0, -30); feixe.userData.forca(0.35);
    luzEm(0, 0, 8); camera(1.2, 8.3, 11.5 - lt * 0.2, 0, 8.0, 0, 30);
  }],
  [38.85, 44.25, (t, lt) => { // "Passo a passo, pela fé" — caminhando juntos
    G.prado.visible = true; ambiente('dia');
    const x0 = -9 + lt * 1.7, f = t * 6.4;
    por(prof, x0, 0, Math.PI / 2 - 0.25); prof.userData.animar(t, { pose: { passo: f }, balancar: false, expressao: 'feliz', ...voz(t) });
    kids.forEach((k, i) => { por(k, x0 - 2.6 - i * 2.2, 1.6 + (i % 2) * 1.4, Math.PI / 2 - 0.2); k.userData.animar(t + i, { pose: { passo: f + i * 0.9 }, balancar: false, expressao: 'feliz', ...(coro(t) ? voz(t) : {}) }); });
    luzEm(x0 - 3, 0, 16); camera(x0 - 2.5, 4.4, 25, x0 - 3, 3.6, 0, 32);
  }],
  [44.25, 49.85, (t, lt) => { // "Quem confia no Senhor..." — close da professora
    G.prado.visible = true; ambiente('dia');
    cantoraAnim(t, 0, 0, 0, t < 46.4 ? PO.coracao : PO.abertos);
    feixe.visible = true; feixe.position.set(0, 0, -1); feixe.userData.forca(0.3);
    luzEm(0, 0, 8); camera(0.3, 8.2, 13 - lt * 0.25, 0, 7.6, 0, 30);
  }],
  [49.85, 61.55, (t, lt) => festa(t, lt, { fiel: 58.8 })],
  [61.55, 64.25, (t, lt) => noite(t, lt, 'abraao')],
  [64.25, 67.1, (t, lt) => familia(t, lt, false)],
  [67.1, 75.6, (t, lt) => { G.prado.visible = true; ambiente('por'); cantoraAnim(t, 0, 0, 0, PO.lado(t)); animKids(t, KF, 'lado'); luzEm(0, 0, 14); camera(Math.sin(lt * 0.3) * 3, 4.6, 26, 0, 4.6, 0, 32); }],
  [75.6, 84.1, (t, lt) => ponteFesta(t, lt)],
  [84.1, 90.2, (t, lt) => { G.prado.visible = true; ambiente('festa'); cantoraAnim(t, 0, 0, 0, PO.cima); animKids(t, KF, 'cima'); feixe.visible = true; feixe.position.set(0, 0, -0.5); feixe.userData.forca(0.6); luzEm(0, 0, 14); camera(0, 5, 24 - lt * 0.5, 0, 5.2, 0, 32); }],
  [90.2, 94.35, (t, lt) => caravana(t, lt, 'por', true)],
  [94.35, 105.6, (t, lt) => festa(t, lt, { cima: [95.9, 99.9], variacao: 1 })],
  [105.6, 108.4, (t, lt) => noite(t, lt, 'cantora')],
  [108.4, 111.25, (t, lt) => familia(t, lt, true)],
  [111.25, 119.7, (t, lt) => caravana(t, lt, 'dia')],
  [119.7, 128.75, (t, lt) => { // fogueira à noite (palavras suaves no overlay)
    G.prado.visible = true; ambiente('noite'); estrelas.visible = true; estrelas.userData.animar(t, 1); lua.visible = true;
    fogueira.visible = true; fogueira.position.set(0, 0, 3); fogueira.scale.setScalar(1.6); fogueira.userData.animar(t);
    cantoraAnim(t, 4.2, -1.6, -0.45, PO.lado(t));
    animKids(t, [[-6.4, 2.4, 0.7], [-3.6, 5.6, 0.9], [3.2, 6.2, -0.9], [7.2, 2.8, -0.8]], 'lado');
    luzEm(0, 2, 14); camera(0, 5.0, 28, 0, 4.4, 1, 34);
  }],
  [128.75, 140.0, (t, lt) => festa(t, lt, { fiel: 137.4, pula: true, variacao: 2 })],
  [140.0, 142.8, (t, lt) => noite(t, lt, 'abraao2')],
  [142.8, 145.85, (t, lt) => familia(t, lt, false)],
  [145.85, 154.15, (t, lt) => { G.prado.visible = true; ambiente('por'); const fim = lt > 5.5; cantoraAnim(t, 0, 0, 0, fim ? 'acenar' : PO.lado(t)); animKids(t, KF, fim ? 'acenar' : 'lado'); luzEm(0, 0, 14); camera(-Math.sin(lt * 0.3) * 3, 4.6, 26, 0, 4.6, 0, 32); }],
  [154.15, 165.2, (t, lt) => ponteFesta(t, lt)],
  [165.2, 999, (t, lt) => { // final: braços abertos, depois todos acenam (card no overlay)
    G.prado.visible = true; ambiente('por'); feixe.visible = true; feixe.position.set(0, 0, -1); feixe.userData.forca(0.5);
    cantoraAnim(t, 0, 0, 0, lt < 2.5 ? PO.abertos : 'acenar'); animKids(t, KF, 'acenar');
    luzEm(0, 0, 14); camera(0, 4.8, 25 + lt * 0.4, 0, 4.8, 0, 32);
  }],
];
export const cenaEm = (t) => { for (let i = CENAS.length - 1; i >= 0; i--) if (t >= CENAS[i][0]) return i; return 0; };

export function quadro3D(t) {
  if (abraao.userData.cajado) abraao.userData.cajado.visible = false;
  for (const g of Object.values(G)) g.visible = false;
  for (const o of [...TODOS, ...extras]) o.visible = false;
  for (const g of Object.values(G)) g.children.forEach((o) => o.userData.animar && o.userData.animar(t));
  const i = cenaEm(t), [t0, , fn] = CENAS[i];
  fn(t, t - t0);
  P.render();
  return t - t0;
}
export { P };
