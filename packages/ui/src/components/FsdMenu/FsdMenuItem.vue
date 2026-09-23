<script setup lang="ts">
import { ElMenuItem } from 'element-plus'
import { FsdIcon } from '../FsdIcon'

defineOptions({ name: 'FsdMenuItem' })

defineProps<{
  index: string
  disabled?: boolean
  icon?: string
}>()

const emit = defineEmits<{ click: [index: string] }>()
</script>

<template>
  <ElMenuItem :index="index" :disabled="disabled" @click="emit('click', index)">
    <FsdIcon v-if="icon" :name="icon" />
    <template #title>
      <slot />
    </template>
  </ElMenuItem>
</template>
