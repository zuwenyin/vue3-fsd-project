export interface FsdOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface FsdTableColumn {
  /** 对应 row 的字段名 */
  key: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  /** true → 走 #<key> 具名插槽 */
  slot?: boolean
  formatter?: (row: Record<string, unknown>) => string
}

export interface FsdTableProps<T = Record<string, unknown>> {
  data: T[]
  columns?: FsdTableColumn[]
  loading?: boolean
  rowKey?: string
  treeProps?: { children: string; hasChildren?: string }
  defaultExpandAll?: boolean
  pagination?: false | { page: number; pageSize: number; total: number }
  emptyText?: string
}

export type FsdButtonType = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
export type FsdSize = 'large' | 'default' | 'small'
export type FsdTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
