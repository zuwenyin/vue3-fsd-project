import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { ElForm } from 'element-plus'
import { FsdForm, FsdFormItem } from '..'

describe('FsdForm', () => {
  it('渲染 ElForm 与 ElFormItem 并透传 model', () => {
    const wrapper = mount(FsdForm, {
      props: { model: { title: 'x' }, labelWidth: '100px' },
      slots: { default: () => h(FsdFormItem, { label: '标题', prop: 'title' }) },
    })
    expect(wrapper.findComponent(ElForm).props('model')).toEqual({ title: 'x' })
    expect(wrapper.text()).toContain('标题')
  })

  it('expose validate / resetFields / clearValidate', async () => {
    const wrapper = mount(FsdForm, { props: { model: { title: '' } } })
    const exposed = wrapper.vm as unknown as {
      validate: () => Promise<boolean>
      resetFields: () => void
      clearValidate: () => void
    }
    expect(typeof exposed.validate).toBe('function')
    expect(await exposed.validate()).toBe(true)
    expect(() => exposed.resetFields()).not.toThrow()
    expect(() => exposed.clearValidate()).not.toThrow()
  })
})
