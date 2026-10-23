import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ChoiceQuestion, CodeQuestion, ShortQuestion } from '@content/schema'
import ChoiceQuestionView from '../docs/.vitepress/theme/components/ChoiceQuestion.vue'
import CodeQuestionView from '../docs/.vitepress/theme/components/CodeQuestion.vue'
import QuizPanel from '../docs/.vitepress/theme/components/QuizPanel.vue'
import ShortAnswerQuestionView from '../docs/.vitepress/theme/components/ShortAnswerQuestion.vue'
import { progressState, resetProgressStore } from '../docs/.vitepress/theme/progress-store'

const choice: ChoiceQuestion = {
  id: 'sample-choice',
  topicId: 'sample',
  type: 'choice',
  difficulty: 'beginner',
  prompt: '应用程序是否负责执行工具？',
  options: [
    { id: 'a', text: '不负责' },
    { id: 'b', text: '负责执行并交回结果' }
  ],
  answer: 'b',
  explanation: '模型只提出调用，函数在应用程序里运行。'
}

const short: ShortQuestion = {
  id: 'sample-short',
  topicId: 'sample',
  type: 'short',
  difficulty: 'beginner',
  prompt: '用一句话说明检索和生成的差别。',
  reference: '检索找片段，生成写回答。',
  rubric: ['区分检索和生成', '提到依据来自片段']
}

const code: CodeQuestion = {
  id: 'sample-code',
  topicId: 'sample',
  type: 'code',
  difficulty: 'beginner',
  prompt: '写一个会拒绝未知工具的函数。',
  examples: [{ input: 'missing', output: '抛出 KeyError' }],
  starter: 'def dispatch_tool():\n    raise NotImplementedError\n',
  hint: '先检查名字是否在注册表里。',
  solution: 'raise KeyError("unknown tool")\n',
  run: '在本地用断言运行这个函数。'
}

describe('自测组件', () => {
  beforeEach(() => {
    localStorage.clear()
    resetProgressStore()
  })

  test('未选择时不能提交选择题', () => {
    const wrapper = mount(ChoiceQuestionView, { props: { question: choice } })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })

  test('选择题选错后仍显示答案和解析，重试会藏起解析', async () => {
    const wrapper = mount(ChoiceQuestionView, { props: { question: choice } })
    await wrapper.get('input[value="a"]').setValue(true)
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toContain('回答错误')
    expect(wrapper.text()).toContain('负责执行并交回结果')
    expect(wrapper.text()).toContain(choice.explanation)
    const retry = wrapper.findAll('button').find((button) => button.text() === '重试')
    expect(retry).toBeTruthy()
    await retry?.trigger('click')
    expect(wrapper.text()).not.toContain(choice.explanation)
  })

  test('问答题对照后显示参考答案和评分要点', async () => {
    const wrapper = mount(ShortAnswerQuestionView, { props: { question: short } })
    expect(wrapper.text()).not.toContain(short.reference)
    await wrapper.get('textarea').setValue('检索负责查找。')
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toContain('参考答案')
    expect(wrapper.text()).toContain(short.reference)
    expect(wrapper.text()).toContain('区分检索和生成')
    const mastered = wrapper.findAll('button').find((button) => button.text() === '已掌握')
    await mastered?.trigger('click')
    expect(progressState.value.questions[short.id]).toMatchObject({ type: 'short', mastery: 'mastered' })
  })

  test('代码题在查看参考实现之前不展示答案', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(CodeQuestionView, { props: { question: code } })
    expect(wrapper.text()).not.toContain('unknown tool')
    expect(wrapper.text()).toContain('在本地用断言运行这个函数。')
    await wrapper.get('button').trigger('click')
    expect(writeText).toHaveBeenCalled()
    const reveal = wrapper.findAll('button').find((button) => button.text() === '查看参考实现')
    await reveal?.trigger('click')
    expect(wrapper.text()).toContain('unknown tool')
    const done = wrapper.findAll('button').find((button) => button.text() === '标记完成')
    await done?.trigger('click')
    expect(progressState.value.questions[code.id]).toMatchObject({ type: 'code', completed: true })
  })

  test('Tool Calling 页面能装入三种题型', () => {
    const wrapper = mount(QuizPanel, { props: { topicId: 'agent-tool-calling' } })
    expect(wrapper.text()).toContain('选择题')
    expect(wrapper.text()).toContain('问答题')
    expect(wrapper.text()).toContain('代码题')
    expect(wrapper.text()).toContain('谁真正执行你注册的函数')
    expect(wrapper.text()).not.toContain('unknown tool')
  })
})
