---
kind: project
outline: false
id: travel-planner
title: 旅游规划 Agent
description: 把需求收成结构，拆开交通、住宿和日程，并在约束变化时只重算受影响的部分。
difficulty: advanced
order: 3
stack:
  - Python
tags:
  - Tool Calling
  - Planning
prerequisites:
  - agent-tool-calling
  - planning
  - structured-output
  - agent-state
estimatedHours: 12
goals:
  - 能把模糊的出行需求整理成可校验的字段
  - 能在工具失败时留下空缺，而不是编造闭馆或票价
features:
  - 行程状态能看出交通、住宿和日程分别是否已确认
  - 最终输出是固定结构，而不是一段无法校验的散文
steps:
  - 定义需求对象，至少包含城市、天数、预算和偏好，并用样例检查缺字段
  - 把计划拆成三个子任务，状态里记录未开始、进行中和已确认
  - 接两个工具。没有真实接口时，用本地假数据，但失败分支仍要存在
  - 输出每日安排、预算拆分和待确认项。追加一条新约束后，只重算被影响到的子任务
tasks:
  - id: requirements
    title: 收成结构化需求
    detail: 缺城市或天数时不要开始规划。解析结果必须能被同一份结构检查接受或拒绝。
  - id: split-tasks
    title: 拆开三个子任务
    detail: 状态里始终能看到交通、住宿和日程的当前状态。不要把三份结果只留在模型的自然语言里。
  - id: tools
    title: 接入两个信息工具
    detail: 工具返回失败时，对应栏位保持空缺并写入原因。不要用模型补一个看起来精确的价格或开放时间。
  - id: schema-output
    title: 产出可校验的行程
    detail: 最终 JSON 包含每日安排、预算拆分和待确认项。缺任何一项，验收就不通过。
  - id: replan
    title: 只重算受影响的部分
    detail: 增加「某一天必须安排在室内」后，已确认且不受影响的栏位保持原值，并在状态里看得出哪些项被重算。
acceptance:
  - 缺少必填需求时不会生成完整行程
  - 三个子任务的状态可以独立查看
  - 工具失败不会被填成编造的具体事实
  - 新约束不会把未受影响的已确认项全部打乱
extensions:
  - 把通过校验的 JSON 渲染成一份 Markdown 行程单
  - 对同一需求给出两个预算不同的方案，并标明差异来自哪些子任务
references:
  - title: OpenAI Function calling
    url: https://platform.openai.com/docs/guides/function-calling
  - title: ReAct
    url: https://arxiv.org/abs/2210.03629
---

# 旅游规划 Agent

<ProjectDetail />
