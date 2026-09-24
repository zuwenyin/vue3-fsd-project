import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BackendRouteNode } from '@/entities/menu'
import { useUserStore } from '@/entities/user'
import { getDynamicRouteNames } from '../dynamic'
import { router } from '../index'
import { setupRouterGuard } from '../guard'

vi.mock('@/shared/lib/page-modules', () => ({
  pageComponentKeys: ['dashboard/index'],
  resolvePageComponent: (component?: string) =>
    component === 'dashboard/index' ? { name: 'stub-dashboard' } : undefined,
}))

vi.mock('@/entities/user/api/user.api', () => ({
  login: vi.fn(),
  fetchUserInfo: vi.fn(() =>
    Promise.resolve({
      id: 1,
      username: 'admin',
      nickname: '超级管理员',
      roles: ['admin'],
      permissions: ['*'],
    }),
  ),
}))

vi.mock('@/entities/menu/api/menu.api', () => ({
  fetchUserRoutes: vi.fn(() =>
    Promise.resolve<BackendRouteNode[]>([
      {
        id: 1,
        parentId: null,
        name: 'Dashboard',
        path: '/dashboard',
        component: 'dashboard/index',
        meta: { title: '仪表盘' },
      },
    ]),
  ),
}))

describe('路由守卫', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('首次进入未注册的地址：加载动态路由后按 path 重解析，不落 404', async () => {
    const user = useUserStore()
    user.token = 'test-token'
    user.roles = ['admin']
    user.permissions = ['*']

    setupRouterGuard()
    await router.push('/dashboard')

    expect(getDynamicRouteNames()).toContain('Dashboard')
    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('未登录访问 public 路由（/login）直接放行', async () => {
    const user = useUserStore()
    user.token = ''

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('未登录直连动态地址 → 跳登录并带 redirect（catch-all 404 不标 public）', async () => {
    const user = useUserStore()
    user.token = ''

    await router.push('/system/user')

    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/system/user')
  })
})
