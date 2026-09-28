import { usePreferredDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { applyDarkMode, applyPrimaryColor } from '../lib/apply-theme'
import { readThemePreference } from '../lib/init-theme'
import { DEFAULT_PRIMARY, DEFAULT_THEME_MODE } from './constants'
import type { ThemeMode } from './types'

/**
 * 主题偏好（docs/04 §6）：唯一持有 `mode` / `primary`，持久化到 `fsd:theme`。
 * 状态变化 → 写令牌（inline style）+ 持久化；`auto` 模式跟随系统偏好变化。
 */
export const useThemeStore = defineStore('theme', () => {
  const saved = readThemePreference()
  const mode = ref<ThemeMode>(saved.mode)
  const primary = ref(saved.primary)
  const prefersDark = usePreferredDark()

  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'auto' && prefersDark.value),
  )

  watch(
    [mode, primary, prefersDark],
    () => {
      applyDarkMode(mode.value)
      applyPrimaryColor(primary.value)
      storage.set(THEME_KEY, { mode: mode.value, primary: primary.value })
    },
    // 主题切换需**同步**生效（用户点击即改样式，避免下一帧闪烁）；
    // 默认的 pre-flush 会让 setMode 之后的同步断言/读取拿不到新值
    { immediate: true, flush: 'sync' },
  )

  function setMode(next: ThemeMode): void {
    mode.value = next
  }

  function setPrimary(next: string): void {
    if (!next) return
    primary.value = next
  }

  function resetTheme(): void {
    mode.value = DEFAULT_THEME_MODE
    primary.value = DEFAULT_PRIMARY
  }

  return { mode, primary, isDark, setMode, setPrimary, resetTheme }
})
