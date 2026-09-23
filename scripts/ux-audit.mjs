// UX audit of the kit's screens through the dev Chrome (CDP :9333): text contrast (WCAG AA 4.5:1), pointer targets < 24px,
// icon-only controls without an accessible name, text < 12px, missing cursor:pointer, inputs without labels.
// Rules follow the ui-ux-pro-max skill checklist. Run the dev env first (bash scripts/dev-env.sh), then:
//   node scripts/ux-audit.mjs "$(grep -o 'dsh web: http[^ ]*' .dsh-dev-home/web.log | tail -1 | sed 's/dsh web: //')" light
// Writes audit-<scheme>.json and shots/<scheme>-<screen>.png next to this script's cwd; findings tagged with the owning package.
import { writeFileSync, mkdirSync } from 'node:fs'
const [url, scheme = 'light'] = process.argv.slice(2)
setTimeout(() => { console.log('WATCHDOG'); process.exit(3) }, 5 * 60 * 1000).unref()
for (const t of await fetch('http://127.0.0.1:9333/json').then((r) => r.json())) if (t.type === 'page' && /127\.0\.0\.1:3090/.test(t.url)) await fetch('http://127.0.0.1:9333/json/close/' + t.id).catch(() => {})
const target = await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' }).then((r) => r.json())
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r))
let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id) } }
const send = (method, params = {}) => Promise.race([new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) }), new Promise((res) => setTimeout(() => res({ timeout: method }), 60000))])
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); return r?.result?.result ? r.result.result.value : (r?.result?.exceptionDetails ? 'EXC ' + JSON.stringify(r.result.exceptionDetails.exception?.description).slice(0, 300) : JSON.stringify(r)) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] })
await send('Page.navigate', { url }); await sleep(5000)
await ev("Object.keys(localStorage).filter(k => /sidebar-right|sidebar-browser/.test(k)).forEach(k => localStorage.removeItem(k)); 'ok'")
await send('Page.reload'); await sleep(5000)

