import { ref } from 'vue'

import {
  clearQuestion,
  clearTopicProgress,
  emptyProgress,
  markTopicLearned,
  parseProgress,
  readProgress,
  recordChoice,
  recordCode,
  recordShort,
  removeProgress,
  setTask,
  writeProgress,
  type Mastery,
  type ProgressState
} from '@content/progress'

export const progressState = ref<ProgressState>(emptyProgress())
export const progressError = ref<string | null>(null)

let loaded = false

export function resetProgressStore(): void {
  loaded = false
  progressState.value = emptyProgress()
  progressError.value = null
}

export function ensureProgressLoaded(): void {
  if (loaded || typeof localStorage === 'undefined') return
  loaded = true
  const result = readProgress(localStorage)
  progressState.value = result.state
  progressError.value = result.error
}

function commit(next: ProgressState): void {
  progressState.value = next
  if (typeof localStorage === 'undefined') return
  progressError.value = writeProgress(localStorage, next)
}

function now(): string {
  return new Date().toISOString()
}

export function setTopicLearned(topicId: string, learned: boolean): void {
  ensureProgressLoaded()
  commit(markTopicLearned(progressState.value, topicId, learned, now()))
}

export function resetTopic(topicId: string): void {
  ensureProgressLoaded()
  commit(clearTopicProgress(progressState.value, topicId))
}

export function submitChoice(questionId: string, topicId: string, selected: string, correct: boolean): void {
  ensureProgressLoaded()
  commit(recordChoice(progressState.value, questionId, topicId, selected, correct, now()))
}

export function submitShort(
  questionId: string,
  topicId: string,
  mastery: Mastery,
  revealed: boolean
): void {
  ensureProgressLoaded()
  commit(recordShort(progressState.value, questionId, topicId, mastery, revealed, now()))
}

export function submitCode(questionId: string, topicId: string, completed: boolean): void {
  ensureProgressLoaded()
  commit(recordCode(progressState.value, questionId, topicId, completed, now()))
}

export function retryQuestion(questionId: string): void {
  ensureProgressLoaded()
  commit(clearQuestion(progressState.value, questionId))
}

export function setProjectTask(projectId: string, taskId: string, done: boolean): void {
  ensureProgressLoaded()
  commit(setTask(progressState.value, projectId, taskId, done, now()))
}

export function replaceProgress(raw: string): string | null {
  const parsed = parseProgress(raw)
  if (!parsed.ok) return parsed.error
  loaded = true
  commit(parsed.state)
  return null
}

export function clearAllProgress(): string | null {
  progressState.value = emptyProgress()
  progressError.value = null
  loaded = true
  if (typeof localStorage === 'undefined') return null
  return removeProgress(localStorage)
}
