/**
 * What code does for teammates doing AI work (design/v2/AI-WORKERS.md), without a host: the arXiv list, results.tsv,
 * 未经你审 → 审过, 核引用 against a fake arXiv / Crossref.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { categoriesOf, parseFeed, titleLines } from '../src/arxiv.js'
import { directionOf, ledgerLine, metricName, parseResults, summarize } from '../src/results.js'
import { isUnreviewed, markReviewed } from '../src/projects.js'
import { arxivIdOf, checkEntries, citesIn, firstFamily, parseBib, readDraft, reportMarkdown, titleOverlap } from '../src/cite.js'
import { BIB, fakeScholar, ICS, RSS, TEX } from './fakes.mjs'
import { calendarSourceOf, eventsBetween, ianaOf, parseIcs } from '../src/ical.js'

const tmp = () => mkdtempSync(join(tmpdir(), 'mywork-benches-'))

test('arXiv: the whole day in its order, the type of each, entities decoded; the seed placeholder is no subscription', () => {
  const day = parseFeed(RSS([
    { id: '2610.00001', title: 'Sparse Attention &amp; Long Context', type: 'new' },
    { id: '2610.00002', title: 'KV Cache Compression', type: 'cross', cross: true },
    { id: '2609.11111', title: 'An Old Paper, Revised', type: 'replace' },
  ]))
  assert.equal(day.date, '2026-10-05')
  assert.deepEqual(day.items.map((x) => [x.id, x.type]), [['2610.00001', 'new'], ['2610.00002', 'cross'], ['2609.11111', 'replace']])
  assert.equal(day.items[0].title, 'Sparse Attention & Long Context')
  assert.deepEqual(day.items[1].cats, ['cs.CL', 'cs.LG'])
  assert.equal(day.items[0].abstract, 'An abstract.')
  assert.match(titleLines(day.items.slice(0, 1)), /^1\. \[2610\.00001\] Sparse Attention & Long Context（cs\.CL · 新）$/)
  assert.deepEqual(categoriesOf('## 订阅\n\n- 分类：（开张时写，arXiv 分类代号，例如 cs.CL, cs.LG）\n'), [])
  assert.deepEqual(categoriesOf('- 分类：cs.CL, cs.LG（主）、stat.ML'), ['cs.CL', 'cs.LG', 'stat.ML'])
  assert.deepEqual(categoriesOf('- 分类：（开张时写，例如 cs.CL, cs.LG）\n\n## 这位用户的要求\n- 分类：cs.AI'), ['cs.AI'])
})

test('results.tsv: rows, keep / discard / crash, best so far against the baseline, for one night; the placeholder is no direction', () => {
  const rows = parseResults('commit\tval_bpb\tmemory_gb\tstatus\tdescription\na1\t0.9979\t44.0\tkeep\tbaseline\nb2\t0.9932\t44.2\tkeep\tLR 0.04\nc3\t1.0050\t44.0\tdiscard\tGeLU\nd4\t0.000000\t0.0\tcrash\tdouble width (OOM)\ne5\t0.9901\t44.1\tkeep\twarmdown\n')
  assert.deepEqual(rows.map((r) => [r.n, r.status, r.metric]), [[1, 'keep', 0.9979], [2, 'keep', 0.9932], [3, 'discard', 1.005], [4, 'crash', null], [5, 'keep', 0.9901]])
  const night = summarize(rows, 'lower', 2)
  assert.deepEqual([night.total, night.keep, night.discard, night.crash, night.best.commit, night.bestBefore.commit], [3, 1, 1, 1, 'e5', 'b2'])
  assert.deepEqual(summarize(rows).frontier.map((p) => p.metric), [0.9979, 0.9932, 0.9901])
  assert.equal(ledgerLine(night, 'val_bpb'), '3 次：保留 1 · 丢弃 1 · 崩溃 1；val_bpb 0.9932 → 0.9901（e5）')
  assert.equal(summarize(parseResults('commit\tacc\tmem\tstatus\tdescription\nx\t0.71\t1\tkeep\tbase\ny\t0.74\t1\tkeep\tmore data\n'), 'higher').best.commit, 'y')
  const seed = readFileSync(new URL('../playbooks/experiments/seed/program.md', import.meta.url), 'utf8')
  assert.deepEqual([directionOf(seed), metricName(seed)], ['lower', ''])
  assert.deepEqual([directionOf('- 指标：acc\n- 方向：越高越好'), metricName('- 指标：acc\n')], ['higher', 'acc'])
  assert.equal(ledgerLine(summarize([]), 'x'), '还没有实验记录。')
})

test('未经你审: 审过了 replaces the line with the date (added under the title when missing); only a .md inside the folder', () => {
  const dir = tmp()
  mkdirSync(join(dir, '2026-10-04-markdown-libs'))
  const f = join(dir, '2026-10-04-markdown-libs', 'README.md')
  writeFileSync(f, '# 哪个 Markdown 库最快\n\n> 未经你审\n\n## 结论\n\ncmarkgfm 最快。\n')
  assert.equal(isUnreviewed(readFileSync(f, 'utf8')), true)
  assert.deepEqual(markReviewed(dir, '2026-10-04-markdown-libs/README.md', '2026-10-05'), { path: '2026-10-04-markdown-libs/README.md', state: 'reviewed' })
  assert.match(readFileSync(f, 'utf8'), /^# 哪个 Markdown 库最快\n\n> 审过：2026-10-05\n/)
  assert.equal(isUnreviewed(readFileSync(f, 'utf8')), false)
  writeFileSync(join(dir, 'plain.md'), '# 报告\n\n正文\n')
  markReviewed(dir, 'plain.md', '2026-10-06')
  assert.match(readFileSync(join(dir, 'plain.md'), 'utf8'), /^# 报告\n\n> 审过：2026-10-06\n\n正文/)
  assert.throws(() => markReviewed(dir, '../x.md', '2026-10-05'))
  assert.throws(() => markReviewed(dir, 'nope.md', '2026-10-05'))
  assert.throws(() => markReviewed(dir, '2026-10-04-markdown-libs', '2026-10-05'))
  rmSync(dir, { recursive: true, force: true })
})

test('核引用: the bib and the citing sentences; found / mismatched / not found / pending (a refused or failed request is never 查无) / a web page', async () => {
  const entries = parseBib(BIB)
  assert.deepEqual(entries.map((e) => e.key), ['vaswani2017attention', 'devlin2019bert', 'fake2024', 'brown2020gpt3', 'hfhub', 'flaky', 'gone'])
  assert.equal(entries[1].fields.title, '{BERT}: Pre-training of Deep Bidirectional Transformers')
  assert.deepEqual([arxivIdOf(entries[0].fields), arxivIdOf(entries[3].fields), arxivIdOf({ doi: '10.48550/arXiv.2401.00001' }), arxivIdOf({ url: 'https://arxiv.org/pdf/2310.12345v2' })], ['1706.03762', '2005.14165', '2401.00001', '2310.12345'])
  assert.deepEqual([firstFamily('Vaswani, Ashish and Shazeer, Noam'), firstFamily('Ashish Vaswani and others'), firstFamily('')], ['vaswani', 'vaswani', ''])
  assert.ok(titleOverlap('{BERT}: Pre-training of Deep Bidirectional Transformers', 'BERT: Pre-training of Deep Bidirectional Transformers') > 0.99)
  const cites = citesIn(TEX, '稿子/main.tex')
  assert.deepEqual(cites.map((c) => c.key), ['vaswani2017attention', 'devlin2019bert', 'fake2024', 'brown2020gpt3', 'hfhub', 'missingkey', 'flaky', 'gone'])
  assert.equal(cites[0].sentence, 'Transformers replaced recurrence \\citep{vaswani2017attention}.')
  assert.equal(cites[3].line, 2)
  assert.deepEqual(citesIn('如 [@vaswani2017attention; @devlin2019bert, p. 3] 所说。', 'x.md').map((c) => c.key), ['vaswani2017attention', 'devlin2019bert'])
  const calls = []
  const res = await checkEntries(entries, cites, { fetch: fakeScholar(calls), gapMs: 0 })
  const by = Object.fromEntries(res.entries.map((e) => [e.key, e]))
  assert.deepEqual(Object.fromEntries(res.entries.map((e) => [e.key, e.status])), { vaswani2017attention: 'ok', devlin2019bert: 'ok', fake2024: 'missing', brown2020gpt3: 'mismatch', hfhub: 'web', flaky: 'pending', gone: 'missing' })
  assert.deepEqual(by.brown2020gpt3.diffs, ['年份'])
  assert.deepEqual(by.brown2020gpt3.notes, ['第一作者顺序不同'])
  assert.deepEqual(by.devlin2019bert.notes, ['标题比正式的短或长（比如少了副标题）'])
  assert.match(by.gone.why, /DOI 10\.9999\/nope 不存在/)
  assert.match(by.flaky.why, /403/)
  assert.equal(by.vaswani2017attention.found.abstract, 'The Transformer, based solely on attention.')
  assert.equal(by.fake2024.cited[0].sentence, 'Bidirectional encoders help \\cite{devlin2019bert, fake2024}.')
  assert.deepEqual(res.undefinedKeys.map((u) => u.key), ['missingkey'])
  assert.deepEqual(res.counts, { total: 7, ok: 2, mismatch: 1, missing: 2, pending: 1, web: 1, nometa: 0, undefined: 1 })
  // Both arXiv ids in one request.
  assert.equal(calls.filter((u) => u.includes('id_list=')).length, 1)
  const md = reportMarkdown(res, '2026-10-05')
  assert.match(md, /## 查无此文（疑似，请确认）\n\n- \*\*fake2024\*\*/)
  assert.match(md, /## 待查（请求失败，稍后再跑）\n\n- \*\*flaky\*\*/)
  assert.ok(md.indexOf('查无此文（疑似') < md.indexOf('## 核实'))
})

