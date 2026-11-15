#!/usr/bin/env python3
"""Arte v2 "Caravana Love Life Conference 2027 com Joyce Meyer".

Segue a segunda referência (assets/referencia2.jpg): fundo creme com faixas
douradas e cantos verdes, palestrante à esquerda, recado fixado com
alfinete, lista de benefícios, foto do evento e botão de WhatsApp.

Uso: python3 caravana/gerar_arte_v2.py  ->  gera caravana/caravana_love_life_2027_v2.png
"""
import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from gerar_arte import A, aviao, coracao, fonte, gradiente_v, ouro, recorte

W, H = 1320, 1440
OUT = A("caravana_love_life_2027_v2.png")

NOME = "Kelly"  # nome que aparece no recado
CIDADE = "Recife"

VERDE = (14, 62, 38)
VERDE_D = (6, 36, 22)
CREME = (250, 242, 224)
CREME_D = (232, 214, 178)


# ---------------------------------------------------------------- helpers
def bezier(pts, n=200):
    """Pontos de uma curva de Bézier cúbica."""
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = pts
    out = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3
        out.append((a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3))
    return out


def fita(img, pts, larg, brilho=1.0, sombra=True):
    """Fita dourada ao longo da curva, mais larga no meio."""
    m = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(m)
    n = len(pts)
    for i in range(n - 1):
        t = i / (n - 1)
        w = max(1, larg * (0.25 + 0.75 * math.sin(math.pi * t)))
        d.line([pts[i], pts[i + 1]], fill=255, width=int(w))
        r = w / 2
        d.ellipse((pts[i][0] - r, pts[i][1] - r, pts[i][0] + r, pts[i][1] + r), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(0.8))
    if sombra:
        s = Image.new("RGBA", img.size, (60, 40, 0, 0))
        s.putalpha(m.filter(ImageFilter.GaussianBlur(8)).point(lambda v: v * 0.45))
        img.alpha_composite(s, (2, 6))
    o = ouro(*img.size)
    if brilho != 1:
        o = o.point(lambda v: min(255, int(v * brilho)))
    c = Image.new("RGBA", img.size)
    c.paste(o, (0, 0))
    c.putalpha(m)
    img.alpha_composite(c)


def regiao(img, poligono, cor_topo, cor_base, blur=1):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).polygon(poligono, fill=255)
    c = Image.new("RGBA", img.size)
    c.paste(gradiente_v(*img.size, [(0, cor_topo), (1, cor_base)]), (0, 0))
    c.putalpha(m.filter(ImageFilter.GaussianBlur(blur)))
    img.alpha_composite(c)
    return m


def preenche_ouro(img, mask):
    bb = mask.getbbox()
    c = Image.new("RGBA", img.size, (0, 0, 0, 0))
    c.paste(ouro(bb[2] - bb[0], bb[3] - bb[1]), bb[:2])
    c.putalpha(mask)
    img.alpha_composite(c)


def texto_ouro(img, xy, txt, f, anchor="mm"):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).text(xy, txt, font=f, fill=255, anchor=anchor)
    s = Image.new("RGBA", img.size, (90, 60, 0, 0))
    s.putalpha(m.filter(ImageFilter.GaussianBlur(4)).point(lambda v: v * 0.35))
    img.alpha_composite(s, (2, 3))
    preenche_ouro(img, m)


def texto(img, xy, txt, f, cor, anchor="mm", sombra=0.25):
    if sombra:
        s = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(s).text((xy[0] + 2, xy[1] + 4), txt, font=f, fill=(0, 0, 0, int(255 * sombra)), anchor=anchor)
        img.alpha_composite(s.filter(ImageFilter.GaussianBlur(4)))
    ImageDraw.Draw(img).text(xy, txt, font=f, fill=cor, anchor=anchor)


def icone_mask(desenho, tam):
    """Cria ícone desenhado num canvas 200x200 e reduzido (antialias)."""
    m = Image.new("L", (200, 200), 0)
    desenho(ImageDraw.Draw(m))
    return m.resize((tam, tam), Image.LANCZOS)


