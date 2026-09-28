import type { MenuRecord, MenuTreeNode } from '@/entities/menu'

let seq = 0

/** 测试用菜单记录（字段默认值可被 partial 覆盖） */
export function record(partial: Partial<MenuRecord> = {}): MenuRecord {
  seq += 1
  const id = partial.id ?? seq
  return {
    id,
    parentId: null,
    name: `Menu${id}`,
    path: `/menu-${id}`,
    title: `菜单${id}`,
    orderNo: id * 10,
    keepAlive: false,
    hideInMenu: false,
    hideChildrenInMenu: false,
    external: false,
    affix: false,
    roles: [],
    permissions: [],
    status: 1,
    publishStatus: 'published',
    createdAt: '2026-09-28T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    ...partial,
  }
}

/** 测试用管理树节点（children 恒为数组） */
export function node(partial: Partial<MenuTreeNode> = {}): MenuTreeNode {
  return { ...record(partial), children: partial.children ?? [] }
}
