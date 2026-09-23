function getChildren<T>(node: T, childrenKey: string): T[] {
  const value = (node as Record<string, unknown>)[childrenKey]
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * 按 orderNo 升序排序并递归子节点。
 * 稳定排序：orderNo 相等时保持输入顺序（菜单顺序依赖此性质）。
 */
export function sortByOrder<T extends { orderNo?: number }>(
  nodes: T[],
  childrenKey = 'children',
): T[] {
  const decorated = nodes.map((node, index) => ({
    node,
    index,
    order: node.orderNo ?? Number.MAX_SAFE_INTEGER,
  }))
  decorated.sort((a, b) => (a.order === b.order ? a.index - b.index : a.order - b.order))

  return decorated.map(({ node }) => {
    const children = getChildren(node, childrenKey)
    if (children.length === 0) return node
    return { ...node, [childrenKey]: sortByOrder(children, childrenKey) } as T
  })
}
