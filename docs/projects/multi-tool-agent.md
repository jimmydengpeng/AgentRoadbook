---
kind: project
outline: false
id: multi-tool-agent
title: 多工具 Agent
description: 做一个至少有两个工具的循环，分清模型提议和应用程序执行。
difficulty: intermediate
order: 1
stack:
  - Python
tags:
  - Tool Calling
  - Agent Loop
prerequisites:
  - agent-tool-calling
  - agent-loop
estimatedHours: 8
goals:
  - 能注册工具并拒绝未知名字和非法参数
  - 能用最大步数停住循环，而不是依赖模型自觉结束
features:
  - 至少两个只读工具，例如时间和一个本地数据查询
  - 不调用真实 API 时，用假模型也能走通主路径
steps:
  - 先为每个工具写清名字、说明和参数结构，并准备三组合法与非法样例
  - 实现注册表和分发，确认非法输入不会执行函数
  - 加上最多四步的循环，把工具结果写回消息；最后用假模型替换真实请求做自检
tasks:
  - id: define-schemas
    title: 写下工具契约
    detail: 为至少两个工具各写一份参数说明，包含字段类型、必填项，以及一句给模型看的用途描述。
  - id: dispatch
    title: 实现分发
    detail: 未知工具抛出可区分的错误。参数不是 JSON 对象时不要调用函数。
  - id: loop
    title: 加上有限循环
    detail: 模型返回工具调用时执行并写回结果。没有工具调用时结束。超过最大步数时停止并说明停在第几步。
  - id: failures
    title: 把工具失败交回模型
    detail: 工具自己抛出的业务错误要变成一段文本结果，而不是让整个进程退出。密钥只从环境变量读取。
  - id: fake-model
    title: 用假模型验收主路径
    detail: 准备一段固定的模型响应，在没有 API 密钥时跑通两个工具中的至少一个，并断言最终文本包含工具结果。
acceptance:
  - 两个已注册工具都能被分发到，未知名字不会执行
  - 非法 JSON 和非对象参数都有明确失败，且函数体没有运行
  - 超过最大步数时循环停止，并留下可阅读的原因
  - 假模型路径不需要网络，真实密钥不会出现在源码和提示词里
extensions:
  - 为每次模型请求和工具结果追加一行本地 JSONL 日志
  - 让最终答复可以分段输出，而工具调用阶段仍然等到完整参数再执行
references:
  - title: OpenAI Function calling
    url: https://platform.openai.com/docs/guides/function-calling
  - title: Anthropic Tool use
    url: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
---

# 多工具 Agent

<ProjectDetail />
