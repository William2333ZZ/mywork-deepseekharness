/**
 * dsh-mywork-tasks — browser half (CommonJS; wrapped by scripts/build-client.mjs with
 * src/md.cjs and client-icons.cjs inlined as preludes).
 *
 * The MyWork v2 shell, shaped like Manus / Muse: one box, tasks in the sidebar, a task
 * page with the run on the left and the deliverable on the right.
 *
 * Pages (main slot):
 *   mywork-today         今日：一个大输入框（场景选择、示例）、进行中、最近
 *   mywork-tasks         任务：列表；任务页 = 进度流（消息与工具调用）| 交付物（核验徽章、评价、导出）
 *   mywork-deliverables  交付物：全部交付物，按场景筛，查看器
 *   mywork-scenarios     场景：已装场景，示例一点即任务
 * Overlay (shell.overlay): completion toasts + browser notifications; keeps polling while any page is hidden.
 *
 * Window events (for the sidebar in dsh-mywork-codex-ui and other members):
 *   mywork:new-task {text?, scenario?}  mywork:open-task {id}  mywork:open-deliverable {id}
 * The dsh conversation behind a task is reachable only through 「过程」 (mywork:open-session).
 */
'use strict'

const React = require('react')
const md = require('./md.cjs')
const icons = require('./client-icons.cjs')
const icon = (name, opts) => icons.icon(name, { strokeWidth: 1.5, ...(opts || {}) })

