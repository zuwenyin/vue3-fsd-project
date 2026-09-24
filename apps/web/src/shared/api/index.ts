import { request, unwrap } from './request'
import type { ApiResponse, LoginResult, UserInfo } from './types'

export { request, unwrap }
export type { ApiResponse, LoginResult, UserInfo } from './types'

export function login(username: string, password: string): Promise<LoginResult> {
  return unwrap(request.post<ApiResponse<LoginResult>>('/auth/login', { username, password }))
}

export function fetchUserInfo(): Promise<UserInfo> {
  return unwrap(request.get<ApiResponse<UserInfo>>('/user/info'))
}
