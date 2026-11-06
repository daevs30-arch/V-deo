"""Episódio 3: "Violência em Jaboatão: o que dizem os números" — o Faísca
apresenta sozinho, sobre uma maquete da cidade.

Números (conferidos em novembro de 2026):
- Alta de 2022 a 2023, com pico de 323 vítimas de CVLI em Jaboatão em 2023:
  SDS-PE, citada pelo Blog do Magno.
- AIS-6 (Jaboatão + Moreno), Mortes Violentas Intencionais: 622 em 2004,
  332 em 2024 e 277 em 2025 (-16,6%, menor número desde 2004):
  boletim da SDS-PE de 24/01/2026.

Uso: python3 roteiro_jaboatao.py  ->  build/jaboatao/audio.wav + timeline.json
Vozes próprias: vozes_jaboatao/01_faisca.mp3 ...
"""
import os

import roteiro

BASE = os.path.dirname(os.path.abspath(__file__))

ROTEIRO = [
    ("faisca", "Oi, eu sou o Faísca! Hoje o assunto é sério: a violência em Jaboatão dos "
               "Guararapes, aqui em Pernambuco.", "apresentacao", 1.4),
    ("faisca", "Segundo a Secretaria de Defesa Social, os assassinatos na cidade cresceram "
               "a partir de 2022 e chegaram ao pico em 2023, com 323 vítimas.", "alta", 0.8),
    ("faisca", "Mas os dados mais recentes mostram uma virada. Em 2025, a região de Jaboatão "
               "e Moreno teve 277 mortes violentas: quase dezessete por cento a menos que "
               "em 2024, e o menor número desde 2004.", "grafico", 0.8),
    ("faisca", "Isso não quer dizer que o problema acabou. Casos graves ainda acontecem, "
               "e cada número é uma vida.", "ainda", 0.9),
    ("faisca", "Por isso, informação de qualidade importa. Em caso de emergência, ligue 190. "
               "Até a próxima!", "final", 0.8),
]

EPISODIO = {
    "roteiro": ROTEIRO,
    "voices": {"faisca": roteiro.VOICES["faisca"]},
    "vozes": os.path.join(BASE, "vozes_jaboatao"),
    "build": os.path.join(BASE, "build", "jaboatao"),
    "intro": 4.5,
    "outro": 4.0,
    "musica": 0.3,  # trilha mais baixa: o tema é sério
    "sfx": [("apresentacao", -0.4, "whoosh", 0.4), ("apresentacao", 0.3, "pop", 0.4),
            ("alta", 0.2, "subida", 0.25), ("grafico", 0.2, "whoosh_longo", 0.3),
            ("final", 0.3, "brilho", 0.25)],
}

if __name__ == "__main__":
    roteiro.gerar(EPISODIO)
