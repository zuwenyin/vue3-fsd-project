<script setup lang="ts">
import { computed } from 'vue'
import { FsdIcon, FsdSelect } from '@repo/ui'
import { ICON_OPTIONS } from '../model/constants'

defineOptions({ name: 'MenuIconPicker' })

const props = defineProps<{
  modelValue?: string
  /** 默认取 constants 的图标子集，可传入覆盖 */
  options?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const options = computed(() => props.options ?? [...ICON_OPTIONS])

function onUpdate(value: string | number | Array<string | number> | null): void {
  emit('update:modelValue', value == null ? undefined : String(value))
}
</script>

<template>
  <div class="menu-icon-picker">
    <FsdSelect
      class="menu-icon-picker__select"
      :model-value="modelValue"
      :options="options"
      filterable
      clearable
      placeholder="选择图标"
      @update:model-value="onUpdate"
    />
    <span class="menu-icon-picker__preview">
      <FsdIcon :name="modelValue" :size="18" />
    </span>
  </div>
</template>

<style scoped lang="scss">
.menu-icon-picker {
  display: flex;
  align-items: center;
  gap: var(--fsd-space-sm);
}

.menu-icon-picker__select {
  flex: 1;
}

.menu-icon-picker__preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--fsd-color-text-secondary);
  background: var(--fsd-color-bg-sub);
  border-radius: var(--fsd-radius-sm);
}
</style>
