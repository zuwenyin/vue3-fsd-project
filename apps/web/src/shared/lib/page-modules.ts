import type { Component } from 'vue'

/**
 * 页面组件注册表（docs/03 §3）。
 * ★ 放在 shared：菜单配置页（features）也要用白名单，放 app/ 会形成向上依赖。
 * key 用绝对路径 `/src/pages/**\/*.vue`（编译期确定，不依赖 alias）。
 *
 * `component === 'Layout'` 不在此处理：shared 不允许导入 `@/widgets/*`（ESLint FSD 约束），
 * 由 `app/router/dynamic.ts` 在 app 层映射到 AppLayout（见 docs/03 §3 修订说明）。
 */
const pageModules = import.meta.glob<Component>('/src/pages/**/*.vue')

/** 组件路径白名单，供菜单配置页下拉使用（docs/14 §4.4） */
export const pageComponentKeys: string[] = Object.keys(pageModules)
  .map((key) => key.replace(/^\/src\/pages\//, '').replace(/\.vue$/, ''))
  .sort()

/** `system/user/index` → 懒加载组件；未命中返回 undefined（'Layout' 由 app 层映射） */
export function resolvePageComponent(component?: string): Component | undefined {
  if (!component) return undefined
  if (component === 'Layout') return undefined

  const key = `/src/pages/${component.replace(/^\/+/, '')}.vue`
  const loader = pageModules[key]
  if (!loader) {
    console.error(`[router] 未找到组件: ${component} → ${key}`)
    return undefined
  }
  return loader
}
