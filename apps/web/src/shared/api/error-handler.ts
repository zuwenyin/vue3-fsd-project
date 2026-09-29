import { ElMessage } from 'element-plus'
import { storage } from '@repo/utils'
import { TOKEN_KEY } from '@/shared/config/storage-keys'
import { t } from '@/shared/i18n'

/**
 * 统一错误分支（P10 从 `request.ts` 抽出，便于单测）：
 * - **401**：登录态失效 → 清 token 并跳登录；
 * - **403**：缺权限点（P10 服务端启用）→ **仅提示、不跳登录**（登录态仍然有效）；
 * - 其他：优先展示服务端 `message`，缺失时回落通用文案。
 */
export function handleApiError(code: number | undefined, message?: string): void {
  if (code === 401) {
    storage.remove(TOKEN_KEY)
    location.href = '/login'
    return
  }
  if (code === 403) {
    ElMessage.error(t('error.forbidden'))
    return
  }
  ElMessage.error(message || t('error.requestFailed'))
}
