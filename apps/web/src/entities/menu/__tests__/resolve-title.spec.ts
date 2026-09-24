import { describe, expect, it } from 'vitest'
import { resolveMenuTitle } from '../lib/resolve-title'
import { isDescendant } from '../lib/is-descendant'
import type { BackendRouteNode } from '../model/types'

describe('resolveMenuTitle（决策 D2）', () => {
  it('titleKey 有值且有 t → 用 t 的结果', () => {
    expect(
      resolveMenuTitle({ title: '仪表盘', titleKey: 'menu.dashboard' }, () => 'Dashboard'),
    ).toBe('Dashboard')
  })

  it('有 titleKey 但无 t → 回落 title（本期不接 i18n）', () => {
    expect(resolveMenuTitle({ title: '仪表盘', titleKey: 'menu.dashboard' })).toBe('仪表盘')
  })

  it('两者皆空 → 空串', () => {
    expect(resolveMenuTitle({})).toBe('')
  })
})

describe('isDescendant', () => {
  const tree: BackendRouteNode[] = [
    {
      id: 1,
      parentId: null,
      name: 'System',
      path: '/system',
      meta: { title: '系统管理' },
      children: [
        {
          id: 2,
          parentId: 1,
          name: 'SystemUser',
          path: 'user',
          meta: { title: '用户管理' },
          children: [
            {
              id: 3,
              parentId: 2,
              name: 'SystemUserDetail',
              path: 'detail',
              meta: { title: '详情' },
            },
          ],
        },
      ],
    },
  ]

  it('子孙（含深层）判定为 true', () => {
    expect(isDescendant(tree, 1, 2)).toBe(true)
    expect(isDescendant(tree, 1, 3)).toBe(true)
  })

  it('自身不算子孙；无关节点为 false', () => {
    expect(isDescendant(tree, 1, 1)).toBe(false)
    expect(isDescendant(tree, 2, 1)).toBe(false)
  })
})
