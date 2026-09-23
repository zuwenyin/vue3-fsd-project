/** 决策 D3：菜单层级上限（创建 / 移动时校验，超出直接拒绝） */
export const MAX_DEPTH = 3

/** order_no 步长：追加到末尾时 last + STEP；重排时从 STEP 开始递增 */
export const ORDER_STEP = 1000

/** 相邻 order_no 差值小于该值时触发同层重排 */
export const ORDER_MIN_GAP = 1

/** component 白名单前缀（软校验：不命中只告警不拒绝，docs/11 §6） */
export const COMPONENT_ALLOWED = {
  layout: 'Layout',
  pagesDirs: ['system', 'dashboard', 'profile'],
} as const
