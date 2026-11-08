// Cabeça e rosto: crânio esculpido, olhos enormes, sobrancelhas grossas, boca com cavidade.
// Tudo feito só com primitivas deformadas. Expressões e bocas de fala são controladas por números.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { matPele, matSimples, matBrilho } from './materials.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- utilidades de geometria ----------
// Junta vértices duplicados e recalcula normais: superfícies lisas, sem facetas nem costuras.
export function lisa(g) {
  g.deleteAttribute('normal');
  if (g.getAttribute('uv')) g.deleteAttribute('uv');
  const m = mergeVertices(g, 1e-5); m.computeVertexNormals(); return m;
}

// Tubo afunilado com pontas arredondadas, opcionalmente achatado (mechas, cílios, sobrancelhas).
export function tubo(pontos, r0, r1, { seg = 48, rad = 20, achatar = 1, pontas = true } = {}) {
  const curva = new THREE.CatmullRomCurve3(pontos, false, 'centripetal');
  const g = new THREE.TubeGeometry(curva, seg, 1, rad, false);
  const pos = g.attributes.position, fr = curva.computeFrenetFrames(seg, false), v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, c = curva.getPointAt(t);
    // perfil das pontas: arredondado (meia-esfera) nas duas extremidades
    const borda = Math.min(t, 1 - t) * seg / 6;
    const f = pontas ? Math.sqrt(Math.max(0.0, 1 - Math.pow(Math.max(0, 1 - borda), 2))) : 1;
    const r = THREE.MathUtils.lerp(r0, r1, t) * Math.max(f, 0.02);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(pos, k).sub(c);
      const b = fr.binormals[i]; v.addScaledVector(b, v.dot(b) * (achatar - 1));
      v.multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  return lisa(g);
}

// ---------- proporções por idade ----------
export const IDADES = {
  bebe: { rx: 1.14, ry: 1.02, rz: 1.0, bochecha: 0.15, olhoR: 0.33, olhoX: 0.42, olhoY: -0.02, bocaY: -0.5, bocaW: 0.21, narizY: -0.24 },
  crianca: { rx: 1.1, ry: 1.0, rz: 0.98, bochecha: 0.13, olhoR: 0.31, olhoX: 0.42, olhoY: 0.02, bocaY: -0.5, bocaW: 0.25, narizY: -0.22 },
  adulto: { rx: 0.95, ry: 1.08, rz: 0.95, bochecha: 0.06, olhoR: 0.25, olhoX: 0.36, olhoY: 0.06, bocaY: -0.55, bocaW: 0.26, narizY: -0.22 },
};

// ---------- crânio ----------
function geoCabeca(p, pele, rubor) {
  const g = lisa(new THREE.SphereGeometry(1, 192, 144));
  const pos = g.attributes.position, n = pos.count, cores = new Float32Array(n * 3);
  const base = new THREE.Color(pele), blush = new THREE.Color(rubor), c = new THREE.Color();
  const boch = [V(-0.56, -0.3, 0.77).normalize(), V(0.56, -0.3, 0.77).normalize()];
  const v = new THREE.Vector3(), adulto = p.idade === 'adulto';
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let r = 1;
    for (const b of boch) r += p.bochecha * Math.exp(-v.distanceToSquared(b) / 0.07);
    // bochechas cheias que "caem" um pouco (bem fofo nos pequenos)
    r += (adulto ? 0.01 : 0.05) * Math.exp(-((v.y + 0.45) ** 2) / 0.05) * Math.max(0, v.z) * Math.min(1, Math.abs(v.x) * 2);
    // queixo: pequeno na criança, um pouco mais longo no adulto
    r -= (adulto ? 0.02 : 0.08) * Math.max(0, -v.y - 0.55) ** 2 * 3 * Math.max(0, v.z);
    if (adulto) r += 0.06 * Math.exp(-((v.y + 0.85) ** 2) / 0.03) * Math.max(0, v.z);
    // testa grande e redonda
    r += 0.035 * THREE.MathUtils.smoothstep(v.y, -0.2, 1.0);
    pos.setXYZ(i, v.x * r * p.rx, v.y * r * p.ry, v.z * r * p.rz);
    // rubor rosado suave, sem contorno
    let k = 0; for (const b of boch) k += Math.exp(-v.distanceToSquared(b) / 0.022);
    c.copy(base).lerp(blush, Math.min(0.35, k * 0.32));
    cores[i * 3] = c.r; cores[i * 3 + 1] = c.g; cores[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  g.computeVertexNormals();
  return g;
}

// ---------- olhos ----------
function texIris(cor) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = cv.getContext('2d'), C = new THREE.Color(cor);
  const h = (k) => '#' + C.clone().lerp(new THREE.Color(k > 0 ? '#ffffff' : '#000000'), Math.abs(k)).getHexString();
  const g = x.createRadialGradient(128, 150, 6, 128, 128, 128);
  g.addColorStop(0, h(0.5)); g.addColorStop(0.5, h(0.2)); g.addColorStop(0.78, h(0)); g.addColorStop(0.94, h(-0.5)); g.addColorStop(1, h(-0.75));
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#070303'; x.beginPath(); x.arc(128, 128, 54, 0, Math.PI * 2); x.fill(); // pupila preta grande
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function calota(r, ang) { // calota apontando para +z, UV planar
  const g = new THREE.SphereGeometry(r, 64, 24, 0, Math.PI * 2, 0, ang); g.rotateX(Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, R = r * Math.sin(ang);
  for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * R), 0.5 + p.getY(i) / (2 * R));
  return g;
}

