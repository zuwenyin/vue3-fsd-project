import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { ElConfigProvider } from 'element-plus'
import { FsdButton } from '@repo/ui'
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

  it('P12 尺寸透传：紧凑/宽松档位让未显式指定 size 的组件渲染 size 类名', async () => {
    const theme = useThemeStore()
    // RouterView stub 内放一个 FsdButton（位于 ElConfigProvider 的 provide 作用域内）
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: defineComponent({
            components: { FsdButton },
            template: '<div class="probe"><FsdButton>x</FsdButton></div>',
          }),
        },
      },
    })
    const button = () => wrapper.find('.probe button')

    // 默认档：EP 无 size 类（与改动前视觉一致）
    expect(button().classes()).not.toContain('el-button--small')
    expect(button().classes()).not.toContain('el-button--large')

    theme.setDensity('compact')
    await nextTick()
    expect(button().classes()).toContain('el-button--small')

    theme.setDensity('comfortable')
    await nextTick()
    expect(button().classes()).toContain('el-button--large')

    theme.setDensity('default')
    await nextTick()
    expect(button().classes()).not.toContain('el-button--small')
    expect(button().classes()).not.toContain('el-button--large')
  })
})