const h = React.createElement
const PLUGIN = 'dsh-mywork-tasks'
const NS = 'mywork.tasks'
const API = '/mywork-tasks/api'
/** A routine run that is a report (日报 / 周报): shown as delivered, never as 有变化 / 没有变化. */
const isReport = (task) => !!(task && (task.report || (task.deliverables || []).some((d) => d.kind === 'report')))
const PANELS = { today: 'mywork-today', create: 'mywork-new', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', routines: 'mywork-routines', scenarios: 'mywork-scenarios' }
const FAST_MS = 3000
const SLOW_MS = 20000
const V2_KEY = 'dsh-mywork:v2'

const zh = {
  today: '今日', tasks: '任务', deliverables: '交付物', scenarios: '领域', packs: '领域', builtin: '内置', scenarioClear: '不指定，让系统判断',
  packsLead: '领域包决定一类事怎么做：用什么数据、交付什么、怎么核验。你不用选，说出来就行；装了领域包，它认得的事自动归它。',
  packsEmpty: '还没有装领域包。交易工作台是第一个。',
  hero: '你要什么结果？', ask: '今天要做什么', askRoutine: '安排一件例行的事，比如每天 9 点给我一份简报', hint: '回车创建，Shift + 回车换行。任务在后台完成，做完通知你。',
  running: '进行中', recent: '最近', none: '还没有任务。', noneRunning: '现在没有在跑的任务。', noneDeliverables: '还没有交付物。',
  all: '全部', active: '进行中', finished: '已完成', back: '返回', rerun: '再来一次', cancel: '取消', process: '过程', verifyAgain: '重新核验', rename: '重命名', remove: '删除', removeAsk: '删掉这条记录和它的交付物？', search: '搜索', noMatch: '没有匹配的', times: '次', phases: '步', verifyLabel: '核验', passed: '通过',
  progress: '进度', deliverable: '交付物', waitingDeliverable: '做完后交付物出现在这里。', failedTitle: '失败',
  queued: '排队', input: '你说的', elapsed: '用时', scenario: '场景', create: '创建', creating: '创建中…', openTask: '打开任务',
  ratingGood: '有用', ratingBad: '没用', exportMd: '导出 Markdown', exportPdf: '导出 PDF', none2: '无',
  verified: '已核验', verifyIssues: '核验发现问题', verifyNone: '未能核验', verifying: '核验中', checked: '核对', issues: '问题',
  doneToast: '任务完成', failedToast: '任务失败', open: '打开', tryScenario: '用这个场景', kinds: '交付', examples: '示例',
  toolFailed: '失败', stepsTitle: '步骤',
  attention: '等你看', attentionEmpty: '没有等你处理的事。', failedCard: '失败，可以再来一次', issuesCard: '核验发现问题', rateCard: '交付了，看一眼给个评价', running1: '个在跑', waiting1: '份等你看', quiet: '今天还很安静', greetMorning: '早上好', greetDay: '下午好', greetNight: '晚上好', todayDone: '今天完成', examplesTitle: '可以试试',
  notesMore: '点开看核验员的完整说明', conversation: '对话', handedOff: '已交给后台', thinking: '在想', paused: '已暂停', ended: '已结束', endedN: '已结束的 {n} 项', runs: '运行记录', todayAt: '今天', allTasks: '全部', delivered: '已交付', answered: '已回答', quietDay: '今天没有等你的事。说一句，交给它。', moreRows: '还有 {n} 项', more: '更多', rawProcess: '原始对话', loadFailed: '没连上服务，稍后再试。', retry: '重试', moreRate: '还有 {n} 份交付了没评价',
  routines: '例行', routinesLead: '还没有例行的事。说一句带时间的话，比如「每天 9 点给我一份简报」。',
  routinesEmpty: '还没有例行的事。', remindCard: '提醒', gotIt: '知道了', runNow: '现在跑一次', pause: '暂停', resume: '恢复', remove: '删除', nextRun: '下次', lastRun: '上次', neverRan: '还没跑过', noChange: '没有变化', changed: '有变化', briefs: '今天的例行', scheduled: '已安排', kindTask: '例行任务', kindRemind: '提醒', quietTag: '安静',
  say: '回复', conversational: '这次是回答，没有生成文档；要保存时说“整理成一份…”。',
}
const en = {
  today: 'Today', tasks: 'Tasks', deliverables: 'Deliverables', scenarios: 'Domains', packs: 'Domains', builtin: 'built in', scenarioClear: 'Let the system decide',
  packsLead: 'A domain pack defines how one kind of work gets done: which data, what to deliver, how to verify. You never pick; a pack claims the requests it recognises.',
  packsEmpty: 'No domain packs installed yet. The trading workbench is the first.',
  hero: 'What do you want done?', ask: 'What needs doing today', askRoutine: 'Schedule something, e.g. a brief every day at 9', hint: 'Enter creates the task, Shift + Enter for a new line. It runs in the background and notifies you when done.',
  running: 'In progress', recent: 'Recent', none: 'No tasks yet.', noneRunning: 'Nothing is running.', noneDeliverables: 'No deliverables yet.',
  all: 'All', active: 'Active', finished: 'Finished', back: 'Back', rerun: 'Run again', cancel: 'Cancel', process: 'Process', verifyAgain: 'Verify again', rename: 'Rename', remove: 'Delete', removeAsk: 'Delete this record and its deliverables?', search: 'Search', noMatch: 'Nothing matches', times: 'calls', phases: 'steps', verifyLabel: 'Verification', passed: 'passed',
  progress: 'Progress', deliverable: 'Deliverable', waitingDeliverable: 'The deliverable appears here when the task finishes.', failedTitle: 'Failed',
  queued: 'Queued', input: 'Your request', elapsed: 'Elapsed', scenario: 'Scenario', create: 'Create', creating: 'Creating…', openTask: 'Open task',
  ratingGood: 'Useful', ratingBad: 'Not useful', exportMd: 'Export Markdown', exportPdf: 'Export PDF', none2: 'none',
  verified: 'Verified', verifyIssues: 'Issues found', verifyNone: 'Not verified', verifying: 'Verifying', checked: 'checked', issues: 'issues',
  doneToast: 'Task finished', failedToast: 'Task failed', open: 'Open', tryScenario: 'Use this scenario', kinds: 'Delivers', examples: 'Examples',
  toolFailed: 'failed', stepsTitle: 'Steps',
  attention: 'For you', attentionEmpty: 'Nothing waiting for you.', failedCard: 'Failed, can run again', issuesCard: 'Verification found issues', rateCard: 'Delivered, take a look and rate', running1: 'running', waiting1: 'waiting for you', quiet: 'A quiet day so far', greetMorning: 'Good morning', greetDay: 'Good afternoon', greetNight: 'Good evening', todayDone: 'Finished today', examplesTitle: 'Try',
  notesMore: 'Tap for the verifier’s full notes', conversation: 'Conversation', handedOff: 'Handed to the background', thinking: 'Thinking', paused: 'Paused', ended: 'Ended', endedN: '{n} ended', runs: 'Runs', todayAt: 'today', allTasks: 'All', delivered: 'Delivered', answered: 'Answered', quietDay: 'Nothing waiting for you today. Say something and hand it over.', moreRows: '{n} more', more: 'More', rawProcess: 'Raw conversation', loadFailed: 'Could not reach the service, try again shortly.', retry: 'Retry', moreRate: '{n} more deliveries waiting for a rating',
  routines: 'Routines', routinesLead: 'No routines yet. Say a sentence with a time: “every day at 9…”, “remind me at 6 on weekdays…”.',
  routinesEmpty: 'No routines yet.', remindCard: 'Reminder', gotIt: 'Got it', runNow: 'Run now', pause: 'Pause', resume: 'Resume', remove: 'Remove', nextRun: 'Next', lastRun: 'Last', neverRan: 'Never ran', noChange: 'No change', changed: 'Changed', briefs: 'Today’s routines', scheduled: 'Scheduled', kindTask: 'Routine', kindRemind: 'Reminder', quietTag: 'quiet',
  say: 'Reply', conversational: 'This was an answer, no document was produced; ask for one when you want it saved.',
}

const STYLE = `
/* Tokens: design/v2/DESIGN.md §2 (Open Design schema names). Light default, dark twin. */
.mwt{--bg:#ffffff;--surface:#f6f5f4;--surface-2:#efedeb;--fg:rgba(0,0,0,.92);--fg-2:#31302e;--muted:#615d59;--meta:#75706a;--border:rgba(0,0,0,.1);--border-soft:rgba(0,0,0,.06);--border-strong:rgba(0,0,0,.22);--accent:#0075de;--accent-on:#ffffff;--accent-hover:#005bab;--accent-soft:#eef6fd;--success:#127e28;--warn:#b5480a;--danger:#c0392b;--font-body:Geist,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei UI",sans-serif;--font-mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,monospace;--font-display:"Libre Baskerville","Noto Serif SC",Baskerville,"Songti SC",STSong,"Source Han Serif SC","Noto Serif CJK SC",SimSun,Georgia,serif;--radius-sm:6px;--radius-md:8px;--radius-lg:12px;--elev-raised:rgba(0,0,0,.04) 0 4px 18px,rgba(0,0,0,.027) 0 2px 7.85px,rgba(0,0,0,.02) 0 .8px 2.93px,rgba(0,0,0,.01) 0 .175px 1.04px;--focus-ring:0 0 0 3px rgba(0,117,222,.25);--motion-fast:150ms;--motion-base:200ms;--ease-standard:cubic-bezier(.2,0,0,1);height:100%;overflow:auto;background:var(--bg);color:var(--fg);font:15px/1.6 var(--font-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
/* skeleton */
.mwt-skeleton .mwt-card{cursor:default}
.mwt-sk{display:block;border-radius:4px;background:var(--surface-2)}
.mwt-sk-dot{width:16px;height:16px;border-radius:50%}
.mwt-sk-line{height:12px;width:60%;margin:3px 0 7px}
.mwt-sk-line.short{width:35%;height:10px;margin:0}
.mwt-sk-meta{width:36px;height:10px}
.mwt-retry{display:flex;align-items:center;gap:10px;color:var(--danger);font-size:14px;padding:8px 2px}
body[data-ds-dark-theme] .mwt{--bg:#191919;--surface:#202020;--surface-2:#2a2a2a;--fg:rgba(255,255,255,.9);--fg-2:#e6e4e0;--muted:#9b9893;--meta:#8a867f;--border:rgba(255,255,255,.1);--border-soft:rgba(255,255,255,.06);--border-strong:rgba(255,255,255,.24);--accent:#529cca;--accent-on:#111111;--accent-hover:#6cb0dd;--accent-soft:rgba(82,156,202,.16);--success:#4dab7a;--warn:#e08a3c;--danger:#e26e63;--elev-raised:rgba(0,0,0,.35) 0 4px 18px,rgba(0,0,0,.25) 0 2px 8px;--focus-ring:0 0 0 3px rgba(82,156,202,.35)}
.mwt *{box-sizing:border-box}
.mwt :focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-sm)}
/* Text fields: the container border shows focus; the field itself draws nothing. */
.mwt textarea:focus,.mwt textarea:focus-visible{outline:none!important;box-shadow:none!important}
.mwt button{font-family:inherit;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),border-color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard),opacity var(--motion-fast) var(--ease-standard)}
.mwt button:active{transform:scale(.98)}
@media (prefers-reduced-motion:reduce){.mwt *{transition:none!important;animation:none!important}}
/* Page */
.mwt-page{max-width:808px;margin:0 auto;padding:40px 28px 80px}
.mwt-page.wide{max-width:808px}
.mwt-title{display:flex;align-items:baseline;gap:10px;margin:0 0 24px}
.mwt-title h1{margin:0;font-family:var(--font-display);font-size:26px;line-height:1.35;font-weight:400}
.mwt-title span{color:var(--meta);font-size:12.5px;font-family:var(--font-mono)}
.mwt-lead{margin:-12px 0 24px;max-width:65ch;color:var(--muted);font-size:14px;line-height:1.7}
.mwt-greet{margin:0 0 36px}
.mwt-greet h1{margin:0 0 4px;font-family:var(--font-display);font-size:28px;line-height:1.35;font-weight:400}
.mwt-greet p{margin:0;color:var(--muted);font-size:14px}
.mwt-hero{min-height:calc(100vh - 220px);display:flex;flex-direction:column;justify-content:center;padding:0 0 8vh;text-align:center}
.mwt-hero h1{margin:0 0 20px;font-family:var(--font-display);font-size:28px;line-height:1.35;font-weight:400}
@media (max-width:720px){.mwt-hero{min-height:0;padding:24px 0 8px}}
.mwt-section{margin-top:32px}
.mwt-section.first{margin-top:0}
.mwt-section h2,.mwt-col h2{display:flex;align-items:center;gap:6px;margin:0 0 10px 2px;font-size:12.5px;line-height:18px;font-weight:500;letter-spacing:.02em;color:var(--muted)}
.mwt-section h2 span,.mwt-col h2 span{color:var(--meta);font-family:var(--font-mono);font-weight:400}
.mwt-col h2 .grow{flex:1}
.mwt-section h2 svg,.mwt-col h2 svg{color:var(--meta)}
.mwt-empty{color:var(--muted);font-size:15px;padding:8px 2px}
.mwt-quiet{padding:4px 2px}
.mwt-quiet p{margin:0 0 4px;color:var(--muted);font-size:15px}
.mwt-quiet .mwt-chips{margin-top:10px}
/* Lists: one recipe. Container with a whisper border, rows divided by soft lines. */
.mwt-cards,.mwt-atts,.mwt-rts{display:grid;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg)}
.mwt-card,.mwt-att,.mwt-rt{display:grid;align-items:center;column-gap:12px;min-height:44px;padding:12px 16px;border:0;border-top:1px solid var(--border-soft);background:transparent;color:inherit;font:inherit;text-align:left;width:100%;transition:background-color var(--motion-fast) var(--ease-standard)}
.mwt-cards>:first-child,.mwt-atts>:first-child,.mwt-rts>:first-child{border-top:0}
.mwt-card{grid-template-columns:20px minmax(0,1fr) auto;cursor:pointer}
.mwt-card:hover,.mwt-att:hover{background:var(--surface)}
.mwt-card:focus-visible,.mwt-att:focus-visible{box-shadow:inset var(--focus-ring);border-radius:0}
.mwt-card-title{display:block;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub{display:block;color:var(--muted);font-size:12.5px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub.err{color:var(--danger)}
.mwt-card-meta{color:var(--meta);font-size:12px;font-family:var(--font-mono);white-space:nowrap;font-variant-numeric:tabular-nums}
.mwt-att{grid-template-columns:20px minmax(0,1fr) auto;cursor:pointer}
.mwt-att-ic{display:flex;color:var(--muted)}
.mwt-att[data-kind=failed] .mwt-att-ic{color:var(--danger)}
.mwt-att[data-kind=issues] .mwt-att-ic{color:var(--warn)}
.mwt-att[data-kind=rate] .mwt-att-ic{color:var(--success)}
.mwt-att[data-kind=remind] .mwt-att-ic{color:var(--fg-2)}
.mwt-att-label{font-size:12px;line-height:16px;color:var(--meta)}
.mwt-att-title{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-att-sub{color:var(--muted);font-size:12.5px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-att-go{display:flex;color:var(--meta)}
.mwt-rt{grid-template-columns:20px minmax(0,1fr) auto}
.mwt-rt[data-off=true]{opacity:.55}
.mwt-rt-title{font-weight:500;display:flex;align-items:center;gap:8px;min-width:0}
.mwt-rt-sub{color:var(--muted);font-size:12.5px;line-height:18px;font-variant-numeric:tabular-nums}
.mwt-dot{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;color:var(--meta)}
.mwt-dot[data-s=running] svg,.mwt-dot[data-s=delivering] svg,.mwt-dot[data-s=verifying] svg{animation:mwt-spin 1.6s linear infinite;color:var(--fg-2)}
.mwt-dot[data-s=ok]{color:var(--success)}
.mwt-dot[data-s=err]{color:var(--danger)}
@keyframes mwt-spin{to{transform:rotate(360deg)}}
/* Buttons */
.mwt-btn{appearance:none;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border:0;border-radius:var(--radius-sm);background:var(--surface);color:var(--fg);font:inherit;font-size:14px;font-weight:500;letter-spacing:.01em;cursor:pointer;white-space:nowrap}
.mwt-btn:hover{background:var(--surface-2)}
.mwt-btn[disabled]{opacity:.4;cursor:default;transform:none}
.mwt-btn.send{background:var(--fg);color:var(--bg)}
.mwt-btn.send:hover{background:var(--fg-2)}
.mwt-btn.send[disabled]{background:var(--surface-2);color:var(--meta);opacity:1;cursor:default}
.mwt-btn.primary{background:var(--accent);color:var(--accent-on)}
.mwt-btn.primary:hover{background:var(--accent-hover)}
.mwt-btn.round{width:32px;height:32px;padding:0;border-radius:50%;justify-content:center}
.mwt-btn.ghost{background:transparent;color:var(--muted)}
.mwt-btn.ghost:hover{background:var(--surface);color:var(--fg)}
.mwt-chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}
.mwt-chips.center{justify-content:center}
.mwt-chip{appearance:none;border:1px solid transparent;border-radius:var(--radius-md);background:var(--surface);color:var(--muted);padding:6px 12px;font:inherit;font-size:14px;line-height:20px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-chip:hover{color:var(--fg);background:var(--surface-2)}
.mwt-chip[data-on=true]{color:var(--fg-2);background:var(--bg);border-color:var(--border)}
.mwt-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:9999px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:.02em;color:var(--muted);background:var(--surface)}
.mwt-badge[data-v=passed]{color:var(--success);background:color-mix(in srgb,var(--success) 10%,transparent)}
.mwt-badge[data-v=issues]{color:var(--warn);background:color-mix(in srgb,var(--warn) 10%,transparent)}
.mwt-badge[data-v=verifying] svg{animation:mwt-spin 1.6s linear infinite}
/* Composer: a raised card holding the field. */
.mwt-ask-wrap{padding:0}
.mwt-ask{text-align:left;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);padding:14px 12px 10px 16px;transition:border-color var(--motion-fast) var(--ease-standard)}
.mwt-ask:focus-within{border-color:var(--border-strong)}
.mwt-ask textarea{display:block;width:100%;min-height:52px;max-height:240px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:15px;line-height:1.7;padding:0}
.mwt-ask textarea::placeholder{color:var(--meta)}
.mwt-ask-row{display:flex;align-items:center;gap:8px;margin-top:8px}
.mwt-ask-row .grow{flex:1;min-width:0}
.mwt-ask-row small{display:block;color:var(--meta);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-page-today{display:flex;flex-direction:column;min-height:100%;padding-bottom:0}
.mwt-page-today>.mwt-greet,.mwt-page-today>.mwt-list,.mwt-page-today>.mwt-empty,.mwt-page-today>.mwt-cards,.mwt-page-today>.mwt-retry{flex:none}
.mwt-dock{position:sticky;bottom:0;margin:32px 0 0;margin-top:auto;padding:12px 0 20px;background:linear-gradient(to top,var(--bg) 70%,transparent)}
.mwt-ask-wrap.compact .mwt-ask{display:flex;flex-wrap:nowrap;align-items:flex-end;gap:8px;padding:8px 8px 8px 20px;border-radius:24px;box-shadow:0 1px 2px color-mix(in srgb,var(--fg) 4%,transparent),0 6px 20px color-mix(in srgb,var(--fg) 5%,transparent)}
.mwt-ask-wrap.compact textarea{flex:1 1 0;min-width:0;min-height:36px;font-size:16px;line-height:26px;padding:5px 0}
.mwt-ask-wrap.compact .mwt-btn.round{flex:none}
.mwt-ask-wrap.compact .mwt-ask-row{display:contents}
.mwt-ask-wrap.compact .mwt-ask-row .grow{display:none}
.mwt-ask-wrap.compact .mwt-ask-row small.grow{display:block;flex-basis:100%;order:3;color:var(--danger);font-size:12.5px;padding:0 0 4px 2px}
.mwt-ask-wrap.compact .mwt-ask-row .mwt-chip{order:1}
.mwt-ask-wrap.compact .mwt-ask-row .mwt-btn.round{order:2}
.mwt-ask-wrap.compact .mwt-chips{display:none}
/* One row shape for 今日 and 任务 */
.mwt-list{display:grid;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg)}
.mwt-row{display:grid;grid-template-columns:20px minmax(0,1fr) auto;align-items:center;column-gap:12px;min-height:52px;padding:14px 18px;border:0;border-top:1px solid var(--border-soft);background:transparent;color:inherit;font:inherit;text-align:left;width:100%;cursor:pointer;transition:background-color var(--motion-fast) var(--ease-standard)}
.mwt-row:first-child{border-top:0}
.mwt-row:hover{background:var(--surface)}
.mwt-row:focus-visible{box-shadow:inset var(--focus-ring);border-radius:0}
.mwt-row-main{min-width:0;display:grid}
.mwt-row-title{font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-row-sub{color:var(--muted);font-size:13px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-row-state{color:var(--meta);font-size:13px;white-space:nowrap;font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;gap:6px}
.mwt-row-state[data-tone=danger]{color:var(--danger)}
.mwt-row-state[data-tone=warn]{color:var(--warn)}
.mwt-row-more .mwt-row-title{font-weight:400;color:var(--muted)}
.mwt-spent{margin:16px 0 0}
/* Conversation, the Grok shape: the user's words in a bubble on the right, the reply as plain text on the left. */
.mwt-thread{margin-top:40px;display:flex;flex-direction:column;gap:26px}
.mwt-turn{min-width:0}
.mwt-thread-end{scroll-margin-bottom:96px} /* the docked composer covers the last lines otherwise */
.mwt-turn.user{display:flex;justify-content:flex-end}
.mwt-bubble{max-width:78%;padding:11px 18px;border-radius:22px;background:var(--surface);color:var(--fg);font-size:16px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.mwt-turn.ai{font-size:16px;line-height:1.75}
.mwt-turn.ai .mwt-md>:first-child{margin-top:0}
.mwt-turn.ai .mwt-md>:last-child{margin-bottom:0}
.mwt-turn.ai .mwt-handoff{margin:0}
.mwt-thinking span{display:inline-block;color:var(--muted);background:linear-gradient(90deg,var(--muted) 0%,var(--fg) 50%,var(--muted) 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:mwt-shimmer 1.8s linear infinite}
@keyframes mwt-shimmer{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.mwt-thinking span{animation:none;background:none;-webkit-text-fill-color:currentColor}}
.mwt-handoff{appearance:none;display:inline-flex;align-items:center;gap:6px;margin:0 0 14px;padding:5px 10px 5px 8px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg);color:var(--fg-2);font:inherit;font-size:13px;cursor:pointer}
/* A hand-off in the thread: one row per task that updates in place — running step · time, ✓ 已交付 · 已核验, 已回答, or 失败 with the one allowed button. */
.mwt-handoff-row{display:flex;align-items:center;gap:8px;max-width:560px}
.mwt-handoff-row .main{appearance:none;flex:1;min-width:0;display:grid;grid-template-columns:20px minmax(0,1fr) auto;column-gap:12px;align-items:center;min-height:44px;padding:7px 12px 7px 14px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mwt-handoff-row .main:hover{background:var(--surface-2)}
.mwt-handoff-row .ic{display:flex;align-items:center;justify-content:center;color:var(--meta)}
.mwt-handoff-row[data-tone=success] .ic{color:var(--success)}
.mwt-handoff-row[data-tone=danger] .ic{color:var(--danger)}
.mwt-handoff-row[data-tone=live] .ic{color:var(--fg-2)}
.mwt-handoff-row .ic .spin{animation:mwt-spin 1.6s linear infinite}
.mwt-handoff-row .body{min-width:0;display:grid}
.mwt-handoff-row .title{font-size:14px;line-height:20px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-handoff-row .sub{font-size:12.5px;line-height:18px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
/* ✓ result card: the countable outcome of a delivery, above the document. */
.mwt-result{display:grid;gap:2px;margin:0 0 18px;padding:10px 14px;border-radius:var(--radius-lg);background:var(--surface)}
.mwt-result-row{display:grid;grid-template-columns:16px auto minmax(0,1fr);column-gap:10px;align-items:baseline;min-height:26px;font-size:15px;line-height:24px}
.mwt-result-row svg{color:var(--success);align-self:center}
.mwt-result-row .label{font-weight:500;color:var(--fg)}
.mwt-result-row .value{color:var(--muted);min-width:0;overflow-wrap:anywhere}
.mwt-handoff:hover{background:var(--surface)}
.mwt-handoff[disabled]{cursor:default}
.mwt-row-static{cursor:default}
.mwt-row-static:hover{background:transparent}
.mwt-row[data-off=true] .mwt-row-title,.mwt-row[data-off=true] .mwt-dot{color:var(--meta)}
.mwt-row .mwt-menu .mwt-btn{height:28px;width:28px}
.mwt-task-title{margin:4px 0 6px;font-family:var(--font-display);font-size:26px;line-height:1.35;font-weight:400}
.mwt-task-title.edit{display:block;width:100%;box-sizing:border-box;padding:0 0 2px;border:0;border-bottom:1px solid var(--border-strong);border-radius:0;outline:0;background:transparent;color:inherit;font:inherit;font-family:var(--font-display);font-size:26px;line-height:1.35;font-weight:400}
.mwt-confirm{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 16px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);font-size:13.5px}
.mwt-confirm>span{flex:1;min-width:160px}
.mwt-btn.danger{color:var(--danger);border-color:color-mix(in srgb,var(--danger) 40%,transparent)}
.mwt-filters{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px}
.mwt-search{display:flex;align-items:center;gap:6px;flex:1 1 180px;min-width:0;max-width:320px;height:30px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg);color:var(--meta)}
.mwt-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--fg);font:inherit;font-size:13.5px}
.mwt-search input::-webkit-search-cancel-button{-webkit-appearance:none}
.mwt-task-meta{margin:0 0 22px;color:var(--meta);font-size:13px;font-variant-numeric:tabular-nums}
.mwt-answer{font-size:15px;line-height:1.7;margin:0 0 16px}
.mwt-proc{margin:24px 0 0;border-top:1px solid var(--border-soft)}
.mwt-proc-head{appearance:none;display:flex;align-items:center;gap:10px;width:100%;padding:12px 0;border:0;background:transparent;color:var(--muted);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.mwt-proc-head:hover{color:var(--fg)}
.mwt-proc-head .grow{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-menu{position:relative}
.mwt-menu-pop{position:absolute;right:0;top:36px;min-width:160px;padding:4px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);box-shadow:var(--elev-raised);z-index:5;display:grid}
.mwt-menu-pop button{appearance:none;display:flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--fg);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.mwt-menu-pop button:hover{background:var(--surface)}
/* Task page */
.mwt-toolbar{display:flex;align-items:center;gap:4px;margin:0 0 12px}
.mwt-toolbar .grow{flex:1}
.mwt-detail-head{display:flex;align-items:flex-start;gap:12px;margin:0 0 4px}
.mwt-detail-head h1{flex:1;margin:0;font-family:var(--font-display);font-size:26px;line-height:1.35;font-weight:400}
.mwt-meta{display:flex;flex-wrap:wrap;gap:4px 16px;color:var(--meta);font-size:12.5px;margin:0 0 24px;padding-left:32px;font-variant-numeric:tabular-nums}
.mwt-actions{display:flex;gap:2px;flex-wrap:wrap}
.mwt-error{border:1px solid color-mix(in srgb,var(--danger) 30%,transparent);border-radius:var(--radius-lg);padding:10px 14px;color:var(--danger);font-size:13px;line-height:1.6;margin:0 0 20px;white-space:pre-wrap}
.mwt-steps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.mwt-step{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:9999px;background:var(--surface);font-size:12px;line-height:16px;color:var(--muted);font-variant-numeric:tabular-nums}
.mwt-step[data-live=true]{color:var(--fg-2);border:1px solid var(--border);padding:1px 7px}
.mwt-phases{padding:0 0 10px}
.mwt-phase-head{appearance:none;display:grid;grid-template-columns:18px auto auto minmax(0,1fr);column-gap:10px;align-items:center;width:100%;min-height:30px;padding:3px 0;border:0;background:transparent;color:var(--fg);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:default}
button.mwt-phase-head{cursor:pointer}
button.mwt-phase-head:hover .verb,button.mwt-phase-head:hover .obj{color:var(--fg)}
.mwt-phase-head .ic{display:flex;align-items:center;justify-content:center;height:20px;color:var(--meta)}
.mwt-phase-head[data-tone=live] .ic{color:var(--fg-2)}
.mwt-phase-head[data-tone=live] .ic svg{animation:mwt-spin 1.6s linear infinite}
.mwt-phase-head[data-tone=danger] .ic{color:var(--danger)}
.mwt-phase-head .verb{font-weight:500;color:var(--fg-2);white-space:nowrap}
.mwt-phase-head .meta{color:var(--meta);font-variant-numeric:tabular-nums;white-space:nowrap}
.mwt-phase-head .obj{min-width:0;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-phase-body{margin:2px 0 10px 8px;padding-left:19px;border-left:1px solid var(--border-soft)}
.mwt-phase-body .mwt-ev{padding:2px 0}
.mwt-phase-note{display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:10px;padding:5px 0;font-size:13px;line-height:1.6;color:var(--fg);cursor:pointer}
.mwt-phase-note .ic{display:flex;justify-content:center;padding-top:2px;color:var(--meta)}
.mwt-phase-note .body{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;word-break:break-word;color:var(--muted)}
.mwt-phase-note.open .body{display:block;color:var(--fg)}
.mwt-phase-note .lbl{color:var(--fg-2);font-weight:500}
.mwt-ev{position:relative;display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:12px;padding:4px 0;font-size:13px;line-height:20px}
.mwt-ev .ic{display:flex;align-items:center;justify-content:center;height:20px;color:var(--meta)}
.mwt-ev[data-ok=true] .ic{color:var(--success)}
.mwt-ev[data-ok=false] .ic{color:var(--danger)}
.mwt-ev .line{min-width:0;display:flex;flex-wrap:wrap;gap:0 8px;align-items:baseline}
.mwt-ev .verb{font-weight:500;color:var(--fg-2)}
.mwt-ev .obj{color:var(--muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.mwt-ev .result{color:var(--danger);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-ev.text{padding:8px 0 10px}
.mwt-ev.text .body{white-space:pre-wrap;word-break:break-word;color:var(--fg);font-size:14px;line-height:1.7}
.mwt-ev.text .ic{color:var(--muted)}
.mwt-ev.user{padding:6px 0 8px}
.mwt-ev.user .body{display:inline-block;max-width:100%;padding:6px 12px;border-radius:var(--radius-lg);background:var(--surface);color:var(--fg);white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.6}
.mwt-ev.user .ic{color:var(--meta)}
.mwt-say{margin:12px 0 0}
.mwt-say-inner{display:flex;align-items:flex-end;gap:8px;border:1px solid var(--border);border-radius:24px;background:var(--bg);padding:8px 8px 8px 20px;box-shadow:0 1px 2px color-mix(in srgb,var(--fg) 4%,transparent),0 6px 20px color-mix(in srgb,var(--fg) 5%,transparent);transition:border-color var(--motion-fast) var(--ease-standard)}
.mwt-say-inner:focus-within{border-color:var(--border-strong)}
.mwt-say textarea{flex:1 1 0;min-width:0;display:block;min-height:34px;max-height:160px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:16px;line-height:26px;padding:5px 0}
.mwt-say textarea::placeholder{color:var(--meta)}
.mwt-say .mwt-btn.send{flex:none}
.mwt-say-err{display:block;color:var(--danger);font-size:12.5px;padding:6px 2px 0}
/* Deliverable: the one raised card. */
.mwt-doc{margin:0 0 8px}
.mwt-doc-head{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border-soft);flex-wrap:wrap}
.mwt-doc-head h3{flex:1;margin:0;font-size:14px;font-weight:500;min-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-doc-head>svg{color:var(--muted)}
.mwt-doc-body{padding:18px 24px 8px}
.mwt-doc-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:var(--meta);font-size:12px;font-family:var(--font-mono);margin:0 0 14px;font-variant-numeric:tabular-nums}
.mwt-notes{font-size:13px;line-height:1.7;color:var(--muted);border-left:2px solid var(--border);padding:2px 12px;margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
.mwt-notes.open{display:block;-webkit-line-clamp:unset}
.mwt-doc-actions{display:flex;gap:2px;flex-wrap:wrap;align-items:center;padding:8px 0 0;margin-top:8px}
.mwt-doc-actions .mwt-btn[aria-pressed=true]{color:var(--fg);background:var(--surface)}
.mwt-md{font-size:16px;line-height:1.75;color:var(--fg)}
.mwt-md>:first-child{margin-top:0}
.mwt-md h2,.mwt-md h3,.mwt-md h4{margin:22px 0 8px;font-weight:600;line-height:1.4}
.mwt-md h1,.mwt-md h2{font-family:var(--font-display);font-weight:400}
.mwt-md h2{font-size:20px}.mwt-md h3{font-size:16px}.mwt-md h4{font-size:15px}
.mwt-md p{margin:0 0 12px;max-width:65ch}.mwt-md ul,.mwt-md ol{margin:0 0 12px;padding-left:22px}.mwt-md li{margin:2px 0}
.mwt-md code{font-family:var(--font-mono);font-size:12.5px;background:var(--surface);padding:1px 5px;border-radius:4px}
.mwt-md pre{background:var(--surface);border-radius:var(--radius-md);padding:12px 14px;overflow:auto;margin:0 0 12px}.mwt-md pre code{background:transparent;padding:0}
.mwt-md table{border-collapse:collapse;margin:0 0 16px;font-size:14px;font-variant-numeric:tabular-nums}
.mwt-md th,.mwt-md td{padding:6px 12px;text-align:left;border-bottom:1px solid var(--border-soft)}
.mwt-md th{font-weight:500;color:var(--muted);font-size:12.5px;letter-spacing:.02em;background:var(--surface)}
.mwt-md blockquote{margin:0 0 12px;padding:2px 14px;border-left:2px solid var(--border);color:var(--muted)}
.mwt-md hr{border:0;border-top:1px solid var(--border-soft);margin:18px 0}
.mwt-md a{color:var(--fg);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--border)}
.mwt-md strong{font-weight:600}
/* 领域 */
.mwt-scen{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.mwt-scen-card{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);padding:18px 20px 16px;display:flex;flex-direction:column;gap:8px}
.mwt-scen-card h3{margin:0;font-size:16px;font-weight:600;display:flex;align-items:center}
.mwt-scen-card p{margin:0;color:var(--muted);font-size:13px;line-height:1.7;flex:1}
.mwt-scen-card .ex{display:grid;gap:2px;padding-top:6px;border-top:1px solid var(--border-soft)}
.mwt-scen-card .ex button{appearance:none;border:0;background:transparent;color:var(--muted);font:inherit;font-size:13px;text-align:left;padding:5px 0;cursor:pointer}
.mwt-scen-card .ex button:hover{color:var(--fg)}
/* Toasts */
.mwt-toasts{position:fixed;right:16px;bottom:16px;z-index:10050;display:grid;gap:8px;max-width:380px;padding:0!important;height:auto!important;overflow:visible!important;background:transparent!important}
.mwt-toast{display:grid;grid-template-columns:20px minmax(0,1fr) auto;column-gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);color:var(--fg);box-shadow:var(--elev-raised);font-size:13px;line-height:18px;animation:mwt-in var(--motion-base) var(--ease-standard)}
@keyframes mwt-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.mwt-toast b{display:block;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-toast span{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
@media (max-width:720px){
  .mwt-page{padding:20px 12px 56px}
  .mwt-page-today{padding-bottom:0}
  .mwt-greet h1,.mwt-title h1,.mwt-detail-head h1,.mwt-hero h1,.mwt-task-title{font-size:23px}
  .mwt-card,.mwt-att,.mwt-rt{padding:11px 12px}
  .mwt-card{grid-template-columns:18px minmax(0,1fr) auto}
  .mwt-att .mwt-btn{height:30px;padding:0 10px}
  .mwt-rt{grid-template-columns:20px minmax(0,1fr)}.mwt-rt .mwt-actions{grid-column:2;margin-top:4px}
  .mwt-toolbar{flex-wrap:wrap}
  .mwt-meta{padding-left:0}
  .mwt-col.sticky{position:static;order:-1}
  .mwt-doc-body{padding:14px 14px 4px}
  .mwt-doc-actions{padding:6px 6px 8px}
  .mwt-md{font-size:15px}
  .mwt-md table{display:block;overflow:auto;max-width:100%}
  .mwt-scen{grid-template-columns:minmax(0,1fr)}
  .mwt-toasts{left:12px;right:12px;bottom:12px;max-width:none}
  .mwt-dock{margin:24px 0 0;margin-top:auto;padding:8px 0 calc(8px + env(safe-area-inset-bottom))}
}
`

// ---- state ------------------------------------------------------------------
// `state` is replaced, never mutated: useSyncExternalStore compares snapshots by identity.
let state = { items: [], deliverables: [], reminders: [], routines: [], scenarios: [], loadedAt: 0, error: '' }
const listeners = new Set()
function setState(patch) { state = { ...state, ...patch }; for (const fn of listeners) fn() }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function getSnapshot() { return state }
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status))
  return data
}
let refreshing = null
const completionListeners = new Set() // (task) => void, fired when a task reaches done
const noticeListeners = new Set() // (title, body) => void
function announce(title, body) { for (const fn of noticeListeners) { try { fn(title, body) } catch {} } }
function refresh() {
  if (refreshing) return refreshing
  const before = new Map(state.items.map((t) => [t.id, t.status]))
  refreshing = api('/tasks').then((d) => {
    const items = d.items || []
    setState({ items, deliverables: d.deliverables || [], reminders: d.reminders || [], routines: d.routines || [], scenarios: d.scenarios || [], error: '', loadedAt: Date.now() })
    fire('mywork:tasks-updated', { items })
    if (before.size) for (const t of items) if (t.status === 'done' && before.has(t.id) && before.get(t.id) !== 'done') for (const fn of completionListeners) { try { fn(t) } catch {} }
  }).catch((e) => { setState({ error: e.message || String(e) }) }).finally(() => { refreshing = null })
  return refreshing
}
let pollTimer = null
let pollUsers = 0
function schedulePoll() {
  clearTimeout(pollTimer)
  if (pollUsers <= 0) return
  const active = state.items.some((t) => t.status !== 'done')
  pollTimer = setTimeout(() => { refresh().then(schedulePoll) }, active ? FAST_MS : SLOW_MS)
}
function usePolling() {
  React.useEffect(() => {
    pollUsers += 1
    refresh().then(schedulePoll)
    const onFocus = () => { refresh().then(schedulePoll) }
    window.addEventListener('focus', onFocus)
    return () => { pollUsers -= 1; window.removeEventListener('focus', onFocus); if (pollUsers <= 0) clearTimeout(pollTimer) }
  }, [])
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
function useTick(on) {
  const [, set] = React.useState(0)
  React.useEffect(() => { if (!on) return; const id = setInterval(() => set((n) => n + 1), 1000); return () => clearInterval(id) }, [on])
}

// ---- helpers ----------------------------------------------------------------
function fmtDuration(ms) {
  if (!(ms > 0)) return '0s'
  const s = Math.round(ms / 1000)
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm ' + (s % 60) + 's'
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm'
}
function elapsedOf(t) { return fmtDuration(new Date(t.finishedAt || new Date().toISOString()) - new Date(t.startedAt || t.createdAt)) }
function fmtTime(iso) { if (!iso) return ''; return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
function fmtDate(iso) { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + fmtTime(iso) }
function isToday(iso) { if (!iso) return false; const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }
function visual(t) { return t.status !== 'done' ? t.status : t.error ? 'err' : 'ok' }
function StatusDot({ task }) {
  const v = visual(task)
  const name = v === 'ok' ? 'circle-check' : v === 'err' ? 'circle-x' : v === 'queued' ? 'history' : 'loader'
  return h('span', { className: 'mwt-dot', 'data-s': v, title: task.statusLabel }, icon(name, { size: 16 }))
}
/** State coverage: three quiet skeleton rows while the first poll is in flight, one sentence with a retry on error. */
function Skeleton({ rows }) { return h('div', { className: 'mwt-cards mwt-skeleton', 'aria-busy': 'true' }, Array.from({ length: rows || 3 }, (_, i) => h('div', { key: i, className: 'mwt-card' }, h('span', { className: 'mwt-sk mwt-sk-dot' }), h('span', null, h('span', { className: 'mwt-sk mwt-sk-line' }), h('span', { className: 'mwt-sk mwt-sk-line short' })), h('span', { className: 'mwt-sk mwt-sk-meta' })))) }
function fire(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })) } catch {} }
/** One plain line per tool call: a verb and the thing it touched; the raw arguments stay in the tooltip. */
function describeTool(name, detail) {
  // Arguments reach the stream either as a JSON string (dsh serialises tool calls) or as key=value pairs.
  let kv = {}
  const raw = String(detail || '').trim()
  if (raw.startsWith('{')) { try { kv = JSON.parse(raw) } catch { try { kv = JSON.parse(raw.replace(/[,\s]*…?$/, '').replace(/,\s*"[^"]*$/, '') + '}') } catch { kv = {} } } }
  if (!Object.keys(kv).length) for (const m of raw.matchAll(/(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g)) { let v = m[2]; if (v.startsWith('"')) { try { v = JSON.parse(v) } catch { v = v.slice(1, -1) } } kv[m[1]] = v }
  if (!Object.keys(kv).length && raw.startsWith('{')) { const m = raw.match(/"(url|file_path|path|title|query|command|pattern|description)"\s*:\s*"([^"]{1,200})/); if (m) kv[m[1]] = m[2]; const q = raw.match(/"queries"\s*:\s*\[\s*"([^"]{1,200})/); if (q) kv.queries = q[1] }
  const host = (u) => { try { const x = new URL(String(u)); return x.host.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.replace(/\/$/, '').slice(0, 40) : '') } catch { return String(u).slice(0, 60) } }
  const base = (p) => String(p || '').split('/').filter(Boolean).slice(-1)[0] || String(p || '')
  const n = String(name || '')
  if (/^web_fetch$|^open_url$|^browser_navigate$/.test(n)) return { verb: '读取网页', obj: host(kv.url || kv.href || '') }
  if (/^web_search$|search/.test(n)) { let q = kv.queries || kv.query || kv.q || ''; if (Array.isArray(q)) q = q[0] || ''; if (typeof q === 'string' && q.startsWith('[')) { try { q = JSON.parse(q)[0] } catch {} } return { verb: '搜索', obj: q ? '“' + String(q).slice(0, 60) + '”' : '' } }
  if (/^read$|read_file|^cat$|^view$/.test(n)) return { verb: '读取', obj: base(kv.file_path || kv.path || '') }
  if (/^(edit|write|apply_patch|create_file|write_file)$/.test(n)) return { verb: '整理', obj: base(kv.file_path || kv.path || '') }
  if (/^(glob|grep|list|ls|find)$/.test(n)) return { verb: '查找', obj: String(kv.pattern || kv.query || kv.path || '').slice(0, 60) }
  if (/^(bash|shell|run_code|exec)$/.test(n)) return { verb: '执行', obj: String(kv.description || kv.command || '').slice(0, 70) }
  if (n === 'deliver') return { verb: '交付', obj: String(kv.title || '').slice(0, 70) }
  if (/^univer_/.test(n)) return { verb: '文档', obj: String(kv.title || kv.name || kv.action || n.slice(7)).slice(0, 60) }
  if (/^browser_/.test(n)) return { verb: '浏览器', obj: n.slice(8) + (kv.url ? ' ' + host(kv.url) : '') }
  if (/^present/.test(n)) return { verb: '展示', obj: String(kv.title || '').slice(0, 60) }
  if (/^skill/.test(n)) return { verb: '技能', obj: String(kv.name || kv.skill || '').slice(0, 60) }
  return { verb: n, obj: String(detail || '').slice(0, 70) }
}
function Markdown({ text }) {
  const html = React.useMemo(() => md.render(text || ''), [text])
  return h('div', { className: 'mwt-md', dangerouslySetInnerHTML: { __html: html } })
}
function download(name, text, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/markdown;charset=utf-8' }))
  a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
function printDoc(d) {
  const w = window.open('', '_blank')
  if (!w) return
  const css = 'body{font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#222;max-width:760px;margin:40px auto;padding:0 24px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:18px 0 6px}h3{font-size:15px}table{border-collapse:collapse;font-size:13px}th,td{border:1px solid #ccc;padding:4px 10px}pre{background:#f4f4f4;padding:10px 12px;border-radius:6px;overflow:auto}code{font-family:Menlo,monospace;font-size:12.5px}blockquote{border-left:3px solid #ccc;margin:0;padding:2px 12px;color:#555}.meta{color:#777;font-size:12px;margin:0 0 20px}'
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + md.esc(d.title) + '</title><style>' + css + '</style></head><body><h1>' + md.esc(d.title) + '</h1><p class="meta">' + md.esc(fmtDate(d.createdAt)) + (d.verification && d.verification.passed === true ? ' · 已核验' : '') + '</p>' + md.render(d.markdown) + '</body></html>')
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch {} }, 300)
}
function safeName(s) { return String(s || 'deliverable').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'deliverable' }

