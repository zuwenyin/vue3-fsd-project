import { describe, expect, it } from 'vitest'
import enUS from '../locales/en-US'
import zhCN from '../locales/zh-CN'

type Messages = Record<string, unknown>

/** 递归收集叶子键路径（如 `menu.dashboard`） */
function keysOf(source: Messages, prefix = ''): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object' ? keysOf(value as Messages, path) : [path]
  })
}

function valuesOf(source: Messages): string[] {
  return Object.values(source).flatMap((value) =>
    value !== null && typeof value === 'object' ? valuesOf(value as Messages) : [String(value)],
  )
}

describe('i18n locales', () => {
  it('zh-CN 与 en-US 的键集合完全一致（缺键会导致切换后回落）', () => {
    expect(keysOf(enUS).sort()).toEqual(keysOf(zhCN).sort())
  })

  it('后端菜单 titleKey 指向的键齐备（决策 D2）', () => {
    const keys = keysOf(zhCN)
    for (const key of [
      'menu.dashboard',
      'menu.system',
      'menu.systemUser',
      'menu.systemMenu',
      'menu.systemUserGroup',
      'menu.profile',
    ]) {
      expect(keys).toContain(key)
    }
  })

  it('两份文案均无空值', () => {
    for (const value of [...valuesOf(zhCN), ...valuesOf(enUS)]) {
      expect(value.trim().length).toBeGreaterThan(0)
    }
  })
})
