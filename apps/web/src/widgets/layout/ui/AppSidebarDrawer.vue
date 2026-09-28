<script setup lang="ts">
import { FsdMenu } from '@repo/ui'
import type { MenuItem } from '@/entities/menu'
import { useMenuNavigation } from '../model/use-menu-navigation'
import MenuTree from './MenuTree.vue'

defineOptions({ name: 'AppSidebarDrawer' })

defineProps<{
  modelValue: boolean
  items: MenuItem[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { activeKey, onSelect } = useMenuNavigation()

/** 小屏点完即收起抽屉（docs/15 §2.5） */
function onSelectAndClose(key: string): void {
  onSelect(key)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="app-sidebar-drawer">
    <div
      class="app-sidebar-drawer__mask"
      role="button"
      tabindex="0"
      aria-label="关闭菜单"
      @click="emit('update:modelValue', false)"
      @keydown.enter="emit('update:modelValue', false)"
    />
    <aside class="app-sidebar-drawer__panel">
      <FsdMenu :default-active="activeKey" unique-opened @select="onSelectAndClose">
        <MenuTree :items="items" />
      </FsdMenu>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.app-sidebar-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--fsd-z-index-drawer);
}

.app-sidebar-drawer__mask {
  position: absolute;
  inset: 0;
  background: var(--fsd-color-text);
  opacity: 0.35;
}

.app-sidebar-drawer__panel {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 240px;
  overflow: auto;
  background: var(--fsd-color-bg);
}
</style>
