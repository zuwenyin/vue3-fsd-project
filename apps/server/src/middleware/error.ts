import type { NextFunction, Request, Response } from 'express'
import { ApiError, ErrorCode } from '../shared/errors.js'
import { fail } from '../shared/result.js'

export function notFound(_req: Request, res: Response): void {
  res.status(ErrorCode.NOT_FOUND).json(fail(ErrorCode.NOT_FOUND, 'Not Found'))
}

/** 统一错误出口：ApiError 按其 code 回状态码，未知异常记日志不回吐堆栈 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.code).json(fail(error.code, error.message))
    return
  }
  console.error('[server] 未捕获异常：', error)
  res.status(ErrorCode.INTERNAL).json(fail(ErrorCode.INTERNAL, '服务异常'))
}
