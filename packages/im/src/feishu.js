/**
 * dsh-mywork-im — direct Feishu / Lark push (host side).
 *
 * dsh-im-connect can only deliver into a chat that has already messaged the bot (that is what
 * creates the session it relays through). Feishu's own Open API has no such limit: a bot may
 * message any user of the tenant by open_id. The account in channels.json carries appId /
 * appSecret / ownerOpenId, so a configured Feishu account is reachable the moment it is saved,
 * before the first inbound message. Secrets never leave this module.
 */

const BASES = { feishu: 'https://open.feishu.cn', lark: 'https://open.larksuite.com' }
const tokens = new Map() // appId -> { token, expiresAt }

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
  let data = null
  try { data = await res.json() } catch { /* non-JSON body */ }
  if (!res.ok && !(data && typeof data.code === 'number')) throw new Error(`HTTP ${res.status} from ${new URL(url).pathname}`)
  return data || {}
}

export function feishuBase(platform) { return BASES[String(platform || 'feishu').toLowerCase()] || BASES.feishu }

/** tenant_access_token with a small cache (Feishu issues them for 2 h). */
export async function tenantToken({ appId, appSecret, platform }) {
  if (!appId || !appSecret) throw new Error('Feishu account has no appId / appSecret')
  const hit = tokens.get(appId)
  if (hit && hit.expiresAt > Date.now() + 60000) return hit.token
  const data = await postJson(feishuBase(platform) + '/open-apis/auth/v3/tenant_access_token/internal', { app_id: appId, app_secret: appSecret })
  if (data.code !== 0 || !data.tenant_access_token) throw new Error(`Feishu token failed: ${data.code} ${data.msg || ''}`.trim())
  tokens.set(appId, { token: data.tenant_access_token, expiresAt: Date.now() + (Number(data.expire) || 7200) * 1000 })
  return data.tenant_access_token
}

/**
 * Send a text message as the bot. `receiveId` is an open_id (default) or a chat_id.
 * Returns { messageId, chatId, createTime }.
 */
export async function sendFeishuText(account, receiveId, text, receiveIdType = 'open_id') {
  const token = await tenantToken(account)
  const url = `${feishuBase(account.platform)}/open-apis/im/v1/messages?receive_id_type=${encodeURIComponent(receiveIdType)}`
  const data = await postJson(url, { receive_id: receiveId, msg_type: 'text', content: JSON.stringify({ text: String(text) }) }, { authorization: 'Bearer ' + token })
  if (data.code !== 0) {
    if (data.code === 99991663 || data.code === 99991661) tokens.delete(account.appId) // token invalid / expired: forget the cache
    throw new Error(`Feishu send failed: ${data.code} ${data.msg || ''}`.trim())
  }
  const d = data.data || {}
  return { messageId: d.message_id, chatId: d.chat_id, createTime: d.create_time }
}
