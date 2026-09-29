# 11 · 实施文档 · 后端服务（Express 5 + SQLite）

> 对应新增包 `apps/server`（包名 `@repo/server`，`private: true`，不发布）。
> 定位：**菜单/路由数据的真实来源**。前端不再依赖 MSW 内存 DB（MSW 降级为测试用，见 `docs/06` §9 修订）。
> 契约生产者：本服务输出的 `BackendRouteNode[]` 必须与 `docs/03` §1 一致；字段变更需同步该文档与前端 `entities/menu/model/types.ts`。

## 0. 目标与范围

- 提供菜单树的**增删改查 + 拖拽排序**持久化；
- 提供登录、用户信息、以及**由菜单表实时生成**的路由下发接口；
- 本地零配置启动（`tsx` 直跑 TS），SQLite 文件落在 `apps/server/data/`；
- 仅为开发与演示：不做连接池、不做加密存储、不做鉴权体系（token 为演示用 JWT）。

## 1. 前置依赖

- 已完成 P0（`apps/server` 占位包 + `tsconfig.server.json`）与 P1（无需子包）
- 依赖版本见 `docs/02` §5.5：`express 5.2.1`、`better-sqlite3 13.0.3`（或 `node:sqlite`）、`cors 2.8.6`、`jsonwebtoken 9.0.3`、`zod 4.6.5`、`morgan 1.12.1`、`tsx 4.23.15`

## 2. 文件清单

```
apps/server/
├─ package.json
├─ tsconfig.json                 # 独立 Node 侧配置（不继承 tsconfig.base.json）
├─ src/
│  ├─ index.ts                   # 进程入口：读 env → migrate → listen
│  ├─ app.ts                     # createApp()：中间件 + 路由装配（导出便于 supertest 测试）
│  ├─ config/env.ts              # PORT / DB_PATH / JWT_SECRET / CORS_ORIGIN / SEED
│  ├─ db/
│  │  ├─ index.ts                # getDb()：单例 + 建连接前确保 data/ 目录存在 + 首次调用执行 migrate
│  │  ├─ driver.ts               # 驱动适配：统一 SqliteDatabase 接口（better-sqlite3 | node:sqlite）
│  │  ├─ schema.sql              # DDL（幂等 CREATE TABLE IF NOT EXISTS）
│  │  ├─ seed.ts                 # 种子数据（3 级菜单树）
│  │  └─ migrate.ts              # 确保 data/ 目录存在 → exec(schema.sql) + 种子幂等写入
│  ├─ dao/
│  │  ├─ menu.dao.ts             # 纯 SQL：菜单表读写（不含业务校验）
│  │  └─ user.dao.ts             # 用户表读写
│  ├─ services/
│  │  ├─ menu.service.ts         # 校验（path 唯一/父级合法/component 白名单）+ 事务 + 排序算法
│  │  ├─ route.service.ts        # 菜单表 → BackendRouteNode[] 树（对外下发）
│  │  └─ auth.service.ts         # 登录校验 + 签发 token + 解析 token
│  ├─ routes/
│  │  ├─ index.ts                # /api 前缀下挂载各模块
│  │  ├─ auth.routes.ts          # POST /auth/login
│  │  ├─ user.routes.ts          # GET /user/info、GET /user/routes
│  │  └─ menu.routes.ts          # GET/POST/PUT/DELETE /menus、POST /menus/:id/move
│  ├─ middleware/
│  │  ├─ auth.ts                 # Bearer token 校验（除 /auth/login 外全量）
│  │  ├─ validate.ts             # zod schema 校验 → 422
│  │  └─ error.ts                # 统一错误 → { code, message, data:null }
│  ├─ shared/
│  │  ├─ types.ts                # MenuRecord / BackendRouteNode / ApiResponse / MoveMenuPayload
│  │  ├─ constants.ts            # ★ MAX_DEPTH = 3（层级上限，决策 D3）
│  │  ├─ errors.ts               # ApiError + ErrorCode 常量
│  │  └─ result.ts               # ok(data) / fail(code,message)
│  └─ scripts/reset-db.ts        # 删库重建 + 重新种子
└─ data/                         # 首次启动自动创建（gitignore）
   ├─ app.db                     # 主库文件
   ├─ app.db-wal / app.db-shm    # 开启 WAL 后的伴生文件（同样忽略）
   └─ app.db-journal             # 回滚日志（默认 journal 模式，忽略）
```

### 2.1 `package.json`

