export type LayoutMode = 'sidebar' | 'top' | 'mix' | 'dual'

/** 后端下发的路由节点（docs/03 §1，与 apps/server 的 BackendRouteNode 同构） */
export interface BackendRouteNode {
  id: number
  parentId: number | null
  /** 路由唯一名，同时作为 Tabs / keep-alive 的 key */
  name: string
  /** 子路由为相对路径；顶级以 '/' 开头 */
  path: string
  redirect?: string
  /** 'system/user/index'（相对 src/pages）或 'Layout'；空 = 纯分组目录 */
  component?: string
  meta: RouteMetaPayload
  children?: BackendRouteNode[]
}

export interface RouteMetaPayload {
  title: string
  titleKey?: string
  icon?: string
  order?: number
  keepAlive?: boolean
  hideInMenu?: boolean
  hideChildrenInMenu?: boolean
  activePath?: string
  external?: boolean
  roles?: string[]
  permissions?: string[]
  affix?: boolean
  layout?: LayoutMode
}

/** 侧边栏 / 面包屑 / Tabs 消费的菜单项（docs/03 §5） */
export interface MenuItem {
  /** route.name */
  key: string
  /** 可跳转路径（子级已拼接父级） */
  path: string
  title: string
  /** 决策 D2：i18n key，P7 接入后生效 */
  titleKey?: string
  icon?: string
  affix?: boolean
  children?: MenuItem[]
}

/** 管理视图（docs/14）读写的扁平记录，与 apps/server 的 MenuRecord 同构 */
export interface MenuRecord {
  id: number
  parentId: number | null
  name: string
  path: string
  redirect?: string
  component?: string
  title: string
  titleKey?: string
  icon?: string
  orderNo: number
  keepAlive: boolean
  hideInMenu: boolean
  hideChildrenInMenu: boolean
  activePath?: string
  external: boolean
  affix: boolean
  layout?: LayoutMode
  roles: string[]
  permissions: string[]
  status: 0 | 1
  /** 决策 D4：本期恒为 'published' */
  publishStatus: 'draft' | 'published'
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}
