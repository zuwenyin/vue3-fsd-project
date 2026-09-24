/** 权限点编码；支持 `role:xxx` 前缀表示角色 */
export type PermissionCode = string

/** 判定所需的持有者信息 */
export interface PermissionOwner {
  permissions?: string[]
  roles?: string[]
}

/** 指令取值：单个权限点或多个（满足其一即可） */
export type PermissionValue = PermissionCode | PermissionCode[]
