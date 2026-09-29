import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { verifyToken, type TokenUser } from '../services/auth.service.js'
import { ApiError, ErrorCode } from '../shared/errors.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenUser
    }
  }
}

/** Bearer token 校验（除 /auth/login 外全量启用） */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token =
    typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) {
    next(new ApiError(ErrorCode.UNAUTHORIZED, '未登录或 token 缺失'))
    return
  }
  try {
    req.user = verifyToken(token)
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * 权限点校验（决策 D5 的 P10 启用）：
 * `permissions` 含 `*`（admin 通配）或命中任一 `required` → 放行；否则 **403**（`ErrorCode.FORBIDDEN`）。
 *
 * ★ 按权限点而非角色名硬编码：与前端 `v-permission`（如 `system:menu:edit`）同源，一处定义两端一致；
 *   后续加角色只改种子数据，不动路由层。
 * ⚠️ 必须挂在 `authMiddleware` 之后（依赖 `req.user`）。
 */
export function requirePermission(...required: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      // 防御性：正常链路已由 authMiddleware 拦下
      next(new ApiError(ErrorCode.UNAUTHORIZED, '未登录或 token 缺失'))
      return
    }
    const permissions = req.user.permissions
    const allowed = permissions.includes('*') || required.some((item) => permissions.includes(item))
    if (!allowed) {
      next(new ApiError(ErrorCode.FORBIDDEN, `无权限：需要 ${required.join(' / ')}`))
      return
    }
    next()
  }
}
