<script setup lang="ts">
import { ElFormItem } from 'element-plus'
import 'element-plus/es/components/form-item/style/css'

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
