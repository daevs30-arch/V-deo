"""Gera um vídeo vertical (1080x1920) de curiosidades com animação de
tipografia cinética + ilustrações flat, e trilha sonora sintetizada.

Uso: python3 gerar_video.py  ->  curiosidades.mp4
"""
import math
import random
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
FONT_BLACK = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf"

DARK = (24, 22, 38)
WHITE = (255, 255, 255)
YELLOW = (255, 214, 10)

INTRO, FACT, OUTRO = 3.5, 6.0, 3.5
TRANS = 0.45  # duração da transição em círculo

FACTS = [
    {
        "bg": (255, 94, 120), "accent": (255, 214, 10), "art": "octopus",
        "text": "O polvo tem ^3 ^corações e sangue ^azul!",
    },
    {
        "bg": (255, 170, 30), "accent": (24, 22, 38), "art": "honey",
        "text": "O mel nunca estraga. Acharam potes com ^3.000 ^anos no Egito!",
    },
    {
        "bg": (110, 80, 230), "accent": (255, 214, 10), "art": "venus",
        "text": "Em Vênus, um ^dia dura mais que um ^ano inteiro!",
    },
    {
        "bg": (30, 170, 220), "accent": (255, 214, 10), "art": "whale",
        "text": "O coração da baleia-azul é do tamanho de um ^carro!",
    },
    {
        "bg": (40, 40, 70), "accent": (255, 214, 10), "art": "bolt",
        "text": "Um raio é ^5x mais quente que a superfície do ^Sol!",
    },
]

TOTAL = INTRO + FACT * len(FACTS) + OUTRO


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_out_back(t, s=1.9):
    t = clamp(t) - 1
    return t * t * ((s + 1) * t + s) + 1


