// 全局测试准备（docs/06 §8）：在此挂载 MSW server 生命周期。
// 既有单测大多用 `vi.mock` 打桩 API 模块，故 onUnhandledRequest 用 bypass，
// 未覆盖的请求交给原有逻辑（避免影响存量用例）。
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
