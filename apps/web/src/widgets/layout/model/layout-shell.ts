import type { InjectionKey, Ref } from 'vue'

/**
 * `AppLayout` 向各布局的 Header 下放的壳层能力：
 * 桌面 → 折叠/展开侧边栏；小屏（<960px）→ 开关抽屉（docs/15 §2.5）。
 * 抽屉状态归 `AppLayout`（唯一持有者），Header 只发信号、不自己持有状态。
 */
export interface LayoutShell {
  toggleSidebar: () => void
  /** 只读：提供方传 computed，布局侧传 ref 做默认值，故用 Readonly */
  isMobile: Readonly<Ref<boolean>>
}

export const LAYOUT_SHELL_KEY: InjectionKey<LayoutShell> = Symbol('layout-shell')
