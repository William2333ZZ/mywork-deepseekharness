/**
 * dsh-mywork-browser — minimal Chrome DevTools Protocol client + viewer hub
 * (host side, zero dependencies: Node's global fetch + WebSocket).
 *
 *   CdpClient   one WebSocket to one page target: send(method, params), on(event)
 *   ViewerHub   lists page targets, keeps one CdpClient per viewed target,
 *               runs Page.startScreencast and fans frames out to subscribers
 *               (SSE connections), and forwards input / navigation commands.
 */

export class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.seq = 0
    this.pending = new Map()
    this.listeners = new Map()
    this.closed = false
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl)
      this.ws = ws
      ws.addEventListener('open', () => resolve(this))
      ws.addEventListener('error', (e) => { if (!this.closed) reject(new Error('cdp websocket error: ' + (e && e.message ? e.message : 'unknown'))) })
      ws.addEventListener('close', () => {
        this.closed = true
        for (const [, p] of this.pending) p.reject(new Error('cdp connection closed'))
        this.pending.clear()
        this.emit('__close', {})
      })
      ws.addEventListener('message', (ev) => {
        let msg
        try { msg = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data)) } catch { return }
        if (msg.id !== undefined && this.pending.has(msg.id)) {
          const p = this.pending.get(msg.id); this.pending.delete(msg.id)
          if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`)); else p.resolve(msg.result || {})
        } else if (msg.method) {
          this.emit(msg.method, msg.params || {})
        }
      })
    })
  }

  send(method, params = {}) {
    if (this.closed || !this.ws || this.ws.readyState !== 1) return Promise.reject(new Error('cdp not connected'))
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(fn)
    return () => { const s = this.listeners.get(event); if (s) s.delete(fn) }
  }

  emit(event, params) {
    const s = this.listeners.get(event)
    if (!s) return
    for (const fn of s) { try { fn(params) } catch { /* listener error must not kill the socket */ } }
  }

  close() { this.closed = true; try { this.ws && this.ws.close() } catch { /* ignore */ } }
}

/** Keyboard mapping for the few non-printable keys the viewer forwards. */
const KEYS = {
  Enter: { code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Backspace: { code: 'Backspace', windowsVirtualKeyCode: 8 },
  Tab: { code: 'Tab', windowsVirtualKeyCode: 9 },
  Escape: { code: 'Escape', windowsVirtualKeyCode: 27 },
  Delete: { code: 'Delete', windowsVirtualKeyCode: 46 },
  ArrowLeft: { code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
  ArrowUp: { code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  ArrowRight: { code: 'ArrowRight', windowsVirtualKeyCode: 39 },
  ArrowDown: { code: 'ArrowDown', windowsVirtualKeyCode: 40 },
  Home: { code: 'Home', windowsVirtualKeyCode: 36 },
  End: { code: 'End', windowsVirtualKeyCode: 35 },
  PageUp: { code: 'PageUp', windowsVirtualKeyCode: 33 },
  PageDown: { code: 'PageDown', windowsVirtualKeyCode: 34 },
}

export class ViewerHub {
  /** @param {number} port DevTools port; @param {object} opts { width, height, quality, log } */
  constructor(port, opts = {}) {
    this.port = port
    this.opts = { width: 1280, height: 800, quality: 60, ...opts }
    /** targetId → { client, subscribers:Set<fn>, lastFrame, info } */
    this.views = new Map()
    this.log = opts.log || (() => {})
  }

  async targets() {
    const res = await fetch(`http://127.0.0.1:${this.port}/json/list`, { signal: AbortSignal.timeout(2000) })
    const list = await res.json()
    return list.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl).map((t) => ({ id: t.id, title: t.title, url: t.url }))
  }

  async newTab(url = 'about:blank') {
    const res = await fetch(`http://127.0.0.1:${this.port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT', signal: AbortSignal.timeout(3000) })
    return res.json()
  }

  async closeTab(id) {
    await fetch(`http://127.0.0.1:${this.port}/json/close/${id}`, { signal: AbortSignal.timeout(3000) })
    this.dropView(id)
  }

  async activate(id) {
    await fetch(`http://127.0.0.1:${this.port}/json/activate/${id}`, { signal: AbortSignal.timeout(3000) }).catch(() => {})
  }

  async view(id) {
    const existing = this.views.get(id)
    if (existing && !existing.client.closed) return existing
    const list = await fetch(`http://127.0.0.1:${this.port}/json/list`, { signal: AbortSignal.timeout(2000) }).then((r) => r.json())
    const t = list.find((x) => x.id === id && x.webSocketDebuggerUrl)
    if (!t) throw new Error('target not found: ' + id)
    const client = await new CdpClient(t.webSocketDebuggerUrl).connect()
    const v = { id, client, subscribers: new Set(), lastFrame: null, info: { title: t.title, url: t.url }, casting: false }
    this.views.set(id, v)
    client.on('__close', () => { this.views.delete(id); for (const fn of v.subscribers) { try { fn({ type: 'closed' }) } catch { /* ignore */ } } })
    client.on('Page.screencastFrame', (p) => {
      v.lastFrame = { data: p.data, metadata: p.metadata }
      // Another CDP client (Playwright adopting a new page, a second viewer) can replace or clear our viewport
      // emulation; the frame metadata says what is really being streamed. Re-assert our size, at most once a second.
      const m = p.metadata
      const mismatch = v.size && m && (Math.abs(m.deviceWidth - v.size.w) > 2 || Math.abs(m.deviceHeight - v.size.h) > 2)
      v.mismatches = mismatch ? (v.mismatches || 0) + 1 : 0
      if (mismatch && v.mismatches >= 2 && Date.now() - (v.reassertedAt || 0) > 3000) {
        v.reassertedAt = Date.now(); v.mismatches = 0
        const { w, h, dsf } = v.size
        client.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: false }).catch(() => {})
      }
      client.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {})
      for (const fn of v.subscribers) { try { fn({ type: 'frame', data: p.data, metadata: p.metadata }) } catch { /* ignore */ } }
    })
    client.on('Page.frameNavigated', (p) => {
      if (p.frame && !p.frame.parentId) { v.info.url = p.frame.url; this.broadcast(v, { type: 'nav', url: p.frame.url }) }
    })
    await client.send('Page.enable').catch(() => {})
    await client.send('Runtime.enable').catch(() => {})
    return v
  }

  broadcast(v, msg) { for (const fn of v.subscribers) { try { fn(msg) } catch { /* ignore */ } } }

  async subscribe(id, fn) {
    const v = await this.view(id)
    v.subscribers.add(fn)
    // Chrome only paints (and screencasts) the foreground tab: bring the viewed
    // page to the front, otherwise a background tab streams nothing ("连接中…").
    await this.activate(id)
    if (!v.casting) {
      v.casting = true
      await v.client.send('Page.startScreencast', { format: 'jpeg', quality: this.opts.quality, maxWidth: v.size ? Math.round(v.size.w * v.size.dsf) : this.opts.width, maxHeight: v.size ? Math.round(v.size.h * v.size.dsf) : this.opts.height, everyNthFrame: 1 }).catch((e) => { v.casting = false; throw e })
    } else if (v.lastFrame) {
      fn({ type: 'frame', ...v.lastFrame })
    }
    return () => {
      v.subscribers.delete(fn)
      if (v.subscribers.size === 0 && v.casting) {
        v.casting = false
        v.client.send('Page.stopScreencast').catch(() => {})
      }
    }
  }

  dropView(id) {
    const v = this.views.get(id)
    if (!v) return
    this.views.delete(id)
    v.client.close()
  }

  /**
   * Make the page's viewport match the live pane (CSS px) so the stream fills it instead of being
   * letterboxed; `scale` = device pixel ratio of the viewer for crisp frames. Restarts the screencast
   * with matching bounds; the mouse mapping stays in CSS px (metadata.deviceWidth/Height).
   */
  async resize(id, width, height, scale = 1, viewer = 'default') {
    const v = await this.view(id)
    // Several open panes (two browser tabs, the desktop app and a phone) may watch the same page with different
    // sizes; picking the largest of the recently-seen viewers keeps every pane uncropped instead of thrashing.
    v.viewers = v.viewers || new Map()
    v.viewers.set(String(viewer), { w: Math.round(width), h: Math.round(height), dsf: Number(scale) || 1, at: Date.now() })
    for (const [k, r] of v.viewers) if (Date.now() - r.at > 15000) v.viewers.delete(k)
    const want = [...v.viewers.values()].reduce((a, r) => ({ w: Math.max(a.w, r.w), h: Math.max(a.h, r.h), dsf: Math.max(a.dsf, r.dsf) }), { w: 0, h: 0, dsf: 1 })
    const w = Math.max(200, Math.min(4096, want.w)); const h = Math.max(150, Math.min(4096, want.h))
    const dsf = Math.max(1, Math.min(3, want.dsf))
    if (v.size && v.size.w === w && v.size.h === h && v.size.dsf === dsf) return v.size
    v.size = { w, h, dsf }
    await v.client.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: false })
    if (v.casting) {
      await v.client.send('Page.stopScreencast').catch(() => {})
      await v.client.send('Page.startScreencast', { format: 'jpeg', quality: this.opts.quality, maxWidth: Math.round(w * dsf), maxHeight: Math.round(h * dsf), everyNthFrame: 1 }).catch(() => {})
    }
    return v.size
  }
  /** Browser-level CDP session (no page needed) for cookie management; reconnects lazily. */
  async browser() {
    if (this.browserClient && !this.browserClient.closed) return this.browserClient
    const v = await fetch(`http://127.0.0.1:${this.port}/json/version`, { signal: AbortSignal.timeout(2000) }).then((r) => r.json())
    this.browserClient = await new CdpClient(v.webSocketDebuggerUrl).connect()
    return this.browserClient
  }
  /** Write cookies into the default browser context (login state the user pasted). */
  async setCookies(cookies) {
    const b = await this.browser()
    const list = (cookies || []).map((c) => ({ name: c.name, value: c.value, domain: c.domain, path: c.path || '/', ...(c.secure !== undefined ? { secure: !!c.secure } : {}), ...(c.httpOnly !== undefined ? { httpOnly: !!c.httpOnly } : {}), ...(c.sameSite ? { sameSite: c.sameSite } : {}), ...(c.expires ? { expires: c.expires } : {}) }))
    if (list.length === 0) return { set: 0 }
    await b.send('Storage.setCookies', { cookies: list })
    return { set: list.length }
  }
  /** All cookies of the default context (values included; callers summarise before showing anything). */
  async getCookies() { const b = await this.browser(); const r = await b.send('Storage.getCookies', {}); return r.cookies || [] }
  /** Delete every cookie of a domain (and its subdomains) by expiring it; `all` wipes the context. */
  async clearCookies(domain) {
    const b = await this.browser()
    if (!domain) { await b.send('Storage.clearCookies', {}); return { cleared: 'all' } }
    const want = String(domain).replace(/^\./, '').toLowerCase()
    const mine = (await this.getCookies()).filter((c) => { const d = String(c.domain || '').replace(/^\./, '').toLowerCase(); return d === want || d.endsWith('.' + want) })
    if (mine.length) await b.send('Storage.setCookies', { cookies: mine.map((c) => ({ name: c.name, value: '', domain: c.domain, path: c.path, expires: 1 })) })
    return { cleared: mine.length }
  }
  /**
   * Text layer: every visible text run of the page with its box in CSS px (viewport coordinates) plus links,
   * so the viewer can lay transparent, selectable text over the frame (select / copy / find, like a PDF viewer).
   * Capped so huge pages stay cheap; runs in the page's main world, read-only.
   */
  async textLayer(id, limit = 1500) {
    const v = await this.view(id)
    const expr = `(() => {
      const out = []; const vw = innerWidth, vh = innerHeight; const limit = ${Number(limit) || 1500}
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT
        const p = n.parentElement; if (!p) return NodeFilter.FILTER_REJECT
        const tag = p.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT } })
      let n
      while ((n = walker.nextNode()) && out.length < limit) {
        const range = document.createRange(); range.selectNodeContents(n)
        const rects = range.getClientRects(); if (!rects.length) continue
        const first = rects[0], last = rects[rects.length - 1]
        const top = Math.min(first.top, last.top), bottom = Math.max(first.bottom, last.bottom)
        if (bottom < 0 || top > vh || first.right < 0 || first.left > vw) continue
        const cs = getComputedStyle(n.parentElement)
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue
        const a = n.parentElement.closest('a[href]')
        if (rects.length === 1) out.push({ t: n.nodeValue, x: first.left, y: first.top, w: first.width, h: first.height, f: parseFloat(cs.fontSize), ff: cs.fontFamily.split(',')[0], href: a ? a.href : undefined })
        else {
          // multi-line text node: emit one box per line, splitting the text proportionally by width
          const total = [...rects].reduce((s, r) => s + r.width, 0) || 1; let pos = 0; const text = n.nodeValue
          for (const r of rects) { const len = Math.max(1, Math.round(text.length * (r.width / total))); const piece = text.slice(pos, pos + len); pos += len; if (piece.trim()) out.push({ t: piece, x: r.left, y: r.top, w: r.width, h: r.height, f: parseFloat(cs.fontSize), ff: cs.fontFamily.split(',')[0], href: a ? a.href : undefined }) }
        }
      }
      return { vw, vh, scrollX, scrollY, items: out }
    })()`
    const r = await v.client.send('Runtime.evaluate', { expression: expr, returnByValue: true })
    return r && r.result && r.result.value ? r.result.value : { vw: 0, vh: 0, items: [] }
  }
  async navigate(id, url) { const v = await this.view(id); return v.client.send('Page.navigate', { url }) }
  async reload(id) { const v = await this.view(id); return v.client.send('Page.reload') }
  async history(id, delta) {
    const v = await this.view(id)
    const h = await v.client.send('Page.getNavigationHistory')
    const idx = h.currentIndex + delta
    if (idx < 0 || idx >= h.entries.length) return { ok: false }
    await v.client.send('Page.navigateToHistoryEntry', { entryId: h.entries[idx].id })
    return { ok: true }
  }

  /** Forward a batch of viewer input events (already in page CSS pixels). */
  async input(id, events) {
    const v = await this.view(id)
    for (const e of events) {
      try {
        if (e.kind === 'mouse') {
          await v.client.send('Input.dispatchMouseEvent', {
            type: e.type, x: e.x, y: e.y, button: e.button || 'none', buttons: e.buttons || 0, clickCount: e.clickCount || 0,
            deltaX: e.deltaX || 0, deltaY: e.deltaY || 0, modifiers: e.modifiers || 0,
          })
        } else if (e.kind === 'text') {
          await v.client.send('Input.insertText', { text: e.text })
        } else if (e.kind === 'key') {
          const k = KEYS[e.key]
          if (!k) continue
          await v.client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: e.key, code: k.code, windowsVirtualKeyCode: k.windowsVirtualKeyCode, nativeVirtualKeyCode: k.windowsVirtualKeyCode, text: k.text, modifiers: e.modifiers || 0 })
          await v.client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: e.key, code: k.code, windowsVirtualKeyCode: k.windowsVirtualKeyCode, nativeVirtualKeyCode: k.windowsVirtualKeyCode, modifiers: e.modifiers || 0 })
        }
      } catch (err) { this.log('input failed: ' + err.message) }
    }
  }

  close() { for (const id of [...this.views.keys()]) this.dropView(id) }
}

