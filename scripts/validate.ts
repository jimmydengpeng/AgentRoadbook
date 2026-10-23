import { fileURLToPath } from 'node:url'

import { collectCatalog } from './content/catalog'

const root = fileURLToPath(new URL('..', import.meta.url))
const catalog = collectCatalog(root)

if (catalog.errors.length > 0) {
  for (const error of catalog.errors) console.error(error)
  console.error(`校验失败，共 ${catalog.errors.length} 个问题`)
  process.exit(1)
}

console.log(
  `校验通过：${catalog.topics.length} 个知识点，${catalog.projects.length} 个项目，${catalog.quizzes.length} 份练习，${catalog.sources.length} 条来源`
)
