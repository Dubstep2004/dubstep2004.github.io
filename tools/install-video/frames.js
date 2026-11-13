// node frames.js <lang> <out.mp4> [кадры через запятую для проверки]
const { chromium } = require('playwright'), { spawn } = require('child_process'), path = require('path'), fs = require('fs')
const [lang, out, check] = process.argv.slice(2), FPS = 30, DUR = 35
;(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 720, height: 1280 } })
  await p.goto('file://' + path.join(__dirname, 'scene.html') + '?l=' + lang); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  if (check) { for (const t of check.split(',')) { await p.evaluate(t => render(t), +t); await p.screenshot({ path: path.join(__dirname, `chk-${lang}-${t}.jpg`), type: 'jpeg', quality: 85 }) } await b.close(); return }
  const tmp = out.replace(/\.mp4$/, '.part.mp4')
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let i = 0; i < FPS * DUR; i++) { await p.evaluate(t => render(t), i / FPS); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)) }
  ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); await b.close()
  if (code === 0) fs.renameSync(tmp, out); else { console.error('ffmpeg', code); process.exit(1) }
})()
