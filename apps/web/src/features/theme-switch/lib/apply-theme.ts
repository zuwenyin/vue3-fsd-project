import { generatePrimaryShades, type ShadeKey } from '@repo/utils'
import { DARK_MEDIA_QUERY, DENSITY_SCALE, RADIUS_SCALE, SPACE_TOKENS } from '../model/constants'
import type { ColorMode, DensityLevel, RadiusLevel, ThemeMode } from '../model/types'

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

/**
 * 圆角档位（P11，docs/04 §1 扩展位）：写自有组件令牌与 EP 圆角变量（inline style 覆盖 SCSS 基线）。
 */
export function applyRadius(level: RadiusLevel): void {
  const scale = RADIUS_SCALE[level]
  const root = HTML.style
  root.setProperty('--fsd-radius-sm', `${scale.sm}px`)
  root.setProperty('--fsd-radius-md', `${scale.md}px`)
  root.setProperty('--fsd-radius-lg', `${scale.lg}px`)
  root.setProperty('--el-border-radius-base', `${scale.elBase}px`)
  root.setProperty('--el-border-radius-small', `${scale.elSmall}px`)
}

/**
 * 紧凑度（P11）：缩放间距令牌 `--fsd-space-*`。
 * EP 组件的尺寸档由 `ElConfigProvider :size` 联动（`App.vue`）。
 */
export function applyDensity(level: DensityLevel): void {
  const root = HTML.style
  DENSITY_SCALE[level].space.forEach((value, index) => {
    const token = SPACE_TOKENS[index]
    if (token) root.setProperty(token, `${value}px`)
  })
}

/**
 * 灰阶 / 色弱辅助（P11）：`html` 挂 class，由全局样式（`app/styles/index.scss`）定义 filter。
 * ⚠️ 为**近似辅助**（非医学级矫正）；filter 作用于 `html`，teleport 到 body 的弹层同样生效。
 */
export function applyColorMode(mode: ColorMode): void {
  HTML.classList.toggle('fsd-grayscale', mode === 'grayscale')
  HTML.classList.toggle('fsd-color-weak', mode === 'weak')
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
