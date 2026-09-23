import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()

let token = ''

async function auth(): Promise<string> {
  if (!token) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
    token = String(res.body.data.token)
  }
  return token
}

async function createMenu(payload: Record<string, unknown>) {
  const res = await request(app)
    .post('/api/menus')
    .set('Authorization', `Bearer ${await auth()}`)
    .send(payload)
  expect(res.status).toBe(200)
  return res.body.data as { id: number; orderNo: number; parentId: number | null }
}

async function move(id: number, payload: Record<string, unknown>) {
  return request(app)
    .post(`/api/menus/${id}/move`)
    .set('Authorization', `Bearer ${await auth()}`)
    .send(payload)
}

async function createChild(parentId: number, name: string, path: string, orderNo: number) {
  return createMenu({
    parentId,
    name,
    path,
    title: name,
    component: 'system/x/index',
    orderNo,
  })
}

describe('拖拽排序', () => {
  it('首部插值：order_no = (prev + before) / 2', async () => {
    const parent = await createMenu({
      parentId: null,
      name: 'MvParent',
      path: '/mv',
      title: 'p',
      component: null,
    })
    const c1 = await createChild(parent.id, 'MvC1', 'mv-c1', 1000)
    const c2 = await createChild(parent.id, 'MvC2', 'mv-c2', 2000)
    const c3 = await createChild(parent.id, 'MvC3', 'mv-c3', 3000)

    const res = await move(c3.id, { targetParentId: parent.id, beforeId: c2.id })
    expect(res.status).toBe(200)
    expect(res.body.data.orderNo).toBe(1500)
    expect(c1.orderNo).toBe(1000)
    expect(c2.orderNo).toBe(2000)
  })

  it('尾部追加：order_no = last + 1000', async () => {
    const parent = await createMenu({
      parentId: null,
      name: 'ApParent',
      path: '/ap',
      title: 'p',
      component: null,
    })
    const a1 = await createChild(parent.id, 'ApC1', 'ap-c1', 1000)
    const a2 = await createChild(parent.id, 'ApC2', 'ap-c2', 2000)

    const res = await move(a1.id, { targetParentId: parent.id, beforeId: null })
    expect(res.status).toBe(200)
    expect(res.body.data.orderNo).toBe(a2.orderNo + 1000)
  })

  it('相邻步长不足时整体重排为 1000/2000/3000', async () => {
    const parent = await createMenu({
      parentId: null,
      name: 'RbParent',
      path: '/rb',
      title: 'p',
      component: null,
    })
    const r1 = await createChild(parent.id, 'RbC1', 'rb-c1', 1)
    const r2 = await createChild(parent.id, 'RbC2', 'rb-c2', 1.5)
    const r3 = await createChild(parent.id, 'RbC3', 'rb-c3', 2)

    const res = await move(r3.id, { targetParentId: parent.id, beforeId: r2.id })
    expect(res.status).toBe(200)

    const tree = await request(app)
      .get('/api/menus/tree')
      .set('Authorization', `Bearer ${await auth()}`)
    const root = (
      tree.body.data as Array<{ id: number; children?: Array<{ id: number; orderNo: number }> }>
    ).find((node) => node.id === parent.id)
    const orders = new Map((root?.children ?? []).map((child) => [child.id, child.orderNo]))
    expect(orders.get(r1.id)).toBe(1000)
    expect(orders.get(r3.id)).toBe(2000)
    expect(orders.get(r2.id)).toBe(3000)
  })

  it('跨层移动：parent 与 order 同时变更', async () => {
    const parentA = await createMenu({
      parentId: null,
      name: 'XParentA',
      path: '/xa',
      title: 'a',
      component: null,
    })
    const parentB = await createMenu({
      parentId: null,
      name: 'XParentB',
      path: '/xb',
      title: 'b',
      component: null,
    })
    const node = await createChild(parentA.id, 'XNode', 'x-node', 1000)

    const res = await move(node.id, { targetParentId: parentB.id, beforeId: null })
    expect(res.status).toBe(200)
    expect(res.body.data.parentId).toBe(parentB.id)
    expect(res.body.data.orderNo).toBe(1000)
  })

  it('连续拖拽 10 次后同层 order_no 仍单调有序', async () => {
    const parent = await createMenu({
      parentId: null,
      name: 'LoopParent',
      path: '/loop',
      title: 'p',
      component: null,
    })
    const ids: number[] = []
    for (let i = 1; i <= 5; i += 1) {
      const node = await createChild(parent.id, `LoopC${i}`, `loop-c${i}`, i * 1000)
      ids.push(node.id)
    }

    for (let i = 0; i < 10; i += 1) {
      const movingId = ids[i % ids.length] as number
      const beforeId = ids[(i + 2) % ids.length] as number
      if (movingId === beforeId) continue
      const res = await move(movingId, { targetParentId: parent.id, beforeId })
      expect(res.status).toBe(200)
    }

    const tree = await request(app)
      .get('/api/menus/tree')
      .set('Authorization', `Bearer ${await auth()}`)
    const root = (
      tree.body.data as Array<{ id: number; children?: Array<{ orderNo: number }> }>
    ).find((node) => node.id === parent.id)
    const orders = (root?.children ?? []).map((child) => child.orderNo)
    expect(orders).toHaveLength(ids.length)
    for (let i = 1; i < orders.length; i += 1) {
      expect((orders[i] as number) > (orders[i - 1] as number)).toBe(true)
    }
  })

  it('beforeId 不在目标层 → 404', async () => {
    const parent = await createMenu({
      parentId: null,
      name: 'BfParent',
      path: '/bf',
      title: 'p',
      component: null,
    })
    const node = await createChild(parent.id, 'BfNode', 'bf-node', 1000)
    const res = await move(node.id, { targetParentId: parent.id, beforeId: 99999 })
    expect(res.status).toBe(404)
  })

  it('targetParentId 不存在 → 404', async () => {
    const parent = await createMenu({
      parentId: null,
      name: 'TpParent',
      path: '/tp',
      title: 'p',
      component: null,
    })
    const node = await createChild(parent.id, 'TpNode', 'tp-node', 1000)
    const res = await move(node.id, { targetParentId: 99999 })
    expect(res.status).toBe(404)
  })
})

