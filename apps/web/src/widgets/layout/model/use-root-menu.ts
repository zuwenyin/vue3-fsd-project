import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { canNavigate, findMenuItemByKey, findRootKey, stripChildren } from './menu-active'
import { useMenuNavigation } from './use-menu-navigation'

/**
 * mix / dual 共用的「一级菜单 + 次级栏」联动：
 * - 一级栏只渲染一级项，点击只切换次级栏（目录节点没有可跳转路由，不能 push）；
 * - 次级栏渲染当前一级项的子树；
 * - `activeRoot` 跟随当前路由（含 `meta.activePath` 回指）自动同步。
 */
export function useRootMenu() {
  const router = useRouter()
  const { menu, activeKey, onSelect } = useMenuNavigation()

  const rootsOnly = computed(() => stripChildren(menu.tree))
  const activeRoot = ref('')
  const subItems = computed(() => findMenuItemByKey(menu.tree, activeRoot.value)?.children ?? [])

  watch(
    activeKey,
    (key) => {
      const root = key ? findRootKey(menu.tree, key) : null
      if (root) activeRoot.value = root
    },
    { immediate: true },
  )

  function onRootSelect(key: string): void {
    activeRoot.value = key
    const item = findMenuItemByKey(menu.tree, key)
    if (!item || item.external) return
    // ★ 目录节点（注册了 name 但没有 component）只切次级栏；
    //   只看 hasRoute 会把它 push 到无组件的空白页（实测：点「系统管理」落 /system 空白）
    if (canNavigate(router, key)) void router.push({ name: key })
  }

  return { menu, activeKey, onSelect, activeRoot, rootsOnly, subItems, onRootSelect }
}
