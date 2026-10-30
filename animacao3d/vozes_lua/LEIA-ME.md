# Vozes próprias — "Por que a Lua muda de forma?"

Coloque aqui um arquivo de áudio por fala (mp3, wav, m4a...), com o número da fala no
começo do nome. Falas sem arquivo continuam com a voz sintética.

| Arquivo | Personagem | Fala |
|---|---|---|
| `01_theo` | Theo | Ué... semana passada a Lua tava redondinha. Hoje ela tá pela metade! |
| `02_faisca` | Faísca | E aí, Theo! Quer saber um segredo? A Lua não muda de forma de verdade. |
| `03_faisca` | Faísca | Ela é uma bola, e o Sol ilumina sempre uma metade dela. |
| `04_faisca` | Faísca | Enquanto a Lua gira em volta da Terra, a gente vê pedaços diferentes dessa metade iluminada. |
| `05_theo` | Theo | Então, quando ela tá cheia, a gente vê toda a parte iluminada? |
| `06_faisca` | Faísca | Isso! E na Lua nova, a parte iluminada fica virada pro outro lado. Uma volta completa leva uns vinte e nove dias e meio. |
| `07_theo` | Theo | Que massa! Vou ficar de olho nela toda noite! |
| `08_faisca` | Faísca | Curiosidade é o meu combustível! Até a próxima! |

Depois rode:
`python3 roteiro_lua.py && node render.mjs --cena lua.html --build build/lua --out ../a_lua_muda_de_forma.mp4 --titulo "Por que a Lua muda de forma?"`
