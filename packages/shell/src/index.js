/**
 * dsh-mywork-shell — host half.
 *
 * The theme and zoom live in the browser. The host only serves the bundled web fonts
 * (packages/shell/fonts, SIL OFL, fetched by scripts/fetch-fonts.mjs) so the styles work
 * offline and behind blocked CDNs:
 *   GET /mywork-shell/fonts.css        @font-face sheet (relative urls → the files below)
 *   GET /mywork-shell/fonts/<file>     woff2, immutable
 * Both go through dsh's connection auth like every other kit route.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const name = 'dsh-mywork-shell'
export const inject = []

const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fonts')

function rejectUntrusted(ctx, req, res) {
  let connection
  try { connection = ctx.get('connection') } catch { connection = undefined }
  if (!connection || typeof connection.requestRejection !== 'function') return false
  let code
  try { code = connection.requestRejection(req) } catch { code = 503 }
  if (code === undefined) return false
  res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
  res.end(code === 401 ? 'login required' : 'rejected')
  return true
}

export function apply(ctx) {
  ctx.inject(['webServer'], (wctx) => {
    if (!existsSync(FONTS_DIR)) return
    const send = (res, body, type, cache) => { res.writeHead(200, { 'content-type': type, 'cache-control': cache, 'content-length': body.length }); res.end(body) }
    const css = readFileSync(join(FONTS_DIR, 'fonts.css'))
    wctx.webServer.register({
      kind: 'exact', path: '/mywork-shell/fonts.css',
      handler: (req, res) => { if (!rejectUntrusted(ctx, req, res)) send(res, css, 'text/css; charset=utf-8', 'no-cache') },
    })
    for (const file of readdirSync(FONTS_DIR).filter((f) => f.endsWith('.woff2'))) {
      const body = readFileSync(join(FONTS_DIR, file))
      wctx.webServer.register({
        kind: 'exact', path: '/mywork-shell/fonts/' + file,
        handler: (req, res) => { if (!rejectUntrusted(ctx, req, res)) send(res, body, 'font/woff2', 'public, max-age=31536000, immutable') },
      })
    }
  })
}
