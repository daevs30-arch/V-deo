// Cenários 3D do clipe, no mesmo estilo "massinha": formas arredondadas, cores vivas, luz macia.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { matSimples } from '../../estilo-boneco/src/materials.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sombra = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
function rnd(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

// ---------- céu em gradiente (esfera invertida) ----------
export function criarCeu() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { topo: { value: new THREE.Color('#5fb4ee') }, meio: { value: new THREE.Color('#a8dcf8') }, horizonte: { value: new THREE.Color('#fff0d6') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 topo; uniform vec3 meio; uniform vec3 horizonte; varying vec3 vP;
      void main(){ float h = clamp(vP.y, -0.2, 1.0); vec3 c = h < 0.18 ? mix(horizonte, meio, smoothstep(-0.05, 0.18, h)) : mix(meio, topo, smoothstep(0.18, 0.7, h));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), mat); ceu.renderOrder = -10;
  return ceu;
}

// ---------- terreno com colinas suaves; área plana no centro para os personagens ----------
export function criarTerreno({ cor = '#7ccf5a', cor2 = '#5aa846', amp = 2.2, freq = 1, semente = 1, tamanho = 420 } = {}) {
  const g = new THREE.PlaneGeometry(tamanho, tamanho, 220, 220); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cores = new Float32Array(p.count * 3), c1 = new THREE.Color(cor), c2 = new THREE.Color(cor2), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    let h = Math.sin(x * 0.045 * freq + semente) * Math.cos(z * 0.05 * freq) * amp + Math.sin(x * 0.11 * freq - z * 0.07 * freq + semente * 2) * amp * 0.45;
    const plano = THREE.MathUtils.smoothstep(Math.hypot(x / 1.6, z) , 12, 34); // plano perto da câmera
    h = h * plano + (z < -40 ? (-z - 40) * 0.08 * amp : 0) * plano;
    p.setY(i, h);
    c.copy(c1).lerp(c2, 0.5 + 0.5 * Math.sin(x * 0.2 + z * 0.13 + semente)); cores.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cores, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); m.receiveShadow = true;
  return m;
}

// ---------- nuvens fofas (esferas agrupadas) ----------
export function criarNuvens(n = 9, semente = 3) {
  const g = new THREE.Group(), r = rnd(semente), mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.25 });
  for (let i = 0; i < n; i++) {
    const nv = new THREE.Group();
    for (let k = 0; k < 7; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); const rr = 2.2 + r() * 2.2; s.scale.set(rr, rr * 0.8, rr); s.position.set((k - 3) * 2.4 + r(), Math.sin(k / 6 * Math.PI) * 1.6 + r(), r() * 1.5); nv.add(s); }
    nv.position.set(-120 + r() * 240, 28 + r() * 26, -120 - r() * 60); nv.userData.v = 0.4 + r() * 0.6; g.add(nv);
  }
  g.userData.animar = (t) => g.children.forEach((nv, i) => { nv.position.x = ((nv.userData.x0 ??= nv.position.x) + t * nv.userData.v + 160) % 320 - 160; });
  return g;
}

