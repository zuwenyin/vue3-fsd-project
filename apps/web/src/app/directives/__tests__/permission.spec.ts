import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, defineComponent, nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '@/entities/user'
import { appDirectives } from '../index'

/** 模板里订阅了 roles，换账号时会触发重渲染（指令 updated 依赖组件重渲染） */
const Host = defineComponent({
  setup() {
    const user = useUserStore()
    return { roles: computed(() => user.roles) }
  },
  template: `<div>
    <button v-permission="'system:user:add'" class="add">新增</button>
    <span class="hide" v-permission="'role:admin'">仅管理员</span>
    <em class="roles">{{ roles.length }}</em>
  </div>`,
})

function mountWithPermission(roles: string[], permissions: string[]) {
  const user = useUserStore()
  user.roles = roles
  user.permissions = permissions
  return mount(Host, { global: { directives: appDirectives } })
}

describe('v-permission', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('有权限时正常显示（无 display:none）', () => {
    const wrapper = mountWithPermission(['admin'], ['*'])
    const add = wrapper.find('button.add')
    expect(add.exists()).toBe(true)
    expect(add.attributes('style') ?? '').not.toContain('display: none')
    expect(add.attributes('aria-hidden')).toBeUndefined()
  })

  it('无权限时隐藏（display:none + aria-hidden），其它兄弟节点不受影响', () => {
    const wrapper = mountWithPermission(['editor'], ['system:menu:view'])
    const add = wrapper.find('button.add')
    expect(add.exists()).toBe(true)
    expect(add.attributes('style')).toContain('display: none')
    expect(add.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('em.roles').exists()).toBe(true)
  })

  it('权限变化后（换账号 / 重新拉用户信息）能恢复显示', async () => {
    const wrapper = mountWithPermission(['editor'], ['system:menu:view'])
    expect(wrapper.find('button.add').attributes('style')).toContain('display: none')

    const user = useUserStore()
    user.roles = ['admin']
    user.permissions = ['*']
    await nextTick()

    expect(wrapper.find('button.add').attributes('style') ?? '').not.toContain('display: none')
    expect(wrapper.find('span.hide').attributes('style') ?? '').not.toContain('display: none')
  })
})
