---
id: guide-environment
title: 开发环境准备
description: 准备 Python、虚拟环境和密钥存放方式，够读完第一段路线即可
module: guide
order: 4
level: beginner
tags:
  - Python
prerequisites:
  - guide-learning-path
related:
  - python-basics
  - llm-api
status: published
estimatedMinutes: 15
updatedAt: "2026-10-23"
---

# 开发环境准备

第一段路线只需要 Python 和一种编辑器。Docker、向量数据库和在线沙箱都可以以后再装。

## Python

使用 Python 3.11 或更新的版本。在仓库或你自己的练习目录里创建虚拟环境：

```bash
python -m venv .venv
```

Windows PowerShell 里启用它：

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS 和 Linux：

```bash
source .venv/bin/activate
```

然后确认解释器是虚拟环境里的那个：

```bash
python -c "import sys; print(sys.version)"
```

官方说明见 [Python 教程](https://docs.python.org/3/tutorial/) 和 [venv](https://docs.python.org/3/library/venv.html)。

## 密钥

模型服务的密钥放在环境变量里，不要写进源码、提示词或将要提交的笔记。PowerShell 可以临时设置：

```powershell
$env:OPENAI_API_KEY = "从服务商控制台复制的密钥"
```

这个站点的示例可以用假模型跑通，不强制你现在就申请密钥。等到 [大模型 API 调用](/fundamentals/llm-api.md) 和实战项目时再接真实接口。

## 编辑器

任何能运行终端的编辑器都可以。给 Python 打开保存时的格式检查，避免示例因为全角引号或混用 Tab 而失败。

## 本站自身的开发

修改这个网站需要 Node.js 24。那是维护文档站的要求，不是学习 Agent 的要求。命令写在仓库的 README 里。
