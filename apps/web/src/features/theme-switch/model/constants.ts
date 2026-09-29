import type { ColorMode, DensityLevel, RadiusLevel, ThemeMode } from './types'

/** 默认明暗模式（docs/04 §6） */
export const DEFAULT_THEME_MODE: ThemeMode = 'light'

/**
 * 默认品牌色：与 `app/styles/tokens/_brand.scss` 的 `--fsd-color-primary` 基线保持一致
 * （docs/15 §4.2）。预设色板首项即此值，避免「默认值不在预设里」。
 */
export const DEFAULT_PRIMARY = '#2f6fed'

/** 默认圆角 / 紧凑度 / 显示模式（P11 扩展位） */
export const DEFAULT_RADIUS: RadiusLevel = 'md'
export const DEFAULT_DENSITY: DensityLevel = 'default'
export const DEFAULT_COLOR_MODE: ColorMode = 'none'

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

/**
 * 圆角档位 → 像素值（P11，docs/04 §1 扩展位）：
 * 同时写自有组件令牌 `--fsd-radius-*` 与 EP 的 `--el-border-radius-*`，
 * 基线值见 `app/styles/tokens/_light.scss`（md 档与基线一致）。
 */
export const RADIUS_SCALE: Record<
  RadiusLevel,
  { sm: number; md: number; lg: number; elBase: number; elSmall: number }
> = {
  none: { sm: 0, md: 0, lg: 0, elBase: 0, elSmall: 0 },
  sm: { sm: 2, md: 4, lg: 6, elBase: 2, elSmall: 2 },
  md: { sm: 4, md: 8, lg: 12, elBase: 4, elSmall: 2 },
  lg: { sm: 6, md: 12, lg: 16, elBase: 8, elSmall: 4 },
}

/**
 * 紧凑度档位 → 间距缩放 + EP 组件尺寸（P11）：
 * `default` 的 `space` 与 `_light.scss` 基线一致（4/8/12/16/24）。
 */
export const DENSITY_SCALE: Record<
  DensityLevel,
  { space: [number, number, number, number, number]; epSize: 'small' | 'default' | 'large' }
> = {
  compact: { space: [2, 6, 8, 12, 16], epSize: 'small' },
  default: { space: [4, 8, 12, 16, 24], epSize: 'default' },
  comfortable: { space: [6, 12, 16, 20, 28], epSize: 'large' },
}

/** 间距令牌写入顺序（与 DENSITY_SCALE.space 对应） */
export const SPACE_TOKENS = [
  '--fsd-space-xs',
  '--fsd-space-sm',
  '--fsd-space-md',
  '--fsd-space-lg',
  '--fsd-space-xl',
] as const

/** UI 选项（label 走 i18n，value 为档位） */
export const RADIUS_OPTIONS: RadiusLevel[] = ['none', 'sm', 'md', 'lg']
export const DENSITY_OPTIONS: DensityLevel[] = ['compact', 'default', 'comfortable']
export const COLOR_MODE_OPTIONS: ColorMode[] = ['none', 'grayscale', 'weak']

/** `auto` 模式监听该媒体查询（docs/04 §3） */
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto'
}

export function isRadiusLevel(value: unknown): value is RadiusLevel {
  return typeof value === 'string' && (RADIUS_OPTIONS as string[]).includes(value)
}

export function isDensityLevel(value: unknown): value is DensityLevel {
  return typeof value === 'string' && (DENSITY_OPTIONS as string[]).includes(value)
}

export function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && (COLOR_MODE_OPTIONS as string[]).includes(value)
}
