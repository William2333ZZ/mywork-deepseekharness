import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { findProfile, status, reconcileBundles, specFor, loadKit } from '../src/installer.js'

function fakeHome() {
  const home = mkdtempSync(join(tmpdir(), 'mywork-kit-'))
  const profile = join(home, 'profiles', 'web')
  mkdirSync(join(profile, 'node_modules', 'dsh-mywork-kit'), { recursive: true })
  writeFileSync(join(profile, 'node_modules', 'dsh-mywork-kit', 'package.json'), JSON.stringify({ name: 'dsh-mywork-kit', version: '0.1.0', dsh: { bundle: { patch: './cordis.patch.yml' } } }))
  writeFileSync(join(profile, 'package.json'), JSON.stringify({
    name: 'dsh-profile-web', private: true,
    dependencies: { 'dsh-mywork-kit': '0.1.0', 'dsh-mywork-shell': '0.1.0', 'some-lib': '1.0.0' },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-mywork-kit'] } },
  }, null, 2))
  mkdirSync(join(profile, 'node_modules', 'dsh-mywork-shell'), { recursive: true })
  writeFileSync(join(profile, 'node_modules', 'dsh-mywork-shell', 'package.json'), JSON.stringify({ name: 'dsh-mywork-shell', version: '0.1.0', dsh: { bundle: { patch: './cordis.patch.yml' } } }))
  mkdirSync(join(profile, 'node_modules', 'some-lib'), { recursive: true })
  writeFileSync(join(profile, 'node_modules', 'some-lib', 'package.json'), JSON.stringify({ name: 'some-lib', version: '1.0.0' }))
  return { home, profile }
}

test('kit.json is well-formed', () => {
  const kit = loadKit()
  assert.ok(Array.isArray(kit.members) && kit.members.length > 0)
  for (const m of kit.members) {
    assert.match(m.name, /^(@[a-z0-9-]+\/)?[a-z0-9-]+$/)
    assert.ok(m.label && m.desc && m.group in kit.groups, m.name)
  }
})

test('findProfile locates the profile that contains the kit', () => {
  const { home, profile } = fakeHome()
  const p = findProfile({ DSH_HOME: home })
  assert.equal(p.dir, profile)
  assert.equal(findProfile({ DSH_HOME: join(home, 'nope') }), null)
})

test('status reports installed / active / needsRestart', () => {
  const { home } = fakeHome()
  const s = status({ DSH_HOME: home }, { bundles: new Set(['dsh-mywork-kit']) })
  assert.equal(s.ok, true)
  const theme = s.members.find((m) => m.name === 'dsh-mywork-shell')
  assert.equal(theme.installed, true)
  assert.equal(theme.version, '0.1.0')
  assert.equal(theme.active, false) // installed but not yet in bundles
  const codex = s.members.find((m) => m.name === '@michengai/dsh-automation')
  assert.equal(codex.installed, false)
})

test('reconcileBundles appends bundle deps and ignores plain libraries', () => {
  const { home, profile } = fakeHome()
  const bundles = reconcileBundles(profile)
  assert.deepEqual(bundles, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-mywork-kit', 'dsh-mywork-shell'])
  const saved = JSON.parse(readFileSync(join(profile, 'package.json'), 'utf8'))
  assert.deepEqual(saved.dsh.profile.bundles, bundles)
  const s = status({ DSH_HOME: home }, { bundles: new Set(['dsh-mywork-kit']) })
  assert.equal(s.members.find((m) => m.name === 'dsh-mywork-shell').needsRestart, true)
})

test('specFor uses the npm range outside a linked checkout', () => {
  const { profile } = fakeHome()
  assert.equal(specFor({ name: 'dshmarket', range: '^1.50.0' }, profile), 'dshmarket@^1.50.0')
  assert.equal(specFor({ name: 'dsh-mywork-shell', range: '^0.1.0', local: '../shell' }, profile), 'dsh-mywork-shell@^0.1.0')
})

test('reconcileOverrides writes kit.json profileOverrides into the profile manifest once', async () => {
  const { reconcileOverrides } = await import('../src/installer.js')
  const { profile } = fakeHome()
  const kit = { profileOverrides: { '@deepseek-ai/dsh-scope': '-' } }
  assert.equal(reconcileOverrides(profile, kit), true)
  const saved = JSON.parse(readFileSync(join(profile, 'package.json'), 'utf8'))
  assert.deepEqual(saved.pnpm.overrides, { '@deepseek-ai/dsh-scope': '-' })
  assert.equal(reconcileOverrides(profile, kit), false)
})
