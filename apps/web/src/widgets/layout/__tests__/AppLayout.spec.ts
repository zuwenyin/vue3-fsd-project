import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { storage } from '@repo/utils'
import { i18n } from '@/shared/i18n'
import { TABS_KEY } from '@/shared/config/storage-keys'
import { useLayoutStore } from '@/features/layout-switch'
import AppLayout from '../AppLayout.vue'

const Blank = { template: '<div class="stub-page" />' }

/** 让 vueuse 的 useBreakpoints 按给定视口宽度求值（happy-dom 默认 matchMedia 恒 false） */
function stubViewport(width: number): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const min = /min-width:\s*(\d+)/.exec(query)
    const max = /max-width:\s*(\d+)/.exec(query)
    let matches = false
    if (min) matches = width >= Number(min[1])
    else if (max) matches = width <= Number(max[1])
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  })
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        name: 'Layout',
        component: AppLayout,
        children: [
          {
            path: 'dashboard',
            name: 'Dashboard',
            component: Blank,
            meta: { title: '仪表盘', titleKey: 'menu.dashboard', affix: true, keepAlive: true },
          },
          {
            path: 'dual-page',
            name: 'DualPage',
            component: Blank,
            // 单页覆盖布局（docs/15 §2.2）
            meta: { title: '双栏页', layout: 'dual' },
          },
        ],
      },
    ],
  })
}

async function factory(path = '/dashboard') {
  const router = createTestRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(AppLayout, { global: { plugins: [router, i18n] } })
  await nextTick()
  return { wrapper, router }
}

describe('AppLayout（四布局分发 + 壳层能力）', () => {
  beforeEach(() => {
    stubViewport(1440)
    storage.remove(TABS_KEY)
    storage.remove('fsd:layout')
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh-CN'
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('默认按 layout store 渲染 sidebar 布局，并渲染页签栏', async () => {
    const { wrapper } = await factory()
    expect(wrapper.find('.sidebar-layout').exists()).toBe(true)
    expect(wrapper.find('.app-tabs').exists()).toBe(true)
  }, 15000)

  // ★ 布局切换会重建布局组件（含 EP 菜单/下拉），happy-dom 下首渲染较慢，
  //   默认 5s 超时不够（实测需 ~6–10s），这里统一放宽
  it('切换模式即时换布局（不重建路由）', async () => {
    const { wrapper, router } = await factory()
    const layout = useLayoutStore()

    layout.setMode('top')
    await nextTick()
    expect(wrapper.find('.top-layout').exists()).toBe(true)
    expect(wrapper.find('.sidebar-layout').exists()).toBe(false)

    layout.setMode('mix')
    await nextTick()
    expect(wrapper.find('.mix-layout').exists()).toBe(true)

    layout.setMode('dual')
    await nextTick()
    expect(wrapper.find('.dual-layout').exists()).toBe(true)
    // 布局切换不影响当前路由
    expect(router.currentRoute.value.name).toBe('Dashboard')
  }, 15000)

  it('route.meta.layout 覆盖全局模式', async () => {
    const { wrapper, router } = await factory()
    expect(wrapper.find('.sidebar-layout').exists()).toBe(true)

    await router.push('/dual-page')
    await nextTick()
    expect(wrapper.find('.dual-layout').exists()).toBe(true)
    expect(wrapper.find('.sidebar-layout').exists()).toBe(false)
  }, 15000)

  it('桌面下 Header 折叠按钮切换 layout.collapsed', async () => {
    const { wrapper } = await factory()
    const layout = useLayoutStore()
    expect(layout.collapsed).toBe(false)

    await wrapper.find('.app-header button[title]').trigger('click')
    expect(layout.collapsed).toBe(true)
  }, 15000)

  it('小屏（<960px）隐藏桌面侧栏，抽屉由壳层状态控制', async () => {
    stubViewport(800)
    const { wrapper } = await factory()
    // 桌面 aside/rail 不渲染（移动端走抽屉，docs/15 §2.5）
    expect(wrapper.find('.sidebar-layout__aside').exists()).toBe(false)
    expect(wrapper.find('.app-sidebar-drawer').exists()).toBe(false)

    await wrapper.find('.app-header button[title]').trigger('click')
    await nextTick()
    expect(wrapper.find('.app-sidebar-drawer').exists()).toBe(true)

    await wrapper.find('.app-sidebar-drawer__mask').trigger('click')
    await nextTick()
    expect(wrapper.find('.app-sidebar-drawer').exists()).toBe(false)
  }, 15000)
})
