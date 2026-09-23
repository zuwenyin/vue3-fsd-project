import { env } from '../config/env.js'
import * as menuDao from '../dao/menu.dao.js'
import type { BackendRouteNode, MenuRecord } from '../shared/types.js'

/**
 * 菜单表 → BackendRouteNode[]（docs/11 §5.3）
 * - 只取 status = 1（是否按发布态过滤由 ENABLE_PUBLISH_FLOW 控制）
 * - 按 order_no 升序组装成树
 * - component 为空的目录节点：有子节点则不输出 component；无子节点则整节点丢弃
 * - roles / permissions 为空数组时不写入 meta
 */
export function buildRouteTree(): BackendRouteNode[] {
  const records = menuDao.findEnabled(env.ENABLE_PUBLISH_FLOW)
  return toNodes(records, null)
}

function toNodes(records: MenuRecord[], parentId: number | null): BackendRouteNode[] {
  const nodes: BackendRouteNode[] = []

  records
    .filter((record) => record.parentId === parentId)
    .sort((a, b) => a.orderNo - b.orderNo || a.id - b.id)
    .forEach((record) => {
      const children = toNodes(records, record.id)
      // 纯分组目录且无子节点 → 整节点丢弃
      if (!record.component && children.length === 0) return

      const meta: BackendRouteNode['meta'] = { title: record.title }
      if (record.titleKey) meta.titleKey = record.titleKey
      if (record.icon) meta.icon = record.icon
      meta.order = record.orderNo
      meta.keepAlive = record.keepAlive
      if (record.hideInMenu) meta.hideInMenu = record.hideInMenu
      if (record.hideChildrenInMenu) meta.hideChildrenInMenu = record.hideChildrenInMenu
      if (record.activePath) meta.activePath = record.activePath
      if (record.external) meta.external = record.external
      if (record.affix) meta.affix = record.affix
      if (record.layout) meta.layout = record.layout
      // 空权限数组不写入，避免前端误判为「需要权限」
      if (record.roles.length > 0) meta.roles = record.roles
      if (record.permissions.length > 0) meta.permissions = record.permissions

      const node: BackendRouteNode = {
        id: record.id,
        parentId: record.parentId,
        name: record.name,
        path: record.path,
        meta,
      }
      if (record.redirect) node.redirect = record.redirect
      if (record.component) node.component = record.component
      if (children.length > 0) node.children = children
      nodes.push(node)
    })

  return nodes
}
