/**
 * Mywork-DSH_desktop — desktop shell (Electron main process).
 *
 * The app is a thin window around DeepSeek Harness: it starts the bundled dsh with the bundled
 * Node runtime, waits for the token URL on stdout, and loads it in a BrowserWindow. Everything
 * user-specific lives in a writable DSH_HOME under the OS app-data folder; on first launch the
 * pre-installed profile template (all MyWork Kit plugins) is copied there. Nothing here patches dsh.
 *
 * Native live browser (Claude-Code style): Electron itself exposes a DevTools port, and the kit's
 * browser plugin attaches to it instead of launching a background Chrome. Each browser tab is a
 * real WebContentsView embedded in this window at the exact spot of the right-hand "实时浏览器"
 * pane (bounds are reported by the page through the preload bridge), so pages render natively,
 * scroll natively and can be logged into like any browser. Playwright (mounted by the plugin) drives
 * the very same tabs over CDP.
 *
 * Dev run without packaging: MYWORK_DESKTOP_DEV_URL=<token url of a running dsh> electron .
 */
'use strict'
const { app, BrowserWindow, WebContentsView, shell, dialog, Menu, ipcMain } = require('electron')
const { spawn, execFile } = require('node:child_process')
const { existsSync, mkdirSync, cpSync, appendFileSync } = require('node:fs')
const { join, dirname } = require('node:path')
const net = require('node:net')

const APP_NAME = 'Mywork-DSH_desktop'
const DEV_URL = process.env.MYWORK_DESKTOP_DEV_URL || ''
const RUNTIME = join(process.resourcesPath, 'runtime')
const IS_WIN = process.platform === 'win32'
const NODE = join(RUNTIME, 'node', IS_WIN ? 'node.exe' : 'bin/node')
const DSH_BIN = join(RUNTIME, 'dsh', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const CHROME = IS_WIN
  ? join(RUNTIME, 'chrome', 'chrome-win64', 'chrome.exe')
  : join(RUNTIME, 'chrome', 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
const TEMPLATE = join(RUNTIME, 'profile-template')

const DATA_DIR = join(app.getPath('appData'), APP_NAME)
const DSH_HOME = join(DATA_DIR, 'home')
const LOG = join(DATA_DIR, 'dsh.log')
// The DevTools port the kit's browser plugin attaches to (it reads MYWORK_BROWSER_PORT). Fixed so the
// plugin and the shell agree before either is running; override both with the env var if it clashes.
const CDP_PORT = Number(process.env.MYWORK_BROWSER_PORT) || 9333
app.commandLine.appendSwitch('remote-debugging-port', String(CDP_PORT))
app.commandLine.appendSwitch('remote-debugging-address', '127.0.0.1')

let child = null
let win = null
let appOrigin = null

function log(line) { try { mkdirSync(DATA_DIR, { recursive: true }); appendFileSync(LOG, `[${new Date().toISOString()}] ${line}\n`) } catch { /* ignore */ } }

/** First launch: materialize the writable home from the bundled template. */
function ensureHome() {
  const profile = join(DSH_HOME, 'profiles', 'web')
  if (existsSync(join(profile, 'package.json'))) return
  mkdirSync(dirname(profile), { recursive: true })
  cpSync(TEMPLATE, profile, { recursive: true })
  log('profile template copied to ' + profile)
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)) })
    s.on('error', reject)
  })
}

function startDsh(port) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      DSH_HOME,
      PATH: `${dirname(NODE)}${IS_WIN ? ';' : ':'}${process.env.PATH || ''}`,
      // Univer renders with the bundled Chrome; the live browser attaches to THIS app's Chromium.
      ...(existsSync(CHROME) ? { UNIVER_RENDER_BROWSER: CHROME } : {}),
      MYWORK_BROWSER_PORT: String(CDP_PORT),
      MYWORK_DESKTOP: '1',
      ELECTRON_RUN_AS_NODE: '1',
    }
    const args = [DSH_BIN, 'web', '--port', String(port), '--no-open']
    log(`starting: ${NODE} ${args.join(' ')}`)
    child = spawn(NODE, args, { env, cwd: DSH_HOME, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let buffer = ''
    let settled = false
    const onData = (chunk) => {
      const text = String(chunk)
      log(text.trimEnd())
      if (settled) return
      buffer += text
      const m = buffer.match(/dsh web: (http:\/\/[^\s]+)/)
      if (m) { settled = true; resolve(m[1]) }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('exit', (code) => { log(`dsh exited with code ${code}`); if (!settled) { settled = true; reject(new Error(`dsh exited early (code ${code}). See ${LOG}`)) } else if (win && !win.isDestroyed()) { dialog.showErrorBox(APP_NAME, `dsh exited (code ${code}). See ${LOG}`); app.quit() } })
    child.on('error', (e) => { if (!settled) { settled = true; reject(e) } })
    setTimeout(() => { if (!settled) { settled = true; reject(new Error(`dsh did not report its URL within 90s. See ${LOG}`)) } }, 90000)
  })
}

