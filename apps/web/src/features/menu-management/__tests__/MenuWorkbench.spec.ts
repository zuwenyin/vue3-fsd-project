/* eslint-disable vue/one-component-per-file -- 本文件定义多个测试替身组件 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import type { MenuFormModel } from '@/entities/menu'

// ---------- mocks ----------

/** 视口宽度可控（窄屏纵向布局 + 隐藏分隔条） */
const { widthRef } = vi.hoisted(() => ({ widthRef: { value: 1440 } }))

vi.mock('@vueuse/core', async () => {
  const { ref } = await import('vue')
  return { useWindowSize: () => ({ width: ref(widthRef.value) }) }
})

/** 编排层替身：记录调用 + 可控状态（真实编排由 use-menu-management.spec.ts 覆盖） */
const { store } = vi.hoisted(() => ({
  store: {
    refs: {} as Record<string, { value: unknown }>,
    calls: {
      load: 0,
      reset: 0,
      apply: 0,
      select: [] as number[],
      remove: [] as number[],
      move: [] as unknown[],
      moveRow: [] as unknown[],
      save: [] as unknown[],
      cancelEdit: 0,
      create: [] as unknown[],
    },
  },
}))

vi.mock('../model/use-menu-management', async () => {
  const { ref } = await import('vue')
  const refs = {
    tree: ref([]),
    loading: ref(false),
    hasDirty: ref(false),
    selectedId: ref<number | null>(null),
    form: ref<MenuFormModel | null>(null),
    parentOptions: ref([]),
  }
  store.refs = refs as unknown as Record<string, { value: unknown }>

  return {
    useMenuManagement: () => ({
      ...refs,
      componentOptions: ['system/menu/index'],
      load: () => {
        store.calls.load += 1
      },
      reset: () => {
        store.calls.reset += 1
      },
      applyChanges: () => {
        store.calls.apply += 1
      },
      select: (id: number) => store.calls.select.push(id),
      remove: (id: number) => store.calls.remove.push(id),
      move: (payload: unknown) => store.calls.move.push(payload),
      moveRow: (id: number, direction: string) => store.calls.moveRow.push([id, direction]),
      save: (model: unknown) => store.calls.save.push(model),
      cancelEdit: () => {
        store.calls.cancelEdit += 1
      },
      create: (model: unknown) => store.calls.create.push(model),
    }),
  }
})

const { default: MenuWorkbench } = await import('../ui/MenuWorkbench.vue')

const stubs = {
  MenuTreeTable: defineComponent({
    name: 'MenuTreeTable',
    props: { tree: { type: Array, default: () => [] } },
    template: '<div class="tree-table" />',
  }),
  MenuDetailForm: defineComponent({
    name: 'MenuDetailForm',
    props: {
      modelId: { type: Number, default: null },
      disabled: { type: Boolean, default: false },
    },
    template: '<div class="detail-form" />',
  }),
  MenuEditDialog: defineComponent({
    name: 'MenuEditDialog',
    props: {
      visible: { type: Boolean, default: false },
      parentId: { type: Number, default: null },
      parentOptions: { type: Array, default: () => [] },
      type: { type: String, default: 'root' },
    },
    template: '<div class="edit-dialog" :data-visible="String(visible)" :data-type="type" />',
  }),
}

function mountWorkbench() {
  return mount(MenuWorkbench, {
    global: {
      stubs,
      directives: { permission: { mounted: () => {} } },
    },
  })
}

