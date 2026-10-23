<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import type { CodeQuestion } from '@content/schema'

import { ensureProgressLoaded, progressState, submitCode } from '../progress-store'

const props = defineProps<{ question: CodeQuestion }>()
const code = ref(props.question.starter)
const showHint = ref(false)
const showSolution = ref(false)
const completed = ref(false)
const copyMessage = ref('')

onMounted(() => {
  ensureProgressLoaded()
  restore()
})

watch(progressState, restore, { deep: true })

function restore(): void {
  const record = progressState.value.questions[props.question.id]
  if (!record || record.type !== 'code') return
  completed.value = record.completed
}

async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(code.value)
    copyMessage.value = '已复制'
  } catch (error) {
    console.warn('copy code failed', error)
    copyMessage.value = '复制失败，请手动选择代码'
  }
}

function markComplete(): void {
  completed.value = true
  submitCode(props.question.id, props.question.topicId, true)
}

function restart(): void {
  code.value = props.question.starter
  showHint.value = false
  showSolution.value = false
  completed.value = false
  copyMessage.value = ''
  submitCode(props.question.id, props.question.topicId, false)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  event.preventDefault()
  const target = event.target
  if (!(target instanceof HTMLTextAreaElement)) return
  const start = target.selectionStart
  const end = target.selectionEnd
  const next = `${code.value.slice(0, start)}  ${code.value.slice(end)}`
  code.value = next
  requestAnimationFrame(() => {
    target.selectionStart = start + 2
    target.selectionEnd = start + 2
  })
}
</script>

<template>
  <section class="quiz">
    <h3>{{ question.prompt }}</h3>
    <h4>输入输出示例</h4>
    <ul>
      <li v-for="example in question.examples" :key="example.input">
        <p>输入：{{ example.input }}</p>
        <p>输出：{{ example.output }}</p>
      </li>
    </ul>
    <label class="field-label" :for="question.id">代码</label>
    <textarea
      :id="question.id"
      v-model="code"
      class="code-box"
      spellcheck="false"
      rows="14"
      @keydown="onKeydown"
    ></textarea>
    <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
    <p v-if="completed" role="status">已标记完成。代码草稿只留在当前页面，刷新后回到初始模板。</p>
    <div class="quiz-actions">
      <button class="rb-button" type="button" @click="copyCode">复制代码</button>
      <button class="rb-button" type="button" @click="showHint = !showHint">{{ showHint ? '隐藏提示' : '查看提示' }}</button>
      <button class="rb-button" type="button" @click="showSolution = !showSolution">
        {{ showSolution ? '隐藏参考实现' : '查看参考实现' }}
      </button>
      <button class="rb-button primary" type="button" @click="markComplete">标记完成</button>
      <button class="rb-button" type="button" @click="restart">重新开始</button>
    </div>
    <p v-if="showHint" class="quiz-result">{{ question.hint }}</p>
    <pre v-if="showSolution" class="quiz-result"><code>{{ question.solution }}</code></pre>
    <h4>本地运行</h4>
    <p>{{ question.run }}</p>
  </section>
</template>
