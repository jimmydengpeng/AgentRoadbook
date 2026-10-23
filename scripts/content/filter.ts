import type { Level, Project } from './schema'

export type ProjectFilter = {
  difficulty: Level | 'all'
  tag: string | 'all'
}

export function filterProjects(projects: Project[], query: ProjectFilter): Project[] {
  return projects.filter((project) => {
    const difficultyMatches = query.difficulty === 'all' || project.difficulty === query.difficulty
    const tagMatches = query.tag === 'all' || project.tags.includes(query.tag)
    return difficultyMatches && tagMatches
  })
}

export function projectTags(projects: Project[]): string[] {
  const tags = new Set(projects.flatMap((project) => project.tags))
  return [...tags].sort((left, right) => left.localeCompare(right, 'zh'))
}
