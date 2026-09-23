export type DbDriver = 'better-sqlite3' | 'node-sqlite'

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

export interface Env {
  PORT: number
  /**
   * SQLite 文件位置。
   * - `:memory:` → 内存库（测试用，不落盘）
   * - 空字符串（默认）→ 固定落在 **apps/server/data/app.db**（以本包目录为锚点，任意 cwd 启动都不漂移）
   * - 其它值 → 相对路径以 `process.cwd()` 为基准，绝对路径直接用
   */
  DB_PATH: string
  DB_DRIVER: DbDriver
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  CORS_ORIGIN: string
  SEED: boolean
  /** 决策 D4：本期恒为 false（保存即生效，不按发布态过滤） */
  ENABLE_PUBLISH_FLOW: boolean
  NODE_ENV: string
}

export const env: Env = {
  PORT: Number(process.env['PORT'] ?? 3001),
  DB_PATH: process.env['DB_PATH'] ?? '',
  DB_DRIVER: process.env['DB_DRIVER'] === 'node-sqlite' ? 'node-sqlite' : 'better-sqlite3',
  JWT_SECRET: process.env['JWT_SECRET'] ?? 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '7d',
  CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  SEED: bool(process.env['SEED'], true),
  ENABLE_PUBLISH_FLOW: bool(process.env['ENABLE_PUBLISH_FLOW'], false),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
}
