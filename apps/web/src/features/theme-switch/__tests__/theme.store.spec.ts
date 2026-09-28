import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { DEFAULT_PRIMARY, DEFAULT_THEME_MODE } from '../model/constants'
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
    HTML.classList.remove('dark')
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
})
