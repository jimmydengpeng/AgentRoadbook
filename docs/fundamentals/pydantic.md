---
id: pydantic
title: "Pydantic 与数据校验"
description: "用类型声明检查工具参数和模型输出，在产生副作用前拦住无法解析的数据"
module: fundamentals
order: 6
level: beginner
tags:
  - "Python"
prerequisites:
  - "python-oop"
  - "json-data"
related: []
status: draft
estimatedMinutes: 25
updatedAt: "2026-10-23"
group: "接口与数据"
groupOrder: 2
---

# Pydantic 与数据校验

[JSON](/fundamentals/json-data.md) 只说明文本能变成 Python 值。字段在不在、值能不能收成你声明的形状，要再检查一次。Pydantic 用类型注解描述这个形状。工具真的去查库、下单之前，以及把模型输出交给下游之前，先过这个模型。

## 知识点概述

Pydantic 的模型是继承 `BaseModel` 的类，字段是带注解的属性。官方文档把校验说成：造出一份符合类型和约束的实例。数据无法被解析成这样的实例时，抛出 `ValidationError`。

这和 [类](/fundamentals/python-oop.md) 的差别在于，这里的类同时还是一份检查规则。Agent 里有两处特别需要它。

- **工具参数**。模型填来的 JSON 对象可能缺字段，或把城市写成了嵌套对象。
- **结构化输出**。你希望模型返回固定字段时，先确认这份输出能成为实例，再让程序使用它。

文档首页给出的安装方式是 `pip install pydantic`。下面的代码假设这个库已经在当前环境里。

## 核心原理

首页上的用法是把数据传给模型的构造器。构造过程会做解析和校验。没有抛出 `ValidationError`，得到的实例才符合字段声明。之后用 `model_dump()` 取回字段字典。

文档同时说明，默认路径下输入可能被转换成字段类型，例如能够转换的数字字符串会收成整数。严格模式不做这种转换，值的类型必须和声明一致。需要拒绝转换时，按文档里的严格模式配置，不要假设默认行为会替你保留原始类型。

[模型说明](https://docs.pydantic.dev/latest/concepts/models/) 还列出两个入口：`model_validate` 接收已经在内存里的对象，`model_validate_json` 接收 JSON 文本。`model_construct` 会跳过校验。模型输出和工具参数都来自外部，不要用跳过校验的方式构造实例。

校验失败要继续往外传。捕获之后写成空字典，循环会把它看成一次成功的工具结果。

## 最小示例

这个模型只有一个必填字符串。它不访问网络。缺字段或无法解析时，错误信息里写明是城市查询，并保留 `ValidationError`。

```python
from pydantic import BaseModel, ValidationError


class CityQuery(BaseModel):
    city: str


def read_city(data: dict[str, object]) -> str:
    try:
        query = CityQuery.model_validate(data)
    except ValidationError as error:
        raise ValueError("city query failed validation") from error
    return query.city
```

`data` 里的 `city` 已经是字符串时，函数返回这个字符串。缺少 `city`，或这个字段无法按模型解析时，`model_validate` 抛出 `ValidationError`，函数再把它包成 `ValueError`。通过之后如果还要把实例交回 JSON，用 `query.model_dump()`。

## 常见问题

**先执行工具，失败了再看参数。** 缺字段也应在产生副作用之前停下。校验放在调用外部系统的前面。

**依赖默默转换。** 文档写明默认可能会做类型转换。计数、金额这类字段如果必须是原来的类型，要显式使用严格模式，并在测试里覆盖你关心的输入。

**用跳过校验的构造接收模型输出。** `model_construct` 的用途是不做校验。外部文本应走 `model_validate` 或 `model_validate_json`。

## 知识自测

<QuizPanel topic-id="pydantic" />

## 参考资料

- [Pydantic 文档](https://docs.pydantic.dev/latest/)：用类型注解做校验，以及 `ValidationError` 和 `model_dump`
- [Models](https://docs.pydantic.dev/latest/concepts/models/)：`model_validate`、`model_validate_json` 和跳过校验的 `model_construct`
