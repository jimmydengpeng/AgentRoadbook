<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import { projects } from 'virtual:projects'
import { topics } from 'virtual:topics'

import { levelLabel } from '@content/labels'
import { taskKey } from '@content/progress'

import { href } from '../href'
import { ensureProgressLoaded, progressState, setProjectTask } from '../progress-store'

const { frontmatter } = useData()
const project = computed(() => projects.find((item) => item.id === frontmatter.value.id))
const prerequisites = computed(() =>
  (project.value?.prerequisites ?? []).flatMap((id) => {
    const topic = topics.find((item) => item.id === id)
    return topic ? [topic] : []
  })
)
const doneCount = computed(() => project.value?.tasks.filter((task) => isDone(task.id)).length ?? 0)

onMounted(() => {
  ensureProgressLoaded()
})

function isDone(taskId: string): boolean {
  if (!project.value) return false
  return Boolean(progressState.value.tasks[taskKey(project.value.id, taskId)]?.done)
}

function toggleTask(taskId: string, event: Event): void {
  if (!project.value) return
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  setProjectTask(project.value.id, taskId, target.checked)
}
</script>

<template>
  <article v-if="project" class="project-detail">
    <p class="meta">{{ levelLabel[project.difficulty] }} · 约 {{ project.estimatedHours }} 小时 · {{ project.stack.join(' / ') }}</p>
    <p>{{ project.description }}</p>
    <nav class="section-nav" aria-label="项目章节">
      <a href="#goals">学习目标</a>
      <a href="#features">项目功能</a>
      <a href="#steps">建议步骤</a>
      <a href="#tasks">任务清单</a>
      <a href="#acceptance">验收标准</a>
      <a href="#extensions">扩展任务</a>
      <a href="#references">参考资料</a>
    </nav>
    <h2 id="prerequisites">前置知识</h2>
    <ul>
      <li v-for="topic in prerequisites" :key="topic.id">
        <a :href="href(topic.link)">{{ topic.title }}</a>
      </li>
    </ul>
    <h2 id="goals">学习目标</h2>
    <ul>
      <li v-for="goal in project.goals" :key="goal">{{ goal }}</li>
    </ul>
    <h2 id="features">项目功能</h2>
    <ul>
      <li v-for="feature in project.features" :key="feature">{{ feature }}</li>
    </ul>
    <h2 id="steps">建议步骤</h2>
    <ol>
      <li v-for="step in project.steps" :key="step">{{ step }}</li>
    </ol>
    <h2 id="tasks">任务清单</h2>
    <p>已完成 {{ doneCount }} / {{ project.tasks.length }}。勾选只保存在这台浏览器。</p>
    <ul class="task-list">
      <li v-for="task in project.tasks" :key="task.id">
        <label>
          <input :checked="isDone(task.id)" type="checkbox" @change="toggleTask(task.id, $event)" />
          <strong>{{ task.title }}</strong>
        </label>
        <p>{{ task.detail }}</p>
      </li>
    </ul>
    <h2 id="acceptance">验收标准</h2>
    <ul>
      <li v-for="item in project.acceptance" :key="item">{{ item }}</li>
    </ul>
    <h2 id="extensions">扩展任务</h2>
    <ul>
      <li v-for="item in project.extensions" :key="item">{{ item }}</li>
    </ul>
    <h2 id="references">参考资料</h2>
    <ul>
      <li v-for="reference in project.references" :key="reference.url">
        <a :href="reference.url">{{ reference.title }}</a>
      </li>
    </ul>
  </article>
  <p v-else>没有找到这个项目。</p>
</template>
