import type { Component } from 'vue'
import type { LayoutMode } from '@/entities/menu'
import DualLayout from '../DualLayout.vue'
import MixLayout from '../MixLayout.vue'
import SidebarLayout from '../SidebarLayout.vue'
import TopLayout from '../TopLayout.vue'

/** 布局模式 → 组件（docs/15 §2.1） */
export const LAYOUT_MAP: Record<LayoutMode, Component> = {
  sidebar: SidebarLayout,
  top: TopLayout,
  mix: MixLayout,
  dual: DualLayout,
}

export function resolveLayout(mode: LayoutMode | undefined): Component {
  if (!mode) return LAYOUT_MAP.sidebar
  return LAYOUT_MAP[mode] ?? LAYOUT_MAP.sidebar
}
