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
  const tex = canvasTex(512, 160, (g, w, h) => {
    g.font = '800 84px "Inter Display", Inter, sans-serif';
    const tw = g.measureText(text).width + 70;
    g.fillStyle = bg; g.beginPath(); g.roundRect((w - tw) / 2, 20, tw, 120, 60); g.fill();
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 84);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(size * 3.2, size, 1);
  return s;
}

// ------------------------------------------------------------ Faísca
export function makeFaisca() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const orange = M('#f08a5d', { roughness: 0.4 });
  mesh(new RoundedBoxGeometry(0.9, 0.8, 0.72, 6, 0.24), orange, [0, 0, 0], body);
  const eyeM = M('#1d1b2e', { roughness: 0.2 });
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = mesh(cap(0.055, 0.12), eyeM, [sx * 0.17, 0.14, 0.34], body, false);
    eyes.push(e);
    mesh(sph(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), [0.02, 0.05, 0.045], e, false);
    const ch = mesh(sph(0.07, 16, 10), M('#ff8fa3', { roughness: 0.6 }), [sx * 0.29, 0.0, 0.33], body, false);
    ch.scale.set(1, 0.6, 0.3);
  }
  const mouth = mesh(sph(0.08, 20, 12), M('#5a1e22'), [0, -0.05, 0.35], body, false);
  mesh(cyl(0.018, 0.018, 0.25, 8), M('#6b4a3a'), [0, 0.5, 0], body);
  const star = mesh(new THREE.IcosahedronGeometry(0.09, 0), M('#ffd166', { emissive: '#ffb703', emissiveIntensity: 1.2, flatShading: true }), [0, 0.66, 0], body);
  const arms = [];
  for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(sx * 0.47, 0.0, 0); body.add(piv);
    mesh(cap(0.075, 0.22), orange, [0, -0.17, 0], piv);
    arms.push(piv);
  }
  const legs = [];
  for (const sx of [-1, 1]) legs.push(mesh(cap(0.08, 0.12), orange, [sx * 0.2, -0.5, 0], body));
  return { root, body, eyes, mouth, arms, legs, star };
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
