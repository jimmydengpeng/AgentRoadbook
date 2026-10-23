import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import { normalizeBase, pageHref } from '@content/base'
import { collectCatalog } from '@content/catalog'
import { applyEnvFile } from '@content/env-file'
import { filterProjects } from '@content/filter'
import { buildSidebar, flattenSidebarLinks } from '@content/sidebar'
import { hrefMatchesTopic } from '../docs/.vitepress/theme/sidebar-progress'

const root = process.cwd()

describe('站点路径', () => {
  test('空 base 和根路径都保持为斜杠', () => {
    expect(normalizeBase(undefined)).toBe('/')
    expect(normalizeBase(' / ')).toBe('/')
  })

  test('仓库名会补上首尾斜杠', () => {
    expect(normalizeBase('agent-roadbook')).toBe('/agent-roadbook/')
    expect(normalizeBase('/agent-roadbook')).toBe('/agent-roadbook/')
    expect(normalizeBase('/agent-roadbook/')).toBe('/agent-roadbook/')
  })

  test('页面链接在生产路径上带 html 后缀', () => {
    expect(pageHref('/agent/tool-calling')).toBe('/agent/tool-calling.html')
    expect(pageHref('/agent/tool-calling.html')).toBe('/agent/tool-calling.html')
    expect(pageHref('/')).toBe('/')
  })
})

describe('内容目录', () => {
  test('当前仓库的知识点、项目和练习可以通过校验', () => {
    const catalog = collectCatalog(root)
    expect(catalog.errors).toEqual([])
    expect(catalog.topics).toHaveLength(62)
    expect(catalog.projects.map((project) => project.id)).toEqual([
      'multi-tool-agent',
      'rag-assistant',
      'travel-planner'
    ])
    expect(catalog.quizzes.find((quiz) => quiz.topicId === 'agent-tool-calling')?.questions.map((question) => question.type)).toEqual([
      'choice',
      'short',
      'code'
    ])
  })

  test('侧边栏按路线展开，并把 Tool Calling 放在行动循环里', () => {
    const catalog = collectCatalog(root)
    const sidebar = buildSidebar(catalog.modules, catalog.topics, catalog.projects)
    expect(sidebar[0]?.text).toBe('开始学习')
    expect(sidebar[0]?.collapsed).toBe(false)
    const agent = sidebar.find((group) => group.text === 'Agent 核心原理')
    const action = agent?.items.find((item) => !('link' in item) && item.text === '行动循环')
    expect(action && !('link' in action) ? action.items.some((item) => 'link' in item && item.link === '/agent/tool-calling') : false).toBe(true)
    const links = flattenSidebarLinks(sidebar)
    expect(new Set(links).size).toBe(links.length)
    expect(links).toHaveLength(catalog.topics.length + catalog.projects.length)
  })

  test('深入难度只留下旅游规划项目', () => {
    const catalog = collectCatalog(root)
    expect(filterProjects(catalog.projects, { difficulty: 'advanced', tag: 'all' }).map((project) => project.id)).toEqual([
      'travel-planner'
    ])
    expect(filterProjects(catalog.projects, { difficulty: 'all', tag: 'Tool Calling' }).map((project) => project.id).sort()).toEqual([
      'multi-tool-agent',
      'travel-planner'
    ])
  })

  test('重复知识点 ID 会使校验失败', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'roadbook-'))
    write(fixture, 'content/modules.yaml', moduleYaml)
    write(fixture, '.gitignore', 'raw/\n')
    write(fixture, 'sources/index.yaml', sourceYaml)
    write(fixture, 'docs/agent/one.md', topic('same-id', 1))
    write(fixture, 'docs/agent/two.md', topic('same-id', 2))
    fs.mkdirSync(path.join(fixture, 'quizzes'))
    const catalog = collectCatalog(fixture)
    expect(catalog.errors.some((error) => error.includes('知识点 id 重复'))).toBe(true)
  })
})

describe('侧边栏进度标记', () => {
  test('带 base 和 html 后缀的链接仍能对应知识点', () => {
    expect(hrefMatchesTopic('/agent-roadbook/agent/tool-calling.html', '/agent/tool-calling')).toBe(true)
    expect(hrefMatchesTopic('/rag/basics.html', '/agent/tool-calling')).toBe(false)
  })
})

describe('环境变量文件', () => {
  test('已有的 shell 变量不会被 .env 覆盖', () => {
    const file = path.join(os.tmpdir(), `roadbook-env-${Date.now()}.env`)
    fs.writeFileSync(file, 'KEEP=from-file\nADDED=from-file\n# comment\n')
    const env: NodeJS.ProcessEnv = { KEEP: 'from-shell' }
    applyEnvFile(file, env)
    expect(env.KEEP).toBe('from-shell')
    expect(env.ADDED).toBe('from-file')
    fs.unlinkSync(file)
  })
})

const moduleYaml = `modules:
  - id: agent
    title: Agent 核心原理
    description: 用于校验失败路径的临时模块
    dir: agent
    order: 1
`

const sourceYaml = `sources:
  - id: temp-source
    title: 临时来源
    path: raw/private.md
    author: 测试
    type: paid-notes
    topics: []
    verification: restricted
    license: 未授权
    publish: false
    notes: 只用于校验测试，不进入站点。
`

function topic(id: string, order: number): string {
  return `---
id: ${id}
title: 临时知识点
description: 用来制造一个重复 ID 的失败样例
module: agent
order: ${order}
level: beginner
tags:
  - Agent
prerequisites: []
related: []
status: planned
estimatedMinutes: 10
updatedAt: "2026-10-23"
group: 测试
groupOrder: 1
---

# 临时知识点

::: info 待编写
本节只存在于测试夹具中。
:::
`
}

function write(rootDir: string, file: string, content: string): void {
  const target = path.join(rootDir, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}
