<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useDraggable } from 'vue-draggable-plus'
import type { SortableEvent } from 'sortablejs'
import { ElMessage } from 'element-plus'
import { FsdButton, FsdIcon, FsdTable, FsdTag, type FsdTableColumn } from '@repo/ui'
import { isDescendant, type MenuTreeNode, type MoveMenuPayload } from '@/entities/menu'
import { MENU_MAX_DEPTH, canAddChild, subtreeHeight } from '../model/constants'
import {
  findNode,
  flattenWithLevel,
  toMovePayload,
  type MenuDragRow,
} from '../model/tree-mutations'

/** 交叉 Record 以满足 FsdTable 的泛型约束（interface 无索引签名） */
type Row = MenuTreeNode & Record<string, unknown>

/** FsdTable 经 defineExpose 暴露的能力（泛型 SFC 无法用 InstanceType，故按结构声明） */
interface MenuTableExpose {
  bodyRef: HTMLElement | null
  refreshSortable: () => void
  toggleExpandAll: (expanded: boolean) => void
}

const props = defineProps<{
  tree: MenuTreeNode[]
  loading: boolean
  selectedId: number | null
}>()

const emit = defineEmits<{
  select: [id: number]
  'add-child': [id: number | null]
  remove: [id: number]
  move: [payload: MoveMenuPayload]
  'move-row': [payload: { id: number; direction: 'up' | 'down' }]
}>()

defineOptions({ name: 'MenuTreeTable' })

const tableRef = ref<MenuTableExpose | null>(null)
/** 交给 useDraggable 的 tbody 句柄（库只在初始化时解析元素，故用 ref 承载 + 显式 start） */
const tbodyRef = shallowRef<HTMLElement | null>(null)
const expanded = ref(true)
const { width } = useWindowSize()
/** < 960px：隐藏拖拽列与组件列，降级为上移/下移（docs/14 §4.7） */
const isNarrow = computed(() => width.value < 960)

const rows = computed(() => props.tree as Row[])

const depthMap = computed(() => {
  const map = new Map<number, number>()
  for (const item of flattenWithLevel(props.tree)) map.set(item.id, item.level)
  return map
})

const columns = computed<FsdTableColumn[]>(() => {
  const list: FsdTableColumn[] = []
  if (!isNarrow.value) list.push({ key: 'drag', label: '', width: 44, slot: true })
  // ★ 用固定 width 而非 minWidth：左栏被拖窄时 el-table 会「先压缩列、后出滚动条」，
  //   标题列会被压到不可见（实测截图）；固定宽度保证出现横向滚动而非挤压
  list.push(
    { key: 'title', label: '菜单标题', width: 180, slot: true },
    { key: 'path', label: '路由地址', width: 140 },
  )
  if (!isNarrow.value) list.push({ key: 'component', label: '组件路径', width: 170 })
  list.push(
    { key: 'orderNo', label: '排序', width: 70 },
    { key: 'status', label: '状态', width: 76, slot: true },
    {
      key: 'actions',
      label: '操作',
      width: isNarrow.value ? 210 : 180,
      fixed: 'right',
      slot: true,
    },
  )
  return list
})

function onCurrentChange(row: MenuTreeNode | null): void {
  if (row) emit('select', row.id)
}

/**
 * 点击行即选中。`highlight-current-row` 在 el-table 中才会让点击写入 currentRow，
 * 这里再用 row-click 兜一层，保证「点行 → 右侧表单加载」不依赖内部实现（select 对同 id 幂等）。
 */
function onRowClick(row: MenuTreeNode): void {
  emit('select', row.id)
}

function heightOf(id: number): number {
  const node = findNode(props.tree, id)
  return node ? subtreeHeight(node) : 1
}

// ---------- 拖拽（docs/14 §5.3；落点换算是纯函数 toMovePayload，可单测） ----------

/** 从任意元素（tr / td / span）向上或向下取到行标记 */
function markOf(el: Element | null | undefined): HTMLElement | null {
  if (!el) return null
  const self = el.closest?.('[data-menu-id]') as HTMLElement | null
  if (self) return self
  const tr = el.closest?.('tr')
  return (tr?.querySelector?.('[data-menu-id]') as HTMLElement | null) ?? null
}

function idOf(el: Element | null | undefined): number | null {
  const mark = markOf(el)
  return mark?.dataset.menuId ? Number(mark.dataset.menuId) : null
}

/** 从 DOM 行序列还原 DragRow（顺序 + 深度 + 父级标注在 #title 插槽根元素上） */
function collectRows(tbody: HTMLElement): MenuDragRow[] {
  return [...tbody.querySelectorAll('tr')]
    .map((tr) => markOf(tr))
    .filter((mark): mark is HTMLElement => mark !== null)
    .map((mark) => ({
      id: Number(mark.dataset.menuId),
      parentId: mark.dataset.parentId ? Number(mark.dataset.parentId) : null,
      level: Number(mark.dataset.level ?? 1),
    }))
}

/** sortable 会移动真实 DOM；结束后必须还原，交给数据驱动重渲染 */
let domAnchor: { parent: Node; next: Node | null } | null = null

function restoreDom(evt: SortableEvent): void {
  if (domAnchor) {
    domAnchor.parent.insertBefore(evt.item, domAnchor.next)
    domAnchor = null
  }
}

