/**
 * dsh-mywork-browser — Chrome launcher (host side, zero dependencies).
 *
 * Finds a Chromium-family browser on this machine, starts it in the background
 * (new headless mode by default) with a loopback-only DevTools port, and waits
 * for the port to answer. The same browser is then shared by:
 *   • the official Playwright MCP provider (mode: attach) — the model drives it
 *   • this plugin's CDP viewer (src/cdp.js) — the web UI renders and controls it
 */
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  linux: [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge',
  ],
}

export function dshHome(env = process.env) { return env.DSH_HOME || join(homedir(), '.dsh') }

/** First existing browser binary: env override, config, then platform candidates. */
export function findExecutable(configured, env = process.env) {
  const tries = [env.MYWORK_BROWSER_EXECUTABLE, configured, ...(CANDIDATES[process.platform] || [])].filter(Boolean)
  for (const p of tries) if (existsSync(p)) return p
  return null
}

async function waitForDevTools(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1500) })
      if (res.ok) return await res.json()
    } catch (e) { lastError = e }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`DevTools port ${port} did not answer within ${timeoutMs} ms${lastError ? ': ' + lastError.message : ''}`)
}

/** Is something already listening on the DevTools port (e.g. a previous run)? */
export async function probe(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(800) })
    return res.ok ? await res.json() : null
  } catch { return null }
}

/**
 * Launch the browser. Returns { child, port, version, executable } — or, when a
 * browser already answers on the port, { child: null, ... } (adopted, not owned).
 */
export async function launchChrome(opts) {
  const port = opts.port
  const existing = await probe(port)
  if (existing) return { child: null, port, version: existing, executable: null, adopted: true }
  const executable = findExecutable(opts.executablePath)
  if (!executable) throw new Error('no Chrome / Chromium / Edge found; set MYWORK_BROWSER_EXECUTABLE or config.executablePath')
  const userDataDir = opts.userDataDir || join(dshHome(), 'mywork', 'chrome-profile')
  mkdirSync(userDataDir, { recursive: true })
  const args = [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${userDataDir}`,
    // headless new sizes the window in physical pixels: scale it with the forced ratio, otherwise the screencast
    // surface is smaller than the emulated viewport and frames come back cropped
    `--window-size=${Math.round(opts.width * (Number(opts.pixelRatio) > 1 ? Number(opts.pixelRatio) : 1))},${Math.round(opts.height * (Number(opts.pixelRatio) > 1 ? Number(opts.pixelRatio) : 1))}`,
    '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--disable-features=TranslateUI', '--hide-crash-restore-bubble',
  ]
  const proxy = opts.proxy || process.env.MYWORK_BROWSER_PROXY
  if (proxy) args.push(`--proxy-server=${proxy}`)
  // The screencast streams at the browser's own scale factor: launch at the viewer's (Retina) ratio so live
  // frames are crisp instead of 1x-upscaled. Emulation overrides per tab still apply on top.
  const ratio = Number(opts.pixelRatio)
  if (ratio > 1 && ratio <= 3) args.push(`--force-device-scale-factor=${ratio}`)
  if (opts.headless) args.push('--headless=new', '--disable-gpu')
  args.push('about:blank')
  const child = spawn(executable, args, { stdio: ['ignore', 'ignore', 'pipe'], detached: false })
  let stderr = ''
  child.stderr.on('data', (c) => { stderr = (stderr + c).slice(-4000) })
  const exited = new Promise((resolve) => child.once('exit', (code) => resolve(code)))
  try {
    const version = await Promise.race([
      waitForDevTools(port, opts.startupTimeoutMs || 20000),
      exited.then((code) => { throw new Error(`browser exited early (code ${code}): ${stderr.trim().split('\n').pop() || ''}`) }),
    ])
    return { child, port, version, executable, adopted: false }
  } catch (e) {
    try { child.kill('SIGKILL') } catch { /* ignore */ }
    throw e
  }
}

export function killChrome(handle) {
  if (!handle || !handle.child) return
  try { handle.child.kill('SIGTERM') } catch { /* ignore */ }
  const c = handle.child
  setTimeout(() => { try { c.kill('SIGKILL') } catch { /* ignore */ } }, 3000).unref()
}
