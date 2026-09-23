<script setup lang="ts">
import { computed } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
import type { FsdOption } from '../../types'

export type FsdSelectValue = string | number | Array<string | number> | null

defineOptions({ name: 'FsdSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: FsdSelectValue
    options?: FsdOption[] | string[]
    multiple?: boolean
    filterable?: boolean
    allowCreate?: boolean
    clearable?: boolean
    placeholder?: string
    disabled?: boolean
  }>(),
  { clearable: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: FsdSelectValue]
  change: [value: FsdSelectValue]
}>()

const normalizedOptions = computed<FsdOption[]>(() =>
  (props.options ?? []).map((item) =>
    typeof item === 'string' ? { label: item, value: item } : item,
  ),
)

function onChange(value: FsdSelectValue): void {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :multiple="multiple"
    :filterable="filterable"
    :allow-create="allowCreate"
    :clearable="clearable"
    :placeholder="placeholder"
    :disabled="disabled"
    @change="onChange"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="option in normalizedOptions"
      :key="String(option.value)"
      :label="option.label"
      :value="option.value"
      :disabled="option.disabled"
    />
  </ElSelect>
</template>
