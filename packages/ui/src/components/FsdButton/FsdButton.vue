<script setup lang="ts">
import { ElButton } from 'element-plus'
import 'element-plus/es/components/button/style/css'
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
    plain?: boolean
  }>(),
  // ★ 不设 size 默认值（P12）：undefined 时 EP 的 useSize 回落 ElConfigProvider.size，
  //   使「紧凑度」档位能整体缩放组件；显式传 size 的调用点不受影响（默认档与旧行为一致）
  { type: 'default' },
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
