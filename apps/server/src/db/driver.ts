import { createRequire } from 'node:module'
import type { DbDriver } from '../config/env.js'

// ESM（"type": "module"）下没有全局 require：统一用 createRequire 加载内置模块与 CJS 原生模块
const require = createRequire(import.meta.url)

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

interface LooseRunResult {
  changes?: number | bigint
  lastInsertRowid?: number | bigint
}

interface LooseStatement {
  run: (...params: unknown[]) => LooseRunResult
  get: (...params: unknown[]) => unknown
  all: (...params: unknown[]) => unknown[]
}

interface LooseDatabase {
  exec: (sql: string) => unknown
  prepare: (sql: string) => LooseStatement
  close: () => void
}

/** node:sqlite 的 lastInsertRowid / changes 是 bigint，统一转 Number */
function normalize(result: LooseRunResult): RunResult {
  return {
    changes: Number(result.changes ?? 0),
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
  }
}

function wrap(db: LooseDatabase, transaction: SqliteDatabase['transaction']): SqliteDatabase {
  return {
    exec: (sql) => {
      db.exec(sql)
    },
    prepare: (sql) => {
      const st = db.prepare(sql)
      return {
        run: (...params) => normalize(st.run(...params)),
        get: <T = unknown>(...params: unknown[]) => st.get(...params) as T | undefined,
        all: <T = unknown>(...params: unknown[]) => st.all(...params) as T[],
      }
    },
    transaction,
    close: () => db.close(),
  }
}

/** 回退驱动：Node 内置 node:sqlite（本机 v24.19.0 无需 --experimental-sqlite） */
function createNodeSqlite(file: string): SqliteDatabase {
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => LooseDatabase
  }
  const db = new DatabaseSync(file)
  return wrap(db, (fn) => {
    db.exec('BEGIN')
    try {
      const result = fn()
      db.exec('COMMIT')
      return result
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  })
}

/** 主选驱动：better-sqlite3（同步阻塞 API，单进程天然串行） */
function createBetterSqlite3(file: string): SqliteDatabase {
  const Database = require('better-sqlite3') as unknown as new (
    path: string,
  ) => LooseDatabase & { transaction: <T>(fn: () => T) => () => T }
  const db = new Database(file)
  return wrap(db, (fn) => db.transaction(fn)())
}

export function createDatabase(file: string, driver: DbDriver = 'better-sqlite3'): SqliteDatabase {
  return driver === 'node-sqlite' ? createNodeSqlite(file) : createBetterSqlite3(file)
}
