<script setup lang="ts">
import { ref } from 'vue'
import { ElForm, type FormInstance, type FormRules } from 'element-plus'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'

defineOptions({ name: 'FsdForm' })

const props = withDefaults(
  defineProps<{
    model: Record<string, unknown>
    rules?: FormRules
    labelWidth?: string
    labelPosition?: 'left' | 'right' | 'top'
    disabled?: boolean
  }>(),
  { labelPosition: 'right' },
)

const formRef = ref<FormInstance | null>(null)

async function validate(): Promise<boolean> {
  try {
    return (await formRef.value?.validate()) ?? false
  } catch {
    return false
  }
}

function resetFields(): void {
  formRef.value?.resetFields()
}

function clearValidate(): void {
  formRef.value?.clearValidate()
}

defineExpose({ validate, resetFields, clearValidate })
</script>

<template>
  <ElForm
    ref="formRef"
    :model="props.model"
    :rules="rules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :disabled="disabled"
  >
    <slot />
  </ElForm>
</template>
