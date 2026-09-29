import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import {
  DEFAULT_COLOR_MODE,
  DEFAULT_DENSITY,
  DEFAULT_PRIMARY,
  DEFAULT_RADIUS,
} from '../model/constants'
import { initTheme, readThemePreference } from '../lib/init-theme'

const HTML = document.documentElement

describe('init-theme（首屏防闪烁）', () => {
  beforeEach(() => {
    storage.remove(THEME_KEY)
    HTML.classList.remove('dark', 'fsd-grayscale', 'fsd-color-weak')
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

  it('readThemePreference：损坏值逐字段回落（非对象 / 枚举非法 / 空主色 / P11 档位非法）', () => {
    storage.set(THEME_KEY, 'not-an-object')
    expect(readThemePreference()).toMatchObject({ mode: 'light', primary: DEFAULT_PRIMARY })

    storage.set(THEME_KEY, {
      mode: 'sepia',
      primary: '',
      radius: 'xxl',
      density: 1,
      colorMode: 'invert',
    })
    expect(readThemePreference()).toMatchObject({
      mode: 'light',
      primary: DEFAULT_PRIMARY,
      radius: DEFAULT_RADIUS,
      density: DEFAULT_DENSITY,
      colorMode: DEFAULT_COLOR_MODE,
    })
  })

  it('P11：持久化的圆角 / 紧凑度 / 显示模式先于 mount 应用（防闪烁）', () => {
    storage.set(THEME_KEY, { radius: 'none', density: 'compact', colorMode: 'grayscale' })
    initTheme()

    expect(HTML.style.getPropertyValue('--fsd-radius-md')).toBe('0px')
    expect(HTML.style.getPropertyValue('--fsd-space-sm')).toBe('6px')
    expect(HTML.classList.contains('fsd-grayscale')).toBe(true)
  })
})
