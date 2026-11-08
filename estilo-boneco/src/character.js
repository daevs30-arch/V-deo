// createCharacter(params): monta o personagem só com primitivas e um rig hierárquico simples:
//   personagem -> quadril -> tronco -> pescoço -> cabeça
//                         -> ombro -> cotovelo -> mão   (braços)
//              -> quadril -> coxa -> joelho -> pé      (pernas)
// Braços e pernas são UM tubo contínuo e afunilado que passa pelo cotovelo/joelho
// (curva suave), refeito a cada pose: nenhuma junta aparente.
import * as THREE from 'three';
import { V, tubo } from './face.js';
import { criarCabeca } from './face.js';
import { criarCabelo } from './hair.js';
import { criarRoupa } from './clothes.js';
import { matPele, matSimples } from './materials.js';

// proporções do corpo por idade (unidade = raio vertical da cabeça antes da escala)
const CORPO = {
  bebe: { cabeca: 0.95, largura: 1.15, alturaTronco: 1.4, coxa: 0.6, canela: 0.5, rPerna: [0.4, 0.31], braco: 0.55, antebraco: 0.48, rBraco: [0.26, 0.21], quadrilX: 0.4 },
  crianca: { cabeca: 0.92, largura: 1.12, alturaTronco: 1.62, coxa: 0.8, canela: 0.7, rPerna: [0.4, 0.31], braco: 0.66, antebraco: 0.58, rBraco: [0.26, 0.21], quadrilX: 0.42 },
  adulto: { cabeca: 0.78, largura: 0.92, alturaTronco: 2.7, coxa: 1.55, canela: 1.45, rPerna: [0.32, 0.22], braco: 1.15, antebraco: 1.0, rBraco: [0.2, 0.15], quadrilX: 0.36 },
};

// tubo afunilado rápido (para refazer a cada quadro), com leve "gordurinha" perto da raiz
function geoMembro(pontos, r0, r1) {
  const curva = new THREE.CatmullRomCurve3(pontos, false, 'centripetal');
  const seg = 40, rad = 24, g = new THREE.TubeGeometry(curva, seg, 1, rad, false);
  const pos = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curva.getPointAt(t);
    const r = THREE.MathUtils.lerp(r0, r1, t) * (1 + 0.08 * Math.sin(Math.PI * Math.min(1, t * 1.6)));
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
  }
  g.computeVertexNormals();
  return g;
}

// mão gordinha: palma redonda, dedos curtos e grossos, polegar para a frente
function criarMao(mPele, lado, escala) {
  // mão gordinha tipo "luvinha": palma cheia, 4 dedos curtos e grossos encostados, polegar redondo
  const m = new THREE.Group(); m.scale.setScalar(escala);
  const palma = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 28), mPele); palma.scale.set(0.78, 1.0, 1.05); palma.position.y = -0.12; m.add(palma);
  for (let i = 0; i < 4; i++) {
    const z = 0.105 - i * 0.07, d = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.04 + (i === 1 || i === 2 ? 0.025 : 0), 10, 24), mPele);
    d.position.set(-lado * 0.02, -0.3 - (i === 1 || i === 2 ? 0.012 : 0), z); d.rotation.set(0, 0, lado * 0.12); m.add(d);
  }
  const pol = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.04, 10, 24), mPele);
  pol.position.set(-lado * 0.03, -0.1, 0.17); pol.rotation.set(0.7, 0, 0); m.add(pol);
  m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return m;
}

// tênis arredondado com sola branca
function criarPe(cor, escala) {
  const p = new THREE.Group(); p.scale.setScalar(escala);
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.26, 12, 32), matSimples(cor, 0.6));
  corpo.rotation.x = Math.PI / 2; corpo.scale.set(1.05, 1, 0.85); corpo.position.set(0, -0.08, 0.12);
  const sola = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.28, 12, 32), matSimples('#ffffff', 0.7));
  sola.rotation.x = Math.PI / 2; sola.scale.set(1.08, 1, 0.32); sola.position.set(0, -0.2, 0.13);
  const bico = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), matSimples('#ffffff', 0.6)); bico.scale.set(1.2, 0.7, 0.8); bico.position.set(0, -0.1, 0.42);
  p.add(corpo, sola, bico); p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return p;
}

