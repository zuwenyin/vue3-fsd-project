import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { FsdIcon } from '..'

describe('FsdIcon', () => {
  it('渲染已存在的图标', () => {
    const wrapper = mount(FsdIcon, { props: { name: 'Edit' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('图标名不存在时降级为占位方块并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mount(FsdIcon, { props: { name: 'NotExistIcon', size: 16 } })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.find('span').exists()).toBe(true)
    expect(wrapper.find('span').attributes('style')).toContain('16px')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('未传 name 时不告警且渲染占位', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mount(FsdIcon)
    expect(wrapper.find('span').exists()).toBe(true)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
