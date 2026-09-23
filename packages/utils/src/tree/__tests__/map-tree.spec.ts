import { describe, expect, it } from 'vitest'
import { flattenTree, treeFilter, treeFind, treeMap } from '../map-tree'

interface Node {
  id: number
  title: string
  hidden?: boolean
  children?: Node[]
}

const tree: Node[] = [
  {
    id: 1,
    title: 'A',
    children: [
      { id: 2, title: 'B', children: [{ id: 3, title: 'C' }] },
      { id: 4, title: 'D', hidden: true },
    ],
  },
  { id: 5, title: 'E', hidden: true },
]

describe('tree/map-tree', () => {
  it('treeMap 深度优先并带 depth', () => {
    const mapped = treeMap(tree, (node, depth) => `${node.id}:${depth}`)
    expect(mapped).toEqual(['1:0', '2:1', '3:2', '4:1', '5:0'])
  })

  it('treeFind 找到目标节点', () => {
    expect(treeFind(tree, (node) => node.id === 3)?.title).toBe('C')
    expect(treeFind(tree, (node) => node.id === 99)).toBeUndefined()
  })

  it('flattenTree 前序展开', () => {
    expect(flattenTree(tree).map((node) => node.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('treeFilter 保留命中节点与命中子节点的祖先', () => {
    const filtered = treeFilter(tree, (node) => node.id === 3)
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe(1)
    expect(filtered[0]?.children).toHaveLength(1)
    expect(filtered[0]?.children?.[0]?.id).toBe(2)
  })

  it('treeFilter 命中父节点时保留整棵子树', () => {
    const filtered = treeFilter(tree, (node) => node.id === 2)
    expect(filtered[0]?.children?.[0]?.children).toHaveLength(1)
  })

  it('treeFilter 全部不命中返回空', () => {
    expect(treeFilter(tree, () => false)).toEqual([])
  })
})
