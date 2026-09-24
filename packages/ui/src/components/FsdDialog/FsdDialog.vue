<script setup lang="ts">
import { ElDialog } from 'element-plus'
import 'element-plus/es/components/dialog/style/css'
import { FsdButton } from '../FsdButton'

defineOptions({ name: 'FsdDialog' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: string | number
    appendToBody?: boolean
    closeOnClickModal?: boolean
    confirmText?: string
    cancelText?: string
    confirmLoading?: boolean
    showFooter?: boolean
  }>(),
  {
    width: '520px',
    appendToBody: true,
    closeOnClickModal: false,
    confirmText: '确定',
    cancelText: '取消',
    showFooter: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  closed: []
}>()

function close(): void {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<template>
  <ElDialog
    :model-value="props.modelValue"
    :title="title"
    :width="width"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="emit('closed')"
  >
    <slot />
    <template v-if="showFooter || $slots.footer" #footer>
      <slot name="footer">
        <FsdButton @click="close">{{ cancelText }}</FsdButton>
        <FsdButton type="primary" :loading="confirmLoading" @click="emit('confirm')">
          {{ confirmText }}
        </FsdButton>
      </slot>
    </template>
  </ElDialog>
</template>
