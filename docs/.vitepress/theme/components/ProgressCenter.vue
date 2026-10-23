<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { modules } from 'virtual:modules'
import { quizzes } from 'virtual:quizzes'
import { topics } from 'virtual:topics'

import { moduleStats, serializeProgress } from '@content/progress'

import { href } from '../href'
import { clearAllProgress, ensureProgressLoaded, progressError, progressState, replaceProgress } from '../progress-store'

const importMessage = ref('')

onMounted(() => {
  ensureProgressLoaded()
})

const questions = computed(() =>
  quizzes.flatMap((quiz) => quiz.questions.map((question) => ({ id: question.id, topicId: question.topicId })))
)
const stats = computed(() => moduleStats(topics, questions.value, progressState.value))
const learned = computed(() => topics.filter((topic) => progressState.value.topics[topic.id]?.learned).length)
const quizDone = computed(() => stats.value.reduce((sum, item) => sum + item.quizDone, 0))
const quizTotal = computed(() => stats.value.reduce((sum, item) => sum + item.quizTotal, 0))

function moduleTitle(moduleId: string): string {
  return modules.find((item) => item.id === moduleId)?.title ?? moduleId
}

function percent(done: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((done / total) * 100)}%`
}

function exportProgress(): void {
  const blob = new Blob([serializeProgress(progressState.value)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'agent-roadbook-progress.json'
  link.click()
  URL.revokeObjectURL(url)
}

async function importProgress(event: Event): Promise<void> {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || !target.files?.[0]) return
  const file = target.files[0]
  try {
    const text = await file.text()
    const error = replaceProgress(text)
    importMessage.value = error ?? '已导入学习记录'
  } catch (error) {
    console.warn('import learning progress failed', error)
    importMessage.value = '读取导入文件失败'
  } finally {
    target.value = ''
  }
}

function clearProgress(): void {
  if (!window.confirm('清除这台浏览器上的全部学习记录？')) return
  const error = clearAllProgress()
  importMessage.value = error ?? '已清除学习记录'
}
</script>

<template>
  <div class="progress-center">
    <p>已学 {{ learned }} / {{ topics.length }} 节，练习完成 {{ quizDone }} / {{ quizTotal }}。记录保存在 localStorage，换浏览器或清除站点数据后会消失。</p>
    <p v-if="progressError" role="alert">{{ progressError }}。继续练习会覆盖无法读取的旧数据。</p>
    <ul class="progress-modules">
      <li v-for="item in stats" :key="item.moduleId">
        <div class="progress-label">
          <a :href="href(topics.find((topic) => topic.module === item.moduleId)?.link ?? '/')">{{ moduleTitle(item.moduleId) }}</a>
          <span>{{ item.learned }} / {{ item.topicTotal }} 节<span v-if="item.quizTotal"> · 练习 {{ item.quizDone }} / {{ item.quizTotal }}</span></span>
        </div>
        <div class="meter" role="meter" :aria-valuenow="item.learned" :aria-valuemin="0" :aria-valuemax="item.topicTotal" :aria-label="moduleTitle(item.moduleId)">
          <span :style="{ width: percent(item.learned, item.topicTotal) }"></span>
        </div>
      </li>
    </ul>
    <div class="quiz-actions">
      <button class="rb-button" type="button" @click="exportProgress">导出 JSON</button>
      <label class="rb-button">
        导入 JSON
        <input class="file-input" type="file" accept="application/json" @change="importProgress" />
      </label>
      <button class="rb-button" type="button" @click="clearProgress">清除进度</button>
    </div>
    <p v-if="importMessage" role="status">{{ importMessage }}</p>
  </div>
</template>
