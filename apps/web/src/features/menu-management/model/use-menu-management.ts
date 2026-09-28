import { computed, inject, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  menuApi,
  useMenuStore,
  type MenuFormModel,
  type MenuTreeNode,
  type MoveMenuPayload,
} from '@/entities/menu'
import { MENU_HOT_APPLY_KEY } from '@/shared/lib/menu-apply'
import { pageComponentKeys } from '@/shared/lib/page-modules'
import { depthOf, subtreeHeight } from './constants'
import { formFromRecord, toUpdatePayload } from './menu-form'
import { applyLocalMove, applyLocalUpdate, findNode, siblingMovePayload } from './tree-mutations'

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败'
}

/** 排除自身及其子孙后的可选父树（换父 / 新增子级用） */
function filterSubtree(tree: MenuTreeNode[], excludeId: number | null): MenuTreeNode[] {
  if (excludeId == null) return tree
  const walk = (nodes: MenuTreeNode[]): MenuTreeNode[] =>
    nodes
      .filter((node) => node.id !== excludeId)
      .map((node) => ({ ...node, children: walk(node.children) }))
  return walk(tree)
}

function cloneForm(form: MenuFormModel): MenuFormModel {
  return JSON.parse(JSON.stringify(form)) as MenuFormModel
}

/**
 * 菜单配置页编排（docs/14 §5.1）。
 * `hasDirty` 唯一归属 menuStore（决策 D13），此处只读；
 * 「应用变更」能力由 app 层注入（features 不得导入 app/*，docs/14 §3）。
 */