const AUDIT = `(() => {
  const lum = (c) => { const m = c.match(/[\\d.]+/g); if (!m) return null; const [r,g,b] = m.map(Number); const a = m[3] === undefined ? 1 : Number(m[3]); if (a === 0) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return { L: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a, rgb: [r,g,b] } }
  const parse = (c) => { const m = c.match(/[\\d.]+/g); if (!m) return null; return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } }
  const bgOf = (el) => { let acc = null; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { if (!acc) acc = c; else { acc = { r: acc.r + (c.r - acc.r) * (1 - acc.a), g: acc.g + (c.g - acc.g) * (1 - acc.a), b: acc.b + (c.b - acc.b) * (1 - acc.a), a: acc.a + c.a * (1 - acc.a) }; } if (acc.a >= 0.99) return acc } } const body = parse(getComputedStyle(document.body).backgroundColor); const base = body && body.a > 0 ? body : { r: 255, g: 255, b: 255, a: 1 }; if (!acc) return base; return { r: acc.r + (base.r - acc.r) * (1 - acc.a), g: acc.g + (base.g - acc.g) * (1 - acc.a), b: acc.b + (base.b - acc.b) * (1 - acc.a), a: 1 } }
  const L = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth }
  const sel = (el) => { const cls = [...el.classList].filter(c => !/^_/.test(c)).slice(0, 2).join('.'); return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (el.id ? '#' + el.id : '') }
  const owner = (el) => { for (let e = el; e; e = e.parentElement) { const c = e.className && typeof e.className === 'string' ? e.className : ''; if (/\\bdcu-/.test(c)) return 'codex-ui'; if (/\\bmwb-/.test(c)) return 'browser'; if (/\\bmws-|\\bmwn-|\\bmwr-/.test(c)) return 'schedule'; if (/\\bmwk-/.test(c)) return 'kit'; if (/\\bmwt-|\\bmwsh-/.test(c)) return 'shell'; if (/\\bmwm-|\\bmwmcp-/.test(c)) return 'mcp'; if (/\\bmwi-/.test(c)) return 'im'; if (/\\bdsh-st-/.test(c)) return 'automation'; if (/\\bimc-|\\bdsh-im/.test(c)) return 'im-connect' } return 'dsh' }
  const out = { contrast: [], small: [], noName: [], tinyText: [], noCursor: [], noAlt: [], noLabel: [], counts: {} }
  const all = [...document.querySelectorAll('body *')].filter(vis)
  out.counts.visible = all.length
  const seen = new Set()
  for (const el of all) {
    const s = getComputedStyle(el)
    // text contrast on elements that directly own text
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ')
    if (own) {
      const fg = parse(s.color); const bg = bgOf(el)
      if (fg && fg.a > 0.05) { const eff = fg.a < 1 ? { r: fg.r + (bg.r - fg.r) * (1 - fg.a), g: fg.g + (bg.g - fg.g) * (1 - fg.a), b: fg.b + (bg.b - fg.b) * (1 - fg.a) } : fg; const rt = ratio(eff, bg); const px = parseFloat(s.fontSize); const bold = +s.fontWeight >= 700; const large = px >= 24 || (px >= 18.66 && bold); const need = large ? 3 : 4.5; const dis = el.closest('[disabled], [aria-disabled="true"], .disabled') ; if (rt < need && !dis) { const key = sel(el) + '|' + s.color; if (!seen.has(key)) { seen.add(key); out.contrast.push({ o: owner(el), s: sel(el), t: own.slice(0, 30), ratio: +rt.toFixed(2), fg: s.color, bg: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(',') + ')', px }) } } }
      const px = parseFloat(s.fontSize); if (px < 12) { const key = 'tt' + sel(el) + px; if (!seen.has(key)) { seen.add(key); out.tinyText.push({ o: owner(el), s: sel(el), t: own.slice(0, 30), px }) } }
    }
    const inter = el.matches('button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"])') || (s.cursor === 'pointer' && !el.closest('button, a, [role="button"]') && !el.querySelector('button, a, [role="button"]'))
    if (inter) {
      const r = el.getBoundingClientRect()
      if ((r.width < 24 || r.height < 24) && !el.matches('input[type=checkbox], input[type=radio]')) { const key = 'sm' + sel(el); if (!seen.has(key)) { seen.add(key); out.small.push({ o: owner(el), s: sel(el), w: Math.round(r.width), h: Math.round(r.height), t: (el.textContent || '').trim().slice(0, 20) }) } }
      const name = (el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').trim() || el.querySelector('img[alt]')?.getAttribute('alt') || el.getAttribute('aria-labelledby') || el.getAttribute('placeholder') || '')
      if (!name && !el.matches('input, select, textarea')) { const key = 'nn' + sel(el); if (!seen.has(key)) { seen.add(key); out.noName.push({ o: owner(el), s: sel(el), html: el.outerHTML.slice(0, 90) }) } }
      if (el.matches('button, a[href], [role="button"], [role="tab"], summary') && s.cursor !== 'pointer' && !el.matches('[disabled]')) { const key = 'nc' + sel(el); if (!seen.has(key)) { seen.add(key); out.noCursor.push({ o: owner(el), s: sel(el), t: (el.textContent || '').trim().slice(0, 20) }) } }
      if (el.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select')) { const lab = el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); const wrapped = el.closest('label'); if (!lab && !wrapped && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) { const key = 'nl' + sel(el); if (!seen.has(key)) { seen.add(key); out.noLabel.push({ o: owner(el), s: sel(el), ph: el.getAttribute('placeholder') || '' }) } } }
    }
    if (el.matches('img') && !el.hasAttribute('alt')) { const key = 'na' + sel(el); if (!seen.has(key)) { seen.add(key); out.noAlt.push({ o: owner(el), s: sel(el), src: (el.getAttribute('src') || '').slice(0, 60) }) } }
  }
  return out
})()`

