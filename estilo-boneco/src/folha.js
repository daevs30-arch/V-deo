// Folha de modelo (?test=model): 4 personagens aleatórios de frente, perfil e ¾,
// uma linha com todas as expressões e bocas de fala, botão "Novo personagem" e lil-gui.
import * as THREE from 'three';
import GUI from 'lil-gui';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { createCharacter } from './character.js';
import { criarCabeca, EXPRESSOES, VISEMAS } from './face.js';
import { criarCabelo } from './hair.js';

// ---------- sorteio de parâmetros ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const PALETA = {
  pele: ['#f8d8c0', '#f3c9a6', '#e8b48c', '#c98f63', '#9a603e', '#6e4128'],
  cabelo: ['#24150e', '#4a2a18', '#7a3a18', '#c8562a', '#e8b848', '#ff5fa8', '#3f7fe0', '#8a5ad8'],
  olhos: ['#5a3418', '#2f7fe0', '#3f9a5a', '#7a4422', '#2c8a8a', '#6a4a9a'],
  roupa: ['#f2b632', '#4aa3df', '#e8507a', '#5dbb63', '#ff8a3d', '#8a5ad8', '#ef5b52', '#30c0b0'],
  calca: ['#3a4f9a', '#2f6f8f', '#7a5bc4', '#c9873a', '#3a3a5a'],
};
export function sortear(semente) {
  const r = mulberry32(semente), um = (a) => a[Math.floor(r() * a.length)];
  const x = r(), idade = x < 0.6 ? 'crianca' : (x < 0.8 ? 'bebe' : 'adulto');
  const menina = r() < 0.5;
  const penteado = menina ? um(['coquinhos', 'rabo', 'liso', 'gorro']) : um(['lateral', 'espetado', 'careca', 'gorro', 'lateral']);
  const roupa = idade === 'bebe' ? um(['macacao', 'camiseta']) : (menina ? um(['vestido', 'camiseta', 'macacao', 'polo']) : um(['camiseta', 'polo', 'macacao']));
  return {
    semente, idade, menina, penteado, roupa,
    pele: um(PALETA.pele), corCabelo: um(PALETA.cabelo), corOlhos: um(PALETA.olhos),
    corRoupa: um(PALETA.roupa), corCalca: um(PALETA.calca), corSapato: um(PALETA.roupa), corGorro: um(PALETA.roupa),
    oculos: idade === 'adulto' && r() < 0.5 ? '#141011' : null,
  };
}

// rótulo de texto como sprite
function rotulo(texto, tam = 0.5) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 96;
  const x = cv.getContext('2d'); x.font = '700 54px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#3a2a4a'; x.fillText(texto, 512, 48);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, toneMapped: false, depthTest: false })); s.scale.set(tam * 10.67, tam, 1); return s;
}

