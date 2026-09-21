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
      await v.client.send('Page.startScreencast', { format: 'jpeg', quality: this.opts.quality, maxWidth: this.opts.width, maxHeight: this.opts.height, everyNthFrame: 1 }).catch((e) => { v.casting = false; throw e })
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

  stop() {
    this.stopped = true
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    if (this.client) { this.client.close(); this.client = null }
  }
}