```json
{
  "name": "@repo/server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "db:reset": "tsx src/scripts/reset-db.ts",
    "type-check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "catalog:",
    "better-sqlite3": "catalog:",
    "cors": "catalog:",
    "jsonwebtoken": "catalog:",
    "zod": "catalog:",
    "morgan": "catalog:"
  },
  "devDependencies": {
    "tsx": "catalog:",
    "@types/node": "catalog:",
    "@types/express": "catalog:",
    "@types/cors": "catalog:",
    "@types/better-sqlite3": "catalog:",
    "@types/jsonwebtoken": "catalog:",
    "@types/morgan": "catalog:",
    "vitest": "catalog:",
    "supertest": "catalog:",
    "@types/supertest": "catalog:"
  }
}
```

> `db:reset` 挂到根脚本：`"db:reset": "pnpm --filter @repo/server run db:reset"`。

### 2.2 `tsconfig.json`（Node 侧，独立）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

要点：

- `module/moduleResolution: NodeNext`：允许 `import ... from 'node:sqlite'` 与 `import 'x.json'` 之外的常规解析；因用 `tsx` 执行，**源码保持 ESM**（`import` 语法），不使用 `__dirname`。
- 读取 `.sql` 文件用 `fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')`。
- `verbatimModuleSyntax: false`：避免 Node 侧大量 `import type` 改写成本。

## 3. 数据库