function criarOlho(r, corOlhos, lado, mPele, menina, corCilios) {
  const olho = new THREE.Group();
  const globo = new THREE.Group(); olho.add(globo); // gira para olhar
  const esclera = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), matSimples('#fbfaf7', 0.4));
  esclera.scale.set(1, 1.05, 0.9); globo.add(esclera);
  const iris = new THREE.Mesh(calota(r * 1.006, 0.82), matSimples('#ffffff', 0.35, { map: texIris(corOlhos) }));
  iris.scale.copy(esclera.scale); globo.add(iris);
  // dois brilhos especulares (um grande, um pequeno), fixos em relação à luz
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.17, 24, 16), matBrilho);
  b1.scale.set(1, 1, 0.3); b1.position.set(r * 0.3, r * 0.34, r * 0.9);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.075, 16, 12), matBrilho);
  b2.scale.set(1, 1, 0.3); b2.position.set(-r * 0.26, -r * 0.28, r * 0.9);
  olho.add(b1, b2);
  // pálpebras: calotas da cor da pele (piscar, semicerrar, inclinar)
  const sup = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), mPele);
  const inf = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mPele);
  const supPiv = new THREE.Group(), infPiv = new THREE.Group();
  supPiv.add(sup); infPiv.add(inf); sup.scale.set(0.98, 1.07, 0.92); inf.scale.set(0.98, 1.06, 0.92);
  olho.add(supPiv, infPiv);
  // cílios grossos nas meninas (presos à pálpebra de cima)
  if (menina) {
    const mc = matSimples(corCilios, 0.6);
    for (let i = 0; i < 3; i++) {
      const a = 0.42 + i * 0.26;
      const x0 = lado * r * 1.04 * Math.sin(a), z0 = r * 0.92 * Math.cos(a);
      const pts = [V(x0, 0, z0), V(x0 + lado * r * 0.2, r * 0.1, z0), V(x0 + lado * r * 0.36, r * 0.28, z0 - r * 0.04)];
      sup.add(new THREE.Mesh(tubo(pts, r * 0.07, r * 0.03, { seg: 16, rad: 10 }), mc));
    }
  }
  olho.userData.set = ({ piscar = 0, semicerrar = 0, olhar = [0, 0], inclina = 0, arregala = 0 }) => {
    globo.rotation.set(-olhar[1] * 0.35, olhar[0] * 0.45, 0);
    const aberto = -0.88 - arregala * 0.25 + semicerrar * 0.62;
    sup.rotation.x = THREE.MathUtils.lerp(aberto, 0.62, piscar);
    supPiv.rotation.z = -lado * inclina * 0.35; // bravo: canto interno desce
    inf.rotation.x = THREE.MathUtils.lerp(0.74 - semicerrar * 0.22, 0.42, piscar);
  };
  return olho;
}

// ---------- boca com cavidade (stencil) ----------
// Forma: largura w, abertura h, curva (+ sorriso / - triste), lado (sorriso torto).
function formaBoca(w, h, curva, lado) {
  const yE = 0.06 * curva * (1 - lado * 0.8), yD = 0.06 * curva * (1 + lado * 0.8);
  const s = new THREE.Shape();
  s.moveTo(-w, yE);
  s.quadraticCurveTo(0, -0.01 - 0.01 * curva, w, yD);
  s.bezierCurveTo(w * 0.95, yD - h * 0.75, w * 0.45, -h - 0.02 * Math.max(0, curva), 0, -h - 0.02 * Math.max(0, curva));
  s.bezierCurveTo(-w * 0.45, -h - 0.02 * Math.max(0, curva), -w * 0.95, yE - h * 0.75, -w, yE);
  return s;
}

