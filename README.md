# Agent Roadbook

Agent Roadbook 是面向 AI Agent 开发者的开源学习站。它按依赖关系组织知识，在同一页提供讲解、示例和自测，并用可以验收的项目把工具调用、检索和规划串起来。

站点是静态的：没有账号、后端和数据库。学习进度保存在浏览器本地。

## 核心功能

- 按技术路线生成的侧边栏，覆盖从 Python 与模型调用到工程化的章节
- 知识点使用统一 Frontmatter，前置知识和相关知识可以互相跳转
- 选择题、问答题和代码题，题目数据与页面组件分离
- 本地学习进度，支持导出、导入和清除
- 三个可筛选的实战项目，详情页带任务清单
- 只收录已核实的官方文档和论文
- 浅色 / 深色主题、本地搜索，以及桌面和移动端阅读

已经写完的示例是「什么是 AI Agent」「Tool Calling」和「基础 RAG」。其余章节在目录中标明待编写，链接都可以打开。

## 技术栈

- [VitePress](https://vitepress.dev/) 1.6
- Vue 3
- TypeScript
- Markdown 与 YAML
- Mermaid
- Vitest
- Node.js 24（当前 Active LTS 线；本地用 22 及以上也可以）
- pnpm 10

## 项目结构

```text
docs/                 站点页面。知识点 Markdown 在对应模块目录下
docs/.vitepress/      配置、主题和交互组件
quizzes/              练习题，文件名与知识点 ID 相同
content/modules.yaml  模块顺序。不要在这里列举每一节
sources/index.yaml    资料索引。公开链接必须登记在这里
examples/             可在本地运行的 Python 示例
scripts/              校验、目录读取和构建后检查
raw/                  私有参考，不进入 Git，也不进入网站
```

## 本地启动

需要 Node.js 24。包管理器使用 Corepack 自带的 pnpm，不需要全局安装。

```bash
corepack pnpm install
corepack pnpm dev
```

开发服务器默认在 `http://localhost:5173`。新增或改名知识点后要重启 `dev`，侧边栏在启动时生成。

常用命令：

```bash
corepack pnpm validate    # 校验 Frontmatter、题目、链接和来源
corepack pnpm test        # 单元测试和练习组件交互
corepack pnpm typecheck   # TypeScript 检查
corepack pnpm build       # 校验、生产构建并检查产物
corepack pnpm preview     # 预览构建结果
```

仓库根目录可以放 `.env`，字段见 `.env.example`。已经存在的 shell 变量优先。`VITE_GITHUB_REPOSITORY=owner/repo` 会在导航显示 GitHub 链接。

## 生产构建

```bash
corepack pnpm build
```

输出目录是 `docs/.vitepress/dist`。页面使用 `.html` 后缀，这样在 GitHub Pages 上刷新不会 404。

## 部署

下面的步骤还没有在任何账号上执行。仓库名和域名需要你自己填写。

### GitHub Pages

1. 把代码推到 GitHub，默认分支使用 `main` 或 `master`。
2. 在仓库 Settings → Pages 中，Build and deployment 选择 GitHub Actions。
3. `.github/workflows/pages.yml` 会在推送后安装依赖、测试所在的构建脚本、并发布。
4. 普通项目仓库的站点 base 是 `/仓库名/`。仓库名以 `.github.io` 结尾时，base 是 `/`。
5. 工作流会把 `VITE_GITHUB_REPOSITORY` 设为 `owner/repo`。可选仓库变量 `SITE_URL`，值为 `https://` 开头的站点地址，用于生成 sitemap。需要的话在 workflow 的 Build 步骤里加上这个环境变量。

静态资源路径由 VitePress 的 `base` 处理。内部链接在构建时写成带 base 的 `.html` 路径。

### Cloudflare Pages

1. 在 Cloudflare Pages 里连接这个 GitHub 仓库。
2. 生产分支选 `main` 或 `master`。
3. 构建设置：
   - 构建命令：`corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm build`
   - 输出目录：`docs/.vitepress/dist`
   - Node.js 版本：`24`。也可以在环境变量里设置 `NODE_VERSION=24`
4. 环境变量：
   - `VITEPRESS_BASE=/`
   - `VITE_GITHUB_REPOSITORY=owner/repo`
   - 可选 `SITE_URL=https://你的域名`
5. 自定义域名在 Pages 项目的 Custom domains 里添加，并按 Cloudflare 的提示修改 DNS。使用自定义域名或 Pages 默认域名时，`VITEPRESS_BASE` 必须保持 `/`。如果把它设成仓库子路径，样式和页面会 404。

## 内容贡献

新增一节的步骤写在 [AGENTS.md](AGENTS.md)。短版本：

1. 在对应的 `docs/<模块>/` 下新增 Markdown，并填写 Frontmatter。
2. 在 `quizzes/<知识点 ID>.yaml` 里写 1 到 5 道题。
3. 正文引用的每个 https 链接都登记到 `sources/index.yaml`，且 `publish: true`。
4. 运行 `corepack pnpm validate`、`corepack pnpm test` 和 `corepack pnpm build`。

`raw/` 里的笔记许可不明，不能复制进页面、题目或构建产物，也不要加入 Git。

本仓库原创的站点内容和代码使用 MIT 许可，见 [LICENSE](LICENSE)。第三方文档和论文以其自身许可为准。

## 后续规划

- 按官方文档补齐待编写章节，每节配上可运行的最小例子和练习
- 给已发布章节补充人工审核，把状态从待审核推进到 `reviewed`
- 继续用本地记录，不引入账号系统
- 项目验收脚本可以放进 `examples/`，仍然不在浏览器里执行 Python
