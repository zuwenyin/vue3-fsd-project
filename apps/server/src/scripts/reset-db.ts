import { rmSync } from 'node:fs'
import { closeDb, getDb, getDbFile } from '../db/index.js'

const file = getDbFile()
const companions = ['', '-wal', '-shm', '-journal']

closeDb()
if (file !== ':memory:') {
  for (const suffix of companions) {
    rmSync(`${file}${suffix}`, { force: true })
  }
  console.log(`[reset-db] 已删除 ${file}`)
}

const db = getDb()
const menus =
  db.prepare('SELECT COUNT(*) AS count FROM sys_menu').get<{ count: number }>()?.count ?? 0
const users =
  db.prepare('SELECT COUNT(*) AS count FROM sys_user').get<{ count: number }>()?.count ?? 0
console.log(`[reset-db] 重建完成：${file}，菜单 ${menus} 条，用户 ${users} 个`)
