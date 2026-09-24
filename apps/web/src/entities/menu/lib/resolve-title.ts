/**
 * 菜单标题回落（docs/13 §3.4.1，决策 D2）
 * 本期不接 vue-i18n：`t` 缺省时回落 `title`；P7 传入 `t` 即可，调用方无需改动。
 */
export interface TitleSource {
  title?: string
  titleKey?: string
}

export function resolveMenuTitle(node: TitleSource, t?: (key: string) => string): string {
  if (node.titleKey && t) return t(node.titleKey)
  return node.title ?? ''
}
