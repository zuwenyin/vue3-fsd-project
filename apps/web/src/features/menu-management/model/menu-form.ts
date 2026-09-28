import type { FormRules } from 'element-plus'
import type { MenuFormModel, MenuRecord } from '@/entities/menu'

/** 路由名：大写字母开头，仅字母与数字（docs/14 §4.2） */
export const MENU_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/

export function isHttpUrl(path: string): boolean {
  try {
    const url = new URL(path)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** 新增表单默认值 */
export function createDefaultForm(parentId: number | null = null): MenuFormModel {
  return {
    parentId,
    name: '',
    path: '',
    component: undefined,
    redirect: undefined,
    title: '',
    titleKey: undefined,
    icon: undefined,
    orderNo: 0,
    keepAlive: false,
    hideInMenu: false,
    hideChildrenInMenu: false,
    activePath: undefined,
    external: false,
    affix: false,
    layout: undefined,
    roles: [],
    permissions: [],
    status: 1,
  }
}

/** 管理记录 → 表单模型（null/空串统一转 undefined，避免 el-select 显示空标签） */
export function formFromRecord(record: MenuRecord): MenuFormModel {
  return {
    parentId: record.parentId,
    name: record.name,
    path: record.path,
    component: record.component || undefined,
    redirect: record.redirect || undefined,
    title: record.title,
    titleKey: record.titleKey || undefined,
    icon: record.icon || undefined,
    orderNo: record.orderNo,
    keepAlive: record.keepAlive,
    hideInMenu: record.hideInMenu,
    hideChildrenInMenu: record.hideChildrenInMenu,
    activePath: record.activePath || undefined,
    external: record.external,
    affix: record.affix,
    layout: record.layout,
    roles: [...record.roles],
    permissions: [...record.permissions],
    status: record.status,
  }
}

/** 表单 → 更新载荷（PUT 为 partial 语义，全量提交亦可） */
export function toUpdatePayload(form: MenuFormModel): Partial<MenuFormModel> {
  return { ...form }
}

/**
 * 校验规则（docs/14 §4.2）。`getForm` 用于 validator 内读取当前表单
 * （path 的外链校验依赖 external 字段）。
 */
export function createMenuFormRules(getForm: () => MenuFormModel): FormRules {
  return {
    name: [
      { required: true, message: '请输入路由名', trigger: 'blur' },
      { pattern: MENU_NAME_PATTERN, message: '需大写字母开头，仅含字母与数字', trigger: 'blur' },
    ],
    path: [
      { required: true, message: '请输入路由地址', trigger: 'blur' },
      {
        validator: (_rule, value: string, callback) => {
          const path = String(value ?? '')
          if (/\s/.test(path)) {
            callback(new Error('路由地址不能包含空格'))
            return
          }
          if (getForm().external && !isHttpUrl(path)) {
            callback(new Error('外链必须为 http(s):// 开头的完整地址'))
            return
          }
          callback()
        },
        trigger: 'blur',
      },
    ],
    title: [
      { required: true, message: '请输入菜单标题', trigger: 'blur' },
      { max: 20, message: '标题不超过 20 字', trigger: 'blur' },
    ],
    orderNo: [
      {
        validator: (_rule, value: number, callback) => {
          const n = Number(value)
          if (!Number.isInteger(n) || n < 0 || n > 99999) {
            callback(new Error('排序需为 0–99999 的整数'))
            return
          }
          callback()
        },
        trigger: 'blur',
      },
    ],
  }
}