function stopDsh() {
  if (!child || child.exitCode !== null) return
  const pid = child.pid
  if (IS_WIN) { try { execFile('taskkill', ['/pid', String(pid), '/T', '/F'], () => {}) } catch { /* ignore */ } }
  else { try { child.kill('SIGTERM') } catch { /* ignore */ } setTimeout(() => { try { child.kill('SIGKILL') } catch { /* ignore */ } }, 3000) }
}

// ---------------------------------------------------------------------------------------------
// Native browser tabs
// ---------------------------------------------------------------------------------------------
/** @type {Map<string, { view: import('electron').WebContentsView, targetId: string }>} */
const tabs = new Map()
let activeTargetId = null
let bounds = null // { x, y, width, height } in window CSS px, or null when the pane is hidden

/** The CDP target id of a webContents: the id the plugin sees on the DevTools port. */
async function targetIdOf(wc) {
  const attached = wc.debugger.isAttached()
  if (!attached) wc.debugger.attach('1.3')
  try { const r = await wc.debugger.sendCommand('Target.getTargetInfo'); return r && r.targetInfo ? r.targetInfo.targetId : null } finally { if (!attached) { try { wc.debugger.detach() } catch { /* ignore */ } } }
}

function layout() {
  for (const [id, tab] of tabs) {
    const show = id === activeTargetId && bounds && bounds.width > 0 && bounds.height > 0 && win && !win.isDestroyed()
    try { tab.view.setVisible(!!show) } catch { /* older Electron */ }
    if (show) tab.view.setBounds({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) })
    else tab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 })
  }
}

async function newTab(url) {
  const view = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } })
  const wc = view.webContents
  wc.setWindowOpenHandler(({ url: target }) => { newTab(target).catch(() => {}); return { action: 'deny' } })
  const targetId = await targetIdOf(wc)
  if (!targetId) { wc.close(); throw new Error('could not resolve the tab\'s target id') }
  tabs.set(targetId, { view, targetId })
  if (win && !win.isDestroyed()) win.contentView.addChildView(view)
  wc.on('destroyed', () => { tabs.delete(targetId); if (activeTargetId === targetId) activeTargetId = tabs.size ? [...tabs.keys()].pop() : null; layout() })
  activeTargetId = targetId
  layout()
  try { await wc.loadURL(url && url !== 'about:blank' ? url : 'about:blank') } catch { /* navigation errors surface in the page */ }
  return targetId
}

function closeTab(targetId) {
  const tab = tabs.get(targetId)
  if (!tab) return false
  try { if (win && !win.isDestroyed()) win.contentView.removeChildView(tab.view) } catch { /* ignore */ }
  try { tab.view.webContents.close() } catch { /* ignore */ }
  tabs.delete(targetId)
  if (activeTargetId === targetId) activeTargetId = tabs.size ? [...tabs.keys()].pop() : null
  layout()
  return true
}

ipcMain.handle('mywork:browser:new-tab', (_e, { url }) => newTab(url))
ipcMain.handle('mywork:browser:select', (_e, { targetId }) => { if (tabs.has(targetId)) { activeTargetId = targetId; layout(); return true } return false })
ipcMain.handle('mywork:browser:close', (_e, { targetId }) => closeTab(targetId))
ipcMain.handle('mywork:browser:bounds', (_e, rect) => { bounds = rect; layout(); return true })
ipcMain.handle('mywork:browser:list', () => [...tabs.values()].map(({ view, targetId }) => ({ targetId, url: view.webContents.getURL(), title: view.webContents.getTitle(), active: targetId === activeTargetId })))

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 600, title: APP_NAME, show: false,
    backgroundColor: '#111111', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, preload: join(__dirname, 'preload.js') },
  })
  win.once('ready-to-show', () => win.show())
  // Links the page opens in a new window (system-browser buttons, docs) go to the OS browser.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' } })
  // The app window only ever shows dsh: anything else that tries to navigate it (a stray automation
  // step, a link) is refused, so the UI cannot be hijacked through the shared DevTools port.
  win.webContents.on('will-navigate', (e, url) => { if (appOrigin && !url.startsWith(appOrigin)) { e.preventDefault(); log('blocked navigation of the app window to ' + url) } })
  win.on('resize', layout)
  win.on('closed', () => { win = null })
  win.loadURL('data:text/html,<meta charset=utf-8><body style="background:%23111;color:%23bbb;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div>正在启动 DeepSeek Harness…</div></body>')
}

app.setName(APP_NAME)
app.on('window-all-closed', () => { stopDsh(); app.quit() })
app.on('before-quit', stopDsh)

app.whenReady().then(async () => {
  Menu.setApplicationMenu(IS_WIN ? null : Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]))
  createWindow()
  try {
    let url = DEV_URL
    if (!url) {
      if (!existsSync(NODE) || !existsSync(DSH_BIN)) throw new Error(`bundled runtime missing (${NODE})`)
      ensureHome()
      const port = await freePort()
      url = await startDsh(port)
    } else log('dev mode: attaching to ' + url)
    appOrigin = new URL(url).origin
    if (win && !win.isDestroyed()) win.loadURL(url)
  } catch (e) {
    log('startup failed: ' + (e && e.stack || e))
    dialog.showErrorBox(APP_NAME, String(e && e.message || e))
    app.quit()
  }
})
