import { readFileSync } from 'node:fs'
import { env } from '../config/env.js'
import type { SqliteDatabase } from './driver.js'
import { seedIfEmpty } from './seed.js'

/** 建表（幂等 DDL）→ 空库写种子 */
export function migrate(db: SqliteDatabase): void {
  const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  db.exec(sql)
  if (env.SEED) seedIfEmpty(db)
}
