import { defineStore } from 'pinia'
import { useMenuStore } from '@/entities/menu'
import { useUserStore } from '@/entities/user'

type LogoutHook = () => void
let logoutHook: LogoutHook | null = null

/** 由 app 层注入「清动态路由 + 复位守卫标记」，避免 features → app 的向上依赖 */
export function registerLogoutHook(hook: LogoutHook): void {
  logoutHook = hook
}

/**
 * 只做流程编排，不另存 token（决策 D8：token / roles / permissions 归 `entities/user`）。
 * 登出顺序见 docs/13 §3.6：先清路由 → 再清 store → 最后由调用方跳登录。
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({ loading: false }),
  actions: {
    async login(username: string, password: string): Promise<void> {
      this.loading = true
      try {
        await useUserStore().login(username, password)
      } finally {
        this.loading = false
      }
    },
    async logout(): Promise<void> {
      logoutHook?.() // ① 动态路由 + ③ 守卫标记复位
      useMenuStore().clear() // ② 菜单树
      useUserStore().clear() // ④⑤ token / roles / permissions（storage 中的 fsd:token 一并清除）
      // ⑥ Tabs 与 keep-alive 缓存：P6 的 tabsStore.reset() 接管
    },
  },
})
