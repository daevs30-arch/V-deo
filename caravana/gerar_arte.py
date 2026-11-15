#!/usr/bin/env python3
"""Arte "Caravana Love Life Conference 2027 - Inscrições abertas".

Inspirada na arte de referência (assets/referencia.jpg), trocando a
foto da palestrante pela foto recortada em assets/mulher_recortada.png.
A foto do grupo na parte de baixo é reaproveitada da referência.

Uso: python3 caravana/gerar_arte.py  ->  gera caravana/caravana_love_life_2027.png
"""
import math
import os
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))
A = lambda *p: os.path.join(BASE, *p)
W, H = 1320, 1650
OUT = A("caravana_love_life_2027.png")

GOLD_L = (250, 228, 160)
GOLD = (214, 172, 88)
GOLD_D = (150, 108, 40)
BG_D = (52, 8, 22)    # vinho escuro
BG = (118, 22, 48)    # vinho
TXT_PILULA = (70, 12, 30)


def fonte(nome, tam, peso=None):
    f = ImageFont.truetype(A("fonts", nome), tam)
    if peso is not None:
        try:
            f.set_variation_by_axes([peso])
        except Exception:
            pass
    return f


def gradiente_v(w, h, cores):
    """Gradiente vertical com várias paradas [(pos, rgb), ...]."""
    img = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        for (p0, c0), (p1, c1) in zip(cores, cores[1:]):
            if p0 <= t <= p1:
                k = (t - p0) / (p1 - p0 or 1)
                img.putpixel((0, y), tuple(int(c0[i] + (c1[i] - c0[i]) * k) for i in range(3)))
                break
    return img.resize((w, h))


def ouro(w, h):
    return gradiente_v(w, h, [(0, GOLD_L), (0.45, GOLD), (0.55, GOLD_D), (1, GOLD_L)])


def texto_ouro(img, xy, texto, f, anchor="mm", sombra=True):
    """Desenha texto preenchido com gradiente dourado."""
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).text(xy, texto, font=f, fill=255, anchor=anchor)
    if sombra:
        s = Image.new("RGBA", img.size, (0, 0, 0, 0))
        s.putalpha(mask.filter(ImageFilter.GaussianBlur(6)).point(lambda v: v * 0.7))
        img.alpha_composite(s, (3, 5))
    bb = mask.getbbox()
    camada = Image.new("RGBA", img.size, (0, 0, 0, 0))
    camada.paste(ouro(bb[2] - bb[0], bb[3] - bb[1]), bb[:2])
    camada.putalpha(mask)
    img.alpha_composite(camada)


def texto_branco(img, xy, texto, f, anchor="mm", cor=(255, 255, 255)):
    s = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(s).text((xy[0] + 3, xy[1] + 6), texto, font=f, fill=(0, 0, 0, 170), anchor=anchor)
    img.alpha_composite(s.filter(ImageFilter.GaussianBlur(6)))
    ImageDraw.Draw(img).text(xy, texto, font=f, fill=cor, anchor=anchor)


def bokeh(img):
    rnd = random.Random(7)
    cam = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(cam)
    for _ in range(30):
        x, y = rnd.randint(0, W), rnd.randint(-40, 620)
        # mais luzes nos cantos superiores
        if 380 < x < 1000 and y > 200 and rnd.random() < 0.7:
            continue
        r = rnd.randint(14, 55)
        a = rnd.randint(25, 75)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 215, 120, a))
    img.alpha_composite(cam.filter(ImageFilter.GaussianBlur(10)))


def aviao(tam, rot=-35):
    """Ícone simples de avião (dourado)."""
    s = 200
    m = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(m)
    c = s / 2
    d.rounded_rectangle((c - 12, 15, c + 12, s - 20), 12, fill=255)        # fuselagem
    d.polygon([(c - 8, 80), (15, 120), (15, 135), (c - 8, 115),
               (c + 8, 115), (s - 15, 135), (s - 15, 120), (c + 8, 80)], fill=255)  # asas
    d.polygon([(c - 6, 150), (55, 178), (55, 188), (c, 175),
               (s - 55, 188), (s - 55, 178), (c + 6, 150)], fill=255)  # cauda
    m = m.rotate(rot, resample=Image.BICUBIC, expand=True).resize((tam, tam), Image.LANCZOS)
    out = Image.new("RGBA", m.size, (0, 0, 0, 0))
    out.paste(ouro(*m.size), (0, 0))
    out.putalpha(m)
    return out


