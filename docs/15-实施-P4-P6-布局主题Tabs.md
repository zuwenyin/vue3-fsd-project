# 15 · 实施文档 · P4 布局四模式 + P5 主题系统 + P6 Tabs/keep-alive

> 对应 `docs/07` 的 **P4 / P5 / P6**。设计基线见 `docs/04`（本文只细化实施，不推翻既有结论）。
> 菜单树来源：`entities/menu` 的 store（`docs/13` 生成，`docs/14` 可热更新）。
> **章节顺序说明**：§2 = P4，§3 = P6（Tabs），§4 = P5（主题）——Tabs 与主题互不依赖，先写 Tabs 便于尽早联调菜单热更新；**实施顺序以 §5 分步为准（P4 → P5 → P6）**。

## 0. 目标与范围

- 四种布局（sidebar / top / mix / dual）共用同一份菜单树，运行时可切换并持久化；
- 主题：明暗（light/dark/auto）+ 自定义品牌色，EP 变量运行时覆盖，首屏无闪烁；
- Tabs：打开/关闭/刷新/关闭其他/全部/固定 + `keep-alive` 缓存，菜单热更新后失效页签清理。

## 1. 前置依赖

- P3 完成（`docs/13`）：`menuStore.tree` 有数据
- P3.5 完成（`docs/14`）：菜单可热更新（Tabs 需配合清理）
- `@repo/utils` 的 `color/shades.ts` 与单测已完成（`docs/04` §4）

## 2. P4 · 布局四模式

### 2.1 文件清单

```
apps/web/src/widgets/layout/
├─ index.ts                    # Public API：AppLayout + 类型
├─ AppLayout.vue               # 容器：动态分发 + 统一 main 插槽
├─ SidebarLayout.vue
├─ TopLayout.vue
├─ MixLayout.vue
├─ DualLayout.vue
├─ model/layout-map.ts         # { sidebar: SidebarLayout, ... } 映射表
└─ ui/
   ├─ MenuTree.vue             # 递归菜单（唯一实现）
   ├─ MenuItemContent.vue      # 图标 + 标题（i18n key 优先）
   ├─ AppHeader.vue            # 面包屑/搜索/主题/布局/语言/用户下拉
   ├─ AppLogo.vue
   ├─ AppBreadcrumb.vue
   ├─ AppTabs.vue              # P6
   └─ AppSidebarDrawer.vue     # 小屏抽屉

apps/web/src/features/layout-switch/
├─ index.ts
├─ model/{layout.store.ts,types.ts,constants.ts}
└─ ui/LayoutSwitch.vue
```

### 2.2 `AppLayout.vue`

```vue
<script setup lang="ts">
const layout = useLayoutStore()
const current = computed(() => LAYOUT_MAP[layout.mode])
</script>

<template>
  <component :is="current">
    <template #main>
      <router-view v-slot="{ Component, route }">
        <keep-alive :include="tabs.cachedViews">
          <component
            :is="Component"
            :key="route.meta.keepAlive ? String(route.name) : route.fullPath"
          />
        </keep-alive>
      </router-view>
    </template>
  </component>
</template>
```

- 切换布局**不重新注册路由、不刷新页面**（`docs/04` §7.3）。
- 每个布局组件统一接收 `#main` 插槽，保证内容区只实现一次。
- `meta.layout` 优先于全局模式：在 `AppLayout` 内 `computed` 取 `route.meta.layout ?? layout.mode`（可选能力，`docs/03` §7）。

### 2.3 `MenuTree.vue`（递归）

```vue
<script setup lang="ts">
interface Props {
  items: MenuItem[]
  mode: 'vertical' | 'horizontal' | 'popper'
  depth?: number
}
</script>
<template>
  <template v-for="item in sortedItems" :key="item.key">
    <FsdSubMenu v-if="item.children?.length" :index="item.key">
      <template #title><MenuItemContent :item="item" /></template>
      <MenuTree :items="item.children" :mode="mode" :depth="depth + 1" />
    </FsdSubMenu>
    <FsdMenuItem v-else :index="item.key" @click="onSelect(item)">
      <MenuItemContent :item="item" />
    </FsdMenuItem>
  </template>
</template>
```

