import type { FormItemRule, FormRules } from 'element-plus'
import { describe, expect, it } from 'vitest'
import type { MenuFormModel } from '@/entities/menu'
import {
  MENU_NAME_PATTERN,
  createDefaultForm,
  createMenuFormRules,
  formFromRecord,
  isHttpUrl,
  toUpdatePayload,
} from '../model/menu-form'
import { record } from './factory'

type RuleValidator = (
  rule: unknown,
  value: unknown,
  callback: (error?: string | Error) => void,
) => void

function messageOf(rule: FormItemRule, fallback: string): string {
  const message = rule.message
  if (typeof message === 'string') return message
  if (typeof message === 'function') return message()
  return fallback
}

/**
 * 按 async-validator 的语义跑单条规则，返回错误文案（null = 通过）。
 * 规则表本身是「配置」，这里直接断言配置产出的文案，不必为它起一个表单实例。
 */
function validate(rules: FormRules, field: string, index: number, value: unknown): string | null {
  const rule = ((rules[field] as FormItemRule[] | undefined) ?? [])[index]
  if (!rule) return null

  const text = value == null ? '' : String(value)

  if (rule.required && text === '') return messageOf(rule, 'required')
  const pattern =
    rule.pattern instanceof RegExp ? rule.pattern : rule.pattern ? new RegExp(rule.pattern) : null
  if (pattern && !pattern.test(text)) return messageOf(rule, 'pattern')
  if (typeof rule.max === 'number' && text.length > rule.max) return messageOf(rule, 'max')

  const validator = rule.validator as RuleValidator | undefined
  if (!validator) return null
  let message: string | null = null
  validator(undefined, value, (error) => {
    message = typeof error === 'string' ? error : (error?.message ?? null)
  })
  return message
}

describe('MENU_NAME_PATTERN', () => {
  it('必须大写字母开头，仅字母与数字', () => {
    expect(MENU_NAME_PATTERN.test('SystemUser')).toBe(true)
    expect(MENU_NAME_PATTERN.test('System')).toBe(true)
    expect(MENU_NAME_PATTERN.test('systemUser')).toBe(false)
    expect(MENU_NAME_PATTERN.test('1System')).toBe(false)
    expect(MENU_NAME_PATTERN.test('Sys-tem')).toBe(false)
  })
})

describe('isHttpUrl', () => {
  it('只认 http / https 完整地址', () => {
    expect(isHttpUrl('https://example.com/a?b=1')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('/system/user')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
  })
})

describe('createDefaultForm / formFromRecord / toUpdatePayload', () => {
  it('默认值：parentId 带入、开关为 false、状态启用、权限为空数组', () => {
    const form = createDefaultForm(7)

    expect(form.parentId).toBe(7)
    expect(form.status).toBe(1)
    expect(form.external).toBe(false)
    expect(form.roles).toEqual([])
    expect(form.permissions).toEqual([])
    expect(createDefaultForm().parentId).toBeNull()
  })

  it('formFromRecord：空串字段统一转 undefined，避免下拉出现空标签', () => {
    const source = record({
      id: 3,
      component: '',
      redirect: '',
      icon: '',
      titleKey: '',
      activePath: '',
      roles: ['admin'],
    })
    const form = formFromRecord(source)

    expect(form.component).toBeUndefined()
    expect(form.redirect).toBeUndefined()
    expect(form.icon).toBeUndefined()
    expect(form.titleKey).toBeUndefined()
    expect(form.activePath).toBeUndefined()
    // roles / permissions 为副本，不与记录共享引用
    expect(form.roles).toEqual(['admin'])
    expect(form.roles).not.toBe(source.roles)
  })

  it('toUpdatePayload 返回副本', () => {
    const form: MenuFormModel = createDefaultForm()
    const payload = toUpdatePayload(form)

    expect(payload).toEqual(form)
    expect(payload).not.toBe(form)
  })
})

describe('createMenuFormRules', () => {
  const base = createDefaultForm()

  it('name：必填 + 命名规则', () => {
    const rules = createMenuFormRules(() => base)
    expect(validate(rules, 'name', 0, '')).toBe('请输入路由名')
    expect(validate(rules, 'name', 1, 'systemUser')).toBe('需大写字母开头，仅含字母与数字')
    expect(validate(rules, 'name', 1, 'SystemUser')).toBeNull()
  })

  it('path：必填、禁止空格；外链必须是 http(s) 完整地址', () => {
    const rules = createMenuFormRules(() => base)
    expect(validate(rules, 'path', 0, '')).toBe('请输入路由地址')
    expect(validate(rules, 'path', 1, '/system/user name')).toBe('路由地址不能包含空格')
    expect(validate(rules, 'path', 1, '/system/user')).toBeNull()

    const externalRules = createMenuFormRules(() => ({ ...base, external: true }))
    expect(validate(externalRules, 'path', 1, '/system/user')).toBe(
      '外链必须为 http(s):// 开头的完整地址',
    )
    expect(validate(externalRules, 'path', 1, 'https://example.com')).toBeNull()
  })

  it('title：必填且 ≤ 20 字', () => {
    const rules = createMenuFormRules(() => base)
    expect(validate(rules, 'title', 0, '')).toBe('请输入菜单标题')
    expect(validate(rules, 'title', 1, '一'.repeat(21))).toBe('标题不超过 20 字')
    expect(validate(rules, 'title', 1, '菜单管理')).toBeNull()
  })

  it('orderNo：0–99999 的整数', () => {
    const rules = createMenuFormRules(() => base)
    expect(validate(rules, 'orderNo', 0, 0)).toBeNull()
    expect(validate(rules, 'orderNo', 0, 99999)).toBeNull()
    expect(validate(rules, 'orderNo', 0, -1)).toBe('排序需为 0–99999 的整数')
    expect(validate(rules, 'orderNo', 0, 100000)).toBe('排序需为 0–99999 的整数')
    expect(validate(rules, 'orderNo', 0, 1.5)).toBe('排序需为 0–99999 的整数')
  })
})
