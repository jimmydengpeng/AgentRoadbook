---
id: guide-intro
title: 项目介绍
description: 说明 Agent Roadbook 是什么、为谁而写，以及它不打算替代什么
module: guide
order: 1
level: beginner
tags:
  - 入门
prerequisites: []
related:
  - guide-how-to-use
  - guide-learning-path
status: published
estimatedMinutes: 8
updatedAt: "2026-10-23"
---

# 项目介绍

Agent Roadbook 是一份面向开发者的开源学习路书。它按 Agent 开发的依赖关系组织知识，并在同一页提供讲解、示例和自测。

## 这是什么

它不是又一份框架 API 的镜像，也不是课程视频目录。你可以用它回答这些具体问题：

- 我现在该从哪一节开始
- 这个概念解决什么问题
- 最小的可运行例子长什么样
- 我能不能用一道题检查自己有没有理解
- 做完之后下一节是什么

从 [学习路线](/guide/learning-path.md) 按顺序读。其中 [什么是 AI Agent](/agent/what-is-agent.md)、[Tool Calling](/agent/tool-calling.md) 和 [基础 RAG](/rag/basics.md) 已经发布，其余章节也可以直接打开。以后补充的是某一节的细节，阅读顺序不变。

## 为谁而写

默认读者会写 Python 函数和基本的数据结构，但还没有系统地做过 Agent。你可能正在从后端或脚本开发转到 LLM 应用，也可能在准备相关岗位。阅读不要求你先部署一套完整平台。

## 它不做什么

站点没有账号、后端和在线代码沙箱。练习答案会随静态页面发布，所以这是自测，不是考试。代码题需要你在自己的电脑上运行。

仓库里的 `raw/` 只给维护者本地参考。那些资料许可不明，不会出现在页面上。

## 如何参与

知识文章是 Markdown，练习是 YAML。新增一节不需要改导航组件。流程写在仓库的 `AGENTS.md` 里。