export function folhaDeModelo(P, { semente = 1, interativo = false } = {}) {
  const cena = new THREE.Group(); P.scene.add(cena);
  const lista = [0, 1, 2, 3].map((i) => sortear(semente * 97 + i * 13));
  const vistas = [['frente', 0], ['perfil', -Math.PI / 2], ['¾', -0.62]];
  const personagens = [];
  // 2 linhas × 2 personagens, cada um em 3 vistas
  lista.forEach((par, k) => {
    const linha = Math.floor(k / 2), col = k % 2;
    const yBase = linha === 0 ? 13.2 : 1.6;
    const orig = createCharacter({ ...par, res: 104 });
    orig.userData.expressao({ expressao: 'feliz' });
    vistas.forEach(([nome, ang], v) => {
      // o 1º é o original (anima); perfil e ¾ são clones com o mesmo esqueleto copiado
      const c = v === 0 ? orig : SkeletonUtils.clone(orig);
      const x = (col === 0 ? -14.2 : 2.2) + v * 4.0;
      c.position.set(x, yBase, 0); c.rotation.y = ang; cena.add(c); if (v === 0) personagens.push(c);
      const r = rotulo(nome, 0.42); r.position.set(x, yBase - 0.55, 1); cena.add(r);
    });
    const r = rotulo(`${par.idade} · ${par.penteado} · ${par.roupa}`, 0.5); r.position.set((col === 0 ? -14.2 : 2.2) + 4.0, yBase - 1.15, 1); cena.add(r);
  });
  // linha de expressões e bocas de fala (cabeça do 1º personagem)
  const exprs = [...Object.keys(EXPRESSOES).filter((e) => e !== 'neutro'), ...Object.keys(VISEMAS).map((v) => 'fala ' + v)];
  exprs.forEach((e, i) => {
    const p0 = lista[0], g = new THREE.Group();
    const cab = criarCabeca({ ...p0, semPescoco: true }); g.add(cab, criarCabelo(cab.userData.p, p0));
    if (e.startsWith('fala')) cab.userData.rosto({ expressao: 'neutro', visema: e.slice(5), fala: 1 }); else cab.userData.rosto({ expressao: e });
    g.scale.setScalar(0.95); g.position.set(-15.75 + i * 3.5, -2.6, 0); g.rotation.set(0.05, -0.15, 0); cena.add(g);
    const r = rotulo(e, 0.5); r.position.set(-15.75 + i * 3.5, -4.85, 1); cena.add(r);
  });
  // chão e enquadramento (lente longa: quase sem distorção, como folha de modelo)
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.18 }));
  chao.rotation.x = -Math.PI / 2; chao.position.y = 1.6; chao.receiveShadow = true; cena.add(chao);
  P.camera.fov = 12.6; P.camera.aspect = P.renderer.domElement.width / P.renderer.domElement.height; P.camera.updateProjectionMatrix();
  P.camera.position.set(0.0, 9.0, 136); P.camera.lookAt(0.0, 8.6, 0);
  P.luzes.chave.shadow.camera.left = -20; P.luzes.chave.shadow.camera.right = 20; P.luzes.chave.shadow.camera.top = 26; P.luzes.chave.shadow.camera.bottom = -8;
  P.luzes.chave.position.set(10, 30, 25); P.luzes.chave.target.position.set(0, 8, 0); P.scene.add(P.luzes.chave.target);
  P.luzes.chave.shadow.mapSize.set(4096, 4096); P.luzes.chave.shadow.normalBias = 0.08; P.luzes.chave.shadow.camera.updateProjectionMatrix();

  if (interativo) {
    // botão "Novo personagem" + lil-gui para ajustar ao vivo o 1º personagem
    const barra = document.getElementById('barra');
    const bt = document.createElement('button'); bt.textContent = 'Novo personagem';
    bt.onclick = () => { const u = new URL(location.href); u.searchParams.set('seed', String(Math.floor(Math.random() * 1e6))); location.href = u.toString(); };
    barra.appendChild(bt);
    const gui = new GUI({ title: 'Personagem 1' });
    const p = { ...lista[0] }, anim = { balancar: true, acenar: false, palmas: false, expressao: 'feliz', bpm: 100 };
    let editados = cena.children.filter((c) => c.userData && c.userData.params === undefined ? false : c.position.y === 13.2 && c.position.x < -6);
    const refazer = () => {
      for (const c of editados) cena.remove(c);
      const o = createCharacter({ ...p, res: 84 });
      editados = vistas.map(([, ang], v) => { const c = v === 0 ? o : SkeletonUtils.clone(o); c.position.set(-14.2 + v * 4.0, 13.2, 0); c.rotation.y = ang; cena.add(c); return c; });
      personagens[0] = o;
    };
    gui.add(p, 'idade', ['bebe', 'crianca', 'adulto']).onFinishChange(refazer);
    gui.add(p, 'menina').onFinishChange(refazer);
    gui.add(p, 'penteado', ['lateral', 'espetado', 'liso', 'coquinhos', 'rabo', 'careca', 'gorro']).onFinishChange(refazer);
    gui.add(p, 'roupa', ['camiseta', 'polo', 'vestido', 'macacao']).onFinishChange(refazer);
    for (const k of ['pele', 'corCabelo', 'corOlhos', 'corRoupa', 'corCalca', 'corSapato']) gui.addColor(p, k).onFinishChange(refazer);
    const ga = gui.addFolder('Animação');
    ga.add(anim, 'expressao', [...Object.keys(EXPRESSOES)]); ga.add(anim, 'balancar'); ga.add(anim, 'acenar'); ga.add(anim, 'palmas'); ga.add(anim, 'bpm', 60, 160, 1);
    const relogio = new THREE.Clock();
    const loop = () => {
      const t = relogio.getElapsedTime();
      personagens.forEach((c, i) => c.userData.animar(t + i * 0.13, { ...anim, acenar: anim.acenar && i === 0, palmas: anim.palmas && i === 0 }));
      P.render(); requestAnimationFrame(loop);
    };
    loop();
  }
  return { personagens, lista };
}
