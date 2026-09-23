#!/usr/bin/env node
/**
 * Assemble a self-contained Mywork-DSH_desktop desktop build.
 *
 *   node apps/desktop/build.mjs win-x64     → apps/desktop/dist/Mywork-DSH_desktop-win-x64.zip (portable)
 *   node apps/desktop/build.mjs mac-arm64   → apps/desktop/dist/Mywork-DSH_desktop.app (+ dmg via package-mac.sh)
 *
 * Layout inside the app's resources/:
 *   app/                 main.js + package.json (this Electron shell)
 *   runtime/node/        official Node 24 for the target platform
 *   runtime/dsh/         npm-installed @deepseek-ai/dsh with the target's native optional deps
 *   runtime/chrome/      Chrome for Testing (real-browser plugin + Univer screenshots)
 *   runtime/profile-template/  a fully installed dsh profile with every kit member
 *
 * Downloads are cached in apps/desktop/.cache. Requires: node ≥ 24, pnpm, unzip, curl (macOS host).
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..', '..')
const CACHE = join(here, '.cache')
const STAGING = join(here, 'staging')
const DIST = join(here, 'dist')
const DSH_VERSION = '0.1.6-alpha.2'
const ELECTRON = '44.4.3'
const NODE = '24.21.0'
const CHROME = '153.0.8010.52'

const TARGETS = {
  'win-x64': {
    os: 'win32', cpu: 'x64', arch: 'x64',
    electron: `https://github.com/electron/electron/releases/download/v${ELECTRON}/electron-v${ELECTRON}-win32-x64.zip`,
    node: `https://nodejs.org/dist/v${NODE}/node-v${NODE}-win-x64.zip`,
    chrome: `https://storage.googleapis.com/chrome-for-testing-public/${CHROME}/win64/chrome-win64.zip`,
    exe: 'electron.exe', appName: 'Mywork-DSH_desktop.exe',
  },
  'mac-arm64': {
    os: 'darwin', cpu: 'arm64', arch: 'arm64',
    electron: `https://github.com/electron/electron/releases/download/v${ELECTRON}/electron-v${ELECTRON}-darwin-arm64.zip`,
    node: `https://nodejs.org/dist/v${NODE}/node-v${NODE}-darwin-arm64.tar.gz`,
    chrome: `https://storage.googleapis.com/chrome-for-testing-public/${CHROME}/mac-arm64/chrome-mac-arm64.zip`,
  },
}

const target = process.argv[2]
const T = TARGETS[target]
if (!T) { console.error(`usage: build.mjs <${Object.keys(TARGETS).join('|')}>`); process.exit(2) }

const sh = (cmd, args, opts = {}) => {
  const label = opts.cwd ? `${basename(opts.cwd)}$ ` : '$ '
  console.log(label + [cmd, ...args].join(' '))
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (r.status !== 0) throw new Error(`${cmd} ${args[0]} failed (${r.status})`)
}
const download = (url) => {
  mkdirSync(CACHE, { recursive: true })
  const file = join(CACHE, basename(url))
  if (existsSync(file) && statSync(file).size > 1_000_000) { console.log('cached ' + basename(url)); return file }
  console.log('downloading ' + url)
  sh('curl', ['-L', '--fail', '--retry', '3', '-o', file + '.part', url])
  renameSync(file + '.part', file)
  return file
}
const unzip = (zip, dest) => { mkdirSync(dest, { recursive: true }); sh('unzip', ['-q', '-o', zip, '-d', dest]) }
const untar = (tgz, dest) => { mkdirSync(dest, { recursive: true }); sh('tar', ['-xzf', tgz, '-C', dest]) }
const rm = (p) => rmSync(p, { recursive: true, force: true })
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')
const env = { ...process.env, CI: '1' }

// ---------------------------------------------------------------------------
console.log(`\n== Mywork-DSH_desktop desktop build: ${target}\n`)
rm(STAGING); mkdirSync(STAGING, { recursive: true })

// 1. downloads
const electronZip = download(T.electron)
const nodePkg = download(T.node)
const chromeZip = download(T.chrome)

// 2. build + pack the in-repo plugins
console.log('\n== building in-repo plugins')
for (const p of ['shell', 'schedule', 'browser', 'kit', 'mcp']) {
  if (!existsSync(join(ROOT, 'packages', p, 'package.json'))) continue
  sh('node', [join(ROOT, 'scripts', 'build-client.mjs'), '.'], { cwd: join(ROOT, 'packages', p) })
}
sh('pnpm', ['run', '--silent', 'build'], { cwd: join(ROOT, 'packages', 'codex-ui'), env })
const PACKS = join(STAGING, 'packs'); mkdirSync(PACKS)
const kit = readJson(join(ROOT, 'packages', 'kit', 'kit.json'))
const localTarballs = new Map()
for (const m of kit.members.filter((m) => m.local)) {
  const dir = resolve(ROOT, 'packages', 'kit', m.local)
  const out = execFileSync('pnpm', ['pack', '--pack-destination', PACKS], { cwd: dir, env, encoding: 'utf8' }).trim().split('\n').pop()
  localTarballs.set(m.name, resolve(dir, out.trim()))
}
{ // the kit itself
  const out = execFileSync('pnpm', ['pack', '--pack-destination', PACKS], { cwd: join(ROOT, 'packages', 'kit'), env, encoding: 'utf8' }).trim().split('\n').pop()
  localTarballs.set('dsh-mywork-kit', resolve(join(ROOT, 'packages', 'kit'), out.trim()))
}
console.log('packed: ' + [...localTarballs.keys()].join(', '))

// 3. dsh itself for the target platform (npm honours --os/--cpu for optional deps)
console.log('\n== installing @deepseek-ai/dsh for ' + T.os + '/' + T.cpu)
const DSH_DIR = join(STAGING, 'dsh'); mkdirSync(DSH_DIR)
writeJson(join(DSH_DIR, 'package.json'), { name: 'mywork-dsh-runtime', private: true })
sh('npm', ['install', `@deepseek-ai/dsh@${DSH_VERSION}`, `--os=${T.os}`, `--cpu=${T.cpu}`, '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: DSH_DIR, env })

// 4. the profile template: every kit member installed for the target platform
console.log('\n== installing the profile template')
const PROFILE = join(STAGING, 'profile'); mkdirSync(PROFILE)
const devProfile = readJson(join(ROOT, '.dsh-dev-home', 'home', 'profiles', 'web', 'package.json'))
const dependencies = {}
for (const m of kit.members) dependencies[m.name] = localTarballs.has(m.name) ? 'file:' + join('..', 'packs', basename(localTarballs.get(m.name))) : m.range || '*'
dependencies['dsh-mywork-kit'] = 'file:' + join('..', 'packs', basename(localTarballs.get('dsh-mywork-kit')))
writeJson(join(PROFILE, 'package.json'), {
  name: 'dsh-profile-web', private: true,
  dependencies: Object.fromEntries(Object.entries(dependencies).sort()),
  pnpm: { overrides: kit.profileOverrides || {}, supportedArchitectures: { os: [T.os], cpu: [T.cpu] } },
  dsh: { profile: { bundles: devProfile.dsh.profile.bundles } },
})
writeFileSync(join(PROFILE, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')
writeFileSync(join(PROFILE, 'cordis.patch.yml'), '# Your patch layer for this dsh profile (applied after every bundle layer).\n[]\n')
writeFileSync(join(PROFILE, 'cordis.yml'), '# dsh profile root — composed from package.json dsh.profile.bundles + cordis.patch.yml.\n[]\n')
sh('pnpm', ['install', '--ignore-scripts', '--config.confirmModulesPurge=false'], { cwd: PROFILE, env })
// file: deps are copied, not linked, under the hoisted linker; make the manifest self-contained anyway
const manifest = readJson(join(PROFILE, 'package.json'))
for (const [name, spec] of Object.entries(manifest.dependencies)) if (spec.startsWith('file:')) manifest.dependencies[name] = readJson(join(PROFILE, 'node_modules', name, 'package.json')).version
writeJson(join(PROFILE, 'package.json'), manifest)
const { reconcileCompatPatches } = await import(join(ROOT, 'packages', 'kit', 'src', 'installer.js'))
const patched = reconcileCompatPatches(PROFILE)
if (patched.length) console.log('compat patches: ' + patched.join(', '))
for (const name of ['dsh-mywork-kit', 'dsh-mywork-codex-ui', 'dsh-univer-office', '@michengai/dsh-automation']) if (!existsSync(join(PROFILE, 'node_modules', name, 'package.json'))) throw new Error('profile template misses ' + name)

// 5. assemble the app folder
console.log('\n== assembling')
mkdirSync(DIST, { recursive: true })
const APP = join(DIST, target, 'Mywork-DSH_desktop'); rm(join(DIST, target)); mkdirSync(APP, { recursive: true })
let resources
if (T.os === 'win32') {
  unzip(electronZip, APP)
  renameSync(join(APP, T.exe), join(APP, T.appName))
  resources = join(APP, 'resources')
} else {
  unzip(electronZip, join(DIST, target))
  renameSync(join(DIST, target, 'Electron.app'), join(DIST, target, 'Mywork-DSH_desktop.app'))
  rm(APP)
  resources = join(DIST, target, 'Mywork-DSH_desktop.app', 'Contents', 'Resources')
}
rm(join(resources, 'default_app.asar'))
mkdirSync(join(resources, 'app'), { recursive: true })
cpSync(join(here, 'main.js'), join(resources, 'app', 'main.js'))
cpSync(join(here, 'package.json'), join(resources, 'app', 'package.json'))
const RT = join(resources, 'runtime'); mkdirSync(RT)
// node
const nodeTmp = join(STAGING, 'node'); mkdirSync(nodeTmp)
if (nodePkg.endsWith('.zip')) unzip(nodePkg, nodeTmp); else untar(nodePkg, nodeTmp)
const nodeInner = join(nodeTmp, readdirSync(nodeTmp).find((n) => n.startsWith('node-v')))
cpSync(nodeInner, join(RT, 'node'), { recursive: true })
// chrome
unzip(chromeZip, join(RT, 'chrome'))
// dsh + profile
cpSync(DSH_DIR, join(RT, 'dsh'), { recursive: true })
cpSync(PROFILE, join(RT, 'profile-template'), { recursive: true })
writeFileSync(join(T.os === 'win32' ? APP : join(DIST, target), T.os === 'win32' ? 'README-FIRST.txt' : 'README.txt'), [
  'Mywork-DSH_desktop — DeepSeek Harness + MyWork Kit（免安装）',
  '',
  T.os === 'win32'
    ? '1. 把整个文件夹解压到任意位置（路径最好不含中文和空格以外的特殊字符），双击 "Mywork-DSH_desktop.exe"。\n2. 首次运行 Windows SmartScreen 可能拦截：点“更多信息”→“仍要运行”（应用未签名）。\n3. 首次启动会把插件环境复制到 %APPDATA%\\MyWork DSH\\ ，之后的会话、设置、书签都在那里。'
    : '1. 把 "Mywork-DSH_desktop.app" 拖到“应用程序”。\n2. 首次打开右键 → 打开（应用未签名）。\n3. 数据在 ~/Library/Application Support/MyWork DSH/。',
  '4. 打开后到 设置 → 模型 填 DeepSeek API key。',
  '5. 自带 Chrome for Testing：实时浏览器和 Univer 截图不依赖系统 Chrome。',
  '6. 日志：数据目录下的 dsh.log。',
  `（dsh ${DSH_VERSION} · Electron ${ELECTRON} · Node ${NODE} · Chrome ${CHROME}）`,
].join('\n') + '\n')

// 6. archive
console.log('\n== archiving')
if (T.os === 'win32') {
  const zip = join(DIST, `Mywork-DSH_desktop-${target}.zip`); rm(zip)
  sh('zip', ['-q', '-r', '-X', zip, 'Mywork-DSH_desktop'], { cwd: join(DIST, target) })
  console.log('\nOK → ' + zip + ` (${(statSync(zip).size / 1048576).toFixed(0)} MB)`)
} else {
  console.log('\nOK → ' + join(DIST, target, 'Mywork-DSH_desktop.app') + '  (run apps/desktop/package-mac.sh for a dmg)')
}
