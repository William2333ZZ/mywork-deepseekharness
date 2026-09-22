/**
 * MyWork DSH — desktop shell (Electron main process).
 *
 * The app is a thin window around DeepSeek Harness: it starts the bundled dsh with
 * the bundled Node runtime, waits for the token URL on stdout, and loads it in a
 * BrowserWindow. Everything user-specific lives in a writable DSH_HOME under the
 * OS app-data folder; on first launch the pre-installed profile template (all
 * MyWork Kit plugins) is copied there. A bundled Chrome for Testing serves the
 * real-browser plugin and Univer's screenshots, so nothing depends on a system
 * Chrome. Nothing here patches dsh itself.
 */
'use strict'
const { app, BrowserWindow, shell, dialog, Menu } = require('electron')
const { spawn, execFile } = require('node:child_process')
const { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, appendFileSync } = require('node:fs')
const { join, dirname } = require('node:path')
const net = require('node:net')

const APP_NAME = 'MyWork DSH'
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

let child = null
let win = null

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
      ...(existsSync(CHROME) ? { MYWORK_BROWSER_EXECUTABLE: CHROME, UNIVER_RENDER_BROWSER: CHROME } : {}),
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
    child.on('exit', (code) => { log(`dsh exited with code ${code}`); if (!settled) { settled = true; reject(new Error(`dsh exited early (code ${code}). See ${LOG}`)) } else if (win && !win.isDestroyed()) { win.loadURL('data:text/html,<meta charset=utf-8><body style="font-family:system-ui;padding:40px;color:%23444"><h2>DSH 已退出（code ' + code + '）</h2><p>日志：' + LOG + '</p><p>请重新启动应用。</p>') } })
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

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 600, title: APP_NAME, show: false,
    backgroundColor: '#111111', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  })
  win.once('ready-to-show', () => win.show())
  // Links the page opens in a new window (system-browser buttons, docs) go to the OS browser.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' } })
  win.on('closed', () => { win = null })
  win.loadURL('data:text/html,<meta charset=utf-8><body style="background:%23111;color:%23bbb;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div>正在启动 DeepSeek Harness…</div>')
}

app.setName(APP_NAME)
app.on('window-all-closed', () => { stopDsh(); app.quit() })
app.on('before-quit', stopDsh)

app.whenReady().then(async () => {
  Menu.setApplicationMenu(IS_WIN ? null : Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]))
  createWindow()
  try {
    if (!existsSync(NODE) || !existsSync(DSH_BIN)) throw new Error(`bundled runtime missing (${NODE})`)
    ensureHome()
    const port = await freePort()
    const url = await startDsh(port)
    if (win && !win.isDestroyed()) win.loadURL(url)
  } catch (e) {
    log('startup failed: ' + (e && e.stack || e))
    dialog.showErrorBox(APP_NAME, String(e && e.message || e))
    app.quit()
  }
})
