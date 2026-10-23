<script setup lang="ts">
import { computed } from 'vue'
import { modules } from 'virtual:modules'
import { githubRepository } from 'virtual:site'
import { projects } from 'virtual:projects'
import { topics } from 'virtual:topics'

import { levelLabel, statusLabel } from '@content/labels'

import { href } from '../href'

const featuredIds = ['what-is-agent', 'agent-tool-calling', 'rag-basics']
const orderedModules = computed(() => [...modules].sort((left, right) => left.order - right.order))
const featured = computed(() =>
  featuredIds.flatMap((id) => {
    const topic = topics.find((item) => item.id === id)
    return topic ? [topic] : []
  })
)
const publishedCount = computed(() => topics.filter((topic) => topic.status === 'published').length)
const featuredProjects = computed(() => [...projects].sort((left, right) => left.order - right.order))

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
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <p class="home-kicker">Agent Roadbook</p>
      <h1>把 Agent 开发学成一条能走完的路</h1>
      <p class="home-lead">
        给已经会写 Python 的开发者。按依赖阅读，在同一页完成讲解、示例和自测，再用三个可以验收的项目把知识串起来。
      </p>
      <div class="home-actions">
        <a class="rb-button primary" :href="href('/guide/learning-path')">查看学习路线</a>
      </div>
      <p class="home-note">已发布 {{ publishedCount }} 节，路线共 {{ topics.length }} 节。进度只保存在这台浏览器里，不需要注册。</p>
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

    <section class="home-section" aria-labelledby="read-title">
      <h2 id="read-title">现在就能读完</h2>
      <p>其余章节已经进了目录，正文还在整理。下面三节有原理、示例和练习，可以独立阅读。</p>
      <ol class="feature-list">
        <li v-for="(topic, index) in featured" :key="topic.id">
          <span class="road-index">{{ index + 1 }}</span>
          <div>
            <a :href="href(topic.link)">{{ topic.title }}</a>
            <p>{{ topic.description }}</p>
            <p class="meta">{{ statusLabel[topic.status] }} · {{ levelLabel[topic.level] }} · {{ topic.estimatedMinutes }} 分钟</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="home-section" aria-labelledby="project-title">
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

    <section class="home-section" aria-labelledby="resource-title">
      <h2 id="resource-title">参考资料</h2>
      <p>正文只引用能公开核对的官方文档和论文。术语表用来统一本站的说法。</p>
      <p>
        <a :href="href('/resources/index')">资源导航</a>
        <span aria-hidden="true"> · </span>
        <a :href="href('/resources/glossary')">术语表</a>
      </p>
    </section>

    <section id="open-source" class="home-section" aria-labelledby="oss-title">
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
</template>
