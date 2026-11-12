// Переключатель темы визитки: Авто (как в телефоне) → Светлая → Тёмная. Выбор помнится в этом браузере.
(() => {
  const root = document.documentElement, en = root.lang === 'en'
  const T = en ? { auto: 'Theme: auto', light: 'Theme: light', dark: 'Theme: dark' } : { auto: 'Тема: как в телефоне', light: 'Тема: светлая', dark: 'Тема: тёмная' }
  const SVG = p => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' + p + '</svg>'
  const ICON = { auto: SVG('<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'), light: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'), dark: SVG('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>') }, NEXT = { auto: 'light', light: 'dark', dark: 'auto' }
  let cur = 'auto'; try { cur = localStorage.getItem('apex_theme') || 'auto' } catch {}
  const b = document.createElement('button'); b.type = 'button'; b.className = 'theme-btn'
  const st = document.createElement('style')
  st.textContent = '.theme-btn{flex:0 0 auto;width:38px;height:38px;border-radius:99px;border:1px solid var(--line);background:transparent;color:var(--text);font:600 18px/1 system-ui,sans-serif;cursor:pointer;display:inline-grid;place-items:center;padding:0}.theme-btn:hover{background:var(--ink2,transparent)}.theme-btn svg{display:block}header .logo{white-space:nowrap}@media(max-width:400px){header .logo{font-size:15px;gap:8px}header .logo img{width:30px;height:30px}.theme-btn{width:34px;height:34px}}.theme-btn.float{position:fixed;right:14px;bottom:14px;z-index:50;background:var(--ink2,var(--ink))}'
  document.head.append(st)
  const apply = v => {
    cur = v; try { v === 'auto' ? localStorage.removeItem('apex_theme') : localStorage.setItem('apex_theme', v) } catch {}
    if (v === 'auto') { delete root.dataset.theme; root.style.colorScheme = '' } else { root.dataset.theme = v; root.style.colorScheme = v }
    b.innerHTML = ICON[v]; b.title = T[v]; b.setAttribute('aria-label', T[v])
    const ink = getComputedStyle(root).getPropertyValue('--ink').trim()
    document.querySelectorAll('meta[name=theme-color]').forEach(m => { m.content = ink; m.removeAttribute('media') })
  }
  b.onclick = () => apply(NEXT[cur] || 'auto')
  const host = document.querySelector('header .lang') || document.querySelector('header .dl-mini')
  if (host) host.before(b)
  else { const w = document.querySelector('header .wrap'); if (w) { b.style.marginLeft = '12px'; w.append(b) } else { b.classList.add('float'); document.body.append(b) } }
  apply(cur)
})()
