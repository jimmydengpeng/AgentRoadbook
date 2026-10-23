import fs from 'node:fs'
import path from 'node:path'

import { readYamlDocument, splitFrontmatter } from './frontmatter'
import {
  extractHttpUrls,
  extractMarkdownTargets,
  normalizeUrl,
  resolveLocalLink
} from './links'
import {
  formatZodIssues,
  moduleFileSchema,
  projectSchema,
  quizFileSchema,
  sourceFileSchema,
  topicSchema,
  type ModuleInfo,
  type Project,
  type QuizFile,
  type Source,
  type Topic
} from './schema'

const PRIVATE_NEEDLES = ['授权500人', '狗急vpn', 'gogojiasu', 'feishu-doxcn']
const FLAGSHIP_IDS = ['what-is-agent', 'agent-tool-calling', 'rag-basics']
const FLAGSHIP_HEADINGS = ['## 知识点概述', '## 核心原理', '## 最小示例', '## 常见问题', '## 知识自测', '## 参考资料']
const QUIZ_OPTIONAL_MODULES = new Set(['guide', 'resources', 'projects'])

export type PageDraft = {
  file: string
  absolute: string
  body: string
  data: Record<string, unknown>
  link: string
  folder: string
}

export type Catalog = {
  modules: ModuleInfo[]
  topics: Topic[]
  projects: Project[]
  quizzes: QuizFile[]
  sources: Source[]
  errors: string[]
}

export function collectCatalog(root: string): Catalog {
  const errors: string[] = []
  const docsDir = path.join(root, 'docs')
  const modules = readModules(root, errors)
  const pages = readPages(root, docsDir, errors)
  const topics: Topic[] = []
  const projects: Project[] = []

  for (const page of pages) {
    if (page.data.kind === 'project') {
      const project = readProject(page, errors)
      if (project) projects.push(project)
      continue
    }
    const topic = readTopic(page, modules, errors)
    if (topic) topics.push(topic)
  }

  sortTopics(topics, modules)
  projects.sort((left, right) => left.order - right.order)

  const quizzes = readQuizzes(root, errors)
  const sources = readSources(root, errors)
  if (modules.length > 0) crossCheck(root, docsDir, modules, topics, projects, quizzes, sources, pages, errors)
  errors.push(...findPrivateLeaks(root))
  return { modules, topics, projects, quizzes, sources, errors }
}

function readModules(root: string, errors: string[]): ModuleInfo[] {
  const file = path.join(root, 'content', 'modules.yaml')
  const relative = 'content/modules.yaml'
  if (!fs.existsSync(file)) {
    errors.push(`${relative}: 文件不存在`)
    return []
  }
  const data = readYaml(file, relative, errors)
  if (!data) return []
  const parsed = moduleFileSchema.safeParse(data)
  if (!parsed.success) {
    errors.push(...formatZodIssues(relative, parsed.error))
    return []
  }
  const ids = new Set<string>()
  const dirs = new Set<string>()
  const orders = new Set<number>()
  for (const moduleInfo of parsed.data.modules) {
    if (ids.has(moduleInfo.id)) errors.push(`${relative}: 模块 id 重复 ${moduleInfo.id}`)
    if (dirs.has(moduleInfo.dir)) errors.push(`${relative}: 目录重复 ${moduleInfo.dir}`)
    if (orders.has(moduleInfo.order)) errors.push(`${relative}: order 重复 ${moduleInfo.order}`)
    ids.add(moduleInfo.id)
    dirs.add(moduleInfo.dir)
    orders.add(moduleInfo.order)
  }
  return parsed.data.modules
}

function readPages(root: string, docsDir: string, errors: string[]): PageDraft[] {
  if (!fs.existsSync(docsDir)) {
    errors.push('docs: 目录不存在')
    return []
  }
  const pages: PageDraft[] = []
  for (const absolute of walkDocs(docsDir)) {
    const relative = toPosix(path.relative(root, absolute))
    const relativeDoc = toPosix(path.relative(docsDir, absolute))
    let source = ''
    try {
      source = fs.readFileSync(absolute, 'utf8')
    } catch (error) {
      errors.push(wrapRead(relative, error))
      continue
    }
    let split: { data: unknown; body: string }
    try {
      split = splitFrontmatter(source, relative)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      continue
    }
    if (!split.data || typeof split.data !== 'object' || Array.isArray(split.data)) {
      errors.push(`${relative}: Frontmatter 必须是对象`)
      continue
    }
    pages.push({
      file: relative,
      absolute,
      body: split.body,
      data: split.data as Record<string, unknown>,
      link: `/${relativeDoc.replace(/\.md$/, '')}`,
      folder: relativeDoc.split('/')[0] ?? ''
    })
  }
  return pages
}

