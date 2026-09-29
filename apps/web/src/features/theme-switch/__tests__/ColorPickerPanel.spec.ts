import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FsdDialog } from '@repo/ui'
import { storage } from '@repo/utils'
import { THEME_KEY } from '@/shared/config/storage-keys'
import { DEFAULT_PRIMARY, PRIMARY_PRESETS } from '../model/constants'
import { useThemeStore } from '../model/theme.store'
import ColorPickerPanel from '../ui/ColorPickerPanel.vue'

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

/**
 * `FsdDialog` 内部是 EP `ElDialog`（懒渲染 + teleport），测试里替换为透传 slot 的替身，
 * 只验证面板自身逻辑（色板/取色/重置）—— 对话框行为归 `@repo/ui` 负责。
 */
function mountPanel(visible = true) {
  return mount(ColorPickerPanel, {
    props: { visible },
    global: {
      stubs: { FsdDialog: { template: '<div class="dialog-stub"><slot /></div>' } },
    },
  })
}

describe('ColorPickerPanel（自定义品牌色面板）', () => {
  beforeEach(() => {
    stubMatchMedia()
    storage.remove(THEME_KEY)
    setActivePinia(createPinia())
    HTML.style.removeProperty('--el-color-primary')
    HTML.classList.remove('fsd-grayscale', 'fsd-color-weak')
  })

  it('预设色板数量与常量一致；点击色块写入品牌色并持久化', async () => {
    const wrapper = mountPanel()
    const swatches = wrapper.findAll('.color-panel__swatch')
    expect(swatches).toHaveLength(PRIMARY_PRESETS.length)

    const target = PRIMARY_PRESETS[2]
    expect(target).toBeDefined()
    await swatches[2]?.trigger('click')

    expect(useThemeStore().primary).toBe(target?.value)
    expect(HTML.style.getPropertyValue('--el-color-primary')).toBe(target?.value)
    expect(storage.get<{ primary: string }>(THEME_KEY)?.primary).toBe(target?.value)
  })

  it('当前品牌色对应的色块标记 active（仅一个）', () => {
    const theme = useThemeStore()
    const target = PRIMARY_PRESETS[1]
    theme.setPrimary(String(target?.value))

    const wrapper = mountPanel()
    expect(wrapper.findAll('.color-panel__swatch--active')).toHaveLength(1)
  })

  it('「恢复默认」重置品牌色与明暗模式', async () => {
    const theme = useThemeStore()
    theme.setPrimary('#123456')
    theme.setMode('dark')

    const wrapper = mountPanel()
    const reset = wrapper.findAll('button').find((item) => item.text().includes('恢复默认'))
    expect(reset).toBeDefined()
    await reset?.trigger('click')

    expect(theme.primary).toBe(DEFAULT_PRIMARY)
    expect(theme.mode).toBe('light')
  })

  it('P11：圆角 / 紧凑度 / 显示模式三组档位可切换并写入 store', async () => {
    const theme = useThemeStore()
    const wrapper = mountPanel()

    const groups = wrapper.findAll('.color-panel__choices')
    expect(groups).toHaveLength(3)

    // 圆角：第 4 档（大）
    await groups[0]?.findAll('button')[3]?.trigger('click')
    expect(theme.radius).toBe('lg')

    // 紧凑度：第 1 档（紧凑）
    await groups[1]?.findAll('button')[0]?.trigger('click')
    expect(theme.density).toBe('compact')

    // 显示模式：第 2 档（灰阶）→ 挂 html class
    await groups[2]?.findAll('button')[1]?.trigger('click')
    expect(theme.colorMode).toBe('grayscale')
    expect(HTML.classList.contains('fsd-grayscale')).toBe(true)
  })

  it('visible=false 时向 FsdDialog 传 false（不渲染由对话框自身负责）', () => {
    const wrapper = mount(ColorPickerPanel, {
      props: { visible: false },
      global: { stubs: { FsdDialog: true } },
    })
    const dialog = wrapper.findComponent(FsdDialog)
    expect(dialog.exists()).toBe(true)
    expect(dialog.props('modelValue')).toBe(false)
  })
})
