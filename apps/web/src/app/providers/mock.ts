import { env } from '@/shared/config/env'

/**
 * MSW 启动（docs/06 §9）：**默认关闭**，开发期数据来自 `apps/server`。
 * 仅当 `VITE_USE_MOCK=true` 且处于 dev 时启动浏览器 worker（离线兜底）。
 */
export async function setupMock(): Promise<void> {
  if (!env.useMock) return
  if (!import.meta.env.DEV) {
    console.warn('[mock] VITE_USE_MOCK 仅在 dev 生效（docs/06 §9）')
    return
  }

  // src/app/providers → 三级上溯到 apps/web/mocks
  const { worker } = await import('../../../mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  console.info('[mock] MSW worker 已启动（离线兜底模式；数据形状与 apps/server 一致）')
}