describe('层级上限（MAX_DEPTH = 3）', () => {
  it('第 3 层可创建', async () => {
    const l1 = await createMenu({
      parentId: null,
      name: 'L1',
      path: '/l1',
      title: 'l1',
      component: null,
    })
    const l2 = await createMenu({
      parentId: l1.id,
      name: 'L2',
      path: 'l2',
      title: 'l2',
      component: 'system/l2/index',
    })
    const res = await request(app)
      .post('/api/menus')
      .set('Authorization', `Bearer ${await auth()}`)
      .send({ parentId: l2.id, name: 'L3', path: 'l3', title: 'l3', component: 'system/l3/index' })
    expect(res.status).toBe(200)
  })

  it('第 4 层 → 422', async () => {
    const l1 = await createMenu({
      parentId: null,
      name: 'D1',
      path: '/d1',
      title: 'd1',
      component: null,
    })
    const l2 = await createMenu({
      parentId: l1.id,
      name: 'D2',
      path: 'd2',
      title: 'd2',
      component: 'system/d2/index',
    })
    const l3 = await createMenu({
      parentId: l2.id,
      name: 'D3',
      path: 'd3',
      title: 'd3',
      component: 'system/d3/index',
    })
    const res = await request(app)
      .post('/api/menus')
      .set('Authorization', `Bearer ${await auth()}`)
      .send({ parentId: l3.id, name: 'D4', path: 'd4', title: 'd4', component: 'system/d4/index' })
    expect(res.status).toBe(422)
  })

  it('移动导致超层 → 422', async () => {
    const p = await createMenu({
      parentId: null,
      name: 'OvP',
      path: '/ovp',
      title: 'p',
      component: null,
    })
    const q = await createMenu({
      parentId: p.id,
      name: 'OvQ',
      path: 'ovq',
      title: 'q',
      component: 'system/ovq/index',
    })
    // r 为顶层、高度 2（含一个子级）；移到深度 2 的 q 下 → 2 + 2 = 4 > 3
    const r = await createMenu({
      parentId: null,
      name: 'OvR',
      path: '/ovr',
      title: 'r',
      component: 'system/ovr/index',
    })
    await createMenu({
      parentId: r.id,
      name: 'OvS',
      path: 'ovs',
      title: 's',
      component: 'system/ovs/index',
    })

    const res = await move(r.id, { targetParentId: q.id })
    expect(res.status).toBe(422)
  })

  it('移动到自己的子孙下 → 409（先于层级校验）', async () => {
    const a = await createMenu({
      parentId: null,
      name: 'DscA',
      path: '/dsca',
      title: 'a',
      component: null,
    })
    const b = await createMenu({
      parentId: a.id,
      name: 'DscB',
      path: 'dscb',
      title: 'b',
      component: 'system/dscb/index',
    })
    const res = await move(a.id, { targetParentId: b.id })
    expect(res.status).toBe(409)
  })
})
