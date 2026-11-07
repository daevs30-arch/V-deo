"""Episódio 4: prestação de contas do deputado estadual Joel da Harpa
(Alepe, 2015-2027). O mascote narra sem dizer o próprio nome; o cartão final
usa a logomarca logo_jaboatao.png.

Fatos (conferidos em novembro de 2026):
- Três mandatos seguidos na Alepe: eleito em 2014, reeleito em 2018 e 2022;
  em 2026 ficou como suplente (28.919 votos).
- Presidiu a Comissão de Segurança Pública da Alepe.
- Autor da Lei nº 18.689/2024: merenda escolar adaptada para crianças com
  seletividade alimentar (crianças atípicas, como muitas autistas).
- Coordenou a frente parlamentar pela inclusão de estudantes com transtornos do
  neurodesenvolvimento e promoveu audiências sobre autismo na escola (Alepe).
- Autor da Lei nº 19.021/2025: proíbe o adestramento de animais com violência.
- Sob sua presidência, a Comissão de Segurança aprovou 71 projetos de lei em 2025 (Alepe).
- Autor da Lei nº 16.659/2019: cartazes em bares, restaurantes e casas de espetáculo
  com os números 190 e 180 para denunciar a violência contra a mulher.
- Autor da Lei nº 18.999/2025: programa estadual de incentivo ao desempenho escolar.
- Autor da lei de 2017 que incluiu o Dia dos Pais e o Dia das Mães no calendário
  oficial de Pernambuco (segundo o próprio deputado, em reportagens).

Uso: python3 roteiro_prestacao.py  ->  build/prestacao/audio.wav + timeline.json
Vozes próprias: vozes_prestacao/01_faisca.mp3 ...
"""
import os

import roteiro

BASE = os.path.dirname(os.path.abspath(__file__))

ROTEIRO = [
    ("faisca", "Doze anos, três mandatos e muito trabalho. Esta é a prestação de contas do "
               "deputado Joel da Harpa.", "gancho", 0.0),
    ("faisca", "Eleito em 2014 para a Assembleia Legislativa de Pernambuco, ele foi reeleito "
               "em 2018 e em 2022.", "trajetoria", 0.6),
    ("faisca", "Na segurança pública, presidiu a Comissão de Segurança da Assembleia e "
               "defendeu os policiais e bombeiros militares.", "seguranca", 0.5),
    ("faisca", "Pela proteção das mulheres, é autor da lei que obriga bares, restaurantes e "
               "casas de espetáculo a exibir cartazes com os números 190 e 180, para denunciar "
               "a violência contra a mulher.", "mulheres", 0.5),
    ("faisca", "Na inclusão, é autor da lei que garante merenda escolar adaptada para "
               "crianças com seletividade alimentar, como muitas crianças autistas.",
     "inclusao", 0.5),
    ("faisca", "Ele coordenou a frente parlamentar pela inclusão de estudantes com transtornos "
               "do neurodesenvolvimento e levou o tema do autismo na escola para audiências "
               "públicas.", "frente", 0.5),
    ("faisca", "Na educação, é autor da lei que cria o programa estadual de incentivo ao "
               "desempenho escolar, que reconhece e premia estudantes da rede pública que se "
               "destacam.", "educacao", 0.5),
    ("faisca", "E também é autor da lei que proíbe o adestramento de animais com violência "
               "em Pernambuco.", "animais", 0.5),
    ("faisca", "Pela família, é autor da lei que incluiu o Dia dos Pais e o Dia das Mães no "
               "calendário oficial de Pernambuco.", "familia", 0.5),
    ("faisca", "Agora, o mandato termina. Mas Joel da Harpa garante: mesmo sem mandato, "
               "vai continuar trabalhando por Pernambuco.", "final", 0.7),
    ("faisca", "Obrigado, Pernambuco, pela confiança de todos esses anos!", "final", 0.6),
]

EPISODIO = {
    "roteiro": ROTEIRO,
    "voices": {"faisca": roteiro.VOICES["faisca"]},
    "vozes": os.path.join(BASE, "vozes_prestacao"),
    "build": os.path.join(BASE, "build", "prestacao"),
    "intro": 0.4,
    "outro": 4.0,
    "musica": 0.45,
    "sfx": [("gancho", 0.1, "impacto", 0.6), ("gancho", 2.6, "whoosh", 0.4),
            ("trajetoria", 0.2, "subida", 0.3), ("seguranca", 0.2, "whoosh", 0.35),
            ("mulheres", 0.2, "pop", 0.3), ("inclusao", 0.2, "brilho", 0.3),
            ("frente", 0.2, "pop", 0.3), ("educacao", 0.2, "subida", 0.25),
            ("animais", 0.2, "cintilar", 0.3), ("familia", 0.2, "brilho", 0.25),
            ("final", 0.3, "whoosh_longo", 0.35), ("cartao", 0.1, "final", 0.4)],
}

if __name__ == "__main__":
    roteiro.gerar(EPISODIO)
