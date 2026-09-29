<script setup lang="ts">
import { ElSwitch } from 'element-plus'
import 'element-plus/es/components/switch/style/css'
import type { FsdSize } from '../../types'

defineOptions({ name: 'FsdSwitch' })

const props = defineProps<{
  modelValue: boolean
  activeText?: string
  inactiveText?: string
  disabled?: boolean
  /** 不传时继承 ElConfigProvider.size（P12 紧凑度联动） */
  size?: FsdSize
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

function onChange(value: string | number | boolean): void {
  const next = Boolean(value)
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <ElSwitch
    :model-value="props.modelValue"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :disabled="disabled"
    :size="size"
    @change="onChange"
  />
</template>