def ease_in_out(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- texto
_font_cache, _img_cache = {}, {}


def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


def text_img(txt, size, color, path=FONT_BLACK, box=None, stroke=0):
    """Renderiza um texto (opcionalmente com caixa de destaque) em RGBA."""
    key = (txt, size, color, path, box, stroke)
    if key in _img_cache:
        return _img_cache[key]
    f = font(path, size)
    l, t, r, b = f.getbbox(txt, stroke_width=stroke)
    pad = int(size * 0.18) if box else 4
    w, h = r - l + pad * 2, int(size * 1.25) + pad * 2
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if box:
        d.rounded_rectangle((0, 0, w - 1, h - 1), radius=int(size * 0.22), fill=box)
    d.text((pad - l, pad + (int(size * 1.25) - size) // 2 - 2), txt, font=f,
           fill=color, stroke_width=stroke, stroke_fill=DARK)
    _img_cache[key] = im
    return im


def paste_scaled(base, im, cx, cy, scale, rot=0.0):
    if scale <= 0.01:
        return
    w, h = im.size
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    sm = im.resize((nw, nh), Image.BILINEAR)
    if rot:
        sm = sm.rotate(rot, resample=Image.BILINEAR, expand=True)
    base.alpha_composite(sm, (int(cx - sm.width / 2), int(cy - sm.height / 2)))


def layout_words(text, size, max_w):
    """Quebra o texto em linhas; retorna lista de (palavra, destaque, x, y)."""
    f = font(FONT_BLACK, size)
    words = [(w[1:], True) if w.startswith("^") else (w, False) for w in text.split()]
    space = f.getlength(" ") * 1.5
    lines, cur, cur_w = [], [], 0
    for w, hl in words:
        ww = f.getlength(w) + (size * 0.36 if hl else 0)
        if cur and cur_w + space + ww > max_w:
            lines.append((cur, cur_w))
            cur, cur_w = [], 0
        cur_w += (space if cur else 0) + ww
        cur.append((w, hl, ww))
    lines.append((cur, cur_w))
    line_h = size * 1.38
    out = []
    for li, (ws, lw) in enumerate(lines):
        x = (W - lw) / 2
        y = li * line_h
        for w, hl, ww in ws:
            out.append((w, hl, x + ww / 2, y))
            x += ww + space
    return out, len(lines) * line_h


# ---------------------------------------------------------------- formas
def heart_poly(cx, cy, s):
    pts = []
    for i in range(60):
        a = i / 60 * 2 * math.pi
        x = 16 * math.sin(a) ** 3
        y = 13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)
        pts.append((cx + x * s, cy - y * s))
    return pts


def blob_line(d, pts, width, fill):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        d.line((x0, y0, x1, y1), fill=fill, width=int(width))
    for x, y in pts:
        r = width / 2
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def eyes(d, cx, cy, s, t, gap=0.5):
    blink = 0.12 if (t % 3.0) < 0.12 else 1.0
    for sx in (-1, 1):
        ex = cx + sx * gap * s
        d.ellipse((ex - 0.2 * s, cy - 0.24 * s * blink, ex + 0.2 * s, cy + 0.24 * s * blink),
                  fill=WHITE, outline=DARK, width=8)
        d.ellipse((ex - 0.09 * s, cy - 0.1 * s * blink, ex + 0.09 * s, cy + 0.1 * s * blink),
                  fill=DARK)


def art_octopus(d, cx, cy, s, t):
    body = (190, 70, 230)
    for i in range(8):
        base_x = cx + (i - 3.5) * 0.24 * s
        pts = []
        for k in range(14):
            u = k / 13
            x = base_x + (i - 3.5) * 0.12 * s * u + math.sin(t * 4 + i + u * 5) * 0.12 * s * u
            y = cy + 0.25 * s + u * 0.95 * s
            pts.append((x, y))
        blob_line(d, pts, 0.2 * s * 0.55 + 22, DARK)
        blob_line(d, pts, 0.2 * s * 0.55, body)
    d.ellipse((cx - 0.7 * s, cy - 0.9 * s, cx + 0.7 * s, cy + 0.55 * s),
              fill=body, outline=DARK, width=14)
    eyes(d, cx, cy - 0.12 * s, s, t, 0.3)
    d.arc((cx - 0.18 * s, cy + 0.05 * s, cx + 0.18 * s, cy + 0.3 * s), 20, 160, fill=DARK, width=10)
    for i in range(3):
        a = t * 1.6 + i * 2 * math.pi / 3
        hx, hy = cx + math.cos(a) * 1.05 * s, cy - 0.2 * s + math.sin(a) * 0.45 * s
        pulse = 1 + 0.15 * max(0, math.sin(t * 9 + i))
        hs = 0.022 * s * pulse
        d.polygon(heart_poly(hx, hy, hs), fill=(255, 40, 70), outline=DARK, width=8)


def art_honey(d, cx, cy, s, t):
    amber = (255, 190, 40)
    d.rounded_rectangle((cx - 0.7 * s, cy - 0.55 * s, cx + 0.7 * s, cy + 0.85 * s),
                        radius=int(0.25 * s), fill=amber, outline=DARK, width=14)
    d.rounded_rectangle((cx - 0.5 * s, cy - 0.85 * s, cx + 0.5 * s, cy - 0.5 * s),
                        radius=int(0.08 * s), fill=(150, 90, 40), outline=DARK, width=14)
    # gota escorrendo
    drip = 0.3 + 0.25 * (0.5 + 0.5 * math.sin(t * 2.2))
    d.rounded_rectangle((cx - 0.38 * s, cy - 0.58 * s, cx - 0.22 * s, cy - 0.5 * s + drip * s),
                        radius=int(0.08 * s), fill=(255, 150, 0), outline=DARK, width=8)
    d.rounded_rectangle((cx - 0.45 * s, cy + 0.05 * s, cx + 0.45 * s, cy + 0.5 * s),
                        radius=int(0.06 * s), fill=WHITE, outline=DARK, width=10)
    f = font(FONT_BLACK, int(0.3 * s))
    d.text((cx, cy + 0.28 * s), "MEL", font=f, fill=DARK, anchor="mm")
    eyes(d, cx, cy - 0.2 * s, s, t + 1, 0.28)
    # abelha orbitando
    a = t * 2.4
    bx, by = cx + math.cos(a) * 1.0 * s, cy - 0.3 * s + math.sin(a * 2) * 0.25 * s
    wing = 0.12 * s * (0.6 + 0.4 * abs(math.sin(t * 30)))
    d.ellipse((bx - 0.1 * s, by - 0.12 * s - wing, bx + 0.06 * s, by - 0.06 * s),
              fill=(220, 240, 255), outline=DARK, width=6)
    d.ellipse((bx - 0.16 * s, by - 0.1 * s, bx + 0.16 * s, by + 0.1 * s),
              fill=YELLOW, outline=DARK, width=7)
    d.line((bx - 0.03 * s, by - 0.09 * s, bx - 0.03 * s, by + 0.09 * s), fill=DARK, width=9)
    d.line((bx + 0.07 * s, by - 0.08 * s, bx + 0.07 * s, by + 0.08 * s), fill=DARK, width=9)


def art_venus(d, cx, cy, s, t):
    # órbita e sol
    d.ellipse((cx - 1.15 * s, cy - 0.45 * s, cx + 1.15 * s, cy + 0.45 * s),
              outline=(255, 255, 255, 120), width=6)
    sa = t * 0.9
    sx, sy = cx + math.cos(sa) * 1.15 * s, cy + math.sin(sa) * 0.45 * s
    behind = math.sin(sa) < 0

    def sun():
        for k in range(10):
            a = k / 10 * 2 * math.pi + t
            d.line((sx + math.cos(a) * 0.17 * s, sy + math.sin(a) * 0.17 * s,
                    sx + math.cos(a) * 0.26 * s, sy + math.sin(a) * 0.26 * s), fill=YELLOW, width=10)
        d.ellipse((sx - 0.15 * s, sy - 0.15 * s, sx + 0.15 * s, sy + 0.15 * s),
                  fill=YELLOW, outline=DARK, width=8)

    if behind:
        sun()
    r = 0.62 * s
    planet = Image.new("RGBA", (int(2 * r) + 4, int(2 * r) + 4), (0, 0, 0, 0))
    pd = ImageDraw.Draw(planet)
    pd.ellipse((2, 2, 2 * r, 2 * r), fill=(255, 160, 80))
    off = (t * 40) % (0.5 * s)
    for k in range(-2, 6):
        y = k * 0.25 * s + off * 0.5
        pd.ellipse((-0.2 * s + (k % 2) * 0.3 * s, y, 1.0 * s + (k % 2) * 0.3 * s, y + 0.1 * s),
                   fill=(235, 120, 60))
    mask = Image.new("L", planet.size, 0)
    ImageDraw.Draw(mask).ellipse((2, 2, 2 * r, 2 * r), fill=255)
    planet.putalpha(mask)
    d._image.alpha_composite(planet, (int(cx - r), int(cy - r)))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=DARK, width=14)
    eyes(d, cx, cy - 0.05 * s, s * 0.9, t + 2, 0.28)
    # boca "sonolenta"
    d.line((cx - 0.12 * s, cy + 0.3 * s, cx + 0.12 * s, cy + 0.3 * s), fill=DARK, width=10)
    if not behind:
        sun()
    zf = font(FONT_BLACK, int(0.2 * s))
    for k in range(3):
        ph = (t * 0.7 + k / 3) % 1
        d.text((cx + 0.55 * s + ph * 0.4 * s, cy - 0.6 * s - ph * 0.6 * s), "z",
               font=zf, fill=WHITE, anchor="mm")


