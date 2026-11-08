// Cabelos: mechas grossas em blocos (massinha), pontas arredondadas, franja volumosa.
// penteado: 'lateral' | 'espetado' | 'liso' | 'coquinhos' | 'rabo' | 'careca' | 'gorro'
import * as THREE from 'three';
import { V, tubo, lisa } from './face.js';
import { matCabelo, matSimples } from './materials.js';

function aleatorio(semente) { let s = semente * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

export function criarCabelo(p, { penteado = 'liso', corCabelo = '#4a2a18', corGorro = '#e2504c', semente = 1 } = {}) {
  const g = new THREE.Group();
  if (penteado === 'careca') return g;
  const mat = matCabelo(corCabelo), rnd = aleatorio(semente);
  // ponto na superfície do crânio (k > 1 = um pouco para fora)
  // o crânio cresce na testa (forma de bebê): o cabelo acompanha esse volume extra
  const testa = (y) => 1 + (p.idade === 'adulto' ? 0.04 : 0.1) * THREE.MathUtils.smoothstep(y, -0.1, 0.9);
  const sup = (x, y, z, k = 1.06) => { const v = V(x, y, z).normalize(); const t = testa(v.y); return V(v.x * p.rx * k * t, v.y * p.ry * k * t, v.z * p.rz * k * t); };
  // a mecha nasce por dentro do couro cabeludo (1º ponto afundado): sem "crista" na raiz
  const mecha = (pts, r0, r1, achatar = 0.5, k0 = 1.07, dk = 0.01) =>
    g.add(new THREE.Mesh(tubo(pts.map(([x, y, z], i) => sup(x, y, z, i === 0 ? 0.9 : k0 + i * dk)), r0, r1, { achatar }), mat));

  // base rente ao couro cabeludo (para não aparecer pele entre as mechas)
  const base = (angulo = 0.47, incl = -0.5, lado = 0) => {
    const m = new THREE.Mesh(lisa(new THREE.SphereGeometry(1, 128, 96, 0, Math.PI * 2, 0, Math.PI * angulo)), mat);
    const pp = m.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pp.count; i++) { // acompanha a testa maior (no espaço já inclinado)
      v.fromBufferAttribute(pp, i).applyEuler(new THREE.Euler(incl, 0, lado));
      const t = testa(v.clone().normalize().y); v.fromBufferAttribute(pp, i).multiplyScalar(t); pp.setXYZ(i, v.x, v.y, v.z);
    }
    m.geometry.computeVertexNormals();
    m.scale.set(p.rx * 1.05, p.ry * 1.06, p.rz * 1.05); m.rotation.set(incl, 0, lado); g.add(m);
  };
  // franja volumosa em camadas, saindo da risca
  const franja = (larg = 1) => {
    // 5 mechas largas e achatadas, de tamanhos variados, que se fundem numa franja só
    const M = [[-0.95, 0.34, 0.5], [-0.5, 0.42, 0.42], [-0.05, 0.38, 0.47], [0.42, 0.44, 0.4], [0.88, 0.32, 0.52]];
    for (const [u, r, yFim] of M) {
      const lado = u < 0 ? -1 : 1;
      mecha([[u * 0.1, 1.0, -0.1], [u * 0.42 + lado * 0.04, 0.96, 0.42], [u * 0.66 + lado * 0.06, 0.76, 0.7], [u * 0.78 + lado * 0.1, yFim, 0.74]].map(([x, y, z]) => [x * larg, y, z]), r * 1.2, r * 0.85, 0.24, 1.035, 0.008);
    }
  };

  if (penteado === 'lateral') {
    // menino: mechas curvas de tamanhos variados, penteadas para um lado, pontas arredondadas,
    // linha do cabelo irregular (cada mecha termina numa altura diferente)
    base(0.43, -0.35, -0.05); // base menor que a área do cabelo: a linha do cabelo é formada pelas pontas das mechas
    const redemoinho = [0.35, 1.0, -0.35];
    for (let i = 0; i < 18; i++) {
      const u = i / 17;                                  // varre da nuca até a testa
      const ang = THREE.MathUtils.lerp(-2.6, 0.9, u);   // em volta do topo
      const fimX = Math.cos(ang) * 0.95 - 0.35, fimZ = Math.sin(ang) * 0.9 + 0.1;
      const fimY = (fimZ > 0.5 ? 0.5 : 0.18) + 0.14 * Math.sin(i * 2.3); // linha irregular: mais baixa nos lados e atrás
      const meio = [THREE.MathUtils.lerp(redemoinho[0], fimX, 0.55) - 0.15, 1.02, THREE.MathUtils.lerp(redemoinho[2], fimZ, 0.55)];
      const r = 0.24 + 0.12 * ((i * 7) % 5) / 4;          // tamanhos variados
      mecha([redemoinho, meio, [fimX * 0.98, (fimY + 1.0) / 2 + 0.08, fimZ * 0.98], [fimX, fimY, fimZ]], r * 1.15, r * 0.75, 0.42, 1.045, 0.008);
    }
    // franjinha caindo para o lado (curva, tamanhos diferentes)
    const fr = [[-0.02, 0.4, 0.3], [-0.36, 0.47, 0.25], [0.24, 0.55, 0.22]]; // 3 mechas caindo na testa
    for (const [x, y, r] of fr) mecha([[x + 0.25, 0.98, 0.35], [x + 0.08, 0.86, 0.62], [x - 0.08, y + 0.06, 0.8], [x - 0.2, y, 0.8]], r, r * 0.65, 0.42, 1.055, 0.008);
    // costeletas atrás das orelhas
    for (const l of [-1, 1]) mecha([[l * 0.8, 0.6, -0.1], [l * 0.95, 0.3, -0.05], [l * 0.97, 0.05, -0.02]], 0.2, 0.14, 0.5, 1.04, 0.005);
  }

  if (penteado === 'espetado') {
    base(0.5, -0.4);
    // espetos grossos com ponta arredondada, saindo do topo e da frente
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, el = 0.55 + rnd() * 0.25;
      const d = V(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el) * 0.9 + 0.1);
      const r0 = sup(d.x, d.y, d.z, 1.0), dir = r0.clone().normalize();
      const p1 = r0.clone().addScaledVector(dir, 0.35).add(V(0, 0.12, 0)), p2 = r0.clone().addScaledVector(dir, 0.62).add(V(d.x * 0.1, 0.25, 0));
      g.add(new THREE.Mesh(tubo([r0, p1, p2], 0.26, 0.11, { achatar: 0.8 }), mat));
    }
    // topete na frente
    for (const x of [-0.35, 0, 0.35]) g.add(new THREE.Mesh(tubo([sup(x, 0.8, 0.5, 1.0), sup(x * 1.1, 0.95, 0.75, 1.15), sup(x * 1.2, 1.15, 0.85, 1.3)], 0.2, 0.06, { achatar: 0.6 }), mat));
  }

  if (penteado === 'liso') {
    base(); franja();
    // cortinas laterais e de trás até os ombros
    for (const l of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const z = 0.25 - k * 0.38;
        mecha([[l * 0.55, 0.85, z], [l * 0.95, 0.35, z * 0.9], [l * 1.0, -0.35, z * 0.9], [l * 0.95, -1.05, z]], 0.26, 0.2, 0.45, 1.07, 0.02);
      }
    }
    for (const x of [-0.45, -0.15, 0.15, 0.45]) mecha([[x, 0.9, -0.5], [x * 1.3, 0.3, -1.0], [x * 1.3, -0.4, -1.0], [x * 1.2, -1.05, -0.9]], 0.3, 0.22, 0.45, 1.07, 0.02);
  }

  if (penteado === 'coquinhos' || penteado === 'rabo') {
    base(); franja();
    for (const l of [-1, 1]) for (let k = 0; k < 4; k++) mecha([[l * 0.05, 1.0, 0.3 - k * 0.3], [l * 0.4, 0.95, 0.1 - k * 0.25], [l * 0.68, 0.82, -0.1 - k * 0.15]], 0.17, 0.12, 0.5);
  }
  if (penteado === 'coquinhos') {
    for (const l of [-1, 1]) {
      const geo = new THREE.SphereGeometry(0.45, 96, 72), pp = geo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < pp.count; i++) { // relevo suave em espiral (como massinha enrolada)
        v.fromBufferAttribute(pp, i); const n = v.clone().normalize();
        const th = Math.atan2(n.z, n.x), ph = Math.acos(n.y);
        const k = 1 + 0.025 * Math.sin(th * 3 + ph * 4) + 0.012 * Math.sin(th * 5 - ph * 3);
        pp.setXYZ(i, v.x * k, v.y * k * 0.92, v.z * k);
      }
      const coque = new THREE.Mesh(lisa(geo), mat);
      coque.position.set(l * 0.84 * p.rx, 0.9 * p.ry, -0.1); coque.rotation.z = -l * 0.4; g.add(coque);
      const laco = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 20, 40), matSimples('#ff5f9a', 0.6));
      laco.position.set(l * 0.66 * p.rx, 0.74 * p.ry, -0.1); laco.rotation.set(0.3, l * 0.9, l * 0.6); g.add(laco);
    }
  }
  if (penteado === 'rabo') {
    const r0 = sup(0, 0.55, -0.85, 1.0);
    const pts = [r0, r0.clone().add(V(0, 0.15, -0.35)), r0.clone().add(V(0, -0.35, -0.55)), r0.clone().add(V(0, -1.05, -0.45)), r0.clone().add(V(0, -1.45, -0.25))];
    g.add(new THREE.Mesh(tubo(pts, 0.32, 0.14, { achatar: 0.8 }), mat));
    for (const dx of [-0.12, 0.12]) g.add(new THREE.Mesh(tubo(pts.map((v) => v.clone().add(V(dx, 0, 0.02))), 0.2, 0.08, { achatar: 0.7 }), mat));
    const elast = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 20, 40), matSimples('#ffd23a', 0.6));
    elast.position.copy(r0.clone().add(V(0, 0.12, -0.3))); elast.rotation.set(1.2, 0, 0); g.add(elast);
  }

  if (penteado === 'gorro') {
    // gorro de malha com barra dobrada e pompom; franjinha aparecendo
    for (const x of [-0.42, -0.14, 0.14, 0.42]) mecha([[x, 0.42, 0.85], [x * 1.05, 0.34, 0.9], [x * 1.1, 0.26, 0.92]], 0.15, 0.09, 0.45, 1.04, 0.003);
    const mg = matSimples(corGorro, 0.85);
    const touca = new THREE.Mesh(lisa(new THREE.SphereGeometry(1, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.5)), mg);
    touca.scale.set(p.rx * 1.12, p.ry * 1.18, p.rz * 1.12); touca.rotation.x = -0.22; g.add(touca);
    const barra = new THREE.Mesh(new THREE.TorusGeometry(1, 0.13, 24, 96), mg);
    barra.scale.set(p.rx * 1.12, p.rz * 1.12, 1); barra.rotation.x = Math.PI / 2 - 0.22; g.add(barra);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 24), matSimples('#ffffff', 0.9));
    pom.position.copy(V(0, p.ry * 1.18, 0).applyAxisAngle(V(1, 0, 0), -0.22)).add(V(0, 0.18, 0)); g.add(pom);
  }
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}
