import { getDb } from '../db/index.js'
import * as menuDao from '../dao/menu.dao.js'
import type { MenuInsertInput, MenuUpdateInput } from '../dao/menu.dao.js'
import { COMPONENT_ALLOWED, MAX_DEPTH, ORDER_MIN_GAP, ORDER_STEP } from '../shared/constants.js'
import { ApiError, ErrorCode } from '../shared/errors.js'
import type { MenuRecord, MenuTreeNode, MoveMenuPayload } from '../shared/types.js'

function conflict(message: string): ApiError {
  return new ApiError(ErrorCode.CONFLICT, message)
}

function invalid(message: string): ApiError {
  return new ApiError(ErrorCode.VALIDATION, message)
}

// ---------- 读取 ----------

export function listFlat(): MenuRecord[] {
  return menuDao.findAll()
}

/** 管理用树：包含 status = 0 与 hideInMenu = true 的项 */
export function listTree(): MenuTreeNode[] {
  const records = menuDao.findAll()
  return buildTree(records, null)
}

function buildTree(records: MenuRecord[], parentId: number | null): MenuTreeNode[] {
  return records
    .filter((record) => record.parentId === parentId)
    .sort((a, b) => a.orderNo - b.orderNo || a.id - b.id)
    .map((record) => ({ ...record, children: buildTree(records, record.id) }))
}

// ---------- 层级工具 ----------

/** 节点自身深度：顶层 = 1 */
function depthOfNode(id: number): number {
  let depth = 0
  let current: MenuRecord | undefined = menuDao.findById(id)
  while (current) {
    depth += 1
    current = current.parentId === null ? undefined : menuDao.findById(current.parentId)
  }
  return depth
}

/** 以 id 为根的子树高度（叶子 = 1） */
function subtreeHeight(id: number, records: MenuRecord[]): number {
  const children = records.filter((record) => record.parentId === id)
  if (children.length === 0) return 1
  return 1 + Math.max(...children.map((child) => subtreeHeight(child.id, records)))
}

function isDescendant(candidateId: number, ancestorId: number): boolean {
  let current: MenuRecord | undefined = menuDao.findById(candidateId)
  while (current?.parentId != null) {
    if (current.parentId === ancestorId) return true
    current = menuDao.findById(current.parentId)
  }
  return false
}

// ---------- 校验 ----------

function assertNameAvailable(name: string, excludeId?: number): void {
  if (!name.trim()) throw conflict('name 不能为空')
  const existing = menuDao.findByName(name)
  if (existing && existing.id !== excludeId) throw conflict(`name 已存在：${name}`)
}

function assertPathAvailable(path: string, parentId: number | null, excludeId?: number): void {
  const duplicated = menuDao
    .findSiblings(parentId)
    .some((item) => item.path === path && item.id !== excludeId)
  if (duplicated) throw conflict(`同父下 path 已存在：${path}`)
}

function assertDepth(parentId: number | null, height: number): void {
  const baseDepth = parentId === null ? 0 : depthOfNode(parentId)
  if (baseDepth + height > MAX_DEPTH) {
    throw invalid(`层级超过上限 ${MAX_DEPTH}（目标深度 ${baseDepth + height}）`)
  }
}

function assertExternalPath(external: boolean | undefined, path: string): void {
  if (!external) return
  try {
    const url = new URL(path)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('协议不合法')
  } catch {
    throw invalid('external = true 时 path 必须为合法 http(s) URL')
  }
}

/** component 白名单软校验：不命中只告警不拒绝（docs/11 §6） */
function warnComponent(component: string | null | undefined): void {
  if (!component) return
  if (component === COMPONENT_ALLOWED.layout) return
  const matched = COMPONENT_ALLOWED.pagesDirs.some((dir) => component.startsWith(`${dir}/`))
  if (!matched) {
    console.warn(`[menu] component 不在白名单前缀内，前端解析时可能降级 404：${component}`)
  }
}

function assertPublishStatus(status: 'draft' | 'published' | undefined): void {
  if (status === undefined) return
  if (status !== 'draft' && status !== 'published') {
    throw invalid('publish_status 只允许 draft / published')
  }
  // 决策 D4：本期不接受显式 draft 写入
  if (status === 'draft') throw invalid('本期 publish_status 恒为 published，不接受 draft 写入')
}

// ---------- 写操作 ----------

