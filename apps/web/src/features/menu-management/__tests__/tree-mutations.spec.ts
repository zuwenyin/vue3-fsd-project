import { describe, expect, it } from 'vitest'
import {
  applyLocalMove,
  applyLocalUpdate,
  flattenWithLevel,
  siblingMovePayload,
  toMovePayload,
  toTreeSelectData,
  type MenuDragRow,
} from '../model/tree-mutations'
import { node, record } from './factory'

/**
 * 基准树：
 * A(1) ├ A1(2) └ A2(3)
 * B(4) └ B1(5) └ C1(6)
 */
function sampleTree() {
  return [
    node({
      id: 1,
      name: 'A',
      path: '/a',
      parentId: null,
      orderNo: 10,
      children: [
        node({ id: 2, name: 'A1', path: 'a1', parentId: 1, orderNo: 10 }),
        node({ id: 3, name: 'A2', path: 'a2', parentId: 1, orderNo: 20 }),
      ],
    }),
    node({
      id: 4,
      name: 'B',
      path: '/b',
      parentId: null,
      orderNo: 20,
      children: [
        node({
          id: 5,
          name: 'B1',
          path: 'b1',
          parentId: 4,
          orderNo: 10,
          children: [node({ id: 6, name: 'C1', path: 'c1', parentId: 5, orderNo: 10 })],
        }),
      ],
    }),
  ]
}

/** [id, parentId, level] → DragRow（与 DOM 上的 data-* 一致） */
function rows(list: Array<[number, number | null, number]>): MenuDragRow[] {
  return list.map(([id, parentId, level]) => ({ id, parentId, level }))
}

describe('flattenWithLevel', () => {
  it('按渲染顺序扁平化并标注父级与深度', () => {
    expect(flattenWithLevel(sampleTree())).toEqual([
      { id: 1, parentId: null, level: 1 },
      { id: 2, parentId: 1, level: 2 },
      { id: 3, parentId: 1, level: 2 },
      { id: 4, parentId: null, level: 1 },
      { id: 5, parentId: 4, level: 2 },
      { id: 6, parentId: 5, level: 3 },
    ])
  })
})

describe('toMovePayload（落点换算）', () => {
  it('拖到列表头 = 顶层，beforeId 为原第一行', () => {
    const list = rows([
      [3, 1, 2],
      [1, null, 1],
      [2, 1, 2],
      [4, null, 1],
      [5, 4, 2],
      [6, 5, 3],
    ])
    expect(toMovePayload(list, 0, 1)).toEqual({ id: 3, targetParentId: null, beforeId: 1 })
  })

  it('拖到某行之后 = 与该行同级；后续无同级行时追加末尾（beforeId = null）', () => {
    const list = rows([
      [1, null, 1],
      [2, 1, 2],
      [4, null, 1],
      [3, 1, 2],
      [5, 4, 2],
      [6, 5, 3],
    ])
    expect(toMovePayload(list, 3, 1)).toEqual({ id: 3, targetParentId: null, beforeId: null })
  })

  it('拖到某父级的任一子级之后 = 进入该父级', () => {
    const list = rows([
      [1, null, 1],
      [2, 1, 2],
      [4, null, 1],
      [5, 4, 2],
      [3, 1, 2],
      [6, 5, 3],
    ])
    expect(toMovePayload(list, 4, 1)).toEqual({ id: 3, targetParentId: 4, beforeId: null })
  })

  it('同级后续行存在时 beforeId 取其后第一个深度 ≤ 新层级的行', () => {
    const list = rows([
      [1, null, 1],
      [4, null, 1],
      [3, 1, 2],
      [2, 1, 2],
      [5, null, 1],
      [6, 5, 2],
    ])
    expect(toMovePayload(list, 2, 1)).toEqual({ id: 3, targetParentId: null, beforeId: 5 })
  })

  it('会超过 3 级的落点返回 null（决策 D3：拖到 3 级行之后且自身带子树）', () => {
    const list = rows([
      [1, null, 1],
      [4, null, 1],
      [5, 4, 2],
      [6, 5, 3],
      [2, 1, 2],
    ])
    // 新层级 3 + 子树高度 2 - 1 = 4 > MENU_MAX_DEPTH
    expect(toMovePayload(list, 4, 2)).toBeNull()
  })

  it('beforeId 只取「目标父级下」的行：异父的相邻行不参与（回归：曾导致后端 404 回滚）', () => {
    const list = rows([
      [2, null, 1],
      [3, 2, 2],
      [4, 2, 2],
      [5, 3, 3],
      [6, null, 1],
    ])
    // 拖 5 到 4 之后 → 进入 2 的子级；其后只有异父行 6（parentId=null），故 beforeId = null（追加末尾）
    expect(toMovePayload(list, 3, 1)).toEqual({ id: 5, targetParentId: 2, beforeId: null })
  })

  it('index 越界返回 null', () => {
    expect(toMovePayload(rows([[1, null, 1]]), 5, 1)).toBeNull()
  })
})

