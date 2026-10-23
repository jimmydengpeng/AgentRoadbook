<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { modules } from 'virtual:modules'
import { githubRepository } from 'virtual:site'
import { projects } from 'virtual:projects'
import { topics } from 'virtual:topics'

import { levelLabel } from '@content/labels'
import type { ContentStatus } from '@content/schema'

import { href } from '../href'

type CoverageLink = {
  id: string
  title: string
  link: string
}

type ModuleCoverage = {
  id: string
  title: string
  order: number
  published: number
  total: number
  fill: string
  readable: CoverageLink[]
}

type ContentCoverage = {
  published: number
  planned: number
  draft: number
  reviewed: number
  total: number
  fill: string
  summary: string
  modules: ModuleCoverage[]
}

const heroImage = withBase('/hero-path.jpg')
const orderedModules = computed(() => [...modules].sort((left, right) => left.order - right.order))
const publishedCount = computed(() => topics.filter((topic) => topic.status === 'published').length)
const featuredProjects = computed(() => [...projects].sort((left, right) => left.order - right.order))
const coverage = computed(() => buildCoverage())

function firstTopicLink(moduleId: string): string {
  const topic = topics.find((item) => item.module === moduleId)
  return href(topic?.link ?? '/')
}

function moduleCount(moduleId: string): string {
  const items = topics.filter((topic) => topic.module === moduleId)
  const published = items.filter((topic) => topic.status === 'published').length
  return `${published} 节已发布 / ${items.length} 节`
}

function indexLabel(order: number): string {
  return String(order - 1).padStart(2, '0')
}

function countStatus(status: ContentStatus): number {
  return topics.filter((topic) => topic.status === status).length
}

function fillWidth(published: number, total: number): string {
  if (total === 0) return '0%'
  return `${(published / total) * 100}%`
}

function coverageSummary(published: number, reviewed: number, draft: number, planned: number, total: number): string {
  const parts = [`已发布 ${published} 节`]
  if (reviewed > 0) parts.push(`已审核 ${reviewed} 节`)
  if (draft > 0) parts.push(`初稿 ${draft} 节`)
  if (planned > 0) parts.push(`待编写 ${planned} 节`)
  return `${parts.join('，')}，共 ${total} 节。`
}

