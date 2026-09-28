import { request, unwrap, type ApiResponse } from '@/shared/api'
import type {
  BackendRouteNode,
  MenuFormModel,
  MenuRecord,
  MenuTreeNode,
  MoveMenuPayload,
} from '../model/types'

/** GET /api/user/routes：当前用户可访问的路由树 */
export function fetchUserRoutes(): Promise<BackendRouteNode[]> {
  return unwrap(request.get<ApiResponse<BackendRouteNode[]>>('/user/routes'))
}

/** 菜单管理接口（docs/14 §6；后端语义见 docs/11 §5.5~5.8） */
export const menuApi = {
  /** 扁平全量（管理视图原始数据） */
  list: (): Promise<MenuRecord[]> => unwrap(request.get<ApiResponse<MenuRecord[]>>('/menus')),
  /** 管理树：含停用 / 隐藏项 */
  tree: (): Promise<MenuTreeNode[]> =>
    unwrap(request.get<ApiResponse<MenuTreeNode[]>>('/menus/tree')),
  create: (payload: MenuFormModel): Promise<MenuRecord> =>
    unwrap(request.post<ApiResponse<MenuRecord>>('/menus', payload)),
  update: (id: number, payload: Partial<MenuFormModel>): Promise<MenuRecord> =>
    unwrap(request.put<ApiResponse<MenuRecord>>(`/menus/${id}`, payload)),
  /** 有子节点且未级联 → 后端 409 */
  remove: (id: number, cascade = false): Promise<{ id: number }> =>
    unwrap(request.delete<ApiResponse<{ id: number }>>(`/menus/${id}`, { params: { cascade } })),
  /** 层级/深度非法 → 后端 422；目标父不存在 → 404 */
  move: (payload: MoveMenuPayload): Promise<MenuRecord> =>
    unwrap(request.post<ApiResponse<MenuRecord>>(`/menus/${payload.id}/move`, payload)),
}
