import type { ThemeMode } from './types'

/** 默认明暗模式（docs/04 §6） */
export const DEFAULT_THEME_MODE: ThemeMode = 'light'

/**
 * 默认品牌色：与 `app/styles/tokens/_brand.scss` 的 `--fsd-color-primary` 基线保持一致
 * （docs/15 §4.2）。预设色板首项即此值，避免「默认值不在预设里」。
 */
export const DEFAULT_PRIMARY = '#2f6fed'

export const THEME_MODES: Array<{ label: string; value: ThemeMode }> = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'auto' },
]

/** 预设色板（docs/04 §4；自定义走 FsdColorPicker） */
export const PRIMARY_PRESETS: Array<{ label: string; value: string }> = [
  { label: '品牌蓝', value: '#2f6fed' },
  { label: '拂晓蓝', value: '#409eff' },
  { label: '极客蓝', value: '#2f54eb' },
  { label: '青翠', value: '#13c2c2' },
  { label: '明青', value: '#36cfc9' },
  { label: '日暮', value: '#faad14' },
  { label: '酱紫', value: '#722ed1' },
  { label: '薄暮', value: '#f5222d' },
  { label: '极光绿', value: '#52c41a' },
]

/** `auto` 模式监听该媒体查询（docs/04 §3） */
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto'
}
