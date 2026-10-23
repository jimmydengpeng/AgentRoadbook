---
id: guide-learning-path
title: Agent 开发学习路线
description: 按依赖给出阅读顺序：先调用模型，再使用工具，然后接上自己的资料
module: guide
order: 3
level: beginner
tags:
  - 入门
prerequisites:
  - guide-intro
related:
  - what-is-agent
  - agent-tool-calling
  - rag-basics
status: published
estimatedMinutes: 12
updatedAt: "2026-10-23"
---

# Agent 开发学习路线

路线按「先能调用模型，再让它使用工具，然后接上你自己的资料」排列。每一段都有正文和练习。以后补充，是把某一节写得更具体，阅读顺序不变。

## 建议的第一段

想先看清整条路，按这个顺序读。这三节已经发布，后面的章节沿用这里的定义。

1. [什么是 AI Agent](/agent/what-is-agent.md)，建立本站使用的定义
2. [Tool Calling](/agent/tool-calling.md)，看清模型和应用程序各做哪一半
3. [基础 RAG](/rag/basics.md)，把外部资料放进回答过程

读完之后，你应该能说明两件事：模型提出下一步，应用程序执行并写回结果；要用到的资料先检索，再交给模型。

## 整张地图

```mermaid
flowchart TD
  basics[编程与模型调用] --> agent[Agent 循环与工具]
  agent --> rag[RAG]
  agent --> memory[记忆与上下文]
  rag --> projects[实战项目]
  memory --> projects
  agent --> frameworks[框架与协议]
  frameworks --> engineering[工程化]
  projects --> engineering
```

阅读时可以这样理解每一段：

| 顺序 | 模块 | 你应该获得的能力 |
| --- | --- | --- |
| 00 | [开始学习](/guide/intro.md) | 知道站点怎么用 |
| 01 | [编程与大模型基础](/fundamentals/python-basics.md) | 能发一次模型请求并读懂 JSON |
| 02 | [Agent 核心原理](/agent/what-is-agent.md) | 能实现一个有停止条件的工具循环 |
| 03 | [RAG 与知识库](/rag/basics.md) | 能解释检索失败为什么会变成胡编 |
| 04 | [Memory 与上下文工程](/memory/conversation-history.md) | 能决定什么留在上下文里 |
| 05 | [框架与协议](/frameworks/langchain.md) | 能说明框架和 MCP 各解决什么 |
| 06 | [Agent 工程化](/engineering/fastapi.md) | 能把循环放进可观察的服务 |
| 07 | [实战项目](/projects/index.md) | 能按验收标准做完一个小项目 |
| 08 | [学习资源](/resources/index.md) | 知道去哪份官方文档核对 |

00 到 03 按依赖往下读。实战项目可以在 Agent 循环和基础 RAG 读完后开始。框架和工程化放在循环已经能在本地跑通之后。

## 怎么跳着学

已经会写 HTTP 和 JSON 的人，可以从上面三节直接开始。碰到不认识的名词，再回到 [编程与大模型基础](/fundamentals/python-basics.md)。做项目时如果卡在某个词，打开对应章节，并用 [资源导航](/resources/index.md) 里的官方文档核对。

不建议一上来同时学框架、RAG 和多智能体。先让一个工具循环在本地跑通，再加资料库，最后再看服务怎么部署。

页顶标着「初稿」的章节可以读，也可以做题。它表示这一节还能继续写细。和页底官方文档不一致时，以文档为准。
