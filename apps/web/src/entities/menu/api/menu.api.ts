import { request, unwrap, type ApiResponse } from '@/shared/api'
import type { BackendRouteNode } from '../model/types'

/** GET /api/user/routes：当前用户可访问的路由树 */
export function fetchUserRoutes(): Promise<BackendRouteNode[]> {
  return unwrap(request.get<ApiResponse<BackendRouteNode[]>>('/user/routes'))
}
