import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

import { normalizeBase } from '../../scripts/content/base'
import { collectCatalog } from '../../scripts/content/catalog'
import { applyEnvFile } from '../../scripts/content/env-file'
import { buildSidebar } from '../../scripts/content/sidebar'
import { catalogPlugin } from './plugins/catalog'

const root = fileURLToPath(new URL('../..', import.meta.url))
applyEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))

const base = normalizeBase(process.env.VITEPRESS_BASE)
const githubRepository = (process.env.VITE_GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || '').trim()
const siteUrl = (process.env.SITE_URL || '').trim()
const catalog = collectCatalog(root)

if (catalog.errors.length > 0) {
  throw new Error(`内容校验失败\n${catalog.errors.join('\n')}`)
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'Agent Roadbook',
  titleTemplate: ':title · Agent Roadbook',
  description: '面向开发者的 AI Agent 开源学习路书',
  base,
  // GitHub Pages 会按实际文件响应。去掉 .html 的 clean URL 在项目站点刷新时会 404。
  cleanUrls: false,
  lastUpdated: false,
  ignoreDeadLinks: false,
  appearance: true,
  head: [['link', { rel: 'icon', href: `${base}favicon.svg` }]],
  ...(siteUrl.startsWith('https://') ? { sitemap: { hostname: siteUrl } } : {}),
  markdown: {
    config(md) {
      const renderFence = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, index, options, env, self) => {
        const token = tokens[index]
        if (!token || token.info.trim() !== 'mermaid') {
          return renderFence?.(tokens, index, options, env, self) ?? ''
        }
        return `<ClientOnly><Mermaid code="${encodeURIComponent(token.content)}" /></ClientOnly>\n`
      }
    }
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Agent Roadbook',
    nav: [
      { text: '首页', link: '/' },
      { text: '学习路线', link: '/guide/learning-path' },
      { text: '知识手册', link: '/guide/intro' },
      { text: '实战项目', link: '/projects/index' },
      { text: '资源导航', link: '/resources/index' }
    ],
    sidebar: buildSidebar(catalog.modules, catalog.topics, catalog.projects),
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一节', next: '下一节' },
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色',
    darkModeSwitchTitle: '切换到深色',
    externalLinkIcon: true,
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除查询',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '向上',
              navigateDownKeyAriaLabel: '向下',
              closeText: '关闭',
              closeKeyAriaLabel: 'esc'
            }
          }
        }
      }
    },
    socialLinks: githubRepository
      ? [{ icon: 'github', link: `https://github.com/${githubRepository}` }]
      : [],
    footer: {
      message: '自测答案随站点公开，进度只保存在本地浏览器。',
      copyright: 'Agent Roadbook · MIT'
    }
  },
  vite: {
    plugins: [catalogPlugin(root, githubRepository)],
    resolve: {
      alias: {
        '@content': fileURLToPath(new URL('../../scripts/content', import.meta.url))
      }
    },
    server: {
      fs: {
        allow: [root]
      }
    }
  }
})
