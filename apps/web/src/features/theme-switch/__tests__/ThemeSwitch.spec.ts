import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { storage } from '@repo/utils'
import { i18n } from '@/shared/i18n'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { useThemeStore } from '../model/theme.store'
import ThemeSwitch from '../ui/ThemeSwitch.vue'

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

/** EP 下拉 teleport 到 body，故从 document 里取菜单项 */
function menuItems(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.el-dropdown-menu__item')]
}

async function factory() {
  // i18n 由 vitest.setup.ts 全局注册（重复传会触发 Vue 的 already-applied 警告）
  const wrapper = mount(ThemeSwitch)
  await wrapper.find('.fsd-dropdown__trigger').trigger('click')
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  return wrapper
}

describe('ThemeSwitch（明暗入口）', () => {
  beforeEach(() => {
    stubMatchMedia()
    storage.remove(THEME_KEY)
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh-CN'
    HTML.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('下拉包含三种模式与「自定义品牌色…」入口', async () => {
    await factory()
    const labels = menuItems().map((item) => item.textContent?.trim())
    expect(labels).toContain('浅色')
    expect(labels).toContain('深色')
    expect(labels).toContain('跟随系统')
    expect(labels.some((label) => label?.includes('自定义品牌色'))).toBe(true)
  })

  it('选择「深色」→ html.dark 生效并持久化', async () => {
    await factory()
    const darkItem = menuItems().find((item) => item.textContent?.trim() === '深色')
    darkItem?.click()
    await nextTick()

    expect(HTML.classList.contains('dark')).toBe(true)
    expect(storage.get<{ mode: string }>(THEME_KEY)?.mode).toBe('dark')
    expect(useThemeStore().mode).toBe('dark')
  })

  it('选择「自定义品牌色…」→ 发出 openCustom 事件', async () => {
    const wrapper = await factory()
    const customItem = menuItems().find((item) => item.textContent?.includes('自定义品牌色'))
    customItem?.click()
    await nextTick()

    expect(wrapper.emitted('openCustom')).toHaveLength(1)
  })

  it('切英文后下拉文案随语言变化', async () => {
    i18n.global.locale.value = 'en-US'
    await factory()
    const labels = menuItems().map((item) => item.textContent?.trim())
    expect(labels).toContain('Light')
    expect(labels).toContain('Dark')
    i18n.global.locale.value = 'zh-CN'
  })
})
