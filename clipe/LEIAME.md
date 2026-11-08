# Clipe "Abraão Confiou" (animação 2D)

Videoclipe infantil gospel em 1920×1080, 24 fps, desenhado em código (Canvas 2D)
no estilo das animações infantis modernas: cabeça grande, olhos enormes e
brilhantes, formas arredondadas e sombreado macio com aparência de volume.
Personagens: a cantora (cabelo castanho ondulado com risca lateral, óculos
pretos, pinta perto da boca, brincos de pérola, camiseta roxa e calça jeans
clara larga), crianças, Abraão, Sara e o bebê Isaque. A letra aparece em estilo karaokê, sincronizada palavra
por palavra.

Resultado: `../abraao_confiou_clipe.mp4`

## Estrutura

| Arquivo | O que tem |
|---|---|
| `index.html` | Página que desenha o clipe. Abra no navegador e clique para tocar com a música; `index.html?t=52` mostra um quadro fixo. |
| `js/base.js` | Utilidades, texturas (jeans, areia, grama) e leitura da música (voz/batida). |
| `js/cantora.js` | A cantora. |
| `js/personagens.js` | Abraão, Sara, bebê, crianças, camelo, ovelhas. |
| `js/cenarios.js` | Céu, deserto, prado, cidade de Ur, noite estrelada, fogueira, efeitos. |
| `js/roteiro.js` | Cenas na linha do tempo, legenda karaokê e transições. |
| `dados/letra.js` | Letra com o tempo de cada palavra (gerado por `gerar_letra.py`). |
| `dados/analise.js` | Batidas e nível da voz por quadro (para a boca e as palmas). |
| `renderizar.js` | Gera o MP4. |

## Como gerar o vídeo de novo

Requisitos: Node com Playwright (Chromium) e ffmpeg.

```bash
cd clipe
node renderizar.js ../abraao_confiou_clipe.mp4 4   # 4 = processos em paralelo
```

Para mudar uma cena, edite `js/roteiro.js` (lista `CENAS`, com início e fim em
segundos) e confira com `node previa.js <pasta> 52 65 77`, que salva quadros
JPEG desses segundos.

Para corrigir o tempo de uma frase, edite os tempos em `gerar_letra.py` e rode
`python3 gerar_letra.py`.
