import type { App } from 'vue'
import { i18n } from '@/shared/i18n'

/**
 * 装配 vue-i18n（docs/07 P7-1）。
 * 初始语言由 `shared/i18n` 读 `fsd:lang` 决定（避免先中文再切英文），
 * EP 内置文案经 `App.vue` 的 `<ElConfigProvider :locale>` 联动。
 */
export function setupI18n(app: App): void {
  app.use(i18n)
}
