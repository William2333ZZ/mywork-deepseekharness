import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGate, inQuiet } from '../src/gate.js'

test('quiet hours wrap midnight', () => {
  const q = { from: '22:00', to: '07:30' }
  const at = (h, m) => new Date(2026, 9, 5, h, m)
  assert.equal(inQuiet(at(23, 0), q), true); assert.equal(inQuiet(at(3, 0), q), true); assert.equal(inQuiet(at(7, 29), q), true)
  assert.equal(inQuiet(at(7, 30), q), false); assert.equal(inQuiet(at(21, 59), q), false)
})

test('held at night and over budget; out as one message when the window opens', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gate-'))
  let clock = new Date(2026, 9, 5, 23, 10)
  const sent = []
  const gate = createGate({ file: join(dir, 'g.json'), send: async (t) => { sent.push(t) }, budget: 2, now: () => clock })
  assert.equal(await gate.push('A'), 'held'); assert.equal(await gate.push('B'), 'held')
  assert.equal(await gate.flush(), false); assert.equal(sent.length, 0)
  clock = new Date(2026, 9, 6, 7, 31)
  assert.equal(await gate.flush(), true)
  assert.equal(sent.length, 1); assert.match(sent[0], /攒下的 2 条[\s\S]*A[\s\S]*B/)
  assert.equal(await gate.push('C'), 'sent')
  assert.equal(await gate.push('D'), 'held') // budget 2: the merged message and C
  clock = new Date(2026, 9, 7, 9, 0)
  assert.equal(await gate.flush(), true); assert.equal(sent[sent.length - 1], 'D')
  rmSync(dir, { recursive: true, force: true })
})
