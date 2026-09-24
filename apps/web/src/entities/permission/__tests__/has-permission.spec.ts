import { describe, expect, it } from 'vitest'
import { hasPermission } from '../lib/has-permission'

describe('hasPermission', () => {
  it('未配置需求 → 放行', () => {
    expect(hasPermission(undefined, [], [])).toBe(true)
    expect(hasPermission([], [], [])).toBe(true)
  })

  it('admin 角色直通（即使权限点未命中）', () => {
    expect(hasPermission('system:user:add', [], ['admin'])).toBe(true)
  })

  it('单个权限点命中 / 未命中', () => {
    expect(hasPermission('system:user:add', ['system:user:add'], ['editor'])).toBe(true)
    expect(hasPermission('system:user:add', ['system:menu:view'], ['editor'])).toBe(false)
  })

  it('数组：满足其一即可', () => {
    expect(hasPermission(['system:menu:edit', 'system:user:add'], ['system:user:add'])).toBe(true)
    expect(hasPermission(['system:menu:edit', 'system:user:add'], ['other'])).toBe(false)
  })

  it('role: 前缀：命中任一所需角色', () => {
    expect(hasPermission('role:editor', [], ['editor'])).toBe(true)
    expect(hasPermission(['role:editor', 'role:admin'], [], ['editor'])).toBe(true)
    expect(hasPermission('role:admin', [], ['editor'])).toBe(false)
  })

  it('只给 role: 需求时，角色未命中即拒绝（权限点为空不误判为放行）', () => {
    expect(hasPermission(['role:admin'], ['*'], ['editor'])).toBe(false)
  })

  it('权限点与角色混合：命中任一即通过', () => {
    expect(hasPermission(['role:admin', 'system:user:add'], ['system:user:add'], ['editor'])).toBe(
      true,
    )
  })
})
