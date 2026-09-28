import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { storage } from '@repo/utils'
import { TABS_KEY } from '@/shared/config/storage-keys'
import { MAX_CACHE } from '../model/constants'
import { useTabsStore } from '../model/tabs.store'
import type { TabView } from '../model/types'

/** 已注册路由名集合（模拟动态路由注册结果） */
let available = new Set<string>()
const router = {
  hasRoute: (name: string) => available.has(name),
} as unknown as Router

function route(name: string, meta: Record<string, unknown> = {}): RouteLocationNormalizedLoaded {
  return {
    name,
    path: `/${name.toLowerCase()}`,
    meta: { title: name, keepAlive: true, ...meta },
  } as unknown as RouteLocationNormalizedLoaded
}

function reset(): void {
  available = new Set(['Dashboard', 'SystemUser', 'SystemMenu', 'Profile'])
  storage.remove(TABS_KEY)
  setActivePinia(createPinia())
}

describe('tabs.store', () => {
  beforeEach(reset)

  it('addView：新增页签并持久化；重复访问只更新标题不重复插入', () => {
    const tabs = useTabsStore()
    tabs.addView(route('Dashboard'))
    tabs.addView(route('SystemUser'))
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard', 'SystemUser'])
    expect(storage.get<TabView[]>(TABS_KEY)?.length).toBe(2)

    tabs.addView(route('Dashboard', { title: '仪表盘' }))
    expect(tabs.visitedViews).toHaveLength(2)
    expect(tabs.visitedViews[0]?.title).toBe('仪表盘')
  })

  it('addView：hideInMenu 且非 affix 的详情页不入页签；affix 例外', () => {
    const tabs = useTabsStore()
    tabs.addView(route('Profile', { hideInMenu: true }))
    expect(tabs.visitedViews).toHaveLength(0)

    tabs.addView(route('Profile', { hideInMenu: true, affix: true }))
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Profile'])
  })

  it('affix 页签不可关闭；closeAll 只保留 affix', () => {
    const tabs = useTabsStore()
    tabs.addView(route('Dashboard', { affix: true }))
    tabs.addView(route('SystemUser'))

    tabs.closeView('Dashboard')
    expect(tabs.visitedViews).toHaveLength(2)

    tabs.closeAll()
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard'])
  })

  it('closeOthers / closeLeft / closeRight 语义正确', () => {
    const tabs = useTabsStore()
    tabs.addView(route('Dashboard', { affix: true }))
    tabs.addView(route('SystemUser'))
    tabs.addView(route('SystemMenu'))
    tabs.addView(route('Profile'))

    tabs.closeOthers('SystemMenu')
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard', 'SystemMenu'])

    tabs.addView(route('SystemUser'))
    tabs.addView(route('Profile'))
    tabs.closeLeft('Profile')
    // Dashboard 是 affix → 保留；SystemMenu / SystemUser 在左侧被关闭
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard', 'Profile'])

    tabs.closeRight('Dashboard')
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard'])
  })

  it('cachedViews：keepAlive=false 不进缓存；刷新期间临时移除', async () => {
    const tabs = useTabsStore()
    tabs.addView(route('Dashboard'))
    tabs.addView(route('SystemUser', { keepAlive: false }))
    expect(tabs.cachedViews).toEqual(['Dashboard'])

    // refreshView 同步置位 refreshingName（此时缓存已剔除），下一 tick 恢复
    const refreshing = tabs.refreshView('Dashboard')
    expect(tabs.cachedViews).toEqual([])
    await refreshing
    expect(tabs.cachedViews).toEqual(['Dashboard'])
  })

  it('pruneInvalidViews：清理路由已消失的页签（affix 也不例外）', () => {
    const tabs = useTabsStore()
    tabs.addView(route('Dashboard', { affix: true }))
    tabs.addView(route('SystemUser'))
    available.delete('SystemUser')

    tabs.pruneInvalidViews(router)
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard'])
    expect(storage.get<TabView[]>(TABS_KEY)?.length).toBe(1)
  })

  it('restore：从 fsd:tabs 恢复并过滤掉未注册的路由，随后回写', () => {
    const saved: TabView[] = [
      { name: 'Dashboard', path: '/dashboard', title: '仪表盘', affix: true, keepAlive: true },
      { name: 'Gone', path: '/gone', title: '已删除', affix: false, keepAlive: true },
    ]
    storage.set(TABS_KEY, saved)
    const tabs = useTabsStore()
    tabs.restore(router)
    expect(tabs.visitedViews.map((v) => v.name)).toEqual(['Dashboard'])
    expect(storage.get<TabView[]>(TABS_KEY)?.length).toBe(1)
  })

  it('LRU：超过 MAX_CACHE 时淘汰最久未访问的非 affix 页签', () => {
    const tabs = useTabsStore()
    available = new Set(Array.from({ length: MAX_CACHE + 2 }, (_, i) => `Page${i}`))

    tabs.addView(route('Dashboard', { affix: true }))
    for (let i = 0; i < MAX_CACHE + 1; i += 1) tabs.addView(route(`Page${i}`))
    // 重新访问 Page0 → 最久未访问的变成 Page1
    tabs.addView(route('Page0'))

    expect(tabs.visitedViews).toHaveLength(MAX_CACHE)
    expect(tabs.visitedViews.some((v) => v.name === 'Dashboard')).toBe(true)
    expect(tabs.visitedViews.some((v) => v.name === 'Page1')).toBe(false)
    expect(tabs.visitedViews.some((v) => v.name === 'Page0')).toBe(true)
  })

  it('标题一律经 resolveMenuTitle（titleKey 缺 t 时回落 title）', () => {
    const tabs = useTabsStore()
    tabs.addView(route('Dashboard', { title: '仪表盘', titleKey: 'menu.dashboard' }))
    expect(tabs.visitedViews[0]?.title).toBe('仪表盘')
  })
})
