// Peças compartilhadas entre os episódios: utilidades de animação, atalhos de
// geometria/material, o mascote Faísca e a camada de legendas/cartão final.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ------------------------------------------------------------ easing
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeBack = (t, s = 1.8) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ------------------------------------------------------------ geometria e materiais
export const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export function mesh(geo, mat, pos, parent, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const rbox = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 4, r);
export const sph = (r, a = 32, b = 20) => new THREE.SphereGeometry(r, a, b);
export const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 16);
export const cyl = (a, b, h, n = 32) => new THREE.CylinderGeometry(a, b, h, n);
export const glow = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity,
  depthWrite: false, blending: THREE.AdditiveBlending });

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Plaquinha de texto que sempre olha para a câmera
export function label(text, { color = '#ffffff', bg = 'rgba(29,27,46,.75)', size = 0.22 } = {}) {
  const font = '800 84px "Inter Display", Inter, sans-serif';
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = font;
  const tw = meas.measureText(text).width + 70;
  const cw = Math.max(512, Math.ceil(tw + 20));
  const tex = canvasTex(cw, 160, (g, w, h) => {
    g.font = font;
    g.fillStyle = bg; g.beginPath(); g.roundRect((w - tw) / 2, 20, tw, 120, 60); g.fill();
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 84);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.userData.aspect = cw / 160;  // largura/altura, para escalar sem distorcer
  s.scale.set(size * s.userData.aspect, size, 1);
  return s;
}

// ------------------------------------------------------------ Faísca
// Visual de bloco: corpo com cantos retos, olhos quadrados, bigode, chapéu de
// formatura e varinha de apontar na mão esquerda (o braço que aponta os hologramas).
function mustacheTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#16121c';
    g.beginPath();
    g.moveTo(256, 92);
    g.bezierCurveTo(300, 50, 360, 70, 390, 120);
    g.bezierCurveTo(415, 160, 470, 160, 488, 112);
    g.bezierCurveTo(500, 190, 410, 222, 350, 188);
    g.bezierCurveTo(310, 166, 280, 160, 256, 150);
    g.bezierCurveTo(232, 160, 202, 166, 162, 188);
    g.bezierCurveTo(102, 222, 12, 190, 24, 112);
    g.bezierCurveTo(42, 160, 97, 160, 122, 120);
    g.bezierCurveTo(152, 70, 212, 50, 256, 92);
    g.fill();
  });
}

