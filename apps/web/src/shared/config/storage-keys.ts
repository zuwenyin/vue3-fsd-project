/**
 * 持久化键常量（决策 D1）：键名集中管理，禁止散落字符串字面量。
 * 一律走 `@repo/utils` 的 storage（`fsd:` 前缀），禁止直接 localStorage。
 */
export const TOKEN_KEY = 'fsd:token'
export const THEME_KEY = 'fsd:theme'
export const LAYOUT_KEY = 'fsd:layout'
export const TABS_KEY = 'fsd:tabs'
