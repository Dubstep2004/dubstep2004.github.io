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
