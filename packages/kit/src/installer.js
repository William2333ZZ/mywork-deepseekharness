/**
 * dsh-mywork-kit — installer (host side, pure module: no dsh services, unit-testable).
 *
 * Responsibilities:
 *   • locate the dsh profile this kit is installed into
 *   • report each member's install state (installed / version / active layer)
 *   • install or update members with pnpm inside the profile directory, then
 *     append every installed bundle package to `dsh.profile.bundles` — the
 *     same reconciliation `dsh plugin add` performs.
 *
 * Why not just list members as `dependencies` of the kit package? dsh only
 * activates the patch layer of a profile's DIRECT dependencies, so transitive
 * bundles would be installed but never mounted. The kit therefore installs
 * members as first-class profile plugins, which also lets users remove any
 * member independently with `dsh plugin --profile web remove <name>`.
 */
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const SELF_NAME = 'dsh-mywork-kit'
const here = dirname(fileURLToPath(import.meta.url))
export const KIT_DIR = resolve(here, '..')

export function loadKit(kitDir = KIT_DIR) {
  return JSON.parse(readFileSync(join(kitDir, 'kit.json'), 'utf8'))
}

export function dshHome(env = process.env) {
  return env.DSH_HOME || join(homedir(), '.dsh')
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
}

/** Is this kit checkout link-installed (developer mode) rather than copied by pnpm? */
export function isLinkedCheckout(profileDir, kitDir = KIT_DIR) {
  const inProfile = join(profileDir, 'node_modules', SELF_NAME)
  try { return realpathSync(inProfile) === realpathSync(kitDir) && !realpathSync(kitDir).startsWith(realpathSync(profileDir)) } catch { return false }
}

/**
 * Find the profile that has this kit installed. Preference order:
 *   1. env DSH_MYWORK_KIT_PROFILE (profile name or absolute path)
 *   2. a profile whose node_modules/dsh-mywork-kit realpath is this checkout
 *   3. the first profile that has the kit at all
 */
export function findProfile(env = process.env, kitDir = KIT_DIR) {
  const probe = (dir) => existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'node_modules', SELF_NAME))
  if (env.DSH_MYWORK_KIT_PROFILE) {
    const raw = env.DSH_MYWORK_KIT_PROFILE
    const dir = isAbsolute(raw) ? raw : join(dshHome(env), 'profiles', raw)
    return probe(dir) ? { name: raw, dir } : null
  }
  const profilesDir = join(dshHome(env), 'profiles')
  let names = []
  try { names = readdirSync(profilesDir).filter((n) => !n.startsWith('.') && n !== 'node_modules') } catch { return null }
  const found = []
  for (const name of names) {
    const dir = join(profilesDir, name)
    if (!probe(dir)) continue
    let real = null
    try { real = realpathSync(join(dir, 'node_modules', SELF_NAME)) } catch { /* ignore */ }
    found.push({ name, dir, real })
  }
  if (found.length === 0) return null
  let selfReal = null
  try { selfReal = realpathSync(kitDir) } catch { /* ignore */ }
  return found.find((f) => f.real === selfReal) || found[0]
}

