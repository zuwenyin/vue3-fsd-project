<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import type { TabContextAction } from '../model/types'

defineOptions({ name: 'TabContextMenu' })

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  actions: TabContextAction[]
}>()

const emit = defineEmits<{
  select: [key: TabContextAction['key']]
  close: []
}>()

/** 点击别处 / 滚动 / Esc 关闭（自绘菜单，不引 el-dropdown，docs/15 §3.3） */
function onDocumentClick(): void {
  if (props.visible) emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.visible) emit('close')
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('contextmenu', onDocumentClick)
  document.addEventListener('scroll', onDocumentClick, true)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('contextmenu', onDocumentClick)
  document.removeEventListener('scroll', onDocumentClick, true)
  document.removeEventListener('keydown', onKeydown)
})

function onSelect(key: TabContextAction['key']): void {
  emit('select', key)
  emit('close')
}
</script>

<template>
  <ul
    v-if="visible"
    class="tab-context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="menu"
  >
    <li v-for="action in actions" :key="action.key">
      <button
        type="button"
        class="tab-context-menu__item"
        role="menuitem"
        :disabled="action.disabled"
        @click="onSelect(action.key)"
      >
        {{ action.label }}
      </button>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.tab-context-menu {
  position: fixed;
  z-index: var(--fsd-z-index-drawer);
  min-width: 128px;
  padding: var(--fsd-space-xs) 0;
  margin: 0;
  list-style: none;
  background: var(--fsd-color-bg);
  border: 1px solid var(--fsd-color-border);
  border-radius: var(--fsd-radius-sm);
  box-shadow: var(--fsd-shadow-md);
}

.tab-context-menu__item {
  display: block;
  width: 100%;
  padding: var(--fsd-space-xs) var(--fsd-space-md);
  font-size: var(--fsd-font-size-base);
  color: var(--fsd-color-text);
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
}

.tab-context-menu__item:disabled {
  color: var(--fsd-color-text-weak);
  cursor: not-allowed;
}

.tab-context-menu__item:hover:not(:disabled) {
  color: var(--fsd-color-primary);
  background: var(--fsd-color-bg-sub);
}
</style>
