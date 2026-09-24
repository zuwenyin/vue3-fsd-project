import { defineStore } from 'pinia'
import { storage } from '@repo/utils'
import { TOKEN_KEY } from '@/shared/config/storage-keys'
import type { UserInfo } from '@/shared/api'
import { fetchUserInfo, login as loginRequest } from '../api/user.api'

/**
 * token / roles / permissions / profile 的唯一持有者（决策 D8）。
 * token 经 storage（`fsd:token`）持久化，禁止裸 localStorage。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: storage.get<string>(TOKEN_KEY) ?? '',
    profile: null as UserInfo | null,
    roles: [] as string[],
    permissions: [] as string[],
  }),
  getters: {
    isLogin: (state) => Boolean(state.token),
    nickname: (state) => state.profile?.nickname ?? state.profile?.username ?? '',
  },
  actions: {
    setToken(token: string): void {
      this.token = token
      if (token) storage.set(TOKEN_KEY, token)
      else storage.remove(TOKEN_KEY)
    },
    async login(username: string, password: string): Promise<void> {
      const { token } = await loginRequest(username, password)
      this.setToken(token)
      await this.loadProfile()
    },
    async loadProfile(): Promise<void> {
      const info = await fetchUserInfo()
      this.profile = info
      this.roles = info.roles ?? []
      this.permissions = info.permissions ?? []
    },
    /** 清空凭证与画像（登出由 features/auth 编排，此处只管自身状态） */
    clear(): void {
      this.setToken('')
      this.profile = null
      this.roles = []
      this.permissions = []
    },
  },
})