def art_whale(d, cx, cy, s, t):
    # coração gigante pulsando + carro ao lado para comparar
    beat = t * 1.4 % 1
    pulse = 1 + 0.1 * math.exp(-beat * 8) + 0.05 * math.exp(-max(0, beat - 0.18) * 8) * (beat > 0.18)
    d.polygon(heart_poly(cx - 0.05 * s, cy - 0.1 * s, 0.045 * s * pulse),
              fill=(240, 50, 80), outline=DARK, width=14)
    eyes(d, cx - 0.05 * s, cy - 0.2 * s, s, t + 0.5, 0.3)
    d.arc((cx - 0.2 * s, cy - 0.1 * s, cx + 0.1 * s, cy + 0.12 * s), 20, 160, fill=DARK, width=10)
    # carro
    car_x = cx + 0.1 * s + math.sin(t * 2) * 0.03 * s
    car_y = cy + 1.05 * s
    cs = 0.55 * s
    d.rounded_rectangle((car_x - cs, car_y - 0.25 * cs, car_x + cs, car_y + 0.2 * cs),
                        radius=int(0.12 * cs), fill=YELLOW, outline=DARK, width=10)
    d.polygon([(car_x - 0.55 * cs, car_y - 0.24 * cs), (car_x - 0.35 * cs, car_y - 0.6 * cs),
               (car_x + 0.35 * cs, car_y - 0.6 * cs), (car_x + 0.6 * cs, car_y - 0.24 * cs)],
              fill=(180, 230, 255), outline=DARK, width=10)
    for wx in (-0.6, 0.6):
        d.ellipse((car_x + wx * cs - 0.2 * cs, car_y + 0.0 * cs, car_x + wx * cs + 0.2 * cs,
                   car_y + 0.4 * cs), fill=DARK)


