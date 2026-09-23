<script setup lang="ts">
import { ElButton } from 'element-plus'
import { FsdIcon } from '../FsdIcon'
import type { FsdButtonType, FsdSize } from '../../types'

defineOptions({ name: 'FsdButton' })

const props = withDefaults(
  defineProps<{
    type?: FsdButtonType
    size?: FsdSize
    loading?: boolean
    disabled?: boolean
    icon?: string
    text?: boolean
    link?: boolean
  }>(),
  { type: 'default', size: 'default' },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <ElButton v-bind="props" @click="emit('click', $event)">
    <template v-if="icon || $slots.icon" #icon>
      <slot name="icon">
        <FsdIcon :name="icon" />
      </slot>
    </template>
    <slot />
  </ElButton>
</template>
