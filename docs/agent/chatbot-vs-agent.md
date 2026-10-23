---
id: chatbot-vs-agent
title: "Chatbot 与 Agent 的区别"
description: "区分单轮问答、固定流水线和会选择动作的循环"
module: agent
order: 2
level: beginner
tags:
  - "Agent"
prerequisites:
  - "what-is-agent"
related: []
status: draft
estimatedMinutes: 15
updatedAt: "2026-10-23"
group: "认识 Agent"
groupOrder: 1
---

# Chatbot 与 Agent 的区别

单轮问答做完一次补全就停。固定流水线按写好的顺序往下走。Agent 则由模型在运行时提出下一步动作，应用程序执行，再把观察交回，直到停止条件。

## 知识点概述

这三种程序都可以调用大模型，差别在于下一步由谁决定。

**单轮问答。** 用户的一句话进去，模型的一段文字出来，这次请求结束。多轮聊天通常只是把更早的消息一起带上下一次请求。模型仍然只产生文字，程序不根据这次输出去执行函数。

**固定流水线。** 步骤和顺序写在代码里。例如总是先检索，再把片段拼进提示词，最后让模型写回答。模型可以出现在其中某一步，但它不决定要不要跳过检索，也不决定中途改调另一个函数。

**Agent。** 沿用 [什么是 AI Agent](/agent/what-is-agent.md) 里的定义：模型提出下一步动作，应用程序执行，再把观察交回，直到停止条件。下一步可以是最终答复，也可以是一次行动请求。在 [Tool Calling](/agent/tool-calling.md) 里，模型只返回工具名和参数，函数仍由应用执行。

能在写代码时定下来的顺序，流水线通常更稳。必须看上一步的观察才能决定叫不叫、叫哪一个，才需要 Agent 的循环。

## 核心原理

控制权放在不同的位置。

单轮问答的控制权在这次请求的末尾：返回即结束。程序里没有「再根据结果走一步」的分支。

流水线的控制权在作者写好的顺序里。检索函数被调用，是因为代码写了这一行，不是因为模型在这次运行中选择了它。顺序稳定时，失败也更容易分开看：检索为空是一步，生成胡说是另一步。

Agent 把控制权分成两半。模型读当前状态，选择最终答复或一次行动。应用决定这个选择能不能执行、结果写回哪里、什么时候必须停。模型看不到你没放进状态的变量，也不能越过应用去碰数据库。

所以，程序里同时有模型和外部数据，仍可能是流水线。要看运行到那一步时，调用哪个动作、要不要调用，是代码里的固定语句，还是模型刚刚做出的选择。

## 最小示例

三个函数都不访问网络。`ask`、`retrieve`、`decide`、`execute` 由调用方传入。

```python
def run_chatbot(ask, goal: str) -> str:
    return ask(goal)


def run_pipeline(retrieve, ask, goal: str) -> str:
    notes = retrieve(goal)
    return ask(f"{goal}\n{notes}")


def run_agent(decide, execute, goal: str, max_steps: int = 4) -> str:
    state = {"goal": goal, "observation": ""}
    for _ in range(max_steps):
        decision = decide(state)
        if decision["type"] == "final":
            return decision["content"]
        state["observation"] = execute(decision["name"])
    raise RuntimeError(f"超过最大步数 {max_steps}")
```

假实现把三条路径走完。

```python
def ask(text: str) -> str:
    return f"模型:{text}"


def retrieve(goal: str) -> str:
    return "固定笔记"


def decide(state: dict[str, str]) -> dict[str, str]:
    if state["observation"] == "":
        return {"type": "action", "name": "lookup"}
    return {"type": "final", "content": state["observation"]}


def execute(name: str) -> str:
    return f"{name}:路书"
```

按这段代码，`run_chatbot(ask, "什么是循环")` 只调用 `ask`，得到 `模型:什么是循环`。`run_pipeline` 会先调用 `retrieve`，返回值里带上 `固定笔记`，因为这一步写死在函数里。`run_agent` 第一次决策是行动 `lookup`，应用执行后把 `lookup:路书` 放进状态，第二次才返回这段观察。

把 `decide` 换成第一步就返回 `final` 的函数后，分支直接结束，不会读取工具名，因此也不会调用 `execute`。流水线没有这条分支，`retrieve` 每次都会执行。

若 `decide` 一直返回行动，`run_agent` 在四步之后抛出 `RuntimeError`。这个失败留在循环里处理，下一节会把它写成可以单独区分的停止条件。

## 常见问题

**多轮历史很长，就被当成 Agent。** 历史只是下一次补全的输入。模型若只返回文字，程序没有执行动作，也没有新的观察写回，控制方式和单轮问答相同。

**流水线里调用了工具，就改叫 Agent。** 工具函数可以出现在流水线里。只要调用点是人写死的，模型就没有在运行时选择动作。

**为了用上这个名字，把稳定顺序改成循环。** 顺序已知时，循环会多出停不下来和重复执行的可能。能写死的步骤留在流水线里。

**让模型在回答里声称自己已经查过。** 没有应用执行，这句话只是文本。查没查，要看状态里有没有这次观察。

## 知识自测

<QuizPanel topic-id="chatbot-vs-agent" />

## 参考资料

本页沿用 [什么是 AI Agent](/agent/what-is-agent.md) 的定义。模型只返回工具名和参数、由应用执行函数，见 [Tool Calling](/agent/tool-calling.md)。模型、工具、状态和停止条件四块结构，在 [Agent 基本架构](/agent/architecture.md) 里展开。
