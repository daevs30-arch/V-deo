# Clipe 3D "Abraão Confiou"

Versão 3D (Three.js) do clipe, com os personagens de massinha do gerador
[`../estilo-boneco`](../estilo-boneco) e cenários 3D no mesmo estilo. A música, a letra
sincronizada e os textos sobre o vídeo (legenda karaokê, título, palavras grandes, cartão
final) vêm da versão 2D em [`../clipe`](../clipe).

Resultado: `../abraao_confiou_clipe_3d.mp4` (1920×1080, 24 fps, 2:52).

## Elenco (`../estilo-boneco/src/elenco.js`)

- **Professora/cantora:** cabelo castanho com risca, óculos pretos retangulares, pinta perto
  da boca, brincos de pérola, camiseta roxa e calça jeans clara.
- **Crianças:** quatro crianças com tons de pele, penteados e roupas diferentes.
- **Abraão:** barba branca, manto na cabeça com faixa, túnica com capa e cajado.
- **Sara:** véu, vestido longo e o bebê Isaque no colo.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Página do clipe. Abra pela raiz do repositório num servidor (`python3 -m http.server`) em `/clipe3d/index.html` e clique para tocar com a música; `?t=52` mostra um quadro fixo. |
| `js/clipe.js` | Personagens, cenas na linha do tempo da música, câmeras, luz por cena, boca sincronizada com a voz. |
| `js/cenario.js` | Céu, nuvens, terreno com relevo, árvores, tendas, flores, palmeiras, Ur e zigurate, camelo e ovelhas, estrelas, lua, fogueira, feixe de luz, confete. |
| `js/legenda.js` | Textos sobre o vídeo (os mesmos da versão 2D). |
| `previa.js` | `node previa.js <pasta> 12 47 63` salva quadros JPEG desses segundos. |
| `renderizar.js` | `node renderizar.js tudo ../abraao_confiou_clipe_3d.mp4 4` gera o vídeo (4 processos). Também dá para gerar por trechos que ficam salvos (`trechos <pasta> <de> <até>`) e juntar depois (`juntar <pasta>`). |

Requisitos: Node com Playwright (Chromium), ffmpeg, Python 3 e `npm install` em `../estilo-boneco`.
