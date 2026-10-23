---
id: token-context
title: "Token 与上下文窗口"
description: "说明 token 不是字数，以及窗口装不下时较早的内容会被截断或请求被拒绝"
module: fundamentals
order: 8
level: beginner
tags:
  - "LLM"
prerequisites:
  - "llm-basics"
related: []
status: draft
estimatedMinutes: 20
updatedAt: "2026-10-23"
group: "大模型"
groupOrder: 3
---

# Token 与上下文窗口

模型按 token 计这次请求有多长。token 不等于你在屏幕上数到的字数。上下文窗口是这一次调用能装下的 token 预算，装不下时，较早的内容会被截掉，或者这次请求直接失败。

## 知识点概述

token 是模型读写文本时使用的片段。一个片段可能是一个汉字、半个英文词、一个标点，也可能是一整个短词。切分方式取决于那个模型的词表。所以「这段有 200 个字」不能换成「占了 200 个 token」，英文和中文也不能共用一个心算比例。本页不给出任何模型的窗口长度或单价。你真正调用时，以那份模型说明里的当前数字为准。

上下文窗口不是训练时读过的全部语料。它是这一次生成时的工作记忆：开发者指令、用户消息、历史回复、贴进去的资料、工具说明，以及这次还要生成的新文本，都算在同一次预算里。响应里的用量字段也按 token 报告，不按字符数。

窗口装不下时，接口可能从对话开头丢掉较早的内容，留下较新的部分，这就是截断；也可能直接拒绝这次请求。有的接口还会在生成过程顶到窗口边缘时停下，于是回答是半截。具体是哪一种，看所用接口和它的参数。

## 核心原理

预算要同时留给输入和输出。用户的问题很短，不代表这次调用很短。系统指令、前几轮对话和即将生成的回答都占位置。只检查最后一句的字数，会在长对话里突然失败。

截断从较早的内容开始，是因为当前问题通常依赖最近几轮。被丢掉的消息不会自动留在模型里。下一次请求如果不再发送它们，模型就看不到那些事实。程序若还需要旧事实，应把摘要或原始记录放在自己的存储里，再按需要取回，而不是假设窗口会记住全程。

两家文档把超限写成了可核对的行为，参数名并不通用：

- 有的接口在输入本身已经超过窗口时直接返回错误。生成若在写出回答时顶到窗口，会停下来，并给出可以区分的停止原因。
- 另一类接口默认同样拒绝超长输入。只有明确打开截断时，才会从对话开头丢掉较早的条目，使剩余内容放进窗口。

因此调用方要处理两种失败：请求被拒绝，以及回答不完整。不要把截断后的文本当成一份仍然包含全文的成功结果。

## 最小示例

下面的切分只为演示「字符数和片段数可以不同」。它不是任何厂商的分词器，数字也不能拿去估算真实模型。

```python
def demo_tokens(text: str) -> list[str]:
    """连续的英文或数字算一段，其余非空白字符各算一段。"""
    pieces: list[str] = []
    word: list[str] = []
    for char in text:
        if char.isascii() and char.isalnum():
            word.append(char)
            continue
        if word:
            pieces.append("".join(word))
            word = []
        if not char.isspace():
            pieces.append(char)
    if word:
        pieces.append("".join(word))
    return pieces


def keep_recent(messages: list[str], token_limit: int) -> list[str]:
    """从最新的消息往回装。装不下就停。token_limit 只属于这个例子。"""
    kept: list[str] = []
    used = 0
    for message in reversed(messages):
        cost = len(demo_tokens(message))
        if used + cost > token_limit:
            break
        kept.append(message)
        used += cost
    kept.reverse()
    return kept
```

`demo_tokens("你好 Agent")` 得到 `["你", "好", "Agent"]`。字符串长度是 8，片段数是 3。

```python
messages = ["更早的背景", "上一问", "当前问题 Agent"]
print(keep_recent(messages, token_limit=8))
```

`token_limit=8` 时，结果是 `["上一问", "当前问题 Agent"]`。`更早的背景` 被截掉。若最新的一条自己就超过上限，函数返回空列表。调用方应把它当成放不下，而不是当成一份空对话发给模型。真实接口可能改为直接拒绝，而不是替你丢掉旧消息。

## 常见问题

**用字数判断能不能发出去。** 字数和 token 数不是同一个量。要估计真实请求，使用该模型提供的计数方式，或直接看响应里的用量。

**记下某个窗口数字到处套用。** 窗口随模型变化，文档也会更新。代码里不要写死一个从别处抄来的长度。

**截断之后仍认为模型记得前文。** 没送进这次请求的消息，这次就不会被读到。需要保留的事实要放在程序自己的状态里。

**只给用户的问题留预算。** 指令、历史、资料和这次要生成的回答都占窗口。长指令加上长历史时，短问题也会超限。

## 知识自测

<QuizPanel topic-id="token-context" />

## 参考资料

- [Anthropic Context windows](https://docs.anthropic.com/en/docs/build-with-claude/context-windows)：窗口里装哪些内容；输入已经超限时请求失败，部分模型在生成顶到边界时停下
- [OpenAI Responses 创建接口](https://platform.openai.com/docs/api-reference/responses/create)：超长输入默认失败；打开截断时从对话开头丢掉较早的条目
