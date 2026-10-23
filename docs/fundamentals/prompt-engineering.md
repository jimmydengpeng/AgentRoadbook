---
id: prompt-engineering
title: "Prompt Engineering"
description: "把任务、约束和输出格式写进提示词，并由程序检查结果"
module: fundamentals
order: 9
level: beginner
tags:
  - "Prompt"
prerequisites:
  - "llm-basics"
related: []
status: draft
estimatedMinutes: 25
updatedAt: "2026-10-23"
group: "大模型"
groupOrder: 3
---

# Prompt Engineering

Prompt engineering 是把任务、约束和输出格式写清楚，让模型更稳定地产生你要的内容。提示词能提高机会，不能代替程序对结果的检查。

## 知识点概述

一条够用的提示词通常分成三块。任务说明要做什么，例如「根据用户的话选出城市」。约束说明边界，例如「只使用给定的城市，缺少信息时说明不知道」。输出格式说明结果的形状，例如「只写城市名，不加解释」。

这三块最好放在开发者或系统消息里。用户这次的输入单独放在用户消息里。混在同一段里，模型和以后读代码的人都难以分辨哪一句是规则、哪一句是待处理的材料。有的接口会让开发者消息优先于用户消息。优先顺序仍然不是权限系统。用户可以写出和规则相反的话，程序仍要检查结果。

模型的输出会变。换一个模型版本，同一份提示词的表现也会变。服务商因此建议把提示词放在代码里，固定所调用的模型版本，并用一批样例检查行为。本页的例子只检查「结果是不是允许的城市名」，不记录任何分数。

有的接口还能按 JSON Schema 约束输出形状，减少缺键和非法枚举。形状符合结构，只说明字段在；不说明城市名真实、也不说明用户的问题被正确理解。解析和业务检查仍然要写。后面的 [Structured Output](/agent/structured-output.md) 会专门讲结构，这一页先把提示词和检查分开。

## 核心原理

提示词是给模型的说明，检查是给程序的规则。两者面对的失败不一样。提示词减轻「模型没理解任务」。检查抓住「文本少了字段、多了解释，或值不在允许范围内」。

用户输入要当作数据插进去，不要和指令拼成一段无法断开的字符串之后就信任它。程序至少知道：哪一段是开发者写的，哪一段是用户刚提交的。检查函数只看模型的输出，不看它「答应过」会遵守格式。

格式约束也有层次。只在提示词里写「请返回 JSON」，模型仍可能夹上说明文字。接口级的结构化输出能把形状收紧，前提是该模型和该参数支持这种约束。两种做法都不证明内容为真。拒绝回答、空字符串和看似合法的错城市，都要在程序里变成可以区分的结果。

## 最小示例

这个例子不调用模型。`build_messages` 把规则和用户材料分成两条消息。`accept_city` 拒绝不在名单里的文本。

```python
def build_messages(city_hint: str) -> list[dict[str, str]]:
    allowed = "杭州、苏州"
    return [
        {
            "role": "developer",
            "content": f"只回答一个城市名，必须是{allowed}之一。不要解释。",
        },
        {"role": "user", "content": city_hint},
    ]


def accept_city(text: str, allowed: set[str]) -> str:
    cleaned = text.strip()
    if cleaned not in allowed:
        raise ValueError(f"检查城市名失败：{cleaned} 不在允许范围内")
    return cleaned
```

`build_messages("想去有园林的城市")` 得到两条消息。若模型返回 `杭州`，`accept_city` 通过。若返回 `杭州，因为有园林` 或 `北京`，函数拒绝。提示词里已经写了格式，拒绝仍然发生在程序里。

## 常见问题

**把提示词写得很长，却没有样例可检查。** 长度不保证任务被完成。先写清任务、约束和格式，再用几个输入看输出是否被 `accept_city` 这类函数接受。

**写了「只返回 JSON」就直接 json.loads。** 模型可能夹带说明。解析失败要变成明确错误。解析成功还要检查业务字段。

**把用户的话和开发者指令拼成一段。** 以后无法判断是规则写错了，还是用户材料触发了例外。两条消息分开，检查只针对模型输出。

**把密钥或内部规则写进用户能改写的位置。** 密钥放在环境变量里，见 [大模型 API 调用](/fundamentals/llm-api.md)。用户消息可以要求模型忽略上面的规则，所以权限不能建立在提示词上。

## 知识自测

<QuizPanel topic-id="prompt-engineering" />

## 参考资料

- [OpenAI Text generation](https://platform.openai.com/docs/guides/text-generation)：提示词、消息角色，以及输出会随模型版本变化
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)：用 JSON Schema 约束输出形状。形状约束不代替业务检查
