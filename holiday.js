// Праздничное оформление визитки (пульт → Визитка → «Праздничное оформление»).
// window.apexHoliday(kind): newyear, valentine, march8, spring, summer, autumn, halloween, party или auto (по календарю).
(() => {
  const T = {
    newyear: { g: ['#ff4f6a', '#ffd23f', '#3ee6a8', '#4fb3ff'], p: 'snow', n: 90 },
    valentine: { g: ['#ff4f8b', '#ff8fb4', '#ffffff', '#e0245e'], p: 'heart', n: 34 },
    march8: { g: ['#ff7eb6', '#ffd23f', '#b98cff', '#7ee0a0'], p: ['🌷', '🌸', '🌼'], n: 26 },
    spring: { g: null, p: 'petal', n: 46 },
    summer: { g: null, p: ['🦋', '✨'], n: 16 },
    autumn: { g: null, p: ['🍁', '🍂', '🍃'], n: 26 },
    halloween: { g: ['#ff8a1f', '#9b5cff', '#ffb547', '#7bff6b'], p: ['🦇', '🎃', '👻'], n: 18 },
    party: { g: ['#ff4f6a', '#ffd23f', '#3ee6a8', '#4fb3ff', '#b98cff'], p: 'confetti', n: 70 },
  }
  // Авто: само включается к празднику и выключается после
  function auto(d = new Date()) {
    const m = d.getMonth() + 1, day = d.getDate(), md = m * 100 + day
    if (md >= 1215 || md <= 114) return 'newyear'
    if (md >= 210 && md <= 215) return 'valentine'
    if (md >= 305 && md <= 309) return 'march8'
    if ((md >= 1025 && md <= 1031) || md === 1101) return 'halloween'
    return null
  }
  const light = () => { const t = document.documentElement.dataset.theme; return t ? t === 'light' : matchMedia('(prefers-color-scheme: light)').matches }
  window.apexHoliday = kind => {
    if (kind === true) kind = 'newyear'
    if (kind === 'auto') kind = auto()
    const th = T[kind]; if (!th || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const st = document.createElement('style')
    st.textContent = '.hol-cv{position:fixed;inset:0;pointer-events:none;z-index:60}.hol-g{position:fixed;top:0;left:0;right:0;height:18px;display:flex;justify-content:space-around;pointer-events:none;z-index:61;background:linear-gradient(#0003,transparent)}.hol-g i{width:9px;height:13px;border-radius:50% 50% 45% 45%;background:var(--c);margin-top:4px;box-shadow:0 0 10px var(--c);animation:holblink 1.6s var(--d) infinite alternate}@keyframes holblink{to{opacity:.35;box-shadow:none}}'
    document.head.append(st)
    if (th.g) {
      const g = document.createElement('div'); g.className = 'hol-g'; g.setAttribute('aria-hidden', 'true')
      g.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="--d:${(i % 4) * .4}s;--c:${th.g[i % th.g.length]}"></i>`).join('')
      document.body.prepend(g)
    }
    const cv = document.createElement('canvas'); cv.className = 'hol-cv'; cv.setAttribute('aria-hidden', 'true'); document.body.append(cv)
    const x = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), emoji = Array.isArray(th.p)
    const conf = ['#ff4f6a', '#ffd23f', '#3ee6a8', '#4fb3ff', '#b98cff']
    let W, H, items
    const make = (top) => ({ x: Math.random() * W, y: top ? -20 : Math.random() * H, r: 1 + Math.random() * 2.4, s: .3 + Math.random() * .9, p: Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * .04,
      e: emoji ? th.p[Math.floor(Math.random() * th.p.length)] : null, c: conf[Math.floor(Math.random() * conf.length)], z: .7 + Math.random() * .6 })
    const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; x.setTransform(dpr, 0, 0, dpr, 0, 0); items = Array.from({ length: Math.min(th.n, Math.round(W / 12)) }, () => make(false)) }
    size(); addEventListener('resize', size)
    const heart = (s) => { x.beginPath(); x.moveTo(0, s * .3); x.bezierCurveTo(-s, -s * .4, -s * .45, -s, 0, -s * .45); x.bezierCurveTo(s * .45, -s, s, -s * .4, 0, s * .3); x.fill() }
    const tick = t => {
      x.clearRect(0, 0, W, H)
      for (const f of items) {
        const up = th.p === 'confetti' ? 1.6 : kind === 'summer' ? -.5 : 1
        f.y += f.s * up; f.x += Math.sin(t / 1400 + f.p) * (emoji || th.p === 'petal' ? .7 : .4); f.a += f.va
        if (f.y > H + 24 || f.y < -30) Object.assign(f, make(true), up < 0 ? { y: H + 20 } : {})
        x.save(); x.translate(f.x, f.y); x.rotate(th.p === 'heart' || emoji ? Math.sin(f.a) * .35 : f.a)
        if (th.p === 'snow') { x.fillStyle = light() ? '#8fb8f0cc' : '#ffffffcc'; x.beginPath(); x.arc(0, 0, f.r, 0, 7); x.fill() }
        else if (th.p === 'heart') { x.fillStyle = ['#ff4f8bcc', '#ff8fb4cc', '#e0245ecc'][Math.floor(f.p) % 3]; heart(7 * f.z + 5) }
        else if (th.p === 'petal') { x.fillStyle = light() ? '#ff9fc4dd' : '#ffc4dccc'; x.beginPath(); x.ellipse(0, 0, 5 * f.z, 3 * f.z, 0, 0, 7); x.fill() }
        else if (th.p === 'confetti') { x.fillStyle = f.c; x.fillRect(-3, -5, 6 * f.z, 10 * f.z * Math.abs(Math.cos(t / 400 + f.p))) }
        else { x.globalAlpha = .85; x.font = Math.round(16 * f.z + 6) + 'px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.fillText(f.e, 0, 0) }
        x.restore()
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  window.apexHoliday.auto = auto
})()
