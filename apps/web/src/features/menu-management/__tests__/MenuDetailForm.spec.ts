/* eslint-disable vue/one-component-per-file -- 本文件定义多个测试替身组件 */
import { mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import type { MenuFormModel, MenuTreeNode } from '@/entities/menu'
import { createDefaultForm } from '../model/menu-form'
import MenuDetailForm from '../ui/MenuDetailForm.vue'

// ---------- 子组件替身（避免 EP 表单/输入渲染开销，聚焦表单逻辑） ----------

/** 校验结果由用例控制（真实 rules 由 model/menu-form.spec.ts 覆盖） */
let validateResult = true

const FormStub = defineComponent({
  name: 'FsdForm',
  props: {
    model: { type: Object, default: () => ({}) },
    rules: { type: Object, default: () => ({}) },
  },
  setup(_props, { slots, expose }) {
    expose({
      validate: () => Promise.resolve(validateResult),
      clearValidate: () => {},
      resetFields: () => {},
    })
    return { slots }
  },
  template: '<form class="menu-detail-form__form"><slot /></form>',
})

const FormItemStub = defineComponent({
  name: 'FsdFormItem',
  props: { label: { type: String, default: '' }, prop: { type: String, default: '' } },
  template:
    '<div class="item" :data-prop="prop"><span class="item__label">{{ label }}</span><slot /></div>',
})

const InputStub = defineComponent({
  name: 'FsdInput',
  props: { modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', ($event.target).value)" />',
})

const passthrough = (name: string) =>
  defineComponent({ name, template: '<div class="stub"></div>' })

const stubs = {
  FsdForm: FormStub,
  FsdFormItem: FormItemStub,
  FsdInput: InputStub,
  FsdSelect: passthrough('FsdSelect'),
  FsdSwitch: passthrough('FsdSwitch'),
  FsdTreeSelect: passthrough('FsdTreeSelect'),
  MenuIconPicker: passthrough('MenuIconPicker'),
}

function createModel(partial: Partial<MenuFormModel> = {}): MenuFormModel {
  return {
    ...createDefaultForm(),
    name: 'SystemUser',
    path: '/system/user',
    title: '用户管理',
    ...partial,
  }
}

function mountDetail(
  props: Partial<{
    model: MenuFormModel | null
    modelId: number | null
    componentOptions: string[]
    parentOptions: MenuTreeNode[]
    disabled: boolean
  }> = {},
) {
  return mount(MenuDetailForm, {
    props: {
      model: createModel(),
      modelId: 5,
      componentOptions: ['system/user/index'],
      parentOptions: [],
      disabled: false,
      ...props,
    },
    global: {
      stubs,
      // v-permission 语义（display:none 隐藏）由 app/directives 单测覆盖
      directives: { permission: { mounted: () => {} } },
    },
  })
}

const actionButton = (wrapper: ReturnType<typeof mountDetail>, label: string) =>
  wrapper.findAll('.menu-detail-form__actions button').find((item) => item.text().includes(label))

describe('MenuDetailForm（菜单详情表单，docs/14 §4.2）', () => {
  beforeEach(() => {
    validateResult = true
    vi.restoreAllMocks()
  })

  it('model 为 null 时显示占位且不渲染表单', () => {
    const wrapper = mountDetail({ model: null })
    expect(wrapper.find('.menu-detail-form__placeholder').text()).toBe(
      '在左侧选择一个菜单节点进行编辑',
    )
    expect(wrapper.find('.menu-detail-form__form').exists()).toBe(false)
  })

  it('model 传入时深拷贝回填（编辑不影响外部对象）', async () => {
    const model = createModel({ name: 'SystemUser' })
    const wrapper = mountDetail({ model })

    const input = wrapper.find('.item[data-prop="name"] input')
    expect((input.element as HTMLInputElement).value).toBe('SystemUser')

    await input.setValue('Changed')
    expect(model.name).toBe('SystemUser')
  })

  it('校验通过 → emit save，且 orderNo 归一化为 number', async () => {
    const wrapper = mountDetail({ model: createModel({ orderNo: '30' as unknown as number }) })
    await actionButton(wrapper, '保存')?.trigger('click')
    await wrapper.vm.$nextTick()

    const saved = wrapper.emitted('save')?.[0]?.[0] as MenuFormModel
    expect(saved).toBeDefined()
    expect(saved.orderNo).toBe(30)
    expect(typeof saved.orderNo).toBe('number')
  })

  it('校验失败 → 不 emit save', async () => {
    validateResult = false
    const wrapper = mountDetail()
    await actionButton(wrapper, '保存')?.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('组件路径不在白名单 → 软提示但仍可保存', async () => {
    const warn = vi.spyOn(ElMessage, 'warning').mockImplementation(() => ({}) as never)
    const wrapper = mountDetail({
      model: createModel({ component: 'unknown/path' }),
      componentOptions: ['system/user/index'],
    })

    await actionButton(wrapper, '保存')?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(warn).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('save')).toBeDefined()
  })

  it('未选中节点时删除按钮禁用；选中后可删除', async () => {
    const empty = mountDetail({ modelId: null })
    expect(actionButton(empty, '删除')?.attributes('disabled')).toBeDefined()

    const wrapper = mountDetail({ modelId: 9 })
    await actionButton(wrapper, '删除')?.trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[9]])
  })

  it('取消 → emit cancel', async () => {
    const wrapper = mountDetail()
    await actionButton(wrapper, '取消')?.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('redirect 仅顶级非外链节点显示；外链时隐藏组件字段', () => {
    const top = mountDetail({ model: createModel({ parentId: null, external: false }) })
    expect(top.find('.item[data-prop="redirect"]').exists()).toBe(true)
    expect(top.find('.item[data-prop="component"]').exists()).toBe(true)

    const child = mountDetail({ model: createModel({ parentId: 2 }) })
    expect(child.find('.item[data-prop="redirect"]').exists()).toBe(false)

    const external = mountDetail({ model: createModel({ parentId: null, external: true }) })
    expect(external.find('.item[data-prop="redirect"]').exists()).toBe(false)
    expect(external.find('.item[data-prop="component"]').exists()).toBe(false)
  })
})
