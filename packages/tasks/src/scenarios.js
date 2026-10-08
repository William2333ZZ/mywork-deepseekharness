/**
 * dsh-mywork-tasks — scenario registry, step names and the verifier.
 *
 * In the teammate model (design/v2/TEAMMATES.md §9) a teammate's persona and working rules live in its generated
 * agent preset, so a scenario no longer composes prompts for runs. What remains used: `toolStepMap` of every
 * registered scenario (tool → the step word shown as 在干活 · <step>), `verifyPrompt` / `verify: false` of the general
 * scenario, and the registry itself (packs still register through the `myworkTasks` service). GENERAL.compose is kept
 * for packs that build on it.
 *
 * Scenario {
 *   id, label, intro, examples: string[],
 *   compose(input, context) → string            prompt for the task session
 *   toolStepMap: { toolName: stepLabel }        tool call → step name (falls back to GENERIC_STEPS)
 *   deliverableKinds: string[]                  what `deliver` may produce
 *   deliverable: true | 'auto' | false         must deliver / decides itself (default) / never (chat-like)
 *   match(input) → boolean                     optional, packs claim inputs they recognise; the user never picks
 *   verifyPrompt(task, deliverable) → string    optional, phase 3
 *   model: { provider, model } | undefined      optional model override
 *   permission: string | undefined              optional permission preset override
 *   homeWidget: string | undefined              client slot id for the 今日 page (phase 4)
 * }
 */

/** Generic tool → step mapping; scenario maps take precedence. */
export const GENERIC_STEPS = [
  [/^deliver$/, '交付'],
  [/^mywork_ask$/, '提问'],
  [/^mywork_routine_create$/, '安排例行'],
  [/^mywork_routine/, '看例行'],
  [/^mywork_remember$/, '记住'],
  [/^mywork_mate_update$/, '起名'],
  [/^mywork_mate_create$/, '新建同事'],
  [/^mywork_mates$/, '看同事'],
  [/^(browser|open_url|quick_links|web_|deepseek_search|fetch|search|http)/i, '查阅'],
  [/^(read|grep|glob|list|ls|cat|view|find)/i, '读取'],
  [/^(write|edit|create|apply_patch|patch|save|mkdir|move|copy)/i, '整理'],
  [/^(bash|run_code|shell|exec|python|node)/i, '执行'],
  [/^(oracle_|im_|reminder_|automation_)/, '取数'],
  [/^univer_/, '文档'],
  [/^skill/, '技能'],
  [/^present/, '展示'],
]

export function stepNameFor(tool, map) {
  const name = String(tool || '')
  if (map && Object.prototype.hasOwnProperty.call(map, name)) return String(map[name])
  for (const [re, label] of GENERIC_STEPS) if (re.test(name)) return label
  // An MCP connector's tool (mcp__<server>__<tool>) reads by its own name: mcp__playwright__browser_navigate → 查阅.
  const bare = name.replace(/^mcp__.+?__/, '')
  if (bare !== name) { for (const [re, label] of GENERIC_STEPS) if (re.test(bare)) return label }
  return '工具 ' + bare
}

/**
 * What a tool call is working on, in a few characters, for the 在干活 line: the site it opens, the file it reads,
 * the words it searches, the command it runs. Empty when the arguments name nothing worth showing.
 */
export function stepWhat(args) {
  let a = args
  if (typeof a === 'string') { try { a = JSON.parse(a) } catch { return '' } }
  if (!a || typeof a !== 'object') return ''
  const pick = (...keys) => { for (const k of keys) { const v = a[k]; if (typeof v === 'string' && v.trim()) return v.trim() } return '' }
  const short = (s, n) => { const one = s.replace(/\s+/g, ' '); return one.length > n ? one.slice(0, n - 1) + '…' : one }
  const url = pick('url', 'href', 'link')
  if (url) { try { const u = new URL(url); return short(u.hostname.replace(/^www\./, '') + (u.pathname.length > 1 ? u.pathname : ''), 32) } catch { return short(url, 32) } }
  const q = pick('query', 'q', 'keyword', 'keywords', 'pattern', 'search')
  if (q) return '「' + short(q, 20) + '」'
  const file = pick('path', 'file_path', 'filePath', 'file', 'filename', 'name', 'title')
  if (file) return short(file.split(/[\\/]/).filter(Boolean).pop() || file, 28)
  const cmd = pick('command', 'cmd', 'code', 'script')
  if (cmd) return short(cmd, 28)
  const el = pick('element', 'text', 'selector')
  return el ? short(el, 24) : ''
}

