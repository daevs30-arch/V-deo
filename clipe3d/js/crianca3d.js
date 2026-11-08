// Criança 3D (cabeça) — estilo animação infantil de estúdio: volume macio, olhos em globo,
// boca com cavidade real (stencil), cabelo em mechas esculpidas.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- materiais ----------------
export function matPele(cor, vertexColors = false) {
  return new THREE.MeshPhysicalMaterial({
    color: vertexColors ? 0xffffff : cor, vertexColors,
    roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color('#ffb898'), sheenRoughness: 0.5,
    clearcoat: 0.1, clearcoatRoughness: 0.8,
  });
}
export function matTecido(cor) {
  return new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color(cor).lerp(new THREE.Color('#ffffff'), 0.4), sheenRoughness: 0.8 });
}
export function matCabelo(cor) {
  return new THREE.MeshPhysicalMaterial({
    color: cor, roughness: 0.42,
    sheen: 0.6, sheenColor: new THREE.Color(cor).lerp(new THREE.Color('#ffd0b0'), 0.35), sheenRoughness: 0.4,
    clearcoat: 0.35, clearcoatRoughness: 0.25,
  });
}

// ---------------- utilidades de geometria ----------------
function lisa(g) { // remove costuras e recalcula normais (sem facetas)
  g.deleteAttribute('normal');
  const uv = g.getAttribute('uv'); if (uv) g.deleteAttribute('uv');
  const m = mergeVertices(g, 1e-5); m.computeVertexNormals(); return m;
}
// Tubo afunilado com pontas arredondadas, opcionalmente achatado (mechas, sobrancelhas, membros).
export function tuboAfunilado(pontos, r0, r1, { seg = 64, rad = 24, achatar = 1, eixoAchatar = null } = {}) {
  const curva = new THREE.CatmullRomCurve3(pontos, false, 'centripetal');
  const g = new THREE.TubeGeometry(curva, seg, 1, rad, false);
  const pos = g.attributes.position, fr = curva.computeFrenetFrames(seg, false);
  const tmp = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curva.getPointAt(t);
    const ponta = Math.min(1, Math.sqrt(Math.sin(Math.PI * Math.min(t, 1 - t) * 1.0 + 1e-3) * 1.6));
    const r = THREE.MathUtils.lerp(r0, r1, t) * ponta;
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      tmp.fromBufferAttribute(pos, k).sub(c);
      // achatar ao longo da binormal (mecha "fita")
      const b = fr.binormals[i], comp = tmp.dot(b);
      tmp.addScaledVector(b, comp * (achatar - 1));
      tmp.multiplyScalar(r).add(c);
      pos.setXYZ(k, tmp.x, tmp.y, tmp.z);
    }
  }
  // tampa as pontas com pequenas esferas
  const g2 = lisa(g);
  return g2;
}

// ---------------- cabeça esculpida ----------------
// Esfera deformada: bochechas salientes, queixo pequeno, cor da pele com rubor nos vértices.
function geoCabeca(o) {
  let g = new THREE.SphereGeometry(1, 192, 144);
  g = lisa(g);
  const p = g.attributes.position, n = p.count;
  const cor = new Float32Array(n * 3);
  const base = new THREE.Color(o.pele), blush = new THREE.Color(o.blush), c = new THREE.Color();
  const boch = [V(-0.56, -0.3, 0.77).normalize(), V(0.56, -0.3, 0.77).normalize()];
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1;
    for (const b of boch) { const d2 = v.distanceToSquared(b); r += o.bochecha * Math.exp(-d2 / 0.07); }
    // bochechas "caem" um pouco para baixo (bebê)
    r += 0.05 * Math.exp(-((v.y + 0.45) ** 2) / 0.05) * Math.max(0, v.z) * Math.min(1, Math.abs(v.x) * 2);
    // queixo pequeno: afina a parte de baixo na frente
    r -= 0.08 * Math.max(0, -v.y - 0.55) ** 2 * 3 * Math.max(0, v.z);
    // testa redonda e grande
    r += 0.03 * THREE.MathUtils.smoothstep(v.y, -0.2, 1.0);
    p.setXYZ(i, v.x * r * o.rx, v.y * r * o.ry, v.z * r * o.rz);
    // rubor: gradiente suave, sem contorno
    let k = 0; for (const b of boch) k += Math.exp(-v.distanceToSquared(b) / 0.022);
    c.copy(base).lerp(blush, Math.min(0.32, k * 0.3));
    // pontinha do nariz/lábio levemente mais quente
    cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cor, 3));
  g.computeVertexNormals();
  return g;
}

