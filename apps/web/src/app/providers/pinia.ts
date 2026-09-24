import { createPinia, type Pinia } from 'pinia'
import type { App } from 'vue'

export const pinia: Pinia = createPinia()

export function setupPinia(app: App): void {
  app.use(pinia)
}
