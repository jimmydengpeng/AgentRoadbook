import type { ContentStatus, Level, Question } from './schema'

export const levelLabel: Record<Level, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '深入'
}

export const statusLabel: Record<ContentStatus, string> = {
  planned: '待编写',
  draft: '初稿',
  reviewed: '已审核',
  published: '已发布'
}

export const questionTypeLabel: Record<Question['type'], string> = {
  choice: '选择题',
  short: '问答题',
  code: '代码题'
}
