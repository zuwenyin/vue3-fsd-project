import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/app/router/dynamic', () => ({
  applyRoutes: vi.fn(() => Promise.resolve([])),
}))

const { ElMessage } = await import('element-plus')
const { applyRoutes } = await import('@/app/router/dynamic')
const { router } = await import('@/app/router')
const { applyMenuChanges } = await import('../menu-apply')

const warningMock = vi.mocked(ElMessage.warning)
const applyRoutesMock = vi.mocked(applyRoutes)

const Blank = { template: '<div />' }

/** 挂一条临时路由并进入（模拟「当前页面」） */
async function enter(name: string, path: string): Promise<void> {
  router.addRoute({ name, path, component: Blank })
  await router.push(path)
}

describe('applyMenuChanges（菜单配置页「应用变更」，docs/14 §5.2）', () => {
  beforeEach(() => {
    // applyMenuChanges 会调 useTabsStore().pruneInvalidViews（P6 接入）
    setActivePinia(createPinia())
    warningMock.mockClear()
    applyRoutesMock.mockClear()
    if (!router.hasRoute('Dashboard')) {
      router.addRoute({ name: 'Dashboard', path: '/dashboard', component: Blank })
    }
  })

  it('当前路由仍存在：只做热替换，不跳转也不提示', async () => {
    await enter('TempKeep', '/temp-keep')

    const result = await applyMenuChanges()

    expect(applyRoutesMock).toHaveBeenCalledWith(router)
    expect(result).toEqual({ redirected: false })
    expect(warningMock).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('TempKeep')
  })

  it('当前路由已被删除（热替换后不存在）：跳 /dashboard 并提示', async () => {
    await enter('TempGone', '/temp-gone')
    // 模拟「该菜单被删掉 → 新路由表里没有它」
    router.removeRoute('TempGone')

    const result = await applyMenuChanges()

    expect(result).toEqual({ redirected: true })
    expect(warningMock).toHaveBeenCalledWith('当前页面已被移除，已返回仪表盘')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})
