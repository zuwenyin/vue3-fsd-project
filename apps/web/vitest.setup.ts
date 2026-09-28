// 全局测试准备（docs/06 §8）：MSW server 生命周期 + 全局插件（i18n）。
// 既有单测大多用 `vi.mock` 打桩 API 模块，故 onUnhandledRequest 用 bypass，
// 未覆盖的请求交给原有逻辑（避免影响存量用例）。
import { config } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { i18n } from '@/shared/i18n'
import { server } from './mocks/server'

// 组件普遍使用 useI18n()（P7 起），此处全局注册一次即可；
// 个别 spec 自行传 plugins 时同一实例会被 Vue 忽略（不重复安装）。
config.global.plugins = [i18n]

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
