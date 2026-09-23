import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ElColorPicker } from 'element-plus'
import { FsdColorPicker } from '..'

describe('FsdColorPicker', () => {
  it('透传 modelValue / predefine', () => {
    const wrapper = mount(FsdColorPicker, {
      props: { modelValue: '#409EFF', predefine: ['#409EFF', '#2F54EB'] },
    })
    const picker = wrapper.findComponent(ElColorPicker)
    expect(picker.props('modelValue')).toBe('#409EFF')
    expect(picker.props('predefine')).toEqual(['#409EFF', '#2F54EB'])
  })

  it('change 事件透出', async () => {
    const wrapper = mount(FsdColorPicker, { props: { modelValue: '#409EFF' } })
    wrapper.findComponent(ElColorPicker).vm.$emit('change', '#2F54EB')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('change')?.[0]).toEqual(['#2F54EB'])
  })
})
