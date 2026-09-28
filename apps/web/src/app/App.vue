<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useLangStore } from '@/features/lang-switch'

const lang = useLangStore()

/** EP 内置文案（分页 / 日期 / 表格空态等）随语言联动（docs/07 P7-2） */
const epLocale = computed(() => (lang.locale === 'en-US' ? en : zhCn))
</script>

<template>
  <ElConfigProvider :locale="epLocale">
    <router-view />
  </ElConfigProvider>
</template>
