# Estilo Boneco — gerador de personagens 3D (Three.js)

Gera **personagens originais** no estilo dos desenhos infantis 3D de YouTube: cabeça
grande, olhos enormes, corpo de "massinha" liso, cores vivas e luz macia. O projeto reproduz
o **estilo**, sem copiar personagens, roupas marcantes ou logotipos de nenhuma série.

## Como rodar

```bash
npm install                      # three + lil-gui
python3 -m http.server 8765      # (módulos ES precisam de um servidor)
# abra http://localhost:8765/index.html?test=model
```

| Página | O que mostra |
|---|---|
| `?test=model` | Folha de modelo: 4 personagens sorteados (frente, perfil e ¾), linha com todas as expressões e bocas de fala, botão **Novo personagem** e painel **lil-gui** para ajustar o 1º personagem e as animações ao vivo. `&seed=N` fixa o sorteio. |
| `?test=corpo` / `&vista=34` | Duas crianças de corpo inteiro, de frente ou de ¾. |
| `?test=anim&t=0.3` | Quadro de animação (aceno e palmas) no tempo `t`. |
| `?test=close` / `?test=rosto` | Closes de rosto e folha de rostos/expressões. |

Screenshot sem navegador aberto: `node foto.js "index.html?test=model&render=1" saida.png 1600`.

## API

```js
import { createCharacter, POSES } from './src/character.js';
const p = createCharacter({
  idade: 'crianca',            // 'bebe' | 'crianca' | 'adulto'
  menina: true,                // cílios grossos
  pele: '#9a603e', corCabelo: '#24150e', corOlhos: '#5a3418',
  penteado: 'coquinhos',       // 'lateral' | 'espetado' | 'liso' | 'coquinhos' | 'rabo' | 'careca' | 'gorro'
  roupa: 'vestido',            // 'camiseta' | 'polo' | 'vestido' | 'macacao'
  corRoupa: '#f2b632', corCalca: '#3a4f9a', corSapato: '#ff6f9a',
  oculos: '#141011',           // opcional
  pose: POSES.menina,
});
scene.add(p);
p.userData.expressao({ expressao: 'rindo' });              // feliz, rindo, surpreso, triste, desconfiado, bravo
p.userData.animar(t, { bpm: 100, acenar: true, palmas: false, visema: 'A', fala: 1 }); // a cada quadro
```

## Como é feito

- **Rosto** (`face.js`): crânio esculpido (testa grande, bochechas baixas e cheias, queixo
  pequeno) com rubor nos vértices; olhos em globo afundados com íris em gradiente, pupila,
  dois brilhos e pálpebras que piscam/semicerram; boca com cavidade real (stencil) com dentes
  e língua; sobrancelhas grossas. Expressões e bocas de fala A/E/O/M são números.
- **Cabelo** (`hair.js`): mechas grossas (tubos afunilados e achatados) que nascem por baixo
  do couro cabeludo, franja volumosa, coques lisos com relevo.
- **Corpo** (`character.js` + `sdf.js`): uma SDF com união suave (tronco em ovo, ombros,
  pescoço, braços, mãos-luva, pernas) vira **uma malha lisa** com `MarchingCubes`
  (`mergeVertices` + `computeVertexNormals`). Roupas são cascas da mesma SDF (~4% maiores);
  saia em sino (`LatheGeometry`).
- **Rig**: a malha vira `SkinnedMesh` num esqueleto hierárquico (quadril → coluna → peito →
  pescoço → cabeça; ombro → cotovelo → mão; coxa → joelho → tornozelo). Pesos automáticos
  pela peça da SDF mais próxima. Poses e animações (piscar, respirar, balançar no ritmo,
  acenar, bater palmas) só giram ossos: rodam em tempo real.
- **Luz** (`lights.js`): chave quente com sombra macia (PCFSoft), preenchimento azulado,
  rim light quente, ambiente suave; bloom sutil, saturação +15% e tone mapping ACES.

## Limitações conhecidas

- Gerar um personagem leva ~1–2 s (a malha de massinha é calculada uma vez); depois as
  poses são instantâneas.
- Ângulos de braço muito grandes (acima da cabeça) esticam a camiseta perto do ombro
  (limite do skinning linear). O aceno usa braço para o lado e antebraço para cima.
