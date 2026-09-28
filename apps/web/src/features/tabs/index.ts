/**
 * tabs · Public API（docs/15 §3.1）
 *
 * 页面/组件只从这里导入；`ContextMenu` 由 `widgets/layout/ui/AppTabs.vue` 消费，
 * 因此一并从 Public API 暴露（widgets 不可穿透 `features/*\/ui/*`）。
 */
export { useTabsStore } from './model/tabs.store'
export { HOME_ROUTE_NAME, MAX_CACHE } from './model/constants'
export { default as TabContextMenu } from './ui/ContextMenu.vue'
export type { TabContextAction, TabView } from './model/types'