// textura da íris: escura na borda, clara no centro, pupila grande, raios sutis
function texIris(cor) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const x = cv.getContext('2d'), C = new THREE.Color(cor);
  const hex = (k) => '#' + C.clone().lerp(new THREE.Color(k > 0 ? '#ffffff' : '#000000'), Math.abs(k)).getHexString();
  const g = x.createRadialGradient(256, 290, 10, 256, 256, 256);
  g.addColorStop(0, hex(0.55)); g.addColorStop(0.45, hex(0.25)); g.addColorStop(0.75, hex(0)); g.addColorStop(0.93, hex(-0.55)); g.addColorStop(1, hex(-0.8));
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.globalAlpha = 0.18;
  for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; x.strokeStyle = i % 2 ? '#ffffff' : '#000000'; x.lineWidth = 3; x.beginPath(); x.moveTo(256 + Math.cos(a) * 110, 256 + Math.sin(a) * 110); x.lineTo(256 + Math.cos(a) * 240, 256 + Math.sin(a) * 240); x.stroke(); }
  x.globalAlpha = 1;
  const pg = x.createRadialGradient(256, 256, 60, 256, 256, 112);
  pg.addColorStop(0, '#050202'); pg.addColorStop(0.85, '#0b0605'); pg.addColorStop(1, 'rgba(10,5,5,0)');
  x.fillStyle = pg; x.beginPath(); x.arc(256, 256, 112, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// calota esférica apontando para +z com UV planar (para a íris)
function calota(r, ang, seg = 64) {
  const g = new THREE.SphereGeometry(r, seg, 32, 0, Math.PI * 2, 0, ang);
  g.rotateX(Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, R = r * Math.sin(ang);
  for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * R), 0.5 + p.getY(i) / (2 * R));
  return g;
}

function criarOlho(o, lado, matPeleLisa) {
  const r = o.olhoR, grupo = new THREE.Group();
  const globo = new THREE.Group(); grupo.add(globo); // gira para olhar
  const branco = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.MeshPhysicalMaterial({ color: '#fbfaf8', roughness: 0.35, clearcoat: 0.3, sheen: 0.2, sheenColor: new THREE.Color('#ffdcd0') }));
  branco.scale.set(1, 1.04, 0.92);
  globo.add(branco);
  const ang = 0.8;
  const iris = new THREE.Mesh(calota(r * 1.004, ang), new THREE.MeshPhysicalMaterial({ map: texIris(o.olhos), roughness: 0.35 }));
  iris.scale.copy(branco.scale); globo.add(iris);
  const cornea = new THREE.Mesh(calota(r * 1.02, ang * 1.15), new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.0, transmission: 1, thickness: 0.04, ior: 1.37, clearcoat: 1, clearcoatRoughness: 0, transparent: true, envMapIntensity: 2.2, specularIntensity: 1,
  }));
  cornea.scale.copy(branco.scale); globo.add(cornea);
  // pálpebras: calotas da cor da pele (piscar/semicerrar)
  const sup = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), matPeleLisa);
  const inf = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), matPeleLisa);
  sup.scale.set(0.98, 1.0, 0.92); inf.scale.set(0.98, 1.0, 0.92);
  grupo.add(sup, inf);
  // cílios (poucos, só meninas), presos à pálpebra
  if (o.menina) {
    const mc = new THREE.MeshStandardMaterial({ color: '#1a0f0c', roughness: 0.6 });
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + i * 0.22; // ângulo no canto externo
      const x0 = lado * r * 1.05 * Math.sin(a), z0 = r * 1.0 * Math.cos(a);
      const pts = [V(x0, 0.0, z0), V(x0 + lado * r * 0.16, r * 0.1, z0 + r * 0.02), V(x0 + lado * r * 0.3, r * 0.26, z0 - r * 0.02)];
      const m = new THREE.Mesh(tuboAfunilado(pts, r * 0.045, r * 0.012, { seg: 16, rad: 8 }), mc);
      sup.add(m);
    }
  }
  grupo.userData = {
    globo, sup, inf,
    set(piscar = 0, olhar = [0, 0], semicerrar = 0) {
      globo.rotation.set(-olhar[1] * 0.35, olhar[0] * 0.45, 0);
      const aberto = -0.6 + semicerrar * 0.4;
      sup.rotation.x = THREE.MathUtils.lerp(aberto, 0.62, piscar);
      inf.rotation.x = THREE.MathUtils.lerp(0.74 - semicerrar * 0.15, 0.42, piscar);
    },
  };
  return grupo;
}

