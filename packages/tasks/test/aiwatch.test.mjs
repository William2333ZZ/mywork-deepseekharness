/**
 * 盯在用的 AI: the precheck (aiwatch.js) and the inventory readers (inventory.js), against fixtures — no network.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { categoryOf, dateIn, daysTo, htmlLines, LIST_HEADER, precheck, pushOf, readList, sameModel, spendOf, tierOf, toCsv, vendorOf } from '../src/aiwatch.js'
import { readOne, scanFiles } from '../src/inventory.js'

const NOW = new Date(2026, 9, 5, 10, 0, 0) // 2026-10-05
const row = (o) => LIST_HEADER.map((h) => o[h] || '')
export const LIST = toCsv(LIST_HEADER, [
  row({ 类型: '模型', 名称: 'deepseek-v4-flash', 供应商: 'DeepSeek', 模型ID或版本: 'deepseek-v4-flash', 哪里在用: '代码审查', 月用量或花费: '¥5,000' }),
  row({ 类型: '模型', 名称: 'qwen-max', 供应商: '阿里云百炼', 模型ID或版本: 'qwen-max', 哪里在用: '工单摘要', 月用量或花费: '¥2,000' }),
  row({ 类型: '模型', 名称: 'gpt-5.1', 供应商: 'OpenAI', 模型ID或版本: 'gpt-5.1', 哪里在用: '翻译' }),
  row({ 类型: '模型', 名称: 'gpt-4o', 供应商: 'OpenAI', 模型ID或版本: 'gpt-4o' }),
  row({ 类型: '模型', 名称: 'kimi-k2.6', 供应商: '月之暗面', 模型ID或版本: 'kimi-k2.6' }),
  row({ 类型: '模型', 名称: 'glm-4.6', 供应商: '智谱', 模型ID或版本: 'glm-4.6', 启用: '否' }),
  row({ 类型: 'SDK', 名称: 'openai', 供应商: 'OpenAI', 模型ID或版本: '4.52.0', 怎么知道的: 'package.json' }),
])
export const SOURCES = [
  { id: 'deepseek-updates', vendor: 'deepseek', title: 'DeepSeek 更新日志', url: 'https://ds/updates' },
  { id: 'moonshot-pricing', vendor: 'moonshot', title: 'Kimi 定价', url: 'https://moon/pricing', render: true },
]
const filler = '<p>' + '说明文字。'.repeat(80) + '</p>'
export function fixtures({ qwenIn = 2.4, qwenOut = 9.6 } = {}) {
  return {
    'https://deprecations.info/v1/deprecations.json': JSON.stringify([
      { provider: 'OpenAI', model_id: 'gpt-5.1', shutdown_date: '2027-04-01', replacement_models: ['gpt-6-sol'], url: 'https://platform.openai.com/docs/deprecations#x', deprecation_context: 'deprecated, removed April 1, 2027' },
      { provider: 'OpenAI', model_id: 'gpt-4o-2024-05-13', shutdown_date: '2026-10-12', url: 'https://platform.openai.com/docs/deprecations#y' },
      { provider: 'OpenAI', model_id: 'gpt-3.5-turbo-0301', shutdown_date: '2024-06-13' },
    ]),
    'https://models.dev/api.json': JSON.stringify({
      deepseek: { models: { 'deepseek-v4-flash': { id: 'deepseek-v4-flash', cost: { input: 0.15, output: 0.6 }, status: 'deprecated' } } },
      'alibaba-cn': { models: { 'qwen-max': { id: 'qwen-max', cost: { input: qwenIn, output: qwenOut } } } },
    }),
    'https://ds/updates': '<html><body>' + filler + '<h3>时间: 2026-09-10</h3><p>DeepSeek V4.1 Flash 已上线。旧版本模型 deepseek-v4-flash 现已下线，出于兼容考虑旧模型名仍可调用，请求由 V4.1 Flash 提供服务。</p><h3>时间: 2025-12-01</h3><p>deepseek-v4-flash 的旧说明升级为 V3.2。</p></body></html>',
    'https://registry.npmjs.org/openai/latest': JSON.stringify({ version: '7.28.0' }),
  }
}
export const fetchFrom = (map) => async (url) => { if (url in map) return map[url]; throw new Error('HTTP 404') }

test('the list: rows by header, vendors, in-use flags; ids match exactly or as alias vs snapshot', () => {
  const rows = readList(LIST)
  assert.equal(rows.length, 7)
  assert.deepEqual(rows.map((r) => r.vendor), ['deepseek', 'alibaba', 'openai', 'openai', 'moonshot', 'zhipu', 'openai'])
  assert.equal(rows[5].off, true)
  assert.equal(rows[0].where, '代码审查'); assert.equal(rows[0].spend, '¥5,000')
  assert.equal(sameModel('deepseek/deepseek-chat', 'deepseek-chat'), 'exact')
  assert.equal(sameModel('gpt-4o', 'gpt-4o-2024-05-13'), 'loose')
  assert.equal(sameModel('glm-4.6', 'glm-4.6-flashx'), '')
  assert.equal(vendorOf('', 'qwen-max'), 'alibaba'); assert.equal(vendorOf('火山方舟', 'x'), 'volcengine')
})

test('words: dates (incl. 年月日 and month names), days, spend, category of a line', () => {
  assert.equal(dateIn('将于三个月后（2026-07-24）停止使用', NOW), '2026-07-24')
  assert.equal(dateIn('2026年10月22日下线', NOW), '2026-10-22')
  assert.equal(dateIn('10月22日起', NOW), '2026-10-22')
  assert.equal(dateIn('removed on April 1, 2027', NOW), '2027-04-01')
  assert.equal(daysTo('2026-10-19', NOW), 14); assert.equal(daysTo('2026-09-10', NOW), -25)
  assert.deepEqual(spendOf('¥5,000'), { amount: 5000, currency: '¥' }); assert.deepEqual(spendOf('1.5 万元/月'), { amount: 15000, currency: '¥' }); assert.deepEqual(spendOf('$1.2k'), { amount: 1200, currency: '$' }); assert.equal(spendOf('很多'), null)
  assert.equal(categoryOf('旧模型名 x 仍可调用，但对应模型已下线，请求将由 Y 提供服务'), '改名重定向')
  assert.equal(categoryOf('x 将于 2026-07-24 停止使用'), '下线')
  assert.equal(categoryOf('输入价格 2元/百万tokens'), '调价')
  assert.equal(categoryOf('x 支持 128k 上下文'), '')
  assert.deepEqual(htmlLines('<script>x</script><p>a &amp; b</p><div>c</div>'), ['a & b'].concat([]).length ? ['a & b'] : [])
})

test('tiers are code: operational + exact + in use + ≤14 days → 立刻; a cut, a loose match, a far date, a release → not', () => {
  assert.equal(tierOf({ category: '下线', exact: true, days: 9 }), 'now')
  assert.equal(tierOf({ category: '下线', exact: true, days: 178 }), 'digest')
  assert.equal(tierOf({ category: '下线', exact: false, days: 3 }), 'digest')
  assert.equal(tierOf({ category: '调价', exact: true, days: 0, up: 0.3 }), 'now')
  assert.equal(tierOf({ category: '调价', exact: true, days: 0, up: -0.3 }), 'digest')
  assert.equal(tierOf({ category: '改名重定向', exact: true, days: -25 }), 'now')
  assert.equal(tierOf({ category: '发版', major: true }), 'digest')
  assert.equal(tierOf({ category: '发版', major: false }), 'seen')
  assert.equal(tierOf({ category: '页面变动', exact: true, days: 1 }), 'digest')
})

test('baseline: what already touches a row in use, one item per row, old news left out, browser-only pages listed as 没读到', async () => {
  const r = await precheck({ listText: LIST, state: {}, sources: SOURCES, options: { sdk: true }, fetchText: fetchFrom(fixtures()), now: NOW })
  assert.equal(r.baseline, true)
  const by = Object.fromEntries(r.changes.map((c) => [c.subject.split('（')[0], c]))
  // deepseek-v4-flash: the vendor's changelog (09/10, a redirect) wins over models.dev's undated 'deprecated'
  assert.equal(by['deepseek-v4-flash'].category, '改名重定向'); assert.equal(by['deepseek-v4-flash'].effective, '2026-09-10'); assert.equal(by['deepseek-v4-flash'].tier, 'now')
  assert.deepEqual(by['deepseek-v4-flash'].also, ['models.dev'])
  assert.equal(by['gpt-5.1'].tier, 'digest'); assert.equal(by['gpt-5.1'].days, 178); assert.deepEqual(by['gpt-5.1'].replacement, ['gpt-6-sol'])
  // gpt-4o is an alias: the snapshot's shutdown in 7 days is reported, but never 立刻
  assert.equal(by['gpt-4o'].exact, false); assert.equal(by['gpt-4o'].tier, 'digest')
  assert.equal(by.openai.category, '发版'); assert.equal(by.openai.tier, 'digest')
  assert.equal(r.changes.filter((c) => /deepseek-v4-flash/.test(c.subject)).length, 1)
  assert.ok(!r.changes.some((c) => /3\.5/.test(c.subject)), 'a 2024 shutdown is history')
  assert.ok(!r.changes.some((c) => c.row.name === 'glm-4.6'), 'an off row is not watched')
  assert.deepEqual(r.unreadable, [{ title: 'Kimi 定价', reason: '页面要用浏览器打开，脚本读不了' }])
  assert.match(by['deepseek-v4-flash'].headline, /代码审查在用/)
  // the push: rows, days, a link — never money
  const push = pushOf('盯在用的 AI', r.changes)
  assert.match(push, /deepseek-v4-flash/); assert.doesNotMatch(push, /¥|\$/)
  // the second run sees nothing new
  const again = await precheck({ listText: LIST, state: r.state, sources: SOURCES, options: { sdk: true }, fetchText: fetchFrom(fixtures()), now: NOW })
  assert.equal(again.changes.length, 0); assert.equal(again.baseline, false)
})

test('a price rise on a row in use: 立刻, with the monthly delta from 月用量或花费; the push keeps the money out', async () => {
  const first = await precheck({ listText: LIST, state: {}, sources: [], fetchText: fetchFrom(fixtures()), now: NOW })
  const r = await precheck({ listText: LIST, state: first.state, sources: [], fetchText: fetchFrom(fixtures({ qwenIn: 3.0, qwenOut: 12.0 })), now: NOW })
  assert.equal(r.changes.length, 1)
  const c = r.changes[0]
  assert.equal(c.category, '调价'); assert.equal(c.tier, 'now'); assert.ok(Math.abs(c.up - 0.25) < 1e-9)
  assert.equal(c.monthly.text, '按上月 ¥2,000 估，月费 +¥500')
  assert.doesNotMatch(pushOf('盯在用的 AI', r.changes), /¥|\$|月费/)
  // and a cut is 到点
  const down = await precheck({ listText: LIST, state: r.state, sources: [], fetchText: fetchFrom(fixtures({ qwenIn: 2.0, qwenOut: 8.0 })), now: NOW })
  assert.equal(down.changes[0].tier, 'digest')
})

test('a failing source fails alone; an empty list checks nothing', async () => {
  const r = await precheck({ listText: LIST, state: {}, sources: SOURCES, fetchText: async () => { throw new Error('offline') }, now: NOW })
  assert.equal(r.changes.length, 0)
  assert.ok(r.unreadable.some((u) => u.title === 'models.dev' && /offline/.test(u.reason)))
  const e = await precheck({ listText: LIST_HEADER.join(',') + '\n', state: {}, sources: SOURCES, fetchText: fetchFrom({}), now: NOW })
  assert.equal(e.empty, true); assert.equal(e.changes.length, 0)
})

test('inventory: dependency files, gateway exports, LiteLLM, bills and code give candidate rows with 怎么知道的', () => {
  const pkg = JSON.stringify({ dependencies: { openai: '^4.52.0', express: '4' }, devDependencies: { '@anthropic-ai/sdk': '0.30.1' } })
  assert.deepEqual(readOne('package.json', pkg).rows.map((r) => [r.类型, r.名称, r.供应商, r.模型ID或版本]), [['SDK', '@anthropic-ai/sdk', 'Anthropic', '0.30.1'], ['SDK', 'openai', 'OpenAI', '4.52.0']])
  assert.deepEqual(readOne('requirements.txt', 'dashscope==1.20.0\nrequests\nlangchain-openai>=0.2 # x\n').rows.map((r) => r.名称), ['dashscope', 'langchain-openai'])
  const gateway = JSON.stringify({ data: [{ name: '客服', models: 'deepseek-chat,qwen-max', base_url: 'https://api.deepseek.com', status: 1, model_mapping: '{"qwen-max":"qwen-max-latest"}' }, { name: '旧', models: 'gpt-4o', status: 2 }] })
  const g = readOne('new-api.json', gateway)
  assert.equal(g.kind, '网关')
  assert.deepEqual(g.rows.map((r) => [r.模型ID或版本, r.怎么知道的, r.启用 || '']), [['deepseek-chat', '网关渠道「客服」', ''], ['qwen-max-latest', '网关渠道「客服」（qwen-max 映射到 qwen-max-latest）', ''], ['gpt-4o', '网关渠道「旧」，渠道已停用', '否']])
  const lite = readOne('config.yaml', 'model_list:\n  - model_name: fast\n    litellm_params:\n      model: deepseek/deepseek-chat\n')
  assert.deepEqual(lite.rows.map((r) => [r.名称, r.模型ID或版本, r.供应商]), [['fast', 'deepseek-chat', 'DeepSeek']])
  const bill = readOne('9月账单.csv', '日期,模型,金额(元)\n9/1,deepseek-chat,10.5\n9/2,deepseek-chat,4.5\n9/2,qwen-max,3\n9/3,云服务器,100\n')
  assert.deepEqual(bill.rows.map((r) => [r.模型ID或版本, r.月用量或花费]), [['deepseek-chat', '¥15（9月账单）'], ['qwen-max', '¥3（9月账单）']])
  const code = readOne('services/summary.py', 'client.chat(model="qwen-max")\nx = "hello"\n')
  assert.deepEqual(code.rows.map((r) => [r.模型ID或版本, r.怎么知道的]), [['qwen-max', '代码 services/summary.py:1']])
  const all = scanFiles([{ name: 'new-api.json', text: gateway }, { name: '9月账单.csv', text: '模型,金额\nqwen-max,3\n' }, { name: 'x.bin', text: '' }])
  const qwen = all.rows.find((r) => r.模型ID或版本 === 'qwen-max')
  assert.equal(qwen.月用量或花费, '¥3（9月账单）')
  assert.deepEqual(all.skipped, [{ name: 'x.bin', reason: '不认识这种文件' }])
})

test('a shutdown long past of a model still on the list is reported at the baseline (立刻); an old upgrade note is not', async () => {
  const list = toCsv(LIST_HEADER, [row({ 类型: '模型', 名称: 'deepseek-chat', 供应商: 'DeepSeek', 模型ID或版本: 'deepseek-chat', 哪里在用: '客服机器人' })])
  const page = '<p>' + '说明。'.repeat(120) + '</p><h3>时间: 2026-04-24</h3><p>旧的模型名 deepseek-chat 将于三个月后（2026-07-24）停止使用。当前阶段内指向 deepseek-v4-flash。</p><h3>时间: 2025-12-01</h3><p>deepseek-chat 已升级为 DeepSeek-V3.2。</p>'
  const r = await precheck({ listText: list, state: {}, sources: [{ vendor: 'deepseek', title: 'DeepSeek 更新日志', url: 'https://ds/u' }], fetchText: fetchFrom({ 'https://ds/u': page, 'https://models.dev/api.json': '{}' }), now: NOW })
  assert.deepEqual(r.changes.map((c) => [c.category, c.effective, c.tier]), [['下线', '2026-07-24', 'now']])
  assert.match(r.changes[0].headline, /07\/24 已生效 · 客服机器人在用/)
})

test('a vendor rewording old changelog lines does not bring them back as news', async () => {
  const list = toCsv(LIST_HEADER, [row({ 类型: '模型', 名称: 'deepseek-chat', 供应商: 'DeepSeek', 模型ID或版本: 'deepseek-chat' })])
  const src = [{ vendor: 'deepseek', title: 'DeepSeek 更新日志', url: 'https://ds/u' }]
  const pad = '<p>' + '说明。'.repeat(120) + '</p>'
  const v1 = pad + '<h3>时间: 2025-12-01</h3><p>deepseek-chat 已升级为 DeepSeek-V3.2。</p>'
  const v2 = pad + '<h3>时间: 2025-12-01</h3><p>deepseek-chat 现已升级为 DeepSeek-V3.2（非思考模式）。</p>'
  const first = await precheck({ listText: list, state: {}, sources: src, fetchText: fetchFrom({ 'https://ds/u': v1, 'https://models.dev/api.json': '{}' }), now: NOW })
  const next = await precheck({ listText: list, state: first.state, sources: src, fetchText: fetchFrom({ 'https://ds/u': v2, 'https://models.dev/api.json': '{}' }), now: NOW })
  assert.equal(next.changes.length, 0)
})

test('a model named only as the target of another model\'s change is not what changed', async () => {
  const list = toCsv(LIST_HEADER, [
    row({ 类型: '模型', 名称: 'deepseek-chat', 供应商: 'DeepSeek', 模型ID或版本: 'deepseek-chat', 哪里在用: '客服机器人' }),
    row({ 类型: '模型', 名称: 'deepseek-v4-flash', 供应商: 'DeepSeek', 模型ID或版本: 'deepseek-v4-flash', 哪里在用: '代码审查' }),
  ])
  const page = '<p>' + '说明。'.repeat(120) + '</p><h3>时间: 2026-04-24</h3><p>旧的模型名 deepseek-chat 将于（2026-07-24）停止使用。当前阶段内，这个模型名指向 deepseek-v4-flash 的非思考模式。</p>'
  const r = await precheck({ listText: list, state: {}, sources: [{ vendor: 'deepseek', title: 'DeepSeek 更新日志', url: 'https://ds/u' }], fetchText: fetchFrom({ 'https://ds/u': page, 'https://models.dev/api.json': '{}' }), now: NOW })
  assert.deepEqual(r.changes.map((c) => c.subject), ['deepseek-chat'])
  assert.equal(r.changes[0].quote, '旧的模型名 deepseek-chat 将于（2026-07-24）停止使用。')
})
