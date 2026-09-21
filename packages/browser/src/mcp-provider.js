/**
 * dsh-mywork-browser — Playwright MCP for EVERY session (host side).
 *
 * dsh's official provider (@deepseek-ai/dsh-experimental-browser-use-playwright-mcp)
 * hard-codes `exclusive: true` in `attach` mode: the first live session claims the
 * attached browser and every other session gets no browser tools ("browser tool
 * belongs to another Session"). This kit shares one background Chrome between all
 * conversations, so we mount the very same runtime ourselves with `exclusive: false`:
 * each live session gets its own Playwright MCP server process attached to the same
 * Chrome over CDP (same tabs, same live view).
 *
 * The runtime and the pinned @playwright/mcp come from the official packages
 * installed in the dsh profile (kit members); they are imported from the profile
 * directory so dsh routes their `@deepseek-ai/*` imports to its own single copies.
 */
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const RUNTIME = '@deepseek-ai/dsh-experimental-browser-use-runtime'
const PROVIDER = '@deepseek-ai/dsh-experimental-browser-use-playwright-mcp'
export const PROVIDER_NAME = 'playwright-mcp'

const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')

/** The profile that has the runtime installed; prefer the one that also holds this package. */
export function findProfileDir(env = process.env) {
  const root = join(dshHome(env), 'profiles')
  let names = []
  try { names = readdirSync(root).filter((n) => !n.startsWith('.') && n !== 'node_modules') } catch { return null }
  const candidates = names.map((n) => join(root, n)).filter((dir) => existsSync(join(dir, 'node_modules', RUNTIME, 'lib', 'types', 'mcp.js')))
  return candidates.find((dir) => existsSync(join(dir, 'node_modules', 'dsh-mywork-browser'))) || candidates[0] || null
}

/**
 * Mount Playwright MCP non-exclusively. Resolves and imports the runtime lazily so the
 * plugin still loads (with a warning) when the official packages are not installed.
 */
export async function mountSharedPlaywright(ctx, { port, toolCallTimeoutMs, log, warn }) {
  const profileDir = findProfileDir()
  if (!profileDir) { warn(`${RUNTIME} is not installed in any profile; the model gets no browser tools (install the kit members @deepseek-ai/dsh-browser-use + ${PROVIDER})`); return false }
  const runtimeUrl = pathToFileURL(join(profileDir, 'node_modules', RUNTIME, 'lib', 'types', 'mcp.js')).href
  const { mountSessionMcp } = await import(runtimeUrl)
  const providerDir = join(profileDir, 'node_modules', PROVIDER)
  const require = createRequire(join(existsSync(providerDir) ? providerDir : profileDir, 'package.json'))
  let cli
  try { cli = join(dirname(require.resolve('@playwright/mcp/package.json')), 'cli.js') } catch (e) { warn('@playwright/mcp not found next to the official provider: ' + e.message); return false }
  const env = Object.fromEntries(Object.keys(process.env).filter((k) => k.toUpperCase().startsWith('PLAYWRIGHT_MCP_')).map((k) => [k, '']))
  mountSessionMcp(ctx, {
    name: PROVIDER_NAME,
    exclusive: false,
    command: process.execPath,
    args: [cli, '--browser', 'chromium', '--cdp-endpoint', `http://127.0.0.1:${port}`],
    env,
    ...(toolCallTimeoutMs ? { toolCallTimeoutMs } : {}),
  })
  log(`Playwright MCP mounted for every session (attach http://127.0.0.1:${port}, non-exclusive)`)
  return true
}
