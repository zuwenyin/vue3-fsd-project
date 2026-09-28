import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { UserInfo } from '@/shared/api'
import { useUserStore } from '@/entities/user'
import AppWatermark from '../ui/AppWatermark.vue'

describe('AppWatermark（P9 水印，docs/04 §7.4）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('平铺渲染「用户名 · 日期」，且作为装饰层对可访问性隐藏', () => {
    const user = useUserStore()
    user.$patch({
      profile: { username: 'admin', nickname: '管理员' } as unknown as UserInfo,
    })

    const wrapper = mount(AppWatermark)
    const items = wrapper.findAll('.app-watermark__item')
    expect(items.length).toBeGreaterThan(10)
    const first = wrapper.find('.app-watermark__item')
    expect(first.text()).toContain('管理员')
    // 日期用「当前年份」弱断言，避免依赖本地化格式
    expect(first.text()).toContain(String(new Date().getFullYear()))
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('无昵称时回落为用户名（昵称 getter 规则）', () => {
    const user = useUserStore()
    user.$patch({ profile: { username: 'editor' } as unknown as UserInfo })

    const wrapper = mount(AppWatermark)
    expect(wrapper.find('.app-watermark__item').text()).toContain('editor')
  })
})
