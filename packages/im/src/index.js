/**
 * dsh-mywork-im — host half: send messages TO an IM chat.
 *
 * @michengai/dsh-im-connect maps every IM chat to a dsh session and forwards that
 * session's assistant replies to the chat, but exposes no "send" API. So this plugin
 * submits a relay prompt into the chat's session through dsh's official session
 * controller; the session's assistant repeats the text and the IM plugin delivers it.
 *
 *   • tools: im_send({ text, target? }), im_chats()
 *   • command: /imsend [目标] <文本>
 *   • HTTP: /mywork-im/api/chats, /mywork-im/api/send
 *   • system prompt hint so the model (also inside scheduled tasks) knows it can notify you
 */
import { randomBytes } from 'node:crypto'
import { listChats, resolveChat, relayPrompt } from './chats.js'
import { configSchema, defineRawTool, rejectUntrusted } from './harness.js'

export const name = 'dsh-mywork-im'
export const inject = ['tools']

/** Config (all optional): tools, command, promptHint, maxChars */
export const Config = configSchema({ tools: true, command: true, promptHint: true, maxChars: 4000 })

export function apply(ctx, config = {}) {
  const warn = (m) => console.warn('[dsh-mywork-im] ' + m)
  const maxChars = Number(config.maxChars) || 4000
  let controller = null
  ctx.inject(['sessionController'], (sctx) => { controller = sctx.sessionController; sctx.effect(() => () => { controller = null }, 'dsh-mywork-im: controller') })

  const send = async (target, text) => {
    const body = String(text || '').trim()
    if (!body) throw new Error('text is required')
    if (body.length > maxChars) throw new Error(`text too long (${body.length} > ${maxChars})`)
    if (!controller) throw new Error('session controller not available')
    const r = resolveChat(target, listChats())
    if (r.error) throw new Error(r.error)
    const requestId = 'mywork-im-' + randomBytes(6).toString('hex')
    await controller.prompt({ requestId, sessionId: r.chat.sessionId, mode: 'queue', content: [{ type: 'text', text: relayPrompt(body) }] }, AbortSignal.timeout(20000))
    return { accepted: true, requestId, sessionId: r.chat.sessionId, channel: r.chat.channel, platform: r.chat.platform, chatId: r.chat.chatId, title: r.chat.title, note: 'Queued in the chat\'s IM session; its assistant forwards the text and dsh-im-connect delivers it.' }
  }

  if (config.tools !== false) {
    ctx.tools.register(defineRawTool({
      name: 'im_send',
      description: '主动给用户的 IM（微信 / 飞书 / 钉钉 / 企业微信 / QQ / Telegram）发一条消息。适合定时任务结束后汇报、长任务完成通知、提醒等。target 可以是平台名（weixin / feishu…）、账号名、聊天 id 或标题片段；只有一个可用聊天时可省略。有多个聊天时必须指明，不确定就先调 im_chats 看列表——绝不要猜，发错人无法撤回。消息经该聊天对应的 IM 会话转发，几秒内送达。',
      parameters: {
        text: { type: 'string', required: true, description: '要发送的正文（原样送达）' },
        target: { type: 'string', description: '目标聊天：平台 / 账号名 / 聊天 id / 标题片段；只有一个可用聊天时可省略，多个时必须指明（模糊时用 chatId）' },
      },
      async execute(args) { return send(args.target, args.text) },
    }))
    ctx.tools.register(defineRawTool({
      name: 'im_chats',
      description: '列出可以主动发消息的 IM 聊天（平台、账号、标题、最近活跃时间）。只有给机器人发过消息的聊天才在列表里。',
      parameters: {},
      async execute() { return { items: listChats().map((c) => ({ platform: c.platform, channel: c.channelName, title: c.title, chatId: c.chatId, updatedAt: c.updatedAt })) } },
    }))
  }

  if (config.command !== false) {
    ctx.inject(['commands'], (cctx) => {
      cctx.commands.register({
        name: 'imsend',
        description: '主动发到 IM：/imsend 你好 · /imsend feishu 会议 10 点开始（第一个词匹配平台/账号时作为目标）',
        input: { hint: '[weixin|feishu|账号名] <文本>' },
        handler: async ({ rawInput }) => {
          const raw = String(rawInput || '').trim()
          if (!raw) { const items = listChats(); return { kind: 'success', text: '用法：/imsend [目标] <文本>\n可用聊天：' + (items.length ? items.map((c) => `${c.platform} · ${c.title}`).join('\n') : '（还没有聊天给机器人发过消息）') } }
          const [head, ...rest] = raw.split(/\s+/)
          const chats = listChats()
          const headHit = rest.length > 0 && !resolveChat(head, chats).error && chats.some((c) => [c.platform, c.channelName, c.channel, c.chatId].some((v) => String(v).toLowerCase() === head.toLowerCase()))
          try {
            const r = await send(headHit ? head : '', headHit ? rest.join(' ') : raw)
            return { kind: 'success', text: `已交给 ${r.platform} · ${r.title} 的会话转发。` }
          } catch (e) { return { kind: 'error', text: String(e.message || e) } }
        },
      })
    })
  }

  if (config.promptHint !== false) {
    ctx.inject(['systemPrompt'], (sctx) => {
      try {
        sctx.systemPrompt.section({ name: 'mywork-im', order: 910, interpolate: false, text: [
          '## IM notifications',
          'The user can be reached on their IM apps (WeChat, Feishu, DingTalk, …) through the `im_send` tool (`im_chats` lists reachable chats). Use it when the user asks to be notified, when a scheduled task finishes and its instructions ask for a report, or when a long job completes while the user is away. Keep messages short and plain; the text is forwarded verbatim.',
        ].join('\n') })
      } catch (e) { warn('system prompt hint skipped: ' + (e && e.message)) }
    })
  }

  ctx.inject(['webServer'], (wctx) => {
    const json = (res, body, status = 200) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
    const readBody = (req) => new Promise((resolve, reject) => { let d = ''; let n = 0; req.on('data', (c) => { n += c.length; if (n > 64 * 1024) { reject(new Error('body too large')); req.destroy(); return } d += c }); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}) } catch (e) { reject(e) } }); req.on('error', reject) })
    const route = (path, handler) => wctx.webServer.register({ kind: 'exact', path: '/mywork-im/api' + path, handler: (req, res) => rejectUntrusted(ctx, req, res, json) || Promise.resolve(handler(req, res)).catch((e) => json(res, { error: e instanceof Error ? e.message : String(e) }, 500)) })
    route('/chats', async (_req, res) => json(res, { items: listChats(), ready: !!controller }))
    route('/send', async (req, res) => { if (req.method !== 'POST') return json(res, { error: 'POST only' }, 405); const b = await readBody(req); json(res, await send(b.target, b.text)) })
  })
}
