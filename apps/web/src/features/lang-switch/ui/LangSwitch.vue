<script setup lang="ts">
import { computed } from 'vue'
import { FsdDropdown, type FsdDropdownItem } from '@repo/ui'
import { LOCALES, isAppLocale } from '@/shared/i18n'
import { useLangStore } from '../model/lang.store'

defineOptions({ name: 'LangSwitch' })

const lang = useLangStore()

const items = computed<FsdDropdownItem[]>(() =>
  LOCALES.map((item) => ({ label: item.label, value: item.value })),
)

/** 触发按钮上的短标签：中 / EN */
const tag = computed(() => (lang.locale === 'en-US' ? 'EN' : '中'))

function onSelect(value: string): void {
  if (isAppLocale(value)) lang.setLang(value)
}
</script>

<template>
  <FsdDropdown :items="items" @select="onSelect">
    <span class="lang-switch__tag">{{ tag }}</span>
  </FsdDropdown>
</template>

<style scoped lang="scss">
.lang-switch__tag {
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text-secondary);
}
</style>
