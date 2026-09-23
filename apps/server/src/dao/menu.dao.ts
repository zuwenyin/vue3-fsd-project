import { getDb } from '../db/index.js'
import { ApiError, ErrorCode } from '../shared/errors.js'
import type { LayoutMode, MenuRecord, MenuRow } from '../shared/types.js'

export interface MenuInsertInput {
  parentId: number | null
  name: string
  path: string
  redirect?: string | null
  component?: string | null
  title: string
  titleKey?: string | null
  icon?: string | null
  orderNo?: number
  keepAlive?: boolean
  hideInMenu?: boolean
  hideChildrenInMenu?: boolean
  activePath?: string | null
  external?: boolean
  affix?: boolean
  layout?: LayoutMode | null
  roles?: string[]
  permissions?: string[]
  status?: 0 | 1
  publishStatus?: 'draft' | 'published'
}

export type MenuUpdateInput = Partial<MenuInsertInput>

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function toBool(value: number | null): boolean {
  return value === 1
}

function toRecord(row: MenuRow): MenuRecord {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    path: row.path,
    redirect: row.redirect ?? undefined,
    component: row.component ?? undefined,
    title: row.title,
    titleKey: row.title_key ?? undefined,
    icon: row.icon ?? undefined,
    orderNo: row.order_no,
    keepAlive: toBool(row.keep_alive),
    hideInMenu: toBool(row.hide_in_menu),
    hideChildrenInMenu: toBool(row.hide_children_in_menu),
    activePath: row.active_path ?? undefined,
    external: toBool(row.external),
    affix: toBool(row.affix),
    layout: row.layout ? (row.layout as LayoutMode) : undefined,
    roles: parseJsonArray(row.roles),
    permissions: parseJsonArray(row.permissions),
    status: row.status === 1 ? 1 : 0,
    publishStatus: row.publish_status === 'draft' ? 'draft' : 'published',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT_ALL = 'SELECT * FROM sys_menu ORDER BY COALESCE(parent_id, 0), order_no, id'

export function findAll(): MenuRecord[] {
  return getDb().prepare(SELECT_ALL).all<MenuRow>().map(toRecord)
}

/** 只取启用项；是否按发布态过滤由 ENABLE_PUBLISH_FLOW 控制（决策 D4，本期 false） */
export function findEnabled(onlyPublished: boolean): MenuRecord[] {
  const sql = onlyPublished
    ? 'SELECT * FROM sys_menu WHERE status = 1 AND publish_status = ? ORDER BY COALESCE(parent_id, 0), order_no, id'
    : 'SELECT * FROM sys_menu WHERE status = 1 ORDER BY COALESCE(parent_id, 0), order_no, id'
  const stmt = getDb().prepare(sql)
  return (onlyPublished ? stmt.all<MenuRow>('published') : stmt.all<MenuRow>()).map(toRecord)
}

export function findById(id: number): MenuRecord | undefined {
  const row = getDb().prepare('SELECT * FROM sys_menu WHERE id = ?').get<MenuRow>(id)
  return row ? toRecord(row) : undefined
}

export function requireMenu(id: number): MenuRecord {
  const record = findById(id)
  if (!record) throw new ApiError(ErrorCode.NOT_FOUND, `菜单 ${id} 不存在`)
  return record
}

export function findByName(name: string): MenuRecord | undefined {
  const row = getDb().prepare('SELECT * FROM sys_menu WHERE name = ?').get<MenuRow>(name)
  return row ? toRecord(row) : undefined
}

export function hasChildren(id: number): boolean {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS count FROM sys_menu WHERE parent_id = ?')
    .get<{ count: number }>(id)
  return (row?.count ?? 0) > 0
}

/** 同层兄弟（可选排除自身），按 order_no 升序 */
export function findSiblings(parentId: number | null, excludeId?: number): MenuRecord[] {
  const sql =
    parentId === null
      ? 'SELECT * FROM sys_menu WHERE parent_id IS NULL ORDER BY order_no, id'
      : 'SELECT * FROM sys_menu WHERE parent_id = ? ORDER BY order_no, id'
  const stmt = getDb().prepare(sql)
  const rows = parentId === null ? stmt.all<MenuRow>() : stmt.all<MenuRow>(parentId)
  return rows.map(toRecord).filter((row) => row.id !== excludeId)
}

const INSERT_SQL = `
INSERT INTO sys_menu (
  parent_id, name, path, redirect, component, title, title_key, icon, order_no,
  keep_alive, hide_in_menu, hide_children_in_menu, active_path, external, affix,
  layout, roles, permissions, status, publish_status, published_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`

export function insert(input: MenuInsertInput): MenuRecord {
  const result = getDb()
    .prepare(INSERT_SQL)
    .run(
      input.parentId,
      input.name,
      input.path,
      input.redirect ?? null,
      input.component ?? null,
      input.title,
      input.titleKey ?? null,
      input.icon ?? null,
      input.orderNo ?? 1000,
      input.keepAlive === false ? 0 : 1,
      input.hideInMenu ? 1 : 0,
      input.hideChildrenInMenu ? 1 : 0,
      input.activePath ?? null,
      input.external ? 1 : 0,
      input.affix ? 1 : 0,
      input.layout ?? null,
      JSON.stringify(input.roles ?? []),
      JSON.stringify(input.permissions ?? []),
      input.status ?? 1,
      input.publishStatus ?? 'published',
    )
  return requireMenu(result.lastInsertRowid)
}

const COLUMN_MAP: Record<keyof MenuInsertInput, string> = {
  parentId: 'parent_id',
  name: 'name',
  path: 'path',
  redirect: 'redirect',
  component: 'component',
  title: 'title',
  titleKey: 'title_key',
  icon: 'icon',
  orderNo: 'order_no',
  keepAlive: 'keep_alive',
  hideInMenu: 'hide_in_menu',
  hideChildrenInMenu: 'hide_children_in_menu',
  activePath: 'active_path',
  external: 'external',
  affix: 'affix',
  layout: 'layout',
  roles: 'roles',
  permissions: 'permissions',
  status: 'status',
  publishStatus: 'publish_status',
}

function toColumnValue(key: keyof MenuInsertInput, value: unknown): unknown {
  if (key === 'roles' || key === 'permissions') return JSON.stringify(value ?? [])
  if (key === 'keepAlive') return value === false ? 0 : 1
  if (
    key === 'hideInMenu' ||
    key === 'hideChildrenInMenu' ||
    key === 'external' ||
    key === 'affix'
  ) {
    return value ? 1 : 0
  }
  return value ?? null
}

export function update(id: number, patch: MenuUpdateInput): MenuRecord {
  const keys = Object.keys(patch) as Array<keyof MenuInsertInput>
  if (keys.length === 0) return requireMenu(id)
  const assignments = keys.map((key) => `${COLUMN_MAP[key]} = ?`).join(', ')
  const values = keys.map((key) => toColumnValue(key, patch[key]))
  getDb()
    .prepare(`UPDATE sys_menu SET ${assignments}, updated_at = datetime('now') WHERE id = ?`)
    .run(...values, id)
  return requireMenu(id)
}

export function updateParentAndOrder(
  id: number,
  parentId: number | null,
  orderNo: number,
): MenuRecord {
  getDb()
    .prepare(
      `UPDATE sys_menu SET parent_id = ?, order_no = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .run(parentId, orderNo, id)
  return requireMenu(id)
}

/** 同层重排：按传入顺序改为 STEP, 2*STEP, 3*STEP... */
export function reorderSiblings(ids: number[], step: number): void {
  const stmt = getDb().prepare('UPDATE sys_menu SET order_no = ? WHERE id = ?')
  ids.forEach((id, index) => {
    stmt.run(step * (index + 1), id)
  })
}

export function remove(id: number): void {
  getDb().prepare('DELETE FROM sys_menu WHERE id = ?').run(id)
}
