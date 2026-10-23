---
id: embedding
title: "Embedding"
description: "理解文本如何变成可比较的向量，以及向量本身还不是数据库"
module: rag
order: 2
level: beginner
tags:
  - "RAG"
prerequisites:
  - "rag-basics"
related: []
status: draft
estimatedMinutes: 20
updatedAt: "2026-10-23"
group: "建立知识库"
groupOrder: 1
---

# Embedding

嵌入把一段文字变成一组数字，也就是向量。方向接近的文本，向量也接近。向量只负责比较，还不是数据库，也不能代替原文。

## 知识点概述

[基础 RAG](/rag/basics.md) 先找出可能有用的片段，再把片段和问题交给模型。要判断问题和片段是否接近，两边需要同一种表示。嵌入模型做这件事：输入文本，输出一串浮点数。

同一套索引里的向量必须来自同一个模型。模型换了，或者输出的个数变了，旧向量不能和新向量放在一起比。换模型之后，已有片段要重新计算。

向量里没有可以展示给读者的句子。保存向量的同时，还要留下原文和来源。记录长什么样，下一节 [向量数据库](/rag/vector-database.md) 再固定下来。

OpenAI 的嵌入说明把嵌入定义成浮点数列表，并用向量之间的距离表示相关程度：距离越小，两段文本越相关。本页用余弦相似度，看的是方向。方向越齐，值越接近 1。两种都是在比向量。排序时谁大谁近，要和你选的算法一致。

## 核心原理

```mermaid
flowchart LR
  passage[一段文本] --> encoder[嵌入模型]
  encoder --> coords[浮点数向量]
  coords --> compare[与问题向量比较]
```

余弦相似度先算两个向量的点积，再除以各自的长度。点积大，说明它们朝相近的方向伸出。除以长度之后，文本长短不会单独把分数抬高。结果落在 -1 和 1 之间：1 是同方向，0 是互相垂直，-1 是相反方向。零向量没有方向，不能做除数，计算时要拒绝。

真实嵌入的分量远多于两个，每一维也没有「包邮」「发票」这种现成名字。下面只用两个数，并且临时给轴起了名字，是为了能心算。这是图解，不是模型的内部结构。

Lewis 等人的论文把外部文档放进稠密向量索引，再用检索器把问题和文档变成向量来查找。本页只取这个结构：文本要先变成可比较的向量。论文里的实验分数不在这里讨论。

## 最小示例

下面的向量是手写的。这不是嵌入模型的输出，也不能当成某个接口的返回值。

```python
def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        raise ValueError("vectors must be non-empty and the same length")
    dot = sum(x * y for x, y in zip(left, right, strict=True))
    left_length = sum(x * x for x in left) ** 0.5
    right_length = sum(y * y for y in right) ** 0.5
    if left_length == 0 or right_length == 0:
        raise ValueError("zero vector has no direction")
    return dot / (left_length * right_length)


# 手写的二维向量，只为了能心算。不是嵌入模型的输出。
shipping = [1.0, 0.0]
invoice = [0.0, 1.0]
question = [4.0, 3.0]
```

`question` 和 `shipping` 的点积是 4，长度分别是 5 和 1，相似度是 4/5，写成小数是 0.8。和 `invoice` 的点积是 3，相似度是 3/5，写成小数是 0.6。在这张手绘图上，问题更靠近包邮那一侧。

`cosine_similarity(shipping, [1.0, 0.0])` 是 1，方向相同。`cosine_similarity(shipping, invoice)` 是 0，互相垂直。`cosine_similarity(shipping, [-1.0, 0.0])` 是 -1，方向相反。空列表和零向量会抛出 `ValueError`。

这些数字只说明公式。换成嵌入模型之后，维度、数值和哪一条更近，都要重新计算。0.8 不是阈值。

## 常见问题

**把示例向量当成模型输出。** 模型返回的是它自己空间里的一长串数。本页的两个数是为了心算方向。接入模型时，用模型的输出替换这些列表，比较函数可以留下。

**混用不同模型的向量。** 个数不同，会在长度检查时失败。个数碰巧相同，方向也不在同一个空间里，分数没有意义。一个索引只放同一个模型算出来的向量。

**把高分理解成事实正确。** 分数只表示两个向量的方向接近。两句都错、但措辞接近时，分数也可以很高。事实是否成立，要回到原文核对。

**只留下向量。** 比较结束后，提示词里需要原文。向量重建不回那句话。原文和来源要和向量一起保存。

## 知识自测

<QuizPanel topic-id="embedding" />

## 参考资料

- [Vector embeddings](https://platform.openai.com/docs/guides/embeddings)：OpenAI 对嵌入的说明。本页采用其中「嵌入是浮点数向量，距离表示相关程度」的定义，不复制调用代码，也不引用价格。
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)：论文把外部文档做成稠密向量索引再检索。本页只采用这个结构，不引用实验分数。
