import { isDescendant } from '@/entities/menu'
import type { MenuRecord, MenuTreeNode, MoveMenuPayload } from '@/entities/menu'
import { MENU_MAX_DEPTH } from './constants'

/** 拖拽行标注（渲染顺序 + 深度 + 父级），与 DOM 上的 data-* 一一对应 */
export interface MenuDragRow {
  id: number
  parentId: number | null
  /** 深度：顶层 = 1 */
  level: number
}

/** 按渲染顺序扁平化并标注深度 / 父级（单测构造 DragRow 也用它） */
export function flattenWithLevel(
  tree: MenuTreeNode[],
  level = 1,
  parentId: number | null = null,
): MenuDragRow[] {
  return tree.flatMap((node) => [
    { id: node.id, parentId, level },
    ...flattenWithLevel(node.children, level + 1, node.id),
  ])
}

export function findNode(tree: MenuTreeNode[], id: number): MenuTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}

// ---------- 内部工具（纯函数，均返回新数组） ----------

function cloneNode(node: MenuTreeNode): MenuTreeNode {
  return {
    ...node,
    roles: [...node.roles],
    permissions: [...node.permissions],
    children: node.children.map(cloneNode),
  }
}

/**
 * 从树中摘除节点；未找到返回 null。
 * 注意：子孙层摘除成功也算「找到」——子调用返回非 null 即表示已摘除，
 * 否则顶层调用会误判为「未找到」而返回 null，让调用方以为整棵树没变化。
 */
function removeNode(tree: MenuTreeNode[], id: number): MenuTreeNode[] | null {
  const next: MenuTreeNode[] = []
  let removed = false
  for (const node of tree) {
    if (node.id === id) {
      removed = true
      continue
    }
    const children = removeNode(node.children, id)
    if (children) {
      removed = true
      next.push({ ...node, children })
      continue
    }
    next.push(node)
  }
  return removed ? next : null
}

function insertSibling(
  siblings: MenuTreeNode[],
  node: MenuTreeNode,
  beforeId: number | null,
): MenuTreeNode[] {
  const next = [...siblings]
  const index = beforeId == null ? -1 : next.findIndex((item) => item.id === beforeId)
  if (index === -1) {
    next.push(node)
    return next
  }
  next.splice(index, 0, node)
  return next
}

/** 替换指定节点的 children 引用（沿路径新建对象，保证响应式） */
function replaceChildren(
  tree: MenuTreeNode[],
  parentId: number,
  children: MenuTreeNode[],
): MenuTreeNode[] {
  return tree.map((node) =>
    node.id === parentId
      ? { ...node, children }
      : { ...node, children: replaceChildren(node.children, parentId, children) },
  )
}

function insertNode(
  tree: MenuTreeNode[],
  node: MenuTreeNode,
  targetParentId: number | null,
  beforeId: number | null,
): MenuTreeNode[] {
  if (targetParentId === null) return insertSibling(tree, node, beforeId)
  if (!findNode(tree, targetParentId)) return tree
  const parent = findNode(tree, targetParentId)
  if (!parent) return tree
  return replaceChildren(tree, targetParentId, insertSibling(parent.children, node, beforeId))
}

/** 全树同层按 orderNo 升序（与后端 listTree 一致：orderNo asc, id asc） */
function sortAll(tree: MenuTreeNode[]): MenuTreeNode[] {
  return [...tree]
    .sort((a, b) => a.orderNo - b.orderNo || a.id - b.id)
    .map((node) => ({ ...node, children: sortAll(node.children) }))
}

// ---------- 对外纯函数 ----------

/**
 * 就地保存更新：字段替换 + 全树同层重排；换父级时摘除后追加到新父末尾。
 * 未找到节点 / 非法换父（自身子孙）时原样返回。
 */
export function applyLocalUpdate(tree: MenuTreeNode[], record: MenuRecord): MenuTreeNode[] {
  const current = findNode(tree, record.id)
  if (!current) return tree
  if (record.parentId !== null && isDescendant(tree, record.id, record.parentId)) return tree

  let next: MenuTreeNode[]
  if (current.parentId === record.parentId) {
    // 就地更新：字段替换（children 引用保留），顺序随后统一按 orderNo 重排
    next = updateInPlace(tree, record)
  } else {
    // 换父级：摘除后追加到新父末尾（后端 update 不改 orderNo）
    const moved: MenuTreeNode = { ...current, ...record, children: current.children }
    const rest = removeNode(tree, record.id)
    next = insertNode(rest ?? [], moved, record.parentId, null)
  }
  return sortAll(next)
}

