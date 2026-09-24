import { useUserStore } from '@/entities/user'
import { registerLogoutHook, useAuthStore } from '@/features/auth'
import { applyRoutes, clearDynamicRoutes } from './dynamic'
import { router } from './index'

let routesLoaded = false

/** 复位「已加载路由」标记（登出 / 切换账号时必须调用） */
export function resetRoutesLoaded(): void {
  routesLoaded = false
}

/**
 * 全局守卫（docs/13 §3.5）：
 * public → 放行；未登录 → /login；已登录但未加载路由 → 拉取+过滤+注册后重新进入。
 */
export function setupRouterGuard(): void {
  // app 层注入路由清理（docs/13 §3.6 顺序 ①③），避免 features → app 的向上依赖
  registerLogoutHook(() => {
    clearDynamicRoutes(router)
    resetRoutesLoaded()
  })

  router.beforeEach(async (to) => {
    const user = useUserStore()

    if (to.meta.public) return true
    if (!user.token) return { name: 'Login', query: { redirect: to.fullPath } }

    if (!routesLoaded) {
      try {
        await applyRoutes(router)
        routesLoaded = true
        // 重新进入，确保匹配到刚注册的路由。
        // ★ 必须按 path 重解析（不能按 name / 不能整体展开 to）：动态路由未注册时 `to.name`
        //   已是顶层通配的 'NotFound'，按 name 重进会一直停在 404（实测踩坑）。
        return { path: to.path, query: to.query, hash: to.hash, replace: true }
      } catch (error) {
        console.error('[router] 动态路由加载失败，已登出', error)
        await useAuthStore().logout()
        return { name: 'Login' }
      }
    }

    return true
  })
}
