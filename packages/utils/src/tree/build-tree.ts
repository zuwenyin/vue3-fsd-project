export interface ListToTreeOptions {
  idKey?: string
  parentKey?: string
  childrenKey?: string
}

type InternalNode<T> = T & { children: InternalNode<T>[] }

/**
 * 扁平列表转树。
 * - 孤儿节点（parentId 指向不存在的 id）按根节点处理，不丢数据
 * - 多根返回数组；保持稳定顺序
 */
export function listToTree<T>(
  list: T[],
  options: ListToTreeOptions = {},
): Array<T & { children: T[] }> {
  const { idKey = 'id', parentKey = 'parentId', childrenKey = 'children' } = options

  const nodes: Array<InternalNode<T>> = list.map((item) => {
    const node = { ...(item as object) } as Record<string, unknown>
    node[childrenKey] = []
    return node as unknown as InternalNode<T>
  })

  const byId = new Map<unknown, InternalNode<T>>()
  for (const node of nodes) {
    byId.set((node as unknown as Record<string, unknown>)[idKey], node)
  }

  const roots: Array<InternalNode<T>> = []
  for (const node of nodes) {
    const raw = node as unknown as Record<string, unknown>
    const parentId = raw[parentKey]
    if (parentId === undefined || parentId === null) {
      roots.push(node)
      continue
    }
    const parent = byId.get(parentId)
    const siblings = parent
      ? (parent as unknown as Record<string, InternalNode<T>[] | undefined>)[childrenKey]
      : undefined
    if (siblings) {
      siblings.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots as unknown as Array<T & { children: T[] }>
}
