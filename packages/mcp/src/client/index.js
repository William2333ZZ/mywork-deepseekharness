/**
 * dsh-mywork-mcp — browser half: the MCP server manager rendered inside the
 * "MCP 连接器" page of dsh-mywork-codex-ui (slot `mywork.mcp.section`).
 *
 *   • list of configured servers with live status (mounted / tools registered)
 *   • add / edit form: stdio (command, args, env, cwd) or streamable-http (url, headers)
 *   • enable / disable, delete
 *   • import an mcpServers JSON document (Claude Desktop / Cursor / VS Code style)
 */
'use strict'

const React = require('react')
const { icon } = require('./client-icons.cjs')

const PLUGIN = 'dsh-mywork-mcp'
const NS = 'mywork.mcp'
const API = '/mywork-mcp/api'
const SLOT = 'mywork.mcp.section'
const POLL_MS = 8000

const zh = {
  title: '已配置的 MCP 服务器',
  intro: '这里添加的服务器会立即作为 dsh 官方 mcp-client 条目挂载，无需重启；模型在所有会话里都能用它们的工具（名称形如 mcp__<服务器名>__<工具>）。配置文件：',
  empty: '还没有配置 MCP 服务器。',
  add: '添加服务器', edit: '编辑', del: '删除', confirm: '确认删除', enable: '启用', disable: '停用', save: '保存', cancel: '取消',
  importTitle: '导入 mcpServers JSON', importHint: '粘贴 Claude Desktop / Cursor / VS Code 风格的 { "mcpServers": { ... } }，同名服务器会被覆盖。', importBtn: '导入',
  name: '服务器名（字母、数字、-、_，≤32）', transport: '传输方式', stdio: 'stdio（本地进程）', http: 'streamable-http（远程 URL）',
  command: '命令（如 npx、uvx、node）', args: '参数（空格分隔，可用引号）', env: '环境变量（每行 KEY=VALUE）', cwd: '工作目录（可选）',
  url: 'URL（http/https）', headers: '请求头（每行 Header: value）', note: '备注（可选）',
  mounted: '已挂载', notMounted: '未挂载', disabled: '已停用', connecting: '连接中 / 无工具', tools: '个工具',
  secrets: '提示：环境变量和请求头里的密钥以明文保存在本机配置文件（权限 0600）。',
  refresh: '刷新',
}
const en = {
  title: 'Configured MCP servers',
  intro: 'Servers added here are mounted at once as official dsh mcp-client rows (no restart); the model can use their tools in every conversation (named mcp__<server>__<tool>). Config file:',
  empty: 'No MCP servers configured yet.',
  add: 'Add server', edit: 'Edit', del: 'Delete', confirm: 'Confirm', enable: 'Enable', disable: 'Disable', save: 'Save', cancel: 'Cancel',
  importTitle: 'Import mcpServers JSON', importHint: 'Paste a Claude Desktop / Cursor / VS Code style { "mcpServers": { ... } } document; servers with the same name are replaced.', importBtn: 'Import',
  name: 'Server name (letters, digits, -, _, ≤32)', transport: 'Transport', stdio: 'stdio (local process)', http: 'streamable-http (remote URL)',
  command: 'Command (npx, uvx, node, …)', args: 'Arguments (space separated, quotes allowed)', env: 'Environment (one KEY=VALUE per line)', cwd: 'Working directory (optional)',
  url: 'URL (http/https)', headers: 'Headers (one Header: value per line)', note: 'Note (optional)',
  mounted: 'mounted', notMounted: 'not mounted', disabled: 'disabled', connecting: 'connecting / no tools', tools: 'tools',
  secrets: 'Note: secrets in environment variables and headers are stored in plain text in the local config file (mode 0600).',
  refresh: 'Refresh',
}

