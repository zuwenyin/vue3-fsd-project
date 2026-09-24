import { request, unwrap, type ApiResponse, type LoginResult, type UserInfo } from '@/shared/api'

/** POST /api/auth/login */
export function login(username: string, password: string): Promise<LoginResult> {
  return unwrap(request.post<ApiResponse<LoginResult>>('/auth/login', { username, password }))
}

/** GET /api/user/info */
export function fetchUserInfo(): Promise<UserInfo> {
  return unwrap(request.get<ApiResponse<UserInfo>>('/user/info'))
}
