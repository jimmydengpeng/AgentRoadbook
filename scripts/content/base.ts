export function normalizeBase(input: string | undefined): string {
  if (!input || input.trim() === '' || input.trim() === '/') return '/'
  const trimmed = input.trim()
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

export function pageHref(link: string): string {
  if (link === '/' || link.endsWith('/') || link.endsWith('.html')) return link
  return `${link}.html`
}
