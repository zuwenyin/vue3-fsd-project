import type { PermissionCode, PermissionValue } from '../model/types'

/**
 * 权限判定（docs/03 §6 + docs/13 §3.3）
 * - 未配置需求 → 放行
 * - `admin` 角色直通
 * - 支持 `role:xxx` 前缀：命中任一所需角色即通过
 * - 普通权限点：命中任一即通过
 */
export function hasPermission(
  need?: PermissionValue,
  owned: string[] = [],
  roles: string[] = [],
): boolean {
  if (!need || (Array.isArray(need) && need.length === 0)) return true
  if (roles.includes('admin')) return true

  const list: PermissionCode[] = Array.isArray(need) ? need : [need]
  const needRoles = list.filter((code) => code.startsWith('role:')).map((code) => code.slice(5))
  if (needRoles.length > 0 && needRoles.some((role) => roles.includes(role))) return true

  const perms = list.filter((code) => !code.startsWith('role:'))
  return perms.length === 0 ? false : perms.some((code) => owned.includes(code))
}
