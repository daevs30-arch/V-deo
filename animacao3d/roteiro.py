"""Roteiro do vídeo 3D "Por que o céu é azul?".

Gera as vozes (espeak-ng + mbrola), a trilha, os efeitos sonoros e o
arquivo timeline.json que a cena 3D (cena.html) usa para sincronizar
câmera, animações, legendas e boca dos personagens.

Uso: python3 roteiro.py  ->  build/audio.wav + build/timeline.json

Outros episódios importam este módulo e chamam gerar() com o próprio roteiro
(veja roteiro_lua.py).
"""
import glob
import json
import os
import subprocess
import wave

import numpy as np

SR = 44100
FPS = 30
BASE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(BASE, "build")
# Áudios próprios: vozes/01_lia.mp3, vozes/02_faisca.wav ... (número da fala no ROTEIRO).
# Quando existir um arquivo para a fala, ele substitui a voz sintética.
VOZES = os.path.join(BASE, "vozes")

INTRO = 4.5   # plano externo da casa
OUTRO = 3.0   # cartão final

VOICES = {
    "faisca": ["-v", "mb-br1", "-s", "150", "-p", "75"],
    "lia": ["-v", "mb-br4", "-s", "145", "-p", "85"],
}

# (personagem, fala, plano, pausa antes da fala)
ROTEIRO = [
    ("lia", "Ei... por que o céu é azul?", "lia1", 0.8),
    ("faisca", "Oi, Lia! Ótima pergunta! Deixa eu te mostrar.", "entrada", 1.6),
    ("faisca", "A luz do Sol parece branca, mas ela tem todas as cores do arco-íris misturadas.",
     "luz", 1.0),
    ("faisca", "Quando essa luz chega aqui, ela bate em pedacinhos minúsculos de ar.", "ar", 0.5),
    ("faisca", "E o azul é a cor que mais se espalha, ricocheteando pra todo lado! "
               "Por isso, pra onde você olha, o céu é azul.", "espalha", 0.5),
    ("lia", "Uau! E por que o pôr do sol é laranja?", "lia2", 0.9),
    ("faisca", "No fim do dia, a luz atravessa muito mais ar. O azul se perde no caminho, "
               "e só o laranja e o vermelho chegam até você.", "por_do_sol", 0.6),
    ("lia", "Que demais! Valeu, Faísca!", "final", 0.8),
    ("faisca", "Curiosidade é o meu combustível! Até a próxima!", "final", 0.3),
]


def tts(speaker, text, path, numero=None, voices=VOICES, vozes=VOZES):
    proprio = sorted(glob.glob(os.path.join(vozes, f"{numero:02d}_*.*"))) if numero else []
    if proprio:
        print(f"  fala {numero:02d}: usando {os.path.basename(proprio[0])}")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", proprio[0], "-ac", "1",
                        "-ar", str(SR), "-c:a", "pcm_s16le", path], check=True)
    else:
        subprocess.run(["espeak-ng", *voices[speaker], "-w", path, text], check=True,
                       stderr=subprocess.DEVNULL)
    with wave.open(path) as wf:
        sr = wf.getframerate()
        x = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(float) / 32768
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    # corta silêncio das pontas
    idx = np.where(np.abs(x) > 0.01)[0]
    x = x[max(0, idx[0] - 200): idx[-1] + 2000]
    return x / (np.abs(x).max() + 1e-9) * 0.9


def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf):
        buf[i:j] += sig[: j - i] * gain


def envelope(track, nframes):
    hop = SR // FPS
    env = np.zeros(nframes)
    for f in range(nframes):
        seg = track[f * hop:(f + 1) * hop]
        env[f] = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0
    env = env / (env.max() + 1e-9)
    env = np.clip(env * 1.6, 0, 1)
    return [round(float(v), 3) for v in env]


def music(total, rng):
    """Trilha leve: dedilhado de acordes, baixo suave e percussão discreta."""
    out = np.zeros(int(total * SR))
    beat = 60 / 100
    chords = [(261.6, 329.6, 392.0, 523.3), (220.0, 261.6, 329.6, 440.0),
              (174.6, 220.0, 261.6, 349.2), (196.0, 246.9, 293.7, 392.0)]
    bass = [65.4, 55.0, 43.7, 49.0]
    nb = int(total / beat) + 1
    for b in range(nb):
        t0 = b * beat
        bar = (b // 4) % 4
        # dedilhado (arpejo) em colcheias
        for k in range(2):
            f = chords[bar][(b * 2 + k) % 4]
            x = np.arange(int(SR * 0.6)) / SR
            s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 7)
            add(out, s, t0 + k * beat / 2, 0.10)
        if b % 4 == 0:
            x = np.arange(int(SR * beat * 4)) / SR
            s = np.sin(2 * np.pi * bass[bar] * x) * np.exp(-x * 1.2)
            add(out, s, t0, 0.22)
        x = np.arange(int(SR * 0.2)) / SR
        kick = np.sin(2 * np.pi * (45 + 60 * np.exp(-x * 30)) * x) * np.exp(-x * 14)
        if b % 2 == 0:
            add(out, kick, t0, 0.25)
        n = rng.standard_normal(int(SR * 0.04)) * np.exp(-np.arange(int(SR * 0.04)) / SR * 90)
        add(out, np.diff(n, prepend=0), t0 + beat / 2, 0.05)
    return out


