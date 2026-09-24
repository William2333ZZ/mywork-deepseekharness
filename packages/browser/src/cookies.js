/**
 * Cookie import for the background Chrome (login state you already have elsewhere).
 *
 * Accepts the three formats people actually have at hand and turns them into CDP
 * `Storage.setCookies` entries:
 *   1. JSON array — Cookie-Editor / EditThisCookie export, or CDP-shaped objects:
 *      [{ name, value, domain, path, expirationDate | expires, secure, httpOnly, sameSite }]
 *   2. Netscape cookies.txt — `domain<TAB>flag<TAB>path<TAB>secure<TAB>expiry<TAB>name<TAB>value`
 *   3. A raw `Cookie:` header — `web_session=abc; a1=xyz` — which needs a domain.
 *
 * Values are never logged or echoed back; summaries strip them.
 */

const SAME_SITE = { strict: 'Strict', lax: 'Lax', none: 'None', no_restriction: 'None', unspecified: undefined }

function cleanDomain(d) {
  let s = String(d || '').trim()
  if (!s) return ''
  s = s.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/:\d+$/, '')
  return s
}

function toEntry(raw, fallbackDomain) {
  if (!raw || typeof raw !== 'object') return null
  const name = String(raw.name ?? raw.key ?? '').trim()
  if (!name) return null
  const value = raw.value === undefined || raw.value === null ? '' : String(raw.value)
  const domain = cleanDomain(raw.domain || raw.host || fallbackDomain)
  if (!domain) return null
  const out = { name, value, domain, path: String(raw.path || '/') }
  if (raw.secure !== undefined) out.secure = !!raw.secure
  if (raw.httpOnly !== undefined) out.httpOnly = !!raw.httpOnly
  const exp = raw.expires ?? raw.expirationDate ?? raw.expiry
  if (exp !== undefined && exp !== null && exp !== '' && Number.isFinite(Number(exp)) && Number(exp) > 0) out.expires = Math.floor(Number(exp))
  const ss = raw.sameSite === undefined || raw.sameSite === null ? undefined : SAME_SITE[String(raw.sameSite).toLowerCase()]
  if (ss) out.sameSite = ss
  // A "None" cookie must be Secure or Chrome drops it.
  if (out.sameSite === 'None') out.secure = true
  // `__Host-` / `__Secure-` prefixes are only accepted on secure cookies.
  if (/^__(Host|Secure)-/.test(name)) out.secure = true
  return out
}

function parseNetscape(text, fallbackDomain) {
  const out = []
  for (const line of String(text).split(/\r?\n/)) {
    const l = line.trim()
    if (!l || (l.startsWith('#') && !l.startsWith('#HttpOnly_'))) continue
    const parts = l.split('\t')
    if (parts.length < 7) continue
    const [domain, , path, secure, expiry, name, ...rest] = parts
    out.push(toEntry({ domain: domain.replace(/^#HttpOnly_/, ''), path, secure: /true/i.test(secure), expires: Number(expiry) || undefined, name, value: rest.join('\t'), httpOnly: /^#HttpOnly_/.test(domain) }, fallbackDomain))
  }
  return out.filter(Boolean)
}

function parseHeader(text, fallbackDomain) {
  const out = []
  for (const part of String(text).replace(/^\s*cookie:\s*/i, '').split(/;\s*/)) {
    const i = part.indexOf('=')
    if (i <= 0) continue
    out.push(toEntry({ name: part.slice(0, i).trim(), value: part.slice(i + 1).trim(), path: '/' }, fallbackDomain))
  }
  return out.filter(Boolean)
}

/**
 * @param {string} text  pasted cookies in any supported format
 * @param {string} [domain]  domain used when the text carries none (raw header, JSON without domain)
 * @returns {{ cookies: object[], format: 'json'|'netscape'|'header'|'empty', error?: string }}
 */
export function parseCookies(text, domain) {
  const raw = String(text || '').trim()
  const fallback = cleanDomain(domain)
  if (!raw) return { cookies: [], format: 'empty' }
  if (raw.startsWith('[') || raw.startsWith('{')) {
    let data
    try { data = JSON.parse(raw) } catch (e) { return { cookies: [], format: 'json', error: 'invalid JSON: ' + e.message } }
    if (!Array.isArray(data)) data = Array.isArray(data.cookies) ? data.cookies : [data]
    const cookies = data.map((c) => toEntry(c, fallback)).filter(Boolean)
    return { cookies, format: 'json', ...(cookies.length === 0 && data.length ? { error: fallback ? 'no usable cookie entries' : 'entries carry no domain; give the domain' } : {}) }
  }
  if (/\t/.test(raw)) return { cookies: parseNetscape(raw, fallback), format: 'netscape' }
  if (!fallback) return { cookies: [], format: 'header', error: 'a raw name=value list needs the domain (e.g. .xiaohongshu.com)' }
  return { cookies: parseHeader(raw, fallback), format: 'header' }
}

/** Strip values for listings and tool output. */
export function summarize(cookies) {
  return (cookies || []).map((c) => ({ name: c.name, domain: c.domain, path: c.path || '/', expires: c.expires && c.expires > 0 ? new Date(c.expires * 1000).toISOString() : 'session', secure: !!c.secure, httpOnly: !!c.httpOnly }))
}

/** Group a cookie listing by registrable-ish domain for the settings page. */
export function groupByDomain(cookies) {
  const map = new Map()
  for (const c of cookies || []) {
    const d = String(c.domain || '').replace(/^\./, '')
    const e = map.get(d) || { domain: d, count: 0, names: [] }
    e.count++; if (e.names.length < 6) e.names.push(c.name)
    map.set(d, e)
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))
}

export function domainMatches(cookieDomain, wanted) {
  const c = String(cookieDomain || '').replace(/^\./, '').toLowerCase()
  const w = cleanDomain(wanted).replace(/^\./, '').toLowerCase()
  return !!w && (c === w || c.endsWith('.' + w) || w.endsWith('.' + c))
}
