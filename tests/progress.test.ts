import { describe, expect, test } from 'vitest'

import {
  clearQuestion,
  emptyProgress,
  isQuestionDone,
  markTopicLearned,
  moduleStats,
  parseProgress,
  recordChoice,
  recordCode,
  recordShort,
  serializeProgress,
  setTask
} from '@content/progress'

describe('学习记录', () => {
  test('选择题答对后记为完成，答错则不算完成', () => {
    const correct = recordChoice(emptyProgress(), 'q1', 'agent-tool-calling', 'b', true, '2026-10-23T00:00:00.000Z')
    expect(isQuestionDone(correct.questions.q1)).toBe(true)
    const wrong = recordChoice(correct, 'q1', 'agent-tool-calling', 'a', false, '2026-10-23T00:00:01.000Z')
    expect(isQuestionDone(wrong.questions.q1)).toBe(false)
  })

  test('问答题只有标成已掌握才算完成', () => {
    const revealed = recordShort(emptyProgress(), 'q2', 'what-is-agent', 'learning', true, '2026-10-23T00:00:00.000Z')
    expect(isQuestionDone(revealed.questions.q2)).toBe(false)
    const mastered = recordShort(revealed, 'q2', 'what-is-agent', 'mastered', true, '2026-10-23T00:00:01.000Z')
    expect(isQuestionDone(mastered.questions.q2)).toBe(true)
  })

  test('导出后再导入会保留已学、答题和任务勾选', () => {
    let state = markTopicLearned(emptyProgress(), 'what-is-agent', true, '2026-10-23T00:00:00.000Z')
    state = recordCode(state, 'code-1', 'agent-tool-calling', true, '2026-10-23T00:00:01.000Z')
    state = setTask(state, 'multi-tool-agent', 'dispatch', true, '2026-10-23T00:00:02.000Z')
    const parsed = parseProgress(serializeProgress(state))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.state.topics['what-is-agent']?.learned).toBe(true)
    expect(parsed.state.questions['code-1']).toMatchObject({ type: 'code', completed: true })
    expect(parsed.state.tasks['multi-tool-agent:dispatch']?.done).toBe(true)
  })

  test('损坏、版本不对或过大的 JSON 会被拒绝', () => {
    expect(parseProgress('{').ok).toBe(false)
    expect(parseProgress('{"version":2,"topics":{},"questions":{},"tasks":{}}').ok).toBe(false)
    expect(parseProgress('{"version":1}'.padEnd(500_001, ' ')).ok).toBe(false)
    const parsed = parseProgress('{"version":1,"topics":{"x":{"learned":"yes","updatedAt":""}},"questions":{},"tasks":{}}')
    expect(parsed.ok).toBe(false)
  })

  test('清除题目记录后不再计入模块进度', () => {
    const topics = [{ id: 'agent-tool-calling', module: 'agent' }]
    const questions = [{ id: 'q1', topicId: 'agent-tool-calling' }]
    const recorded = recordChoice(emptyProgress(), 'q1', 'agent-tool-calling', 'b', true, '2026-10-23T00:00:00.000Z')
    expect(moduleStats(topics, questions, recorded)[0]).toMatchObject({ quizDone: 1, quizTotal: 1 })
    const cleared = clearQuestion(recorded, 'q1')
    expect(moduleStats(topics, questions, cleared)[0]).toMatchObject({ quizDone: 0, quizTotal: 1 })
  })
})
