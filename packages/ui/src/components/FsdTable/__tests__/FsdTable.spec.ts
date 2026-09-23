import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { FsdTable } from '..'
import type { FsdTableColumn, FsdTableProps } from '../../../types'

interface Row extends Record<string, unknown> {
  id: number
  title: string
  children?: Row[]
}

const flatRows: Row[] = [
  { id: 1, title: '系统管理' },
  { id: 2, title: '菜单管理' },
]

const treeRows: Row[] = [{ id: 1, title: '系统管理', children: [{ id: 2, title: '菜单管理' }] }]

/** 不走插槽的普通列，标题直接由 formatter/prop 渲染 */
const columns: FsdTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: '标题' },
]

const slotColumns: FsdTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: '标题', slot: true },
]

async function mountTable(props: FsdTableProps<Row>, slots: Record<string, string> = {}) {
  const wrapper = mount(FsdTable, {
    props: props as never,
    slots,
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('FsdTable', () => {
  it('渲染列与数据行', async () => {
    const wrapper = await mountTable({ data: flatRows, columns })
    expect(wrapper.text()).toContain('ID')
    expect(wrapper.text()).toContain('系统管理')
    wrapper.unmount()
  })

  it('树形数据渲染子节点', async () => {
    const wrapper = await mountTable({
      data: treeRows,
      columns,
      rowKey: 'id',
      treeProps: { children: 'children' },
      defaultExpandAll: true,
    })
    expect(wrapper.text()).toContain('菜单管理')
    wrapper.unmount()
  })

  it('#<key> 具名插槽生效', async () => {
    const wrapper = await mountTable(
      { data: flatRows, columns: slotColumns },
      {
        title: `<template #title="{ row }"><span class="custom-title">{{ row.title }}</span></template>`,
      },
    )
    expect(wrapper.find('.custom-title').exists()).toBe(true)
    wrapper.unmount()
  })

  it('分页开启时渲染 ElPagination 并触发 update:page', async () => {
    const wrapper = await mountTable({
      data: flatRows,
      columns,
      pagination: { page: 1, pageSize: 10, total: 20 },
    })
    expect(wrapper.find('.el-pagination').exists()).toBe(true)
    wrapper.findComponent({ name: 'ElPagination' }).vm.$emit('current-change', 2)
    await flushPromises()
    expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
    wrapper.unmount()
  })

  it('expose bodyRef 指向 tbody（供 vue-draggable-plus 绑定）', async () => {
    const wrapper = await mountTable({ data: flatRows, columns })
    const exposed = wrapper.vm as unknown as { bodyRef: HTMLElement | null }
    expect(exposed.bodyRef?.tagName).toBe('TBODY')
    wrapper.unmount()
  })

  it('expose toggleExpandAll / refreshSortable 可调用', async () => {
    const wrapper = await mountTable({
      data: treeRows,
      columns,
      rowKey: 'id',
      treeProps: { children: 'children' },
    })
    const exposed = wrapper.vm as unknown as {
      toggleExpandAll: (expanded: boolean) => void
      refreshSortable: () => void
    }
    expect(() => exposed.toggleExpandAll(true)).not.toThrow()
    expect(() => exposed.refreshSortable()).not.toThrow()
    wrapper.unmount()
  })
})
