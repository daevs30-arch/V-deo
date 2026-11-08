// createCharacter(params): personagem de "massinha" com esqueleto.
//
// 1) O corpo (pescoço, tronco, ombros, braços, mãos-luva, pernas) é UMA malha lisa gerada por
//    SDF com união suave (MarchingCubes) na pose de descanso. As roupas são "cascas" da mesma SDF.
// 2) Essa malha vira um SkinnedMesh preso a um esqueleto hierárquico:
//      raiz → quadril → coluna → peito → pescoço → cabeça
//                              peito → ombro → cotovelo → mão        (E/D)
//             quadril → coxa → joelho → tornozelo                     (E/D)
//    Os pesos de pele são calculados automaticamente: cada vértice pertence à "peça" da SDF
//    mais próxima (tronco, braço, perna...) e cada peça sabe a que ossos pertence.
// 3) Poses e animações só giram ossos: tempo real, sem refazer a malha.
import * as THREE from 'three';
import { criarCabeca } from './face.js';
import { criarCabelo } from './hair.js';
import { matPele, matRoupa, matSimples } from './materials.js';
import { smin, smax, sdEsfera, sdElipsoide, sdCapsula, sdElipsoideBase, malhaSDF } from './sdf.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// ---------- proporções por idade (unidade: 1 cabeça = 2.0) ----------
// criança: cabeça 1 | tronco 0.9 | pernas 1.1 (3 cabeças). bebê: mais curto e fofo. adulto: ~5 cabeças.
const PROP = {
  bebe: { pernas: 1.5, tronco: 1.6, cabeca: 0.95, troncoR: [0.78, 0.82, 0.66], barriga: 0.56, pelve: [0.82, 0.5, 0.64], quadrilX: 0.42, rPerna: 0.38,
    ombro: [0.56, 0.66], braco: [0.46, 0.4], rBraco: [0.23, 0.21, 0.19], pescoco: 0.31, pe: 0.9 },
  crianca: { pernas: 2.2, tronco: 1.8, cabeca: 0.9, troncoR: [0.7, 0.98, 0.6], barriga: 0.5, pelve: [0.8, 0.55, 0.62], quadrilX: 0.45, rPerna: 0.385,
    ombro: [0.62, 0.72], braco: [0.6, 0.52], rBraco: [0.225, 0.205, 0.185], pescoco: 0.33, pe: 1 },
  adulto: { pernas: 4.4, tronco: 3.3, cabeca: 0.84, troncoR: [0.9, 1.75, 0.6], barriga: 0.0, pelve: [0.86, 0.75, 0.6], quadrilX: 0.42, rPerna: 0.32,
    ombro: [0.86, 0.8], braco: [1.3, 1.15], rBraco: [0.2, 0.17, 0.15], pescoco: 0.27, pe: 1.15 },
};

// ---------- articulações na pose de descanso ----------
function juntas(pr) {
  const J = {};
  J.yQuadril = pr.pernas; J.yPescoco = pr.pernas + pr.tronco;
  J.pelve = V(0, J.yQuadril + 0.12, 0);
  J.tronco = V(0, J.yQuadril + pr.tronco * 0.47, 0);
  J.peito = V(0, J.yQuadril + pr.tronco * pr.ombro[1], 0);
  J.pescoco = V(0, J.yPescoco - 0.1, 0);
  J.cabeca = V(0, J.yPescoco + 0.55, 0);
  for (const l of [-1, 1]) {
    const S = V(l * pr.ombro[0], J.peito.y, 0);
    const abre = 0.32, frente = 0.06, dobra = 0.26; // braços soltos, cotovelo ~15°
    const d1 = V(l * Math.sin(abre), -Math.cos(abre), 0).applyAxisAngle(V(1, 0, 0), -frente).normalize();
    const E = S.clone().addScaledVector(d1, pr.braco[0]);
    const d2 = d1.clone().applyAxisAngle(V(1, 0, 0).applyAxisAngle(V(0, 0, 1), l * abre), -dobra).normalize();
    const W = E.clone().addScaledVector(d2, pr.braco[1]);
    J[l < 0 ? 'bracoE' : 'bracoD'] = { S, E, W, d2 };
    const Hq = V(l * pr.quadrilX, J.yQuadril, 0), A = V(l * (pr.quadrilX + 0.02), pr.rPerna + 0.04, 0);
    const K = Hq.clone().lerp(A, 0.5).add(V(0, 0, 0.03));
    J[l < 0 ? 'pernaE' : 'pernaD'] = { H: Hq, K, A };
  }
  return J;
}

