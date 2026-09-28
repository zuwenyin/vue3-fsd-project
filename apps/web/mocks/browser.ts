import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * 离线兜底（可选）：服务端未启动时设 `VITE_USE_MOCK=true` 走浏览器 worker。
 * `public/mockServiceWorker.js` 由 `pnpm exec msw init public/` 生成。
 */
export const worker = setupWorker(...handlers)
