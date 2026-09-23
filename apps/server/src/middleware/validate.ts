import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { ApiError, ErrorCode } from '../shared/errors.js'

/** zod 校验失败 → 422，message 带首个错误字段 */
export function validate<T>(schema: ZodType<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const first = result.error.issues[0]
      const field = first?.path.join('.') ?? ''
      next(
        new ApiError(ErrorCode.VALIDATION, `参数校验失败：${field} ${first?.message ?? ''}`.trim()),
      )
      return
    }
    if (source === 'body') req.body = result.data
    next()
  }
}
