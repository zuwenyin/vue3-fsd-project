/**
 * theme-switch · Public API（docs/15 §4.1）
 *
 * 页面/组件只从这里导入；slice 内部路径（`model/*` / `lib/*` / `ui/*`）禁止穿透引用。
 */
export { default as ThemeSwitch } from './ui/ThemeSwitch.vue'
export { default as ColorPickerPanel } from './ui/ColorPickerPanel.vue'
export { useThemeStore } from './model/theme.store'
export { initTheme, readThemePreference } from './lib/init-theme'
export { applyDarkMode, applyPrimaryColor, prefersDark, resolveIsDark } from './lib/apply-theme'
export {
  DEFAULT_PRIMARY,
  DEFAULT_THEME_MODE,
  PRIMARY_PRESETS,
  THEME_MODES,
  isThemeMode,
} from './model/constants'
export type { ThemeMode, ThemePreference } from './model/types'
