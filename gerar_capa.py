#!/usr/bin/env python3
"""Gera a capa (1080x1920) do vídeo "5 fatos que parecem mentira".

O conteúdo principal fica na faixa central, que é o que aparece
no grid do perfil (recorte 3:4) do TikTok/Reels.

Uso: python3 gerar_capa.py  ->  gera capa.png
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

from gerar_video import FONT_BLACK, H, W, emoji_img, fonte, fundo, texto_contorno

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "capa.png")


def main():
    img = fundo((40, 10, 70), (200, 20, 80), 0.3).convert("RGBA")

    # raios saindo do centro
    raios = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(raios)
    cx, cy = W / 2, 1000
    for k in range(18):
        a0 = 2 * math.pi * k / 18
        a1 = a0 + math.pi / 18
        d.polygon([(cx, cy),
                   (cx + 2000 * math.cos(a0), cy + 2000 * math.sin(a0)),
                   (cx + 2000 * math.cos(a1), cy + 2000 * math.sin(a1))],
                  fill=(255, 255, 255, 22))
    img = Image.alpha_composite(img, raios)

    # brilho atrás do emoji principal
    brilho = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(brilho).ellipse((cx - 330, cy - 330, cx + 330, cy + 330),
                                   fill=(255, 220, 0, 150))
    img = Image.alpha_composite(img, brilho.filter(ImageFilter.GaussianBlur(90)))

    # emojis secundários em volta
    for ch, x, y, tam, ang in [("🐙", 190, 860, 220, 14), ("🍌", 890, 850, 210, -16),
                               ("🍯", 190, 1230, 210, -10), ("🌳", 890, 1220, 230, 12)]:
        e = emoji_img(ch, tam).rotate(ang, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(e, (int(x - e.width / 2), int(y - e.height / 2)))

    # emoji principal
    e = emoji_img("🤯", 470)
    img.alpha_composite(e, (int(cx - e.width / 2), int(cy - e.height / 2)))

    d = ImageDraw.Draw(img)

    # título
    f1 = fonte(FONT_BLACK, 170)
    texto_contorno(d, (W / 2, 330), "5 FATOS", f1, (255, 220, 0), 16)
    f2 = fonte(FONT_BLACK, 92)
    texto_contorno(d, (W / 2, 480), "QUE PARECEM", f2, (255, 255, 255), 12)
    # "MENTIRA" numa faixa vermelha inclinada
    f3 = fonte(FONT_BLACK, 140)
    tw = f3.getlength("MENTIRA")
    faixa = Image.new("RGBA", (int(tw + 120), 200), (0, 0, 0, 0))
    fd = ImageDraw.Draw(faixa)
    fd.rounded_rectangle((0, 15, faixa.width, 185), 30, fill=(230, 20, 40))
    fd.text((faixa.width / 2, 100), "MENTIRA", font=f3, fill=(255, 255, 255),
            anchor="mm", stroke_width=6, stroke_fill=(120, 0, 10))
    faixa = faixa.rotate(-4, expand=True, resample=Image.BICUBIC)
    img.alpha_composite(faixa, (int(W / 2 - faixa.width / 2), 520))
    d = ImageDraw.Draw(img)

    # chamada inferior
    f4 = fonte(FONT_BLACK, 78)
    texto_contorno(d, (W / 2, 1470), "MAS SÃO", f4, (255, 255, 255), 10)
    f5 = fonte(FONT_BLACK, 120)
    texto_contorno(d, (W / 2, 1590), "100% VERDADE", f5, (80, 255, 120), 14)

    # selo "O #2 VAI TE CHOCAR"
    f6 = fonte(FONT_BLACK, 52)
    selo_txt = "O #2 VAI TE CHOCAR"
    em = emoji_img("😳", 60)
    tw = f6.getlength(selo_txt)
    sw = tw + 20 + em.width + 100
    x0 = W / 2 - sw / 2
    d.rounded_rectangle((x0, 1700, x0 + sw, 1790), 45, fill=(255, 220, 0))
    d.text((x0 + 50, 1745), selo_txt, font=f6, fill=(20, 20, 20), anchor="lm")
    img.alpha_composite(em, (int(x0 + 50 + tw + 20), int(1745 - em.height / 2)))

    img.convert("RGB").save(OUT, quality=95)
    print("pronto:", OUT)


if __name__ == "__main__":
    main()
