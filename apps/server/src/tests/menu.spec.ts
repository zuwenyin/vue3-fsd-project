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

async function postMenu(payload: Record<string, unknown>) {
  return request(app)
    .post('/api/menus')
    .set('Authorization', `Bearer ${await auth()}`)
    .send(payload)
}

async function createTopLevel(name: string, path: string, extra: Record<string, unknown> = {}) {
  const res = await postMenu({ parentId: null, name, path, title: name, ...extra })
  expect(res.status).toBe(200)
  return res.body.data
}

describe('菜单 CRUD', () => {
  it('创建成功并返回完整记录', async () => {
    const menu = await createTopLevel('Audit', '/audit', { component: 'system/audit/index' })
    expect(menu.id).toBeGreaterThan(0)
    expect(menu.publishStatus).toBe('published')
    expect(menu.status).toBe(1)
    expect(Array.isArray(menu.roles)).toBe(true)
  })

  it('name 重复 → 409', async () => {
    await createTopLevel('Dup', '/dup')
    const res = await postMenu({ parentId: null, name: 'Dup', path: '/dup2', title: 'Dup2' })
    expect(res.status).toBe(409)
  })

  it('同父下 path 重复 → 409', async () => {
    await createTopLevel('SamePath', '/same')
    const res = await postMenu({ parentId: null, name: 'SamePath2', path: '/same', title: 'x' })
    expect(res.status).toBe(409)
  })

  it('不同父下 path 可重复', async () => {
    const parent = await createTopLevel('P', '/p', { component: null })
    const res = await postMenu({
      parentId: parent.id,
      name: 'ChildSame',
      path: '/same',
      title: 'c',
      component: 'system/x/index',
    })
    expect(res.status).toBe(200)
  })

  it('parentId 不存在 → 404', async () => {
    const res = await postMenu({ parentId: 99999, name: 'Orphan', path: '/orphan', title: 'o' })
    expect(res.status).toBe(404)
  })

  it('校验失败（缺 title）→ 422', async () => {
    const res = await postMenu({ parentId: null, name: 'NoTitle', path: '/no-title' })
    expect(res.status).toBe(422)
  })

  it('external=true 且 path 非 URL → 422', async () => {
    const res = await postMenu({
      parentId: null,
      name: 'Ext',
      path: 'not-a-url',
      title: 'ext',
      external: true,
    })
    expect(res.status).toBe(422)
  })

  it('external=true 且 path 为合法 URL → 200', async () => {
    const res = await postMenu({
      parentId: null,
      name: 'ExtOk',
      path: 'https://example.com',
      title: 'ext-ok',
      external: true,
    })
    expect(res.status).toBe(200)
  })

  it('component 不在白名单 / 前端不存在 → 仍创建成功（软校验，仅告警）', async () => {
    const res = await postMenu({
      parentId: null,
      name: 'UnknownComp',
      path: '/unknown-comp',
      title: '未知组件',
      component: 'whatever/missing/index',
    })
    expect(res.status).toBe(200)
    expect(res.body.data.component).toBe('whatever/missing/index')
  })

  it('publishStatus=draft → 422（决策 D4）', async () => {
    const res = await postMenu({
      parentId: null,
      name: 'Draft',
      path: '/draft',
      title: 'draft',
      publishStatus: 'draft',
    })
    expect(res.status).toBe(422)
  })

  it('子级 redirect 被自动清空', async () => {
    const parent = await createTopLevel('ParentR', '/parent-r', { component: null })
    const res = await postMenu({
      parentId: parent.id,
      name: 'ChildR',
      path: 'child-r',
      title: 'c',
      component: 'system/r/index',
      redirect: '/should-be-cleared',
    })
    expect(res.status).toBe(200)
    expect(res.body.data.redirect).toBeUndefined()
  })

  it('更新 title 生效', async () => {
    const menu = await createTopLevel('Upd', '/upd')
    const res = await request(app)
      .put(`/api/menus/${menu.id}`)
      .set('Authorization', `Bearer ${await auth()}`)
      .send({ title: '新标题' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('新标题')
  })

  it('parentId 指向自身 → 409', async () => {
    const menu = await createTopLevel('Self', '/self')
    const res = await request(app)
      .put(`/api/menus/${menu.id}`)
      .set('Authorization', `Bearer ${await auth()}`)
      .send({ parentId: menu.id })
    expect(res.status).toBe(409)
  })

  it('parentId 指向子孙 → 409', async () => {
    const parent = await createTopLevel('Anc', '/anc', { component: null })
    const child = await postMenu({
      parentId: parent.id,
      name: 'Desc',
      path: 'desc',
      title: 'd',
      component: 'system/d/index',
    })
    const res = await request(app)
      .put(`/api/menus/${parent.id}`)
      .set('Authorization', `Bearer ${await auth()}`)
      .send({ parentId: child.body.data.id })
    expect(res.status).toBe(409)
  })

  it('删除有子级且 cascade=false → 409', async () => {
    const parent = await createTopLevel('DelParent', '/del-parent', { component: null })
    await postMenu({
      parentId: parent.id,
      name: 'DelChild',
      path: 'del-child',
      title: 'c',
      component: 'system/dc/index',
    })
    const res = await request(app)
      .delete(`/api/menus/${parent.id}`)
      .set('Authorization', `Bearer ${await auth()}`)
    expect(res.status).toBe(409)
  })

  it('删除有子级且 cascade=true → 级联删除', async () => {
    const parent = await createTopLevel('DelP2', '/del-p2', { component: null })
    const child = await postMenu({
      parentId: parent.id,
      name: 'DelC2',
      path: 'del-c2',
      title: 'c',
      component: 'system/dc2/index',
    })
    const res = await request(app)
      .delete(`/api/menus/${parent.id}?cascade=true`)
      .set('Authorization', `Bearer ${await auth()}`)
    expect(res.status).toBe(200)

    const tree = await request(app)
      .get('/api/menus/tree')
      .set('Authorization', `Bearer ${await auth()}`)
    const flat: Array<{ id: number }> = []
    const walk = (nodes: Array<{ id: number; children?: unknown[] }>) => {
      for (const node of nodes) {
        flat.push(node)
        if (Array.isArray(node.children))
          walk(node.children as Array<{ id: number; children?: unknown[] }>)
      }
    }
    walk(tree.body.data)
    expect(flat.some((n) => n.id === child.body.data.id)).toBe(false)
  })

  it('删除不存在的菜单 → 404', async () => {
    const res = await request(app)
      .delete('/api/menus/99999')
      .set('Authorization', `Bearer ${await auth()}`)
    expect(res.status).toBe(404)
  })
})
