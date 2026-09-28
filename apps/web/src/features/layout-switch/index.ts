/**
 * layout-switch · Public API（docs/15 §2.1）
 *
 * 页面/组件只从这里导入；slice 内部路径（`model/*` / `ui/*`）禁止穿透引用。
 */
export { default as LayoutSwitch } from './ui/LayoutSwitch.vue'
export { useLayoutStore } from './model/layout.store'
export {
  LAYOUT_MODES,
  LAYOUT_OPTIONS,
  LAYOUT_MOBILE_BREAKPOINT,
  isLayoutMode,
} from './model/constants'
export type { LayoutPreference } from './model/types'
