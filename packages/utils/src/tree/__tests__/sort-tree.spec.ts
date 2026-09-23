import { describe, expect, it } from 'vitest'
import { sortByOrder } from '../sort-tree'

interface Node {
  id: number
  orderNo?: number
  children?: Node[]
}

describe('tree/sortByOrder', () => {
  it('按 orderNo 升序', () => {
    const nodes: Node[] = [
      { id: 3, orderNo: 3 },
      { id: 1, orderNo: 1 },
      { id: 2, orderNo: 2 },
    ]
    expect(sortByOrder(nodes).map((n) => n.id)).toEqual([1, 2, 3])
  })

  it('orderNo 相等时保持稳定（输入顺序）', () => {
    const nodes: Node[] = [
      { id: 1, orderNo: 1 },
      { id: 2, orderNo: 1 },
      { id: 3, orderNo: 1 },
    ]
    expect(sortByOrder(nodes).map((n) => n.id)).toEqual([1, 2, 3])
  })

  it('缺失 orderNo 的节点排在末尾', () => {
    const nodes: Node[] = [{ id: 9 }, { id: 1, orderNo: 1 }]
    expect(sortByOrder(nodes).map((n) => n.id)).toEqual([1, 9])
  })

  it('递归排序子节点且不丢失结构', () => {
    const nodes: Node[] = [
      {
        id: 1,
        orderNo: 2,
        children: [
          { id: 12, orderNo: 2 },
          { id: 11, orderNo: 1 },
        ],
      },
      { id: 0, orderNo: 1 },
    ]
    const sorted = sortByOrder(nodes)
    expect(sorted.map((n) => n.id)).toEqual([0, 1])
    expect(sorted[1]?.children?.map((n) => n.id)).toEqual([11, 12])
  })

  it('无子节点的节点原样返回引用', () => {
    const node: Node = { id: 1, orderNo: 1 }
    expect(sortByOrder([node])[0]).toBe(node)
  })
})