// projeção de p no segmento ab: t ∈ [0,1]
function proj(p, a, b) { const ab = b.clone().sub(a); return clamp01(p.clone().sub(a).dot(ab) / ab.lengthSq()); }

// ---------- peças da SDF do corpo (cada uma sabe seus ossos) ----------
function pecasCorpo(pr, J, { bracos = true, grossura = 1 } = {}) {
  const P = [];
  const k = (d) => d;
  // tronco em ovo (levemente mais largo embaixo)
  const ovo = (() => {
    const c = J.tronco, e = sdElipsoide(c, V(...pr.troncoR));
    return (x, y, z) => { const s = 1 + 0.05 * Math.max(-1, Math.min(1, (c.y - y) / pr.troncoR[1])); return e(c.x + (x - c.x) / s, y, c.z + (z - c.z) / s) * s; };
  })();
  const ossosTronco = (p) => {
    const t = (p.y - J.yQuadril) / pr.tronco;
    const q = clamp01(1 - t / 0.35), pe = clamp01((t - 0.5) / 0.3);
    return [['quadril', q], ['coluna', Math.max(0, 1 - q - pe)], ['peito', pe]];
  };
  P.push({ sdf: ovo, ossos: ossosTronco, k: 0.3 });
  if (pr.barriga > 0) P.push({ sdf: sdEsfera(V(0, J.tronco.y - 0.3, 0.12), pr.barriga), ossos: ossosTronco, k: 0.3 });
  P.push({ sdf: sdElipsoide(J.pelve, V(...pr.pelve)), ossos: () => [['quadril', 1]], k: 0.3 });
  for (const l of [-1, 1]) P.push({ sdf: sdEsfera(V(l * pr.ombro[0] * 0.78, J.peito.y + 0.04, 0), 0.3), ossos: () => [['peito', 1]], k: 0.3 });
  P.push({ sdf: sdCapsula(V(0, J.yPescoco - 0.45, -0.04), V(0, J.yPescoco + 0.6, -0.08), pr.pescoco, pr.pescoco - 0.02),
    ossos: (p) => { const t = clamp01((p.y - (J.yPescoco + 0.25)) / 0.3); return [['pescoco', 1 - t], ['cabeca', t]]; }, k: 0.3 });
  // pernas: coxa → canela, curva suave no joelho
  for (const l of [-1, 1]) {
    const n = l < 0 ? 'E' : 'D', g = J['perna' + n], R = pr.rPerna;
    const topo = g.H.clone().add(V(0, 0.25, 0));
    const ossos = (p) => {
      if (p.y > g.H.y) { const t = clamp01((p.y - g.H.y) / 0.3); return [['coxa' + n, 1 - t], ['quadril', t]]; }
      const t1 = proj(p, g.H, g.K), t2 = proj(p, g.K, g.A);
      if (p.y > g.K.y) { const b = clamp01((t1 - 0.8) / 0.2) * 0.5; return [['coxa' + n, 1 - b], ['joelho' + n, b]]; }
      const b = clamp01((0.2 - t2) / 0.2) * 0.5; return [['joelho' + n, 1 - b], ['coxa' + n, b]];
    };
    P.push({ sdf: sdCapsula(topo, g.H, R * 1.05, R * 1.04), ossos, k: 0.16 });
    P.push({ sdf: sdCapsula(g.H, g.K, R * 1.04, R * 0.95), ossos, k: 0.16 });
    P.push({ sdf: sdCapsula(g.K, g.A, R * 0.95, R * 0.86), ossos, k: 0.16 });
  }
  // braços + mão-luva (palma achatada virada para o corpo + polegar)
  if (bracos) for (const l of [-1, 1]) {
    const n = l < 0 ? 'E' : 'D', b = J['braco' + n], r = pr.rBraco;
    const ossosBraco = (p) => {
      const t1 = proj(p, b.S, b.E), t2 = proj(p, b.E, b.W);
      if (p.distanceTo(b.S.clone().lerp(b.E, t1)) <= p.distanceTo(b.E.clone().lerp(b.W, t2))) {
        const om = clamp01((0.25 - t1) / 0.25) * 0.4, co = clamp01((t1 - 0.8) / 0.2) * 0.5;
        return [['ombro' + n, 1 - om - co], ['peito', om], ['cotovelo' + n, co]];
      }
      const co = clamp01((0.2 - t2) / 0.2) * 0.5; return [['cotovelo' + n, 1 - co], ['ombro' + n, co]];
    };
    P.push({ sdf: sdCapsula(b.S, b.E, r[0] * grossura, r[1] * grossura), ossos: ossosBraco, k: 0.07 });
    P.push({ sdf: sdCapsula(b.E, b.W, r[1], r[2]), ossos: ossosBraco, k: 0.07 });
    const ey = b.d2.clone().negate(), ez = V(0, 0, 1).sub(b.d2.clone().multiplyScalar(b.d2.z)).normalize(), ex = ey.clone().cross(ez).normalize();
    const s = r[0] / 0.225, palma = b.W.clone().addScaledVector(b.d2, 0.22 * s);
    const pol0 = palma.clone().addScaledVector(ez, 0.14 * s).addScaledVector(b.d2, -0.05 * s);
    const ossosMao = () => [['mao' + n, 1]];
    P.push({ sdf: sdElipsoideBase(palma, V(0.15 * s, 0.24 * s, 0.22 * s), ex, ey, ez), ossos: ossosMao, k: 0.07 });
    P.push({ sdf: sdCapsula(pol0, pol0.clone().addScaledVector(ez, 0.07 * s).addScaledVector(b.d2, 0.11 * s), 0.08 * s, 0.072 * s), ossos: ossosMao, k: 0.05 });
  }
  return P;
}
const sdfDe = (pecas) => (x, y, z) => { let d = pecas[0].sdf(x, y, z); for (let i = 1; i < pecas.length; i++) d = smin(d, pecas[i].sdf(x, y, z), pecas[i].k); return d; };