const draggable = useDraggable(tbodyRef, {
  // el 在挂载后才由 FsdTable 暴露，统一交给 syncSortable() 初始化（库只在初始化时解析元素）
  immediate: false,
  handle: '.menu-tree-table__drag-handle',
  animation: 160,
  ghostClass: 'menu-row-ghost',
  onStart: (evt) => {
    domAnchor = { parent: evt.item.parentNode as Node, next: evt.item.nextElementSibling }
  },
  onMove: (evt) => {
    const draggedId = idOf(evt.dragged)
    if (draggedId == null) return false
    const relatedId = idOf(evt.related)
    // ★ 落点是不含菜单标记的行（如自定义列空白处）时放行，交由 onEnd 换算：
    //   若在此返回 false，鼠标划过这类元素会整段禁拖（实测踩坑）。
    if (relatedId == null || draggedId === relatedId) return true
    // 拖到自身子孙显示禁止态；深度预判（决策 D3，前端只为体验，后端 422 兜底）
    if (isDescendant(props.tree, draggedId, relatedId)) return false
    const relatedLevel = depthMap.value.get(relatedId) ?? 1
    return relatedLevel + heightOf(draggedId) - 1 <= MENU_MAX_DEPTH
  },
  onEnd: (evt) => {
    // 落点必须在「拖拽后的 DOM 顺序」上换算：restoreDom 之后行序已还原成旧顺序
    const tbody = tbodyRef.value
    const draggedId = idOf(evt.item)
    const list = tbody && draggedId != null ? collectRows(tbody) : []
    restoreDom(evt)
    if (!tbody || draggedId == null) return
    const dragIndex = list.findIndex((item) => item.id === draggedId)
    if (dragIndex < 0) return
    const payload = toMovePayload(list, dragIndex, heightOf(draggedId))
    if (!payload) {
      ElMessage.warning('目标层级非法（最多 3 级）')
      return
    }
    emit('move', payload)
  },
})

/** 已绑定 sortable 的 tbody（el-table 行重建不影响委托，同一元素无需重复初始化） */
let boundEl: HTMLElement | null = null

/** 挂载 / 树数据变化后重新绑定：拿到 FsdTable 暴露的 tbody 再 start */
function syncSortable(): void {
  tableRef.value?.refreshSortable()
  const tbody = tableRef.value?.bodyRef ?? null
  if (!tbody) return
  tbodyRef.value = tbody
  if (tbody === boundEl) return
  boundEl = tbody
  draggable.start(tbody)
}

onMounted(() => {
  void nextTick(syncSortable)
})

watch(
  () => props.tree,
  () => {
    void nextTick(syncSortable)
  },
)

function toggleExpand(): void {
  expanded.value = !expanded.value
  tableRef.value?.toggleExpandAll(expanded.value)
}
</script>

<template>
  <section class="menu-tree-table">
    <header class="menu-tree-table__toolbar">
      <FsdButton v-permission="'system:menu:edit'" type="primary" @click="emit('add-child', null)">
        新增根菜单
      </FsdButton>
      <FsdButton @click="toggleExpand">{{ expanded ? '折叠全部' : '展开全部' }}</FsdButton>
    </header>

    <FsdTable
      ref="tableRef"
      class="menu-tree-table__table"
      :data="rows"
      :columns="columns"
      :loading="loading"
      row-key="id"
      default-expand-all
      highlight-current-row
      :tree-props="{ children: 'children' }"
      :empty-text="'暂无菜单'"
      @current-change="onCurrentChange"
      @row-click="onRowClick"
    >
      <template #drag>
        <span class="menu-tree-table__drag-handle" title="拖拽排序">⠿</span>
      </template>

      <template #title="{ row }">
        <span
          class="menu-tree-table__cell"
          :data-menu-id="row.id"
          :data-parent-id="row.parentId ?? ''"
          :data-level="depthMap.get(row.id) ?? 1"
        >
          <FsdIcon class="menu-tree-table__icon" :name="row.icon" :size="14" />
          <span class="menu-tree-table__title">{{ row.title }}</span>
          <FsdTag v-if="row.external" size="small" type="warning">外链</FsdTag>
        </span>
      </template>

      <template #status="{ row }">
        <FsdTag :type="row.status === 1 ? 'success' : 'info'" size="small">
          {{ row.status === 1 ? '启用' : '停用' }}
        </FsdTag>
      </template>

      <template #actions="{ row }">
        <template v-if="isNarrow">
          <FsdButton
            v-permission="'system:menu:edit'"
            link
            type="primary"
            @click="emit('move-row', { id: row.id, direction: 'up' })"
          >
            上移
          </FsdButton>
          <FsdButton
            v-permission="'system:menu:edit'"
            link
            type="primary"
            @click="emit('move-row', { id: row.id, direction: 'down' })"
          >
            下移
          </FsdButton>
        </template>
        <FsdButton
          v-permission="'system:menu:edit'"
          link
          type="primary"
          :disabled="!canAddChild(depthMap.get(row.id) ?? 0)"
          title="最多 3 级"
          @click="emit('add-child', row.id)"
        >
          新增子级
        </FsdButton>
        <FsdButton
          v-permission="'system:menu:edit'"
          link
          type="danger"
          :disabled="row.children.length > 0"
          title="请先删除子菜单"
          @click="emit('remove', row.id)"
        >
          删除
        </FsdButton>
      </template>
    </FsdTable>
  </section>
</template>

<style scoped lang="scss">
.menu-tree-table {
  display: flex;
  flex-direction: column;
  gap: var(--fsd-space-sm);
  height: 100%;
}

.menu-tree-table__toolbar {
  display: flex;
  gap: var(--fsd-space-sm);
}

.menu-tree-table__table {
  flex: 1;
}

.menu-tree-table__drag-handle {
  cursor: grab;
  color: var(--fsd-color-text-weak);
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.menu-tree-table__cell {
  display: inline-flex;
  align-items: center;
  gap: var(--fsd-space-xs);
}

.menu-tree-table__icon {
  color: var(--fsd-color-text-secondary);
}

.menu-tree-table__title {
  color: var(--fsd-color-text);
}

:global(.menu-row-ghost) {
  opacity: 0.4;
}
</style>
