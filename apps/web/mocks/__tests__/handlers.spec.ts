import { describe, expect, it } from 'vitest'
import { MOCK_TOKEN } from '../data'
import type { BackendRouteNode, MenuRecord, UserInfo } from '../types'

/**
 * MSW handlers 契约测试（docs/06 §9）：数据形状必须与 `docs/11` §4 一致，
 * 避免「测试用的假数据」与真实服务漂移。
 */
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

const authHeaders = { Authorization: `Bearer ${MOCK_TOKEN}` }

async function postLogin(username: string, password: string): Promise<Response> {
  return fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

describe('mocks/handlers 契约', () => {
  it('POST /api/auth/login：admin 成功返回 token', async () => {
    const res = await postLogin('admin', 'admin123')
    const body = (await res.json()) as ApiResponse<{ token: string }>
    expect(res.status).toBe(200)
    expect(body.code).toBe(0)
    expect(body.data.token).toBe(MOCK_TOKEN)
  })

  it('POST /api/auth/login：错误密码返回 401', async () => {
    const res = await postLogin('admin', 'wrong')
    expect(res.status).toBe(401)
  })

  it('GET /api/user/info：带 token 返回画像，无 token 401', async () => {
    const ok = await fetch('/api/user/info', { headers: authHeaders })
    const body = (await ok.json()) as ApiResponse<UserInfo>
    expect(ok.status).toBe(200)
    expect(body.data.username).toBe('admin')
    expect(body.data.permissions).toContain('system:menu:edit')

    const unauthorized = await fetch('/api/user/info')
    expect(unauthorized.status).toBe(401)
  })

  it('GET /api/user/routes：3 级路由树 + meta 契约（titleKey / permissions / affix）', async () => {
    const res = await fetch('/api/user/routes', { headers: authHeaders })
    const body = (await res.json()) as ApiResponse<BackendRouteNode[]>

    expect(res.status).toBe(200)
    const dashboard = body.data.find((node) => node.name === 'Dashboard')
    expect(dashboard?.meta.titleKey).toBe('menu.dashboard')
    expect(dashboard?.meta.affix).toBe(true)

    const system = body.data.find((node) => node.name === 'System')
    const user = system?.children?.find((node) => node.name === 'SystemUser')
    const group = user?.children?.[0]
    // 3 级节点（docs/14 §5.4 层级上限的验证数据）
    expect(group?.name).toBe('SystemUserGroup')
    expect(group?.path).toBe('group')
    expect(group?.meta.permissions).toEqual(['system:user:view'])
    // 目录节点无组件（与真实后端一致）
    expect(system?.component ?? null).toBeNull()
  })

  it('GET /api/menus/tree：管理树包含隐藏项（Profile）与 children 数组', async () => {
    const res = await fetch('/api/menus/tree', { headers: authHeaders })
    const body = (await res.json()) as ApiResponse<Array<MenuRecord & { children: unknown[] }>>

    expect(res.status).toBe(200)
    const profile = body.data.find((menu) => menu.name === 'Profile')
    expect(profile?.hideInMenu).toBe(true)
    expect(Array.isArray(profile?.children)).toBe(true)
    // 顶级 3 个：Dashboard / System / Profile（System 下挂 SystemUser、SystemMenu，SystemUser 下再挂 SystemUserGroup）
    expect(body.data).toHaveLength(3)
  })
})