### 3.1 DDL（`src/db/schema.sql`）

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sys_menu (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id              INTEGER REFERENCES sys_menu(id) ON DELETE CASCADE,
  name                   TEXT    NOT NULL UNIQUE,          -- 路由名，Tabs/keep-alive key
  path                   TEXT    NOT NULL,
  redirect               TEXT,
  component              TEXT,                             -- 'Layout' | 'system/user/index' | NULL(目录)
  title                  TEXT    NOT NULL,
  title_key              TEXT,
  icon                   TEXT,
  order_no               REAL    NOT NULL DEFAULT 1000,    -- REAL 支持中间数插入
  keep_alive             INTEGER NOT NULL DEFAULT 1,
  hide_in_menu           INTEGER NOT NULL DEFAULT 0,
  hide_children_in_menu  INTEGER NOT NULL DEFAULT 0,
  active_path            TEXT,
  external               INTEGER NOT NULL DEFAULT 0,
  affix                  INTEGER NOT NULL DEFAULT 0,
  layout                 TEXT    CHECK (layout IN ('sidebar','top','mix','dual')),
  roles                  TEXT    NOT NULL DEFAULT '[]',    -- JSON 数组
  permissions            TEXT    NOT NULL DEFAULT '[]',    -- JSON 数组
  status                 INTEGER NOT NULL DEFAULT 1,       -- 1 启用 0 停用
  publish_status         TEXT    NOT NULL DEFAULT 'published' CHECK (publish_status IN ('draft','published')),
  published_at           TEXT,
  created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menu_parent ON sys_menu(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_menu_path_parent ON sys_menu(parent_id, path);

CREATE TABLE IF NOT EXISTS sys_user (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,           -- 演示用（明文或简单 hash），见 §3.4
  nickname    TEXT NOT NULL,
  avatar      TEXT,
  roles       TEXT NOT NULL DEFAULT '[]',
  permissions TEXT NOT NULL DEFAULT '[]',
  status      INTEGER NOT NULL DEFAULT 1
);
```

设计说明：

- `order_no` 用 `REAL`：拖拽排序采用「中间数插入」，无需重写全表。
- `parent_id` 顶层为 `NULL`（写入时用 `NULL`，序列化给前端时映射为 `null`）。
- **不建角色表**：`roles` / `permissions` 以 JSON 列存储；后续拆 `sys_role` / `sys_role_menu` 时，DAO 层已隔离，Service 不变。
- `uk_menu_path_parent`：同父下 `path` 唯一（跨父可重复，符合路由相对路径语义）。
- `publish_status` / `published_at`（决策 D4）：为生产「保存 → 发布」两步预留。**本期所有写操作直接以 `published` 落库并即时生效**；Service 内保留 `publishDraft(ids: number[])` 的空壳与注释（见 §5.10），将来接两步流程时只需改 Service，不改表结构。
- `status`（启用/停用）与 `publish_status`（草稿/已发布）是**两个维度**：停用不进路由表，草稿只在生产两步流程下才不进路由表。

### 3.2 驱动适配（`src/db/driver.ts`）

统一接口，**两种驱动可切换**：

```ts
export interface RunResult {
  changes: number
  lastInsertRowid: number
}

export interface SqliteStatement {
  run(...params: unknown[]): RunResult
  get<T = unknown>(...params: unknown[]): T | undefined
  all<T = unknown>(...params: unknown[]): T[]
}

export interface SqliteDatabase {
  exec(sql: string): void
  prepare(sql: string): SqliteStatement
  transaction<T>(fn: () => T): T
  close(): void
}
```

- **主选**：`better-sqlite3` 13.0.3（`engines.node >= 22`，本机 ABI 137）。
- **回退**：Node 内置 `node:sqlite`（本机 `v24.19.0` 实测可直接 `require('node:sqlite')`，导出 `DatabaseSync` / `StatementSync`，**无需 `--experimental-sqlite` 标志**）。
- 切换开关：`src/config/env.ts` 的 `DB_DRIVER`（默认 `better-sqlite3`，安装失败时改 `node-sqlite`）。
- 参数一律用**匿名占位符 `?`**（两种驱动都支持），避免命名参数前缀差异。

```ts
// 伪代码
import { createRequire } from 'node:module'

// ESM（"type": "module"）下没有全局 require：统一用 createRequire 加载内置模块与 CJS 原生模块
const require = createRequire(import.meta.url)

export function createDatabase(file: string): SqliteDatabase {
  if (env.DB_DRIVER === 'node-sqlite') {
    const { DatabaseSync } = require('node:sqlite')
    const db = new DatabaseSync(file)
    return {
      exec: (sql) => db.exec(sql),
      prepare: (sql) => {
        const st = db.prepare(sql)
        return {
          run: (...p) => normalize(db, st.run(...p)),
          get: (...p) => st.get(...p),
          all: (...p) => st.all(...p),
        }
      },
      transaction: (fn) => {
        db.exec('BEGIN')
        try {
          const r = fn()
          db.exec('COMMIT')
          return r
        } catch (e) {
          db.exec('ROLLBACK')
          throw e
        }
      },
      close: () => db.close(),
    }
  }
  const Database = require('better-sqlite3')
  const db = new Database(file)
  return {
    exec: (sql) => db.exec(sql),
    prepare: (sql) => db.prepare(sql),
    transaction: (fn) => db.transaction(fn)(),
    close: () => db.close(),
  }
}
```

> `node:sqlite` 的 `lastInsertRowid` 为 `bigint`，`normalize()` 统一 `Number()` 转换，避免前端/DAO 拿到 BigInt。
> 若 `@types/better-sqlite3@9.6.0` 缺失 13.x 的新 API 声明，在 `src/shared/types/sqlite.d.ts` 中做最小 `declare module` 补丁。

### 3.3 种子数据（`src/db/seed.ts`，幂等：按 `name` 判存在）

| id  | parent | name         | path         | component            | title    | icon         | order                     | permissions        |
| --- | ------ | ------------ | ------------ | -------------------- | -------- | ------------ | ------------------------- | ------------------ |
| 1   | null   | `Dashboard`  | `/dashboard` | `dashboard/index`    | 仪表盘   | `Odometer`   | 10                        | —                  |
| 2   | null   | `System`     | `/system`    | **空**（纯分组目录） | 系统管理 | `Setting`    | 100                       | —                  |
| 3   | 2      | `SystemUser` | `user`       | `system/user/index`  | 用户管理 | `User`       | 10                        | `system:user:view` |
| 4   | 2      | `SystemMenu` | `menu`       | `system/menu/index`  | 菜单管理 | `Menu`       | 20                        | `system:menu:view` |
| 5   | null   | `Profile`    | `/profile`   | `profile/index`      | 个人中心 | `UserFilled` | 200（`hideInMenu: true`） | —                  |

- 用户：`admin / admin123`（`roles: ['admin']`，`permissions: ['*']`）、`editor / editor123`（`roles: ['editor']`，`permissions: ['system:menu:view']`）。
- **权限列说明（P3 实施补充）**：最初种子菜单不带 `roles` / `permissions`，导致 `docs/13` §6「editor 无权限菜单被过滤」无法实测。现为 `SystemUser` / `SystemMenu` 补上 `view` 权限：editor 只能看到「菜单管理」，`/system/user` 直连落 404。
- 种子实际为 **2 级**（`System` → `SystemUser` / `SystemMenu`，加顶级 `Dashboard` / `Profile`），用于验证四布局与面包屑；**3 级节点需用菜单配置页新建**（`MAX_DEPTH = 3` 只在写入时校验，不预置数据）。
- `System` 是**纯分组目录**：`component` 必须为空（`docs/03` §1 语义）。若填 `Layout` 会与常量路由的 `Layout` 冲突导致 `AppLayout` 嵌套渲染。
- `Profile` 对应页面 `pages/profile/index.vue` 必须在 P2 建立占位（见 `docs/12` §2），否则会被 `resolvePageComponent` 判为未命中而整节点丢弃。
- `seed` 只在表为空时写入；`pnpm db:reset` 可强制重建。

### 3.4 安全声明

- `password` 明文或极简 hash 仅用于**本地演示**，文档与代码注释必须标注「生产禁止」。
- JWT `JWT_SECRET` 默认从 `config/env.ts` 读取开发默认值，生产必须由环境变量注入。

### 3.5 数据文件与目录初始化（关键，易踩坑）

默认落盘位置：**`apps/server/data/app.db`**。

**① 目录必须先行创建。** `better-sqlite3` 与 Node 内置 `node:sqlite` **都不会自动创建父目录**，目录缺失时直接抛 `SQLITE_CANTOPEN: unable to open database file`。因此在建连接前必须：

```ts
// src/db/index.ts（或 migrate.ts 首行）
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export const DB_FILE = resolve(process.cwd(), env.DB_PATH) // 相对路径以 apps/server 为基准

export function getDb(): SqliteDatabase {
  if (!db) {
    mkdirSync(dirname(DB_FILE), { recursive: true }) // ★ 没有这行，首次启动必炸
    db = createDatabase(DB_FILE)
    migrate(db)
  }
  return db
}
```

**② 路径基准要固定。** `DB_PATH` 为相对路径时以 **`apps/server`** 为基准（`pnpm --filter @repo/server dev` 的 cwd）。代码内统一 `resolve(process.cwd(), DB_PATH)` 或
`fileURLToPath(new URL('../../data/app.db', import.meta.url))`，避免从仓库根目录或其他目录启动时库文件位置漂移（会表现为「改了数据但看不到」——其实是开了另一个库）。

**③ 伴生文件要忽略。** 开启 `PRAGMA journal_mode = WAL` 后会产生 `app.db-wal` / `app.db-shm`；默认 journal 模式产生 `app.db-journal`。三类都必须写进 `.gitignore`（见 `docs/10` §1.11）。

**④ `:memory:` 仅用于临时调试。** 可设 `DB_PATH=:memory:` 不落盘，但**会违反 §10「关闭服务后重启数据仍在」这条验收**，只在排查数据问题时临时使用。

## 4. 共享类型（`src/shared/types.ts`）

> 前端 `entities/menu/model/types.ts` 保持同构（字段名一致，唯一差异是后端 `snake_case` 在 DAO 出口转为 `camelCase`）。

```ts
export interface MenuRecord {
  id: number
  parentId: number | null
  name: string
  path: string
  redirect?: string
  component?: string
  title: string
  titleKey?: string
  icon?: string
  orderNo: number
  keepAlive: boolean
  hideInMenu: boolean
  hideChildrenInMenu: boolean
  activePath?: string
  external: boolean
  affix: boolean
  layout?: 'sidebar' | 'top' | 'mix' | 'dual'
  roles: string[]
  permissions: string[]
  status: 0 | 1 // 启用 / 停用
  publishStatus: 'draft' | 'published' // 决策 D4 预留；本期恒为 'published'
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface BackendRouteNode {
  id: number
  parentId: number | null
  name: string
  path: string
  redirect?: string
  component?: string
  meta: {
    title: string
    titleKey?: string
    icon?: string
    order?: number
    keepAlive?: boolean
    hideInMenu?: boolean
    hideChildrenInMenu?: boolean
    activePath?: string
    external?: boolean
    roles?: string[]
    permissions?: string[]
    affix?: boolean
    layout?: 'sidebar' | 'top' | 'mix' | 'dual'
  }
  children?: BackendRouteNode[]
}

export interface MoveMenuPayload {
  id: number
  targetParentId: number | null
  beforeId?: number | null // 插入到该 id 之前；null/省略 = 追加到末尾
}

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}
```

## 5. 接口契约

统一前缀 `/api`；统一包装 `{ code, data, message }`；`code: 0` 表示成功。

| 方法   | 路径                  | 鉴权 | 说明                                       |
| ------ | --------------------- | ---- | ------------------------------------------ |
| POST   | `/api/auth/login`     | 否   | 登录，返回 `token`                         |
| GET    | `/api/user/info`      | 是   | 用户信息 + roles/permissions               |
| GET    | `/api/user/routes`    | 是   | 由 `sys_menu` 生成 `BackendRouteNode[]` 树 |
| GET    | `/api/menus`          | 是   | 菜单扁平列表（管理用，含隐藏/停用项）      |
| GET    | `/api/menus/tree`     | 是   | 菜单树（前端左栏直接用）                   |
| POST   | `/api/menus`          | 是   | 新增                                       |
| PUT    | `/api/menus/:id`      | 是   | 修改（全量字段）                           |
| DELETE | `/api/menus/:id`      | 是   | 删除；`?cascade=true` 级联子节点           |
| POST   | `/api/menus/:id/move` | 是   | 拖拽排序 / 换父级                          |

### 5.1 `POST /api/auth/login`

请求：`{ username: string; password: string }`
响应：`{ code: 0, data: { token: string }, message: 'ok' }`
错误：`401` 用户名或密码错误

### 5.2 `GET /api/user/info`

响应：

```ts
{ code: 0, data: { id: number; username: string; nickname: string; avatar?: string; roles: string[]; permissions: string[] } }
```

### 5.3 `GET /api/user/routes`

响应：`{ code: 0, data: BackendRouteNode[] }`

生成规则（`route.service.ts`）：

1. 只取 `status = 1` 的记录；
2. `listToTree` 组装，按 `order_no` 升序；
3. 顶层 `path` 保留原值（以 `/` 开头），子级保持相对路径；
4. `component` 为 `NULL` 的目录节点：若其有子节点则**不输出 `component`**（前端按无组件处理，纯分组），无子节点则整节点丢弃；
5. `meta` 由各列映射；`roles` / `permissions` 为空数组时**不写入 meta**（避免前端误判为「需要权限」）。

### 5.4 `GET /api/menus` / `GET /api/menus/tree`

- `/api/menus`：`MenuRecord[]`（扁平，`parentId` 保留）
- `/api/menus/tree`：`(MenuRecord & { children: ... })[]`

两者都**包含** `status = 0` 与 `hideInMenu = true` 的项（管理视图需要看到全部）。

### 5.5 `POST /api/menus`

请求体：`Omit<MenuRecord, 'id' | 'createdAt' | 'updatedAt'>`
响应：`{ code: 0, data: MenuRecord }`

### 5.6 `PUT /api/menus/:id`

请求体：`Partial<Omit<MenuRecord, 'id'>>`（前端表单全量提交亦可）
响应：`{ code: 0, data: MenuRecord }`

### 5.7 `DELETE /api/menus/:id`

- 有子节点且未带 `?cascade=true` → `409`（`message: '存在子菜单，请先删除子节点或使用 cascade=true'`）
- 级联删除依赖 `ON DELETE CASCADE`，放在事务内
- 响应：`{ code: 0, data: { id } }`

### 5.8 `POST /api/menus/:id/move`

请求体：`MoveMenuPayload`
行为：

1. 校验目标父级合法性（`targetParentId` 不能是自身或其子孙；为 `null` 表示移到顶层）
2. 计算新 `order_no`：
   - 取目标层（同父）的兄弟列表（排除自身），按 `order_no` 排序
   - 若 `beforeId` 指向某兄弟：`newOrder = (prevOrder + beforeOrder) / 2`
   - 若追加末尾：`newOrder = lastOrder + 1000`
   - 若首尾插值导致 `|prev - next| < 1`：对**该层**做一次事务内重排，全部改为 `1000, 2000, 3000...`
3. 事务内 `UPDATE sys_menu SET parent_id=?, order_no=?, updated_at=... WHERE id=?`
4. 响应：`{ code: 0, data: MenuRecord }`

### 5.9 错误码

| code  | 含义                | 触发                                                                                                                                                                                                  |
| ----- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`   | 成功                | -                                                                                                                                                                                                     |
| `401` | 未登录 / token 失效 | 缺失或过期 token、登录失败                                                                                                                                                                            |
| `403` | 无权限              | **P10 已启用**：缺权限点（读 `system:menu:view` / 写 `system:menu:edit`，admin 的 `*` 通配自动通过）—— `requirePermission` 中间件挂在 `menu.routes.ts` 各写接口前；前端 `v-permission` 仍为第一道防线 |
| `404` | 资源不存在          | `id` 不存在                                                                                                                                                                                           |
| `409` | 冲突                | `name` 重复、同父 `path` 重复、父级非法、存在子节点                                                                                                                                                   |
| `422` | 参数校验失败        | zod 校验不通过（`message` 带首个错误字段）；层级超过 `MAX_DEPTH`                                                                                                                                      |
| `500` | 服务异常            | 未捕获异常（记录日志，不回吐堆栈）                                                                                                                                                                    |

### 5.10 发布流程（决策 D4）

| 环境                             | 行为                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **本期（本地 / `apps/server`）** | 保存即生效：写库 → `publish_status='published'`、`published_at=now()` → 前端点「应用变更」热替换路由。**没有草稿态**                                     |
| **生产（将来）**                 | 两步：① 保存 → `publish_status='draft'`（不进路由表）；② 发布 → 批量置 `published` 并写 `published_at`。前端菜单页出现「发布」按钮与「有未发布变更」提示 |

落地要求：

- `GET /api/user/routes` 与 `GET /api/menus/tree` 的查询条件固定带 `status = 1`；是否带 `publish_status = 'published'` 由 `env.ENABLE_PUBLISH_FLOW` 控制（**本期默认 `false`**，即不按发布态过滤）。
- `menu.service.ts` 预留 `publishDraft(ids: number[])`：本期实现为直接返回成功（幂等），注释写明生产语义。
- 前端「应用变更」按钮语义 = 重新拉路由表 + 热替换（`docs/14` §5.2），**不调用发布接口**。

## 6. 校验规则（`menu.service.ts`）

| 规则                                       | 说明                                                                                                                                                                           | 错误码                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `name` 唯一且非空                          | 作为路由名与 keep-alive key                                                                                                                                                    | `409`                                 |
| 同父下 `path` 唯一                         | 由唯一索引兜底 + Service 预检                                                                                                                                                  | `409`                                 |
| `parentId` 必须存在（非 null 时）          | -                                                                                                                                                                              | `404`（资源不存在，不按参数校验处理） |
| `parentId` 不能是自身或子孙                | 移动与修改时校验                                                                                                                                                               | `409`                                 |
| 层级 ≤ 3                                   | **已定（决策 D3）**：常量 `MAX_DEPTH = 3` 放 `src/shared/constants.ts`；创建/移动时计算目标深度，超出的请求**直接拒绝**。前端同步在 3 级节点禁用「新增子级」（`docs/14` §5.4） | `422`                                 |
| `publish_status` 合法                      | 只允许 `draft` / `published`（由表 `CHECK` 兜底 + zod 预检）；本期不接受显式 `draft` 写入                                                                                      | `422`                                 |
| `component` 白名单软校验                   | 允许 `Layout`、以 `pages/` 下相对路径形式、或空；**不存在的路径只告警不拒绝**（前端解析时降级 404，见 `docs/13` §3）                                                           | 仅日志                                |
| `external = true` 时 `path` 必须为合法 URL | -                                                                                                                                                                              | `422`                                 |
| `redirect` 仅顶层允许                      | 子级填了自动清空                                                                                                                                                               | 静默修正                              |

## 7. 事务与并发

- `better-sqlite3` 为**同步阻塞** API：单进程下天然串行，无需额外锁；`transaction()` 包裹多语句操作。
- `node:sqlite` 回退实现用 `BEGIN` / `COMMIT` / `ROLLBACK` 手工包裹（见 §3.2）。
- 并发场景（多进程/生产）不适用 SQLite，文档注明「生产需换 PostgreSQL/MySQL + 连接池」。

## 8. 启动与联调

### 8.1 环境变量（`src/config/env.ts`）

| 变量             | 默认                      | 说明                                                                                                                                                       |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`           | `3001`                    | 服务端口                                                                                                                                                   |
| `DB_PATH`        | `apps/server/data/app.db` | SQLite 文件；相对路径以 `apps/server` 为基准，代码内需 `resolve(process.cwd(), DB_PATH)` 固定（见 §3.5）；填 `:memory:` 则不落盘（仅调试，违反持久化验收） |
| `DB_DRIVER`      | `better-sqlite3`          | `better-sqlite3` \| `node-sqlite`                                                                                                                          |
| `JWT_SECRET`     | `dev-secret-change-me`    | 演示默认值                                                                                                                                                 |
| `JWT_EXPIRES_IN` | `7d`                      | -                                                                                                                                                          |
| `CORS_ORIGIN`    | `http://localhost:5173`   | Vite dev 源                                                                                                                                                |
| `SEED`           | `true`                    | 空库时写种子                                                                                                                                               |

### 8.2 中间件顺序（`app.ts`）

```
cors() → express.json() → morgan('dev') → /api 路由 → auth（除 login）→ 404 → error
```

- 404 兜底：`{ code: 404, data: null, message: 'Not Found' }`
- error 中间件捕获 `ApiError` 与未知异常

### 8.3 前端代理（`apps/web/vite.config.ts`，详见 `docs/12` §3.1）

```ts
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

前端 `VITE_API_BASE_URL=/api`、`VITE_USE_MOCK=false`（`docs/06` §10）。

### 8.4 常用脚本

```bash
pnpm --filter @repo/server dev     # tsx watch，改动即重启
pnpm dev                            # 根：web + server + 两个子包 watch 并行
pnpm db:reset                       # 删库重建 + 重新种子
pnpm --filter @repo/server test     # vitest + supertest（见 §8.5）
curl http://localhost:3001/api/menus/tree -H "Authorization: Bearer <token>"
```

### 8.5 测试策略（`vitest` + `supertest`）

> 已定（决策 D6）：CI 会跑 `pnpm --filter @repo/server run test`，**不设覆盖率门槛**，但下列用例必须全绿。

配置要点（`apps/server/vitest.config.ts`）：

```ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // 每个测试文件用独立内存库，互不污染、不碰本地 data/app.db
    env: {
      DB_PATH: ':memory:',
      DB_DRIVER: process.env.DB_DRIVER ?? 'better-sqlite3',
      SEED: 'true',
      NODE_ENV: 'test',
    },
    // 单进程串行，避免 SQLite 文件锁竞争
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
```

`createApp()`（`src/app.ts`）必须导出 app 实例本身，测试直接 `request(app)`，**不起端口**：

```ts
import request from 'supertest'
import { createApp } from '../src/app'

const app = createApp()
const token = await login(request(app)) // 取 admin token

it('第 4 级菜单插入被拒绝', async () => {
  const res = await request(app)
    .post('/api/menus')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...payload, parentId: level3Id })
  expect(res.body.code).toBe(422)
})
```

必须覆盖的用例：

| 分组   | 用例                                | 期望                                                                                                         |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 读取   | `GET /api/menus/tree`               | 3 级结构、`children` 嵌套、字段与 `docs/03` §1 一致                                                          |
| 读取   | `GET /api/user/routes`              | 目录节点**不输出** `component`；菜单节点为相对路径；顶层父由常量路由 `Layout` 提供；`meta` 完整              |
| 创建   | 正常创建根 / 子菜单                 | `code: 0` 且返回 `id`                                                                                        |
| 校验   | `name` 重复                         | `409`                                                                                                        |
| 校验   | 同父 `path` 重复                    | `409`                                                                                                        |
| 校验   | `parentId` = 自身                   | `409`                                                                                                        |
| 校验   | `parentId` = 子孙                   | `409`                                                                                                        |
| 校验   | 插入第 4 级（`MAX_DEPTH`）          | `422`                                                                                                        |
| 校验   | `component` 不存在                  | **创建成功**（仅日志告警）                                                                                   |
| 校验   | `external = true` 且 `path` 非 URL  | `422`                                                                                                        |
| 更新   | 改 `parentId` 触发层级重算          | 超深则 `422`，否则成功                                                                                       |
| 删除   | 有子节点                            | `409`；`cascade=true` 时子节点一并删除                                                                       |
| 排序   | `move` 中间数插入                   | 同层 `order_no` 单调                                                                                         |
| 排序   | `move` 触发同层重排                 | 变为 `1000, 2000, 3000...`                                                                                   |
| 鉴权   | 无 token 访问 `/api/menus`          | `401`                                                                                                        |
| 鉴权   | editor 写管理接口（缺 edit 权限点） | **403**（P10 启用；`tests/authz.spec.ts` 覆盖：读 200 / 4 个写接口 403 / message 含权限点名 / 无 token 401） |
| 健壮性 | 未知路由 / 未知 id                  | `404`                                                                                                        |

## 9. 分步实施顺序

1. 建 `apps/server` 骨架（`package.json` + `tsconfig.json` + `src/index.ts` 最小可启动）
2. `db/driver.ts` + `db/index.ts` + `db/schema.sql` + `db/migrate.ts`：启动能建库；**`getDb()` 建连接前 `mkdirSync(dirname(DB_FILE), { recursive: true })`**——删掉整个 `data/` 后仍能一次启动成功（§3.5）
3. `db/seed.ts` + `scripts/reset-db.ts`：跑出 3 级种子树
4. `shared/`（types、errors、result）+ `middleware/`（auth、validate、error）
5. `dao/menu.dao.ts`、`dao/user.dao.ts`：纯 SQL 读写 + 单测
6. `services/auth.service.ts` + `routes/auth.routes.ts`：登录能拿 token
7. `services/route.service.ts` + `routes/user.routes.ts`：`/user/routes` 输出符合 `docs/03` §1 的树
8. `services/menu.service.ts` + `routes/menu.routes.ts`：CRUD + move + 全部校验
9. `app.ts` 装配（**导出 `createApp()` 供测试**）+ `index.ts` 启动；`curl` 逐个接口自测
10. `shared/constants.ts` 落 `MAX_DEPTH = 3`；`ENABLE_PUBLISH_FLOW=false`；`publishDraft()` 空壳 + 注释（D3 / D4）
11. `vitest.config.ts` + `tests/*.spec.ts`：按 §8.5 用例表补齐，`pnpm --filter @repo/server test` 全绿
12. 前端接上 Vite proxy 联调（进入 `docs/12`）

## 10. 验收清单

> 全部实测通过（2026-09-23，Node `v24.19.0`，驱动 `better-sqlite3` 13.0.3）。

- [x] `pnpm --filter @repo/server dev` 启动成功，控制台打印 `listening on 3001`（`start` 同样验证）
- [x] `pnpm db:reset` 后 `data/app.db` 重建，种子 5 条菜单 + 2 个用户
- [x] `POST /api/auth/login` 用 `admin/admin123` 返回 token；错误密码返回 `401`
- [x] `GET /api/user/routes` 返回树，`meta` 字段与 `docs/03` §1 一致；3 级树由「第 3 层可创建」用例覆盖
- [x] `POST /api/menus` 新增后，`GET /api/menus/tree` 立即包含新节点
- [x] 重复 `name` → `409`；同父重复 `path` → `409`；`parentId` 设为自身子孙 → `409`
- [x] `DELETE /api/menus/:id` 在有子节点时返回 `409`；带 `cascade=true` 时子节点一并删除
- [x] `POST /api/menus/:id/move` 连续拖拽 10 次后，同层 `order_no` 仍单调有序（触发重排逻辑正确）
- [x] 接口全部返回 `{ code, data, message }`；未知路由返回 `404`（无 token 的 `/api/*` 先返回 `401`）
- [x] `pnpm --filter @repo/server type-check` 通过
- [x] `pnpm --filter @repo/server test` 全绿 —— **49 个用例**，含「第 4 级插入 → 422」「component 不存在 → 仍创建成功」
- [x] 测试使用内存库（`DB_PATH=:memory:`），**不污染** `data/app.db`（跑完测试后 `data/` 无新增文件）
- [x] 层级超过 `MAX_DEPTH = 3` 的创建与移动均被拒绝并返回 `422`
- [x] 本期 `publish_status` 写入即 `published`（显式 `draft` → `422`），`/user/routes` 不过滤发布态
- [x] 关闭服务后重启，数据仍在（持久化生效，标记记录 id=6 重启后仍可读）
- [x] **删掉整个 `data/` 目录后首次启动**：自动创建目录与 `app.db`，种子写入成功，无 `SQLITE_CANTOPEN`
- [x] 从仓库根目录执行 `pnpm --filter @repo/server start`，库仍落在 `apps/server/data/app.db`（全仓仅此一份 `*.db`）
- [x] `git status` 中不出现 `*.db` / `*.db-wal` / `*.db-shm` / `*.db-journal`（`docs/10` §1.11 已忽略）

## 11. 风险与回退

| 风险                                            | 现象                               | 回退                                                                      |
| ----------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `better-sqlite3` 无 ABI 137 prebuild / 编译失败 | install 报 node-gyp 错误           | `DB_DRIVER=node-sqlite`，改用内置 `node:sqlite`（已实测可用）；DAO 无感知 |
| Express 5 路由/中间件差异                       | `app.delete('*')` 报路径错误       | Express 5 需具名通配符 `/*splat`；或改用 `app.use(notFound)`              |
| `better-sqlite3` 同步阻塞                       | 并发请求串行                       | 本地演示可接受；文档注明生产替换方案                                      |
| JSON 列类型漂移                                 | `roles` 读出为字符串               | DAO 出口统一 `JSON.parse`（`try/catch` 回落 `[]`）                        |
| 端口冲突                                        | 3001 被占用                        | `PORT` 环境变量切换，并同步 Vite proxy                                    |
| `data/` 目录不存在                              | 启动报 `SQLITE_CANTOPEN`，建库失败 | 建连接前 `mkdirSync(dirname(DB_FILE), { recursive: true })`（§3.5）       |
| `DB_PATH` 基准漂移（从其他目录启动）            | 在别处生成第二份库，改动看不到     | 统一 `resolve(process.cwd(), DB_PATH)`；必要时改用绝对路径                |

## 12. 对既有文档的修订点

- `docs/07`：决策总表 D3（层级 ≤ 3）、D4（发布流程本期即时生效 + 字段预留）、D5（403 本期不启用）、D6（CI server job）均为本文件落地依据
- `docs/03` §1：本服务为契约的**生产者**；补充「`component` 允许空（目录节点）」与「`meta` 空权限数组不写入」两条规则
- `docs/06` §9：MSW 定位改为**仅测试/离线兜底**，默认关闭；开发期数据来自本服务
- `docs/06` §10：新增 `VITE_API_BASE_URL` 默认值与 proxy 说明（已有，补充端口 3001）
- `README.md`：目录总览新增 `apps/server`；§1 能力表将「Mock」表述改为「本地后端服务（Express+SQLite）+ 测试用 MSW」
- `docs/10` §1.11：`.gitignore` 追加 `apps/server/data/*.db-wal` 与 `*.db-shm`（WAL 伴生文件），并注明 `data/` 由服务首次启动自动创建（对应本文档 §3.5）
