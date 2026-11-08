// Página de teste. ?test=rosto -> cabeças e expressões (etapa 1: rosto)
import * as THREE from 'three';
import { criarPalco } from './lights.js';
import { criarCabeca, EXPRESSOES } from './face.js';
import { criarCabelo } from './hair.js';
import { matRoupa } from './materials.js';
import { createCharacter, POSES } from './character.js';
import { folhaDeModelo } from './folha.js';
import { ELENCO } from './elenco.js';

const q = new URLSearchParams(location.search);
// a folha de modelo usa uma tela mais alta
const P = q.get('test') === 'model' ? criarPalco(document.getElementById('c'), 1920, 1600) : criarPalco(document.getElementById('c'));

function fundo(c1, c2) {
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 256;
  const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// cabeça completa (rosto + cabelo) — o corpo vem na próxima etapa
export function cabecaCompleta(params) {
  const g = new THREE.Group();
  const cab = criarCabeca(params); g.add(cab);
  g.add(criarCabelo(cab.userData.p, params));
  g.userData.rosto = cab.userData.rosto;
  return g;
}

function testeRosto() {
  P.scene.background = fundo('#a9dcff', '#fff0d6');
  const linha1 = [
    { idade: 'crianca', menina: true, pele: '#9a603e', penteado: 'coquinhos', corCabelo: '#24150e', corOlhos: '#5a3418', expr: 'feliz' },
    { idade: 'crianca', pele: '#f3c9a6', penteado: 'espetado', corCabelo: '#c8562a', corOlhos: '#2f7fe0', expr: 'rindo' },
    { idade: 'bebe', pele: '#e8b48c', penteado: 'gorro', corGorro: '#3fa0e8', corCabelo: '#6a4024', corOlhos: '#3f9a5a', expr: 'surpreso' },
    { idade: 'adulto', menina: true, pele: '#f2c09c', penteado: 'liso', corCabelo: '#7a3a18', corOlhos: '#7a4422', expr: 'feliz' },
  ];
  linha1.forEach((c, i) => {
    const h = cabecaCompleta(c); h.position.set(-5.1 + i * 3.4, 1.75, 0);
    h.rotation.set(0.04, (i - 1.5) * -0.12, (i % 2 ? -1 : 1) * 0.08); h.userData.rosto({ expressao: c.expr });
    P.scene.add(h);
  });
  const nomes = ['feliz', 'rindo', 'surpreso', 'triste', 'desconfiado', 'bravo'];
  nomes.forEach((e, i) => {
    const h = cabecaCompleta({ idade: 'crianca', menina: true, pele: '#c98f63', penteado: 'rabo', corCabelo: '#ff5fa8', corOlhos: '#2c8a8a', semente: 3 });
    h.scale.setScalar(0.78); h.position.set(-6.0 + i * 2.4, -1.75, 0); h.rotation.set(0.05, -0.18, 0.05);
    h.userData.rosto({ expressao: e }); P.scene.add(h);
  });
  P.camera.position.set(0, 0.2, 15.5); P.camera.lookAt(0, 0, 0);
}

function testeClose() {
  P.scene.background = fundo('#a9dcff', '#fff0d6');
  const a = cabecaCompleta({ idade: 'crianca', menina: true, pele: '#9a603e', penteado: 'coquinhos', corCabelo: '#24150e', corOlhos: '#5a3418' });
  a.position.set(-1.45, 0, 0); a.rotation.set(0.05, 0.22, 0.1); a.userData.rosto({ expressao: 'feliz' }); P.scene.add(a);
  const b = cabecaCompleta({ idade: 'crianca', pele: '#f3c9a6', penteado: 'lateral', corCabelo: '#c8562a', corOlhos: '#2f7fe0' });
  b.position.set(1.45, 0, 0); b.rotation.set(0.02, -0.25, -0.08); b.userData.rosto({ expressao: 'rindo' }); P.scene.add(b);
  // ombros com camiseta (só para enquadrar o close; o corpo vem na próxima etapa)
  for (const [h, cor] of [[a, '#f2b632'], [b, '#4aa3df']]) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), matRoupa(cor));
    t.scale.set(1.05, 0.62, 0.7); t.position.set(0, -1.75, -0.12); t.castShadow = t.receiveShadow = true; h.add(t);
  }
  P.camera.position.set(0, 0.0, 9.6); P.camera.lookAt(0, -0.25, 0);
}
// chão que recebe sombra + sombra de contato macia sob os pés
function chao(y = 0) {
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.28 }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = y; sombra.receiveShadow = true; P.scene.add(sombra);
}
function blob(x, z, r = 1.2) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(40,20,30,0.45)'); g.addColorStop(1, 'rgba(40,20,30,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.005, z); P.scene.add(m);
}
function testeCorpo(vista = 'frente') {
  P.scene.background = fundo('#a9dcff', '#fff0d6');
  chao();
  const ang = vista === 'frente' ? 0 : 0.62; // ¾
  const a = createCharacter({ idade: 'crianca', menina: true, pele: '#9a603e', penteado: 'coquinhos', corCabelo: '#24150e', corOlhos: '#5a3418', roupa: 'vestido', corRoupa: '#f2b632', corSapato: '#ff6f9a', pose: POSES.menina });
  a.position.set(-1.85, 0, 0); a.rotation.y = ang; a.userData.expressao({ expressao: 'feliz' }); P.scene.add(a); blob(-1.85, 0.1);
  const b = createCharacter({ idade: 'crianca', pele: '#f3c9a6', penteado: 'lateral', corCabelo: '#c8562a', corOlhos: '#2f7fe0', roupa: 'camiseta', corRoupa: '#4aa3df', corCalca: '#3a4f9a', corSapato: '#ef5b52', pose: POSES.menino });
  b.position.set(1.85, 0, 0); b.rotation.y = ang; b.userData.expressao({ expressao: 'rindo' }); P.scene.add(b); blob(1.85, 0.1);
  P.luzes.chave.target.position.set(0, 2, 0); P.scene.add(P.luzes.chave.target);
  P.camera.position.set(0, 3.1, 14.0); P.camera.lookAt(0, 3.05, 0);
  window.alturas = [a, b].map((o) => { const bx = new THREE.Box3().setFromObject(o.userData.cabecaGrupo); const t = new THREE.Box3().setFromObject(o); return [(t.max.y - t.min.y).toFixed(2), ((bx.max.y - bx.min.y) / (t.max.y - t.min.y)).toFixed(3)]; });
}
const teste = q.get('test') || 'rosto';
if (teste === 'corpo') testeCorpo(q.get('vista') || 'frente');
if (teste === 'anim') { testeCorpo(); P.scene.children.filter((o) => o.userData && o.userData.animar).forEach((o, i) => o.userData.animar(parseFloat(q.get('t') || '0.3'), { acenar: i === 0, palmas: i === 1, pose: i === 0 ? POSES.menina : POSES.menino })); }
if (teste === 'palmas') { testeCorpo(); const b = P.scene.children.filter((o) => o.userData && o.userData.animar); b.forEach((o) => o.userData.animar(parseFloat(q.get('t') || '0'), { palmas: true, balancar: false })); P.camera.position.set(1.85, 3.3, 7.5); P.camera.lookAt(1.85, 3.0, 0); }
if (teste === 'andar') { testeCorpo(); P.scene.children.filter((o) => o.userData && o.userData.pose).forEach((o, i) => { o.userData.pose({ passo: parseFloat(q.get('f') || '1.2') + i }); o.rotation.y = 0.9; }); }
if (teste === 'elenco') {
  P.scene.background = fundo('#a9dcff', '#fff0d6'); chao();
  const lista = [['professora', -4.2, POSES.menina], ['abraao', 0, {}], ['sara', 4.2, POSES.colo]];
  for (const [n, x, ps] of lista) { const c = createCharacter({ ...ELENCO[n], pose: ps }); c.position.x = x; c.rotation.y = -x * 0.05; c.userData.expressao({ expressao: 'feliz' }); P.scene.add(c); blob(x, 0.1, 1.6); }
  P.camera.position.set(0, 5.6, 26); P.camera.lookAt(0, 5.2, 0); P.luzes.chave.target.position.set(0, 4, 0); P.scene.add(P.luzes.chave.target);
}
if (teste === 'braco') { testeCorpo(); P.camera.position.set(3.2, 2.6, 4.2); P.camera.lookAt(2.8, 2.2, 0); }
if (teste === 'rosto') testeRosto();
if (teste === 'model') { P.scene.background = fundo('#cfe8ff', '#fff4e4'); folhaDeModelo(P, { semente: parseInt(q.get('seed') || '7', 10), interativo: !q.has('render') }); }
if (teste === 'close') testeClose();
P.render();
window.pronto = true;
if (window.alturas) console.log('alturas', JSON.stringify(window.alturas));