function updateInPlace(tree: MenuTreeNode[], record: MenuRecord): MenuTreeNode[] {
  return tree.map((node) =>
    node.id === record.id
      ? { ...node, ...record, children: node.children }
      : { ...node, children: updateInPlace(node.children, record) },
  )
}

/**
 * 乐观移动（非法目标原样返回，不抛错——校验在编排层与后端）。
 * 顺序以数组为准（orderNo 由后端落库后下次加载对齐）。
 */
export function applyLocalMove(tree: MenuTreeNode[], payload: MoveMenuPayload): MenuTreeNode[] {
  const node = findNode(tree, payload.id)
  if (!node) return tree
  if (payload.targetParentId != null) {
    if (payload.targetParentId === payload.id) return tree
    if (isDescendant(tree, payload.id, payload.targetParentId)) return tree
  }
  const moved = cloneNode(node)
  const rest = removeNode(tree, payload.id)
  if (!rest) return tree
  return insertNode(rest, moved, payload.targetParentId, payload.beforeId ?? null)
}

/**
 * 拖拽落点换算（docs/14 §5.3；不用 evt.newIndex，统一以 id 计算 beforeId）。
 *
 * 规则（可预测、可单测）：
 * - 拖到某行之后 = 与该行**同级**（新父 = 该行的父）；
 * - 拖到列表头 = 顶层；
 * - 进入某父级 = 拖到该父级**任一子级**之后（空目录用「新增子级」按钮）；
 * - `beforeId` = 新位置之后第一个深度 ≤ 新层级的行；无则追加到末尾。
 *
 * 深度预判（决策 D3）：`新层级 + 子树高度 - 1 > MENU_MAX_DEPTH` → 返回 null（禁止）。
 */
export function toMovePayload(
  rows: MenuDragRow[],
  dragIndex: number,
  draggedHeight: number,
): MoveMenuPayload | null {
  const dragged = rows[dragIndex]
  if (!dragged) return null

  const prev = dragIndex > 0 ? rows[dragIndex - 1] : null
  const targetParentId = prev ? prev.parentId : null
  const newLevel = prev ? prev.level : 1

  if (targetParentId === dragged.id) return null
  if (newLevel + draggedHeight - 1 > MENU_MAX_DEPTH) return null

  // ★ beforeId 必须是「目标父级之下」的行：用 parentId 匹配，而不是「深度 ≤ 新层级」。
  //   后者会取到另一个父级下的相邻行（如拖到某子级之后时命中下一个顶级菜单），
  //   后端据此判 `beforeId 不在目标层` → 整个 move 失败回滚（E2E 实测踩坑）。
  const before = rows.slice(dragIndex + 1).find((row) => row.parentId === targetParentId)

  return { id: dragged.id, targetParentId, beforeId: before ? before.id : null }
}

// ---------- 与 @repo/ui 的类型适配 ----------

/**
 * `MenuTreeNode[]` → `FsdTreeSelect` 的 `data`。
 *
 * `MenuTreeNode` 是 interface（无索引签名），不能直接赋给 `Record<string, unknown>[]`；
 * 树选择器只按 `:props` 映射读取 id/title/children，因此在边界处收窄一次。
 */
export function toTreeSelectData(nodes: MenuTreeNode[]): Record<string, unknown>[] {
  return nodes as unknown as Record<string, unknown>[]
}

/** 窄屏降级：上移 / 下移（同层内），到边界返回 null */
export function siblingMovePayload(
  tree: MenuTreeNode[],
  id: number,
  direction: 'up' | 'down',
): MoveMenuPayload | null {
  const findSiblings = (nodes: MenuTreeNode[]): MenuTreeNode[] | null => {
    for (const node of nodes) {
      const hit = node.children.find((child) => child.id === id)
      if (hit) return node.children
      const found = findSiblings(node.children)
      if (found) return found
    }
    return null
  }

  const topLevelHit = tree.find((node) => node.id === id)
  const siblings = topLevelHit ? tree : findSiblings(tree)
  if (!siblings) return null
  const index = siblings.findIndex((item) => item.id === id)
  const parentId = siblings[0]?.parentId ?? null

  if (direction === 'up') {
    if (index <= 0) return null
    const before = siblings[index - 1]
    if (!before) return null
    return { id, targetParentId: parentId, beforeId: before.id }
  }
  if (index >= siblings.length - 1) return null
  const afterNext = siblings[index + 2]
  return { id, targetParentId: parentId, beforeId: afterNext ? afterNext.id : null }
}
