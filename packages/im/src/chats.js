/**
 * dsh-mywork-im — read the chats @michengai/dsh-im-connect knows about (host side).
 *
 *   $DSH_HOME/dsh-im-connect/sessions.json  chat → dsh session mapping (one IM chat = one session)
 *   $DSH_HOME/dsh-im-connect/channels.json  accounts (id, platform, display name)
 *
 * A chat can receive outbound messages through dsh-im-connect only after it has messaged
 * the bot at least once (that is what creates the mapping / session). Platforms whose bot
 * API can message a user directly (Feishu / Lark, by the owner's open_id) are additionally
 * listed as `direct:<account id>` targets the moment the account is configured.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const imDir = (env = process.env) => join(dshHome(env), 'dsh-im-connect')

const readJson = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null } catch { return null } }

/** Accounts from channels.json (secrets stay host-side; `directAccount()` hands them to the sender only). */
export function listAccounts(dir = imDir()) {
  const channels = (readJson(join(dir, 'channels.json')) || {}).channels || {}
  return Object.values(channels).filter((c) => c && typeof c === 'object' && c.id)
}
const DIRECT_PLATFORMS = new Set(['feishu', 'lark'])
export function directTargets(dir = imDir()) {
  return listAccounts(dir)
    .filter((c) => DIRECT_PLATFORMS.has(String(c.platform || '').toLowerCase()) && c.enabled !== false && c.config && c.config.appId && c.config.appSecret && c.config.ownerOpenId)
    .map((c) => ({ sessionId: 'direct:' + c.id, channel: c.id, channelName: c.name || c.id, platform: String(c.platform).toLowerCase(), kind: 'direct', chatId: c.config.ownerOpenId, title: '直接推送给我（无需先发消息）', direct: true, updatedAt: '' }))
}
/** The account (with secrets) behind a direct target; null when it is gone or not a direct target. */
export function directAccount(chat, dir = imDir()) {
  if (!chat || !chat.direct) return null
  const c = listAccounts(dir).find((a) => a.id === chat.channel)
  return c && c.config ? { id: c.id, platform: String(c.platform || 'feishu').toLowerCase(), appId: c.config.appId, appSecret: c.config.appSecret, ownerOpenId: c.config.ownerOpenId } : null
}

export function listChats(dir = imDir()) {
  const sessions = readJson(join(dir, 'sessions.json')) || {}
  const channels = (readJson(join(dir, 'channels.json')) || {}).channels || {}
  const out = []
  for (const m of Object.values(sessions)) {
    if (!m || typeof m !== 'object' || !m.sessionId) continue
    const ch = channels[m.channel] || {}
    out.push({ sessionId: m.sessionId, channel: m.channel, channelName: ch.name || m.channel, platform: ch.platform || String(m.channel || '').split('_')[0], kind: m.kind || 'dm', chatId: m.chatId, title: m.title || m.chatId, updatedAt: m.updatedAt || '' })
  }
  out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  return out.concat(directTargets(dir))
}

/**
 * Resolve a target to exactly one chat; never guess between several. `target` may be
 * a session id, chat id, account id, platform (weixin / feishu / …), account display
 * name or a substring of the title. Empty target is accepted only when a single chat
 * exists. Returns { chat } or { error } (the error lists the candidates).
 */
export function resolveChat(target, chats) {
  if (chats.length === 0) return { error: 'no IM chat is reachable yet: a chat must have messaged the bot once, or configure a Feishu account (it can be pushed to directly)' }
  const label = (c) => `${c.platform} / ${c.channelName} / ${c.kind} / ${c.title} (chatId ${c.chatId})`
  const q = String(target || '').trim().toLowerCase()
  if (!q) return chats.length === 1 ? { chat: chats[0] } : { error: 'several IM chats are reachable; name the target explicitly: ' + chats.map(label).join(' | ') }
  const exact = chats.filter((c) => [c.sessionId, c.chatId, c.channel].some((v) => String(v).toLowerCase() === q))
  if (exact.length === 1) return { chat: exact[0] }
  const named = exact.length ? exact : chats.filter((c) => c.platform.toLowerCase() === q || c.channelName.toLowerCase() === q)
  if (named.length === 1) return { chat: named[0] }
  const fuzzy = named.length ? named : chats.filter((c) => [c.title, c.chatId, c.channelName, c.platform].some((v) => String(v).toLowerCase().includes(q)))
  if (fuzzy.length === 1) return { chat: fuzzy[0] }
  if (fuzzy.length > 1) return { error: `"${target}" matches several chats, be more specific (use the chatId): ` + fuzzy.map(label).join(' | ') }
  return { error: `no IM chat matches "${target}"; known: ` + chats.map(label).join(' | ') }
}

/** The relay instruction the chat's own assistant receives; it forwards the text verbatim. */
export function relayPrompt(text) {
  return ['【系统通知 · 请原样转发】下面是需要发送给用户的内容。请把它一字不改地作为你的回复发出去：不要添加前缀、说明、问候或总结，不要改写、翻译或省略任何部分。', '', String(text)].join('\n')
}
