/**
 * Tiny Markdown → HTML for deliverables (headings, paragraphs, lists, code, tables,
 * quotes, emphasis, links). Escapes everything first; no raw HTML passes through.
 * Pure CommonJS so both the client bundle and node tests can require it.
 */
'use strict'

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

function inline(s) {
  let out = esc(s)
  out = out.replace(/`([^`]+)`/g, (_, c) => '<code>' + c + '</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
  // [[页名]] / [[页名|显示的字]] / [[页名#小节]]: a wiki link (the 知识库 page opens the page it names).
  out = out.replace(/\[\[([^\]\n|#]+)(?:#[^\]\n|]*)?(?:\|([^\]\n]+))?\]\]/g, (_, target, label) => '<a href="#" class="md-wiki" data-wiki="' + target.trim() + '">' + (label || target.split('/').pop()).trim() + '</a>')
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + '</a>')
  // A link to a page of the teammate's wiki (概念/注意力.md) opens it like [[…]]; any other file in its folder reads as its name.
  out = out.replace(/\[([^\]]+)\]\((?!https?:)([^)\s]+\.md)(?:#[^)\s]*)?\)/g, (_, t, u) => '<a href="#" class="md-wiki" data-wiki="' + u + '">' + t + '</a>')
  out = out.replace(/\[([^\]]+)\]\((?!https?:)[^)\s]+\)/g, '<span class="md-file">$1</span>')
  return out
}

function table(lines) {
  const rows = lines.map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
  const head = rows[0]
  const body = rows.slice(2)
  return '<table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
    body.map((r) => '<tr>' + head.map((_, i) => '<td>' + inline(r[i] === undefined ? '' : r[i]) + '</td>').join('') + '</tr>').join('') + '</tbody></table>'
}

function render(md) {
  const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let i = 0
  let para = []
  const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = [] } }
  while (i < lines.length) {
    const line = lines[i]
    if (/^```/.test(line)) {
      flush(); const buf = []; i += 1
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i += 1 }
      i += 1; out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); continue
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) { flush(); const n = Math.min(h[1].length + 1, 6); out.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>'); i += 1; continue }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); out.push('<hr>'); i += 1; continue }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1])) {
      flush(); const buf = []
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { buf.push(lines[i]); i += 1 }
      out.push(table(buf)); continue
    }
    if (/^>\s?/.test(line)) {
      flush(); const buf = []
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i += 1 }
      out.push('<blockquote>' + render(buf.join('\n')) + '</blockquote>'); continue
    }
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (li) {
      flush(); const ordered = /\d/.test(li[2]); const items = []
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i])
        if (!m) { if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i += 1; continue } break }
        items.push(m[3]); i += 1
      }
      out.push((ordered ? '<ol>' : '<ul>') + items.map((t) => '<li>' + inline(t) + '</li>').join('') + (ordered ? '</ol>' : '</ul>')); continue
    }
    if (!line.trim()) { flush(); i += 1; continue }
    para.push(line.trim()); i += 1
  }
  flush()
  return out.join('\n')
}

module.exports = { render, inline, esc }
