import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import { catalogPlugin } from './docs/.vitepress/plugins/catalog'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue(), catalogPlugin(root, '')],
  resolve: {
    alias: {
      '@content': fileURLToPath(new URL('./scripts/content', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts']
  }
})
