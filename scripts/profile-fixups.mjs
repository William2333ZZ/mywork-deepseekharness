#!/usr/bin/env node
/**
 * Apply the kit's profile fix-ups to a dsh profile after `dsh plugin add`:
 * keep kit.json `profileOverrides` in the profile's package.json (pnpm overrides)
 * and re-run pnpm when they changed. Used by scripts/dev-env.sh and scripts/install.sh;
 * the kit's in-browser installer does the same through packages/kit/src/installer.js.
 *
 *   node scripts/profile-fixups.mjs [profileName|/abs/profile/dir]   (default: web; honours DSH_HOME)
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { dshHome, loadKit, reconcileCompatPatches, reconcileOverrides } from '../packages/kit/src/installer.js'

const raw = process.argv[2] || 'web'
const dir = isAbsolute(raw) ? raw : join(dshHome(), 'profiles', raw)
if (!existsSync(join(dir, 'package.json'))) { console.error(`profile not found: ${dir}`); process.exit(1) }
if (reconcileOverrides(dir, loadKit())) {
  console.log(`== profile ${dir}: pnpm overrides updated, reinstalling`)
  // --no-frozen-lockfile: the overrides just changed the profile's lockfile inputs (CI=1 would otherwise refuse).
  execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { cwd: dir, stdio: 'inherit', env: { ...process.env, CI: '1' } })
} else {
  console.log(`== profile ${dir}: overrides already in place`)
}
const patched = reconcileCompatPatches(dir)
if (patched.length) console.log('== compat patches applied: ' + patched.join(', '))