// ---------- esqueleto ----------
function criarEsqueleto(J) {
  const ossos = {}, lista = [];
  const osso = (nome, pai, posMundo) => {
    const b = new THREE.Bone(); b.name = nome; b.userData.mundo = posMundo.clone();
    b.position.copy(pai ? posMundo.clone().sub(pai.userData.mundo) : posMundo);
    if (pai) pai.add(b); ossos[nome] = b; lista.push(b); return b;
  };
  const raiz = osso('raiz', null, V(0, 0, 0));
  const quadril = osso('quadril', raiz, J.pelve);
  const coluna = osso('coluna', quadril, J.tronco);
  const peito = osso('peito', coluna, J.peito);
  const pescoco = osso('pescoco', peito, J.pescoco);
  osso('cabeca', pescoco, J.cabeca);
  for (const n of ['E', 'D']) {
    const b = J['braco' + n], g = J['perna' + n];
    const om = osso('ombro' + n, peito, b.S); const co = osso('cotovelo' + n, om, b.E); osso('mao' + n, co, b.W);
    const cx = osso('coxa' + n, quadril, g.H); const jo = osso('joelho' + n, cx, g.K); osso('tornozelo' + n, jo, g.A);
  }
  return { ossos, lista, raiz, esqueleto: new THREE.Skeleton(lista) };
}

