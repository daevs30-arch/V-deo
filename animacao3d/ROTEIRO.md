# Por que o céu é azul? — roteiro e storyboard

Vídeo vertical (1080×1920, 30 fps, ~48 s) em 3D. O mascote **Faísca** explica uma
curiosidade para a **Lia** dentro da sala da casa dela.

## Personagens
- **Faísca** — mascote laranja, corpo de cubo arredondado, olhos de cápsula, bochechas
  rosadas e uma antena com estrela que brilha mais forte quando ele explica. Flutua,
  gesticula e acena.
- **Lia** — menina curiosa de camiseta amarela e dois coquinhos no cabelo.

## Cenas
| # | Plano | O que acontece | Fala |
|---|-------|----------------|------|
| 1 | Externa | Câmera voa pelo jardim até a janela da casa. Título "Por que o céu é azul?" | — |
| 2 | Lia 1 | Lia olha o céu pela janela e se vira para a câmera | **Lia:** Ei... por que o céu é azul? |
| 3 | Entrada | Faísca surge girando, com explosão de faíscas; Lia dá um pulinho; ele acena | **Faísca:** Oi, Lia! Ótima pergunta! Deixa eu te mostrar. |
| 4 | Luz | Holograma: um Sol aparece, o feixe branco passa por um prisma e vira arco-íris | **Faísca:** A luz do Sol parece branca, mas ela tem todas as cores do arco-íris misturadas. |
| 5 | Ar | Close no holograma: surgem as moléculas de ar | **Faísca:** Quando essa luz chega aqui, ela bate em pedacinhos minúsculos de ar. |
| 6 | Espalha | Partículas coloridas caem; as azuis ricocheteiam e enchem a sala; câmera recua | **Faísca:** E o azul é a cor que mais se espalha... por isso o céu é azul. |
| 7 | Lia 2 | Close na Lia, braços para cima | **Lia:** Uau! E por que o pôr do sol é laranja? |
| 8 | Pôr do sol | Os dois olham a janela; céu, Sol e luz da sala ficam laranja | **Faísca:** No fim do dia, a luz atravessa muito mais ar... |
| 9 | Final | Plano aberto, os dois acenam | **Lia:** Que demais! Valeu, Faísca! / **Faísca:** Curiosidade é o meu combustível! Até a próxima! |
| 10 | Cartão | "Gostou? Siga para mais curiosidades com o Faísca!" | — |

## Como gerar
```bash
sudo apt-get install espeak-ng mbrola mbrola-br1 mbrola-br4   # vozes
npm install                                                    # three.js
python3 roteiro.py        # vozes, trilha, efeitos e build/timeline.json
node render.mjs           # renderiza ../por_que_o_ceu_e_azul.mp4
node render.mjs --stills 5,20   # só alguns quadros, para conferir
```
Para fazer outro episódio, troque as falas em `roteiro.py` e as animações em `cena.html`.
