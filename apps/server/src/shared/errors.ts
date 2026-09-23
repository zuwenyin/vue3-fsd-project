export const ErrorCode = {
  OK: 0,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 422,
  INTERNAL: 500,
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

export class ApiError extends Error {
  readonly code: ErrorCodeValue

  constructor(code: ErrorCodeValue, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
