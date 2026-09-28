import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { storage } from '@repo/utils'
import { i18n } from '@/shared/i18n'
import { TABS_KEY } from '@/shared/config/storage-keys'
import { useTabsStore } from '@/features/tabs'
import AppTabs from '../ui/AppTabs.vue'

const Blank = { template: '<div />' }

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: Blank,
        meta: { title: '仪表盘', titleKey: 'menu.dashboard', affix: true, keepAlive: true },
      },
      {
        path: '/system/user',
        name: 'SystemUser',
        component: Blank,
        meta: { title: '用户管理', titleKey: 'menu.systemUser', keepAlive: true },
      },
      {
        path: '/system/menu',
        name: 'SystemMenu',
        component: Blank,
        meta: { title: '菜单管理', titleKey: 'menu.systemMenu', keepAlive: true },
      },
    ],
  })
}

async function factory(path = '/dashboard') {
  const router = createTestRouter()
  await router.push(path)
  const wrapper = mount(AppTabs, { global: { plugins: [router] } })
  await nextTick()
  return { wrapper, router }
}

describe('AppTabs（自绘页签）', () => {
  beforeEach(() => {
    storage.remove(TABS_KEY)
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh-CN'
  })

  it('挂载后为当前路由开页签，affix 页签无关闭按钮', async () => {
    const { wrapper } = await factory()
    const titles = wrapper.findAll('.app-tabs__title').map((node) => node.text())
    expect(titles).toContain('仪表盘')

    const dashboard = wrapper.find('.app-tabs__item')
    expect(dashboard.classes()).toContain('app-tabs__item--active')
    expect(dashboard.find('.app-tabs__close').exists()).toBe(false)
  })

  it('切换路由累积页签且不重复；非 affix 页签可关闭', async () => {
    const { wrapper, router } = await factory()
    await router.push('/system/user')
    await nextTick()
    await router.push('/system/menu')
    await nextTick()

    expect(wrapper.findAll('.app-tabs__item')).toHaveLength(3)

    // 关闭「用户管理」→ 页签减少且当前页保留
    const userTab = wrapper
      .findAll('.app-tabs__item')
      .find((node) => node.text().includes('用户管理'))
    await userTab?.find('.app-tabs__close').trigger('click')
    await nextTick()

    const titles = wrapper.findAll('.app-tabs__title').map((node) => node.text())
    expect(titles).toEqual(['仪表盘', '菜单管理'])
    expect(router.currentRoute.value.name).toBe('SystemMenu')
  })

  it('关闭当前页签后跳到相邻 affix 页签', async () => {
    const { wrapper, router } = await factory('/dashboard')
    await router.push('/system/user')
    await nextTick()

    const userTab = wrapper
      .findAll('.app-tabs__item')
      .find((node) => node.text().includes('用户管理'))
    await userTab?.find('.app-tabs__close').trigger('click')
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('右键打开菜单：含刷新/关闭/关闭其他等项，关闭其他后仅剩 affix 与当前', async () => {
    const { wrapper, router } = await factory()
    await router.push('/system/user')
    await nextTick()
    await router.push('/system/menu')
    await nextTick()

    const menuTab = wrapper
      .findAll('.app-tabs__item')
      .find((node) => node.text().includes('菜单管理'))
    await menuTab?.trigger('contextmenu', { clientX: 120, clientY: 60 })
    await nextTick()

    const menu = wrapper.find('.tab-context-menu')
    expect(menu.exists()).toBe(true)
    expect(menu.text()).toContain('刷新')
    expect(menu.text()).toContain('关闭其他')
    expect(menu.text()).toContain('全部关闭')

    const closeOthers = menu.findAll('button').find((node) => node.text() === '关闭其他')
    await closeOthers?.trigger('click')
    await nextTick()

    const titles = wrapper.findAll('.app-tabs__title').map((node) => node.text())
    expect(titles).toEqual(['仪表盘', '菜单管理'])
  })

  it('刷新过的页签带刷新戳（key 变化触发重建）', async () => {
    const { wrapper, router } = await factory()
    const tabs = useTabsStore()
    expect(tabs.stampOf('Dashboard')).toBeUndefined()

    await tabs.refreshView('Dashboard')
    await nextTick()
    expect(tabs.stampOf('Dashboard')).toBeTypeOf('number')
    expect(wrapper.findAll('.app-tabs__item')).toHaveLength(1)
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})
