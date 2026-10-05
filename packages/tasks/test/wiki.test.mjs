import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lintFindings, logEntries, resolvePage, scanWiki, searchWiki, wikiLinks } from '../src/wiki.js'

test('wiki links, the log, and the wiki read by code', () => {
  assert.deepEqual(wikiLinks('见 [[A]]、[[概念/B|b]] 和 [[C#一节]]，不是 [x](y)'), ['A', '概念/B', 'C'])
  assert.deepEqual(logEntries('# 日志\n## [2026-10-01] 收资料 | 甲\n## [2026-10-02] 提问 | 乙\n'), [{ date: '2026-10-02', op: '提问', title: '乙' }, { date: '2026-10-01', op: '收资料', title: '甲' }])
  const dir = mkdtempSync(join(tmpdir(), 'wiki-'))
  mkdirSync(join(dir, 'wiki', '概念'), { recursive: true }); mkdirSync(join(dir, '原始资料', 'pdf'), { recursive: true })
  writeFileSync(join(dir, '原始资料', 'a.md'), 'x'); writeFileSync(join(dir, '原始资料', 'pdf', 'b.pdf'), 'x')
  writeFileSync(join(dir, 'wiki', 'index.md'), '# 索引\n- [[甲]]\n')
  writeFileSync(join(dir, 'wiki', '概念', '甲.md'), '# 甲\n链到 [[乙]] 和 [丙](丙.md)，还有 [[没有的页]]。')
  writeFileSync(join(dir, 'wiki', '概念', '乙.md'), '# 乙页\n回到 [[概念/甲]]。')
  writeFileSync(join(dir, 'wiki', '概念', '丙.md'), '# 丙\n独自一页。格式是 [[页名]]，出处写 [[来源/…]]，规矩在 [[AGENTS.md]]。')
  writeFileSync(join(dir, 'AGENTS.md'), '# 规矩')
  const s = scanWiki(dir)
  assert.equal(s.sources, 2)
  const by = Object.fromEntries(s.pages.map((p) => [p.title, p]))
  assert.deepEqual(by['甲'].links.map((l) => l.path).sort(), ['wiki/概念/丙.md', 'wiki/概念/乙.md'])
  assert.deepEqual(by['乙页'].inbound, ['wiki/概念/甲.md'])
  assert.deepEqual(s.orphans, [])
  assert.deepEqual(s.broken, [{ from: 'wiki/概念/甲.md', target: '没有的页' }])
  assert.deepEqual(s.unindexed.sort(), ['wiki/概念/丙.md', 'wiki/概念/乙.md'])
  assert.equal(resolvePage(s, '乙页'), 'wiki/概念/乙.md')
  assert.equal(resolvePage(s, '丙.md', 'wiki/概念/甲.md'), 'wiki/概念/丙.md')
  assert.deepEqual(searchWiki(dir, '独自').map((x) => x.title), ['丙'])
  assert.match(lintFindings(s), /断链（链到不存在的页）（1）：wiki\/概念\/甲\.md → \[\[没有的页\]\]/)
  rmSync(dir, { recursive: true, force: true })
})