function buildCoverage(): ContentCoverage {
  const published = countStatus('published')
  const reviewed = countStatus('reviewed')
  const draft = countStatus('draft')
  const planned = countStatus('planned')
  const moduleRows = orderedModules.value.map((moduleInfo): ModuleCoverage => {
    const items = topics
      .filter((topic) => topic.module === moduleInfo.id)
      .sort((left, right) => left.order - right.order)
    const readable = items
      .filter((topic) => topic.status === 'published')
      .map((topic) => ({ id: topic.id, title: topic.title, link: href(topic.link) }))
    const publishedInModule = readable.length
    return {
      id: moduleInfo.id,
      title: moduleInfo.title,
      order: moduleInfo.order,
      published: publishedInModule,
      total: items.length,
      fill: fillWidth(publishedInModule, items.length),
      readable
    }
  })
  return {
    published,
    planned,
    draft,
    reviewed,
    total: topics.length,
    fill: fillWidth(published, topics.length),
    summary: coverageSummary(published, reviewed, draft, planned, topics.length),
    modules: moduleRows
  }
}
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <div class="home-hero-copy">
        <p class="home-kicker">Agent Roadbook</p>
        <h1>把 Agent 开发学成一条<br>能走完的路</h1>
        <p class="home-lead">
          给已经会写 Python 的开发者。按依赖阅读，在同一页完成讲解、示例和自测，再用三个可以验收的项目把知识串起来。
        </p>
        <div class="home-actions">
          <a class="rb-button primary" :href="href('/guide/learning-path')">查看学习路线</a>
        </div>
        <p class="home-note">已发布 {{ publishedCount }} 节，路线共 {{ topics.length }} 节。进度只保存在这台浏览器里，不需要注册。</p>
      </div>
      <figure class="home-hero-figure">
        <img
          :src="heroImage"
          alt="一条弯弯曲曲的小路，路边依次放着打开的笔记本、一把小工具和一只木箱，有人正沿路往前走。"
          width="1200"
          height="900"
        />
      </figure>
    </header>

    <section class="home-section" aria-labelledby="path-title">
      <h2 id="path-title">知识路线</h2>
      <ol class="road">
        <li v-for="moduleInfo in orderedModules" :key="moduleInfo.id">
          <span class="road-index">{{ indexLabel(moduleInfo.order) }}</span>
          <div>
            <a :href="firstTopicLink(moduleInfo.id)">{{ moduleInfo.title }}</a>
            <p>{{ moduleInfo.description }}</p>
            <p class="meta">{{ moduleCount(moduleInfo.id) }}</p>
          </div>
        </li>
      </ol>
    </section>

    <div class="home-panels">
      <section class="home-panel" aria-labelledby="project-title">
        <h2 id="project-title">实战项目</h2>
        <ul class="plain-list">
          <li v-for="project in featuredProjects" :key="project.id">
            <a :href="href(project.link)">{{ project.title }}</a>
            <p>{{ project.description }}</p>
            <p class="meta">{{ levelLabel[project.difficulty] }} · 约 {{ project.estimatedHours }} 小时 · {{ project.tags.join(' / ') }}</p>
          </li>
        </ul>
        <p><a :href="href('/projects/index')">查看全部项目</a></p>
      </section>

      <section class="home-panel" aria-labelledby="resource-title">
        <h2 id="resource-title">参考资料</h2>
        <p>正文只引用能公开核对的官方文档和论文。术语表用来统一本站的说法。</p>
        <p>
          <a :href="href('/resources/index')">资源导航</a>
          <span aria-hidden="true"> · </span>
          <a :href="href('/resources/glossary')">术语表</a>
        </p>
      </section>

      <section id="open-source" class="home-panel" aria-labelledby="oss-title">
        <h2 id="oss-title">开源维护</h2>
        <p>
          知识文章是 Markdown，练习和模块顺序是 YAML。改完运行校验、测试和生产构建即可。代码与本站原创内容使用 MIT 许可。
        </p>
        <p>仓库根目录的 raw 是私有参考，不会进入页面，也不应提交到公开仓库。</p>
        <p v-if="githubRepository">
          <a :href="`https://github.com/${githubRepository}`">GitHub 仓库</a>
        </p>
        <p v-else>部署时设置 <code>VITE_GITHUB_REPOSITORY</code> 后，顶部导航会显示 GitHub 链接。</p>
      </section>
    </div>

    <section class="home-section home-appendix" aria-labelledby="coverage-title">
      <h2 id="coverage-title">内容完整度</h2>
      <p>按模块看正文写到哪了。这不是你的学习进度。已发布的节可以直接打开，其余还在目录里。</p>
      <p class="meta coverage-summary">{{ coverage.summary }}</p>
      <div
        class="meter"
        role="meter"
        :aria-valuenow="coverage.published"
        aria-valuemin="0"
        :aria-valuemax="coverage.total"
        :aria-valuetext="coverage.summary"
        aria-label="全站正文完成度"
      >
        <span :style="{ width: coverage.fill }"></span>
      </div>
      <ol class="coverage">
        <li v-for="moduleInfo in coverage.modules" :key="moduleInfo.id">
          <span class="road-index">{{ indexLabel(moduleInfo.order) }}</span>
          <div class="coverage-body">
            <div class="coverage-head">
              <a :href="firstTopicLink(moduleInfo.id)">{{ moduleInfo.title }}</a>
              <span class="coverage-count">{{ moduleInfo.published }} / {{ moduleInfo.total }}</span>
            </div>
            <div
              class="meter"
              role="meter"
              :aria-valuenow="moduleInfo.published"
              aria-valuemin="0"
              :aria-valuemax="moduleInfo.total"
              :aria-valuetext="`${moduleInfo.published} / ${moduleInfo.total}`"
              :aria-label="`${moduleInfo.title} 已发布`"
            >
              <span :style="{ width: moduleInfo.fill }"></span>
            </div>
            <p v-if="moduleInfo.readable.length > 0" class="coverage-links">
              <a v-for="topic in moduleInfo.readable" :key="topic.id" :href="topic.link">{{ topic.title }}</a>
            </p>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>
