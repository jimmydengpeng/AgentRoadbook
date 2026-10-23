---
id: structured-output
title: "Structured Output"
description: "让模型按约定的 JSON 结构返回，而不是只返回一段自然语言"
module: agent
order: 6
level: beginner
tags:
  - "Agent"
  - "JSON"
prerequisites:
  - "json-data"
  - "llm-api"
related: []
status: draft
estimatedMinutes: 20
updatedAt: "2026-10-23"
group: "行动循环"
groupOrder: 2
---

# Structured Output

Structured Output 是一种交付约定：你给出 schema，模型按这份结构返回 JSON，程序再读取字段。这些字段是给程序用的数据。

## 知识点概述

模型默认返回自然语言。程序若要按字段分支，就得从句子里猜哪个词是城市、哪一句是结论。Structured Output 把「有哪些字段、类型是什么、哪些值允许出现」写成 schema，要求模型交付一个符合 schema 的 JSON 值。

它和工具调用都常出现 JSON，下一步不同。

- **结构化输出**：JSON 是结果。例如 `{"city": "杭州", "status": "ok"}`。程序解析后使用这些字段。这份数据本身不表示还要再执行一个工具。
- **工具调用**：JSON 是行动请求。模型返回工具名和参数，例如名字 `lookup_city`、参数 `{"city": "杭州"}`。应用执行函数，再把观察交回。模型只返回名字和参数，这一点 [Tool Calling](/agent/tool-calling.md) 已经分开讲过。

先看这份 JSON 接下来交给谁。程序要拿字段做分支或存储，用结构化输出。程序要去查记录、做计算或访问外部系统，用工具调用。需要那次执行的事实时，不能靠模型按 schema 编一份看起来合法的 JSON。

## 核心原理

schema 约束的是形状：有没有必填键、类型对不对、枚举有没有越界。[OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) 把 JSON Schema 交给接口，用来约束模型回复的形状。那是一家服务商的实现，字段放在消息的哪一层可以和别的接口不同。

形状对了，事实仍可能是模型补出来的。schema 不知道「杭州」是不是刚刚查到的。需要外部结果时，走工具调用：应用执行函数，观察才是那次执行的产物。工具参数也可以带 schema，用来限制名字和字段；那份 JSON 仍然是请求，不是交付。对照可见 [OpenAI Function calling](https://platform.openai.com/docs/guides/function-calling)。

应用在使用字段之前做自己的检查。接口侧的约束用来减少缺键和非法枚举。业务上不允许的组合，仍由你的代码拒绝。解析失败时给出明确错误，不要把半段自然语言继续当成对象用。

两种 JSON 用不同的入口。交付走「按 schema 读取」。请求走「按工具名执行」。混在一起时，程序会把一份城市数据误当成函数名，或把一次还没执行的调用当成已经查完。

## 最小示例

下面的检查只使用标准库，不访问网络。schema 要求 `city` 和 `status` 都是字符串，并且 `status` 只能是 `ok` 或 `missing`。

```python
import json

ALLOWED_STATUS = {"ok", "missing"}


def read_delivery(text: str) -> dict[str, str]:
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError("structured output is not JSON") from error
    if not isinstance(value, dict):
        raise ValueError("structured output must be a JSON object")
    city = value.get("city")
    status = value.get("status")
    if not isinstance(city, str) or city == "" or not isinstance(status, str):
        raise ValueError("structured output missing city or status")
    if status not in ALLOWED_STATUS:
        raise ValueError("structured output status is outside the schema")
    return {"city": city, "status": status}


def read_tool_request(message: dict[str, object]) -> tuple[str, dict[str, object]]:
    name = message.get("name")
    arguments = message.get("arguments")
    if not isinstance(name, str) or not isinstance(arguments, dict):
        raise ValueError("tool request needs a name and an arguments object")
    return name, arguments
```

`read_delivery('{"city": "杭州", "status": "ok"}')` 得到 `{"city": "杭州", "status": "ok"}`。程序可以拿 `city` 去显示或存储。这里没有工具被执行。返回的是只含这两个字段的新字典；输入里多出来的键不会进入结果，示例也没有把多出来的键当成错误。

`read_tool_request({"name": "lookup_city", "arguments": {"city": "杭州"}})` 得到名字和参数。下一步应是应用去调用 `lookup_city`。参数对象通过了「是对象」这一层检查，并不表示查询已经发生。

`read_delivery('{"city": "杭州", "status": "maybe"}')` 会抛出 `ValueError`，因为 `maybe` 不在约定的取值里。`city` 为空字符串时同样失败。调用方看到的是校验失败，不是一个被默默改成 `ok` 的对象。

## 常见问题

**整段回复里夹着说明文字，就对整段做 `json.loads`。** 整段不是一个 JSON 值时解析会失败。失败要返回明确错误，或把错误交回模型，要求只交付对象。截取句子中间看起来像对象的片段，需要单独写明规则；本页的函数不这样做。

**用结构化输出代替查询。** 模型可以交付 `{"city": "杭州", "status": "ok"}`，而没有任何记录被读过。需要业务记录或刚算出来的结果时，让模型通过工具调用请求动作，用观察里的值作为事实。

**工具参数合法，就认为任务完成。** 参数是请求的一部分。函数还没执行，观察还没写回，任务停在行动之前。

**schema 没写到的规则，指望校验函数自动补上。** 本页只检查约定的类型、非空 `city` 和 `status` 枚举。要拒绝未声明的键，或限制城市必须来自一份名单，得把那条规则写进代码。

## 知识自测

<QuizPanel topic-id="structured-output" />

## 参考资料

- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)：用 JSON Schema 约束模型回复的形状。本页只取这层约定，示例在本地检查，不调用该接口。
- [OpenAI Function calling](https://platform.openai.com/docs/guides/function-calling)：模型返回工具调用，由应用执行。用来和「交付数据」对照。
- 工具名、参数和执行函数的分工，见 [Tool Calling](/agent/tool-calling.md)。对象和数组见 [JSON 与数据结构](/fundamentals/json-data.md)。
