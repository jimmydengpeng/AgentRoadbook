import fs from 'node:fs'

export function applyEnvFile(file: string, env: NodeJS.ProcessEnv = process.env): void {
  if (!fs.existsSync(file)) return
  const source = fs.readFileSync(file, 'utf8')
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator <= 0) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '')
    if (env[key] === undefined) env[key] = value
  }
}
