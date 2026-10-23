// 只在目标 Markdown 不存在时创建待编写页。已有文件不会被覆盖。
// 目录以 docs 里的 Frontmatter 为准，不要把这份清单当成第二份目录去改。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docs = path.join(root, 'docs')

const published = new Map([
  ['guide-intro', 'guide/intro.md'],
  ['guide-how-to-use', 'guide/how-to-use.md'],
  ['guide-learning-path', 'guide/learning-path.md'],
  ['guide-environment', 'guide/environment.md'],
  ['guide-progress', 'guide/progress.md'],
  ['what-is-agent', 'agent/what-is-agent.md'],
  ['agent-tool-calling', 'agent/tool-calling.md'],
  ['rag-basics', 'rag/basics.md'],
  ['projects-overview', 'projects/index.md'],
  ['resources-home', 'resources/index.md'],
  ['glossary', 'resources/glossary.md']
])

const moduleTitle = {
  fundamentals: '编程与大模型基础',
  agent: 'Agent 核心原理',
  rag: 'RAG 与知识库',
  memory: 'Memory 与上下文工程',
  frameworks: 'Agent 框架与协议',
  engineering: 'Agent 工程化'
}

const levelLabel = { beginner: '入门', intermediate: '进阶', advanced: '深入' }

const topics = [
  row('fundamentals/python-basics.md', 'python-basics', 'Python 基础回顾', '回顾函数、容器、异常和虚拟环境，保证后面的示例能读懂', 1, 'beginner', 20, ['Python'], ['guide-environment'], 'Python', 1),
  row('fundamentals/python-oop.md', 'python-oop', 'Python 面向对象', '用类组织工具和状态，为后面的注册表与配置对象做准备', 2, 'beginner', 20, ['Python'], ['python-basics'], 'Python', 1),
  row('fundamentals/python-async.md', 'python-async', 'Python 异步编程', '理解 async 与 await，知道模型请求为什么经常写成异步函数', 3, 'intermediate', 25, ['Python'], ['python-basics'], 'Python', 1),
  row('fundamentals/http-rest.md', 'http-rest', 'HTTP / REST API', '看懂请求、状态码和 JSON 响应，为调用模型 API 做准备', 4, 'beginner', 20, ['HTTP'], ['python-basics'], '接口与数据', 2),
  row('fundamentals/json-data.md', 'json-data', 'JSON 与数据结构', '掌握对象、数组和嵌套字段，这是工具参数和结构化输出的基础', 5, 'beginner', 15, ['JSON'], ['python-basics'], '接口与数据', 2),
  row('fundamentals/pydantic.md', 'pydantic', 'Pydantic 与数据校验', '用类型声明约束输入和模型输出，尽早发现缺字段和类型错误', 6, 'beginner', 25, ['Python'], ['python-oop', 'json-data'], '接口与数据', 2),
  row('fundamentals/llm-basics.md', 'llm-basics', 'LLM 基础概念', '建立模型、提示词和补全这些后续章节都会用到的基本概念', 7, 'beginner', 20, ['LLM'], ['guide-learning-path'], '大模型', 3),
  row('fundamentals/token-context.md', 'token-context', 'Token 与上下文窗口', '理解上下文是有限预算，以及超长对话会被截断或拒绝', 8, 'beginner', 20, ['LLM'], ['llm-basics'], '大模型', 3),
  row('fundamentals/prompt-engineering.md', 'prompt-engineering', 'Prompt Engineering', '把任务、约束和输出格式写进提示词，并知道提示词不能替代校验', 9, 'beginner', 25, ['Prompt'], ['llm-basics'], '大模型', 3),
  row('fundamentals/llm-api.md', 'llm-api', '大模型 API 调用', '完成一次带消息历史的聊天补全，并从环境变量读取密钥', 10, 'beginner', 25, ['LLM'], ['http-rest', 'json-data', 'llm-basics'], '大模型', 3),
  row('fundamentals/streaming.md', 'streaming', '流式输出', '理解模型可以逐段返回文本，以及调用方如何消费这些片段', 11, 'intermediate', 20, ['LLM'], ['llm-api'], '大模型', 3),
  row('agent/chatbot-vs-agent.md', 'chatbot-vs-agent', 'Chatbot 与 Agent 的区别', '区分单轮问答、固定流水线和会选择动作的循环', 2, 'beginner', 15, ['Agent'], ['what-is-agent'], '认识 Agent', 1),
  row('agent/architecture.md', 'agent-architecture', 'Agent 基本架构', '把模型、工具、状态和停止条件放进同一张可讲清的结构', 3, 'beginner', 20, ['Agent'], ['what-is-agent'], '认识 Agent', 1),
  row('agent/loop.md', 'agent-loop', 'Agent Loop', '理解行动、观察和停止怎样组成一轮可重复的循环', 4, 'beginner', 25, ['Agent'], ['agent-architecture', 'llm-api'], '行动循环', 2),
  row('agent/structured-output.md', 'structured-output', 'Structured Output', '让模型按约定的 JSON 结构返回，而不是只返回一段自然语言', 6, 'beginner', 20, ['Agent', 'JSON'], ['json-data', 'llm-api'], '行动循环', 2),
  row('agent/react.md', 'react', 'ReAct', '理解推理轨迹和行动怎样交替，以及它和普通工具循环的关系', 7, 'intermediate', 25, ['Agent'], ['agent-tool-calling', 'agent-loop'], '行动循环', 2),
  row('agent/planning.md', 'planning', 'Planning', '把目标拆成可以检查的子任务，并在失败时调整计划', 8, 'intermediate', 25, ['Agent'], ['react'], '规划与协作', 3),
  row('agent/state.md', 'agent-state', 'Agent 状态管理', '记录循环走到哪一步，避免把全部历史无限制地塞回模型', 9, 'intermediate', 20, ['Agent'], ['agent-loop'], '规划与协作', 3),
  row('agent/multi-agent.md', 'multi-agent', '多智能体系统', '理解多个 Agent 如何分工和交接，以及由此增加的失败点', 10, 'advanced', 25, ['Agent'], ['agent-state', 'agent-architecture'], '规划与协作', 3),
  row('rag/embedding.md', 'embedding', 'Embedding', '理解文本如何变成可比较的向量，以及向量本身还不是数据库', 2, 'beginner', 20, ['RAG'], ['rag-basics'], '建立知识库', 1),
  row('rag/vector-database.md', 'vector-database', '向量数据库', '知道向量索引负责近邻检索，原文和来源仍然要能取回来', 3, 'beginner', 20, ['RAG'], ['embedding'], '建立知识库', 1),
  row('rag/chunking.md', 'chunking', '文档解析与切分', '按文档结构切开文本，并处理重叠、标题和过短片段', 4, 'beginner', 25, ['RAG'], ['rag-basics'], '建立知识库', 1),
  row('rag/vector-search.md', 'vector-search', '向量检索', '用相似度取回若干片段，并保留片段在原文中的位置', 5, 'beginner', 20, ['RAG'], ['embedding', 'vector-database'], '把检索做准', 2),
  row('rag/hybrid-search.md', 'hybrid-search', '混合检索', '同时利用关键词和向量，减少只靠语义相似带来的漏召回', 6, 'intermediate', 20, ['RAG'], ['vector-search'], '把检索做准', 2),
  row('rag/rerank.md', 'rerank', 'Rerank', '用第二次排序把初检结果里真正相关的片段排到前面', 7, 'intermediate', 20, ['RAG'], ['vector-search'], '把检索做准', 2),
  row('rag/query-rewrite.md', 'query-rewrite', 'Query Rewrite', '在检索前改写问题，补上代词和缺失的限定条件', 8, 'intermediate', 20, ['RAG'], ['vector-search', 'prompt-engineering'], '把检索做准', 2),
  row('rag/evaluation.md', 'rag-evaluation', 'RAG 评估', '用一组有标准答案的问题检查检索和回答是否真的变好', 9, 'intermediate', 25, ['RAG'], ['rag-basics', 'vector-search'], '评估与结合 Agent', 3),
  row('rag/agentic-rag.md', 'agentic-rag', 'Agentic RAG', '让 Agent 决定何时检索、检索什么，以及结果不够时是否再查', 10, 'intermediate', 25, ['RAG', 'Agent'], ['rag-basics', 'agent-tool-calling'], '评估与结合 Agent', 3),
  row('memory/conversation-history.md', 'conversation-history', '对话历史管理', '决定哪些消息留在上下文里，以及用户、助手和工具消息如何排列', 1, 'beginner', 20, ['Memory'], ['llm-api', 'token-context'], '记忆形态', 1),
  row('memory/short-term.md', 'short-term-memory', '短期记忆', '把当前任务的中间结果留在这一轮循环里，而不是写进长期存储', 2, 'beginner', 15, ['Memory'], ['conversation-history'], '记忆形态', 1),
  row('memory/long-term.md', 'long-term-memory', '长期记忆', '跨会话保存稳定事实，并在以后的任务里检索回来', 3, 'intermediate', 25, ['Memory'], ['short-term-memory', 'embedding'], '记忆形态', 1),
  row('memory/storage.md', 'memory-storage', 'Memory 存储与检索', '为记忆选择存储，并写清写入、读取和删除的边界', 4, 'intermediate', 20, ['Memory'], ['long-term-memory'], '记忆形态', 1),
  row('memory/context-engineering.md', 'context-engineering', 'Context Engineering', '有意识地挑选放进上下文的指令、资料和历史', 5, 'intermediate', 25, ['Memory'], ['token-context', 'prompt-engineering'], '上下文工程', 2),
  row('memory/context-compression.md', 'context-compression', '上下文裁剪与压缩', '在接近窗口上限时摘要或丢弃旧内容，并知道会丢失什么', 6, 'intermediate', 20, ['Memory'], ['context-engineering', 'token-context'], '上下文工程', 2),
  row('memory/update.md', 'memory-update', '记忆生成与更新', '判断什么值得记住、什么该改写，避免把一次错误固化下来', 7, 'intermediate', 20, ['Memory'], ['long-term-memory', 'memory-storage'], '上下文工程', 2),
  row('frameworks/langchain.md', 'langchain', 'LangChain', '了解模型、提示词和工具这些抽象分别解决什么，以及它们带来的层次', 1, 'intermediate', 25, ['LangChain'], ['agent-loop', 'llm-api']),
  row('frameworks/langgraph.md', 'langgraph', 'LangGraph', '用显式状态图描述分支、循环和需要人确认的步骤', 2, 'intermediate', 25, ['LangChain'], ['langchain', 'agent-state']),
  row('frameworks/mcp.md', 'mcp', 'MCP', '理解工具如何通过统一协议暴露给不同的 Agent 宿主', 3, 'intermediate', 25, ['MCP'], ['agent-tool-calling']),
  row('frameworks/skills.md', 'skills', 'Skills', '把一组可复用的指令和工具打包成技能，并分清它和单次工具调用的差别', 4, 'intermediate', 20, ['Agent'], ['mcp', 'agent-tool-calling']),
  row('frameworks/orchestration.md', 'multi-agent-orchestration', '多智能体编排', '比较主管分发、对等交接和固定流水线三种组织方式', 5, 'advanced', 25, ['Agent'], ['multi-agent', 'langgraph']),
  row('frameworks/choice.md', 'framework-choice', 'Agent 框架选型', '按可控性、团队熟悉度和部署方式决定自研还是采用框架', 6, 'intermediate', 20, ['Agent'], ['langchain', 'langgraph', 'mcp']),
  row('engineering/fastapi.md', 'fastapi-service', 'FastAPI 服务开发', '把一次 Agent 调用包成 HTTP 接口，并分开请求、配置和密钥', 1, 'intermediate', 30, ['Engineering'], ['http-rest', 'llm-api'], '服务化', 1),
  row('engineering/sse.md', 'streaming-sse', 'Streaming / SSE', '用服务器发送事件把模型的增量输出推到客户端', 2, 'intermediate', 25, ['Engineering'], ['fastapi-service', 'streaming'], '服务化', 1),
  row('engineering/database.md', 'database-storage', '数据库存储', '为会话、消息和任务状态选择持久化，而不是只放在进程内存里', 3, 'intermediate', 25, ['Engineering'], ['fastapi-service', 'memory-storage'], '服务化', 1),
  row('engineering/observability.md', 'agent-observability', 'Agent 日志与可观测性', '记录每一次模型调用和工具调用，让失败可以回放', 4, 'intermediate', 25, ['Engineering'], ['agent-loop', 'fastapi-service'], '质量', 2),
  row('engineering/evaluation.md', 'agent-evaluation', 'Agent Evaluation', '为任务成功率、工具选择和人工抽查看建立可重复的检查', 5, 'intermediate', 25, ['Engineering'], ['agent-observability'], '质量', 2),
  row('engineering/testing.md', 'agent-testing', 'Agent 测试与调试', '用假模型和录制好的工具结果测试循环，而不必每次都请求真实 API', 6, 'intermediate', 25, ['Engineering'], ['agent-tool-calling', 'agent-loop'], '质量', 2),
  row('engineering/cost.md', 'cost-performance', '成本与性能优化', '从 token、重试和检索次数看一次任务的开销可以减在哪里', 7, 'intermediate', 20, ['Engineering'], ['token-context', 'llm-api'], '上线', 3),
  row('engineering/security.md', 'agent-security', '安全与权限控制', '限制工具能碰到的数据和密钥，并校验来自模型的参数', 8, 'advanced', 25, ['Engineering'], ['agent-tool-calling', 'fastapi-service'], '上线', 3),
  row('engineering/docker.md', 'docker-deploy', 'Docker 部署', '把服务和依赖放进镜像，并避免把密钥写进镜像层', 9, 'intermediate', 25, ['Engineering'], ['fastapi-service'], '上线', 3),
  row('engineering/production.md', 'production-practice', '生产环境实践', '把超时、降级、发布和人工接管放进同一套上线检查', 10, 'advanced', 30, ['Engineering'], ['docker-deploy', 'agent-observability', 'agent-security'], '上线', 3)
]

