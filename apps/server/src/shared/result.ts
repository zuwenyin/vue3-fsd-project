import { ErrorCode, type ErrorCodeValue } from './errors.js'
import type { ApiResponse } from './types.js'

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: ErrorCode.OK, data, message }
}

export function fail(code: ErrorCodeValue, message: string): ApiResponse<null> {
  return { code, data: null, message }
}
