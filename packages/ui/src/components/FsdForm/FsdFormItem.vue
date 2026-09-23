<script setup lang="ts">
import { ElFormItem } from 'element-plus'

defineOptions({ name: 'FsdFormItem' })

defineProps<{
  label?: string
  prop?: string
  required?: boolean
}>()
</script>

<template>
  <ElFormItem :label="label" :prop="prop" :required="required">
    <slot />
  </ElFormItem>
</template>
