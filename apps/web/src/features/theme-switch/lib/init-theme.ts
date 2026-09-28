import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { DEFAULT_PRIMARY, DEFAULT_THEME_MODE, isThemeMode } from '../model/constants'
import { applyDarkMode, applyPrimaryColor } from './apply-theme'
import type { ThemePreference } from '../model/types'

/** 读偏好：键缺失 / 损坏 / 枚举非法一律回落默认值（决策 D1） */
export function readThemePreference(): ThemePreference {
  const saved = storage.get<Partial<ThemePreference>>(THEME_KEY)
  return {
    mode: isThemeMode(saved?.mode) ? saved.mode : DEFAULT_THEME_MODE,
    primary:
      typeof saved?.primary === 'string' && saved.primary.trim() ? saved.primary : DEFAULT_PRIMARY,
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
  return preference
}
