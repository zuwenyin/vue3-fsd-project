<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  FsdButton,
  FsdForm,
  FsdFormItem,
  FsdInput,
  FsdSelect,
  FsdSwitch,
  FsdTreeSelect,
} from '@repo/ui'
import type { MenuFormModel, MenuTreeNode } from '@/entities/menu'
import { LAYOUT_OPTIONS } from '../model/constants'
import { createDefaultForm, createMenuFormRules } from '../model/menu-form'
import { toTreeSelectData } from '../model/tree-mutations'
import MenuIconPicker from './MenuIconPicker.vue'

const props = defineProps<{
  model: MenuFormModel | null
  /** 当前编辑节点 id（删除按钮用；null = 未选中） */
  modelId: number | null
  componentOptions: string[]
  parentOptions: MenuTreeNode[]
  disabled: boolean
}>()

const emit = defineEmits<{
  save: [model: MenuFormModel]
  cancel: []
  remove: [id: number]
}>()

defineOptions({ name: 'MenuDetailForm' })

const formRef = ref<InstanceType<typeof FsdForm> | null>(null)
const local = ref<MenuFormModel | null>(null)
const { t } = useI18n()

/** rules 走 computed：切语言后重建规则，新触发的校验用新语言（message 是快照） */
const rules = computed(() => createMenuFormRules(() => local.value ?? createDefaultForm()))
/** 上级菜单下拉数据（排除自身子孙由编排层完成，这里只做类型适配） */
const parentTreeData = computed(() => toTreeSelectData(props.parentOptions))
/** 布局下拉：label 走 i18n，value 仍是 LayoutMode */
const layoutOptions = computed(() =>
  LAYOUT_OPTIONS.map((item) => ({ ...item, label: t(`layout.${item.value}`) })),
)

watch(
  () => props.model,
  (model) => {
    local.value = model ? (JSON.parse(JSON.stringify(model)) as MenuFormModel) : null
    void nextTick(() => formRef.value?.clearValidate())
  },
  { immediate: true },
)

