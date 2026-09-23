import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStorage, storage } from '..'

interface FakeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  key(index: number): string | null
  readonly length: number
  raw: Map<string, string>
}

function createFakeStorage(): FakeStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size
    },
    raw: map,
  }
}

let fake: FakeStorage

beforeEach(() => {
  fake = createFakeStorage()
  ;(globalThis as { localStorage?: Storage }).localStorage = fake as unknown as Storage
})

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage
  vi.restoreAllMocks()
})

describe('storage', () => {
  it('已含 fsd: 前缀时不重复拼接', () => {
    const s = createStorage('fsd')
    s.set('fsd:token', 'abc')
    expect(fake.raw.has('fsd:token')).toBe(true)
    expect(fake.raw.has('fsd:fsd:token')).toBe(false)
  })

  it('未含前缀时自动补 fsd:', () => {
    const s = createStorage('fsd')
    s.set('token', 'abc')
    expect(fake.raw.has('fsd:token')).toBe(true)
    expect(s.get('fsd:token')).toBe('abc')
    expect(s.get('token')).toBe('abc')
  })

  it('set / get 支持对象等复杂类型', () => {
    const s = createStorage('fsd')
    const value = { mode: 'dark', primary: '#409EFF' }
    s.set('fsd:theme', value)
    expect(s.get('fsd:theme')).toEqual(value)
  })

  it('未命中返回 fallback，未提供 fallback 返回 undefined', () => {
    const s = createStorage('fsd')
    expect(s.get('fsd:missing', 'fb')).toBe('fb')
    expect(s.get('fsd:missing')).toBeUndefined()
  })

  it('TTL 过期即删并回落 fallback', () => {
    const s = createStorage('fsd')
    s.set('fsd:temp', 'v', -1)
    expect(s.get('fsd:temp', 'fb')).toBe('fb')
    expect(fake.raw.has('fsd:temp')).toBe(false)
  })

  it('TTL 未过期仍可读', () => {
    const s = createStorage('fsd')
    s.set('fsd:temp', 'v', 60_000)
    expect(s.get('fsd:temp')).toBe('v')
  })

  it('JSON 解析失败时回落 fallback 并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    fake.raw.set('fsd:broken', '{not-json')
    const s = createStorage('fsd')
    expect(s.get('fsd:broken', 'fb')).toBe('fb')
    expect(warn).toHaveBeenCalled()
  })

  it('非本命名空间的数据回落 fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    fake.raw.set('fsd:foreign', JSON.stringify({ hello: 'world' }))
    const s = createStorage('fsd')
    expect(s.get('fsd:foreign', 'fb')).toBe('fb')
    expect(warn).toHaveBeenCalled()
  })

  it('remove 删除指定键', () => {
    const s = createStorage('fsd')
    s.set('fsd:a', 1)
    s.remove('fsd:a')
    expect(s.get('fsd:a')).toBeUndefined()
  })

  it('clear 只清本命名空间，不误伤第三方键', () => {
    const s = createStorage('fsd')
    s.set('fsd:a', 1)
    s.set('fsd:b', 2)
    fake.raw.set('other:keep', 'x')
    s.clear()
    expect(fake.raw.has('fsd:a')).toBe(false)
    expect(fake.raw.has('fsd:b')).toBe(false)
    expect(fake.raw.get('other:keep')).toBe('x')
  })

  it('不同命名空间相互隔离', () => {
    const a = createStorage('fsd')
    const b = createStorage('other')
    a.set('fsd:k', 'from-a')
    b.set('other:k', 'from-b')
    expect(a.get('fsd:k')).toBe('from-a')
    expect(b.get('other:k')).toBe('from-b')
    expect(a.get('other:k')).toBeUndefined()
  })

  it('session 后端可用', () => {
    const sessionFake = createFakeStorage()
    ;(globalThis as { sessionStorage?: Storage }).sessionStorage = sessionFake as unknown as Storage
    const s = createStorage('fsd', 'session')
    s.set('fsd:s', 'session-value')
    expect(sessionFake.raw.has('fsd:s')).toBe(true)
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage
  })

  it('无 Storage 环境降级为内存实现', () => {
    // node 环境下默认 storage 单例即内存后端
    storage.set('fsd:mem', { ok: true })
    expect(storage.get('fsd:mem')).toEqual({ ok: true })
    storage.remove('fsd:mem')
    expect(storage.get('fsd:mem')).toBeUndefined()
  })
})
