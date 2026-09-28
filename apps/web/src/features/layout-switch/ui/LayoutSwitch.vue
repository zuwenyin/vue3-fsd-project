<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FsdSelect } from '@repo/ui'
import type { LayoutMode } from '@/entities/menu'
import { LAYOUT_OPTIONS, isLayoutMode } from '../model/constants'
import { useLayoutStore } from '../model/layout.store'

defineOptions({ name: 'LayoutSwitch' })

const layout = useLayoutStore()
const { t } = useI18n()

/** label 走 i18n，value 仍来自 constants（options 的值域不随语言变化） */
const options = computed(() =>
  LAYOUT_OPTIONS.map((item) => ({ ...item, label: t(`layout.${item.value}`) })),
)

/** FsdSelect 的值域是 string | number | ...，这里收窄回 LayoutMode */
function onUpdate(value: string | number | Array<string | number> | null): void {
  if (isLayoutMode(value)) layout.setMode(value as LayoutMode)
}
</script>

<template>
  <FsdSelect
    class="layout-switch"
    :model-value="layout.mode"
    :options="options"
    :clearable="false"
    :placeholder="t('layout.label')"
    @update:model-value="onUpdate"
  />
</template>

<style scoped lang="scss">
.layout-switch {
  width: 104px;
}
</style>
