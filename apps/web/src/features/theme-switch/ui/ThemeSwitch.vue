<script setup lang="ts">
import { computed } from 'vue'
import { FsdDropdown, FsdIcon, type FsdDropdownItem } from '@repo/ui'
import { THEME_MODES } from '../model/constants'
import { useThemeStore } from '../model/theme.store'

defineOptions({ name: 'ThemeSwitch' })

const emit = defineEmits<{ openCustom: [] }>()

const theme = useThemeStore()

const MODE_ICONS: Record<string, string> = { light: 'Sunny', dark: 'Moon', auto: 'Monitor' }

const items = computed<FsdDropdownItem[]>(() => [
  ...THEME_MODES.map((item) => ({
    label: item.label,
    value: item.value,
    icon: MODE_ICONS[item.value],
  })),
  { label: '自定义品牌色…', value: 'custom', icon: 'Brush', divided: true },
])

function onSelect(value: string): void {
  if (value === 'custom') {
    emit('openCustom')
    return
  }
  theme.setMode(value as 'light' | 'dark' | 'auto')
}
</script>

<template>
  <FsdDropdown :items="items" @select="onSelect">
    <FsdIcon :name="MODE_ICONS[theme.mode]" :size="16" />
  </FsdDropdown>
</template>
