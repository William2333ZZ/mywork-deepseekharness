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
const { icon } = require('./client-icons.cjs')

const h = React.createElement
const PLUGIN = 'dsh-mywork-tasks'
const NS = 'mywork.tasks'
const API = '/mywork-tasks/api'
const PANELS = { today: 'mywork-today', tasks: 'mywork-tasks', deliverables: 'mywork-deliverables', scenarios: 'mywork-scenarios' }
const FAST_MS = 3000
const SLOW_MS = 20000
const V2_KEY = 'dsh-mywork:v2'

const zh = {
  today: '今日', tasks: '任务', deliverables: '交付物', scenarios: '场景',
  hero: '你要什么结果？', ask: '说一个你要的结果，比如"把这个目录的 README 整理成一页产品介绍"', hint: '回车创建，Shift + 回车换行。任务在后台完成，做完通知你。',
  running: '进行中', recent: '最近', none: '还没有任务。', noneRunning: '现在没有在跑的任务。', noneDeliverables: '还没有交付物。',
  all: '全部', active: '进行中', finished: '已完成', back: '返回', rerun: '再来一次', cancel: '取消', process: '过程', verifyAgain: '重新核验',
  progress: '进度', deliverable: '交付物', waitingDeliverable: '做完后交付物出现在这里。', failedTitle: '失败',
  queued: '排队', input: '你说的', elapsed: '用时', scenario: '场景', create: '创建', creating: '创建中…', openTask: '打开任务',
  ratingGood: '有用', ratingBad: '没用', exportMd: '导出 Markdown', exportPdf: '导出 PDF', none2: '无',
  verified: '已核验', verifyIssues: '核验发现问题', verifyNone: '未能核验', verifying: '核验中', checked: '核对', issues: '问题',
  doneToast: '任务完成', failedToast: '任务失败', open: '打开', tryScenario: '用这个场景', kinds: '交付', examples: '示例',
  toolFailed: '失败', stepsTitle: '步骤',
  say: '接着说，比如“再短一点”或“换个角度”', sayHint: '回车发送，同一个会话继续。', sayBusy: '核验中，稍等。', conversational: '这是一次对话；要保存成文档时说“整理成一份…”。',
}
const en = {
  today: 'Today', tasks: 'Tasks', deliverables: 'Deliverables', scenarios: 'Scenarios',
  hero: 'What do you want done?', ask: 'Describe the result you want', hint: 'Enter creates the task, Shift + Enter for a new line. It runs in the background and notifies you when done.',
  running: 'In progress', recent: 'Recent', none: 'No tasks yet.', noneRunning: 'Nothing is running.', noneDeliverables: 'No deliverables yet.',
  all: 'All', active: 'Active', finished: 'Finished', back: 'Back', rerun: 'Run again', cancel: 'Cancel', process: 'Process', verifyAgain: 'Verify again',
  progress: 'Progress', deliverable: 'Deliverable', waitingDeliverable: 'The deliverable appears here when the task finishes.', failedTitle: 'Failed',
  queued: 'Queued', input: 'Your request', elapsed: 'Elapsed', scenario: 'Scenario', create: 'Create', creating: 'Creating…', openTask: 'Open task',
  ratingGood: 'Useful', ratingBad: 'Not useful', exportMd: 'Export Markdown', exportPdf: 'Export PDF', none2: 'none',
  verified: 'Verified', verifyIssues: 'Issues found', verifyNone: 'Not verified', verifying: 'Verifying', checked: 'checked', issues: 'issues',
  doneToast: 'Task finished', failedToast: 'Task failed', open: 'Open', tryScenario: 'Use this scenario', kinds: 'Delivers', examples: 'Examples',
  toolFailed: 'failed', stepsTitle: 'Steps',
  say: 'Keep going, e.g. “shorter” or “from another angle”', sayHint: 'Enter sends into the same session.', sayBusy: 'Verifying, one moment.', conversational: 'This is a conversation; ask for a document when you want one saved.',
}

