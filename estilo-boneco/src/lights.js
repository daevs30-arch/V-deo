// Renderer, luzes e pós-processamento do estilo.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Saturação levemente aumentada (aplicada em espaço linear, antes do tone mapping).
const SaturacaoShader = {
  uniforms: { tDiffuse: { value: null }, saturacao: { value: 1.15 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float saturacao; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));
    gl_FragColor = vec4(max(mix(vec3(l), c.rgb, saturacao), 0.0), c.a); }`,
};

export function criarPalco(canvas, largura = 1920, altura = 1080) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(largura, altura, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // ambiente bem suave só para dar "luz que envolve"
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(32, largura / altura, 0.1, 500);

  // luz-chave quente (com sombra macia)
  const chave = new THREE.DirectionalLight('#ffe7cc', 2.6);
  chave.position.set(5, 8, 7); chave.castShadow = true;
  chave.shadow.mapSize.set(2048, 2048); chave.shadow.radius = 5; chave.shadow.bias = -0.0002; chave.shadow.normalBias = 0.05;
  Object.assign(chave.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 50 });
  scene.add(chave);
  // preenchimento azulado
  const preench = new THREE.DirectionalLight('#9fc4ff', 0.9); preench.position.set(-7, 2, 5); scene.add(preench);
  // rim light clara nas bordas
  const rim = new THREE.DirectionalLight('#ffffff', 2.0); rim.position.set(-3, 5, -8); scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#fff4e8', 1.2); rim2.position.set(6, 3, -6); scene.add(rim2);
  const ceu = new THREE.HemisphereLight('#e6f2ff', '#f5dcc4', 0.55); scene.add(ceu);

  // pós: render (com stencil para a boca) -> bloom sutil -> saturação -> ACES/sRGB
  const rt = new THREE.WebGLRenderTarget(largura, altura, { type: THREE.HalfFloatType, stencilBuffer: true, depthBuffer: true });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(largura, altura), 0.12, 0.4, 0.92);
  composer.addPass(bloom);
  const sat = new ShaderPass(SaturacaoShader); composer.addPass(sat);
  composer.addPass(new OutputPass());

  return { renderer, scene, camera, composer, luzes: { chave, preench, rim, rim2, ceu }, bloom, sat,
    render() { composer.render(); } };
}
