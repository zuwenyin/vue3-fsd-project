# Vue3 + Vite + TS · Monorepo 前端开发模版（FSD）

> 本文档是「需求磋商结论 + 技术方案基线」，后续开发以本文档为准。
> 所有依赖版本均于 **2026-09-22 通过 npm registry 实时查询**得到，非经验值。

## 1. 项目定位

一套可复用的**中后台前端开发模版**，核心能力：

- **动态路由**：路由表由后端下发，前端运行时注册（`addRoute` + `import.meta.glob` 组件映射）
- **菜单/路由配置页**：后台可视化维护菜单（增删改、拖拽排序、权限配置），保存后**即时热更新**路由与侧边栏
- **本地后端服务**：`apps/server`（Express 5 + SQLite）提供菜单 CRUD 与路由下发，接口形状即生产形状
- **主题切换**：明暗模式 + 自定义品牌色（运行时生成色阶，覆盖 Element Plus 变量）
- **多菜单栏切换**：内置 `sidebar` / `top` / `mix` / `dual` 四种布局，运行时可切换
- **多标签页**：Tabs + `keep-alive` 缓存（刷新 / 关闭 / 关闭其他 / 固定）
- **国际化**：vue-i18n（`zh-CN` / `en-US`）+ EP 语言包联动；菜单标题走 `titleKey`（缺失回落 `title`），语言偏好持久化到 `fsd:lang`。覆盖范围为「壳层（Header/侧边栏/页签/面包屑/主题与布局开关）+ 菜单标题 + EP 内置文案」；业务表单文案的翻译并入 P8 收尾
- **Mock 与测试**：Vitest 单测 + 组件测试（`apps/server` 用 supertest）；MSW 仅用于测试/离线兜底（开发期数据来自 `apps/server`）

## 2. 已确认的技术选型（决策记录）

| 维度       | 结论                                                                                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 包管理器   | pnpm 11.9.0（workspace，原生 `-r --filter` 编排，不引入 Turbo/Nx）                                                                                                                       |
| 主应用     | Vue 3.5.43 + Vite 8.3.0 + TypeScript **6.0.3**                                                                                                                                           |
| UI 基础    | Element Plus 2.14.6，`packages/ui` 内**显式按需引入**后再导出                                                                                                                            |
| 状态管理   | Pinia 4.0.3                                                                                                                                                                              |
| 路由       | vue-router 5.3.1，后端下发 + 前端动态注册                                                                                                                                                |
| TypeScript | **6.0.3**（理由见 `docs/02-依赖版本清单.md`）                                                                                                                                            |
| 后端服务   | `apps/server`：**Express 5.2.1 + SQLite**（`better-sqlite3` 13，失败回退 Node 内置 `node:sqlite`），本地真实 CRUD                                                                        |
| 子包       | `@repo/utils`、`@repo/ui`（最小集）                                                                                                                                                      |
| 子包消费   | **打包产物**：`dist` + `d.ts`（utils 用 tsup，ui 用 Vite lib 模式）                                                                                                                      |
| 主题范围   | 明暗（dark/light/auto）+ 自定义品牌色                                                                                                                                                    |
| 布局模式   | sidebar / top / mix / dual 全内置                                                                                                                                                        |
| 附加能力   | Tabs+keep-alive、i18n（P7）、MSW（仅测试/离线兜底）、Vitest 测试体系（含 `apps/server` 的 supertest）                                                                                    |
| 工程规范   | ESLint 10 + Prettier + editorconfig、Husky + lint-staged + commitlint、Changesets、GitHub Actions CI                                                                                     |
| Lint 方案  | JS：**ESLint 10**（`typescript-eslint` 8.70.1 + `eslint-plugin-vue` 10.11.0）；样式：**Stylelint 17.15.0**（L2 标准 + 设计令牌强制）。oxlint 1.85 **暂不引入**，触发条件见 `docs/06` §13 |

## 3. 目录总览

```
vue3-fsd-project/
├─ apps/
│  ├─ web/                    # 主应用（FSD 架构）@repo/web
│  │  ├─ index.html
│  │  ├─ vite.config.ts
│  │  ├─ vitest.config.ts
│  │  ├─ tsconfig.json
│  │  ├─ mocks/               # MSW（仅测试/离线兜底，见 docs/06 §9）
│  │  └─ src/
│  │     ├─ app/              # 应用装配层：入口、router、store、providers、全局样式
│  │     ├─ pages/            # 页面（路由组件，组合 widgets/features）
│  │     ├─ widgets/          # 布局壳：AppLayout、菜单、Header、Tabs、Breadcrumb
│  │     ├─ features/         # 交互特性：auth、theme-switch、layout-switch、lang-switch、tabs
│  │     ├─ entities/         # 业务实体：user、menu、permission
│  │     └─ shared/           # 与业务无关：ui、lib、api、config、i18n、types、assets
│  └─ server/                 # 本地后端服务 @repo/server（Express 5 + SQLite）
│     ├─ src/{db,dao,services,routes,middleware,shared}
│     └─ data/app.db          # SQLite 文件（gitignore）
├─ packages/
│  ├─ utils/                  # @repo/utils（tsup 构建）
│  └─ ui/                     # @repo/ui（Vite lib 构建，Element Plus 二次封装）
├─ docs/                      # 本文档集
├─ .changeset/
├─ .github/workflows/ci.yml
├─ pnpm-workspace.yaml
├─ package.json               # 根：脚本编排 + 统一 devDeps
├─ tsconfig.base.json
├─ eslint.config.js
├─ stylelint.config.js
├─ .prettierrc / .editorconfig / .npmrc / .nvmrc
└─ README.md
```