def ic_calendario(d):
    d.rounded_rectangle((20, 35, 180, 185), 22, outline=255, width=14)
    d.rectangle((20, 35, 180, 75), fill=255)
    d.rounded_rectangle((52, 12, 68, 55), 6, fill=255)
    d.rounded_rectangle((132, 12, 148, 55), 6, fill=255)
    for i in range(3):
        for j in range(2):
            x, y = 55 + i * 45, 100 + j * 42
            d.rounded_rectangle((x - 12, y - 10, x + 12, y + 12), 4, fill=255)


def ic_cama(d):
    d.rounded_rectangle((20, 60, 40, 170), 6, fill=255)          # cabeceira
    d.rounded_rectangle((20, 115, 180, 145), 8, fill=255)        # colchão
    d.rounded_rectangle((165, 115, 182, 170), 6, fill=255)       # pé
    d.rounded_rectangle((48, 82, 95, 112), 12, fill=255)         # travesseiro
    d.rounded_rectangle((100, 88, 180, 112), 10, fill=255)       # coberta


def ic_pino(d):
    d.ellipse((45, 15, 155, 125), fill=255)
    d.polygon([(52, 95), (148, 95), (100, 188)], fill=255)
    d.ellipse((78, 48, 122, 92), fill=0)


def ic_whatsapp(d):
    d.ellipse((22, 18, 182, 178), outline=255, width=13)
    d.polygon([(30, 190), (42, 135), (75, 165)], fill=255)        # "rabinho" do balão
    # telefone
    d.rounded_rectangle((62, 58, 92, 92), 10, fill=255)
    d.rounded_rectangle((108, 108, 142, 138), 10, fill=255)
    d.line((76, 82, 82, 104, 100, 122, 120, 126), fill=255, width=22, joint="curve")


def ic_aviao_m(tam):
    a = aviao(tam, rot=-45)
    return a.getchannel("A")


def cola_mask(img, mask, xy, cor=None):
    c = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    if cor is None:
        c.paste(ouro(*mask.size), (0, 0))
    else:
        c.paste(cor, (0, 0, *mask.size))
    c.putalpha(mask)
    img.alpha_composite(c, xy)


