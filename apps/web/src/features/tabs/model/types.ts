/** 一个页签（持久化到 `fsd:tabs`，docs/15 §3.1） */
export interface TabView {
  /** `route.name`：同时是 `<keep-alive :include>` 的键（要求页面组件名与之相等） */
  name: string
  path: string
  /** 已经过 resolveMenuTitle() 的展示标题（决策 D2） */
  title: string
  titleKey?: string
  icon?: string
  /** 固定页签：不可关闭，且 closeAll / LRU 淘汰时保留 */
  affix: boolean
  /** 是否进 keep-alive 缓存 */
  keepAlive: boolean
}

/** 右键菜单项（AppTabs → ContextMenu 的动作契约） */
export interface TabContextAction {
  key: 'refresh' | 'close' | 'closeOthers' | 'closeLeft' | 'closeRight' | 'closeAll'
  label: string
  disabled?: boolean
}
