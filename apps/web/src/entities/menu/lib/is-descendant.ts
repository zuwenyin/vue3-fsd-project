/**
 * 判断 `candidateId` 是否为 `ancestorId` 的子孙（docs/14 §5.3 拖拽校验复用）。
 * 自身不算子孙。泛型结构约束：路由树（BackendRouteNode）与管理树（MenuTreeNode）通用。
 */
export function isDescendant<T extends { id: number; children?: T[] }>(
  nodes: T[],
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

function hasId<T extends { id: number; children?: T[] }>(nodes: T[], id: number): boolean {
  for (const node of nodes) {
    if (node.id === id) return true
    if (hasId(node.children ?? [], id)) return true
  }
  return false
}
