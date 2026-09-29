/**
 * dsh-mywork-tasks — scenario registry.
 *
 * A scenario is how one class of tasks gets done. Scenario plugins register
 * through the `myworkTasks` service; this module holds the registry plus the
 * built-in generic scenario used when nothing more specific is chosen.
 *
 * Scenario {
 *   id, label, intro, examples: string[],
 *   compose(input, context) → string            prompt for the task session
 *   toolStepMap: { toolName: stepLabel }        tool call → step name (falls back to GENERIC_STEPS)
 *   deliverableKinds: string[]                  what `deliver` may produce
 *   verifyPrompt(task, deliverable) → string    optional, phase 3
 *   model: { provider, model } | undefined      optional model override
 *   permission: string | undefined              optional permission preset override
 *   homeWidget: string | undefined              client slot id for the 今日 page (phase 4)
 * }
 */

/** Generic tool → step mapping; scenario maps take precedence. */
export const GENERIC_STEPS = [
  [/^deliver$/, '交付'],
  [/^(mywork_task_)/, '派生任务'],
  [/^(browser|open_url|quick_links|web_|deepseek_search|fetch|search|http)/i, '查阅'],
  [/^(read|grep|glob|list|ls|cat|view|find)/i, '读取'],
  [/^(write|edit|create|apply_patch|patch|save|mkdir|move|copy)/i, '整理'],
  [/^(bash|run_code|shell|exec|python|node)/i, '执行'],
  [/^(oracle_|im_|reminder_|automation_)/, '取数'],
]

export function stepNameFor(tool, map) {
  const name = String(tool || '')
  if (map && Object.prototype.hasOwnProperty.call(map, name)) return String(map[name])
  for (const [re, label] of GENERIC_STEPS) if (re.test(name)) return label
  return '工具 ' + name
}

export const GENERAL = {
  id: 'general',
  label: '通用',
  intro: '说一个你要的结果：一份摘要、一张清单、一段说明、一次比较。后台完成后交给你一份 Markdown。',
  examples: ['把这个目录的 README 整理成一页产品介绍', '比较三种 Node 定时任务方案，给出推荐', '写一份本周工作计划，按天列出'],
  toolStepMap: {},
  deliverableKinds: ['markdown'],
  compose(input, context) {
    const lines = [
      '你是 MyWork 的后台执行者。用户不在线，不要提问，不要等待确认，自己把事情做完。',
      '',
      '用户要的结果：',
      input,
      '',
      '要求：',
      '1. 需要查资料、读文件、跑命令时直接用工具；缺信息就按合理假设继续，并在交付物里注明假设。',
      '2. 做完后必须调用 deliver 工具交付一份 Markdown 交付物：title 是一句话标题，markdown 正文先给结论，再给依据和过程要点。不要把交付内容只写在回复里。',
      '3. 交付后用一两句话总结你做了什么，作为最后的回复。',
    ]
    if (context && context.date) lines.push('', '今天是 ' + context.date + '。')
    if (context && context.cwd) lines.push('工作目录：' + context.cwd + '。')
    return lines.join('\n')
  },
}

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
    list() { return [...map.values()].map(publicView) },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
  }
}

export function publicView(s) {
  return { id: s.id, label: s.label, intro: s.intro || '', examples: Array.isArray(s.examples) ? s.examples.slice(0, 6) : [], deliverableKinds: s.deliverableKinds || ['markdown'], homeWidget: s.homeWidget || '' }
}

