import { createI18n } from 'vue-i18n'
import { storage } from '@repo/utils'
import { LANG_KEY } from '@/shared/config/storage-keys'
import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'

export const DEFAULT_LOCALE = 'zh-CN'
export type AppLocale = 'zh-CN' | 'en-US'

/** 语言下拉选项（features/lang-switch 消费） */
export const LOCALES: Array<{ label: string; value: AppLocale }> = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'zh-CN' || value === 'en-US'
}

/**
 * 读持久化语言（`fsd:lang`，决策 D1）。
 * createI18n 的初始 locale 直接用它 —— 避免「先中文渲染、再切英文」的闪烁。
 */
export function readSavedLocale(): AppLocale {
  const saved = storage.get<{ locale?: unknown }>(LANG_KEY)
  return isAppLocale(saved?.locale) ? saved.locale : DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false, // 组合式 API（useI18n）
  globalInjection: true, // 模板可用 $t
  locale: readSavedLocale(),
  fallbackLocale: 'en-US',
  messages: { 'zh-CN': zhCN, 'en-US': enUS },
})

/** 非组件环境（store / 纯函数）取文案；组件内请用 useI18n().t（响应式） */
export function t(key: string): string {
  return String(i18n.global.t(key))
}

/** 切换语言并同步 `<html lang>` */
export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}

export { default as enUS } from './locales/en-US'
export { default as zhCN } from './locales/zh-CN'
