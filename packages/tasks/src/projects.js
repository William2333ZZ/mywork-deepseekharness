/**
 * dsh-mywork-tasks — 未经你审 (Simon Willison: AI output nobody has reviewed is slop until a person has; his research
 * repo keeps it apart). Any report a teammate writes may say 「> 未经你审」 under its title; the reading view then offers
 * 审过了, which replaces that line with 「> 审过：YYYY-MM-DD」. Nothing else reads or writes the mark.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

export const isUnreviewed = (text) => /^>\s*未经你审/m.test(String(text || ''))

/** 「审过了」 on `rel` (a .md inside `dir`): the 未经你审 line becomes 「> 审过：date」 (added under the title when missing). */
export function markReviewed(dir, rel, date) {
  const p = String(rel || '')
  const full = resolve(dir, p)
  const inside = relative(resolve(dir), full)
  if (!p || !inside || inside.startsWith('..') || isAbsolute(inside) || !/\.md$/i.test(p)) throw new Error('没有这份报告。')
  if (!existsSync(full)) throw new Error('没有这份报告。')
  const text = readFileSync(full, 'utf8')
  const line = '> 审过：' + date
  let next
  if (/^>\s*未经你审.*$/m.test(text)) next = text.replace(/^>\s*未经你审.*$/m, line)
  else if (/^>\s*审过[:：].*$/m.test(text)) next = text.replace(/^>\s*审过[:：].*$/m, line)
  else if (/^#\s+.+$/m.test(text)) next = text.replace(/^(#\s+.+)$/m, '$1\n\n' + line)
  else next = line + '\n\n' + text
  writeFileSync(join(dir, inside), next)
  return { path: inside.split('\\').join('/'), state: 'reviewed' }
}
