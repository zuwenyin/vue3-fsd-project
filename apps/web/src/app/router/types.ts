import type { LayoutMode } from '@/entities/menu'

/** 路由 meta 扩展（docs/13 §4） */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    titleKey?: string
    icon?: string
    order?: number
    keepAlive?: boolean
    hideInMenu?: boolean
    hideChildrenInMenu?: boolean
    activePath?: string
    external?: boolean
    affix?: boolean
    roles?: string[]
    permissions?: string[]
    public?: boolean
    layout?: LayoutMode
  }
}