export function readManifest(profileDir) { return readJson(join(profileDir, 'package.json')) || {} }
export function writeManifest(profileDir, manifest) { writeFileSync(join(profileDir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n') }

function installedVersion(profileDir, name) {
  const pkg = readJson(join(profileDir, 'node_modules', ...name.split('/'), 'package.json'))
  return pkg && typeof pkg.version === 'string' ? pkg.version : null
}
function declaresBundle(profileDir, name) {
  const pkg = readJson(join(profileDir, 'node_modules', ...name.split('/'), 'package.json'))
  return !!(pkg && pkg.dsh && pkg.dsh.bundle && typeof pkg.dsh.bundle.patch === 'string')
}

/** Snapshot the bundle list at boot so "installed but not yet mounted" can be flagged. */
export function captureBootState(env = process.env) {
  const p = findProfile(env)
  const m = p ? readManifest(p.dir) : {}
  const bundles = (m.dsh && m.dsh.profile && Array.isArray(m.dsh.profile.bundles)) ? m.dsh.profile.bundles : []
  return { bundles: new Set(bundles) }
}

export function status(env = process.env, boot = { bundles: new Set() }, kit = loadKit()) {
  const profile = findProfile(env)
  if (!profile) return { ok: false, error: 'profile not found (is the kit installed with `dsh plugin --profile <name> add …`?)', kit: { name: kit.name, description: kit.description, groups: kit.groups }, members: [] }
  const manifest = readManifest(profile.dir)
  const bundles = (manifest.dsh && manifest.dsh.profile && Array.isArray(manifest.dsh.profile.bundles)) ? manifest.dsh.profile.bundles : []
  const linked = isLinkedCheckout(profile.dir)
  const members = kit.members.map((m) => {
    const version = installedVersion(profile.dir, m.name)
    const installed = version !== null
    const active = bundles.includes(m.name)
    return {
      ...m,
      installed,
      version,
      active,
      needsRestart: installed && active && !boot.bundles.has(m.name),
      localAvailable: linked && !!m.local && existsSync(join(KIT_DIR, m.local, 'package.json')),
    }
  })
  return {
    ok: true,
    kit: { name: kit.name, description: kit.description, groups: kit.groups },
    profile: { name: profile.name, dir: profile.dir, linked },
    members,
    installedCount: members.filter((m) => m.installed).length,
    requiredMissing: members.filter((m) => m.required && !m.installed).length,
    needsRestartCount: members.filter((m) => m.needsRestart).length,
  }
}

function run(cmd, args, cwd, env = process.env, timeoutMs = 600000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, env: { ...env, CI: '1' }, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ ok: !error, code: error && typeof error.code === 'number' ? error.code : (error ? 1 : 0), stdout: String(stdout || ''), stderr: String(stderr || ''), error: error ? String(error.message || error) : null })
    })
  })
}

/** Append every direct dependency that declares dsh.bundle to the profile's bundle list. */
export function reconcileBundles(profileDir) {
  const manifest = readManifest(profileDir)
  const deps = Object.keys(manifest.dependencies || {})
  manifest.dsh = manifest.dsh || {}
  manifest.dsh.profile = manifest.dsh.profile || {}
  const bundles = Array.isArray(manifest.dsh.profile.bundles) ? manifest.dsh.profile.bundles.slice() : []
  let changed = false
  for (const name of deps) {
    if (!bundles.includes(name) && declaresBundle(profileDir, name)) { bundles.push(name); changed = true }
  }
  const kept = bundles.filter((b) => b.startsWith('@deepseek-ai/dsh-') || deps.includes(b))
  if (kept.length !== bundles.length) changed = true
  if (changed) { manifest.dsh.profile.bundles = kept; writeManifest(profileDir, manifest) }
  return kept
}

/**
 * Keep the profile's pnpm overrides in sync with kit.json `profileOverrides`.
 * Returns true when package.json changed (the caller must run pnpm again).
 */
export function reconcileOverrides(profileDir, kit = loadKit()) {
  const wanted = kit.profileOverrides || {}
  const manifest = readManifest(profileDir)
  const current = (manifest.pnpm && manifest.pnpm.overrides) || {}
  let changed = false
  for (const [name, spec] of Object.entries(wanted)) if (current[name] !== spec) { current[name] = spec; changed = true }
  if (changed) { manifest.pnpm = { ...(manifest.pnpm || {}), overrides: current }; writeManifest(profileDir, manifest) }
  return changed
}

/**
 * Drop members that the kit retired (kit.json `retired`: name → reason) from an existing profile:
 * removes the dependency and the bundle row. Returns true when package.json changed (run pnpm again).
 */
