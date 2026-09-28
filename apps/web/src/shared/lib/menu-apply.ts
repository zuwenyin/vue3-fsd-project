import type { InjectionKey } from 'vue'

/** 「应用变更」结果：redirected = 当前路由已被删除/隐藏，已跳回 /dashboard */
export interface MenuApplyResult {
  redirected: boolean
}

/**
 * 菜单热应用能力（重新拉路由表 → 热替换 → 失效跳转），由 app 层注入。
 *
 * 为什么走 provide/inject：`applyRoutes` / `router` 都在 `app/router/*`，
 * 而 docs/14 §3 的分层约束是 `features/menu-management` **不得导入 `app/*`**。
 * 与 P3 的 `v-permission`（指令移到 app 层）同类问题的另一种解法：
 * 能力留在 app 层，key 与类型放 shared 供双方引用。
 */
export const MENU_HOT_APPLY_KEY: InjectionKey<() => Promise<MenuApplyResult>> =
  Symbol('menu-hot-apply')
