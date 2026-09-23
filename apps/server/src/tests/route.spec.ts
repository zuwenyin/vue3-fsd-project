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

interface RouteNode {
  id: number
  name: string
  path: string
  component?: string
  meta: Record<string, unknown>
  children?: RouteNode[]
}

async function getRoutes(): Promise<RouteNode[]> {
  const res = await request(app)
    .get('/api/user/routes')
    .set('Authorization', `Bearer ${await auth()}`)
  expect(res.status).toBe(200)
  return res.body.data as RouteNode[]
}

describe('路由树生成', () => {
  it('返回树形结构且顶层 path 保留', async () => {
    const routes = await getRoutes()
    const dashboard = routes.find((node) => node.name === 'Dashboard')
    expect(dashboard?.path).toBe('/dashboard')
    expect(dashboard?.component).toBe('dashboard/index')
  })

  it('目录节点（component 为空）有子节点时不输出 component', async () => {
    const routes = await getRoutes()
    const system = routes.find((node) => node.name === 'System')
    expect(system).toBeDefined()
    expect(system?.component).toBeUndefined()
    expect(system?.children?.length).toBeGreaterThan(0)
  })

  it('子级 path 保持相对', async () => {
    const routes = await getRoutes()
    const system = routes.find((node) => node.name === 'System')
    expect(system?.children?.map((child) => child.path)).toEqual(['user', 'menu'])
  })

  it('status = 0 的菜单不出现在路由树中', async () => {
    const created = await request(app)
      .post('/api/menus')
      .set('Authorization', `Bearer ${await auth()}`)
      .send({
        parentId: null,
        name: 'Disabled',
        path: '/disabled',
        title: '停用菜单',
        component: 'system/dis/index',
      })
    expect(created.status).toBe(200)

    await request(app)
      .put(`/api/menus/${created.body.data.id}`)
      .set('Authorization', `Bearer ${await auth()}`)
      .send({ status: 0 })

    const routes = await getRoutes()
    expect(routes.some((node) => node.name === 'Disabled')).toBe(false)

    const tree = await request(app)
      .get('/api/menus/tree')
      .set('Authorization', `Bearer ${await auth()}`)
    const names: string[] = []
    const walk = (nodes: Array<{ name: string; children?: unknown[] }>) => {
      for (const node of nodes) {
        names.push(node.name)
        if (Array.isArray(node.children))
          walk(node.children as Array<{ name: string; children?: unknown[] }>)
      }
    }
    walk(tree.body.data)
    expect(names).toContain('Disabled')
  })

  it('hideInMenu = true 的菜单仍返回（由前端隐藏）', async () => {
    const routes = await getRoutes()
    const profile = routes.find((node) => node.name === 'Profile')
    expect(profile).toBeDefined()
    expect(profile?.meta.hideInMenu).toBe(true)
  })

  it('目录节点无子节点 → 整节点丢弃', async () => {
    const created = await request(app)
      .post('/api/menus')
      .set('Authorization', `Bearer ${await auth()}`)
      .send({
        parentId: null,
        name: 'EmptyGroup',
        path: '/empty-group',
        title: '空目录',
        component: null,
      })
    expect(created.status).toBe(200)

    const routes = await getRoutes()
    expect(routes.some((node) => node.name === 'EmptyGroup')).toBe(false)
  })

  it('空权限数组不写入 meta', async () => {
    const routes = await getRoutes()
    const dashboard = routes.find((node) => node.name === 'Dashboard')
    expect(dashboard?.meta.roles).toBeUndefined()
    expect(dashboard?.meta.permissions).toBeUndefined()
  })

  it('meta 包含 title / icon / order / keepAlive', async () => {
    const routes = await getRoutes()
    const dashboard = routes.find((node) => node.name === 'Dashboard')
    expect(dashboard?.meta.title).toBe('仪表盘')
    expect(dashboard?.meta.icon).toBe('Odometer')
    expect(dashboard?.meta.order).toBe(10)
    expect(dashboard?.meta.keepAlive).toBe(true)
  })
})
