import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as RequestModule from '@/shared/api/request'
import type { MenuFormModel } from '../model/types'

const { requestMock } = vi.hoisted(() => ({
  requestMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// 保留真实 unwrap（只替换 axios 实例），以便同时验证解包与错误抛出
vi.mock('@/shared/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof RequestModule>()
  return { ...actual, request: requestMock }
})

const { fetchUserRoutes, menuApi } = await import('../api/menu.api')

const ok = (data: unknown) => ({ data: { code: 0, data, message: 'ok' } })
const payload = { name: 'X' } as unknown as MenuFormModel

describe('menu.api（docs/14 §6）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchUserRoutes → GET /user/routes 并解包 data', async () => {
    requestMock.get.mockResolvedValueOnce(ok([{ id: 1 }]))
    await expect(fetchUserRoutes()).resolves.toEqual([{ id: 1 }])
    expect(requestMock.get).toHaveBeenCalledWith('/user/routes')
  })

  it('list / tree → GET /menus、/menus/tree', async () => {
    requestMock.get.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok([]))
    await menuApi.list()
    await menuApi.tree()
    expect(requestMock.get).toHaveBeenNthCalledWith(1, '/menus')
    expect(requestMock.get).toHaveBeenNthCalledWith(2, '/menus/tree')
  })

  it('create / update → POST /menus、PUT /menus/:id', async () => {
    requestMock.post.mockResolvedValueOnce(ok({ id: 9 }))
    requestMock.put.mockResolvedValueOnce(ok({ id: 9 }))
    await menuApi.create(payload)
    await menuApi.update(9, payload)
    expect(requestMock.post).toHaveBeenCalledWith('/menus', payload)
    expect(requestMock.put).toHaveBeenCalledWith('/menus/9', payload)
  })

  it('remove → DELETE /menus/:id，cascade 走查询参数', async () => {
    requestMock.delete.mockResolvedValue(ok({ id: 3 }))
    await menuApi.remove(3)
    await menuApi.remove(3, true)
    expect(requestMock.delete).toHaveBeenNthCalledWith(1, '/menus/3', {
      params: { cascade: false },
    })
    expect(requestMock.delete).toHaveBeenNthCalledWith(2, '/menus/3', {
      params: { cascade: true },
    })
  })

  it('move → POST /menus/:id/move 携带完整载荷', async () => {
    requestMock.post.mockResolvedValueOnce(ok({ id: 5 }))
    const move = { id: 5, targetParentId: null, beforeId: 2 }
    await menuApi.move(move)
    expect(requestMock.post).toHaveBeenCalledWith('/menus/5/move', move)
  })

  it('unwrap：code !== 0 抛错并携带服务端 message', async () => {
    requestMock.get.mockResolvedValueOnce({ data: { code: 409, data: null, message: 'name 重复' } })
    await expect(menuApi.list()).rejects.toThrow('name 重复')
  })
})
