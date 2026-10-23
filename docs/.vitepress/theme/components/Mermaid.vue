<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ code: string }>()
const svg = ref('')
const error = ref('')
const source = decodeURIComponent(props.code)
const { isDark } = useData()
let active = true

onMounted(() => {
  void renderDiagram()
  watch(isDark, () => {
    void renderDiagram()
  })
})

onBeforeUnmount(() => {
  active = false
})

async function renderDiagram(): Promise<void> {
  if (!active) return
  error.value = ''
  try {
    const mermaid = (await import('mermaid')).default
    if (!active) return
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: isDark.value ? 'dark' : 'neutral',
      fontFamily: 'Segoe UI, PingFang SC, Microsoft YaHei, sans-serif'
    })
    const id = `roadbookMermaid${Date.now()}${Math.floor(Math.random() * 1000)}`
    const rendered = await mermaid.render(id, source)
    if (!active) return
    svg.value = rendered.svg
  } catch (caught) {
    if (!active) return
    console.warn('render mermaid failed', caught)
    error.value = caught instanceof Error ? caught.message : '图表渲染失败'
    svg.value = ''
  }
}
</script>

<template>
  <figure class="mermaid-host" aria-label="流程图" :data-state="error ? 'error' : svg ? 'ready' : 'pending'">
    <p v-if="error" role="alert">图表没有渲染出来：{{ error }}</p>
    <div v-else-if="svg" v-html="svg"></div>
    <details v-if="error">
      <summary>图表源码</summary>
      <pre><code>{{ source }}</code></pre>
    </details>
  </figure>
</template>
