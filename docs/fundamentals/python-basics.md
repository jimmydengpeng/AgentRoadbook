---
id: python-basics
title: "Python 基础回顾"
description: "用函数、列表、字典和异常读懂后面的工具函数与消息列表"
module: fundamentals
order: 1
level: beginner
tags:
  - "Python"
prerequisites:
  - "guide-environment"
related: []
status: draft
estimatedMinutes: 20
updatedAt: "2026-10-23"
group: "Python"
groupOrder: 1
---

# Python 基础回顾

写 Agent 时，工具是函数，一轮对话是列表里的字典，失败要让调用方知道停在哪一步。这一节只把这几件事和虚拟环境对齐，方便后面的示例直接读。语法细节以 [Python 教程](https://docs.python.org/3/tutorial/) 为准。

## 知识点概述

后面的代码反复用到四样东西。

- **函数**。一个工具就是一个函数。参数是这次要交给它的字段，返回值是交回模型的观察结果。
- **列表和字典**。消息按发生顺序放在列表里。每一条消息是字典，用来区分角色和内容。
- **异常**。参数不合法、工具没有登记，都要变成调用方能区分的失败，并把原始原因留下来。
- **虚拟环境**。这个项目的依赖放在单独的环境里。教程第 12 章说明了怎样创建它。

会写普通脚本的人，缺的通常是这四件事和 Agent 循环之间的对应关系。

## 核心原理

函数用 `def` 声明，用 `return` 把结果交回去。没有 `return` 时，调用方得到的是 `None`。如果把 `None` 当成文本拼进下一条消息，后面的类型检查会对不上。本站示例里的工具函数返回字符串，调用方拿到的就是能放进消息的文本。

列表保留顺序，适合消息历史。新的用户消息、模型回复和工具结果都追加到末尾。字典用键取出字段。键不存在时，`[]` 会抛出 `KeyError`。这个失败应当被看见：缺字段和空字符串是两件事。

异常把失败从正常返回值里分开。捕获之后写明是哪一步失败，再用 `raise ... from` 保留原始错误。教程的异常一章把这种串联叫做异常链。空的 `except` 会让循环以为这一步成功了。

同一次任务里的消息列表由这一次创建。把同一个列表交给两个任务，后一次追加会混进前一次的内容。虚拟环境则保证后面安装的 HTTP 客户端和数据校验库落在项目里，而不是系统解释器里。

## 最小示例

下面两个函数只处理内存里的消息，不访问网络。空内容会被拒绝。

```python
def append_user_message(messages: list[dict[str, str]], content: str) -> None:
    if not content:
        raise ValueError("user message content is empty")
    messages.append({"role": "user", "content": content})


def latest_content(messages: list[dict[str, str]]) -> str:
    if not messages:
        raise ValueError("message list is empty")
    content = messages[-1].get("content")
    if not isinstance(content, str) or not content:
        raise ValueError("latest message has no content")
    return content
```

`append_user_message` 就地修改传入的列表。因此每个任务自己持有一份 `messages`。`latest_content` 在列表为空或最后一条没有文本时抛出 `ValueError`，调用方可以把它和正常的模型回复分开。

## 常见问题

**捕获异常后什么都不做。** 工具崩溃和「没有查到内容」会变成同一种返回值。循环会把失败当成观察结果，继续往下走。

**把可变列表写进默认参数。** `def collect(messages=[])` 让之后的调用共享最初那一个列表。默认值用 `None`，需要时在函数体内新建列表。

**靠记忆拼字典的键。** 键写错要到运行时才出现。下一节用类把工具和配置的字段名固定下来。

## 知识自测

<QuizPanel topic-id="python-basics" />

## 参考资料

- [Python 教程](https://docs.python.org/3/tutorial/)：函数、数据结构、异常，以及虚拟环境那一章
