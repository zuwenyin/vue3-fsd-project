import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { FsdButton } from '..'

describe('FsdButton', () => {
  it('渲染默认插槽文本', () => {
    const wrapper = mount(FsdButton, { slots: { default: '保存' } })
    expect(wrapper.text()).toContain('保存')
  })

  it('点击触发 click 事件', async () => {
    const wrapper = mount(FsdButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('disabled 时不触发 click', async () => {
    const wrapper = mount(FsdButton, { props: { disabled: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('type 透传到 class', () => {
    const wrapper = mount(FsdButton, { props: { type: 'primary' } })
    expect(wrapper.classes()).toContain('el-button--primary')
  })
})
