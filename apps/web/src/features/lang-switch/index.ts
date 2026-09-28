/**
 * lang-switch · Public API（docs/01 §6）
 *
 * 页面/组件只从这里导入；slice 内部路径（`model/*` / `ui/*`）禁止穿透引用。
 */
export { default as LangSwitch } from './ui/LangSwitch.vue'
export { useLangStore } from './model/lang.store'
