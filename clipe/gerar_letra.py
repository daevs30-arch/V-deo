#!/usr/bin/env python3
"""Gera dados/letra.js: cada linha da letra com o tempo (s) de cada palavra.
Tempos vêm da transcrição (Whisper, palavra a palavra) conferida à mão.
Formato da entrada: "texto da linha | t1 t2 t3 ..." (um tempo por palavra)."""
import json, os
SEC = {}
LINHAS = """
verso|Deus chamou Abraão pra caminhar | 15.72 17.00 17.64 18.34 18.64
verso|“Sai da tua terra, vem confiar!” | 21.78 22.40 22.88 23.28 25.20 25.48
verso|Sem saber pra onde ia chegar | 27.22 27.92 28.54 29.06 29.54 30.00
verso|Ele disse: “Eu vou Te obedecer!” | 32.82 33.04 34.42 34.64 34.92 35.18
pre|Passo a passo, pela fé | 39.02 39.22 39.36 39.96 40.62
pre|Ele foi sem duvidar | 41.56 42.00 42.34 42.78
pre|Quem confia no Senhor | 44.36 44.58 45.50 45.88
pre|Sempre pode acreditar! | 46.48 47.02 47.50
refrao|Abraão confiou! (Oh-oh!) | 49.94 50.72 51.20
refrao|Confiou no Senhor! (Oh-oh!) | 51.94 53.48 53.66 54.40
refrao|Se Deus prometeu, vai acontecer! | 55.84 55.98 56.22 57.24 57.50
refrao|Ele é fiel, Ele é fiel! | 58.84 59.36 59.88 60.38 60.72 61.00
estrelas|Estrelas no céu, promessa de amor! | 61.64 61.90 62.24 62.88 63.18 63.54
isaque|Isaque nasceu, milagre do Senhor! | 64.30 64.64 65.62 66.14 66.56
refrao|Se Deus falou, vai se cumprir! | 67.18 67.36 67.62 68.06 68.36 68.74
refrao|É só confiar e seguir! | 70.04 71.04 71.90 72.80 73.20
ponte|Confiar! (Confiar!) | 75.76 78.28
ponte|Acreditar! (Acreditar!) | 81.10 82.70
ponte|O Deus de Abraão | 84.20 84.42 84.64 85.16
ponte|Nunca vai falhar! | 86.26 87.50 87.90
refrao|Abraão confiou! (Oh-oh!) | 94.52 95.24 95.60
refrao|Nós também vamos confiar! | 95.96 97.04 97.36 97.78
refrao|Se Deus prometeu, vai acontecer! | 100.00 100.12 100.36 101.38 101.62
refrao|Ele nunca vai falhar! | 103.66 104.02 104.82 105.30
estrelas|Estrelas no céu, promessa de amor! | 105.66 106.12 106.40 107.02 107.34 107.64
isaque|Isaque nasceu, milagre do Senhor! | 108.50 108.84 109.82 110.28 110.70
refrao|Se Deus falou, vai se cumprir! | 111.32 111.52 111.82 112.34 112.50 112.86
refrao|É só confiar e seguir! | 114.20 115.20 116.12 116.90 117.30
ponte|Confiar! (Confiar!) | 119.90 122.52
ponte|Acreditar! (Acreditar!) | 125.44 127.00
refrao|Abraão confiou! (Oh-oh!) | 128.90 129.34 130.20
refrao|Confiou no Senhor! (Oh-oh!) | 131.64 132.06 132.20 133.00
refrao|Se Deus prometeu, vai acontecer! | 134.40 134.60 134.86 135.84 136.10
refrao|Ele é fiel, Ele é fiel! | 137.46 137.92 138.38 138.98 139.36 139.68
estrelas|Estrelas no céu, promessa de amor! | 140.02 140.58 140.90 141.50 141.80 142.18
isaque|Isaque nasceu, milagre do Senhor! | 142.88 143.26 144.28 144.76 145.18
refrao|Se Deus falou, vai se cumprir! | 145.94 146.00 146.24 146.70 147.00 147.38
refrao|É só confiar e seguir! | 148.88 149.78 150.54 151.20 151.60
ponte|Confiar! (Confiar!) | 154.26 156.96
ponte|Acreditar! (Acreditar!) | 159.50 160.88
final|O Deus de Abraão | 165.40 165.54 165.70 166.12
"""
def palavras(txt):
    # mantém "(Oh-oh!)" e "(Confiar!)" como uma palavra só
    out, buf = [], ''
    for tok in txt.split():
        if buf: buf += ' ' + tok
        elif tok.startswith('('): buf = tok
        else: out.append(tok); continue
        if buf.endswith(')') or buf.endswith(')!'): out.append(buf); buf = ''
    if buf: out.append(buf)
    return out
res = []
for ln in LINHAS.strip().splitlines():
    sec, resto = ln.split('|', 1)
    txt, ts = resto.split(' | ')
    ws, tt = palavras(txt.strip()), [float(x) for x in ts.split()]
    # palavras curtas ("E", "a"...) podem ter sido juntadas na transcrição: distribui
    if len(tt) < len(ws):
        tt = tt + [tt[-1] + 0.35 * (i + 1) for i in range(len(ws) - len(tt))]
    assert len(tt) == len(ws), (txt, ws, tt)
    res.append(dict(sec=sec, t0=round(tt[0] - 0.25, 2), p=[[w, t] for w, t in zip(ws, tt)]))
for i, l in enumerate(res):
    prox = res[i + 1]['t0'] if i + 1 < len(res) else 171.0
    l['t1'] = round(min(prox - 0.05, l['p'][-1][1] + 2.6), 2)
d = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(d, 'dados', 'letra.js'), 'w').write('window.LETRA=' + json.dumps(res, ensure_ascii=False) + ';\n')
print(len(res), 'linhas')
