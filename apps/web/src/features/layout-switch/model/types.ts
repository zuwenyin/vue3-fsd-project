import type { LayoutMode } from '@/entities/menu'

/** 持久化到 `fsd:layout` 的布局偏好（决策 D1，键见 shared/config/storage-keys.ts） */
export interface LayoutPreference {
  mode: LayoutMode
  /** 侧边栏折叠（sidebar / mix 生效） */
  collapsed: boolean
}
