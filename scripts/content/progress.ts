export type Mastery = 'unrated' | 'learning' | 'mastered'

export type ChoiceRecord = {
  type: 'choice'
  topicId: string
  selected: string
  correct: boolean
  updatedAt: string
}

export type ShortRecord = {
  type: 'short'
  topicId: string
  mastery: Mastery
  revealed: boolean
  updatedAt: string
}

export type CodeRecord = {
  type: 'code'
  topicId: string
  completed: boolean
  updatedAt: string
}

export type QuestionRecord = ChoiceRecord | ShortRecord | CodeRecord

export type ProgressState = {
  version: 1
  topics: Record<string, { learned: boolean; updatedAt: string }>
  questions: Record<string, QuestionRecord>
  tasks: Record<string, { done: boolean; updatedAt: string }>
}

export const PROGRESS_STORAGE_KEY = 'agent-roadbook.progress.v1'
const MAX_IMPORT_CHARS = 500_000

type StorageReader = Pick<Storage, 'getItem'>
type StorageWriter = Pick<Storage, 'setItem' | 'removeItem'>

export function emptyProgress(): ProgressState {
  return { version: 1, topics: {}, questions: {}, tasks: {} }
}

export function markTopicLearned(
  state: ProgressState,
  topicId: string,
  learned: boolean,
  now: string
): ProgressState {
  return {
    ...state,
    topics: { ...state.topics, [topicId]: { learned, updatedAt: now } }
  }
}

export function clearTopicProgress(state: ProgressState, topicId: string): ProgressState {
  const topics = { ...state.topics }
  delete topics[topicId]
  const questions: ProgressState['questions'] = {}
  for (const [id, record] of Object.entries(state.questions)) {
    if (record.topicId !== topicId) questions[id] = record
  }
  return { ...state, topics, questions }
}

export function recordChoice(
  state: ProgressState,
  questionId: string,
  topicId: string,
  selected: string,
  correct: boolean,
  now: string
): ProgressState {
  return {
    ...state,
    questions: {
      ...state.questions,
      [questionId]: { type: 'choice', topicId, selected, correct, updatedAt: now }
    }
  }
}

export function recordShort(
  state: ProgressState,
  questionId: string,
  topicId: string,
  mastery: Mastery,
  revealed: boolean,
  now: string
): ProgressState {
  return {
    ...state,
    questions: {
      ...state.questions,
      [questionId]: { type: 'short', topicId, mastery, revealed, updatedAt: now }
    }
  }
}

export function recordCode(
  state: ProgressState,
  questionId: string,
  topicId: string,
  completed: boolean,
  now: string
): ProgressState {
  return {
    ...state,
    questions: {
      ...state.questions,
      [questionId]: { type: 'code', topicId, completed, updatedAt: now }
    }
  }
}

export function clearQuestion(state: ProgressState, questionId: string): ProgressState {
  const questions = { ...state.questions }
  delete questions[questionId]
  return { ...state, questions }
}

export function taskKey(projectId: string, taskId: string): string {
  return `${projectId}:${taskId}`
}

export function setTask(
  state: ProgressState,
  projectId: string,
  taskId: string,
  done: boolean,
  now: string
): ProgressState {
  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskKey(projectId, taskId)]: { done, updatedAt: now }
    }
  }
}

export function isQuestionDone(record: QuestionRecord | undefined): boolean {
  if (!record) return false
  if (record.type === 'choice') return record.correct
  if (record.type === 'short') return record.mastery === 'mastered'
  return record.completed
}

export type ModuleStat = {
  moduleId: string
  learned: number
  topicTotal: number
  quizDone: number
  quizTotal: number
}

export function moduleStats(
  topics: { id: string; module: string }[],
  questions: { id: string; topicId: string }[],
  state: ProgressState
): ModuleStat[] {
  const moduleIds: string[] = []
  for (const topic of topics) {
    if (!moduleIds.includes(topic.module)) moduleIds.push(topic.module)
  }
  return moduleIds.map((moduleId) => {
    const moduleTopics = topics.filter((topic) => topic.module === moduleId)
    const topicIds = new Set(moduleTopics.map((topic) => topic.id))
    const moduleQuestions = questions.filter((question) => topicIds.has(question.topicId))
    return {
      moduleId,
      learned: moduleTopics.filter((topic) => state.topics[topic.id]?.learned).length,
      topicTotal: moduleTopics.length,
      quizDone: moduleQuestions.filter((question) => isQuestionDone(state.questions[question.id])).length,
      quizTotal: moduleQuestions.length
    }
  })
}

