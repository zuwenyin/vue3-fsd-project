import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * 测试用 MSW server（主要用途）：`vitest.setup.ts` 中 beforeAll/afterEach/afterAll 管理，
 * 让组件与路由/权限测试不依赖真实 `apps/server`（docs/06 §9）。
 */
export const server = setupServer(...handlers)
