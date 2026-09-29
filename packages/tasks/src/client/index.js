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
const PANELS = { today: 'mywork-today', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', routines: 'mywork-routines', scenarios: 'mywork-scenarios' }
const FAST_MS = 3000
const SLOW_MS = 20000
const V2_KEY = 'dsh-mywork:v2'

const zh = {
  today: '今日', tasks: '任务', deliverables: '交付物', scenarios: '领域', packs: '领域', builtin: '内置', scenarioClear: '不指定，让系统判断',
  packsLead: '领域包决定一类事怎么做：用什么数据、交付什么、怎么核验。你不用选，说出来就行；装了领域包，它认得的事自动归它。',
  packsEmpty: '还没有装领域包。交易工作台是第一个。',
  hero: '你要什么结果？', ask: '说一个你要的结果，或者问一句', hint: '回车创建，Shift + 回车换行。任务在后台完成，做完通知你。',
  running: '进行中', recent: '最近', none: '还没有任务。', noneRunning: '现在没有在跑的任务。', noneDeliverables: '还没有交付物。',
  all: '全部', active: '进行中', finished: '已完成', back: '返回', rerun: '再来一次', cancel: '取消', process: '过程', verifyAgain: '重新核验',
  progress: '进度', deliverable: '交付物', waitingDeliverable: '做完后交付物出现在这里。', failedTitle: '失败',
  queued: '排队', input: '你说的', elapsed: '用时', scenario: '场景', create: '创建', creating: '创建中…', openTask: '打开任务',
  ratingGood: '有用', ratingBad: '没用', exportMd: '导出 Markdown', exportPdf: '导出 PDF', none2: '无',
  verified: '已核验', verifyIssues: '核验发现问题', verifyNone: '未能核验', verifying: '核验中', checked: '核对', issues: '问题',
  doneToast: '任务完成', failedToast: '任务失败', open: '打开', tryScenario: '用这个场景', kinds: '交付', examples: '示例',
  toolFailed: '失败', stepsTitle: '步骤',
  attention: '等你看', attentionEmpty: '没有等你处理的事。', failedCard: '失败，可以再来一次', issuesCard: '核验发现问题', rateCard: '交付了，看一眼给个评价', running1: '个在跑', waiting1: '份等你看', quiet: '今天还很安静', greetMorning: '早上好', greetDay: '下午好', greetNight: '晚上好', todayDone: '今天完成', examplesTitle: '可以试试',
  notesMore: '点开看核验员的完整说明',
  routines: '例行', routinesLead: '到点自动做的事和提醒。写一句带时间的话就行：「每天 9 点…」「每周一 8:30…」「工作日 18 点提醒我…」「30 分钟后提醒我…」。例行任务每次运行都会对照上一次，先说变化；没变化就不打扰你。',
  routinesEmpty: '还没有例行的事。', remindCard: '提醒', gotIt: '知道了', runNow: '现在跑一次', pause: '暂停', resume: '恢复', remove: '删除', nextRun: '下次', lastRun: '上次', neverRan: '还没跑过', noChange: '没有变化', changed: '有变化', briefs: '今天的例行', scheduled: '已安排', scheduledHint: '到点会自动做，结果在「例行」和「等你看」里。', kindTask: '例行任务', kindRemind: '提醒', quietTag: '安静',
  say: '接着说，比如“再短一点”或“换个角度”', sayHint: '回车发送，同一个会话继续。', sayBusy: '核验中，稍等。', conversational: '这次是回答，没有生成文档；要保存时说“整理成一份…”。',
}
const en = {
  today: 'Today', tasks: 'Tasks', deliverables: 'Deliverables', scenarios: 'Domains', packs: 'Domains', builtin: 'built in', scenarioClear: 'Let the system decide',
  packsLead: 'A domain pack defines how one kind of work gets done: which data, what to deliver, how to verify. You never pick; a pack claims the requests it recognises.',
  packsEmpty: 'No domain packs installed yet. The trading workbench is the first.',
  hero: 'What do you want done?', ask: 'Describe the result you want', hint: 'Enter creates the task, Shift + Enter for a new line. It runs in the background and notifies you when done.',
  running: 'In progress', recent: 'Recent', none: 'No tasks yet.', noneRunning: 'Nothing is running.', noneDeliverables: 'No deliverables yet.',
  all: 'All', active: 'Active', finished: 'Finished', back: 'Back', rerun: 'Run again', cancel: 'Cancel', process: 'Process', verifyAgain: 'Verify again',
  progress: 'Progress', deliverable: 'Deliverable', waitingDeliverable: 'The deliverable appears here when the task finishes.', failedTitle: 'Failed',
  queued: 'Queued', input: 'Your request', elapsed: 'Elapsed', scenario: 'Scenario', create: 'Create', creating: 'Creating…', openTask: 'Open task',
  ratingGood: 'Useful', ratingBad: 'Not useful', exportMd: 'Export Markdown', exportPdf: 'Export PDF', none2: 'none',
  verified: 'Verified', verifyIssues: 'Issues found', verifyNone: 'Not verified', verifying: 'Verifying', checked: 'checked', issues: 'issues',
  doneToast: 'Task finished', failedToast: 'Task failed', open: 'Open', tryScenario: 'Use this scenario', kinds: 'Delivers', examples: 'Examples',
  toolFailed: 'failed', stepsTitle: 'Steps',
  attention: 'For you', attentionEmpty: 'Nothing waiting for you.', failedCard: 'Failed, can run again', issuesCard: 'Verification found issues', rateCard: 'Delivered, take a look and rate', running1: 'running', waiting1: 'waiting for you', quiet: 'A quiet day so far', greetMorning: 'Good morning', greetDay: 'Good afternoon', greetNight: 'Good evening', todayDone: 'Finished today', examplesTitle: 'Try',
  notesMore: 'Tap for the verifier’s full notes',
  routines: 'Routines', routinesLead: 'Things done for you on a schedule, and reminders. Just say a sentence with a time. A routine run compares with the last one and leads with what changed; no change, no interruption.',
  routinesEmpty: 'No routines yet.', remindCard: 'Reminder', gotIt: 'Got it', runNow: 'Run now', pause: 'Pause', resume: 'Resume', remove: 'Remove', nextRun: 'Next', lastRun: 'Last', neverRan: 'Never ran', noChange: 'No change', changed: 'Changed', briefs: 'Today’s routines', scheduled: 'Scheduled', scheduledHint: 'It runs on time; results land in Routines and For you.', kindTask: 'Routine', kindRemind: 'Reminder', quietTag: 'quiet',
  say: 'Keep going, e.g. “shorter” or “from another angle”', sayHint: 'Enter sends into the same session.', sayBusy: 'Verifying, one moment.', conversational: 'This was an answer, no document was produced; ask for one when you want it saved.',
}

const STYLE = `
/* Tokens: design/v2/DESIGN.md §2 (Open Design schema names). Light default, dark twin. */
.mwt{--bg:#ffffff;--surface:#f6f5f4;--surface-2:#efedeb;--fg:rgba(0,0,0,.92);--fg-2:#31302e;--muted:#615d59;--meta:#8f8a84;--border:rgba(0,0,0,.1);--border-soft:rgba(0,0,0,.06);--accent:#0075de;--accent-on:#ffffff;--accent-hover:#005bab;--accent-soft:#eef6fd;--success:#178a30;--warn:#b5480a;--danger:#c0392b;--font-body:Geist,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei UI",sans-serif;--font-mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,monospace;--radius-sm:6px;--radius-md:8px;--radius-lg:12px;--elev-raised:rgba(0,0,0,.04) 0 4px 18px,rgba(0,0,0,.027) 0 2px 7.85px,rgba(0,0,0,.02) 0 .8px 2.93px,rgba(0,0,0,.01) 0 .175px 1.04px;--focus-ring:0 0 0 3px rgba(0,117,222,.25);--motion-fast:150ms;--motion-base:200ms;--ease-standard:cubic-bezier(.2,0,0,1);height:100%;overflow:auto;background:var(--bg);color:var(--fg);font:14px/1.6 var(--font-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body[data-ds-dark-theme] .mwt{--bg:#191919;--surface:#202020;--surface-2:#2a2a2a;--fg:rgba(255,255,255,.9);--fg-2:#e6e4e0;--muted:#9b9893;--meta:#75716b;--border:rgba(255,255,255,.1);--border-soft:rgba(255,255,255,.06);--accent:#529cca;--accent-on:#111111;--accent-hover:#6cb0dd;--accent-soft:rgba(82,156,202,.16);--success:#4dab7a;--warn:#e08a3c;--danger:#e26e63;--elev-raised:rgba(0,0,0,.35) 0 4px 18px,rgba(0,0,0,.25) 0 2px 8px;--focus-ring:0 0 0 3px rgba(82,156,202,.35)}
.mwt *{box-sizing:border-box}
.mwt :focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-sm)}
.mwt button{font-family:inherit;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),border-color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard),opacity var(--motion-fast) var(--ease-standard)}
.mwt button:active{transform:scale(.98)}
@media (prefers-reduced-motion:reduce){.mwt *{transition:none!important;animation:none!important}}
/* Page */
.mwt-page{max-width:808px;margin:0 auto;padding:32px 24px 72px}
.mwt-page.wide{max-width:1168px}
.mwt-title{display:flex;align-items:baseline;gap:10px;margin:0 0 24px}
.mwt-title h1{margin:0;font-size:24px;line-height:1.4;font-weight:600}
.mwt-title span{color:var(--meta);font-size:12.5px;font-family:var(--font-mono)}
.mwt-lead{margin:-12px 0 24px;max-width:65ch;color:var(--muted);font-size:14px;line-height:1.7}
.mwt-greet{margin:0 0 32px}
.mwt-greet h1{margin:0 0 4px;font-size:24px;line-height:1.4;font-weight:600}
.mwt-greet p{margin:0;color:var(--muted);font-size:14px}
.mwt-hero{padding:24px 0 8px;text-align:center}
.mwt-hero h1{margin:0 0 20px;font-size:24px;line-height:1.4;font-weight:600}
.mwt-section{margin-top:32px}
.mwt-section.first{margin-top:0}
.mwt-section h2,.mwt-col h2{display:flex;align-items:center;gap:6px;margin:0 0 8px 2px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:.02em;color:var(--muted)}
.mwt-section h2 span,.mwt-col h2 span{color:var(--meta);font-family:var(--font-mono);font-weight:400}
.mwt-col h2 .grow{flex:1}
.mwt-section h2 svg,.mwt-col h2 svg{color:var(--meta)}
.mwt-empty{color:var(--muted);font-size:14px;padding:8px 2px}
/* Lists: one recipe. Container with a whisper border, rows divided by soft lines. */
.mwt-cards,.mwt-atts,.mwt-rts{display:grid;border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg)}
.mwt-card,.mwt-att,.mwt-rt{display:grid;align-items:center;column-gap:12px;min-height:44px;padding:12px 16px;border:0;border-top:1px solid var(--border-soft);background:transparent;color:inherit;font:inherit;text-align:left;width:100%;transition:background-color var(--motion-fast) var(--ease-standard)}
.mwt-cards>:first-child,.mwt-atts>:first-child,.mwt-rts>:first-child{border-top:0}
.mwt-card{grid-template-columns:20px minmax(0,1fr) auto;cursor:pointer}
.mwt-card:hover,.mwt-att:hover{background:var(--surface)}
.mwt-card:focus-visible,.mwt-att:focus-visible{box-shadow:inset var(--focus-ring);border-radius:0}
.mwt-card-title{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub{color:var(--muted);font-size:12.5px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
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
.mwt-btn{appearance:none;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:0;border-radius:var(--radius-sm);background:var(--surface);color:var(--fg);font:inherit;font-size:13px;font-weight:500;letter-spacing:.01em;cursor:pointer;white-space:nowrap}
.mwt-btn:hover{background:var(--surface-2)}
.mwt-btn[disabled]{opacity:.4;cursor:default;transform:none}
.mwt-btn.primary{background:var(--accent);color:var(--accent-on)}
.mwt-btn.primary:hover{background:var(--accent-hover)}
.mwt-btn.round{width:32px;height:32px;padding:0;border-radius:50%;justify-content:center}
.mwt-btn.ghost{background:transparent;color:var(--muted)}
.mwt-btn.ghost:hover{background:var(--surface);color:var(--fg)}
.mwt-chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}
.mwt-chips.center{justify-content:center}
.mwt-chip{appearance:none;border:1px solid transparent;border-radius:var(--radius-md);background:var(--surface);color:var(--muted);padding:5px 10px;font:inherit;font-size:13px;line-height:18px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-chip:hover{color:var(--fg);background:var(--surface-2)}
.mwt-chip[data-on=true]{color:var(--fg-2);background:var(--bg);border-color:var(--border)}
.mwt-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:9999px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:.02em;color:var(--muted);background:var(--surface)}
.mwt-badge[data-v=passed]{color:var(--success);background:color-mix(in srgb,var(--success) 10%,transparent)}
.mwt-badge[data-v=issues]{color:var(--warn);background:color-mix(in srgb,var(--warn) 10%,transparent)}
.mwt-badge[data-v=verifying] svg{animation:mwt-spin 1.6s linear infinite}
/* Composer: a raised card holding the field. */
.mwt-ask-wrap{padding:0}
.mwt-ask{text-align:left;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);padding:14px 12px 10px 16px;box-shadow:var(--elev-raised);transition:border-color var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}
.mwt-ask:focus-within{border-color:var(--accent);box-shadow:var(--elev-raised),var(--focus-ring)}
.mwt-ask textarea{display:block;width:100%;min-height:52px;max-height:240px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:15px;line-height:1.7;padding:0}
.mwt-ask textarea::placeholder{color:var(--meta)}
.mwt-ask-row{display:flex;align-items:center;gap:8px;margin-top:8px}
.mwt-ask-row .grow{flex:1;min-width:0}
.mwt-ask-row small{display:block;color:var(--meta);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-page-today{padding-bottom:140px}
.mwt-dock{position:sticky;bottom:0;margin:32px 0 0;padding:12px 0 16px;background:linear-gradient(to top,var(--bg) 70%,transparent)}
.mwt-ask-wrap.compact .mwt-ask{display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px 8px;padding:6px 6px 6px 14px}
.mwt-ask-wrap.compact textarea{flex:1 1 200px;min-width:0;min-height:32px;font-size:15px;line-height:24px;padding:4px 0}
.mwt-ask-wrap.compact .mwt-ask-row{display:contents}
.mwt-ask-wrap.compact .mwt-ask-row small{display:none}
.mwt-ask-wrap.compact.open .mwt-ask-row small{display:block;flex-basis:100%;order:3;padding:0 8px 4px 2px}
.mwt-ask-wrap.compact .mwt-ask-row .mwt-chip{order:1}
.mwt-ask-wrap.compact .mwt-ask-row .mwt-btn.round{order:2}
.mwt-ask-wrap.compact .mwt-chips{margin:6px 0 4px;flex-basis:100%}
/* Task page */
.mwt-toolbar{display:flex;align-items:center;gap:4px;margin:0 0 12px}
.mwt-toolbar .grow{flex:1}
.mwt-detail-head{display:flex;align-items:flex-start;gap:12px;margin:0 0 4px}
.mwt-detail-head h1{flex:1;margin:0;font-size:24px;line-height:1.4;font-weight:600}
.mwt-meta{display:flex;flex-wrap:wrap;gap:4px 16px;color:var(--meta);font-size:12.5px;margin:0 0 24px;padding-left:32px;font-variant-numeric:tabular-nums}
.mwt-actions{display:flex;gap:2px;flex-wrap:wrap}
.mwt-error{border:1px solid color-mix(in srgb,var(--danger) 30%,transparent);border-radius:var(--radius-lg);padding:10px 14px;color:var(--danger);font-size:13px;line-height:1.6;margin:0 0 20px;white-space:pre-wrap}
.mwt-cols{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:32px;align-items:start}
@media (max-width:980px){.mwt-cols{grid-template-columns:minmax(0,1fr)}}
.mwt-col.sticky{position:sticky;top:0}
.mwt-steps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.mwt-step{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:9999px;background:var(--surface);font-size:12px;line-height:16px;color:var(--muted);font-variant-numeric:tabular-nums}
.mwt-step[data-live=true]{color:var(--fg-2);border:1px solid var(--border);padding:1px 7px}
.mwt-stream{position:relative;padding:2px 0;max-height:72vh;overflow:auto}
.mwt-ev{position:relative;display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:12px;padding:4px 0;font-size:13px;line-height:20px}
.mwt-ev .ic{display:flex;align-items:center;justify-content:center;height:20px;color:var(--meta)}
.mwt-ev[data-ok=true] .ic{color:var(--success)}
.mwt-ev[data-ok=false] .ic{color:var(--danger)}
.mwt-ev .name{font-weight:500;font-family:var(--font-mono);font-size:12.5px;color:var(--fg-2)}
.mwt-ev .detail{color:var(--meta);font-family:var(--font-mono);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
.mwt-ev .result{color:var(--danger);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-ev.text{padding:8px 0 10px}
.mwt-ev.text .body{white-space:pre-wrap;word-break:break-word;color:var(--fg);font-size:14px;line-height:1.7}
.mwt-ev.text .ic{color:var(--muted)}
.mwt-ev.user{padding:6px 0 8px}
.mwt-ev.user .body{display:inline-block;max-width:100%;padding:6px 12px;border-radius:var(--radius-lg);background:var(--surface);color:var(--fg);white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.6}
.mwt-ev.user .ic{color:var(--meta)}
.mwt-say{margin:12px 0 0}
.mwt-say-inner{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);padding:6px 6px 6px 12px;transition:border-color var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}
.mwt-say-inner:focus-within{border-color:var(--accent);box-shadow:var(--focus-ring)}
.mwt-say textarea{display:block;width:100%;min-height:24px;max-height:160px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:14px;line-height:22px;padding:4px 0}
.mwt-say textarea::placeholder{color:var(--meta)}
.mwt-say-row{display:flex;align-items:center;gap:8px;margin-top:2px}
.mwt-say-row small{flex:1;color:var(--meta);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Deliverable: the one raised card. */
.mwt-doc{margin:0 0 12px}
.mwt-doc-inner{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg);overflow:hidden;box-shadow:var(--elev-raised)}
.mwt-doc-head{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border-soft);flex-wrap:wrap}
.mwt-doc-head h3{flex:1;margin:0;font-size:14px;font-weight:500;min-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-doc-head>svg{color:var(--muted)}
.mwt-doc-body{padding:18px 24px 8px}
.mwt-doc-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:var(--meta);font-size:12px;font-family:var(--font-mono);margin:0 0 14px;font-variant-numeric:tabular-nums}
.mwt-notes{font-size:13px;line-height:1.7;color:var(--muted);border-left:2px solid var(--border);padding:2px 12px;margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
.mwt-notes.open{display:block;-webkit-line-clamp:unset}
.mwt-doc-actions{display:flex;gap:2px;flex-wrap:wrap;align-items:center;padding:8px 10px 10px;border-top:1px solid var(--border-soft)}
.mwt-md{font-size:15px;line-height:1.7;color:var(--fg)}
.mwt-md>:first-child{margin-top:0}
.mwt-md h2,.mwt-md h3,.mwt-md h4{margin:22px 0 8px;font-weight:600;line-height:1.4}
.mwt-md h2{font-size:18px}.mwt-md h3{font-size:16px}.mwt-md h4{font-size:15px}
.mwt-md p{margin:0 0 12px;max-width:65ch}.mwt-md ul,.mwt-md ol{margin:0 0 12px;padding-left:22px}.mwt-md li{margin:2px 0}
.mwt-md code{font-family:var(--font-mono);font-size:12.5px;background:var(--surface);padding:1px 5px;border-radius:4px}
.mwt-md pre{background:var(--surface);border-radius:var(--radius-md);padding:12px 14px;overflow:auto;margin:0 0 12px}.mwt-md pre code{background:transparent;padding:0}
.mwt-md table{border-collapse:collapse;margin:0 0 14px;font-size:13px;font-variant-numeric:tabular-nums}
.mwt-md th,.mwt-md td{padding:6px 12px;text-align:left;border-bottom:1px solid var(--border-soft)}
.mwt-md th{font-weight:500;color:var(--muted);font-size:12px;letter-spacing:.02em;background:var(--surface)}
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
  .mwt-page-today{padding-bottom:120px}
  .mwt-greet h1,.mwt-title h1,.mwt-detail-head h1,.mwt-hero h1{font-size:20px}
  .mwt-card,.mwt-att,.mwt-rt{padding:11px 12px}
  .mwt-card{grid-template-columns:18px minmax(0,1fr) auto}
  .mwt-att .mwt-btn{height:30px;padding:0 10px}
  .mwt-rt{grid-template-columns:20px minmax(0,1fr)}.mwt-rt .mwt-actions{grid-column:2;margin-top:4px}
  .mwt-toolbar{flex-wrap:wrap}
  .mwt-meta{padding-left:0}
  .mwt-cols{gap:24px}
  .mwt-col.sticky{position:static}
  .mwt-stream{max-height:none}
  .mwt-doc-body{padding:14px 14px 4px}
  .mwt-doc-actions{padding:6px 6px 8px}
  .mwt-md{font-size:15px}
  .mwt-md table{display:block;overflow:auto;max-width:100%}
  .mwt-scen{grid-template-columns:minmax(0,1fr)}
  .mwt-toasts{left:12px;right:12px;bottom:12px;max-width:none}
  .mwt-dock{margin:24px 0 0;padding:8px 0 calc(8px + env(safe-area-inset-bottom))}
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
function fire(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })) } catch {} }
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
  const nav = { pendingTask: '', pendingDeliverable: '', pendingInput: null }
  const openTask = (id) => { nav.pendingTask = id; selectPanel(PANELS.tasks) }
  const openDeliverable = (id) => { nav.pendingDeliverable = id; selectPanel(PANELS.deliverables) }
  const newTask = (text, scenario) => { nav.pendingInput = { text: text || '', scenario: scenario || '' }; selectPanel(PANELS.today) }

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
    const sub = live ? (task.currentStep || task.statusLabel) : task.error ? (t('failedTitle') + ' · ' + task.error) : ((task.routineId ? (task.quiet ? t('noChange') + ' · ' : t('changed') + ' · ') : '') + (task.summary || (task.deliverables[0] && task.deliverables[0].title) || ''))
    return h('button', { type: 'button', className: 'mwt-card', onClick: () => onOpen(task.id) },
      h(StatusDot, { task }),
      h('span', null, h('div', { className: 'mwt-card-title' }, task.title), compact ? null : h('div', { className: 'mwt-card-sub' + (task.error ? ' err' : '') }, sub)),
      h('span', { className: 'mwt-card-meta' }, live ? elapsedOf(task) : fmtTime(task.finishedAt)))
  }

  function Ask({ scenarios, initial, hero, compact }) {
    const [focused, setFocused] = React.useState(false)
    const [text, setText] = React.useState(initial && initial.text ? initial.text : '')
    const [scenario, setScenario] = React.useState(initial && initial.scenario ? initial.scenario : '')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    const examples = (scenario ? (scenarios.find((s) => s.id === scenario) || { examples: [] }).examples : scenarios.flatMap((s) => s.examples.slice(0, s.builtin ? 4 : 2))).slice(0, 6)
    React.useEffect(() => { if (initial && initial.text && ref.current) ref.current.focus() }, [])
    React.useEffect(() => {
      const onNew = (e) => { const d = e.detail || {}; if (d.text !== undefined) setText(String(d.text)); if (d.scenario) setScenario(String(d.scenario)); if (ref.current) ref.current.focus() }
      window.addEventListener('mywork:new-task', onNew)
      return () => window.removeEventListener('mywork:new-task', onNew)
    }, [])
    const submit = async () => {
      const input = text.trim()
      if (!input || busy) return
      setBusy(true); setErr('')
      try { const d = await api('/create', scenario ? { input, scenario } : { input }); setText(''); setScenario(''); await refresh(); schedulePoll(); if (d.routine) { announce(t('scheduled') + '：' + d.routine.scheduleLabel + ' · ' + d.routine.title, t('scheduledHint')); selectPanel(PANELS.routines) } else if (d.task) openTask(d.task.id) } catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    const grow = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(240, el.scrollHeight) + 'px' }
    React.useEffect(grow, [text])
    return h('div', { className: compact ? 'mwt-ask-wrap compact' + (focused || text ? ' open' : '') : 'mwt-ask-wrap' },
      h('div', { className: 'mwt-ask' },
        h('textarea', { ref, value: text, placeholder: t('ask'), rows: compact ? 1 : 2, onFocus: () => setFocused(true), onBlur: () => setTimeout(() => setFocused(false), 150), onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        h('div', { className: 'mwt-ask-row' },
          scenario ? h('button', { type: 'button', className: 'mwt-chip', 'data-on': true, title: t('scenarioClear'), onClick: () => setScenario('') }, (scenarios.find((s) => s.id === scenario) || { label: scenario }).label, ' ×') : null,
          h('small', { className: 'grow' }, err || (hero ? '' : t('hint'))),
          h('button', { type: 'button', className: 'mwt-btn primary round', 'aria-label': t('create'), title: t('create'), disabled: busy || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'send', { size: 15 })))),
      examples.length && (!compact || focused) && !text ? h('div', { className: 'mwt-chips' + (hero ? ' center' : '') }, examples.map((ex) => h('button', { key: ex, type: 'button', className: 'mwt-chip', title: ex, onMouseDown: (e) => e.preventDefault(), onClick: () => { setText(ex); if (ref.current) ref.current.focus() } }, ex))) : null)
  }

  /** What needs the user: failures, verification issues, unrated deliveries (last 7 days). */
  function attentionItems(items, deliverables, reminders) {
    const week = Date.now() - 7 * 86400000
    const out = []
    for (const r of reminders || []) out.push({ key: 'r' + r.routineId + r.at, kind: 'remind', at: r.at, title: r.title, sub: r.input && r.input !== r.title ? r.input : '', reminder: r })
    for (const t of items) {
      if (t.status !== 'done' || new Date(t.finishedAt || t.createdAt) < week) continue
      if (t.error && !/已取消/.test(t.error)) out.push({ key: 'f' + t.id, kind: 'failed', at: t.finishedAt, title: t.title, sub: t.error, task: t })
      else if (t.verification && t.verification.passed === false) out.push({ key: 'v' + t.id, kind: 'issues', at: t.finishedAt, title: t.title, sub: t.verification.notes || '', task: t })
    }
    for (const d of deliverables) {
      if (d.rating !== null && d.rating !== undefined) continue
      if (new Date(d.createdAt) < week) continue
      if (out.some((x) => x.task && x.task.id === d.taskId)) continue
      out.push({ key: 'd' + d.id, kind: 'rate', at: d.createdAt, title: d.title, sub: '', deliverable: d })
    }
    return out.sort((a, b) => (a.kind === 'remind') !== (b.kind === 'remind') ? (a.kind === 'remind' ? -1 : 1) : new Date(b.at) - new Date(a.at)).slice(0, 8)
  }

  function AttentionCard({ item }) {
    const label = item.kind === 'failed' ? t('failedCard') : item.kind === 'issues' ? t('issuesCard') : item.kind === 'remind' ? t('remindCard') + ' · ' + fmtTime(item.at) : t('rateCard')
    const open = () => { if (item.reminder) return; if (item.deliverable) openDeliverable(item.deliverable.id); else openTask(item.task.id) }
    const ack = (e) => { e.stopPropagation(); api('/routines/ack', { id: item.reminder.routineId, at: item.reminder.at }).then(() => refresh()).catch(() => {}) }
    const rerun = (e) => { e.stopPropagation(); api('/rerun', { id: item.task.id }).then((d) => { refresh().then(schedulePoll); if (d.task) openTask(d.task.id) }).catch(() => {}) }
    return h('div', { className: 'mwt-att', 'data-kind': item.kind, role: 'button', tabIndex: 0, onClick: open, onKeyDown: (e) => { if (e.key === 'Enter') open() } },
      h('span', { className: 'mwt-att-ic' }, icon(item.kind === 'failed' ? 'circle-x' : item.kind === 'issues' ? 'circle-x' : item.kind === 'remind' ? 'bell' : 'file-text', { size: 16 })),
      h('div', { className: 'mwt-att-body' }, h('div', { className: 'mwt-att-label' }, label), h('div', { className: 'mwt-att-title' }, item.title), item.sub ? h('div', { className: 'mwt-att-sub' }, item.sub) : null),
      item.kind === 'failed' ? h('button', { type: 'button', className: 'mwt-btn', onClick: rerun }, icon('rotate-cw', { size: 13 }), t('rerun')) : item.kind === 'remind' ? h('button', { type: 'button', className: 'mwt-btn', onClick: ack }, icon('check', { size: 13 }), t('gotIt')) : h('span', { className: 'mwt-att-go' }, icon('arrow-left', { size: 14, style: { transform: 'rotate(180deg)' } })))
  }

  function TodayPage() {
    const s = usePolling()
    const initial = nav.pendingInput; nav.pendingInput = null
    const active = s.items.filter((x) => x.status !== 'done')
    useTick(active.length > 0)
    const attention = attentionItems(s.items, s.deliverables, s.reminders)
    const briefs = s.items.filter((x) => x.routineId && x.status === 'done' && isToday(x.finishedAt)).slice(0, 6)
    const routineTasks = new Set(briefs.map((x) => x.id))
    const todayDocs = s.deliverables.filter((d) => isToday(d.createdAt) && !routineTasks.has(d.taskId)).slice(0, 8)
    const recent = s.items.filter((x) => x.status === 'done').slice(0, 5)
    const hour = new Date().getHours()
    const greet = hour < 12 ? t('greetMorning') : hour < 18 ? t('greetDay') : t('greetNight')
    const status = [active.length ? `${active.length} ${t('running1')}` : '', attention.length ? `${attention.length} ${t('waiting1')}` : ''].filter(Boolean).join(' · ') || t('quiet')
    const docCard = (d) => h('button', { key: d.id, type: 'button', className: 'mwt-card', onClick: () => openDeliverable(d.id) },
      h('span', { className: 'mwt-dot', 'data-s': d.verification && d.verification.passed === true ? 'ok' : undefined }, icon('file-text', { size: 16 })),
      h('span', null, h('div', { className: 'mwt-card-title' }, d.title), h('div', { className: 'mwt-card-sub' }, [d.verification ? (d.verification.passed === true ? t('verified') : d.verification.passed === false ? t('verifyIssues') : t('verifyNone')) : '', d.rating === 1 ? t('ratingGood') : d.rating === -1 ? t('ratingBad') : ''].filter(Boolean).join(' · '))),
      h('span', { className: 'mwt-card-meta' }, fmtTime(d.createdAt)))
    return h('div', { className: 'mwt mwt-today' }, h('style', null, STYLE), h('div', { className: 'mwt-page mwt-page-today' },
      h('header', { className: 'mwt-greet' }, h('h1', null, greet), h('p', null, new Date().toLocaleDateString([], { month: 'long', day: 'numeric', weekday: 'long' }) + ' · ' + status)),
      h('section', { className: 'mwt-section first' }, h('h2', null, icon('bell', { size: 14 }), t('attention'), attention.length ? h('span', null, String(attention.length)) : null),
        attention.length ? h('div', { className: 'mwt-atts' }, attention.map((item) => h(AttentionCard, { key: item.key, item }))) : h('div', { className: 'mwt-empty' }, t('attentionEmpty'))),
      active.length ? h('section', { className: 'mwt-section' }, h('h2', null, icon('loader', { size: 14 }), t('running'), h('span', null, String(active.length))),
        h('div', { className: 'mwt-cards' }, active.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask })))) : null,
      briefs.length ? h('section', { className: 'mwt-section' }, h('h2', null, icon('history', { size: 14 }), t('briefs'), h('span', null, String(briefs.length))),
        h('div', { className: 'mwt-cards' }, briefs.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask })))) : null,
      todayDocs.length ? h('section', { className: 'mwt-section' }, h('h2', null, icon('file-text', { size: 14 }), t('todayDone'), h('span', null, String(todayDocs.length))),
        h('div', { className: 'mwt-cards' }, todayDocs.map(docCard))) : null,
      h('section', { className: 'mwt-section' }, h('h2', null, icon('history', { size: 14 }), t('recent')),
        recent.length ? h('div', { className: 'mwt-cards' }, recent.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask }))) : h('div', { className: 'mwt-empty' }, s.error || t('none'))),
      h('div', { className: 'mwt-dock' }, h(Ask, { scenarios: s.scenarios, initial, hero: false, compact: true }))))
  }

  function Activity({ task, live }) {
    const list = Array.isArray(task.activity) ? task.activity : []
    const ref = React.useRef(null)
    React.useEffect(() => { if (live && ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [list.length, live])
    if (!list.length) return h('div', { className: 'mwt-empty' }, live ? task.statusLabel + '…' : t('none2'))
    return h('div', { className: 'mwt-stream', ref }, list.map((e, i) => e.kind === 'user'
      ? h('div', { key: i, className: 'mwt-ev user' }, h('span', { className: 'ic' }, icon('message', { size: 13 })), h('div', null, h('span', { className: 'body' }, e.text)))
      : e.kind === 'text'
      ? h('div', { key: i, className: 'mwt-ev text' }, h('span', { className: 'ic' }, icon('message', { size: 13 })), h('div', { className: 'body' }, e.text))
      : h('div', { key: i, className: 'mwt-ev', 'data-ok': e.ok === undefined ? undefined : e.ok }, h('span', { className: 'ic' }, icon(e.ok === false ? 'circle-x' : e.ok === true ? 'check' : 'loader', { size: 13 })),
        h('div', null, h('span', { className: 'name' }, e.name), e.detail ? h('span', { className: 'detail' }, ' ' + e.detail) : null, e.ok === false && e.result ? h('div', { className: 'result' }, t('toolFailed') + ' · ' + e.result) : null))))
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
    return h('div', { className: 'mwt-say' }, h('div', { className: 'mwt-say-inner' },
      h('textarea', { ref, value: text, rows: 1, placeholder: t('say'), disabled: blocked, onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
      h('div', { className: 'mwt-say-row' }, h('small', null, err || (task.status === 'verifying' ? t('sayBusy') : t('sayHint'))),
        h('button', { type: 'button', className: 'mwt-btn round', 'aria-label': t('create'), disabled: busy || blocked || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'send', { size: 13 })))))
  }

  /** Verifier notes: two lines by default, the whole text on tap. */
  function Notes({ text }) {
    const [open, setOpen] = React.useState(false)
    return h('div', { className: 'mwt-notes' + (open ? ' open' : ''), role: 'button', tabIndex: 0, title: open ? '' : t('notesMore'), onClick: () => setOpen(!open), onKeyDown: (e) => { if (e.key === 'Enter') setOpen(!open) } }, text)
  }

  function Doc({ d, status, onRate, onOpenTask }) {
    return h('div', { className: 'mwt-doc' }, h('div', { className: 'mwt-doc-inner' },
      h('div', { className: 'mwt-doc-head' }, icon('file-text', { size: 15 }), h('h3', null, d.title), h(VerifyBadge, { v: d.verification, status })),
      h('div', { className: 'mwt-doc-body' },
        h('div', { className: 'mwt-doc-meta' }, h('span', null, fmtDate(d.createdAt)), d.scenarioLabel ? h('span', null, d.scenarioLabel) : null, d.kind && d.kind !== 'markdown' ? h('span', null, d.kind) : null),
        d.verification && d.verification.notes ? h(Notes, { text: d.verification.notes }) : null,
        h(Markdown, { text: d.markdown })),
      h('div', { className: 'mwt-doc-actions' },
        h('button', { type: 'button', className: 'mwt-chip', 'data-on': d.rating === 1, onClick: () => onRate(d, 1) }, t('ratingGood')),
        h('button', { type: 'button', className: 'mwt-chip', 'data-on': d.rating === -1, onClick: () => onRate(d, -1) }, t('ratingBad')),
        h('span', { style: { flex: 1 } }),
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => download(safeName(d.title) + '.md', '# ' + d.title + '\n\n' + d.markdown) }, icon('file-text', { size: 13 }), t('exportMd')),
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => printDoc(d) }, icon('file-text', { size: 13 }), t('exportPdf')),
        onOpenTask ? h('button', { type: 'button', className: 'mwt-btn', onClick: onOpenTask }, icon('list-checks', { size: 13 }), t('openTask')) : null)))
  }

  function useTaskDetail(id, key) {
    const [detail, setDetail] = React.useState(null)
    React.useEffect(() => { let on = true; api('/task?id=' + encodeURIComponent(id)).then((d) => { if (on) setDetail(d) }).catch(() => {}); return () => { on = false } }, [id, key])
    return [detail, setDetail]
  }
  const rateIn = (setDetail) => (d, r) => api('/rate', { id: d.id, rating: d.rating === r ? null : r }).then((x) => setDetail((prev) => prev ? { ...prev, deliverables: prev.deliverables.map((y) => y.id === x.deliverable.id ? x.deliverable : y) } : prev)).catch(() => {})

  function TaskDetail({ id, onBack }) {
    const s = usePolling()
    const task = s.items.find((x) => x.id === id) || null
    const live = !!task && task.status !== 'done'
    useTick(live)
    const key = task ? task.status + ':' + task.deliverableIds.length + ':' + (live ? Math.floor(Date.now() / FAST_MS) : 0) : ''
    const [detail, setDetail] = useTaskDetail(id, key)
    if (!task) return h('div', { className: 'mwt-empty' }, t('none'))
    const full = detail && detail.task ? detail.task : task
    const docs = detail && detail.deliverables ? detail.deliverables : []
    const scenarioLabel = (s.scenarios.find((x) => x.id === task.scenario) || {}).label || task.scenario
    const rerun = () => api('/rerun', { id }).then((d) => { refresh().then(schedulePoll); if (d.task) openTask(d.task.id) }).catch(() => {})
    const cancel = () => api('/cancel', { id }).then(() => refresh()).catch(() => {})
    const reverify = () => api('/verify', { id }).then(() => refresh().then(schedulePoll)).catch((e) => console.warn(`[${PLUGIN}]`, e))
    return h('div', null,
      h('div', { className: 'mwt-toolbar' }, h('button', { type: 'button', className: 'mwt-btn ghost', onClick: onBack }, icon('arrow-left', { size: 14 }), t('back')), h('span', { className: 'grow' }),
        h('div', { className: 'mwt-actions' },
          live ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: cancel }, icon('x', { size: 14 }), t('cancel')) : h('button', { type: 'button', className: 'mwt-btn ghost', onClick: rerun }, icon('rotate-cw', { size: 14 }), t('rerun')),
          !live && task.deliverableIds.length ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: reverify }, icon('circle-check', { size: 14 }), t('verifyAgain')) : null,
          task.sessionId ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => fire('mywork:open-session', { sessionId: task.sessionId }) }, icon('history', { size: 14 }), t('process')) : null)),
      h('div', { className: 'mwt-detail-head' }, h(StatusDot, { task }), h('h1', null, task.title)),
      h('div', { className: 'mwt-meta' }, task.scenario !== 'general' ? h('span', null, scenarioLabel) : null, h('span', null, t('elapsed') + ' ' + elapsedOf(task)), task.finishedAt ? h('span', null, fmtDate(task.finishedAt)) : null, task.input !== task.title ? h('span', { title: task.input }, t('input') + '：' + (task.input.length > 80 ? task.input.slice(0, 79) + '…' : task.input)) : null),
      task.error ? h('div', { className: 'mwt-error' }, task.error) : null,
      h('div', { className: 'mwt-cols' },
        h('div', { className: 'mwt-col' }, h('h2', null, icon('loader', { size: 13 }), t('progress'), h('span', { className: 'grow' }), task.statusLabel),
          task.steps.length ? h('div', { className: 'mwt-steps' }, task.steps.map((st, i) => h('span', { key: i, className: 'mwt-step', 'data-live': !st.endedAt }, st.name + (st.count > 1 ? ' × ' + st.count : ''), h('em', { style: { fontStyle: 'normal', opacity: .7 } }, fmtDuration(new Date(st.endedAt || Date.now()) - new Date(st.startedAt)))))) : null,
          h(Activity, { task: full, live }),
          h(Say, { task })),
        h('div', { className: 'mwt-col sticky' }, h('h2', null, icon('file-text', { size: 13 }), t('deliverable'), h('span', { className: 'grow' }), docs.length ? null : h(VerifyBadge, { v: task.verification, status: task.status })),
          docs.length ? docs.map((d) => h(Doc, { key: d.id, d: { ...d, scenarioLabel }, status: task.status, onRate: rateIn(setDetail) })) : h('div', { className: 'mwt-empty' }, live ? t('waitingDeliverable') : t('conversational')))))
  }

  function TasksPage() {
    const s = usePolling()
    const [filter, setFilter] = React.useState('all')
    const [open, setOpen] = React.useState(() => { const id = nav.pendingTask; nav.pendingTask = ''; return id })
    React.useEffect(() => {
      const onOpen = (e) => { const id = e.detail && e.detail.id; if (id) setOpen(String(id)) }
      window.addEventListener('mywork:open-task', onOpen)
      if (nav.pendingTask) { setOpen(nav.pendingTask); nav.pendingTask = '' }
      return () => window.removeEventListener('mywork:open-task', onOpen)
    }, [])
    useTick(s.items.some((x) => x.status !== 'done'))
    const items = s.items.filter((x) => filter === 'all' ? true : filter === 'active' ? x.status !== 'done' : x.status === 'done')
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' + (open ? ' wide' : '') },
      open ? h(TaskDetail, { id: open, onBack: () => setOpen('') }) : h(React.Fragment, null,
        h('div', { className: 'mwt-title' }, h('h1', null, t('tasks')), h('span', null, String(s.items.length))),
        h('div', { className: 'mwt-chips', style: { margin: '0 0 16px' } }, [['all', t('all')], ['active', t('active')], ['done', t('finished')]].map(([k, label]) => h('button', { key: k, type: 'button', className: 'mwt-chip', 'data-on': filter === k, onClick: () => setFilter(k) }, label))),
        items.length ? h('div', { className: 'mwt-cards' }, items.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: setOpen }))) : h('div', { className: 'mwt-empty' }, s.error || t('none')))))
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
          h('span', null, h('div', { className: 'mwt-card-title' }, d.title), h('div', { className: 'mwt-card-sub' }, [labelOf(d.scenario), d.verification ? (d.verification.passed === true ? t('verified') : d.verification.passed === false ? t('verifyIssues') : t('verifyNone')) : '', d.rating === 1 ? t('ratingGood') : d.rating === -1 ? t('ratingBad') : ''].filter(Boolean).join(' · '))),
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

  function RoutinesPage() {
    const s = usePolling()
    const [items, setItems] = React.useState([])
    const load = React.useCallback(() => api('/routines').then((d) => setItems(d.items || [])).catch(() => {}), [])
    React.useEffect(() => { load() }, [s.loadedAt, load])
    const act = (path, body) => api(path, body).then(() => { load(); refresh().then(schedulePoll) }).catch((e) => console.warn(`[${PLUGIN}]`, e))
    const row = (r) => {
      const last = r.lastRun
      const lastText = !last ? t('neverRan') : last.fired ? fmtDate(last.at) : (last.error ? t('failedTitle') : last.changed === false ? t('noChange') : last.changed === true ? t('changed') : '') + ' · ' + fmtDate(last.at)
      return h('div', { key: r.id, className: 'mwt-rt', 'data-off': !r.enabled },
        h('span', { className: 'mwt-dot' }, icon(r.kind === 'remind' ? 'bell' : 'history', { size: 16 })),
        h('div', { className: 'mwt-rt-body' },
          h('div', { className: 'mwt-rt-title' }, r.title, h('span', { className: 'mwt-badge' }, r.kind === 'remind' ? t('kindRemind') : t('kindTask'))),
          h('div', { className: 'mwt-rt-sub' }, r.scheduleLabel, r.enabled && r.nextRunAt ? ` · ${t('nextRun')} ${fmtDate(r.nextRunAt)}` : '', ` · ${t('lastRun')} ${lastText}`)),
        h('div', { className: 'mwt-actions' },
          last && last.taskId ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => openTask(last.taskId) }, icon('file-text', { size: 13 }), t('open')) : null,
          h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => act('/routines/run', { id: r.id }) }, icon('play', { size: 13 }), t('runNow')),
          r.schedule.type !== 'once' || r.enabled ? h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => act('/routines/enable', { id: r.id, enabled: !r.enabled }) }, icon(r.enabled ? 'pause' : 'play', { size: 13 }), r.enabled ? t('pause') : t('resume')) : null,
          h('button', { type: 'button', className: 'mwt-btn ghost', onClick: () => act('/routines/remove', { id: r.id }) }, icon('trash', { size: 13 }), t('remove'))))
    }
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      h('div', { className: 'mwt-title' }, h('h1', null, t('routines')), h('span', null, String(items.length))),
      h('p', { className: 'mwt-lead' }, t('routinesLead')),
      items.length ? h('div', { className: 'mwt-rts' }, items.map(row)) : h('div', { className: 'mwt-empty' }, t('routinesEmpty')),
      h('div', { className: 'mwt-dock' }, h(Ask, { scenarios: s.scenarios, hero: false, compact: true }))))
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

  return { TodayPage, TasksPage, DeliverablesPage, RoutinesPage, ScenariosPage, Overlay, openTask, openDeliverable, newTask }
}

// ---- plugin -----------------------------------------------------------------
function v2Active() { try { return localStorage.getItem(V2_KEY) !== 'off' } catch { return true } }

exports.name = PLUGIN
exports.inject = ['slots', 'locale', 'layout']
exports.apply = function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), PLUGIN + ': dictionaries')
  ctx.effect(() => { if (document.querySelector('link[data-mywork-fonts]')) return () => {}; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/mywork-shell/fonts.css'; link.setAttribute('data-mywork-fonts', ''); document.head.appendChild(link); return () => { link.remove() } }, PLUGIN + ': fonts')
  const t = ctx.locale.bind(NS)
  const c = makeComponents(ctx, t)
  const page = (key, order, label, iconName, Component) => {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key, locale: NS, inject: () => ({}) }, function MyworkPage() { return h(Component) }))
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: key, order, locale: NS, label: () => t(label), inject: () => ({}) }, function MyworkPageIcon() { return icon(iconName, { size: 16, strokeWidth: 1.6 }) }))
  }
  page(PANELS.today, 1, 'today', 'sun', c.TodayPage)
  page(PANELS.tasks, 2, 'tasks', 'list-checks', c.TasksPage)
  page(PANELS.deliverables, 3, 'deliverables', 'file-text', c.DeliverablesPage)
  page(PANELS.routines, 4, 'routines', 'history', c.RoutinesPage)
  page(PANELS.scenarios, 5, 'scenarios', 'package', c.ScenariosPage)
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
        if (!document.querySelector('.mwt-hero')) ctx.layout.selectPanel(PANELS.today)
      } catch { /* panel not registered yet: try again */ }
    }, 250)
    return () => { clearInterval(timer); window.removeEventListener('pointerdown', onPointer, true); window.removeEventListener('keydown', onPointer, true) }
  }, PLUGIN + ': open 今日')
}
