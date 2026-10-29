#!/usr/bin/env python3
"""Gera um vídeo vertical (1080x1920) de curiosidades, sem rosto.

Requisitos: ffmpeg, espeak-ng + mbrola-br3, Pillow, numpy,
fontes Inter e Noto Color Emoji.

Uso: python3 gerar_video.py  ->  gera video.mp4
"""
import math
import os
import random
import subprocess
import tempfile
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, SR = 1080, 1920, 30, 44100
VOICE = "mb-br3"
FONT_BLACK = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FONT_EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "video.mp4")

# Cada cena: texto narrado, emoji, título curto na tela, cores do fundo.
CENAS = [
    dict(fala="Cinco fatos que parecem mentira, mas são cem por cento verdade. "
              "O último vai bugar a sua cabeça.",
         emoji="🤯", titulo="5 FATOS QUE PARECEM MENTIRA", num=None,
         cores=((40, 10, 70), (190, 20, 90))),
    dict(fala="Número um. O polvo tem três corações. E o sangue dele é azul.",
         emoji="🐙", titulo="3 CORAÇÕES E SANGUE AZUL", num=1,
         cores=((5, 30, 80), (20, 120, 200))),
    dict(fala="Número dois. Cleópatra viveu mais perto da invenção do iPhone "
              "do que da construção das pirâmides do Egito.",
         emoji="🏛️", titulo="CLEÓPATRA × IPHONE", num=2,
         cores=((70, 40, 5), (210, 140, 20))),
    dict(fala="Número três. A banana é levemente radioativa. "
              "Mas calma, você precisaria comer milhões para ter algum risco.",
         emoji="🍌", titulo="BANANA RADIOATIVA", num=3,
         cores=((30, 60, 5), (170, 200, 20))),
    dict(fala="Número quatro. O mel nunca estraga. Arqueólogos acharam mel "
              "com milhares de anos em tumbas no Egito, e ainda dava pra comer.",
         emoji="🍯", titulo="O MEL NUNCA ESTRAGA", num=4,
         cores=((80, 30, 0), (230, 120, 10))),
    dict(fala="Número cinco. Existem mais árvores no planeta Terra "
              "do que estrelas na nossa galáxia.",
         emoji="🌳", titulo="ÁRVORES > ESTRELAS", num=5,
         cores=((5, 10, 40), (20, 110, 70))),
    dict(fala="Qual desses você não sabia? Comenta aí. "
              "E segue pra ver a parte dois.",
         emoji="👇", titulo="SEGUE PRA PARTE 2", num=None,
         cores=((60, 5, 60), (220, 30, 120))),
]

PAUSA = 0.35  # silêncio entre cenas (s)


# ---------------------------------------------------------------- áudio
def tts(texto, caminho):
    subprocess.run(["espeak-ng", "-v", VOICE, "-s", "170", "-p", "45",
                    "-w", caminho, texto], check=True,
                   stderr=subprocess.DEVNULL)
    with wave.open(caminho) as w:
        sr = w.getframerate()
        dados = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    x = dados.astype(np.float32) / 32768.0
    # reamostra para SR
    n = int(len(x) * SR / sr)
    x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    # corta silêncio no fim
    nz = np.nonzero(np.abs(x) > 0.01)[0]
    if len(nz):
        x = x[: nz[-1] + int(0.05 * SR)]
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def musica(dur):
    """Batida lo-fi simples: acordes + kick + chimbal."""
    t = np.arange(int(dur * SR)) / SR
    bpm = 100
    beat = 60 / bpm
    acordes = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63),
               (261.63, 329.63, 392.0), (196.0, 246.94, 293.66)]
    out = np.zeros_like(t)
    compasso = beat * 4
    for i in range(int(dur / compasso) + 1):
        a, b = int(i * compasso * SR), int(min((i + 1) * compasso, dur) * SR)
        if a >= len(t):
            break
        tt = t[a:b] - t[a]
        env = np.minimum(1, tt * 4) * np.exp(-tt * 0.5)
        for f in acordes[i % 4]:
            out[a:b] += 0.06 * env * (np.sin(2 * np.pi * f * tt)
                                      + 0.3 * np.sin(2 * np.pi * f * 2 * tt))
        out[a:b] += 0.08 * env * np.sin(2 * np.pi * acordes[i % 4][0] / 2 * tt)
    rng = np.random.default_rng(1)
    for k in range(int(dur / beat) + 1):
        a = int(k * beat * SR)
        if a >= len(t):
            break
        n = min(int(0.25 * SR), len(t) - a)
        tt = np.arange(n) / SR
        f = 50 + 90 * np.exp(-tt * 30)
        out[a:a + n] += 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 12)
        h = int((k + 0.5) * beat * SR)
        if h < len(t):
            m = min(int(0.05 * SR), len(t) - h)
            out[h:h + m] += 0.04 * rng.standard_normal(m) * np.exp(-np.arange(m) / SR * 80)
    return out


