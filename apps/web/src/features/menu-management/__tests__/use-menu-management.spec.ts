import type { MessageBoxData } from 'element-plus'
import { createPinia } from 'pinia'
import { createApp, defineComponent, h, type App } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MENU_HOT_APPLY_KEY, type MenuApplyResult } from '@/shared/lib/menu-apply'
import { useMenuManagement } from '../model/use-menu-management'
import { node, record } from './factory'

/**
 * EP 的 `MessageBoxData = MessageBoxInputData & Action`（与字符串联合求交），无法正常构造，
 * 只能断言式地造一个「点了确定」的返回值。
 */
function confirmed(): Promise<MessageBoxData> {
  return Promise.resolve({ value: '', action: 'confirm' } as unknown as MessageBoxData)
}

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  ElMessageBox: { confirm: vi.fn(() => confirmed()) },
}))

vi.mock('@/shared/lib/page-modules', () => ({
  pageComponentKeys: ['dashboard/index', 'system/menu/index'],
  resolvePageComponent: () => undefined,
}))

vi.mock('@/entities/menu/api/menu.api', () => ({
  fetchUserRoutes: vi.fn(),
  menuApi: {
    list: vi.fn(),
    tree: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    move: vi.fn(),
  },
}))

const { ElMessage, ElMessageBox } = await import('element-plus')
const { menuApi } = await import('@/entities/menu/api/menu.api')
const successMock = vi.mocked(ElMessage.success)
const errorMock = vi.mocked(ElMessage.error)
const confirmMock = vi.mocked(ElMessageBox.confirm)
const treeMock = vi.mocked(menuApi.tree)
const moveMock = vi.mocked(menuApi.move)
const removeMock = vi.mocked(menuApi.remove)

/** A(1) ├ A1(2) └ A2(3) / B(4) └ B1(5) */
function sampleTree() {
  return [
    node({
      id: 1,
      name: 'A',
      orderNo: 10,
      children: [
        node({ id: 2, name: 'A1', parentId: 1, orderNo: 10 }),
        node({ id: 3, name: 'A2', parentId: 1, orderNo: 20 }),
      ],
    }),
    node({
      id: 4,
      name: 'B',
      orderNo: 20,
      children: [node({ id: 5, name: 'B1', parentId: 4, orderNo: 10 })],
    }),
  ]
}

type Api = ReturnType<typeof useMenuManagement>

/**
 * 在真实 setup 上下文里运行 composable（inject 需要 currentInstance）。
 * 热应用能力与生产一致走 app 级 provide（`provideMenuHotApply`）。
 */
function withComposable(hotApply?: () => Promise<MenuApplyResult>): Api {
  let api!: Api
  const app: App = createApp(
    defineComponent({
      setup() {
        api = useMenuManagement()
        return () => h('div')
      },
    }),
  )
  app.use(createPinia())
  if (hotApply) app.provide(MENU_HOT_APPLY_KEY, hotApply)
  app.mount(document.createElement('div'))
  return api
}