/** 调研：真实浏览器读网页，交付一份带来源的摘要。 */
export const RESEARCH = {
  id: 'research',
  label: '调研',
  intro: '给一个问题或几个网址，后台打开网页读完，交付一份带来源链接的摘要或比较。',
  examples: ['调研三家国产向量数据库的定价，做成对比表', '读一下 Paseo 的 GitHub 主页，总结它解决什么问题', '这周 Node.js 有哪些新版本，各改了什么'],
  toolStepMap: { open_url: '打开网页', quick_links: '打开网页' },
  deliverableKinds: ['summary', 'markdown'],
  compose(input, context) {
    return [
      '你是 MyWork 的后台调研员。用户不在线，不要提问，自己完成。',
      '', '调研题目：', input, '',
      '做法：',
      '1. 优先用浏览器工具（open_url / browser_*）打开真实网页读原文；没有浏览器工具就用已有知识并注明。',
      '2. 每个事实标来源（网址）。不确定的写"待核实"。',
      '3. 做完必须调用 deliver：kind 用 summary，title 一句话，markdown 先给结论（三到五句），再给依据表或要点，最后列来源。',
      '4. 交付后一两句话总结。',
      context && context.date ? `今天是 ${context.date}。` : '',
    ].filter(Boolean).join('\n')
  },
}

/** 办公：表格 / 文档 / 幻灯片（dsh-univer-office 提供工具）。 */
export const OFFICE = {
  id: 'office',
  label: '办公',
  intro: '要一张表、一份文档或一组幻灯片。装了 Univer 办公成员时直接生成文件，否则交付 Markdown 版本。',
  examples: ['做一张本月支出表，按类别汇总并画一个饼图', '把这段会议记录整理成一页纪要，带待办清单', '给新人写一份五页的入职介绍幻灯片大纲'],
  toolStepMap: { univer_new: '新建文档', univer_execute: '编辑文档', univer_export: '导出', univer_print_pdf: '导出', univer_screenshot: '预览' },
  deliverableKinds: ['markdown', 'table'],
  compose(input, context) {
    return [
      '你是 MyWork 的后台办公助理。用户不在线，不要提问，自己完成。',
      '', '要做的东西：', input, '',
      '做法：',
      '1. 如果有 univer_* 工具，用它们生成表格 / 文档 / 幻灯片，并在交付物里写明文件名和位置；没有就用 Markdown 表格或大纲直接交付。',
      '2. 数字要可追溯：假设的数值要标"示例"。',
      '3. 做完必须调用 deliver：title 一句话，markdown 里放最终内容（表格用 Markdown 表格），kind 用 table 或 markdown。',
      '4. 交付后一两句话总结。',
      context && context.cwd ? `工作目录：${context.cwd}。` : '',
    ].filter(Boolean).join('\n')
  },
}

export const BUILTIN_SCENARIOS = [GENERAL, RESEARCH, OFFICE]

/** Verification prompt: a second, read-only session checks the deliverable against the task and the run. */
export function defaultVerifyPrompt(task, deliverables, activity) {
  const tools = (activity || []).filter((a) => a.kind === 'tool').map((a) => `- ${a.name}${a.ok === false ? '（失败）' : ''}${a.detail ? '：' + a.detail : ''}`).slice(0, 40)
  const docs = (deliverables || []).map((d, i) => `### 交付物 ${i + 1}：${d.title}\n\n${String(d.markdown || '').slice(0, 6000)}`).join('\n\n')
  return [
    '你是核验员。下面是一个后台任务、它执行时调用过的工具，以及它交付的内容。请只做核对，不要重做任务，不要调用会修改东西的工具。',
    '', '## 任务', task.input, '',
    '## 执行时调用的工具', tools.length ? tools.join('\n') : '（没有调用工具）', '',
    '## 交付内容', docs, '',
    '## 核对什么',
    '1. 交付内容是否回答了任务要求；有没有承诺了但没做的事。',
    '2. 交付里的关键事实和数字，是否能对应到上面的工具调用（没有调用工具却给出具体数据的，视为未核实）。',
    '3. 有没有明显的自相矛盾或格式问题。',
    '', '最后只输出一个 JSON 对象，不要别的：{"passed": true 或 false, "checked": 核对过的要点数, "issues": 发现的问题数, "notes": "两三句话的结论"}',
  ].join('\n')
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
