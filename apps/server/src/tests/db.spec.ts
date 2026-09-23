import { existsSync, rmSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

/** DB_PATH 指向尚不存在的多级目录时，getDb() 必须先建目录再连（SQLITE_CANTOPEN 防护） */
describe('数据库目录', () => {
  afterAll(() => {
    vi.resetModules()
  })

  it('目录不存在时自动创建（不炸 SQLITE_CANTOPEN）', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fsd-db-'))
    const target = join(root, 'nested', 'deep', 'app.db')
    try {
      process.env['DB_PATH'] = target
      process.env['SEED'] = 'false'
      vi.resetModules()

      const { getDb, closeDb } = await import('../db/index.js')
      const db = getDb()
      expect(existsSync(target)).toBe(true)
      db.prepare('SELECT 1 AS ok').get()
      closeDb()
    } finally {
      rmSync(root, { recursive: true, force: true })
      delete process.env['DB_PATH']
      delete process.env['SEED']
    }
  })

  it('SEED=false 时为空库，路由树返回空数组', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fsd-db2-'))
    const target = join(root, 'empty.db')
    try {
      process.env['DB_PATH'] = target
      process.env['SEED'] = 'false'
      vi.resetModules()

      const { getDb, closeDb } = await import('../db/index.js')
      getDb()
      const { buildRouteTree } = await import('../services/route.service.js')
      expect(buildRouteTree()).toEqual([])
      closeDb()
    } finally {
      rmSync(root, { recursive: true, force: true })
      delete process.env['DB_PATH']
      delete process.env['SEED']
    }
  })
})
