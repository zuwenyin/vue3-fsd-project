import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { FsdDialog } from '..'

/** ElDialog 默认 append-to-body，内容通过 Teleport 挂到 document.body */
function dialogButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll('.el-dialog__footer button'))
}

describe('FsdDialog', () => {
  it('渲染标题与默认底部按钮', async () => {
    const wrapper = mount(FsdDialog, { props: { modelValue: true, title: '新增菜单' } })
    await flushPromises()
    expect(document.body.textContent).toContain('新增菜单')
    const texts = dialogButtons().map((button) => button.textContent?.trim())
    expect(texts).toContain('确定')
    expect(texts).toContain('取消')
    wrapper.unmount()
  })

  it('点击确定触发 confirm，点击取消关闭', async () => {
    const wrapper = mount(FsdDialog, { props: { modelValue: true } })
    await flushPromises()

    const confirm = dialogButtons().find((button) => button.textContent?.trim() === '确定')
    const cancel = dialogButtons().find((button) => button.textContent?.trim() === '取消')
    expect(confirm).toBeDefined()
    expect(cancel).toBeDefined()

    confirm?.click()
    await flushPromises()
    expect(wrapper.emitted('confirm')).toHaveLength(1)

    cancel?.click()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })
})
