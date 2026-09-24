import type { App } from 'vue'
import { ElConfigProvider } from 'element-plus'

/**
 * Element Plus 装配：只注册 ElConfigProvider，不叠加 app.use(ElementPlus)（docs/12 §6）。
 * 组件一律由 @repo/ui 显式 import 后局部使用，避免样式双份。
 */
export function setupElement(app: App): void {
  app.component('ElConfigProvider', ElConfigProvider)
}
