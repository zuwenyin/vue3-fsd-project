import { http, HttpResponse } from 'msw'
import { MOCK_MENUS, toMenuTree } from '../data'
import type { MenuRecord } from '../types'

function ok<T>(data: T) {
  return HttpResponse.json({ code: 0, data, message: 'ok' })
}

/**
 * 菜单管理接口（docs/06 §9：仅供测试/离线兜底；开发期真实数据来自 apps/server）。
 * 只做最小可用实现：读写内存数组，校验语义（层级/占用）交由真实服务兜底。
 */
export const menuHandlers = [
  http.get('/api/menus', () => ok(MOCK_MENUS)),

  http.get('/api/menus/tree', () => ok(toMenuTree())),

  http.post('/api/menus', async ({ request }) => {
    const body = (await request.json()) as Partial<MenuRecord>
    const record: MenuRecord = {
      id: Math.max(...MOCK_MENUS.map((item) => item.id)) + 1,
      parentId: body.parentId ?? null,
      name: body.name ?? '',
      path: body.path ?? '',
      component: body.component ?? null,
      title: body.title ?? '',
      titleKey: body.titleKey,
      icon: body.icon,
      orderNo: body.orderNo ?? 999,
      keepAlive: body.keepAlive ?? true,
      hideInMenu: body.hideInMenu ?? false,
      hideChildrenInMenu: body.hideChildrenInMenu ?? false,
      external: body.external ?? false,
      affix: body.affix ?? false,
      roles: body.roles ?? [],
      permissions: body.permissions ?? [],
      status: body.status ?? 1,
    }
    MOCK_MENUS.push(record)
    return ok(record)
  }),

  http.put('/api/menus/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const patch = (await request.json()) as Partial<MenuRecord>
    const index = MOCK_MENUS.findIndex((item) => item.id === id)
    if (index < 0) {
      return HttpResponse.json({ code: 404, data: null, message: '菜单不存在' }, { status: 404 })
    }
    // 用 Object.assign 而非对象展开：`Partial<MenuRecord>` 展开后必填字段会变可选
    const current = MOCK_MENUS[index]
    if (!current) {
      return HttpResponse.json({ code: 404, data: null, message: '菜单不存在' }, { status: 404 })
    }
    const next = Object.assign({}, current, patch, { id })
    MOCK_MENUS[index] = next
    return ok(next)
  }),

  http.delete('/api/menus/:id', ({ params }) => {
    const id = Number(params.id)
    const index = MOCK_MENUS.findIndex((item) => item.id === id)
    if (index < 0) {
      return HttpResponse.json({ code: 404, data: null, message: '菜单不存在' }, { status: 404 })
    }
    MOCK_MENUS.splice(index, 1)
    return ok({ id })
  }),

  http.post('/api/menus/:id/move', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json()) as {
      targetParentId: number | null
      beforeId?: number | null
    }
    const index = MOCK_MENUS.findIndex((item) => item.id === id)
    if (index < 0) {
      return HttpResponse.json({ code: 404, data: null, message: '菜单不存在' }, { status: 404 })
    }
    const current = MOCK_MENUS[index]
    if (!current) {
      return HttpResponse.json({ code: 404, data: null, message: '菜单不存在' }, { status: 404 })
    }
    const next = Object.assign({}, current, { parentId: body.targetParentId ?? null })
    MOCK_MENUS[index] = next
    return ok(next)
  }),
]
