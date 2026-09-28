import type { Component } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import {
  fetchUserRoutes,
  useMenuStore,
  type BackendRouteNode,
  type MenuItem,
  type RouteMetaPayload,
} from '@/entities/menu'
import { filterRoutes } from '@/entities/permission'
import { useUserStore } from '@/entities/user'
import { resolvePageComponent } from '@/shared/lib/page-modules'
import { LAYOUT_ROUTE_NAME } from './constant-routes'
import LAYOUT from '@/widgets/layout/AppLayout.vue'

/** 已注册的动态路由名，用于精确移除（热替换的关键） */
const dynamicRouteNames = new Set<string>()

/** 组装中的路由记录（RouteRecordRaw 为联合类型，先按可变形态拼装再断言） */
interface PendingRecord {
  name: string
  path: string
  meta: RouteMetaPayload
  component?: Component
  redirect?: string
  children?: RouteRecordRaw[]
}

function toRouteRecord(node: BackendRouteNode): RouteRecordRaw | null {
  // 外链不注册路由：菜单树里仍保留（侧边栏渲染为 <a target="_blank">，docs/15 §2.3），
  // 否则 http(s):// 开头的 path 会被当成路由路径注册，产生永远匹配不到的路由。
  if (node.meta.external) return null

  const comp = node.component === 'Layout' ? LAYOUT : resolvePageComponent(node.component)
  // 声明了 component 却解析失败 → 整节点丢弃（调用方兜底 404）
  if (node.component && !comp) return null

  const record: PendingRecord = {
    name: node.name,
    path: node.path,
    meta: { ...node.meta },
  }
  if (comp) record.component = comp
  if (node.redirect) record.redirect = node.redirect

  if (node.children?.length) {
    const children = node.children
      .map((child) => toRouteRecord(child))
      .filter((child): child is RouteRecordRaw => child !== null)
    if (children.length > 0) record.children = children
  }

  return record as unknown as RouteRecordRaw
}

/** 注册动态路由（挂在 Layout 之下）；同名先移除，保证定义变更（path / component / meta）生效 */
export function registerDynamicRoutes(nodes: BackendRouteNode[], router: Router): void {
  for (const node of nodes) {
    const record = toRouteRecord(node)
    if (!record) continue

    const name = String(record.name)
    if (router.hasRoute(name)) router.removeRoute(name)
    router.addRoute(LAYOUT_ROUTE_NAME, record)
    dynamicRouteNames.add(name)
  }
}

/** 移除在新路由表中已消失的旧路由（热替换的清理阶段） */
export function removeStaleRoutes(router: Router, keep: Set<string>): void {
  for (const name of [...dynamicRouteNames]) {
    if (keep.has(name)) continue
    if (router.hasRoute(name)) router.removeRoute(name)
    dynamicRouteNames.delete(name)
  }
}

/** 精确移除全部动态路由（登出 / 切换账号） */
export function clearDynamicRoutes(router: Router): void {
  for (const name of [...dynamicRouteNames]) {
    if (router.hasRoute(name)) router.removeRoute(name)
  }
  dynamicRouteNames.clear()
}

/** 已注册的动态路由名（只读快照，供测试与调试） */
export function getDynamicRouteNames(): string[] {
  return [...dynamicRouteNames]
}

/**
 * 拉取 → 过滤 → 注册 → 重建菜单树（首次加载与「应用变更」共用，docs/13 §3.1）。
 * ★ 顺序：先注册新的（同名覆盖），再清理消失的 —— 当前所在路由全程有效，不会瞬间落 404。
 */
export async function applyRoutes(router: Router): Promise<MenuItem[]> {
  const user = useUserStore()
  // ★ 刷新页面后 store 里只有 token（token 持久化在 storage），roles / permissions 为空；
  //   若不先拉用户信息，filterRoutes 会把所有受限路由全部过滤掉（实测踩坑：刷新必落 404）。
  if (!user.profile) await user.loadProfile()

  const nodes = await fetchUserRoutes()
  const accessible = filterRoutes(nodes, user.permissions, user.roles)

  registerDynamicRoutes(accessible, router)
  removeStaleRoutes(router, new Set(collectNames(accessible)))

  return useMenuStore().setRoutes(accessible)
}

function collectNames(nodes: BackendRouteNode[]): string[] {
  return nodes.flatMap((node) => [node.name, ...collectNames(node.children ?? [])])
}
