import { getDb } from '../db/index.js'
import type { UserRecord, UserRow } from '../shared/types.js'

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    avatar: row.avatar ?? undefined,
    roles: parseJsonArray(row.roles),
    permissions: parseJsonArray(row.permissions),
  }
}

export function findByUsername(username: string): (UserRecord & { password: string }) | undefined {
  const row = getDb()
    .prepare('SELECT * FROM sys_user WHERE username = ? AND status = 1')
    .get<UserRow>(username)
  return row ? { ...toRecord(row), password: row.password } : undefined
}

export function findById(id: number): UserRecord | undefined {
  const row = getDb().prepare('SELECT * FROM sys_user WHERE id = ?').get<UserRow>(id)
  return row ? toRecord(row) : undefined
}
