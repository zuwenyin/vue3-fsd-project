import type { App } from 'vue'
import { ElConfigProvider } from 'element-plus'
// 主应用直接使用 ElMessage（shared/api 的拦截器、登录页），需自行引入其按需样式；
// 其余 EP 组件的样式由 @repo/ui 各组件内部显式引入（docs/05 §Element Plus 引入规则）
import 'element-plus/es/components/message/style/css'

/**
 * Element Plus 装配：只注册 ElConfigProvider，不叠加 app.use(ElementPlus)（docs/12 §6）。
 * 组件一律由 @repo/ui 显式 import 后局部使用，避免样式双份。
 */
export function setupElement(app: App): void {
  app.component('ElConfigProvider', ElConfigProvider)
}
