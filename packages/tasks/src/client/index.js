/**
 * dsh-mywork-tasks — browser half (CommonJS; wrapped by scripts/build-client.mjs with
 * src/md.cjs, src/client/thread.cjs and client-icons.cjs inlined as preludes).
 *
 * 同事模型 (design/v2/TEAMMATES.md §9): the unit is a teammate. Each teammate is one endless conversation made of runs
 * (threadOf in thread.cjs), in two registers: conversation in bubbles (your line on the right, a short reply on the
 * left) and deliveries as file strips (title, deck, key figures, verification, 有用 / 没用 on hover) that open the
 * reading view; plus the question it stopped on, a routine run's centred line, 「已安排」 and reminder cards, a working
 * line while it runs, 过程 folded per run, 「以下是新的」 where the unread part starts, the composer docked.
 *
 * Pages (main slot):
 *   mywork-mate       one teammate: header (avatar · name · title · ···), the thread (GET /mates/thread, 「加载更早」),
 *                     the dock (POST /mates/say); the right panel (电脑 · 例行 · 设置, or the 「新同事」 form). A file
 *                     opened from the thread replaces the column with the reading view (「← 回到对话」 / Escape)
 *   mywork-files      文件: every teammate's files, chips per teammate, search; a file opens in the same reading view
 * Overlay (shell.overlay): toasts when a run finishes or needs you (from GET /activity), keyed by teammate; keeps the
 * poll alive for the sidebar.
 *
 * Child slot `mywork.thread.aside` (declared on the mate page entry, list): the 电脑 section of the right panel.
 *   `when(run)` gets the teammate's current (working or waiting) run with its activity; the first entry that accepts it
 *   renders with props { task: run, deliverables, live }. dsh 0.1.6 keeps just id / order / label on `options`, so
 *   `when` / `title` are read from options, then from the entry, then from the component.
 *
 * Window events (the sidebar in dsh-mywork-codex-ui and other members):
 *   in:  mywork:open-thread { kind: 'mate', id?, runId? }   id empty → the default teammate; runId → scroll to it + highlight
 *                           { kind: 'new-mate' }            the right panel's 「新同事」 form
 *                           { kind: 'files', id? }          the files page (id → that file's preview)
 *                           { kind: 'routine', id, mateId? } the owning teammate + its routine expanded in the right panel
 *        (every handled kind is preventDefault()ed: the sidebar dispatches it cancelable)
 *   out: mywork:thread-opened { kind: 'mate', id } | { kind: 'files' }   (+ POST /seen { id } for a teammate)
 *        mywork:mates-updated { items, activity }   every poll, so the column can share the snapshot
 */
'use strict'

const React = require('react')
const md = require('./md.cjs')
const { foldedRunIds, threadOf, verifyState, isLive, isQueued, mergeRuns, activeRun, textAskOf, mateOrder, routineRunKind, initialOf } = require('./thread.cjs')
const icons = require('./client-icons.cjs')
// Lucide line icons this bundle needs that the shared set does not carry (the prelude is this bundle's own copy).
const EXTRA_ICONS = {
  'message-circle': ['M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719'],
  monitor: ['M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 17v4'],
  square: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'],
  file: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z', 'M14 2v4a2 2 0 0 0 2 2h4'],
}
if (icons.PATHS) for (const k of Object.keys(EXTRA_ICONS)) if (!icons.PATHS[k]) icons.PATHS[k] = EXTRA_ICONS[k]
const icon = (name, opts) => icons.icon(name, { strokeWidth: 1.5, ...(opts || {}) })

const h = React.createElement
const PLUGIN = 'dsh-mywork-tasks'
const NS = 'mywork.tasks'
const API = '/mywork-tasks/api'
const PANELS = { mate: 'mywork-mate', files: 'mywork-files' }
/** Poll /mates and /activity every 4 s while any teammate works, else every 30 s (and on focus). */
const FAST_MS = 4000
const SLOW_MS = 30000
/** Runs per GET /mates/thread page. */
const THREAD_PAGE = 8
/**
 * Per teammate, the thread as last seen (runs, nextBefore): switching back renders it at once while the newest page
 * refreshes in the background. Filled by the page and by a prefetch of every teammate's first page after the first poll.
 */
const threadCache = new Map()
let prefetched = false
function prefetchThreads(mates) {
  if (prefetched || !Array.isArray(mates) || !mates.length) return
  prefetched = true
  const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (fn) => setTimeout(fn, 200)
  idle(() => {
    for (const m of mates.slice(0, 12)) {
      if (threadCache.has(m.id)) continue
      api('/mates/thread?id=' + encodeURIComponent(m.id) + '&limit=' + THREAD_PAGE).then((d) => {
        if (!threadCache.has(m.id)) threadCache.set(m.id, { runs: d.runs || [], nextBefore: d.nextBefore || null })
      }).catch(() => {})
    }
  })
}
const V2_KEY = 'dsh-mywork:v2'
/** The right panel: the mate page's child slot for 电脑, and where each teammate's open / closed panel is remembered. */
const ASIDE_SLOT = 'mywork.thread.aside'
const ASIDE_KEY = 'dsh-mywork:mate-aside'
/**
 * The panel is a grid column whenever the page has room for a reading column of at least 560 (it shrinks from 752 down
 * to that), a 24 gap, the 384 panel and the 2 × 32 page padding; only below that is it a slide-over.
 */
const ASIDE_W = 384
const COL_MIN = 560
const SPLIT_GAP = 24
const SPLIT_MIN = COL_MIN + 64 + SPLIT_GAP + ASIDE_W
/** How long a run jumped to stays highlighted. */
const HIGHLIGHT_MS = 1200

const zh = {
  mate: '同事', files: '文件',
  sayTo: '给 {name} 发消息', answerPh: '回答', send: '发送', more: '更多', stop: '停止', settings: '设置', close: '关闭', back: '返回',
  working: '在干活', workingAria: '{name} 正在工作', file: '文件', loadEarlier: '加载更早', process: '过程', phases: '步', times: '次', toolFailed: '失败', none2: '无',
  verified: '已核验', verifyIssues: '核验发现问题', verifyFound: '核验发现 {n} 处', verifyNone: '未能核验', verifying: '核验中', checked: '核对', issues: '问题', verifyLabel: '核验', passed: '通过',
  ratingGood: '有用', ratingBad: '没用', failedTitle: '失败', stopped: '已停止', queued: '排队',
  scheduled: '已安排', remindCard: '提醒', gotIt: '知道了', acked: '已知道',
  answeredLine: '已回答：{a}', askClosed: '不再等待', askAuto: '24 小时没有回答，按合理假设继续',
  allowOnce: '允许一次', deny: '拒绝', takeoverGo: '去 Chrome 里处理', takeoverDone: '我做完了',
  computer: '电脑', routines: '例行', noFiles: '还没有文件。', folderEmpty: '文件夹是空的', noRoutines: '还没有例行。',
  newRoutine: '新例行', newRoutinePh: '说一句带时间的话，例如：每天 9 点给我一份简报',
  nextRun: '下次', paused: '已暂停', ended: '已结束', runNow: '现在跑一次', pause: '暂停', resume: '恢复', remove: '删除', cancel: '取消',
  removeRoutineAsk: '删除这个例行？', removeMate: '删除同事', removeMateAsk: '删除这位同事、它的对话和例行？',
  runResult: '有结果', runQuiet: '没有变化', runFailed: '失败', runFired: '提醒', runRunning: '在跑', neverRan: '还没跑过',
  name: '名字', title: '头衔', duty: '职责', pinned: '置顶', notify: '通知', group: '分组', groupPh: '其他',
  newMate: '新同事', dutyAsk: '它负责什么', dutyPh: '例如：每天盯三家竞品的价格，有变化告诉我', namePh: '可以不填', create: '创建',
  search: '搜索', all: '全部', noMatch: '没有匹配的', inThread: '在对话里看', exportMd: '导出 Markdown', exportPdf: '导出 PDF',
  doneToast: '做完了', failedToast: '失败了', needsYouToast: '需要你', open: '打开',
  loadFailed: '没连上服务，稍后再试。', retry: '重试', today: '今天',
  downloadMd: '下载 .md', openInFiles: '在文件页打开', backToThread: '回到对话', backToFiles: '回到文件',
  newBelow: '以下是新的', tables: '表格',
  dutyEx1: '每天早上 8 点按信源整理 AI 技术动态，只报和我有关的', dutyEx2: '帮我管日程，记在一张表里，每天 8:30 给我今日安排', dutyEx3: '盯竞品的定价页和更新日志，有变化就告诉我',
}
const en = {
  mate: 'Teammate', files: 'Files',
  sayTo: 'Message {name}', answerPh: 'Answer', send: 'Send', more: 'More', stop: 'Stop', settings: 'Settings', close: 'Close', back: 'Back',
  working: 'Working', workingAria: '{name} is working', file: 'File', loadEarlier: 'Load earlier', process: 'Process', phases: 'steps', times: 'calls', toolFailed: 'failed', none2: 'none',
  verified: 'Verified', verifyIssues: 'Issues found', verifyFound: 'Verification found {n}', verifyNone: 'Not verified', verifying: 'Verifying', checked: 'checked', issues: 'issues', verifyLabel: 'Verification', passed: 'passed',
  ratingGood: 'Useful', ratingBad: 'Not useful', failedTitle: 'Failed', stopped: 'Stopped', queued: 'Queued',
  scheduled: 'Scheduled', remindCard: 'Reminder', gotIt: 'Got it', acked: 'Seen',
  answeredLine: 'Answered: {a}', askClosed: 'No longer waiting', askAuto: 'No answer in 24 hours, continued on reasonable assumptions',
  allowOnce: 'Allow once', deny: 'Deny', takeoverGo: 'Handle it in Chrome', takeoverDone: 'Done',
  computer: 'Computer', routines: 'Routines', noFiles: 'No files yet.', folderEmpty: 'The folder is empty', noRoutines: 'No routines yet.',
  newRoutine: 'New routine', newRoutinePh: 'A sentence with a time, e.g. every day at 9 send me a brief',
  nextRun: 'Next', paused: 'Paused', ended: 'Ended', runNow: 'Run now', pause: 'Pause', resume: 'Resume', remove: 'Delete', cancel: 'Cancel',
  removeRoutineAsk: 'Delete this routine?', removeMate: 'Delete teammate', removeMateAsk: 'Delete this teammate, its conversation and routines?',
  runResult: 'Result', runQuiet: 'No change', runFailed: 'Failed', runFired: 'Reminder', runRunning: 'Running', neverRan: 'Never ran',
  name: 'Name', title: 'Title', duty: 'Job', pinned: 'Pinned', notify: 'Notifications', group: 'Group', groupPh: 'Other',
  newMate: 'New teammate', dutyAsk: 'What is it responsible for', dutyPh: 'e.g. watch three competitors’ prices every day and tell me when they change', namePh: 'Optional', create: 'Create',
  search: 'Search', all: 'All', noMatch: 'Nothing matches', inThread: 'See in conversation', exportMd: 'Export Markdown', exportPdf: 'Export PDF',
  doneToast: 'Done', failedToast: 'Failed', needsYouToast: 'Needs you', open: 'Open',
  loadFailed: 'Could not reach the service, try again shortly.', retry: 'Retry', today: 'today',
  downloadMd: 'Download .md', openInFiles: 'Open in Files', backToThread: 'Back to conversation', backToFiles: 'Back to files',
  newBelow: 'New since you last looked', tables: 'Tables',
  dutyEx1: 'Every morning at 8, gather AI tech news from my sources and report only what concerns me', dutyEx2: 'Run my calendar in one sheet and send me today’s plan every day at 8:30', dutyEx3: 'Watch competitors’ pricing pages and changelogs and tell me when something changes',
}

