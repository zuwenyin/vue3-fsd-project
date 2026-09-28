import { defineStore } from 'pinia'
import { buildMenuTree } from '../lib/build-tree'
import type { BackendRouteNode, MenuItem } from '../model/types'

/** 菜单树与原始路由树（路由树与菜单树同源不同形，docs/03 §5） */
export const useMenuStore = defineStore('menu', {
  state: () => ({
    tree: [] as MenuItem[],
    rawRoutes: [] as BackendRouteNode[],
    /** 决策 D13：hasDirty 唯一归属 menuStore；useMenuManagement 只读 */
    hasDirty: false,
  }),
  actions: {
    setRoutes(routes: BackendRouteNode[]): MenuItem[] {
      this.rawRoutes = routes
      this.tree = buildMenuTree(routes)
      return this.tree
    },
    setTree(tree: MenuItem[]): void {
      this.tree = tree
    },
    /** 有未应用的菜单变更（保存 / 拖拽 / 增删后置位，「应用变更」成功后清零） */
    markDirty(): void {
      this.hasDirty = true
    },
    clearDirty(): void {
      this.hasDirty = false
    },
    clear(): void {
      this.tree = []
      this.rawRoutes = []
      this.hasDirty = false
    },
  },
})