def whoosh():
    n = int(0.45 * SR)
    rng = np.random.default_rng(7)
    ruido = rng.standard_normal(n)
    # passa-baixa móvel simples
    y = np.zeros(n)
    for i in range(1, n):
        a = 0.02 + 0.5 * (i / n)
        y[i] = y[i - 1] + a * (ruido[i] - y[i - 1])
    env = np.sin(np.pi * np.arange(n) / n) ** 2
    return 0.25 * y * env


# ---------------------------------------------------------------- visual
def fonte(caminho, tam):
    return ImageFont.truetype(caminho, tam)


_emoji_cache = {}


def emoji_img(ch, tam):
    if (ch, tam) not in _emoji_cache:
        f = ImageFont.truetype(FONT_EMOJI, 109)
        im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((80, 80), ch, font=f, embedded_color=True,
                                anchor="mm")
        im = im.crop(im.getbbox())
        im = im.resize((tam, int(tam * im.height / im.width)), Image.LANCZOS)
        _emoji_cache[(ch, tam)] = im
    return _emoji_cache[(ch, tam)]


def fundo(c1, c2, t):
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    onda = 0.5 + 0.5 * np.sin(2 * np.pi * (y * 0.8 + x * 0.3 - t * 0.15))
    m = (y * 0.7 + onda * 0.3)[..., None]
    img = np.array(c1, np.float32) * (1 - m) + np.array(c2, np.float32) * m
    # vinheta
    d = np.sqrt((x - 0.5) ** 2 + ((y - 0.5) * 1.3) ** 2)[..., None]
    img *= np.clip(1.15 - d * 0.9, 0.3, 1)
    return Image.fromarray(img.clip(0, 255).astype(np.uint8), "RGB")


PARTICULAS = [(random.Random(i).random(), random.Random(i + 99).random(),
               random.Random(i + 7).uniform(3, 9),
               random.Random(i + 3).uniform(0.02, 0.07)) for i in range(40)]


def texto_contorno(d, xy, s, f, cor, contorno=10, anchor="mm"):
    d.text(xy, s, font=f, fill=cor, anchor=anchor,
           stroke_width=contorno, stroke_fill=(0, 0, 0))


def quebrar(s, f, larg):
    linhas, atual = [], ""
    for p in s.split():
        teste = (atual + " " + p).strip()
        if f.getlength(teste) <= larg:
            atual = teste
        else:
            linhas.append(atual)
            atual = p
    linhas.append(atual)
    return linhas


def ease_back(x):
    x = min(max(x, 0), 1)
    c = 1.70158
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


def blocos_legenda(fala):
    """Divide a fala em blocos de até 3 palavras com tempo relativo."""
    palavras = fala.split()
    pesos = [len(p) + 2 + (6 if p[-1] in ".,?" else 0) for p in palavras]
    total = sum(pesos)
    acum, tempos = 0, []
    for p in pesos:
        tempos.append((acum / total, (acum + p) / total))
        acum += p
    blocos, i = [], 0
    while i < len(palavras):
        j = i + 1
        while j < len(palavras) and j - i < 3 and palavras[j - 1][-1] not in ".,?":
            j += 1
        blocos.append(list(range(i, j)))
        i = j
    return palavras, tempos, blocos


