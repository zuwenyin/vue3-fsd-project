<script setup lang="ts" generic="T extends Record<string, unknown>">
import { nextTick, onMounted, ref, watch } from 'vue'
import {
  ElLoadingDirective,
  ElPagination,
  ElTable,
  ElTableColumn,
  type TableInstance,
} from 'element-plus'
// table 样式已含 scrollbar / tooltip / checkbox；分页与 v-loading 需各自引入
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/loading/style/css'
import type { FsdTableProps } from '../../types'

defineOptions({ name: 'FsdTable' })

// 局部注册 v-loading，避免依赖全局 app.use(ElementPlus)
const vLoading = ElLoadingDirective

const props = withDefaults(defineProps<FsdTableProps<T>>(), {
  rowKey: 'id',
  loading: false,
  defaultExpandAll: false,
  highlightCurrentRow: false,
})

const emit = defineEmits<{
  'row-click': [row: T]
  'current-change': [row: T | null]
  'selection-change': [rows: T[]]
  'update:page': [page: number]
}>()

const tableRef = ref<TableInstance | null>(null)
/** 供 vue-draggable-plus 的 useSortable 绑定（docs/14 §5.3） */
const bodyRef = ref<HTMLElement | null>(null)

function syncBodyRef(): void {
  const el = tableRef.value?.$el
  bodyRef.value = (el?.querySelector?.('tbody') as HTMLElement | null | undefined) ?? null
}

onMounted(syncBodyRef)
watch(
  () => props.data,
  () => {
    void nextTick(syncBodyRef)
  },
)

const childrenKey = (): string => props.treeProps?.children ?? 'children'

function toggleRowExpansion(row: T, expanded?: boolean): void {
  tableRef.value?.toggleRowExpansion(row, expanded)
}

function toggleExpandAll(expanded: boolean): void {
  const table = tableRef.value
  if (!table) return
  const key = childrenKey()
  const walk = (rows: T[]): void => {
    for (const row of rows) {
      table.toggleRowExpansion(row, expanded)
      const children = row[key]
      if (Array.isArray(children)) walk(children as T[])
    }
  }
  walk(props.data)
}

defineExpose({ bodyRef, toggleRowExpansion, toggleExpandAll, refreshSortable: syncBodyRef })
</script>

<template>
  <div class="fsd-table">
    <ElTable
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      :tree-props="treeProps"
      :default-expand-all="defaultExpandAll"
      :highlight-current-row="highlightCurrentRow"
      :size="size"
      @row-click="emit('row-click', $event)"
      @current-change="emit('current-change', $event)"
      @selection-change="emit('selection-change', $event)"
    >
      <ElTableColumn
        v-for="column in columns"
        :key="column.key"
        :prop="column.key"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align"
        :fixed="column.fixed"
      >
        <template v-if="column.slot" #default="scope">
          <slot :name="column.key" v-bind="scope" />
        </template>
      </ElTableColumn>
      <slot />
      <template #empty>
        <slot name="empty">{{ emptyText }}</slot>
      </template>
    </ElTable>

    <ElPagination
      v-if="pagination"
      class="fsd-table__pagination"
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      :size="size"
      layout="total, prev, pager, next, jumper"
      @current-change="emit('update:page', $event)"
    />
  </div>
</template>
