import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.js'
import { errorHandler } from '../middleware/error.js'
import { ApiError, ErrorCode } from '../shared/errors.js'

const app = createApp()

async function login(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' })
  return String(res.body.data.token)
}

describe('鉴权与健康检查', () => {
  it('无 token → 401 且业务码 401', async () => {
    const res = await request(app).get('/api/menus')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(401)
  })

  it('非法 token → 401', async () => {
    const res = await request(app).get('/api/menus').set('Authorization', 'Bearer bad.token')
    expect(res.status).toBe(401)
  })

  it('合法登录 → 200 + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(0)
    expect(typeof res.body.data.token).toBe('string')
  })

  it('密码错误 → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('登录参数缺失 → 422', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' })
    expect(res.status).toBe(422)
  })

  it('token 可用 → /api/user/info 返回用户', async () => {
    const token = await login()
    const res = await request(app).get('/api/user/info').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.username).toBe('admin')
    expect(Array.isArray(res.body.data.roles)).toBe(true)
  })
})

describe('兜底处理', () => {
  it('未命中路由 → 404 + JSON', async () => {
    // 除 /auth/login 外的 /api/* 先过鉴权，需带 token 才能触达 404
    const res = await request(app)
      .get('/api/not-exist')
      .set('Authorization', `Bearer ${await login()}`)
    expect(res.status).toBe(404)
    expect(res.body.code).toBe(404)
  })

  it('未命中路由且无 token → 401（鉴权先于 404）', async () => {
    const res = await request(app).get('/api/not-exist')
    expect(res.status).toBe(401)
  })

  it('未知路径（非 /api）→ 404', async () => {
    const res = await request(app).get('/whatever')
    expect(res.status).toBe(404)
  })

  it('未捕获异常 → 500 且不回吐堆栈', () => {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    errorHandler(new Error('boom'), {} as never, { status } as never, (() => undefined) as never)
    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({ code: 500, data: null, message: '服务异常' })
  })

  it('ApiError → 按其 code 回状态码', () => {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    errorHandler(
      new ApiError(ErrorCode.CONFLICT, '冲突'),
      {} as never,
      { status } as never,
      (() => undefined) as never,
    )
    expect(status).toHaveBeenCalledWith(409)
    expect(json).toHaveBeenCalledWith({ code: 409, data: null, message: '冲突' })
  })
})