// ---- components -------------------------------------------------------------
function makeComponents(ctx, t) {
  const selectPanel = (id) => { try { if (ctx.layout && typeof ctx.layout.selectPanel === 'function') ctx.layout.selectPanel(id) } catch (e) { console.warn(`[${PLUGIN}] selectPanel`, e) } }
  const nav = { pendingTask: '', pendingDeliverable: '', pendingRoutine: '', pendingInput: null }
  const openTask = (id) => { nav.pendingTask = id; selectPanel(PANELS.tasks) }
  const openRoutine = (id) => { nav.pendingRoutine = id; selectPanel(PANELS.routines); fire('mywork:open-routine', { id }) }
  const openDeliverable = (id) => { const d = state.deliverables.find((x) => x.id === id); if (d && d.taskId) openTask(d.taskId); else { nav.pendingDeliverable = id; selectPanel(PANELS.deliverables) } }
  const newTask = (text, scenario) => { nav.pendingInput = { text: text || '', scenario: scenario || '' }; selectPanel(PANELS.create) }

  function VerifyBadge({ v, status }) {
    if (status === 'verifying') return h('span', { className: 'mwt-badge', 'data-v': 'verifying' }, icon('loader', { size: 12 }), t('verifying'))
    if (!v) return null
    const kind = v.passed === true ? 'passed' : v.passed === false ? 'issues' : 'none'
    const label = kind === 'passed' ? t('verified') : kind === 'issues' ? t('verifyIssues') : t('verifyNone')
    const detail = v.checked ? ` · ${t('checked')} ${v.checked}${v.issues ? ` · ${t('issues')} ${v.issues}` : ''}` : ''
    return h('span', { className: 'mwt-badge', 'data-v': kind, title: v.notes || '' }, icon(kind === 'passed' ? 'circle-check' : kind === 'issues' ? 'circle-x' : 'x', { size: 12 }), label + detail)
  }

  function TaskCard({ task, onOpen, compact }) {
    const live = task.status !== 'done'
    const sub = live ? (task.currentStep || task.statusLabel) : task.error ? (t('failedTitle') + ' · ' + task.error) : ((task.routineId && !isReport(task) ? (task.quiet ? t('noChange') + ' · ' : t('changed') + ' · ') : '') + (task.summary || (task.deliverables[0] && task.deliverables[0].title) || ''))
    return h('button', { type: 'button', className: 'mwt-card', onClick: () => onOpen(task.id) },
      h(StatusDot, { task }),
      h('span', null, h('span', { className: 'mwt-card-title' }, task.title), compact ? null : h('span', { className: 'mwt-card-sub' + (task.error ? ' err' : '') }, sub)),
      h('span', { className: 'mwt-card-meta' }, live ? elapsedOf(task) : fmtTime(task.finishedAt)))
  }

  function Ask({ scenarios, initial, hero, compact, placeholder }) {
    const [focused, setFocused] = React.useState(false)
    const [text, setText] = React.useState(initial && initial.text ? initial.text : '')
    const [scenario, setScenario] = React.useState(initial && initial.scenario ? initial.scenario : '')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    const examples = (scenario ? (scenarios.find((s) => s.id === scenario) || { examples: [] }).examples : scenarios.flatMap((s) => s.examples.slice(0, s.builtin ? 4 : 2))).slice(0, 6)
    React.useEffect(() => { if ((initial || hero) && ref.current) ref.current.focus() }, [])
    React.useEffect(() => {
      const onNew = (e) => { const d = e.detail || {}; if (d.text !== undefined) setText(String(d.text)); if (d.scenario) setScenario(String(d.scenario)); if (ref.current) ref.current.focus() }
      window.addEventListener('mywork:new-task', onNew)
      return () => window.removeEventListener('mywork:new-task', onNew)
    }, [])
    const submit = async () => {
      const input = text.trim()
      if (!input || busy) return
      setBusy(true); setErr('')
      try { const d = await api('/create', scenario ? { input, scenario } : { input }); setText(''); setScenario(''); await refresh(); schedulePoll(); if (d.routine) openRoutine(d.routine.id); else if (d.task) openTask(d.task.id) } catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    const grow = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(240, el.scrollHeight) + 'px' }
    React.useEffect(grow, [text])
    return h('div', { className: compact ? 'mwt-ask-wrap compact' + (focused || text ? ' open' : '') : 'mwt-ask-wrap' },
      h('div', { className: 'mwt-ask' },
        h('textarea', { ref, value: text, placeholder: placeholder || t('ask'), rows: compact ? 1 : 2, onFocus: () => setFocused(true), onBlur: () => setTimeout(() => setFocused(false), 150), onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        h('div', { className: 'mwt-ask-row' },
          scenario ? h('button', { type: 'button', className: 'mwt-chip', 'data-on': true, title: t('scenarioClear'), onClick: () => setScenario('') }, (scenarios.find((s) => s.id === scenario) || { label: scenario }).label, ' ×') : null,
          err ? h('small', { className: 'grow' }, err) : h('span', { className: 'grow' }),
          h('button', { type: 'button', className: 'mwt-btn send round', 'aria-label': t('create'), title: t('create'), disabled: busy || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'arrow-up', { size: 15 })))),
      examples.length && !compact && !text ? h('div', { className: 'mwt-chips' + (hero ? ' center' : '') }, examples.map((ex) => h('button', { key: ex, type: 'button', className: 'mwt-chip', title: ex, onMouseDown: (e) => e.preventDefault(), onClick: () => { setText(ex); if (ref.current) ref.current.focus() } }, ex))) : null)
  }

  /**
   * 今日 is one list. Every row is the same shape: glyph, title, one state on the right.
   * Order: reminders, failures, verification issues, running, delivered today, the rest of today.
   */
  function todayRows(items, deliverables, reminders) {
    const rows = []
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    for (const r of reminders || []) rows.push({ key: 'r' + r.routineId + r.at, rank: 0, at: r.at, glyph: 'bell', tone: 'fg', title: r.title, state: t('remindCard') + ' · ' + fmtTime(r.at), action: { label: t('gotIt'), run: () => api('/routines/ack', { id: r.routineId, at: r.at }).then(() => refresh()) } })
    for (const x of items) {
      if (x.scenario === 'assistant') continue
      const done = x.status === 'done'
      const when = new Date(x.finishedAt || x.createdAt)
      if (done && x.error && !/已取消/.test(x.error) && when >= dayStart) rows.push({ key: 'f' + x.id, rank: 1, at: x.finishedAt, glyph: 'circle-x', tone: 'danger', title: x.title, state: t('failedTitle'), sub: x.error, action: { label: t('rerun'), run: () => api('/rerun', { id: x.id }).then((d) => { refresh(); if (d.task) openTask(d.task.id) }) }, open: () => openTask(x.id) })
      else if (done && x.verification && x.verification.passed === false && when >= dayStart) rows.push({ key: 'v' + x.id, rank: 2, at: x.finishedAt, glyph: 'circle-x', tone: 'warn', title: x.title, state: t('verifyIssues'), open: () => openTask(x.id) })
      else if (!done) rows.push({ key: 'l' + x.id, rank: 3, at: x.createdAt, glyph: 'loader', tone: 'live', spin: true, title: x.title, state: (x.currentStep || x.statusLabel) + ' · ' + elapsedOf(x), open: () => openTask(x.id) })
      else if (done && when >= dayStart) rows.push({ key: 'd' + x.id, rank: 4, at: x.finishedAt, glyph: 'circle-check', tone: 'success', title: x.title, state: x.routineId && !isReport(x) ? (x.quiet ? t('noChange') : t('changed')) : (x.deliverables.length ? t('delivered') : t('answered')), open: () => openTask(x.id) })
    }
    rows.sort((a, b) => a.rank - b.rank || new Date(b.at) - new Date(a.at))
    const unrated = (deliverables || []).filter((d) => d.rating === null || d.rating === undefined).length
    return { rows: rows.slice(0, 10), more: Math.max(0, rows.length - 10), unrated }
  }

  function Row({ row }) {
    const open = row.open || (() => {})
    return h('div', { className: 'mwt-row', role: row.open ? 'button' : undefined, tabIndex: row.open ? 0 : undefined, onClick: open, onKeyDown: (e) => { if (e.key === 'Enter' && row.open) open() } },
      h('span', { className: 'mwt-dot', 'data-s': row.spin ? 'running' : row.tone === 'success' ? 'ok' : row.tone === 'danger' ? 'err' : undefined, style: row.tone === 'warn' ? { color: 'var(--warn)' } : row.tone === 'fg' ? { color: 'var(--fg-2)' } : undefined }, icon(row.glyph, { size: 16 })),
      h('span', { className: 'mwt-row-main' }, h('span', { className: 'mwt-row-title' }, row.title), row.sub ? h('span', { className: 'mwt-row-sub' }, row.sub) : null),
      row.action ? h('button', { type: 'button', className: 'mwt-btn', onClick: (e) => { e.stopPropagation(); row.action.run().catch(() => {}) } }, row.action.label) : h('span', { className: 'mwt-row-state', 'data-tone': row.tone }, row.state))
  }

  function TodayPage() {
    const s = usePolling()
    const initial = nav.pendingInput; nav.pendingInput = null
    const active = s.items.filter((x) => x.status !== 'done')
    useTick(active.length > 0)
    const { rows, more, unrated } = todayRows(s.items, s.deliverables, s.reminders)
    const hour = new Date().getHours()
    const greet = hour < 12 ? t('greetMorning') : hour < 18 ? t('greetDay') : t('greetNight')
    const waiting = rows.filter((r) => r.rank <= 2).length
    const status = [active.length ? `${active.length} ${t('running1')}` : '', waiting ? `${waiting} ${t('waiting1')}` : ''].filter(Boolean).join(' · ') || t('quiet')
    return h('div', { className: 'mwt mwt-today' }, h('style', null, STYLE), h('div', { className: 'mwt-page mwt-page-today' },
      h('header', { className: 'mwt-greet' }, h('h1', null, greet)),
      !s.loadedAt && !s.error ? h(Skeleton, { rows: 3 })
        : s.error && !s.items.length ? h('div', { className: 'mwt-retry' }, h('span', null, t('loadFailed')), h('button', { type: 'button', className: 'mwt-btn', onClick: () => { refresh().then(schedulePoll) } }, t('retry')))
        : rows.length || unrated ? h('div', { className: 'mwt-list' }, rows.map((row) => h(Row, { key: row.key, row })),
          more || unrated ? h('button', { type: 'button', className: 'mwt-row mwt-row-more', onClick: () => selectPanel(PANELS.tasks) }, h('span', { className: 'mwt-dot' }, icon('list-checks', { size: 16 })), h('span', { className: 'mwt-row-main' }, h('span', { className: 'mwt-row-title' }, [more ? t('moreRows').replace('{n}', String(more)) : '', unrated ? t('moreRate').replace('{n}', String(unrated)) : ''].filter(Boolean).join(' · '))), h('span', { className: 'mwt-row-state' }, icon('arrow-left', { size: 14, style: { transform: 'rotate(180deg)' } }))) : null)
        : h('div', { className: 'mwt-quiet' }, h('p', null, t('quietDay')),
          h('div', { className: 'mwt-chips' }, s.scenarios.flatMap((sc) => sc.examples.slice(0, sc.builtin ? 3 : 1)).slice(0, 4).map((ex) => h('button', { key: ex, type: 'button', className: 'mwt-chip', onClick: () => newTask(ex) }, ex)))),
      h(RoutinesSection, { routines: s.routines }),
      h(DayThread, { items: s.items }),
      h('div', { className: 'mwt-dock' }, h(TodayAsk))))
  }

  /** Today's conversation: the last exchanges with the assistant; hand-offs it made are lines you can open. */
  function DayThread({ items }) {
    const [thread, setThread] = React.useState(null)
    const live = items.find((x) => x.scenario === 'assistant' && x.status !== 'done')
    const key = items.filter((x) => x.scenario === 'assistant').map((x) => x.id + x.status + (x.activity ? x.activity.length : 0)).join(',') + (live ? Math.floor(Date.now() / FAST_MS) : '')
    React.useEffect(() => { let on = true; api('/today').then((d) => { if (on) setThread(d.thread) }).catch(() => {}); return () => { on = false } }, [key])
    // What you just sent shows at once, the Grok way, until the server's copy of it arrives.
    const [pending, setPending] = React.useState('')
    React.useEffect(() => { const onSaid = (e) => setPending(String(e.detail && e.detail.text || '')); window.addEventListener('mywork:today-said', onSaid); return () => window.removeEventListener('mywork:today-said', onSaid) }, [])
    const entries = thread && Array.isArray(thread.activity) ? thread.activity : []
    React.useEffect(() => { if (pending && entries.some((e) => e.kind === 'user' && e.text === pending)) setPending('') }, [pending, entries.length])
    if (!entries.length && !live && !pending) return null
    const shown = entries.slice(-12).concat(pending ? [{ kind: 'user', text: pending }] : [])
    return h(Turns, { entries: shown, live: live || (pending ? { currentStep: '' } : null), items })
  }

  /** A conversation the Grok way: your words in a bubble on the right, the reply as plain text on the left, nothing else. */
  /** What a hand-off line says about its task right now: running step · time, ✓ delivered · verified, answered, or failed. */
  function handoffState(task) {
    if (!task) return null
    if (task.status !== 'done') return { glyph: 'loader', spin: true, tone: 'live', sub: (task.currentStep || task.statusLabel) + ' · ' + elapsedOf(task) }
    if (task.error) return { glyph: 'circle-x', tone: 'danger', sub: t('failedTitle') + ' · ' + String(task.error).slice(0, 80), failed: true }
    const v = task.verification
    if (task.deliverables && task.deliverables.length) return { glyph: 'check', tone: 'success', sub: t('delivered') + (v ? (v.passed === true ? ' · ' + t('verified') : v.passed === false ? ' · ' + t('verifyIssues') : '') : '') }
    return { glyph: 'check', tone: 'success', sub: t('answered') }
  }

  function Turns({ entries, live, items }) {
    const endRef = React.useRef(null)
    const n = entries.length
    React.useEffect(() => { if (endRef.current && typeof endRef.current.scrollIntoView === 'function') endRef.current.scrollIntoView({ block: 'nearest' }) }, [n, !!live])
    return h('section', { className: 'mwt-thread' },
      entries.map((e, i) => {
        if (e.kind === 'user') return h('div', { key: i, className: 'mwt-turn user' }, h('div', { className: 'mwt-bubble' }, e.text))
        if (e.kind === 'text') return h('div', { key: i, className: 'mwt-turn ai' }, h(Markdown, { text: e.text }))
        if (e.kind === 'handoff') {
          const isTask = e.target === 'task'
          const task = isTask && Array.isArray(items) ? items.find((x) => x.id === e.id) : null
          const st = isTask ? handoffState(task) : null
          const glyph = st ? st.glyph : isTask ? 'list-checks' : 'history'
          const sub = st ? st.sub : isTask ? t('handedOff') : (t('scheduled') + (e.schedule ? ' · ' + e.schedule : ''))
          return h('div', { key: i, className: 'mwt-turn ai' },
            h('div', { className: 'mwt-handoff-row', 'data-tone': st ? st.tone : undefined },
              h('button', { type: 'button', className: 'main', onClick: () => { if (isTask) openTask(e.id); else openRoutine(e.id) } },
                h('span', { className: 'ic' }, icon(glyph, { size: 15, className: st && st.spin ? 'spin' : undefined })),
                h('span', { className: 'body' }, h('span', { className: 'title' }, e.title), h('span', { className: 'sub' }, sub)),
                icon('arrow-left', { size: 13, style: { transform: 'rotate(180deg)', color: 'var(--meta)' } })),
              st && st.failed ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => api('/rerun', { id: e.id }).then((d) => { refresh().then(schedulePoll); if (d.task) openTask(d.task.id) }) }, t('rerun')) : null))
        }
        return null
      }),
      live ? h('div', { className: 'mwt-turn ai mwt-thinking' }, h('span', null, (live.currentStep || t('thinking')) + '…')) : null,
      h('div', { ref: endRef, className: 'mwt-thread-end' }))
  }

  /** The 今日 composer: talks to the assistant; it decides between answering, a task and a routine. */
  function TodayAsk() {
    const [text, setText] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    const submit = async () => {
      const body = text.trim()
      if (!body || busy) return
      setBusy(true); setErr('')
      try { setText(''); fire('mywork:today-said', { text: body }); await api('/today/say', { text: body }); await refresh(); schedulePoll() } catch (e) { setText(body); fire('mywork:today-said', { text: '' }); setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    React.useEffect(() => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(240, el.scrollHeight) + 'px' }, [text])
    return h('div', { className: 'mwt-ask-wrap compact' },
      h('div', { className: 'mwt-ask' },
        h('textarea', { ref, value: text, placeholder: t('ask'), rows: 1, onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        h('button', { type: 'button', className: 'mwt-btn send round', 'aria-label': t('create'), disabled: busy || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'arrow-up', { size: 15 }))),
      err ? h('small', { className: 'mwt-say-err' }, err) : null)
  }

  /** 新任务: one screen, one field. Sending lands on the task (or the routine) it created. */
  function CreatePage() {
    const s = usePolling()
    const initial = nav.pendingInput; nav.pendingInput = null
    return h('div', { className: 'mwt mwt-create' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      h('div', { className: 'mwt-hero' }, h('h1', null, t('hero')), h(Ask, { scenarios: s.scenarios, initial: initial || { text: '', scenario: '' }, hero: true }))))
  }

  /** Standing things, on the same page: what the system will do for you next. */
  function RoutinesSection({ routines }) {
    const [all, setAll] = React.useState(false)
    // A one-off that already fired is history, not a standing thing.
    const list = (routines || []).filter((r) => r.enabled || !r.once).slice().sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1) || (new Date(a.nextRunAt || 0) - new Date(b.nextRunAt || 0)))
    if (!list.length) return null
    const shown = all ? list : list.slice(0, 3)
    const when = (r) => !r.enabled ? t('paused') : r.nextRunAt ? t('nextRun') + ' ' + (isToday(r.nextRunAt) ? t('todayAt') + ' ' + fmtTime(r.nextRunAt) : fmtDate(r.nextRunAt)) : ''
    return h('section', { className: 'mwt-section' },
      h('h2', null, t('routines')),
      h('div', { className: 'mwt-list' }, shown.map((r) => { const go = () => { if (r.lastTaskId) openTask(r.lastTaskId); else openRoutine(r.id) }; return h('div', { key: r.id, className: 'mwt-row', 'data-off': !r.enabled, role: 'button', tabIndex: 0, onClick: go, onKeyDown: (e) => { if (e.key === 'Enter') go() } },
        h('span', { className: 'mwt-dot' }, icon(r.kind === 'remind' ? 'bell' : 'history', { size: 16 })),
        h('span', { className: 'mwt-row-main' }, h('span', { className: 'mwt-row-title' }, r.title), h('span', { className: 'mwt-row-sub' }, r.scheduleLabel)),
        h('span', { className: 'mwt-row-state' }, when(r))) }),
        list.length > 3 && !all ? h('button', { type: 'button', className: 'mwt-row mwt-row-more', onClick: () => setAll(true) }, h('span', { className: 'mwt-dot' }), h('span', { className: 'mwt-row-main' }, h('span', { className: 'mwt-row-title' }, t('moreRows').replace('{n}', String(list.length - 3)))), h('span', { className: 'mwt-row-state' }, icon('arrow-left', { size: 14, style: { transform: 'rotate(-90deg)' } }))) : null))
  }

  function Say({ task }) {
    const [text, setText] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    const blocked = task.status === 'verifying' || task.status === 'queued' || !task.sessionId
    const submit = async () => {
      const body = text.trim()
      if (!body || busy || blocked) return
      setBusy(true); setErr('')
      try { await api('/say', { id: task.id, text: body }); setText(''); await refresh(); schedulePoll() } catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    const grow = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(160, el.scrollHeight) + 'px' }
    React.useEffect(grow, [text])
    if (!task.sessionId) return null
    return h('div', { className: 'mwt-say' },
      h('div', { className: 'mwt-say-inner' },
        h('textarea', { ref, value: text, rows: 1, placeholder: t('say'), disabled: blocked, onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        h('button', { type: 'button', className: 'mwt-btn send round', 'aria-label': t('create'), disabled: busy || blocked || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'arrow-up', { size: 13 }))),
      err ? h('small', { className: 'mwt-say-err' }, err) : null)
  }

  /** Verifier notes: two lines by default, the whole text on tap. */
  function Notes({ text }) {
    const [open, setOpen] = React.useState(false)
    return h('div', { className: 'mwt-notes' + (open ? ' open' : ''), role: 'button', tabIndex: 0, title: open ? '' : t('notesMore'), onClick: () => setOpen(!open), onKeyDown: (e) => { if (e.key === 'Enter') setOpen(!open) } }, text)
  }

  function Doc({ d, status, onRate, onOpenTask }) {
    return h('article', { className: 'mwt-doc' },
      d.verification && d.verification.notes ? h(Notes, { text: d.verification.notes }) : null,
      Array.isArray(d.summary) && d.summary.length ? h('div', { className: 'mwt-result' }, d.summary.map((r, i) => h('div', { key: i, className: 'mwt-result-row' }, icon('check', { size: 14 }), h('span', { className: 'label' }, r.label), h('span', { className: 'value' }, r.value)))) : null,
      h(Markdown, { text: d.markdown }),
      h('div', { className: 'mwt-doc-actions' },
        h('button', { type: 'button', className: 'mwt-btn ghost', 'aria-pressed': d.rating === 1, onClick: () => onRate(d, 1) }, icon('check', { size: 13 }), t('ratingGood')),
        h('button', { type: 'button', className: 'mwt-btn ghost', 'aria-pressed': d.rating === -1, onClick: () => onRate(d, -1) }, icon('x', { size: 13 }), t('ratingBad')),
        h('span', { style: { flex: 1 } }),
        h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => download(safeName(d.title) + '.md', '# ' + d.title + '\n\n' + d.markdown) }, t('exportMd')),
        h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => printDoc(d) }, t('exportPdf')),
        onOpenTask ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: onOpenTask }, t('openTask')) : null))
  }

  function useTaskDetail(id, key) {
    const [detail, setDetail] = React.useState(null)
    React.useEffect(() => { let on = true; api('/task?id=' + encodeURIComponent(id)).then((d) => { if (on) setDetail(d) }).catch(() => {}); return () => { on = false } }, [id, key])
    return [detail, setDetail]
  }
  const rateIn = (setDetail) => (d, r) => api('/rate', { id: d.id, rating: d.rating === r ? null : r }).then((x) => setDetail((prev) => prev ? { ...prev, deliverables: prev.deliverables.map((y) => y.id === x.deliverable.id ? x.deliverable : y) } : prev)).catch(() => {})

  /** One line that says what the run did, and a fold that shows how. */
  function Process({ task, live }) {
    const [open, setOpen] = React.useState(live)
    React.useEffect(() => { if (live) setOpen(true) }, [live])
    const n = phasesOf(task).filter((r) => r.kind === 'phase').length
    const summary = [t('process'), n ? n + ' ' + t('phases') : '', elapsedOf(task)].filter(Boolean).join(' · ')
    return h('div', { className: 'mwt-proc' },
      h('button', { type: 'button', className: 'mwt-proc-head', 'aria-expanded': open, onClick: () => setOpen(!open) }, h('span', { className: 'mwt-dot', 'data-s': live ? 'running' : undefined }, icon(live ? 'loader' : 'history', { size: 15 })), h('span', { className: 'grow' }, summary), icon('arrow-left', { size: 14, style: { transform: open ? 'rotate(-90deg)' : 'rotate(180deg)', transition: 'transform 150ms' } })),
      open ? h(Phases, { task, live }) : null)
  }

  /** The run as phases. Consecutive tool calls with the same verb fold into one line (查阅 · 3 次 · 12s) that opens
   *  to its calls; a note the agent wrote is its own line; a hand-off opens what it created; verification closes the list. */
  function phasesOf(task) {
    const list = Array.isArray(task.activity) ? task.activity : []
    const out = []
    for (const e of list) {
      if (e.kind === 'user') continue // follow-ups are in the conversation above
      if (e.kind === 'tool') {
        const d = describeTool(e.name, e.detail)
        const last = out[out.length - 1]
        if (last && last.kind === 'phase' && last.verb === d.verb) { last.items.push(e); if (d.obj) last.obj = d.obj; if (e.ok === false) last.failed++; continue }
        out.push({ kind: 'phase', verb: d.verb, obj: d.obj, items: [e], at: e.at, failed: e.ok === false ? 1 : 0 })
        continue
      }
      if (e.kind === 'text' || e.kind === 'handoff' || e.kind === 'verify') out.push(e)
    }
    const end = task.finishedAt || new Date().toISOString()
    for (let i = 0; i < out.length; i++) if (out[i].kind === 'phase') out[i].ms = new Date((out[i + 1] && out[i + 1].at) || end) - new Date(out[i].at)
    return out
  }

  function Phases({ task, live }) {
    const rows = React.useMemo(() => phasesOf(task), [task])
    const [open, setOpen] = React.useState(-1)
    const lastIdx = rows.length - 1
    React.useEffect(() => { if (live && rows[lastIdx] && rows[lastIdx].kind === 'phase') setOpen(lastIdx) }, [live, rows.length])
    const v = task.verification
    if (!rows.length && !v) return h('div', { className: 'mwt-empty' }, live ? task.statusLabel + '…' : t('none2'))
    return h('div', { className: 'mwt-phases' },
      rows.map((r, i) => {
        if (r.kind === 'phase') {
          const running = live && i === lastIdx && task.status === 'running'
          const n = r.items.length
          const meta = [n > 1 ? n + ' ' + t('times') : '', r.ms > 1500 ? fmtDuration(r.ms) : ''].filter(Boolean).join(' · ')
          return h('div', { key: i, className: 'mwt-phase' },
            h('button', { type: 'button', className: 'mwt-phase-head', 'aria-expanded': open === i, 'data-tone': running ? 'live' : r.failed ? 'danger' : undefined, onClick: () => setOpen(open === i ? -1 : i) },
              h('span', { className: 'ic' }, icon(running ? 'loader' : r.failed ? 'circle-x' : 'check', { size: 13 })),
              h('span', { className: 'verb' }, r.verb),
              meta ? h('span', { className: 'meta' }, meta) : null,
              open !== i && r.obj ? h('span', { className: 'obj' }, r.obj) : null),
            open === i ? h('div', { className: 'mwt-phase-body' }, r.items.map((e, j) => { const d = describeTool(e.name, e.detail); return h('div', { key: j, className: 'mwt-ev', 'data-ok': e.ok === undefined ? undefined : e.ok, title: e.name + (e.detail ? ' ' + e.detail : '') }, h('span', { className: 'ic' }, icon(e.ok === false ? 'circle-x' : e.ok === true ? 'check' : 'loader', { size: 13 })), h('div', { className: 'line' }, h('span', { className: 'verb' }, d.verb), d.obj ? h('span', { className: 'obj' }, d.obj) : null, e.ok === false && e.result ? h('div', { className: 'result' }, t('toolFailed') + ' · ' + e.result) : null)) })) : null)
        }
        if (r.kind === 'handoff') return h('div', { key: i, className: 'mwt-phase-note' }, h('span', { className: 'ic' }, icon(r.target === 'task' ? 'list-checks' : 'history', { size: 13 })), h('div', null, h('button', { type: 'button', className: 'mwt-handoff', style: { margin: 0 }, onClick: () => { if (r.target === 'task') openTask(r.id); else openRoutine(r.id) } }, (r.target === 'task' ? t('handedOff') : t('scheduled')) + '：' + r.title)))
        return h(PhaseNote, { key: i, text: r.text, label: r.kind === 'verify' ? t('verifyLabel') : '' })
      }),
      task.status === 'verifying' ? h('div', { className: 'mwt-phase-head', 'data-tone': 'live' }, h('span', { className: 'ic' }, icon('loader', { size: 13 })), h('span', { className: 'verb' }, t('verifyLabel')), h('span', { className: 'meta' }, t('verifying')))
        : v ? h('div', { className: 'mwt-phase-head', 'data-tone': v.passed === false ? 'danger' : undefined }, h('span', { className: 'ic' }, icon(v.passed === false ? 'circle-x' : v.passed === true ? 'check' : 'minus', { size: 13 })), h('span', { className: 'verb' }, t('verifyLabel')), h('span', { className: 'meta' }, [v.passed === true ? t('passed') : v.passed === false ? t('verifyIssues') : t('verifyNone'), v.checked ? t('checked') + ' ' + v.checked : '', v.issues ? t('issues') + ' ' + v.issues : ''].filter(Boolean).join(' · '))) : null)
  }

  /** The title as a field: Enter saves, Escape or blur leaves it. */
  function TitleEdit({ value, onDone }) {
    const [v, setV] = React.useState(value)
    const ref = React.useRef(null)
    React.useEffect(() => { if (ref.current) { ref.current.focus(); ref.current.select() } }, [])
    return h('input', { ref, className: 'mwt-task-title edit', value: v, 'aria-label': t('rename'), onChange: (e) => setV(e.target.value), onBlur: () => onDone(v), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); onDone(v) } if (e.key === 'Escape') { e.preventDefault(); onDone(value) } } })
  }

  /** What the agent said mid-run: two lines, the whole note on tap. */
  function PhaseNote({ text, label }) {
    const [open, setOpen] = React.useState(false)
    return h('div', { className: 'mwt-phase-note' + (open ? ' open' : ''), role: 'button', tabIndex: 0, onClick: () => setOpen(!open), onKeyDown: (e) => { if (e.key === 'Enter') setOpen(!open) } },
      h('span', { className: 'ic' }, icon('message', { size: 13 })),
      h('div', { className: 'body' }, label ? h('span', { className: 'lbl' }, label + ' · ') : null, text))
  }

  function Menu({ items }) {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef(null)
    React.useEffect(() => { if (!open) return; const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }; const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }; document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey); return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) } }, [open])
    return h('div', { className: 'mwt-menu', ref },
      h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('more'), 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: () => setOpen(!open) }, '···'),
      open ? h('div', { className: 'mwt-menu-pop', role: 'menu' }, items.filter(Boolean).map((it) => h('button', { key: it.label, type: 'button', role: 'menuitem', onClick: () => { setOpen(false); it.run() } }, icon(it.icon, { size: 14 }), it.label))) : null)
  }

  function TaskDetail({ id, onBack }) {
    const s = usePolling()
    const task = s.items.find((x) => x.id === id) || null
    const live = !!task && task.status !== 'done'
    useTick(live)
    const key = task ? task.status + ':' + task.deliverableIds.length + ':' + (live ? Math.floor(Date.now() / FAST_MS) : 0) : ''
    const [detail, setDetail] = useTaskDetail(id, key)
    React.useEffect(() => { const el = document.querySelector('.mwt'); if (el) el.scrollTop = 0 }, [id]) // a task opens at its title, not where the last page was scrolled
    const [renaming, setRenaming] = React.useState(false)
    const [confirm, setConfirm] = React.useState(false)
    const [busy, setBusy] = React.useState(false)
    if (!task) return h('div', { className: 'mwt-empty' }, t('none'))
    const full = detail && detail.task ? detail.task : task
    const docs = detail && detail.deliverables ? detail.deliverables : []
    const scenarioLabel = (s.scenarios.find((x) => x.id === task.scenario) || {}).label || task.scenario
    const v = task.verification
    const verdict = task.status === 'verifying' ? t('verifying') : v ? (v.passed === true ? t('verified') : v.passed === false ? t('verifyIssues') : t('verifyNone')) + (v.checked ? ` · ${t('checked')} ${v.checked}${v.issues ? ` · ${t('issues')} ${v.issues}` : ''}` : '') : ''
    const meta = [task.status !== 'done' ? task.statusLabel : verdict, task.scenario !== 'general' ? scenarioLabel : '', fmtDate(task.finishedAt || task.createdAt)].filter(Boolean).join(' · ')
    const menu = [
      live ? { icon: 'x', label: t('cancel'), run: () => api('/cancel', { id }).then(() => refresh()) } : { icon: 'rotate-cw', label: t('rerun'), run: () => api('/rerun', { id }).then((d) => { refresh().then(schedulePoll); if (d.task) openTask(d.task.id) }) },
      !live && task.deliverableIds.length ? { icon: 'circle-check', label: t('verifyAgain'), run: () => api('/verify', { id }).then(() => refresh().then(schedulePoll)) } : null,
      task.sessionId ? { icon: 'history', label: t('rawProcess'), run: () => fire('mywork:open-session', { sessionId: task.sessionId }) } : null,
      { icon: 'pencil', label: t('rename'), run: () => setRenaming(true) },
      { icon: 'trash', label: t('remove'), run: () => setConfirm(true) },
    ]
    const saveTitle = (title) => { const v = String(title || '').trim(); setRenaming(false); if (!v || v === task.title) return; api('/rename', { id, title: v }).then(() => refresh()).catch(() => {}) }
    const remove = () => { if (busy) return; setBusy(true); api('/remove', { id }).then(() => refresh()).then(() => onBack()).catch(() => setBusy(false)) }
    // Conversational tasks: the assistant's replies are the body.
    const talk = (Array.isArray(full.activity) ? full.activity : []).filter((e) => e.kind === 'text' || e.kind === 'user')
    return h('div', null,
      h('div', { className: 'mwt-toolbar' }, h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('back'), onClick: onBack }, icon('arrow-left', { size: 15 })), h('span', { className: 'grow' }), h(Menu, { items: menu })),
      renaming ? h(TitleEdit, { value: task.title, onDone: saveTitle }) : h('h1', { className: 'mwt-task-title' }, task.title),
      h('p', { className: 'mwt-task-meta' }, meta),
      confirm ? h('div', { className: 'mwt-confirm', role: 'alertdialog' }, h('span', null, t('removeAsk')), h('button', { type: 'button', className: 'mwt-btn danger', disabled: busy, onClick: remove }, t('remove')), h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => setConfirm(false) }, t('cancel'))) : null,
      task.error ? h('div', { className: 'mwt-error' }, task.error) : null,
      docs.length ? docs.map((d) => h(Doc, { key: d.id, d: { ...d, scenarioLabel }, status: task.status, onRate: rateIn(setDetail) }))
        : talk.length ? h(Turns, { entries: talk, live: live ? task : null })
        : live ? h('div', { className: 'mwt-empty' }, t('waitingDeliverable')) : null,
      h(Process, { task: full, live }),
      h(Say, { task }))
  }

  function TasksPage() {
    const s = usePolling()
    const [filter, setFilter] = React.useState('all')
    const [q, setQ] = React.useState('')
    const [open, setOpen] = React.useState(() => { const id = nav.pendingTask; nav.pendingTask = ''; return id })
    React.useEffect(() => {
      const onOpen = (e) => { const id = e.detail && e.detail.id; if (id) setOpen(String(id)) }
      const onHome = (e) => { if (e.detail && e.detail.id === 'mywork-tasks') setOpen('') } // 任务 in the sidebar, tapped again: back to the list
      window.addEventListener('mywork:open-task', onOpen)
      window.addEventListener('mywork:panel-home', onHome)
      if (nav.pendingTask) { setOpen(nav.pendingTask); nav.pendingTask = '' }
      return () => { window.removeEventListener('mywork:open-task', onOpen); window.removeEventListener('mywork:panel-home', onHome) }
    }, [])
    useTick(s.items.some((x) => x.status !== 'done'))
    const needle = q.trim().toLowerCase()
    const hit = (x) => !needle || String(x.title || '').toLowerCase().includes(needle) || String(x.input || '').toLowerCase().includes(needle) || (x.deliverables || []).some((d) => String(d.title || '').toLowerCase().includes(needle))
    const items = s.items.filter((x) => (filter === 'all' ? true : filter === 'active' ? x.status !== 'done' : filter === 'delivered' ? x.deliverables.length > 0 : x.status === 'done') && hit(x))
    const state = (x) => x.status !== 'done' ? (x.currentStep || x.statusLabel) : x.error ? t('failedTitle') : x.verification && x.verification.passed === false ? t('verifyIssues') : x.deliverables.length ? (x.verification && x.verification.passed ? t('verified') : t('delivered')) : t('answered')
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' + (open ? ' wide' : '') },
      open ? h(TaskDetail, { id: open, onBack: () => setOpen('') }) : h(React.Fragment, null,
        h('div', { className: 'mwt-title' }, h('h1', null, t('tasks'))),
        h('div', { className: 'mwt-filters' },
          h('div', { className: 'mwt-chips', style: { margin: 0 } }, [['all', t('all')], ['active', t('active')], ['delivered', t('deliverables')]].map(([k, label]) => h('button', { key: k, type: 'button', className: 'mwt-chip', 'data-on': filter === k, onClick: () => setFilter(k) }, label))),
          h('label', { className: 'mwt-search' }, icon('search', { size: 14 }), h('input', { type: 'search', value: q, placeholder: t('search'), 'aria-label': t('search'), onChange: (e) => setQ(e.target.value) }))),
        !s.loadedAt && !s.error ? h(Skeleton, { rows: 4 })
          : items.length ? h('div', { className: 'mwt-list' }, items.map((x) => h(Row, { key: x.id, row: { glyph: x.status !== 'done' ? 'loader' : x.error ? 'circle-x' : 'circle-check', spin: x.status !== 'done', tone: x.status !== 'done' ? 'live' : x.error ? 'danger' : 'success', title: x.title, state: state(x) + ' · ' + fmtTime(x.finishedAt || x.createdAt), open: () => setOpen(x.id) } })))
          : h('div', { className: 'mwt-empty' }, s.error || (needle ? t('noMatch') : t('none'))))))
  }

  function DeliverablesPage() {
    const s = usePolling()
    const [items, setItems] = React.useState([])
    const [scenario, setScenario] = React.useState('all')
    const [open, setOpen] = React.useState(() => { const id = nav.pendingDeliverable; nav.pendingDeliverable = ''; return id })
    const [detail, setDetail] = React.useState(null)
    React.useEffect(() => { api('/deliverables').then((d) => setItems(d.items || [])).catch(() => {}) }, [s.loadedAt])
    React.useEffect(() => {
      const onOpen = (e) => { const id = e.detail && e.detail.id; if (id) setOpen(String(id)) }
      window.addEventListener('mywork:open-deliverable', onOpen)
      return () => window.removeEventListener('mywork:open-deliverable', onOpen)
    }, [])
    React.useEffect(() => { if (!open) { setDetail(null); return } let on = true; api('/deliverable?id=' + encodeURIComponent(open)).then((d) => { if (on) setDetail(d) }).catch(() => {}); return () => { on = false } }, [open])
    const labelOf = (id) => (s.scenarios.find((x) => x.id === id) || {}).label || id
    const rate = (d, r) => api('/rate', { id: d.id, rating: d.rating === r ? null : r }).then((x) => { setDetail((prev) => prev ? { ...prev, deliverable: x.deliverable } : prev); setItems((prev) => prev.map((y) => y.id === x.deliverable.id ? { ...y, rating: x.deliverable.rating } : y)) }).catch(() => {})
    const scenariosSeen = [...new Set(items.map((d) => d.scenario))]
    const list = items.filter((d) => scenario === 'all' || d.scenario === scenario)
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      open ? h(React.Fragment, null,
        h('div', { className: 'mwt-toolbar' }, h('button', { type: 'button', className: 'mwt-btn', onClick: () => setOpen('') }, icon('arrow-left', { size: 14 }), t('back'))),
        detail && detail.deliverable ? h(Doc, { d: { ...detail.deliverable, scenarioLabel: labelOf(detail.deliverable.scenario) }, status: detail.task ? detail.task.status : 'done', onRate: rate, onOpenTask: detail.task ? () => openTask(detail.task.id) : null }) : h('div', { className: 'mwt-empty' }, '…'))
      : h(React.Fragment, null,
        h('div', { className: 'mwt-title' }, h('h1', null, t('deliverables')), h('span', null, String(items.length))),
        scenariosSeen.length > 1 ? h('div', { className: 'mwt-chips', style: { margin: '0 0 16px' } }, [['all', t('all')], ...scenariosSeen.map((id) => [id, labelOf(id)])].map(([k, label]) => h('button', { key: k, type: 'button', className: 'mwt-chip', 'data-on': scenario === k, onClick: () => setScenario(k) }, label))) : null,
        list.length ? h('div', { className: 'mwt-cards' }, list.map((d) => h('button', { key: d.id, type: 'button', className: 'mwt-card', onClick: () => setOpen(d.id) },
          h('span', { className: 'mwt-dot', 'data-s': d.verification && d.verification.passed === true ? 'ok' : undefined }, icon('file-text', { size: 16 })),
          h('span', null, h('span', { className: 'mwt-card-title' }, d.title), h('span', { className: 'mwt-card-sub' }, [labelOf(d.scenario), d.verification ? (d.verification.passed === true ? t('verified') : d.verification.passed === false ? t('verifyIssues') : t('verifyNone')) : '', d.rating === 1 ? t('ratingGood') : d.rating === -1 ? t('ratingBad') : ''].filter(Boolean).join(' · '))),
          h('span', { className: 'mwt-card-meta' }, fmtDate(d.createdAt))))) : h('div', { className: 'mwt-empty' }, t('noneDeliverables')))))
  }

  function ScenariosPage() {
    const s = usePolling()
    const packs = s.scenarios.filter((x) => !x.builtin)
    const general = s.scenarios.find((x) => x.builtin)
    const card = (sc) => h('div', { key: sc.id, className: 'mwt-scen-card' },
      h('h3', null, sc.label, sc.builtin ? h('span', { className: 'mwt-badge', style: { marginLeft: 8 } }, t('builtin')) : null), h('p', null, sc.intro),
      sc.examples.length ? h('div', { className: 'ex' }, sc.examples.map((ex) => h('button', { key: ex, type: 'button', onClick: () => newTask(ex, sc.builtin ? '' : sc.id) }, '→ ' + ex))) : null)
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      h('div', { className: 'mwt-title' }, h('h1', null, t('packs')), h('span', null, String(packs.length))),
      h('p', { className: 'mwt-lead' }, t('packsLead')),
      h('div', { className: 'mwt-scen' }, general ? card(general) : null, packs.map(card)),
      packs.length ? null : h('div', { className: 'mwt-empty', style: { marginTop: 16 } }, t('packsEmpty'))))
  }

  /** 例行: plain rows like everywhere else; a routine opens its own page where it is managed. */
  function RoutinesPage() {
    const s = usePolling()
    const [items, setItems] = React.useState([])
    const [open, setOpen] = React.useState(() => { const id = nav.pendingRoutine; nav.pendingRoutine = ''; return id })
    const [showSpent, setShowSpent] = React.useState(false)
    React.useEffect(() => { const onOpen = (e) => { const id = e.detail && e.detail.id; if (id) setOpen(String(id)) }; const onHome = (e) => { if (e.detail && e.detail.id === 'mywork-routines') setOpen('') }; window.addEventListener('mywork:open-routine', onOpen); window.addEventListener('mywork:panel-home', onHome); return () => { window.removeEventListener('mywork:open-routine', onOpen); window.removeEventListener('mywork:panel-home', onHome) } }, [])
    const load = React.useCallback(() => api('/routines').then((d) => setItems(d.items || [])).catch(() => {}), [])
    React.useEffect(() => { load() }, [s.loadedAt, load])
    const spent = items.filter((r) => !r.enabled && r.schedule && r.schedule.type === 'once')
    const live = items.filter((r) => !spent.includes(r)).sort((x, y) => (x.enabled === y.enabled ? 0 : x.enabled ? -1 : 1) || (new Date(x.nextRunAt || 0) - new Date(y.nextRunAt || 0)))
    const when = (r) => !r.enabled ? (spent.includes(r) ? t('ended') : t('paused')) : r.nextRunAt ? t('nextRun') + ' ' + (isToday(r.nextRunAt) ? t('todayAt') + ' ' + fmtTime(r.nextRunAt) : fmtDate(r.nextRunAt)) : ''
    const row = (r) => h('div', { key: r.id, className: 'mwt-row', 'data-off': !r.enabled, role: 'button', tabIndex: 0, onClick: () => setOpen(r.id), onKeyDown: (e) => { if (e.key === 'Enter') setOpen(r.id) } },
      h('span', { className: 'mwt-dot' }, icon(r.kind === 'remind' ? 'bell' : 'history', { size: 16 })),
      h('span', { className: 'mwt-row-main' }, h('span', { className: 'mwt-row-title' }, r.title), h('span', { className: 'mwt-row-sub' }, r.scheduleLabel)),
      h('span', { className: 'mwt-row-state' }, when(r)))
    const current = open ? items.find((r) => r.id === open) : null
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      current ? h(RoutineDetail, { r: current, onBack: () => setOpen(''), reload: () => { load(); refresh() } })
        : h(React.Fragment, null,
          h('div', { className: 'mwt-title' }, h('h1', null, t('routines'))),
          !s.loadedAt && !s.error ? h(Skeleton, { rows: 3 })
            : live.length ? h('div', { className: 'mwt-list' }, live.map(row)) : h('div', { className: 'mwt-empty' }, t('routinesLead')),
          spent.length ? h('div', { className: 'mwt-spent' },
            h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => setShowSpent(!showSpent) }, icon('history', { size: 13 }), t('endedN').replace('{n}', String(spent.length))),
            showSpent ? h('div', { className: 'mwt-list', style: { marginTop: 8 } }, spent.map(row)) : null) : null)))
  }

  /** One routine: what it is, when it runs, its runs, and the three things you can do to it. */
  function RoutineDetail({ r, onBack, reload }) {
    const act = (path, body, after) => api(path, body).then(() => { reload(); if (after) after() }).catch((e) => console.warn(`[${PLUGIN}]`, e))
    const once = r.schedule && r.schedule.type === 'once'
    // A one-off's schedule already is its next run; do not say it twice.
    const meta = [r.kind === 'remind' ? t('kindRemind') : t('kindTask'), r.scheduleLabel, !r.enabled ? (once ? t('ended') : t('paused')) : r.nextRunAt && !once ? t('nextRun') + ' ' + fmtDate(r.nextRunAt) : ''].filter(Boolean).join(' · ')
    const runs = Array.isArray(r.runs) ? r.runs : []
    const runState = (x) => x.fired ? t('remindCard') : x.error ? t('failedTitle') : x.changed === false ? t('noChange') : x.changed === true ? t('changed') : t('delivered')
    return h('div', null,
      h('div', { className: 'mwt-toolbar' }, h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('back'), onClick: onBack }, icon('arrow-left', { size: 15 }))),
      h('h1', { className: 'mwt-task-title' }, r.title),
      h('p', { className: 'mwt-task-meta' }, meta),
      h('div', { className: 'mwt-actions', style: { margin: '0 0 24px' } },
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => act('/routines/run', { id: r.id }) }, icon('play', { size: 13 }), t('runNow')),
        !once || r.enabled ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => act('/routines/enable', { id: r.id, enabled: !r.enabled }) }, icon(r.enabled ? 'pause' : 'play', { size: 13 }), r.enabled ? t('pause') : t('resume')) : null,
        h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => act('/routines/remove', { id: r.id }, onBack) }, icon('trash', { size: 13 }), t('remove'))),
      h('section', { className: 'mwt-section' }, h('h2', null, t('runs')),
        runs.length ? h('div', { className: 'mwt-list' }, runs.slice(0, 20).map((x, i) => h('div', { key: i, className: 'mwt-row' + (x.taskId ? '' : ' mwt-row-static'), role: x.taskId ? 'button' : undefined, tabIndex: x.taskId ? 0 : undefined, onClick: () => { if (x.taskId) openTask(x.taskId) } },
          h('span', { className: 'mwt-dot', 'data-s': x.error ? 'err' : x.fired || x.changed !== undefined ? 'ok' : undefined }, icon(x.error ? 'circle-x' : x.fired ? 'bell' : 'circle-check', { size: 16 })),
          h('span', { className: 'mwt-row-main' }, h('span', { className: 'mwt-row-title' }, runState(x))),
          h('span', { className: 'mwt-row-state' }, fmtDate(x.at))))) : h('div', { className: 'mwt-empty' }, t('neverRan'))))
  }

  /** Always mounted: completion toasts and browser notifications, and the poll that feeds the sidebar. */
  function Overlay() {
    usePolling()
    const [toasts, setToasts] = React.useState([])
    React.useEffect(() => {
      const onDone = (task) => {
        if (task.quiet && !task.error) return
        setToasts((prev) => [...prev.slice(-3), { id: task.id + ':' + Date.now(), task }])
        try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification((task.error ? t('failedToast') : t('doneToast')) + ' · ' + task.title, { body: task.error || task.summary || '' }) } catch {}
      }
      completionListeners.add(onDone)
      const onNotice = (title, body) => setToasts((prev) => [...prev.slice(-3), { id: 'n' + Date.now(), notice: { title, body } }])
      noticeListeners.add(onNotice)
      return () => { completionListeners.delete(onDone); noticeListeners.delete(onNotice) }
    }, [])
    // Reminders: a new pending reminder pops a toast and a browser notification once.
    const seen = React.useRef(new Set())
    const st = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    React.useEffect(() => {
      for (const r of st.reminders || []) {
        const key = r.routineId + r.at
        if (seen.current.has(key)) continue
        seen.current.add(key)
        if (Date.now() - new Date(r.at) > 3600000) continue
        setToasts((prev) => [...prev.slice(-3), { id: 'r' + key, notice: { title: t('remindCard') + ' · ' + r.title, body: r.input && r.input !== r.title ? r.input : '' } }])
        try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(t('remindCard') + ' · ' + r.title, { body: r.input || '' }) } catch {}
      }
    }, [st.reminders])
    React.useEffect(() => { if (!toasts.length) return; const id = setTimeout(() => setToasts((prev) => prev.slice(1)), 8000); return () => clearTimeout(id) }, [toasts])
    if (!toasts.length) return null
    return h('div', { className: 'mwt mwt-toasts' }, h('style', null, STYLE), toasts.map(({ id, task, notice }) => notice
      ? h('div', { key: id, className: 'mwt-toast' }, h('span', { className: 'mwt-dot' }, icon('bell', { size: 16 })), h('div', null, h('b', null, notice.title), notice.body ? h('span', null, notice.body) : null), h('button', { type: 'button', className: 'mwt-btn', onClick: () => setToasts((prev) => prev.filter((x) => x.id !== id)) }, t('gotIt')))
      : h('div', { key: id, className: 'mwt-toast' },
        h(StatusDot, { task }), h('div', null, h('b', null, task.title), h('span', null, task.error || task.summary || '')),
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => { setToasts((prev) => prev.filter((x) => x.id !== id)); openTask(task.id) } }, t('open')))))
  }

  return { TodayPage, CreatePage, TasksPage, DeliverablesPage, RoutinesPage, ScenariosPage, Overlay, openTask, openDeliverable, newTask }
}

