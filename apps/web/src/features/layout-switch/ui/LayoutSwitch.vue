<script setup lang="ts">
import { FsdSelect } from '@repo/ui'
import type { LayoutMode } from '@/entities/menu'
import { LAYOUT_OPTIONS, isLayoutMode } from '../model/constants'
import { useLayoutStore } from '../model/layout.store'

defineOptions({ name: 'LayoutSwitch' })

const layout = useLayoutStore()

/** FsdSelect 的值域是 string | number | ...，这里收窄回 LayoutMode */
function onUpdate(value: string | number | Array<string | number> | null): void {
  if (isLayoutMode(value)) layout.setMode(value as LayoutMode)
}
</script>

<template>
  <FsdSelect
    class="layout-switch"
    :model-value="layout.mode"
    :options="LAYOUT_OPTIONS"
    :clearable="false"
    placeholder="布局"
    @update:model-value="onUpdate"
  />
</template>

<style scoped lang="scss">
.layout-switch {
  width: 104px;
}
</style>
