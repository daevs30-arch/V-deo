// Roupas: cores chapadas e saturadas. roupa: 'camiseta' | 'polo' | 'vestido' | 'macacao'
import * as THREE from 'three';
import { V, tubo } from './face.js';
import { matRoupa, matSimples } from './materials.js';

// Perfil do tronco rechonchudo (raio, altura a partir do quadril). Barriga levemente redonda.
export function perfilTronco(T) {
  const k = T.alturaTronco;
  // barriga redonda e baixa, ombros caídos e arredondados
  return [[0.001, -0.14], [0.62, -0.1], [0.86, 0.1 * k], [0.95, 0.32 * k], [0.93, 0.55 * k], [0.84, 0.76 * k], [0.7, 0.92 * k], [0.45, 1.01 * k], [0.001, 1.04 * k]]
    .map(([r, y]) => new THREE.Vector2(r * T.largura, y));
}

export function criarRoupa(T, { roupa = 'camiseta', corRoupa = '#4aa3df', corCalca = '#3a4f9a', menina = false }) {
  const g = new THREE.Group(), mR = matRoupa(corRoupa), mC = matRoupa(corCalca);
  const lathe = (pts, mat, seg = 96) => {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, seg), mat);
    m.scale.z = 0.88; m.castShadow = m.receiveShadow = true; return m;
  };
  // tronco (camiseta/polo/vestido/macacão por cima)
  const tronco = lathe(perfilTronco(T), roupa === 'macacao' ? matRoupa(corRoupa) : mR);
  g.add(tronco);
  const cintura = 0.18 * T.alturaTronco;
  if (roupa === 'vestido') {
    // saia rodada até perto do joelho
    // pontos de baixo para cima (normais para fora)
    const saia = [[0.001, -0.7], [1.12, -0.7], [1.16, -0.64], [1.06, -0.35], [0.96, cintura - 0.1], [0.9, cintura + 0.25]].map(([r, y]) => new THREE.Vector2(r * T.largura, y));
    g.add(lathe(saia, mR));
    const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.87 * T.largura, 0.06, 16, 96), matSimples('#ffffff', 0.7));
    faixa.rotation.x = Math.PI / 2; faixa.scale.y = 0.88; faixa.position.y = cintura + 0.22; g.add(faixa);
  } else {
    // bermuda/calça: pelve arredondada na cor da calça
    const pelve = [[0.001, -0.42], [0.66, -0.4], [0.84, -0.15], [0.86, cintura], [0.001, cintura]].map(([r, y]) => new THREE.Vector2(r * T.largura, y));
    g.add(lathe(pelve, mC));
  }
  if (roupa === 'polo') { // golinha
    for (const l of [-1, 1]) {
      const gola = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), matRoupa(new THREE.Color(corRoupa).lerp(new THREE.Color('#fff'), 0.6)));
      gola.scale.set(1.1, 0.35, 0.8); gola.position.set(l * 0.17, T.alturaTronco * 1.0, 0.36); gola.rotation.set(0.5, 0, l * 0.5); g.add(gola);
    }
    for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), matSimples('#ffffff', 0.4)); b.position.set(0, T.alturaTronco * (0.86 - i * 0.12), 0.64); g.add(b); }
  }
  if (roupa === 'macacao') { // peitilho e alças na cor da calça
    const peito = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, -0.6, 1.2, Math.PI * 0.32, Math.PI * 0.4), mC);
    peito.scale.set(0.89 * T.largura, T.alturaTronco * 0.9, 0.74 * T.largura); peito.position.y = T.alturaTronco * 0.35; peito.rotation.y = 0; g.add(peito);
    for (const l of [-1, 1]) {
      g.add(new THREE.Mesh(tubo([V(l * 0.3, T.alturaTronco * 0.62, 0.66), V(l * 0.34, T.alturaTronco * 0.92, 0.42), V(l * 0.36, T.alturaTronco * 1.0, 0), V(l * 0.3, T.alturaTronco * 0.75, -0.66)], 0.07, 0.07, { achatar: 0.4 }), mC));
      const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), matSimples('#ffd23a', 0.35)); bt.rotation.x = Math.PI / 2; bt.position.set(l * 0.3, T.alturaTronco * 0.62, 0.7); g.add(bt);
    }
  }
  return { grupo: g, matManga: mR, matCalca: mC, mangaLonga: false, perna: roupa === 'vestido' ? null : (roupa === 'macacao' ? 'longa' : 'curta') };
}
