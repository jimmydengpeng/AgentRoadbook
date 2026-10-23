import { z } from 'zod'

export const levelSchema = z.enum(['beginner', 'intermediate', 'advanced'])
export const statusSchema = z.enum(['planned', 'draft', 'reviewed', 'published'])

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const moduleSchema = z
  .object({
    id: idSchema,
    title: z.string().min(2),
    description: z.string().min(8),
    dir: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    order: z.number().int().positive()
  })
  .strict()

export const topicSchema = z
  .object({
    id: idSchema,
    title: z.string().min(2),
    description: z.string().min(8),
    module: idSchema,
    order: z.number().int().positive(),
    level: levelSchema,
    tags: z.array(z.string().min(1)).min(1),
    prerequisites: z.array(idSchema),
    related: z.array(idSchema),
    status: statusSchema,
    estimatedMinutes: z.number().int().positive().max(240),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    group: z.string().min(1).optional(),
    groupOrder: z.number().int().positive().optional()
  })
  .strict()
  .superRefine((topic, context) => {
    if (topic.group && topic.groupOrder === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '写了 group 时必须写 groupOrder',
        path: ['groupOrder']
      })
    }
    if (!topic.group && topic.groupOrder !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '写了 groupOrder 时必须写 group',
        path: ['group']
      })
    }
    if (topic.prerequisites.includes(topic.id) || topic.related.includes(topic.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '不能把自身放进前置或相关知识',
        path: ['id']
      })
    }
  })

const optionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+$/),
    text: z.string().min(1)
  })
  .strict()

const choiceSchema = z
  .object({
    id: idSchema,
    topicId: idSchema,
    type: z.literal('choice'),
    difficulty: levelSchema,
    prompt: z.string().min(8),
    options: z.array(optionSchema).min(2).max(6),
    answer: z.string().min(1),
    explanation: z.string().min(8)
  })
  .strict()

const shortSchema = z
  .object({
    id: idSchema,
    topicId: idSchema,
    type: z.literal('short'),
    difficulty: levelSchema,
    prompt: z.string().min(8),
    note: z.string().min(1).optional(),
    reference: z.string().min(8),
    rubric: z.array(z.string().min(2)).min(2).max(8)
  })
  .strict()

const codeSchema = z
  .object({
    id: idSchema,
    topicId: idSchema,
    type: z.literal('code'),
    difficulty: levelSchema,
    prompt: z.string().min(8),
    examples: z
      .array(
        z
          .object({
            input: z.string().min(1),
            output: z.string().min(1)
          })
          .strict()
      )
      .min(1)
      .max(6),
    starter: z.string().min(1),
    hint: z.string().min(1),
    solution: z.string().min(1),
    run: z.string().min(8)
  })
  .strict()

export const questionSchema = z.discriminatedUnion('type', [choiceSchema, shortSchema, codeSchema])

export const quizFileSchema = z
  .object({
    topicId: idSchema,
    questions: z.array(questionSchema).min(1).max(5)
  })
  .strict()

const referenceSchema = z
  .object({
    title: z.string().min(2),
    url: z.string().url()
  })
  .strict()

export const projectSchema = z
  .object({
    id: idSchema,
    title: z.string().min(2),
    description: z.string().min(8),
    difficulty: levelSchema,
    order: z.number().int().positive(),
    stack: z.array(z.string().min(1)).min(1),
    tags: z.array(z.string().min(1)).min(1),
    prerequisites: z.array(idSchema).min(1),
    estimatedHours: z.number().int().positive().max(80),
    goals: z.array(z.string().min(4)).min(2),
    features: z.array(z.string().min(4)).min(2),
    steps: z.array(z.string().min(4)).min(3),
    tasks: z
      .array(
        z
          .object({
            id: idSchema,
            title: z.string().min(2),
            detail: z.string().min(8)
          })
          .strict()
      )
      .min(3)
      .max(8),
    acceptance: z.array(z.string().min(4)).min(3),
    extensions: z.array(z.string().min(4)).min(1),
    references: z.array(referenceSchema).min(1)
  })
  .strict()

export const sourceSchema = z
  .object({
    id: idSchema,
    title: z.string().min(2),
    path: z.string().min(1).optional(),
    url: z.string().url().optional(),
    author: z.string().min(1),
    type: z.enum(['official-doc', 'paper', 'repository', 'paid-notes']),
    topics: z.array(idSchema),
    verification: z.enum(['verified', 'restricted', 'unverified']),
    license: z.string().min(1),
    publish: z.boolean(),
    notes: z.string().min(4)
  })
  .strict()
  .superRefine((source, context) => {
    if (!source.path && !source.url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '需要 path 或 url',
        path: ['url']
      })
    }
    if (source.publish && source.verification !== 'verified') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '可公开的来源必须已核实',
        path: ['verification']
      })
    }
    if (source.publish && !source.url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '可公开的来源需要 url',
        path: ['url']
      })
    }
    if (source.publish && source.path?.replace(/\\/g, '/').startsWith('raw')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'raw 资料不能标记为公开',
        path: ['publish']
      })
    }
  })

export const moduleFileSchema = z.object({ modules: z.array(moduleSchema).min(1) }).strict()
export const sourceFileSchema = z.object({ sources: z.array(sourceSchema).min(1) }).strict()

export type Level = z.infer<typeof levelSchema>
export type ContentStatus = z.infer<typeof statusSchema>
export type ModuleInfo = z.infer<typeof moduleSchema>
export type Topic = z.infer<typeof topicSchema> & { link: string; file: string }
export type ChoiceQuestion = z.infer<typeof choiceSchema>
export type ShortQuestion = z.infer<typeof shortSchema>
export type CodeQuestion = z.infer<typeof codeSchema>
export type Question = z.infer<typeof questionSchema>
export type QuizFile = z.infer<typeof quizFileSchema>
export type Project = z.infer<typeof projectSchema> & { link: string; file: string }
export type Source = z.infer<typeof sourceSchema>

export function formatZodIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    return `${file}: ${path} ${issue.message}`
  })
}