// ---------------- boca com cavidade (stencil) ----------------
function formaBoca(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w, 0.02);
  s.quadraticCurveTo(0, -0.012, w, 0.02);
  s.bezierCurveTo(w * 0.95, -h * 0.75, w * 0.45, -h, 0, -h);
  s.bezierCurveTo(-w * 0.45, -h, -w * 0.95, -h * 0.75, -w, 0.02);
  return s;
}
function criarBoca(cabeca, o) {
  const grupo = new THREE.Group();
  const ray = new THREE.Raycaster();
  const projetar = (g, desloc) => { // gruda a forma 2D na superfície do rosto
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) + o.bocaY;
      ray.set(V(x, y, 5), V(0, 0, -1));
      const hit = ray.intersectObject(cabeca, false)[0];
      p.setXYZ(i, x, y, (hit ? hit.point.z : 0.9) + desloc);
    }
    p.needsUpdate = true; g.computeVertexNormals();
  };
  // máscara no stencil (a "abertura")
  const mascaraMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 });
  const mascara = new THREE.Mesh(new THREE.BufferGeometry(), mascaraMat); mascara.renderOrder = 2;
  // lábio: borda levemente mais escura e saliente
  const labioMat = new THREE.MeshPhysicalMaterial({ color: o.labio, roughness: 0.45, clearcoat: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });
  const labio = new THREE.Mesh(new THREE.BufferGeometry(), labioMat); labio.renderOrder = 1;
  // interior visto pelo buraco: parede escura, dentes de cima e língua (geometria 3D real)
  const dentro = (m) => { m.stencilWrite = true; m.stencilRef = 1; m.stencilFunc = THREE.EqualStencilFunc; m.depthTest = false; return m; };
  const interior = new THREE.Group(); interior.renderOrder = 3;
  const fundo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 32), dentro(new THREE.MeshStandardMaterial({ color: '#4a0f16', roughness: 0.8, side: THREE.BackSide })));
  fundo.scale.set(1.1, 0.75, 0.6);
  const dentes = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.24, 12, 32), dentro(new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.25, clearcoat: 0.6 })));
  dentes.rotation.z = Math.PI / 2;
  const lingua = new THREE.Mesh(new THREE.SphereGeometry(0.16, 48, 32), dentro(new THREE.MeshPhysicalMaterial({ color: '#e0646e', roughness: 0.45, clearcoat: 0.4, sheen: 0.4, sheenColor: new THREE.Color('#ffb0b0') })));
  lingua.scale.set(1.15, 0.55, 0.8);
  for (const m of [fundo, dentes, lingua]) m.renderOrder = 3;
  interior.add(fundo, dentes, lingua);
  grupo.add(labio, mascara, interior);
  grupo.userData.set = (abre) => {
    const w = o.bocaW, h = 0.05 + abre * 0.2;
    const gL = new THREE.ShapeGeometry(formaBoca(w * 1.1, h * 1.1 + 0.02), 32); gL.translate(0, 0.01, 0);
    projetar(gL, 0.004); labio.geometry.dispose(); labio.geometry = gL;
    const gM = new THREE.ShapeGeometry(formaBoca(w, h), 32);
    projetar(gM, 0.008); mascara.geometry.dispose(); mascara.geometry = gM;
    const zc = gM.boundingBox ? 0 : 0; gM.computeBoundingBox();
    const z0 = gM.boundingBox.max.z;
    fundo.position.set(0, o.bocaY - h * 0.5, z0 - 0.2);
    dentes.position.set(0, o.bocaY - 0.012, z0 - 0.06); dentes.scale.set(1, 1, 1);
    dentes.geometry.dispose(); dentes.geometry = new THREE.CapsuleGeometry(0.032, w * 1.5, 12, 32);
    lingua.position.set(0, o.bocaY - h * 0.95, z0 - 0.1);
  };
  return grupo;
}