const STYLE = `
/*
 * Tokens (Rakazo's surfaces, an achromatic text scale): text is #ececee at 100 / 65 / 40 %, borders white at 10 / 5 %.
 * Colour only where it carries a decision: --danger for failures, --warn for "needs you"; the cream primary is the send
 * button alone. Spacing is 4 / 8 / 16 / 24 / 32 / 48. Shadows only on floating layers. Motion: 150 ms hover / press,
 * 200 ms for a reply that arrives; nothing else moves. Dark by default; a light twin only when dsh itself is light.
 */
.mwt{--bg:#0b0c0e;--surface:#141518;--surface-2:#1b1c21;--input:#18191e;--bubble:#22242b;--fg:#ececee;--fg-2:rgba(236,236,238,.65);--muted:rgba(236,236,238,.65);--meta:rgba(236,236,238,.5);--border:rgba(255,255,255,.1);--border-soft:rgba(255,255,255,.05);--border-strong:rgba(255,255,255,.1);--border-focus:rgba(236,236,238,.4);--hl:rgba(255,255,255,.05);--primary:#f1f1ef;--primary-on:#0b0c0e;--warn:#f0a35e;--danger:#f87171;--font-body:Geist,-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei UI",sans-serif;--font-mono:"Geist Mono",ui-monospace,"SF Mono",Menlo,monospace;--font-display:var(--font-body);--radius-sm:12px;--radius-md:12px;--radius-lg:18px;--elev-raised:0 10px 30px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.4);--focus-ring:0 0 0 2px rgba(236,236,238,.4);--motion-fast:150ms;--motion-enter:200ms;--ease-standard:cubic-bezier(.2,0,0,1);--av-bg:var(--card,var(--surface-2));--av-fg:#efe8da;height:100%;overflow:auto;background:var(--bg);color:var(--fg);font:15px/1.6 var(--font-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
@media all{html[data-mywork-theme="light"] .mwt{--bg:#ffffff;--surface:#f2f2f3;--surface-2:#e9e9eb;--input:#f4f4f5;--bubble:#ebebed;--fg:#111113;--fg-2:rgba(17,17,19,.65);--muted:rgba(17,17,19,.65);--meta:rgba(17,17,19,.55);--border:rgba(0,0,0,.1);--border-soft:rgba(0,0,0,.05);--border-strong:rgba(0,0,0,.1);--border-focus:rgba(17,17,19,.4);--hl:rgba(0,0,0,.05);--primary:#111113;--primary-on:#ffffff;--warn:#b5480a;--danger:#c0392b;--elev-raised:0 10px 30px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.05);--focus-ring:0 0 0 2px rgba(17,17,19,.25);--av-bg:#1f1d1a;--av-fg:#faf7f0}}
.mwt *{box-sizing:border-box}
.mwt :focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-sm)}
.mwt textarea:focus,.mwt textarea:focus-visible,.mwt input:focus,.mwt input:focus-visible{outline:none!important;box-shadow:none!important}
.mwt button{font-family:inherit;transition:background-color var(--motion-fast) var(--ease-standard),color var(--motion-fast) var(--ease-standard),border-color var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard),opacity var(--motion-fast) var(--ease-standard)}
.mwt button:active{transform:scale(.98)}
@media (prefers-reduced-motion:reduce){.mwt *{transition:none!important;animation:none!important}}
/* skeleton */
.mwt-sk-rows{display:grid;gap:16px;padding:8px 0}
.mwt-sk{display:block;border-radius:4px;background:var(--surface-2);height:12px}
.mwt-sk.short{width:35%}.mwt-sk.mid{width:60%}
.mwt-retry{display:flex;align-items:center;gap:8px;color:var(--danger);font-size:13px;padding:8px 0}
.mwt-empty{color:var(--muted);font-size:13px;padding:8px 0}
/* Page */
.mwt-page{max-width:808px;margin:0 auto;padding:48px 32px}
.mwt-title{display:flex;align-items:baseline;gap:8px;margin:0 0 24px}
.mwt-title h1{margin:0;font-size:24px;line-height:1.4;font-weight:600}
.mwt-title span{color:var(--meta);font-size:12px;font-family:var(--font-mono)}
/* Buttons */
.mwt-btn{appearance:none;display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 16px;border:0;border-radius:var(--radius-sm);background:var(--surface);color:var(--fg);font:inherit;font-size:13px;font-weight:500;letter-spacing:.02em;cursor:pointer;white-space:nowrap}
.mwt-btn:hover{background:var(--surface-2)}
.mwt-btn[disabled]{opacity:.4;cursor:default;transform:none}
.mwt-btn.send{background:var(--primary);color:var(--primary-on)}
.mwt-btn.send:hover{opacity:.88}
.mwt-btn.send[disabled]{opacity:.35}
.mwt-btn.stop{background:transparent;color:var(--fg);border:1px solid var(--border)}
.mwt-btn.stop:hover{background:var(--surface-2)}
.mwt-btn.primary{background:var(--surface-2);color:var(--fg);border:1px solid var(--border)}
.mwt-btn.primary:hover{background:var(--bubble)}
.mwt-btn.round{width:32px;height:32px;padding:0;border-radius:50%;justify-content:center}
.mwt-btn.ghost{background:transparent;color:var(--muted)}
.mwt-btn.ghost:hover,.mwt-btn.ghost[aria-pressed=true]{background:var(--surface);color:var(--fg)}
.mwt-btn.outline{background:transparent;border:1px solid var(--border)}
.mwt-btn.outline:hover{background:var(--surface-2)}
.mwt-btn.danger{color:var(--danger)}
.mwt-btn.small{height:28px;padding:0 8px;font-weight:400}
/* A text button: the words alone, underlined faintly (the reading view's meta line). */
.mwt-tbtn{appearance:none;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--border)}
.mwt-tbtn:hover{color:var(--fg)}
.mwt-chips{display:flex;flex-wrap:wrap;gap:8px}
.mwt-chip{appearance:none;border:1px solid transparent;border-radius:999px;background:var(--surface);color:var(--muted);padding:4px 16px;font:inherit;font-size:13px;line-height:20px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-chip:hover{color:var(--fg);background:var(--surface-2)}
.mwt-chip[data-on=true]{color:var(--fg);background:var(--bg);border-color:var(--border)}
/* Avatar: a flat coloured shape with two eyes. Working, it breathes (opacity 1 to .55 over 2.4 s); reduced motion holds .7. */
.mwt-av{position:relative;display:inline-block;flex:none;line-height:0;user-select:none}
.mwt-av svg{display:block;overflow:visible}
.mwt-av[data-working=true] svg{animation:mwt-breathe 2.4s ease-in-out infinite}
@keyframes mwt-breathe{0%,100%{opacity:1}50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.mwt .mwt-av[data-working=true] svg{animation:none!important;opacity:.7}}
/* The mate page: header, thread, dock in one column that fills the height. */
.mwt-page.mate{display:flex;min-height:100%;max-width:816px;padding:0 32px}
.mwt-page.mate>.mwt-col{flex:1}
.mwt-col{min-width:0;display:flex;flex-direction:column;min-height:100%}
/* Split: the reading column stays centred (752) in what is left; the panel is flush right, full height, a left border. */
.mwt-page.mate.split{display:grid;max-width:none;margin:0;padding:0;grid-template-columns:minmax(0,1fr) var(--aside-w,${ASIDE_W}px);column-gap:0;align-items:start}
.mwt-page.mate.split>.mwt-col{width:100%;max-width:816px;margin:0 auto;padding:0 32px}
.mwt-head{position:sticky;top:0;z-index:4;display:flex;align-items:center;gap:4px;height:52px;padding:0;background:var(--bg)}
.mwt-head .grow{flex:1}
.mwt-who{appearance:none;display:flex;align-items:center;gap:8px;min-width:0;padding:4px 8px 4px 4px;border:0;border-radius:12px;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mwt-who:hover,.mwt-who[aria-expanded=true]{background:var(--surface)}
.mwt-who .who{display:flex;align-items:baseline;gap:8px;min-width:0}
.mwt-who .name{flex:none;max-width:240px;font-size:16px;line-height:24px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mwt-who .ttl{flex:0 1 auto;min-width:0;color:var(--muted);font-size:13px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/*
 * Conversation: your words in a bubble on the right; the teammate's short replies in a bubble on the left; a delivery is
 * a file strip. 32 between runs, 8 inside one.
 */
.mwt-thread{display:flex;flex-direction:column;gap:32px;padding:24px 0 8px;overflow-anchor:none}
.mwt-run{display:flex;flex-direction:column;gap:8px;min-width:0;border-radius:20px}
.mwt-run.hl{background:var(--hl);box-shadow:0 0 0 8px var(--hl)}
.mwt-fold{border:1px solid var(--border);min-height:56px;padding:8px 16px;border-radius:18px!important;background:var(--surface)}
.mwt-fold .t{font-size:15px;line-height:24px}
.mwt-turn{min-width:0}
.mwt-turn.user{display:flex;justify-content:flex-end}
.mwt-bubble{max-width:70%;padding:8px 16px;border-radius:20px;background:var(--bubble);color:var(--fg);font-size:15px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
/* CJK reading: 15 / 1.75, the bubble at most 620 wide (about 39 characters a line). */
.mwt-turn.ai{font-size:15px;line-height:1.75}
.mwt-turn.ai.bubble{align-self:flex-start;max-width:min(620px,88%);padding:8px 16px;border-radius:20px;background:var(--surface)}
.mwt-turn .mwt-md{font-size:15px;line-height:1.75}
.mwt-turn .mwt-md p{max-width:none;margin:0 0 8px}
.mwt-turn .mwt-md h1,.mwt-turn .mwt-md h2,.mwt-turn .mwt-md h3,.mwt-turn .mwt-md h4,.mwt-turn .mwt-md h5,.mwt-turn .mwt-md h6{margin:16px 0 4px;font-size:15px;line-height:1.75;font-weight:600}
.mwt-turn .mwt-md code{font-size:13px}
.mwt-turn .mwt-md table{display:block;max-width:100%;overflow-x:auto;border:1px solid var(--border);border-radius:8px;margin:0 0 8px;font-size:13px}
.mwt-turn .mwt-md th{font-size:12px}
.mwt-turn .mwt-md th,.mwt-turn .mwt-md td{padding:4px 8px;white-space:nowrap}
.mwt-turn .mwt-md pre{max-width:100%}
.mwt-turn.ai .mwt-md>:first-child{margin-top:0}
.mwt-turn.ai .mwt-md>:last-child{margin-bottom:0}
/* A reply that arrives while you watch: in over 200 ms; reduced motion keeps the fade only. */
.mwt-arrive{animation:mwt-arrive var(--motion-enter) var(--ease-standard) both}
@keyframes mwt-arrive{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mwt-arrive-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.mwt .mwt-arrive{animation:mwt-arrive-fade var(--motion-enter) linear both!important}}
/* 以下是新的: where the unread part of the thread starts. */
.mwt-newline{display:flex;align-items:center;gap:16px;margin-bottom:-16px;color:var(--meta);font-size:12px;line-height:16px;white-space:nowrap}
.mwt-newline::before,.mwt-newline::after{content:"";flex:1;height:1px;background:var(--border)}
/* Empty thread: the teammate, its job, three things to ask. */
.mwt-hello{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:48px 0 24px;text-align:center}
.mwt-hello .nm{margin-top:8px;font-size:16px;font-weight:600;line-height:24px}
.mwt-hello .duty{max-width:460px;color:var(--muted);font-size:13px;line-height:20px}
.mwt-hello .mwt-chips{justify-content:center;margin-top:16px;max-width:560px}
/* Working: the teammate's avatar breathing at the end of the transcript, the step beside it. */
.mwt-working{display:flex;align-items:center;gap:8px;min-height:32px}
.mwt-working .step{min-width:0;color:var(--muted);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.mwt-older{appearance:none;align-self:center;padding:4px 8px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--muted);font:inherit;font-size:13px;cursor:pointer}
.mwt-older:hover{color:var(--fg);background:var(--surface)}
.mwt-older[disabled]{opacity:.5;cursor:default}
.mwt-center{align-self:center;max-width:100%;color:var(--meta);font-size:12px;line-height:16px;font-variant-numeric:tabular-nums;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
button.mwt-center{appearance:none;padding:4px 8px;border:0;border-radius:var(--radius-sm);background:transparent;font:inherit;font-size:12px;cursor:pointer}
button.mwt-center:hover{color:var(--fg);background:var(--surface)}
.mwt-failed{color:var(--danger);font-size:13px;line-height:1.6}
.mwt-queued{color:var(--meta);font-size:13px;line-height:1.6}
/*
 * A delivery is a file strip, no box: a 1px rule at its left and 16 of air. Title 16 / 600, a one-sentence deck at 65 %,
 * the key figures as one tabular line (value 100 %, label 40 %), the verification word at 40 % (--warn only for the
 * newest run's issues) and, on hover, 有用 / 没用. The title's hit area stretches over the whole strip.
 */
.mwt-deliver{display:flex;flex-direction:column;gap:8px;min-width:0}
.mwt-strips{display:grid;gap:16px;min-width:0}
.mwt-strip{position:relative;display:grid;gap:4px;min-width:0;max-width:620px;padding:0 0 0 16px;border-left:1px solid var(--border)}
.mwt-strip-open{appearance:none;display:block;width:100%;min-width:0;padding:0;border:0;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mwt-strip-open::after{content:"";position:absolute;inset:0;border-radius:4px}
/* No press scale here: a transform would make the button the overlay's containing block and shrink the hit area mid-click. */
.mwt .mwt-strip-open:active{transform:none}
.mwt-strip-open:focus-visible{box-shadow:none}
.mwt-strip-open:focus-visible::after{box-shadow:var(--focus-ring)}
.mwt-strip-open .t{display:block;font-size:16px;line-height:24px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-underline-offset:4px;text-decoration-color:var(--meta)}
.mwt-strip:hover .mwt-strip-open .t{text-decoration-line:underline}
.mwt-strip .deck{margin:0;color:var(--fg-2);font-size:15px;line-height:1.75;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.mwt-strip .figs{margin:0;color:var(--meta);font-size:13px;line-height:20px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mwt-strip .figs b{font-weight:400;color:var(--fg)}
.mwt-strip-meta{display:flex;align-items:center;flex-wrap:wrap;gap:0 8px;min-height:24px;color:var(--meta);font-size:12px;line-height:16px;font-variant-numeric:tabular-nums}
.mwt-strip-meta button,.mwt-strip .mwt-notes{position:relative;z-index:1}
.mwt-verdict{appearance:none;padding:4px 0;border:0;background:transparent;color:var(--meta);font:inherit;text-align:left;cursor:default}
.mwt-verdict[data-tone=warn]{color:var(--warn)}
button.mwt-verdict{cursor:pointer}
button.mwt-verdict:hover{color:var(--fg)}
button.mwt-verdict[data-tone=warn]:hover{color:var(--warn);text-decoration:underline;text-underline-offset:3px}
/* 有用 / 没用: hidden until the run is hovered or focused; once one is chosen they stay. Touch screens always show them. */
.mwt-rate{display:inline-flex;gap:4px;opacity:0;transition:opacity var(--motion-fast) var(--ease-standard)}
.mwt-run:hover .mwt-rate,.mwt-run:focus-within .mwt-rate,.mwt-rate[data-chosen=true],.mwt-rate.always{opacity:1}
@media (hover:none){.mwt-rate{opacity:1}}
.mwt-rate button{appearance:none;height:24px;padding:0 4px;border:0;border-radius:6px;background:transparent;color:var(--meta);font:inherit;font-size:12px;cursor:pointer}
.mwt-rate button:hover,.mwt-rate button[aria-pressed=true]{color:var(--fg)}
.mwt-notes{margin:8px 0 0;font-size:13px;line-height:1.7;color:var(--muted);border-left:2px solid var(--border);padding:0 16px;white-space:pre-wrap;word-break:break-word}
/* Summary rows (the reading view): a compact definition list, label 40 % and value 100 %, the label column at most 40 %. */
.mwt-sum{display:grid;grid-template-columns:fit-content(40%) minmax(0,1fr);gap:4px 16px;margin:0 0 24px;font-size:13px;line-height:20px;font-variant-numeric:tabular-nums}
.mwt-sum dt{margin:0;color:var(--meta);overflow-wrap:anywhere}
.mwt-sum dd{margin:0;color:var(--fg);min-width:0;overflow-wrap:anywhere}
/* 找你卡: the question a run stopped on; settled, it is one line. */
.mwt-askcard{max-width:560px;padding:16px;border:1px solid var(--border);border-radius:20px;background:var(--surface)}
.mwt-askcard .q{font-size:15px;line-height:1.75;color:var(--fg);word-break:break-word}
.mwt-askcard .q code{font-family:var(--font-mono);font-size:13px;background:var(--surface-2);padding:0 4px;border-radius:4px}
.mwt-askcard .q a{color:var(--fg);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--meta)}
.mwt-askcard .detail{margin:8px 0 0;max-height:240px;overflow:auto;padding:8px 16px;border-radius:var(--radius-md);background:var(--surface-2);color:var(--fg-2);font:12px/1.6 var(--font-mono);white-space:pre-wrap;word-break:break-word}
.mwt-askcard .opts{display:grid;gap:8px;margin:16px 0 0}
.mwt-askopt{appearance:none;display:flex;align-items:center;width:100%;min-height:44px;padding:0 16px;border:1px solid var(--border);border-radius:var(--radius-md);background:transparent;color:var(--fg);font:inherit;font-size:15px;line-height:24px;text-align:left;cursor:pointer}
.mwt-askopt:hover{background:var(--surface-2)}
.mwt-askopt[disabled]{opacity:.4;cursor:default;transform:none}
.mwt-askopt[disabled]:hover{background:transparent}
.mwt-askcard .row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:16px 0 0}
.mwt-askcard .row .grow{flex:1;min-width:0}
.mwt-askcard .go{appearance:none;display:inline-flex;align-items:center;gap:4px;padding:0;border:0;background:transparent;color:var(--fg-2);font:inherit;font-size:13px;line-height:20px;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--border)}
.mwt-askcard .go:hover{color:var(--fg)}
.mwt-askcard .go.plain{cursor:default;text-decoration:none;color:var(--muted)}
.mwt-ask-err{max-width:560px;margin:4px 0 0;color:var(--danger);font-size:13px;line-height:20px}
.mwt-askline{display:flex;align-items:center;gap:4px;max-width:560px;min-height:20px;color:var(--meta);font-size:13px;line-height:20px}
.mwt-askline span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 提醒卡: only you can do it; one 知道了. */
.mwt-remind{display:flex;align-items:center;gap:8px;max-width:560px;min-height:52px;padding:8px 8px 8px 16px;border:1px solid var(--border);border-radius:20px;background:var(--surface)}
.mwt-remind .txt{flex:1;min-width:0;font-size:15px;line-height:24px;word-break:break-word}
/* 过程: folded per run, one 12px line at 40 %. */
.mwt-proc-head{appearance:none;display:inline-flex;align-items:center;gap:4px;max-width:100%;padding:4px 0;border:0;background:transparent;color:var(--meta);font:inherit;font-size:12px;line-height:16px;text-align:left;cursor:pointer}
.mwt-proc-head:hover{color:var(--fg)}
.mwt-proc-head .grow{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.mwt-phases{padding:8px 0 4px}
.mwt-phase-head{appearance:none;display:flex;align-items:baseline;gap:8px;width:100%;min-height:28px;padding:4px 0;border:0;background:transparent;color:var(--fg);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:default}
button.mwt-phase-head{cursor:pointer}
button.mwt-phase-head:hover .verb,button.mwt-phase-head:hover .obj{color:var(--fg)}
.mwt-phase-head .verb{flex:none;font-weight:500;color:var(--fg-2);white-space:nowrap}
.mwt-phase-head[data-tone=live] .verb{color:var(--fg)}
.mwt-phase-head[data-tone=danger] .verb{color:var(--danger)}
.mwt-phase-head .meta{flex:none;color:var(--meta);font-variant-numeric:tabular-nums;white-space:nowrap}
.mwt-phase-head .obj{flex:1;min-width:0;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-phase-body{margin:0 0 8px 4px;padding-left:16px;border-left:1px solid var(--border-soft)}
.mwt-phase-note{padding:4px 0;font-size:13px;line-height:1.6;color:var(--fg);cursor:pointer}
.mwt-phase-note .body{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap;word-break:break-word;color:var(--muted)}
.mwt-phase-note.open .body{display:block;color:var(--fg)}
.mwt-phase-note .lbl{color:var(--fg-2);font-weight:500}
.mwt-ev{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;min-height:24px;font-size:13px;line-height:20px}
.mwt-ev .verb{font-weight:500;color:var(--fg-2)}
.mwt-ev[data-ok=false] .verb{color:var(--danger)}
.mwt-ev .obj{color:var(--muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.mwt-ev .result{flex-basis:100%;color:var(--danger);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Composer (Rakazo): a rounded-full pill; a cream circular send; Stop beside it while working. */
.mwt-dock{position:sticky;bottom:0;z-index:3;margin-top:auto;padding:16px 0 24px;background:linear-gradient(to top,var(--bg) 70%,transparent)}
.mwt-say{display:flex;align-items:flex-end;gap:4px;border:1px solid var(--border);border-radius:999px;background:var(--input);padding:4px 4px 4px 16px}
.mwt-say:focus-within{border-color:var(--border-focus)}
.mwt-say textarea{flex:1 1 0;min-width:0;display:block;min-height:32px;max-height:200px;resize:none;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:15px;line-height:24px;padding:4px 0}
.mwt-say textarea::placeholder{color:var(--meta)}
.mwt-say .mwt-btn.round{flex:none}
.mwt-say-err{display:block;color:var(--danger);font-size:12px;padding:4px 0 0}
/* Menu (the header's ···). */
.mwt-menu{position:relative}
.mwt-menu-pop{position:absolute;right:0;top:40px;min-width:160px;padding:4px;border:1px solid var(--border);border-radius:16px;background:var(--surface);box-shadow:var(--elev-raised);z-index:6;display:grid}
.mwt-menu-pop button{appearance:none;display:flex;align-items:center;height:32px;padding:0 8px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--fg);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.mwt-menu-pop button:hover{background:var(--surface-2)}
/* Right panel: beside the thread as a grid column when the page has room, else a slide-over at its right edge (no mask). */
.mwt-aside{display:flex;flex-direction:column;min-height:0;background:var(--surface)}
.mwt-aside.col{position:sticky;top:0;align-self:start;background:var(--bg);border-left:1px solid var(--border);overflow:hidden}
.mwt-aside-head{display:flex;align-items:center;gap:8px;flex:none;height:52px;padding:0 8px 0 16px;border-bottom:1px solid var(--border)}
.mwt-aside-head .title{flex:1;min-width:0;color:var(--fg);font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-aside-head .mwt-btn.round{width:28px;height:28px}
.mwt-aside-body{flex:1;min-height:0;overflow:auto;padding:16px}
.mwt-aside-dock{position:sticky;top:0;height:0;z-index:6}
.mwt-aside-clip{position:absolute;top:0;right:0;display:flex;justify-content:flex-end;width:min(${ASIDE_W + 24}px,100%);overflow:hidden;pointer-events:none}
.mwt-aside.over{width:min(${ASIDE_W}px,100%);height:100%;border-left:1px solid var(--border);box-shadow:var(--elev-raised);pointer-events:auto;transform:translateX(100%);visibility:hidden;transition:transform var(--motion-fast) var(--ease-standard),visibility 0s linear var(--motion-fast)}
.mwt-aside.over[data-open=true]{transform:none;visibility:visible;transition:transform var(--motion-fast) var(--ease-standard),visibility 0s}
.mwt-sec{padding:8px 0 16px}
.mwt-sec+.mwt-sec{border-top:1px solid var(--border-soft);padding-top:16px}
.mwt-sec h2{display:flex;align-items:center;gap:4px;margin:0 0 8px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:.02em;color:var(--meta)}
.mwt-sec h2 .grow{flex:1}
.mwt-sec h2 .mwt-btn.round{width:24px;height:24px}
/* 电脑 folder: 表格 first, then 文件, each under a small label. */
.mwt-flabel{margin:8px 0 4px 8px;font-size:12px;line-height:16px;color:var(--meta)}
.mwt-flabel:first-child{margin-top:0}
.mwt-alist{display:grid}
.mwt-arow{appearance:none;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:8px;align-items:center;width:100%;min-height:40px;padding:8px;border:0;border-radius:16px;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.mwt-arow.ic{grid-template-columns:16px minmax(0,1fr) auto}
.mwt-arow:hover,.mwt-arow[aria-expanded=true]{background:var(--surface-2)}
.mwt-arow.static{cursor:default}
.mwt-arow.static:hover{background:transparent}
.mwt-arow .ic{display:flex;align-items:center;justify-content:center;color:var(--meta)}
.mwt-arow .main{min-width:0;display:grid}
.mwt-arow .t{font-size:13px;line-height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-arow .s{font-size:12px;line-height:16px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-arow .m{font-size:12px;color:var(--meta);white-space:nowrap;font-variant-numeric:tabular-nums}
.mwt-arow .m[data-tone=danger]{color:var(--danger)}
.mwt-arow[data-off=true] .t{color:var(--meta)}
.mwt-rdetail{margin:4px 0 8px;padding:8px;border:1px solid var(--border);border-radius:18px;background:var(--bg)}
.mwt-rdetail .acts{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 4px}
.mwt-rdetail .runs{margin:8px 0 0;border-top:1px solid var(--border-soft);padding-top:8px}
.mwt-confirm{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0;padding:8px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);font-size:13px}
.mwt-confirm>span{flex:1;min-width:120px}
/* Fields */
.mwt-field{display:grid;gap:4px;margin:0 0 16px}
.mwt-field>span{font-size:12px;line-height:16px;color:var(--muted)}
.mwt-input{display:block;width:100%;padding:8px 16px;border:1px solid var(--border);border-radius:999px;background:var(--input);color:var(--fg);font:inherit;font-size:13px;line-height:20px;transition:border-color var(--motion-fast) var(--ease-standard)}
.mwt-input:focus{border-color:var(--border-focus)}
.mwt-input::placeholder{color:var(--meta)}
textarea.mwt-input{resize:vertical;min-height:72px;line-height:1.6;border-radius:16px}
/* 新同事: three examples under 「它负责什么」 that fill the field. */
.mwt-examples{display:grid;justify-items:start;gap:8px;margin:-8px 0 16px}
.mwt-examples .mwt-chip{white-space:normal;text-align:left;border-radius:12px;border-color:var(--border);background:transparent}
.mwt-examples .mwt-chip:hover{background:var(--surface-2)}
.mwt-switch-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:36px;font-size:13px}
.mwt-switch{appearance:none;position:relative;flex:none;width:32px;height:18px;padding:0;border:0;border-radius:9px;background:var(--border);cursor:pointer}
.mwt-switch::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--meta);transition:transform var(--motion-fast) var(--ease-standard)}
.mwt-switch[aria-checked=true]{background:var(--fg-2)}
.mwt-switch[aria-checked=true]::after{background:var(--bg);transform:translateX(14px)}
.mwt-field-err{color:var(--danger);font-size:12px;margin:-8px 0 8px}
/* Lists on the files page: one row recipe. */
.mwt-filters{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:0 0 16px}
.mwt-search{display:flex;align-items:center;gap:8px;flex:1 1 180px;min-width:0;max-width:320px;height:32px;padding:0 16px;border:1px solid var(--border);border-radius:999px;background:var(--input);color:var(--meta)}
.mwt-search:focus-within{border-color:var(--border-focus)}
.mwt-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--fg);font:inherit;font-size:13px}
.mwt-search input::-webkit-search-cancel-button{-webkit-appearance:none}
.mwt-list{display:grid;border:1px solid var(--border);border-radius:18px;overflow:hidden;background:var(--surface)}
.mwt-row{appearance:none;display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;column-gap:16px;min-height:48px;padding:8px 16px;border:0;border-top:1px solid var(--border-soft);background:transparent;color:inherit;font:inherit;text-align:left;width:100%;cursor:pointer}
.mwt-row:first-child{border-top:0}
.mwt-row:hover{background:var(--surface-2)}
.mwt-row:focus-visible{box-shadow:inset var(--focus-ring);border-radius:0}
.mwt-row .ic{display:flex;align-items:center;justify-content:center;color:var(--meta)}
.mwt-row .t{min-width:0;font-size:15px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-row .m{color:var(--meta);font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums}
/*
 * Reading view: a deliverable opened in the centre column. A small way back, the title 20 / 600, a meta line at 40 % with
 * text buttons, then the body at 16 / 1.8 on a 680 measure; headings 16 / 600 with 32 above and 8 below; tables 13 with
 * tabular figures, scrolling sideways; links underlined at 40 %.
 */
.mwt-read{width:100%;max-width:680px;margin:0 auto;padding:16px 0 48px}
.mwt-read-back{appearance:none;display:inline-flex;align-items:center;gap:4px;height:32px;margin:0 0 24px -8px;padding:0 8px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--muted);font:inherit;font-size:13px;cursor:pointer}
.mwt-read-back:hover{color:var(--fg);background:var(--surface)}
.mwt-read h1{margin:0 0 8px;font-size:20px;line-height:1.4;font-weight:600;word-break:break-word}
.mwt-read-meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;margin:0 0 32px;color:var(--meta);font-size:13px;line-height:20px;font-variant-numeric:tabular-nums}
.mwt-read-meta .mwt-verdict{padding:0}
.mwt-read>.mwt-notes{margin:-16px 0 32px}
.mwt-read .mwt-md{font-size:16px;line-height:1.8}
.mwt-read .mwt-md p{max-width:none;margin:0 0 16px}
.mwt-read .mwt-md h1,.mwt-read .mwt-md h2,.mwt-read .mwt-md h3,.mwt-read .mwt-md h4,.mwt-read .mwt-md h5,.mwt-read .mwt-md h6{margin:32px 0 8px;font-size:16px;line-height:1.6;font-weight:600}
.mwt-read .mwt-md table{display:block;max-width:100%;overflow-x:auto;border:1px solid var(--border);border-radius:8px;font-size:13px;font-variant-numeric:tabular-nums}
.mwt-read .mwt-md th{font-size:12px}
.mwt-read .mwt-md a{text-decoration-color:var(--meta)}
.mwt-read-end{display:flex;align-items:center;gap:8px;margin:32px 0 0;padding-top:16px;border-top:1px solid var(--border-soft);color:var(--meta);font-size:12px}
/* Markdown */
.mwt-md{font-size:15px;line-height:1.75;color:var(--fg)}
.mwt-md>:first-child{margin-top:0}
.mwt-md h2,.mwt-md h3,.mwt-md h4{margin:24px 0 8px;font-weight:600;line-height:1.4}
.mwt-md h2{font-size:18px}.mwt-md h3{font-size:16px}.mwt-md h4{font-size:15px}
.mwt-md p{margin:0 0 16px;max-width:65ch}.mwt-md ul,.mwt-md ol{margin:0 0 16px;padding-left:24px}.mwt-md li{margin:4px 0}
.mwt-md code{font-family:var(--font-mono);font-size:13px;background:var(--surface-2);padding:0 4px;border-radius:4px}
.mwt-md pre{background:var(--bg);border-radius:var(--radius-md);padding:8px 16px;overflow:auto;margin:0 0 16px}.mwt-md pre code{background:transparent;padding:0}
.mwt-md table{border-collapse:collapse;margin:0 0 16px;font-size:13px;font-variant-numeric:tabular-nums}
.mwt-md th,.mwt-md td{padding:8px 16px;text-align:left;border-bottom:1px solid var(--border-soft)}
.mwt-md th{font-weight:500;color:var(--muted);font-size:12px;letter-spacing:.02em;background:var(--surface-2)}
.mwt-md blockquote{margin:0 0 16px;padding:0 16px;border-left:2px solid var(--border);color:var(--muted)}
.mwt-md hr{border:0;border-top:1px solid var(--border-soft);margin:24px 0}
.mwt-md a{color:var(--fg);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--meta)}
.mwt-md strong{font-weight:600}
/* Toasts (a floating layer: the one place besides menus and the slide-over that casts a shadow). */
.mwt-toasts{position:fixed;right:16px;bottom:16px;z-index:10050;display:grid;gap:8px;max-width:380px;padding:0!important;height:auto!important;overflow:visible!important;background:transparent!important}
.mwt-toast{display:grid;grid-template-columns:28px minmax(0,1fr) auto;column-gap:8px;align-items:center;padding:8px 8px 8px 16px;border:1px solid var(--border);border-radius:18px;background:var(--surface);color:var(--fg);box-shadow:var(--elev-raised);font-size:13px;line-height:20px}
.mwt-toast b{display:block;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mwt-toast span.sub{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
@media (max-width:720px){
  .mwt-page{padding:24px 16px 48px}
  .mwt-page.mate{padding:0 16px}
  .mwt-title h1{font-size:24px}
  .mwt-toasts{left:16px;right:16px;bottom:16px;max-width:none}
  .mwt-dock{padding:8px 0 calc(8px + env(safe-area-inset-bottom))}
}
`