function readTopic(page: PageDraft, modules: ModuleInfo[], errors: string[]): Topic | null {
  const parsed = topicSchema.safeParse(page.data)
  if (!parsed.success) {
    errors.push(...formatZodIssues(page.file, parsed.error))
    return null
  }
  const topic: Topic = { ...parsed.data, link: page.link, file: page.file }
  const moduleInfo = modules.find((item) => item.id === topic.module)
  if (!moduleInfo) {
    errors.push(`${page.file}: 未知模块 ${topic.module}`)
  } else if (moduleInfo.dir !== page.folder) {
    errors.push(`${page.file}: 文件应放在 docs/${moduleInfo.dir}/`)
  }
  if (topic.status === 'published' && (page.body.includes('::: info 待编写') || page.body.includes('待替换为正式正文'))) {
    errors.push(`${page.file}: 已发布页面仍是占位正文`)
  }
  if (topic.status === 'planned' && !page.body.includes('待编写')) {
    errors.push(`${page.file}: 待编写页面需要明确标出状态`)
  }
  return topic
}

function readProject(page: PageDraft, errors: string[]): Project | null {
  if (page.data.outline !== false) errors.push(`${page.file}: 项目页需要 outline: false`)
  if (!page.body.includes('<ProjectDetail')) errors.push(`${page.file}: 项目页需要 <ProjectDetail />`)
  const data = { ...page.data }
  delete data.kind
  delete data.outline
  delete data.layout
  delete data.titleTemplate
  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) {
    errors.push(...formatZodIssues(page.file, parsed.error))
    return null
  }
  const expected = `docs/projects/${parsed.data.id}.md`
  if (page.file !== expected) errors.push(`${page.file}: 项目文件名应是 ${parsed.data.id}.md`)
  const taskIds = new Set<string>()
  for (const task of parsed.data.tasks) {
    if (taskIds.has(task.id)) errors.push(`${page.file}: 任务 id 重复 ${task.id}`)
    taskIds.add(task.id)
  }
  return { ...parsed.data, link: page.link, file: page.file }
}

function readQuizzes(root: string, errors: string[]): QuizFile[] {
  const directory = path.join(root, 'quizzes')
  if (!fs.existsSync(directory)) {
    errors.push('quizzes: 目录不存在')
    return []
  }
  const quizzes: QuizFile[] = []
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith('.yaml') && !name.endsWith('.yml')) continue
    const absolute = path.join(directory, name)
    const relative = `quizzes/${name}`
    const data = readYaml(absolute, relative, errors)
    if (!data) continue
    const parsed = quizFileSchema.safeParse(data)
    if (!parsed.success) {
      errors.push(...formatZodIssues(relative, parsed.error))
      continue
    }
    if (name !== `${parsed.data.topicId}.yaml`) {
      errors.push(`${relative}: 文件名应是 ${parsed.data.topicId}.yaml`)
    }
    const seen = new Set<string>()
    for (const question of parsed.data.questions) {
      if (question.topicId !== parsed.data.topicId) {
        errors.push(`${relative}: ${question.id} 的 topicId 与文件不一致`)
      }
      if (!question.id.startsWith(`${parsed.data.topicId}-`)) {
        errors.push(`${relative}: ${question.id} 应以知识点 id 开头`)
      }
      if (question.type === 'choice' && !question.options.some((option) => option.id === question.answer)) {
        errors.push(`${relative}: ${question.id} 的答案不是选项 id`)
      }
      if (seen.has(question.id)) errors.push(`${relative}: 题目 id 重复 ${question.id}`)
      seen.add(question.id)
    }
    quizzes.push(parsed.data)
  }
  return quizzes
}

function readSources(root: string, errors: string[]): Source[] {
  const relative = 'sources/index.yaml'
  const absolute = path.join(root, 'sources', 'index.yaml')
  if (!fs.existsSync(absolute)) {
    errors.push(`${relative}: 文件不存在`)
    return []
  }
  const data = readYaml(absolute, relative, errors)
  if (!data) return []
  const parsed = sourceFileSchema.safeParse(data)
  if (!parsed.success) {
    errors.push(...formatZodIssues(relative, parsed.error))
    return []
  }
  const ids = new Set<string>()
  const urls = new Set<string>()
  for (const source of parsed.data.sources) {
    if (ids.has(source.id)) errors.push(`${relative}: 来源 id 重复 ${source.id}`)
    ids.add(source.id)
    if (source.url) {
      const url = normalizeUrl(source.url)
      if (urls.has(url)) errors.push(`${relative}: 来源 url 重复 ${source.url}`)
      urls.add(url)
    }
  }
  return parsed.data.sources
}

