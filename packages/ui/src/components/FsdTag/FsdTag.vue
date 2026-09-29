<script setup lang="ts">
import { ElTag } from 'element-plus'
import 'element-plus/es/components/tag/style/css'
import type { FsdSize, FsdTagType } from '../../types'

defineOptions({ name: 'FsdTag' })

const props = withDefaults(
  defineProps<{
    type?: FsdTagType
    size?: FsdSize
    effect?: 'dark' | 'light' | 'plain'
    round?: boolean
  }>(),
  // ★ 不设 size 默认值（P12）：undefined 时 EP 回落 ElConfigProvider.size（紧凑度联动）
  { type: 'primary', effect: 'light' },
)
</script>

<template>
  <ElTag v-bind="props">
    <slot />
  </ElTag>
</template>
