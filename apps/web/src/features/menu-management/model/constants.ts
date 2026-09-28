import type { LayoutMode, MenuType, MenuTreeNode } from '@/entities/menu'

/** 层级上限，与 apps/server 的 `MAX_DEPTH` 保持一致（决策 D3；值变更必须两端同步） */
export const MENU_MAX_DEPTH = 3

/** 新增 Dialog 的菜单类型（docs/14 §2 / §4.3）；可变数组以满足 FsdSelect 的 options 类型 */
export const MENU_TYPE_OPTIONS: Array<{ label: string; value: MenuType }> = [
  { label: '目录', value: 'dir' },
  { label: '菜单', value: 'menu' },
  { label: '外链', value: 'external' },
]

/** 左栏（菜单树）宽度约束，px（docs/14 §4.7：200–600） */
export const MENU_PANEL_MIN_WIDTH = 200
export const MENU_PANEL_MAX_WIDTH = 600

/** 左栏默认占比：≥1280px 为 42%，960–1280px 由样式表收窄至 34%（docs/14 §4.7） */
export const MENU_PANEL_DEFAULT_RATIO = 0.42

export const LAYOUT_OPTIONS: Array<{ label: string; value: LayoutMode }> = [
  { label: '侧边栏', value: 'sidebar' },
  { label: '顶部栏', value: 'top' },
  { label: '混合', value: 'mix' },
  { label: '双栏', value: 'dual' },
]

/** 图标子集（@element-plus/icons-vue 名称，经 FsdIcon 渲染） */
export const ICON_OPTIONS = [
  'Odometer',
  'HomeFilled',
  'Setting',
  'Management',
  'User',
  'Menu',
  'Document',
  'Folder',
  'Files',
  'Collection',
  'Histogram',
  'DataAnalysis',
  'Monitor',
  'Platform',
  'Grid',
  'Operation',
  'Tools',
  'Bell',
  'Goods',
  'ShoppingCart',
  'Ticket',
  'Link',
] as const

/** 节点自身深度：顶层 = 1；未找到返回 0 */
export function depthOf(tree: MenuTreeNode[], id: number, level = 1): number {
  for (const node of tree) {
    if (node.id === id) return level
    const found = depthOf(node.children, id, level + 1)
    if (found) return found
  }
  return 0
}

/** 以 node 为根的子树高度：叶子 = 1 */
export function subtreeHeight(node: MenuTreeNode): number {
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(subtreeHeight))
}

/**
 * 能否在深度为 `nodeDepth` 的节点下新增子级（决策 D3 前端预判）。
 * 只为体验，安全边界在后端（超限 422）。
 */
export function canAddChild(nodeDepth: number): boolean {
  return nodeDepth > 0 && nodeDepth < MENU_MAX_DEPTH
}