const paths = new Map(published)
for (const topic of topics) paths.set(topic.id, topic.file)
for (const topic of topics) {
  for (const prerequisite of topic.prerequisites) {
    if (!paths.has(prerequisite)) throw new Error(`missing prerequisite ${prerequisite} for ${topic.id}`)
  }
}

let created = 0
for (const topic of topics) {
  const target = path.join(docs, topic.file)
  if (fs.existsSync(target)) continue
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, render(topic), 'utf8')
  created += 1
}
console.log(`created ${created} planned topics`)

function row(file, id, title, description, order, level, minutes, tags, prerequisites, group, groupOrder) {
  return { file, id, title, description, order, level, minutes, tags, prerequisites, group: group ?? null, groupOrder: groupOrder ?? null }
}

function render(topic) {
  const lines = [
    '---',
    `id: ${topic.id}`,
    `title: ${JSON.stringify(topic.title)}`,
    `description: ${JSON.stringify(topic.description)}`,
    `module: ${topic.file.split('/')[0] === 'fundamentals' ? 'fundamentals' : moduleId(topic.file)}`,
    `order: ${topic.order}`,
    `level: ${topic.level}`,
    yamlList('tags', topic.tags),
    yamlList('prerequisites', topic.prerequisites),
    'related: []',
    'status: planned',
    `estimatedMinutes: ${topic.minutes}`,
    'updatedAt: "2026-10-23"'
  ]
  if (topic.group) {
    lines.push(`group: ${JSON.stringify(topic.group)}`)
    lines.push(`groupOrder: ${topic.groupOrder}`)
  }
  lines.push('---', '')
  const prerequisiteLinks = topic.prerequisites.map((id) => {
    const file = paths.get(id)
    return `- [${titleOf(id)}](/${file})`
  })
  lines.push(
    `# ${topic.title}`,
    '',
    topic.description,
    '',
    '::: info 待编写',
    '本节已列入路线，正文还在整理。现在可以完整阅读的示例是 [什么是 AI Agent](/agent/what-is-agent.md)、[Tool Calling](/agent/tool-calling.md) 和 [基础 RAG](/rag/basics.md)。',
    ':::',
    '',
    '## 在路线中的位置',
    '',
    `- 模块：${moduleTitle[moduleId(topic.file)]}`,
    `- 程度：${levelLabel[topic.level]}`,
    `- 预估阅读时间：${topic.minutes} 分钟`,
    '',
    '## 前置知识',
    '',
    ...(prerequisiteLinks.length ? prerequisiteLinks : ['这一节没有列出前置知识。']),
    '',
    '正式正文会补上原理、最小示例和自测。页底可以继续沿路线浏览。',
    ''
  )
  return lines.join('\n')
}

function moduleId(file) {
  return file.split('/')[0]
}

function yamlList(key, values) {
  if (values.length === 0) return `${key}: []`
  return [`${key}:`, ...values.map((value) => `  - ${JSON.stringify(value)}`)].join('\n')
}

function titleOf(id) {
  if (id === 'guide-environment') return '开发环境准备'
  if (id === 'guide-learning-path') return 'Agent 开发学习路线'
  if (id === 'what-is-agent') return '什么是 AI Agent'
  if (id === 'agent-tool-calling') return 'Tool Calling 工具调用'
  if (id === 'rag-basics') return '基础 RAG'
  return topics.find((topic) => topic.id === id)?.title ?? id
}
