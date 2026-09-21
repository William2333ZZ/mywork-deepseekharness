/**
 * dsh-mywork-schedule — reminders JSON file store (host side).
 *
 * File: $DSH_HOME/mywork/reminders.json (default ~/.dsh/mywork/reminders.json).
 * Writes are atomic (temp file + rename); a corrupt file is backed up as
 * `.corrupt-<timestamp>` and the store restarts empty instead of overwriting it.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, copyFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'

export function dshHome(env = process.env) {
  return env.DSH_HOME || join(homedir(), '.dsh')
}

export function defaultDataPath(env = process.env) {
  return join(dshHome(env), 'mywork', 'reminders.json')
}

export class ReminderStore {
  /** @param {string} [path] absolute path of the JSON file */
  constructor(path = defaultDataPath()) {
    this.path = path
    this.state = null
  }

  load() {
    if (this.state) return this.state
    if (!existsSync(this.path)) {
      this.state = { version: 1, items: [] }
      return this.state
    }
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8'))
      if (!parsed || !Array.isArray(parsed.items)) throw new Error('bad shape')
      this.state = { version: 1, items: parsed.items }
    } catch {
      const backup = this.path + '.corrupt-' + Date.now()
      try { copyFileSync(this.path, backup) } catch { /* ignore */ }
      this.state = { version: 1, items: [] }
    }
    return this.state
  }

  save() {
    mkdirSync(dirname(this.path), { recursive: true })
    const tmp = this.path + '.tmp-' + process.pid
    writeFileSync(tmp, JSON.stringify(this.state, null, 2) + '\n')
    renameSync(tmp, this.path)
  }

  list() { return this.load().items.slice() }

  get(id) { return this.load().items.find((r) => r.id === id) || null }

  add(value) {
    const st = this.load()
    const item = { id: randomBytes(5).toString('hex'), ...value, createdAt: new Date().toISOString() }
    st.items.push(item)
    this.save()
    return item
  }

  update(id, patch) {
    const st = this.load()
    const idx = st.items.findIndex((r) => r.id === id)
    if (idx === -1) return null
    st.items[idx] = { ...st.items[idx], ...patch }
    this.save()
    return st.items[idx]
  }

  remove(id) {
    const st = this.load()
    const before = st.items.length
    st.items = st.items.filter((r) => r.id !== id)
    if (st.items.length === before) return false
    this.save()
    return true
  }

  /**
   * Record that the occurrence at `at` fired. Idempotent: an older or equal
   * `at` than the recorded one is ignored. `once` reminders are disabled.
   */
  markFired(id, at) {
    const r = this.get(id)
    if (!r) return null
    const atIso = new Date(at).toISOString()
    if (r.lastFiredAt && r.lastFiredAt >= atIso) return r
    const patch = { lastFiredAt: atIso }
    if (r.kind === 'once') patch.enabled = false
    return this.update(id, patch)
  }
}