describe('useMenuManagement', () => {
  beforeEach(() => {
    successMock.mockClear()
    errorMock.mockClear()
    confirmMock.mockClear()
    confirmMock.mockImplementation(confirmed)
    treeMock.mockReset()
    treeMock.mockImplementation(() => Promise.resolve(sampleTree()))
    moveMock.mockReset()
    removeMock.mockReset()
  })

  it('拖拽成功：先乐观更新，再标记脏数据', async () => {
    moveMock.mockResolvedValue(record({ id: 3, parentId: 4 }))
    const api = withComposable()
    await api.load()

    await api.move({ id: 3, targetParentId: 4, beforeId: null })

    expect(moveMock).toHaveBeenCalledWith({ id: 3, targetParentId: 4, beforeId: null })
    expect(api.tree.value[0]?.children.map((item) => item.id)).toEqual([2])
    expect(api.tree.value[1]?.children.map((item) => item.id)).toEqual([5, 3])
    expect(api.hasDirty.value).toBe(true)
  })

  it('拖拽失败：回滚到快照并展示后端 message', async () => {
    moveMock.mockRejectedValueOnce(new Error('移动后将超过 3 级'))
    const api = withComposable()
    await api.load()
    const snapshot = JSON.parse(JSON.stringify(api.tree.value)) as typeof api.tree.value

    await api.move({ id: 3, targetParentId: 4, beforeId: null })

    expect(errorMock).toHaveBeenCalledWith('移动后将超过 3 级')
    expect(api.tree.value).toEqual(snapshot)
    expect(api.hasDirty.value).toBe(false)
  })

  it('非法落点（拖到自身子孙）：本地直接拦下，不发请求也不报错', async () => {
    const api = withComposable()
    await api.load()

    // 2 是 1 的子孙
    await api.move({ id: 1, targetParentId: 2, beforeId: null })

    expect(moveMock).not.toHaveBeenCalled()
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('应用变更：调用注入的热替换能力并清除脏标记', async () => {
    const hotApply = vi.fn(() => Promise.resolve({ redirected: false }))
    moveMock.mockResolvedValue(record({ id: 3, parentId: 4 }))
    const api = withComposable(hotApply)
    await api.load()
    await api.move({ id: 3, targetParentId: 4, beforeId: null })

    await api.applyChanges()

    expect(hotApply).toHaveBeenCalledTimes(1)
    expect(successMock).toHaveBeenCalledWith('菜单已应用')
    expect(api.hasDirty.value).toBe(false)
  })

  it('应用变更：当前路由被移除（redirected）时不再重复提示成功；能力未注入时报错', async () => {
    const hotApply = vi.fn(() => Promise.resolve({ redirected: true }))
    const api = withComposable(hotApply)
    await api.applyChanges()

    expect(successMock).not.toHaveBeenCalled()
    expect(api.hasDirty.value).toBe(false)

    const apiWithout = withComposable()
    await apiWithout.applyChanges()
    expect(errorMock).toHaveBeenCalledWith('热应用能力未注入（MENU_HOT_APPLY_KEY）')
  })

  it('删除：后端 409（有子节点）经二次确认后走级联删除', async () => {
    removeMock.mockRejectedValueOnce(new Error('存在子菜单'))
    removeMock.mockResolvedValueOnce({ id: 1 })
    const api = withComposable()
    await api.load()

    await api.remove(1)

    expect(removeMock).toHaveBeenNthCalledWith(1, 1)
    expect(removeMock).toHaveBeenNthCalledWith(2, 1, true)
    expect(api.hasDirty.value).toBe(true)
  })

  it('删除：二次确认取消时不发级联请求', async () => {
    removeMock.mockRejectedValueOnce(new Error('存在子菜单'))
    // 第一次「确认删除」通过，第二次「级联删除」被取消
    confirmMock.mockImplementationOnce(confirmed)
    confirmMock.mockImplementationOnce(() => Promise.reject(new Error('cancel')))
    const api = withComposable()
    await api.load()

    await api.remove(1)

    expect(removeMock).toHaveBeenCalledTimes(1)
    expect(api.hasDirty.value).toBe(false)
  })

  it('切换选中：表单有未保存修改时，用户取消则保持当前选中', async () => {
    const api = withComposable()
    await api.load()
    await api.select(1)
    api.form.value!.title = '改了但没保存'

    confirmMock.mockImplementation(() => Promise.reject(new Error('cancel')))
    await api.select(2)

    expect(api.selectedId.value).toBe(1)
  })

  it('切换选中：确认放弃修改后载入新节点的深拷贝表单', async () => {
    const api = withComposable()
    await api.load()
    await api.select(1)
    api.form.value!.title = '改了但没保存'

    await api.select(2)

    expect(api.selectedId.value).toBe(2)
    expect(api.form.value?.title).toBe('菜单2')
    // 深拷贝：改表单不会污染树节点
    api.form.value!.title = '另一处改动'
    expect(api.tree.value[0]?.children[0]?.title).toBe('菜单2')
  })
})
