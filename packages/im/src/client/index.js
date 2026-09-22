/**
 * dsh-mywork-im — browser half: the "发消息到频道" card inside the IM助理 page of
 * dsh-mywork-codex-ui (slot `mywork.im.section`).
 */
'use strict'
const React = require('react')
const { icon } = require('./client-icons.cjs')
const PLUGIN = 'dsh-mywork-im'
const NS = 'mywork.im'
const API = '/mywork-im/api'
const SLOT = 'mywork.im.section'

const zh = { title: '主动发消息到频道', hint: '发给已经和机器人聊过的 IM 聊天。内容会作为转发指令进入该聊天对应的会话，由它的助手原样转发，几秒内送达。定时任务、对话里的模型也能用 im_send 工具做同样的事。', target: '发给', latest: '最近活跃的聊天', placeholder: '要发送的内容…', send: '发送', sent: '已交给 {0} 的会话转发', none: '还没有聊天给机器人发过消息。先在 IM 里给机器人发一句，再回来这里。', refresh: '刷新' }
const en = { title: 'Send a message to a channel', hint: 'Sends to an IM chat that has already talked to the bot. The text enters that chat\'s session as a relay instruction; its assistant forwards it verbatim within seconds. Scheduled tasks and the model can do the same with the im_send tool.', target: 'To', latest: 'most recently active chat', placeholder: 'Message…', send: 'Send', sent: 'Handed to the session of {0}', none: 'No chat has messaged the bot yet. Say hi to the bot from your IM app first.', refresh: 'Refresh' }

const CSS = `
.mwi{border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;margin-bottom:18px;background:var(--dsw-alias-bg-layer-1);font-size:13px;color:var(--dsw-alias-label-primary)}
.mwi h3{margin:0 0 4px;font-size:14px;display:flex;align-items:center;gap:8px}
.mwi .hint{color:var(--dsw-alias-label-secondary);line-height:1.6;margin-bottom:10px}
.mwi .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.mwi select,.mwi textarea{background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;color:inherit;font:inherit;padding:6px 9px}
.mwi textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical}
.mwi .btn{border:0;border-radius:8px;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-inverted,#fff);padding:6px 14px;cursor:pointer;font:inherit;font-weight:600;display:inline-flex;gap:6px;align-items:center}
.mwi .btn:disabled{opacity:.5;cursor:default}
.mwi .mini{border:0.5px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:6px;padding:3px 8px;cursor:pointer;font:inherit;font-size:12px}
.mwi .ok{color:var(--dsw-alias-state-success-primary);font-size:12px}
.mwi .err{color:var(--dsw-alias-state-error-primary);font-size:12px;white-space:pre-wrap}
`
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data && data.error ? data.error : 'HTTP ' + res.status)
  return data
}

exports.name = PLUGIN
exports.inject = ['slots', 'locale']
exports.apply = function apply(ctx) {
  ctx.effect(() => { const el = document.createElement('style'); el.setAttribute('data-plugin', PLUGIN); el.textContent = CSS; document.head.appendChild(el); return () => el.remove() }, `${PLUGIN}: stylesheet`)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN}: dictionaries`)
  const t = ctx.locale.bind(NS)
  const h = React.createElement

  function SendCard() {
    const [chats, setChats] = React.useState([])
    const [target, setTarget] = React.useState('')
    const [text, setText] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const [ok, setOk] = React.useState(''); const [err, setErr] = React.useState('')
    const load = React.useCallback(() => api('/chats').then((d) => setChats(d.items || [])).catch(() => {}), [])
    React.useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id) }, [load])
    const submit = async () => {
      setBusy(true); setOk(''); setErr('')
      try { const r = await api('/send', { target, text }); setOk(t('sent').replace('{0}', `${r.platform} · ${r.title}`)); setText('') } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) }
    }
    return h('div', { className: 'mwi' },
      h('h3', null, icon('send', { size: 15 }), t('title')),
      h('div', { className: 'hint' }, t('hint')),
      chats.length === 0 ? h('div', { className: 'hint' }, t('none')) : null,
      h('div', { className: 'row' }, h('span', null, t('target')),
        h('select', { value: target, onChange: (e) => setTarget(e.target.value) },
          h('option', { value: '' }, t('latest')),
          chats.map((c) => h('option', { key: c.sessionId, value: c.sessionId }, `${c.platform} · ${c.channelName} · ${c.title}`))),
        h('button', { className: 'mini', onClick: load }, t('refresh'))),
      h('textarea', { value: text, placeholder: t('placeholder'), onChange: (e) => setText(e.target.value) }),
      h('div', { className: 'row', style: { justifyContent: 'flex-end', marginTop: 8 } }, ok ? h('span', { className: 'ok' }, ok) : null, h('button', { className: 'btn', disabled: busy || !text.trim() || chats.length === 0, onClick: submit }, icon('send', { size: 13 }), t('send'))),
      err ? h('div', { className: 'err' }, err) : null,
    )
  }
  ctx.slots.inject(SLOT, () => ctx.slots.register({ name: SLOT, id: PLUGIN, order: 10 }, function MyworkImSend() { return h(SendCard) }))
}
