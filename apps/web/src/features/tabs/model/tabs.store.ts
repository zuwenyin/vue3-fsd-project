import { defineStore } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { storage } from '@repo/utils'
import { resolveMenuTitle } from '@/entities/menu'
import { TABS_KEY } from '@/shared/config/storage-keys'
import { MAX_CACHE } from './constants'
import type { TabView } from './types'

/**
 * 页签与 keep-alive 缓存（docs/15 §3.2）。
 *
 * - `cachedViews` 直接喂给 `<keep-alive :include>`，**页面组件名必须等于 `route.name`**
 *   （约定见 docs/15 §3.2；否则缓存静默失效）
 * - `affix` 页签不可关闭，且 closeAll / LRU 淘汰时始终保留
 * - 持久化走 `fsd:tabs`（决策 D1），恢复时必须晚于动态路由注册（否则全被过滤）
 */
export const useTabsStore = defineStore('tabs', () => {
  const visitedViews = ref<TabView[]>([])
  /** LRU 访问时间（name → 时间戳）：切换/打开时刷新，淘汰时取最久未用 */
  const accessAt = ref<Record<string, number>>({})
  /** 正在刷新的页签：临时移出 cachedViews → keep-alive 丢弃实例 → 重新挂载 */
  const refreshingName = ref<string | null>(null)
  /**
   * 刷新戳（name → 时间戳）：供 AppLayout 拼进 `<component :key>`。
   * 仅刷新过的页签 key 变化 → 该页组件重建，其他页签的缓存实例不受影响。
   */
  const refreshStamps = ref<Record<string, number>>({})

  const cachedViews = computed(() =>
    visitedViews.value
      .filter((view) => view.keepAlive && view.name !== refreshingName.value)
      .map((view) => view.name),
  )

  function isAffix(name: string): boolean {
    return visitedViews.value.some((view) => view.name === name && view.affix)
  }

  function touch(name: string): void {
    accessAt.value = { ...accessAt.value, [name]: Date.now() }
  }

  function persist(): void {
    storage.set(TABS_KEY, visitedViews.value)
  }

  function toTabView(route: RouteLocationNormalizedLoaded): TabView | null {
    const name = typeof route.name === 'string' ? route.name : ''
    if (!name) return null
    // 详情页可选：hideInMenu 且非 affix 不入页签（docs/15 §3.2）
    if (route.meta.hideInMenu && !route.meta.affix) return null
    return {
      name,
      path: route.path,
      title: resolveMenuTitle(route.meta),
      titleKey: route.meta.titleKey,
      icon: route.meta.icon,
      affix: Boolean(route.meta.affix),
      keepAlive: route.meta.keepAlive !== false,
    }
  }

  /** 打开页签（已存在则就地更新标题/路径，保持顺序） */
  function addView(route: RouteLocationNormalizedLoaded): void {
    const view = toTabView(route)
    if (!view) return
    touch(view.name)

    const existing = visitedViews.value.find((item) => item.name === view.name)
    if (existing) {
      existing.title = view.title
      existing.path = view.path
      existing.icon = view.icon
      existing.affix = view.affix
      existing.keepAlive = view.keepAlive
      persist()
      return
    }

    visitedViews.value = [...visitedViews.value, view]
    pruneCache()
    persist()
  }

  function closeView(name: string): void {
    if (isAffix(name)) return
    visitedViews.value = visitedViews.value.filter((view) => view.name !== name)
    persist()
  }

  function closeOthers(name: string): void {
    visitedViews.value = visitedViews.value.filter((view) => view.affix || view.name === name)
    persist()
  }

  function closeAll(): void {
    visitedViews.value = visitedViews.value.filter((view) => view.affix)
    persist()
  }

  function closeLeft(name: string): void {
    const index = visitedViews.value.findIndex((view) => view.name === name)
    if (index < 0) return
    visitedViews.value = visitedViews.value.filter((view, i) => view.affix || i >= index)
    persist()
  }

  function closeRight(name: string): void {
    const index = visitedViews.value.findIndex((view) => view.name === name)
    if (index < 0) return
    visitedViews.value = visitedViews.value.filter((view, i) => view.affix || i <= index)
    persist()
  }

  /** 刷新：先踢出缓存（keep-alive 丢弃实例），下一帧恢复并更新刷新戳 → 组件重建并重新取数 */
  async function refreshView(name: string): Promise<void> {
    refreshingName.value = name
    await nextTick()
    refreshingName.value = null
    refreshStamps.value = { ...refreshStamps.value, [name]: Date.now() }
  }

  /** 该页签当前的渲染 key 后缀（仅刷新过的页非空） */
  function stampOf(name: string): number | undefined {
    return refreshStamps.value[name]
  }

  /** 菜单热更新后清理失效页签（docs/14 §5.2 调用；cachedViews 随之收缩） */
  function pruneInvalidViews(router: Router): void {
    visitedViews.value = visitedViews.value.filter((view) => router.hasRoute(view.name))
    persist()
  }

  /** 从 `fsd:tabs` 恢复：必须在动态路由注册之后调用，否则会被全部过滤 */
  function restore(router: Router): void {
    const saved = storage.get<TabView[]>(TABS_KEY)
    if (!Array.isArray(saved)) return
    visitedViews.value = saved.filter(
      (view): view is TabView =>
        Boolean(view) && typeof view.name === 'string' && router.hasRoute(view.name),
    )
    persist()
  }

  /** LRU：超过 MAX_CACHE 时按最久未访问淘汰非 affix 页签 */
  function pruneCache(): void {
    if (visitedViews.value.length <= MAX_CACHE) return
    const removable = visitedViews.value
      .filter((view) => !view.affix)
      .sort((a, b) => (accessAt.value[a.name] ?? 0) - (accessAt.value[b.name] ?? 0))
    for (const victim of removable) {
      if (visitedViews.value.length <= MAX_CACHE) break
      visitedViews.value = visitedViews.value.filter((view) => view.name !== victim.name)
    }
  }

  return {
    visitedViews,
    cachedViews,
    refreshingName,
    refreshStamps,
    stampOf,
    addView,
    closeView,
    closeOthers,
    closeAll,
    closeLeft,
    closeRight,
    refreshView,
    pruneInvalidViews,
    restore,
    isAffix,
  }
})
