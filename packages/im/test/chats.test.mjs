import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveChat, relayPrompt } from '../src/chats.js'
const chats = [
  { sessionId: 's1', channel: 'weixin_1', channelName: '微信账号 1', platform: 'weixin', kind: 'dm', chatId: 'u1@im.wechat', title: 'u1@im.wechat', updatedAt: '2026-09-21T05:00:00Z' },
  { sessionId: 's2', channel: 'feishu_2', channelName: '飞书', platform: 'feishu', kind: 'dm', chatId: 'ou_2', title: '张三', updatedAt: '2026-09-20T05:00:00Z' },
]
test('resolveChat by platform, name, id, substring and default', () => {
  assert.equal(resolveChat('', chats).chat.sessionId, 's1')
  assert.equal(resolveChat('feishu', chats).chat.sessionId, 's2')
  assert.equal(resolveChat('微信账号 1', chats).chat.sessionId, 's1')
  assert.equal(resolveChat('ou_2', chats).chat.sessionId, 's2')
  assert.equal(resolveChat('张', chats).chat.sessionId, 's2')
  assert.match(resolveChat('telegram', chats).error, /no IM chat matches/)
  assert.match(resolveChat('x', []).error, /messaged the bot/)
})
test('relayPrompt keeps the text verbatim at the end', () => { assert.ok(relayPrompt('hello\nworld').endsWith('\n\nhello\nworld')) })