const STYLE = `
.mwt{--mwt-canvas:#faf9f7;--mwt-surface:#ffffff;--mwt-surface2:#f3f2ee;--mwt-fg:#1c1c1a;--mwt-fg2:#6f6e68;--mwt-fg3:#a3a29b;--mwt-line:rgba(28,28,26,.08);--mwt-line2:rgba(28,28,26,.14);--mwt-ink:#1c1c1a;--mwt-ink-fg:#ffffff;--mwt-ok:#2f7d5b;--mwt-warn:#b7791f;--mwt-err:#c2473c;--mwt-shadow:0 1px 2px rgba(40,35,25,.04),0 14px 40px rgba(40,35,25,.08);--mwt-font:-apple-system,BlinkMacSystemFont,Inter,"PingFang SC","Hiragino Sans GB","Segoe UI","Microsoft YaHei UI",sans-serif;--mwt-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;height:100%;overflow:auto;background:var(--mwt-canvas);color:var(--mwt-fg);font:14px/22px var(--mwt-font);-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
body[data-ds-dark-theme] .mwt{--mwt-canvas:#171716;--mwt-surface:#1f1f1e;--mwt-surface2:#262625;--mwt-fg:#ebeae6;--mwt-fg2:#9c9b95;--mwt-fg3:#6b6a65;--mwt-line:rgba(255,255,255,.08);--mwt-line2:rgba(255,255,255,.14);--mwt-ink:#ebeae6;--mwt-ink-fg:#171716;--mwt-ok:#5fb08a;--mwt-warn:#d8a04a;--mwt-err:#e2685d;--mwt-shadow:0 1px 2px rgba(0,0,0,.2),0 14px 40px rgba(0,0,0,.35)}
.mwt *{box-sizing:border-box}
.mwt :focus-visible{outline:2px solid var(--mwt-fg2);outline-offset:2px;border-radius:6px}
.mwt button{font-family:inherit;transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease,transform 120ms ease,box-shadow 160ms ease}
.mwt button:active{transform:scale(.98)}
.mwt-page{max-width:840px;margin:0 auto;padding:28px 32px 72px}
.mwt-page.wide{max-width:1280px}
.mwt-title{display:flex;align-items:baseline;gap:10px;margin:8px 0 22px}
.mwt-title h1{margin:0;font-size:20px;line-height:28px;font-weight:600;letter-spacing:-.01em}
.mwt-title span{color:var(--mwt-fg3);font-size:13px;font-variant-numeric:tabular-nums}
.mwt-hero{min-height:min(40vh,400px);display:flex;flex-direction:column;justify-content:flex-end;padding:24px 0 12px;text-align:center}
.mwt-hero h1{margin:0 0 26px;font-size:30px;line-height:38px;font-weight:600;letter-spacing:-.022em;text-wrap:balance}
.mwt-ask{text-align:left;border:1px solid var(--mwt-line);border-radius:22px;background:var(--mwt-surface);padding:16px 16px 12px 20px;box-shadow:var(--mwt-shadow);transition:border-color 160ms ease,box-shadow 160ms ease}
.mwt-ask:focus-within{border-color:var(--mwt-line2)}
.mwt-ask textarea{display:block;width:100%;min-height:58px;max-height:260px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:16px;line-height:26px;padding:2px 0 0}
.mwt-ask textarea::placeholder{color:var(--mwt-fg3)}
.mwt-ask-row{display:flex;align-items:center;gap:10px;margin-top:10px}
.mwt-ask-row .grow{flex:1;min-width:0}
.mwt-ask-row small{display:block;color:var(--mwt-fg3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-select{appearance:none;-webkit-appearance:none;height:30px;padding:0 28px 0 12px;border:1px solid var(--mwt-line);border-radius:999px;background:var(--mwt-surface) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f6e68' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>") no-repeat right 10px center;color:var(--mwt-fg2);font:inherit;font-size:12.5px;cursor:pointer}
.mwt-select:hover{border-color:var(--mwt-line2);color:var(--mwt-fg)}
.mwt-btn{appearance:none;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:1px solid var(--mwt-line);border-radius:10px;background:var(--mwt-surface);color:var(--mwt-fg);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.mwt-btn:hover{border-color:var(--mwt-line2);background:var(--mwt-surface2)}
.mwt-btn[disabled]{opacity:.45;cursor:default;transform:none}
.mwt-btn.primary{background:var(--mwt-ink);border-color:var(--mwt-ink);color:var(--mwt-ink-fg)}
.mwt-btn.primary:hover{opacity:.9}
.mwt-btn.round{width:36px;height:36px;padding:0;border-radius:50%;justify-content:center}
.mwt-btn.ghost{border-color:transparent;background:transparent;color:var(--mwt-fg2)}
.mwt-btn.ghost:hover{background:var(--mwt-surface2);color:var(--mwt-fg)}
.mwt-chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
.mwt-chips.center{justify-content:center}
.mwt-chip{appearance:none;border:1px solid var(--mwt-line);border-radius:999px;background:transparent;color:var(--mwt-fg2);padding:5px 13px;font:inherit;font-size:13px;line-height:20px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-chip:hover{color:var(--mwt-fg);background:var(--mwt-surface);border-color:var(--mwt-line2)}
.mwt-chip[data-on=true]{color:var(--mwt-fg);background:var(--mwt-surface);border-color:var(--mwt-line2);font-weight:500}
.mwt-section{margin-top:34px}
.mwt-section h2{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:12.5px;font-weight:600;color:var(--mwt-fg3);letter-spacing:.01em}
.mwt-section h2 span{font-weight:500;font-variant-numeric:tabular-nums}
.mwt-empty{color:var(--mwt-fg3);font-size:13px;padding:6px 0}
.mwt-cards{display:grid;gap:6px}
.mwt-card{display:grid;grid-template-columns:20px minmax(0,1fr) auto;align-items:start;column-gap:12px;padding:12px 16px;border:1px solid var(--mwt-line);border-radius:14px;background:var(--mwt-surface);cursor:pointer;text-align:left;font:inherit;color:inherit;width:100%}
.mwt-card:hover{border-color:var(--mwt-line2);box-shadow:0 6px 20px rgba(40,35,25,.06)}
.mwt-card-title{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub{color:var(--mwt-fg2);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-card-sub.err{color:var(--mwt-err)}
.mwt-card-meta{color:var(--mwt-fg3);font-size:12px;white-space:nowrap;padding-top:2px;font-variant-numeric:tabular-nums}
.mwt-dot{display:inline-flex;width:20px;height:22px;align-items:center;justify-content:center;color:var(--mwt-fg3)}
.mwt-dot[data-s=running] svg,.mwt-dot[data-s=delivering] svg,.mwt-dot[data-s=verifying] svg{animation:mwt-spin 1.4s linear infinite;color:var(--mwt-fg)}
.mwt-dot[data-s=ok]{color:var(--mwt-ok)}
.mwt-dot[data-s=err]{color:var(--mwt-err)}
@keyframes mwt-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.mwt-dot svg,.mwt-badge svg{animation:none!important}.mwt{scroll-behavior:auto}}
.mwt-toolbar{display:flex;align-items:center;gap:8px;margin:0 0 14px}
.mwt-toolbar .grow{flex:1}
.mwt-detail-head{display:flex;align-items:flex-start;gap:12px;margin:0 0 6px}
.mwt-detail-head h1{flex:1;margin:0;font-size:22px;line-height:30px;font-weight:600;letter-spacing:-.015em;text-wrap:balance}
.mwt-meta{display:flex;flex-wrap:wrap;gap:6px 16px;color:var(--mwt-fg3);font-size:12.5px;margin:0 0 22px 32px;font-variant-numeric:tabular-nums}
.mwt-actions{display:flex;gap:6px;flex-wrap:wrap}
.mwt-error{border:1px solid color-mix(in srgb,var(--mwt-err) 35%,transparent);border-radius:12px;padding:10px 14px;color:var(--mwt-err);font-size:13px;margin:0 0 20px;white-space:pre-wrap;background:color-mix(in srgb,var(--mwt-err) 5%,transparent)}
.mwt-cols{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:28px;align-items:start}
@media (max-width:980px){.mwt-cols{grid-template-columns:minmax(0,1fr)}}
.mwt-col h2{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:12.5px;font-weight:600;color:var(--mwt-fg3)}
.mwt-col h2 .grow{flex:1}
.mwt-col.sticky{position:sticky;top:8px}
.mwt-steps{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.mwt-step{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;background:var(--mwt-surface2);font-size:12px;color:var(--mwt-fg2);font-variant-numeric:tabular-nums}
.mwt-step[data-live=true]{color:var(--mwt-fg);background:var(--mwt-surface);box-shadow:inset 0 0 0 1px var(--mwt-line2)}
.mwt-stream{position:relative;padding:2px 0 2px 2px;max-height:72vh;overflow:auto}
.mwt-ev{position:relative;display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:12px;padding:5px 0;font-size:13px;line-height:20px}
.mwt-ev .ic{display:flex;align-items:center;justify-content:center;height:20px;color:var(--mwt-fg3)}
.mwt-ev[data-ok=true] .ic{color:var(--mwt-ok)}
.mwt-ev[data-ok=false] .ic{color:var(--mwt-err)}
.mwt-ev .name{font-weight:500;font-family:var(--mwt-mono);font-size:12.5px}
.mwt-ev .detail{color:var(--mwt-fg3);font-family:var(--mwt-mono);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
.mwt-ev .result{color:var(--mwt-err);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-ev.text{padding:10px 0 12px}
.mwt-ev.text .body{white-space:pre-wrap;word-break:break-word;color:var(--mwt-fg);font-size:14px;line-height:23px}
.mwt-ev.text .ic{color:var(--mwt-fg2)}
.mwt-ev.user{padding:6px 0 10px}
.mwt-ev.user .body{display:inline-block;max-width:100%;padding:8px 14px;border-radius:14px 14px 4px 14px;background:var(--mwt-ink);color:var(--mwt-ink-fg);white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:22px}
.mwt-ev.user .ic{color:var(--mwt-fg3)}
.mwt-say{margin:14px 0 0;border:1px solid var(--mwt-line);border-radius:16px;background:var(--mwt-surface);padding:10px 10px 8px 14px;transition:border-color 160ms ease}
.mwt-say:focus-within{border-color:var(--mwt-line2)}
.mwt-say textarea{display:block;width:100%;min-height:24px;max-height:160px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:14px;line-height:22px;padding:2px 0}
.mwt-say textarea::placeholder{color:var(--mwt-fg3)}
.mwt-say-row{display:flex;align-items:center;gap:8px;margin-top:4px}
.mwt-say-row small{flex:1;color:var(--mwt-fg3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-doc{border:1px solid var(--mwt-line);border-radius:18px;background:var(--mwt-surface);margin:0 0 14px;overflow:hidden;box-shadow:var(--mwt-shadow)}
.mwt-doc-head{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid var(--mwt-line);background:var(--mwt-surface2);flex-wrap:wrap}
.mwt-doc-head h3{flex:1;margin:0;font-size:14px;font-weight:600;min-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-doc-head>svg{color:var(--mwt-fg2)}
.mwt-doc-body{padding:20px 26px 8px}
.mwt-doc-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:var(--mwt-fg3);font-size:12px;margin:0 0 14px;font-variant-numeric:tabular-nums}
.mwt-badge{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;font-size:12px;border:1px solid var(--mwt-line);color:var(--mwt-fg2);background:var(--mwt-surface)}
.mwt-badge[data-v=passed]{color:var(--mwt-ok);border-color:color-mix(in srgb,var(--mwt-ok) 40%,transparent);background:color-mix(in srgb,var(--mwt-ok) 8%,transparent)}
.mwt-badge[data-v=issues]{color:var(--mwt-warn);border-color:color-mix(in srgb,var(--mwt-warn) 45%,transparent);background:color-mix(in srgb,var(--mwt-warn) 9%,transparent)}
.mwt-badge[data-v=verifying] svg{animation:mwt-spin 1.4s linear infinite}
.mwt-notes{font-size:13px;line-height:21px;color:var(--mwt-fg2);border-left:2px solid var(--mwt-line2);padding:2px 12px;margin:0 0 16px}
.mwt-doc-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-top:1px solid var(--mwt-line);background:var(--mwt-surface)}
.mwt-md{font-size:14.5px;line-height:1.75;color:var(--mwt-fg)}
.mwt-md>:first-child{margin-top:0}
.mwt-md h2,.mwt-md h3,.mwt-md h4{margin:20px 0 8px;font-weight:600;line-height:1.4;letter-spacing:-.01em}
.mwt-md h2{font-size:18px}.mwt-md h3{font-size:15.5px}.mwt-md h4{font-size:14px}
.mwt-md p{margin:0 0 12px;max-width:68ch}.mwt-md ul,.mwt-md ol{margin:0 0 12px;padding-left:22px}.mwt-md li{margin:2px 0}
.mwt-md code{font-family:var(--mwt-mono);font-size:12.5px;background:var(--mwt-surface2);padding:1px 6px;border-radius:5px}
.mwt-md pre{background:var(--mwt-surface2);border-radius:10px;padding:12px 14px;overflow:auto;margin:0 0 12px}.mwt-md pre code{background:transparent;padding:0}
.mwt-md table{border-collapse:collapse;margin:0 0 14px;font-size:13px;font-variant-numeric:tabular-nums}.mwt-md th,.mwt-md td{border:1px solid var(--mwt-line);padding:6px 12px;text-align:left}.mwt-md th{background:var(--mwt-surface2);font-weight:600}
.mwt-md blockquote{margin:0 0 12px;padding:2px 14px;border-left:2px solid var(--mwt-line2);color:var(--mwt-fg2)}
.mwt-md hr{border:0;border-top:1px solid var(--mwt-line);margin:18px 0}
.mwt-md a{color:var(--mwt-fg);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--mwt-line2)}
.mwt-md strong{font-weight:600}
.mwt-scen{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.mwt-scen-card{border:1px solid var(--mwt-line);border-radius:18px;background:var(--mwt-surface);padding:20px 22px 18px;display:flex;flex-direction:column;gap:10px}
.mwt-scen-card h3{margin:0;font-size:16px;font-weight:600;letter-spacing:-.01em}
.mwt-scen-card p{margin:0;color:var(--mwt-fg2);font-size:13px;line-height:20px;flex:1}
.mwt-scen-card .ex{display:grid;gap:2px;padding-top:4px;border-top:1px solid var(--mwt-line)}
.mwt-scen-card .ex button{appearance:none;border:0;background:transparent;color:var(--mwt-fg2);font:inherit;font-size:13px;text-align:left;padding:5px 0;cursor:pointer}
.mwt-scen-card .ex button:hover{color:var(--mwt-fg)}
.mwt-scen-card>div:last-child{padding-top:4px}
.mwt-toasts{position:fixed;right:20px;bottom:20px;z-index:10050;display:grid;gap:8px;max-width:380px}
.mwt-toast{display:grid;grid-template-columns:20px minmax(0,1fr) auto;column-gap:10px;align-items:center;padding:12px 14px;border:1px solid var(--mwt-line);border-radius:14px;background:var(--mwt-surface);color:var(--mwt-fg);box-shadow:var(--mwt-shadow);font-size:13px;line-height:18px;animation:mwt-in 220ms cubic-bezier(.2,.8,.2,1)}
@keyframes mwt-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.mwt-toast b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-toast span{color:var(--mwt-fg2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
`

