import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as RequestModule from '@/shared/api/request'

const { requestMock } = vi.hoisted(() => ({
  requestMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/shared/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof RequestModule>()
  return { ...actual, request: requestMock }
})

const { fetchUserInfo, login } = await import('../api/user.api')

const ok = (data: unknown) => ({ data: { code: 0, data, message: 'ok' } })

describe('user.api（决策 D8：token 归 user 实体）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login → POST /auth/login 携带用户名密码', async () => {
    requestMock.post.mockResolvedValueOnce(ok({ token: 't', user: { id: 1 } }))
    await expect(login('admin', 'admin123')).resolves.toMatchObject({ token: 't' })
    expect(requestMock.post).toHaveBeenCalledWith('/auth/login', {
      username: 'admin',
      password: 'admin123',
    })
  })

  it('fetchUserInfo → GET /user/info', async () => {
    requestMock.get.mockResolvedValueOnce(ok({ username: 'admin', roles: ['admin'] }))
    await expect(fetchUserInfo()).resolves.toMatchObject({ username: 'admin' })
    expect(requestMock.get).toHaveBeenCalledWith('/user/info')
  })

  it('features/auth/api/auth.api 仅做转发（与 user.api 同一函数引用）', async () => {
    const authApi = await import('@/features/auth/api/auth.api')
    expect(authApi.login).toBe(login)
    expect(authApi.fetchUserInfo).toBe(fetchUserInfo)
  })
})
