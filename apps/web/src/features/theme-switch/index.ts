/**
 * theme-switch · Public API（docs/15 §4.1）
 *
 * 页面/组件只从这里导入；slice 内部路径（`model/*` / `lib/*` / `ui/*`）禁止穿透引用。
 */
export { default as ThemeSwitch } from './ui/ThemeSwitch.vue'
export { default as ColorPickerPanel } from './ui/ColorPickerPanel.vue'
export { useThemeStore } from './model/theme.store'
export { initTheme, readThemePreference } from './lib/init-theme'
export {
  applyColorMode,
  applyDarkMode,
  applyDensity,
  applyPrimaryColor,
  applyRadius,
  prefersDark,
  resolveIsDark,
} from './lib/apply-theme'
export {
  COLOR_MODE_OPTIONS,
  DEFAULT_COLOR_MODE,
  DEFAULT_DENSITY,
  DEFAULT_PRIMARY,
  DEFAULT_RADIUS,
  DEFAULT_THEME_MODE,
  DENSITY_OPTIONS,
  DENSITY_SCALE,
  PRIMARY_PRESETS,
  RADIUS_OPTIONS,
  RADIUS_SCALE,
  THEME_MODES,
  isColorMode,
  isDensityLevel,
  isRadiusLevel,
  isThemeMode,
} from './model/constants'
export type {
  ColorMode,
  DensityLevel,
  RadiusLevel,
  ThemeMode,
  ThemePreference,
} from './model/types'
