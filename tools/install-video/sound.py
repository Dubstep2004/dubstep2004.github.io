"""Звук для видео-инструкции: своя бодрая электроника + щелчки на нажатия + сигналы «установлено» и «защищено».
Всё синтезируется здесь (никаких чужих треков). Тайминги берутся из PATH в scene.html.
Запуск: python3 sound.py ../../media/install.wav  (длительность — как у видео, 35 с)"""
import re, sys, wave
import numpy as np

SR, DUR = 44100, 35.0
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)
note = lambda n: 440.0 * 2 ** ((n - 69) / 12)  # MIDI → Гц


def env(n, a=0.01, r=0.3):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri)
    return e


def add(start, sig):
    # Плавные 4 мс в начале и 12 мс в конце каждого звука — без щелчков и треска на обрезанных нотах
    sig = np.array(sig, dtype=float); n = len(sig); a = min(n // 4, int(.004 * SR)); r = min(n // 3, int(.012 * SR))
    if a: sig[:a] *= np.linspace(0, 1, a)
    if r: sig[-r:] *= np.linspace(1, 0, r)
    i = int(start * SR); j = min(len(out), i + n); out[i:j] += sig[:j - i]


# 1–2. Бодрая электроника, 124 BPM: бочка на каждую долю, хлопок на 2 и 4, хай-хэт на восьмые,
# пульсирующий бас и «суперсо»-аккорды на офбитах. Ам — F — C — G, по такту (4 доли) на аккорд.
BPM = 124; BEAT = 60 / BPM; BAR = 4 * BEAT
chords = [[69, 72, 76], [65, 69, 72], [60, 64, 67], [67, 71, 74]]
roots = [45, 41, 48, 43]
rng = np.random.default_rng(7)


def saw(f, tt, h=12):  # пила из гармоник — яркая, слышно на телефоне
    return sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, h + 1)) * .6


def kick(n):
    tt = np.arange(n) / SR; f = 85 + 140 * np.exp(-tt * 30)  # без сверхнизкого гула — динамик телефона не хрипит
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 12)


def clap(n):
    tt = np.arange(n) / SR; nz = rng.standard_normal(n)
    nz = nz - np.convolve(nz, np.ones(8) / 8, mode='same')  # убрать низ — звонкий хлопок
    nz = np.convolve(nz, np.ones(4) / 4, mode='same')  # мягче, без «ш-ш»
    return (nz * .5 + np.sin(2 * np.pi * 1200 * tt) * .5) * np.exp(-tt * 45)


def hat(n, open_=False):  # без шума: несколько высоких тонов, коротко — не шипит
    tt = np.arange(n) / SR
    tone = sum(np.sign(np.sin(2 * np.pi * f * tt)) for f in (3200, 4570, 5810, 7130)) / 4
    return tone * np.exp(-tt * (45 if open_ else 110))


start_beat = 4.0  # до 4 с — заставка: только аккорды и нарастание
nb = int(DUR / BEAT) + 1
for k in range(nb):
    tb = k * BEAT
    if tb > 32.4: break
    bar = int(tb // BAR) % 4
    full = tb >= start_beat - 1e-6
    if full:
        add(tb, kick(int(.3 * SR)) * .4)
        if k % 2 == 1: add(tb, clap(int(.12 * SR)) * .16)
    for h in (0, .5):  # хай-хэт на восьмые, открытый на офбит
        if full or tb > 2: add(tb + h * BEAT, hat(int(.08 * SR), open_=h == .5) * (.035 if h == .5 else .022))
    # бас: восьмые с «насосом» (тише сразу после бочки)
    if full:
        for h in (0, .5):
            n = int(BEAT / 2 * SR); tt = np.arange(n) / SR
            f = note(roots[bar] + 12 + (12 if h == .5 and k % 4 == 3 else 0))  # бас на октаву выше — чище на телефоне
            pump = np.minimum(1, tt / .06) if h == 0 else np.ones(n)
            add(tb + h * BEAT, saw(f, tt, 8) * np.exp(-tt * 6) * pump * .12)
    # аккорды-стабы на офбит (детюн — «суперсо»)
    n = int(BEAT * .45 * SR); tt = np.arange(n) / SR
    stab = sum(saw(note(m) * d, tt, 6) for m in chords[bar] for d in (0.996, 1.004)) / 6
    add(tb + BEAT / 2, stab * np.exp(-tt * 9) * (.20 if full else .12 * min(1, tb / 3)))
    # мелодия-«свист» раз в такт поверх, только в основной части
    if full and k % 8 in (0, 3, 6):
        n = int(.28 * SR); tt = np.arange(n) / SR; m = chords[bar][[2, 1, 0][(k % 8) // 3]] + 12
        add(tb, np.sin(2 * np.pi * note(m) * tt) * np.exp(-tt * 6) * .07)
# нарастание шума перед «дропом» на 4-й секунде
n = int(2.0 * SR); tt = np.arange(n) / SR
add(2.0, np.sin(2 * np.pi * np.cumsum(300 + 600 * tt / tt[-1]) / SR) * (tt / tt[-1]) ** 2 * .05)
# в конце (заставка «Готово!») — один длинный аккорд
n = int(2.6 * SR); tt = np.arange(n) / SR
add(32.4, sum(saw(note(m), tt, 6) for m in chords[0] + [57]) / 4 * np.exp(-tt * 1.4) * .14)

# 3. Щелчки на нажатия пальца
src = open(__file__.replace('sound.py', 'scene.html'), encoding='utf-8').read()
taps = [float(a) for a, b in re.findall(r'\[([\d.]+), \d+, \d+, (1)\]', src)]
for tp in taps:
    n = int(.06 * SR); tt = np.arange(n) / SR
    click = np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 80)  # щелчок без шума
    add(tp, click * .35)

# 4. Сигналы: «приложение установлено» (20 с) и «Защищено» (27.8 с) — восходящие ноты
for start, notes in [(20.0, [72, 76, 79]), (27.8, [72, 76, 79, 84])]:
    for i, m in enumerate(notes):
        n = int(.9 * SR); tt = np.arange(n) / SR
        add(start + i * .09, (np.sin(2 * np.pi * note(m) * tt) + .3 * np.sin(2 * np.pi * note(m) * 3 * tt)) * np.exp(-tt * 4) * .14)

# 5. Смена шага — короткий мягкий «динь» (раньше был шумовой «вжух» — шипел)
for ts in [9.5, 15, 20.6, 24.4, 29.4]:
    n = int(.25 * SR); tt = np.arange(n) / SR
    add(ts - .05, np.sin(2 * np.pi * note(84) * tt) * np.exp(-tt * 14) * .05)

# Общая громкость: плавное начало и конец, без перегруза
out *= np.minimum(1, np.minimum(t / 1.2, (DUR - t) / 2.0))
out = out / max(1e-9, np.abs(out).max()) * .8
pcm = (np.stack([out, out], 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('звук:', sys.argv[1], 'нажатий', len(taps))
