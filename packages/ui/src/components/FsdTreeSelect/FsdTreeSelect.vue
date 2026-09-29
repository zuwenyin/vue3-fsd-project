<script setup lang="ts">
import { computed } from 'vue'
import { ElTreeSelect } from 'element-plus'
import 'element-plus/es/components/tree-select/style/css'
import type { FsdSize } from '../../types'

defineOptions({ name: 'FsdTreeSelect' })

const DEFAULT_MAPPING = { value: 'id', label: 'title', children: 'children' }

const fsProps = defineProps<{
  modelValue?: string | number | null
  data: Record<string, unknown>[]
  /** 字段映射，默认 { value: 'id', label: 'title', children: 'children' }（菜单树直接可用） */
  props?: { value: string; label: string; children: string }
  clearable?: boolean
  filterable?: boolean
  checkStrictly?: boolean
  placeholder?: string
  /** 不传时继承 ElConfigProvider.size（P12 紧凑度联动） */
  size?: FsdSize
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  change: [value: string | number | null]
}>()

const mapping = computed(() => fsProps.props ?? DEFAULT_MAPPING)

function onChange(value: string | number | null): void {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <ElTreeSelect
    :model-value="modelValue"
    :data="data"
    :props="mapping"
    :clearable="clearable"
    :filterable="filterable"
    :check-strictly="checkStrictly"
    :placeholder="placeholder"
    :size="size"
    @change="onChange"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
