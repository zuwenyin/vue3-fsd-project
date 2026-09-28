import type { LayoutMode } from '@/entities/menu'

/** 持久化到 `fsd:layout` 的布局偏好（决策 D1，键见 shared/config/storage-keys.ts） */
export interface LayoutPreference {
  mode: LayoutMode
  /** 侧边栏折叠（sidebar / mix 生效） */
  collapsed: boolean
  /** 顶栏面包屑显隐（docs/04 §7.4，P9 落地） */
  breadcrumb: boolean
  /** 内容区水印开关（docs/04 §7.4，P9 落地） */
  watermark: boolean
  /** 路由切换动画开关：true = fade-slide / false = 无动画（docs/04 §7.4，P9 落地） */
  pageTransition: boolean
}