export function createCharacter(params = {}) {
  const idade = params.idade || 'crianca';
  const C = CORPO[idade];
  const T = { largura: C.largura, alturaTronco: C.alturaTronco };
  const mPele = matPele(params.pele || '#f2c09c');
  const personagem = new THREE.Group();

  // ---- hierarquia ----
  const quadril = new THREE.Group(); personagem.add(quadril);
  const tronco = new THREE.Group(); quadril.add(tronco);
  const pescoco = new THREE.Group(); pescoco.position.y = T.alturaTronco * 1.02; tronco.add(pescoco);
  const cabeca = new THREE.Group(); pescoco.add(cabeca);
  const rosto = criarCabeca({ ...params, idade });
  rosto.scale.setScalar(C.cabeca); rosto.position.y = 0.78 * C.cabeca;
  const cabelo = criarCabelo(rosto.userData.p, params); cabelo.scale.setScalar(C.cabeca); cabelo.position.copy(rosto.position);
  cabeca.add(rosto, cabelo);

  // roupa (tronco + saia/bermuda) e mangas/pernas da roupa
  const roupa = criarRoupa(T, { ...params, menina: !!params.menina });
  tronco.add(roupa.grupo);
  roupa.grupo.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // ---- membros contínuos ----
  const novoMembro = (mat) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.castShadow = m.receiveShadow = true; return m; };
  const bracos = [-1, 1].map((l) => {
    const pele = novoMembro(mPele), manga = novoMembro(roupa.matManga), mao = criarMao(mPele, l, idade === 'adulto' ? 1.25 : 1.3);
    tronco.add(pele, manga, mao); return { l, pele, manga, mao };
  });
  const pernas = [-1, 1].map((l) => {
    const pele = novoMembro(mPele), calca = roupa.perna ? novoMembro(roupa.matCalca) : null, pe = criarPe(params.corSapato || '#ef5b52', idade === 'adulto' ? 1.4 : 1.3);
    quadril.add(pele, pe); if (calca) quadril.add(calca); return { l, pele, calca, pe };
  });

  const X = V(1, 0, 0), Z = V(0, 0, 1), BAIXO = V(0, -1, 0);
  const alturaQuadril = C.coxa + C.canela + 0.22;

  // ---- pose ----
  // valores em radianos; todos opcionais
  function pose(P = {}) {
    const q = P.quadril || {}, t = P.tronco || {}, c = P.cabeca || {};
    quadril.position.set(q.x || 0, alturaQuadril + (q.y || 0), 0);
    quadril.rotation.set(q.frente || 0, q.gira || 0, q.inclina || 0);
    tronco.rotation.set(t.frente || 0, t.gira || 0, t.inclina || 0);
    tronco.scale.set(1 + (t.respira || 0) * 0.02, 1 + (t.respira || 0) * 0.015, 1 + (t.respira || 0) * 0.03);
    cabeca.rotation.set(c.frente || 0, c.gira || 0, c.inclina || 0);

    for (const b of bracos) {
      const a = P[b.l < 0 ? 'bracoE' : 'bracoD'] || {};
      const S = V(b.l * 0.8 * T.largura, T.alturaTronco * 0.82, 0); // ombro na borda do tronco
      const abre = (a.abre ?? 0.12) * b.l;
      const d1 = BAIXO.clone().applyAxisAngle(Z, abre).applyAxisAngle(X, -(a.frente || 0));
      const E = S.clone().addScaledVector(d1, C.braco);
      const eixo = X.clone().applyAxisAngle(Z, abre);
      const d2 = d1.clone().applyAxisAngle(eixo, -(a.cotovelo ?? 0.2)).applyAxisAngle(d1, (a.torce || 0) * b.l);
      const W = E.clone().addScaledVector(d2, C.antebraco);
      const pts = [S.clone().addScaledVector(d1, -0.25), S, S.clone().lerp(E, 0.55), E, E.clone().lerp(W, 0.5), W, W.clone().addScaledVector(d2, 0.14)]; // termina dentro da mão
      b.pele.geometry.dispose(); b.pele.geometry = geoMembro(pts, C.rBraco[0], C.rBraco[1]);
      b.manga.geometry.dispose(); b.manga.geometry = geoMembro([S.clone().addScaledVector(d1, -0.3), S, S.clone().addScaledVector(d1, C.braco * 0.42)], C.rBraco[0] * 1.45, C.rBraco[0] * 1.3);
      b.mao.position.copy(W);
      b.mao.quaternion.setFromUnitVectors(BAIXO, d2);
      if (a.mao === 'aberta') b.mao.rotateX(0.0);
    }
    for (const p of pernas) {
      const a = P[p.l < 0 ? 'pernaE' : 'pernaD'] || {};
      const H = V(p.l * C.quadrilX, 0, 0);
      const d1 = BAIXO.clone().applyAxisAngle(Z, (a.abre || 0) * p.l).applyAxisAngle(X, -(a.frente || 0));
      const K = H.clone().addScaledVector(d1, C.coxa);
      const d2 = d1.clone().applyAxisAngle(X, a.joelho || 0);
      const A = K.clone().addScaledVector(d2, C.canela);
      p.pele.geometry.dispose(); p.pele.geometry = geoMembro([H.clone().addScaledVector(d1, -0.3), H, H.clone().lerp(K, 0.5), K, K.clone().lerp(A, 0.5), A, A.clone().addScaledVector(d2, 0.12)], C.rPerna[0], C.rPerna[1]); // termina dentro do sapato
      if (p.calca) {
        const fim = roupa.perna === 'longa' ? A.clone().addScaledVector(d2, -0.12) : H.clone().lerp(K, 0.8);
        const pts = roupa.perna === 'longa' ? [H.clone().addScaledVector(d1, -0.3), H, H.clone().lerp(K, 0.5), K, K.clone().lerp(fim, 0.5), fim] : [H.clone().addScaledVector(d1, -0.3), H, fim];
        p.calca.geometry.dispose(); p.calca.geometry = geoMembro(pts, C.rPerna[0] * 1.3, C.rPerna[0] * (roupa.perna === 'longa' ? 1.15 : 1.25));
      }
      // pé fica plano no chão mesmo com o quadril inclinado
      p.pe.position.copy(A);
      p.pe.quaternion.copy(quadril.quaternion).invert();
      p.pe.rotateY((a.pontaFora || 0) * p.l);
    }
    // apoia o pé mais baixo no chão (contato com o chão)
    personagem.updateMatrixWorld(true);
    let minY = Infinity; const w = new THREE.Vector3();
    for (const p of pernas) { p.pe.getWorldPosition(w); minY = Math.min(minY, w.y - personagem.position.y); }
    quadril.position.y += 0.26 * (idade === 'adulto' ? 1.4 : 1.3) - minY;
  }

  personagem.userData = {
    params, quadril, tronco, cabeca, rosto, pose,
    altura: () => { const b = new THREE.Box3().setFromObject(personagem); return b.max.y - b.min.y; },
    expressao: (e) => rosto.userData.rosto(e),
  };
  pose({});
  return personagem;
}

// poses prontas
export const POSES = {
  relaxado: (lado = 1) => ({
    quadril: { inclina: 0.07 * lado, gira: -0.08 * lado },
    tronco: { inclina: -0.05 * lado },
    cabeca: { inclina: 0.14 * lado, gira: 0.12 * lado },
    [lado > 0 ? 'pernaD' : 'pernaE']: { abre: 0.04 },                                  // perna de apoio
    [lado > 0 ? 'pernaE' : 'pernaD']: { abre: 0.12, frente: 0.18, joelho: 0.32, pontaFora: 0.35 }, // perna relaxada
    [lado > 0 ? 'bracoD' : 'bracoE']: { abre: 0.3, frente: 0.05, cotovelo: 0.4 },        // braço solto
    [lado > 0 ? 'bracoE' : 'bracoD']: { abre: 0.2, frente: 0.3, cotovelo: 0.85 },        // mão um pouco à frente
  }),
};