function criarBoca(cabeca, p, corLabio) {
  const grupo = new THREE.Group(), ray = new THREE.Raycaster();
  const naPele = (g, desloc) => { // gruda a forma 2D na superfície do rosto
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i) + p.bocaY;
      ray.set(V(x, y, 5), V(0, 0, -1));
      const hit = ray.intersectObject(cabeca, false)[0];
      pos.setXYZ(i, x, y, (hit ? hit.point.z : 0.9) + desloc);
    }
    pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingBox();
  };
  const mascara = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
    colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc,
    stencilZPass: THREE.ReplaceStencilOp, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }));
  mascara.renderOrder = 2;
  const labio = new THREE.Mesh(new THREE.BufferGeometry(), matSimples(corLabio, 0.55, { polygonOffset: true, polygonOffsetFactor: -2 }));
  labio.renderOrder = 1;
  // interior visto pela abertura: parede escura avermelhada, dentes de cima, língua
  const dentro = (m) => Object.assign(m, { stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, depthTest: false });
  const fundo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 24), dentro(matSimples('#4a0f16', 0.8, { side: THREE.BackSide })));
  fundo.scale.set(1.1, 0.75, 0.6);
  const dentes = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.3, 8, 24), dentro(matSimples('#ffffff', 0.4)));
  dentes.rotation.z = Math.PI / 2;
  const lingua = new THREE.Mesh(new THREE.SphereGeometry(0.16, 40, 24), dentro(matSimples('#e0646e', 0.6)));
  lingua.scale.set(1.15, 0.55, 0.8);
  for (const m of [fundo, dentes, lingua]) m.renderOrder = 3;
  // boca fechada: vinco do sorriso (tubo fininho cor de lábio)
  const vinco = new THREE.Mesh(new THREE.BufferGeometry(), matSimples(new THREE.Color(corLabio).multiplyScalar(0.7), 0.6));
  grupo.add(labio, mascara, fundo, dentes, lingua, vinco);

  let ultimo = '';
  grupo.userData.set = ({ abre = 0, largura = 1, curva = 0.5, lado = 0 }) => {
    const chave = [abre, largura, curva, lado].map((x) => x.toFixed(3)).join();
    if (chave === ultimo) return; ultimo = chave;
    const w = p.bocaW * largura;
    const aberta = abre > 0.04;
    for (const m of [labio, mascara, fundo, dentes, lingua]) m.visible = aberta;
    vinco.visible = !aberta;
    if (!aberta) {
      const yE = 0.07 * curva * (1 - lado * 0.8), yD = 0.07 * curva * (1 + lado * 0.8);
      const pts = [[-w * 0.85, yE], [-w * 0.45, -0.03 * curva], [0, -0.04 * curva], [w * 0.45, -0.03 * curva], [w * 0.85, yD]].map(([x, y]) => {
        ray.set(V(x, y + p.bocaY, 5), V(0, 0, -1)); const z = ray.intersectObject(cabeca, false)[0].point.z; return V(x, y + p.bocaY, z + 0.004);
      });
      vinco.geometry.dispose(); vinco.geometry = tubo(pts, 0.022, 0.022, { seg: 24, rad: 10 });
      return;
    }
    const h = 0.05 + abre * 0.3;
    const gL = new THREE.ShapeGeometry(formaBoca(w * 1.1, h * 1.08 + 0.02, curva, lado), 24); gL.translate(0, 0.012, 0);
    naPele(gL, 0.004); labio.geometry.dispose(); labio.geometry = gL;
    const gM = new THREE.ShapeGeometry(formaBoca(w, h, curva, lado), 24);
    naPele(gM, 0.008); mascara.geometry.dispose(); mascara.geometry = gM;
    const z0 = gM.boundingBox.max.z;
    fundo.position.set(0, p.bocaY - h * 0.5, z0 - 0.2);
    dentes.position.set(0, p.bocaY - 0.012 + 0.03 * curva * 0.5, z0 - 0.06);
    dentes.geometry.dispose(); dentes.geometry = new THREE.CapsuleGeometry(0.03, w * 1.5, 8, 24);
    lingua.position.set(0, p.bocaY - h * 0.95, z0 - 0.1);
  };
  return grupo;
}

// ---------- expressões e bocas de fala ----------
export const EXPRESSOES = {
  neutro: {},
  feliz: { boca: { abre: 0.12, curva: 0.7 }, sobrancelha: { sobe: 0.15 } },
  rindo: { boca: { abre: 0.85, curva: 0.9, largura: 1.15 }, olhos: { semicerrar: 0.5 }, sobrancelha: { sobe: 0.35 } },
  surpreso: { boca: { abre: 0.75, largura: 0.55, curva: 0 }, olhos: { arregala: 1 }, sobrancelha: { sobe: 1 } },
  triste: { boca: { abre: 0, curva: -1 }, olhos: { semicerrar: 0.3, olhar: [0, -0.5] }, sobrancelha: { inclina: -1.1, sobe: 0.25 } },
  desconfiado: { boca: { abre: 0, curva: 0.35, lado: 0.9 }, olhos: { semicerrar: 0.6, olhar: [0.5, 0] }, sobrancelha: { sobe: -0.2, assimetria: 0.9 } },
  bravo: { boca: { abre: 0.3, curva: -0.8, largura: 0.95 }, olhos: { semicerrar: 0.35, inclina: 1 }, sobrancelha: { inclina: 1.2, sobe: -0.5 } },
};
export const VISEMAS = {
  A: { abre: 0.9, largura: 0.85 },
  E: { abre: 0.45, largura: 1.15 },
  O: { abre: 0.7, largura: 0.5 },
  M: { abre: 0, largura: 0.9 },
};

