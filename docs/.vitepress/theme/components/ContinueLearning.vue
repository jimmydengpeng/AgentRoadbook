<script setup lang="ts">
import { computed } from 'vue'
import { topics } from 'virtual:topics'

import type { Topic } from '@content/schema'

import { href } from '../href'

const props = defineProps<{ topic: Topic }>()

const index = computed(() => topics.findIndex((item) => item.id === props.topic.id))
const previous = computed(() => (index.value > 0 ? topics[index.value - 1] : undefined))
const next = computed(() => {
  const following = topics[index.value + 1]
  return index.value >= 0 && following ? following : undefined
})

const prerequisites = computed(() => resolveTopics(props.topic.prerequisites))
const related = computed(() => resolveTopics(props.topic.related))

function resolveTopics(ids: string[]): Topic[] {
  return ids.flatMap((id) => {
    const topic = topics.find((item) => item.id === id)
    return topic ? [topic] : []
  })
}
</script>

<template>
  <section class="continue" aria-label="继续学习">
    <h2>继续学习</h2>
    <div class="continue-grid">
      <div>
        <h3>前置知识</h3>
        <ul v-if="prerequisites.length">
          <li v-for="item in prerequisites" :key="item.id">
            <a :href="href(item.link)">{{ item.title }}</a>
          </li>
        </ul>
        <p v-else>这一节没有列出前置知识。</p>
      </div>
      <div>
        <h3>相关知识</h3>
        <ul v-if="related.length">
          <li v-for="item in related" :key="item.id">
            <a :href="href(item.link)">{{ item.title }}</a>
          </li>
        </ul>
        <p v-else>相关章节会在正文写完后补上。</p>
      </div>
      <div>
        <h3>路线中的相邻章节</h3>
        <p v-if="previous">上一节：<a :href="href(previous.link)">{{ previous.title }}</a></p>
        <p v-if="next">下一节：<a :href="href(next.link)">{{ next.title }}</a></p>
        <p v-if="!previous && !next">这是路线的端点。</p>
      </div>
    </div>
  </section>
</template>