describe('MenuWorkbench（菜单管理左右分栏工作台，docs/14 §4 / §4.7）', () => {
  beforeEach(() => {
    widthRef.value = 1440
    store.calls.load = 0
    store.calls.reset = 0
    store.calls.apply = 0
    store.calls.select = []
    store.calls.remove = []
    store.calls.move = []
    store.calls.moveRow = []
    store.calls.save = []
    store.calls.cancelEdit = 0
    store.calls.create = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('进入即加载数据', () => {
    mountWorkbench()
    expect(store.calls.load).toBe(1)
  })

  it('hasDirty 为真时显示未应用提示', async () => {
    const wrapper = mountWorkbench()
    expect(wrapper.find('.menu-workbench__dirty').exists()).toBe(false)

    ;(store.refs['hasDirty'] as { value: boolean }).value = true
    await nextTick()
    expect(wrapper.find('.menu-workbench__dirty').text()).toContain('未应用')
  })

  it('顶栏按钮触发编排层的重置 / 应用变更', async () => {
    const wrapper = mountWorkbench()
    const buttons = wrapper.findAll('.menu-workbench__actions button')

    await buttons[0]?.trigger('click')
    await buttons[1]?.trigger('click')
    expect(store.calls.reset).toBe(1)
    expect(store.calls.apply).toBe(1)
  })

  it('树表事件转发：选中 / 删除 / 拖拽 / 上移下移', async () => {
    const wrapper = mountWorkbench()
    const table = wrapper.findComponent({ name: 'MenuTreeTable' })

    table.vm.$emit('select', 3)
    table.vm.$emit('remove', 4)
    table.vm.$emit('move', { id: 5, targetParentId: null, beforeId: 2 })
    table.vm.$emit('move-row', { id: 6, direction: 'down' })

    expect(store.calls.select).toEqual([3])
    expect(store.calls.remove).toEqual([4])
    expect(store.calls.move).toEqual([{ id: 5, targetParentId: null, beforeId: 2 }])
    expect(store.calls.moveRow).toEqual([[6, 'down']])
  })

  it('新增根菜单 / 新增子级：弹窗带入 parentId 与类型', async () => {
    const wrapper = mountWorkbench()
    const dialog = () => wrapper.findComponent({ name: 'MenuEditDialog' })
    const table = wrapper.findComponent({ name: 'MenuTreeTable' })

    table.vm.$emit('add-child', null)
    await nextTick()
    expect(dialog().props('visible')).toBe(true)
    expect(dialog().props('type')).toBe('root')
    expect(dialog().props('parentId')).toBeNull()

    table.vm.$emit('add-child', 7)
    await nextTick()
    expect(dialog().props('type')).toBe('child')
    expect(dialog().props('parentId')).toBe(7)
  })

  it('弹窗提交 → 调用编排层 create', async () => {
    const wrapper = mountWorkbench()
    const model = { name: 'New' } as unknown as MenuFormModel
    wrapper.findComponent({ name: 'MenuEditDialog' }).vm.$emit('submit', model)
    expect(store.calls.create).toEqual([model])
  })

  it('分隔条拖动把左栏宽度夹取在 200–600px', async () => {
    const wrapper = mountWorkbench()
    const splitter = wrapper.find('.menu-workbench__splitter')
    expect(splitter.exists()).toBe(true)

    await splitter.trigger('mousedown', { clientX: 100 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 1000 }))
    await nextTick()
    expect(wrapper.find('.menu-workbench__aside').attributes('style')).toContain('width: 600px')

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: -2000 }))
    await nextTick()
    expect(wrapper.find('.menu-workbench__aside').attributes('style')).toContain('width: 200px')

    window.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('窄屏（<960px）：纵向布局、隐藏分隔条、出现新增子级按钮', async () => {
    widthRef.value = 800
    const wrapper = mountWorkbench()

    expect(wrapper.find('.menu-workbench__main--narrow').exists()).toBe(true)
    expect(wrapper.find('.menu-workbench__splitter').exists()).toBe(false)
    expect(wrapper.find('.menu-workbench__aside').attributes('style')).toBeUndefined()

    const addChild = wrapper
      .findAll('.menu-workbench__main button')
      .find((item) => item.text().includes('新增子级'))
    expect(addChild).toBeDefined()
  })

  it('选中菜单时详情表单收到 modelId 与禁用态', async () => {
    const wrapper = mountWorkbench()
    ;(store.refs['selectedId'] as { value: number | null }).value = 12
    ;(store.refs['loading'] as { value: boolean }).value = true
    await nextTick()

    const form = wrapper.findComponent({ name: 'MenuDetailForm' })
    expect(form.props('modelId')).toBe(12)
    expect(form.props('disabled')).toBe(true)
  })

  it('树与父级选项来自编排层（透传）', () => {
    const wrapper = mountWorkbench()
    expect(wrapper.findComponent({ name: 'MenuTreeTable' }).props('tree')).toEqual([])
    expect(wrapper.findComponent({ name: 'MenuEditDialog' }).props('parentOptions')).toEqual([])
  })
})
