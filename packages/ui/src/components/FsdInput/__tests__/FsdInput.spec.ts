import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ElInput } from 'element-plus'
import { FsdInput } from '..'

describe('FsdInput', () => {
  it('透传 modelValue / placeholder / type', () => {
    const wrapper = mount(FsdInput, {
      props: { modelValue: 'admin', placeholder: '请输入用户名', type: 'password' },
    })
    const input = wrapper.findComponent(ElInput)
    expect(input.props('modelValue')).toBe('admin')
    expect(input.props('placeholder')).toBe('请输入用户名')
    expect(input.props('type')).toBe('password')
  })

  it('输入触发 update:modelValue', async () => {
    const wrapper = mount(FsdInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['hello'])
  })

  it('clear 事件透出', async () => {
    const wrapper = mount(FsdInput, { props: { modelValue: 'x', clearable: true } })
    wrapper.findComponent(ElInput).vm.$emit('clear')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