export function reconcileRetired(profileDir, kit = loadKit()) {
  const retired = Object.keys(kit.retired || {})
  if (retired.length === 0) return false
  const manifest = readManifest(profileDir)
  let changed = false
  for (const name of retired) {
    if (manifest.dependencies && name in manifest.dependencies) { delete manifest.dependencies[name]; changed = true }
    const bundles = manifest.dsh && manifest.dsh.profile && Array.isArray(manifest.dsh.profile.bundles) ? manifest.dsh.profile.bundles : null
    if (bundles && bundles.includes(name)) { manifest.dsh.profile.bundles = bundles.filter((b) => b !== name); changed = true }
  }
  if (changed) writeManifest(profileDir, manifest)
  return changed
}

/**
 * Small source-level compatibility patches for members whose published build lags dsh.
 * Each patch is idempotent and only touches the named file when the exact anchor is present.
 * Returns the names of the patches applied this time.
 */
export const COMPAT_PATCHES = [
  // dsh-univer-office 0.3.x predates dsh 0.1.6-alpha.2 (list-slot turnTail with an id, the owner-props
  // PreviewCard, and the bundle-config settings surface). Ported from upstream PR #82 — drop once 0.3.3+ ships.
  {"name":"dsh-univer-office turnTail: list-slot id instead of chain select","pkg":"dsh-univer-office","versions":["0.3.0","0.3.1","0.3.2"],"file":"lib/client.js","from":"              name: \"conversation.chat.turnTail\",\n              priority: -10,\n              locale: UNIVER_LOCALE_NAMESPACE,\n              select: selectUniverTurn,\n              inject: () => ({ getViewerLocale })","to":"              name: \"conversation.chat.turnTail\",\n              id: \"univer-turn-preview\",\n              locale: UNIVER_LOCALE_NAMESPACE,\n              inject: () => ({ getViewerLocale })"},
  {"name":"dsh-univer-office PreviewCard resolves its own turn match","pkg":"dsh-univer-office","versions":["0.3.0","0.3.1","0.3.2"],"file":"lib/client.js","from":"    function PreviewCard(props) {\n      const timeline = props.useChat((snapshot) => snapshot.timeline);\n      const cwd = props.useSessions((state) => state.byId[props.sessionId]?.cwd);\n      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PreviewCardContent, { ...props, timeline, cwd });\n    }","to":"    function PreviewCard(props) {\n      const matched = selectUniverTurn(props);\n      const timeline = props.useChat((snapshot) => snapshot.timeline);\n      const cwd = props.useSessions((state) => state.byId[props.sessionId]?.cwd);\n      if (matched === null) return null;\n      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PreviewCardContent, { ...props, matched, timeline, cwd });\n    }"},
  {"name":"dsh-univer-office settings card on the alpha.2 Plugins page","pkg":"dsh-univer-office","versions":["0.3.0","0.3.1","0.3.2"],"file":"lib/client.js","from":"        settingsCtx.slots.inject(\n          \"settings.plugin.item\",","to":"        settingsCtx.slots.inject(\n          \"plugins.bundle.config\",\n          () => settingsCtx.slots.register(\n            {\n              name: \"plugins.bundle.config\",\n              key: \"dsh-univer-office\",\n              locale: UNIVER_LOCALE_NAMESPACE,\n              inject: () => ({ settings })\n            },\n            UniverSettingsCard\n          )\n        );\n        settingsCtx.slots.inject(\n          \"settings.plugin.item\","},
  {"name":"dsh-univer-office settings card summary view","pkg":"dsh-univer-office","versions":["0.3.0","0.3.1","0.3.2"],"file":"lib/client.js","from":"      if (snapshot.status !== \"ready\" || snapshot.value === void 0) return null;\n      const effective = snapshot.value.autoOpenLivePreview;","to":"      if (props.view === \"summary\") return props.t(\"settings.description\");\n      if (snapshot.status !== \"ready\" || snapshot.value === void 0) return null;\n      const effective = snapshot.value.autoOpenLivePreview;"},
]
export function reconcileCompatPatches(profileDir, patches = COMPAT_PATCHES) {
  const applied = []
  for (const p of patches) {
    if (!p.versions.includes(installedVersion(profileDir, p.pkg))) continue
    const file = join(profileDir, 'node_modules', p.pkg, p.file)
    let text
    try { text = readFileSync(file, 'utf8') } catch { continue }
    if (!text.includes(p.from) || text.includes(p.to)) continue
    writeFileSync(file, text.replace(p.from, p.to))
    applied.push(p.name)
  }
  return applied
}

