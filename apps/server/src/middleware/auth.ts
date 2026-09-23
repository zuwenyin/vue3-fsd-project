import type { NextFunction, Request, Response } from 'express'
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