describe('applyLocalMove（乐观更新）', () => {
  it('跨层改父级：摘除后插入到新父级的 beforeId 之前', () => {
    const next = applyLocalMove(sampleTree(), { id: 3, targetParentId: 5, beforeId: 6 })
    const treeA = next[0]!
    const treeB1 = next[1]!.children[0]!

    expect(treeA.children.map((item) => item.id)).toEqual([2])
    expect(treeB1.children.map((item) => item.id)).toEqual([3, 6])
  })

  it('拖到自身子孙 / 自身 / 不存在的节点：原样返回', () => {
    const tree = sampleTree()
    // 2 是 1 的子孙
    expect(applyLocalMove(tree, { id: 1, targetParentId: 2, beforeId: null })).toBe(tree)
    expect(applyLocalMove(tree, { id: 1, targetParentId: 1, beforeId: null })).toBe(tree)
    expect(applyLocalMove(tree, { id: 999, targetParentId: null, beforeId: null })).toBe(tree)
  })
})

describe('applyLocalUpdate（保存后就地更新）', () => {
  it('同父级：字段替换 + 同层按 orderNo 重排', () => {
    const next = applyLocalUpdate(
      sampleTree(),
      record({ id: 2, parentId: 1, title: '改名', orderNo: 30 }),
    )
    const children = next[0]!.children

    expect(children.map((item) => item.id)).toEqual([3, 2])
    expect(children[1]?.title).toBe('改名')
  })

  it('换父级：摘除后追加到新父级末尾', () => {
    const next = applyLocalUpdate(sampleTree(), record({ id: 3, parentId: 4 }))

    expect(next[0]!.children.map((item) => item.id)).toEqual([2])
    expect(next[1]!.children.map((item) => item.id)).toEqual([5, 3])
  })

  it('非法换父（目标是自身子孙）与未知节点：原样返回', () => {
    const tree = sampleTree()
    // 5 是 4 的子孙
    expect(applyLocalUpdate(tree, record({ id: 4, parentId: 5 }))).toBe(tree)
    expect(applyLocalUpdate(tree, record({ id: 999 }))).toBe(tree)
  })
})

describe('siblingMovePayload（窄屏上移 / 下移降级）', () => {
  const tree = sampleTree()

  it('同层内上移：beforeId 为前一个兄弟', () => {
    expect(siblingMovePayload(tree, 3, 'up')).toEqual({ id: 3, targetParentId: 1, beforeId: 2 })
  })

  it('已是同层第一个 / 最后一个是边界，返回 null', () => {
    expect(siblingMovePayload(tree, 2, 'up')).toBeNull()
    expect(siblingMovePayload(tree, 3, 'down')).toBeNull()
    expect(siblingMovePayload(tree, 4, 'down')).toBeNull()
  })

  it('下移到末尾：beforeId = null（追加）', () => {
    expect(siblingMovePayload(tree, 2, 'down')).toEqual({
      id: 2,
      targetParentId: 1,
      beforeId: null,
    })
    expect(siblingMovePayload(tree, 1, 'down')).toEqual({
      id: 1,
      targetParentId: null,
      beforeId: null,
    })
  })

  it('顶层节点上移同样生效；未知节点返回 null', () => {
    expect(siblingMovePayload(tree, 4, 'up')).toEqual({ id: 4, targetParentId: null, beforeId: 1 })
    expect(siblingMovePayload(tree, 999, 'up')).toBeNull()
  })
})

describe('toTreeSelectData', () => {
  it('原样透出树节点（仅做 FsdTreeSelect 的类型适配）', () => {
    const tree = sampleTree()
    const data = toTreeSelectData(tree)

    expect(data).toHaveLength(2)
    expect(data[0]?.id).toBe(1)
    expect(data[0]?.title).toBe('菜单1')
  })
})