// pesos automáticos: peça(s) mais próxima(s) da SDF → ossos
function pesar(geo, pecas, idx) {
  const pos = geo.attributes.position, n = pos.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(pos, i);
    const d = pecas.map((c) => c.sdf(p.x, p.y, p.z)), dmin = Math.min(...d);
    const acc = new Map();
    pecas.forEach((c, j) => {
      const w = Math.exp(-(d[j] - dmin) / 0.035); if (w < 0.02) return;
      for (const [nome, bw] of c.ossos(p)) if (bw > 0) acc.set(nome, (acc.get(nome) || 0) + w * bw);
    });
    const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), soma = top.reduce((s, x) => s + x[1], 0) || 1;
    top.forEach(([nome, w], k) => { si[i * 4 + k] = idx[nome]; sw[i * 4 + k] = w / soma; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
}

// ---------- roupas (cascas da SDF do corpo sem braços) ----------
function sdfCamiseta(pr, J, tronco, cintura) {
  const mangas = ['E', 'D'].map((n) => { const b = J['braco' + n], c = b.S.clone().lerp(b.E, 0.3);
    return { bufa: sdEsfera(c, pr.rBraco[0] * 1.5), braco: sdCapsula(b.S, b.S.clone().lerp(b.E, 0.42), pr.rBraco[0] * 1.33, pr.rBraco[0] * 1.25) }; });
  const gola = sdEsfera(V(0, J.yPescoco + 0.22, 0.05), pr.pescoco + 0.11);
  return (x, y, z) => {
    let d = tronco(x, y, z) - 0.07;
    d = smax(d, smax(cintura - y, y - (J.yPescoco + 0.05), 0.1), 0.1);
    for (const m of mangas) d = smin(d, smin(m.braco(x, y, z), m.bufa(x, y, z), 0.15), 0.18);
    return smax(d, -gola(x, y, z), 0.08);
  };
}
function sdfCalca(pr, J, tronco, yBarra) {
  return (x, y, z) => smax(tronco(x, y, z) - 0.075, smax(yBarra - y, y - (J.yQuadril + 0.5), 0.12), 0.1);
}
function sdfPeitilho(pr, J, tronco) { // macacão: peitilho na frente
  return (x, y, z) => smax(smax(tronco(x, y, z) - 0.1, smax(J.yQuadril + 0.2 - y, y - (J.yQuadril + pr.tronco * 0.62), 0.08), 0.08),
    smax(0.05 - z, Math.abs(x) - pr.troncoR[0] * 0.62, 0.08), 0.08);
}
function criarSaia(pr, J, cor, longa = false) {
  // longa = túnica até os tornozelos (mais reta); senão saia em sino até o joelho
  const yTopo = J.yQuadril + 0.62, yBase = longa ? pr.rPerna * 0.9 : J.yQuadril * 0.57, w = pr.troncoR[0] / 0.7;
  const r0 = longa ? 1.12 : 1.32, rr = longa ? 0.34 : 0.56;
  const pts = [new THREE.Vector2((r0 + 0.04) * w, yBase - 0.02)];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2((r0 - rr * Math.pow(t, 1.6) + 0.05 * Math.sin(t * Math.PI)) * w, THREE.MathUtils.lerp(yBase, yTopo, t))); }
  const g = new THREE.LatheGeometry(pts, 128); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, side: THREE.DoubleSide, flatShading: false }));
  m.scale.z = 0.86; m.position.y = -J.pelve.y; return m; // preso ao osso do quadril
}
function criarCapa(pr, J, cor) {
  const w = pr.troncoR[0] / 0.7, y0 = pr.rPerna * 0.8, y1 = J.peito.y + 0.2, pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2((1.22 - 0.42 * Math.pow(t, 1.3)) * w + (t > 0.85 ? -(t - 0.85) * 2.2 : 0), THREE.MathUtils.lerp(y0, y1, t))); }
  const g = new THREE.LatheGeometry(pts, 128, Math.PI * 0.2, Math.PI * 1.6); g.computeVertexNormals(); // abertura na frente
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.85, side: THREE.DoubleSide }));
  m.scale.z = 0.9; m.position.y = -J.tronco.y; return m; // preso à coluna
}
function criarCajado(J) {
  const g = new THREE.Group(), mat = matSimples('#7a4c26', 0.75), alt = J.yPescoco + 1.8;
  const vara = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, alt, 8, 16), mat); vara.position.y = alt * 0.5 - J.yQuadril * 0.62; g.add(vara);
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 12, 32, Math.PI * 1.15), mat);
  gancho.position.set(-0.28, vara.position.y + alt / 2, 0); g.add(gancho);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g;
}
function criarBebeColo() {
  const g = new THREE.Group();
  const manta = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), matRoupa('#f6eedc')); manta.scale.set(0.95, 0.5, 0.55); g.add(manta);
  const dobra = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 16, 48), matRoupa('#efe3c8')); dobra.position.set(-0.55, 0.12, 0.05); dobra.rotation.y = Math.PI / 2; g.add(dobra);
  const cab = criarCabeca({ idade: 'bebe', pele: '#f2c7a8', corOlhos: '#5a3418', semPescoco: true }); cab.userData.rosto({ expressao: 'feliz', piscar: 1 });
  cab.scale.setScalar(0.42); cab.position.set(-0.6, 0.2, 0.2); cab.rotation.set(0, 0.5, 0.35); g.add(cab);
  g.userData.rosto = cab.userData.rosto;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g;
}
function criarTenis(cor, escala) {
  const g = new THREE.Group(); g.scale.setScalar(escala);
  const ps = [[cor, [0.4, 0.3, 0.6], [0, 0.24, 0.16]], ['#ffffff', [0.44, 0.12, 0.66], [0, 0.1, 0.17]], ['#ffffff', [0.3, 0.2, 0.22], [0, 0.2, 0.55]],
    [new THREE.Color(cor).lerp(new THREE.Color('#fff'), 0.35), [0.24, 0.12, 0.22], [0, 0.46, 0.22]]];
  for (const [c, s, p] of ps) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 40), matSimples(c, 0.6)); m.scale.set(...s); m.position.set(...p); m.castShadow = m.receiveShadow = true; g.add(m); }
  return g;
}
function criarGolaPolo(cor) {
  const g = new THREE.Group(), m = matRoupa(new THREE.Color(cor).lerp(new THREE.Color('#fff'), 0.55));
  for (const l of [-1, 1]) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 24), m); a.scale.set(1.1, 0.32, 0.75); a.position.set(l * 0.17, 0.02, 0.3); a.rotation.set(0.55, 0, l * 0.5); g.add(a); }
  for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), matSimples('#ffffff', 0.4)); b.position.set(0, -0.22 - i * 0.16, 0.56); g.add(b); }
  return g;
}

