import type { ObjectDirective } from 'vue'
import { hasPermission, type PermissionValue } from '@/entities/permission'
import { useUserStore } from '@/entities/user'

/**
 * `v-permission="'system:user:add'"` / `v-permission="['system:menu:edit', 'role:admin']"`
 * 放在 app 层以便直接读取 entities（docs/13 §3.7 修订说明）。
 *
 * ★ 用 display 控制显隐，而不是把节点换成注释：
 *   节点一旦脱离 DOM，Vue 不会再为它触发 `updated`，换账号（权限刷新）后无法恢复显示。
 *   （docs/13 §3.7 原方案「用占位注释节点替换」实测不满足其自身要求，已同步修订。）
 */
export const permission: ObjectDirective<HTMLElement, PermissionValue | undefined> = {
  mounted(el, binding) {
    apply(el, binding.value)
  },
  // 权限变化（换账号 / 重新拉用户信息）后重新判定，避免残留隐藏态
  updated(el, binding) {
    apply(el, binding.value)
  },
}

function apply(el: HTMLElement, value?: PermissionValue): void {
  const allowed = check(value)
  el.style.display = allowed ? '' : 'none'
  if (allowed) el.removeAttribute('aria-hidden')
  else el.setAttribute('aria-hidden', 'true')
}

function check(value?: PermissionValue): boolean {
  const { permissions, roles } = useUserStore()
  return hasPermission(value, permissions, roles)
}
