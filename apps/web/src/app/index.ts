import { createApp, type App as VueApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { setupPinia } from './providers/pinia'
import { setupElement } from './providers/element'
import { setupI18n } from './providers/i18n'
import { setupMock } from './providers/mock'
import { appDirectives } from './directives'
import { registerDirectives } from '@/shared/lib/directives'
import { setupRouterGuard } from './router/guard'
import './router/types'

/**
 * 装配顺序不可变（docs/12 §3.6）：
 * pinia → element → i18n → mock → router → directives
 */
export async function bootstrap(): Promise<VueApp> {
  const app = createApp(App)

  setupPinia(app) // 必须早于 router（守卫中要用 store）
  setupElement(app)
  setupI18n(app)
  await setupMock()
  app.use(router)
  setupRouterGuard()
  registerDirectives(app, appDirectives)

  return app
}
