import { withBase } from 'vitepress'

import { pageHref } from '@content/base'

export function href(link: string): string {
  return withBase(pageHref(link))
}