## 4. 环境要求

- **Node**：`24.19.0`（Vite 8 要求 `^20.19.0 || >=22.12.0`，本仓库锁定 24.x，见 `.nvmrc`）
- **pnpm**：`11.9.0`（`package.json` 中 `packageManager` 字段锁定，建议开启 corepack）
- **Git**：2.45+

## 5. 常用命令

```bash
# 安装
pnpm install

# 全量并行开发（utils/ui watch 构建 + web dev server）
pnpm -r --parallel --filter "@repo/*" run dev

# 仅启动主应用（子包已构建过 dist 时使用）
pnpm --filter @repo/web dev

# 仅启动后端服务（端口 3001）
pnpm dev:server

# 重置本地数据库并重新写入种子数据
pnpm db:reset

# 拓扑顺序全量构建（utils → ui → server/web）
pnpm -r --filter "@repo/*" run build

# 质量门禁
pnpm lint            # ESLint（flat config）
pnpm format          # Prettier
pnpm type-check      # vue-tsc --noEmit
pnpm test            # Vitest run
pnpm test:cov        # Vitest + 覆盖率（阈值：utils ≥ 90%，web ≥ 60%，ui ≥ 40%，server 不设门槛）
pnpm verify:dist     # 构建产物校验（存在性 + EP 样式/设计令牌关键内容 + 体积报告）
pnpm smoke:preview   # 静态产物冒烟（vite preview + /login、assets、SPA 回退断言）
pnpm smoke:regression # 跨阶段交互回归（11 项：登录/三级菜单/面包屑/页签/主题/布局/水印/i18n/菜单配置页；需先起 dev:server 与 dev:web）
pnpm --filter @repo/web preview   # 手动预览静态产物（需先 pnpm build）

# 版本与发布（Changesets）
pnpm changeset
pnpm version-packages
pnpm release

# 生成 MSW 的 service worker（仅在需要用离线兜底时执行一次）
pnpm --filter @repo/web exec msw init public --save
```

### 本地联调说明（docs/06 §9）

- **默认数据来源**：`apps/server`（Express + SQLite），启动 `pnpm dev:server` 后经 Vite 代理（`/api` → `localhost:3001`）取真实数据。
- **离线兜底（可选）**：服务端不便启动时，`apps/web/.env.local` 设 `VITE_USE_MOCK=true` 后 `pnpm --filter @repo/web dev`，由 `apps/web/mocks` 的 MSW handlers 提供同契约数据（3 级路由树）。首次使用需执行上面的 `msw init` 生成 `public/mockServiceWorker.js`。
- **测试中使用**：`apps/web/mocks/server.ts` 已在 `vitest.setup.ts` 挂载（`beforeAll/afterEach/afterAll`），组件与路由测试无需真实服务；handlers 的契约由 `mocks/__tests__/handlers.spec.ts` 锁定。
- **偏好持久化键**（均走 `@repo/utils` 的 `storage`，键常量集中在 `apps/web/src/shared/config/storage-keys.ts`）：`fsd:token` / `fsd:theme` / `fsd:layout` / `fsd:tabs` / `fsd:lang`。

### 构建与部署（P13）

```bash
pnpm build          # 拓扑构建：utils → ui → web（server 为源码直跑，无需构建）
pnpm verify:dist    # ① 产物校验：文件存在性 + 关键内容（EP 按需样式 / 设计令牌）+ 体积报告
pnpm smoke:preview  # ② 静态冒烟：vite preview 起服务，断言 /login、/assets/*、SPA 回退
pnpm smoke:regression # ③ 交互回归：headless Chrome 跑 11 项运行时断言（需 dev:server + dev:web，不进 CI）
```

**前端（`apps/web/dist/`）**：纯静态产物，可托管到任意静态服务器/CDN。**必须开启 SPA 回退**
（未命中的路径返回 `index.html`，否则前端路由刷新会 404）：

```nginx
# nginx 示例
server {
  listen 80;
  root /var/www/fsd-web;              # apps/web/dist 的内容
  location / {
    try_files $uri $uri/ /index.html; # SPA 回退
  }
  location /api/ {                    # 后端同域反代（推荐：免 CORS）
    proxy_pass http://127.0.0.1:3001;
  }
}
```

- **接口地址**：`VITE_API_BASE_URL`（构建期注入，默认 `/api`）。生产推荐「同域反代 `/api` → 后端」，
  产物无需改动也无跨域问题；后端独立域名时在构建时设为完整地址（需后端开启 CORS）。
