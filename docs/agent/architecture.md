---
id: agent-architecture
title: "Agent 基本架构"
description: "把模型、工具、状态和停止条件放进同一张可讲清的结构"
module: agent
order: 3
level: beginner
tags:
  - "Agent"
prerequisites:
  - "what-is-agent"
related: []
status: draft
estimatedMinutes: 20
updatedAt: "2026-10-23"
group: "认识 Agent"
groupOrder: 1
---

# Agent 基本架构

一次 Agent 任务可以收成四块：模型、工具、状态、停止条件。它们怎样一轮轮重复，下一节再写。

## 知识点概述

本站的 Agent 是：模型提出下一步动作，应用程序执行，再把观察交回，直到停止条件。这四件事对应四块结构。

- **模型**：读当前状态，选择最终答复，或给出一次行动请求。行动请求里是工具名和参数，不是函数本身。
- **工具**：应用登记并执行的函数。查一条本地记录、做一次计算，都发生在这里。
- **状态**：目标、到目前为止的观察、还没完成的进度。下一步只能看见写进状态的内容。
- **停止条件**：应用用来结束循环的规则。常见的是模型给出最终答复，或步数达到上限。

少一块，行为就会变。没有工具，模型只能在已有状态上说话。没有状态，下一步看不到上一次观察。没有停止条件，循环没有合法的结束。模型负责选择，不负责替应用保管另外三块。

## 核心原理

数据按固定方向流过这四块。

状态进入模型。模型输出两种决策之一：`final` 带着给用户的文本，或 `action` 带着工具名和参数。应用看到 `action` 后，只在已登记的工具里查找并执行。执行结果写成观察，放回状态。下一次模型读到的是更新后的状态。

工具名不在登记表里时，应用不要假装执行成功。可以把明确的失败写进观察，让模型下一步改选；也可以直接停止。两种做法都由应用产生失败文本。模型自己补的一句「已完成」不能代替这次记录。

停止条件放在应用一侧，是因为模型没有义务记得步数。提示词里写「请适可而止」不能代替计数器。人取消任务也是停止条件：取消时循环应退出，而不是把取消消息再交给模型继续行动。

调试时按块看。模型选了错误的工具名，查决策。工具名对了但函数结果不对，查工具。下一步重复旧动作，查观察是否真的写回状态。任务不停，查停止条件有没有被执行到。

## 最小示例

下面用一次运行把四块放在一起。`decide` 是假模型，`lookup` 是本地函数，不访问网络。

```python
def lookup() -> str:
    return "路书第 1 节"


def decide(state: dict[str, str]) -> dict[str, str]:
    if state["observation"] == "":
        return {"type": "action", "name": "lookup"}
    return {"type": "final", "content": state["observation"]}


def run(goal: str, max_steps: int = 4) -> str:
    tools = {"lookup": lookup}
    state = {"goal": goal, "observation": ""}
    for _ in range(max_steps):
        decision = decide(state)
        if decision["type"] == "final":
            return decision["content"]
        name = decision["name"]
        tool = tools.get(name)
        if tool is None:
            state["observation"] = f"unknown tool: {name}"
            continue
        state["observation"] = tool()
    raise RuntimeError(f"超过最大步数 {max_steps}")
```

`run("这一节在讲什么")` 的第一次决策是行动。应用在 `tools` 里找到 `lookup`，把 `路书第 1 节` 写入 `state["observation"]`。第二次决策读到这份观察，返回同样的文本。`max_steps` 是停止条件的一部分：两步之内已经结束，所以不会走到异常。

若 `decide` 每次都返回行动，第四次之后抛出 `RuntimeError`。调用方要用这个异常和成功返回的字符串区分开，不能把异常信息显示成任务已经完成。

未知工具不会去调用一个不存在的函数。观察会变成 `unknown tool: ...`，这一步仍然计入 `max_steps`。失败被记进状态，下一步还能看见它。

## 常见问题

**把系统提示词当成全部架构。** 提示词只影响模型那一块。工具登记、状态写回和步数计数都在应用里，换一段提示词替换不了它们。

**状态只留在模型服务商的会话里。** 程序若没有自己的副本，就无法在中途检查观察，也无法在换模型后重放同一次任务。应用侧要保留目标、观察和步数。

**停止条件只写进提示词。** 「做完就停」取决于模型会不会这么说。步数上限和取消要由应用执行。

**工具改了外部数据，却不把改动写进观察。** 下一步模型看不到发生了什么，可能再次请求同一个动作。执行结果要回到状态里。

## 知识自测

<QuizPanel topic-id="agent-architecture" />

## 参考资料

定义见 [什么是 AI Agent](/agent/what-is-agent.md)。循环如何重复、步数失败如何和成功答复区分，见 [Agent Loop](/agent/loop.md)。工具名和参数如何变成一次函数执行，见 [Tool Calling](/agent/tool-calling.md)。