要点：

- `index` 用 `item.key`（= `route.name`），跳转时用 `{ name: item.key }`，避免路径拼接错误。
- 外链（`external`）渲染为 `<a target="_blank">`，不进路由。
- `activePath` 用于详情页高亮父菜单：在 `FsdMenu` 的 `default-active` 计算时回指。
- 四模式共用此组件，仅 `mode` 与容器样式不同。
- `el-menu` / `el-sub-menu` / `el-menu-item` **不得**在此直接用，全部走 `@repo/ui` 的 `FsdMenu` / `FsdSubMenu` / `FsdMenuItem`（决策 D7，清单见 `docs/10` §2.2）。

### 2.4 各模式要点

| 模式      | 结构                                         | 菜单消费                                             |
| --------- | -------------------------------------------- | ---------------------------------------------------- |
| `sidebar` | 左侧菜单（可折叠 210px/64px）+ Header + 内容 | 整棵树 → `mode="vertical"`                           |
| `top`     | 顶部水平菜单 + 内容                          | 一级 → `mode="horizontal"`，其余走 `FsdSubMenu` 下拉 |
| `mix`     | 顶部一级 + 左侧二级                          | 顶部渲染一级，选中后左侧渲染其子树                   |
| `dual`    | 左侧窄条一级 + 次级侧栏                      | 左侧 `mode="vertical"` 只渲染一级，次级渲染子树      |

### 2.5 响应式

- `@vueuse/core` 的 `useBreakpoints`：`lg ≥ 1280`、`md 960–1280`、`sm < 960`。
- `< 960px`：所有模式强制**抽屉式**侧边栏（`AppSidebarDrawer.vue`），顶部保留汉堡按钮。
- 布局偏好持久化在 `fsd:layout`（`@repo/utils` 的 `storage`）。

### 2.6 验收（P4）

> 实测：2026-09-28，浏览器 **33 项断言全绿**（四布局 / 面包屑 / 抽屉 / 菜单热更新 / 双账号权限）。

- [x] 四种布局渲染同一份 3 级菜单树均正确，`mix`/`dual` 联动正常
      —— `sidebar`（210px ↔ 折叠 64px）/ `top`（无侧栏）/ `mix`（顶部一级 → 次级栏联动）/ `dual`（窄条一级 → 次级栏联动）全部实测通过
- [x] 切换布局不丢路由、不丢 Tabs、刷新后保持
      —— 切布局后 URL 不变；`fsd:layout` 持久化，刷新后仍为 `dual`（Tabs 属 P6，未接入）
- [x] 小屏下自动切抽屉，可正常打开/关闭
      —— 900px 下桌面侧栏消失 → 汉堡开抽屉 → 点遮罩关闭
- [x] 菜单高亮与面包屑正确（含 `activePath` 回指）
      —— `/system/user/group` 面包屑「系统管理 / 用户管理 / 用户分组」（3 级）；`activeMenuKey` 三级回指

### 2.7 实施记录（P4）· 实测踩坑

