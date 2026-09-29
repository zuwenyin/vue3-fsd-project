import { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from '@repo/utils'
import { TOKEN_KEY } from '@/shared/config/storage-keys'
import { handleApiError } from '../error-handler'

vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn() } }))

describe('handleApiError（P10：403 只提示、不跳登录）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.set(TOKEN_KEY, 'token-keep')
  })

  it('403：提示「无权限访问」且保留 token（登录态有效）', () => {
    handleApiError(403, '无权限：需要 system:menu:edit')
    expect(ElMessage.error).toHaveBeenCalledWith('无权限访问')
    expect(storage.get(TOKEN_KEY)).toBe('token-keep')
  })

  it('其他错误码：优先展示服务端 message', () => {
    handleApiError(409, 'name 重复')
    expect(ElMessage.error).toHaveBeenCalledWith('name 重复')
  })

  it('无 message 时回落通用文案', () => {
    handleApiError(500)
    expect(ElMessage.error).toHaveBeenCalledWith('请求失败')
  })
})
