/**
 * dsh-mywork-tasks — the 代码研究 teammate's projects, read by code (Simon Willison, "Code research projects with async
 * coding agents": one folder per question, notes.md appended as it goes, README.md as the report; nothing a person has
 * not reviewed leaves that repo). Every report says 「> 未经你审」 under its title until you mark it reviewed, which
 * replaces the line with 「> 审过：YYYY-MM-DD」; a folder with notes.md and no README.md is still being worked on.
 *
 *   scanProjects(dir) → Project[]   Project = { folder, title, date, state: 'doing' | 'unreviewed' | 'reviewed', gist, mtime }
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const UNREVIEWED = '> 未经你审'
const SKIP = new Set(['node_modules', '.git', '.mywork', '材料'])

/** The report's one-line answer: the first paragraph under 结论 (or 答案 / TL;DR), else the first paragraph. */
function gistOf(text) {
  const body = String(text || '').replace(/^#\s+.+$/m, '')
  const sec = body.match(/^#{2,4}\s*(?:结论|答案|tl;?dr|summary|结果)[^\n]*\n+([\s\S]*?)(?=\n#{1,4}\s|$)/im)
  const src = sec ? sec[1] : body
  for (const block of src.split(/\n\s*\n/)) {
    const b = block.trim()
    if (!b || /^(>|\||```|---)/.test(b)) continue
    // Read as plain text in the panel: no list marks, emphasis, code ticks or link syntax.
    const line = b.replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '').replace(/\*\*|__|`/g, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s*\n\s*/g, ' ')
    return line.length > 160 ? line.slice(0, 159) + '…' : line
  }
  return ''
}

export function scanProjects(dir) {
  let names = []
  try { names = readdirSync(dir) } catch { return [] }
  const out = []
  for (const n of names) {
    if (n.startsWith('.') || SKIP.has(n)) continue
    const p = join(dir, n)
    let st
    try { st = statSync(p) } catch { continue }
    if (!st.isDirectory()) continue
    const readme = join(p, 'README.md')
    const notes = join(p, 'notes.md')
    const hasReadme = existsSync(readme)
    if (!hasReadme && !existsSync(notes)) continue
    let text = ''
    try { text = hasReadme ? readFileSync(readme, 'utf8') : readFileSync(notes, 'utf8') } catch {}
    const h1 = text.match(/^#\s+(.+)$/m)
    const date = (n.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || ''
    let mtime = st.mtime
    for (const f of [readme, notes]) { try { const t = statSync(f).mtime; if (t > mtime) mtime = t } catch {} }
    const state = !hasReadme ? 'doing' : /^>\s*审过[:：]/m.test(text) ? 'reviewed' : 'unreviewed'
    out.push({ folder: n, title: h1 ? h1[1].trim() : n.replace(/^\d{4}-\d{2}-\d{2}-?/, '') || n, date, state, gist: hasReadme ? gistOf(text) : '', mtime: mtime.toISOString(), path: n + '/' + (hasReadme ? 'README.md' : 'notes.md') })
  }
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.mtime.localeCompare(a.mtime))
}

/** 「审过了」: the 未经你审 line becomes 「> 审过：date」 (added under the title when the report had none). */
export function markReviewed(dir, folder, date) {
  const f = String(folder || '')
  if (!f || f.includes('/') || f.includes('\\') || f.startsWith('.')) throw new Error('没有这个项目。')
  const file = join(dir, f, 'README.md')
  if (!existsSync(file)) throw new Error('这个项目还没有报告（README.md）。')
  const text = readFileSync(file, 'utf8')
  const line = '> 审过：' + date
  let next
  if (/^>\s*未经你审.*$/m.test(text)) next = text.replace(/^>\s*未经你审.*$/m, line)
  else if (/^>\s*审过[:：].*$/m.test(text)) next = text.replace(/^>\s*审过[:：].*$/m, line)
  else if (/^#\s+.+$/m.test(text)) next = text.replace(/^(#\s+.+)$/m, '$1\n\n' + line)
  else next = line + '\n\n' + text
  writeFileSync(file, next)
  return { folder: f, state: 'reviewed' }
}
