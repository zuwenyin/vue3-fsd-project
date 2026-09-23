function getChildren<T>(node: T, childrenKey: string): T[] {
  const value = (node as Record<string, unknown>)[childrenKey]
  return Array.isArray(value) ? (value as T[]) : []
}

export function treeMap<T, R>(
  tree: T[],
  fn: (node: T, depth: number) => R,
  childrenKey = 'children',
): R[] {
  const result: R[] = []
  const walk = (nodes: T[], depth: number): void => {
    for (const node of nodes) {
      result.push(fn(node, depth))
      walk(getChildren(node, childrenKey), depth + 1)
    }
  }
  walk(tree, 0)
  return result
}

/**
 * 过滤：命中节点保留（含其整棵子树）；未命中但子孙有命中时保留为祖先节点。
 */
export function treeFilter<T>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children',
): T[] {
  const result: T[] = []
  for (const node of tree) {
    if (predicate(node)) {
      result.push(node)
      continue
    }
    const keptChildren = treeFilter(getChildren(node, childrenKey), predicate, childrenKey)
    if (keptChildren.length > 0) {
      result.push({ ...node, [childrenKey]: keptChildren } as T)
    }
  }
  return result
}

export function treeFind<T>(
  tree: T[],
  predicate: (node: T) => boolean,
  childrenKey = 'children',
): T | undefined {
  for (const node of tree) {
    if (predicate(node)) return node
    const found = treeFind(getChildren(node, childrenKey), predicate, childrenKey)
    if (found) return found
  }
  return undefined
}

export function flattenTree<T>(tree: T[], childrenKey = 'children'): T[] {
  const result: T[] = []
  const walk = (nodes: T[]): void => {
    for (const node of nodes) {
      result.push(node)
      walk(getChildren(node, childrenKey))
    }
  }
  walk(tree)
  return result
}
