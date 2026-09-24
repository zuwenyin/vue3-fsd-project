import { describe, expect, it } from 'vitest'
import { env } from '@/shared/config/env'
import { LAYOUT_KEY, TABS_KEY, THEME_KEY, TOKEN_KEY } from '@/shared/config/storage-keys'
import { constantRoutes, LAYOUT_ROUTE_NAME } from '@/app/router/constant-routes'

describe('shared/config', () => {
  it('env 默认值', () => {
    expect(env.apiBaseUrl).toBe('/api')
    expect(env.useMock).toBe(false)
    expect(env.appTitle).toBe('FSD Template')
  })

  it('持久化键统一 fsd: 前缀', () => {
    expect([TOKEN_KEY, THEME_KEY, LAYOUT_KEY, TABS_KEY]).toEqual([
      'fsd:token',
      'fsd:theme',
      'fsd:layout',
      'fsd:tabs',
    ])
  })
})

describe('常量路由', () => {
  it('包含 login / 布局 / 403 / 404', () => {
    expect(constantRoutes.map((route) => route.name)).toEqual([
      'Login',
      'Layout',
      'Forbidden',
      'NotFound',
    ])
  })

  it('404 最后注册，且布局为动态路由挂载点', () => {
    expect(constantRoutes.at(-1)?.name).toBe('NotFound')
    const layout = constantRoutes.find((route) => route.name === LAYOUT_ROUTE_NAME)
    expect(layout?.redirect).toBe('/dashboard')
    expect(layout?.children).toEqual([])
  })
})