def sfx_chime(notes, step=0.07, decay=6):
    x = np.arange(int(SR * (step * len(notes) + 0.8))) / SR
    out = np.zeros_like(x)
    for k, f in enumerate(notes):
        tt = (x - k * step).clip(0)
        out += np.sin(2 * np.pi * f * tt) * np.exp(-tt * decay) * (x >= k * step)
    return out / len(notes)


def sfx_whoosh(rng, dur=0.7):
    n = int(SR * dur)
    ns = np.convolve(rng.standard_normal(n), np.ones(20) / 20, "same")
    return ns * np.sin(np.linspace(0, np.pi, n)) ** 2


def sfx_pop():
    x = np.arange(int(SR * 0.15)) / SR
    return np.sin(2 * np.pi * (300 + 900 * np.exp(-x * 40)) * x) * np.exp(-x * 25)


# efeitos sonoros por nome, usados nas listas de "sfx" dos episódios
SFX = {
    "whoosh": lambda rng: sfx_whoosh(rng),
    "whoosh_longo": lambda rng: sfx_whoosh(rng, 1.0),
    "pop": lambda rng: sfx_pop(),
    "brilho": lambda rng: sfx_chime([784, 988, 1175, 1568]),
    "subida": lambda rng: sfx_chime([523, 659, 784, 1047, 1319], 0.09, 4),
    "cintilar": lambda rng: sfx_chime([1047, 1319, 1568, 2093], 0.05, 5),
    "descida": lambda rng: sfx_chime([392, 330, 262], 0.15, 3),
    "final": lambda rng: sfx_chime([523, 659, 784, 1047], 0.08, 4),
}

EPISODIO = {
    "roteiro": ROTEIRO, "voices": VOICES, "vozes": VOZES, "build": BUILD,
    "intro": INTRO, "outro": OUTRO,
    # (plano, segundos depois do início do plano, efeito, volume)
    "sfx": [("lia1", -0.4, "whoosh", 0.5), ("entrada", 0.25, "pop", 0.6),
            ("entrada", 0.3, "brilho", 0.35), ("luz", 0.1, "subida", 0.35),
            ("ar", 0.1, "cintilar", 0.25), ("espalha", 0.3, "whoosh_longo", 0.4),
            ("por_do_sol", 0.2, "descida", 0.3), ("cartao", 0.1, "final", 0.4)],
}


def gerar(ep=EPISODIO):
    BUILD, ROTEIRO, INTRO = ep["build"], ep["roteiro"], ep["intro"]
    os.makedirs(BUILD, exist_ok=True)
    rng = np.random.default_rng(3)

    clips, lines, shots = [], [], []
    t = INTRO
    shots.append({"name": "externa", "start": 0.0})
    for numero, (speaker, text, shot, pre) in enumerate(ROTEIRO, 1):
        if shots[-1]["name"] != shot:
            shots.append({"name": shot, "start": round(t, 3)})
        t += pre
        clip = tts(speaker, text, os.path.join(BUILD, "tmp.wav"), numero, ep["voices"], ep["vozes"])
        dur = len(clip) / SR
        clips.append((speaker, clip, t))
        lines.append({"speaker": speaker, "text": text, "start": round(t, 3),
                      "end": round(t + dur, 3), "shot": shot})
        t += dur
    shots.append({"name": "cartao", "start": round(t + 1.0, 3)})
    total = t + 1.0 + ep["outro"]
    for a, b in zip(shots, shots[1:]):
        a["end"] = b["start"]
    shots[-1]["end"] = round(total, 3)

    n = int(total * SR)
    tracks = {k: np.zeros(n) for k in ep["voices"]}
    for speaker, clip, start in clips:
        add(tracks[speaker], clip, start)
    nframes = int(total * FPS)
    mouth = {k: envelope(v, nframes) for k, v in tracks.items()}

    voice = sum(tracks.values())
    mus = music(total, rng)
    # abaixa a música quando alguém fala
    speech = np.convolve(np.abs(voice) > 0.02, np.ones(SR // 4) / (SR // 4), "same")
    mus *= 1 - 0.6 * np.clip(speech * 3, 0, 1)

    fx = np.zeros(n)
    by_shot = {s["name"]: s["start"] for s in shots}
    for shot, offset, nome, gain in ep["sfx"]:
        add(fx, SFX[nome](rng), by_shot[shot] + offset, gain)

    mix = voice * 1.0 + mus * 0.55 + fx
    fl = int(SR * 1.2)
    mix[-fl:] *= np.linspace(1, 0, fl)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
    with wave.open(os.path.join(BUILD, "audio.wav"), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((mix * 32767).astype(np.int16).tobytes())
    os.remove(os.path.join(BUILD, "tmp.wav"))

    with open(os.path.join(BUILD, "timeline.json"), "w") as f:
        json.dump({"fps": FPS, "total": round(total, 3), "shots": shots, "lines": lines,
                   "mouth": mouth}, f, ensure_ascii=False)
    print(f"duração total: {total:.1f}s")
    for s in shots:
        print(f"  {s['start']:6.2f}-{s['end']:6.2f}  {s['name']}")


if __name__ == "__main__":
    gerar()
