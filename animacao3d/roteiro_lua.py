"""Episódio 2: "Por que a Lua muda de forma?" — o Faísca explica as fases da
Lua para o Theo, no quintal, à noite.

Uso: python3 roteiro_lua.py  ->  build/lua/audio.wav + build/lua/timeline.json
Vozes próprias: vozes_lua/01_theo.mp3, vozes_lua/02_faisca.mp3 ...
"""
import os

import roteiro

BASE = os.path.dirname(os.path.abspath(__file__))

ROTEIRO = [
    ("theo", "Ué... semana passada a Lua tava redondinha. Hoje ela tá pela metade!", "theo1", 0.8),
    ("faisca", "E aí, Theo! Quer saber um segredo? A Lua não muda de forma de verdade.",
     "entrada", 2.2),
    ("faisca", "Ela é uma bola, e o Sol ilumina sempre uma metade dela.", "modelo", 1.0),
    ("faisca", "Enquanto a Lua gira em volta da Terra, a gente vê pedaços diferentes "
               "dessa metade iluminada.", "orbita", 0.8),
    ("theo", "Então, quando ela tá cheia, a gente vê toda a parte iluminada?", "theo2", 0.8),
    ("faisca", "Isso! E na Lua nova, a parte iluminada fica virada pro outro lado. "
               "Uma volta completa leva uns vinte e nove dias e meio.", "fases", 0.6),
    ("theo", "Que massa! Vou ficar de olho nela toda noite!", "final", 0.8),
    ("faisca", "Curiosidade é o meu combustível! Até a próxima!", "final", 0.3),
]

EPISODIO = {
    "roteiro": ROTEIRO,
    "voices": {
        "faisca": roteiro.VOICES["faisca"],
        "theo": ["-v", "mb-br3", "-s", "150", "-p", "90"],
    },
    "vozes": os.path.join(BASE, "vozes_lua"),
    "build": os.path.join(BASE, "build", "lua"),
    "intro": 4.5,
    "outro": 3.0,
    "sfx": [("theo1", -0.4, "whoosh", 0.5), ("entrada", 0.2, "whoosh_longo", 0.5),
            ("entrada", 1.2, "pop", 0.6), ("entrada", 1.25, "brilho", 0.35),
            ("modelo", 0.1, "subida", 0.35), ("orbita", 0.2, "cintilar", 0.3),
            ("fases", 0.3, "pop", 0.4), ("fases", 1.3, "pop", 0.4), ("fases", 2.3, "pop", 0.4),
            ("fases", 3.3, "pop", 0.4), ("cartao", 0.1, "final", 0.4)],
}

if __name__ == "__main__":
    roteiro.gerar(EPISODIO)
