import { describe, expect, it, vi } from 'vitest'
import { pageComponentKeys, resolvePageComponent } from '../page-modules'

describe('page-modules（页面注册表，docs/03 §3）', () => {
  it('pageComponentKeys：去掉 /src/pages 前缀与 .vue，且已排序', () => {
    expect(pageComponentKeys.length).toBeGreaterThan(0)
    expect(pageComponentKeys).toContain('dashboard/index')
    expect(pageComponentKeys.every((key) => !key.startsWith('/') && !key.endsWith('.vue'))).toBe(
      true,
    )
    expect(pageComponentKeys).toEqual([...pageComponentKeys].sort())
  })

  it('resolvePageComponent：命中返回懒加载 loader', () => {
    expect(resolvePageComponent('dashboard/index')).toBeTypeOf('function')
  })

  it('resolvePageComponent：Layout 交由 app 层映射 → undefined', () => {
    expect(resolvePageComponent('Layout')).toBeUndefined()
  })

  it('resolvePageComponent：空值 / 未命中 → undefined（未命中记录 error）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(resolvePageComponent()).toBeUndefined()
    expect(resolvePageComponent('not/exist')).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockRestore()
  })

  it('resolvePageComponent：前导斜杠容错', () => {
    expect(resolvePageComponent('/dashboard/index')).toBeTypeOf('function')
  })
})
