import { storage } from '@repo/utils'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LayoutMode } from '@/entities/menu'
import { LAYOUT_KEY } from '@/shared/config/storage-keys'
import { isLayoutMode } from './constants'
import type { LayoutPreference } from './types'

const DEFAULT_PREFERENCE: LayoutPreference = { mode: 'sidebar', collapsed: false }

/** 读持久化偏好：键缺失/损坏/枚举非法一律回落默认值（决策 D1，禁止裸 localStorage） */
function readPreference(): LayoutPreference {
  const saved = storage.get<Partial<LayoutPreference>>(LAYOUT_KEY)
  return {
    mode: isLayoutMode(saved?.mode) ? saved.mode : DEFAULT_PREFERENCE.mode,
    collapsed: saved?.collapsed === true,
  }
}

/**
 * 布局偏好（docs/15 §2）：运行时可切换并持久化；切换**不重新注册路由、不刷新页面**。
 * 单页覆盖走 `route.meta.layout`，在 `AppLayout` 内做 `meta.layout ?? mode`（docs/15 §2.2）。
 */
export const useLayoutStore = defineStore('layout', () => {
  const preference = readPreference()
  const mode = ref<LayoutMode>(preference.mode)
  const collapsed = ref(preference.collapsed)

  function persist(): void {
    storage.set(LAYOUT_KEY, { mode: mode.value, collapsed: collapsed.value })
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

  return { mode, collapsed, setMode, setCollapsed, toggleCollapsed }
})
