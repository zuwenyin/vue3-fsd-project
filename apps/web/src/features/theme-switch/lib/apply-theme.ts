import { generatePrimaryShades, type ShadeKey } from '@repo/utils'
import { DARK_MEDIA_QUERY } from '../model/constants'
import type { ThemeMode } from '../model/types'

const HTML = document.documentElement

/** 与 Element Plus 主色梯度一一对应的色阶键（docs/04 §4） */
const SHADE_KEYS: ShadeKey[] = ['light-3', 'light-5', 'light-7', 'light-8', 'light-9', 'dark-2']

export function prefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_MEDIA_QUERY).matches
}

/** 是否应处于暗色（auto 看系统偏好） */
export function resolveIsDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'auto' && prefersDark())
}

/**
 * 明暗切换只改令牌层（docs/04 §3）：给 `html` 挂 `dark` 类，
 * EP 的 `--el-*` 暗色值由 `element-plus/theme-chalk/dark/css-vars.css` 提供。
 */
export function applyDarkMode(mode: ThemeMode): boolean {
  const isDark = resolveIsDark(mode)
  HTML.classList.toggle('dark', isDark)
  return isDark
}

/**
 * 品牌色（docs/04 §4 / docs/15 §4.3）：以 inline style 同时覆写
 * `--el-color-primary*`（EP 组件）与 `--fsd-color-primary*`（自有组件，只有 3 个梯度）。
 */
export function applyPrimaryColor(hex: string): void {
  const shades = generatePrimaryShades(hex)
  const root = HTML.style
  root.setProperty('--el-color-primary', hex)
  root.setProperty('--fsd-color-primary', hex)
  for (const key of SHADE_KEYS) {
    root.setProperty(`--el-color-primary-${key}`, shades[key])
  }
  root.setProperty('--fsd-color-primary-light-3', shades['light-3'])
  root.setProperty('--fsd-color-primary-dark-2', shades['dark-2'])
}

/** 测试与调试用：清掉运行时写入的品牌色变量（回落到 SCSS 基线） */
export function clearPrimaryColorVars(): void {
  const root = HTML.style
  root.removeProperty('--el-color-primary')
  root.removeProperty('--fsd-color-primary')
  for (const key of SHADE_KEYS) root.removeProperty(`--el-color-primary-${key}`)
  root.removeProperty('--fsd-color-primary-light-3')
  root.removeProperty('--fsd-color-primary-dark-2')
}
