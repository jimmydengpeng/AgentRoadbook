<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import type { Mastery } from '@content/progress'
import type { ShortQuestion } from '@content/schema'

import { ensureProgressLoaded, progressState, retryQuestion, submitShort } from '../progress-store'

const props = defineProps<{ question: ShortQuestion }>()
const draft = ref('')
const revealed = ref(false)
const mastery = ref<Mastery>('unrated')

onMounted(() => {
  ensureProgressLoaded()
  restore()
})

watch(progressState, restore, { deep: true })

function restore(): void {
  const record = progressState.value.questions[props.question.id]
  if (!record || record.type !== 'short') return
  revealed.value = record.revealed
  mastery.value = record.mastery
}

function reveal(): void {
  revealed.value = true
  submitShort(props.question.id, props.question.topicId, mastery.value, true)
}

function mark(next: Mastery): void {
  mastery.value = next
  submitShort(props.question.id, props.question.topicId, next, revealed.value)
}

function retry(): void {
  revealed.value = false
  mastery.value = 'unrated'
  retryQuestion(props.question.id)
}
</script>

<template>
  <section class="quiz">
    <h3>{{ question.prompt }}</h3>
    <p v-if="question.note">{{ question.note }}</p>
    <label class="field-label" :for="question.id">你的回答</label>
    <textarea :id="question.id" v-model="draft" rows="6" placeholder="先写自己的理解，再对照参考答案"></textarea>
    <p class="hint">回答原文只留在当前页面，刷新后不会保存。掌握程度会记在本地。</p>
    <div class="quiz-actions">
      <button class="rb-button primary" type="button" @click="reveal">对照参考答案</button>
      <button v-if="revealed" class="rb-button" type="button" @click="retry">重新作答</button>
    </div>
    <div v-if="revealed" class="quiz-result" role="status">
      <h4>参考答案</h4>
      <p>{{ question.reference }}</p>
      <h4>评分要点</h4>
      <ul>
        <li v-for="item in question.rubric" :key="item">{{ item }}</li>
      </ul>
      <div class="quiz-actions">
        <button class="rb-button" type="button" :aria-pressed="mastery === 'learning'" @click="mark('learning')">
          还需要练习
        </button>
        <button class="rb-button" type="button" :aria-pressed="mastery === 'mastered'" @click="mark('mastered')">
          已掌握
        </button>
      </div>
    </div>
  </section>
</template>
