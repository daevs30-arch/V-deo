// createCharacter(params): personagem de "massinha".
// Proporção (altura total = 3 cabeças): cabeça 1 | tronco 0.9 | pernas 1.1.
// O corpo inteiro (pescoço, tronco em ovo, ombros, braços, mãos-luva e pernas) é UMA
// malha lisa gerada por SDF com união suave. As roupas são "cascas" do próprio corpo
// (a mesma SDF inflada ~4%) recortadas com bordas arredondadas. A saia é um sino (Lathe).
//
// Rig: as articulações (ombro → cotovelo → pulso, quadril → joelho → tornozelo, pescoço →
// cabeça) são calculadas por pose() e a malha é refeita a partir delas.
import * as THREE from 'three';
import { criarCabeca } from './face.js';
import { criarCabelo } from './hair.js';
import { matPele, matRoupa, matSimples } from './materials.js';
import { smin, smax, sdEsfera, sdElipsoide, sdCadeia, sdCapsula, sdElipsoideBase, malhaSDF } from './sdf.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const H = 2.0;                         // altura de uma "cabeça"
const Y_QUADRIL = 1.1 * H;             // pernas: 1.1 cabeça
const Y_PESCOCO = Y_QUADRIL + 0.9 * H; // tronco: 0.9 cabeça
const R_PERNA = 0.385;                 // diâmetro ≈ 35% da largura da cabeça (2.2)

// ---------- articulações a partir da pose ----------
function articulacoes(P) {
  const a = {};
  const apoio = P.apoio || 1;                       // perna que segura o peso (+1 direita da tela, -1 esquerda)
  const incl = 0.07 * apoio;                        // quadril sobe do lado do apoio
  a.pelve = V(0.07 * apoio, Y_QUADRIL + 0.12, 0);
  for (const l of [-1, 1]) {
    const quadril = V(a.pelve.x + l * 0.45, a.pelve.y - 0.12 + l * incl * 0.45, 0);
    const relaxada = l !== apoio;
    const tornoz = relaxada ? V(l * 0.62, 0.52, 0.18) : V(l * 0.42 + 0.05 * apoio, 0.42, 0);
    const joelho = quadril.clone().lerp(tornoz, 0.5).add(V(relaxada ? l * 0.06 : 0, 0, relaxada ? 0.2 : 0.05));
    a[l < 0 ? 'pernaE' : 'pernaD'] = { quadril, joelho, tornoz, relaxada };
  }
  // tronco (leve contra-inclinação) e pescoço
  a.tronco = V(-0.03 * apoio, Y_QUADRIL + 0.85, 0);
  a.pescoco = V(-0.06 * apoio, Y_PESCOCO - 0.05, 0);
  // braços: grossos e curtos, caindo relaxados e um pouco afastados do corpo
  for (const l of [-1, 1]) {
    const b = (P[l < 0 ? 'bracoE' : 'bracoD']) || {};
    const ombro = V(a.tronco.x + l * 0.62, Y_QUADRIL + 1.3, 0);   // ombro estreito e caído
    const abre = b.abre ?? 0.32, frente = b.frente ?? 0.08, dobra = b.dobra ?? 0.26; // cotovelo ~15°
    const d1 = V(l * Math.sin(abre), -Math.cos(abre), 0).applyAxisAngle(V(1, 0, 0), -frente).normalize();
    const cotovelo = ombro.clone().addScaledVector(d1, 0.6);
    const eixo = V(1, 0, 0).applyAxisAngle(V(0, 0, 1), l * abre);
    const d2 = d1.clone().applyAxisAngle(eixo, -dobra).normalize();
    const pulso = cotovelo.clone().addScaledVector(d2, 0.52);
    a[l < 0 ? 'bracoE' : 'bracoD'] = { ombro, cotovelo, pulso, d2, l };
  }
  a.cabeca = { inclina: P.cabecaInclina ?? 0.14 * apoio, gira: P.cabecaGira ?? 0 };
  return a;
}

