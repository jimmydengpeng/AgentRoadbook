# 给后续 Agent 的维护约定

改这个仓库时，先读这一页，再改文件。站点是 VitePress 静态站。知识点的唯一来源是 `docs/**/*.md` 的 Frontmatter，不是手写的路由表。

## 不要做的事

- 不要把 `raw/` 的笔记、图片、面试记录或个人经历复制到 `docs/`、`quizzes/`、`projects/`、`examples/` 或 README。
- 不要把 `raw/` 从 `.gitignore` 里删掉，也不要把它放进 `docs/public`。
- 不要编造论文分数、延迟、价格或「已在某次运行中得到」的结果。示例如果没有在当前环境执行，就写成读者可以在本地运行的代码，不要声称它已经跑过。
- 不要把 `reviewed` 或 `published` 改回 `draft`，除非用户明确要求重写那一节。
- 不要为了加一节去改 Vue 组件。新题目只加 YAML。

## 新增知识点

1. 在 `content/modules.yaml` 里确认模块。只有现有模块都放不下时才新增模块。
2. 新建 `docs/<模块目录>/<短文件名>.md`。文件名决定 URL，`id` 决定练习和进度关联，两者都要稳定。
3. 填写 Frontmatter：`id`、`title`、`description`、`module`、`order`、`level`、`tags`、`prerequisites`、`related`、`status`、`estimatedMinutes`、`updatedAt`。需要分组时同时写 `group` 和 `groupOrder`。同一模块要么全部分组，要么全不分组。
4. 用自己的话写讲解。优先引用 `sources/index.yaml` 里已经核实的官方文档。AI 新写的正文把 `status` 设为 `draft`。
5. 新建 `quizzes/<id>.yaml`，写 1 到 5 题。题型是 `choice`、`short` 或 `code`。每题的 `id` 以知识点 ID 开头，`topicId` 与文件一致。
6. 正文和题目里出现的每个 https 链接，都登记到 `sources/index.yaml`。可公开来源必须有 `url`、`verification: verified` 和 `publish: true`。
7. 侧边栏会在下次启动 VitePress 时从 Frontmatter 生成。不需要改 `config.ts` 的导航数组，除非你在增加顶级入口。
8. 运行 `corepack pnpm validate`。它检查字段、重复 ID、前置链接、站内链接、来源登记，以及构建文本里是否混入私有笔记。
9. 运行 `corepack pnpm test` 和 `corepack pnpm typecheck`。
10. 运行 `corepack pnpm build`，确认生产构建和产物检查都通过。

待编写页面要保留「待编写」提示，不要填一段看起来像正文、其实不能教学的文字。

## 练习

选择题是单选。`answer` 必须是某个选项的 `id`。问答题提供 `reference` 和至少两条 `rubric`，不接自动评分。代码题提供 `starter`、`hint`、`solution`、`examples` 和 `run`。页面不执行代码。

进度存在 `localStorage` 键 `agent-roadbook.progress.v1`。逻辑在 `scripts/content/progress.ts`，组件只负责调用它。

## 实战项目

项目页放在 `docs/projects/<id>.md`，Frontmatter 包含 `kind: project` 和 `outline: false`，正文只有标题和 `<ProjectDetail />`。列表页会自动读到它。任务勾选也进同一份本地进度。

## 参考资料

`sources/index.yaml` 里 `publish: false` 的条目只给维护者看，不会打进客户端数据。当前的付费笔记导出就属于这一类。

## 命令

```bash
corepack pnpm dev
corepack pnpm validate
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

Node.js 24。`VITEPRESS_BASE` 默认是 `/`。GitHub 项目页必须在构建时设成 `/仓库名/`，规则在 `.github/workflows/pages.yml`。

## 内容状态

`planned` 待编写，`draft` 初稿，`reviewed` 已人工审核，`published` 正式发布。这和读者是否点过「已学」不是同一件事。
