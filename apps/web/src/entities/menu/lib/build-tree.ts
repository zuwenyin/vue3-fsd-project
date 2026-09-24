import type { BackendRouteNode, MenuItem } from '../model/types'
import { resolveMenuTitle } from './resolve-title'

/**
 * 路由树 → 菜单树（docs/03 §5 / docs/13 §3.4）
 * 1. `hideInMenu` 移除
 * 2. `hideChildrenInMenu` 时把子节点提升到当前层
 * 3. 只有一个可见子节点的**目录节点**折叠为该子节点
 * 4. `meta.order` 升序，缺省保持返回顺序（稳定排序）
 * 5. `key` = `route.name`，`path` 为可跳转路径（子级拼接父级）
 */
export function buildMenuTree(routes: BackendRouteNode[]): MenuItem[] {
  return toItems(routes, '')
}

function toItems(nodes: BackendRouteNode[], parentPath: string): MenuItem[] {
  const items: MenuItem[] = []

  for (const node of sortNodes(nodes)) {
    const meta = node.meta
    const path = joinPath(parentPath, node.path)
    const children = node.children?.length ? toItems(node.children, path) : []

    if (meta.hideInMenu) continue

    // 隐藏子节点时把子节点提升到当前层
    if (meta.hideChildrenInMenu) {
      items.push(...children)
      continue
    }

    // 折叠：纯目录且只有一个可见子节点时，用该子节点替代自身
    if (!node.component && children.length === 1) {
      items.push(children[0] as MenuItem)
      continue
    }

    items.push({
      key: node.name,
      path,
      title: resolveMenuTitle(meta),
      titleKey: meta.titleKey,
      icon: meta.icon,
      affix: meta.affix,
      children: children.length > 0 ? children : undefined,
    })
  }

  return items
}

/** 子级路径相对父级拼接；本身以 '/' 开头则视为绝对路径 */
export function joinPath(parentPath: string, path: string): string {
  if (!parentPath) return path
  if (path.startsWith('/')) return path
  return `${parentPath.replace(/\/$/, '')}/${path}`
}

/** 稳定排序：order 升序，缺省者相互保持原顺序 */
function sortNodes(nodes: BackendRouteNode[]): BackendRouteNode[] {
  return [...nodes].sort((a, b) => {
    const ao = a.meta?.order
    const bo = b.meta?.order
    if (ao === bo) return 0
    if (ao === undefined) return 1
    if (bo === undefined) return -1
    return ao - bo
  })
}
