<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FsdDialog, FsdForm, FsdFormItem, FsdInput, FsdSelect, FsdTreeSelect } from '@repo/ui'
import type { MenuFormModel, MenuTreeNode, MenuType } from '@/entities/menu'
import { pageComponentKeys } from '@/shared/lib/page-modules'
import { MENU_TYPE_OPTIONS } from '../model/constants'
import { createDefaultForm, createMenuFormRules } from '../model/menu-form'
import { toTreeSelectData } from '../model/tree-mutations'

const props = defineProps<{
  visible: boolean
  parentId: number | null
  parentOptions: MenuTreeNode[]
  /** root = 新增根菜单；child = 新增子级（带入当前选中行） */
  type: 'root' | 'child'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [model: MenuFormModel]
}>()

defineOptions({ name: 'MenuEditDialog' })

const formRef = ref<InstanceType<typeof FsdForm> | null>(null)
const local = ref<MenuFormModel>(createDefaultForm(props.parentId))
const menuType = ref<MenuType>('menu')
/** 组件路径下拉与白名单共用 shared 注册表（docs/14 §4.4） */
const pageComponentOptions = pageComponentKeys
/** 上级菜单下拉数据（可选父级由编排层过滤，这里只做类型适配） */
const parentTreeData = computed(() => toTreeSelectData(props.parentOptions))

const rules = createMenuFormRules(() => local.value)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    local.value = createDefaultForm(props.type === 'child' ? props.parentId : null)
    menuType.value = 'menu'
    void formRef.value?.clearValidate()
  },
)

/** 菜单类型切换：目录不挂组件；外链必须 http(s)（docs/14 §4.3） */
function onTypeChange(value: string | number | Array<string | number> | null): void {
  const type = String(value ?? 'menu') as MenuType
  menuType.value = type
  local.value.external = type === 'external'
  if (type === 'dir') local.value.component = undefined
}

async function onConfirm(): Promise<void> {
  const valid = await formRef.value?.validate()
  if (!valid) return
  emit('submit', { ...local.value, orderNo: Number(local.value.orderNo) })
  emit('update:visible', false)
}

function onClose(): void {
  emit('update:visible', false)
}
</script>

<template>
  <FsdDialog
    :model-value="visible"
    :title="type === 'root' ? '新增根菜单' : '新增子菜单'"
    width="560px"
    @update:model-value="emit('update:visible', $event)"
    @confirm="onConfirm"
    @cancel="onClose"
  >
    <FsdForm ref="formRef" :model="local" :rules="rules" label-width="88px">
      <FsdFormItem v-if="type === 'child'" label="上级菜单" prop="parentId">
        <FsdTreeSelect
          v-model="local.parentId"
          :data="parentTreeData"
          check-strictly
          filterable
          clearable
          placeholder="顶级菜单"
        />
      </FsdFormItem>
      <FsdFormItem label="菜单类型" prop="type">
        <FsdSelect
          :model-value="menuType"
          :options="MENU_TYPE_OPTIONS"
          @update:model-value="onTypeChange"
        />
        <p v-if="menuType === 'dir'" class="menu-edit-dialog__hint">目录仅作分组，不挂载页面组件</p>
      </FsdFormItem>
      <FsdFormItem label="路由名" prop="name">
        <FsdInput v-model="local.name" placeholder="大写字母开头，如 SystemUser" />
      </FsdFormItem>
      <FsdFormItem label="标题" prop="title">
        <FsdInput v-model="local.title" :maxlength="20" placeholder="菜单显示标题" />
      </FsdFormItem>
      <FsdFormItem label="路由地址" prop="path">
        <FsdInput
          v-model="local.path"
          :placeholder="menuType === 'external' ? 'https://example.com' : '/system/user'"
        />
      </FsdFormItem>
      <FsdFormItem v-if="menuType === 'menu'" label="组件路径" prop="component">
        <FsdSelect
          v-model="local.component"
          :options="pageComponentOptions"
          filterable
          allow-create
          placeholder="选择 src/pages 下的页面"
        />
      </FsdFormItem>
    </FsdForm>
  </FsdDialog>
</template>

<style scoped lang="scss">
/* 独占一行（EP 的 .el-form-item__content 为 flex-wrap: wrap），与控件左对齐 */
.menu-edit-dialog__hint {
  flex: 1 0 100%;
  margin: 0;
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text-weak);
}
</style>
