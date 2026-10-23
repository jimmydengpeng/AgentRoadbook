---
id: resources-home
title: 资源导航
description: 集中列出本站正文核对过的官方文档和论文，并说明面试准备看什么
module: resources
order: 1
level: beginner
tags:
  - 资源
prerequisites:
  - guide-learning-path
related:
  - glossary
status: published
estimatedMinutes: 12
updatedAt: "2026-10-23"
---

# 资源导航

这里只放维护时核对过、并且可以公开引用的资料。个人笔记和许可不明的导出不会出现在这一页。

## 官方文档

语言和接口基础：

- [Python 教程](https://docs.python.org/3/tutorial/)
- [venv](https://docs.python.org/3/library/venv.html)
- [json](https://docs.python.org/3/library/json.html)
- [asyncio](https://docs.python.org/3/library/asyncio.html)
- [HTTP 概述](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview)
- [Pydantic](https://docs.pydantic.dev/latest/)
- [FastAPI](https://fastapi.tiangolo.com/)

模型、工具和框架：

- [OpenAI Function calling](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Anthropic Tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)
- [Model Context Protocol 介绍](https://modelcontextprotocol.io/introduction)
- [LangChain 概览](https://docs.langchain.com/oss/python/langchain/overview)
- [LangGraph 概览](https://docs.langchain.com/oss/python/langgraph/overview)

读框架文档时，先回答两个问题：它替你保管了哪一段状态，以及工具最终在哪里执行。回答不了这两句，就先回到 [Tool Calling](/agent/tool-calling.md)。

## 论文

这两篇只用来核对概念从哪里来。本站不摘录实验表格，也不把论文里的分数写成你的系统成绩。

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)

## 公开课程

下面这些课程和仓库可以公开打开。本站正文不转载它们的章节，只把链接放在这里，方便你对照学习顺序。仓库许可证以各自仓库里的文件为准。Hello-Agents 的许可证是 CC BY-NC-SA 4.0，这里不收录它的正文。

- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course)
- [AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners)
- [LLM Universe](https://datawhalechina.github.io/llm-universe/)
- [LangChain Academy](https://github.com/langchain-ai/langchain-academy)
- [RAG From Scratch](https://github.com/langchain-ai/rag-from-scratch)

读这些材料时，先分清哪一段是通用原理，哪一段是某个框架的 API。原理对不上时，以官方文档为准。

## 开源项目怎么选

克隆一个仓库之前，先看它是否说明了许可、示例数据从哪来，以及工具执行是在示例进程里还是在远端。本站的三个[实战项目](/projects/index.md)故意不绑定某一个示例仓库，避免你在还没写清验收标准时先复制一整套业务代码。

## 推荐的练习方式

把 [什么是 AI Agent](/agent/what-is-agent.md)、[Tool Calling](/agent/tool-calling.md) 和 [基础 RAG](/rag/basics.md) 各讲给另一个人听。讲的时候打开对应的官方文档，核对字段名有没有记错。然后做项目页上的任务清单，而不是同时开很多教程。

## 面试准备

面试前准备用自己的话讲清三件事：

- 工具调用时，谁提出调用，谁执行函数，参数不合法时程序做什么
- RAG 答错时，你先看检索到的片段，还是先换模型
- 一次 Agent 运行你会留下哪些记录，才能在事后复盘某一步

不要背没有出处的延迟、价格或排行榜。那些数字过期得很快，而且本站没有测量它们。更多术语见 [术语表](/resources/glossary.md)。

## 项目案例

案例就是上面的三个实战项目。每个项目的验收标准都可以当成你事后写进简历前的自检：没有达到验收，就不要把它写成已经完成的系统。
