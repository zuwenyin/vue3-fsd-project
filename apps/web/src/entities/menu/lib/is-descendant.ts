import type { BackendRouteNode } from '../model/types'

/**
 * 判断 `candidateId` 是否为 `ancestorId` 的子孙（docs/14 §5.3 拖拽校验复用）。
 * 自身不算子孙。
 */
export function isDescendant(
  nodes: BackendRouteNode[],
  ancestorId: number,
  candidateId: number,
): boolean {
  for (const node of nodes) {
    if (node.id === ancestorId) {
      return hasId(node.children ?? [], candidateId)
    }
    if (isDescendant(node.children ?? [], ancestorId, candidateId)) return true
  }
  return false
}

function hasId(nodes: BackendRouteNode[], id: number): boolean {
  for (const node of nodes) {
    if (node.id === id) return true
    if (hasId(node.children ?? [], id)) return true
  }
  return false
}