// ---------- vegetação e objetos ----------
export function criarArvore(escala = 1, cor = '#5fb24a') {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 2.4, 8, 16), matSimples('#8a5a36', 0.85)); tronco.position.y = 1.4; g.add(tronco);
  const folha = matSimples(cor, 0.8);
  for (const [x, y, z, r] of [[0, 4.2, 0, 2.0], [-1.3, 3.5, 0.3, 1.4], [1.3, 3.6, -0.2, 1.5], [0.2, 5.3, -0.2, 1.3]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), folha); s.position.set(x, y, z); g.add(s); }
  g.scale.setScalar(escala); return sombra(g);
}
export function criarTenda(escala = 1, cor = '#d8b07a', listra = '#b0703a') {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(4.2 * (1 - t) ** 0.85 + 0.05, t * 4.4)); }
  const geo = new THREE.LatheGeometry(pts, 64, 0.35, Math.PI * 2 - 0.7);
  const cores = new Float32Array(geo.attributes.position.count * 3), a = new THREE.Color(cor), b = new THREE.Color(listra), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const ang = Math.atan2(p.getX(i), p.getZ(i)); const c = Math.sin(ang * 6) > 0.4 ? b : a; cores.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3)); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide })));
  const porta = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.0, 24, 1, true, -0.6, 1.2), matSimples('#3a2414', 0.9, { side: THREE.DoubleSide })); porta.position.set(0, 1.5, 0.15); porta.scale.z = 1.0; g.add(porta);
  const mastro = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.2, 4, 8), matSimples('#6a4a2a')); mastro.position.y = 4.8; g.add(mastro);
  g.scale.setScalar(escala); return sombra(g);
}
export function criarFlores(n = 260, area = 26, semente = 5) {
  const r = rnd(semente), geo = new THREE.SphereGeometry(0.16, 10, 8), mat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const im = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), cores = ['#ff7aa8', '#ffd84a', '#ffffff', '#b98cff', '#ff9a4a'];
  for (let i = 0; i < n; i++) {
    let x = (r() - 0.5) * area * 2, z = -r() * area * 1.4 + 6; if (Math.abs(x) < 7 && z > -4) x += Math.sign(x || 1) * 7;
    m4.makeTranslation(x, 0.18, z); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(cores[i % cores.length]));
  }
  return im;
}
export function criarPalmeira(escala = 1) {
  const g = new THREE.Group(), mt = matSimples('#a07040', 0.85);
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.42 - i * 0.02, 20, 12), mt); s.scale.set(1, 0.9, 1); s.position.set(Math.sin(i * 0.3) * 0.5, 0.4 + i * 0.85, 0); g.add(s); }
  const mf = matSimples('#4fa848', 0.75), topo = V(Math.sin(1.8) * 0.5, 6.4, 0);
  for (let k = 0; k < 8; k++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mf); f.scale.set(2.2, 0.16, 0.55);
    const a = k / 8 * Math.PI * 2; f.position.copy(topo).add(V(Math.cos(a) * 1.8, -0.3, Math.sin(a) * 1.8)); f.rotation.set(0, -a, -0.45); g.add(f);
  }
  g.scale.setScalar(escala); return sombra(g);
}
export function criarCasa(l = 6, a = 4, p = 5, cor = '#e2b884') {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(l, a, p, 4, 0.45), matSimples(cor, 0.9)); corpo.position.y = a / 2; g.add(corpo);
  const teto = new THREE.Mesh(new RoundedBoxGeometry(l + 0.5, 0.5, p + 0.5, 3, 0.2), matSimples(new THREE.Color(cor).multiplyScalar(0.85), 0.9)); teto.position.y = a + 0.2; g.add(teto);
  const porta = new THREE.Mesh(new RoundedBoxGeometry(1.4, 2.4, 0.3, 3, 0.25), matSimples('#5a3a22', 0.8)); porta.position.set(0, 1.2, p / 2); g.add(porta);
  const jan = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.0, 0.3, 3, 0.2), matSimples('#4a2f1c', 0.8)); jan.position.set(-l * 0.3, a * 0.65, p / 2); g.add(jan);
  return sombra(g);
}
export function criarZigurate() {
  const g = new THREE.Group(); let y = 0;
  [[22, 4, '#c79a68'], [16, 4, '#d2a774'], [11, 4, '#dcb381'], [6, 3.5, '#e4be8e']].forEach(([l, a, c]) => { const m = new THREE.Mesh(new RoundedBoxGeometry(l, a, l * 0.8, 3, 0.5), matSimples(c, 0.9)); m.position.y = y + a / 2; g.add(m); y += a; });
  const esc = new THREE.Mesh(new RoundedBoxGeometry(2.4, y, 3, 2, 0.3), matSimples('#b8875a', 0.9)); esc.position.set(0, y / 2, 8.6); esc.rotation.x = 0.55; g.add(esc);
  return sombra(g);
}
export function criarMontanhas(cor = '#9fb6c9', n = 9, semente = 7, dist = 150) {
  const g = new THREE.Group(), r = rnd(semente), mat = new THREE.MeshStandardMaterial({ color: cor, roughness: 1, fog: true });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat); const s = 20 + r() * 26; m.scale.set(s * 1.6, s * (0.55 + r() * 0.4), s); m.position.set(-200 + i * (400 / n) + r() * 20, -4, -dist - r() * 40); g.add(m); }
  return g;
}

