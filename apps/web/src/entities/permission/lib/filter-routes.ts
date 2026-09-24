import type { BackendRouteNode, RouteMetaPayload } from '@/entities/menu'
import { hasPermission } from './has-permission'

/**
 * 路由级过滤（docs/13 §3.2）：命中 `meta.roles` 或 `meta.permissions` **其一**即保留整棵子树。
 * 未配置则放行；过滤掉「既无子节点也无组件」的空目录节点。
 */
export function filterRoutes(
  nodes: BackendRouteNode[],
  permissions: string[] = [],
  roles: string[] = [],
): BackendRouteNode[] {
  return (
    nodes
      .filter((node) => hasPermission(needOf(node.meta), permissions, roles))
      .map((node) => {
        const children = node.children ? filterRoutes(node.children, permissions, roles) : undefined
        return { ...node, children: children?.length ? children : undefined }
      })
      // 去掉「子节点全被过滤且自身无组件」的空目录节点（docs/13 §3.2 修订：原文的 `|| node.path` 恒真）
      .filter((node) => Boolean(node.children?.length) || Boolean(node.component))
  )
}

/** `meta.roles` 归一为 `role:xxx` 形式，与 `permissions` 合并为「满足其一即可」的需求列表 */
function needOf(meta?: RouteMetaPayload): string[] {
  const need: string[] = [...(meta?.permissions ?? [])]
  for (const role of meta?.roles ?? []) need.push(`role:${role}`)
  return need
}
