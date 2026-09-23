import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'
import { createDatabase, type SqliteDatabase } from './driver.js'
import { migrate } from './migrate.js'

let db: SqliteDatabase | null = null

/** 库文件路径：默认锚定到本包的 data/app.db，任意 cwd 启动都不漂移（docs/11 §3.5） */
export function getDbFile(): string {
  if (env.DB_PATH === ':memory:') return ':memory:'
  if (env.DB_PATH) return resolve(process.cwd(), env.DB_PATH)
  return fileURLToPath(new URL('../../data/app.db', import.meta.url))
}

export function getDb(): SqliteDatabase {
  if (!db) {
    const file = getDbFile()
    // ★ 没有这行，删掉 data/ 后首次启动必炸（SQLITE_CANTOPEN）
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
    db = createDatabase(file, env.DB_DRIVER)
    migrate(db)
  }
  return db
}

export function closeDb(): void {
  db?.close()
  db = null
}