async function onSave(): Promise<void> {
  if (!local.value || !formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  const normalized: MenuFormModel = { ...local.value, orderNo: Number(local.value.orderNo) }
  // 白名单软提示：手填不存在的组件路径不阻断保存（docs/14 §4.4）
  if (normalized.component && !props.componentOptions.includes(normalized.component)) {
    ElMessage.warning(t('menuPage.componentWarning'))
  }
  emit('save', normalized)
}
</script>

<template>
  <section class="menu-detail-form" :class="{ 'menu-detail-form--empty': !local }">
    <p v-if="!local" class="menu-detail-form__placeholder">{{ t('menuPage.selectTip') }}</p>

    <FsdForm
      v-else
      ref="formRef"
      class="menu-detail-form__form"
      :model="local"
      :rules="rules"
      label-width="88px"
      :disabled="disabled"
    >
      <h4 class="menu-detail-form__group-title">{{ t('menuPage.groupBasic') }}</h4>
      <FsdFormItem :label="t('menuPage.parent')" prop="parentId">
        <FsdTreeSelect
          v-model="local.parentId"
          :data="parentTreeData"
          check-strictly
          filterable
          clearable
          :placeholder="t('menuPage.parentTop')"
        />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.name')" prop="name">
        <FsdInput v-model="local.name" :placeholder="t('menuPage.phName')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.titleLabel')" prop="title">
        <FsdInput v-model="local.title" :maxlength="20" :placeholder="t('menuPage.phTitle')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.icon')" prop="icon">
        <MenuIconPicker v-model="local.icon" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.orderNo')" prop="orderNo">
        <FsdInput v-model="local.orderNo" type="number" :placeholder="t('menuPage.phOrder')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.status')" prop="status">
        <FsdSwitch
          :model-value="local.status === 1"
          :active-text="t('menuPage.enabled')"
          :inactive-text="t('menuPage.disabled')"
          @update:model-value="local.status = $event ? 1 : 0"
        />
      </FsdFormItem>

      <h4 class="menu-detail-form__group-title">{{ t('menuPage.groupRoute') }}</h4>
      <FsdFormItem :label="t('menuPage.path')" prop="path">
        <FsdInput
          v-model="local.path"
          :placeholder="local.external ? t('menuPage.phExternalPath') : t('menuPage.phPath')"
        />
      </FsdFormItem>
      <FsdFormItem v-if="!local.external" :label="t('menuPage.component')" prop="component">
        <FsdSelect
          v-model="local.component"
          :options="componentOptions"
          filterable
          allow-create
          :placeholder="t('menuPage.phComponent')"
        />
      </FsdFormItem>
      <FsdFormItem
        v-if="local.parentId === null && !local.external"
        :label="t('menuPage.redirect')"
        prop="redirect"
      >
        <FsdInput v-model="local.redirect" :placeholder="t('menuPage.phRedirect')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.external')" prop="external">
        <FsdSwitch v-model="local.external" />
      </FsdFormItem>

      <h4 class="menu-detail-form__group-title">{{ t('menuPage.groupDisplay') }}</h4>
      <div class="menu-detail-form__switches">
        <FsdFormItem :label="t('menuPage.hideInMenu')" prop="hideInMenu">
          <FsdSwitch v-model="local.hideInMenu" />
        </FsdFormItem>
        <FsdFormItem :label="t('menuPage.hideChildren')" prop="hideChildrenInMenu">
          <FsdSwitch v-model="local.hideChildrenInMenu" />
        </FsdFormItem>
        <FsdFormItem :label="t('menuPage.keepAlive')" prop="keepAlive">
          <FsdSwitch v-model="local.keepAlive" />
        </FsdFormItem>
        <FsdFormItem :label="t('menuPage.affix')" prop="affix">
          <FsdSwitch v-model="local.affix" />
        </FsdFormItem>
      </div>
      <FsdFormItem :label="t('menuPage.activePath')" prop="activePath">
        <FsdInput v-model="local.activePath" :placeholder="t('menuPage.phActivePath')" />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.layout')" prop="layout">
        <FsdSelect
          v-model="local.layout"
          :options="layoutOptions"
          clearable
          :placeholder="t('layout.label')"
        />
      </FsdFormItem>

      <h4 class="menu-detail-form__group-title">{{ t('menuPage.groupPermission') }}</h4>
      <FsdFormItem :label="t('menuPage.roles')" prop="roles">
        <FsdSelect
          v-model="local.roles"
          multiple
          filterable
          allow-create
          default-first-option
          :placeholder="t('menuPage.phRoles')"
        />
      </FsdFormItem>
      <FsdFormItem :label="t('menuPage.permissions')" prop="permissions">
        <FsdSelect
          v-model="local.permissions"
          multiple
          filterable
          allow-create
          default-first-option
          :placeholder="t('menuPage.phPermissions')"
        />
      </FsdFormItem>

      <footer class="menu-detail-form__actions">
        <FsdButton
          v-permission="'system:menu:edit'"
          type="danger"
          plain
          :disabled="props.modelId == null"
          @click="props.modelId != null && emit('remove', props.modelId)"
        >
          {{ t('menuPage.remove') }}
        </FsdButton>
        <span class="menu-detail-form__spacer" />
        <FsdButton @click="emit('cancel')">{{ t('menuPage.cancel') }}</FsdButton>
        <FsdButton v-permission="'system:menu:edit'" type="primary" @click="onSave">
          {{ t('menuPage.save') }}
        </FsdButton>
      </footer>
    </FsdForm>
  </section>
</template>

<style scoped lang="scss">
.menu-detail-form {
  height: 100%;
  overflow: auto;
}

.menu-detail-form--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-detail-form__placeholder {
  color: var(--fsd-color-text-weak);
}

.menu-detail-form__group-title {
  margin: var(--fsd-space-md) 0 var(--fsd-space-sm);
  font-size: var(--fsd-font-size-base);
  font-weight: 600;
  color: var(--fsd-color-text);
}

.menu-detail-form__switches {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.menu-detail-form__actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: var(--fsd-space-sm);
  padding: var(--fsd-space-sm) 0;
  background: var(--fsd-color-bg);
  border-top: 1px solid var(--fsd-color-border);
}

.menu-detail-form__spacer {
  flex: 1;
}
</style>
