<script setup lang="ts">
import { computed, onMounted } from 'vue'

import { levelLabel, statusLabel } from '@content/labels'
import type { Topic } from '@content/schema'

import { ensureProgressLoaded, progressState, resetTopic, setTopicLearned } from '../progress-store'

const props = defineProps<{ topic: Topic }>()

onMounted(() => {
  ensureProgressLoaded()
})

const learned = computed(() => Boolean(progressState.value.topics[props.topic.id]?.learned))
</script>

<template>
  <div class="topic-meta">
    <span class="badge" :data-status="topic.status">{{ statusLabel[topic.status] }}</span>
    <span class="badge">{{ levelLabel[topic.level] }}</span>
    <span class="badge">约 {{ topic.estimatedMinutes }} 分钟</span>
    <span class="badge">更新于 {{ topic.updatedAt }}</span>
    <button class="rb-button" type="button" @click="setTopicLearned(topic.id, !learned)">
      {{ learned ? '取消已学' : '标记为已学' }}
    </button>
    <button class="rb-button" type="button" @click="resetTopic(topic.id)">清除本节记录</button>
  </div>
</template>
