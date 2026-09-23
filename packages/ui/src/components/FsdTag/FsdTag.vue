<script setup lang="ts">
import { ElTag } from 'element-plus'
import type { FsdSize, FsdTagType } from '../../types'

defineOptions({ name: 'FsdTag' })

const props = withDefaults(
  defineProps<{
    type?: FsdTagType
    size?: FsdSize
    effect?: 'dark' | 'light' | 'plain'
    round?: boolean
  }>(),
  { type: 'primary', size: 'default', effect: 'light' },
)
</script>

<template>
  <ElTag v-bind="props">
    <slot />
  </ElTag>
</template>
