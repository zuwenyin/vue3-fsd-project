import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { FsdSwitch } from '..'

describe('FsdSwitch', () => {
  it('同步 modelValue 与 update/change 事件', async () => {
    const wrapper = mount(FsdSwitch, { props: { modelValue: false } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('change')?.[0]).toEqual([true])
  })
})