// ---------- montagem ----------
export function createCharacter(params = {}) {
  const idade = params.idade || 'crianca', pr = PROP[idade], J = juntas(pr);
  const roupa = params.roupa || 'camiseta', res = params.res || 104;
  const personagem = new THREE.Group();
  const { ossos, raiz, esqueleto, lista } = criarEsqueleto(J);
  const idx = Object.fromEntries(lista.map((b, i) => [b.name, i]));
  personagem.add(raiz);
  personagem.updateMatrixWorld(true); // matrizes dos ossos prontas antes do bind (pose de descanso)

  const pecas = pecasCorpo(pr, J), pecasT = pecasCorpo(pr, J, { bracos: false });
  // pesos da camiseta: tronco → ossos do tronco; só as peças da manga → ombro (sem "teia" no sovaco)
  const pecasManga = [...pecasT];
  for (const n of ['E', 'D']) {
    const b = J['braco' + n], ossos = (p) => { const t = proj(p, b.S, b.E); const pe = clamp01((0.18 - t) / 0.18) * 0.5; return [['ombro' + n, 1 - pe], ['peito', pe]]; };
    pecasManga.push({ sdf: sdCapsula(b.S, b.S.clone().lerp(b.E, 0.42), pr.rBraco[0] * 1.33, pr.rBraco[0] * 1.25), ossos, k: 0.1 });
    pecasManga.push({ sdf: sdEsfera(b.S.clone().lerp(b.E, 0.3), pr.rBraco[0] * 1.5), ossos, k: 0.1 });
  }
  const corpo = sdfDe(pecas), tronco = sdfDe(pecasT);
  const altura = J.yPescoco + 0.7, caixa = (y0, y1, ex, ez) => [V(0, (y0 + y1) / 2, 0), V(ex, (y1 - y0) / 2, ez)];
  const pele = (sdf, [c, e], r, mat, pec = pecas) => {
    const g = malhaSDF(sdf, c, e, r); pesar(g, pec, idx);
    const m = new THREE.SkinnedMesh(g, mat); m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
    m.bind(esqueleto); personagem.add(m); return m;
  };
  const larg = pr.ombro[0] + pr.braco[0] + 0.6;
  pele(corpo, caixa(-0.1, altura, larg, 1.3), res, matPele(params.pele || '#f2c09c'));
  const corRoupa = params.corRoupa || '#4aa3df', corCalca = params.corCalca || '#3a4f9a';
  const vestidoLongo = roupa === 'vestido' || roupa === 'tunica';
  const cintura = vestidoLongo ? J.yQuadril + 0.05 : J.yQuadril + 0.3;
  pele(sdfCamiseta(pr, J, tronco, cintura), caixa(J.yQuadril - 0.2, J.yPescoco + 0.4, pr.ombro[0] + 0.9, 1.3), res, matRoupa(corRoupa), pecasManga); // a manga acompanha o ombro
  if (vestidoLongo) {
    ossos.quadril.add(criarSaia(pr, J, corRoupa, roupa === 'tunica' || !!params.saiaLonga));
    if (params.capa) ossos.coluna.add(criarCapa(pr, J, params.capa));
  } else {
    const longa = roupa === 'macacao' || !!params.calcaLonga, yBarra = longa ? pr.rPerna + 0.25 : J.yQuadril * 0.65;
    pele(sdfCalca(pr, J, tronco, yBarra), caixa(yBarra - 0.2, J.yQuadril + 0.7, pr.quadrilX + 0.9, 1.3), Math.round(res * 0.9), matRoupa(corCalca), pecasT);
    if (roupa === 'macacao') {
      pele(sdfPeitilho(pr, J, tronco), caixa(J.yQuadril, J.yQuadril + pr.tronco * 0.7, pr.troncoR[0] + 0.3, 1.3), Math.round(res * 0.8), matRoupa(corCalca), pecasT);
      for (const l of [-1, 1]) { // alças
        const pts = [V(l * 0.32, J.yQuadril + pr.tronco * 0.6, pr.troncoR[2] * 0.95), V(l * 0.36, J.peito.y + 0.15, pr.troncoR[2] * 0.6), V(l * 0.38, J.peito.y + 0.25, 0), V(l * 0.33, J.yQuadril + pr.tronco * 0.6, -pr.troncoR[2] * 0.95)];
        const alca = sdCapsula(pts[0], pts[1], 0.08, 0.08), a2 = sdCapsula(pts[1], pts[2], 0.08, 0.08), a3 = sdCapsula(pts[2], pts[3], 0.08, 0.08);
        const sd = (x, y, z) => smax(Math.min(alca(x, y, z), a2(x, y, z), a3(x, y, z)), -(tronco(x, y, z) - 0.09), 0.02);
        pele(sd, caixa(J.yQuadril, J.yPescoco, pr.troncoR[0] + 0.2, 1.0), 64, matRoupa(corCalca), pecasT);
      }
    }
  }
  if (roupa === 'polo') { const gp = criarGolaPolo(corRoupa); gp.position.copy(V(0, J.yPescoco - 0.08, 0).sub(J.peito)); ossos.peito.add(gp); }
  // tênis presos aos tornozelos
  for (const n of ['E', 'D']) { const t = criarTenis(params.corSapato || '#ef5b52', pr.pe); t.position.set(0, -pr.rPerna - 0.04, 0); ossos['tornozelo' + n].add(t); }
  // cabeça + cabelo presos ao osso da cabeça
  const rosto = criarCabeca({ ...params, idade, semPescoco: true });
  const cabelo = criarCabelo(rosto.userData.p, params);
  const cab = new THREE.Group(); cab.add(rosto, cabelo); cab.scale.setScalar(pr.cabeca);
  cab.position.set(0, J.yPescoco + 1.12 * (pr.cabeca / 0.9) - J.cabeca.y, 0.02);
  if (params.oculos) cab.add(criarOculos(rosto.userData.p, params.oculos));
  ossos.cabeca.add(cab);
  if (params.faixa) { // faixa na cintura (túnica)
    const f = new THREE.Mesh(new THREE.TorusGeometry(pr.troncoR[0] * 1.08, 0.1, 16, 96), matRoupa(params.faixa));
    f.rotation.x = Math.PI / 2; f.scale.y = 0.86; f.position.y = J.yQuadril + 0.55 - J.pelve.y; ossos.quadril.add(f);
  }
  let cajado = null, bebe = null;
  if (params.cajado) { cajado = criarCajado(J); cajado.position.copy(J.bracoD.d2.clone().multiplyScalar(0.22)); ossos.maoD.add(cajado); }
  if (params.bebe) { bebe = criarBebeColo(); bebe.position.set(0, -0.55, pr.troncoR[2] + 0.45); ossos.peito.add(bebe); }

  // ---------- pose (gira ossos) ----------
  const base = Object.fromEntries(lista.map((b) => [b.name, b.position.clone()]));
  function pose(P = {}) {
    for (const b of lista) { b.rotation.set(0, 0, 0); b.position.copy(base[b.name]); b.scale.set(1, 1, 1); }
    const apoio = P.apoio ?? 0, inc = 0.08 * apoio;
    ossos.quadril.position.x += 0.06 * apoio; ossos.quadril.rotation.z = inc + (P.balanco || 0);
    ossos.coluna.rotation.z = -inc * 0.6 - (P.balanco || 0) * 0.6;
    ossos.peito.scale.set(1 + (P.respira || 0) * 0.025, 1 + (P.respira || 0) * 0.02, 1 + (P.respira || 0) * 0.035);
    ossos.cabeca.rotation.set(P.cabecaFrente || 0, P.cabecaGira || 0, (P.cabecaInclina || 0) - (P.balanco || 0) * 0.3);
    for (const [n, l] of [['E', -1], ['D', 1]]) {
      // pernas: a de apoio fica vertical; a outra dobra o joelho e abre a ponta do pé
      const cx = ossos['coxa' + n], jo = ossos['joelho' + n], to = ossos['tornozelo' + n];
      const solta = apoio !== 0 && l !== apoio;
      cx.rotation.set(solta ? -0.32 : 0, solta ? l * 0.4 : 0, -ossos.quadril.rotation.z + (solta ? l * 0.12 : 0));
      jo.rotation.x = solta ? 0.55 : 0;
      if (P.passo != null) { // ciclo de caminhada: coxas alternadas, joelho dobra na passagem
        const f = P.passo + (l < 0 ? 0 : Math.PI);
        cx.rotation.set(-0.42 * Math.sin(f), 0, -ossos.quadril.rotation.z);
        jo.rotation.x = 0.7 * Math.max(0, Math.sin(f + Math.PI / 2)) * (Math.sin(f) < 0 ? 1 : 0.35);
      }
      to.rotation.set(-(cx.rotation.x + jo.rotation.x), 0, 0);
      // braços: valores relativos à pose de descanso (abre = levantar para o lado, frente, dobra)
      const b = { ...(P['braco' + n] || {}) };
      if (P.passo != null && !P['braco' + n]) b.frente = 0.3 * Math.sin(P.passo + (l < 0 ? Math.PI : 0)); // braços balançam ao andar
      ossos['ombro' + n].rotation.set(-(b.frente || 0), 0, l * (b.abre || 0));
      ossos['cotovelo' + n].rotation.set(-(b.dobra || 0), 0, l * (b.aceno || 0));
    }
    // apoia o pé mais baixo no chão
    raiz.position.y = 0; personagem.updateMatrixWorld(true);
    let min = Infinity; const w = new THREE.Vector3();
    for (const n of ['E', 'D']) { ossos['tornozelo' + n].getWorldPosition(w); personagem.worldToLocal(w); min = Math.min(min, w.y); }
    raiz.position.y = (pr.rPerna + 0.04) - min;
    if (P.passo != null) ossos.quadril.position.y += 0.05 * Math.abs(Math.cos(P.passo));
  }

  // ---------- animações ----------
  // opts: { bpm, balancar, acenar, palmas, fala(0..1), expressao }
  function animar(t, opts = {}) {
    const bpm = opts.bpm || 100, fase = (t * bpm / 60) % 1, bat = Math.sin(t * Math.PI * bpm / 60);
    const P = { ...(opts.pose || {}) };
    P.respira = Math.sin(t * 2 * Math.PI / 3.2);                      // respirar (~3 s)
    if (opts.balancar !== false) P.balanco = 0.045 * bat;              // balançar no ritmo
    if (opts.acenar) P.bracoD = { abre: 1.0, frente: 0.25, dobra: 0.1, aceno: 1.25 + 0.35 * Math.sin(t * 9) };
    if (opts.palmas) {                                                  // bater palmas no tempo
      const junta = Math.pow(Math.cos(fase * Math.PI), 8);
      for (const n of ['E', 'D']) P['braco' + n] = { frente: 0.62, abre: -0.36, dobra: 0.85, aceno: -(0.55 + 0.4 * junta) };
    }
    pose(P);
    // piscar automático (a cada ~3,5 s, irregular)
    const ciclo = (t + (params.semente || 0) * 0.77) % 3.7, piscar = ciclo < 0.16 ? Math.sin(ciclo / 0.16 * Math.PI) : 0;
    rosto.userData.rosto({ expressao: opts.expressao || 'feliz', piscar, visema: opts.visema || null, fala: opts.fala || 0 });
  }

  personagem.userData = { params, pose, animar, ossos, rosto, cabecaGrupo: cab, cajado, bebe, expressao: (e) => rosto.userData.rosto(e) };
  pose(params.pose || {});
  return personagem;
}