// ---------- animais ----------
export function criarOvelha() {
  const g = new THREE.Group(), la = matSimples('#f7f4ec', 0.95), esc = matSimples('#3a2c26', 0.7), corpo = new THREE.Group();
  const r = rnd(9);
  for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 + r() * 0.15, 20, 14), la); const a = i / 12 * Math.PI * 2; s.position.set(Math.cos(a) * 0.62, 1.15 + Math.sin(a * 2) * 0.12 + r() * 0.1, Math.sin(a) * 0.35); corpo.add(s); }
  const miolo = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), la); miolo.scale.set(1.25, 0.8, 0.8); miolo.position.y = 1.15; corpo.add(miolo);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 14), esc); cab.scale.set(0.85, 1.05, 1.2); cab.position.set(1.2, 1.35, 0); corpo.add(cab);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), la); top.position.set(1.1, 1.68, 0); corpo.add(top);
  for (const z of [-0.12, 0.12]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), matSimples('#ffffff', 0.3)); o.position.set(1.48, 1.45, z); corpo.add(o); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), matSimples('#111111', 0.3)); pu.position.set(1.53, 1.45, z); corpo.add(pu); }
  g.add(corpo);
  const pernas = [[-0.55, -0.22], [-0.55, 0.22], [0.55, -0.22], [0.55, 0.22]].map(([x, z]) => { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 6, 10), esc); p.position.set(x, 0.38, z); g.add(p); return p; });
  g.userData.animar = (f) => { pernas.forEach((p, i) => { p.rotation.z = 0.45 * Math.sin(f + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)); }); corpo.position.y = 0.06 * Math.abs(Math.sin(f)); };
  return sombra(g);
}
export function criarCamelo() {
  const g = new THREE.Group(), c = matSimples('#cf9e66', 0.85), corpo = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), c); tronco.scale.set(1.9, 1.0, 0.95); tronco.position.y = 3.3; corpo.add(tronco);
  const corcova = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), c); corcova.scale.set(1.1, 0.9, 0.9); corcova.position.set(-0.2, 4.3, 0); corpo.add(corcova);
  const manta = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42), matSimples('#c8463a', 0.8)); manta.scale.set(1.25, 1.05, 1.0); manta.position.set(-0.2, 4.1, 0); corpo.add(manta);
  const pescoco = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.8, 8, 16), c); pescoco.position.set(2.0, 4.4, 0); pescoco.rotation.z = -0.55; corpo.add(pescoco);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), c); cab.scale.set(1.5, 0.85, 0.8); cab.position.set(2.75, 5.35, 0); corpo.add(cab);
  for (const z of [-0.3, 0.3]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matSimples('#1a1010', 0.3)); o.position.set(2.85, 5.55, z); corpo.add(o); }
  g.add(corpo);
  const pernas = [[-1.2, -0.45], [-1.2, 0.45], [1.2, -0.45], [1.2, 0.45]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 2.8, z); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 2.3, 8, 12), c); m.position.y = -1.35; p.add(m); g.add(p); return p; });
  g.userData.animar = (f) => { pernas.forEach((p, i) => { p.rotation.z = 0.35 * Math.sin(f + ((i % 2) ^ (i > 1 ? 1 : 0) ? Math.PI : 0)); }); corpo.position.y = 0.08 * Math.abs(Math.sin(f)); };
  return sombra(g);
}

