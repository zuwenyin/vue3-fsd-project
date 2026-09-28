import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { DEFAULT_PRIMARY } from '../model/constants'
import { initTheme, readThemePreference } from '../lib/init-theme'

const HTML = document.documentElement

describe('init-theme（首屏防闪烁）', () => {
  beforeEach(() => {
    storage.remove(THEME_KEY)
    HTML.classList.remove('dark')
    HTML.removeAttribute('style')
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    )
  })

  it('无持久化时应用默认主题（不挂 dark + 默认主色）', () => {
    const preference = initTheme()
    expect(preference.mode).toBe('light')
    expect(preference.primary).toBe(DEFAULT_PRIMARY)
    expect(HTML.classList.contains('dark')).toBe(false)
    expect(HTML.style.getPropertyValue('--el-color-primary')).toBe(DEFAULT_PRIMARY)
  })

  it('有持久化时先于 mount 应用（dark + 主色），无需等 store', () => {
    storage.set(THEME_KEY, { mode: 'dark', primary: '#722ed1' })
    initTheme()
    expect(HTML.classList.contains('dark')).toBe(true)
    expect(HTML.style.getPropertyValue('--el-color-primary')).toBe('#722ed1')
  })

  it('readThemePreference：损坏值回落（非对象 / 枚举非法 / 空主色）', () => {
    storage.set(THEME_KEY, 'not-an-object')
    expect(readThemePreference()).toEqual({ mode: 'light', primary: DEFAULT_PRIMARY })

    storage.set(THEME_KEY, { mode: 'sepia', primary: '' })
    expect(readThemePreference()).toEqual({ mode: 'light', primary: DEFAULT_PRIMARY })
  })
})
