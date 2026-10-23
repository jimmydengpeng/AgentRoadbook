<script setup lang="ts">
import { computed, ref } from 'vue'
import { projects } from 'virtual:projects'

import { filterProjects, projectTags } from '@content/filter'
import { levelLabel } from '@content/labels'
import type { Level } from '@content/schema'

import { href } from '../href'

const difficulties: { id: Level | 'all'; label: string }[] = [
  { id: 'all', label: '全部难度' },
  { id: 'beginner', label: '入门' },
  { id: 'intermediate', label: '进阶' },
  { id: 'advanced', label: '深入' }
]

const difficulty = ref<Level | 'all'>('all')
const tag = ref('all')
const tags = computed(() => projectTags(projects))
const visible = computed(() =>
  filterProjects([...projects], { difficulty: difficulty.value, tag: tag.value }).sort(
    (left, right) => left.order - right.order
  )
)
</script>

<template>
  <div class="project-browser">
    <div class="filter-row" role="group" aria-label="按难度筛选">
      <button
        v-for="item in difficulties"
        :key="item.id"
        class="rb-button"
        :class="{ primary: difficulty === item.id }"
        type="button"
        :aria-pressed="difficulty === item.id"
        @click="difficulty = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="filter-row" role="group" aria-label="按技术标签筛选">
      <button class="rb-button" :class="{ primary: tag === 'all' }" type="button" :aria-pressed="tag === 'all'" @click="tag = 'all'">
        全部标签
      </button>
      <button
        v-for="item in tags"
        :key="item"
        class="rb-button"
        :class="{ primary: tag === item }"
        type="button"
        :aria-pressed="tag === item"
        @click="tag = item"
      >
        {{ item }}
      </button>
    </div>
    <p class="meta">{{ visible.length }} 个项目</p>
    <ul v-if="visible.length" class="plain-list">
      <li v-for="project in visible" :key="project.id">
        <a :href="href(project.link)">{{ project.title }}</a>
        <p>{{ project.description }}</p>
        <p class="meta">
          {{ levelLabel[project.difficulty] }} · 约 {{ project.estimatedHours }} 小时 · {{ project.stack.join(' / ') }}
        </p>
      </li>
    </ul>
    <p v-else>没有符合筛选条件的项目。</p>
  </div>
</template>
