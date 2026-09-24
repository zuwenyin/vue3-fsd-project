/**
 * 单测（Vitest）用的极小 Vite 插件：把 Element Plus 的「按需样式」入口替换为空模块。
 *
 * 背景：`@repo/ui` 组件按 `docs/05` §Element Plus 引入规则，显式 import 了
 * `element-plus/es/components/<name>/style/css`，而这些模块内部再 import 的是 `.css`。
 * 默认依赖外部化时由 Node 原生加载，会抛 `Unknown file extension ".css"`；
 * 而 `server.deps.inline: ['element-plus']` 虽能修好，却让 ui 测试耗时从 ~10s 涨到 ~53s。
 * 单测不校验视觉样式，替换为空模块即可（视觉由浏览器验收）。
 *
 * 只声明用到的两个钩子，避免在根目录依赖 `vite` 的类型。
 */
export interface ElementPlusStyleStubPlugin {
  name: string
  enforce: 'pre'
  resolveId: (id: string) => string | null
  load: (id: string) => string | null
}

const VIRTUAL_ID = '\0element-plus-style-stub'
const STYLE_ENTRY = /^element-plus\/(es|lib)\/components\/.+\/style\/(css|index)$/

export function stubElementPlusStyles(): ElementPlusStyleStubPlugin {
  return {
    name: 'stub-element-plus-styles',
    enforce: 'pre', // 必须在 Vite 判定依赖外部化之前拦截
    resolveId: (id) => (STYLE_ENTRY.test(id) ? VIRTUAL_ID : null),
    load: (id) => (id === VIRTUAL_ID ? 'export {}' : null),
  }
}