// ---------- SDFs ----------
function sdfCorpo(a, { bracos = true } = {}) {
  const partes = [];
  // tronco em forma de ovo (mais largo embaixo) + barriguinha + ombros arredondados
  const ovo = (() => {
    const c = a.tronco;
    const e = sdElipsoide(c, V(0.7, 0.98, 0.6)); // com a casca da roupa: ~70% da largura da cabeça
    return (x, y, z) => { const s = 1 + 0.05 * Math.max(-1, Math.min(1, (c.y - y) / 0.98)); return e(c.x + (x - c.x) / s, y, c.z + (z - c.z) / s) * s; };
  })();
  partes.push(ovo);
  partes.push(sdEsfera(V(a.tronco.x, a.tronco.y - 0.3, 0.12), 0.5));                         // leve curva da barriga
  partes.push(sdElipsoide(a.pelve, V(0.8, 0.55, 0.62)));                                       // quadril (encaixa as pernas)
  for (const l of [-1, 1]) partes.push(sdEsfera(V(a.tronco.x + l * 0.48, Y_QUADRIL + 1.34, 0), 0.3)); // ombros estreitos e caídos
  partes.push(sdCapsula(V(a.pescoco.x * 0.5, Y_PESCOCO - 0.45, -0.04), V(a.pescoco.x, Y_PESCOCO + 0.6, -0.08), 0.33, 0.31)); // pescoço curto
  // pernas curtas e grossas
  for (const k of ['pernaE', 'pernaD']) {
    const p = a[k];
    partes.push(sdCadeia([p.quadril.clone().add(V(0, 0.25, 0)), p.quadril, p.joelho, p.tornoz], [R_PERNA * 1.05, R_PERNA * 1.04, R_PERNA * 0.95, R_PERNA * 0.86], 0.2));
  }
  // braços + mão-luva (palma arredondada + polegar), tudo na mesma malha
  for (const k of (bracos ? ['bracoE', 'bracoD'] : [])) {
    const b = a[k];
    partes.push(sdCadeia([b.ombro, b.cotovelo, b.pulso], [0.225, 0.205, 0.185], 0.15));
    const ey = b.d2.clone().negate(), ez = V(0, 0, 1).sub(b.d2.clone().multiplyScalar(b.d2.z)).normalize(), ex = ey.clone().cross(ez).normalize();
    const palma = b.pulso.clone().addScaledVector(b.d2, 0.22);
    partes.push(sdElipsoideBase(palma, V(0.15, 0.24, 0.22), ex, ey, ez)); // palma achatada virada para o corpo
    const polegar0 = palma.clone().addScaledVector(ez, 0.14).addScaledVector(b.d2, -0.05);
    partes.push(sdCapsula(polegar0, polegar0.clone().addScaledVector(ez, 0.07).addScaledVector(b.d2, 0.11), 0.08, 0.072));
  }
  return (x, y, z) => {
    let d = partes[0](x, y, z);
    for (let i = 1; i < partes.length; i++) {
      const k = i <= 5 ? 0.32 : (i <= 7 ? 0.16 : 0.07); // tronco macio; pernas 0.16; braços quase sem "teia" com o corpo
      d = smin(d, partes[i](x, y, z), k);
    }
    return d;
  };
}

// camiseta: casca do tronco + mangas curtas bufantes; recortes com bordas arredondadas
function sdfCamiseta(a, corpo, { cintura }) {
  // corpo = SDF do corpo sem braços; a manga é uma cápsula curta e bufante no alto do braço
  const mangas = ['bracoE', 'bracoD'].map((k) => {
    const b = a[k], c = b.ombro.clone().lerp(b.cotovelo, 0.3);
    return { bufa: sdEsfera(c, 0.34), braco: sdCapsula(b.ombro, b.ombro.clone().lerp(b.cotovelo, 0.42), 0.3, 0.28) };
  });
  const gola = sdEsfera(V(a.pescoco.x, Y_PESCOCO + 0.22, 0.05), 0.44);
  return (x, y, z) => {
    let d = corpo(x, y, z) - 0.07;                                     // casca: corpo inflado (~4%)
    d = smax(d, smax(cintura - y, y - (Y_PESCOCO + 0.05), 0.1), 0.1);  // barra arredondada; gola abaixo do queixo
    for (const m of mangas) d = smin(d, smin(m.braco(x, y, z), m.bufa(x, y, z), 0.15), 0.18); // manga curta bufante
    d = smax(d, -gola(x, y, z), 0.08);                                 // decote redondo
    return d;
  };
}

// short: casca do quadril e do alto das coxas, bordas arredondadas, sem vincos
function sdfShort(a, corpo) {
  // corpo = SDF do corpo sem braços: o short não envolve as mãos
  return (x, y, z) => smax(corpo(x, y, z) - 0.075, smax(1.42 - y, y - (Y_QUADRIL + 0.5), 0.12), 0.1);
}

// saia em forma de sino (Lathe, opaca, dupla face, sem buracos)
function criarSaia(a, cor) {
  const yTopo = Y_QUADRIL + 0.62, yBase = 1.25;
  const pts = [new THREE.Vector2(1.36, yBase - 0.02 - a.pelve.y)];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, y = THREE.MathUtils.lerp(yBase, yTopo, t);
    const r = 1.32 - 0.56 * Math.pow(t, 1.6) + 0.05 * Math.sin(t * Math.PI); // sino (topo ajustado à cintura)
    pts.push(new THREE.Vector2(r, y - a.pelve.y));
  }
  const g = new THREE.LatheGeometry(pts, 128); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75, side: THREE.DoubleSide, flatShading: false }));
  m.position.set(a.pelve.x, a.pelve.y, 0); m.scale.z = 0.86; m.castShadow = m.receiveShadow = true;
  return m;
}

