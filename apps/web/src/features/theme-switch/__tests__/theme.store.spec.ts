import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import {
  DEFAULT_COLOR_MODE,
  DEFAULT_DENSITY,
  DEFAULT_PRIMARY,
  DEFAULT_RADIUS,
  DEFAULT_THEME_MODE,
} from '../model/constants'
import { useThemeStore } from '../model/theme.store'

const HTML = document.documentElement

function stubMatchMedia(): void {
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
}

describe('theme.store', () => {
  beforeEach(() => {
    stubMatchMedia()
    storage.remove(THEME_KEY)
    setActivePinia(createPinia())
    HTML.classList.remove('dark', 'fsd-grayscale', 'fsd-color-weak')
  })

  it('默认值：light + 品牌蓝，并写入 fsd:theme', () => {
    const theme = useThemeStore()
    expect(theme.mode).toBe(DEFAULT_THEME_MODE)
    expect(theme.primary).toBe(DEFAULT_PRIMARY)
    expect(storage.get<{ mode: string }>(THEME_KEY)?.mode).toBe(DEFAULT_THEME_MODE)
  })

  it('setMode("dark") 立即切 html.dark 并持久化', () => {
    const theme = useThemeStore()
    theme.setMode('dark')
    expect(HTML.classList.contains('dark')).toBe(true)
    expect(storage.get<{ mode: string }>(THEME_KEY)?.mode).toBe('dark')
  })

  it('setPrimary 写入令牌并持久化；resetTheme 恢复默认', () => {
    const theme = useThemeStore()
    theme.setPrimary('#f5222d')
    expect(HTML.style.getPropertyValue('--el-color-primary')).toBe('#f5222d')
    expect(storage.get<{ primary: string }>(THEME_KEY)?.primary).toBe('#f5222d')

    theme.resetTheme()
    expect(theme.mode).toBe(DEFAULT_THEME_MODE)
    expect(theme.primary).toBe(DEFAULT_PRIMARY)
  })

  it('损坏的持久化值回落默认（模式非法 / 品牌色为空）', () => {
    storage.set(THEME_KEY, { mode: 'blue', primary: '  ' })
    const theme = useThemeStore()
    expect(theme.mode).toBe(DEFAULT_THEME_MODE)
    expect(theme.primary).toBe(DEFAULT_PRIMARY)
  })

  it('从 storage 恢复已保存的 dark + 自定义主色', () => {
    storage.set(THEME_KEY, { mode: 'dark', primary: '#52c41a' })
    const theme = useThemeStore()
    expect(theme.mode).toBe('dark')
    expect(theme.primary).toBe('#52c41a')
    expect(HTML.classList.contains('dark')).toBe(true)
    expect(HTML.style.getPropertyValue('--el-color-primary')).toBe('#52c41a')
  })

  it('P11 默认档位：圆角 md / 紧凑度 default / 显示模式 none', () => {
    const theme = useThemeStore()
    expect(theme.radius).toBe(DEFAULT_RADIUS)
    expect(theme.density).toBe(DEFAULT_DENSITY)
    expect(theme.colorMode).toBe(DEFAULT_COLOR_MODE)
  })

  it('P11 setRadius 写 --fsd-radius-* 与 EP 圆角变量并持久化', () => {
    const theme = useThemeStore()
    theme.setRadius('lg')
    expect(HTML.style.getPropertyValue('--fsd-radius-md')).toBe('12px')
    expect(HTML.style.getPropertyValue('--el-border-radius-base')).toBe('8px')
    expect(storage.get<{ radius: string }>(THEME_KEY)?.radius).toBe('lg')
  })

  it('P11 setDensity 缩放间距令牌并持久化', () => {
    const theme = useThemeStore()
    theme.setDensity('compact')
    expect(HTML.style.getPropertyValue('--fsd-space-sm')).toBe('6px')
    expect(HTML.style.getPropertyValue('--fsd-space-xl')).toBe('16px')
    expect(storage.get<{ density: string }>(THEME_KEY)?.density).toBe('compact')
  })

  it('P11 setColorMode 切 html class（灰阶 / 色弱互斥）并持久化', () => {
    const theme = useThemeStore()

    theme.setColorMode('grayscale')
    expect(HTML.classList.contains('fsd-grayscale')).toBe(true)
    expect(HTML.classList.contains('fsd-color-weak')).toBe(false)

    theme.setColorMode('weak')
    expect(HTML.classList.contains('fsd-grayscale')).toBe(false)
    expect(HTML.classList.contains('fsd-color-weak')).toBe(true)

    expect(storage.get<{ colorMode: string }>(THEME_KEY)?.colorMode).toBe('weak')
  })

  it('P11 旧值（仅 mode/primary）可直接加载，新档位回落默认', () => {
    storage.set(THEME_KEY, { mode: 'dark', primary: '#722ed1' })
    const theme = useThemeStore()
    expect(theme.mode).toBe('dark')
    expect(theme.radius).toBe(DEFAULT_RADIUS)
    expect(theme.density).toBe(DEFAULT_DENSITY)
    expect(theme.colorMode).toBe(DEFAULT_COLOR_MODE)
  })

  it('P11 resetTheme 重置全部档位（含清掉灰阶 class）', () => {
    const theme = useThemeStore()
    theme.setRadius('none')
    theme.setDensity('comfortable')
    theme.setColorMode('grayscale')

    theme.resetTheme()
    expect(theme.radius).toBe(DEFAULT_RADIUS)
    expect(theme.density).toBe(DEFAULT_DENSITY)
    expect(theme.colorMode).toBe(DEFAULT_COLOR_MODE)
    expect(HTML.classList.contains('fsd-grayscale')).toBe(false)
  })
})
