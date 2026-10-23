import { parse } from 'yaml'

export type FrontmatterSplit = {
  data: unknown
  body: string
}

export function splitFrontmatter(source: string, file: string): FrontmatterSplit {
  const normalized = source.replace(/^\uFEFF/, '')
  if (!normalized.startsWith('---')) {
    return { data: {}, body: normalized }
  }
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(normalized)
  if (!match) {
    throw new Error(`${file}: Frontmatter 未闭合`)
  }
  const raw = match[1] ?? ''
  let data: unknown
  try {
    data = parse(raw, { schema: 'core' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${file}: 无法解析 Frontmatter（${message}）`, { cause: error })
  }
  return { data: data ?? {}, body: normalized.slice(match[0].length) }
}

export function readYamlDocument(source: string, file: string): unknown {
  try {
    return parse(source, { schema: 'core' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${file}: 无法解析 YAML（${message}）`, { cause: error })
  }
}