// ---------------- cabelo: puffs + franja em mechas ----------------
function cabeloPuffs(o, mat) {
  const g = new THREE.Group();
  const R = { x: o.rx, y: o.ry, z: o.rz };
  const sup = (x, y, z, k = 1.06) => { const v = V(x, y, z).normalize(); return V(v.x * R.x * k, v.y * R.y * k, v.z * R.z * k); };
  // base do couro cabeludo (bem rente, só para não aparecer "careca" entre as mechas)
  const base = new THREE.Mesh(lisa(new THREE.SphereGeometry(1, 128, 96, 0, Math.PI * 2, 0, Math.PI * 0.47)), mat);
  base.scale.set(R.x * 1.06, R.y * 1.07, R.z * 1.06); base.rotation.x = -0.5; g.add(base);
  // franja: mechas grossas que saem da risca e caem para os lados em camadas
  const franja = [
    [-0.05, [[0.0, 1.0, 0.25], [-0.25, 0.92, 0.55], [-0.45, 0.68, 0.72], [-0.58, 0.42, 0.72]], 0.17],
    [0.05, [[0.05, 1.0, 0.22], [0.3, 0.92, 0.55], [0.5, 0.7, 0.7], [0.62, 0.45, 0.68]], 0.16],
    [0, [[-0.02, 1.02, 0.1], [-0.12, 0.95, 0.5], [-0.2, 0.78, 0.82], [-0.28, 0.6, 0.86]], 0.15],
    [0, [[0.04, 1.02, 0.1], [0.14, 0.95, 0.5], [0.22, 0.8, 0.8], [0.3, 0.62, 0.84]], 0.15],
    [0, [[-0.3, 0.98, 0.0], [-0.6, 0.85, 0.3], [-0.82, 0.55, 0.42], [-0.9, 0.2, 0.4]], 0.17],
    [0, [[0.3, 0.98, 0.0], [0.6, 0.85, 0.3], [0.84, 0.55, 0.4], [0.92, 0.22, 0.38]], 0.17],
    [0, [[-0.45, 0.9, -0.3], [-0.85, 0.6, -0.15], [-0.98, 0.2, 0.05], [-0.95, -0.1, 0.12]], 0.16],
    [0, [[0.45, 0.9, -0.3], [0.86, 0.6, -0.15], [0.98, 0.2, 0.05], [0.96, -0.08, 0.12]], 0.16],
  ];
  for (const [, pts, r] of franja) {
    const P = pts.map(([x, y, z], i) => sup(x, y, z, 1.075 + i * 0.008));
    g.add(new THREE.Mesh(tuboAfunilado(P, r * 1.25, r * 0.6, { achatar: 0.4 }), mat));
  }
  // mechas de trás/topo indo para os puffs
  for (const l of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const P = [sup(l * 0.05, 1.0, 0.3 - k * 0.3), sup(l * 0.4, 0.95, 0.1 - k * 0.25), sup(l * 0.68, 0.82, -0.1 - k * 0.15)];
      g.add(new THREE.Mesh(tuboAfunilado(P, 0.15, 0.1, { achatar: 0.5 }), mat));
    }
    // puff: aglomerado de cachos (esferas) — volume fofo
    const puff = new THREE.Group(); puff.position.set(l * 0.88 * R.x, 0.92 * R.y, -0.12);
    const rr = (s) => { let x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < 26; i++) {
      const a = rr(i + l * 7) * Math.PI * 2, b = Math.acos(2 * rr(i * 3.3 + l) - 1), d = 0.28;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.17 + rr(i * 9.1) * 0.06, 32, 24), mat);
      m.position.set(Math.sin(b) * Math.cos(a) * d, Math.cos(b) * d, Math.sin(b) * Math.sin(a) * d);
      puff.add(m);
    }
    puff.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 48, 32), mat));
    g.add(puff);
    // elástico/laço
    const laco = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 24, 48), new THREE.MeshPhysicalMaterial({ color: '#ff5f9a', roughness: 0.4, clearcoat: 0.6 }));
    laco.position.set(l * 0.66 * R.x, 0.74 * R.y, -0.1); laco.rotation.set(0.3, l * 0.9, l * 0.6); g.add(laco);
  }
  return g;
}