- **后端（`apps/server`）**：Node 进程 + SQLite 文件；`DB_PATH` 指定数据库文件（需持久化卷），
  `PORT` 指定端口（默认 `3001`，须与前端反代一致）。
- **CI 已内置**：`web` job 在 `pnpm build` 后执行 `pnpm verify:dist` 与 `pnpm smoke:preview`
  （仅 Node 主版本执行，矩阵中 22.x 只跑 lint/type-check/test/build），见 `.github/workflows/ci.yml`。
- **跨阶段交互回归（本地/阶段验收用，不进 CI）**：`pnpm smoke:regression` → `scripts/regression-smoke.mjs`，
  用 headless Chrome + CDP（零第三方依赖）跑 11 项运行时集成断言：登录 → 三级菜单直达 → 面包屑 → 页签 →
  切深色主题 → 设置抽屉切布局（抽屉保持打开）→ 水印 → 刷新后偏好保持 → 切英文 → 菜单配置页。
  需先启动 `pnpm dev:server` 与 `pnpm dev:web`；浏览器按 `CHROME_PATH` → 常见安装路径解析，
  找不到时跳过并退出 0。

## 6. 文档索引

> 编号说明：`docs/08` / `docs/09` 预留未启用，实施文档从 `10` 开始。
> 所有已拍定的决策（持久化、命名、层级上限、发布流程、CI 等）统一登记在 [docs/07](./docs/07-实施计划.md) 的「决策总表」，不再散落各文档。

| 文档                                                                                 | 内容                                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| [docs/01-架构与目录规范.md](./docs/01-架构与目录规范.md)                             | 分层架构、FSD 规则、命名与导入约束                            |
| [docs/02-依赖版本清单.md](./docs/02-依赖版本清单.md)                                 | 版本矩阵、兼容性校验、catalog 与升级策略                      |
| [docs/03-动态路由与权限.md](./docs/03-动态路由与权限.md)                             | 后端契约、组件映射、注册流程、守卫、菜单生成、按钮级权限      |
| [docs/04-主题与布局.md](./docs/04-主题与布局.md)                                     | 主题令牌、明暗/品牌色算法、四布局模式与切换机制               |
| [docs/05-子包开发规范.md](./docs/05-子包开发规范.md)                                 | utils/ui 包结构、构建产物、exports、发布流程                  |
| [docs/06-工程化规范.md](./docs/06-工程化规范.md)                                     | ESLint/TS/提交门禁/测试/Mock/CI                               |
| [docs/07-实施计划.md](./docs/07-实施计划.md)                                         | 分阶段落地步骤与验收标准（阶段 → 实施文档索引）+ **决策总表** |
| [docs/10-实施-P0-P1-工程底座与子包.md](./docs/10-实施-P0-P1-工程底座与子包.md)       | P0/P1 文件清单、配置内容、脚本与验收                          |
| [docs/11-实施-后端服务-Express-SQLite.md](./docs/11-实施-后端服务-Express-SQLite.md) | 后端服务：DDL、种子数据、接口与错误码、校验与事务、驱动回退   |
| [docs/12-实施-P2-主应用骨架.md](./docs/12-实施-P2-主应用骨架.md)                     | 主应用骨架：Vite 配置与代理、装配、常量路由                   |
| [docs/13-实施-P3-动态路由与权限.md](./docs/13-实施-P3-动态路由与权限.md)             | 动态路由注册、热替换、权限过滤与指令                          |
| [docs/14-实施-P3.5-菜单配置页.md](./docs/14-实施-P3.5-菜单配置页.md)                 | 菜单配置页：左右分栏、拖拽、组件下拉、热更新时序              |
| [docs/15-实施-P4-P6-布局主题Tabs.md](./docs/15-实施-P4-P6-布局主题Tabs.md)           | 布局四模式、主题系统、Tabs + keep-alive                       |

## 7. 待后续确认（不影响开工，实施到该阶段前需再确认）

1. 是否需要 dev 环境主应用 alias 直连子包源码（DX 优化，与「产物消费」并存的两条路径）
2. **oxlint 重新评估时机**（当前决策：暂缓，不引入）——当且仅当 `docs/06` §13 列出的条件全部满足时才重新评估，届时需同步决策 TS 是否升到 7.x
3. Stylelint 间距组（margin/padding/gap）令牌强制若落地后阻塞严重，可降为不检查（配置已按组收口，改一处生效，见 `docs/06` §5.2）
4. 生产环境的**发布审批流程与审计需求**（本期即时生效，表已预留 `publish_status` / `published_at`；对接真实后端前再确认）
5. 前端覆盖率阈值（`packages/utils ≥ 90%`，其余 40%）是否上调（P8 复核）

> 已从待确认移出（**已定**，见 `docs/07` 决策总表）：字段命名（`docs/03`/`docs/11` 已同构）、403 拦截（本期不启用）、affix 与最大缓存（LRU 20）、菜单层级（≤ 3）、拖拽排序（本期做）、发布流程（本期即时生效）。
