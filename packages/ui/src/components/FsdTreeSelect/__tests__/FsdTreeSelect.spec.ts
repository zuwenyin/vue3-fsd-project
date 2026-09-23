import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ElTreeSelect } from 'element-plus'
import { FsdTreeSelect } from '..'

describe('FsdTreeSelect', () => {
  it('默认映射 { value: id, label: title, children: children }', () => {
    const wrapper = mount(FsdTreeSelect, {
      props: { data: [{ id: 1, title: '系统管理', children: [{ id: 2, title: '菜单管理' }] }] },
    })
    const tree = wrapper.findComponent(ElTreeSelect)
    expect(tree.props('props')).toEqual({ value: 'id', label: 'title', children: 'children' })
  })

  it('支持自定义映射', () => {
    const wrapper = mount(FsdTreeSelect, {
      props: { data: [], props: { value: 'key', label: 'name', children: 'items' } },
    })
    expect(wrapper.findComponent(ElTreeSelect).props('props')).toEqual({
      value: 'key',
      label: 'name',
      children: 'items',
    })
  })
})
