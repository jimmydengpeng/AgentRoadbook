import fs from 'node:fs'
import path from 'node:path'

export function visibleText(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
}

export function extractMarkdownTargets(markdown: string): string[] {
  const text = visibleText(markdown)
  const targets: string[] = []
  const markdownLink = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  for (const match of text.matchAll(markdownLink)) {
    const target = match[1]
    if (target) targets.push(target)
  }
  const href = /href="([^"]+)"/g
  for (const match of text.matchAll(href)) {
    const target = match[1]
    if (target) targets.push(target)
  }
  return targets
}

export function extractHttpUrls(text: string): string[] {
  const urls: string[] = []
  const pattern = /https?:\/\/[^\s<>"')\]]+/g
  for (const match of visibleText(text).matchAll(pattern)) {
    urls.push(match[0].replace(/[.,;:]+$/, ''))
  }
  return urls
}

export function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '')
}

export function resolveLocalLink(fromFile: string, docsDir: string, target: string): 'external' | 'anchor' | 'ok' | 'outside' | 'missing' {
  if (target.includes('/raw/') || target.startsWith('raw/') || target.includes('\\raw\\')) return 'outside'
  const bare = target.split('#')[0]?.split('?')[0] ?? ''
  if (!bare) return 'anchor'
  if (bare.startsWith('mailto:')) return 'external'
  if (/^https?:\/\//.test(bare)) return 'external'
  const withoutHtml = bare.replace(/\.html$/, '')
  const candidates: string[] = []
  if (withoutHtml.startsWith('/')) {
    const relative = withoutHtml.slice(1)
    candidates.push(path.join(docsDir, 'public', relative))
    candidates.push(path.join(docsDir, relative))
    candidates.push(path.join(docsDir, `${relative}.md`))
    candidates.push(path.join(docsDir, relative, 'index.md'))
  } else {
    const base = path.resolve(path.dirname(fromFile), withoutHtml)
    candidates.push(base)
    candidates.push(`${base}.md`)
    candidates.push(path.join(base, 'index.md'))
  }
  const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
  if (!found) return 'missing'
  const relative = path.relative(docsDir, path.resolve(found))
  if (relative.startsWith('..') || path.isAbsolute(relative)) return 'outside'
  return 'ok'
}
