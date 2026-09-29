import { mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import type { SortableEvent } from 'sortablejs'
import type { FsdTableColumn } from '@repo/ui'
import { node } from './factory'

// ---------- mocks（必须在 import 被测组件之前生效） ----------

/** 视口宽度可控（窄屏降级显隐拖拽列/组件列） */
const { widthRef } = vi.hoisted(() => ({ widthRef: { value: 1440 } }))

vi.mock('@vueuse/core', async () => {
  const { ref } = await import('vue')
  return { useWindowSize: () => ({ width: ref(widthRef.value) }) }
})

/** 捕获 useDraggable 的 options 与 start 调用（不模拟真实鼠标拖拽） */
const { drag } = vi.hoisted(() => ({
  drag: {
    options: null as Record<string, (...args: never[]) => unknown> | null,
    started: [] as unknown[],
  },
}))

vi.mock('vue-draggable-plus', () => ({
  useDraggable: (_el: unknown, options: Record<string, unknown>) => {
    drag.options = options as never
    return { start: (target: unknown) => drag.started.push(target) }
  },
}))

const { default: MenuTreeTable } = await import('../ui/MenuTreeTable.vue')

// ---------- 测试夹具 ----------

/** 3 级树：5 与 3 都是「有子树的 2 级节点」（子树高度 2），用于深度超限场景 */
const tree = [
  node({ id: 1, title: '仪表盘', orderNo: 10 }),
  node({
    id: 2,
    title: '系统管理',
    orderNo: 20,
    children: [
      node({
        id: 3,
        title: '用户管理',
        orderNo: 30,
        parentId: 2,
        children: [node({ id: 6, title: '用户分组', orderNo: 40, parentId: 3 })],
      }),
      node({
        id: 5,
        title: '菜单管理',
        orderNo: 50,
        parentId: 2,
        children: [node({ id: 7, title: '菜单列表', orderNo: 60, parentId: 5 })],
      }),
    ],
  }),
]

/** 与组件内 tbodyRef 对齐的真实 tbody（供 onEnd 从 DOM 还原行序列） */
const tbody = document.createElement('tbody')
const toggleCalls: boolean[] = []

/** FsdTable 替身：透传 data/columns 并渲染 title/status/actions 插槽（避免 EP 表格渲染开销） */
const TableStub = defineComponent({
  name: 'FsdTable',
  props: {
    data: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
  },
  emits: ['row-click', 'current-change'],
  setup(_props, { slots, expose, emit }) {
    expose({
      bodyRef: tbody,
      refreshSortable: () => {},
      toggleExpandAll: (expanded: boolean) => toggleCalls.push(expanded),
    })
    return { slots, emit }
  },
  template: `
    <div class="table-stub">
      <div class="table-stub__drag"><slot name="drag" /></div>
      <div v-for="row in data" :key="row.id" class="table-stub__row">
        <slot name="title" :row="row" />
        <slot name="status" :row="row" />
        <slot name="actions" :row="row" />
      </div>
    </div>
  `,
})

function mountTable(
  props: Partial<{ tree: typeof tree; loading: boolean; selectedId: number | null }> = {},
) {
  return mount(MenuTreeTable, {
    props: { tree, loading: false, selectedId: null, ...props },
    global: {
      stubs: { FsdTable: TableStub },
      // `v-permission` 的真实语义（含 display:none 隐藏）由 app/directives 的单测覆盖；
      // 这里只需让指令可解析（features 层不宜反向 import app/*）
      directives: { permission: { mounted: () => {} } },
    },
  })
}

const columnKeys = (wrapper: ReturnType<typeof mountTable>): string[] =>
  (wrapper.findComponent({ name: 'FsdTable' }).props('columns') as FsdTableColumn[]).map(
    (column) => column.key,
  )

/** 造带 data-* 标记的行元素（与模板 #title 插槽根元素一致） */
function mark(id: number, parentId: number | null, level: number): HTMLElement {
  const el = document.createElement('span')
  el.dataset.menuId = String(id)
  el.dataset.parentId = parentId == null ? '' : String(parentId)
  el.dataset.level = String(level)
  return el
}

function rowOf(id: number, parentId: number | null, level: number): HTMLTableRowElement {
  const tr = document.createElement('tr')
  tr.appendChild(mark(id, parentId, level))
  return tr
}

describe('MenuTreeTable（菜单树表格，docs/14 §4.1 / §4.7）', () => {
  beforeEach(() => {
    widthRef.value = 1440
    toggleCalls.length = 0
    drag.started.length = 0
    tbody.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('宽屏渲染 7 列（含拖拽列与组件列）', () => {
    const wrapper = mountTable()
    expect(columnKeys(wrapper)).toEqual([
      'drag',
      'title',
      'path',
      'component',
      'orderNo',
      'status',
      'actions',
    ])
    expect(wrapper.find('.menu-tree-table__drag-handle').exists()).toBe(true)
  })

  it('窄屏（<960px）降级：隐藏拖拽列与组件列、操作列加宽、行内出现上移/下移', () => {
    widthRef.value = 800
    const wrapper = mountTable()

    expect(columnKeys(wrapper)).toEqual(['title', 'path', 'orderNo', 'status', 'actions'])
    const actions = (
      wrapper.findComponent({ name: 'FsdTable' }).props('columns') as FsdTableColumn[]
    ).at(-1)
    expect(actions?.width).toBe(210)

    const labels = wrapper.findAll('.table-stub__row button').map((button) => button.text())
    expect(labels).toContain('上移')
    expect(labels).toContain('下移')
  })

  it('点行选中：row-click 与 current-change 都 emit select；空行不 emit', async () => {
    const wrapper = mountTable()
    const table = wrapper.findComponent({ name: 'FsdTable' })

    table.vm.$emit('row-click', { id: 3 })
    table.vm.$emit('current-change', { id: 5 })
    table.vm.$emit('current-change', null)

    const events = wrapper.emitted('select')
    expect(events).toEqual([[3], [5]])
  })

  it('展开/收起按钮切换文案并调用表格的 toggleExpandAll', async () => {
    const wrapper = mountTable()
    const button = wrapper
      .findAll('.menu-tree-table__toolbar button')
      .find((item) => item.text().includes('折叠全部'))

    expect(button).toBeDefined()
    await button?.trigger('click')

    expect(toggleCalls).toEqual([false])
    const after = wrapper
      .findAll('.menu-tree-table__toolbar button')
      .find((item) => item.text().includes('展开全部'))
    expect(after).toBeDefined()
  })

  it('挂载后把 FsdTable 暴露的 tbody 交给 sortable 绑定（immediate: false + 手柄选择器）', async () => {
    mountTable()
    await nextTick()
    await nextTick()

    expect(drag.options?.immediate).toBe(false)
    expect(drag.options?.handle).toBe('.menu-tree-table__drag-handle')
    expect(drag.started).toEqual([tbody])
  })

  it('onMove 层级校验：自身子孙与原层级超限都被禁止，合法落点放行', async () => {
    mountTable()
    await nextTick()
    const onMove = drag.options?.onMove as (evt: SortableEvent) => boolean

    // 5 → 7：7 是 5 的子孙 → 禁止
    expect(
      onMove({ dragged: mark(5, 2, 2), related: mark(7, 5, 3) } as unknown as SortableEvent),
    ).toBe(false)
    // 3 → 2：新层级 1 + 子树高度 2 - 1 = 2 ≤ 3 → 放行
    expect(
      onMove({ dragged: mark(3, 2, 2), related: mark(2, null, 1) } as unknown as SortableEvent),
    ).toBe(true)
    // 5 → 6：新层级 3 + 子树高度 2 - 1 = 4 > 3 → 禁止（决策 D3）
    expect(
      onMove({ dragged: mark(5, 2, 2), related: mark(6, 3, 3) } as unknown as SortableEvent),
    ).toBe(false)
    // 落点无标记（自定义列空白处）→ 放行交 onEnd 换算
    expect(
      onMove({
        dragged: mark(5, 2, 2),
        related: document.createElement('div'),
      } as unknown as SortableEvent),
    ).toBe(true)
  })

  it('onEnd 换算落点并 emit move（拖到同级行之后 → 与该行同父）', async () => {
    const wrapper = mountTable()
    await nextTick()
    const onStart = drag.options?.onStart as (evt: SortableEvent) => void
    const onEnd = drag.options?.onEnd as (evt: SortableEvent) => void

    // DOM 顺序：1, 2, 3, 6, 5, 7 —— 把 6 拖到末尾（5 之后）
    ;[
      rowOf(1, null, 1),
      rowOf(2, null, 1),
      rowOf(3, 2, 2),
      rowOf(6, 3, 3),
      rowOf(5, 2, 2),
      rowOf(7, 5, 3),
    ].forEach((tr) => tbody.appendChild(tr))

    const initial = [...tbody.querySelectorAll('tr')]
    const moved = initial[3] as HTMLTableRowElement // 6
    const afterMoved = initial[4] as HTMLTableRowElement // 5（拖后 6 落在它之后）

    onStart({ item: moved } as unknown as SortableEvent) // 拖拽开始（DOM 未变）→ 记录锚点
    tbody.insertBefore(moved, afterMoved.nextElementSibling) // 模拟 sortable 把 6 挪到 5 之后
    onEnd({ item: moved } as unknown as SortableEvent)

    // 6 落在 5（level 2, parent 2）之后 → 新父 = 2；beforeId 取同父的下一行（7 的父是 5）→ null
    expect(wrapper.emitted('move')).toEqual([[{ id: 6, targetParentId: 2, beforeId: null }]])
    // DOM 已还原：moved 回到锚点（5）之前，交给数据驱动重渲染
    expect(tbody.querySelectorAll('tr')[3]).toBe(moved)
    expect(tbody.querySelectorAll('tr')[4]).toBe(afterMoved)
  })

  it('onEnd 深度超限：提示 invalidDropLevel 且不 emit move', async () => {
    const warn = vi.spyOn(ElMessage, 'warning').mockImplementation(() => ({}) as never)
    const wrapper = mountTable()
    await nextTick()
    const onStart = drag.options?.onStart as (evt: SortableEvent) => void
    const onEnd = drag.options?.onEnd as (evt: SortableEvent) => void

    // 顺序 1,2,3,6,5,7：把 5（子树高度 2）拖到 6（level 3）之后 → 3 + 2 - 1 = 4 > 3
    ;[rowOf(1, null, 1), rowOf(2, null, 1), rowOf(3, 2, 2), rowOf(6, 3, 3)].forEach((tr) =>
      tbody.appendChild(tr),
    )
    const item = rowOf(5, 2, 2)
    tbody.appendChild(item)
    tbody.appendChild(rowOf(7, 5, 3))

    onStart({ item } as unknown as SortableEvent)
    onEnd({ item } as unknown as SortableEvent)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain('最多 3 级')
    expect(wrapper.emitted('move')).toBeUndefined()
  })
})
