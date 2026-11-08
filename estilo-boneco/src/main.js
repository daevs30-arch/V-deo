// Página de teste. ?test=rosto -> cabeças e expressões (etapa 1: rosto)
import * as THREE from 'three';
import { criarPalco } from './lights.js';
import { criarCabeca, EXPRESSOES } from './face.js';
import { criarCabelo } from './hair.js';
import { matRoupa } from './materials.js';

const P = criarPalco(document.getElementById('c'));
const q = new URLSearchParams(location.search);

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
const teste = q.get('test') || 'rosto';
if (teste === 'rosto') testeRosto();
if (teste === 'close') testeClose();
P.render();
window.pronto = true;
