import { describe, expect, it } from 'vitest'
import type { BackendRouteNode } from '@/entities/menu'
import { filterRoutes } from '../lib/filter-routes'

function node(partial: Partial<BackendRouteNode> & { name: string }): BackendRouteNode {
  return {
    id: 1,
    parentId: null,
    path: `/${partial.name.toLowerCase()}`,
    meta: { title: partial.name },
    ...partial,
  }
}

const tree: BackendRouteNode[] = [
  node({ name: 'Dashboard', component: 'dashboard/index' }),
  node({
    name: 'System',
    component: undefined,
    children: [
      node({
        name: 'SystemUser',
        path: 'user',
        component: 'system/user/index',
        meta: { title: '用户管理', permissions: ['system:user:view'] },
      }),
      node({
        name: 'SystemMenu',
        path: 'menu',
        component: 'system/menu/index',
        meta: { title: '菜单管理', permissions: ['system:menu:view'] },
      }),
    ],
  }),
  node({ name: 'Hidden', component: 'profile/index', meta: { title: '个人中心', roles: ['vip'] } }),
]

describe('filterRoutes', () => {
  it('admin 直通：整棵树保留', () => {
    const result = filterRoutes(tree, ['*'], ['admin'])
    expect(result.map((n) => n.name)).toEqual(['Dashboard', 'System', 'Hidden'])
    expect(result[1]?.children?.map((n) => n.name)).toEqual(['SystemUser', 'SystemMenu'])
  })

  it('editor：无权限子节点被过滤，父目录保留（仍有可见子节点）', () => {
    const result = filterRoutes(tree, ['system:menu:view'], ['editor'])
    expect(result.map((n) => n.name)).toEqual(['Dashboard', 'System'])
    expect(result[1]?.children?.map((n) => n.name)).toEqual(['SystemMenu'])
  })

  it('空权限 + 非 admin：受限节点被过滤，未配置权限的节点保留', () => {
    const result = filterRoutes(tree, [], ['guest'])
    expect(result.map((n) => n.name)).toEqual(['Dashboard'])
  })

  it('子节点全被过滤 → 空目录节点一并移除', () => {
    const result = filterRoutes(tree, [], ['guest'])
    expect(result.find((n) => n.name === 'System')).toBeUndefined()
  })

  it('roles 声明与 permissions 命中其一即可', () => {
    const result = filterRoutes(tree, [], ['vip'])
    expect(result.map((n) => n.name)).toEqual(['Dashboard', 'Hidden'])
  })

  it('空输入 → 空输出', () => {
    expect(filterRoutes([], ['*'], ['admin'])).toEqual([])
  })
})
