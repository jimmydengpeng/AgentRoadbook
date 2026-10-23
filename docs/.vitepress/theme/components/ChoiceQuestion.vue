<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import type { ChoiceQuestion } from '@content/schema'

import { ensureProgressLoaded, progressState, retryQuestion, submitChoice } from '../progress-store'

const props = defineProps<{ question: ChoiceQuestion }>()
const selected = ref('')
const submitted = ref(false)

onMounted(() => {
  ensureProgressLoaded()
  restore()
})

watch(progressState, restore, { deep: true })

const correct = computed(() => selected.value === props.question.answer)
const answerText = computed(
  () => props.question.options.find((option) => option.id === props.question.answer)?.text ?? ''
)

function restore(): void {
  const record = progressState.value.questions[props.question.id]
  if (!record || record.type !== 'choice') return
  selected.value = record.selected
  submitted.value = true
}

function submit(): void {
  if (!selected.value) return
  submitted.value = true
  submitChoice(props.question.id, props.question.topicId, selected.value, correct.value)
}

function retry(): void {
  selected.value = ''
  submitted.value = false
  retryQuestion(props.question.id)
}
</script>

<template>
  <fieldset class="quiz">
    <legend>{{ question.prompt }}</legend>
    <label v-for="option in question.options" :key="option.id" class="choice">
      <input v-model="selected" type="radio" :name="question.id" :value="option.id" :disabled="submitted" />
      <span>{{ option.text }}</span>
    </label>
    <div class="quiz-actions">
      <button class="rb-button primary" type="button" :disabled="!selected || submitted" @click="submit">提交</button>
      <button v-if="submitted" class="rb-button" type="button" @click="retry">重试</button>
    </div>
    <div v-if="submitted" class="quiz-result" role="status">
      <p>{{ correct ? '回答正确' : '回答错误' }}</p>
      <p>答案：{{ answerText }}</p>
      <p>{{ question.explanation }}</p>
    </div>
  </fieldset>
</template>