/**
 * The one built-in way of working. It decides by itself whether to answer or to deliver,
 * and uses whatever capabilities this machine has (browser, office documents, IM). Domain
 * packs (交易 …) register their own scenarios with a `match(input)` and take over the inputs
 * they recognise; the user never picks.
 */
export const GENERAL = {
  id: 'general',
  label: '通用',
  intro: '说一个你要的结果或者问一个问题。该回答就回答，该交付就交付：报告、清单、比较、表格、网页摘要。',
  examples: ['把这个目录的 README 整理成一页产品介绍', '比较三种 Node 定时任务方案，给出推荐', '解释一下什么是 agent harness', '做一张本月支出表，按类别汇总'],
  toolStepMap: { open_url: '打开网页', quick_links: '打开网页', univer_new: '新建文档', univer_execute: '编辑文档', univer_export: '导出', univer_print_pdf: '导出', univer_screenshot: '预览' },
  deliverableKinds: ['markdown', 'report', 'table', 'summary'],
  deliverable: 'auto',
  compose(input, context) {
    const caps = (context && context.capabilities) || {}
    const lines = [
      // 找人 (§2.7): assumptions by default; four cases stop to ask, end-of-turn, at most twice.
      '你是 MyWork 的后台执行者。用户通常不在线：默认按合理假设把事情做完，假设写进结果里，不要为小事等确认。',
      '只有四种情况停下来问（调用 mywork_ask）：缺关键信息且没法合理假设 / 必须由用户拍板 / 动作有后果（发消息、付费、删除、对外提交）/ 需要密码、验证码或扫码。每个任务最多问 2 次；问题 ≤120 字，选项 ≤12 字，一次只问一件事。调用 mywork_ask 之后立刻结束本轮，不要接着做；用户回答后会在同一会话里继续，回答以「回答：」开头。',
      '', '用户说：', input, '',
      '怎么做：',
      '1. 先判断这是一个问题还是一件要交付的事。问题（尤其是"一句话""简单说说"这类）就凭已有知识直接、具体地回答，像和同事说话，不要铺垫，不要为它上网、不要交付。',
      '2. 要交付的事（用户要一份报告、清单、比较、方案、表格、摘要、文档，或说了"整理成""做成""保存"），做完必须调用 deliver：title 一句话，markdown 先结论后依据，kind 用 report / table / summary / markdown。不要把交付内容只写在回复里。',
      '交付时，正文里只要有数字、清单或表格，deliver 就必须同时给 summary：2 到 6 行 { label, value }，每行一个可核对的事实，value 只放数字、单位和最短的限定词（≤20 字，不带括号说明，口径写进正文），例如 { label: "包", value: "8 个" }、{ label: "最大的包", value: "tasks · 6,100 行" }；只有纯说明文才不给。',
      '   规模要匹配：一次比较或一份摘要，读几页资料、写一份 Markdown 就够，不要为此写脚本、建工程或生成额外文件；只有用户明确要文件（表格 / 幻灯片 / 代码）时才产出文件。',
      caps.browser ? '3. 需要外部信息时用浏览器工具（open_url / browser_*）打开真实网页读原文，每个事实标来源网址；不确定的写"待核实"。' : '3. 没有浏览器工具：只用已有知识和本机文件，并在结果里说明没有联网核实。',
      caps.office ? '4. 要表格 / 文档 / 幻灯片文件时用 univer_* 工具生成，并在交付物里写明文件名和位置；同时把内容用 Markdown 表格或大纲放进交付物。' : '4. 表格用 Markdown 表格，幻灯片用大纲交付。',
      '5. 读文件、跑命令直接用工具；数字要可追溯，假设的数值标"示例"。',
      '6. 交付后用一两句话总结你做了什么；纯回答就不必总结。',
    ]
    if (context && context.date) lines.push('', '今天是 ' + context.date + '。')
    if (context && context.cwd) lines.push('工作目录：' + context.cwd + '。')
    return lines.join('\n')
  },
}

export const BUILTIN_SCENARIOS = [GENERAL]