def art_bolt(d, cx, cy, s, t):
    # sol pequeno
    sx, sy, sr = cx + 0.75 * s, cy + 0.55 * s, 0.25 * s
    for k in range(12):
        a = k / 12 * 2 * math.pi + t * 0.8
        d.line((sx + math.cos(a) * sr * 1.2, sy + math.sin(a) * sr * 1.2,
                sx + math.cos(a) * sr * 1.6, sy + math.sin(a) * sr * 1.6), fill=(255, 170, 30), width=10)
    d.ellipse((sx - sr, sy - sr, sx + sr, sy + sr), fill=(255, 170, 30), outline=DARK, width=10)
    # raio
    flash = 1.0 if (t * 2.5 % 1) < 0.08 else 0.0
    bolt = [(0.1, -1.0), (-0.45, 0.1), (-0.05, 0.1), (-0.25, 1.0), (0.45, -0.25),
            (0.05, -0.25), (0.3, -1.0)]
    pts = [(cx - 0.2 * s + x * s, cy + y * 0.85 * s) for x, y in bolt]
    if flash:
        glow = [(cx - 0.2 * s + x * s * 1.25, cy + y * 0.85 * s * 1.15) for x, y in bolt]
        d.polygon(glow, fill=(255, 255, 255))
    d.polygon(pts, fill=YELLOW, outline=DARK, width=14)
    eyes(d, cx - 0.12 * s, cy - 0.15 * s, s * 0.8, t + 1.3, 0.22)


ARTS = {"octopus": art_octopus, "honey": art_honey, "venus": art_venus,
        "whale": art_whale, "bolt": art_bolt}


# ---------------------------------------------------------------- fundo
random.seed(7)
PARTICLES = [(random.random(), random.random(), random.uniform(8, 22), random.uniform(0.3, 1.0),
              random.choice(["c", "s", "p"])) for _ in range(26)]


def background(im, color, t, seed=0):
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, H), fill=color)
    lighter = tuple(min(255, int(c + (255 - c) * 0.12)) for c in color)
    # raios girando ao fundo (sunburst)
    cx, cy = W / 2, H * 0.4
    for k in range(16):
        a0 = k / 16 * 2 * math.pi + t * 0.15
        a1 = a0 + math.pi / 16
        d.polygon([(cx, cy), (cx + math.cos(a0) * 2000, cy + math.sin(a0) * 2000),
                   (cx + math.cos(a1) * 2000, cy + math.sin(a1) * 2000)], fill=lighter)
    # partículas flutuando
    for i, (px, py, r, sp, kind) in enumerate(PARTICLES):
        x = (px * W + math.sin(t * sp + i + seed) * 40) % W
        y = (py * H - t * 60 * sp) % H
        c = (255, 255, 255)
        if kind == "c":
            d.ellipse((x - r, y - r, x + r, y + r), outline=c, width=5)
        elif kind == "s":
            d.rectangle((x - r, y - r, x + r, y + r), outline=c, width=5)
        else:
            d.line((x - r, y, x + r, y), fill=c, width=6)
            d.line((x, y - r, x, y + r), fill=c, width=6)
    return d


