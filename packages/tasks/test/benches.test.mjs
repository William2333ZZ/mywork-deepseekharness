/**
 * The code halves of the teammates made for AI work (design/v2/AI-WORKERS.md), without a host: the arXiv list,
 * results.tsv, the code-research projects, 核引用 against a fake arXiv / Crossref.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { categoriesOf, parseFeed, picksOf, titleLines } from '../src/arxiv.js'
import { directionOf, ledgerLine, metricName, parseResults, summarize } from '../src/results.js'
import { markReviewed, scanProjects } from '../src/projects.js'
import { arxivIdOf, checkEntries, citesIn, firstFamily, parseBib, readDraft, reportMarkdown, titleOverlap } from '../src/cite.js'
import { BIB, fakeScholar, RSS, TEX } from './fakes.mjs'

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
  const picks = picksOf('# 2026-10-05\n\n## 必读\n\n### [2610.00001] Sparse …\n- 做了什么：比 2610.09999 快。\n\n[2610.00003] Plain line\n\n## 值得看\n- [2610.00002v2] KV …\n1. 2610.00004 numbered\n\n## 今天的面貌\n- 2610.00005 扎堆\n过了 2 篇')
  assert.deepEqual([...picks], [['2610.00001', 'must'], ['2610.00003', 'must'], ['2610.00002', 'worth'], ['2610.00004', 'worth']])
})

test('results.tsv: rows, keep / discard / crash, best so far against the baseline, for one night; the placeholder is no direction', () => {
  const rows = parseResults('commit\tval_bpb\tmemory_gb\tstatus\tdescription\na1\t0.9979\t44.0\tkeep\tbaseline\nb2\t0.9932\t44.2\tkeep\tLR 0.04\nc3\t1.0050\t44.0\tdiscard\tGeLU\nd4\t0.000000\t0.0\tcrash\tdouble width (OOM)\ne5\t0.9901\t44.1\tkeep\twarmdown\n')
  assert.deepEqual(rows.map((r) => [r.n, r.status, r.metric]), [[1, 'keep', 0.9979], [2, 'keep', 0.9932], [3, 'discard', 1.005], [4, 'crash', null], [5, 'keep', 0.9901]])
  const night = summarize(rows, 'lower', 2)
  assert.deepEqual([night.total, night.keep, night.discard, night.crash, night.best.commit, night.bestBefore.commit], [3, 1, 1, 1, 'e5', 'b2'])
  assert.deepEqual(summarize(rows).frontier.map((p) => p.metric), [0.9979, 0.9932, 0.9901])
  assert.equal(ledgerLine(night, 'val_bpb'), '3 次：保留 1 · 丢弃 1 · 崩溃 1；val_bpb 0.9932 → 0.9901（e5）')
  assert.equal(summarize(parseResults('commit\tacc\tmem\tstatus\tdescription\nx\t0.71\t1\tkeep\tbase\ny\t0.74\t1\tkeep\tmore data\n'), 'higher').best.commit, 'y')
  const seed = readFileSync(new URL('../templates/experiments/seed/program.md', import.meta.url), 'utf8')
  assert.deepEqual([directionOf(seed), metricName(seed)], ['lower', ''])
  assert.deepEqual([directionOf('- 指标：acc\n- 方向：越高越好'), metricName('- 指标：acc\n')], ['higher', 'acc'])
  assert.equal(ledgerLine(summarize([]), 'x'), '还没有实验记录。')
})

test('code research: one folder per question — 进行中 without a report, 未经你审 until marked, then 审过 with the date', () => {
  const dir = tmp()
  mkdirSync(join(dir, '2026-10-04-markdown-libs'))
  writeFileSync(join(dir, '2026-10-04-markdown-libs', 'README.md'), '# 哪个 Markdown 库最快\n\n> 未经你审\n\n## 结论\n\ncmarkgfm 最快，比 markdown-it-py 快 9 倍。\n\n## 怎么验证的\n…\n')
  mkdirSync(join(dir, '2026-10-05-pyodide'))
  writeFileSync(join(dir, '2026-10-05-pyodide', 'notes.md'), '# notes\n- 试了 emscripten\n')
  mkdirSync(join(dir, '材料'))
  writeFileSync(join(dir, '材料', 'notes.md'), 'x')
  const list = scanProjects(dir)
  assert.deepEqual(list.map((p) => [p.folder, p.state]), [['2026-10-05-pyodide', 'doing'], ['2026-10-04-markdown-libs', 'unreviewed']])
  assert.equal(list[1].gist, 'cmarkgfm 最快，比 markdown-it-py 快 9 倍。')
  assert.equal(list[1].title, '哪个 Markdown 库最快')
  markReviewed(dir, '2026-10-04-markdown-libs', '2026-10-05')
  assert.match(readFileSync(join(dir, '2026-10-04-markdown-libs', 'README.md'), 'utf8'), /^> 审过：2026-10-05$/m)
  assert.equal(scanProjects(dir).find((p) => p.folder === '2026-10-04-markdown-libs').state, 'reviewed')
  assert.throws(() => markReviewed(dir, '../x', '2026-10-05'))
  assert.throws(() => markReviewed(dir, '2026-10-05-pyodide', '2026-10-05'), /还没有报告/)
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
