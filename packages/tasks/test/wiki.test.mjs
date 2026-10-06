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

test('dates in a wiki: a decision past its 重审 date, open action items that are late or due within three days (done ones and undated ones left out)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mywork-wiki-dates-'))
  mkdirSync(join(dir, 'wiki', '决定'), { recursive: true }); mkdirSync(join(dir, 'wiki', '人'), { recursive: true })
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') }
  writeFileSync(join(dir, 'wiki', 'index.md'), '# 索引\n- [[决定/选 Postgres]]\n- [[决定/不自建]]\n- [[人/王敏]]\n')
  writeFileSync(join(dir, 'wiki', '决定', '选 Postgres.md'), `# 选 Postgres\n\n- 重审：${d(-1)}\n`)
  writeFileSync(join(dir, 'wiki', '决定', '不自建.md'), `# 不自建\n\n- 重审：${d(30)}\n`)
  writeFileSync(join(dir, 'wiki', '人', '王敏.md'), `# 王敏\n\n- [ ] 定 Q4 范围（@王敏，截止 ${d(-2)}）\n- [ ] 写招聘 JD（@CTO，截止 ${d(2)}）\n- [ ] 下个月的事（截止 ${d(20)}）\n- [x] 已经做完（截止 ${d(-5)}）\n- [ ] 没日期的事\n`)
  mkdirSync(join(dir, 'wiki', '项目'), { recursive: true })
  writeFileSync(join(dir, 'wiki', '项目', 'Q4.md'), `# Q4\n\n- [ ] 定 Q4 范围（@王敏，截止 ${d(-2)}）\n`)
  const scan = scanWiki(dir)
  assert.deepEqual(scan.revisit.map((r) => r.title), ['选 Postgres'])
  assert.deepEqual(scan.actions[0].paths, ['wiki/人/王敏.md', 'wiki/项目/Q4.md'])
  assert.deepEqual(scan.actions.map((a) => [a.text.split('（')[0], a.late, a.who]), [['定 Q4 范围', true, '王敏'], ['写招聘 JD', false, 'CTO']])
  const lint = lintFindings(scan)
  assert.match(lint, /到了重审日期的页（1）：wiki\/决定\/选 Postgres\.md（重审 /)
  assert.match(lint, /过期的行动项（1）：定 Q4 范围/)
  assert.match(lint, /三天内到期的行动项（1）：写招聘 JD/)
  rmSync(dir, { recursive: true, force: true })
})
