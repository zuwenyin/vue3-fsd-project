import { describe, expect, it } from 'vitest'
import type { BackendRouteNode } from '../model/types'
import { buildMenuTree, joinPath } from '../lib/build-tree'

let seq = 0
function node(
  partial: Partial<BackendRouteNode> & { name: string; path: string },
): BackendRouteNode {
  seq += 1
  return {
    id: seq,
    parentId: null,
    meta: { title: partial.name },
    ...partial,
  }
}

describe('buildMenuTree', () => {
  it('key 取 route.name，子级 path 拼接父级', () => {
    const tree = buildMenuTree([
      node({
        name: 'System',
        path: '/system',
        children: [
          node({ name: 'SystemUser', path: 'user', component: 'system/user/index' }),
          node({ name: 'SystemMenu', path: 'menu', component: 'system/menu/index' }),
        ],
      }),
    ])
    expect(tree[0]?.key).toBe('System')
    expect(tree[0]?.path).toBe('/system')
    expect(tree[0]?.children?.map((item) => item.path)).toEqual(['/system/user', '/system/menu'])
  })

  it('hideInMenu 的节点被移除', () => {
    const tree = buildMenuTree([
      node({ name: 'Dashboard', path: '/dashboard' }),
      node({ name: 'Profile', path: '/profile', meta: { title: '个人中心', hideInMenu: true } }),
    ])
    expect(tree.map((item) => item.key)).toEqual(['Dashboard'])
  })

  it('hideChildrenInMenu 时子节点提升到当前层', () => {
    const tree = buildMenuTree([
      node({
        name: 'System',
        path: '/system',
        meta: { title: '系统管理', hideChildrenInMenu: true },
        children: [
          node({ name: 'SystemUser', path: 'user', component: 'system/user/index' }),
          node({ name: 'SystemMenu', path: 'menu', component: 'system/menu/index' }),
        ],
      }),
    ])
    expect(tree.map((item) => item.key)).toEqual(['SystemUser', 'SystemMenu'])
    expect(tree[0]?.path).toBe('/system/user')
  })

  it('纯目录且只有一个可见子节点 → 折叠为该子节点', () => {
    const tree = buildMenuTree([
      node({
        name: 'Single',
        path: '/single',
        children: [node({ name: 'SingleChild', path: 'child', component: 'dashboard/index' })],
      }),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0]?.key).toBe('SingleChild')
    expect(tree[0]?.path).toBe('/single/child')
  })

  it('有 component 的父节点即使只有一个子节点也不折叠', () => {
    const tree = buildMenuTree([
      node({
        name: 'Parent',
        path: '/parent',
        component: 'dashboard/index',
        children: [node({ name: 'Child', path: 'child', component: 'dashboard/index' })],
      }),
    ])
    expect(tree[0]?.key).toBe('Parent')
    expect(tree[0]?.children).toHaveLength(1)
  })

  it('排序：meta.order 升序，缺省者保持返回顺序', () => {
    const tree = buildMenuTree([
      node({ name: 'Dashboard', path: '/dashboard', meta: { title: '仪表盘', order: 10 } }),
      node({ name: 'NoOrderA', path: '/a', meta: { title: 'A' } }),
      node({ name: 'System', path: '/system', meta: { title: '系统管理', order: 100 } }),
      node({ name: 'Profile', path: '/profile', meta: { title: '个人中心', order: 200 } }),
      node({ name: 'NoOrderB', path: '/b', meta: { title: 'B' } }),
    ])
    expect(tree.map((item) => item.key)).toEqual([
      'Dashboard',
      'System',
      'Profile',
      'NoOrderA',
      'NoOrderB',
    ])
  })

  it('标题回落：titleKey + t 优先，其次 title，皆空为 ""', () => {
    const tree = buildMenuTree([
      node({ name: 'A', path: '/a', meta: { title: '英文标题', titleKey: 'menu.a' } }),
    ])
    expect(tree[0]?.title).toBe('英文标题')
    expect(tree[0]?.titleKey).toBe('menu.a')
  })

  it('icon / affix 透传', () => {
    const tree = buildMenuTree([
      node({ name: 'A', path: '/a', meta: { title: 'A', icon: 'Odometer', affix: true } }),
    ])
    expect(tree[0]?.icon).toBe('Odometer')
    expect(tree[0]?.affix).toBe(true)
  })

  it('空输入 → 空输出', () => {
    expect(buildMenuTree([])).toEqual([])
  })
})

describe('joinPath', () => {
  it('父级为空时原样返回', () => {
    expect(joinPath('', '/dashboard')).toBe('/dashboard')
  })

  it('相对路径拼接、绝对路径覆盖', () => {
    expect(joinPath('/system', 'user')).toBe('/system/user')
    expect(joinPath('/system/', 'user')).toBe('/system/user')
    expect(joinPath('/system', '/absolute')).toBe('/absolute')
  })
})
