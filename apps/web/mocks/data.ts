/**
 * MSW 内存数据（仅测试 / 离线兜底，docs/06 §9）。
 * 结构与 `docs/11` §4 / `docs/03` §1 契约保持一致（3 级路由树），避免与真实服务漂移。
 */
import type { BackendRouteNode, MenuRecord, UserInfo } from './types'

export const MOCK_TOKEN = 'mock-token-admin'

export const MOCK_USERS: Record<string, UserInfo> = {
  [MOCK_TOKEN]: {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    roles: ['admin'],
    permissions: ['system:user:view', 'system:menu:view', 'system:menu:edit'],
  },
}

/** 与后端 `GET /api/menus`（扁平，camelCase）一致的管理记录 */
export const MOCK_MENUS: MenuRecord[] = [
  {
    id: 1,
    parentId: null,
    name: 'Dashboard',
    path: '/dashboard',
    component: 'dashboard/index',
    title: '仪表盘',
    titleKey: 'menu.dashboard',
    icon: 'Odometer',
    orderNo: 10,
    keepAlive: true,
    hideInMenu: false,
    hideChildrenInMenu: false,
    external: false,
    affix: true,
    roles: [],
    permissions: [],
    status: 1,
  },
  {
    id: 2,
    parentId: null,
    name: 'System',
    path: '/system',
    component: null,
    title: '系统管理',
    titleKey: 'menu.system',
    icon: 'Setting',
    orderNo: 100,
    keepAlive: true,
    hideInMenu: false,
    hideChildrenInMenu: false,
    external: false,
    affix: false,
    roles: [],
    permissions: [],
    status: 1,
  },
  {
    id: 3,
    parentId: 2,
    name: 'SystemUser',
    path: 'user',
    component: 'system/user/index',
    title: '用户管理',
    titleKey: 'menu.systemUser',
    icon: 'User',
    orderNo: 10,
    keepAlive: true,
    hideInMenu: false,
    hideChildrenInMenu: false,
    external: false,
    affix: false,
    roles: [],
    permissions: ['system:user:view'],
    status: 1,
  },
  {
    id: 4,
    parentId: 2,
    name: 'SystemMenu',
    path: 'menu',
    component: 'system/menu/index',
    title: '菜单管理',
    titleKey: 'menu.systemMenu',
    icon: 'Menu',
    orderNo: 20,
    keepAlive: true,
    hideInMenu: false,
    hideChildrenInMenu: false,
    external: false,
    affix: false,
    roles: [],
    permissions: ['system:menu:view'],
    status: 1,
  },
  {
    id: 5,
    parentId: 3,
    name: 'SystemUserGroup',
    path: 'group',
    component: 'system/user/group/index',
    title: '用户分组',
    titleKey: 'menu.systemUserGroup',
    icon: 'Collection',
    orderNo: 10,
    keepAlive: true,
    hideInMenu: false,
    hideChildrenInMenu: false,
    external: false,
    affix: false,
    roles: [],
    permissions: ['system:user:view'],
    status: 1,
  },
  {
    id: 6,
    parentId: null,
    name: 'Profile',
    path: '/profile',
    component: 'profile/index',
    title: '个人中心',
    titleKey: 'menu.profile',
    icon: 'UserFilled',
    orderNo: 200,
    keepAlive: true,
    hideInMenu: true,
    hideChildrenInMenu: false,
    external: false,
    affix: false,
    roles: [],
    permissions: [],
    status: 1,
  },
]

/** 扁平记录 → 后端下发的路由树（`GET /api/user/routes` / `GET /api/menus/tree` 同源不同形） */
export function toRouteTree(records: MenuRecord[] = MOCK_MENUS): BackendRouteNode[] {
  return buildRouteNodes(records, null)
}

function buildRouteNodes(records: MenuRecord[], parentId: number | null): BackendRouteNode[] {
  return records
    .filter((record) => record.parentId === parentId && record.status === 1)
    .sort((a, b) => a.orderNo - b.orderNo || a.id - b.id)
    .map((record) => {
      const children = buildRouteNodes(records, record.id)
      return {
        id: record.id,
        parentId: record.parentId,
        name: record.name,
        path: record.path,
        redirect: record.redirect,
        component: record.component,
        meta: {
          title: record.title,
          titleKey: record.titleKey,
          icon: record.icon,
          order: record.orderNo,
          keepAlive: record.keepAlive,
          hideInMenu: record.hideInMenu,
          hideChildrenInMenu: record.hideChildrenInMenu,
          external: record.external,
          affix: record.affix,
          roles: record.roles,
          permissions: record.permissions,
        },
        ...(children.length > 0 ? { children } : {}),
      }
    })
}

/** 管理树（`GET /api/menus/tree`）：含停用 / 隐藏项 */
export function toMenuTree(records: MenuRecord[] = MOCK_MENUS) {
  const build = (parentId: number | null): Array<MenuRecord & { children: unknown[] }> =>
    records
      .filter((record) => record.parentId === parentId)
      .sort((a, b) => a.orderNo - b.orderNo || a.id - b.id)
      .map((record) => ({ ...record, children: build(record.id) }))
  return build(null)
}
