import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, inject, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { storage } from '@repo/utils'
import { i18n } from '@/shared/i18n'
import { TABS_KEY } from '@/shared/config/storage-keys'
import { useLayoutStore } from '@/features/layout-switch'
import AppLayout from '../AppLayout.vue'
import { LAYOUT_SHELL_KEY } from '../model/layout-shell'

const Blank = { template: '<div class="stub-page" />' }

/**
 * 轻量 Header 替身：真实 `AppHeader` 内含 EP 下拉/选择器（LayoutSwitch / ThemeSwitch / LangSwitch），
 * 在 happy-dom 下渲染极慢（实测该文件曾是 35s）。本文件只验证「壳层注入协议 + 布局分发 + 状态切换」，
 * 故保留折叠按钮与注入链路，其余细节交给真实浏览器 E2E（docs/15 §2.6）。
 */
const HeaderStub = defineComponent({
  name: 'AppHeader',
  setup() {
    const shell = inject(LAYOUT_SHELL_KEY)
    return { toggle: () => shell?.toggleSidebar() }
  },
  template:
    '<header class="app-header"><button type="button" title="toggle" @click="toggle">t</button></header>',
})

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
  const wrapper = mount(AppLayout, {
    global: {
      plugins: [router],
      // i18n 由 vitest.setup.ts 全局注册；FsdMenu/MenuTree 渲染 EP 菜单，布局分发用例无需真实菜单
      stubs: { AppHeader: HeaderStub, FsdMenu: true, MenuTree: true },
    },
  })
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
  })

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
  })

  it('route.meta.layout 覆盖全局模式', async () => {
    const { wrapper, router } = await factory()
    expect(wrapper.find('.sidebar-layout').exists()).toBe(true)

    await router.push('/dual-page')
    await nextTick()
    expect(wrapper.find('.dual-layout').exists()).toBe(true)
    expect(wrapper.find('.sidebar-layout').exists()).toBe(false)
  })

  it('桌面下 Header 折叠按钮切换 layout.collapsed', async () => {
    const { wrapper } = await factory()
    const layout = useLayoutStore()
    expect(layout.collapsed).toBe(false)

    await wrapper.find('.app-header button[title]').trigger('click')
    expect(layout.collapsed).toBe(true)
  })

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
  })
})