export function create(input: MenuInsertInput): MenuRecord {
  assertNameAvailable(input.name)
  if (input.parentId !== null) menuDao.requireMenu(input.parentId) // 不存在 → 404
  assertPathAvailable(input.path, input.parentId)
  assertDepth(input.parentId, 1)
  assertExternalPath(input.external, input.path)
  assertPublishStatus(input.publishStatus)
  warnComponent(input.component)

  const parentId = input.parentId ?? null
  const orderNo =
    input.orderNo ?? (menuDao.findSiblings(parentId).at(-1)?.orderNo ?? 0) + ORDER_STEP

  return menuDao.insert({
    ...input,
    parentId,
    orderNo,
    // redirect 仅顶层允许，子级自动清空
    redirect: parentId === null ? (input.redirect ?? null) : null,
    publishStatus: 'published',
  })
}

export function update(id: number, patch: MenuUpdateInput): MenuRecord {
  const current = menuDao.requireMenu(id)
  const next: MenuUpdateInput = { ...patch }

  if (next.name !== undefined) assertNameAvailable(next.name, id)

  const targetParentId = next.parentId !== undefined ? (next.parentId ?? null) : current.parentId
  if (targetParentId !== null) {
    menuDao.requireMenu(targetParentId) // 不存在 → 404
    if (targetParentId === id) throw conflict('parentId 不能是自身')
    if (isDescendant(targetParentId, id)) throw conflict('parentId 不能是其子孙')
  }

  const nextPath = next.path ?? current.path
  if (next.path !== undefined || next.parentId !== undefined) {
    assertPathAvailable(nextPath, targetParentId, id)
  }

  // 改 parentId 触发层级重算
  if (next.parentId !== undefined) {
    assertDepth(targetParentId, subtreeHeight(id, menuDao.findAll()))
  }

  assertExternalPath(next.external ?? current.external, nextPath)
  assertPublishStatus(next.publishStatus)
  warnComponent(next.component)

  if (targetParentId !== null && next.redirect !== undefined) next.redirect = null

  return menuDao.update(id, next)
}

export function remove(id: number, cascade: boolean): { id: number } {
  menuDao.requireMenu(id)
  if (!cascade && menuDao.hasChildren(id)) {
    throw conflict('存在子菜单，请先删除子节点或使用 cascade=true')
  }
  // 级联依赖 ON DELETE CASCADE，放在事务内
  getDb().transaction(() => {
    menuDao.remove(id)
  })
  return { id }
}

export function move(payload: MoveMenuPayload): MenuRecord {
  const node = menuDao.requireMenu(payload.id)
  const targetParentId = payload.targetParentId ?? null

  if (targetParentId !== null) {
    menuDao.requireMenu(targetParentId) // 不存在 → 404
    if (targetParentId === node.id) throw conflict('parentId 不能是自身')
    if (isDescendant(targetParentId, node.id)) throw conflict('parentId 不能是其子孙')
  }

  assertDepth(targetParentId, subtreeHeight(node.id, menuDao.findAll()))

  const siblings = menuDao.findSiblings(targetParentId, node.id)
  const beforeId = payload.beforeId ?? null

  if (beforeId === null) {
    const last = siblings.at(-1)
    const orderNo = (last?.orderNo ?? 0) + ORDER_STEP
    return getDb().transaction(() => menuDao.updateParentAndOrder(node.id, targetParentId, orderNo))
  }

  const index = siblings.findIndex((item) => item.id === beforeId)
  const before = siblings[index]
  if (!before) throw new ApiError(ErrorCode.NOT_FOUND, `beforeId ${beforeId} 不在目标层`)

  const prev = siblings[index - 1]
  const prevOrder = prev?.orderNo ?? before.orderNo - ORDER_STEP

  // 首尾插值空间不足 → 该层整体重排为 1000, 2000, 3000...
  if (Math.abs(before.orderNo - prevOrder) < ORDER_MIN_GAP) {
    const orderedIds = siblings.map((item) => item.id)
    const insertAt = orderedIds.indexOf(beforeId)
    orderedIds.splice(insertAt, 0, node.id)
    return getDb().transaction(() => {
      menuDao.reorderSiblings(orderedIds, ORDER_STEP)
      return menuDao.updateParentAndOrder(node.id, targetParentId, ORDER_STEP * (insertAt + 1))
    })
  }

  const orderNo = (prevOrder + before.orderNo) / 2
  return getDb().transaction(() => menuDao.updateParentAndOrder(node.id, targetParentId, orderNo))
}

/**
 * 决策 D4：本期保存即生效（写库即 published），此函数为空壳，幂等返回成功。
 * 生产语义：批量置 published 并写 published_at，前端出现「发布」按钮与「有未发布变更」提示。
 */
export function publishDraft(ids: number[]): { ids: number[]; published: boolean } {
  return { ids, published: true }
}
