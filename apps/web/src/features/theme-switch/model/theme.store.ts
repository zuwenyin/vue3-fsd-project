import { usePreferredDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import {
  applyColorMode,
  applyDarkMode,
  applyDensity,
  applyPrimaryColor,
  applyRadius,
} from '../lib/apply-theme'
import { readThemePreference } from '../lib/init-theme'
import {
  DEFAULT_COLOR_MODE,
  DEFAULT_DENSITY,
  DEFAULT_PRIMARY,
  DEFAULT_RADIUS,
  DEFAULT_THEME_MODE,
} from './constants'
import type { ColorMode, DensityLevel, RadiusLevel, ThemeMode } from './types'

/**
 * 主题偏好（docs/04 §6）：唯一持有明暗 / 品牌色 / 圆角 / 紧凑度 / 显示模式，持久化到 `fsd:theme`。
 * 状态变化 → 写令牌（inline style / html class）+ 持久化；`auto` 模式跟随系统偏好变化。
 * P11 扩展三项：`radius`（--fsd-radius-*）、`density`（--fsd-space-* + EP size）、`colorMode`（灰阶/色弱）。
 */
export const useThemeStore = defineStore('theme', () => {
  const saved = readThemePreference()
  const mode = ref<ThemeMode>(saved.mode)
  const primary = ref(saved.primary)
  const radius = ref<RadiusLevel>(saved.radius)
  const density = ref<DensityLevel>(saved.density)
  const colorMode = ref<ColorMode>(saved.colorMode)
  const prefersDark = usePreferredDark()

  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'auto' && prefersDark.value),
  )

  watch(
    [mode, primary, radius, density, colorMode, prefersDark],
    () => {
      applyDarkMode(mode.value)
      applyPrimaryColor(primary.value)
      applyRadius(radius.value)
      applyDensity(density.value)
      applyColorMode(colorMode.value)
      storage.set(THEME_KEY, {
        mode: mode.value,
        primary: primary.value,
        radius: radius.value,
        density: density.value,
        colorMode: colorMode.value,
      })
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

  function setRadius(next: RadiusLevel): void {
    radius.value = next
  }

  function setDensity(next: DensityLevel): void {
    density.value = next
  }

  function setColorMode(next: ColorMode): void {
    colorMode.value = next
  }

  function resetTheme(): void {
    mode.value = DEFAULT_THEME_MODE
    primary.value = DEFAULT_PRIMARY
    radius.value = DEFAULT_RADIUS
    density.value = DEFAULT_DENSITY
    colorMode.value = DEFAULT_COLOR_MODE
  }

  return {
    mode,
    primary,
    radius,
    density,
    colorMode,
    isDark,
    setMode,
    setPrimary,
    setRadius,
    setDensity,
    setColorMode,
    resetTheme,
  }
})
