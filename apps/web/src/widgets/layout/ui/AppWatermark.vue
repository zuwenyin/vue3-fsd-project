<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/entities/user'

defineOptions({ name: 'AppWatermark' })

/**
 * 内容区水印（docs/04 §7.4，P9 落地）：纯 DOM 重复文字层，无第三方依赖。
 * 文案 = 当前用户名 + 日期；层 `pointer-events: none`，可点击穿透、不遮挡交互。
 */
const user = useUserStore()

/** 平铺份数：配合 flex-wrap 铺满内容区（CSS 层面截断溢出） */
const REPEAT = 48

const text = computed(() => `${user.nickname} · ${new Date().toLocaleDateString()}`)
</script>

<template>
  <div class="app-watermark" aria-hidden="true">
    <span v-for="index in REPEAT" :key="index" class="app-watermark__item">{{ text }}</span>
  </div>
</template>

<style scoped lang="scss">
.app-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: var(--fsd-space-xl);
  padding: var(--fsd-space-xl);
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.app-watermark__item {
  color: var(--fsd-color-text-weak);
  font-size: var(--fsd-font-size-base);
  white-space: nowrap;
  opacity: 0.35;
  transform: rotate(-20deg);
}
</style>
