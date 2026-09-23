<script setup lang="ts">
import { ElMenu } from 'element-plus'

defineOptions({ name: 'FsdMenu' })

const props = withDefaults(
  defineProps<{
    mode?: 'vertical' | 'horizontal'
    defaultActive?: string
    collapse?: boolean
    uniqueOpened?: boolean
    backgroundColor?: string
    textColor?: string
    activeTextColor?: string
  }>(),
  { mode: 'vertical' },
)
</script>

<template>
  <ElMenu v-bind="props">
    <slot />
  </ElMenu>
</template>