export function useMenuManagement() {
  const menuStore = useMenuStore()
  const hotApply = inject(MENU_HOT_APPLY_KEY, null)

  const tree = ref<MenuTreeNode[]>([])
  const selectedId = ref<number | null>(null)
  const form = ref<MenuFormModel | null>(null)
  /** 选中行快照：脏判定与「换父级」判定基准 */
  const initialForm = ref<MenuFormModel | null>(null)
  const loading = ref(false)

  const hasDirty = computed(() => menuStore.hasDirty)
  const isFormDirty = computed(() => {
    if (!form.value || !initialForm.value) return false
    return JSON.stringify(form.value) !== JSON.stringify(initialForm.value)
  })
  /** 深度只读计算：3 级节点禁用「新增子级」 */
  const selectedDepth = computed(() =>
    selectedId.value == null ? 0 : depthOf(tree.value, selectedId.value),
  )
  const parentOptions = computed(() => filterSubtree(tree.value, selectedId.value))
  const componentOptions = pageComponentKeys

  async function load(): Promise<void> {
    loading.value = true
    try {
      tree.value = await menuApi.tree()
    } catch (error) {
      ElMessage.error(messageOf(error))
    } finally {
      loading.value = false
    }
  }

  async function confirmDiscardIfDirty(): Promise<boolean> {
    if (!isFormDirty.value) return true
    try {
      await ElMessageBox.confirm('当前修改尚未保存，切换后将丢失，是否继续？', '提示', {
        type: 'warning',
        confirmButtonText: '继续',
        cancelButtonText: '留在此页',
      })
      return true
    } catch {
      return false
    }
  }

  async function select(id: number): Promise<void> {
    if (id === selectedId.value) return
    if (!(await confirmDiscardIfDirty())) return
    const node = findNode(tree.value, id)
    if (!node) return
    selectedId.value = id
    form.value = formFromRecord(node)
    initialForm.value = cloneForm(form.value)
  }

  /** 保存（表单校验由 MenuDetailForm 完成） */
  async function save(model: MenuFormModel): Promise<void> {
    if (selectedId.value == null) return
    loading.value = true
    try {
      const record = await menuApi.update(selectedId.value, toUpdatePayload(model))
      const parentChanged = record.parentId !== initialForm.value?.parentId
      // 换父级涉及两棵子树，整树重载更可靠；其余就地更新（验收：不整表刷新）
      tree.value = parentChanged ? await menuApi.tree() : applyLocalUpdate(tree.value, record)
      menuStore.markDirty()
      form.value = formFromRecord(record)
      initialForm.value = cloneForm(form.value)
      ElMessage.success('已保存')
    } catch (error) {
      ElMessage.error(messageOf(error))
    } finally {
      loading.value = false
    }
  }

  function cancelEdit(): void {
    form.value = initialForm.value ? cloneForm(initialForm.value) : null
  }

  async function remove(id: number): Promise<void> {
    try {
      await ElMessageBox.confirm('确认删除该菜单？', '删除确认', { type: 'warning' })
    } catch {
      return
    }
    loading.value = true
    try {
      await menuApi.remove(id)
    } catch {
      // 有子节点（后端 409）→ 询问是否级联删除
      try {
        await ElMessageBox.confirm('该菜单存在子菜单，是否连同子菜单一起删除？', '级联删除', {
          type: 'warning',
          confirmButtonText: '全部删除',
          cancelButtonText: '取消',
        })
      } catch {
        loading.value = false
        return
      }
      try {
        await menuApi.remove(id, true)
      } catch (error) {
        ElMessage.error(messageOf(error))
        loading.value = false
        return
      }
    }
    if (selectedId.value === id) {
      selectedId.value = null
      form.value = null
      initialForm.value = null
    }
    await load()
    menuStore.markDirty()
    ElMessage.success('已删除')
    loading.value = false
  }

  /** 拖拽/上移下移：乐观更新 + 失败回滚（docs/14 §5.1） */
  async function move(payload: MoveMenuPayload): Promise<void> {
    const snapshot = JSON.parse(JSON.stringify(tree.value)) as MenuTreeNode[]
    const optimistic = applyLocalMove(tree.value, payload)
    if (optimistic === tree.value) return
    tree.value = optimistic
    try {
      await menuApi.move(payload)
      menuStore.markDirty()
    } catch (error) {
      tree.value = snapshot
      ElMessage.error(messageOf(error))
    }
  }

  function moveRow(id: number, direction: 'up' | 'down'): void {
    const payload = siblingMovePayload(tree.value, id, direction)
    if (payload) void move(payload)
  }

  /** 新增（Dialog 提交）：整树重载以对齐兄弟排序，随后选中新节点 */
  async function create(model: MenuFormModel): Promise<void> {
    loading.value = true
    try {
      const record = await menuApi.create(model)
      tree.value = await menuApi.tree()
      menuStore.markDirty()
      selectedId.value = record.id
      form.value = formFromRecord(record)
      initialForm.value = cloneForm(form.value)
      ElMessage.success('已创建')
    } catch (error) {
      ElMessage.error(messageOf(error))
    } finally {
      loading.value = false
    }
  }

  /** 「应用变更」：拉路由 + 热替换（实现由 app 层注入，决策 D4 不调用发布接口） */
  async function applyChanges(): Promise<void> {
    if (!hotApply) {
      ElMessage.error('热应用能力未注入（MENU_HOT_APPLY_KEY）')
      return
    }
    loading.value = true
    try {
      const { redirected } = await hotApply()
      if (!redirected) ElMessage.success('菜单已应用')
      menuStore.clearDirty()
    } catch (error) {
      ElMessage.error(messageOf(error))
    } finally {
      loading.value = false
    }
  }

  async function reset(): Promise<void> {
    if (!(await confirmDiscardIfDirty())) return
    await load()
    menuStore.clearDirty()
  }

  /** 拖拽深度预判用：目标子树高度（落点换算的补充信息） */
  function heightOf(id: number): number {
    const node = findNode(tree.value, id)
    return node ? subtreeHeight(node) : 1
  }

  return {
    tree,
    selectedId,
    form,
    initialForm,
    loading,
    hasDirty,
    isFormDirty,
    selectedDepth,
    parentOptions,
    componentOptions,
    load,
    select,
    save,
    cancelEdit,
    remove,
    move,
    moveRow,
    create,
    applyChanges,
    reset,
    heightOf,
  }
}
