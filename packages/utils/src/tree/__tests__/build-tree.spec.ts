import { describe, expect, it } from 'vitest'
import { listToTree } from '../build-tree'

interface Item {
  id: number
  parentId: number | null
  title: string
  children?: Item[]
}

describe('tree/listToTree', () => {
  it('空数组返回空树', () => {
    expect(listToTree<Item>([])).toEqual([])
  })

  it('构建 3 级树', () => {
    const list: Item[] = [
      { id: 1, parentId: null, title: 'A' },
      { id: 2, parentId: 1, title: 'B' },
      { id: 3, parentId: 2, title: 'C' },
    ]
    const tree = listToTree(list)
    expect(tree).toHaveLength(1)
    expect(tree[0]?.children).toHaveLength(1)
    expect(tree[0]?.children[0]?.children).toHaveLength(1)
  })

  it('孤儿节点（parentId 指向不存在）按根节点处理，不丢数据', () => {
    const list: Item[] = [
      { id: 1, parentId: 99, title: 'orphan' },
      { id: 2, parentId: 1, title: 'child' },
    ]
    const tree = listToTree(list)
    expect(tree).toHaveLength(1)
    expect(tree[0]?.id).toBe(1)
    expect(tree[0]?.children).toHaveLength(1)
  })

  it('父 id 为 0 且不存在 id=0 的节点时按根节点处理', () => {
    const list = [{ id: 1, parentId: 0, title: 'zero-parent' }]
    const tree = listToTree(list)
    expect(tree).toHaveLength(1)
    expect(tree[0]?.id).toBe(1)
  })

  it('多根返回数组', () => {
    const list: Item[] = [
      { id: 1, parentId: null, title: 'r1' },
      { id: 2, parentId: null, title: 'r2' },
    ]
    expect(listToTree(list)).toHaveLength(2)
  })

  it('支持自定义 idKey / parentKey / childrenKey', () => {
    const list = [
      { key: 'a', parent: null },
      { key: 'b', parent: 'a' },
    ]
    const tree = listToTree(list, { idKey: 'key', parentKey: 'parent', childrenKey: 'items' })
    expect(tree).toHaveLength(1)
    expect((tree[0] as unknown as { items: unknown[] }).items).toHaveLength(1)
  })
})