export function serializeProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2)
}

export type ParseProgressResult =
  | { ok: true; state: ProgressState }
  | { ok: false; error: string }

export function parseProgress(raw: string): ParseProgressResult {
  if (raw.length > MAX_IMPORT_CHARS) {
    return { ok: false, error: '学习记录过大，已拒绝导入' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `学习记录不是合法的 JSON（${message}）` }
  }
  const record = asRecord(parsed)
  if (!record) return { ok: false, error: '学习记录必须是 JSON 对象' }
  if (record.version !== 1) return { ok: false, error: '学习记录版本无法识别' }
  const topics = asRecord(record.topics)
  const questions = asRecord(record.questions)
  const tasks = asRecord(record.tasks)
  if (!topics || !questions || !tasks) {
    return { ok: false, error: '学习记录缺少 topics、questions 或 tasks' }
  }
  const state = emptyProgress()
  for (const [topicId, value] of Object.entries(topics)) {
    const item = asRecord(value)
    if (!item || typeof item.learned !== 'boolean' || typeof item.updatedAt !== 'string') {
      return { ok: false, error: `知识点记录 ${topicId} 无法识别` }
    }
    state.topics[topicId] = { learned: item.learned, updatedAt: item.updatedAt }
  }
  for (const [questionId, value] of Object.entries(questions)) {
    const parsedRecord = parseQuestionRecord(questionId, value)
    if (!parsedRecord.ok) return parsedRecord
    state.questions[questionId] = parsedRecord.record
  }
  for (const [key, value] of Object.entries(tasks)) {
    const item = asRecord(value)
    if (!item || typeof item.done !== 'boolean' || typeof item.updatedAt !== 'string') {
      return { ok: false, error: `任务记录 ${key} 无法识别` }
    }
    state.tasks[key] = { done: item.done, updatedAt: item.updatedAt }
  }
  return { ok: true, state }
}

export function readProgress(storage: StorageReader): { state: ProgressState; error: string | null } {
  let raw: string | null
  try {
    raw = storage.getItem(PROGRESS_STORAGE_KEY)
  } catch (error) {
    console.warn('read learning progress failed', error)
    return { state: emptyProgress(), error: '读取本地学习记录失败' }
  }
  if (!raw) return { state: emptyProgress(), error: null }
  const parsed = parseProgress(raw)
  if (!parsed.ok) return { state: emptyProgress(), error: parsed.error }
  return { state: parsed.state, error: null }
}

export function writeProgress(storage: Pick<Storage, 'setItem'>, state: ProgressState): string | null {
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(state))
    return null
  } catch (error) {
    console.warn('save learning progress failed', error)
    return '保存学习记录失败'
  }
}

export function removeProgress(storage: Pick<StorageWriter, 'removeItem'>): string | null {
  try {
    storage.removeItem(PROGRESS_STORAGE_KEY)
    return null
  } catch (error) {
    console.warn('clear learning progress failed', error)
    return '清除学习记录失败'
  }
}

function parseQuestionRecord(
  questionId: string,
  value: unknown
): { ok: true; record: QuestionRecord } | { ok: false; error: string } {
  const item = asRecord(value)
  if (!item || typeof item.type !== 'string' || typeof item.topicId !== 'string' || typeof item.updatedAt !== 'string') {
    return { ok: false, error: `题目记录 ${questionId} 无法识别` }
  }
  if (item.type === 'choice' && typeof item.selected === 'string' && typeof item.correct === 'boolean') {
    return {
      ok: true,
      record: {
        type: 'choice',
        topicId: item.topicId,
        selected: item.selected,
        correct: item.correct,
        updatedAt: item.updatedAt
      }
    }
  }
  if (
    item.type === 'short' &&
    (item.mastery === 'unrated' || item.mastery === 'learning' || item.mastery === 'mastered') &&
    typeof item.revealed === 'boolean'
  ) {
    return {
      ok: true,
      record: {
        type: 'short',
        topicId: item.topicId,
        mastery: item.mastery,
        revealed: item.revealed,
        updatedAt: item.updatedAt
      }
    }
  }
  if (item.type === 'code' && typeof item.completed === 'boolean') {
    return {
      ok: true,
      record: {
        type: 'code',
        topicId: item.topicId,
        completed: item.completed,
        updatedAt: item.updatedAt
      }
    }
  }
  return { ok: false, error: `题目记录 ${questionId} 的类型无法识别` }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}
