export type LayoutMode = 'sidebar' | 'top' | 'mix' | 'dual'

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
  /** 决策 D4 预留；本期恒为 'published' */
  publishStatus: 'draft' | 'published'
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface MenuTreeNode extends MenuRecord {
  children: MenuTreeNode[]
}

export interface BackendRouteNode {
  id: number
  parentId: number | null
  name: string
  path: string
  redirect?: string
  component?: string
  meta: {
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
  children?: BackendRouteNode[]
}

export interface MoveMenuPayload {
  id: number
  targetParentId: number | null
  /** 插入到该 id 之前；null / 省略 = 追加到末尾 */
  beforeId?: number | null
}

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface UserRecord {
  id: number
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  permissions: string[]
}

/** 登录成功载荷 */
export interface LoginPayload {
  token: string
}

/** 数据库行形态（snake_case），DAO 出口统一转 camelCase */
export interface MenuRow {
  id: number
  parent_id: number | null
  name: string
  path: string
  redirect: string | null
  component: string | null
  title: string
  title_key: string | null
  icon: string | null
  order_no: number
  keep_alive: number
  hide_in_menu: number
  hide_children_in_menu: number
  active_path: string | null
  external: number
  affix: number
  layout: string | null
  roles: string
  permissions: string
  status: number
  publish_status: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface UserRow {
  id: number
  username: string
  password: string
  nickname: string
  avatar: string | null
  roles: string
  permissions: string
  status: number
}
