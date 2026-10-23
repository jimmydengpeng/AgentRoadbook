/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'virtual:topics' {
  export const topics: import('@content/schema').Topic[]
}

declare module 'virtual:projects' {
  export const projects: import('@content/schema').Project[]
}

declare module 'virtual:quizzes' {
  export const quizzes: import('@content/schema').QuizFile[]
}

declare module 'virtual:modules' {
  export const modules: import('@content/schema').ModuleInfo[]
}

declare module 'virtual:site' {
  export const githubRepository: string
}
