import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ElTag } from 'element-plus'
import { FsdTag } from '..'

describe('FsdTag', () => {
  it('渲染插槽内容与类型 class', () => {
    const wrapper = mount(FsdTag, { props: { type: 'success' }, slots: { default: '启用' } })
    expect(wrapper.text()).toContain('启用')
    expect(wrapper.findComponent(ElTag).html()).toContain('el-tag--success')
  })
})
