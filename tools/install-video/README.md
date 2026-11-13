# Видео-инструкция установки

`media/install-ru.mp4`, `media/install-en.mp4` (и постеры `.webp`) на визитке собираются отсюда.

- `scene.html` — анимация: экраны сайта, установки и приложения. Тексты — в объекте `L` (ru/en), тайминги — в `render(t)` и `PATH` (касания пальца).
- `frames.js` — снимает кадры в Chromium (Playwright) и собирает MP4 через ffmpeg.

Пересобрать (из корня визитки):

```bash
cd tools/install-video
NODE_PATH=$(npm root -g) node frames.js ru ../../media/install-ru.mp4
NODE_PATH=$(npm root -g) node frames.js en ../../media/install-en.mp4
cd ../../media && for l in ru en; do ffmpeg -loglevel error -y -ss 29 -i install-$l.mp4 -frames:v 1 -vf scale=540:-1 -c:v libwebp -quality 80 install-$l.webp; done
```

Проверить кадры перед полной сборкой: `node frames.js ru x.mp4 2,22.9,27.3,30.6` — сохранит `chk-ru-*.jpg` рядом (их не коммитить).

Звук (своя синтезированная музыка, щелчки на нажатия, сигналы «установлено» и «Защищено») — `sound.py`, тайминги нажатий берёт из `PATH` в `scene.html`. После пересборки видео:

```bash
cd tools/install-video && python3 sound.py /tmp/install.wav && ffmpeg -y -i /tmp/install.wav -af loudnorm=I=-15:TP=-1:LRA=11 -ar 44100 /tmp/install-n.wav
cd ../../media && for l in ru en; do ffmpeg -y -i install-$l.mp4 -i /tmp/install-n.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart install-$l.tmp.mp4 && mv install-$l.tmp.mp4 install-$l.mp4; done
```
