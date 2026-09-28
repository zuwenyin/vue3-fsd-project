/** MSW 侧使用的接口契约类型（与 `apps/server/src/shared/types.ts` 对齐，docs/11 §4） */

export interface UserInfo {
  id: number
  username: string
  nickname: string
  roles: string[]
  permissions: string[]
}

export interface MenuRecord {
  id: number
  parentId: number | null
  name: string
  path: string
  redirect?: string
  component: string | null
  title: string
  titleKey?: string
  icon?: string
  orderNo: number
  keepAlive: boolean
  hideInMenu: boolean
  hideChildrenInMenu: boolean
  external: boolean
  affix: boolean
  roles: string[]
  permissions: string[]
  status: 0 | 1
}

export interface BackendRouteNode {
  id: number
  parentId: number | null
  name: string
  path: string
  redirect?: string
  component: string | null
  meta: Record<string, unknown>
  children?: BackendRouteNode[]
}
