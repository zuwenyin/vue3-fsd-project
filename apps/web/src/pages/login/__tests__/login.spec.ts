import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { storage } from '@repo/utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TOKEN_KEY } from '@/shared/config/storage-keys'
import LoginPage from '../index.vue'

vi.mock('@/entities/user/api/user.api', () => ({
  login: vi.fn(() => Promise.resolve({ token: 'mock-token' })),
  fetchUserInfo: vi.fn(() =>
    Promise.resolve({
      id: 1,
      username: 'admin',
      nickname: '超级管理员',
      roles: ['admin'],
      permissions: ['*'],
    }),
  ),
}))

const { login } = await import('@/entities/user/api/user.api')
const loginMock = vi.mocked(login)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>home</div>' } },
    { path: '/login', component: LoginPage },
  ],
})

async function mountPage() {
  const wrapper = mount(LoginPage, { global: { plugins: [createPinia(), router] } })
  await flushPromises()
  return wrapper
}

describe('登录页', () => {
  beforeEach(async () => {
    storage.remove(TOKEN_KEY)
    loginMock.mockClear()
    await router.push('/login')
    await router.isReady()
  })

  it('提交后调用登录接口、写入 fsd:token 并跳转首页', async () => {
    const wrapper = await mountPage()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith('admin', 'admin123')
    expect(storage.get<string>(TOKEN_KEY)).toBe('mock-token')
    // 真实落在 localStorage（键名带 fsd: 前缀，未重复拼接）
    expect(globalThis.localStorage.getItem(TOKEN_KEY)).toContain('mock-token')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('登录失败时不写入 token 且不跳转', async () => {
    loginMock.mockRejectedValueOnce(new Error('密码错误'))
    const wrapper = await mountPage()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(globalThis.localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