| #   | 现象                                                 | 根因                                                               | 结论                                                                                                                                           |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `useDraggable(el, options)` 传 getter 函数拖拽无反应 | 该 API 只在初始化时解析元素，函数不被接受                          | 改 `useDraggable(null, options)` + `FsdTable.bodyRef` 就绪后 `draggable.start(tbody)`；同一元素不重复 `start`（`boundEl` 去重）                |
| 2   | 拖拽后 move 被后端拒（`beforeId 不在目标层`）→ 回滚  | `beforeId` 用「深度 ≤ 新层级」查找，会命中**另一个父级**下的相邻行 | `beforeId` 必须按 **`parentId === targetParentId`** 匹配（`tree-mutations.ts` 已加回归单测）                                                   |
| 3   | 点「系统管理」（目录）跳 `/system` 空白页            | 目录节点注册了 `name` 但没有 `component`，`hasRoute` 判定不足      | 新增 `menu-active.ts` 的 `canNavigate(router, name)`：`matched.at(-1)?.components` 存在才 push；`use-menu-navigation` / `use-root-menu` 均接入 |
| 4   | 鼠标划过某些列时整段禁拖                             | `onMove` 对 `related` 取不到菜单标记就返回 `false`                 | `related` 解析不到标记时**放行**（交由 `onEnd` 换算）；`markOf` 支持 `td`/`span` 任意落点（`closest('tr')` 兜底）                              |
| 5   | E2E 中 `mouse.down/move/up` 拖不动行                 | `sortablejs` 默认走 HTML5 DnD，Playwright 的 mouse API 不触发      | E2E 用 `page.dragAndDrop()`（内部 CDP `dispatchDragEvent`）；`collapse` 菜单项被 tooltip 包裹，点击需 `force: true`                            |
| 6   | `AppHeader` 报 `user.username` 不存在                | store 只暴露 `nickname` getter（内含 `username` 回落）             | 模板统一用 `user.nickname`                                                                                                                     |

## 3. P6 · Tabs + keep-alive

### 3.1 文件清单

```
apps/web/src/features/tabs/
├─ index.ts
├─ model/
│  ├─ tabs.store.ts        # visitedViews / cachedViews / 各类操作
│  ├─ types.ts             # TabView { name, path, title, titleKey?, icon?, affix, keepAlive? }
│  └─ constants.ts         # MAX_CACHE = 20（LRU）
└─ ui/ContextMenu.vue      # 右键菜单

apps/web/src/widgets/layout/ui/AppTabs.vue
```

### 3.2 `tabs.store.ts` 关键实现

```ts
export const useTabsStore = defineStore('tabs', () => {
  const visitedViews = ref<TabView[]>([])
  const cachedViews = computed(() =>
    visitedViews.value.filter((v) => v.keepAlive !== false).map((v) => v.name),
  )

  function addView(route: RouteLocationNormalized) {
    if (route.meta.hideInMenu && !route.meta.affix) return // 详情页可选：不入页签
    if (visitedViews.value.some((v) => v.name === route.name)) return
    visitedViews.value.push(toTabView(route))
    pruneCache() // LRU 淘汰
  }

  function closeView(name: string) {
    /* affix 不可关 */
  }
  function closeOthers(name: string) {}
  function closeAll() {
    /* 保留 affix */
  }
  async function refreshView(name: string) {
    // 从 cachedViews 移除 → nextTick → 重新加入（借助 router.replace + key 时间戳）
  }
  function toggleAffix(name: string) {}

  /** ★ 菜单热更新后清理失效页签（docs/14 §5.2 调用） */
  function pruneInvalidViews(router: Router) {
    visitedViews.value = visitedViews.value.filter((v) => router.hasRoute(v.name))
  }

  function pruneCache() {
    if (visitedViews.value.length <= MAX_CACHE) return
    // 淘汰最久未访问且非 affix 的页签
  }

  return {
    visitedViews,
    cachedViews,
    addView,
    closeView,
    closeOthers,
    closeAll,
    refreshView,
    toggleAffix,
    pruneInvalidViews,
  }
})
```

要点：