// tênis infantil de desenho: grande e arredondado, com sola branca e biqueira
function criarTenis(cor) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), matSimples(cor, 0.6));
  corpo.scale.set(0.4, 0.3, 0.6); corpo.position.set(0, 0.24, 0.16);
  const sola = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), matSimples('#ffffff', 0.7));
  sola.scale.set(0.44, 0.12, 0.66); sola.position.set(0, 0.1, 0.17);
  const bico = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), matSimples('#ffffff', 0.6));
  bico.scale.set(0.3, 0.2, 0.22); bico.position.set(0, 0.2, 0.55);
  const lingueta = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), matSimples(new THREE.Color(cor).lerp(new THREE.Color('#fff'), 0.35), 0.6));
  lingueta.scale.set(0.24, 0.12, 0.22); lingueta.position.set(0, 0.46, 0.22);
  g.add(sola, corpo, bico, lingueta);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.geometry.computeVertexNormals(); } });
  return g;
}

export function createCharacter(params = {}) {
  const personagem = new THREE.Group();
  const mPele = matPele(params.pele || '#f2c09c');
  const roupa = params.roupa || 'camiseta';
  let partes = [];

  // cabeça (com cabelo), sem o pescoço próprio: o pescoço faz parte da malha do corpo
  const cabeca = new THREE.Group();
  const rosto = criarCabeca({ ...params, idade: params.idade || 'crianca', semPescoco: true });
  const cabelo = criarCabelo(rosto.userData.p, params);
  cabeca.add(rosto, cabelo); cabeca.scale.setScalar(0.9); personagem.add(cabeca); // cabeça+cabelo ≈ 1 cabeça (2.0)

  const descarta = (o) => o.traverse((m) => { if (m.isMesh) m.geometry.dispose(); });

  function pose(P = {}) {
    for (const m of partes) { personagem.remove(m); descarta(m); }
    partes = [];
    const a = articulacoes(P);
    const corpo = sdfCorpo(a), tronco = sdfCorpo(a, { bracos: false });
    const res = params.res || 112;
    const add = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); personagem.add(o); partes.push(o); return o; };
    // corpo inteiro: uma malha lisa
    add(new THREE.Mesh(malhaSDF(corpo, V(0, 2.2, 0), V(1.75, 2.35, 1.3), res), mPele));
    // roupas = cascas do corpo
    const corRoupa = params.corRoupa || '#4aa3df';
    const cintura = roupa === 'vestido' ? Y_QUADRIL + 0.05 : Y_QUADRIL + 0.3; // no vestido a blusa continua por baixo da saia
    add(new THREE.Mesh(malhaSDF(sdfCamiseta(a, tronco, { cintura }), V(0, 3.2, 0), V(1.55, 1.35, 1.3), res), matRoupa(corRoupa)));
    if (roupa === 'vestido') add(criarSaia(a, corRoupa));
    else add(new THREE.Mesh(malhaSDF(sdfShort(a, tronco), V(0, 1.95, 0), V(1.3, 0.75, 1.3), Math.round(res * 0.9)), matRoupa(params.corCalca || '#3a4f9a')));
    // tênis
    for (const k of ['pernaE', 'pernaD']) {
      const p = a[k], t = criarTenis(params.corSapato || '#ef5b52');
      t.position.set(p.tornoz.x, p.tornoz.y - 0.42, p.tornoz.z);
      t.rotation.y = p.relaxada ? (p.tornoz.x > 0 ? 0.35 : -0.35) : 0;
      add(t);
    }
    // cabeça no topo do pescoço, inclinada
    cabeca.position.set(a.pescoco.x, Y_PESCOCO + 1.12, 0.02);
    cabeca.rotation.set(0.04, a.cabeca.gira, a.cabeca.inclina);
  }
  personagem.userData = { params, pose, cabeca, expressao: (e) => rosto.userData.rosto(e) };
  pose(params.pose || {});
  return personagem;
}

// poses prontas (cada criança diferente)
export const POSES = {
  // peso na perna direita, cabeça inclinada 8°, braço esquerdo levemente dobrado
  menina: { apoio: 1, cabecaInclina: 0.14, cabecaGira: 0.1, bracoE: { abre: 0.3, frente: 0.18, dobra: 0.26 }, bracoD: { abre: 0.34, frente: 0.04, dobra: 0.26 } },
  // peso na perna esquerda, cabeça inclinada -8°, braço direito levemente dobrado
  menino: { apoio: -1, cabecaInclina: -0.14, cabecaGira: -0.12, bracoE: { abre: 0.34, frente: 0.02, dobra: 0.26 }, bracoD: { abre: 0.3, frente: 0.2, dobra: 0.26 } },
};
