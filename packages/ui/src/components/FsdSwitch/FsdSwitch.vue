<script setup lang="ts">
import { ElSwitch } from 'element-plus'
import 'element-plus/es/components/switch/style/css'

defineOptions({ name: 'FsdSwitch' })

const props = defineProps<{
  modelValue: boolean
  activeText?: string
  inactiveText?: string
  disabled?: boolean
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
    @change="onChange"
  />
</template>
