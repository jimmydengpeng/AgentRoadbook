import type { ModuleInfo, Project, Topic } from './schema'

export type SidebarLink = { text: string; link: string }
export type SidebarGroup = { text: string; collapsed?: boolean; items: SidebarNode[] }
export type SidebarNode = SidebarLink | SidebarGroup

export function buildSidebar(modules: ModuleInfo[], topics: Topic[], projects: Project[]): SidebarGroup[] {
  const sortedModules = [...modules].sort((left, right) => left.order - right.order)
  const sortedProjects = [...projects].sort((left, right) => left.order - right.order)
  return sortedModules.map((module) => {
    const moduleTopics = topics
      .filter((topic) => topic.module === module.id)
      .sort((left, right) => compareInModule(left, right))
    const items = groupTopics(moduleTopics)
    if (module.id === 'projects') {
      items.push(
        ...sortedProjects.map((project) => ({
          text: project.title,
          link: project.link
        }))
      )
    }
    return {
      text: module.title,
      collapsed: module.id !== 'guide',
      items
    }
  })
}

export function flattenSidebarLinks(nodes: SidebarNode[]): string[] {
  const links: string[] = []
  for (const node of nodes) {
    if ('link' in node) links.push(node.link)
    else links.push(...flattenSidebarLinks(node.items))
  }
  return links
}

function groupTopics(topics: Topic[]): SidebarNode[] {
  if (topics.every((topic) => !topic.group)) return topics.map(toLink)
  const groups = new Map<string, { order: number; items: SidebarLink[] }>()
  for (const topic of topics) {
    const name = topic.group ?? '未分组'
    const current = groups.get(name)
    const link = toLink(topic)
    if (!current) {
      groups.set(name, { order: topic.groupOrder ?? 0, items: [link] })
    } else {
      current.items.push(link)
    }
  }
  return [...groups.entries()]
    .sort((left, right) => left[1].order - right[1].order)
    .map(([text, group]) => ({
      text,
      collapsed: true,
      items: group.items
    }))
}

function toLink(topic: Topic): SidebarLink {
  return { text: topic.title, link: topic.link }
}

function compareInModule(left: Topic, right: Topic): number {
  const groupDiff = (left.groupOrder ?? 0) - (right.groupOrder ?? 0)
  if (groupDiff !== 0) return groupDiff
  return left.order - right.order
}
