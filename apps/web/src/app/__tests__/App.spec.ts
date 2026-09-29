import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { ElConfigProvider } from 'element-plus'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { useLangStore } from '@/features/lang-switch'
import { DENSITY_SCALE, useThemeStore } from '@/features/theme-switch'
import App from '../App.vue'

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

function mountApp() {
  return mount(App, { global: { stubs: { RouterView: true } } })
}

describe('App.vue（壳层与主题联动，P11）', () => {
  beforeEach(() => {
    stubMatchMedia()
    storage.remove(THEME_KEY)
    setActivePinia(createPinia())
    HTML.classList.remove('dark', 'fsd-grayscale', 'fsd-color-weak')
    HTML.removeAttribute('style')
  })

  it('紧凑度联动 ElConfigProvider.size（default → small → large）', async () => {
    const theme = useThemeStore()
    const wrapper = mountApp()
    const provider = wrapper.findComponent(ElConfigProvider)

    expect(provider.props('size')).toBe(DENSITY_SCALE.default.epSize)

    theme.setDensity('compact')
    await nextTick()
    expect(provider.props('size')).toBe('small')

    theme.setDensity('comfortable')
    await nextTick()
    expect(provider.props('size')).toBe('large')
  })

  it('语言切换联动 EP locale（中文默认 → 英文）', async () => {
    const wrapper = mountApp()
    const provider = wrapper.findComponent(ElConfigProvider)
    expect(provider.props('locale')).toMatchObject({ name: 'zh-cn' })

    const lang = useLangStore()
    lang.setLang('en-US')
    await nextTick()
    expect(provider.props('locale')).toMatchObject({ name: 'en' })

    lang.setLang('zh-CN')
  })
})
