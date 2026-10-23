---
id: glossary
title: 技术术语表
description: 统一本站对模型、工具、检索和上下文这几个词的用法
module: resources
order: 2
level: beginner
tags:
  - 资源
prerequisites:
  - guide-learning-path
related:
  - resources-home
  - what-is-agent
status: published
estimatedMinutes: 10
updatedAt: "2026-10-23"
---

# 技术术语表

这些解释只服务本站的写法。厂商文档里的同名术语可能更窄或更宽，以对应官方页面为准。

## LLM

大语言模型。本站把它看成一个根据输入消息继续生成内容的组件，不讨论具体的网络结构。

## Token

模型计费和长度限制使用的文本单位。它不等于一个汉字或一个英文单词。窗口里能放多少内容，要按所用模型的规则估计。

## 上下文窗口

一次请求里模型能够读到的内容上限，包括指令、历史、资料和工具结果。超过上限时，请求会失败或被截断，具体行为看服务商。

## Prompt

发给模型的指令和材料。提示词可以提出格式要求，但不能代替程序对结果的检查。

## Tool Calling

模型返回工具名和参数，应用程序执行工具。详见 [Tool Calling](/agent/tool-calling.md)。

## Agent

在本站指模型、工具、状态和停止条件组成的循环。详见 [什么是 AI Agent](/agent/what-is-agent.md)。

## Agent Loop

反复进行「模型决定、程序执行、结果写回」，直到停止条件成立。

## Structured Output

模型按事先约定的数据结构返回。约定本身仍然要由程序校验。

## ReAct

一种让推理文字和行动交替出现的做法。本站将在对应章节展开，不在这里复述论文实验。

## RAG

先检索资料片段，再让模型依据片段生成回答。详见 [基础 RAG](/rag/basics.md)。

## Embedding

把文本映射成向量，以便比较相似程度。向量要和原文、来源一起保存。

## Chunk

为了检索和放入提示词而切开的文档片段。它需要保留自己在原文中的位置。

## Memory

跨步骤或跨会话保留的信息。当前轮次的工具结果通常先算状态，不必立刻写成长期记忆。

## Context Engineering

决定这次请求里放进哪些指令、历史和资料，而不是把能找到的文本全部贴进去。

## MCP

让工具以统一协议暴露给不同宿主的一种规范。它不改变「模型提出调用、宿主执行」的分工。

## SSE

服务器向客户端持续推送事件的一种 HTTP 用法。适合转发模型已经开始产生的文本片段。
