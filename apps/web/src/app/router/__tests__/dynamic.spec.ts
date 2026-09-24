import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMenuStore, type BackendRouteNode } from '@/entities/menu'
import { useUserStore } from '@/entities/user'
import { constantRoutes, LAYOUT_ROUTE_NAME } from '../constant-routes'
import { applyRoutes, clearDynamicRoutes, getDynamicRouteNames } from '../dynamic'

/** 单测中不加载真实页面组件（docs/13 §7：glob 在 vitest 中不可用），用白名单模拟命中/未命中 */
const { AVAILABLE_PAGES } = vi.hoisted(() => ({
  AVAILABLE_PAGES: ['dashboard/index', 'system/user/index', 'system/menu/index', 'profile/index'],
}))

vi.mock('@/shared/lib/page-modules', () => ({
  pageComponentKeys: AVAILABLE_PAGES,
  resolvePageComponent: (component?: string) =>
    component && AVAILABLE_PAGES.includes(component) ? { name: `stub-${component}` } : undefined,
}))

vi.mock('@/entities/menu/api/menu.api', () => ({
  fetchUserRoutes: vi.fn(),
}))

vi.mock('@/entities/user/api/user.api', () => ({
  login: vi.fn(),
  fetchUserInfo: vi.fn(),
}))

const { fetchUserRoutes } = await import('@/entities/menu/api/menu.api')
const fetchMock = vi.mocked(fetchUserRoutes)
const { fetchUserInfo } = await import('@/entities/user/api/user.api')
const infoMock = vi.mocked(fetchUserInfo)

const ROUTES: BackendRouteNode[] = [
  {
    id: 1,
    parentId: null,
    name: 'Dashboard',
    path: '/dashboard',
    component: 'dashboard/index',
    meta: { title: '仪表盘', order: 10 },
  },
  {
    id: 2,
    parentId: null,
    name: 'System',
    path: '/system',
    meta: { title: '系统管理', order: 100 },
    children: [
      {
        id: 3,
        parentId: 2,
        name: 'SystemUser',
        path: 'user',
        component: 'system/user/index',
        meta: { title: '用户管理', order: 10, permissions: ['system:user:view'] },
      },
      {
        id: 4,
        parentId: 2,
        name: 'SystemMenu',
        path: 'menu',
        component: 'system/menu/index',
        meta: { title: '菜单管理', order: 20, permissions: ['system:menu:view'] },
      },
    ],
  },
  {
    id: 5,
    parentId: null,
    name: 'Profile',
    path: '/profile',
    component: 'profile/index',
    meta: { title: '个人中心', order: 200, hideInMenu: true },
  },
]

function createTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes: constantRoutes })
}

/** 已登录且画像已加载（登录后的常规状态） */
function login(roles: string[], permissions: string[]) {
  const user = useUserStore()
  user.token = 'test-token'
  user.roles = roles
  user.permissions = permissions
  user.profile = { id: 1, username: 'u', nickname: 'u', roles, permissions }
  return user
}

/** 刷新场景：store 里只有从 storage 恢复的 token，画像为空 */
function loginWithTokenOnly() {
  const user = useUserStore()
  user.token = 'test-token'
  user.profile = null
  user.roles = []
  user.permissions = []
  return user
}

describe('applyRoutes（动态路由注册与热替换）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(structuredClone(ROUTES))
    infoMock.mockReset()
    infoMock.mockResolvedValue({
      id: 1,
      username: 'editor',
      nickname: '编辑',
      roles: ['editor'],
      permissions: ['system:menu:view'],
    })
  })

  it('刷新场景：store 里只有 token 时，先拉取用户信息再过滤路由', async () => {
    loginWithTokenOnly()
    const router = createTestRouter()

    await applyRoutes(router)

    expect(infoMock).toHaveBeenCalled()
    // 拉到的权限是「仅 system:menu:view」→ SystemUser 不应被注册
    expect(router.hasRoute('SystemMenu')).toBe(true)
    expect(router.hasRoute('SystemUser')).toBe(false)
    expect(useUserStore().roles).toEqual(['editor'])
  })

  it('admin：全部路由挂到 Layout 之下，菜单树含 3 级结构', async () => {
    login(['admin'], ['*'])
    const router = createTestRouter()

    const tree = await applyRoutes(router)

    expect(router.hasRoute('Dashboard')).toBe(true)
    expect(router.hasRoute('System')).toBe(true)
    expect(router.hasRoute('SystemUser')).toBe(true)
    // Profile 只是 hideInMenu，仍应注册（直连 URL 可达）
    expect(router.hasRoute('Profile')).toBe(true)
    expect(router.resolve('/system/user').name).toBe('SystemUser')
    expect(router.resolve('/system/user').matched[0]?.name).toBe(LAYOUT_ROUTE_NAME)

    expect(tree.map((item) => item.key)).toEqual(['Dashboard', 'System'])
    expect(tree[1]?.children?.map((item) => item.key)).toEqual(['SystemUser', 'SystemMenu'])
  })

  it('editor：无权限的路由不注册，直连 URL 落 NotFound，菜单树同步过滤', async () => {
    login(['editor'], ['system:menu:view'])
    const router = createTestRouter()

    const tree = await applyRoutes(router)

    expect(router.hasRoute('SystemUser')).toBe(false)
    expect(router.hasRoute('SystemMenu')).toBe(true)
    // 未注册 → 命中顶层通配 404
    expect(router.resolve('/system/user').name).toBe('NotFound')

    // System 只剩一个可见子节点 → 按规则折叠为 SystemMenu
    expect(tree.map((item) => item.key)).toEqual(['Dashboard', 'SystemMenu'])
    expect(useMenuStore().tree[1]?.path).toBe('/system/menu')
  })

  it('热替换：后端删除节点后再次应用，旧路由被精确移除（其余保留）', async () => {
    login(['admin'], ['*'])
    const router = createTestRouter()
    await applyRoutes(router)

    fetchMock.mockResolvedValue(
      structuredClone(ROUTES).map((node) => ({
        ...node,
        children: node.children?.filter((child) => child.name !== 'SystemMenu'),
      })),
    )
    await applyRoutes(router)

    expect(router.hasRoute('SystemMenu')).toBe(false)
    expect(router.hasRoute('SystemUser')).toBe(true)
    expect(getDynamicRouteNames()).not.toContain('SystemMenu')
  })

  it('登出清理：clearDynamicRoutes 后动态路由全部移除，常量路由保留', async () => {
    login(['admin'], ['*'])
    const router = createTestRouter()
    await applyRoutes(router)

    clearDynamicRoutes(router)

    expect(getDynamicRouteNames()).toEqual([])
    expect(router.hasRoute('SystemUser')).toBe(false)
    expect(router.hasRoute('Login')).toBe(true)
    expect(router.hasRoute('NotFound')).toBe(true)
  })

  it('component 拼错：整节点丢弃（不注册、不崩溃）', async () => {
    login(['admin'], ['*'])
    const router = createTestRouter()
    fetchMock.mockResolvedValue([
      {
        id: 9,
        parentId: null,
        name: 'Broken',
        path: '/broken',
        component: 'not/exist/index',
        meta: { title: '坏节点' },
      },
    ])
    const tree = await applyRoutes(router)

    expect(router.hasRoute('Broken')).toBe(false)
    // 菜单树按 docs/13 §3.1 由「过滤后」节点生成，故仍列出该节点；点击落 404（降级不崩溃）
    expect(tree.map((item) => item.key)).toEqual(['Broken'])
    expect(router.resolve('/broken').name).toBe('NotFound')
  })
})