function crossCheck(
  root: string,
  docsDir: string,
  modules: ModuleInfo[],
  topics: Topic[],
  projects: Project[],
  quizzes: QuizFile[],
  sources: Source[],
  pages: PageDraft[],
  errors: string[]
): void {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]))
  const ids = new Set<string>()
  const orderByModule = new Map<string, Set<number>>()
  const groupOrder = new Map<string, number>()
  const groupNameOrder = new Map<string, string>()

  for (const topic of topics) {
    if (ids.has(topic.id)) errors.push(`${topic.file}: 知识点 id 重复 ${topic.id}`)
    ids.add(topic.id)
    const orders = orderByModule.get(topic.module) ?? new Set<number>()
    if (orders.has(topic.order)) errors.push(`${topic.file}: 模块内 order 重复 ${topic.order}`)
    orders.add(topic.order)
    orderByModule.set(topic.module, orders)
    if (topic.group && topic.groupOrder) {
      const key = `${topic.module}:${topic.group}`
      const previous = groupOrder.get(key)
      if (previous !== undefined && previous !== topic.groupOrder) {
        errors.push(`${topic.file}: 分组 ${topic.group} 的 groupOrder 不一致`)
      }
      groupOrder.set(key, topic.groupOrder)
      const orderKey = `${topic.module}:${topic.groupOrder}`
      const previousName = groupNameOrder.get(orderKey)
      if (previousName && previousName !== topic.group) {
        errors.push(`${topic.file}: groupOrder ${topic.groupOrder} 被多个分组使用`)
      }
      groupNameOrder.set(orderKey, topic.group)
    }
    for (const prerequisite of topic.prerequisites) {
      if (!topicById.has(prerequisite)) errors.push(`${topic.file}: 前置知识不存在 ${prerequisite}`)
    }
    for (const related of topic.related) {
      if (!topicById.has(related)) errors.push(`${topic.file}: 相关知识不存在 ${related}`)
    }
  }

  const moduleHasGroup = new Map<string, boolean>()
  for (const topic of topics) {
    const current = moduleHasGroup.get(topic.module)
    const grouped = Boolean(topic.group)
    if (current === undefined) moduleHasGroup.set(topic.module, grouped)
    else if (current !== grouped) errors.push(`${topic.file}: 同一模块的知识点要全部填写 group，或全部不填`)
  }

  for (const moduleInfo of modules) {
    if (!topics.some((topic) => topic.module === moduleInfo.id)) {
      errors.push(`content/modules.yaml: 模块 ${moduleInfo.id} 下没有知识点`)
    }
  }

  for (const project of projects) {
    for (const prerequisite of project.prerequisites) {
      if (!topicById.has(prerequisite)) errors.push(`${project.file}: 前置知识不存在 ${prerequisite}`)
    }
  }

  const quizByTopic = new Map<string, QuizFile>()
  const questionIds = new Set<string>()
  for (const quiz of quizzes) {
    if (!topicById.has(quiz.topicId)) errors.push(`quizzes: 题目关联了不存在的知识点 ${quiz.topicId}`)
    if (quizByTopic.has(quiz.topicId)) errors.push(`quizzes: 知识点 ${quiz.topicId} 有多份练习文件`)
    quizByTopic.set(quiz.topicId, quiz)
    for (const question of quiz.questions) {
      if (questionIds.has(question.id)) errors.push(`quizzes: 题目 id 重复 ${question.id}`)
      questionIds.add(question.id)
    }
  }

  for (const topic of topics) {
    const quiz = quizByTopic.get(topic.id)
    if (topic.status === 'published' && !QUIZ_OPTIONAL_MODULES.has(topic.module) && !quiz) {
      errors.push(`${topic.file}: 已发布知识点需要练习题`)
    }
  }

  for (const id of FLAGSHIP_IDS) {
    const topic = topicById.get(id)
    const page = pages.find((item) => item.file === topic?.file)
    if (!topic || !page) {
      errors.push(`缺少示例知识点 ${id}`)
      continue
    }
    if (topic.status !== 'published') errors.push(`${page.file}: 示例知识点必须是 published`)
    for (const heading of FLAGSHIP_HEADINGS) {
      if (!page.body.includes(heading)) errors.push(`${page.file}: 缺少 ${heading}`)
    }
    if (!page.body.includes('<QuizPanel')) errors.push(`${page.file}: 缺少 QuizPanel`)
  }

  const toolCalling = quizByTopic.get('agent-tool-calling')
  const toolTypes = new Set(toolCalling?.questions.map((question) => question.type) ?? [])
  const requiredTypes = [
    ['choice', '选择题'],
    ['short', '问答题'],
    ['code', '代码题']
  ] as const
  for (const [type, label] of requiredTypes) {
    if (!toolTypes.has(type)) errors.push(`agent-tool-calling: 缺少${label}`)
  }
  const toolPage = pages.find((page) => page.data.id === 'agent-tool-calling')
  if (toolPage && !toolPage.body.includes('```mermaid')) {
    errors.push(`${toolPage.file}: Tool Calling 需要一张 mermaid 流程图`)
  }

  const publishedUrls = new Set(sources.filter((source) => source.publish && source.url).map((source) => normalizeUrl(source.url ?? '')))
  for (const source of sources) {
    for (const topicId of source.topics) {
      if (!topicById.has(topicId)) errors.push(`sources/index.yaml: ${source.id} 关联了不存在的知识点 ${topicId}`)
    }
  }

  for (const page of pages) {
    checkPageLinks(page, docsDir, publishedUrls, errors)
  }
  for (const quiz of quizzes) {
    const relative = `quizzes/${quiz.topicId}.yaml`
    for (const url of extractHttpUrls(JSON.stringify(quiz))) {
      recordUrl(relative, url, publishedUrls, errors)
    }
  }
  for (const project of projects) {
    for (const reference of project.references) {
      recordUrl(project.file, reference.url, publishedUrls, errors)
    }
  }

  const gitignore = path.join(root, '.gitignore')
  if (!fs.existsSync(gitignore) || !/^raw\/?\s*$/m.test(fs.readFileSync(gitignore, 'utf8'))) {
    errors.push('.gitignore: 需要忽略 raw/')
  }
}

