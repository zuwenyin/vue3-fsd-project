<script setup lang="ts">
import { ElInput } from 'element-plus'
import 'element-plus/es/components/input/style/css'
import type { FsdSize } from '../../types'

defineOptions({ name: 'FsdInput' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: 'text' | 'password' | 'textarea' | 'number'
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    showPassword?: boolean
    maxlength?: string | number
    prefixIcon?: string
    suffixIcon?: string
    size?: FsdSize
    rows?: number
  }>(),
  { clearable: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
  input: [value: string | number]
  clear: []
}>()

function onUpdateModelValue(value: string | number): void {
  emit('update:modelValue', value)
}

function onChange(value: string | number): void {
  emit('change', value)
}

function onInput(value: string | number): void {
  emit('input', value)
}
</script>

<template>
  <ElInput
    :model-value="props.modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :clearable="clearable"
    :show-password="showPassword"
    :maxlength="maxlength"
    :prefix-icon="prefixIcon"
    :suffix-icon="suffixIcon"
    :size="size"
    :rows="rows"
    @update:model-value="onUpdateModelValue"
    @change="onChange"
    @input="onInput"
    @clear="emit('clear')"
  />
</template>