// ---- state ------------------------------------------------------------------
// `state` is replaced, never mutated: useSyncExternalStore compares snapshots by identity.
let state = { items: [], scenarios: [], loadedAt: 0, error: '' }
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
function refresh() {
  if (refreshing) return refreshing
  const before = new Map(state.items.map((t) => [t.id, t.status]))
  refreshing = api('/tasks').then((d) => {
    const items = d.items || []
    setState({ items, scenarios: d.scenarios || [], error: '', loadedAt: Date.now() })
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
    const sub = live ? (task.currentStep || task.statusLabel) : task.error ? (t('failedTitle') + ' · ' + task.error) : (task.summary || (task.deliverables[0] && task.deliverables[0].title) || '')
    return h('button', { type: 'button', className: 'mwt-card', onClick: () => onOpen(task.id) },
      h(StatusDot, { task }),
      h('span', null, h('div', { className: 'mwt-card-title' }, task.title), compact ? null : h('div', { className: 'mwt-card-sub' + (task.error ? ' err' : '') }, sub)),
      h('span', { className: 'mwt-card-meta' }, live ? elapsedOf(task) : fmtTime(task.finishedAt)))
  }

  function Ask({ scenarios, initial, hero }) {
    const [text, setText] = React.useState(initial && initial.text ? initial.text : '')
    const [scenario, setScenario] = React.useState(initial && initial.scenario ? initial.scenario : 'general')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    const current = scenarios.find((s) => s.id === scenario) || scenarios[0] || null
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
      try { const d = await api('/create', { input, scenario }); setText(''); await refresh(); schedulePoll(); if (d.task) openTask(d.task.id) } catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    const grow = () => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(240, el.scrollHeight) + 'px' }
    React.useEffect(grow, [text])
    return h('div', null,
      h('div', { className: 'mwt-ask' },
        h('textarea', { ref, value: text, placeholder: t('ask'), rows: 2, onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        h('div', { className: 'mwt-ask-row' },
          scenarios.length > 1 ? h('select', { className: 'mwt-select', value: scenario, 'aria-label': t('scenario'), onChange: (e) => setScenario(e.target.value) }, scenarios.map((s) => h('option', { key: s.id, value: s.id }, s.label))) : null,
          h('small', { className: 'grow' }, err || (hero ? '' : t('hint'))),
          h('button', { type: 'button', className: 'mwt-btn primary round', 'aria-label': t('create'), title: t('create'), disabled: busy || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'send', { size: 15 })))),
      current && current.examples.length ? h('div', { className: 'mwt-chips' + (hero ? ' center' : '') }, current.examples.map((ex) => h('button', { key: ex, type: 'button', className: 'mwt-chip', title: ex, onClick: () => { setText(ex); if (ref.current) ref.current.focus() } }, ex))) : null)
  }

  function TodayPage() {
    const s = usePolling()
    const initial = nav.pendingInput; nav.pendingInput = null
    const active = s.items.filter((x) => x.status !== 'done')
    useTick(active.length > 0)
    const recent = s.items.filter((x) => x.status === 'done').slice(0, 6)
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      h('div', { className: 'mwt-hero' }, h('h1', null, t('hero')), h(Ask, { scenarios: s.scenarios, initial, hero: true })),
      active.length ? h('div', { className: 'mwt-section' }, h('h2', null, icon('loader', { size: 14 }), t('running'), h('span', null, String(active.length))),
        h('div', { className: 'mwt-cards' }, active.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask })))) : null,
      h('div', { className: 'mwt-section' }, h('h2', null, icon('history', { size: 14 }), t('recent')),
        recent.length ? h('div', { className: 'mwt-cards' }, recent.map((x) => h(TaskCard, { key: x.id, task: x, onOpen: openTask }))) : h('div', { className: 'mwt-empty' }, s.error || t('none')))))
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
    return h('div', { className: 'mwt-say' },
      h('textarea', { ref, value: text, rows: 1, placeholder: t('say'), disabled: blocked, onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
      h('div', { className: 'mwt-say-row' }, h('small', null, err || (task.status === 'verifying' ? t('sayBusy') : t('sayHint'))),
        h('button', { type: 'button', className: 'mwt-btn primary round', style: { width: 30, height: 30 }, 'aria-label': t('create'), disabled: busy || blocked || !text.trim(), onClick: submit }, icon(busy ? 'loader' : 'send', { size: 13 }))))
  }

  function Doc({ d, status, onRate, onOpenTask }) {
    return h('div', { className: 'mwt-doc' },
      h('div', { className: 'mwt-doc-head' }, icon('file-text', { size: 15 }), h('h3', null, d.title), h(VerifyBadge, { v: d.verification, status })),
      h('div', { className: 'mwt-doc-body' },
        h('div', { className: 'mwt-doc-meta' }, h('span', null, fmtDate(d.createdAt)), d.scenarioLabel ? h('span', null, d.scenarioLabel) : null, d.kind && d.kind !== 'markdown' ? h('span', null, d.kind) : null),
        d.verification && d.verification.notes ? h('div', { className: 'mwt-notes' }, d.verification.notes) : null,
        h(Markdown, { text: d.markdown })),
      h('div', { className: 'mwt-doc-actions' },
        h('button', { type: 'button', className: 'mwt-chip', 'data-on': d.rating === 1, onClick: () => onRate(d, 1) }, t('ratingGood')),
        h('button', { type: 'button', className: 'mwt-chip', 'data-on': d.rating === -1, onClick: () => onRate(d, -1) }, t('ratingBad')),
        h('span', { style: { flex: 1 } }),
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => download(safeName(d.title) + '.md', '# ' + d.title + '\n\n' + d.markdown) }, icon('file-text', { size: 13 }), t('exportMd')),
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => printDoc(d) }, icon('file-text', { size: 13 }), t('exportPdf')),
        onOpenTask ? h('button', { type: 'button', className: 'mwt-btn', onClick: onOpenTask }, icon('list-checks', { size: 13 }), t('openTask')) : null))
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
      h('div', { className: 'mwt-meta' }, h('span', null, scenarioLabel), h('span', null, t('elapsed') + ' ' + elapsedOf(task)), task.finishedAt ? h('span', null, fmtDate(task.finishedAt)) : null, task.input !== task.title ? h('span', { title: task.input }, t('input') + '：' + (task.input.length > 80 ? task.input.slice(0, 79) + '…' : task.input)) : null),
      task.error ? h('div', { className: 'mwt-error' }, task.error) : null,
      h('div', { className: 'mwt-cols' },
        h('div', { className: 'mwt-col' }, h('h2', null, icon('loader', { size: 13 }), t('progress'), h('span', { className: 'grow' }), task.statusLabel),
          task.steps.length ? h('div', { className: 'mwt-steps' }, task.steps.map((st, i) => h('span', { key: i, className: 'mwt-step', 'data-live': !st.endedAt }, st.name + (st.count > 1 ? ' × ' + st.count : ''), h('em', { style: { fontStyle: 'normal', opacity: .7 } }, fmtDuration(new Date(st.endedAt || Date.now()) - new Date(st.startedAt)))))) : null,
          h(Activity, { task: full, live }),
          h(Say, { task })),
        h('div', { className: 'mwt-col sticky' }, h('h2', null, icon('file-text', { size: 13 }), t('deliverable'), h('span', { className: 'grow' }), docs.length ? null : h(VerifyBadge, { v: task.verification, status: task.status })),
          docs.length ? docs.map((d) => h(Doc, { key: d.id, d: { ...d, scenarioLabel }, status: task.status, onRate: rateIn(setDetail) })) : h('div', { className: 'mwt-empty' }, (s.scenarios.find((x) => x.id === task.scenario) || {}).conversational ? t('conversational') : live ? t('waitingDeliverable') : t('none2')))))
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
    return h('div', { className: 'mwt' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      h('div', { className: 'mwt-title' }, h('h1', null, t('scenarios')), h('span', null, String(s.scenarios.length))),
      h('div', { className: 'mwt-scen' }, s.scenarios.map((sc) => h('div', { key: sc.id, className: 'mwt-scen-card' },
        h('h3', null, sc.label), h('p', null, sc.intro),
        sc.examples.length ? h('div', { className: 'ex' }, sc.examples.map((ex) => h('button', { key: ex, type: 'button', title: t('tryScenario'), onClick: () => newTask(ex, sc.id) }, '→ ' + ex))) : null,
        h('div', null, h('button', { type: 'button', className: 'mwt-btn', onClick: () => newTask('', sc.id) }, icon('plus', { size: 13 }), t('tryScenario'))))))))
  }

  /** Always mounted: completion toasts and browser notifications, and the poll that feeds the sidebar. */
  function Overlay() {
    usePolling()
    const [toasts, setToasts] = React.useState([])
    React.useEffect(() => {
      const onDone = (task) => {
        setToasts((prev) => [...prev.slice(-3), { id: task.id + ':' + Date.now(), task }])
        try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification((task.error ? t('failedToast') : t('doneToast')) + ' · ' + task.title, { body: task.error || task.summary || '' }) } catch {}
      }
      completionListeners.add(onDone)
      return () => completionListeners.delete(onDone)
    }, [])
    React.useEffect(() => { if (!toasts.length) return; const id = setTimeout(() => setToasts((prev) => prev.slice(1)), 8000); return () => clearTimeout(id) }, [toasts])
    if (!toasts.length) return null
    return h('div', { className: 'mwt mwt-toasts', style: { height: 'auto', overflow: 'visible', background: 'transparent' } }, h('style', null, STYLE), toasts.map(({ id, task }) => h('div', { key: id, className: 'mwt-toast' },
      h(StatusDot, { task }), h('div', null, h('b', null, task.title), h('span', null, task.error || task.summary || '')),
      h('button', { type: 'button', className: 'mwt-btn', onClick: () => { setToasts((prev) => prev.filter((x) => x.id !== id)); openTask(task.id) } }, t('open')))))
  }

  return { TodayPage, TasksPage, DeliverablesPage, ScenariosPage, Overlay, openTask, openDeliverable, newTask }
}

// ---- plugin -----------------------------------------------------------------
function v2Active() { try { return localStorage.getItem(V2_KEY) !== 'off' } catch { return true } }

exports.name = PLUGIN
exports.inject = ['slots', 'locale', 'layout']
exports.apply = function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), PLUGIN + ': dictionaries')
  const t = ctx.locale.bind(NS)
  const c = makeComponents(ctx, t)
  const page = (key, order, label, iconName, Component) => {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key, locale: NS, inject: () => ({}) }, function MyworkPage() { return h(Component) }))
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: key, order, locale: NS, label: () => t(label), inject: () => ({}) }, function MyworkPageIcon() { return icon(iconName, { size: 16, strokeWidth: 1.6 }) }))
  }
  page(PANELS.today, 1, 'today', 'sun', c.TodayPage)
  page(PANELS.tasks, 2, 'tasks', 'list-checks', c.TasksPage)
  page(PANELS.deliverables, 3, 'deliverables', 'file-text', c.DeliverablesPage)
  page(PANELS.scenarios, 4, 'scenarios', 'package', c.ScenariosPage)
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
