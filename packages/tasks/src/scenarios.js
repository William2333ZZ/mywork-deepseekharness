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
