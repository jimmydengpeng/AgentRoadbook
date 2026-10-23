import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NEEDLES = ['授权500人', '狗急vpn', 'gogojiasu', 'feishu-doxcn', 'raw/大模型']
const root = fileURLToPath(new URL('..', import.meta.url))
const dist = path.join(root, 'docs', '.vitepress', 'dist')
const errors: string[] = []

if (!fs.existsSync(dist)) {
  errors.push('docs/.vitepress/dist 不存在，请先构建')
} else {
  for (const file of walk(dist)) {
    if (!/\.(html|js|css|json|svg|txt|xml)$/.test(file)) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const needle of NEEDLES) {
      if (text.includes(needle)) {
        errors.push(`${path.relative(root, file)}: 构建产物包含不能公开的内容`)
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error)
  process.exit(1)
}

console.log('构建产物检查通过')

function walk(directory: string): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}