/** Resolve the pnpm spec for a member: `link:` in a developer checkout, the npm range otherwise. */
export function specFor(member, profileDir) {
  if (member.local && isLinkedCheckout(profileDir) && existsSync(join(KIT_DIR, member.local, 'package.json'))) {
    return 'link:' + resolve(KIT_DIR, member.local)
  }
  return member.range ? `${member.name}@${member.range}` : member.name
}

export async function install(names, env = process.env, kit = loadKit()) {
  const profile = findProfile(env)
  if (!profile) return { ok: false, error: 'profile not found' }
  const members = kit.members.filter((m) => !names || names.includes(m.name))
  if (members.length === 0) return { ok: false, error: 'nothing to install' }
  const specs = members.map((m) => specFor(m, profile.dir))
  let r = await run('pnpm', ['add', ...specs], profile.dir, env)
  if (r.ok && (reconcileOverrides(profile.dir, kit) | reconcileRetired(profile.dir, kit))) r = await run('pnpm', ['install', '--no-frozen-lockfile'], profile.dir, env)
  if (r.ok) reconcileCompatPatches(profile.dir)
  const bundles = r.ok ? reconcileBundles(profile.dir) : null
  const hint = /allowBuilds|ignored build scripts|blocked/i.test(r.stdout + r.stderr)
    ? 'pnpm blocked a build script. Add the package to `allowBuilds` in the profile\'s pnpm-workspace.yaml and retry.'
    : null
  return { ok: r.ok, specs, stdout: r.stdout.slice(-4000), stderr: r.stderr.slice(-4000), error: r.error, bundles, hint }
}

export async function update(names, env = process.env, kit = loadKit()) {
  const profile = findProfile(env)
  if (!profile) return { ok: false, error: 'profile not found' }
  const members = kit.members.filter((m) => (!names || names.includes(m.name)) && installedVersion(profile.dir, m.name) !== null)
  if (members.length === 0) return { ok: false, error: 'nothing to update' }
  let r = await run('pnpm', ['update', '--latest', ...members.map((m) => m.name)], profile.dir, env)
  if (r.ok && (reconcileOverrides(profile.dir, kit) | reconcileRetired(profile.dir, kit))) r = await run('pnpm', ['install', '--no-frozen-lockfile'], profile.dir, env)
  if (r.ok) reconcileCompatPatches(profile.dir)
  const bundles = r.ok ? reconcileBundles(profile.dir) : null
  return { ok: r.ok, stdout: r.stdout.slice(-4000), stderr: r.stderr.slice(-4000), error: r.error, bundles }
}

export async function checkUpdates(env = process.env, kit = loadKit()) {
  const profile = findProfile(env)
  if (!profile) return { ok: false, error: 'profile not found' }
  const out = []
  for (const m of kit.members) {
    const current = installedVersion(profile.dir, m.name)
    if (current === null) { out.push({ name: m.name, installed: false }); continue }
    const r = await run('pnpm', ['view', m.name, 'version'], profile.dir, env, 30000)
    const latest = r.ok ? r.stdout.trim().split('\n').pop().trim() : null
    out.push({ name: m.name, installed: true, current, latest, outdated: !!(latest && latest !== current) })
  }
  return { ok: true, members: out, outdatedCount: out.filter((x) => x.outdated).length }
}