// ---------------- montagem ----------------
export function criarCabecaCrianca(opts = {}) {
  const o = Object.assign({
    pele: '#9a603e', blush: '#d0625e', labio: '#a8504a', olhos: '#5a3418', cabelo: '#24150e', menina: true,
    rx: 1.1, ry: 1.0, rz: 0.98, bochecha: 0.13, olhoR: 0.3, bocaY: -0.52, bocaW: 0.2,
  }, opts);
  const grupo = new THREE.Group();
  const matV = matPele(o.pele, true), matL = matPele(o.pele);
  const cabeca = new THREE.Mesh(geoCabeca(o), matV);
  cabeca.castShadow = cabeca.receiveShadow = true; grupo.add(cabeca);
  cabeca.updateMatrixWorld();
  // olhos (saltam um pouco para fora do rosto)
  const olhos = [];
  for (const l of [-1, 1]) {
    const ol = criarOlho(o, l, matL);
    ol.position.set(l * 0.39, 0.02, 0.0);
    // encaixa na superfície: ~40% do globo para fora
    const ray = new THREE.Raycaster(V(l * 0.39, 0.02, 5), V(0, 0, -1));
    const z = ray.intersectObject(cabeca)[0].point.z;
    ol.position.z = z - o.olhoR * 0.5;
    ol.rotation.y = l * 0.2;
    grupo.add(ol); olhos.push(ol);
  }
  // nariz: esferinha achatada
  const nz = new THREE.Raycaster(V(0, -0.22, 5), V(0, 0, -1)).intersectObject(cabeca)[0].point.z;
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.1, 48, 32), matL);
  nariz.scale.set(1.25, 0.85, 0.75); nariz.position.set(0, -0.22, nz - 0.01); nariz.castShadow = true; grupo.add(nariz);
  // orelhas
  for (const l of [-1, 1]) {
    const or = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 32), matL);
    or.scale.set(0.5, 1, 0.8); or.position.set(l * o.rx * 0.98, -0.05, -0.08); grupo.add(or);
  }
  // sobrancelhas: fitas curtas e grossas sobre a pele
  const mSob = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.cabelo).lerp(new THREE.Color('#000'), 0.1), roughness: 0.8 });
  const sobr = [];
  for (const l of [-1, 1]) {
    const pts = [[0.2, 0.43], [0.38, 0.5], [0.56, 0.44]].map(([x, y]) => {
      const z = new THREE.Raycaster(V(l * x, y, 5), V(0, 0, -1)).intersectObject(cabeca)[0].point.z; return V(l * x, y, z + 0.015);
    });
    const s = new THREE.Mesh(tuboAfunilado(pts, 0.035, 0.025, { seg: 24, rad: 12, achatar: 0.5 }), mSob);
    grupo.add(s); sobr.push(s);
  }
  const boca = criarBoca(cabeca, o); grupo.add(boca);
  const cabelo = cabeloPuffs(o, matCabelo(o.cabelo));
  cabelo.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  grupo.add(cabelo);
  grupo.userData = {
    o, cabeca,
    set({ piscar = 0, olhar = [0, 0], boca: abre = 0, semicerrar = 0, sobrancelha = 0 } = {}) {
      for (const ol of olhos) ol.userData.set(piscar, olhar, semicerrar);
      boca.userData.set(abre);
      sobr.forEach((s) => { s.position.y = sobrancelha * 0.05; });
    },
  };
  grupo.userData.set({});
  return grupo;
}
