import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '@/entities/menu'
import { activeMenuKey, canNavigate, findMenuItemByKey } from './menu-active'

/**
 * 四个布局共用的菜单交互：高亮 key + 点击跳转。
 * - 菜单 `index` = `item.key`（= `route.name`），跳转用 `{ name }`，避免路径拼接错误；
 * - 外链不注册路由、由 `<a target="_blank">` 处理，这里直接忽略（docs/15 §2.3）。
 */
export function useMenuNavigation() {
  const route = useRoute()
  const router = useRouter()
  const menu = useMenuStore()

  const activeKey = computed(() =>
    activeMenuKey(menu.tree, {
      name: typeof route.name === 'string' ? route.name : undefined,
      path: route.path,
      activePath: route.meta.activePath,
    }),
  )

  function onSelect(key: string): void {
    const item = findMenuItemByKey(menu.tree, key)
    if (!item || item.external) return
    // 纯目录节点（无组件）点了不跳转，避免落空白页
    if (!canNavigate(router, key)) return
    if (route.name !== key) void router.push({ name: key })
  }

  return { menu, activeKey, onSelect }
}
