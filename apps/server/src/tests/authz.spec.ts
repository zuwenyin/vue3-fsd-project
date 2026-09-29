import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()

/** 登录拿 token（seed：admin/permissions=['*']、editor/permissions=['system:menu:view']） */
async function login(username: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ username, password })
  expect(res.status).toBe(200)
  return String(res.body.data.token)
}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

describe('权限点校验（P10，决策 D5 由「不启用」改为启用）', () => {
  it('editor 有 system:menu:view → 读接口 200', async () => {
    const token = await login('editor', 'editor123')

    const list = await request(app).get('/api/menus').set(bearer(token))
    const tree = await request(app).get('/api/menus/tree').set(bearer(token))

    expect(list.status).toBe(200)
    expect(list.body.code).toBe(0)
    expect(tree.status).toBe(200)
    expect(tree.body.code).toBe(0)
  })

  it('editor 缺 system:menu:edit → 四个写接口全部 403', async () => {
    const token = await login('editor', 'editor123')
    const auth = bearer(token)

    const created = await request(app).post('/api/menus').set(auth).send({
      parentId: null,
      name: 'Forbidden',
      path: '/forbidden',
      title: 'F',
    })
    const updated = await request(app).put('/api/menus/1').set(auth).send({ title: 'x' })
    const removed = await request(app).delete('/api/menus/1').set(auth)
    const moved = await request(app)
      .post('/api/menus/1/move')
      .set(auth)
      .send({ targetParentId: null })

    for (const res of [created, updated, removed, moved]) {
      expect(res.status).toBe(403)
      expect(res.body.code).toBe(403)
    }
    // message 指明所缺权限点，便于排查
    expect(String(created.body.message)).toContain('system:menu:edit')
  })

  it('admin（permissions 含 *）读写均通过', async () => {
    const token = await login('admin', 'admin123')
    const auth = bearer(token)

    const list = await request(app).get('/api/menus').set(auth)
    expect(list.status).toBe(200)

    const created = await request(app).post('/api/menus').set(auth).send({
      parentId: null,
      name: 'AdminCreated',
      path: '/admin-created',
      title: 'AC',
    })
    expect(created.status).toBe(200)
    expect(created.body.code).toBe(0)
  })

  it('无 token 仍是 401（鉴权先于权限校验）', async () => {
    const res = await request(app).get('/api/menus')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(401)
  })
})
