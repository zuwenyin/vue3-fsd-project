import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { FsdDropdown } from '..'
import type { FsdDropdownItem } from '../../../types'

const items: FsdDropdownItem[] = [
  { label: '个人中心', value: 'profile', icon: 'User' },
  { label: '退出登录', value: 'logout', divided: true },
]

describe('FsdDropdown', () => {
  it('触发器内容由 default 插槽渲染', () => {
    const wrapper = mount(FsdDropdown, {
      props: { items },
      slots: { default: '超级管理员' },
    })

    expect(wrapper.text()).toContain('超级管理员')
    wrapper.unmount()
  })

  it('ElDropdown 的 command 映射为 select(value)', async () => {
    const wrapper = mount(FsdDropdown, {
      props: { items },
      slots: { default: '超级管理员' },
    })

    wrapper.findComponent({ name: 'ElDropdown' }).vm.$emit('command', 'logout')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('select')?.[0]).toEqual(['logout'])
    wrapper.unmount()
  })

  it('trigger / disabled 透传', () => {
    const wrapper = mount(FsdDropdown, {
      props: { items, trigger: 'hover', disabled: true },
      slots: { default: 'u' },
    })

    const dropdown = wrapper.findComponent({ name: 'ElDropdown' })
    expect(dropdown.props('trigger')).toBe('hover')
    expect(dropdown.props('disabled')).toBe(true)
    wrapper.unmount()
  })
})
