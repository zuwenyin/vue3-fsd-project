import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { FsdMenu } from '@repo/ui'
import { i18n } from '@/shared/i18n'
import type { MenuItem } from '@/entities/menu'
import MenuTree from '../ui/MenuTree.vue'

/**
 * ★ `el-menu-item` / `el-sub-menu` 依赖父级 `el-menu` 提供的 rootMenu 注入，
 *   因此测试必须挂在 `FsdMenu` 之内（否则 EP 组件渲染失败）。
 */
const Host = defineComponent({
  components: { FsdMenu, MenuTree },
  props: { items: { type: Array, required: true } },
  template: '<FsdMenu><MenuTree :items="items" /></FsdMenu>',
})

const items: MenuItem[] = [
  {
    key: 'Dashboard',
    path: '/dashboard',
    title: '仪表盘',
    titleKey: 'menu.dashboard',
    icon: 'Odometer',
  },
  {
    key: 'System',
    path: '/system',
    title: '系统管理',
    titleKey: 'menu.system',
    icon: 'Setting',
    children: [
      {
        key: 'SystemUser',
        path: '/system/user',
        title: '用户管理',
        titleKey: 'menu.systemUser',
        children: [
          {
            key: 'SystemUserGroup',
            path: '/system/user/group',
            title: '用户分组',
            titleKey: 'menu.systemUserGroup',
          },
        ],
      },
    ],
  },
  { key: 'Docs', path: 'https://example.com/docs', title: '外部文档', external: true },
]

function factory() {
  return mount(Host, { props: { items }, global: { plugins: [i18n] } })
}

describe('MenuTree（四种布局共用的递归菜单）', () => {
  it('递归渲染：目录 → 子菜单，叶子 → 菜单项', () => {
    const wrapper = factory()
    // 有子级的节点（System / SystemUser）渲染为 sub-menu
    expect(wrapper.findAll('.el-sub-menu')).toHaveLength(2)
    // 叶子（Dashboard / SystemUserGroup / Docs）渲染为 menu-item
    expect(wrapper.findAll('.el-menu-item')).toHaveLength(3)
    expect(wrapper.text()).toContain('仪表盘')
    expect(wrapper.text()).toContain('用户分组')
  })

  it('标题经 resolveMenuTitle：切语言后即时变英文（titleKey 生效）', async () => {
    const wrapper = factory()
    expect(wrapper.text()).toContain('系统管理')

    i18n.global.locale.value = 'en-US'
    await nextTick()
    expect(wrapper.text()).toContain('System')
    expect(wrapper.text()).not.toContain('系统管理')

    i18n.global.locale.value = 'zh-CN'
    await nextTick()
  })

  it('外链渲染为 <a target="_blank">（不参与路由）', () => {
    const wrapper = factory()
    const link = wrapper.find('a.menu-tree__external')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com/docs')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.text()).toContain('外部文档')
  })

  it('图标经 FsdIcon 渲染（el-icon 尺寸类）', () => {
    const wrapper = factory()
    expect(wrapper.findAll('svg.el-icon').length).toBeGreaterThan(0)
  })
})
