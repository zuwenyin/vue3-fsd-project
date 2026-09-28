import { describe, expect, it } from 'vitest'
import { MENU_MAX_DEPTH, canAddChild, depthOf, subtreeHeight } from '../model/constants'
import { node } from './factory'

/** 3 级树：A → A1 → A1a；B 为叶子 */
function sampleTree() {
  return [
    node({
      id: 1,
      name: 'A',
      children: [
        node({
          id: 2,
          parentId: 1,
          name: 'A1',
          children: [node({ id: 3, parentId: 2, name: 'A1a' })],
        }),
      ],
    }),
    node({ id: 4, name: 'B' }),
  ]
}

describe('MENU_MAX_DEPTH', () => {
  it('与后端 apps/server 的 MAX_DEPTH 同步为 3（决策 D3）', () => {
    expect(MENU_MAX_DEPTH).toBe(3)
  })
})

describe('depthOf', () => {
  it('顶层 = 1，逐级递增；未找到 = 0', () => {
    const tree = sampleTree()
    expect(depthOf(tree, 1)).toBe(1)
    expect(depthOf(tree, 2)).toBe(2)
    expect(depthOf(tree, 3)).toBe(3)
    expect(depthOf(tree, 999)).toBe(0)
  })
})

describe('subtreeHeight', () => {
  it('叶子 = 1，否则 = 1 + 子树高度最大值', () => {
    const tree = sampleTree()
    expect(subtreeHeight(tree[1]!)).toBe(1)
    expect(subtreeHeight(tree[0]!)).toBe(3)
  })
})

describe('canAddChild', () => {
  it('深度 1/2 可新增子级，3 级（上限）与未选中（0）不可', () => {
    expect(canAddChild(0)).toBe(false)
    expect(canAddChild(1)).toBe(true)
    expect(canAddChild(2)).toBe(true)
    expect(canAddChild(MENU_MAX_DEPTH)).toBe(false)
    expect(canAddChild(MENU_MAX_DEPTH + 1)).toBe(false)
  })
})
