import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import {
  DEFAULT_COLOR_MODE,
  DEFAULT_DENSITY,
  DEFAULT_PRIMARY,
  DEFAULT_RADIUS,
  DEFAULT_THEME_MODE,
  isColorMode,
  isDensityLevel,
  isRadiusLevel,
  isThemeMode,
} from '../model/constants'
import {
  applyColorMode,
  applyDarkMode,
  applyDensity,
  applyPrimaryColor,
  applyRadius,
} from './apply-theme'
import type { ThemePreference } from '../model/types'

/**
 * 读偏好：键缺失 / 损坏 / 枚举非法**逐字段**回落默认值（决策 D1）。
 * P11 新增的 `radius` / `density` / `colorMode` 历史值里没有 → 取默认，旧数据可直接加载。
 */
export function readThemePreference(): ThemePreference {
  const saved = storage.get<Partial<ThemePreference>>(THEME_KEY)
  return {
    mode: isThemeMode(saved?.mode) ? saved.mode : DEFAULT_THEME_MODE,
    primary:
      typeof saved?.primary === 'string' && saved.primary.trim() ? saved.primary : DEFAULT_PRIMARY,
    radius: isRadiusLevel(saved?.radius) ? saved.radius : DEFAULT_RADIUS,
    density: isDensityLevel(saved?.density) ? saved.density : DEFAULT_DENSITY,
    colorMode: isColorMode(saved?.colorMode) ? saved.colorMode : DEFAULT_COLOR_MODE,
  }
}

/**
 * 首屏防闪烁（docs/04 §5）：`main.ts` 最顶部、`mount()` 之前调用。
 * 只依赖 storage 与 DOM，不依赖 pinia（store 初始化时读同样的偏好，状态天然一致）。
 */
export function initTheme(): ThemePreference {
  const preference = readThemePreference()
  applyDarkMode(preference.mode)
  applyPrimaryColor(preference.primary)
  applyRadius(preference.radius)
  applyDensity(preference.density)
  applyColorMode(preference.colorMode)
  return preference
}