const CSS = `
.mwm{display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--dsw-alias-label-primary)}
.mwm-hint{color:var(--dsw-alias-label-secondary);line-height:1.6}
.mwm-hint code{font-family:ui-monospace,Menlo,monospace;font-size:12px}
.mwm-head{display:flex;align-items:center;gap:8px}
.mwm-head h3{margin:0;font-size:14px;font-weight:600;flex:1}
.mwm-list{display:flex;flex-direction:column;gap:8px}
.mwm-card{border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;padding:10px 12px;background:var(--dsw-alias-bg-layer-1);display:flex;gap:10px;align-items:flex-start}
.mwm-card.off{opacity:.6}
.mwm-main{flex:1;min-width:0}
.mwm-name{font-weight:600;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mwm-pill{font-size:11px;font-weight:500;border-radius:999px;padding:1px 8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.mwm-pill.ok{color:var(--dsw-alias-state-success-primary)}
.mwm-pill.warn{color:var(--dsw-alias-state-warn-primary)}
.mwm-sub{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mwm-tools{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:4px;line-height:1.5}
.mwm-acts{display:flex;gap:2px;flex:none}
.mwm-mini{border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;padding:0 6px;height:24px;display:inline-flex;align-items:center;gap:4px;border-radius:6px;font-family:inherit}
.mwm-mini:hover{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
.mwm-mini.danger{color:var(--dsw-alias-state-error-primary)}
.mwm-mini.framed{border:0.5px solid var(--dsw-alias-border-l2)}
.mwm-form{border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;background:var(--dsw-alias-bg-layer-1)}
.mwm-form .full{grid-column:1 / -1}
.mwm-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.mwm-in{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 9px;font:inherit;color:var(--dsw-alias-label-primary)}
.mwm-in:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 35%,transparent)}
textarea.mwm-in{font-family:ui-monospace,Menlo,monospace;font-size:12px;min-height:64px;resize:vertical}
.mwm-seg{display:inline-flex;border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;overflow:hidden;width:max-content}
.mwm-seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 10px;cursor:pointer;font:inherit;font-size:12px}
.mwm-seg button.on{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff)}
.mwm-row{display:flex;gap:8px;align-items:center;justify-content:flex-end}
.mwm-primary{border:0;border-radius:8px;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-label-primary-inverted,#fff));padding:6px 14px;cursor:pointer;font:inherit;font-weight:600}
.mwm-primary:disabled{opacity:.5;cursor:default}
.mwm-err{color:var(--dsw-alias-state-error-primary);font-size:12px;white-space:pre-wrap}
.mwm-ok{color:var(--dsw-alias-state-success-primary);font-size:12px}
`

function injectStyles() { const el = document.createElement('style'); el.setAttribute('data-plugin', PLUGIN); el.textContent = CSS; document.head.appendChild(el); return () => { el.remove() } }
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data && data.error ? data.error : 'HTTP ' + res.status)
  return data
}
const kvLines = (o) => Object.entries(o || {}).map(([k, v]) => `${k}=${v}`).join('\n')
const headerLines = (o) => Object.entries(o || {}).map(([k, v]) => `${k}: ${v}`).join('\n')
const parseKv = (text, sep) => {
  const out = {}
  for (const raw of String(text || '').split('\n')) { const line = raw.trim(); if (!line || line.startsWith('#')) continue; const i = line.indexOf(sep); if (i <= 0) continue; out[line.slice(0, i).trim()] = line.slice(i + 1).trim() }
  return out
}
const summary = (r) => (r.transport === 'stdio' ? [r.command, ...(r.args || [])].join(' ') : r.url)

exports.name = PLUGIN
exports.inject = ['slots', 'locale']

