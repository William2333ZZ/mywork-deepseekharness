/**
 * dsh-mywork-oracle — patrol push. Reads the Feishu / Lark accounts dsh-im-connect keeps in
 * $DSH_HOME/dsh-im-connect/channels.json and sends the digest through the bot API, the same way
 * dsh-mywork-im's direct push does. Kept self-contained so the oracle package has no runtime
 * dependency on the IM package; secrets never leave this module.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const BASES = { feishu: 'https://open.feishu.cn', lark: 'https://open.larksuite.com' }
const tokens = new Map()
const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')

/** Feishu / Lark accounts that can receive a direct push: [{ id, name, platform }] (no secrets). */
export function patrolTargets(env = process.env) {
  const file = join(dshHome(env), 'dsh-im-connect', 'channels.json')
  if (!existsSync(file)) return []
  let channels = {}
  try { channels = (JSON.parse(readFileSync(file, 'utf8')) || {}).channels || {} } catch { return [] }
  return Object.values(channels).filter((c) => c && c.id && c.enabled !== false && ['feishu', 'lark'].includes(String(c.platform || '').toLowerCase()) && c.config && c.config.appId && c.config.appSecret && c.config.ownerOpenId)
    .map((c) => ({ id: String(c.id), name: c.name || c.id, platform: String(c.platform).toLowerCase() }))
}

function account(id, env = process.env) {
  const file = join(dshHome(env), 'dsh-im-connect', 'channels.json')
  const channels = (JSON.parse(readFileSync(file, 'utf8')) || {}).channels || {}
  const c = Object.values(channels).find((x) => x && String(x.id) === String(id))
  if (!c || !c.config) throw new Error('通知账号不存在，去「消息通知」重新连接')
  return { platform: String(c.platform || 'feishu').toLowerCase(), appId: c.config.appId, appSecret: c.config.appSecret, ownerOpenId: c.config.ownerOpenId, name: c.name || c.id }
}

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
  let data = null; try { data = await res.json() } catch { /* non-JSON */ }
  if (!res.ok && !(data && typeof data.code === 'number')) throw new Error(`HTTP ${res.status} from ${new URL(url).pathname}`)
  return data || {}
}

async function tenantToken(a) {
  const hit = tokens.get(a.appId); if (hit && hit.expiresAt > Date.now() + 60000) return hit.token
  const base = BASES[a.platform] || BASES.feishu
  const data = await postJson(base + '/open-apis/auth/v3/tenant_access_token/internal', { app_id: a.appId, app_secret: a.appSecret })
  if (data.code !== 0 || !data.tenant_access_token) throw new Error(`Feishu token failed: ${data.code} ${data.msg || ''}`.trim())
  tokens.set(a.appId, { token: data.tenant_access_token, expiresAt: Date.now() + (Number(data.expire) || 7200) * 1000 })
  return data.tenant_access_token
}

/** Send `text` to the owner of account `id`. Returns { messageId, name }. */
export async function pushToAccount(id, text, env = process.env) {
  const a = account(id, env)
  const token = await tenantToken(a)
  const base = BASES[a.platform] || BASES.feishu
  const data = await postJson(`${base}/open-apis/im/v1/messages?receive_id_type=open_id`, { receive_id: a.ownerOpenId, msg_type: 'text', content: JSON.stringify({ text: String(text) }) }, { authorization: 'Bearer ' + token })
  if (data.code !== 0) { if (data.code === 99991663 || data.code === 99991661) tokens.delete(a.appId); throw new Error(`Feishu send failed: ${data.code} ${data.msg || ''}`.trim()) }
  return { messageId: data.data && data.data.message_id, name: a.name }
}
