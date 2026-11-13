// node frames.js <ru|en> <out.mp4> [проверочные секунды через запятую] — 12 с, 30 к/с
const { chromium } = require('playwright'), { spawn } = require('child_process'), path = require('path'), fs = require('fs')
const [lang, out, check] = process.argv.slice(2), FPS = 30, DUR = 12, D = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'))
;(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 720, height: 1280 } })
  await p.goto('file://' + path.join(__dirname, 'scene.html')); await p.evaluate(([D, l]) => setup(D, l), [D, lang]); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  if (check) { for (const t of check.split(',')) { await p.evaluate(t => render(t), +t); await p.screenshot({ path: path.join(__dirname, `chk-${lang}-${t}.jpg`), type: 'jpeg', quality: 85 }) } await b.close(); return }
  const tmp = out.replace(/\.mp4$/, '.part.mp4')
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let i = 0; i < FPS * DUR; i++) { await p.evaluate(t => render(t), i / FPS); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)) }
  ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); await b.close()
  if (code === 0) fs.renameSync(tmp, out); else { console.error('ffmpeg', code); process.exit(1) }
})()
