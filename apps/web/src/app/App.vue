<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useLangStore } from '@/features/lang-switch'
import { DENSITY_SCALE, useThemeStore } from '@/features/theme-switch'

const lang = useLangStore()
const theme = useThemeStore()

/** EP 内置文案（分页 / 日期 / 表格空态等）随语言联动（docs/07 P7-2） */
const epLocale = computed(() => (lang.locale === 'en-US' ? en : zhCn))

/** 紧凑度联动 EP 组件尺寸（P11，docs/04 §1 扩展位）：间距由 --fsd-space-* 缩放，尺寸走 size */
const epSize = computed(() => DENSITY_SCALE[theme.density].epSize)
</script>

<template>
  <ElConfigProvider :locale="epLocale" :size="epSize">
    <router-view />
  </ElConfigProvider>
</template>
