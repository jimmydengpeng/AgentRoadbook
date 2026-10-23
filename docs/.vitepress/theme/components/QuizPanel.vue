<script setup lang="ts">
import { computed } from 'vue'
import { quizzes } from 'virtual:quizzes'

import { levelLabel, questionTypeLabel } from '@content/labels'

import ChoiceQuestion from './ChoiceQuestion.vue'
import CodeQuestion from './CodeQuestion.vue'
import ShortAnswerQuestion from './ShortAnswerQuestion.vue'

const props = defineProps<{ topicId: string }>()

const questions = computed(() =>
  quizzes.filter((quiz) => quiz.topicId === props.topicId).flatMap((quiz) => quiz.questions)
)
</script>

<template>
  <section v-if="questions.length" aria-label="知识自测">
    <article v-for="(question, index) in questions" :key="question.id">
      <p class="quiz-kicker">第 {{ index + 1 }} 题 · {{ questionTypeLabel[question.type] }} · {{ levelLabel[question.difficulty] }}</p>
      <ChoiceQuestion v-if="question.type === 'choice'" :question="question" />
      <ShortAnswerQuestion v-else-if="question.type === 'short'" :question="question" />
      <CodeQuestion v-else :question="question" />
    </article>
  </section>
  <p v-else>这一节还没有练习题。</p>
</template>
