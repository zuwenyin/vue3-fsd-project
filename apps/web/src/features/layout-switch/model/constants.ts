import type { LayoutMode } from '@/entities/menu'

/** 四种布局模式（docs/15 §2.4） */
export const LAYOUT_MODES: LayoutMode[] = ['sidebar', 'top', 'mix', 'dual']

export const LAYOUT_OPTIONS: Array<{ label: string; value: LayoutMode }> = [
  { label: '侧边栏', value: 'sidebar' },
  { label: '顶部栏', value: 'top' },
  { label: '混合', value: 'mix' },
  { label: '双栏', value: 'dual' },
]

/** 小屏断点：< 960px 全部模式强制抽屉式侧边栏（docs/15 §2.5） */
export const LAYOUT_MOBILE_BREAKPOINT = 960

export function isLayoutMode(value: unknown): value is LayoutMode {
  return typeof value === 'string' && (LAYOUT_MODES as string[]).includes(value)
}
