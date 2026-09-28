<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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

const rules = createMenuFormRules(() => local.value ?? createDefaultForm())
/** 上级菜单下拉数据（排除自身子孙由编排层完成，这里只做类型适配） */
const parentTreeData = computed(() => toTreeSelectData(props.parentOptions))

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
    ElMessage.warning('未匹配到页面组件，访问时将降级为 404')
  }
  emit('save', normalized)
}
</script>

<template>
  <section class="menu-detail-form" :class="{ 'menu-detail-form--empty': !local }">
    <p v-if="!local" class="menu-detail-form__placeholder">在左侧选择一个菜单节点进行编辑</p>

    <FsdForm
      v-else
      ref="formRef"
      class="menu-detail-form__form"
      :model="local"
      :rules="rules"
      label-width="88px"
      :disabled="disabled"
    >
      <h4 class="menu-detail-form__group-title">基础信息</h4>
      <FsdFormItem label="上级菜单" prop="parentId">
        <FsdTreeSelect
          v-model="local.parentId"
          :data="parentTreeData"
          check-strictly
          filterable
          clearable
          placeholder="顶级菜单"
        />
      </FsdFormItem>
      <FsdFormItem label="路由名" prop="name">
        <FsdInput v-model="local.name" placeholder="大写字母开头，如 SystemUser" />
      </FsdFormItem>
      <FsdFormItem label="标题" prop="title">
        <FsdInput v-model="local.title" :maxlength="20" placeholder="菜单显示标题" />
      </FsdFormItem>
      <FsdFormItem label="图标" prop="icon">
        <MenuIconPicker v-model="local.icon" />
      </FsdFormItem>
      <FsdFormItem label="排序" prop="orderNo">
        <FsdInput v-model="local.orderNo" type="number" placeholder="0–99999" />
      </FsdFormItem>
      <FsdFormItem label="状态" prop="status">
        <FsdSwitch
          :model-value="local.status === 1"
          active-text="启用"
          inactive-text="停用"
          @update:model-value="local.status = $event ? 1 : 0"
        />
      </FsdFormItem>

      <h4 class="menu-detail-form__group-title">路由</h4>
      <FsdFormItem label="路由地址" prop="path">
        <FsdInput
          v-model="local.path"
          :placeholder="local.external ? 'https://example.com' : '/system/user'"
        />
      </FsdFormItem>
      <FsdFormItem v-if="!local.external" label="组件路径" prop="component">
        <FsdSelect
          v-model="local.component"
          :options="componentOptions"
          filterable
          allow-create
          placeholder="选择或手填 src/pages 下的路径"
        />
      </FsdFormItem>
      <FsdFormItem v-if="local.parentId === null && !local.external" label="重定向" prop="redirect">
        <FsdInput v-model="local.redirect" placeholder="如 /system/user（仅顶级目录）" />
      </FsdFormItem>
      <FsdFormItem label="外链" prop="external">
        <FsdSwitch v-model="local.external" />
      </FsdFormItem>

      <h4 class="menu-detail-form__group-title">显示</h4>
      <div class="menu-detail-form__switches">
        <FsdFormItem label="隐藏菜单" prop="hideInMenu">
          <FsdSwitch v-model="local.hideInMenu" />
        </FsdFormItem>
        <FsdFormItem label="隐藏子级" prop="hideChildrenInMenu">
          <FsdSwitch v-model="local.hideChildrenInMenu" />
        </FsdFormItem>
        <FsdFormItem label="页面缓存" prop="keepAlive">
          <FsdSwitch v-model="local.keepAlive" />
        </FsdFormItem>
        <FsdFormItem label="固定页签" prop="affix">
          <FsdSwitch v-model="local.affix" />
        </FsdFormItem>
      </div>
      <FsdFormItem label="高亮路径" prop="activePath">
        <FsdInput v-model="local.activePath" placeholder="详情页高亮所属菜单（可选）" />
      </FsdFormItem>
      <FsdFormItem label="布局" prop="layout">
        <FsdSelect
          v-model="local.layout"
          :options="LAYOUT_OPTIONS"
          clearable
          placeholder="跟随全局布局"
        />
      </FsdFormItem>

      <h4 class="menu-detail-form__group-title">权限</h4>
      <FsdFormItem label="角色" prop="roles">
        <FsdSelect
          v-model="local.roles"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="留空 = 不限制；如 admin"
        />
      </FsdFormItem>
      <FsdFormItem label="权限点" prop="permissions">
        <FsdSelect
          v-model="local.permissions"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="留空 = 不限制；如 system:user:view"
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
          删除
        </FsdButton>
        <span class="menu-detail-form__spacer" />
        <FsdButton @click="emit('cancel')">取消</FsdButton>
        <FsdButton v-permission="'system:menu:edit'" type="primary" @click="onSave">保存</FsdButton>
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
