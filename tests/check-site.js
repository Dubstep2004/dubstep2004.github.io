// Автопроверка визитки: открывает все страницы на телефоне и компьютере (Chromium),
// подменяет GitHub поддельными данными и ищет ошибки JavaScript, битые ссылки и якоря, вылезание за край экрана.
// Картинки сайт берёт из репозитория apex-client (/apex-client/…) — их проверяем по живому сайту не здесь.
const { chromium } = require('playwright')
const fs = require('fs'), http = require('http'), path = require('path')
const ROOT = path.join(__dirname, '..')
const file = u => { u = decodeURIComponent(u.split('?')[0].split('#')[0]); let p = path.join(ROOT, u); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); return fs.existsSync(p) ? p : null }
const srv = http.createServer((q, r) => {
  if (q.url.startsWith('/apex-client/')) { r.writeHead(200, { 'content-type': 'image/png' }); return r.end() } // ресурсы другого репозитория
  const p = file(q.url); if (!p) { r.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); return r.end(fs.readFileSync(path.join(ROOT, '404.html'))) }
  r.setHeader('content-type', { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(p)] || 'application/octet-stream'); r.end(fs.readFileSync(p))
})
const PAGES = ['/', '/en/', '/help/', '/versions/', '/original/', '/wallpapers/', '/status/', '/status/?lang=en', '/update/', '/404.html']
const rel = [{ tag_name: 'v9.9.9', draft: false, prerelease: false, published_at: new Date().toISOString(), body: '- проверка\n', assets: [{ name: 'apex-client-9.9.9.apk', size: 6e7, download_count: 5, browser_download_url: 'https://github.com/x.apk' }, { name: 'apex-watch-9.9.9.apk', size: 1e7, download_count: 1, browser_download_url: 'https://github.com/w.apk' }] }]
const cfg = { banners: [{ id: 'b', text: 'Проверка баннера', level: 'warn', devices: ['site'] }], servers: { status: { 'Германия': { state: 'maintenance', until: Date.now() + 36e5 } } } }
const problems = [], bad = (w, m) => { problems.push(w + ': ' + m); console.log('::error title=' + w + '::' + m) }

;(async () => {
  await new Promise(r => srv.listen(8198, r))
  const b = await chromium.launch()
  for (const width of [360, 390, 1366])
    for (const u of PAGES) {
      const p = await b.newPage({ viewport: { width, height: 900 } }), W = u + ' (' + width + ')'
      p.on('pageerror', e => bad(W, 'ошибка JavaScript: ' + e.message))
      await p.route('https://api.github.com/**', rt => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rt.request().url().includes('/latest') ? rel[0] : rel) }))
      await p.route(/raw\.githubusercontent|cdn\.jsdelivr/, rt => rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(rt.request().url().includes('site.json') ? { sections: [], show: { holiday: 'party' } } : cfg) }))
      await p.route(/fonts\.|cdnjs|t\.me|wa\.me|vk\.com/, rt => rt.abort())
      await p.goto('http://localhost:8198' + u); await p.waitForTimeout(700)
      const r = await p.evaluate(() => ({
        ov: document.documentElement.scrollWidth - innerWidth,
        links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
        ids: [...document.querySelectorAll('[id]')].map(e => e.id),
      }))
      if (r.ov > 1) bad(W, 'страница шире экрана на ' + r.ov + ' px')
      for (const h of r.links) {
        if (h.startsWith('#')) { if (h.length > 1 && !r.ids.includes(h.slice(1))) bad(W, 'нет якоря ' + h) }
        else if (h.startsWith('/') && !h.startsWith('/apex-client/') && !h.startsWith('/apex-vpn/') && !file(h)) bad(W, 'битая ссылка ' + h)
      }
      if (u === '/' || u === '/en/') {
        const dl = await p.getAttribute('#download a[data-dl]', 'href')
        if (!/\.apk$/.test(dl || '')) bad(W, 'кнопка «Скачать» не ведёт на APK: ' + dl)
      }
      if (u !== '/404.html') { // тема: Авто → Светлая → Тёмная
        const btn = await p.$('.theme-btn'); if (!btn) bad(W, 'нет кнопки темы')
        else { await btn.click(); const th = await p.evaluate(() => document.documentElement.dataset.theme + '|' + getComputedStyle(document.body).backgroundColor); if (!th.startsWith('light|rgb(245')) bad(W, 'светлая тема не включилась: ' + th); await btn.click(); await btn.click() }
      }
      if (u.startsWith('/status/') && !(await p.textContent('#now')).includes('Германия')) bad(W, 'статус не показывает техработы')
      await p.close()
    }
  await b.close(); srv.close()
  console.log(problems.length ? `\nНайдено проблем: ${problems.length}` : '\n✓ Визитка — без ошибок')
  process.exit(problems.length ? 1 : 0)
})()
