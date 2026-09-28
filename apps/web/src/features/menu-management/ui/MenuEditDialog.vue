<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()
/** 组件路径下拉与白名单共用 shared 注册表（docs/14 §4.4） */
const pageComponentOptions = pageComponentKeys
/** 上级菜单下拉数据（可选父级由编排层过滤，这里只做类型适配） */
const parentTreeData = computed(() => toTreeSelectData(props.parentOptions))

/** 菜单类型下拉：label 走 i18n，value 仍是 MenuType */
const TYPE_LABEL_KEYS = {
  dir: 'menuPage.typeDir',
  menu: 'menuPage.typeMenu',
  external: 'menuPage.typeExternal',
} as const
const typeOptions = computed(() =>
  MENU_TYPE_OPTIONS.map((item) => ({ ...item, label: t(TYPE_LABEL_KEYS[item.value]) })),
)

/** rules 走 computed：切语言后重建，新触发的校验用新语言 */
const rules = computed(() => createMenuFormRules(() => local.value))

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
    :title="type === 'root' ? t('menuPage.addRootTitle') : t('menuPage.addChildTitle')"
    width="560px"
    @update:model-value="emit('update:visible', $event)"
    @confirm="onConfirm"
    @cancel="onClose"
  >
    <FsdForm ref="formRef" :model="local" :rules="rules" label-width="88px">
      <FsdFormItem v-if="type === 'child'" :label="t('menuPage.parent')" prop="parentId">
        <FsdTreeSelect
          v-model="local.parentId"
          :data="parentTreeData"
          check-strictly
          filterable
          clearable
          :placeholder="t('menuPage.parentTop')"
        />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.menuType')" prop="type">
        <FsdSelect
          :model-value="menuType"
          :options="typeOptions"
          @update:model-value="onTypeChange"
        />
        <p v-if="menuType === 'dir'" class="menu-edit-dialog__hint">{{ t('menuPage.dirHint') }}</p>
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.name')" prop="name">
        <FsdInput v-model="local.name" :placeholder="t('menuPage.phName')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.titleLabel')" prop="title">
        <FsdInput v-model="local.title" :maxlength="20" :placeholder="t('menuPage.phTitle')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.path')" prop="path">
        <FsdInput
          v-model="local.path"
          :placeholder="
            menuType === 'external' ? t('menuPage.phExternalPath') : t('menuPage.phPath')
          "
        />
      </FsdFormItem>
      <FsdFormItem v-if="menuType === 'menu'" :label="t('menuPage.component')" prop="component">
        <FsdSelect
          v-model="local.component"
          :options="pageComponentOptions"
          filterable
          allow-create
          :placeholder="t('menuPage.phComponentShort')"
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