function checkPageLinks(page: PageDraft, docsDir: string, publishedUrls: Set<string>, errors: string[]): void {
  for (const target of extractMarkdownTargets(page.body)) {
    if (/^http:\/\//.test(target)) {
      errors.push(`${page.file}: 请使用 https 链接 ${target}`)
      continue
    }
    const resolved = resolveLocalLink(page.absolute, docsDir, target)
    if (resolved === 'missing') errors.push(`${page.file}: 无法解析链接 ${target}`)
    if (resolved === 'outside') errors.push(`${page.file}: 链接指向了站点之外 ${target}`)
  }
  for (const url of extractHttpUrls(page.body)) recordUrl(page.file, url, publishedUrls, errors)
}

function recordUrl(file: string, url: string, publishedUrls: Set<string>, errors: string[]): void {
  if (url.startsWith('http://')) {
    errors.push(`${file}: 请使用 https 链接 ${url}`)
    return
  }
  if (!publishedUrls.has(normalizeUrl(url))) {
    errors.push(`${file}: 外部链接未登记到 sources/index.yaml：${url}`)
  }
}

function findPrivateLeaks(root: string): string[] {
  const errors: string[] = []
  const files = [
    ...walkFiles(path.join(root, 'docs')),
    ...walkFiles(path.join(root, 'quizzes')),
    ...walkFiles(path.join(root, 'examples')),
    ...walkFiles(path.join(root, 'sources')),
    path.join(root, 'README.md'),
    path.join(root, 'AGENTS.md'),
    path.join(root, 'LICENSE')
  ]
  for (const file of files) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue
    if (!/\.(md|yaml|yml|py|txt|svg)$/.test(file) && !file.endsWith('LICENSE')) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const needle of PRIVATE_NEEDLES) {
      if (text.includes(needle)) {
        errors.push(`${toPosix(path.relative(root, file))}: 包含不能公开的资料片段`)
      }
    }
  }
  return errors
}

function sortTopics(topics: Topic[], modules: ModuleInfo[]): void {
  const moduleOrder = new Map(modules.map((moduleInfo) => [moduleInfo.id, moduleInfo.order]))
  topics.sort((left, right) => {
    const moduleDiff = (moduleOrder.get(left.module) ?? 999) - (moduleOrder.get(right.module) ?? 999)
    if (moduleDiff !== 0) return moduleDiff
    const groupDiff = (left.groupOrder ?? 0) - (right.groupOrder ?? 0)
    if (groupDiff !== 0) return groupDiff
    return left.order - right.order
  })
}

function readYaml(file: string, relative: string, errors: string[]): unknown | null {
  try {
    const source = fs.readFileSync(file, 'utf8')
    return readYamlDocument(source, relative)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : wrapRead(relative, error))
    return null
  }
}

function wrapRead(file: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return `${file}: 读取失败（${message}）`
}

function walkDocs(docsDir: string): string[] {
  const files: string[] = []
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'public') continue
        visit(full)
        continue
      }
      if (!entry.name.endsWith('.md') || entry.name.includes('[')) continue
      if (entry.name === 'index.md' && path.resolve(directory) === path.resolve(docsDir)) continue
      files.push(full)
    }
  }
  visit(docsDir)
  return files
}

function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return []
  const files: string[] = []
  const visit = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) visit(full)
      else files.push(full)
    }
  }
  visit(directory)
  return files
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}
