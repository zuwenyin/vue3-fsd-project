/** 明暗模式（docs/04 §1）：auto 跟随系统 `prefers-color-scheme` */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 持久化到 `fsd:theme` 的主题偏好（决策 D1，键见 shared/config/storage-keys.ts） */
export interface ThemePreference {
  mode: ThemeMode
  /** 品牌色（#RRGGBB，运行时生成色阶覆盖 EP 变量） */
  primary: string
}
