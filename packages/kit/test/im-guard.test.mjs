import { test } from 'node:test'
import assert from 'node:assert/strict'
import { repairImWorkspaces } from '../src/im-guard.js'

const doc = () => ({ version: 2, channels: {
  a: { id: 'a', cwd: '/proj/.dsh-dev-home' },
  b: { id: 'b', cwd: '/proj/' },
  c: { id: 'c' },
} })

test('unregistered account cwd is repointed to the first registered workspace', () => {
  const { doc: out, changes } = repairImWorkspaces(doc(), ['/proj', '/other'])
  assert.deepEqual(changes, [{ id: 'a', from: '/proj/.dsh-dev-home', to: '/proj' }])
  assert.equal(out.channels.a.cwd, '/proj')
  assert.equal(out.channels.b.cwd, '/proj/') // trailing slash counts as registered, left alone
  assert.equal(out.channels.c.cwd, undefined)
})
test('nothing changes without registered workspaces', () => {
  const { changes } = repairImWorkspaces(doc(), [])
  assert.equal(changes.length, 0)
})
