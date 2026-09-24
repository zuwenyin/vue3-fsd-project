import type { App, Directive } from 'vue'

/**
 * 注册 app 层传入的指令表。
 * 指令实现留在 `app/directives/`（需要 `@/entities/*`），shared 保持零依赖（docs/13 §3.7 修订说明）。
 */
export function registerDirectives(app: App, directives: Record<string, Directive>): void {
  for (const [name, directive] of Object.entries(directives)) {
    app.directive(name, directive)
  }
}