// ---------- noite ----------
export function criarEstrelas(n = 1600) {
  const pos = new Float32Array(n * 3), r = rnd(21), tam = new Float32Array(n);
  for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, ph = Math.acos(0.15 + r() * 0.85); pos.set([Math.sin(ph) * Math.cos(th) * 260, Math.cos(ph) * 260, Math.sin(ph) * Math.sin(th) * 260], i * 3); tam[i] = r(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { t: { value: 0 }, mostrar: { value: 1 } },
    vertexShader: 'attribute float tam; uniform float t; uniform float mostrar; varying float a; void main(){ a = (0.55 + 0.45 * sin(t * (1.5 + tam * 3.0) + tam * 40.0)) * step(tam, mostrar); gl_PointSize = 2.0 + tam * 4.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float a; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.6, 1.55, 1.3), a * smoothstep(0.5, 0.1, d)); }' });
  const pts = new THREE.Points(g, mat); pts.userData.animar = (t, mostrar = 1) => { mat.uniforms.t.value = t; mat.uniforms.mostrar.value = mostrar; };
  return pts;
}
// estrelas grandes "da promessa" (brilham com bloom)
export function criarEstrelasGrandes(n = 40) {
  const g = new THREE.Group(), r = rnd(31), mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.0), toneMapped: false });
  const forma = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr = i % 2 ? 0.25 : 1; i ? forma.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : forma.moveTo(rr, 0); }
  const geo = new THREE.ShapeGeometry(forma);
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.position.set(-75 + r() * 150, 16 + r() * 34, -120 - r() * 15); m.userData.s = 1.5 + r() * 2.5; m.userData.ordem = r(); g.add(m); }
  g.userData.animar = (t, aparecer) => g.children.forEach((m) => { const k = THREE.MathUtils.clamp((aparecer - m.userData.ordem) * 5, 0, 1); m.scale.setScalar(m.userData.s * k * (0.85 + 0.15 * Math.sin(t * 4 + m.userData.s * 9))); m.visible = k > 0; });
  return g;
}
export function criarLua() {
  const g = new THREE.Group();
  const lua = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 1.9), toneMapped: false, fog: false })); g.add(lua);
  return g;
}
export function criarFogueira() {
  const g = new THREE.Group(), mt = matSimples('#5a3a22', 0.9);
  for (const a of [0.4, -0.4, 1.4]) { const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.6, 6, 10), mt); t.rotation.set(Math.PI / 2, 0, 0); t.rotation.y = a; t.position.y = 0.2; g.add(t); }
  // chama em várias "línguas" (núcleo amarelo, meio laranja, pontas vermelhas) + brilho
  const chamas = [];
  [['#ff4a12', 0.42, 1.7, 9], ['#ff9a1a', 0.32, 1.35, 7], ['#fff0a0', 0.2, 0.9, 5]].forEach(([c, r, h, n], camada) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + camada, d = camada === 2 ? 0.08 : 0.28 - camada * 0.1;
      const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 16, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.4), toneMapped: false, transparent: true, opacity: 0.85 }));
      m.scale.set(r * 0.7, h, r * 0.7); m.position.set(Math.cos(a) * d, 0.3 + h * 0.5, Math.sin(a) * d); m.userData.h = h; m.userData.f = i * 1.7 + camada; g.add(m); chamas.push(m);
    }
  });
  const brilho = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: '#ff8a30', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  brilho.position.y = 1.0; g.add(brilho);
  const luz = new THREE.PointLight('#ffaa55', 40, 30, 1.6); luz.position.y = 1.6; g.add(luz);
  g.userData.animar = (t) => { chamas.forEach((m) => { const f = m.userData.f, k = 0.8 + 0.18 * Math.sin(t * 15 + f) + 0.1 * Math.sin(t * 6.3 + f * 2); m.scale.y = m.userData.h * k; m.position.y = 0.3 + m.userData.h * 0.5 * k; m.rotation.z = 0.12 * Math.sin(t * 8 + f); }); luz.intensity = 34 + 10 * Math.sin(t * 13) + 6 * Math.sin(t * 5.1); brilho.scale.setScalar(0.8 + 0.06 * Math.sin(t * 11)); };
  return g;
}
// feixe de luz do céu (aditivo, macio)
export function criarFeixe(cor = '#fff1c8') {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { cor: { value: new THREE.Color(cor) }, forca: { value: 0.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 cor; uniform float forca; varying vec2 vUv; void main(){ float a = pow(vUv.y, 1.6) * forca * (0.6 + 0.4 * sin(vUv.x * 40.0)); gl_FragColor = vec4(cor * a, a); }' });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 7, 60, 48, 1, true), mat); cone.position.y = 30; g.add(cone);
  g.userData.forca = (f) => { mat.uniforms.forca.value = f; };
  return g;
}
// confete caindo (instanciado)
export function criarConfete(n = 500) {
  const geo = new THREE.PlaneGeometry(0.22, 0.14), mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
  const im = new THREE.InstancedMesh(geo, mat, n), r = rnd(77), dados = [], cores = ['#ff5a7a', '#ffd84a', '#5fd0a0', '#4ab0f0', '#a07aff', '#ff9a4a'];
  for (let i = 0; i < n; i++) { dados.push([(r() - 0.5) * 36, r() * 20, (r() - 0.5) * 16 - 2, 1 + r() * 1.5, r() * 6]); im.setColorAt(i, new THREE.Color(cores[i % 6]).multiplyScalar(1.3)); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  im.userData.animar = (t) => { dados.forEach(([x, y0, z, v, f], i) => { const y = ((y0 - t * v) % 20 + 20) % 20 - 1; e.set(t * 3 + f, t * 2 + f, f); q.setFromEuler(e); m4.compose(V(x + Math.sin(t * 2 + f) * 0.6, y, z), q, s); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
  return im;
}
