import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '@repo/utils'
import { LANG_KEY } from '@/shared/config/storage-keys'
import { isAppLocale, readSavedLocale, setLocale, type AppLocale } from '@/shared/i18n'

/**
 * 语言偏好（docs/07 P7-4）：唯一持有 `locale`，持久化到 `fsd:lang`。
 * 状态变化 → 同步 vue-i18n 的 global locale（组件内 `useI18n().t` 与模板 `$t` 即时响应）。
 */
export const useLangStore = defineStore('lang', () => {
  const locale = ref<AppLocale>(readSavedLocale())

  watch(
    locale,
    (next) => {
      setLocale(next)
      storage.set(LANG_KEY, { locale: next })
    },
    // 同步生效：与 theme.store 同理，避免 next-tick 才切换造成闪烁
    { immediate: true, flush: 'sync' },
  )

  function setLang(next: AppLocale): void {
    if (!isAppLocale(next)) return
    locale.value = next
  }

  return { locale, setLang }
})
