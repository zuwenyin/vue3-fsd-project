import type { Router } from 'vue-router'
import type { MenuItem } from '@/entities/menu'

/**
 * 该路由名是否**真的可跳转**：注册了 name 但没有 component 的纯目录节点
 * （后端 `component = null`）不能被 push，否则落空白页（docs/15 §2.3）。
 */
export function canNavigate(router: Router, name: string): boolean {
  if (!router.hasRoute(name)) return false
  const matched = router.resolve({ name }).matched
  return Boolean(matched.at(-1)?.components)
}

/** 深度优先找第一个 path 命中的菜单项 key（activePath 回指父菜单用，docs/15 §2.3） */
export function findKeyByPath(items: MenuItem[], path: string): string | null {
  for (const item of items) {
    if (item.path === path) return item.key
    const found = item.children ? findKeyByPath(item.children, path) : null
    if (found) return found
  }
  return null
}

export function findMenuItemByKey(items: MenuItem[], key: string): MenuItem | null {
  for (const item of items) {
    if (item.key === key) return item
    const found = item.children ? findMenuItemByKey(item.children, key) : null
    if (found) return found
  }
  return null
}

/** 当前路由所属的一级菜单 key（mix / dual 的次级栏据此取子树） */
export function findRootKey(items: MenuItem[], key: string): string | null {
  for (const item of items) {
    if (item.key === key) return item.key
    if (item.children && findMenuItemByKey(item.children, key)) return item.key
  }
  return null
}

/** 只保留一级菜单项（mix 顶部栏 / dual 窄条不渲染子级） */
export function stripChildren(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({ ...item, children: undefined }))
}

export interface ActiveTarget {
  /** `route.name`：菜单 index 即 route.name（docs/15 §2.3） */
  name?: string
  path: string
  /** `route.meta.activePath`：详情页高亮所属菜单 */
  activePath?: string
}

/**
 * `FsdMenu` 的 `default-active`：
 * ① `meta.activePath` 精确回指 → ② 当前路由名在菜单里 → ③ 路径兜底；都没命中返回 `''`（不高亮）。
 */
export function activeMenuKey(items: MenuItem[], target: ActiveTarget): string {
  if (target.activePath) {
    const byActivePath = findKeyByPath(items, target.activePath)
    if (byActivePath) return byActivePath
  }
  if (target.name && findMenuItemByKey(items, target.name)) return target.name
  return findKeyByPath(items, target.path) ?? ''
}
