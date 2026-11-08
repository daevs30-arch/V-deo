// Renderer, luz, ambiente HDR e pós-processamento compartilhados por todas as cenas.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function criarPalco(canvas, W = 1920, H = 1080) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.08).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 400);

  // luz: principal quente (sombra macia), preenchimento do céu, contraluz (rim)
  const hemi = new THREE.HemisphereLight('#dff0ff', '#f3d7b8', 0.6); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff1e0', 2.4);
  key.position.set(4, 7, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.06;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 40 });
  scene.add(key);
  const rim = new THREE.DirectionalLight('#cfe4ff', 1.6); rim.position.set(-5, 4, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffe6f0', 0.5); fill.position.set(-6, 1, 5); scene.add(fill);

  // pós: render com stencil -> GTAO (sombra de contato) -> bokeh (opcional) -> bloom (opcional) -> saída
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, stencilBuffer: true, depthBuffer: true, samples: 0 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // oclusão de ambiente (sombra de contato nas dobras, pescoço, sob o cabelo)
  const gtao = new SSAOPass(scene, camera, W, H, 32);
  gtao.kernelRadius = 0.35; gtao.minDistance = 0.0004; gtao.maxDistance = 0.04;
  composer.addPass(gtao);
  const bokeh = new BokehPass(scene, camera, { focus: 6, aperture: 0.002, maxblur: 0.008 }); bokeh.enabled = false; composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.6, 0.85); bloom.enabled = false; composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return { renderer, scene, camera, composer, key, rim, fill, hemi, gtao, bokeh, bloom };
}

// fundo de estúdio: gradiente suave com bolinhas de bokeh (para closes)
export function texturaFundo(c1, c2, pontos = true) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 576;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 576); g.addColorStop(0, c1); g.addColorStop(1, c2);
  x.fillStyle = g; x.fillRect(0, 0, 1024, 576);
  if (pontos) {
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 40; i++) {
      const px = r() * 1024, py = r() * 576, rr = 20 + r() * 60;
      const rg = x.createRadialGradient(px, py, 0, px, py, rr);
      rg.addColorStop(0, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = rg; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