exports.apply = function apply(ctx) {
  ctx.effect(() => injectStyles(), `${PLUGIN}: stylesheet`)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN}: dictionaries`)
  const t = ctx.locale.bind(NS)
  const h = React.createElement

  const state = { items: [], dataPath: '', loaded: false }
  const subs = new Set()
  const set = (patch) => { Object.assign(state, patch); subs.forEach((fn) => { try { fn() } catch { /* ignore */ } }) }
  function useState(getter) { const [v, setV] = React.useState(getter); React.useEffect(() => { const fn = () => setV(getter()); subs.add(fn); return () => { subs.delete(fn) } }, []); return v }
  async function refresh() { try { const d = await api('/list'); set({ items: d.items || [], dataPath: d.dataPath || '', loaded: true }) } catch (e) { console.warn(`[${PLUGIN}] list failed`, e) } }

  function Form(props) {
    const { initial, onDone } = props
    const [name, setName] = React.useState(initial ? initial.name : '')
    const [transport, setTransport] = React.useState(initial ? initial.transport : 'stdio')
    const [command, setCommand] = React.useState(initial ? initial.command || '' : '')
    const [args, setArgs] = React.useState(initial && initial.args ? initial.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ') : '')
    const [env, setEnv] = React.useState(initial ? kvLines(initial.env) : '')
    const [cwd, setCwd] = React.useState(initial ? initial.cwd || '' : '')
    const [url, setUrl] = React.useState(initial ? initial.url || '' : '')
    const [headers, setHeaders] = React.useState(initial ? headerLines(initial.headers) : '')
    const [note, setNote] = React.useState(initial ? initial.note || '' : '')
    const [err, setErr] = React.useState(''); const [busy, setBusy] = React.useState(false)
    const submit = async () => {
      setErr(''); setBusy(true)
      try {
        const body = { id: initial ? initial.id : undefined, name, transport, note, enabled: initial ? initial.enabled !== false : true }
        if (transport === 'stdio') Object.assign(body, { command, args, env: parseKv(env, '='), cwd })
        else Object.assign(body, { url, headers: parseKv(headers, ':') })
        const d = await api('/save', body)
        await refresh()
        onDone(d.warning || null)
      } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) }
    }
    const field = (label, el, full) => h('label', { className: full ? 'full' : '' }, label, el)
    return h('div', { className: 'mwm-form' },
      field(t('name'), h('input', { className: 'mwm-in', value: name, onChange: (e) => setName(e.target.value), placeholder: 'github' })),
      field(t('transport'), h('div', { className: 'mwm-seg' },
        h('button', { type: 'button', className: transport === 'stdio' ? 'on' : '', onClick: () => setTransport('stdio') }, t('stdio')),
        h('button', { type: 'button', className: transport === 'streamable-http' ? 'on' : '', onClick: () => setTransport('streamable-http') }, t('http')))),
      transport === 'stdio' ? field(t('command'), h('input', { className: 'mwm-in', value: command, onChange: (e) => setCommand(e.target.value), placeholder: 'npx' })) : field(t('url'), h('input', { className: 'mwm-in', value: url, onChange: (e) => setUrl(e.target.value), placeholder: 'https://host/mcp' })),
      transport === 'stdio' ? field(t('args'), h('input', { className: 'mwm-in', value: args, onChange: (e) => setArgs(e.target.value), placeholder: '-y @modelcontextprotocol/server-github' })) : field(t('note'), h('input', { className: 'mwm-in', value: note, onChange: (e) => setNote(e.target.value) })),
      transport === 'stdio' ? field(t('env'), h('textarea', { className: 'mwm-in', value: env, onChange: (e) => setEnv(e.target.value), placeholder: 'GITHUB_TOKEN=ghp_…' }), true) : field(t('headers'), h('textarea', { className: 'mwm-in', value: headers, onChange: (e) => setHeaders(e.target.value), placeholder: 'Authorization: Bearer …' }), true),
      transport === 'stdio' ? field(t('cwd'), h('input', { className: 'mwm-in', value: cwd, onChange: (e) => setCwd(e.target.value) })) : null,
      transport === 'stdio' ? field(t('note'), h('input', { className: 'mwm-in', value: note, onChange: (e) => setNote(e.target.value) })) : null,
      h('div', { className: 'full mwm-hint' }, t('secrets')),
      err ? h('div', { className: 'full mwm-err' }, err) : null,
      h('div', { className: 'full mwm-row' },
        h('button', { className: 'mwm-mini framed', onClick: () => onDone(null) }, t('cancel')),
        h('button', { className: 'mwm-primary', disabled: busy || !name.trim(), onClick: submit }, t('save'))),
    )
  }

  function Card(props) {
    const { r, onEdit } = props
    const [confirm, setConfirm] = React.useState(false)
    React.useEffect(() => { if (!confirm) return undefined; const id = setTimeout(() => setConfirm(false), 6000); return () => clearTimeout(id) }, [confirm])
    const status = r.enabled === false ? h('span', { className: 'mwm-pill' }, t('disabled'))
      : r.connected ? h('span', { className: 'mwm-pill ok' }, `${r.toolCount} ${t('tools')}`)
        : r.mounted ? h('span', { className: 'mwm-pill warn' }, t('connecting')) : h('span', { className: 'mwm-pill warn' }, t('notMounted'))
    return h('div', { className: 'mwm-card' + (r.enabled === false ? ' off' : '') },
      h('div', { className: 'mwm-main' },
        h('div', { className: 'mwm-name' }, icon('plug', { size: 14 }), r.name, h('span', { className: 'mwm-pill' }, r.transport), status),
        h('div', { className: 'mwm-sub', title: summary(r) }, summary(r)),
        r.note ? h('div', { className: 'mwm-tools' }, r.note) : null,
        r.tools && r.tools.length ? h('div', { className: 'mwm-tools' }, r.tools.slice(0, 12).join(' · ') + (r.tools.length > 12 ? ` · +${r.tools.length - 12}` : '')) : null,
      ),
      h('div', { className: 'mwm-acts' },
        h('button', { className: 'mwm-mini', title: r.enabled === false ? t('enable') : t('disable'), onClick: async () => { await api('/toggle', { id: r.id, enabled: r.enabled === false }); refresh() } }, r.enabled === false ? icon('play', { size: 13 }) : icon('pause', { size: 13 })),
        h('button', { className: 'mwm-mini', title: t('edit'), onClick: () => onEdit(r) }, icon('pencil', { size: 13 })),
        h('button', { className: 'mwm-mini danger', title: t('del'), onClick: async () => { if (!confirm) { setConfirm(true); return } await api('/remove', { id: r.id }); refresh() } }, confirm ? t('confirm') : icon('trash', { size: 13 })),
      ),
    )
  }

  function Manager() {
    const items = useState(() => state.items)
    const dataPath = useState(() => state.dataPath)
    const [editing, setEditing] = React.useState(null) // null | 'new' | record
    const [msg, setMsg] = React.useState('')
    const [importText, setImportText] = React.useState(''); const [importMsg, setImportMsg] = React.useState(''); const [importErr, setImportErr] = React.useState('')
    React.useEffect(() => { refresh(); const id = setInterval(refresh, POLL_MS); return () => clearInterval(id) }, [])
    const doImport = async () => {
      setImportErr(''); setImportMsg('')
      try { const d = await api('/import', { text: importText }); await refresh(); setImportMsg(`${(d.imported || []).length} ok`); setImportErr((d.errors || []).join('\n')); if ((d.imported || []).length) setImportText('') } catch (e) { setImportErr(String(e.message || e)) }
    }
    return h('div', { className: 'mwm' },
      h('div', { className: 'mwm-hint' }, t('intro'), ' ', h('code', null, dataPath || '…')),
      h('div', { className: 'mwm-head' }, h('h3', null, t('title')),
        h('button', { className: 'mwm-mini framed', onClick: refresh }, icon('refresh-cw', { size: 12 }), t('refresh')),
        h('button', { className: 'mwm-primary', onClick: () => setEditing('new') }, t('add'))),
      editing === 'new' ? h(Form, { initial: null, onDone: (w) => { setEditing(null); setMsg(w || '') } }) : null,
      msg ? h('div', { className: 'mwm-err' }, msg) : null,
      h('div', { className: 'mwm-list' }, items.length === 0 ? h('div', { className: 'mwm-hint' }, t('empty')) : items.map((r) => editing && editing !== 'new' && editing.id === r.id
        ? h(Form, { key: r.id, initial: r, onDone: (w) => { setEditing(null); setMsg(w || '') } })
        : h(Card, { key: r.id, r, onEdit: (rec) => setEditing(rec) }))),
      h('div', { className: 'mwm-head' }, h('h3', null, t('importTitle'))),
      h('div', { className: 'mwm-hint' }, t('importHint')),
      h('textarea', { className: 'mwm-in', 'aria-label': t('importTitle'), value: importText, onChange: (e) => setImportText(e.target.value), placeholder: '{ "mcpServers": { "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": { "GITHUB_TOKEN": "…" } } } }' }),
      h('div', { className: 'mwm-row' }, importMsg ? h('span', { className: 'mwm-ok' }, importMsg) : null, h('button', { className: 'mwm-primary', disabled: !importText.trim(), onClick: doImport }, t('importBtn'))),
      importErr ? h('div', { className: 'mwm-err' }, importErr) : null,
    )
  }

  // Rendered inside the "MCP 连接器" page of dsh-mywork-codex-ui.
  ctx.slots.inject(SLOT, () => ctx.slots.register({ name: SLOT, id: PLUGIN, order: 10 }, function MyworkMcpManager() { return h(Manager) }))
}
