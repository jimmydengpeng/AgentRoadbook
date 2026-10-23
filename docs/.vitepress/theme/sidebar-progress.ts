import type { ProgressState } from '@content/progress'
import type { Topic } from '@content/schema'

export function hrefMatchesTopic(href: string, topicLink: string): boolean {
  const path = href.split('?')[0]?.split('#')[0] ?? ''
  const normalized = path.replace(/\.html$/, '').replace(/\/+$/, '') || '/'
  const expected = topicLink.replace(/\.html$/, '').replace(/\/+$/, '') || '/'
  return normalized === expected || normalized.endsWith(expected)
}

export function applySidebarProgress(doc: Document, topics: Topic[], state: ProgressState): void {
  const anchors = doc.querySelectorAll<HTMLAnchorElement>('.VPSidebar a')
  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    const topic = topics.find((item) => hrefMatchesTopic(href, item.link))
    const learned = topic ? Boolean(state.topics[topic.id]?.learned) : false
    anchor.classList.toggle('is-learned', learned)
  })
  const active = doc.querySelector('.VPSidebar .is-active')
  if (active instanceof HTMLElement) active.scrollIntoView({ block: 'nearest' })
}
