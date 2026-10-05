/**
 * dsh-mywork-tasks — plain HTTP(S) GET for prechecks (EDITIONS.md 4.1): Node only, no packages, through the proxy when
 * one is set. Node's fetch ignores HTTP(S)_PROXY, and in mainland China overseas sources (models.dev, OpenRouter,
 * deprecations.info) usually need it while Chinese vendors' pages fail through it, so each domain tries one route first
 * and falls back to the other:
 *
 *   direct first   *.cn and the Chinese vendors (deepseek.com, aliyun.com, volcengine.com, moonshot.cn, bigmodel.cn …)
 *   proxy first    everything else, when a proxy is configured (HTTPS_PROXY / HTTP_PROXY / ALL_PROXY, http:// only)
 *
 *   getText(url, { timeoutMs, maxBytes, headers }) → { status, url, text, via: 'direct' | 'proxy' }   (throws on failure)
 *   postJson(url, body, { timeoutMs, headers })    → { status, json, text, via }   (an HTTP error status is returned, not thrown)
 *
 * Redirects (≤5) are followed; gzip / deflate / br are decoded; bodies above maxBytes are cut (truncated: true).
 */
import http from 'node:http'
import https from 'node:https'
import tls from 'node:tls'
import zlib from 'node:zlib'

const DIRECT_FIRST = /(^|\.)(cn|deepseek\.com|aliyun\.com|aliyuncs\.com|volcengine\.com|bytedance\.com|moonshot\.cn|bigmodel\.cn|zhipuai\.cn|baidu\.com|bce\.baidu\.com|tencent\.com|qq\.com|xfyun\.cn|minimaxi\.com|siliconflow\.cn|npmmirror\.com)$/i
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 MyWork'

/** The configured http:// proxy as a URL, or null. NO_PROXY hosts (suffix match, `*` = all) never use it. */
export function proxyFor(host, env = process.env) {
  const raw = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || env.ALL_PROXY || env.all_proxy || ''
  if (!raw) return null
  let u
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'http:') return null
  const no = String(env.NO_PROXY || env.no_proxy || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const h = String(host || '').toLowerCase()
  if (no.some((n) => n === '*' || h === n.replace(/^\./, '') || h.endsWith(n.startsWith('.') ? n : '.' + n))) return null
  return u
}

/** The two routes in the order this host tries them. */
export function routesFor(host, env = process.env) {
  const proxy = proxyFor(host, env)
  if (!proxy) return [{ via: 'direct' }]
  return DIRECT_FIRST.test(String(host || '')) ? [{ via: 'direct' }, { via: 'proxy', proxy }] : [{ via: 'proxy', proxy }, { via: 'direct' }]
}

function tunnel(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const headers = { host: host + ':' + port }
    if (proxy.username) headers['proxy-authorization'] = 'Basic ' + Buffer.from(decodeURIComponent(proxy.username) + ':' + decodeURIComponent(proxy.password || '')).toString('base64')
    const req = http.request({ host: proxy.hostname, port: Number(proxy.port) || 80, method: 'CONNECT', path: host + ':' + port, headers, timeout: timeoutMs })
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) { socket.destroy(); reject(new Error('proxy CONNECT ' + res.statusCode)); return }
      resolve(socket)
    })
    req.on('timeout', () => req.destroy(new Error('proxy timeout')))
    req.on('error', reject)
    req.end()
  })
}

function decode(res, buf) {
  const enc = String(res.headers['content-encoding'] || '').toLowerCase()
  try {
    if (enc === 'gzip' || enc === 'x-gzip') return zlib.gunzipSync(buf)
    if (enc === 'deflate') return zlib.inflateSync(buf)
    if (enc === 'br') return zlib.brotliDecompressSync(buf)
  } catch {}
  return buf
}

async function once(url, route, { timeoutMs, maxBytes, headers, method = 'GET', body = null }) {
  const u = new URL(url)
  const secure = u.protocol === 'https:'
  const port = Number(u.port) || (secure ? 443 : 80)
  const reqHeaders = { 'user-agent': UA, accept: '*/*', 'accept-encoding': 'gzip, deflate, br', 'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8', ...(headers || {}) }
  if (body) reqHeaders['content-length'] = String(Buffer.byteLength(body))
  const opts = { method, headers: reqHeaders, timeout: timeoutMs }
  let mod = secure ? https : http
  if (route.via === 'proxy') {
    if (secure) {
      const socket = await tunnel(route.proxy, u.hostname, port, timeoutMs)
      Object.assign(opts, { host: u.hostname, port, path: u.pathname + u.search, servername: u.hostname, createConnection: () => tls.connect({ socket, servername: u.hostname }) })
    } else {
      mod = http
      Object.assign(opts, { host: route.proxy.hostname, port: Number(route.proxy.port) || 80, path: u.href, headers: { ...reqHeaders, host: u.host } })
    }
  } else Object.assign(opts, { host: u.hostname, port, path: u.pathname + u.search, servername: u.hostname })
  return new Promise((resolve, reject) => {
    const req = mod.request(opts, (res) => {
      const chunks = []
      let n = 0
      let truncated = false
      res.on('data', (c) => { if (truncated) return; n += c.length; if (n > maxBytes) { truncated = true; chunks.push(c.subarray(0, c.length - (n - maxBytes))); res.destroy(); return } chunks.push(c) })
      const end = () => resolve({ status: res.statusCode || 0, headers: res.headers, body: decode(res, Buffer.concat(chunks)), truncated })
      res.on('end', end)
      res.on('close', () => { if (truncated) end() })
      res.on('error', (e) => { if (truncated) end(); else reject(e) })
    })
    req.on('timeout', () => req.destroy(new Error('timeout after ' + timeoutMs + ' ms')))
    req.on('error', reject)
    req.end(body || undefined)
  })
}

/** GET a URL as text, following redirects; tries the host's routes in order (see the header). */
export async function getText(url, { timeoutMs = 20000, maxBytes = 12 * 1024 * 1024, headers, env } = {}) {
  let current = String(url)
  for (let hop = 0; hop < 6; hop += 1) {
    const host = new URL(current).hostname
    let last = null
    let res = null
    let via = ''
    for (const route of routesFor(host, env)) {
      try { res = await once(current, route, { timeoutMs, maxBytes, headers }); via = route.via; break } catch (e) { last = e }
    }
    if (!res) throw last || new Error('unreachable')
    if (res.status >= 300 && res.status < 400 && res.headers.location) { current = new URL(res.headers.location, current).href; continue }
    if (res.status >= 400) throw Object.assign(new Error('HTTP ' + res.status), { status: res.status })
    return { status: res.status, url: current, text: res.body.toString('utf8'), via, truncated: res.truncated }
  }
  throw new Error('too many redirects')
}

/**
 * POST a JSON body (a model API call): the same routes as getText, the second tried only when the first could not
 * connect. The response comes back whatever its status, parsed as JSON when it is JSON.
 */
export async function postJson(url, body, { timeoutMs = 120000, headers, env } = {}) {
  const host = new URL(url).hostname
  const payload = JSON.stringify(body)
  let last = null
  for (const route of routesFor(host, env)) {
    try {
      const res = await once(url, route, { timeoutMs, maxBytes: 8 * 1024 * 1024, headers: { 'content-type': 'application/json', accept: 'application/json', ...(headers || {}) }, method: 'POST', body: payload })
      const text = res.body.toString('utf8')
      let json = null
      try { json = JSON.parse(text) } catch {}
      return { status: res.status, json, text, via: route.via }
    } catch (e) { last = e }
  }
  throw last || new Error('unreachable')
}
