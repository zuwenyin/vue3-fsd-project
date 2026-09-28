import type { SqliteDatabase } from './driver.js'

interface SeedMenu {
  name: string
  parentName: string | null
  path: string
  /** 目录节点必须为 null（System 为纯分组目录） */
  component: string | null
  title: string
  icon: string
  orderNo: number
  hideInMenu?: boolean
  /** 路由级权限（docs/03 §6）：空数组表示不限制 */
  roles?: string[]
  permissions?: string[]
  /** 默认 true（保持既有种子行为）；显式 false 表示该页不进 keep-alive 缓存 */
  keepAlive?: boolean
  /** 固定页签：不可关闭（P6 Tabs 验收需要） */
  affix?: boolean
  /** i18n 键（决策 D2）：前端 resolveMenuTitle 优先取它，缺失回落 title */
  titleKey?: string
}

const MENUS: SeedMenu[] = [
  {
    // 固定页签（affix）：Tabs 中不可关闭，closeAll / LRU 淘汰时保留（docs/15 §3.2）
    name: 'Dashboard',
    parentName: null,
    path: '/dashboard',
    component: 'dashboard/index',
    title: '仪表盘',
    titleKey: 'menu.dashboard',
    icon: 'Odometer',
    orderNo: 10,
    affix: true,
  },
  {
    name: 'System',
    parentName: null,
    path: '/system',
    component: null,
    title: '系统管理',
    titleKey: 'menu.system',
    icon: 'Setting',
    orderNo: 100,
  },
  {
    name: 'SystemUser',
    parentName: 'System',
    path: 'user',
    component: 'system/user/index',
    title: '用户管理',
    titleKey: 'menu.systemUser',
    icon: 'User',
    orderNo: 10,
    permissions: ['system:user:view'],
  },
  {
    name: 'SystemMenu',
    parentName: 'System',
    path: 'menu',
    component: 'system/menu/index',
    title: '菜单管理',
    titleKey: 'menu.systemMenu',
    icon: 'Menu',
    orderNo: 20,
    permissions: ['system:menu:view'],
  },
  {
    // 3 级节点：用于四布局的多级菜单 / 面包屑演示，以及「3 级不能再加子级」的验收（docs/14 §5.4）
    name: 'SystemUserGroup',
    parentName: 'SystemUser',
    path: 'group',
    component: 'system/user/group/index',
    title: '用户分组',
    titleKey: 'menu.systemUserGroup',
    icon: 'Collection',
    orderNo: 10,
    permissions: ['system:user:view'],
  },
  {
    name: 'Profile',
    parentName: null,
    path: '/profile',
    component: 'profile/index',
    title: '个人中心',
    titleKey: 'menu.profile',
    icon: 'UserFilled',
    orderNo: 200,
    hideInMenu: true,
  },
]

const USERS = [
  {
    username: 'admin',
    password: 'admin123',
    nickname: '超级管理员',
    roles: ['admin'],
    permissions: ['*'],
  },
  {
    username: 'editor',
    password: 'editor123',
    nickname: '编辑',
    roles: ['editor'],
    permissions: ['system:menu:view'],
  },
]

/** SQLite datetime('now') 格式：YYYY-MM-DD HH:MM:SS */
function now(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const INSERT_MENU = `
INSERT INTO sys_menu (
  parent_id, name, path, redirect, component, title, title_key, icon, order_no,
  keep_alive, hide_in_menu, hide_children_in_menu, active_path, external, affix,
  layout, roles, permissions, status, publish_status, published_at, created_at, updated_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`

const INSERT_USER = `
INSERT INTO sys_user (username, password, nickname, avatar, roles, permissions, status)
VALUES (?,?,?,?,?,?,?)`

/** 幂等：仅当对应表为空时写入（按 name / username 判存在） */
export function seedIfEmpty(db: SqliteDatabase): void {
  const menuCount =
    db.prepare('SELECT COUNT(*) AS count FROM sys_menu').get<{ count: number }>()?.count ?? 0
  const userCount =
    db.prepare('SELECT COUNT(*) AS count FROM sys_user').get<{ count: number }>()?.count ?? 0

  db.transaction(() => {
    if (menuCount === 0) {
      const idByName = new Map<string, number>()
      for (const menu of MENUS) {
        const parentId = menu.parentName ? (idByName.get(menu.parentName) ?? null) : null
        const result = db
          .prepare(INSERT_MENU)
          .run(
            parentId,
            menu.name,
            menu.path,
            null,
            menu.component,
            menu.title,
            menu.titleKey ?? null,
            menu.icon,
            menu.orderNo,
            menu.keepAlive === false ? 0 : 1,
            menu.hideInMenu ? 1 : 0,
            0,
            null,
            0,
            menu.affix ? 1 : 0,
            null,
            JSON.stringify(menu.roles ?? []),
            JSON.stringify(menu.permissions ?? []),
            1,
            'published',
            now(),
            now(),
            now(),
          )
        idByName.set(menu.name, result.lastInsertRowid)
      }
    }

    if (userCount === 0) {
      for (const user of USERS) {
        db.prepare(INSERT_USER).run(
          user.username,
          user.password,
          user.nickname,
          null,
          JSON.stringify(user.roles),
          JSON.stringify(user.permissions),
          1,
        )
      }
    }
  })
}
