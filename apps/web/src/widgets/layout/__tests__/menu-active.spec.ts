import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import type { MenuItem } from '@/entities/menu'
import {
  activeMenuKey,
  canNavigate,
  findKeyByPath,
  findMenuItemByKey,
  findRootKey,
  stripChildren,
} from '../model/menu-active'

const tree = [
  { key: 'Dashboard', path: '/dashboard' },
  {
    key: 'System',
    path: '/system',
    children: [
      { key: 'SystemUser', path: '/system/user' },
      { key: 'SystemMenu', path: '/system/menu' },
    ],
  },
] as unknown as MenuItem[]

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'Layout',
        component: { template: '<div />' },
        children: [
          { path: 'dashboard', name: 'Dashboard', component: { template: '<div />' } },
          {
            // 纯目录节点：注册了 name 但没有 component（后端 component = null）
            path: 'system',
            name: 'System',
            children: [{ path: 'menu', name: 'SystemMenu', component: { template: '<div />' } }],
          },
        ],
      },
    ],
  })
}

describe('menu-active（菜单索引/高亮纯函数，docs/15 §2.3）', () => {
  it('findKeyByPath：嵌套命中，未命中返回 null', () => {
    expect(findKeyByPath(tree, '/system/user')).toBe('SystemUser')
    expect(findKeyByPath(tree, '/dashboard')).toBe('Dashboard')
    expect(findKeyByPath(tree, '/nope')).toBeNull()
  })

  it('findMenuItemByKey：返回节点本身（含 children）', () => {
    expect(findMenuItemByKey(tree, 'System')?.children).toHaveLength(2)
    expect(findMenuItemByKey(tree, 'Missing')).toBeNull()
  })

  it('findRootKey：子项回溯到一级 key；未知 key → null', () => {
    expect(findRootKey(tree, 'SystemMenu')).toBe('System')
    expect(findRootKey(tree, 'Dashboard')).toBe('Dashboard')
    expect(findRootKey(tree, 'Nope')).toBeNull()
  })

  it('stripChildren：只保留一级项且不改动原对象', () => {
    const stripped = stripChildren(tree)
    expect(stripped).toHaveLength(2)
    expect(stripped[1]?.children).toBeUndefined()
    expect(tree[1]?.children).toHaveLength(2)
  })

  it('activeMenuKey：activePath 精确回指优先于当前路由名', () => {
    // 详情页（name=Dashboard）应高亮所属菜单 SystemUser
    expect(
      activeMenuKey(tree, {
        name: 'Dashboard',
        path: '/dashboard/detail',
        activePath: '/system/user',
      }),
    ).toBe('SystemUser')
  })

  it('activeMenuKey：其次按路由名，最后按路径兜底；都未命中为空串', () => {
    expect(activeMenuKey(tree, { name: 'SystemMenu', path: '/system/menu' })).toBe('SystemMenu')
    expect(activeMenuKey(tree, { path: '/system/user' })).toBe('SystemUser')
    expect(activeMenuKey(tree, { name: 'Unknown', path: '/unknown' })).toBe('')
  })

  it('canNavigate：有 component 可跳转；纯目录（无 component）不可跳转', async () => {
    const router = makeRouter()
    await router.push('/dashboard')
    await router.isReady()

    expect(canNavigate(router, 'Dashboard')).toBe(true)
    expect(canNavigate(router, 'SystemMenu')).toBe(true)
    // ★ 目录节点：注册了 name 但没有组件 → 不能 push（否则落空白页，P4 实测踩坑）
    expect(canNavigate(router, 'System')).toBe(false)
    expect(canNavigate(router, 'NotRegistered')).toBe(false)
  })
})
