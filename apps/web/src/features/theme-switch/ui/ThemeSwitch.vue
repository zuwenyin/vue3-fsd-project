<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FsdDropdown, FsdIcon, type FsdDropdownItem } from '@repo/ui'
import { THEME_MODES } from '../model/constants'
import { useThemeStore } from '../model/theme.store'

defineOptions({ name: 'ThemeSwitch' })

const emit = defineEmits<{ openCustom: [] }>()

const theme = useThemeStore()
const { t } = useI18n()

const MODE_ICONS: Record<string, string> = { light: 'Sunny', dark: 'Moon', auto: 'Monitor' }

const items = computed<FsdDropdownItem[]>(() => [
  ...THEME_MODES.map((item) => ({
    label: t(`theme.${item.value}`),
    value: item.value,
    icon: MODE_ICONS[item.value],
  })),
  { label: t('theme.customEntry'), value: 'custom', icon: 'Brush', divided: true },
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
  <!-- title 用于提示与端到端定位（外观设置面板入口） -->
  <FsdDropdown :items="items" :title="t('theme.appearance')" @select="onSelect">
    <FsdIcon :name="MODE_ICONS[theme.mode]" :size="16" />
  </FsdDropdown>
</template>