- `cachedViews` 直接喂给 `<keep-alive :include>`；**组件名必须等于 `route.name`**，否则缓存失效（`docs/13` §7 风险项）。
- 刷新实现：从 `visitedViews` 中标记 → `nextTick` 后恢复，配合 `router.replace({ ...route })`。
- `pruneInvalidViews(router)` **P3.5 未接入**（当时还没有 `tabsStore`），本阶段从零实现并接到 `app/router/menu-apply.ts` 的 `applyMenuChanges()` 成功分支之后（顺序：热替换 → 失效跳转 → 清页签 → `clearDirty`）；它同时驱动 `cachedViews`（computed）收缩，因此 `keep-alive` 缓存会一并剔除，无需额外清理。
- LRU 上限默认 **20**（已定，见 `docs/04` §8 与 `docs/07` 决策表；常量集中在 `constants.ts` 便于调整）。
- 页签标题一律经 `resolveMenuTitle()`（`docs/13` §3.4.1，决策 D2），不直接读 `meta.title`。

### 3.3 `AppTabs.vue`

- **自绘页签**（`router-link` + `FsdIcon` / `FsdTag` / 关闭按钮），**不使用 `el-tabs`**：避免为 `el-tabs` 新增 `@repo/ui` 导出，也便于 `affix` 与右键菜单定制（决策 D7）。
- `affix` 页签隐藏关闭图标；当前页签高亮走 `--fsd-color-primary`。
- 右键菜单（`ContextMenu.vue`）：刷新 / 关闭 / 关闭其他 / 关闭左侧 / 关闭右侧 / 全部关闭。
- 与路由联动：`watch(route)` → `addView`；点击页签 → `router.push({ name })`。
- 持久化：页签列表存 `fsd:tabs`，**在 `applyRoutes` 之后**恢复（否则指向 404，见 §6）。

### 3.4 验收（P6）

- [ ] 打开/切换/刷新/关闭其他/全部关闭行为正确
- [ ] 缓存生效：在页签 A 输入内容 → 切到 B → 切回 A，内容仍在
- [ ] `affix` 页签不可关闭；刷新后 Tabs 从 `fsd:tabs` 恢复
- [ ] 菜单热更新（删除当前菜单）后，失效页签被清理且 `keep-alive` 缓存同步剔除（`cachedViews` 随 `visitedViews` 收缩）
- [ ] 超过 `MAX_CACHE` 时按 LRU 淘汰，不误删 `affix`
- [ ] 页签标题走 `resolveMenuTitle()`；全仓无裸 `localStorage`，持久化键集中在 `shared/config/storage-keys.ts`

## 4. P5 · 主题系统

### 4.1 文件清单

```
apps/web/src/app/styles/
├─ index.scss
├─ tokens/
│  ├─ _index.scss          # @forward 全部
│  ├─ _light.scss          # :root 下的 --fsd-* / --el-* 浅色值
│  ├─ _dark.scss           # html.dark 下的覆盖
│  └─ _brand.scss          # 品牌色占位（运行时由 JS 覆盖）
└─ element/
   └─ index.scss           # @use 'element-plus/theme-chalk/dark/css-vars.css' 等

apps/web/src/features/theme-switch/
├─ index.ts
├─ model/{theme.store.ts,constants.ts}
├─ lib/{apply-theme.ts,init-theme.ts}
└─ ui/{ThemeSwitch.vue,ColorPickerPanel.vue}
```

### 4.2 令牌基线（写入 `_light.scss`）

| 令牌                                 | 值                                | 说明                                             |
| ------------------------------------ | --------------------------------- | ------------------------------------------------ |
| `--fsd-color-primary`                | `#2F6FED`                         | 品牌主色（运行时可被覆盖）                       |
| `--fsd-color-primary-light-3`        | `#5A8DF6`                         | hover 态                                         |
| `--fsd-color-primary-dark-2`         | `#1D4FBF`                         | active 态                                        |
| `--fsd-color-bg`                     | `#FFFFFF`                         | 页面底色                                         |
| `--fsd-color-bg-sub`                 | `#F5F7FA`                         | 分区底色                                         |
| `--fsd-color-text`                   | `#1F2329`                         | 主文本                                           |
| `--fsd-color-text-secondary`         | `#4E5969`                         | 次文本                                           |
| `--fsd-color-text-weak`              | `#86909C`                         | 弱文本                                           |
| `--fsd-color-success/warning/danger` | `#00B42A` / `#FF7D00` / `#F53F3F` | 功能色                                           |
| `--fsd-font-family`                  | `PingFang SC`                     | 字体                                             |
| `--fsd-font-size-heading`            | `20px`                            | 页面标题                                         |
| `--fsd-font-size-base`               | `14px`                            | 正文                                             |
| `--fsd-space-*` / `--fsd-radius-*`   | 4/8/12/16/24 · 4/8                | 间距与圆角（Stylelint 白名单外的取值一律走令牌） |