// ---- state ------------------------------------------------------------------
// `state` is replaced, never mutated: useSyncExternalStore compares snapshots by identity.
const EMPTY_ACTIVITY = { needs: [], working: [], recent: [] }
let state = { mates: [], activity: EMPTY_ACTIVITY, loadedAt: 0, error: '' }
const listeners = new Set()
function setState(patch) { state = { ...state, ...patch }; for (const fn of listeners) fn() }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function getSnapshot() { return state }
async function api(path, body) {
  const res = await fetch(API + path, body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || (data && data.error)) throw new Error((data && data.error) || ('HTTP ' + res.status))
  return data || {}
}
const itemKey = (x) => (x.kind || '') + '|' + (x.runId || '') + '|' + (x.at || '')
/** Activity items seen so far (toasts fire for the ones a poll brings that were not there before). */
let seenItems = null
const itemListeners = new Set() // (item) => void
let refreshing = null
let refreshAgain = null
/**
 * Fetch /mates and /activity. A call while a fetch is in flight gets one more fetch after it (shared by every caller that
 * came meanwhile), so whoever just changed something reads a snapshot taken after the change.
 */
function refresh() {
  if (refreshing) {
    if (!refreshAgain) refreshAgain = refreshing.then(() => { refreshAgain = null; return refresh() })
    return refreshAgain
  }
  const started = Date.now()
  refreshing = Promise.all([api('/mates'), api('/activity').catch(() => null)]).then(([m, a]) => {
    const got = Array.isArray(m.items) ? m.items : []
    // A teammate added here after this fetch started (just created) stays until a later fetch has it.
    const mates = [...got, ...state.mates.filter((x) => x.addedAt > started && !got.some((y) => y.id === x.id))]
    const activity = a && typeof a === 'object' ? { needs: a.needs || [], working: a.working || [], recent: a.recent || [] } : state.activity
    // loadedAt is when the snapshot was asked for: a navigation made after it may name a teammate it does not have yet.
    setState({ mates, activity, error: '', loadedAt: started })
    fire('mywork:mates-updated', { items: mates, activity })
    prefetchThreads(mates)
    const fresh = [...activity.needs, ...activity.recent].filter((x) => x && x.runId)
    if (seenItems) {
      for (const x of fresh) if (!seenItems.has(itemKey(x))) for (const fn of itemListeners) { try { fn(x) } catch {} }
    }
    seenItems = new Set([...(seenItems || []), ...fresh.map(itemKey)])
  }).catch((e) => { setState({ error: e.message || String(e) }) }).finally(() => { refreshing = null })
  return refreshing
}
let pollTimer = null
let pollUsers = 0
function schedulePoll() {
  clearTimeout(pollTimer)
  if (pollUsers <= 0) return
  const busy = state.mates.some((x) => x.state === 'working')
  pollTimer = setTimeout(() => { refresh().then(schedulePoll) }, busy ? FAST_MS : SLOW_MS)
}
const kick = () => refresh().then(schedulePoll)
function usePolling() {
  React.useEffect(() => {
    pollUsers += 1
    kick()
    const onFocus = () => { kick() }
    window.addEventListener('focus', onFocus)
    return () => { pollUsers -= 1; window.removeEventListener('focus', onFocus); if (pollUsers <= 0) clearTimeout(pollTimer) }
  }, [])
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
function useTick(on) {
  const [, set] = React.useState(0)
  React.useEffect(() => { if (!on) return; const id = setInterval(() => set((n) => n + 1), 1000); return () => clearInterval(id) }, [on])
}

// Navigation: one small store the pages read; `seq` moves on every request so a repeat request is heard too.
// The open teammate is sticky: kept here and in sessionStorage, so a remount (sidebar expanded, page switched) reopens it.
const MATE_KEY = 'dsh-mywork:mate'
function storedMate() { try { return sessionStorage.getItem(MATE_KEY) || '' } catch { return '' } }
function storeMate(id) { try { if (id) sessionStorage.setItem(MATE_KEY, id); else sessionStorage.removeItem(MATE_KEY) } catch {} }
let nav = { seq: 0, at: 0, mateId: storedMate(), runId: '', aside: null, fileId: '' }
const navSubs = new Set()
function setNav(patch) {
  nav = { mateId: nav.mateId, runId: '', aside: null, fileId: '', ...patch, seq: nav.seq + 1, at: Date.now() }
  if (patch && 'mateId' in patch) storeMate(nav.mateId)
  for (const fn of navSubs) { try { fn() } catch {} }
}
function subscribeNav(fn) { navSubs.add(fn); return () => navSubs.delete(fn) }
const getNav = () => nav
const useNavState = () => React.useSyncExternalStore(subscribeNav, getNav, getNav)
/** The last nav request a mate page has acted on (so a remount does not replay an old jump). */
let consumedSeq = 0

// ---- helpers ----------------------------------------------------------------
function fmtDuration(ms) {
  if (!(ms > 0)) return '0s'
  const s = Math.round(ms / 1000)
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm ' + (s % 60) + 's'
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm'
}
function elapsedOf(r) { return fmtDuration(new Date(r.finishedAt || new Date().toISOString()) - new Date(r.startedAt || r.createdAt)) }
const pad2 = (n) => String(n).padStart(2, '0')
function fmtSize(n) {
  const b = Number(n)
  if (!Number.isFinite(b) || b < 0) return ''
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}
function hhmm(iso) { const d = new Date(iso); return Number.isFinite(d.getTime()) ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : '' }
function isToday(iso) { if (!iso) return false; const d = new Date(iso); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate() }
/** HH:MM today, M/D HH:MM otherwise. */
function fmtWhen(iso) { if (!iso) return ''; const d = new Date(iso); if (!Number.isFinite(d.getTime())) return ''; return isToday(iso) ? hhmm(iso) : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hhmm(iso) }
/** A question as plain words (toasts, notifications, tooltips): the inline Markdown marks go, link text stays. */
function plainWords(text) { return String(text || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*|__|`/g, '').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1$2') }
function cssEsc(s) { return typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, '\\$&') }
/** Is this teammate's thread on screen right now (its toasts stay quiet)? */
function mateOnScreen(id) {
  try {
    if (typeof document === 'undefined' || document.visibilityState === 'hidden') return false
    const el = document.querySelector('[data-mwt-mate="' + cssEsc(id) + '"]')
    return !!el && el.getClientRects().length > 0
  } catch { return false }
}
/**
 * An entry of the `mywork.thread.aside` slot as this page uses it: { id, order, title, when }. dsh 0.1.6 keeps only
 * id / order / label on `options`, so `when` and `title` are also looked up on the entry and on the component.
 */
function asideEntry(e) {
  if (!e || !e.options) return null
  const o = e.options
  const c = e.component || {}
  const when = [o.when, e.when, c.when].find((f) => typeof f === 'function') || null
  const title = [o.title, o.label, c.title].find((x) => x !== undefined && x !== null)
  return { id: o.id, order: Number(o.order) || 0, when, title }
}
/** Per teammate: 'open' or 'closed' (closed by hand: the panel never opens by itself again for it). */
function asideMemory(id) { try { const m = JSON.parse(localStorage.getItem(ASIDE_KEY) || '{}'); return m && typeof m === 'object' ? m[id] : undefined } catch { return undefined } }
function rememberAside(id, value) {
  try {
    const raw = JSON.parse(localStorage.getItem(ASIDE_KEY) || '{}')
    const m = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    delete m[id]; m[id] = value
    const keys = Object.keys(m)
    for (const k of keys.slice(0, Math.max(0, keys.length - 200))) delete m[k]
    localStorage.setItem(ASIDE_KEY, JSON.stringify(m))
  } catch {}
}
/** The element's inner size, kept current (ResizeObserver; window resize where there is none). */
function useBox(ref) {
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => setBox((prev) => (prev.w === el.clientWidth && prev.h === el.clientHeight ? prev : { w: el.clientWidth, h: el.clientHeight }))
    read()
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', read); return () => window.removeEventListener('resize', read) }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return box
}
function Skeleton({ rows }) { return h('div', { className: 'mwt-sk-rows', 'aria-busy': 'true' }, Array.from({ length: rows || 3 }, (_, i) => h('span', { key: i, className: 'mwt-sk ' + (i % 2 ? 'short' : 'mid') }))) }
function fire(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })) } catch {} }
/** One plain line per tool call: a verb and the thing it touched; the raw arguments stay in the tooltip. */
function describeTool(name, detail) {
  let kv = {}
  const raw = String(detail || '').trim()
  if (raw.startsWith('{')) { try { kv = JSON.parse(raw) } catch { try { kv = JSON.parse(raw.replace(/[,\s]*…?$/, '').replace(/,\s*"[^"]*$/, '') + '}') } catch { kv = {} } } }
  if (!kv || typeof kv !== 'object') kv = {}
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
  if (n === 'mywork_routine_create') return { verb: '安排', obj: String(kv.input || kv.title || '').slice(0, 70) }
  if (n === 'mywork_mate_update') return { verb: '改名片', obj: String(kv.name || kv.title || '').slice(0, 40) }
  if (n === 'mywork_remember') return { verb: '记下', obj: String(kv.text || kv.note || '').slice(0, 70) }
  if (n === 'mywork_ask') return { verb: '问你', obj: String(kv.question || '').slice(0, 70) }
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
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + md.esc(d.title) + '</title><style>' + css + '</style></head><body><h1>' + md.esc(d.title) + '</h1><p class="meta">' + md.esc(fmtWhen(d.createdAt)) + '</p>' + md.render(d.markdown || '') + '</body></html>')
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch {} }, 300)
}
function safeName(s) { return String(s || 'deliverable').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'deliverable' }
const defaultMateOf = (mates) => (mates || []).find((m) => m.isDefault) || mateOrder(mates)[0] || null
const fileGlyph = (d) => (d && (d.kind === 'sheet' || d.kind === 'table') ? 'sheet' : d && d.kind === 'report' ? 'file-text' : 'file')

/** Rakazo's bot palette (packages/core bot-avatar-colors): light → dark, eye colour. The light one is the identity colour. */
const AVATAR_COLORS = [['#A97EFE', '#7C3AED', '#FFFFFF'], ['#00C972', '#059669', '#FFFFFF'], ['#FF781C', '#EA580C', '#FFFFFF'], ['#1CC3B0', '#0284C7', '#FFFFFF'], ['#2A92FE', '#1D4ED8', '#FFFFFF'], ['#FFAF38', '#D97706', '#141414'], ['#A27952', '#78350F', '#FFFFFF'], ['#FF3E51', '#BE123C', '#FFFFFF'], ['#FF5EB1', '#BE185D', '#FFFFFF'], ['#94A3B8', '#475569', '#FFFFFF']]
/** A colour with its saturation and lightness lowered by 15 % (HSL): the same identity, receding behind the content. */
function calmHex(hex) {
  const n = parseInt(String(hex).slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let hue = 0
  if (d) hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  hue = (hue * 60 + 360) % 360
  const l0 = (max + min) / 2
  const s0 = d ? d / (1 - Math.abs(2 * l0 - 1)) : 0
  const s = s0 * 0.85, l = l0 * 0.85
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hue / 60) % 2) - 1)), m = l - c / 2
  const [r1, g1, b1] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x]
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return '#' + to(r1) + to(g1) + to(b1)
}
const AVATAR_CALM = AVATAR_COLORS.map(([light]) => calmHex(light))
/** Rakazo's shippedHash (FNV-1a). */
function avatarHash(v) { let x = 2166136261; for (let i = 0; i < v.length; i++) x = Math.imul(x ^ v.charCodeAt(i), 16777619); return x >>> 0 }
/** Simple stand-ins for Rakazo's shapes, in a 100 box: blob, squircle, pebble. */
const AVATAR_SHAPES = ['M50 4a46 46 0 1 1 0 92a46 46 0 1 1 0-92Z', 'M34 4h32c20 0 30 10 30 30v32c0 20-10 30-30 30H34C14 96 4 86 4 66V34C4 14 14 4 34 4Z', 'M50 8c28 0 46 14 46 40s-18 44-46 44S4 74 4 48 22 8 50 8Z']
/**
 * A teammate's avatar: a flat shape in its identity colour (picked from its id; the calmer version unless `full`) with
 * two eyes; MyWork keeps its mark in the same frame. `working` breathes it (opacity 1 ↔ .55 over 2.4 s; static .7 under
 * reduced motion).
 */
function Avatar({ mate, size, working, full }) {
  const s = size || 28
  const m = mate || {}
  if (m.isDefault) {
    return h('span', { className: 'mwt-av', 'data-working': working ? 'true' : undefined, 'aria-hidden': 'true' },
      h('svg', { viewBox: '0 0 100 100', width: s, height: s },
        h('circle', { cx: 50, cy: 50, r: 46, fill: 'var(--av-bg, #1f1d1a)' }),
        h('svg', { x: 20, y: 20, width: 60, height: 60, viewBox: '0 0 24 24', fill: 'none' },
          h('path', { d: 'M4.5 18.5V7l5.5 6.5L15.5 7M10.5 17l3 3 6-6', stroke: 'var(--av-fg, #faf7f0)', strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' }))))
  }
  const hash = avatarHash(String(m.id || m.name || 'mate'))
  const i = hash % AVATAR_COLORS.length
  const fill = full ? AVATAR_COLORS[i][0] : AVATAR_CALM[i]
  const shape = AVATAR_SHAPES[(Math.imul(hash ^ (hash >>> 16), 73244475) >>> 0) % AVATAR_SHAPES.length]
  return h('span', { className: 'mwt-av', 'data-working': working ? 'true' : undefined, 'aria-hidden': 'true' },
    h('svg', { viewBox: '0 0 100 100', width: s, height: s },
      h('path', { d: shape, fill }),
      h('g', { fill: AVATAR_COLORS[i][2] }, h('ellipse', { cx: 37.3, cy: 46.5, rx: 4.4, ry: 3.1 }), h('ellipse', { cx: 62.7, cy: 46.5, rx: 4.4, ry: 3.1 }))))
}

/** An ISO time as epoch ms (0 when missing). */
const ms = (iso) => { const n = iso ? new Date(iso).getTime() : NaN; return Number.isFinite(n) ? n : 0 }
/**
 * When this browser last had each teammate's thread open (localStorage, newest 200): the server only says unread or not,
 * so 「以下是新的」 reads the previous visit from here (taken before the visit overwrites it).
 */
const SEEN_KEY = 'dsh-mywork:seen-at'
function clientSeenAt(id) { try { const m = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); return m && typeof m[id] === 'string' ? m[id] : '' } catch { return '' } }
function rememberSeen(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
    const m = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    delete m[id]; m[id] = new Date().toISOString()
    const keys = Object.keys(m)
    for (const k of keys.slice(0, Math.max(0, keys.length - 200))) delete m[k]
    localStorage.setItem(SEEN_KEY, JSON.stringify(m))
  } catch {}
}
/** When a run last asked for attention (the server's attentionOf): finished, a failed verification, a question pending. */
function attentionMs(r) {
  let best = 0
  if (r.status === 'done') best = Math.max(best, ms(r.finishedAt))
  if (r.verification && r.verification.passed === false) best = Math.max(best, ms(r.verification.at))
  if (r.status === 'waiting') for (const e of Array.isArray(r.activity) ? r.activity : []) if (e && e.kind === 'ask') best = Math.max(best, ms(e.at))
  return best
}
/** Markdown as one line of plain words: fences, list and heading marks, table pipes and inline marks gone. */
function plainOf(text) { return plainWords(String(text || '').replace(/```[\s\S]*?```/g, ' ')).replace(/^\s*(#{1,6}|[-*+]|\d+[.、]|>)\s*/gm, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim() }
/** The first sentence of some text, as plain words ('' when none). */
function firstSentence(text) {
  const plain = plainOf(text)
  const m = plain.match(/^.+?[。！？!?](?=\s|$|[^。！？!?])|^.+?\.(?=\s|$)/)
  return (m ? m[0] : plain).trim()
}
/** A document's body without its own leading 「# title」 line when the page already shows that title above it. */
function withoutTitle(markdown, title) {
  const text = String(markdown || '')
  const m = text.match(/^\s*#\s+([^\n]+)\n+/)
  const a = m ? m[1].trim() : '', b = String(title || '').trim()
  return m && b && (a.startsWith(b) || b.startsWith(a)) ? text.slice(m[0].length) : text
}
/**
 * The key figures of a deliverable: the summary rows whose value starts with a number, as { value, label }, value cut to
 * the number and a short unit (「3 份」, 「15 条」); five at most.
 */
function figuresOf(d) {
  const out = []
  for (const r of Array.isArray(d && d.summary) ? d.summary : []) {
    const m = String(r && r.value !== undefined && r.value !== null ? r.value : '').match(/^\s*(\d+(?:[.,]\d+)?)(?![.\d])(\s*)([^\s\d,，、;；.。:：（(]{0,2})/)
    if (!m || !String(r.label || '').trim()) continue
    out.push({ value: m[1] + (m[3] ? m[2] + m[3] : ''), label: String(r.label).trim() })
    if (out.length >= 5) break
  }
  return out
}

/**
 * Reply bubbles that first show up while a thread is open, in a run it watched working (or one started meanwhile): they
 * enter over 200 ms (opacity, 6 px rise). The first pass only takes note of what is there. Returns a test by
 * `runId:entryKey`; the mark lapses after a second, so a later remount does not replay it.
 */
function useArrivals(runs, lists, ready) {
  const ref = React.useRef(null)
  if (!ref.current) ref.current = { since: Date.now(), live: new Set(), shown: new Set(), until: new Map(), runs: null, primed: false }
  const w = ref.current
  if (ready && w.runs !== runs) {
    w.runs = runs
    const now = Date.now()
    for (const run of runs) {
      const watched = w.live.has(run.id) || (w.primed && ms(run.createdAt) >= w.since - 2000)
      for (const e of lists.get(run.id) || []) {
        if (e.kind !== 'deliver' && e.kind !== 'text') continue
        const k = run.id + ':' + e.key
        if (w.shown.has(k)) continue
        w.shown.add(k)
        if (w.primed && watched) w.until.set(k, now + 1000)
      }
      if (isLive(run)) w.live.add(run.id)
    }
    w.primed = true
  }
  return (k) => (w.until.get(k) || 0) > Date.now()
}

// ---- components -------------------------------------------------------------
function makeComponents(ctx, t) {
  const selectPanel = (id) => { try { if (ctx.layout && typeof ctx.layout.selectPanel === 'function') ctx.layout.selectPanel(id) } catch (e) { console.warn(`[${PLUGIN}] selectPanel`, e) } }

  const openMate = (id, runId, aside) => { setNav({ mateId: id ? String(id) : '', runId: runId ? String(runId) : '', aside: aside || null }); selectPanel(PANELS.mate) }
  const openNewMate = () => { setNav({ aside: { mode: 'new-mate' } }); selectPanel(PANELS.mate) }
  const openFiles = (id) => { setNav({ fileId: id ? String(id) : '' }); selectPanel(PANELS.files) }
  const openRoutine = (id, mateId) => {
    const go = (mid) => openMate(mid, '', { mode: 'mate', section: 'routines', routineId: String(id) })
    if (mateId) { go(mateId); return }
    api('/routines').then((d) => { const r = (d.items || []).find((x) => x.id === id); go(r && r.mateId ? r.mateId : '') }).catch(() => go(''))
  }

  // 电脑: the entries other members register into the mate page's `mywork.thread.aside` slot, re-read on every change.
  const asideSubs = new Set()
  const readAside = () => {
    let list = []
    try { list = typeof ctx.slots.entriesOfSlot === 'function' ? ctx.slots.entriesOfSlot(ASIDE_SLOT) : ctx.slots.entries(ASIDE_SLOT) } catch { list = [] }
    return (Array.isArray(list) ? list : []).map(asideEntry).filter(Boolean).sort((a, b) => a.order - b.order)
  }
  const notifyAside = () => { for (const fn of asideSubs) { try { fn() } catch {} } }
  const useAsideEntries = () => {
    const [list, setList] = React.useState(readAside)
    React.useEffect(() => { const fn = () => setList(readAside()); asideSubs.add(fn); fn(); return () => { asideSubs.delete(fn) } }, [])
    return list
  }

  /** Summary rows as a compact definition list: label at 40 %, value at 100 %, tabular numerals, no colour. */
  function SumList({ rows }) {
    if (!Array.isArray(rows) || !rows.length) return null
    return h('dl', { className: 'mwt-sum' }, rows.map((r, i) => h(React.Fragment, { key: i }, h('dt', null, r.label), h('dd', null, r.value === undefined || r.value === null ? '' : String(r.value)))))
  }
  /** The verification in words: 核验中 / 已核验 · 核对 n · 问题 m / 核验发现 n 处 / 未能核验 ('' when there is nothing to say). */
  const verifyText = (v) => (!v ? '' : v.kind === 'verifying' ? t('verifying')
    : v.kind === 'passed' ? [t('verified'), t('checked') + ' ' + v.checked, t('issues') + ' ' + v.issues].join(' · ')
    : v.kind === 'issues' ? t('verifyFound').replace('{n}', String(v.issues || 0))
    : v.kind === 'none' ? t('verifyNone') : '')
  const verifyWord = (v) => (v && v.kind === 'passed' ? t('verified') : v && v.kind === 'issues' ? t('verifyIssues') : v && v.kind === 'none' ? t('verifyNone') : v && v.kind === 'verifying' ? t('verifying') : '')
  /**
   * The verification word at 40 %; --warn only when `warn` (issues found on the thread's newest run). With the verifier's
   * notes it is a button that opens them; without, plain words (a click on them reaches the strip under them).
   */
  function Verdict({ v, warn, open, onToggle }) {
    const text = verifyText(v)
    if (!text) return null
    const tone = warn && v.kind === 'issues' ? 'warn' : undefined
    if (!(v.notes && v.kind !== 'verifying')) return h('span', { className: 'mwt-verdict', 'data-tone': tone }, text)
    return h('button', { type: 'button', className: 'mwt-verdict', 'data-tone': tone, 'aria-expanded': !!open, onClick: onToggle }, text)
  }
  /** 有用 / 没用: in the thread hidden until the run is hovered or focused (CSS); shown once one is chosen, or `always`. */
  function Rating({ d, onRate, always }) {
    return h('span', { className: 'mwt-rate' + (always ? ' always' : ''), 'data-chosen': d.rating === 1 || d.rating === -1 },
      h('button', { type: 'button', 'aria-pressed': d.rating === 1, onClick: () => onRate(d, 1) }, t('ratingGood')),
      h('button', { type: 'button', 'aria-pressed': d.rating === -1, onClick: () => onRate(d, -1) }, t('ratingBad')))
  }
  /**
   * A file strip, the delivery's register in the thread: the title (16 / 600), a one-sentence deck at 65 %, the key
   * figures (value, then label), the verification word, 有用 / 没用 on hover. No box, a 1px rule at its left. The title's
   * hit area covers the whole strip, so a click anywhere on it opens the reading view.
   */
  function Strip({ d, deck, verify, warn, onOpen, onRate }) {
    const [notes, setNotes] = React.useState(false)
    const figs = figuresOf(d)
    const v = verify || { kind: '' }
    return h('div', { className: 'mwt-strip' },
      h('button', { type: 'button', className: 'mwt-strip-open', onClick: () => onOpen(d) }, h('span', { className: 't' }, d.title || d.id)),
      deck ? h('p', { className: 'deck' }, deck) : null,
      figs.length ? h('p', { className: 'figs' }, figs.map((f, i) => h(React.Fragment, { key: i }, i ? ' · ' : '', h('b', null, f.value), ' ' + f.label))) : null,
      h('div', { className: 'mwt-strip-meta' },
        h(Verdict, { v, warn, open: notes, onToggle: () => setNotes(!notes) }),
        h(Rating, { d, onRate })),
      notes && v.notes ? h('div', { className: 'mwt-notes' }, v.notes) : null)
  }
  /**
   * One segment's delivery: its reply in a bubble above when it says more than one sentence, then a strip per file. A
   * one-sentence reply is the first strip's deck; otherwise each deck is its file's first sentence.
   */
  function DeliverEntry({ ds, text, verify, warn, arrive, onOpen, onRate }) {
    const lead = firstSentence(text)
    const long = plainOf(text).length > lead.length + 1
    return h('div', { className: 'mwt-deliver' + (arrive ? ' mwt-arrive' : '') },
      long ? h('div', { className: 'mwt-turn ai bubble' }, h(Markdown, { text })) : null,
      h('div', { className: 'mwt-strips' }, ds.map((d, i) => h(Strip, { key: d.id || i, d, deck: !long && i === 0 && lead ? lead : firstSentence(d.excerpt), verify, warn, onOpen, onRate }))))
  }
  /**
   * The reading view: a deliverable opened in the centre column (the mate page swaps its column for it, the files page
   * its list). A small way back, the title, a meta line at 40 % (teammate · time · verification, then text buttons), the
   * summary rows, the body; 有用 / 没用 at the end. Escape goes back too.
   */
  function ReadingView({ id, mates, backLabel, onBack, fromFiles, newestRunId, onRated }) {
    const [data, setData] = React.useState(null)
    const [notes, setNotes] = React.useState(false)
    React.useEffect(() => { let on = true; setData(null); api('/deliverable?id=' + encodeURIComponent(id)).then((x) => { if (on) setData(x || {}) }).catch(() => { if (on) setData({}) }); return () => { on = false } }, [id])
    const back = React.useRef(onBack); back.current = onBack
    React.useEffect(() => {
      const onKey = (ev) => {
        if (ev.key !== 'Escape' || ev.defaultPrevented) return
        const el = ev.target
        if (el && typeof el.closest === 'function' && el.closest('input, textarea, .mwt-aside, .mwt-menu')) return
        ev.preventDefault()
        back.current()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [])
    const d = data && data.deliverable ? data.deliverable : null
    const run = data && (data.run || data.task) ? (data.run || data.task) : null
    const mateId = d ? d.mateId || (run && run.mateId) || '' : ''
    const runId = d ? d.runId || (run && run.id) || '' : ''
    const mate = (mates || []).find((m) => m.id === mateId)
    const v = d ? verifyState(run ? { verifying: run.verifying, verification: run.verification } : { verification: d.verification }) : { kind: '' }
    const rate = (x, r) => api('/rate', { id: x.id, rating: x.rating === r ? null : r }).then((y) => {
      if (!y || !y.deliverable) return
      setData((p) => ({ ...p, deliverable: { ...p.deliverable, rating: y.deliverable.rating } }))
      if (onRated) onRated(y.deliverable)
    }).catch(() => {})
    const meta = []
    if (d) {
      if (mate) meta.push(h('span', { key: 'n' }, mate.name))
      meta.push(h('span', { key: 'w' }, fmtWhen(d.createdAt)))
      if (verifyText(v)) meta.push(h(Verdict, { key: 'v', v, warn: !!runId && runId === newestRunId, open: notes, onToggle: () => setNotes(!notes) }))
      meta.push(h('button', { key: 'md', type: 'button', className: 'mwt-tbtn', onClick: () => download(safeName(d.title) + '.md', '# ' + d.title + '\n\n' + (d.markdown || '')) }, t('downloadMd')))
      if (!fromFiles) meta.push(h('button', { key: 'fp', type: 'button', className: 'mwt-tbtn', onClick: () => openFiles(d.id) }, t('openInFiles')))
      else {
        if (mateId) meta.push(h('button', { key: 'th', type: 'button', className: 'mwt-tbtn', onClick: () => openMate(mateId, runId) }, t('inThread')))
        meta.push(h('button', { key: 'pdf', type: 'button', className: 'mwt-tbtn', onClick: () => printDoc(d) }, t('exportPdf')))
      }
    }
    return h('article', { className: 'mwt-read' },
      h('button', { type: 'button', className: 'mwt-read-back', onClick: onBack }, icon('arrow-left', { size: 14 }), backLabel),
      !data ? h(Skeleton, { rows: 6 })
        : !d ? h('div', { className: 'mwt-empty' }, t('noMatch'))
          : h(React.Fragment, null,
            h('h1', null, d.title || d.id),
            h('div', { className: 'mwt-read-meta' }, meta.map((x, i) => (i ? [h('span', { key: 's' + i, 'aria-hidden': 'true' }, '·'), x] : x))),
            notes && v.notes ? h('div', { className: 'mwt-notes' }, v.notes) : null,
            h(SumList, { rows: d.summary }),
            h(Markdown, { text: withoutTitle(d.markdown, d.title) }),
            h('div', { className: 'mwt-read-end' }, h(Rating, { d, onRate: rate, always: true }))))
  }

  /** A folded deliverable (an older run): one compact row (file glyph · title · verification word · time) that opens it. */
  function FoldRow({ d, verify, onOpen }) {
    return h('button', { type: 'button', className: 'mwt-arow ic mwt-fold', onClick: () => onOpen(d) },
      h('span', { className: 'ic' }, icon(fileGlyph(d), { size: 16 })),
      h('span', { className: 'main' }, h('span', { className: 't' }, d.title || d.id)),
      h('span', { className: 'm' }, [verifyWord(verify), fmtWhen(d.createdAt)].filter(Boolean).join(' · ')))
  }

  /** 过程: one line that says what the run did, and a fold that shows how. Folded by default. */
  function Process({ run, live }) {
    const [open, setOpen] = React.useState(false)
    // The thread sends a finished run without its tool calls (run.process.lite): the fold fetches them when opened.
    const [full, setFull] = React.useState(null)
    const lite = !!(run.process && run.process.lite)
    React.useEffect(() => { if (!open || !lite || full) return; let on = true; api('/run?id=' + encodeURIComponent(run.id)).then((x) => { if (on && x && x.run) setFull(x.run) }).catch(() => {}); return () => { on = false } }, [open, lite, run.id])
    const src = lite ? full : run
    const rows = React.useMemo(() => (src ? phasesOf(src) : []), [src])
    const n = src ? rows.filter((r) => r.kind === 'phase').length : run.process.groups
    const summary = [t('process'), n ? n + ' ' + t('phases') : '', elapsedOf(run)].filter(Boolean).join(' · ')
    return h('div', { className: 'mwt-proc' },
      h('button', { type: 'button', className: 'mwt-proc-head', 'aria-expanded': open, onClick: () => setOpen(!open) },
        h('span', { className: 'grow' }, summary),
        icon('chevron-down', { size: 12, style: { transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' } })),
      open ? (src ? h(Phases, { run: src, rows, live }) : h(Skeleton, { rows: 2 })) : null)
  }

  /** The run as phases: consecutive tool calls with the same verb fold into one line that opens to its calls. */
  function phasesOf(run) {
    const list = Array.isArray(run.activity) ? run.activity : []
    const out = []
    for (const e of list) {
      if (!e || typeof e !== 'object') continue
      if (e.kind === 'tool') {
        const d = describeTool(e.name, e.detail)
        const last = out[out.length - 1]
        if (last && last.kind === 'phase' && last.verb === d.verb) { last.items.push(e); if (d.obj) last.obj = d.obj; if (e.ok === false) last.failed++; continue }
        out.push({ kind: 'phase', verb: d.verb, obj: d.obj, items: [e], at: e.at, failed: e.ok === false ? 1 : 0 })
        continue
      }
      if (e.kind === 'text' || e.kind === 'verify') out.push(e)
    }
    const end = run.finishedAt || new Date().toISOString()
    for (let i = 0; i < out.length; i++) if (out[i].kind === 'phase') out[i].ms = new Date((out[i + 1] && out[i + 1].at) || end) - new Date(out[i].at)
    return out
  }
  const hasProcess = (run) => !!(run.process && run.process.tools) || (Array.isArray(run.activity) ? run.activity : []).some((e) => e && (e.kind === 'tool' || e.kind === 'verify'))

  function Phases({ run, rows, live }) {
    const [open, setOpen] = React.useState(-1)
    const lastIdx = rows.length - 1
    React.useEffect(() => { if (live && rows[lastIdx] && rows[lastIdx].kind === 'phase') setOpen(lastIdx) }, [live, rows.length])
    const v = run.verification && typeof run.verification === 'object' ? run.verification : null
    const vs = verifyState(run)
    if (!rows.length && !v) return h('div', { className: 'mwt-empty' }, t('none2'))
    return h('div', { className: 'mwt-phases' },
      rows.map((r, i) => {
        if (r.kind === 'phase') {
          const running = live && i === lastIdx
          const n = r.items.length
          const meta = [n > 1 ? n + ' ' + t('times') : '', r.ms > 1500 ? fmtDuration(r.ms) : ''].filter(Boolean).join(' · ')
          return h('div', { key: i },
            h('button', { type: 'button', className: 'mwt-phase-head', 'aria-expanded': open === i, 'data-tone': running ? 'live' : r.failed ? 'danger' : undefined, onClick: () => setOpen(open === i ? -1 : i) },
              h('span', { className: 'verb' }, r.verb),
              meta ? h('span', { className: 'meta' }, meta) : null,
              open !== i && r.obj ? h('span', { className: 'obj' }, r.obj) : null),
            open === i ? h('div', { className: 'mwt-phase-body' }, r.items.map((e, j) => { const d = describeTool(e.name, e.detail); return h('div', { key: j, className: 'mwt-ev', 'data-ok': e.ok === undefined ? undefined : e.ok, title: e.name + (e.detail ? ' ' + e.detail : '') }, h('span', { className: 'verb' }, d.verb), d.obj ? h('span', { className: 'obj' }, d.obj) : null, e.ok === false && e.result ? h('span', { className: 'result' }, t('toolFailed') + ' · ' + e.result) : null) })) : null)
        }
        return h(PhaseNote, { key: i, text: r.text, label: r.kind === 'verify' ? t('verifyLabel') : '' })
      }),
      v ? h('div', { className: 'mwt-phase-head', 'data-tone': vs.kind === 'verifying' ? 'live' : undefined },
        h('span', { className: 'verb' }, t('verifyLabel')),
        h('span', { className: 'meta' }, [vs.kind === 'verifying' ? t('verifying') : vs.kind === 'passed' ? t('passed') : vs.kind === 'issues' ? t('verifyIssues') : t('verifyNone'), vs.checked ? t('checked') + ' ' + vs.checked : '', vs.issues ? t('issues') + ' ' + vs.issues : ''].filter(Boolean).join(' · '))) : null)
  }

  /** What the teammate said mid-run: two lines, the whole note on tap. */
  function PhaseNote({ text, label }) {
    const [open, setOpen] = React.useState(false)
    return h('div', { className: 'mwt-phase-note' + (open ? ' open' : ''), role: 'button', tabIndex: 0, onClick: () => setOpen(!open), onKeyDown: (e) => { if (e.key === 'Enter') setOpen(!open) } },
      h('div', { className: 'body' }, label ? h('span', { className: 'lbl' }, label + ' · ') : null, text))
  }

  function Menu({ items }) {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef(null)
    React.useEffect(() => { if (!open) return; const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }; const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }; document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey); return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) } }, [open])
    const list = items.filter(Boolean)
    return h('div', { className: 'mwt-menu', ref },
      h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('more'), 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: () => setOpen(!open) }, '···'),
      open ? h('div', { className: 'mwt-menu-pop', role: 'menu' }, list.map((it) => h('button', { key: it.label, type: 'button', role: 'menuitem', onClick: () => { setOpen(false); it.run() } }, it.label))) : null)
  }

  /**
   * 找你卡: the question a run stopped on. choice → full-width options; approval → 允许一次 / 拒绝; takeover →
   * 「去 Chrome 里处理」 (opens 电脑) and 我做完了; text → no controls, the dock answers it. Only the newest open question
   * can be answered; answered it is one line 「已回答：X」, closed 「不再等待」.
   */
  function AskCard({ e, onAnswer, onTakeover }) {
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    if (e.status === 'answered') return h('div', { className: 'mwt-askline', title: plainWords(e.question) }, h('span', null, t('answeredLine').replace('{a}', e.answer)))
    if (e.status !== 'pending') return h('div', { className: 'mwt-askline', title: plainWords(e.question) }, h('span', null, t('askClosed')))
    const can = e.answerable && !busy
    const send = (value) => {
      if (!can) return
      setBusy(true); setErr('')
      Promise.resolve().then(() => onAnswer(e.id, value)).catch((x) => setErr((x && x.message) || String(x))).finally(() => setBusy(false))
    }
    const controls = e.askKind === 'choice' && e.options.length
      ? h('div', { className: 'opts' }, e.options.map((o) => h('button', { key: o, type: 'button', className: 'mwt-askopt', disabled: !can, onClick: () => send(o) }, o)))
      : e.askKind === 'approval'
        ? h('div', { className: 'row' },
          h('button', { type: 'button', className: 'mwt-btn primary', disabled: !can, onClick: () => send(true) }, t('allowOnce')),
          h('button', { type: 'button', className: 'mwt-btn outline', disabled: !can, onClick: () => send(false) }, t('deny')))
        : e.askKind === 'takeover'
          ? h('div', { className: 'row' },
            onTakeover ? h('button', { type: 'button', className: 'go', onClick: onTakeover }, icon('monitor', { size: 14 }), t('takeoverGo')) : h('span', { className: 'go plain' }, t('takeoverGo')),
            h('span', { className: 'grow' }),
            h('button', { type: 'button', className: 'mwt-btn outline', disabled: !can, onClick: () => send(true) }, t('takeoverDone')))
          : null
    return h(React.Fragment, null,
      h('div', { className: 'mwt-askcard', 'aria-busy': busy || undefined },
        h('div', { className: 'q', dangerouslySetInnerHTML: { __html: md.inline(e.question) } }),
        e.detail ? h('pre', { className: 'detail' }, e.detail) : null,
        controls),
      err ? h('div', { className: 'mwt-ask-err', role: 'alert' }, err) : null)
  }

  /** 提醒卡: a reminder firing; one 知道了 (POST /routines/ack). Acknowledged, it is one muted line. */
  function RemindCard({ e, onAck }) {
    const [busy, setBusy] = React.useState(false)
    if (e.acked) return h('div', { className: 'mwt-askline' }, h('span', null, [t('remindCard'), e.title, t('acked')].filter(Boolean).join(' · ')))
    return h('div', { className: 'mwt-remind' },
      h('span', { className: 'txt' }, e.title || t('remindCard')),
      h('button', { type: 'button', className: 'mwt-btn', disabled: busy || !e.routineId, onClick: () => { setBusy(true); Promise.resolve(onAck(e)).finally(() => setBusy(false)) } }, t('gotIt')))
  }

  // ---- the mate page ------------------------------------------------------------------------------------------------

  /** The loaded runs of one teammate: the newest page on every change of its state, earlier pages on request. */
  function useThread(mate) {
    const [th, setTh] = React.useState(() => { const c = threadCache.get(mate.id); return c ? { runs: c.runs, nextBefore: c.nextBefore, loaded: true, busy: false, error: '', fetchedFrom: 0 } : { runs: [], nextBefore: null, loaded: false, busy: false, error: '', fetchedFrom: 0 } })
    React.useEffect(() => { if (th.loaded && !th.error) threadCache.set(mate.id, { runs: th.runs, nextBefore: th.nextBefore }) }, [th.runs, th.nextBefore])
    const [bump, setBump] = React.useState(0)
    const working = mate.state === 'working'
    const key = [mate.lastAt || '', mate.state || '', mate.step || '', mate.ask && mate.ask.id ? mate.ask.id : '', working ? Math.floor(Date.now() / FAST_MS) : 0, bump].join('|')
    React.useEffect(() => {
      let on = true
      const started = Date.now()
      api('/mates/thread?id=' + encodeURIComponent(mate.id) + '&limit=' + THREAD_PAGE).then((d) => {
        if (!on) return
        setTh((prev) => ({ ...prev, error: '', loaded: true, fetchedFrom: started, runs: mergeRuns(prev.runs, d.runs || []), nextBefore: prev.loaded ? prev.nextBefore : (d.nextBefore || null) }))
      }).catch((e) => { if (on) setTh((prev) => ({ ...prev, loaded: true, error: prev.runs.length ? '' : (e.message || String(e)) })) })
      return () => { on = false }
    }, [mate.id, key])
    const ref = React.useRef(th); ref.current = th
    const loadEarlier = React.useCallback(async () => {
      const cur = ref.current
      if (cur.busy || !cur.nextBefore) return false
      setTh((p) => ({ ...p, busy: true }))
      try {
        const d = await api('/mates/thread?id=' + encodeURIComponent(mate.id) + '&before=' + encodeURIComponent(cur.nextBefore) + '&limit=' + THREAD_PAGE)
        setTh((p) => ({ ...p, busy: false, runs: mergeRuns(p.runs, d.runs || []), nextBefore: d.nextBefore || null }))
        return true
      } catch { setTh((p) => ({ ...p, busy: false })); return false }
    }, [mate.id])
    const reload = React.useCallback(() => setBump((n) => n + 1), [])
    const patchRun = React.useCallback((run) => { if (run && run.id) setTh((p) => ({ ...p, runs: mergeRuns(p.runs, [run]) })) }, [])
    return { ...th, loadEarlier, reload, patchRun, setTh }
  }

  function MatePage({ renderSlot }) {
    const s = usePolling()
    const n = useNavState()
    const def = defaultMateOf(s.mates)
    const asked = n.mateId ? s.mates.find((m) => m.id === n.mateId) : null
    // Asked for a teammate the snapshot does not have yet (just created): fetch, and wait for it instead of showing
    // another. Only once a snapshot fetched after the request (and one more) still lacks it does the default show.
    const [misses, setMisses] = React.useState({ id: '', n: 0, at: 0 })
    React.useEffect(() => {
      if (!n.mateId || asked || !s.loadedAt) return
      if (s.loadedAt > n.at && misses.at !== s.loadedAt) setMisses((m) => ({ id: n.mateId, n: (m.id === n.mateId ? m.n : 0) + 1, at: s.loadedAt }))
    }, [n.mateId, !!asked, s.loadedAt])
    const gone = !!n.mateId && !asked && misses.id === n.mateId && misses.n >= 2
    const early = !!n.mateId && !asked && !gone
    React.useEffect(() => { if (early) kick() }, [n.seq, early, s.loadedAt])
    // A teammate that is gone (removed elsewhere): forget it, so later remounts do not wait on it.
    React.useEffect(() => { if (gone && getNav().mateId === n.mateId) { nav = { ...nav, mateId: '' }; storeMate('') } }, [gone])
    const mate = asked || (early ? null : def)
    const root = (...children) => h('div', { className: 'mwt mwt-mate' }, h('style', null, STYLE), h('div', { className: 'mwt-page' }, ...children))
    if (!mate) {
      if ((!s.loadedAt || early) && !s.error) return root(h(Skeleton, { rows: 4 }))
      return root(h('div', { className: 'mwt-retry' }, h('span', null, s.error ? t('loadFailed') : t('noMatch')), h('button', { type: 'button', className: 'mwt-btn', onClick: kick }, t('retry'))))
    }
    return h(MateView, { key: mate.id, mate, mates: s.mates, nav: n, renderSlot })
  }

  /**
   * One teammate: header (avatar + name + title → the right panel, ···), the thread, the dock; the right panel beside it
   * when the page has room (a grid column), else a slide-over at its right edge. The reading column never shrinks. A
   * deliverable opened from the thread takes this column's place (the reading view) until you go back.
   */
  function MateView({ mate, mates, nav: n, renderSlot }) {
    const th = useThread(mate)
    const runs = React.useMemo(() => th.runs.filter((r) => !(r.quiet && r.trigger === 'routine' && !r.error)), [th.runs])
    const lists = React.useMemo(() => new Map(runs.map((r) => [r.id, threadOf(r)])), [runs])
    // Migrated runs and finished runs older than the newest five fold to the user line + one row per deliverable.
    const folded = React.useMemo(() => foldedRunIds(runs, 5), [runs])
    const newestId = runs.length ? runs[runs.length - 1].id : ''
    const live = activeRun(runs)
    const running = mate.state === 'working' || (!!live && isLive(live))
    useTick(running)
    const rootRef = React.useRef(null)
    const box = useBox(rootRef)
    // What you just sent shows at once, until a page fetched after the send has it.
    const [pending, setPending] = React.useState({ text: '', at: 0 })
    React.useEffect(() => { if (pending.text && pending.at && th.fetchedFrom > pending.at) setPending({ text: '', at: 0 }) }, [th.fetchedFrom])
    const [hl, setHl] = React.useState('')
    const atBottom = React.useRef(true)
    const keep = React.useRef(null)
    const jump = React.useRef({ id: '', tries: 0 })
    const [jumpSeq, setJumpSeq] = React.useState(0)
    const arriving = useArrivals(runs, lists, th.loaded)
    // The composer's draft outlives the reading view (the dock is not on screen while a file is open).
    const draft = React.useRef('')

    // The reading view: the open deliverable's id; the thread's scroll position is kept for the way back.
    const [reading, setReading] = React.useState('')
    const readingRef = React.useRef(''); readingRef.current = reading
    const backTo = React.useRef(null)
    const openDoc = (d) => { const el = rootRef.current; if (!readingRef.current) backTo.current = el ? el.scrollTop : 0; setReading(String(d.id)) }
    const closeDoc = React.useCallback(() => setReading(''), [])
    React.useLayoutEffect(() => {
      const el = rootRef.current
      if (!el) return
      if (reading) { el.scrollTop = 0; return }
      if (backTo.current !== null) { el.scrollTop = backTo.current; backTo.current = null }
    }, [reading])

    // 「以下是新的」: unread when it opened, the first run that asked for attention after this browser last had it open
    // (else the run carrying the teammate's attention time). Captured before this visit marks it seen.
    const [visit] = React.useState(() => ({ unread: mate.unread === true, seenAt: clientSeenAt(mate.id), attentionAt: mate.attentionAt || '' }))
    const firstNew = React.useMemo(() => {
      if (!visit.unread || !runs.length) return ''
      const since = ms(visit.seenAt)
      if (since) { const r = runs.find((x) => attentionMs(x) > since); return r ? r.id : '' }
      const at = ms(visit.attentionAt)
      const r = at ? runs.find((x) => attentionMs(x) >= at - 1000) : null
      return (r || runs[runs.length - 1]).id
    }, [runs, visit])

    // The right panel: per teammate, mode 'mate' (电脑 · 例行 · 设置) or 'new-mate' (the form).
    const [aside, setAside] = React.useState(() => ({ open: asideMemory(mate.id) === 'open', mode: 'mate', section: '', routineId: '', seq: 0 }))
    const showAside = (open, patch) => { setAside((a) => ({ ...a, open, ...(patch || {}), seq: a.seq + 1 })); if (!patch || patch.mode === 'mate') rememberAside(mate.id, open ? 'open' : 'closed') }

    // Navigation requests (the column, toasts, the bell, search): a run to jump to, the panel to open.
    React.useEffect(() => {
      if (n.seq === consumedSeq) return
      consumedSeq = n.seq
      if (n.runId) { backTo.current = null; setReading(''); jump.current = { id: n.runId, tries: 0 }; setJumpSeq((x) => x + 1) }
      const a = n.aside
      if (a && a.mode === 'new-mate') showAside(true, { mode: 'new-mate', section: '', routineId: '' })
      else if (a) showAside(true, { mode: 'mate', section: a.section || '', routineId: a.routineId || '' })
    }, [n.seq])

    // Tell the column what is on screen; mark it seen now and whenever new content lands while it stays open.
    React.useEffect(() => { fire('mywork:thread-opened', { kind: 'mate', id: mate.id }) }, [mate.id])
    React.useEffect(() => { api('/seen', { id: mate.id }).catch(() => {}); rememberSeen(mate.id) }, [mate.id, mate.lastAt || ''])

    // Scroll: the thread opens at its end (or at 「以下是新的」) and follows new content while you are at the end;
    // 「加载更早」 keeps your place. Nothing moves while the reading view is up.
    const onScroll = () => {
      const el = rootRef.current
      if (!el || readingRef.current) return
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
      // Near the top: the earlier page comes in above, your place kept.
      if (el.scrollTop < 200 && th.loaded && th.nextBefore && !th.busy && !keep.current && !jump.current.id) loadEarlier()
    }
    const lastRun = runs[runs.length - 1]
    const sig = runs.length + ':' + (runs[0] ? runs[0].id : '') + ':' + (lastRun ? lastRun.id + lastRun.status + (lastRun.activity || []).length + (lastRun.deliverables || []).length : '') + ':' + pending.text
    React.useLayoutEffect(() => {
      const el = rootRef.current
      if (!el || readingRef.current) return
      const k = keep.current
      if (k) { keep.current = null; el.scrollTop = k.top + (el.scrollHeight - k.height); return }
      if (atBottom.current && !jump.current.id) el.scrollTop = el.scrollHeight
    }, [sig])
    // First load: open at the end (newest), once the thread is on screen — again a frame later for late layout.
    const firstScrolled = React.useRef(false)
    React.useLayoutEffect(() => {
      if (firstScrolled.current || !th.loaded || jump.current.id) return
      const el = rootRef.current
      if (!el) return
      firstScrolled.current = true
      atBottom.current = true
      el.scrollTop = el.scrollHeight
      const id = requestAnimationFrame(() => { if (atBottom.current && rootRef.current) rootRef.current.scrollTop = rootRef.current.scrollHeight })
      return () => cancelAnimationFrame(id)
    }, [th.loaded])
    // Unread when it opened: 「以下是新的」 sits ~96 px from the top instead (once, when it first shows).
    const newScrolled = React.useRef(false)
    React.useLayoutEffect(() => {
      if (newScrolled.current || !firstNew || !th.loaded || jump.current.id || readingRef.current) return
      const el = rootRef.current
      const line = el && el.querySelector('.mwt-newline')
      if (!line) return
      newScrolled.current = true
      atBottom.current = false
      el.scrollTop = Math.max(0, el.scrollTop + line.getBoundingClientRect().top - el.getBoundingClientRect().top - 96)
    }, [firstNew, th.loaded, runs.length])
    const loadEarlier = () => {
      const el = rootRef.current
      if (el) keep.current = { height: el.scrollHeight, top: el.scrollTop }
      // Nothing came (busy, failed): drop the kept place so it is not applied to some later change.
      return th.loadEarlier().then((ok) => { if (!ok) keep.current = null; return ok })
    }
    // Jump to a run (and load earlier pages until it is there), then highlight it for a moment.
    React.useEffect(() => {
      const j = jump.current
      if (!j.id || !th.loaded) return
      const el = rootRef.current && rootRef.current.querySelector('[data-run="' + cssEsc(j.id) + '"]')
      if (el) {
        jump.current = { id: '', tries: 0 }
        atBottom.current = false
        try { el.scrollIntoView({ block: 'center' }) } catch {}
        setHl(j.id)
        return
      }
      if (th.nextBefore && !th.busy && j.tries < 10) { j.tries++; th.loadEarlier() }
      else if (!th.nextBefore) jump.current = { id: '', tries: 0 }
    }, [jumpSeq, th.loaded, runs.length, th.busy])
    // The highlight goes after a moment, whatever else re-renders meanwhile.
    React.useEffect(() => { if (!hl) return undefined; const id = setTimeout(() => setHl(''), HIGHLIGHT_MS); return () => clearTimeout(id) }, [hl, jumpSeq])

    // 电脑: the first slot entry that wants the teammate's current run.
    const entries = useAsideEntries()
    // The live picture only while this teammate's current run is really running (not waiting, not queued) and has used
    // the browser in that run (the entry's when() checks the run's tools); otherwise its folder.
    const browsing = !!live && isLive(live) && !isQueued(live)
    const screen = renderSlot && browsing ? entries.find((x) => { if (!x.when) return false; try { return !!x.when(live) } catch { return false } }) || null : null
    const autoOpened = React.useRef(false)
    React.useEffect(() => {
      // Opens by itself once while the teammate browses (unless you closed its panel before); never closes by itself.
      if (!screen || !running || autoOpened.current) return
      autoOpened.current = true
      if (asideMemory(mate.id) === 'closed') return
      setAside((a) => (a.open ? a : { ...a, open: true, mode: 'mate', section: 'computer', seq: a.seq + 1 }))
    }, [!!screen, running])
    const split = box.w >= SPLIT_MIN
    const shown = aside.open
    React.useEffect(() => {
      if (!shown || split) return undefined
      const onKey = (ev) => { if (ev.key === 'Escape' && !ev.defaultPrevented && !(ev.target && typeof ev.target.closest === 'function' && ev.target.closest('.mwt-aside'))) showAside(false) }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [shown, split])

    const answer = (runId) => (askId, value) => api('/answer', { id: runId, askId, answer: value }).then((d) => { if (d && d.run) th.patchRun(d.run); th.reload(); kick() })
    const patchRating = (nd) => th.setTh((p) => ({ ...p, runs: p.runs.map((run) => (Array.isArray(run.deliverables) && run.deliverables.some((y) => y.id === nd.id) ? { ...run, deliverables: run.deliverables.map((y) => (y.id === nd.id ? { ...y, rating: nd.rating } : y)) } : run)) }))
    const rate = (d, r) => api('/rate', { id: d.id, rating: d.rating === r ? null : r }).then((x) => { if (x && x.deliverable) patchRating(x.deliverable) }).catch(() => {})
    const ack = (e) => api('/routines/ack', { id: e.routineId, at: e.at }).then(() => { th.reload(); kick() }).catch(() => {})
    const stop = () => api('/mates/stop', { id: mate.id }).then(() => { th.reload(); kick() }).catch(() => {})
    const takeover = () => showAside(true, { mode: 'mate', section: 'computer' })
    const textAsk = textAskOf(runs)
    // The example prompts of an empty thread fill the composer.
    const fillRef = React.useRef(null)

    const renderEntry = (run, e) => {
      const arrive = arriving(run.id + ':' + e.key)
      if (e.kind === 'routine') return h('div', { key: e.key, className: 'mwt-center' }, [e.title, hhmm(e.at)].filter(Boolean).join(' · '))
      if (e.kind === 'scheduled') return h('button', { key: e.key, type: 'button', className: 'mwt-center', onClick: () => showAside(true, { mode: 'mate', section: 'routines', routineId: e.routineId }) }, t('scheduled') + ' · ' + [e.scheduleLabel, e.title].filter(Boolean).join(' '))
      if (e.kind === 'remind') return h('div', { key: e.key, className: 'mwt-turn ai' }, h(RemindCard, { e, onAck: ack }))
      if (e.kind === 'user') return h('div', { key: e.key, className: 'mwt-turn user' }, h('div', { className: 'mwt-bubble' }, e.text))
      if (e.kind === 'deliver') return h(DeliverEntry, { key: e.key, ds: e.ds || [e.d], text: e.text, verify: e.verify, warn: run.id === newestId, arrive, onOpen: openDoc, onRate: rate })
      if (e.kind === 'text') return h('div', { key: e.key, className: 'mwt-turn ai bubble' + (arrive ? ' mwt-arrive' : '') }, h(Markdown, { text: e.text }))
      if (e.kind === 'ask') return h('div', { key: e.key, className: 'mwt-turn ai' }, h(AskCard, { e, onAnswer: answer(run.id), onTakeover: takeover }))
      if (e.kind === 'auto') return h('div', { key: e.key, className: 'mwt-turn ai' }, h('div', { className: 'mwt-askline' }, h('span', null, t('askAuto'))))
      if (e.kind === 'thinking') return h('div', { key: e.key, className: 'mwt-turn ai mwt-working', role: 'status', 'aria-label': t('workingAria').replace('{name}', mate.name || '') }, h(Avatar, { mate, size: 28, working: true }), h('span', { className: 'step' }, [e.step, elapsedOf(run)].filter(Boolean).join(' · ')))
      if (e.kind === 'queued') return h('div', { key: e.key, className: 'mwt-turn ai mwt-queued' }, t('queued'))
      if (e.kind === 'stopped') return h('div', { key: e.key, className: 'mwt-center' }, t('stopped'))
      if (e.kind === 'failed') return h('div', { key: e.key, className: 'mwt-turn ai mwt-failed' }, t('failedTitle') + ' · ' + e.reason)
      return null
    }

    // Two modes (Rakazo): 设置 through the name, 电脑 (screen or folder + 例行) through the monitor button.
    const panelMode = aside.mode === 'new-mate' ? 'new-mate' : aside.section === 'settings' ? 'settings' : 'computer'
    const settingsOpen = shown && panelMode === 'settings'
    const computerOpen = shown && panelMode === 'computer'
    const title = panelMode === 'new-mate' ? t('newMate') : panelMode === 'settings' ? t('settings') : [t('computer'), running ? t('working') : ''].filter(Boolean).join(' · ')
    const asideBody = () => aside.mode === 'new-mate'
      ? h(NewMateForm, { onCreated: (m) => { setAside((a) => ({ ...a, open: false, mode: 'mate', seq: a.seq + 1 })); if (getNav().mateId !== m.id) openMate(m.id) } })
      : h(MatePanel, { mate, mates, live, screen, renderSlot, section: aside.section, routineId: aside.routineId, seq: aside.seq, onJump: (runId) => { backTo.current = null; setReading(''); jump.current = { id: runId, tries: 0 }; setJumpSeq((x) => x + 1) } })
    const asidePanel = (mode) => h('aside', { className: 'mwt-aside ' + mode, 'data-open': mode === 'over' ? shown : undefined, 'aria-label': title, 'aria-hidden': mode === 'over' && !shown ? 'true' : undefined, style: mode === 'col' && box.h ? { height: box.h } : undefined },
      h('div', { className: 'mwt-aside-head' },
        h('span', { className: 'title' }, title),
        h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('close'), onClick: () => showAside(false) }, icon('x', { size: 14 }))),
      shown ? h('div', { className: 'mwt-aside-body' }, asideBody()) : null)
    const menu = [
      running || mate.state === 'waiting' ? { icon: 'square', label: t('stop'), run: stop } : null,
      { icon: 'settings', label: t('settings'), run: () => showAside(true, { mode: 'mate', section: 'settings' }) },
    ]
    const empty = th.loaded && !runs.length && !pending.text
    const thread = () => h(React.Fragment, null,
      h('header', { className: 'mwt-head' },
        h('button', { type: 'button', className: 'mwt-who', 'aria-expanded': settingsOpen, title: mate.title || undefined, onClick: () => showAside(!settingsOpen, { mode: 'mate', section: 'settings', routineId: '' }) },
          h(Avatar, { mate, size: 26, working: running }),
          h('span', { className: 'who' }, h('span', { className: 'name' }, mate.name), mate.title ? h('span', { className: 'ttl' }, mate.title) : null)),
        h('span', { className: 'grow' }),
        h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('computer'), 'aria-pressed': computerOpen, title: t('computer'), onClick: () => showAside(!computerOpen, { mode: 'mate', section: 'computer', routineId: '' }) }, icon('monitor', { size: 16 })),
        h(Menu, { items: menu })),
      !th.loaded ? h(Skeleton, { rows: 3 })
        : th.error ? h('div', { className: 'mwt-retry' }, h('span', null, t('loadFailed')), h('button', { type: 'button', className: 'mwt-btn', onClick: th.reload }, t('retry')))
        : empty ? h(Hello, { mate, onPick: (text) => { if (fillRef.current) fillRef.current(text) } })
        : h('section', { className: 'mwt-thread' },
          th.nextBefore ? h('button', { type: 'button', className: 'mwt-older', disabled: th.busy, onClick: loadEarlier }, t('loadEarlier')) : null,
          runs.map((run) => {
            const list = lists.get(run.id) || []
            const line = run.id === firstNew ? h('div', { key: 'new:' + run.id, className: 'mwt-newline', role: 'separator' }, t('newBelow')) : null
            const block = folded.has(run.id) && list.some((e) => e.kind === 'deliver')
              ? h('div', { key: run.id, className: 'mwt-run folded' + (hl === run.id ? ' hl' : ''), 'data-run': run.id },
                list.map((e) => {
                  if (e.kind === 'user' || e.kind === 'routine') return renderEntry(run, e)
                  if (e.kind !== 'deliver') return null
                  return (e.ds || [e.d]).map((d) => h('div', { key: e.key + ':' + d.id, className: 'mwt-turn ai' }, h(FoldRow, { d, verify: e.verify, onOpen: openDoc })))
                }))
              : h('div', { key: run.id, className: 'mwt-run' + (hl === run.id ? ' hl' : ''), 'data-run': run.id },
                list.map((e) => renderEntry(run, e)),
                hasProcess(run) ? h(Process, { run, live: isLive(run) }) : null)
            return line ? [line, block] : block
          }),
          pending.text ? h('div', { className: 'mwt-turn user' }, h('div', { className: 'mwt-bubble' }, pending.text)) : null),
      h('div', { className: 'mwt-dock' }, h(Dock, { key: mate.id, mate, fillRef, draft, targetId: mate.id, running, onStop: stop, textAsk, answering: mate.state === 'waiting' || !!textAsk, onPending: (text) => { atBottom.current = true; setPending({ text, at: text ? Date.now() : 0 }) }, onSent: () => { th.reload(); kick() } })))
    return h('div', { ref: rootRef, className: 'mwt mwt-mate', 'data-mwt-mate': mate.id, onScroll },
      h('style', null, STYLE),
      !split ? h('div', { className: 'mwt-aside-dock' }, h('div', { className: 'mwt-aside-clip', style: box.h ? { height: box.h } : undefined }, asidePanel('over'))) : null,
      h('div', { className: 'mwt-page mate' + (shown && split ? ' split' : '') },
        h('div', { className: 'mwt-col' },
          reading ? h(ReadingView, { key: reading, id: reading, mates, backLabel: t('backToThread'), onBack: closeDoc, newestRunId: newestId, onRated: patchRating }) : thread()),
        shown && split ? asidePanel('col') : null))
  }

  /** Example prompts from a teammate's job: its first clauses as asks, else three general ones. */
  function examplesOf(mate) {
    const parts = String(mate.description || '').split(/[，,。；;、\n]+/).map((x) => x.replace(/^(每天|负责|帮我|请)/, '').trim()).filter((x) => x.length >= 2 && x.length <= 30)
    const topic = parts[0] || ''
    if (!topic) return ['你能帮我做什么？', '先了解一下我的工作', '给我一个今天的建议']
    return [topic, '关于「' + topic.slice(0, 14) + '」，先给我一份简报', parts[1] ? parts[1] : '你打算怎么做「' + topic.slice(0, 14) + '」？'].slice(0, 3)
  }
  /** An empty thread: the avatar (56), the name, the job muted, three pills that fill the composer. */
  function Hello({ mate, onPick }) {
    return h('div', { className: 'mwt-hello' },
      h(Avatar, { mate, size: 56 }),
      h('div', { className: 'nm' }, mate.name),
      mate.description ? h('div', { className: 'duty' }, mate.description) : null,
      h('div', { className: 'mwt-chips' }, examplesOf(mate).map((x) => h('button', { key: x, type: 'button', className: 'mwt-chip', onClick: () => onPick(x) }, x))))
  }

  /**
   * The dock: 「给 <name> 发消息」 (「回答」 while the newest run waits on a text question). POST /mates/say — idle: a new
   * run; working: steers the run; waiting: answers the question. Enter sends; what you sent shows at once as a bubble,
   * except an answer (`answering`), which lands as the question's 「已回答」 line when the thread comes back.
   */
  function Dock({ mate, fillRef, draft, targetId, textAsk, answering, running, onStop, onPending, onSent }) {
    const [text, setTextState] = React.useState(() => (draft && draft.current) || '')
    const setText = (v) => { if (draft) draft.current = v; setTextState(v) }
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    if (fillRef) fillRef.current = (v) => { setText(v); setTimeout(() => { const el = ref.current; if (el) { el.focus(); el.setSelectionRange(v.length, v.length) } }, 0) }
    const submit = async () => {
      const body = text.trim()
      if (!body || busy) return
      const bubble = !answering
      setBusy(true); setErr(''); setText(''); if (bubble) onPending(body)
      // Always the teammate in the header (its id passed explicitly), never whatever nav says by now.
      const id = targetId || mate.id
      if (!id) { setText(body); if (bubble) onPending(''); setBusy(false); return }
      try { await api('/mates/say', { id, text: body }); onSent() } catch (e) { if (bubble) onPending(''); setText(body); setErr(e.message || String(e)) } finally { setBusy(false) }
    }
    React.useEffect(() => { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(200, el.scrollHeight) + 'px' }, [text])
    return h('div', null,
      h('div', { className: 'mwt-say' },
        h('textarea', { ref, value: text, rows: 1, placeholder: textAsk ? t('answerPh') : t('sayTo').replace('{name}', mate.name || ''), 'aria-label': textAsk ? t('answerPh') : t('sayTo').replace('{name}', mate.name || ''), onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } }),
        running && onStop ? h('button', { type: 'button', className: 'mwt-btn stop round', 'aria-label': t('stop'), title: t('stop'), onClick: onStop }, icon('square', { size: 13 })) : null,
        h('button', { type: 'button', className: 'mwt-btn send round', 'aria-label': t('send'), disabled: busy || !text.trim(), onClick: submit }, icon('arrow-up', { size: 16, strokeWidth: 2 }))),
      err ? h('small', { className: 'mwt-say-err' }, err) : null)
  }

  // ---- the right panel: 电脑 · 例行 · 设置 -----------------------------------------------------------------------------

  function MatePanel({ mate, mates, live, screen, renderSlot, section, routineId, seq, onJump }) {
    const ref = React.useRef(null)
    React.useEffect(() => {
      if (!section || !ref.current) return
      const el = ref.current.querySelector('[data-sec="' + section + '"]')
      if (el && typeof el.scrollIntoView === 'function') { try { el.scrollIntoView({ block: 'start' }) } catch {} }
    }, [seq])
    const addRef = React.useRef(null)
    if (section === 'settings') return h('div', { ref }, h('section', { className: 'mwt-sec', 'data-sec': 'settings' }, h(MateSettings, { key: mate.id, mate, mates })))
    return h('div', { ref },
      h('section', { className: 'mwt-sec', 'data-sec': 'computer' },
        screen ? renderSlot(ASIDE_SLOT, { task: live, deliverables: (live && live.deliverables) || [], live: isLive(live) }, { only: screen.id }) : h(MateFiles, { mate })),
      h('section', { className: 'mwt-sec', 'data-sec': 'routines' },
        h('h2', null, t('routines'), h('span', { className: 'grow' }), h('button', { type: 'button', className: 'mwt-btn ghost round', 'aria-label': t('newRoutine'), title: t('newRoutine'), onClick: () => { if (addRef.current) addRef.current.focus() } }, icon('plus', { size: 14 }))),
        h(MateRoutines, { mate, expand: routineId, seq, onJump, addRef })))
  }

  /**
   * 电脑 when no browser is in use: the newest files in the teammate's folder (GET /mates/folder: what it wrote with fs /
   * bash), up to 8 plain rows (glyph · name · size · time; the path in the tooltip): .csv tables first under 「表格」,
   * the other files under 「文件」.
   */
  function MateFiles({ mate }) {
    const [items, setItems] = React.useState(null)
    React.useEffect(() => {
      let on = true
      api('/mates/folder?id=' + encodeURIComponent(mate.id)).then((d) => (d && Array.isArray(d.items) ? d.items : [])).catch(() => []).then((rows) => { if (on) setItems(rows) })
      return () => { on = false }
    }, [mate.id, mate.lastAt || '', mate.state || ''])
    if (!items) return h(Skeleton, { rows: 2 })
    if (!items.length) return h('div', { className: 'mwt-empty' }, t('folderEmpty'))
    const isTable = (f) => /\.csv$/i.test(String(f.name || ''))
    const shown = [...items.filter(isTable), ...items.filter((f) => !isTable(f))].slice(0, 8)
    const row = (f) => h('div', { key: f.path || f.name, className: 'mwt-arow ic static', title: f.path || undefined },
      h('span', { className: 'ic' }, icon(isTable(f) ? 'sheet' : 'file', { size: 16 })),
      h('span', { className: 'main' }, h('span', { className: 't' }, f.name)),
      h('span', { className: 'm' }, [fmtSize(f.size), fmtWhen(f.modifiedAt)].filter(Boolean).join(' · ')))
    const group = (label, list) => (list.length ? [h('div', { key: 'l' + label, className: 'mwt-flabel' }, label), h('div', { key: 'g' + label, className: 'mwt-alist' }, list.map(row))] : null)
    return h('div', null, group(t('tables'), shown.filter(isTable)), group(t('file'), shown.filter((f) => !isTable(f))))
  }

  /**
   * 例行: rows (glyph · title · schedule · 下次 / 已暂停). A row opens in place: the sentence (saved on blur), 现在跑一次,
   * 暂停 / 恢复, 删除 (with a confirm line), the last ten runs (a run with a result jumps to it in the thread). 新例行 below.
   */
  function MateRoutines({ mate, expand, seq, onJump, addRef }) {
    const [items, setItems] = React.useState(null)
    const [open, setOpen] = React.useState(expand || '')
    const [draft, setDraft] = React.useState('')
    const [err, setErr] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const listRef = React.useRef(null)
    const load = React.useCallback(() => api('/routines?mate=' + encodeURIComponent(mate.id)).then((d) => setItems((d.items || []).filter((r) => !r.mateId || r.mateId === mate.id))).catch(() => setItems((p) => p || [])), [mate.id])
    React.useEffect(() => { load() }, [load, mate.lastAt || '', mate.routineCount])
    React.useEffect(() => { if (expand) setOpen(expand) }, [expand, seq])
    React.useEffect(() => {
      if (!expand || !items || !listRef.current) return
      const el = listRef.current.querySelector('[data-routine="' + cssEsc(expand) + '"]')
      if (el && typeof el.scrollIntoView === 'function') { try { el.scrollIntoView({ block: 'nearest' }) } catch {} }
    }, [expand, seq, !!items])
    const create = () => {
      const input = draft.trim()
      if (!input || busy) return
      setBusy(true); setErr('')
      api('/routines/create', { mateId: mate.id, input }).then((d) => { setDraft(''); load(); kick(); if (d && d.routine && d.routine.id) setOpen(d.routine.id) }).catch((e) => setErr(e.message || String(e))).finally(() => setBusy(false))
    }
    const state = (r) => !r.enabled ? (r.schedule && r.schedule.type === 'once' ? t('ended') : t('paused')) : r.nextRunAt ? t('nextRun') + ' ' + (isToday(r.nextRunAt) ? hhmm(r.nextRunAt) : fmtWhen(r.nextRunAt)) : ''
    return h('div', { ref: listRef },
      !items ? h(Skeleton, { rows: 2 })
        : items.length ? h('div', { className: 'mwt-alist' }, items.map((r) => h(React.Fragment, { key: r.id },
          h('button', { type: 'button', className: 'mwt-arow', 'data-routine': r.id, 'data-off': !r.enabled, 'aria-expanded': open === r.id, onClick: () => setOpen(open === r.id ? '' : r.id) },
            h('span', { className: 'main' }, h('span', { className: 't' }, r.title), r.scheduleLabel ? h('span', { className: 's' }, r.scheduleLabel) : null),
            h('span', { className: 'm' }, state(r))),
          open === r.id ? h(RoutineDetail, { r, reload: () => { load(); kick() }, onRemoved: () => { setOpen(''); load(); kick() }, onJump }) : null)))
        : h('div', { className: 'mwt-empty' }, t('noRoutines')),
      h('div', { style: { marginTop: 8 } },
        h('input', { ref: addRef, className: 'mwt-input', value: draft, placeholder: t('newRoutinePh'), 'aria-label': t('newRoutine'), disabled: busy, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); create() } } }),
        err ? h('div', { className: 'mwt-field-err', style: { margin: '8px 0 0' } }, err) : null))
  }

  function RoutineDetail({ r, reload, onRemoved, onJump }) {
    const [input, setInput] = React.useState(r.input || r.title || '')
    const [confirm, setConfirm] = React.useState(false)
    const [err, setErr] = React.useState('')
    React.useEffect(() => { setInput(r.input || r.title || '') }, [r.id, r.input])
    const act = (path, body, after) => { setErr(''); return api(path, body).then(() => { (after || reload)() }).catch((e) => setErr(e.message || String(e))) }
    const save = () => { const v = input.trim(); if (!v || v === (r.input || '')) return; act('/routines/update', { id: r.id, input: v }) }
    const once = r.schedule && r.schedule.type === 'once'
    const runs = (Array.isArray(r.runs) ? r.runs : []).slice().sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 10)
    const word = { result: t('runResult'), quiet: t('runQuiet'), failed: t('runFailed'), fired: t('runFired'), running: t('runRunning') }
    return h('div', { className: 'mwt-rdetail' },
      h('textarea', { className: 'mwt-input', value: input, rows: 2, 'aria-label': t('routines'), onChange: (e) => setInput(e.target.value), onBlur: save }),
      h('div', { className: 'acts' },
        h('button', { type: 'button', className: 'mwt-btn small', onClick: () => act('/routines/run', { id: r.id }) }, t('runNow')),
        !once || r.enabled ? h('button', { type: 'button', className: 'mwt-btn small ghost', onClick: () => act('/routines/enable', { id: r.id, enabled: !r.enabled }) }, r.enabled ? t('pause') : t('resume')) : null,
        h('button', { type: 'button', className: 'mwt-btn small ghost', onClick: () => setConfirm(true) }, t('remove'))),
      confirm ? h('div', { className: 'mwt-confirm', role: 'alertdialog' }, h('span', null, t('removeRoutineAsk')),
        h('button', { type: 'button', className: 'mwt-btn small danger', onClick: () => act('/routines/remove', { id: r.id }, onRemoved) }, t('remove')),
        h('button', { type: 'button', className: 'mwt-btn small ghost', onClick: () => setConfirm(false) }, t('cancel'))) : null,
      err ? h('div', { className: 'mwt-field-err', style: { margin: '4px 0' } }, err) : null,
      h('div', { className: 'runs' }, runs.length ? runs.map((x, i) => {
        const kind = routineRunKind(x)
        const runId = x.runId || x.taskId || ''
        // Every run with a place in the thread jumps there (a quiet one has none): a result, a reminder's card, a failure, one still going.
        const go = kind !== 'quiet' && runId && onJump ? () => onJump(runId) : null
        return h('button', { key: i, type: 'button', className: 'mwt-arow' + (go ? '' : ' static'), onClick: go || undefined, tabIndex: go ? 0 : -1 },
          h('span', { className: 'main' }, h('span', { className: 't' }, fmtWhen(x.at))),
          h('span', { className: 'm', 'data-tone': kind === 'failed' ? 'danger' : undefined }, word[kind]))
      }) : h('div', { className: 'mwt-empty' }, t('neverRan'))))
  }

  /**
   * 设置: 名字, 头衔, 职责, 分组 (saved on blur; 分组 offers the names already in use, empty = 其他 in the column), 置顶 and
   * 通知 switches, 删除同事 (not for the default teammate).
   */
  function MateSettings({ mate, mates }) {
    const [f, setF] = React.useState({ name: mate.name || '', title: mate.title || '', description: mate.description || '', group: mate.group || '' })
    const focus = React.useRef('')
    const [confirm, setConfirm] = React.useState(false)
    const [err, setErr] = React.useState('')
    // The server's copy flows in unless you are editing that field.
    React.useEffect(() => { setF((p) => ({ name: focus.current === 'name' ? p.name : mate.name || '', title: focus.current === 'title' ? p.title : mate.title || '', description: focus.current === 'description' ? p.description : mate.description || '', group: focus.current === 'group' ? p.group : mate.group || '' })) }, [mate.name, mate.title, mate.description, mate.group])
    const update = (patch) => { setErr(''); return api('/mates/update', { id: mate.id, ...patch }).then(() => kick()).catch((e) => setErr(e.message || String(e))) }
    // A group name is one short line, as the server keeps it (spaces folded, 12 characters).
    const clean = (k, v) => (k === 'group' ? v.replace(/\s+/g, ' ').trim().slice(0, 12) : v.trim())
    const blur = (k) => () => { focus.current = ''; const v = clean(k, f[k]); if (k === 'name' && !v) { setF((p) => ({ ...p, name: mate.name || '' })); return } if (k === 'group') setF((p) => ({ ...p, group: v })); if (v !== String(mate[k] || '')) update({ [k]: v }) }
    const field = (k, label, multi) => h('label', { className: 'mwt-field' }, h('span', null, label),
      h(multi ? 'textarea' : 'input', { className: 'mwt-input', value: f[k], rows: multi ? 4 : undefined, onFocus: () => { focus.current = k }, onChange: (e) => { const v = e.target.value; setF((p) => ({ ...p, [k]: v })) }, onBlur: blur(k) }))
    const groups = React.useMemo(() => [...new Set((mates || []).map((m) => String(m.group || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh')), [mates])
    const listId = 'mwt-groups-' + mate.id
    const groupField = h('label', { className: 'mwt-field' }, h('span', null, t('group')),
      h('input', { className: 'mwt-input', list: listId, value: f.group, maxLength: 12, placeholder: t('groupPh'), autoComplete: 'off', onFocus: () => { focus.current = 'group' }, onChange: (e) => { const v = e.target.value; setF((p) => ({ ...p, group: v })) }, onBlur: blur('group'), onKeyDown: (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.blur() } } }),
      h('datalist', { id: listId }, groups.map((g) => h('option', { key: g, value: g }))))
    const sw = (k, label, on) => h('div', { className: 'mwt-switch-row' }, h('span', null, label),
      h('button', { type: 'button', role: 'switch', className: 'mwt-switch', 'aria-checked': on, 'aria-label': label, onClick: () => update({ [k]: !on }) }))
    const remove = () => api('/mates/remove', { id: mate.id }).then(() => { kick(); openMate('') }).catch((e) => setErr(e.message || String(e)))
    return h('div', null,
      field('name', t('name')), field('title', t('title')), field('description', t('duty'), true), groupField,
      sw('pinned', t('pinned'), mate.pinned === true || (!!mate.isDefault && mate.pinned !== false)),
      sw('notify', t('notify'), mate.notify !== false),
      err ? h('div', { className: 'mwt-field-err', style: { margin: '8px 0' } }, err) : null,
      mate.isDefault ? null : h('div', { style: { marginTop: 16 } },
        confirm ? h('div', { className: 'mwt-confirm', role: 'alertdialog' }, h('span', null, t('removeMateAsk')),
          h('button', { type: 'button', className: 'mwt-btn small danger', onClick: remove }, t('remove')),
          h('button', { type: 'button', className: 'mwt-btn small ghost', onClick: () => setConfirm(false) }, t('cancel')))
          : h('button', { type: 'button', className: 'mwt-btn small ghost danger', onClick: () => setConfirm(true) }, t('removeMate'))))
  }

  /**
   * 新同事: 「它负责什么」 (required; three examples under it fill it) + 名字 (optional). Created, its thread opens; its
   * intro run comes when the server has it.
   */
  function NewMateForm({ onCreated }) {
    const [description, setDescription] = React.useState('')
    const [name, setName] = React.useState('')
    const [busy, setBusy] = React.useState(false)
    const [err, setErr] = React.useState('')
    const ref = React.useRef(null)
    React.useEffect(() => { if (ref.current) ref.current.focus() }, [])
    const submit = () => {
      const d = description.trim()
      if (!d || busy) return
      setBusy(true); setErr('')
      api('/mates/create', name.trim() ? { description: d, name: name.trim() } : { description: d })
        .then((x) => {
          setDescription(''); setName('')
          const m = x && x.mate
          // The new teammate joins the snapshot now, so its page opens on it (not on the default) before the next poll.
          if (m && m.id && !state.mates.some((y) => y.id === m.id)) setState({ mates: [...state.mates, { ...m, addedAt: Date.now() }] })
          // Nav moves to the new teammate before any refetch, so no snapshot in between can fall back to another one.
          if (m && m.id) { openMate(m.id); onCreated(m) }
          kick()
        })
        .catch((e) => setErr(e.message || String(e))).finally(() => setBusy(false))
    }
    const fill = (v) => { setDescription(v); setTimeout(() => { const el = ref.current; if (el) { el.focus(); el.setSelectionRange(v.length, v.length) } }, 0) }
    return h('div', { style: { paddingTop: 8 } },
      h('label', { className: 'mwt-field' }, h('span', null, t('dutyAsk')),
        h('textarea', { ref, className: 'mwt-input', rows: 4, value: description, placeholder: t('dutyPh'), required: true, onChange: (e) => setDescription(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() } } })),
      h('div', { className: 'mwt-examples' }, [t('dutyEx1'), t('dutyEx2'), t('dutyEx3')].map((x) => h('button', { key: x, type: 'button', className: 'mwt-chip', onClick: () => fill(x) }, x))),
      h('label', { className: 'mwt-field' }, h('span', null, t('name')),
        h('input', { className: 'mwt-input', value: name, placeholder: t('namePh'), onChange: (e) => setName(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } } })),
      err ? h('div', { className: 'mwt-field-err' }, err) : null,
      h('button', { type: 'button', className: 'mwt-btn primary', disabled: busy || !description.trim(), onClick: submit }, t('create')))
  }

  // ---- 文件 -----------------------------------------------------------------------------------------------------------

  /**
   * 文件: every teammate's files; chips 全部 + one per teammate; search; a row opens the file in the reading view, in
   * place of the list (back returns to the list where you were).
   */
  function FilesPage() {
    const s = usePolling()
    const n = useNavState()
    const [q, setQ] = React.useState('')
    const [needle, setNeedle] = React.useState('')
    const [who, setWho] = React.useState('all')
    const [items, setItems] = React.useState(null)
    const [open, setOpen] = React.useState(() => n.fileId || '')
    const rootRef = React.useRef(null)
    const backTo = React.useRef(null)
    const show = (id) => { const el = rootRef.current; if (id && !open) backTo.current = el ? el.scrollTop : 0; setOpen(id) }
    React.useLayoutEffect(() => {
      const el = rootRef.current
      if (!el) return
      if (open) { el.scrollTop = 0; return }
      if (backTo.current !== null) { el.scrollTop = backTo.current; backTo.current = null }
    }, [open])
    React.useEffect(() => { if (n.fileId) show(n.fileId); else setOpen('') }, [n.seq])
    React.useEffect(() => { fire('mywork:thread-opened', { kind: 'files', id: '' }) }, [])
    React.useEffect(() => { const id = setTimeout(() => setNeedle(q.trim()), 200); return () => clearTimeout(id) }, [q])
    React.useEffect(() => {
      let on = true
      const params = [who !== 'all' ? 'mate=' + encodeURIComponent(who) : '', needle ? 'q=' + encodeURIComponent(needle) : ''].filter(Boolean).join('&')
      api('/files' + (params ? '?' + params : '')).then((d) => { if (on) setItems(d.items || []) }).catch(() => { if (on) setItems((p) => p || []) })
      return () => { on = false }
    }, [who, needle, s.loadedAt])
    const mateName = (id) => (s.mates.find((m) => m.id === id) || {}).name || ''
    const word = (d) => { const v = verifyState({ verifying: d.verifying, verification: d.verification }); return v.kind === 'passed' ? t('verified') : v.kind === 'issues' ? t('verifyIssues') : v.kind === 'none' ? t('verifyNone') : v.kind === 'verifying' ? t('verifying') : '' }
    return h('div', { ref: rootRef, className: 'mwt mwt-files' }, h('style', null, STYLE), h('div', { className: 'mwt-page' },
      open ? h(ReadingView, { key: open, id: open, mates: s.mates, backLabel: t('backToFiles'), onBack: () => setOpen(''), fromFiles: true, onRated: (d) => setItems((p) => (p || []).map((y) => (y.id === d.id ? { ...y, rating: d.rating } : y))) })
        : h(React.Fragment, null,
          h('div', { className: 'mwt-title' }, h('h1', null, t('files')), items ? h('span', null, String(items.length)) : null),
          h('div', { className: 'mwt-filters' },
            h('label', { className: 'mwt-search' }, icon('search', { size: 14 }), h('input', { type: 'search', value: q, placeholder: t('search'), 'aria-label': t('search'), onChange: (e) => setQ(e.target.value) })),
            h('div', { className: 'mwt-chips' }, [['all', t('all')], ...mateOrder(s.mates).map((m) => [m.id, m.name])].map(([k, label]) => h('button', { key: k, type: 'button', className: 'mwt-chip', 'data-on': who === k, onClick: () => setWho(k) }, label)))),
          !items ? h(Skeleton, { rows: 4 })
            : items.length ? h('div', { className: 'mwt-list' }, items.map((d) => h('button', { key: d.id, type: 'button', className: 'mwt-row', onClick: () => show(d.id) },
              h('span', { className: 'ic' }, icon(fileGlyph(d), { size: 16 })),
              h('span', { className: 't' }, d.title || d.id),
              h('span', { className: 'm' }, [word(d), mateName(d.mateId), fmtWhen(d.createdAt)].filter(Boolean).join(' · ')))))
            : h('div', { className: 'mwt-empty' }, needle ? t('noMatch') : t('noFiles')))))
  }

  /** Always mounted: toasts when a run finishes or needs you (one per teammate), browser notifications, the poll. */
  function Overlay() {
    const s = usePolling()
    const [toasts, setToasts] = React.useState([])
    const matesRef = React.useRef(s.mates); matesRef.current = s.mates
    React.useEffect(() => {
      const onItem = (x) => {
        if (!x.mateId || mateOnScreen(x.mateId)) return
        const mate = matesRef.current.find((m) => m.id === x.mateId) || { id: x.mateId, name: x.mateName || '' }
        setToasts((prev) => [...prev.filter((y) => y.item.mateId !== x.mateId).slice(-3), { id: itemKey(x) + ':' + Date.now(), item: x, mate }])
        const word = x.kind === 'ask' ? t('needsYouToast') : x.kind === 'failed' ? t('failedToast') : x.kind === 'remind' ? t('remindCard') : t('doneToast')
        try { if (mate.notify !== false && typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification((x.mateName || mate.name || '') + ' · ' + word, { body: plainWords(x.text || '') }) } catch {}
      }
      itemListeners.add(onItem)
      return () => { itemListeners.delete(onItem) }
    }, [])
    React.useEffect(() => { if (!toasts.length) return; const id = setTimeout(() => setToasts((prev) => prev.slice(1)), 8000); return () => clearTimeout(id) }, [toasts])
    if (!toasts.length) return null
    return h('div', { className: 'mwt mwt-toasts' }, h('style', null, STYLE), toasts.map(({ id, item, mate }) => {
      const word = item.kind === 'ask' ? t('needsYouToast') : item.kind === 'failed' ? t('failedToast') : item.kind === 'remind' ? t('remindCard') : t('doneToast')
      return h('div', { key: id, className: 'mwt-toast' },
        h(Avatar, { mate, size: 28 }),
        h('div', null, h('b', null, (item.mateName || mate.name || '') + ' · ' + word), item.text ? h('span', { className: 'sub' }, plainWords(item.text)) : null),
        h('button', { type: 'button', className: 'mwt-btn', onClick: () => { setToasts((prev) => prev.filter((y) => y.id !== id)); openMate(item.mateId, item.runId) } }, t('open')))
    }))
  }

  return { MatePage, FilesPage, Overlay, openMate, openNewMate, openFiles, openRoutine, notifyAside }
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
  // `children` declares child slots on the page entry; dsh then hands the page a bound `renderSlot` for them.
  const page = (key, order, label, iconName, Component, children) => {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key, locale: NS, inject: () => ({}), ...(children ? { children } : {}) }, function MyworkPage(props) { return h(Component, { renderSlot: props && typeof props.renderSlot === 'function' ? props.renderSlot : null }) }))
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: key, order, locale: NS, label: () => t(label), inject: () => ({}) }, function MyworkPageIcon() { return icon(iconName, { size: 16, strokeWidth: 1.6 }) }))
  }
  // The mate page declares 电脑 (list, root scope): other members register the right panel's picture into it.
  page(PANELS.mate, 1, 'mate', 'message-circle', c.MatePage, { [ASIDE_SLOT]: { kind: 'list', scope: 'root' } })
  ctx.effect(() => { try { return ctx.slots.subscribe(ASIDE_SLOT, c.notifyAside) } catch { return () => {} } }, PLUGIN + ': right panel entries')
  page(PANELS.files, 2, 'files', 'file-text', c.FilesPage)
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: PLUGIN, order: 45 }, function MyworkOverlay() { return h(c.Overlay) }))

  // Window events from the column (dsh-mywork-codex-ui) and other members: mywork:open-thread is the one contract.
  ctx.effect(() => {
    const onThread = (e) => {
      const d = e.detail || {}
      const id = d.id === undefined || d.id === null ? '' : String(d.id)
      const handled = d.kind === 'mate' || d.kind === 'new-mate' || d.kind === 'files' || (d.kind === 'routine' && !!id)
      if (!handled) return
      if (typeof e.preventDefault === 'function') e.preventDefault()
      if (d.kind === 'mate') c.openMate(id, d.runId ? String(d.runId) : '')
      else if (d.kind === 'new-mate') c.openNewMate()
      else if (d.kind === 'files') c.openFiles(id)
      else c.openRoutine(id, d.mateId ? String(d.mateId) : '')
    }
    window.addEventListener('mywork:open-thread', onThread)
    return () => { window.removeEventListener('mywork:open-thread', onThread) }
  }, PLUGIN + ': window events')

  // The app opens on the default teammate, not on a conversation (unless a session deep link is present). dsh's own
  // landing re-selects the conversation once or twice during startup, so the selection is re-asserted for a few seconds
  // and stops as soon as the user touches anything.
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
        if (!document.querySelector('.mwt-mate')) ctx.layout.selectPanel(PANELS.mate)
      } catch { /* panel not registered yet: try again */ }
    }, 250)
    return () => { clearInterval(timer); window.removeEventListener('pointerdown', onPointer, true); window.removeEventListener('keydown', onPointer, true) }
  }, PLUGIN + ': open the default teammate')
}