export function makeFaisca() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const orange = M('#ee8048', { roughness: 0.55 });
  const BW = 0.92, BH = 0.74, BD = 0.7;
  mesh(new RoundedBoxGeometry(BW, BH, BD, 2, 0.015), orange, [0, 0, 0], body);
  const eyeM = M('#16121c', { roughness: 0.3 });
  const eyes = [];
  for (const sx of [-1, 1]) eyes.push(mesh(box(0.085, 0.1, 0.02), eyeM, [sx * 0.21, 0.1, BD / 2 + 0.006], body, false));
  // boca (abre por trás do bigode) e bigode, que sobe um pouco quando a boca abre
  const mouth = mesh(box(0.14, 0.06, 0.02), M('#5a1e22'), [0, -0.16, BD / 2 + 0.004], body, false);
  const mustache = mesh(new THREE.PlaneGeometry(0.56, 0.28), new THREE.MeshStandardMaterial({
    map: mustacheTex(), transparent: true, roughness: 0.6, alphaTest: 0.3 }), [0, -0.08, BD / 2 + 0.012], body, false);
  mouth.onBeforeRender = () => { mustache.position.y = -0.08 + (mouth.scale.y - 0.2) * 0.025; };
  // chapéu de formatura com borla dourada
  const hat = new THREE.Group(); hat.position.set(0.04, BH / 2, -0.02); hat.rotation.z = -0.08; body.add(hat);
  const black = M('#1b1922', { roughness: 0.6 });
  mesh(box(0.34, 0.1, 0.34), black, [0, 0.05, 0], hat);
  const board = mesh(box(0.62, 0.025, 0.62), black, [0, 0.11, 0], hat);
  board.rotation.y = Math.PI / 4;
  const gold = M('#e8b04a', { metalness: 0.4, roughness: 0.35, emissive: '#7a4a00', emissiveIntensity: 0.3 });
  const star = mesh(box(0.05, 0.03, 0.05), gold, [0, 0.135, 0], hat, false);  // botão do topo
  const cord = mesh(cyl(0.008, 0.008, 0.42, 6), gold, [0.21, 0.13, 0], hat, false);
  cord.rotation.z = Math.PI / 2;
  mesh(cyl(0.008, 0.008, 0.2, 6), gold, [0.42, 0.03, 0], hat, false);
  mesh(cyl(0.03, 0.022, 0.07, 8), gold, [0.42, -0.08, 0], hat, false);
  // braços de bloco; a varinha fica na mão esquerda
  const arms = [];
  for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(sx * (BW / 2 + 0.04), 0.0, 0.05); body.add(piv);
    mesh(box(0.1, 0.34, 0.1), orange, [0, -0.15, 0], piv);
    arms.push(piv);
  }
  const wand = new THREE.Group(); wand.position.set(0, -0.3, 0.02); arms[0].add(wand);
  mesh(cyl(0.012, 0.012, 0.62, 8), M('#5b3a26', { roughness: 0.5 }), [0, -0.28, 0], wand, false);
  mesh(sph(0.03, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' }), [0, -0.6, 0], wand, false);
  // quatro pernas de bloco (dois pares)
  const legs = [];
  for (const x of [-0.3, -0.16, 0.16, 0.3]) legs.push(mesh(box(0.12, 0.22, 0.16), orange, [x, -BH / 2 - 0.11, 0.05], body));
  return { root, body, eyes, mouth, arms, legs, star, mustache };
}

// ------------------------------------------------------------ legendas, título e cartão final
// Espera no HTML: #prog, #title, #flash, #sub (#who, #txt) e #card.
export function makeOverlay(TL, { names, colors, keyClass = () => '' }) {
  const $ = id => document.getElementById(id);
  const S = Object.fromEntries(TL.shots.map(s => [s.name, s]));
  let lastLine = null;
  return t => {
    $('prog').firstChild.style.width = (t / TL.total * 100).toFixed(2) + '%';
    const intro = TL.shots[1].start;
    const tin = easeBack((t - 0.4) / 0.6), tout = 1 - smooth((t - intro + 1.1) / 0.5);
    $('title').style.opacity = tout;
    $('title').style.transform = `scale(${tin}) rotate(${Math.sin(t * 2) * 1.5}deg)`;
    $('flash').style.opacity = clamp(1 - Math.abs(t - intro) / 0.3) * 0.9;

    const ln = TL.lines.find(l => t >= l.start - 0.15 && t <= l.end + 0.5);
    const sub = $('sub');
    if (!ln) sub.style.opacity = 0;
    else {
      if (ln !== lastLine) {
        lastLine = ln;
        $('who').textContent = names[ln.speaker];
        $('who').style.background = colors[ln.speaker];
        $('txt').innerHTML = ln.text.split(' ').map(w => `<span class="${keyClass(w, ln)}">${w}</span>`).join(' ');
      }
      const words = $('txt').children;
      const prog = clamp((t - ln.start) / (ln.end - ln.start) * 1.08);
      for (let i = 0; i < words.length; i++) words[i].style.opacity = i < Math.ceil(prog * words.length) || i === 0 ? 1 : 0.18;
      sub.style.opacity = clamp((t - ln.start + 0.15) / 0.15) * clamp((ln.end + 0.5 - t) / 0.2);
      sub.style.transform = `scale(${0.85 + 0.15 * easeBack((t - ln.start + 0.15) / 0.3)})`;
    }
    const c = S.cartao;
    $('card').style.opacity = smooth((t - c.start) / 0.4);
    $('card').style.transform = `scale(${0.8 + 0.2 * easeBack((t - c.start) / 0.5)})`;
  };
}
