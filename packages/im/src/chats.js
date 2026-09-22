/**
 * dsh-mywork-im — read the chats @michengai/dsh-im-connect knows about (host side).
 *
 *   $DSH_HOME/dsh-im-connect/sessions.json  chat → dsh session mapping (one IM chat = one session)
 *   $DSH_HOME/dsh-im-connect/channels.json  accounts (id, platform, display name)
 *
 * A chat can receive outbound messages only after it has messaged the bot at least
 * once (that is what creates the mapping / session).
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const imDir = (env = process.env) => join(dshHome(env), 'dsh-im-connect')

const readJson = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null } catch { return null } }

export function listChats(dir = imDir()) {
  const sessions = readJson(join(dir, 'sessions.json')) || {}
  const channels = (readJson(join(dir, 'channels.json')) || {}).channels || {}
  const out = []
  for (const m of Object.values(sessions)) {
    if (!m || typeof m !== 'object' || !m.sessionId) continue
    const ch = channels[m.channel] || {}
    out.push({ sessionId: m.sessionId, channel: m.channel, channelName: ch.name || m.channel, platform: ch.platform || String(m.channel || '').split('_')[0], kind: m.kind || 'dm', chatId: m.chatId, title: m.title || m.chatId, updatedAt: m.updatedAt || '' })
  }
  return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

/**
 * Resolve a target to one chat. `target` may be a session id, chat id, channel id,
 * platform (weixin / feishu / …), channel display name or a substring of the title;
 * empty = the most recently active chat. Returns { chat } or { error }.
 */
export function resolveChat(target, chats) {
  if (chats.length === 0) return { error: 'no IM chat has messaged the bot yet (a chat must write once before it can receive messages)' }
  const q = String(target || '').trim().toLowerCase()
  if (!q) return { chat: chats[0] }
  const exact = chats.find((c) => [c.sessionId, c.chatId, c.channel].some((v) => String(v).toLowerCase() === q))
  if (exact) return { chat: exact }
  const byPlatform = chats.filter((c) => c.platform.toLowerCase() === q || c.channelName.toLowerCase() === q)
  if (byPlatform.length) return { chat: byPlatform[0] }
  const fuzzy = chats.filter((c) => [c.title, c.chatId, c.channelName, c.platform].some((v) => String(v).toLowerCase().includes(q)))
  if (fuzzy.length) return { chat: fuzzy[0] }
  return { error: `no IM chat matches "${target}"; known: ` + chats.map((c) => `${c.platform}:${c.title}`).join(', ') }
}

/** The relay instruction the chat's own assistant receives; it forwards the text verbatim. */
export function relayPrompt(text) {
  return ['【系统通知 · 请原样转发】下面是需要发送给用户的内容。请把它一字不改地作为你的回复发出去：不要添加前缀、说明、问候或总结，不要改写、翻译或省略任何部分。', '', String(text)].join('\n')
}
