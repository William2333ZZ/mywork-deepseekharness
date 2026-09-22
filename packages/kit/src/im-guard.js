/**
 * dsh-mywork-kit — IM account workspace guard (host side, zero dependencies).
 *
 * @michengai/dsh-im-connect stores each IM account's workspace in
 * $DSH_HOME/dsh-im-connect/channels.json as `cwd`. Its default is dsh's process
 * cwd, which is often NOT a registered workspace; every incoming message then
 * fails with "挂载会话失败 … 目标工作区不可用". Until upstream validates that
 * value, this guard rewrites unregistered paths to the first registered workspace
 * (at dsh boot, and from scripts/profile-fixups.mjs at install time).
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

export const dshHome = (env = process.env) => env.DSH_HOME || join(homedir(), '.dsh')
export const channelsPath = (env = process.env) => join(dshHome(env), 'dsh-im-connect', 'channels.json')

const norm = (p) => { let s = resolve(String(p || '')); if (s.length > 1) s = s.replace(/[\\/]+$/, ''); return process.platform === 'win32' || process.platform === 'darwin' ? s.toLowerCase() : s }

/**
 * Pure: given the channels document and the registered workspace paths, return
 * { doc, changes } where `changes` lists { id, from, to } for accounts repointed.
 * Accounts without a cwd or already pointing at a registered path are untouched;
 * nothing changes when no workspace is registered.
 */
export function repairImWorkspaces(doc, registeredPaths) {
  const registered = (registeredPaths || []).filter(Boolean)
  const changes = []
  if (!doc || typeof doc !== 'object' || !doc.channels || registered.length === 0) return { doc, changes }
  const known = new Set(registered.map(norm))
  const fallback = registered[0]
  for (const ch of Object.values(doc.channels)) {
    if (!ch || typeof ch !== 'object' || typeof ch.cwd !== 'string' || ch.cwd === '') continue
    if (known.has(norm(ch.cwd))) continue
    changes.push({ id: ch.id || '?', from: ch.cwd, to: fallback })
    ch.cwd = fallback
  }
  return { doc, changes }
}

/** Read registered workspace paths straight from dsh's storage file (install-time use). */
export function registeredWorkspacePaths(env = process.env) {
  try {
    const doc = JSON.parse(readFileSync(join(dshHome(env), 'storages', 'workspace.json'), 'utf8'))
    const table = doc && doc.tables && doc.tables.workspaces ? doc.tables.workspaces : {}
    const order = doc && doc.global && Array.isArray(doc.global.workspaceIds) ? doc.global.workspaceIds : Object.keys(table)
    return order.map((id) => table[id] && table[id].path).filter(Boolean)
  } catch { return [] }
}

/** Apply the repair to channels.json on disk. Returns the changes made. */
export function repairImWorkspacesFile(registeredPaths, path = channelsPath()) {
  if (!existsSync(path)) return []
  let doc
  try { doc = JSON.parse(readFileSync(path, 'utf8')) } catch { return [] }
  const { changes } = repairImWorkspaces(doc, registeredPaths)
  if (changes.length === 0) return []
  const tmp = path + '.tmp-' + process.pid
  writeFileSync(tmp, JSON.stringify(doc, null, 2) + '\n', { mode: 0o600 })
  renameSync(tmp, path)
  return changes
}
