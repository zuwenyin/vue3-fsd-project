import type { InjectionKey, Ref } from 'vue'

/**
 * `AppLayout` 向各布局的 Header 下放的壳层能力：
 * 桌面 → 折叠/展开侧边栏；小屏（<960px）→ 开关抽屉（docs/15 §2.5）。
 * 抽屉状态归 `AppLayout`（唯一持有者），Header 只发信号、不自己持有状态。
 */
export interface LayoutShell {
  toggleSidebar: () => void
  /**
   * 开/关「布局设置抽屉」（P9）。
   * ★ 状态必须归 `AppLayout`：切换布局模式会重建 Header，若状态在 Header 内会随卸载丢失
   *   （实测：在抽屉里点「顶部栏」后面板直接消失，docs/07 P9 踩坑）。
   */
  toggleSettings: () => void
  /** 只读：提供方传 computed，布局侧传 ref 做默认值，故用 Readonly */
  isMobile: Readonly<Ref<boolean>>
}

export const LAYOUT_SHELL_KEY: InjectionKey<LayoutShell> = Symbol('layout-shell')
