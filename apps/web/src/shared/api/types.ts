/** 后端统一响应包装（docs/11 §5.9） */
export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface LoginResult {
  token: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  permissions: string[]
}
