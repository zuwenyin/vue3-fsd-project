import { defineStore } from 'pinia'
import { buildMenuTree } from '../lib/build-tree'
import type { BackendRouteNode, MenuItem } from '../model/types'

/** 菜单树与原始路由树（路由树与菜单树同源不同形，docs/03 §5） */
export const useMenuStore = defineStore('menu', {
  state: () => ({
    tree: [] as MenuItem[],
    rawRoutes: [] as BackendRouteNode[],
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
    clear(): void {
      this.tree = []
      this.rawRoutes = []
    },
  },
})
