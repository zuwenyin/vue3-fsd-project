import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyDarkMode,
  applyPrimaryColor,
  clearPrimaryColorVars,
  resolveIsDark,
} from '../lib/apply-theme'

const HTML = document.documentElement

function mockPrefersDark(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches,
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

describe('apply-theme', () => {
  beforeEach(() => {
    HTML.classList.remove('dark')
    clearPrimaryColorVars()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applyDarkMode：light 不挂 dark；dark 挂 dark', () => {
    expect(applyDarkMode('light')).toBe(false)
    expect(HTML.classList.contains('dark')).toBe(false)

    expect(applyDarkMode('dark')).toBe(true)
    expect(HTML.classList.contains('dark')).toBe(true)
  })

  it('applyDarkMode：auto 跟随系统偏好', () => {
    mockPrefersDark(true)
    expect(applyDarkMode('auto')).toBe(true)
    expect(HTML.classList.contains('dark')).toBe(true)

    mockPrefersDark(false)
    expect(applyDarkMode('auto')).toBe(false)
    expect(HTML.classList.contains('dark')).toBe(false)
  })

  it('resolveIsDark：auto 在系统暗色下为 true', () => {
    mockPrefersDark(true)
    expect(resolveIsDark('auto')).toBe(true)
    expect(resolveIsDark('light')).toBe(false)
    expect(resolveIsDark('dark')).toBe(true)
  })

  it('applyPrimaryColor：写入 EP 七级变量与 --fsd-* 同步（参考值取自 docs/04 §4）', () => {
    applyPrimaryColor('#409eff')
    const style = HTML.style
    expect(style.getPropertyValue('--el-color-primary')).toBe('#409eff')
    expect(style.getPropertyValue('--el-color-primary-light-3')).toBe('#79bbff')
    expect(style.getPropertyValue('--el-color-primary-light-5')).toBe('#a0cfff')
    expect(style.getPropertyValue('--el-color-primary-light-7')).toBe('#c6e2ff')
    expect(style.getPropertyValue('--el-color-primary-light-8')).toBe('#d9ecff')
    expect(style.getPropertyValue('--el-color-primary-light-9')).toBe('#ecf5ff')
    expect(style.getPropertyValue('--el-color-primary-dark-2')).toBe('#337ecc')
    // 自有组件用的 3 个梯度同步写入
    expect(style.getPropertyValue('--fsd-color-primary')).toBe('#409eff')
    expect(style.getPropertyValue('--fsd-color-primary-light-3')).toBe('#79bbff')
    expect(style.getPropertyValue('--fsd-color-primary-dark-2')).toBe('#337ecc')
  })

  it('clearPrimaryColorVars：清空后回落到 SCSS 基线', () => {
    applyPrimaryColor('#422ed1')
    clearPrimaryColorVars()
    expect(HTML.style.getPropertyValue('--el-color-primary')).toBe('')
    expect(HTML.style.getPropertyValue('--fsd-color-primary')).toBe('')
  })
})
