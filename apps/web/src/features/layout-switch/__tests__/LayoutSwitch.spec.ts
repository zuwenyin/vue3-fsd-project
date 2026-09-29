import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { storage } from '@repo/utils'
import { LAYOUT_KEY } from '@/shared/config/storage-keys'
import { useLayoutStore } from '../model/layout.store'
import LayoutSwitch from '../ui/LayoutSwitch.vue'

describe('LayoutSwitch（布局模式下拉）', () => {
  beforeEach(() => {
    storage.remove(LAYOUT_KEY)
    setActivePinia(createPinia())
  })

  it('四个模式选项，label 走 i18n（value 来自 constants）', () => {
    const wrapper = mount(LayoutSwitch)
    const select = wrapper.findComponent({ name: 'FsdSelect' })

    expect(select.exists()).toBe(true)
    const options = select.props('options') as Array<{ label: string; value: string }>
    expect(options.map((item) => item.value)).toEqual(['sidebar', 'top', 'mix', 'dual'])
    expect(options[0]?.label).toBe('侧边栏')
  })

  it('选择「顶部栏」→ store 更新并持久化；非法值被忽略', async () => {
    const wrapper = mount(LayoutSwitch)
    const select = wrapper.findComponent({ name: 'FsdSelect' })
    const layout = useLayoutStore()

    select.vm.$emit('update:model-value', 'top')
    expect(layout.mode).toBe('top')
    expect(storage.get(LAYOUT_KEY)).toMatchObject({ mode: 'top' })

    // 非 LayoutMode 的值（含数组 / null）不应写入
    select.vm.$emit('update:model-value', 'grid')
    select.vm.$emit('update:model-value', null)
    select.vm.$emit('update:model-value', ['top'])
    expect(layout.mode).toBe('top')
  })
})
