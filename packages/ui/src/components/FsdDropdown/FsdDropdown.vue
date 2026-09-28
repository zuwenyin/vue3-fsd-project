<script setup lang="ts">
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
// dropdown 的按需样式已包含 tooltip / popper / scrollbar
import 'element-plus/es/components/dropdown/style/css'
import { FsdIcon } from '../FsdIcon'
import type { FsdDropdownItem } from '../../types'

defineOptions({ name: 'FsdDropdown' })

withDefaults(
  defineProps<{
    /** 下拉项；`default` 插槽为触发器内容 */
    items?: FsdDropdownItem[]
    trigger?: 'hover' | 'click' | 'contextmenu'
    placement?: 'bottom' | 'bottom-start' | 'bottom-end'
    disabled?: boolean
  }>(),
  { items: () => [], trigger: 'click', placement: 'bottom' },
)

const emit = defineEmits<{ select: [value: string] }>()

function onCommand(value: string | number | object): void {
  emit('select', String(value))
}
</script>

<template>
  <ElDropdown :trigger="trigger" :placement="placement" :disabled="disabled" @command="onCommand">
    <span class="fsd-dropdown__trigger">
      <slot />
    </span>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-for="item in items"
          :key="item.value"
          :command="item.value"
          :divided="item.divided"
          :disabled="item.disabled"
        >
          <FsdIcon v-if="item.icon" :name="item.icon" :size="14" />
          {{ item.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped lang="scss">
.fsd-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--fsd-space-xs);
  cursor: pointer;
}
</style>
