---
id: json-data
title: "JSON 与数据结构"
description: "分清 JSON 文本和 Python 对象，能读出工具参数里的嵌套字段"
module: fundamentals
order: 5
level: beginner
tags:
  - "JSON"
prerequisites:
  - "python-basics"
related: []
status: draft
estimatedMinutes: 15
updatedAt: "2026-10-23"
group: "接口与数据"
groupOrder: 2
---

# JSON 与数据结构

工具参数和结构化输出在网上走的是 JSON 文本。Python 里的字典要经过编码才是 JSON，收到的文本也要先解码。标准库 [json](https://docs.python.org/3/library/json.html) 做这两件事。

## 知识点概述

JSON 里有对象、数组、字符串、数字、布尔值和 `null`。对象用花括号，对应 Python 的字典；文档也提醒，JSON 里的 object 就是这一对花括号，不要和「Python 里一切都是对象」混在一起。数组对应列表。`null` 对应 `None`。

模型给出的工具参数通常是一个对象：外面是工具名，里面还有一层字段，例如城市或数量。读的时候先确认最外层是对象，再按名字取嵌套字段。数组、字符串和数字都可以是合法 JSON，但它们不是一份参数表。

来源不可信时，文档建议限制将要解析的数据大小。超长文本可能让解码占用很多 CPU 和内存。工具参数先看长度，再交给 `json.loads`。

## 核心原理

`json.dumps` 把 Python 值编码成文本，`json.loads` 把文本解码成 Python 值。文档中的示例把数组解成列表，把 `null` 解成 `None`。非法文本会解码失败，应捕获 `json.JSONDecodeError`，再抛出写明「这是工具参数」的错误，并用 `from` 保留原因。

键要靠名字读取。这个模块默认保留输入输出的顺序，业务含义仍然放在键上，不要用「第几个键」表示城市或数量。

`dumps` 的 `ensure_ascii` 默认为真，非 ASCII 字符会按转义写出。需要文本里直接出现汉字时，查阅这个参数。编码失败同样要看得见：集合、自定义对象默认不能放进 JSON，调用方应该得到明确的类型错误，而不是半截文本。

## 最小示例

下面的函数解析一段参数文本。它不访问网络。

```python
import json


def parse_arguments(raw: str) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as error:
        raise ValueError("tool arguments are not valid JSON") from error
    if not isinstance(value, dict):
        raise ValueError("tool arguments must be a JSON object")
    return value


def read_city(raw: str) -> str:
    city = parse_arguments(raw).get("city")
    if not isinstance(city, str) or not city:
        raise ValueError("city must be a non-empty string")
    return city
```

最外层是数组或残缺文本时，函数抛出 `ValueError`。最外层是对象但 `city` 不是非空字符串时，同样抛出 `ValueError`。两种失败的说明不同，调用方可以分别写回给模型。

## 常见问题

**用 Python 字典的写法充当 JSON。** 单引号和末尾逗号在 JSON 里不合法。交给接口之前要经过 `dumps`，或者确认文本本来就是 JSON。

**解析成功就直接取下标。** `json.loads` 可以返回列表或字符串。工具参数要先确认类型是字典，再读字段。

**把整份未知文本一次解析完。** 先限制长度。解析只解决语法，字段是否齐全留到下一节的校验。

## 知识自测

<QuizPanel topic-id="json-data" />

## 参考资料

- [json](https://docs.python.org/3/library/json.html)：对象和数组的编码、解码，以及对不可信输入限制大小的说明
