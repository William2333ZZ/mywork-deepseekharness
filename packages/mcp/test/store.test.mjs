import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalize, parseImport, splitArgs, entryConfig } from '../src/store.js'

test('splitArgs handles quotes', () => {
  assert.deepEqual(splitArgs('-y @modelcontextprotocol/server-github "a b" c'), ['-y', '@modelcontextprotocol/server-github', 'a b', 'c'])
})
test('normalize stdio and http', () => {
  const s = normalize({ name: 'github', command: 'npx', args: '-y @modelcontextprotocol/server-github', env: { GITHUB_TOKEN: 'x' } })
  assert.equal(s.ok, true); assert.equal(s.value.transport, 'stdio'); assert.deepEqual(s.value.args, ['-y', '@modelcontextprotocol/server-github'])
  assert.deepEqual(entryConfig(s.value), { serverName: 'github', transport: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: { GITHUB_TOKEN: 'x' } })
  const h = normalize({ name: 'web', url: 'http://localhost:3000/mcp', headers: { Authorization: 'Bearer t' } })
  assert.equal(h.value.transport, 'streamable-http')
  assert.equal(normalize({ name: 'bad name', command: 'x' }).ok, false)
  assert.equal(normalize({ name: 'nourl', transport: 'streamable-http' }).ok, false)
})
test('parseImport accepts mcpServers documents', () => {
  const r = parseImport(JSON.stringify({ mcpServers: { fs: { command: 'npx', args: ['-y', 'server-fs', '/tmp'] }, remote: { url: 'https://x.example/mcp' }, broken: { } } }))
  assert.equal(r.items.length, 2); assert.equal(r.errors.length, 1)
  assert.equal(parseImport('nope').errors.length, 1)
})
