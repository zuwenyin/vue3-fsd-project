<script setup lang="ts">
import { ElColorPicker } from 'element-plus'
import type { FsdSize } from '../../types'

defineOptions({ name: 'FsdColorPicker' })

const props = withDefaults(
  defineProps<{
    modelValue: string
    predefine?: string[]
    showAlpha?: boolean
    size?: FsdSize
  }>(),
  { size: 'default', showAlpha: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  'active-change': [value: string]
}>()

function onUpdateModelValue(value: string | null): void {
  emit('update:modelValue', value ?? '')
}

function onChange(value: string | null): void {
  emit('change', value ?? '')
}

function onActiveChange(value: string | null): void {
  emit('active-change', value ?? '')
}
</script>

<template>
  <ElColorPicker
    :model-value="props.modelValue"
    :predefine="predefine"
    :show-alpha="showAlpha"
    :size="size"
    @change="onChange"
    @active-change="onActiveChange"
    @update:model-value="onUpdateModelValue"
  />
</template>