test('核引用: the draft folder is read recursively (.bib, .tex, .md), and the network down makes everything pending, nothing missing', async () => {
  const dir = tmp()
  mkdirSync(join(dir, '稿子', 'sections'), { recursive: true })
  writeFileSync(join(dir, '稿子', 'refs.bib'), BIB)
  writeFileSync(join(dir, '稿子', 'sections', 'intro.tex'), TEX)
  const draft = readDraft(dir)
  assert.deepEqual(draft.files.sort(), ['稿子/refs.bib', '稿子/sections/intro.tex'])
  assert.equal(draft.entries.length, 7)
  const down = async () => { throw new Error('getaddrinfo ENOTFOUND') }
  const res = await checkEntries(draft.entries, draft.cites, { fetch: down, gapMs: 0 })
  assert.equal(res.counts.missing, 0)
  assert.deepEqual([res.counts.pending, res.counts.web], [6, 1])
  rmSync(dir, { recursive: true, force: true })
})

test('日历 from any service (.ics): recurring 1:1s with a skipped and a moved week, UTC, all-day, an Outlook zone name, 「second Tuesday」; times by code in the local zone', () => {
  const ev = parseIcs(ICS, { tz: 'Asia/Shanghai' })
  assert.equal(ev.length, 6)
  const list = eventsBetween(ev, Date.parse('2026-10-05T16:00:00Z'), Date.parse('2026-10-19T16:00:00Z'), { tz: 'Asia/Shanghai', now: Date.parse('2026-10-06T01:00:00Z') })
  assert.deepEqual(list.map((e) => [e.local, e.title]), [
    ['2026-10-06 09:30', '周会'],
    ['2026-10-09', '团建'],
    ['2026-10-09 08:00', 'Board sync withthe investors'], // Pacific time in October is daylight time: 17:00 PDT is 08:00 the next day here
    ['2026-10-12 15:00', '1:1 李想（改到下午）'], // the moved week stands in for 10:00; 10-07 is skipped (EXDATE)
    ['2026-10-13 16:00', '月度复盘'],
    ['2026-10-14 10:00', '1:1 李想'],
    ['2026-10-19 10:00', '1:1 李想'],
  ])
  assert.deepEqual([list[0].minutesFromNow, list[0].endLocal, list[0].weekday, list[1].allDay, list[5].attendees], [30, '10:30', '周二', true, ['李想']])
  assert.deepEqual([ianaOf('China Standard Time'), ianaOf('/mozilla.org/20050126_1/Asia/Shanghai'), ianaOf('Nowhere/Zone')], ['Asia/Shanghai', 'Asia/Shanghai', ''])
  assert.equal(calendarSourceOf('## 从哪拿\n- 日历：webcal://p01-caldav.icloud.com/published/2/abc。\n'), 'webcal://p01-caldav.icloud.com/published/2/abc')
  assert.equal(calendarSourceOf('- 日历：（开工时写）'), '')
  assert.equal(calendarSourceOf('- 日历：日程/导出.ics'), '日程/导出.ics')
})
