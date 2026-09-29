/* eslint-disable vue/one-component-per-file -- 本文件定义多个测试替身组件 */
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import type { MenuFormModel, MenuTreeNode } from '@/entities/menu'
import MenuEditDialog from '../ui/MenuEditDialog.vue'

/** 校验结果由用例控制（真实 rules 由 model/menu-form.spec.ts 覆盖） */
let validateResult = true

const DialogStub = defineComponent({
  name: 'FsdDialog',
  props: { modelValue: { type: Boolean, default: false }, title: { type: String, default: '' } },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  template: `<div class="dialog">
    <h3 class="dialog__title">{{ title }}</h3>
    <slot />
    <footer>
      <button class="dialog__confirm" type="button" @click="$emit('confirm')">confirm</button>
      <button class="dialog__cancel" type="button" @click="$emit('cancel')">cancel</button>
    </footer>
  </div>`,
})

const FormStub = defineComponent({
  name: 'FsdForm',
  props: { model: { type: Object, default: () => ({}) } },
  setup(_props, { slots, expose }) {
    expose({
      validate: () => Promise.resolve(validateResult),
      clearValidate: () => {},
      resetFields: () => {},
    })
    return { slots }
  },
  template: '<form><slot /></form>',
})

const FormItemStub = defineComponent({
  name: 'FsdFormItem',
  props: { label: { type: String, default: '' }, prop: { type: String, default: '' } },
  template:
    '<div class="item" :data-prop="prop"><span class="item__label">{{ label }}</span><slot /></div>',
})

const InputStub = defineComponent({
  name: 'FsdInput',
  props: {
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', ($event.target).value)" />',
})

/** 类型下拉替身：暴露 current 供断言 */
const SelectStub = defineComponent({
  name: 'FsdSelect',
  props: {
    modelValue: { type: [String, Number, Array], default: '' },
    options: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  template: '<div class="select" :data-value="String(modelValue)"></div>',
})

const stubs = {
  FsdDialog: DialogStub,
  FsdForm: FormStub,
  FsdFormItem: FormItemStub,
  FsdInput: InputStub,
  FsdSelect: SelectStub,
  FsdTreeSelect: defineComponent({
    name: 'FsdTreeSelect',
    template: '<div class="tree-select" />',
  }),
}

function mountDialog(
  props: Partial<{
    visible: boolean
    parentId: number | null
    parentOptions: MenuTreeNode[]
    type: 'root' | 'child'
  }> = {},
) {
  return mount(MenuEditDialog, {
    props: { visible: true, parentId: null, parentOptions: [], type: 'root', ...props },
    global: { stubs },
  })
}

const typeSelect = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.findAll('.select')[0] as NonNullable<ReturnType<typeof wrapper.findAll>[0]>

describe('MenuEditDialog（新增菜单弹窗，docs/14 §4.3）', () => {
  beforeEach(() => {
    validateResult = true
  })

  it('标题随 type 变化；child 才显示上级菜单字段', () => {
    const root = mountDialog({ type: 'root' })
    expect(root.find('.dialog__title').text()).toBe('新增根菜单')
    expect(root.find('.item[data-prop="parentId"]').exists()).toBe(false)

    const child = mountDialog({ type: 'child', parentId: 3 })
    expect(child.find('.dialog__title').text()).toBe('新增子菜单')
    expect(child.find('.item[data-prop="parentId"]').exists()).toBe(true)
  })

  it('默认类型为「菜单」，显示组件路径字段', () => {
    const wrapper = mountDialog()
    expect(typeSelect(wrapper).attributes('data-value')).toBe('menu')
    expect(wrapper.find('.item[data-prop="component"]').exists()).toBe(true)
  })

  it('切「目录」：隐藏组件字段并给出提示；切回「菜单」后组件路径已清空', async () => {
    const wrapper = mountDialog()
    const select = wrapper.findComponent({ name: 'FsdSelect' })

    select.vm.$emit('update:model-value', 'dir')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.item[data-prop="component"]').exists()).toBe(false)
    expect(wrapper.find('.menu-edit-dialog__hint').exists()).toBe(true)

    select.vm.$emit('update:model-value', 'menu')
    await wrapper.vm.$nextTick()
    const componentItem = wrapper.find('.item[data-prop="component"]')
    expect(componentItem.exists()).toBe(true)
    // component 被清空 → 组件选择器的 modelValue 为空
    expect(componentItem.find('.select').attributes('data-value')).toBe('')
  })

  it('切「外链」：路径占位变为完整 URL 提示', async () => {
    const wrapper = mountDialog()
    wrapper.findComponent({ name: 'FsdSelect' }).vm.$emit('update:model-value', 'external')
    await wrapper.vm.$nextTick()

    const pathInput = wrapper.find('.item[data-prop="path"] input')
    expect(pathInput.attributes('placeholder')).toBe('https://example.com')
  })

  it('提交：校验通过 → emit submit（orderNo 归一化）并关闭弹窗', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.dialog__confirm').trigger('click')
    await wrapper.vm.$nextTick()

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as MenuFormModel
    expect(submitted).toBeDefined()
    expect(typeof submitted.orderNo).toBe('number')
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('提交：校验不通过 → 不 emit submit 也不关闭', async () => {
    validateResult = false
    const wrapper = mountDialog()
    await wrapper.find('.dialog__confirm').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('update:visible')).toBeUndefined()
  })

  it('关闭按钮 → emit update:visible false', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.dialog__cancel').trigger('click')
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('重新打开时重置表单与类型', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.item[data-prop="name"] input').setValue('Temp')

    // visible: false → true 触发重置
    await wrapper.setProps({ visible: false })
    await wrapper.setProps({ visible: true })

    expect((wrapper.find('.item[data-prop="name"] input').element as HTMLInputElement).value).toBe(
      '',
    )
    expect(typeSelect(wrapper).attributes('data-value')).toBe('menu')
  })
})
