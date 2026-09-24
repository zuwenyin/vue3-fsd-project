import { env } from '@/shared/config/env'

/**
 * 预留：仅 VITE_USE_MOCK=true 时启动 MSW worker（真实 handlers 见 docs/06 §9）。
 * 本阶段 mocks/browser 尚未落地，故只告警不启动，避免引入悬空 import。
 */
export async function setupMock(): Promise<void> {
  if (!env.useMock) return
  // P2 占位：实现 handlers 后改为 const { worker } = await import('./mocks/browser') + worker.start(...)
  console.warn('[mock] VITE_USE_MOCK=true，但 mocks/browser 尚未实现（docs/06 §9）')
}
