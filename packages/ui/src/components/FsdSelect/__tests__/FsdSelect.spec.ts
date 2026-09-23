import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ElOption } from 'element-plus'
import { FsdSelect } from '..'

describe('FsdSelect', () => {
  it('对象 options 渲染为 ElOption', () => {
    const wrapper = mount(FsdSelect, {
      props: {
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      },
    })
    expect(wrapper.findAllComponents(ElOption)).toHaveLength(2)
  })

  it('字符串数组自动归一化为 label/value', () => {
    const wrapper = mount(FsdSelect, { props: { options: ['x', 'y'] } })
    const options = wrapper.findAllComponents(ElOption)
    expect(options).toHaveLength(2)
  })

  it('change 同时触发 update:modelValue', async () => {
    const wrapper = mount(FsdSelect, { props: { options: ['x'] } })
    const select = wrapper.findComponent({ name: 'ElSelect' })
    select.vm.$emit('change', 'x')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['x'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['x'])
  })
})
