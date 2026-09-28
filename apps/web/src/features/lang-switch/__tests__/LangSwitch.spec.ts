import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { storage } from '@repo/utils'
import { i18n } from '@/shared/i18n'
import { LANG_KEY } from '@/shared/config/storage-keys'
import LangSwitch from '../ui/LangSwitch.vue'

function menuItems(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.el-dropdown-menu__item')]
}

async function factory() {
  const wrapper = mount(LangSwitch, { global: { plugins: [i18n] } })
  await wrapper.find('.fsd-dropdown__trigger').trigger('click')
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  return wrapper
}

describe('LangSwitch（语言切换）', () => {
  beforeEach(() => {
    storage.remove(LANG_KEY)
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh-CN'
    document.documentElement.lang = ''
    document.body.innerHTML = ''
  })

  it('默认显示「中」，下拉含两种语言', async () => {
    await factory()
    const labels = menuItems().map((item) => item.textContent?.trim())
    expect(labels).toContain('简体中文')
    expect(labels).toContain('English')
  })

  it('选择 English → i18n 全局语言、html lang、持久化同步，标签变 EN', async () => {
    const wrapper = await factory()
    const english = menuItems().find((item) => item.textContent?.trim() === 'English')
    english?.click()
    await nextTick()

    expect(i18n.global.locale.value).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
    expect(storage.get<{ locale: string }>(LANG_KEY)?.locale).toBe('en-US')
    expect(i18n.global.t('menu.dashboard')).toBe('Dashboard')

    // 触发标签随语言变化（中 → EN）
    expect(wrapper.find('.lang-switch__tag').text()).toBe('EN')

    i18n.global.locale.value = 'zh-CN'
  })

  it('已持久化英文时，初始标签即为 EN', async () => {
    storage.set(LANG_KEY, { locale: 'en-US' })
    setActivePinia(createPinia())
    // 模拟首屏流程：i18n 初始 locale 由持久化值决定
    i18n.global.locale.value = 'en-US'
    const wrapper = mount(LangSwitch)
    await nextTick()

    expect(wrapper.find('.lang-switch__tag').text()).toBe('EN')
    i18n.global.locale.value = 'zh-CN'
  })
})
