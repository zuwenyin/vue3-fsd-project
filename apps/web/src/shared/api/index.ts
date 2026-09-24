import { request, unwrap } from './request'

export { request, unwrap }
export type { ApiResponse, LoginResult, UserInfo } from './types'

/**
 * 此处只保留 axios 实例与统一包装（供各 slice 复用）；业务请求按 FSD 归属到各 slice：
 * - 登录 / 用户信息 → `entities/user/api/user.api.ts`
 * - 路由树 → `entities/menu/api/menu.api.ts`
 */