/**
 * Browser-level watcher: one CDP connection to the browser endpoint that
 * discovers every page target and reports creations, navigations and closes,
 * so the web UI can react the moment the model (or anyone) navigates —
 * no polling. Reconnects while the browser is up.
 */
export class BrowserWatcher {
  constructor(port, opts = {}) {
    this.port = port
    this.log = opts.log || (() => {})
    this.subscribers = new Set()
    this.client = null
    this.stopped = false
    this.seq = 0
    this.timer = null
  }

  async start() {
    this.stopped = false
    await this.connect()
  }

  async connect() {
    if (this.stopped || (this.client && !this.client.closed)) return
    try {
      const v = await fetch(`http://127.0.0.1:${this.port}/json/version`, { signal: AbortSignal.timeout(2000) }).then((r) => r.json())
      const client = await new CdpClient(v.webSocketDebuggerUrl).connect()
      this.client = client
      const emit = (type, info) => {
        if (!info || info.type !== 'page') return
        const ev = { seq: ++this.seq, type, targetId: info.targetId, url: info.url, title: info.title, at: Date.now() }
        for (const fn of this.subscribers) { try { fn(ev) } catch { /* ignore */ } }
      }
      client.on('Target.targetCreated', (p) => emit('created', p.targetInfo))
      client.on('Target.targetInfoChanged', (p) => emit('changed', p.targetInfo))
      client.on('Target.targetDestroyed', (p) => emit('destroyed', { type: 'page', targetId: p.targetId }))
      client.on('__close', () => { this.client = null; this.scheduleReconnect() })
      await client.send('Target.setDiscoverTargets', { discover: true })
    } catch (e) {
      this.log('watcher connect failed: ' + e.message)
      this.scheduleReconnect()
    }
  }

  scheduleReconnect() {
    if (this.stopped || this.timer) return
    this.timer = setTimeout(() => { this.timer = null; this.connect() }, 3000)
    if (this.timer.unref) this.timer.unref()
  }

  subscribe(fn) { this.subscribers.add(fn); return () => { this.subscribers.delete(fn) } }
  /** Push a custom event to every /events listener (used to ask the desktop shell's page to open a native tab). */
  emit(ev) { const e = { seq: ++this.seq, at: Date.now(), ...ev }; for (const fn of this.subscribers) { try { fn(e) } catch { /* ignore */ } } }

  stop() {
    this.stopped = true
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    if (this.client) { this.client.close(); this.client = null }
  }
}
