import axios, { type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { storage } from '@repo/utils'
import { env } from '@/shared/config/env'
import { TOKEN_KEY } from '@/shared/config/storage-keys'
import type { ApiResponse } from './types'

export const request = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
})

request.interceptors.request.use((config) => {
  const token = storage.get<string>(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse<null>>) => {
    const code = error.response?.data?.code ?? error.response?.status
    const message = error.response?.data?.message ?? error.message
    if (code === 401) {
      // P3 接入 features/auth 的 logout() 后改用它编排
      storage.remove(TOKEN_KEY)
      location.href = '/login'
      return Promise.reject(error)
    }
    if (code === 403) ElMessage.error('无权限访问')
    else ElMessage.error(message || '请求失败')
    return Promise.reject(error)
  },
)

/** 解一层统一包装：code !== 0 直接抛错 */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise
  if (res.data.code !== 0) throw new Error(res.data.message)
  return res.data.data
}
