---
id: python-oop
title: "Python 面向对象"
description: "用类收拢工具注册表和一次任务的状态，避免实例共享同一份可变数据"
module: fundamentals
order: 2
level: beginner
tags:
  - "Python"
prerequisites:
  - "python-basics"
related: []
status: draft
estimatedMinutes: 20
updatedAt: "2026-10-23"
group: "Python"
groupOrder: 1
---

# Python 面向对象

工具注册表、一份配置、一次任务的进度，都是数据加上对它做的操作。类把它们收成明确的类型，调用方就不必记住一串松散的字典键。读过 [Python 基础回顾](/fundamentals/python-basics.md) 里的函数和字典即可。

## 知识点概述

[类](https://docs.python.org/3/tutorial/classes.html)把数据和行为捆在一起。创建一个类，就是创建一个新的类型；每个实例可以带上自己的属性，用来保存它的状态。Agent 代码里常见三种对象。

- **工具**。有名字，以及真正执行的那个函数。
- **注册表**。按名字找到工具。重复登记和未知名字都要失败。
- **任务状态**。这一轮的消息和已经走过的步数，不和别的任务混用。

工具之间很少需要一条很长的继承链。注册表持有多个工具实例，比让「搜索」去继承「数据库」更容易看出谁调用谁。

## 核心原理

方法的第一个参数是实例本身，惯例写成 `self`。`__init__` 在创建实例时写入这一份对象自己的属性。教程把类变量和实例变量分开讲：写在类体上的可变对象，会被这个类的实例共享。注册表里的字典、任务里的消息列表，都要放在 `self` 上，并且在每次构造时新建。

创建之后仍然可以给实例加属性。步数、最近一次工具结果，都放在这一次任务的对象上。它们不应该变成模块级的全局变量，否则两次请求会互相改写。

按名字调用工具时，先查登记表。没有这个名字就抛出 `KeyError`。后面的循环可以捕获它，写成交回模型的错误说明。这一节先保证注册表自己会拒绝未知名字，而不是返回一段空文本。

## 最小示例

下面的注册表只在内存里查找函数，不访问网络。

```python
from collections.abc import Callable


class Tool:
    def __init__(self, name: str, run: Callable[..., str]) -> None:
        if not name:
            raise ValueError("tool name is empty")
        self.name = name
        self._run = run

    def __call__(self, **kwargs: str) -> str:
        return self._run(**kwargs)


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def add(self, tool: Tool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"duplicate tool: {tool.name}")
        self._tools[tool.name] = tool

    def invoke(self, name: str, **kwargs: str) -> str:
        tool = self._tools.get(name)
        if tool is None:
            raise KeyError(f"unknown tool: {name}")
        return tool(**kwargs)
```

`add` 遇到重复名字会抛出 `ValueError`。`invoke` 遇到没有登记的名字会抛出 `KeyError`。字典建在 `self._tools` 上，所以两个 `ToolRegistry()` 各有一份登记表。

## 常见问题

**把登记表写成类属性。** `class ToolRegistry: tools = {}` 会让所有实例改同一份字典。第二次任务还能看见第一次登记的工具。

**用继承表达「这也是一个工具」。** 名字、说明和执行函数已经够用。层次变深之后，要看一个工具做了什么，得先顺着父类往上找。

**未知工具返回空字符串。** 空字符串和「工具成功但没有正文」长得一样。模型会把它当成一次有效观察。

## 知识自测

<QuizPanel topic-id="python-oop" />

## 参考资料

- [Python 教程：Classes](https://docs.python.org/3/tutorial/classes.html)：类如何把数据和行为放在一起，以及实例如何保存自己的状态
