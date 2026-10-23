---
kind: project
outline: false
id: rag-assistant
title: RAG 知识库问答助手
description: 用一份你自己的文档走通切分、检索、提示词和命中检查。
difficulty: intermediate
order: 2
stack:
  - Python
tags:
  - RAG
  - Retrieval
prerequisites:
  - rag-basics
  - embedding
  - chunking
estimatedHours: 10
goals:
  - 能把一份本地文档切成带重叠的块并保留来源位置
  - 能替换嵌入函数而不改检索和提示词组装
features:
  - 对问题返回若干原文片段和它们在文档中的位置
  - 资料里没有答案时明确拒绝，而不是编造引用
steps:
  - 选一篇允许你使用的纯文本文档，按段落或固定长度切开，并保留重叠
  - 先写一个确定性的假嵌入函数，让同样的文本始终得到同样的向量
  - 用余弦相似度取回前若干块，把原文和来源放进提示词
  - 准备能回答和不能回答的问题各五道，记录检索是否真的命中依据
tasks:
  - id: chunk-docs
    title: 切分并保留位置
    detail: 每块包含原文、来源名称和在原文中的起止位置。相邻块有重叠，避免一句话被切成无法阅读的两半。
  - id: fake-embedding
    title: 把嵌入做成可替换接口
    detail: 检索代码只依赖「文本进、向量出」的函数。假实现不访问网络，真实嵌入函数以后可以换进去。
  - id: search
    title: 取回带原文的结果
    detail: 相似度最高的结果必须能显示原文和位置。只返回向量或下标不算完成。
  - id: prompt
    title: 组装带约束的提示词
    detail: 提示词包含问题、片段和来源，并要求片段没有写到的内容要回答不知道。
  - id: question-set
    title: 用十道题检查检索
    detail: 五道题的答案就在文档里，五道题的答案不在文档里。记录每道题取回的来源，不要只看最终生成是否通顺。
acceptance:
  - 切分结果能追溯到原文位置，重叠是可见的
  - 换成另一个嵌入函数时，检索和提示词代码不用改签名
  - 文档中不存在的问题不会生成虚假来源
  - 十道题的命中记录可以重复跑出同一份假向量结果
extensions:
  - 增加关键词检索，和向量结果合并后再取前若干条
  - 统计十道题里有多少次第一条结果包含所需事实
references:
  - title: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
    url: https://arxiv.org/abs/2005.11401
---

# RAG 知识库问答助手

<ProjectDetail />