def quadro(cena, idx, tl, dur, tg, total, inicios):
    c1, c2 = cena["cores"]
    img = fundo(c1, c2, tg).convert("RGBA")
    camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)

    # partículas brilhantes
    for px, py, r, v in PARTICULAS:
        yy = (py - tg * v) % 1.0
        xx = px + 0.02 * math.sin(tg * 2 + py * 10)
        d.ellipse((xx * W - r, yy * H - r, xx * W + r, yy * H + r),
                  fill=(255, 255, 255, 70))
    camada = camada.filter(ImageFilter.GaussianBlur(2))
    img = Image.alpha_composite(img, camada)
    d = ImageDraw.Draw(img)

    # barras de progresso estilo stories
    n = len(CENAS)
    gap, margem = 10, 40
    lb = (W - 2 * margem - gap * (n - 1)) / n
    for k in range(n):
        x0 = margem + k * (lb + gap)
        d.rounded_rectangle((x0, 60, x0 + lb, 70), 5, fill=(255, 255, 255, 80))
        frac = 1 if k < idx else (tl / dur if k == idx else 0)
        if frac > 0:
            d.rounded_rectangle((x0, 60, x0 + max(10, lb * min(frac, 1)), 70), 5,
                                fill=(255, 255, 255, 255))

    # selo "VOCÊ SABIA?"
    fs = fonte(FONT_BLACK, 46)
    rot = "VOCÊ SABIA?"
    lw = fs.getlength(rot)
    d.rounded_rectangle((W / 2 - lw / 2 - 30, 120, W / 2 + lw / 2 + 30, 200), 40,
                        fill=(255, 220, 0))
    d.text((W / 2, 160), rot, font=fs, fill=(20, 20, 20), anchor="mm")

    # número grande
    entrada = ease_back(tl / 0.45)
    if cena["num"]:
        fn = fonte(FONT_BLACK, int(220 * max(entrada, 0.01)))
        texto_contorno(d, (W / 2, 390), f"#{cena['num']}", fn, (255, 220, 0), 12)

    # título da cena
    ft = fonte(FONT_BLACK, 84 if cena["num"] else 104)
    linhas = quebrar(cena["titulo"], ft, W - 120)
    y0 = 560 if cena["num"] else 330
    alt = 100 if cena["num"] else 125
    for k, ln in enumerate(linhas):
        e = ease_back((tl - 0.1 - 0.08 * k) / 0.4)
        if e <= 0:
            continue
        dx = (1 - e) * 300
        texto_contorno(d, (W / 2 + dx, y0 + k * alt), ln, ft, (255, 255, 255), 10)

    # emoji flutuando
    escala = ease_back((tl - 0.15) / 0.5)
    if escala > 0.02:
        tam = int(430 * escala)
        em = emoji_img(cena["emoji"], max(tam, 10))
        flut = 18 * math.sin(tg * 3)
        if idx == 0:  # tremida no gancho
            flut += 8 * math.sin(tg * 40)
        cy = 1050 + flut
        sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sombra).ellipse((W / 2 - tam * 0.4, 1290, W / 2 + tam * 0.4, 1330),
                                       fill=(0, 0, 0, 90))
        img = Image.alpha_composite(img, sombra.filter(ImageFilter.GaussianBlur(12)))
        img.alpha_composite(em, (int(W / 2 - em.width / 2), int(cy - em.height / 2)))
        d = ImageDraw.Draw(img)

    # legendas palavra a palavra
    palavras, tempos, blocos = blocos_legenda(cena["fala"])
    p = tl / dur
    atual = next((b for b in blocos if tempos[b[0]][0] <= p < tempos[b[-1]][1]),
                 blocos[-1] if p >= 1 else None)
    if atual:
        fl = fonte(FONT_BLACK, 92)
        idade = (p - tempos[atual[0]][0]) * dur
        pop = 0.85 + 0.15 * ease_back(idade / 0.18)
        fl = fonte(FONT_BLACK, int(92 * pop))
        txt = [palavras[i].upper() for i in atual]
        espaco = fl.getlength(" ")
        linhas_l, linha, larg = [], [], 0
        for i, w_ in zip(atual, txt):
            lw_ = fl.getlength(w_)
            if linha and larg + espaco + lw_ > W - 120:
                linhas_l.append(linha)
                linha, larg = [], 0
            linha.append((i, w_, lw_))
            larg += lw_ + (espaco if len(linha) > 1 else 0)
        linhas_l.append(linha)
        for k, ln in enumerate(linhas_l):
            tot = sum(x[2] for x in ln) + espaco * (len(ln) - 1)
            x = W / 2 - tot / 2
            y = 1520 + k * 115
            for i, w_, lw_ in ln:
                ativo = tempos[i][0] <= p < tempos[i][1] or (p >= 1 and i == atual[-1])
                cor = (255, 220, 0) if ativo else (255, 255, 255)
                texto_contorno(d, (x, y), w_, fl, cor, 9, anchor="lm")
                x += lw_ + espaco

    # flash branco na transição
    if tl < 0.12 and idx > 0:
        a = int(160 * (1 - tl / 0.12))
        img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (255, 255, 255, a)))

    return img.convert("RGB")


# ---------------------------------------------------------------- main
def main():
    tmp = tempfile.mkdtemp()
    vozes = [tts(c["fala"], os.path.join(tmp, f"v{i}.wav"))
             for i, c in enumerate(CENAS)]
    duracoes = [len(v) / SR + PAUSA + 0.25 for v in vozes]
    inicios = np.cumsum([0] + duracoes[:-1])
    total = sum(duracoes) + 0.6

    # mixagem
    mix = musica(total) * 0.35
    voz = np.zeros_like(mix)
    sw = whoosh()
    for i, (v, ini) in enumerate(zip(vozes, inicios)):
        a = int((ini + 0.25) * SR)
        voz[a:a + len(v)] += v
        if i > 0:
            b = max(0, int(ini * SR) - len(sw) // 2)
            mix[b:b + len(sw)] += sw[: len(mix) - b]
    # ducking: abaixa a música quando há voz
    env = np.convolve(np.abs(voz), np.ones(4410) / 4410, mode="same")
    mix *= 1 - 0.55 * np.clip(env * 8, 0, 1)
    final = np.clip(mix + voz, -1, 1)
    audio = os.path.join(tmp, "audio.wav")
    with wave.open(audio, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((final * 32767).astype(np.int16).tobytes())

    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-i", audio,
         "-af", "loudnorm=I=-14:TP=-1.5",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", "-shortest", OUT],
        stdin=subprocess.PIPE)
    nq = int(total * FPS)
    for f in range(nq):
        tg = f / FPS
        idx = min(int(np.searchsorted(inicios, tg, side="right")) - 1, len(CENAS) - 1)
        tl = tg - inicios[idx]
        img = quadro(CENAS[idx], idx, tl, duracoes[idx], tg, total, inicios)
        proc.stdin.write(img.tobytes())
        if f % 150 == 0:
            print(f"quadro {f}/{nq}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("pronto:", OUT, f"({total:.1f}s)")


if __name__ == "__main__":
    main()
