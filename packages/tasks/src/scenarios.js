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
 *   deliverable: true | 'auto' | false         must deliver / decides itself (default) / never (chat-like)
 *   match(input) → boolean                     optional, packs claim inputs they recognise; the user never picks
 *   verifyPrompt(task, deliverable) → string    optional, phase 3
 *   model: { provider, model } | undefined      optional model override
 *   permission: string | undefined              optional permission preset override
 *   homeWidget: string | undefined              client slot id for the 今日 page (phase 4)
 *   ask: false | undefined                      false = this scenario's tasks may never stop to ask (mywork_ask errors);
 *                                               routine runs and the 今日 assistant refuse regardless (§2.7)
 * }
 */

/** Generic tool → step mapping; scenario maps take precedence. */
export const GENERIC_STEPS = [
  [/^deliver$/, '交付'],
  [/^mywork_ask$/, '提问'],
  [/^(mywork_task_)/, '派生任务'],
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
  return '工具 ' + name
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

/**
 * The assistant behind 今日's conversation. It answers what can be answered, hands real work to
 * a background task (mywork_task_create), turns timed requests into routines
 * (mywork_routine_create), sends a follow-up into an existing task (mywork_task_say), and keeps
 * its own replies short. Hidden from the packs list.
 *
 * §8.3 助理的连续性: `context.memory` (feed.js assistantMemory, injected by index.js) is what makes one assistant
 * across days — { recent: [{ id, title, status }], history: '9/29 用户：…\n9/29 你：…', results: [title] }.
 * It goes into the prompt as facts; nothing here says the assistant cannot see earlier days.
 */
export const ASSISTANT = {
  id: 'assistant',
  label: '助理',
  intro: '',
  examples: [],
  hidden: true,
  agentPreset: 'mywork-assistant', // presets/mywork-assistant: no shell, files or web; answer or hand off only
  toolStepMap: { mywork_task_create: '交办', mywork_routine_create: '安排', mywork_task_say: '追问' },
  deliverableKinds: [],
  deliverable: false,
  verify: false,
  compose(input, context) {
    const today = (context && context.today) || {}
    const memory = (context && context.memory) || {}
    const lines = [
      '你是 MyWork 里的助理，和用户在「今日」页上说话。用户随口说，你来判断怎么处理，不要反问用户想要哪种。',
      '',
      '四种处理：',
      '1. 一句两句能答的（解释、建议、算一下、改一段话）：直接答，像同事说话，不铺垫。',
      '2. 要干活的（查资料、比较、写文档、做表、整理文件、任何要用几分钟以上的）：调用 mywork_task_create 交给后台，input 写清楚要的结果；然后只回一句，说明交给后台了、大概会得到什么，不要自己动手做。',
      '3. 带时间的（每天 / 每周 / 工作日 / 几点 / 多久之后 / 提醒我）：调用 mywork_routine_create，然后按返回的 kind 回一句：是例行任务就说到点 MyWork 会做好交给用户（比如「每周五提醒我写周报」= 每周五 MyWork 写好周报），是提醒就说到点会提醒。',
      '4. 追问已有任务（「再短一点」「上一份改成英文」「刚才那个加个表」这类对已有结果的修改或补充）：调用 mywork_task_say，id 用下面「最近的任务」里对应任务的 id，text 用用户的原话；然后只回一句，说明已经让它接着改。不要为此新建任务。',
      '',
      '只用 mywork_task_create、mywork_routine_create 和 mywork_task_say 这三个工具；不要用 reminder、automation、bash、文件、搜索等任何别的工具，也不要在这个对话里调用 deliver。一件事只安排一次：工具返回后就回话，不要再补提醒或再查一遍。回复保持简短，可以用 Markdown 但不要标题和长列表。',
      today.summary ? '\n今天的情况：' + today.summary : '',
      Array.isArray(memory.recent) && memory.recent.length ? '\n最近的任务（追问时用它的 id）：\n' + memory.recent.map((x) => `- ${x.id} · ${x.title} · ${x.status}`).join('\n') : '',
      memory.history ? '\n前几天的对话：\n' + memory.history : '',
      Array.isArray(memory.results) && memory.results.length ? '\n最近的结果：' + memory.results.map((x) => '《' + x + '》').join('') : '',
      context && context.date ? '\n今天是 ' + context.date + '。' : '',
      '', '用户说：', input,
    ]
    return lines.filter((x) => x !== undefined).join('\n')
  },
}

export const BUILTIN_SCENARIOS = [GENERAL, ASSISTANT]

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
  return [
    '你是核验员。下面是一个后台任务、它执行时调用过的工具，以及它交付的内容。请只做核对，不要重做任务，不要调用会修改东西的工具。',
    '', '## 任务', task.input, '',
    '## 执行时调用的工具', tools.length ? tools.join('\n') : '（没有调用工具）', '',
    task.material ? '## 任务拿到的素材（系统从自己的记录里给的，视为已核实）\n' + String(task.material).slice(0, 8000) + '\n' : '',
    '## 交付内容', docs, '',
    '## 核对什么',
    '1. 交付内容是否回答了任务要求；有没有承诺了但没做的事。',
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
