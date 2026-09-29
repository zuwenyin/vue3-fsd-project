import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/shared/i18n'
import AppBreadcrumb from '../ui/AppBreadcrumb.vue'

const Blank = { template: '<div />' }

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Blank,
      children: [
        {
          path: 'system',
          name: 'System',
          component: Blank,
          meta: { title: '系统管理', titleKey: 'menu.system' },
          children: [
            {
              path: 'user',
              name: 'SystemUser',
              component: Blank,
              meta: { title: '用户管理', titleKey: 'menu.systemUser' },
            },
          ],
        },
      ],
    },
  ],
})

async function factory(path = '/system/user') {
  await router.push(path)
  await router.isReady()
  return mount(AppBreadcrumb, { global: { plugins: [router] } })
}

describe('AppBreadcrumb（面包屑：route.matched 驱动）', () => {
  beforeEach(async () => {
    i18n.global.locale.value = 'zh-CN'
    await router.push('/')
  })

  it('按 matched 渲染多级标题，末级标记 current；无 meta 的根层级被过滤', async () => {
    const wrapper = await factory()
    const items = wrapper.findAll('.app-breadcrumb__item')

    expect(items).toHaveLength(2)
    expect(items[0]?.text()).toBe('系统管理')
    expect(items[1]?.text()).toBe('用户管理')
    expect(items[1]?.classes()).toContain('app-breadcrumb__item--current')
  })

  it('切语言后 titleKey 即时生效（resolveMenuTitle 接入 i18n）', async () => {
    const wrapper = await factory()

    i18n.global.locale.value = 'en-US'
    await nextTick()

    expect(wrapper.text()).toContain('System')
    expect(wrapper.text()).toContain('Users')

    i18n.global.locale.value = 'zh-CN'
  })

  it('当前层级链无标题时不渲染（crumbs 为空）', async () => {
    const wrapper = await factory('/')
    expect(wrapper.find('.app-breadcrumb').exists()).toBe(false)
  })
})
