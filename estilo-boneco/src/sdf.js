// Modelagem "massinha": funções de distância (SDF) unidas suavemente e
// convertidas em UMA malha lisa com o MarchingCubes do Three.js.
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// união / interseção suaves (k = raio da "massa" na emenda)
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a, b, k) => -smin(-a, -b, k);

// esfera
export const sdEsfera = (c, r) => (x, y, z) => Math.hypot(x - c.x, y - c.y, z - c.z) - r;
// elipsoide (aproximação boa para formas fofas)
export const sdElipsoide = (c, r) => (x, y, z) => {
  const k0 = Math.hypot((x - c.x) / r.x, (y - c.y) / r.y, (z - c.z) / r.z);
  const k1 = Math.hypot((x - c.x) / (r.x * r.x), (y - c.y) / (r.y * r.y), (z - c.z) / (r.z * r.z));
  return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(r.x, r.y, r.z);
};
// cápsula afunilada entre a (raio ra) e b (raio rb)
export const sdCapsula = (a, b, ra, rb) => {
  const ab = b.clone().sub(a), l2 = ab.lengthSq();
  return (x, y, z) => {
    const px = x - a.x, py = y - a.y, pz = z - a.z;
    const t = Math.max(0, Math.min(1, (px * ab.x + py * ab.y + pz * ab.z) / l2));
    return Math.hypot(px - ab.x * t, py - ab.y * t, pz - ab.z * t) - (ra + (rb - ra) * t);
  };
};
// cadeia de cápsulas passando por vários pontos (membro contínuo, curva suave nas juntas)
export const sdCadeia = (pts, raios, k = 0.12) => {
  const partes = [];
  for (let i = 0; i < pts.length - 1; i++) partes.push(sdCapsula(pts[i], pts[i + 1], raios[i], raios[i + 1]));
  return (x, y, z) => { let d = partes[0](x, y, z); for (let i = 1; i < partes.length; i++) d = smin(d, partes[i](x, y, z), k); return d; };
};
// elipsoide orientado por uma base (mãos)
export const sdElipsoideBase = (c, r, ex, ey, ez) => {
  const f = sdElipsoide(new THREE.Vector3(), r);
  return (x, y, z) => {
    const px = x - c.x, py = y - c.y, pz = z - c.z;
    return f(px * ex.x + py * ex.y + pz * ex.z, px * ey.x + py * ey.y + pz * ey.z, px * ez.x + py * ez.y + pz * ez.z);
  };
};

// Gera a malha lisa de uma SDF dentro de uma caixa (centro, meia-extensão).
// Resultado: BufferGeometry indexada, com normais suaves (mergeVertices + computeVertexNormals).
export function malhaSDF(sdf, centro, ext, res = 96) {
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 600000);
  mc.isolation = 0;
  const n = mc.size, h = mc.halfsize, f = mc.field;
  for (let k = 0; k < n; k++) {
    const z = centro.z + ((k - h) / h) * ext.z;
    for (let j = 0; j < n; j++) {
      const y = centro.y + ((j - h) / h) * ext.y;
      const base = j * n + k * n * n;
      for (let i = 0; i < n; i++) f[base + i] = -sdf(centro.x + ((i - h) / h) * ext.x, y, z);
    }
  }
  mc.update();
  const cont = mc.count, pos = new Float32Array(cont * 3);
  for (let i = 0; i < cont; i++) {
    pos[i * 3] = centro.x + mc.positionArray[i * 3] * ext.x;
    pos[i * 3 + 1] = centro.y + mc.positionArray[i * 3 + 1] * ext.y;
    pos[i * 3 + 2] = centro.z + mc.positionArray[i * 3 + 2] * ext.z;
  }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  mc.geometry.dispose();
  return g;
}
