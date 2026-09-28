import { storage } from '@repo/utils'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LayoutMode } from '@/entities/menu'
import { LAYOUT_KEY } from '@/shared/config/storage-keys'
import { isLayoutMode } from './constants'
import type { LayoutPreference } from './types'

const DEFAULT_PREFERENCE: LayoutPreference = {
  mode: 'sidebar',
  collapsed: false,
  breadcrumb: true,
  watermark: false,
  pageTransition: true,
}

/**
 * 读持久化偏好：**逐字段回落**（决策 D1）。
 * P9 前只存 `{ mode, collapsed }`，缺的新字段在此取默认 —— 旧值可直接加载（docs/07 P9 验收项）。
 */
function readPreference(): LayoutPreference {
  const saved = storage.get<Partial<LayoutPreference>>(LAYOUT_KEY)
  return {
    mode: isLayoutMode(saved?.mode) ? saved.mode : DEFAULT_PREFERENCE.mode,
    collapsed: saved?.collapsed === true,
    breadcrumb: saved?.breadcrumb !== false,
    watermark: saved?.watermark === true,
    pageTransition: saved?.pageTransition !== false,
  }
}

/**
 * 布局偏好（docs/15 §2）：运行时可切换并持久化；切换**不重新注册路由、不刷新页面**。
 * 单页覆盖走 `route.meta.layout`，在 `AppLayout` 内做 `meta.layout ?? mode`（docs/15 §2.2）。
 * P9 增 `breadcrumb` / `watermark` / `pageTransition` 三项（docs/04 §7.4）。
 */
export const useLayoutStore = defineStore('layout', () => {
  const preference = readPreference()
  const mode = ref<LayoutMode>(preference.mode)
  const collapsed = ref(preference.collapsed)
  const breadcrumb = ref(preference.breadcrumb)
  const watermark = ref(preference.watermark)
  const pageTransition = ref(preference.pageTransition)

  function persist(): void {
    storage.set(LAYOUT_KEY, {
      mode: mode.value,
      collapsed: collapsed.value,
      breadcrumb: breadcrumb.value,
      watermark: watermark.value,
      pageTransition: pageTransition.value,
    } satisfies LayoutPreference)
  }

  function setMode(next: LayoutMode): void {
    if (mode.value === next) return
    mode.value = next
    persist()
  }

  function setCollapsed(next: boolean): void {
    if (collapsed.value === next) return
    collapsed.value = next
    persist()
  }

  function toggleCollapsed(): void {
    setCollapsed(!collapsed.value)
  }

  function setBreadcrumb(next: boolean): void {
    if (breadcrumb.value === next) return
    breadcrumb.value = next
    persist()
  }

  function setWatermark(next: boolean): void {
    if (watermark.value === next) return
    watermark.value = next
    persist()
  }

  function setPageTransition(next: boolean): void {
    if (pageTransition.value === next) return
    pageTransition.value = next
    persist()
  }

  return {
    mode,
    collapsed,
    breadcrumb,
    watermark,
    pageTransition,
    setMode,
    setCollapsed,
    toggleCollapsed,
    setBreadcrumb,
    setWatermark,
    setPageTransition,
  }
})
