import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { FsdMenu, FsdMenuItem, FsdSubMenu } from '..'

describe('FsdMenu', () => {
  it('渲染子菜单与菜单项并支持 click', async () => {
    const wrapper = mount(FsdMenu, {
      props: { mode: 'vertical', defaultActive: '2' },
      slots: {
        default: () =>
          h(
            FsdSubMenu,
            { index: '1' },
            {
              title: () => '系统管理',
              default: () => h(FsdMenuItem, { index: '2' }, { default: () => '菜单管理' }),
            },
          ),
      },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.text()).toContain('系统管理')

    const item = wrapper.findComponent(FsdMenuItem)
    item.vm.$emit('click', '2')
    await flushPromises()
    expect(item.emitted('click')?.[0]).toEqual(['2'])
    wrapper.unmount()
  })

  it('collapse 透传给 ElMenu', () => {
    const wrapper = mount(FsdMenu, { props: { collapse: true } })
    expect(wrapper.findComponent({ name: 'ElMenu' }).props('collapse')).toBe(true)
  })
})