// ---- plugin -----------------------------------------------------------------
function v2Active() { try { return localStorage.getItem(V2_KEY) !== 'off' } catch { return true } }

exports.name = PLUGIN
exports.inject = ['slots', 'locale', 'layout']
exports.apply = function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), PLUGIN + ': dictionaries')
  ctx.effect(() => { if (document.querySelector('link[data-mywork-fonts]')) return () => {}; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/mywork-shell/fonts.css'; link.setAttribute('data-mywork-fonts', ''); document.head.appendChild(link); return () => { link.remove() } }, PLUGIN + ': fonts')
  // CJK display serif for headings (the Manus pairing). Google serves Noto Serif SC in unicode-range slices, so only the slices a heading
  // uses are fetched; offline it falls back to the system serif (Songti SC / SimSun) named in --font-display. Trying it; if it stays, self-host a subset.
  ctx.effect(() => { if (document.querySelector('link[data-mywork-display-cjk]')) return () => {}; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500&display=swap'; link.setAttribute('data-mywork-display-cjk', ''); document.head.appendChild(link); return () => { link.remove() } }, PLUGIN + ': display serif')
  const t = ctx.locale.bind(NS)
  const c = makeComponents(ctx, t)
  const page = (key, order, label, iconName, Component) => {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key, locale: NS, inject: () => ({}) }, function MyworkPage() { return h(Component) }))
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: key, order, locale: NS, label: () => t(label), inject: () => ({}) }, function MyworkPageIcon() { return icon(iconName, { size: 16, strokeWidth: 1.6 }) }))
  }
  page(PANELS.today, 1, 'today', 'sun', c.TodayPage)
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANELS.create, locale: NS, inject: () => ({}) }, function MyworkCreate() { return h(c.CreatePage) }))
  page(PANELS.tasks, 2, 'tasks', 'list-checks', c.TasksPage)
  page(PANELS.routines, 3, 'routines', 'history', c.RoutinesPage)
  // Reachable, not navigated: deliverables open through their task; 领域 through 设置.
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANELS.deliverables, locale: NS, inject: () => ({}) }, function MyworkDeliverables() { return h(c.DeliverablesPage) }))
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANELS.scenarios, locale: NS, inject: () => ({}) }, function MyworkScenarios() { return h(c.ScenariosPage) }))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: PLUGIN, order: 45 }, function MyworkOverlay() { return h(c.Overlay) }))

  // Window events from the sidebar (dsh-mywork-codex-ui) and other members.
  ctx.effect(() => {
    const onNew = (e) => { const d = e.detail || {}; c.newTask(d.text, d.scenario) }
    const onTask = (e) => { if (e.detail && e.detail.id) c.openTask(String(e.detail.id)) }
    const onDeliverable = (e) => { if (e.detail && e.detail.id) c.openDeliverable(String(e.detail.id)) }
    window.addEventListener('mywork:new-task', onNew)
    window.addEventListener('mywork:open-task', onTask)
    window.addEventListener('mywork:open-deliverable', onDeliverable)
    return () => { window.removeEventListener('mywork:new-task', onNew); window.removeEventListener('mywork:open-task', onTask); window.removeEventListener('mywork:open-deliverable', onDeliverable) }
  }, PLUGIN + ': window events')

  // v2: the app opens on 今日, not on a conversation (unless a session deep link is present).
  // dsh's own landing re-selects the conversation once or twice during startup, so the
  // selection is re-asserted for a few seconds, and stops as soon as the user touches anything.
  ctx.effect(() => {
    if (!v2Active()) return () => {}
    let touched = false
    const onPointer = () => { touched = true }
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('keydown', onPointer, true)
    const started = Date.now()
    const timer = setInterval(() => {
      try {
        if (touched || Date.now() - started > 6000 || new URL(window.location.href).searchParams.get('session')) { clearInterval(timer); return }
        if (!document.querySelector('.mwt-today')) ctx.layout.selectPanel(PANELS.today)
      } catch { /* panel not registered yet: try again */ }
    }, 250)
    return () => { clearInterval(timer); window.removeEventListener('pointerdown', onPointer, true); window.removeEventListener('keydown', onPointer, true) }
  }, PLUGIN + ': open 今日')
}