// óculos (acessório): armação arredondada na frente dos olhos
function criarOculos(p, cor = '#141011') {
  const g = new THREE.Group(), m = matSimples(cor, 0.35);
  for (const l of [-1, 1]) {
    // armação retangular arredondada
    const forma = new THREE.Shape(), a = p.olhoR * 1.32, b = p.olhoR * 1.05, r = 0.12;
    forma.moveTo(-a + r, -b); forma.lineTo(a - r, -b); forma.quadraticCurveTo(a, -b, a, -b + r); forma.lineTo(a, b - r); forma.quadraticCurveTo(a, b, a - r, b);
    forma.lineTo(-a + r, b); forma.quadraticCurveTo(-a, b, -a, b - r); forma.lineTo(-a, -b + r); forma.quadraticCurveTo(-a, -b, -a + r, -b);
    const pts3 = forma.getSpacedPoints(96).map((v) => new THREE.Vector3(v.x, v.y, 0));
    const aro = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3, true), 128, 0.045, 10, true), m);
    aro.position.set(l * p.olhoX, p.olhoY, p.rz * 1.02); aro.rotation.y = l * 0.12; g.add(aro);
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 12), m);
    haste.rotation.x = Math.PI / 2; haste.position.set(l * (p.olhoX + p.olhoR * 1.35), p.olhoY + 0.05, p.rz * 0.55); g.add(haste);
  }
  const ponte = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 12, 24, Math.PI), m); ponte.position.set(0, p.olhoY + 0.05, p.rz * 1.04); g.add(ponte);
  return g;
}

// poses prontas (cada criança diferente)
export const POSES = {
  colo: { bracoE: { frente: 0.75, abre: -0.3, dobra: 1.2, aceno: -0.5 }, bracoD: { frente: 0.6, abre: -0.32, dobra: 1.35, aceno: -0.55 }, cabecaFrente: 0.18, cabecaInclina: 0.12 },
  menina: { apoio: 1, cabecaInclina: 0.14, cabecaGira: 0.1, bracoE: { frente: 0.12, dobra: 0.15 }, bracoD: { abre: 0.02 } },
  menino: { apoio: -1, cabecaInclina: -0.14, cabecaGira: -0.12, bracoE: { abre: 0.02 }, bracoD: { frente: 0.15, dobra: 0.2 } },
};
