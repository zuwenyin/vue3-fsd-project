import type { App } from 'vue'
import { ElMessage } from 'element-plus'
import { MENU_HOT_APPLY_KEY, type MenuApplyResult } from '@/shared/lib/menu-apply'
import { router } from './index'
import { applyRoutes } from './dynamic'

/**
 * 菜单配置页「应用变更」（docs/14 §5.2）：重新拉路由表 → 热替换 → 失效跳转。
 *
 * - 只做「拉取 + 热替换」，**不调用任何发布接口**（决策 D4：本期保存即写库生效）；
 * - 热替换顺序由 `applyRoutes` 保证（先注册后清理），当前路由全程有效；
 * - 仅当当前路由确实被删除/隐藏时跳回 `/dashboard`；
 * - 失效页签 / keep-alive 缓存清理 `pruneInvalidViews(router)` 在 P6 接入（docs/15 §3）。
 */
export async function applyMenuChanges(): Promise<MenuApplyResult> {
  await applyRoutes(router)

  const current = String(router.currentRoute.value.name ?? '')
  if (current && current !== 'Layout' && !router.hasRoute(current)) {
    await router.replace('/dashboard')
    ElMessage.warning('当前页面已被移除，已返回仪表盘')
    return { redirected: true }
  }
  return { redirected: false }
}

/** 供 app/index.ts 装配：把热应用能力下放给 features（features 不得导入 app/*） */
export function provideMenuHotApply(app: App): void {
  app.provide(MENU_HOT_APPLY_KEY, applyMenuChanges)
}
