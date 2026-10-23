import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

import { collectCatalog } from '../../../scripts/content/catalog'

export function catalogPlugin(root: string, githubRepository: string): Plugin {
  const modules: Record<string, () => string> = {
    'virtual:topics': () => `export const topics = ${JSON.stringify(collectCatalog(root).topics)}`,
    'virtual:projects': () => `export const projects = ${JSON.stringify(collectCatalog(root).projects)}`,
    'virtual:quizzes': () => `export const quizzes = ${JSON.stringify(collectCatalog(root).quizzes)}`,
    'virtual:modules': () => `export const modules = ${JSON.stringify(collectCatalog(root).modules)}`,
    'virtual:site': () => `export const githubRepository = ${JSON.stringify(githubRepository)}`
  }
  return {
    name: 'agent-roadbook-catalog',
    resolveId(source) {
      if (source in modules) return `\0${source}`
      return null
    },
    load(id) {
      if (!id.startsWith('\0virtual:')) return null
      const render = modules[id.slice(1)]
      return render ? render() : null
    },
    configureServer(server) {
      watchContent(server, root)
    }
  }
}

function watchContent(server: ViteDevServer, root: string): void {
  const normalizedRoot = root.split(path.sep).join('/')
  const reload = (file: string): void => {
    const normalized = file.split(path.sep).join('/')
    const watched =
      normalized.startsWith(`${normalizedRoot}/docs/`) ||
      normalized.startsWith(`${normalizedRoot}/quizzes/`) ||
      normalized.startsWith(`${normalizedRoot}/content/`)
    if (!watched) return
    server.ws.send({ type: 'full-reload' })
  }
  server.watcher.on('add', reload)
  server.watcher.on('change', reload)
  server.watcher.on('unlink', reload)
}
