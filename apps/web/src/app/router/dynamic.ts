// 占位：P3 实现动态路由注册（docs/13 §3）
/** 维护已注册的动态路由名，登出 / 切换账号时精确 removeRoute */
export const dynamicRouteNames: Set<string> = new Set()

export function clearDynamicRoutes(): void {
  dynamicRouteNames.clear()
}