// ---------- montagem da cabeça ----------
export function criarCabeca(params) {
  const p = { ...IDADES[params.idade || 'crianca'], idade: params.idade || 'crianca' };
  const pele = params.pele || '#f2c09c';
  const grupo = new THREE.Group();
  const mPeleV = matPele(pele, { vertexColors: true }), mPele = matPele(pele);
  const cabeca = new THREE.Mesh(geoCabeca(p, pele, params.rubor || '#e8737a'), mPeleV);
  cabeca.castShadow = cabeca.receiveShadow = true; grupo.add(cabeca);
  const naPele = (x, y) => new THREE.Raycaster(V(x, y, 5), V(0, 0, -1)).intersectObject(cabeca)[0].point.z;

  // olhos enormes, um pouco separados, saltando do rosto
  const olhos = [-1, 1].map((l) => {
    const o = criarOlho(p.olhoR, params.corOlhos || '#5a3418', l, mPele, !!params.menina, params.corCilios || '#1c110c');
    o.position.set(l * p.olhoX, p.olhoY, naPele(l * p.olhoX, p.olhoY) - p.olhoR * 0.5);
    o.rotation.y = l * 0.2; grupo.add(o); return o;
  });
  // nariz pequeno e arredondado
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(p.idade === 'adulto' ? 0.11 : 0.1, 40, 28), mPele);
  nariz.scale.set(1.25, 0.85, 0.8); nariz.position.set(0, p.narizY, naPele(0, p.narizY) - 0.01); nariz.castShadow = true; grupo.add(nariz);
  // orelhas simples
  for (const l of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 28), mPele);
    o.scale.set(0.5, 1, 0.8); o.position.set(l * p.rx * 0.98, -0.06, -0.08); grupo.add(o);
  }
  // sobrancelhas grossas e expressivas (cada uma num pivô para subir/inclinar)
  const corSob = params.corSobrancelha || new THREE.Color(params.corCabelo || '#3a2416').multiplyScalar(0.8);
  const sobr = [-1, 1].map((l) => {
    const piv = new THREE.Group(); const cx = l * p.olhoX, cy = p.olhoY + p.olhoR + 0.12;
    piv.position.set(cx, cy, naPele(cx, cy));
    const pts = [[-0.17, -0.02], [0, 0.03], [0.17, -0.01]].map(([x, y]) => V(l * x, y, naPele(cx + l * x, cy + y) - piv.position.z + 0.02));
    piv.add(new THREE.Mesh(tubo(pts, 0.065, 0.045, { seg: 24, rad: 12, achatar: 0.55 }), matSimples(corSob, 0.75)));
    grupo.add(piv); piv.userData.y0 = cy; piv.userData.l = l; return piv;
  });
  const boca = criarBoca(cabeca, p, params.corLabio || '#c25a5a'); grupo.add(boca);

  // controle do rosto: valores de expressão + boca de fala opcional
  grupo.userData = {
    p, cabeca, mPele,
    rosto({ expressao = 'neutro', piscar = 0, olhar = null, visema = null, fala = 0 } = {}) {
      const e = EXPRESSOES[expressao] || {};
      const eo = { ...(e.olhos || {}) }; if (olhar) eo.olhar = olhar;
      for (const o of olhos) o.userData.set({ ...eo, piscar: Math.max(piscar, 0) });
      const s = e.sobrancelha || {};
      for (const sb of sobr) {
        const l = sb.userData.l, as = (s.assimetria || 0) * (l > 0 ? 1 : -1) * 0.5;
        sb.position.y = sb.userData.y0 + 0.11 * (s.sobe || 0) + 0.12 * as;
        sb.rotation.z = -l * 0.5 * (s.inclina || 0);
      }
      let b = { abre: 0, largura: 1, curva: 0.35, lado: 0, ...(e.boca || {}) };
      if (visema && VISEMAS[visema]) b = { ...b, ...VISEMAS[visema], abre: THREE.MathUtils.lerp(b.abre, VISEMAS[visema].abre, fala || 1) };
      boca.userData.set(b);
    },
  };
  grupo.userData.rosto({});
  return grupo;
}