def progress(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    p = clamp(t / TOTAL)
    d.rounded_rectangle((60, 70, W - 60, 86), radius=8, fill=(255, 255, 255, 90))
    d.rounded_rectangle((60, 70, 60 + (W - 120) * p, 86), radius=8, fill=WHITE)


# ---------------------------------------------------------------- cenas
def scene_intro(t):
    im = Image.new("RGBA", (W, H))
    background(im, (255, 214, 10), t)
    d = ImageDraw.Draw(im)
    wob = math.sin(t * 3) * 3
    paste_scaled(im, text_img("VOCÊ", 170, WHITE, stroke=12), W / 2, H * 0.33,
                 ease_out_back((t - 0.1) / 0.45), wob)
    paste_scaled(im, text_img("SABIA?", 210, WHITE, stroke=14), W / 2, H * 0.45,
                 ease_out_back((t - 0.35) / 0.45), -wob)
    p = ease_out_back((t - 0.8) / 0.45)
    paste_scaled(im, text_img("5 CURIOSIDADES INCRÍVEIS", 64, WHITE, FONT_BOLD, box=DARK),
                 W / 2, H * 0.57, p)
    # ponto de interrogação gigante pulando
    qy = H * 0.76 - abs(math.sin(t * 4)) * 60
    paste_scaled(im, text_img("?", 300, (255, 94, 120), stroke=14), W / 2, qy,
                 ease_out_back((t - 1.1) / 0.5), math.sin(t * 2) * 12)
    progress(im, t)
    return im


def scene_fact(i, t):
    fct = FACTS[i]
    im = Image.new("RGBA", (W, H))
    background(im, fct["bg"], t, seed=i * 10)
    d = ImageDraw.Draw(im, "RGBA")

    # selo com número
    badge_s = ease_out_back((t - 0.15) / 0.45)
    paste_scaled(im, text_img(f"#{i + 1}", 120, DARK, box=YELLOW), W / 2, 250, badge_s,
                 math.sin(t * 2.5) * 4)
    paste_scaled(im, text_img("VOCÊ SABIA?", 50, WHITE, FONT_BOLD), W / 2, 365,
                 ease_out_cubic((t - 0.35) / 0.3))

    # ilustração
    art_scale = ease_out_back((t - 0.3) / 0.6)
    if art_scale > 0.02:
        s = 330 * art_scale
        cy = 780 + math.sin(t * 2.2) * 18
        ARTS[fct["art"]](d, W / 2, cy, s, t)

    # texto palavra por palavra
    words, block_h = layout_words(fct["text"], 84, W - 140)
    top = 1310
    for k, (w, hl, x, y) in enumerate(words):
        st = 0.9 + k * 0.13
        sc = ease_out_back((t - st) / 0.3)
        if hl:
            img = text_img(w, 84, DARK, box=fct["accent"] if fct["accent"] != DARK else YELLOW)
            if fct["accent"] == DARK:
                img = text_img(w, 84, YELLOW, box=DARK)
            rot = math.sin(t * 3 + k) * 3
        else:
            img = text_img(w, 84, WHITE, stroke=6)
            rot = 0
        paste_scaled(im, img, x, top + y + 50, sc, rot)

    # "pop" de saída: tudo encolhe levemente no fim
    progress(im, INTRO + i * FACT + t)
    return im


def scene_outro(t):
    im = Image.new("RGBA", (W, H))
    background(im, (255, 94, 120), t, seed=99)
    d = ImageDraw.Draw(im)
    paste_scaled(im, text_img("QUAL TE", 130, WHITE, stroke=10), W / 2, H * 0.32,
                 ease_out_back((t - 0.1) / 0.4), math.sin(t * 3) * 3)
    paste_scaled(im, text_img("SURPREENDEU?", 120, YELLOW, stroke=10), W / 2, H * 0.41,
                 ease_out_back((t - 0.3) / 0.4), -math.sin(t * 3) * 3)
    paste_scaled(im, text_img("Comenta aí embaixo!", 62, WHITE, FONT_BOLD, box=DARK),
                 W / 2, H * 0.52, ease_out_back((t - 0.6) / 0.4))
    # botão "seguir" com clique
    bs = ease_out_back((t - 1.0) / 0.4)
    click = 1 - 0.12 * math.exp(-max(0, t - 2.0) * 10) * (t > 2.0)
    paste_scaled(im, text_img("+ SEGUIR", 80, WHITE, box=(0, 149, 246)), W / 2, H * 0.68,
                 bs * click)
    if t > 1.5:
        hy = H * 0.68 + 140 - ease_in_out((t - 1.5) / 0.5) * 90
        hx = W / 2 + 120
        d.ellipse((hx - 34, hy - 34, hx + 34, hy + 34), fill=WHITE, outline=DARK, width=8)
        if 2.0 < t < 2.4:
            r = 60 + (t - 2.0) * 300
            d.ellipse((hx - r, hy - r, hx + r, hy + r), outline=WHITE, width=8)
    progress(im, INTRO + FACT * len(FACTS) + t)
    return im


SCENES = [(INTRO, scene_intro)] + [(FACT, (lambda i: lambda t: scene_fact(i, t))(i))
                                   for i in range(len(FACTS))] + [(OUTRO, scene_outro)]


def frame_at(time):
    start = 0.0
    for idx, (dur, fn) in enumerate(SCENES):
        if time < start + dur or idx == len(SCENES) - 1:
            lt = time - start
            im = fn(lt)
            if idx > 0 and lt < TRANS:
                prev_dur, prev_fn = SCENES[idx - 1]
                prev = prev_fn(prev_dur + lt)
                r = ease_in_out(lt / TRANS) * math.hypot(W, H) * 0.6
                mask = Image.new("L", (W, H), 0)
                ImageDraw.Draw(mask).ellipse((W / 2 - r, H * 0.45 - r, W / 2 + r, H * 0.45 + r),
                                             fill=255)
                prev.paste(im, (0, 0), mask)
                im = prev
            return im.convert("RGB")
        start += dur


# ---------------------------------------------------------------- áudio
SR = 44100


def make_audio(path):
    n = int(TOTAL * SR)
    out = np.zeros(n)
    bpm = 118
    beat = 60 / bpm
    tt = np.arange(int(SR * 0.4)) / SR
    kick = np.sin(2 * np.pi * (50 + 120 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
    rng = np.random.default_rng(1)
    hat = rng.standard_normal(int(SR * 0.05)) * np.exp(-np.arange(int(SR * 0.05)) / SR * 80)
    hat = np.diff(hat, prepend=0)
    chords = [(261.6, 329.6, 392.0), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6),
              (196.0, 246.9, 293.7)]
    bass = [65.4, 55.0, 43.7, 49.0]

    def add(sig, at, gain):
        i = int(at * SR)
        j = min(n, i + len(sig))
        if i < n:
            out[i:j] += sig[: j - i] * gain

    nb = int(TOTAL / beat) + 1
    for b in range(nb):
        t0 = b * beat
        add(kick, t0, 0.55)
        add(hat, t0 + beat / 2, 0.12)
        if b % 2 == 1:
            add(hat, t0 + beat * 0.75, 0.06)
        bar = (b // 4) % 4
        ln = int(beat * SR)
        x = np.arange(ln) / SR
        env = np.exp(-x * 5)
        bs = np.sign(np.sin(2 * np.pi * bass[bar] * x)) * env * 0.6
        add(np.convolve(bs, np.ones(30) / 30, "same"), t0, 0.18)
        if b % 2 == 0:
            pl = np.zeros(ln * 2)
            xx = np.arange(ln * 2) / SR
            for k, f in enumerate(chords[bar]):
                pl += np.sin(2 * np.pi * f * 2 * (xx - k * 0.03).clip(0)) * np.exp(-xx * 4)
            add(pl, t0, 0.06)

    # whoosh nas transições e "pop" nas palavras
    start = 0.0
    for idx, (dur, _) in enumerate(SCENES):
        if idx > 0:
            ln = int(SR * 0.5)
            ns = rng.standard_normal(ln)
            ns = np.convolve(ns, np.ones(12) / 12, "same")
            env = np.sin(np.linspace(0, np.pi, ln)) ** 2
            add(ns * env, start - 0.1, 0.5)
        if 0 < idx <= len(FACTS):
            nw = len(FACTS[idx - 1]["text"].split())
            for k in range(nw):
                x = np.arange(int(SR * 0.07)) / SR
                pop = np.sin(2 * np.pi * (700 + 500 * np.exp(-x * 60)) * x) * np.exp(-x * 50)
                add(pop, start + 0.9 + k * 0.13 + 0.05, 0.12)
            x = np.arange(int(SR * 0.25)) / SR
            ding = (np.sin(2 * np.pi * 1320 * x) + 0.5 * np.sin(2 * np.pi * 1980 * x)) * np.exp(-x * 14)
            add(ding, start + 0.2, 0.15)
        start += dur

    fade = np.ones(n)
    fl = int(SR * 1.5)
    fade[-fl:] = np.linspace(1, 0, fl)
    out *= fade
    out /= max(1e-9, np.abs(out).max()) / 0.85
    pcm = (out * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def main(out="curiosidades.mp4", audio="/tmp/curiosidades_audio.wav"):
    import os
    import sys
    audio = os.environ.get("AUDIO_TMP", audio)
    make_audio(audio)
    nframes = int(TOTAL * FPS)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", audio,
         "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE)
    for f in range(nframes):
        proc.stdin.write(frame_at(f / FPS).tobytes())
        if f % 60 == 0:
            print(f"frame {f}/{nframes}", file=sys.stderr)
    proc.stdin.close()
    proc.wait()
    print("ok:", out)


if __name__ == "__main__":
    main()