def papel_rasgado(w, h, seed=3):
    rnd = random.Random(seed)
    pts = []
    for x in range(0, w + 1, 12):
        pts.append((x, rnd.uniform(0, 10)))
    for y in range(0, h + 1, 12):
        pts.append((w - rnd.uniform(0, 10), y))
    for x in range(w, -1, -12):
        pts.append((x, h - rnd.uniform(0, 12)))
    for y in range(h, -1, -12):
        pts.append((rnd.uniform(0, 10), y))
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    papel = Image.new("RGBA", (w, h))
    papel.paste(gradiente_v(w, h, [(0, (250, 244, 232)), (1, (236, 226, 206))]), (0, 0))
    # textura leve
    ruido = Image.effect_noise((w, h), 18).convert("L")
    papel = Image.composite(papel, Image.new("RGBA", (w, h), (225, 212, 188, 255)),
                            ruido.point(lambda v: 255 - v // 6))
    papel.putalpha(m)
    return papel


# ---------------------------------------------------------------- main
def main():
    # fundo creme com luz no centro
    img = gradiente_v(W, H, [(0, CREME), (0.6, CREME), (1, CREME_D)]).convert("RGBA")
    luz = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(luz).ellipse((300, 100, 1300, 1100), fill=(255, 250, 238, 150))
    img.alpha_composite(luz.filter(ImageFilter.GaussianBlur(150)))

    # canto verde superior esquerdo, com bokeh
    curva_sup = bezier([(0, 420), (120, 140), (420, 40), (820, 0)])
    regiao(img, [(0, 0)] + curva_sup + [(W, 0)][:0] + [(820, 0)], (22, 80, 46), VERDE_D, blur=2)
    rnd = random.Random(5)
    bk = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    db = ImageDraw.Draw(bk)
    for _ in range(14):
        x, y, r = rnd.randint(0, 520), rnd.randint(0, 260), rnd.randint(14, 40)
        db.ellipse((x - r, y - r, x + r, y + r), fill=(255, 225, 150, rnd.randint(40, 110)))
    cm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(cm).polygon([(0, 0)] + curva_sup, fill=255)
    bk.putalpha(ImageChops.multiply(bk.getchannel("A"), cm))
    img.alpha_composite(bk.filter(ImageFilter.GaussianBlur(6)))
    fita(img, curva_sup, 22)
    fita(img, bezier([(0, 470), (160, 170), (500, 70), (900, 30)]), 7, 1.1)

    # canto verde inferior esquerdo
    curva_inf = bezier([(0, 1180), (140, 1300), (400, 1380), (760, 1440)])
    regiao(img, curva_inf + [(0, H)], (22, 80, 46), VERDE_D, blur=2)

    # selo "Viagem com Economia" (recortado da referência)
    ref2 = Image.open(A("assets", "referencia2.jpg")).convert("RGBA")
    logo = ref2.crop((870, 0, 1150, 255)).convert("RGB").resize((290, 264), Image.LANCZOS)
    lx, ly = W - logo.width - 12, 12
    # o fundo do selo é claro: "multiplicar" faz ele sumir no creme
    reg = img.crop((lx, ly, lx + logo.width, ly + logo.height)).convert("RGB")
    mult = ImageChops.multiply(reg, logo.point(lambda v: min(255, int(v * 1.06))))
    lm = Image.new("L", logo.size, 0)
    ImageDraw.Draw(lm).ellipse((4, 4, logo.width - 4, logo.height - 4), fill=255)
    img.paste(mult, (lx, ly), lm.filter(ImageFilter.GaussianBlur(8)))

    # avião + rota tracejada
    rota = bezier([(470, 330), (540, 190), (660, 160), (790, 150)], 60)
    d = ImageDraw.Draw(img)
    for i in range(0, len(rota) - 1, 2):
        d.line([rota[i], rota[i + 1]], fill=(200, 160, 80), width=3)
    img.alpha_composite(aviao(90, rot=-75), (790, 100))

    # ---------- foto do evento (canto inferior direito) ----------
    ref = Image.open(A("assets", "referencia.jpg")).convert("RGBA")
    foto = ref.crop((150, 700, 1040, 1215)).resize((680, 394), Image.LANCZOS)
    fx, fy = W - 680, H - 394
    borda_foto = bezier([(fx - 40, H), (fx + 80, fy + 150), (fx + 300, fy + 60), (W + 10, fy + 20)])
    fm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(fm).polygon(borda_foto + [(W, H)], fill=255)
    camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    camada.paste(foto, (fx, fy))
    camada.putalpha(ImageChops.multiply(fm, camada.getchannel("A")))
    img.alpha_composite(camada)
    fita(img, borda_foto, 18)
    fita(img, bezier([(fx + 260, H + 10), (fx + 420, H - 70), (fx + 560, H - 110), (W + 10, H - 160)]), 14)

    # ---------- palestrante ----------
    p = recorte("mulher_recortada.png", 1100, 40)
    px, py = -80, 215
    sh = Image.new("RGBA", p.size, (0, 0, 0, 0))
    sh.putalpha(p.getchannel("A").point(lambda v: v * 0.35))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)), (px + 14, py + 12))
    img.alpha_composite(p, (px, py))

    # faixa verde/dourada que "segura" a base da foto dela
    base = bezier([(-20, 1290), (200, 1330), (450, 1340), (700, 1420)])
    regiao(img, base + [(700, H), (0, H)], (20, 74, 42), VERDE_D, blur=1)
    fita(img, base, 14)

    # ---------- título ----------
    cx = 850
    texto_ouro(img, (cx - 50, 262), "Caravana", fonte("GreatVibes-Regular.ttf", 128))
    texto(img, (cx, 395), "Love Life", fonte("PlayfairDisplay.ttf", 152, 800), VERDE, sombra=0.2)
    f_conf, f_ano = fonte("PlayfairDisplay.ttf", 84, 600), fonte("PlayfairDisplay.ttf", 88, 700)
    wc, wa = f_conf.getlength("Conference "), f_ano.getlength("2027")
    x0 = cx - (wc + wa) / 2
    texto(img, (x0, 548), "Conference ", f_conf, VERDE, anchor="ls", sombra=0.15)
    texto_ouro(img, (x0 + wc, 548), "2027", f_ano, anchor="ls")

    # pílula "com Joyce Meyer"
    bx0, by0, bx1, by1 = cx - 255, 578, cx + 255, 656
    pm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(pm).rounded_rectangle((bx0, by0, bx1, by1), 39, fill=255)
    s = Image.new("RGBA", (W, H), (70, 40, 0, 0))
    s.putalpha(pm.filter(ImageFilter.GaussianBlur(9)).point(lambda v: v * 0.45))
    img.alpha_composite(s, (0, 6))
    pil = Image.new("RGBA", (W, H))
    pil.paste(gradiente_v(bx1 - bx0, by1 - by0, [(0, (255, 240, 196)), (0.5, (234, 200, 124)), (1, (196, 146, 64))]), (bx0, by0))
    pil.putalpha(pm)
    img.alpha_composite(pil)
    f_com, f_jm = fonte("Montserrat.ttf", 38, 600), fonte("PlayfairDisplay-Italic.ttf", 58, 700)
    wcom, wjm = f_com.getlength("com "), f_jm.getlength("Joyce Meyer")
    tx = cx - (wcom + wjm) / 2
    d = ImageDraw.Draw(img)
    d.text((tx, 630), "com ", font=f_com, fill=VERDE, anchor="ls")
    d.text((tx + wcom, 634), "Joyce Meyer", font=f_jm, fill=VERDE, anchor="ls")

    # coração em contorno + traço
    hm = Image.new("L", (W, H), 0)
    dh = ImageDraw.Draw(hm)
    hx, hy = 1210, 600
    dh.arc((hx - 44, hy - 36, hx, hy + 8), 150, 360, fill=255, width=4)
    dh.arc((hx, hy - 36, hx + 44, hy + 8), 180, 30, fill=255, width=4)
    dh.line((hx - 41, hy - 4, hx, hy + 46, hx + 41, hy - 4), fill=255, width=4, joint="curve")
    dh.line([(x, hy + 46 + 20 * math.sin((x - hx) / 40)) for x in range(hx - 100, hx + 1, 4)], fill=255, width=3)
    preenche_ouro(img, hm)

    # calendário + frase
    cola_mask(img, icone_mask(ic_calendario, 74), (590, 690))
    f_b = fonte("Montserrat.ttf", 35, 800)
    d.text((685, 710), "A ÚLTIMA APRESENTAÇÃO", font=f_b, fill=VERDE, anchor="lm")
    d.text((685, 753), "DE JOYCE MEYER NO BRASIL!", font=f_b, fill=VERDE, anchor="lm")

    # lista de benefícios
    f_l = fonte("Montserrat.ttf", 31, 700)
    itens = [("aviao", ["Passagens", "Aéreas"]), ("cama", ["Hospedagem"]), ("pino", ["Saída de", CIDADE])]
    for k, (ic, linhas) in enumerate(itens):
        cxi, cyi, r = 1020, 845 + k * 98, 40
        s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(s).ellipse((cxi - r, cyi - r + 6, cxi + r, cyi + r + 6), fill=(0, 0, 0, 90))
        img.alpha_composite(s.filter(ImageFilter.GaussianBlur(6)))
        anel = Image.new("L", (W, H), 0)
        ImageDraw.Draw(anel).ellipse((cxi - r, cyi - r, cxi + r, cyi + r), fill=255)
        preenche_ouro(img, anel)
        d = ImageDraw.Draw(img)
        d.ellipse((cxi - r + 5, cyi - r + 5, cxi + r - 5, cyi + r - 5), fill=VERDE)
        if ic == "aviao":
            m = ic_aviao_m(54)
        else:
            m = icone_mask(ic_cama if ic == "cama" else ic_pino, 50)
        cola_mask(img, m, (cxi - m.width // 2, cyi - m.height // 2))
        tx = cxi + r + 20
        if len(linhas) == 1:
            d.text((tx, cyi), linhas[0], font=f_l, fill=(30, 30, 30), anchor="lm")
        elif ic == "pino":
            d.text((tx, cyi - 20), linhas[0], font=f_l, fill=(30, 30, 30), anchor="lm")
            d.text((tx, cyi + 20), linhas[1], font=fonte("Montserrat-Italic.ttf", 44, 800), fill=(20, 20, 20), anchor="lm")
        else:
            d.text((tx, cyi - 18), linhas[0], font=f_l, fill=(30, 30, 30), anchor="lm")
            d.text((tx, cyi + 18), linhas[1], font=f_l, fill=(30, 30, 30), anchor="lm")

    # ---------- recado fixado ----------
    nw, nh = 400, 330
    nota = papel_rasgado(nw, nh)
    dn = ImageDraw.Draw(nota)
    f_n = fonte("DancingScript.ttf", 54, 600)
    for i, linha in enumerate([f"Eu, {NOME},", "quero viver essa", "experiência com", "você!"]):
        dn.text((nw / 2 - (25 if i == 3 else 0), 96 + i * 56), linha, font=f_n, fill=(40, 30, 25), anchor="mm")
    # coraçãozinho e sublinhado dourado
    ch = Image.new("L", nota.size, 0)
    dc = ImageDraw.Draw(ch)
    dc.arc((262, 236, 292, 266), 150, 360, fill=255, width=3)
    dc.arc((290, 236, 320, 266), 180, 30, fill=255, width=3)
    dc.line((264, 254, 291, 290, 318, 254), fill=255, width=3)
    dc.line([(x, 305 - 10 * math.sin((x - 110) / 180 * math.pi)) for x in range(110, 291, 3)], fill=255, width=4)
    cn = Image.new("RGBA", nota.size, (0, 0, 0, 0))
    cn.paste(ouro(*nota.size), (0, 0))
    cn.putalpha(ImageChops.multiply(ch, nota.getchannel("A")))
    nota.alpha_composite(cn)
    nota = nota.rotate(7, resample=Image.BICUBIC, expand=True)
    nx, ny = 395, 790
    s = Image.new("RGBA", nota.size, (0, 0, 0, 0))
    s.putalpha(nota.getchannel("A").point(lambda v: v * 0.45))
    img.alpha_composite(s.filter(ImageFilter.GaussianBlur(12)), (nx + 8, ny + 14))
    img.alpha_composite(nota, (nx, ny))
    # alfinete
    pcx, pcy = nx + nota.width // 2 + 5, ny + 82
    pin = Image.new("L", (W, H), 0)
    dp = ImageDraw.Draw(pin)
    dp.ellipse((pcx - 22, pcy - 52, pcx + 22, pcy - 20), fill=255)
    dp.rounded_rectangle((pcx - 11, pcy - 28, pcx + 11, pcy - 4), 5, fill=255)
    dp.ellipse((pcx - 30, pcy - 8, pcx + 30, pcy + 10), fill=255)
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s.putalpha(pin.filter(ImageFilter.GaussianBlur(5)).point(lambda v: v * 0.5))
    img.alpha_composite(s, (6, 8))
    preenche_ouro(img, pin)

    # ---------- botão WhatsApp ----------
    bx0, by0, bx1, by1 = 40, 1228, 700, 1338
    pm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(pm).rounded_rectangle((bx0, by0, bx1, by1), 56, fill=255)
    s = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s.putalpha(pm.filter(ImageFilter.GaussianBlur(12)).point(lambda v: v * 0.55))
    img.alpha_composite(s, (0, 8))
    preenche_ouro(img, pm)
    d = ImageDraw.Draw(img)
    pv = Image.new("RGBA", (W, H))
    pv.paste(gradiente_v(bx1 - bx0, by1 - by0, [(0, (26, 92, 54)), (1, VERDE_D)]), (bx0, by0))
    pm2 = Image.new("L", (W, H), 0)
    ImageDraw.Draw(pm2).rounded_rectangle((bx0 + 5, by0 + 5, bx1 - 5, by1 - 5), 51, fill=255)
    pv.putalpha(pm2)
    img.alpha_composite(pv)
    cola_mask(img, icone_mask(ic_whatsapp, 74), (bx0 + 38, by0 + 20), cor=(255, 255, 255))
    f_w = fonte("Montserrat-Italic.ttf", 34, 700)
    d.text((bx0 + 132, by0 + 37), "Fale comigo e", font=f_w, fill="white", anchor="lm")
    d.text((bx0 + 132, by0 + 75), "embarque nessa jornada!", font=f_w, fill="white", anchor="lm")

    img.convert("RGB").save(OUT, quality=95)
    print("gerado:", OUT)


if __name__ == "__main__":
    main()