暗色（`html.dark`）：底色 `#1F2329`，文本反相，主色保持同一梯度算法。

### 4.3 关键实现

```ts
// features/theme-switch/lib/apply-theme.ts
export function applyDarkMode(mode: 'light' | 'dark' | 'auto') {
  /* docs/04 §3 */
}
export function applyPrimaryColor(hex: string) {
  const s = generatePrimaryShades(hex) // @repo/utils
  const root = document.documentElement.style
  root.setProperty('--el-color-primary', hex) // 基色直接透传，无 DEFAULT
  root.setProperty('--el-color-primary-light-3', s['light-3'])
  // light-5/7/8/9、dark-2 同理；同步写入 --fsd-color-primary*
}

// features/theme-switch/lib/init-theme.ts（main.ts 最顶部调用）
export function initTheme() {
  /* 读 storage → applyDarkMode + applyPrimaryColor，先于 mount */
}
```

- store 形态见 `docs/04` §6；持久化 key `fsd:theme`（`{ mode, primary }`）。
- **所有持久化键**（决策 D1，均走 `storage.get/set/remove`，键常量集中在 `shared/config/storage-keys.ts`，见 `docs/12` §3.3）：

| 键           | 内容                  | 归属                              |
| ------------ | --------------------- | --------------------------------- |
| `fsd:token`  | 登录 token            | `features/auth` / `entities/user` |
| `fsd:theme`  | `{ mode, primary }`   | `features/theme-switch`           |
| `fsd:layout` | `{ mode, collapsed }` | `features/layout-switch`          |
| `fsd:tabs`   | `TabView[]`           | `features/tabs`                   |

- EP dark：`@use 'element-plus/theme-chalk/dark/css-vars.css'`（放在 `app/styles/element/`），配合 `html.dark` 生效。
- 色板预设见 `docs/04` §4；自定义走 `FsdColorPicker`（`@repo/ui` 封装 `ElColorPicker`，决策 D7）。

### 4.4 验收（P5）

- [ ] 明暗切换（含 auto 跟随系统）无闪烁，EP 组件整体跟随
- [ ] 首屏刷新无 FOUC（`initTheme` 先于 `mount`）
- [ ] 自定义品牌色后按钮/链接/选中态/悬浮态色阶正确（重点 light-3/5/7/8/9）
- [ ] 主题配置刷新后从 `fsd:theme` 正确恢复（走 `storage`，非裸 `localStorage`）
- [ ] 四种布局切换不丢路由、不丢 Tabs；刷新后布局与主题均保持一致（与 §2.6 交叉验收）
- [ ] `generatePrimaryShades` 单测通过，覆盖率计入 `@repo/utils ≥ 90%`

## 5. 分步实施顺序

1. ✅ **P4-1**：`features/layout-switch`（store + 持久化 + `LayoutSwitch.vue`）
2. ✅ **P4-2**：`widgets/layout/ui/{AppLogo,AppBreadcrumb,MenuTree,MenuItemContent}.vue`
3. ✅ **P4-3**：`AppLayout.vue` + `SidebarLayout.vue`（先只落 sidebar，跑通链路）
4. ✅ **P4-4**：`TopLayout` / `MixLayout` / `DualLayout` + `layout-map.ts`
5. ✅ **P4-5**：`AppHeader.vue`（面包屑/搜索/主题/布局/语言/用户下拉）
6. ✅ **P4-6**：响应式抽屉 `AppSidebarDrawer.vue` + `useBreakpoints`
7. ✅ **P4-7**：`shared/config/storage-keys.ts` 落地 `fsd:tabs` / `fsd:layout` / `fsd:theme`（D1），替换散落的键字面量

