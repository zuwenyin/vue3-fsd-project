import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { storage } from '@repo/utils'
import { LANG_KEY } from '@/shared/config/storage-keys'
import { i18n } from '@/shared/i18n'
import { useLangStore } from '../model/lang.store'

describe('lang.store', () => {
  beforeEach(() => {
    storage.remove(LANG_KEY)
    i18n.global.locale.value = 'zh-CN'
    document.documentElement.lang = ''
    setActivePinia(createPinia())
  })

  it('默认 zh-CN：i18n 与 store 初始状态一致', () => {
    const lang = useLangStore()
    expect(lang.locale).toBe('zh-CN')
    expect(i18n.global.locale.value).toBe('zh-CN')
    expect(i18n.global.t('menu.dashboard')).toBe('仪表盘')
  })

  it('setLang("en-US")：同步 i18n、html lang 与 fsd:lang', () => {
    const lang = useLangStore()
    lang.setLang('en-US')

    expect(lang.locale).toBe('en-US')
    expect(i18n.global.locale.value).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
    expect(storage.get<{ locale: string }>(LANG_KEY)?.locale).toBe('en-US')
    expect(i18n.global.t('menu.dashboard')).toBe('Dashboard')
  })

  it('从 fsd:lang 恢复已保存语言（首屏不闪烁）', () => {
    storage.set(LANG_KEY, { locale: 'en-US' })
    const lang = useLangStore()
    expect(lang.locale).toBe('en-US')
  })

  it('损坏 / 非法语言回落 zh-CN', () => {
    storage.set(LANG_KEY, { locale: 'fr-FR' })
    expect(useLangStore().locale).toBe('zh-CN')

    storage.set(LANG_KEY, 'not-an-object')
    expect(useLangStore().locale).toBe('zh-CN')
  })

  it('setLang 对非法值不生效（类型守卫）', () => {
    const lang = useLangStore()
    lang.setLang('ja-JP' as never)
    expect(lang.locale).toBe('zh-CN')
  })
})
