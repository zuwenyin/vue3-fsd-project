import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { storage } from '@repo/utils'
import { LAYOUT_KEY } from '@/shared/config/storage-keys'
import { useLayoutStore } from '../model/layout.store'

describe('layout.store（P9 偏好扩展，docs/04 §7.4）', () => {
  beforeEach(() => {
    storage.remove(LAYOUT_KEY)
    setActivePinia(createPinia())
  })

  it('无持久化值时取默认：sidebar / 不折叠 / 面包屑开 / 水印关 / 动画开', () => {
    const layout = useLayoutStore()
    expect(layout.mode).toBe('sidebar')
    expect(layout.collapsed).toBe(false)
    expect(layout.breadcrumb).toBe(true)
    expect(layout.watermark).toBe(false)
    expect(layout.pageTransition).toBe(true)
  })

  it('旧值（仅 mode/collapsed）可直接加载，新增字段回落默认（P9 兼容）', () => {
    storage.set(LAYOUT_KEY, { mode: 'dual', collapsed: true })
    const layout = useLayoutStore()
    expect(layout.mode).toBe('dual')
    expect(layout.collapsed).toBe(true)
    expect(layout.breadcrumb).toBe(true)
    expect(layout.watermark).toBe(false)
    expect(layout.pageTransition).toBe(true)
  })

  it('损坏值逐字段回落：mode 非法 / 布尔字段给非布尔', () => {
    storage.set(LAYOUT_KEY, { mode: 'grid', collapsed: 'yes', watermark: 1, breadcrumb: 'no' })
    const layout = useLayoutStore()
    expect(layout.mode).toBe('sidebar')
    expect(layout.collapsed).toBe(false)
    expect(layout.watermark).toBe(false)
    expect(layout.breadcrumb).toBe(true)
  })

  it('setWatermark / setBreadcrumb / setPageTransition 全量持久化到 fsd:layout', () => {
    const layout = useLayoutStore()
    layout.setWatermark(true)
    layout.setBreadcrumb(false)
    layout.setPageTransition(false)

    expect(storage.get(LAYOUT_KEY)).toEqual({
      mode: 'sidebar',
      collapsed: false,
      breadcrumb: false,
      watermark: true,
      pageTransition: false,
    })
  })

  it('同值 set 幂等：清空存储后再设同值不会回写', () => {
    const layout = useLayoutStore()
    layout.setWatermark(true)
    storage.remove(LAYOUT_KEY)

    layout.setWatermark(true)
    expect(storage.get(LAYOUT_KEY)).toBeUndefined()
  })
})