def coracao(tam):
    s = 200
    m = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((10, 20, 105, 115), fill=255)
    d.ellipse((95, 20, 190, 115), fill=255)
    d.polygon([(16, 85), (184, 85), (100, 185)], fill=255)
    m = m.resize((tam, tam), Image.LANCZOS)
    out = Image.new("RGBA", m.size, (0, 0, 0, 0))
    out.paste(ouro(*m.size), (0, 0))
    out.putalpha(m)
    return out


def faixa_onda(y0, amp, esp, fase, freq=1.0):
    """Máscara de uma faixa ondulada."""
    m = Image.new("L", (W, H), 0)
    top, bot = [], []
    for x in range(0, W + 1, 6):
        t = x / W
        yc = y0 + amp * math.sin(2 * math.pi * freq * t + fase)
        e = esp * (0.35 + 0.65 * math.sin(math.pi * t) ** 0.6)
        top.append((x, yc - e / 2))
        bot.append((x, yc + e / 2))
    ImageDraw.Draw(m).polygon(top + bot[::-1], fill=255)
    return m.filter(ImageFilter.GaussianBlur(1.2))


def pinta_ouro(img, mask, brilho=1.0):
    cam = Image.new("RGBA", img.size, (0, 0, 0, 0))
    o = ouro(W, H)
    if brilho != 1.0:
        o = o.point(lambda v: min(255, int(v * brilho)))
    cam.paste(o, (0, 0))
    cam.putalpha(mask)
    img.alpha_composite(cam)


def recorte(caminho, altura, fade_px, corte=None):
    """Abre um recorte PNG, ajusta a altura e esmaece a parte de baixo."""
    p = Image.open(A("assets", caminho)).convert("RGBA")
    bb = p.getchannel("A").getbbox()
    if corte:
        bb = (bb[0], bb[1], bb[2], min(bb[3], bb[1] + corte))
    p = p.crop(bb)
    p = p.resize((int(p.width * altura / p.height), altura), Image.LANCZOS)
    fade = Image.new("L", p.size, 255)
    fd = ImageDraw.Draw(fade)
    for i in range(fade_px):
        y = altura - fade_px + i
        fd.line((0, y, p.width, y), fill=int(255 * (1 - i / fade_px) ** 1.5))
    p.putalpha(ImageChops.multiply(p.getchannel("A"), fade))
    return p


def cola_com_sombra(img, p, x, y):
    sh = Image.new("RGBA", p.size, (0, 0, 0, 0))
    sh.putalpha(p.getchannel("A").point(lambda v: v * 0.55))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)), (x + 10, y + 10))
    img.alpha_composite(p, (x, y))