export function createScenarioRegistry() {
  const map = new Map()
  const listeners = new Set()
  const notify = () => { for (const fn of listeners) { try { fn() } catch {} } }
  return {
    register(s) {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !s.id.trim()) throw new Error('scenario needs an id')
      if (typeof s.compose !== 'function') throw new Error(`scenario ${s.id} needs compose(input, context)`)
      const scenario = { label: s.id, intro: '', examples: [], toolStepMap: {}, deliverableKinds: ['markdown'], ...s }
      map.set(scenario.id, scenario)
      notify()
      return () => { if (map.get(scenario.id) === scenario) { map.delete(scenario.id); notify() } }
    },
    get(id) { return map.get(String(id || '')) || null },
    resolve(id) { return map.get(String(id || '')) || map.get('general') || null },
    /** Pick the scenario for an input: the first registered pack whose match(input) says yes, else 通用. */
    route(input) {
      const text = String(input || '')
      for (const s of map.values()) {
        if (s.id === 'general' || s.hidden || typeof s.match !== 'function') continue
        try { if (s.match(text)) return s } catch {}
      }
      return map.get('general') || null
    },
    list() { return [...map.values()].filter((s) => !s.hidden).map(publicView) },
    /** Every registered scenario's tool → step words, later registrations winning. */
    stepMap() { const out = {}; for (const s of map.values()) Object.assign(out, s.toolStepMap || {}); return out },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
  }
}

export function publicView(s) {
  return { id: s.id, label: s.label, intro: s.intro || '', examples: Array.isArray(s.examples) ? s.examples.slice(0, 6) : [], deliverableKinds: s.deliverableKinds || ['markdown'], conversational: s.deliverable === false, builtin: s.id === 'general', homeWidget: s.homeWidget || '' }
}


/** Verification prompt: a second, read-only session checks the deliverable against the task and the run. */
export function defaultVerifyPrompt(task, deliverables, activity) {
  const tools = (activity || []).filter((a) => a.kind === 'tool').map((a) => `- ${a.name}${a.ok === false ? '（失败）' : ''}${a.detail ? '：' + a.detail : ''}`).slice(0, 40)
  const docs = (deliverables || []).map((d, i) => `### 交付物 ${i + 1}：${d.title}\n\n${String(d.markdown || '').slice(0, 6000)}`).join('\n\n')
  // What the user said after the first line (follow-ups, answers to the task's questions) changes the
  // requirement: 「只写草稿，不要发送」 overrides 「写好后直接发给他」. The verifier judges against all of it.
  const later = (activity || []).filter((a) => a.kind === 'user' && !a.auto && String(a.text || '').trim()).map((a) => '- ' + String(a.text).slice(0, 500)).slice(-10)
  const asked = (activity || []).filter((a) => a.kind === 'ask' && a.status === 'answered').map((a) => `- 同事问：${String(a.question || '').slice(0, 200)}\n  用户答：${String(a.answer || '').slice(0, 500)}`).slice(-4)
  return [
    '你是核验员。下面是用户交给一位同事的一件事、它做这件事时调用过的工具，以及它交付的内容。请只做核对，不要重做，不要调用会修改东西的工具。',
    '', '## 用户要的', task.input || '（见后来补充的话）', '',
    later.length || asked.length ? '## 用户后来补充的话（与原话冲突时，以后说的为准）\n' + [...asked, ...later].join('\n') + '\n' : '',
    '## 执行时调用的工具', tools.length ? tools.join('\n') : '（没有调用工具）', '',
    task.material ? '## 同事拿到的素材（系统从自己的记录里给的，视为已核实）\n' + String(task.material).slice(0, 8000) + '\n' : '',
    '## 交付内容', docs, '',
    '## 核对什么',
    '1. 交付内容是否回答了用户的要求（含用户后来补充的话）；有没有承诺了但没做的事。',
    task.material ? '2. 交付里的关键事实和数字，是否能对应到上面的素材或工具调用（素材里没有、也没调用工具就给出的具体数据，视为未核实）。' : '2. 交付里的关键事实和数字，是否能对应到上面的工具调用（没有调用工具却给出具体数据的，视为未核实）。',
    '3. 有没有明显的自相矛盾或格式问题。',
    '', '最后只输出一个 JSON 对象，不要别的：{"passed": true 或 false, "checked": 核对过的要点数, "issues": 发现的问题数, "notes": "两三句话的结论"}',
  ].filter((x) => x !== '').join('\n')
}

/** Pull the verifier's JSON verdict out of its final text. */
export function parseVerdict(text) {
  const raw = String(text || '')
  const start = raw.lastIndexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  for (let i = raw.indexOf('{'); i >= 0 && i <= start; i = raw.indexOf('{', i + 1)) {
    try {
      const v = JSON.parse(raw.slice(i, end + 1))
      if (v && typeof v === 'object' && 'passed' in v) return { passed: !!v.passed, checked: Number(v.checked) || 0, issues: Number(v.issues) || 0, notes: String(v.notes || '').slice(0, 600) }
    } catch {}
  }
  return null
}