const results = {}
const step = async (name, prep) => {
  const p = await ev(prep); await sleep(1500)
  const r = await ev(AUDIT)
  results[name] = { prep: p, ...(typeof r === 'object' ? r : { error: r }) }
  const c = results[name]
  console.log(name, '|', p, '| contrast', c.contrast?.length, 'small', c.small?.length, 'noName', c.noName?.length, 'tiny', c.tinyText?.length, 'noCursor', c.noCursor?.length, 'noAlt', c.noAlt?.length, 'noLabel', c.noLabel?.length)
}
const w = 'const w=(ms)=>new Promise(r=>setTimeout(r,ms));'
const clickText = (sel, text) => `[...document.querySelectorAll('${sel}')].find(e => e.textContent.trim().startsWith('${text}'))`
const back = `const b = document.querySelector('.dcu-settings-back'); if (b) { b.click(); await w(800) }`
const nav = (text) => `(async()=>{ ${w} ${back} const s = ${clickText('.dcu-menu button, .dcu-footer-link, .dcu-settings-seat button', text)}; if (!s) return 'no item ' + [...document.querySelectorAll('.dcu-menu button')].map(b => b.textContent.trim()).join('/'); s.click(); await w(1500); return 'ok ' + (document.querySelector('[data-slot="main"]')?.firstElementChild?.className || '').slice(0, 40) })()`
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); if (s.result) { mkdirSync('shots', { recursive: true }); writeFileSync('shots/' + scheme + '-' + name + '.png', Buffer.from(s.result.data, 'base64')) } }
const stepShot = async (name, prep) => { await step(name, prep); await shot(name) }
await stepShot('home', `(async()=>{ ${w} ${back} return 'home ' + !!document.querySelector('.dcu-root') })()`)
await stepShot('new-conversation', nav('新建对话'))
await stepShot('settings-members', `(async()=>{ ${w} const s = ${clickText('.dcu-settings-seat button, .dcu-menu button, .dcu-footer-link', '设置')}; if (!s) return 'no settings'; s.click(); await w(1200); const m = ${clickText('.dcu-settings-link, .dcu-settings-page button', 'MyWork')}; if (m) { m.click(); await w(1000) } return 'settings ' + !!m })()`)
for (const tab of ['外观', '日程', '浏览器']) await stepShot('settings-' + tab, `(async()=>{ ${w} const t = ${clickText('.mwk-tab, .dcu-settings-page button, .dcu-settings-page [role=tab]', tab)}; if (!t) return 'no tab'; t.click(); await w(800); if ('${tab}' === '外观') { const m = ${clickText('.dcu-settings-page button', scheme === 'dark' ? '深色' : '浅色')}; if (m) { m.click(); await w(800) } } return 'tab ' + t.className.slice(0, 30) + ' dark=' + document.body.hasAttribute('data-ds-dark-theme') })()`)
await stepShot('scheduled', `(async()=>{ ${w} ${back} const e = ${clickText('.dcu-menu button', '扩展管理')}; if (e && e.getAttribute('aria-expanded') !== 'true') { e.click(); await w(600) } const s = ${clickText('.dcu-menu button, .dcu-root button', '定时任务')}; if (!s) return 'no item ' + [...document.querySelectorAll('.dcu-menu button')].map(b => b.textContent.trim()).join('/'); s.click(); await w(1500); return 'ok' })()`)
await stepShot('im', nav('IM助理'))
await stepShot('mcp', nav('MCP'))
await stepShot('conversation-browser', `(async()=>{ ${w} ${back} const row = [...document.querySelectorAll('.dcu-wb-session')].find(e => /Playwright/.test(e.textContent)) || document.querySelector('.dcu-wb-session'); if (!row) return 'no session'; row.click(); await w(3000); for (let i = 0; i < 8 && !document.querySelector('.mwb-view'); i++) { document.querySelector('.mwb-composer')?.click(); await w(1200) } return 'pane ' + !!document.querySelector('.mwb-view') })()`)
await stepShot('composer-focus', `(async()=>{ ${w} const ta = document.querySelector('textarea'); if (ta) ta.focus(); return 'focused ' + !!ta })()`)
if (scheme === 'dark') await ev(`(async()=>{ const w=(ms)=>new Promise(r=>setTimeout(r,ms)); ${back} const s = ${clickText('.dcu-settings-seat button, .dcu-menu button, .dcu-footer-link', '设置')}; if (s) { s.click(); await w(1000) } const m = ${clickText('.dcu-settings-link, .dcu-settings-page button', 'MyWork')}; if (m) { m.click(); await w(800) } const t = ${clickText('.mwk-tab', '外观')}; if (t) { t.click(); await w(600) } const l = ${clickText('.dcu-settings-page button', '浅色')}; if (l) { l.click(); await w(600) } return 'restored ' + !document.body.hasAttribute('data-ds-dark-theme') })()`).then(console.log)
const outFile = new URL('./audit-' + scheme + '.json', 'file://' + process.cwd() + '/')
writeFileSync(outFile, JSON.stringify(results, null, 1)); console.log('saved', outFile.pathname)
await fetch('http://127.0.0.1:9333/json/close/' + target.id).catch(() => {}); ws.close(); process.exit(0)