def main():
    gy = 1075  # topo da foto do grupo
    img = gradiente_v(W, H, [(0, BG_D), (0.2, BG), (0.5, BG_D), (1, BG_D)]).convert("RGBA")
    luz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(luz).ellipse((160, -100, 1160, 650), fill=(190, 60, 90, 90))
    img.alpha_composite(luz.filter(ImageFilter.GaussianBlur(120)))
    bokeh(img)

    # ---------- foto do grupo (reaproveitada da referência) ----------
    ref = Image.open(A("assets", "referencia.jpg")).convert("RGBA")
    grupo = ref.crop((0, 690, 1320, 1215))  # corta antes dos ícones do Instagram
    gm = Image.new("L", (W, H), 0)
    pts = [(x, gy + 25 + 30 * math.sin(2 * math.pi * x / W + 0.3)) for x in range(0, W + 1, 6)]
    ImageDraw.Draw(gm).polygon(pts + [(W, H), (0, H)], fill=255)
    gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gl.paste(grupo, (0, gy))
    gl.putalpha(ImageChops.multiply(gm, gl.getchannel("A")))
    img.alpha_composite(gl)

    # ---------- faixas douradas entre o topo e a foto ----------
    sombra = faixa_onda(gy + 10, 30, 70, 0.3)
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s.putalpha(sombra.filter(ImageFilter.GaussianBlur(14)).point(lambda v: v * 0.6))
    img.alpha_composite(s, (0, 8))
    pinta_ouro(img, faixa_onda(gy + 8, 30, 46, 0.3))
    pinta_ouro(img, faixa_onda(gy - 22, 34, 16, 0.6), 1.1)
    pinta_ouro(img, faixa_onda(gy + 46, 26, 8, 0.1), 0.9)

    # ---------- as duas pessoas lado a lado, com o rosto do mesmo tamanho ----------
    # o rosto ocupa ~29% da altura do recorte dela (vai até a calça) e ~48% do
    # recorte da Joyce (busto); as alturas abaixo deixam os dois rostos com ~215 px.
    topo = 590  # as duas cabeças começam na mesma altura
    m = recorte("mulher_recortada.png", 746, 150)
    j = recorte("joyce_recortada.png", 445, 110, corte=600)
    for p, cxp in ((m, 330), (j, 990)):
        x, y = cxp - p.width // 2, topo
        halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(halo).ellipse((x + 20, y - 30, x + p.width - 20, y + 520), fill=(255, 210, 120, 65))
        img.alpha_composite(halo.filter(ImageFilter.GaussianBlur(70)))
        glow = Image.new("RGBA", p.size, (255, 215, 130, 0))
        glow.putalpha(p.getchannel("A").filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(8)).point(lambda v: v * 0.6))
        img.alpha_composite(glow, (x, y))
        cola_com_sombra(img, p, x, y)

    # ---------- faixa creme de baixo ----------
    cm = Image.new("L", (W, H), 0)
    pts = [(x, H - 75 + 20 * math.sin(2 * math.pi * x / W + 3.4)) for x in range(0, W + 1, 6)]
    ImageDraw.Draw(cm).polygon(pts + [(W, H), (0, H)], fill=255)
    cre = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cre.paste(gradiente_v(W, H, [(0, (250, 243, 226)), (0.85, (250, 243, 226)), (1, (236, 220, 185))]), (0, 0))
    cre.putalpha(cm.filter(ImageFilter.GaussianBlur(1)))
    img.alpha_composite(cre)
    pinta_ouro(img, faixa_onda(H - 78, 20, 26, 3.4))
    pinta_ouro(img, faixa_onda(H - 48, 16, 7, 3.1), 0.9)

    # ---------- título (coluna da direita) ----------
    cx = W // 2
    texto_ouro(img, (cx - 20, 110), "Caravana", fonte("GreatVibes-Regular.ttf", 130))
    img.alpha_composite(aviao(80, rot=-55), (cx + 230, 40))
    curva = Image.new("L", (W, H), 0)
    ImageDraw.Draw(curva).arc((cx - 250, 75, cx + 250, 195), 20, 160, fill=255, width=4)
    pinta_ouro(img, curva.filter(ImageFilter.GaussianBlur(0.6)))

    texto_branco(img, (cx, 265), "LOVE LIFE", fonte("PlayfairDisplay.ttf", 120, 800))
    f_conf = fonte("PlayfairDisplay.ttf", 80, 500)
    f_ano = fonte("PlayfairDisplay.ttf", 88, 800)
    w_conf = f_conf.getlength("Conference ")
    w_ano = f_ano.getlength("2027")
    x0 = cx - (w_conf + w_ano) / 2
    texto_branco(img, (x0, 385), "Conference ", f_conf, anchor="ls")
    texto_ouro(img, (x0 + w_conf, 385), "2027", f_ano, anchor="ls")

    ly = 425
    linha = Image.new("L", (W, H), 0)
    ImageDraw.Draw(linha).line((cx - 290, ly, cx - 36, ly), fill=255, width=3)
    ImageDraw.Draw(linha).line((cx + 36, ly, cx + 290, ly), fill=255, width=3)
    pinta_ouro(img, linha)
    img.alpha_composite(coracao(42), (cx - 21, ly - 20))

    # pílula "Inscrições abertas!"
    bx0, by0, bx1, by1 = cx - 315, 455, cx + 315, 550
    pm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(pm).rounded_rectangle((bx0, by0, bx1, by1), 50, fill=255)
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s.putalpha(pm.filter(ImageFilter.GaussianBlur(12)).point(lambda v: v * 0.6))
    img.alpha_composite(s, (0, 8))
    pil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pil.paste(gradiente_v(bx1 - bx0, by1 - by0, [(0, (255, 244, 205)), (0.5, (240, 210, 140)), (1, (200, 150, 70))]), (bx0, by0))
    pil.putalpha(pm)
    img.alpha_composite(pil)
    ImageDraw.Draw(img).rounded_rectangle((bx0 + 6, by0 + 6, bx1 - 6, by1 - 6), 44,
                                          outline=(255, 250, 230), width=2)
    ImageDraw.Draw(img).text((cx, (by0 + by1) / 2 + 2), "Inscrições abertas!",
                             font=fonte("PlayfairDisplay-Italic.ttf", 60, 800),
                             fill=TXT_PILULA, anchor="mm")

    img.convert("RGB").save(OUT, quality=95)
    print("gerado:", OUT)


if __name__ == "__main__":
    main()
