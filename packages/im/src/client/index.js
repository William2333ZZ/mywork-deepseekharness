/**
 * dsh-mywork-im — browser half, inside the IM助理 page of dsh-mywork-codex-ui (slot `mywork.im.section`): where
 * teammates' notifications go and when they hold off (免打扰), and the "发消息到频道" card.
 */
'use strict'
const React = require('react')
const { icon } = require('./client-icons.cjs')
const PLUGIN = 'dsh-mywork-im'
const NS = 'mywork.im'
const API = '/mywork-im/api'
const SLOT = 'mywork.im.section'

const zhN = { nTitle: '同事的通知', nHint: '提醒、等你答的问题、有变化的例行、失败和做了很久的活，会发到这里。每位同事的「通知」开关在它的资料里。', nTo: '发到', nOff: '不发', nWhen: '发什么', nAll: '全部', nFailed: '只发失败和问题', quiet: '免打扰', quietHint: '这段时间里的通知先攒着，结束时合成一条发出；你定了时间的提醒照常发。', quietFrom: '从', quietTo: '到', held: '攒着 {0} 条', saved: '已保存' }
const enN = { nTitle: 'Teammate notifications', nHint: 'Reminders, questions waiting on you, routines with news, failures and long jobs go here. Each teammate\'s Notifications switch is on its profile.', nTo: 'Send to', nOff: 'Off', nWhen: 'What', nAll: 'Everything', nFailed: 'Only failures and questions', quiet: 'Quiet hours', quietHint: 'Notifications in this window are held and sent as one message when it ends; reminders you timed still go out.', quietFrom: 'From', quietTo: 'to', held: '{0} held', saved: 'Saved' }
const zh = { ...zhN, title: '主动发消息到频道', hint: '发给已经和机器人聊过的 IM 聊天。内容会作为转发指令进入该聊天对应的会话，由它的助手原样转发，几秒内送达。定时任务、对话里的模型也能用 im_send 工具做同样的事。', target: '发给', choose: '请选择聊天', placeholder: '要发送的内容…', send: '发送', sent: '已交给 {0} 的会话转发', none: '还没有聊天给机器人发过消息。先在 IM 里给机器人发一句，再回来这里。', refresh: '刷新' }
const en = { ...enN, title: 'Send a message to a channel', hint: 'Sends to an IM chat that has already talked to the bot. The text enters that chat\'s session as a relay instruction; its assistant forwards it verbatim within seconds. Scheduled tasks and the model can do the same with the im_send tool.', target: 'To', choose: 'choose a chat', placeholder: 'Message…', send: 'Send', sent: 'Handed to the session of {0}', none: 'No chat has messaged the bot yet. Say hi to the bot from your IM app first.', refresh: 'Refresh' }

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
.mwi input[type=time]{background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;color:inherit;font:inherit;padding:4px 8px}
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
    const load = React.useCallback(() => api('/chats').then((d) => { const items = d.items || []; setChats(items); setTarget((cur) => (items.length === 1 ? items[0].sessionId : items.some((c) => c.sessionId === cur) ? cur : '')) }).catch(() => {}), [])
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
        h('select', { 'aria-label': t('target'), value: target, onChange: (e) => setTarget(e.target.value) },
          chats.length === 1 ? null : h('option', { value: '' }, t('choose')),
          chats.map((c) => h('option', { key: c.sessionId, value: c.sessionId }, `${c.platform} · ${c.channelName} · ${c.title}`))),
        h('button', { className: 'mini', onClick: load }, t('refresh'))),
      h('textarea', { value: text, placeholder: t('placeholder'), 'aria-label': t('placeholder'), onChange: (e) => setText(e.target.value) }),
      h('div', { className: 'row', style: { justifyContent: 'flex-end', marginTop: 8 } }, ok ? h('span', { className: 'ok' }, ok) : null, h('button', { className: 'btn', disabled: busy || !text.trim() || !target, onClick: submit }, icon('send', { size: 13 }), t('send'))),
      err ? h('div', { className: 'err' }, err) : null,
    )
  }
  /** Where teammates' notifications go (the `default` rule) and 免打扰. */
  function NotifyCard() {
    const [data, setData] = React.useState(null)
    const [ok, setOk] = React.useState(''); const [err, setErr] = React.useState('')
    const load = React.useCallback(() => api('/notify').then(setData).catch((e) => setErr(String(e.message || e))), [])
    React.useEffect(() => { load() }, [load])
    const save = (body) => { setOk(''); setErr(''); api('/notify', body).then((d) => { setData(d); setOk(t('saved')) }).catch((e) => setErr(String(e.message || e))) }
    if (!data) return null
    const rule = data.config.automation.default
    const quiet = data.config.quiet
    const chats = data.chats || []
    return h('div', { className: 'mwi' },
      h('h3', null, icon('bell', { size: 15 }), t('nTitle')),
      h('div', { className: 'hint' }, t('nHint')),
      h('div', { className: 'row' }, h('span', null, t('nTo')),
        h('select', { 'aria-label': t('nTo'), value: rule ? rule.target : '', onChange: (e) => save({ default: e.target.value ? { target: e.target.value, when: rule ? rule.when : 'always' } : null }) },
          h('option', { value: '' }, t('nOff')),
          rule && !chats.some((c) => c.sessionId === rule.target) ? h('option', { value: rule.target }, rule.target) : null,
          chats.map((c) => h('option', { key: c.sessionId, value: c.sessionId }, `${c.platform} · ${c.channelName} · ${c.title}`))),
        rule ? h('select', { 'aria-label': t('nWhen'), value: rule.when, onChange: (e) => save({ default: { target: rule.target, when: e.target.value } }) },
          h('option', { value: 'always' }, t('nAll')), h('option', { value: 'failed' }, t('nFailed'))) : null),
      h('div', { className: 'row' },
        h('label', null, h('input', { type: 'checkbox', checked: !!quiet, onChange: (e) => save({ quiet: e.target.checked ? { from: '22:00', to: '07:30' } : null }) }), ' ', t('quiet')),
        quiet ? [
          h('span', { key: 'f' }, t('quietFrom')),
          h('input', { key: 'a', type: 'time', 'aria-label': t('quietFrom'), defaultValue: quiet.from, onBlur: (e) => { if (e.target.value && e.target.value !== quiet.from) save({ quiet: { from: e.target.value, to: quiet.to } }) } }),
          h('span', { key: 't' }, t('quietTo')),
          h('input', { key: 'b', type: 'time', 'aria-label': t('quietTo'), defaultValue: quiet.to, onBlur: (e) => { if (e.target.value && e.target.value !== quiet.to) save({ quiet: { from: quiet.from, to: e.target.value } }) } }),
        ] : null,
        data.held ? h('span', { className: 'hint', style: { margin: 0 } }, t('held').replace('{0}', String(data.held))) : null,
        ok ? h('span', { className: 'ok' }, ok) : null),
      quiet ? h('div', { className: 'hint', style: { marginBottom: 0 } }, t('quietHint')) : null,
      err ? h('div', { className: 'err' }, err) : null,
    )
  }
  ctx.slots.inject(SLOT, () => ctx.slots.register({ name: SLOT, id: PLUGIN + ':notify', order: 5 }, function MyworkImNotify() { return h(NotifyCard) }))
  ctx.slots.inject(SLOT, () => ctx.slots.register({ name: SLOT, id: PLUGIN, order: 10 }, function MyworkImSend() { return h(SendCard) }))
}
