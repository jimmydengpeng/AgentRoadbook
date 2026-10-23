---
id: chunking
title: "文档解析与切分"
description: "按文档结构切开文本，并处理重叠、标题和过短片段"
module: rag
order: 4
level: beginner
tags:
  - "RAG"
prerequisites:
  - "rag-basics"
related: []
status: draft
estimatedMinutes: 25
updatedAt: "2026-10-23"
group: "建立知识库"
groupOrder: 1
---

# 文档解析与切分

检索比较的是片段，不是整份文档。切分把文档分成能读完的原文，并让相邻块共享一部分，避免一句话正好落在切点上。

## 知识点概述

[基础 RAG](/rag/basics.md) 里，模型只能看到这次取回的片段。片段太长，无关段落会绑在一起。片段太碎，一句话被切断，取回的半句回答不了问题。

常见的起点是按段落切开，并让相邻块重叠。一块多长、重叠几段，取决于你的文档：标题怎么排、段落是长是短、答案通常跨几句。拿自己的文档切几块读一读，再决定。别人教程里的字数，是他们的文档试出来的。

切完的每一块再交给嵌入模型，变成可比较的向量。向量怎么比，见 [Embedding](/rag/embedding.md)。

## 核心原理

```mermaid
flowchart LR
  article[整篇文档] --> paragraphs[按空行分成段落]
  paragraphs --> windows[相邻窗口共享若干段]
  windows --> pieces[得到可检索的片段]
```

按空行分段时，段内的单个换行会留下来。标题和正文之间如果没有空行，它们留在同一段，标题就不会和自己的正文拆开。标题如果单独成段，滑动窗口只有够得着它，后面的块才会带上这个标题。更稳的写法，是让标题和它紧接着的正文处在同一段里。

重叠按段落计数，不按一个抄来的字符数。相邻两块共享 `overlap_paragraphs` 段，窗口长度是这个数再加 1。窗口已经盖过全文时，整篇作为一块返回，避免同一段文字被重复切出很多份。

过短的片段，例如单独一行「见下表」或一个页码，往往读不出问题的答案。函数不知道你的文档多短算短，所以不按字数丢弃。先读样例，把这种片段并进相邻段落，再切一次。

Lewis 等人的论文为了检索，把文章切成片段再放进向量索引。他们那次实验的切法是为自己的语料准备的，不能换成你的手册的默认长度。本页不引用实验分数，也不把那次切法当成推荐值。

## 最小示例

`chunk_paragraphs` 是纯函数：不读文件，不调用模型。参数 `overlap_paragraphs` 是相邻块共享的段落数。

```python
def chunk_paragraphs(text: str, overlap_paragraphs: int) -> list[str]:
    """按空行分段，再用滑动窗口拼成块。

    相邻块共享 overlap_paragraphs 个段落。窗口盖过全文时返回一整块，避免把同一篇重复切很多份。
    """
    if overlap_paragraphs < 0:
        raise ValueError("overlap_paragraphs must be >= 0")
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = [part.strip() for part in normalized.split("\n\n") if part.strip()]
    if not paragraphs:
        return []
    if overlap_paragraphs >= len(paragraphs):
        return ["\n\n".join(paragraphs)]
    window = overlap_paragraphs + 1
    return [
        "\n\n".join(paragraphs[start : start + window])
        for start in range(0, len(paragraphs) - overlap_paragraphs)
    ]
```

三段正文、相邻共享一段。句子是编来演示切分的：

```python
article = "运费满 99 元包邮。\n\n偏远地区除外。\n\n发票在订单完成后开具。"
chunk_paragraphs(article, 1)
```

得到两块。第一块是包邮和偏远地区，第二块是偏远地区和发票。中间那句两边都在，所以它不会只剩半句落在切点外面。`chunk_paragraphs(article, 0)` 得到三块，每块一段，中间没有共享。

标题紧贴正文时，单个换行不会把它们切开：

```python
chunk_paragraphs("# 配送\n运费满 99 元包邮。\n\n# 发票\n发票在订单完成后开具。", 0)
```

得到两块，各自带着自己的标题。若在标题和正文之间再插入空行，标题会变成单独的段落。那时要么把标题和正文合并成一段，要么让窗口够得着标题，正文块里才仍然看得到它。

空字符串返回空列表。`overlap_paragraphs` 为负数时抛出 `ValueError`。

## 常见问题

**从教程抄一个字符长度。** 那个数字描述的是别人的文档。先按段落切，读几块样例，看一句话或一个标题有没有被拆开，再调整共享的段数。

**整篇文档做成一块。** 检索时要么整篇命中，要么整篇不中，提示词里也会混进无关章节。按结构切开，一块只放一节能读完的内容。

**把重叠理解成一定能提高效果。** 重叠是为了保住切点上的句子。共享几段要看文档。没有一个对所有资料都正确的段数，也不能从这里推出召回率。

**不看内容就丢掉标题和短片段。** 标题常常说明这块在讲什么。短片段要先看它是不是页码或「见下表」；是的话并进相邻段落。字数阈值要用自己的文档检验，不能从别处抄。

## 知识自测

<QuizPanel topic-id="chunking" />

## 参考资料

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)：论文把文章切成片段再检索。本页只采用「检索单位是片段」这一点，不引用实验分数，也不采用论文那次实验的切分长度。
- 片段如何变成向量，见 [Embedding](/rag/embedding.md)。如何按相似度取回前几块，见 [向量检索](/rag/vector-search.md)。
