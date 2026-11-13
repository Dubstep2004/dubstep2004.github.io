"""Звук для видео-инструкции: своя спокойная музыка + щелчки на нажатия + сигналы «установлено» и «защищено».
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
    i = int(start * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i]


# 1. Мягкие аккорды (Am — F — C — G), каждый 4 с: тёплые синусы с медленным «дыханием»
chords = [[69, 72, 76], [65, 69, 72], [60, 67, 72], [67, 71, 74]]  # на октаву выше — слышно и на динамике телефона
for k in range(int(DUR // 4) + 1):
    n = int(4.4 * SR); tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * note(m) * tt) + .25 * np.sin(2 * np.pi * note(m) * 2 * tt) for m in chords[k % 4])
    s += .35 * np.sin(2 * np.pi * note(chords[k % 4][0] - 12) * tt)
    add(k * 4, s * env(n, 1.0, 1.4) * (1 + .15 * np.sin(2 * np.pi * .25 * tt)) * .03)

# 2. Лёгкие «капли» арпеджио на восьмых — с 4-й секунды, пока на экране телефон
for k in range(int(4 / .5), int(31.5 / .5)):
    c = chords[int(k * .5 // 4) % 4]; m = c[k % 3] + 12 + (5 if k % 4 == 3 else 0)
    n = int(.6 * SR); tt = np.arange(n) / SR
    add(k * .5, (np.sin(2 * np.pi * note(m) * tt) + .2 * np.sin(2 * np.pi * note(m) * 2 * tt)) * np.exp(-tt * 6) * .07)

# 3. Щелчки на нажатия пальца
src = open(__file__.replace('sound.py', 'scene.html'), encoding='utf-8').read()
taps = [float(a) for a, b in re.findall(r'\[([\d.]+), \d+, \d+, (1)\]', src)]
for tp in taps:
    n = int(.06 * SR); tt = np.arange(n) / SR
    click = (np.random.default_rng(1).standard_normal(n) * .4 + np.sin(2 * np.pi * 2200 * tt)) * np.exp(-tt * 80)
    add(tp, click * .35)

# 4. Сигналы: «приложение установлено» (20 с) и «Защищено» (27.8 с) — восходящие ноты
for start, notes in [(20.0, [72, 76, 79]), (27.8, [72, 76, 79, 84])]:
    for i, m in enumerate(notes):
        n = int(.9 * SR); tt = np.arange(n) / SR
        add(start + i * .09, (np.sin(2 * np.pi * note(m) * tt) + .3 * np.sin(2 * np.pi * note(m) * 3 * tt)) * np.exp(-tt * 4) * .14)

# 5. Мягкий «вжух» на смене шагов
for ts in [4, 9.5, 15, 20.6, 24.4, 29.4]:
    n = int(.5 * SR); tt = np.arange(n) / SR
    noise = np.random.default_rng(int(ts * 10)).standard_normal(n)
    noise = np.convolve(noise, np.ones(40) / 40, mode='same')  # приглушить верх
    add(ts - .25, noise * np.sin(np.pi * tt / tt[-1]) * .05)

# Общая громкость: плавное начало и конец, без перегруза
out *= np.minimum(1, np.minimum(t / 1.2, (DUR - t) / 2.0))
out = out / max(1e-9, np.abs(out).max()) * .8
pcm = (np.stack([out, out], 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('звук:', sys.argv[1], 'нажатий', len(taps))
