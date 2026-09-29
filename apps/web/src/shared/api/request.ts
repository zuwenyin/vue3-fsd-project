import axios, { type AxiosError } from 'axios'
import { storage } from '@repo/utils'
import { env } from '@/shared/config/env'
import { TOKEN_KEY } from '@/shared/config/storage-keys'
import { handleApiError } from './error-handler'
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
    // 401 清 token 跳登录 / 403 仅提示（P10）/ 其他展示服务端 message —— 见 error-handler.ts
    handleApiError(
      error.response?.data?.code ?? error.response?.status,
      error.response?.data?.message ?? error.message,
    )
    return Promise.reject(error)
  },
)

/** 解一层统一包装：code !== 0 直接抛错 */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise
  if (res.data.code !== 0) throw new Error(res.data.message)
  return res.data.data
}
