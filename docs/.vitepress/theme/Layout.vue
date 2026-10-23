<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { topics } from 'virtual:topics'

import ContinueLearning from './components/ContinueLearning.vue'
import TopicMeta from './components/TopicMeta.vue'
import { progressState } from './progress-store'
import { applySidebarProgress } from './sidebar-progress'

const { frontmatter } = useData()
const route = useRoute()
const topic = computed(() => topics.find((item) => item.id === frontmatter.value.id))

async function syncSidebar(): Promise<void> {
  await nextTick()
  applySidebarProgress(document, topics, progressState.value)
}

onMounted(() => {
  watch(
    [() => route.path, progressState],
    () => {
      void syncSidebar()
    },
    { deep: true, immediate: true }
  )
})

const Layout = DefaultTheme.Layout
</script>

<template>
  <Layout>
    <template #doc-before>
      <TopicMeta v-if="topic" :topic="topic" />
    </template>
    <template #doc-footer-before>
      <ContinueLearning v-if="topic" :topic="topic" />
    </template>
  </Layout>
</template>
