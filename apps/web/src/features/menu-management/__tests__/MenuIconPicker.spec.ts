import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MenuIconPicker from '../ui/MenuIconPicker.vue'

describe('MenuIconPicker（图标选择，docs/14 §4.4）', () => {
  it('默认取 constants 图标子集，并渲染预览位', () => {
    const wrapper = mount(MenuIconPicker, { props: { modelValue: 'Setting' } })

    const select = wrapper.findComponent({ name: 'FsdSelect' })
    expect((select.props('options') as string[]).length).toBeGreaterThan(0)
    expect(wrapper.find('.menu-icon-picker__preview').exists()).toBe(true)
    expect(select.props('modelValue')).toBe('Setting')
  })

  it('可传入自定义 options 覆盖默认子集', () => {
    const wrapper = mount(MenuIconPicker, { props: { options: ['A', 'B'] } })
    expect(wrapper.findComponent({ name: 'FsdSelect' }).props('options')).toEqual(['A', 'B'])
  })

  it('选择 → emit 字符串；数字转字符串；清空 → undefined', () => {
    const wrapper = mount(MenuIconPicker)
    const select = wrapper.findComponent({ name: 'FsdSelect' })

    select.vm.$emit('update:model-value', 'User')
    select.vm.$emit('update:model-value', 123)
    select.vm.$emit('update:model-value', null)

    const events = wrapper.emitted('update:modelValue')
    expect(events?.[0]).toEqual(['User'])
    expect(events?.[1]).toEqual(['123'])
    expect(events?.[2]).toEqual([undefined])
  })
})
