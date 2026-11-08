// Materiais do estilo: MeshStandardMaterial, roughness 0.6–0.8, sem texturas realistas.
import * as THREE from 'three';

const PESSEGO = new THREE.Color('#ffb08a');

// Pele lisa e cremosa com "subsurface" falso: um emissive bem leve em tom pêssego.
export function matPele(cor, { vertexColors = false } = {}) {
  const c = new THREE.Color(cor);
  return new THREE.MeshPhysicalMaterial({
    color: vertexColors ? 0xffffff : c, vertexColors,
    roughness: 0.62, metalness: 0,
    sheen: 0.5, sheenColor: PESSEGO, sheenRoughness: 0.45, // brilho aveludado pêssego
    emissive: c.clone().lerp(PESSEGO, 0.6), emissiveIntensity: 0.06,
  });
}

// Roupa: cores chapadas e saturadas.
export function matRoupa(cor) {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.78, metalness: 0 });
}

// Cabelo tipo massinha: um pouco mais liso que a roupa para ganhar brilho em faixa.
export function matCabelo(cor) {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6, metalness: 0 });
}

export function matSimples(cor, roughness = 0.7, extra = {}) {
  return new THREE.MeshStandardMaterial({ color: cor, roughness, metalness: 0, ...extra });
}

// Brilho especular falso dos olhos (sempre branco, não recebe luz).
export const matBrilho = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