> P4 完成情况与踩坑见 §2.6 / §2.7；`@repo/ui` 本阶段新增 `FsdDropdown`（用户下拉）、`FsdButton.plain`，`FsdTable` 新增 `highlightCurrentRow`（P3.5 需要）。

8. **P5-1**：`app/styles/tokens/*`（light/dark/brand）+ `element/index.scss`
9. **P5-2**：`features/theme-switch`（`apply-theme` / `init-theme` / store / `ThemeSwitch` / 色板）
10. **P5-3**：首屏防闪烁验证（刷新多次、节流 CPU 观察）
11. **P6-1**：`features/tabs`（store + 操作 + LRU）
12. **P6-2**：`AppTabs.vue`（自绘，不用 `el-tabs`）+ `ContextMenu.vue`
13. **P6-3**：`AppLayout` 的 `<keep-alive :include>` 接入
14. **P6-4**：`pruneInvalidViews(router)` 真实实现 + 与菜单热更新联调
15. 补组件测试：`AppLayout` 四模式渲染、`MenuTree` 递归、`ThemeSwitch` 变量写入、`tabs.store` 的 LRU 与 `pruneInvalidViews`

## 6. 风险与回退

| 风险                       | 现象                   | 回退                                                                                    |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `keep-alive` 不生效        | 切换页签状态丢失       | 组件必须声明 `name` 且等于 `route.name`；或用 `:key` + `include` 双保险                 |
| EP dark 变量未生效         | 暗色下部分组件仍是浅色 | 确认 `dark/css-vars.css` 已引入且 `html.dark` 已添加；必要时对个别组件手动覆盖 `--el-*` |
| 品牌色色阶与 EP 默认不一致 | hover/active 观感偏差  | 以 `mix()` 算法为准，必要时对 `light-8/9` 做微调（集中在 `shades.ts`，不散落组件）      |
| 布局切换后滚动位置丢失     | 内容区跳到顶部         | `AppLayout` 内保持 `router-view` 外层容器不变，滚动容器不随布局重建                     |
| Tabs 恢复时路由尚未就绪    | 刷新后页签指向 404     | 恢复时机放在 `applyRoutes` 之后；失效页签走 `pruneInvalidViews`                         |
| 间距令牌过严阻碍开发       | Stylelint 大量报错     | 从令牌强制组移除间距正则（`docs/06` §5.2 已按组收口，改一处生效）                       |

## 7. 对既有文档的修订点

- `docs/07`：决策 D1（storage 与键常量）、D2（页签标题走 `resolveMenuTitle`）、D7（页签自绘，不引 `el-tabs`）为本文件依据
- `docs/04` §8：`MAX_CACHE = 20` 与 LRU 策略由「待确认」转为**落地值**（常量集中在 `features/tabs/model/constants.ts`）
- `docs/14` §5.3：`useSortable` → **`useDraggable`**（`vue-draggable-plus` 0.6.1 已更名），绑定方式改为 `useDraggable(null, options).start(tbody)`
- `docs/14` §5.3：`toMovePayload` 的 `beforeId` 由「深度 ≤ 新层级」修订为**同父匹配**（`parentId === targetParentId`），否则会取到异父行导致后端拒绝（§2.7 坑 2）
- `docs/14` §5.4 / 本文件 §2.3：目录节点（`component = null`）不得 push —— 判定改为 `canNavigate(router, name)`（§2.7 坑 3）
- `docs/04` §9：验收新增「菜单热更新后失效页签与缓存被清理」
- `docs/06` §8：测试范围新增 `AppLayout` 四模式、`MenuTree`、`ThemeSwitch` 组件测试
