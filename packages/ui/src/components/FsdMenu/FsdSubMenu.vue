<script setup lang="ts">
import { ElSubMenu } from 'element-plus'
import 'element-plus/es/components/sub-menu/style/css'

defineOptions({ name: 'FsdSubMenu' })

defineProps<{
  index: string
  popperClass?: string
}>()
</script>

<template>
  <ElSubMenu :index="index" :popper-class="popperClass">
    <template #title>
      <slot name="title" />
    </template>
    <slot />
  </ElSubMenu>
</template>
