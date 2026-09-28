<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWindowSize } from '@vueuse/core'
import { FsdButton } from '@repo/ui'
import type { MenuFormModel } from '@/entities/menu'
import { useMenuManagement } from '../model/use-menu-management'
import MenuDetailForm from './MenuDetailForm.vue'
import MenuEditDialog from './MenuEditDialog.vue'
import MenuTreeTable from './MenuTreeTable.vue'

defineOptions({ name: 'MenuWorkbench' })

const mg = useMenuManagement()
const { t } = useI18n()
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 960)

const dialogVisible = ref(false)
const dialogParentId = ref<number | null>(null)
const dialogType = ref<'root' | 'child'>('root')

onMounted(() => {
  void mg.load()
})

function openCreate(parentId: number | null): void {
  dialogParentId.value = parentId
  dialogType.value = parentId == null ? 'root' : 'child'
  dialogVisible.value = true
}

async function onCreate(model: MenuFormModel): Promise<void> {
  await mg.create(model)
}

// ---------- 分隔条（≥960px 可拖拽，200–600px 约束，docs/14 §4.7） ----------

const asideWidth = ref(420)

function startResize(event: MouseEvent): void {
  const startX = event.clientX
  const startWidth = asideWidth.value
  const onMouseMove = (ev: MouseEvent): void => {
    asideWidth.value = Math.min(600, Math.max(200, startWidth + ev.clientX - startX))
  }
  const onMouseUp = (): void => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <section class="menu-workbench">
    <header class="menu-workbench__header">
      <h2 class="menu-workbench__title">{{ t('menuPage.title') }}</h2>
      <div class="menu-workbench__actions">
        <FsdButton :loading="mg.loading.value" @click="mg.reset()">
          {{ t('menuPage.reset') }}
        </FsdButton>
        <FsdButton
          v-permission="'system:menu:edit'"
          type="primary"
          :loading="mg.loading.value"
          @click="mg.applyChanges()"
        >
          {{ t('menuPage.apply') }}
        </FsdButton>
      </div>
    </header>

    <p v-if="mg.hasDirty.value" class="menu-workbench__dirty">{{ t('menuPage.dirty') }}</p>

    <div class="menu-workbench__main" :class="{ 'menu-workbench__main--narrow': isNarrow }">
      <aside
        class="menu-workbench__aside"
        :style="isNarrow ? undefined : { width: `${asideWidth}px` }"
      >
        <MenuTreeTable
          :tree="mg.tree.value"
          :loading="mg.loading.value"
          :selected-id="mg.selectedId.value"
          @select="mg.select"
          @add-child="openCreate"
          @remove="mg.remove"
          @move="mg.move"
          @move-row="
            (payload: { id: number; direction: 'up' | 'down' }) =>
              mg.moveRow(payload.id, payload.direction)
          "
        />
      </aside>

      <div
        v-if="!isNarrow"
        class="menu-workbench__splitter"
        role="separator"
        aria-orientation="vertical"
        @mousedown.prevent="startResize"
      />
      <FsdButton
        v-else
        v-permission="'system:menu:edit'"
        type="primary"
        :loading="mg.loading.value"
        @click="openCreate(mg.selectedId.value)"
      >
        {{ t('menuPage.addChild') }}
      </FsdButton>

      <div class="menu-workbench__detail">
        <MenuDetailForm
          :model="mg.form.value"
          :model-id="mg.selectedId.value"
          :component-options="mg.componentOptions"
          :parent-options="mg.parentOptions.value"
          :disabled="mg.loading.value"
          @save="mg.save"
          @cancel="mg.cancelEdit"
          @remove="mg.remove"
        />
      </div>
    </div>

    <MenuEditDialog
      v-model:visible="dialogVisible"
      :parent-id="dialogParentId"
      :parent-options="mg.parentOptions.value"
      :type="dialogType"
      @submit="onCreate"
    />
  </section>
</template>

<style scoped lang="scss">
.menu-workbench {
  display: flex;
  flex-direction: column;
  gap: var(--fsd-space-sm);
  height: 100%;
  padding: var(--fsd-space-lg);
  background: var(--fsd-color-bg);
}

.menu-workbench__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-workbench__title {
  margin: 0;
  font-size: var(--fsd-font-size-heading);
  font-weight: 600;
  color: var(--fsd-color-text);
}

.menu-workbench__actions {
  display: flex;
  gap: var(--fsd-space-sm);
}

.menu-workbench__dirty {
  margin: 0;
  padding: var(--fsd-space-sm) var(--fsd-space-md);
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-warning);
  background: var(--fsd-color-bg-sub);
  border-radius: var(--fsd-radius-sm);
}

.menu-workbench__main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.menu-workbench__main--narrow {
  flex-direction: column;
  gap: var(--fsd-space-md);
}

.menu-workbench__aside {
  min-width: 200px;

  // ★ 不能用 hidden：左栏拖窄后 el-table 总宽大于容器，内容会被裁掉（实测截图）
  overflow: auto;
}

.menu-workbench__splitter {
  width: 6px;
  cursor: col-resize;
  background: var(--fsd-color-bg-sub);
  border-radius: var(--fsd-radius-sm);
}

.menu-workbench__detail {
  flex: 1;
  min-width: 0;
  padding: 0 var(--fsd-space-md);
}
</style>
